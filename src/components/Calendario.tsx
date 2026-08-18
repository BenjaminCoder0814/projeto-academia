import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Images } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useEstado } from '../data/estado'
import { gradeDoMes, isoParaData, nomeDoMes, numeroDoDia } from '../lib/datas'
import { estadoDoDia, fotoDe, type EstadoDoDia } from '../lib/derivados'
import { dentroDoDesafio } from '../lib/fase'
import { planoDoDia } from '../lib/calculos'
import { vibrar } from '../lib/feedback'
import { MiniaturaFoto, Polaroid } from './Fotos'

const LETRAS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

type Aparencia = {
  fundo: string
  texto: string
  borda?: string
  emoji: string
  brilho?: boolean
}

const APARENCIA: Record<EstadoDoDia, Aparencia> = {
  arrasou: { fundo: '#FF4D8D', texto: '#FFFFFF', emoji: '💗', brilho: true },
  quaseLa: { fundo: '#FFC9DE', texto: '#2B1E28', emoji: '🌸' },
  vemAi: { fundo: '#FFFFFF', texto: '#2B1E28', borda: '2px dashed #FFA0C4', emoji: '✨' },
  deixouPassar: { fundo: '#F1EAEE', texto: '#76626F', emoji: '🤍' },
  bonusFeito: { fundo: '#FFC978', texto: '#2B1E28', emoji: '⭐', brilho: true },
  bonus: { fundo: '#FFFFFF', texto: '#2B1E28', borda: '2px dotted #C7A9FF', emoji: '⭐' },
  folguinha: { fundo: '#FF7A85', texto: '#FFFFFF', emoji: '💤' },
  folguinhaCheia: { fundo: '#FF7A85', texto: '#FFFFFF', emoji: '💤', brilho: true },
  foraDoDesafio: { fundo: 'transparent', texto: '#76626F', emoji: '' },
}

export const LEGENDA: { estado: EstadoDoDia; texto: string }[] = [
  { estado: 'arrasou', texto: '💗 Arrasou!' },
  { estado: 'quaseLa', texto: '🌸 Quase lá' },
  { estado: 'vemAi', texto: '✨ Vem aí' },
  { estado: 'bonus', texto: '⭐ Bônus — sem pressão' },
  { estado: 'bonusFeito', texto: '⭐ Foi além!' },
  { estado: 'folguinha', texto: '❤️ Folguinha 💤' },
  { estado: 'folguinhaCheia', texto: '❤️ Folguinha caprichada 💗' },
  { estado: 'deixouPassar', texto: '🤍 Deixou passar' },
]

export function Calendario({ aoAbrirDia }: { aoAbrirDia: (data: string) => void }) {
  const { snap, hoje } = useEstado()
  const inicial = isoParaData(hoje)
  const [mes, setMes] = useState({ ano: inicial.getFullYear(), mes: inicial.getMonth() })
  const [modoFotos, setModoFotos] = useState(false)
  const [espiada, setEspiada] = useState<string | null>(null)
  const timerLongo = useRef<number | null>(null)
  const [direcao, setDirecao] = useState(1)

  const celulas = useMemo(() => gradeDoMes(mes.ano, mes.mes), [mes])

  function trocarMes(passo: number) {
    vibrar(12)
    setDirecao(passo)
    setMes(({ ano, mes: m }) => {
      const d = new Date(ano, m + passo, 1)
      return { ano: d.getFullYear(), mes: d.getMonth() }
    })
  }

  function comecarEspiada(data: string) {
    timerLongo.current = window.setTimeout(() => {
      vibrar(25)
      setEspiada(data)
    }, 420)
  }

  function pararEspiada() {
    if (timerLongo.current) window.clearTimeout(timerLongo.current)
    timerLongo.current = null
  }

  return (
    <div className="cartao p-4">
      {/* troca de mês */}
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => trocarMes(-1)}
          aria-label="Mês anterior"
          className="grid h-11 w-11 place-items-center rounded-full bg-rosa-100 text-rosa-500"
        >
          <ChevronLeft size={20} />
        </button>

        <AnimatePresence mode="wait">
          <motion.h2
            key={`${mes.ano}-${mes.mes}`}
            initial={{ opacity: 0, x: direcao * 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -direcao * 24 }}
            transition={{ duration: 0.22 }}
            className="font-display text-lg font-extrabold first-letter:uppercase"
          >
            {nomeDoMes(mes.ano, mes.mes)}
          </motion.h2>
        </AnimatePresence>

        <button
          type="button"
          onClick={() => trocarMes(1)}
          aria-label="Próximo mês"
          className="grid h-11 w-11 place-items-center rounded-full bg-rosa-100 text-rosa-500"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* cabeçalho dos dias da semana */}
      <div className="mb-1.5 grid grid-cols-7 gap-1.5 text-center text-[11px] font-extrabold">
        {LETRAS.map((l, i) => (
          <span key={i} className={i === 0 || i === 6 ? 'text-vermelhinho' : 'text-rosa-400'}>
            {l}
          </span>
        ))}
      </div>

      {/* a grade */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`grade-${mes.ano}-${mes.mes}`}
          initial={{ opacity: 0, x: direcao * 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -direcao * 30 }}
          transition={{ duration: 0.24 }}
          className="grid grid-cols-7 gap-1.5"
        >
          {celulas.map((data, i) =>
            data === null ? (
              <span key={`v${i}`} />
            ) : (
              <Quadradinho
                key={data}
                data={data}
                indice={i}
                ehHoje={data === hoje}
                estado={estadoDoDia(data, hoje, snap)}
                modoFotos={modoFotos}
                foto={fotoDe(snap, data, 'evolucao')}
                aoAbrir={() => aoAbrirDia(data)}
                aoSegurar={() => comecarEspiada(data)}
                aoSoltar={pararEspiada}
              />
            ),
          )}
        </motion.div>
      </AnimatePresence>

      {/* modo fotos */}
      <button
        type="button"
        onClick={() => {
          vibrar(15)
          setModoFotos((v) => !v)
        }}
        className={`mt-4 flex w-full items-center justify-center gap-2 rounded-pill px-4 py-3 font-display text-sm font-bold transition-colors ${
          modoFotos ? 'bg-rosa-500 text-white' : 'bg-rosa-100 text-rosa-500'
        }`}
      >
        <Images size={17} /> {modoFotos ? 'Voltar pro calendário' : 'Modo Fotos 📸'}
      </button>

      {/* espiada da fotinha */}
      <AnimatePresence>
        {espiada && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setEspiada(null)}
            className="fixed inset-0 z-50 grid place-items-center bg-carvao/45 p-10 backdrop-blur-sm"
          >
            <div className="w-56">
              <Polaroid foto={fotoDe(snap, espiada, 'evolucao')} inclinacao={-3} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Quadradinho({
  data,
  indice,
  estado,
  ehHoje,
  modoFotos,
  foto,
  aoAbrir,
  aoSegurar,
  aoSoltar,
}: {
  data: string
  indice: number
  estado: EstadoDoDia
  ehHoje: boolean
  modoFotos: boolean
  foto?: ReturnType<typeof fotoDe>
  aoAbrir: () => void
  aoSegurar: () => void
  aoSoltar: () => void
}) {
  const dentro = dentroDoDesafio(data)
  const aparencia = APARENCIA[estado]
  const plano = planoDoDia(data)
  const emoji = estado === 'foraDoDesafio' ? '' : dentro ? plano.emoji : ''

  if (modoFotos && dentro) {
    return (
      <motion.button
        type="button"
        variants={{
          oculto: { opacity: 0, scale: 0.8 },
          visivel: { opacity: 1, scale: 1 },
        }}
        initial="oculto"
        animate="visivel"
        transition={{ delay: indice * 0.02, type: 'spring', stiffness: 320, damping: 24 }}
        whileTap={{ scale: 0.94 }}
        onClick={aoAbrir}
        className={`relative aspect-square overflow-hidden rounded-[14px] border-2 bg-white ${
          ehHoje ? 'anel-hoje border-rosa-500' : 'border-rosa-200'
        }`}
      >
        {foto ? (
          <MiniaturaFoto foto={foto} className="h-full w-full" />
        ) : (
          <span className="num grid h-full w-full place-items-center text-[11px] font-bold text-rosa-300">
            {numeroDoDia(data)}
          </span>
        )}
      </motion.button>
    )
  }

  return (
    <motion.button
      type="button"
      disabled={!dentro}
      variants={{
        oculto: { opacity: 0, scale: 0.75 },
        visivel: { opacity: dentro ? 1 : 0.25, scale: ehHoje ? 1.06 : 1 },
      }}
      initial="oculto"
      animate="visivel"
      transition={{ delay: indice * 0.02, type: 'spring', stiffness: 320, damping: 22 }}
      whileTap={dentro ? { scale: 0.92 } : undefined}
      onClick={() => dentro && aoAbrir()}
      onPointerDown={() => dentro && foto && aoSegurar()}
      onPointerUp={aoSoltar}
      onPointerLeave={aoSoltar}
      aria-label={`Dia ${numeroDoDia(data)}`}
      className={`relative flex aspect-square flex-col items-center justify-center gap-0.5 rounded-[14px] ${
        ehHoje ? 'anel-hoje ring-2 ring-rosa-500 ring-offset-2 ring-offset-white/60' : ''
      }`}
      style={{
        background: dentro ? aparencia.fundo : 'transparent',
        border: dentro ? (aparencia.borda ?? '2px solid transparent') : '1px solid #FFE4EF',
        boxShadow: dentro && aparencia.brilho ? `0 6px 16px ${aparencia.fundo}66` : undefined,
      }}
    >
      <span
        className="num text-[13px] font-extrabold leading-none"
        style={{ color: dentro ? aparencia.texto : '#76626F' }}
      >
        {numeroDoDia(data)}
      </span>
      {dentro && <span className="text-[10px] leading-none">{emoji}</span>}
      {dentro && (estado === 'arrasou' || estado === 'bonusFeito' || estado === 'folguinhaCheia') && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -right-1 -top-1 text-[11px] drop-shadow"
        >
          {estado === 'bonusFeito' ? '⭐' : '💗'}
        </motion.span>
      )}
    </motion.button>
  )
}

export function LegendaDoCalendario() {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[11px] text-carvao/70">
      {LEGENDA.map((l) => {
        const a = APARENCIA[l.estado]
        return (
          <span key={l.estado} className="flex items-center gap-1.5">
            <span
              className="h-4 w-4 shrink-0 rounded-[6px]"
              style={{ background: a.fundo, border: a.borda ?? '1px solid #FFE4EF' }}
            />
            {l.texto}
          </span>
        )
      })}
      <span className="col-span-2 mt-0.5 flex items-center gap-1.5 text-[11px] text-cinza">
        <span className="h-4 w-4 shrink-0 rounded-[6px] bg-vermelhinho" />
        vermelhinho é descanso, não é erro 💗
      </span>
    </div>
  )
}
