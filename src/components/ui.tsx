import { AnimatePresence, animate, motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { reduzirMovimento, vibrar } from '../lib/feedback'

/* ------------------------------------------------------------------ */
/* Fundo fofo                                                          */
/* ------------------------------------------------------------------ */

export function FundoFofo() {
  const coracoes = [
    { esquerda: '8%', atraso: 0, duracao: 14, tamanho: 14 },
    { esquerda: '24%', atraso: 3.5, duracao: 18, tamanho: 10 },
    { esquerda: '46%', atraso: 7, duracao: 16, tamanho: 16 },
    { esquerda: '68%', atraso: 1.8, duracao: 19, tamanho: 12 },
    { esquerda: '86%', atraso: 5.2, duracao: 15, tamanho: 13 },
  ]
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />
      {coracoes.map((c, i) => (
        <span
          key={i}
          className="coracao-fundo"
          style={{
            left: c.esquerda,
            fontSize: c.tamanho,
            animationDelay: `${c.atraso}s`,
            animationDuration: `${c.duracao}s`,
          }}
        >
          💗
        </span>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Estrutura                                                           */
/* ------------------------------------------------------------------ */

export const listaCascata = {
  oculto: {},
  visivel: { transition: { staggerChildren: 0.05, delayChildren: 0.03 } },
}

export const itemCascata = {
  oculto: { opacity: 0, y: 16 },
  visivel: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 320, damping: 30 } },
}

export function Tela({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={listaCascata}
      initial="oculto"
      animate="visivel"
      className={`relative z-10 flex flex-col gap-4 px-4 pb-32 pt-3 ${className}`}
    >
      {children}
    </motion.div>
  )
}

export function Cartao({
  children,
  className = '',
  solido = false,
  onClick,
}: {
  children: ReactNode
  className?: string
  solido?: boolean
  onClick?: () => void
}) {
  return (
    <motion.div
      variants={itemCascata}
      onClick={onClick}
      className={`${solido ? 'cartao-solido' : 'cartao'} p-5 ${className}`}
    >
      {children}
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/* Botões                                                              */
/* ------------------------------------------------------------------ */

export function Botao({
  children,
  onClick,
  tipo = 'principal',
  className = '',
  desabilitado,
  submit,
  aria,
}: {
  children: ReactNode
  onClick?: () => void
  tipo?: 'principal' | 'suave' | 'fantasma'
  className?: string
  desabilitado?: boolean
  submit?: boolean
  aria?: string
}) {
  const classes =
    tipo === 'principal'
      ? 'botao-principal'
      : tipo === 'suave'
        ? 'botao-suave'
        : 'rounded-pill px-5 py-3 font-display font-semibold text-cinza'
  return (
    <motion.button
      type={submit ? 'submit' : 'button'}
      aria-label={aria}
      whileTap={reduzirMovimento() ? undefined : { scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 500, damping: 26 }}
      onClick={onClick}
      disabled={desabilitado}
      className={`${classes} toque disabled:opacity-40 ${className}`}
    >
      {children}
    </motion.button>
  )
}

/* ------------------------------------------------------------------ */
/* Número que conta crescendo                                          */
/* ------------------------------------------------------------------ */

export function NumeroAnimado({
  valor,
  casas = 0,
  className = '',
}: {
  valor: number
  casas?: number
  className?: string
}) {
  const bruto = useMotionValue(0)
  const suave = useSpring(bruto, { stiffness: 90, damping: 22 })
  const texto = useTransform(suave, (v) =>
    v.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas }),
  )
  const [estatico, setEstatico] = useState(false)

  useEffect(() => {
    setEstatico(reduzirMovimento())
    bruto.set(valor)
  }, [valor, bruto])

  if (estatico) {
    return (
      <span className={`num ${className}`}>
        {valor.toLocaleString('pt-BR', {
          minimumFractionDigits: casas,
          maximumFractionDigits: casas,
        })}
      </span>
    )
  }
  return (
    <span className={`num ${className}`}>
      <motion.span>{texto}</motion.span>
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Checkzinho de coração                                               */
/* ------------------------------------------------------------------ */

const CAMINHO_CORACAO =
  'M12 21s-6.7-4.35-9.33-8.02C.6 10.1 1.3 6.3 4.2 4.9 6.5 3.8 9 4.6 10.4 6.3L12 8.2l1.6-1.9c1.4-1.7 3.9-2.5 6.2-1.4 2.9 1.4 3.6 5.2 1.53 8.08C18.7 16.65 12 21 12 21z'

export function CheckCoracao({
  marcado,
  aoMudar,
  titulo,
  descricao,
  somenteLeitura,
  tom = 'rosa',
}: {
  marcado: boolean
  aoMudar?: (v: boolean) => void
  titulo: string
  descricao?: string
  somenteLeitura?: boolean
  tom?: 'rosa' | 'dourado'
}) {
  const [particulas, setParticulas] = useState(0)
  const cor = tom === 'dourado' ? '#FFC978' : '#FF4D8D'

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={marcado}
      disabled={somenteLeitura}
      onClick={() => {
        if (somenteLeitura || !aoMudar) return
        vibrar(marcado ? 20 : 60)
        if (!marcado) setParticulas((n) => n + 1)
        aoMudar(!marcado)
      }}
      className="flex w-full items-center gap-3 rounded-2xl px-1 py-2.5 text-left toque disabled:opacity-100"
    >
      <span className="relative grid h-11 w-11 shrink-0 place-items-center">
        <motion.svg
          viewBox="0 0 24 24"
          className="h-9 w-9"
          animate={marcado ? { scale: [1, 1.25, 1] } : { scale: 1 }}
          transition={{ duration: 0.4, times: [0, 0.4, 1] }}
        >
          <motion.path
            d={CAMINHO_CORACAO}
            fill={marcado ? cor : 'transparent'}
            stroke={marcado ? cor : '#FFC9DE'}
            strokeWidth={1.8}
            strokeLinejoin="round"
            initial={false}
            animate={{ fill: marcado ? cor : 'rgba(255,255,255,0)' }}
            transition={{ duration: 0.3 }}
          />
        </motion.svg>

        <AnimatePresence>
          {marcado &&
            particulas > 0 &&
            Array.from({ length: 5 }).map((_, i) => (
              <motion.span
                key={`${particulas}-${i}`}
                className="pointer-events-none absolute text-[11px]"
                initial={{ opacity: 1, x: 0, y: 0, scale: 0.6 }}
                animate={{
                  opacity: 0,
                  x: Math.cos((i / 5) * Math.PI * 2) * 34,
                  y: Math.sin((i / 5) * Math.PI * 2) * 34,
                  scale: 1,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7 }}
              >
                💗
              </motion.span>
            ))}
        </AnimatePresence>
      </span>

      <span className="min-w-0 flex-1">
        <span className="block font-display text-[15px] font-semibold text-carvao">{titulo}</span>
        {descricao && <span className="block text-xs text-cinza">{descricao}</span>}
      </span>
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* Barras e anéis                                                      */
/* ------------------------------------------------------------------ */

export function BarraProgresso({
  valor,
  cor = 'var(--gradiente)',
  altura = 12,
  fundo = '#FFE4EF',
}: {
  valor: number
  cor?: string
  altura?: number
  fundo?: string
}) {
  return (
    <div
      className="w-full overflow-hidden rounded-pill"
      style={{ height: altura, background: fundo }}
      role="progressbar"
      aria-valuenow={Math.round(valor)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <motion.div
        className="h-full rounded-pill"
        style={{ background: cor }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, valor))}%` }}
        transition={{ type: 'spring', stiffness: 70, damping: 20 }}
      />
    </div>
  )
}

/** Fita/coração que enche conforme o progresso do desafio. */
export function FitaDeProgresso({ valor, rotulo }: { valor: number; rotulo: string }) {
  return (
    <div className="flex items-center gap-3">
      <motion.span
        animate={{ scale: [1, 1.14, 1] }}
        transition={{ duration: 1.4, repeat: Infinity }}
        className="text-xl"
      >
        💗
      </motion.span>
      <div className="min-w-0 flex-1">
        <BarraProgresso valor={valor} />
      </div>
      <span className="num shrink-0 font-display text-xs font-bold text-magenta-texto">{rotulo}</span>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Esqueletos                                                          */
/* ------------------------------------------------------------------ */

export function Esqueleto({ className = '' }: { className?: string }) {
  return <div className={`esqueleto rounded-2xl ${className}`} />
}

export function CarregandoTela() {
  return (
    <div className="relative z-10 flex flex-col gap-4 px-4 pt-6">
      <Esqueleto className="h-20 w-full" />
      <Esqueleto className="h-72 w-full" />
      <Esqueleto className="h-32 w-full" />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Etiqueta                                                            */
/* ------------------------------------------------------------------ */

export function Etiqueta({
  texto,
  cor,
  className = '',
}: {
  texto: string
  cor: string
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-[11px] font-semibold ${className}`}
      style={{ background: `${cor}26`, color: cor }}
    >
      {texto}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Folhinha de agenda (bottom sheet)                                   */
/* ------------------------------------------------------------------ */

export function Folhinha({
  aberta,
  aoFechar,
  children,
}: {
  aberta: boolean
  aoFechar: () => void
  children: ReactNode
}) {
  const deslocamento = useMotionValue(0)
  const inicioDoArrasto = useRef<number | null>(null)

  useEffect(() => {
    if (!aberta) return
    deslocamento.set(0)
    const antes = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = antes
    }
  }, [aberta, deslocamento])

  /* O arrasto pra fechar vive SÓ na alcinha de cima. Se ele ficasse na folha
     inteira, o Framer Motion desligaria o `touch-action` vertical e o dedo não
     conseguiria rolar o conteúdo — foi exatamente o que aconteceu no celular. */
  function comecarArrasto(e: React.PointerEvent) {
    inicioDoArrasto.current = e.clientY
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function seguirArrasto(e: React.PointerEvent) {
    if (inicioDoArrasto.current === null) return
    deslocamento.set(Math.max(0, e.clientY - inicioDoArrasto.current))
  }

  function terminarArrasto() {
    if (inicioDoArrasto.current === null) return
    inicioDoArrasto.current = null
    if (deslocamento.get() > 110) aoFechar()
    else animate(deslocamento, 0, { type: 'spring', stiffness: 400, damping: 34 })
  }

  return (
    <AnimatePresence>
      {aberta && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={aoFechar}
            className="fixed inset-0 z-40 bg-carvao/35 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="fixed inset-x-0 bottom-0 z-50 h-[88dvh] max-w-md md:left-1/2 md:-translate-x-1/2"
          >
            <motion.div
              style={{ y: deslocamento }}
              className="flex h-full flex-col overflow-hidden rounded-t-[30px] bg-rosa-50 shadow-rosaForte"
            >
              {/* alcinha: é daqui que se arrasta pra fechar */}
              <div
                onPointerDown={comecarArrasto}
                onPointerMove={seguirArrasto}
                onPointerUp={terminarArrasto}
                onPointerCancel={terminarArrasto}
                className="relative shrink-0 cursor-grab touch-none pb-1 pt-3 active:cursor-grabbing"
              >
                <div className="mx-auto h-1.5 w-12 rounded-pill bg-rosa-200" />
                <button
                  type="button"
                  onClick={aoFechar}
                  aria-label="Fechar"
                  className="absolute right-2 top-1 grid h-11 w-11 place-items-center rounded-full text-cinza"
                >
                  <X size={20} />
                </button>
              </div>

              {/* conteúdo: rola normalmente, o dedo é dele */}
              <div
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-10"
                style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
              >
                {children}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/* ------------------------------------------------------------------ */
/* Campo de texto                                                      */
/* ------------------------------------------------------------------ */

export function Campo({
  rotulo,
  valor,
  aoMudar,
  tipo = 'text',
  sufixo,
  placeholder,
  autoFoco,
}: {
  rotulo: string
  valor: string
  aoMudar: (v: string) => void
  tipo?: 'text' | 'decimal' | 'email' | 'senha'
  sufixo?: string
  placeholder?: string
  autoFoco?: boolean
}) {
  return (
    <label className="block">
      <span className="rotulo mb-1.5 block">{rotulo}</span>
      <span className="flex items-center gap-2 rounded-2xl border border-rosa-200 bg-white px-4 py-3 focus-within:border-rosa-400">
        <input
          className="num min-w-0 flex-1 bg-transparent text-[17px] font-semibold text-carvao outline-none placeholder:font-normal placeholder:text-cinza/60"
          value={valor}
          autoFocus={autoFoco}
          placeholder={placeholder}
          type={tipo === 'senha' ? 'password' : tipo === 'email' ? 'email' : 'text'}
          inputMode={tipo === 'decimal' ? 'decimal' : undefined}
          autoComplete={
            tipo === 'email' ? 'email' : tipo === 'senha' ? 'current-password' : undefined
          }
          onChange={(e) => aoMudar(e.target.value)}
        />
        {sufixo && <span className="shrink-0 text-sm font-semibold text-cinza">{sufixo}</span>}
      </span>
    </label>
  )
}
