import { AnimatePresence, motion } from 'framer-motion'
import { ImagePlus, Trash2, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { OBRIGADO_PELAS_FOTOS } from '../conteudo/cartas'
import { useEstado } from '../data/estado'
import { TEMPO_NA_TELA, sortear } from '../conteudo/mensagens'
import { chuvaDeCoracoes } from '../lib/confete'
import { vibrar } from '../lib/feedback'
import { comprimirFoto } from '../lib/imagem'
import type { Foto } from '../lib/tipos'
import { useUrlFoto } from './Fotos'
import { Botao, Esqueleto } from './ui'

/* ------------------------------------------------------------------ */
/* Botão de mandar fotinhas (quantas ela quiser, de uma vez)           */
/* ------------------------------------------------------------------ */

export function AdicionarFotos({
  data,
  quantasJaTem,
  rotulo = 'Adicionar fotinhas 📸',
}: {
  data: string
  quantasJaTem: number
  rotulo?: string
}) {
  const { enviarFoto } = useEstado()
  const inputRef = useRef<HTMLInputElement>(null)
  const [enviando, setEnviando] = useState<{ feitas: number; total: number } | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [obrigado, setObrigado] = useState<string | null>(null)

  async function mandar(arquivos: File[]) {
    setErro(null)
    setEnviando({ feitas: 0, total: arquivos.length })
    let enviadas = 0
    try {
      for (const arquivo of arquivos) {
        const comprimida = await comprimirFoto(arquivo)
        await enviarFoto(data, 'galeria', comprimida)
        enviadas++
        setEnviando({ feitas: enviadas, total: arquivos.length })
      }
      vibrar([60, 40, 60])

      // mais de uma fotinha no dia merece agradecimento
      if (quantasJaTem + enviadas >= 2) {
        setObrigado(sortear(OBRIGADO_PELAS_FOTOS, Date.now()))
        chuvaDeCoracoes(35)
        setTimeout(() => setObrigado(null), TEMPO_NA_TELA)
      }
    } catch (e) {
      console.error(e)
      setErro(
        e instanceof Error
          ? `${e.message} — toca de novo pra tentar 💗`
          : 'não consegui enviar agora 💗',
      )
    } finally {
      setEnviando(null)
    }
  }

  return (
    <>
      <Botao
        className="flex w-full items-center justify-center gap-2"
        desabilitado={Boolean(enviando)}
        onClick={() => inputRef.current?.click()}
      >
        <ImagePlus size={18} />
        {enviando ? `enviando ${enviando.feitas + 1} de ${enviando.total}…` : rotulo}
      </Botao>

      <p className="mt-1.5 text-center text-[11px] text-cinza">
        pode escolher várias de uma vez, da sua galeria 💗
      </p>

      {erro && <p className="mt-2 text-center text-sm font-semibold text-magenta-texto">{erro}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const arquivos = Array.from(e.target.files ?? [])
          e.target.value = ''
          if (arquivos.length) void mandar(arquivos)
        }}
      />

      <RecadoFlutuante
        aberto={Boolean(obrigado)}
        emoji="🥰"
        texto={obrigado}
        aoFechar={() => setObrigado(null)}
      />
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Recadinho que aparece por cima da tela                              */
/* ------------------------------------------------------------------ */

export function RecadoFlutuante({
  aberto,
  emoji,
  texto,
  aoFechar,
}: {
  aberto: boolean
  emoji: string
  texto: string | null
  aoFechar: () => void
}) {
  return (
    <AnimatePresence>
      {aberto && texto && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={aoFechar}
          className="fixed inset-0 z-[90] grid place-items-center bg-rosa-500/25 px-8 backdrop-blur-[3px]"
        >
          <motion.div
            initial={{ scale: 0.6, y: 20, rotate: -4 }}
            animate={{ scale: 1, y: 0, rotate: -1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 15 }}
            className="w-full max-w-xs rounded-[28px] bg-white/95 p-6 text-center shadow-rosaForte"
          >
            <motion.p
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 1.4, repeat: Infinity }}
              className="text-6xl"
            >
              {emoji}
            </motion.p>
            <p className="font-manuscrita mt-2 text-2xl leading-tight text-rosa-500">{texto}</p>
            <p className="mt-3 text-[11px] text-cinza">toca pra fechar</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ------------------------------------------------------------------ */
/* Grade de fotinhas                                                   */
/* ------------------------------------------------------------------ */

const ROTULOS: Record<string, string> = {
  evolucao: '📸 do dia',
  relogio: '⌚ relógio',
  galeria: '💗',
}

export function GradeDeFotos({
  fotos,
  podeApagar,
  colunas = 3,
}: {
  fotos: Foto[]
  podeApagar?: boolean
  colunas?: 2 | 3
}) {
  const [aberta, setAberta] = useState<Foto | null>(null)

  if (!fotos.length) return null

  return (
    <>
      <div className={`grid gap-2 ${colunas === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {fotos.map((f, i) => (
          <Quadrinho key={f.id} foto={f} indice={i} aoAbrir={() => setAberta(f)} />
        ))}
      </div>

      <AnimatePresence>
        {aberta && (
          <Visualizador
            foto={aberta}
            podeApagar={podeApagar}
            aoFechar={() => setAberta(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}

function Quadrinho({ foto, indice, aoAbrir }: { foto: Foto; indice: number; aoAbrir: () => void }) {
  const { url } = useUrlFoto(foto.storage_path)
  return (
    <motion.button
      type="button"
      onClick={aoAbrir}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: Math.min(indice * 0.04, 0.4), type: 'spring', stiffness: 300, damping: 24 }}
      whileTap={{ scale: 0.94 }}
      className="relative aspect-square overflow-hidden rounded-2xl border-2 border-white bg-rosa-100 shadow-rosa"
    >
      {url ? (
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        <Esqueleto className="h-full w-full" />
      )}
      <span className="absolute bottom-1 right-1 rounded-pill bg-black/45 px-1.5 py-0.5 text-[9px] font-bold text-white">
        {ROTULOS[foto.tipo] ?? '💗'}
      </span>
    </motion.button>
  )
}

function Visualizador({
  foto,
  podeApagar,
  aoFechar,
}: {
  foto: Foto
  podeApagar?: boolean
  aoFechar: () => void
}) {
  const { url } = useUrlFoto(foto.storage_path)
  const { apagarFoto } = useEstado()
  const [confirmando, setConfirmando] = useState(false)
  const [apagando, setApagando] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[95] flex flex-col bg-carvao/90 backdrop-blur-sm"
    >
      <div className="area-segura-alto flex items-center justify-between p-3">
        <button
          type="button"
          onClick={aoFechar}
          aria-label="Fechar foto"
          className="grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white"
        >
          <X size={20} />
        </button>
        {podeApagar && foto.tipo === 'galeria' && (
          <button
            type="button"
            onClick={() => setConfirmando(true)}
            aria-label="Apagar foto"
            className="grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>

      <div className="flex flex-1 items-center justify-center p-4" onClick={aoFechar}>
        {url ? (
          <motion.img
            src={url}
            alt=""
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-h-full max-w-full rounded-2xl object-contain"
          />
        ) : (
          <Esqueleto className="h-64 w-48" />
        )}
      </div>

      <AnimatePresence>
        {confirmando && (
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            className="area-segura-baixo m-4 rounded-card bg-white p-4 text-center"
          >
            <p className="font-bilhete text-xl text-carvao">apagar essa fotinha, amor?</p>
            <div className="mt-3 flex gap-2">
              <Botao tipo="suave" className="flex-1" onClick={() => setConfirmando(false)}>
                deixa ela
              </Botao>
              <Botao
                className="flex-1"
                desabilitado={apagando}
                onClick={async () => {
                  setApagando(true)
                  try {
                    await apagarFoto(foto)
                    vibrar(40)
                    aoFechar()
                  } finally {
                    setApagando(false)
                  }
                }}
              >
                {apagando ? 'apagando…' : 'apagar'}
              </Botao>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
