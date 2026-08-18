import { useCallback, useEffect, useRef, useState } from 'react'
import { CORRIDA_CICLOS } from './calculos'
import { bipeAviso, bipeFim, bipeTroca, destravarAudio } from './feedback'

export const SEGMENTO_MS = 60_000 // 1 minuto
export const TOTAL_SEGMENTOS = CORRIDA_CICLOS * 2 // 20 ciclos x (caminhar + correr)
export const TOTAL_MS = TOTAL_SEGMENTOS * SEGMENTO_MS // 40 minutos

export type FaseTreino = 'parado' | 'caminhar' | 'correr' | 'concluido'

type Persistido = { inicio: number; pausadoEm: number | null; acumuladoPausa: number }

const CHAVE = 'projetinho:timer'

function ler(): Persistido | null {
  try {
    const bruto = localStorage.getItem(CHAVE)
    return bruto ? (JSON.parse(bruto) as Persistido) : null
  } catch {
    return null
  }
}

function gravar(p: Persistido | null) {
  if (p) localStorage.setItem(CHAVE, JSON.stringify(p))
  else localStorage.removeItem(CHAVE)
}

/**
 * Timer de intervalo baseado em timestamp real (Date.now), nunca em contagem de
 * ticks — assim ele continua certo com a tela apagada ou o app em segundo plano.
 */
export function useTimerIntervalado(aoConcluir?: () => void) {
  const [estado, setEstado] = useState<Persistido | null>(() => ler())
  const [decorrido, setDecorrido] = useState(0)
  const ultimoSegmento = useRef(-1)
  const avisoDado = useRef(-1)
  const wakeLock = useRef<any>(null)
  const concluiuRef = useRef(false)

  const calcular = useCallback((p: Persistido | null) => {
    if (!p) return 0
    const agora = p.pausadoEm ?? Date.now()
    return Math.max(0, agora - p.inicio - p.acumuladoPausa)
  }, [])

  // relogio
  useEffect(() => {
    if (!estado) {
      setDecorrido(0)
      return
    }
    const tick = () => setDecorrido(calcular(estado))
    tick()
    const id = setInterval(tick, 200)
    return () => clearInterval(id)
  }, [estado, calcular])

  const pausado = Boolean(estado?.pausadoEm)
  const rodando = Boolean(estado) && !pausado
  const concluido = decorrido >= TOTAL_MS
  const restanteTotal = Math.max(0, TOTAL_MS - decorrido)
  const indiceSegmento = Math.min(TOTAL_SEGMENTOS - 1, Math.floor(decorrido / SEGMENTO_MS))
  const restanteSegmento = SEGMENTO_MS - (decorrido % SEGMENTO_MS)
  const correndo = indiceSegmento % 2 === 1
  const ciclo = Math.floor(indiceSegmento / 2) + 1

  const fase: FaseTreino = !estado ? 'parado' : concluido ? 'concluido' : correndo ? 'correr' : 'caminhar'

  /* --- Wake Lock: mantem a tela viva enquanto o treino roda --- */
  const pedirWakeLock = useCallback(async () => {
    try {
      const anyNav = navigator as any
      if (anyNav.wakeLock?.request) {
        wakeLock.current = await anyNav.wakeLock.request('screen')
      }
    } catch {
      /* sem wake lock: o timer continua correto pelo timestamp */
    }
  }, [])

  const soltarWakeLock = useCallback(() => {
    try {
      wakeLock.current?.release?.()
    } catch {
      /* ignora */
    }
    wakeLock.current = null
  }, [])

  useEffect(() => {
    const aoVoltar = () => {
      if (document.visibilityState === 'visible' && rodando) void pedirWakeLock()
    }
    document.addEventListener('visibilitychange', aoVoltar)
    return () => document.removeEventListener('visibilitychange', aoVoltar)
  }, [rodando, pedirWakeLock])

  /* --- avisos sonoros --- */
  useEffect(() => {
    if (!rodando || concluido) return
    if (ultimoSegmento.current === -1) {
      ultimoSegmento.current = indiceSegmento
      return
    }
    if (indiceSegmento !== ultimoSegmento.current) {
      ultimoSegmento.current = indiceSegmento
      bipeTroca(correndo)
    }
  }, [indiceSegmento, correndo, rodando, concluido])

  useEffect(() => {
    if (!rodando || concluido) return
    if (restanteSegmento <= 3000 && avisoDado.current !== indiceSegmento) {
      avisoDado.current = indiceSegmento
      bipeAviso()
    }
  }, [restanteSegmento, indiceSegmento, rodando, concluido])

  useEffect(() => {
    if (concluido && estado && !concluiuRef.current) {
      concluiuRef.current = true
      bipeFim()
      soltarWakeLock()
      aoConcluir?.()
    }
  }, [concluido, estado, aoConcluir, soltarWakeLock])

  const iniciar = useCallback(() => {
    destravarAudio()
    concluiuRef.current = false
    ultimoSegmento.current = 0
    avisoDado.current = -1
    const novo: Persistido = { inicio: Date.now(), pausadoEm: null, acumuladoPausa: 0 }
    gravar(novo)
    setEstado(novo)
    void pedirWakeLock()
  }, [pedirWakeLock])

  const pausar = useCallback(() => {
    setEstado((p) => {
      if (!p || p.pausadoEm) return p
      const novo = { ...p, pausadoEm: Date.now() }
      gravar(novo)
      return novo
    })
    soltarWakeLock()
  }, [soltarWakeLock])

  const retomar = useCallback(() => {
    destravarAudio()
    setEstado((p) => {
      if (!p || !p.pausadoEm) return p
      const novo = {
        ...p,
        acumuladoPausa: p.acumuladoPausa + (Date.now() - p.pausadoEm),
        pausadoEm: null,
      }
      gravar(novo)
      return novo
    })
    void pedirWakeLock()
  }, [pedirWakeLock])

  const encerrar = useCallback(() => {
    gravar(null)
    setEstado(null)
    setDecorrido(0)
    ultimoSegmento.current = -1
    avisoDado.current = -1
    concluiuRef.current = false
    soltarWakeLock()
  }, [soltarWakeLock])

  useEffect(() => () => soltarWakeLock(), [soltarWakeLock])

  return {
    fase,
    rodando,
    pausado,
    concluido,
    ciclo,
    totalCiclos: CORRIDA_CICLOS,
    decorrido,
    restanteTotal,
    restanteSegmento,
    progressoSegmento: 1 - restanteSegmento / SEGMENTO_MS,
    progressoTotal: Math.min(1, decorrido / TOTAL_MS),
    iniciar,
    pausar,
    retomar,
    encerrar,
  }
}

export function mmss(ms: number): string {
  const total = Math.ceil(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
