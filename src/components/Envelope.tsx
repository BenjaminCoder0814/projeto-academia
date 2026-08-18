import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { chuvaDeCoracoes } from '../lib/confete'
import { vibrar } from '../lib/feedback'
import type { Cartinha } from '../conteudo/mensagens'
import { Botao } from './ui'

/* ------------------------------------------------------------------ */
/* Envelopinho                                                         */
/* ------------------------------------------------------------------ */

function DesenhoEnvelope({ aberto, cor = '#FF4D8D' }: { aberto: boolean; cor?: string }) {
  return (
    <svg width="58" height="42" viewBox="0 0 58 42" aria-hidden="true">
      <rect x="1" y="6" width="56" height="35" rx="6" fill={cor} />
      <path d="M1 12 L29 30 L57 12" fill="none" stroke="#fff" strokeWidth="2.5" opacity=".55" />
      <motion.path
        d="M1 12 L29 30 L57 12 L57 8 a6 6 0 0 0 -6 -6 h-44 a6 6 0 0 0 -6 6 z"
        fill="#FF74A8"
        style={{ transformOrigin: '29px 8px' }}
        animate={{ rotateX: aberto ? -168 : 0 }}
        transition={{ type: 'spring', stiffness: 180, damping: 18 }}
      />
      <motion.text
        x="29"
        y="24"
        textAnchor="middle"
        fontSize="15"
        animate={aberto ? { opacity: 0 } : { opacity: 1, scale: [1, 1.15, 1] }}
        transition={{ duration: 1.4, repeat: aberto ? 0 : Infinity }}
      >
        💗
      </motion.text>
    </svg>
  )
}

/** Recadinho do Benjamin: chega fechado e abre com coraçõezinhos. */
export function EnvelopeRecado({
  texto,
  autor = 'Benjamin',
  jaLido,
  aoAbrir,
}: {
  texto: string
  autor?: string
  jaLido?: boolean
  aoAbrir?: () => void
}) {
  const [aberto, setAberto] = useState(Boolean(jaLido))

  function abrir() {
    if (aberto) return
    vibrar([40, 60, 40])
    chuvaDeCoracoes(30)
    setAberto(true)
    aoAbrir?.()
  }

  return (
    <div className="cartao-solido overflow-hidden border-l-4 !border-l-lavanda p-4">
      <button
        type="button"
        onClick={abrir}
        disabled={aberto}
        className="flex w-full items-center gap-3 text-left disabled:cursor-default"
      >
        <span className="shrink-0" style={{ perspective: 400 }}>
          <DesenhoEnvelope aberto={aberto} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="rotulo block">Recadinho do {autor}</span>
          {!aberto && (
            <motion.span
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.8, repeat: Infinity }}
              className="font-bilhete block text-lg text-rosa-500"
            >
              toca aqui pra abrir 💌
            </motion.span>
          )}
        </span>
      </button>

      <AnimatePresence>
        {aberto && (
          <motion.p
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 26 }}
            className="font-bilhete mt-2 text-xl leading-snug text-carvao"
          >
            {texto}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Cartinha surpresa                                                   */
/* ------------------------------------------------------------------ */

export function ChamadaDaCartinha({ cartinha, aoAbrir }: { cartinha: Cartinha; aoAbrir: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={aoAbrir}
      whileTap={{ scale: 0.97 }}
      className="flex w-full items-center gap-3 rounded-card p-4 text-left shadow-rosaForte"
      style={{ background: 'linear-gradient(135deg,#FFD9E8 0%,#F0E4FF 100%)' }}
    >
      <motion.span
        animate={{ rotate: [-6, 6, -6], scale: [1, 1.08, 1] }}
        transition={{ duration: 2.2, repeat: Infinity }}
        className="text-3xl"
      >
        💌
      </motion.span>
      <span>
        <span className="rotulo block">Cartinha surpresa</span>
        <span className="font-bilhete block text-xl text-magenta-texto">{cartinha.titulo}</span>
      </span>
    </motion.button>
  )
}

export function CartinhaAberta({ cartinha, aoFechar }: { cartinha: Cartinha; aoFechar: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] overflow-y-auto"
      style={{ background: 'linear-gradient(160deg,#FFF5F9 0%,#FFE4EF 55%,#F3E8FF 100%)' }}
    >
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
        <motion.div
          initial={{ opacity: 0, y: 40, rotate: -2 }}
          animate={{ opacity: 1, y: 0, rotate: -0.6 }}
          transition={{ type: 'spring', stiffness: 180, damping: 20 }}
          className="rounded-[22px] bg-white p-6 shadow-rosaForte"
          style={{
            backgroundImage:
              'repeating-linear-gradient(180deg, transparent, transparent 31px, #FFE4EF 31px, #FFE4EF 32px)',
          }}
        >
          <p className="font-manuscrita mb-3 text-center text-2xl text-rosa-500">{cartinha.titulo}</p>
          <p className="font-bilhete whitespace-pre-line text-[22px] leading-8 text-carvao">
            {cartinha.texto}
          </p>
        </motion.div>

        <Botao className="mt-6 w-full" onClick={aoFechar}>
          Guardar no coração 💗
        </Botao>
      </div>
    </motion.div>
  )
}
