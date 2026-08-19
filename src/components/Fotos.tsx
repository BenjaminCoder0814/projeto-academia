import { AnimatePresence, motion } from 'framer-motion'
import { Camera, ImageUp, RefreshCw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useEstado } from '../data/estado'
import { COMEMORACOES, TEMPO_NA_TELA, sortear } from '../conteudo/mensagens'
import { OBRIGADO_PELAS_FOTOS, SO_UMA_FOTINHA } from '../conteudo/cartas'
import { chuvaDeCoracoes } from '../lib/confete'
import { RecadoFlutuante } from './GaleriaDeFotos'
import { diaMes } from '../lib/datas'
import { vibrar } from '../lib/feedback'
import { comprimirFoto } from '../lib/imagem'
import { lerRelogio } from '../lib/leituraDoRelogio'
import type { Foto, TipoFoto } from '../lib/tipos'
import { CameraGuiada } from './CameraGuiada'
import { Esqueleto } from './ui'

/** Resolve a URL assinada de uma foto guardada no bucket privado. */
export function useUrlFoto(caminho?: string | null) {
  const { urlDaFoto } = useEstado()
  const [url, setUrl] = useState<string | null>(null)
  const [erro, setErro] = useState(false)

  useEffect(() => {
    let vivo = true
    setUrl(null)
    setErro(false)
    if (!caminho) return
    urlDaFoto(caminho)
      .then((u) => vivo && setUrl(u))
      .catch(() => vivo && setErro(true))
    return () => {
      vivo = false
    }
  }, [caminho, urlDaFoto])

  return { url, erro }
}

export function MiniaturaFoto({
  foto,
  className = '',
  aoClicar,
}: {
  foto?: Foto
  className?: string
  aoClicar?: () => void
}) {
  const { url } = useUrlFoto(foto?.storage_path)
  if (!foto) return <div className={`rounded-2xl bg-rosa-100 ${className}`} />
  if (!url) return <Esqueleto className={className} />
  return (
    <motion.img
      src={url}
      alt=""
      onClick={aoClicar}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`object-cover ${className}`}
    />
  )
}

/** Fotinha na moldura Polaroid, com a data escrita à mão embaixo. */
export function Polaroid({
  foto,
  className = '',
  inclinacao = -2,
}: {
  foto?: Foto
  className?: string
  inclinacao?: number
}) {
  const { url } = useUrlFoto(foto?.storage_path)
  return (
    <motion.figure
      initial={{ opacity: 0, y: -14, rotate: inclinacao - 6 }}
      animate={{ opacity: 1, y: 0, rotate: inclinacao }}
      transition={{ type: 'spring', stiffness: 220, damping: 14 }}
      className={`polaroid ${className}`}
    >
      {url ? (
        <img src={url} alt="" className="aspect-[3/4] w-full rounded-md object-cover" />
      ) : (
        <Esqueleto className="aspect-[3/4] w-full rounded-md" />
      )}
      <figcaption className="font-bilhete mt-1 text-center text-lg leading-none text-carvao/70">
        {foto ? diaMes(foto.data) : ''}
      </figcaption>
    </motion.figure>
  )
}

type EstadoEnvio = 'parado' | 'preparando' | 'enviando' | 'erro'

export function CartaoFoto({
  titulo,
  descricao,
  tipo,
  data,
  foto,
  fotoAnterior,
  somenteLeitura,
  aoLerRelogio,
}: {
  titulo: string
  descricao: string
  tipo: TipoFoto
  data: string
  foto?: Foto
  fotoAnterior?: Foto
  somenteLeitura?: boolean
  /** o que o OCR achou na tela do relógio (já somado das fotos mandadas agora) */
  aoLerRelogio?: (leitura: { calorias: number | null; fcMedia: number | null }) => void
}) {
  const { enviarFoto } = useEstado()
  const [estado, setEstado] = useState<EstadoEnvio>('parado')
  const [camera, setCamera] = useState(false)
  const [selo, setSelo] = useState(false)
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [recado, setRecado] = useState<{ emoji: string; texto: string } | null>(null)
  const [progresso, setProgresso] = useState<{ feitas: number; total: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const ultimoArquivo = useRef<Blob | null>(null)
  const [lendo, setLendo] = useState(false)
  const [lido, setLido] = useState<{ calorias: number | null; fcMedia: number | null } | null>(null)
  // só a foto oficial do dia é uma só; relógio e resto aceitam várias
  const aceitaVarias = tipo !== 'relogio' || true
  const { url } = useUrlFoto(foto?.storage_path)
  const { url: urlFantasma } = useUrlFoto(
    tipo === 'evolucao' ? fotoAnterior?.storage_path : undefined,
  )

  async function processar(arquivo: Blob) {
    ultimoArquivo.current = arquivo
    try {
      setEstado('preparando')
      const comprimida = await comprimirFoto(arquivo)
      setEstado('enviando')
      await enviarFoto(data, tipo, comprimida)
      setEstado('parado')
      setMensagem(null)
      vibrar(60)
      if (tipo === 'relogio') {
        setSelo(true)
        setTimeout(() => setSelo(false), 4200)
      }
    } catch (e) {
      console.error(e)
      setMensagem(e instanceof Error ? e.message : 'Não deu pra enviar')
      setEstado('erro')
    }
  }

  const ocupado =
    estado === 'preparando' || estado === 'enviando' || Boolean(progresso) || lendo

  /**
   * Ela escolhe da galeria dela. Na foto do dia pode mandar quantas quiser:
   * a primeira vira a oficial (a do antes e depois) e as outras entram na
   * galeria do dia. Uma so ganha birra carinhosa; duas ou mais, agradecimento.
   */
  async function processarVarias(arquivos: File[]) {
    setMensagem(null)

    // relógio: cada foto entra e o OCR soma as calorias das que ela mandar
    if (tipo === 'relogio') {
      setProgresso({ feitas: 0, total: arquivos.length })
      let somaCalorias = 0
      const batimentos: number[] = []
      try {
        for (let i = 0; i < arquivos.length; i++) {
          setEstado('enviando')
          const comprimida = await comprimirFoto(arquivos[i])
          await enviarFoto(data, 'relogio', comprimida)
          setProgresso({ feitas: i + 1, total: arquivos.length })

          setLendo(true)
          const leitura = await lerRelogio(comprimida)
          setLendo(false)
          if (leitura.calorias) somaCalorias += leitura.calorias
          if (leitura.fcMedia) batimentos.push(leitura.fcMedia)
        }
        setEstado('parado')
        vibrar(60)
        setSelo(true)
        setTimeout(() => setSelo(false), 4200)

        const media = batimentos.length
          ? Math.round(batimentos.reduce((a, b) => a + b, 0) / batimentos.length)
          : null
        const resultado = { calorias: somaCalorias || null, fcMedia: media }
        setLido(resultado)
        aoLerRelogio?.(resultado)
      } catch (e) {
        console.error(e)
        setMensagem(e instanceof Error ? e.message : 'Não deu pra enviar')
        setEstado('erro')
      } finally {
        setLendo(false)
        setProgresso(null)
      }
      return
    }

    setProgresso({ feitas: 0, total: arquivos.length })
    try {
      for (let i = 0; i < arquivos.length; i++) {
        setEstado(i === 0 ? 'preparando' : 'enviando')
        const comprimida = await comprimirFoto(arquivos[i])
        await enviarFoto(data, i === 0 ? 'evolucao' : 'galeria', comprimida)
        setProgresso({ feitas: i + 1, total: arquivos.length })
      }
      vibrar([60, 40, 60])
      setEstado('parado')

      if (arquivos.length === 1) {
        setRecado({ emoji: '🥺', texto: sortear(SO_UMA_FOTINHA, Date.now()) })
      } else {
        chuvaDeCoracoes(40)
        setRecado({ emoji: '🥰', texto: sortear(OBRIGADO_PELAS_FOTOS, Date.now()) })
      }
      setTimeout(() => setRecado(null), TEMPO_NA_TELA)
    } catch (e) {
      console.error(e)
      setMensagem(e instanceof Error ? e.message : 'Nao deu pra enviar')
      setEstado('erro')
    } finally {
      setProgresso(null)
    }
  }

  return (
    <div className="cartao-solido relative overflow-hidden p-4">
      <div className="flex items-start gap-3.5">
        <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-2xl bg-rosa-100">
          {url ? (
            <motion.img
              key={url}
              src={url}
              alt={titulo}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-rosa-300">
              <Camera size={26} />
            </div>
          )}
          {ocupado && (
            <div className="absolute inset-0 grid place-items-center bg-white/70 backdrop-blur-sm">
              <RefreshCw size={20} className="animate-spin text-rosa-500" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-display text-[15px] font-bold">{titulo}</h3>
          <p className="mt-0.5 text-xs leading-snug text-cinza">{descricao}</p>
          {!somenteLeitura && (
            <p className="mt-1 text-[11px] font-semibold text-magenta-texto">
              {tipo === 'relogio'
                ? 'pode mandar mais de uma — eu somo as calorias 💗'
                : 'pode escolher várias de uma vez 💗'}
            </p>
          )}

          {lido && (lido.calorias || lido.fcMedia) && (
            <p className="mt-2 rounded-2xl bg-rosa-50 p-2 text-[11px] leading-snug text-carvao/80">
              li do relógio:{' '}
              {lido.calorias ? <strong className="num">{lido.calorias} kcal</strong> : null}
              {lido.calorias && lido.fcMedia ? ' · ' : ''}
              {lido.fcMedia ? <strong className="num">{lido.fcMedia} bpm</strong> : null} — se
              estiver errado, é só corrigir logo abaixo 💗
            </p>
          )}

          {lido && !lido.calorias && !lido.fcMedia && (
            <p className="mt-2 rounded-2xl bg-rosa-50 p-2 text-[11px] leading-snug text-carvao/70">
              não consegui ler os números dessa foto 🥺 pode escrever eles aqui embaixo
            </p>
          )}

          {estado === 'erro' && (
            <p className="mt-2 text-xs font-semibold text-magenta-texto">
              {mensagem ?? 'Não deu pra enviar.'}
            </p>
          )}

          {!somenteLeitura && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {estado === 'erro' ? (
                <button
                  type="button"
                  onClick={() => ultimoArquivo.current && processar(ultimoArquivo.current)}
                  className="botao-suave px-4 py-2.5 text-sm"
                >
                  Tentar de novo
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={ocupado}
                    onClick={() => inputRef.current?.click()}
                    className="botao-principal flex items-center gap-2 px-4 py-2.5 text-sm disabled:opacity-50"
                  >
                    <ImageUp size={16} />
                    {lendo
                      ? 'lendo o relógio… 🔎'
                      : progresso
                      ? `enviando ${progresso.feitas + 1} de ${progresso.total}…`
                      : estado === 'preparando'
                        ? 'Preparando…'
                        : estado === 'enviando'
                          ? 'Enviando…'
                          : foto
                            ? 'Escolher outra'
                            : 'Escolher da galeria'}
                  </button>
                  {aceitaVarias && (
                    <button
                      type="button"
                      disabled={ocupado}
                      onClick={() => setCamera(true)}
                      aria-label="Tirar na hora com a câmera"
                      className="grid h-11 w-11 place-items-center rounded-pill bg-rosa-100 text-rosa-500"
                    >
                      <Camera size={18} />
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* sem `capture`: abre a galeria dela, e não a câmera */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={aceitaVarias}
        className="hidden"
        onChange={(e) => {
          const arquivos = Array.from(e.target.files ?? [])
          e.target.value = ''
          if (arquivos.length) void processarVarias(arquivos)
        }}
      />

      <RecadoFlutuante
        aberto={Boolean(recado)}
        emoji={recado?.emoji ?? '💗'}
        texto={recado?.texto ?? null}
        aoFechar={() => setRecado(null)}
      />

      <AnimatePresence>
        {selo && (
          <motion.div
            initial={{ scale: 0.4, opacity: 0, rotate: -18 }}
            animate={{ scale: 1, opacity: 1, rotate: -8 }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 14 }}
            className="pointer-events-none absolute inset-0 grid place-items-center"
          >
            <span className="rounded-pill border-4 border-verde bg-white/95 px-5 py-2 font-display text-base font-extrabold text-verde">
              {COMEMORACOES.treinoComprovado}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {camera && (
          <CameraGuiada
            urlFantasma={urlFantasma}
            aoFechar={() => setCamera(false)}
            aoCapturar={(blob) => {
              setCamera(false)
              void processar(blob)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
