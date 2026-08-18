import { AnimatePresence, motion } from 'framer-motion'
import { Share, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Botao } from './ui'

const CHAVE = 'projetinho:convite-instalar'

type EventoInstalar = Event & { prompt: () => Promise<void>; userChoice: Promise<unknown> }

/** Convite "Adicionar à tela de início" — com instrucao propria para o iPhone. */
export function ConviteInstalar() {
  const [evento, setEvento] = useState<EventoInstalar | null>(null)
  const [visivel, setVisivel] = useState(false)
  const [ios, setIos] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(CHAVE)) return

    const instalado =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true
    if (instalado) return

    const ehIos = /iphone|ipad|ipod/i.test(navigator.userAgent)
    setIos(ehIos)

    const aoPoder = (e: Event) => {
      e.preventDefault()
      setEvento(e as EventoInstalar)
      setVisivel(true)
    }
    window.addEventListener('beforeinstallprompt', aoPoder)

    // no iOS nao existe beforeinstallprompt: mostramos a dica manual
    const t = ehIos ? setTimeout(() => setVisivel(true), 4000) : undefined

    return () => {
      window.removeEventListener('beforeinstallprompt', aoPoder)
      if (t) clearTimeout(t)
    }
  }, [])

  function dispensar() {
    localStorage.setItem(CHAVE, '1')
    setVisivel(false)
  }

  return (
    <AnimatePresence>
      {visivel && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          className="fixed inset-x-0 bottom-[92px] z-40 mx-auto w-full max-w-md px-4"
        >
          <div className="cartao-solido relative flex items-start gap-3 p-4">
            <button
              type="button"
              onClick={dispensar}
              aria-label="Dispensar convite"
              className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full text-cinza"
            >
              <X size={16} />
            </button>
            <span className="text-3xl">💗</span>
            <div className="min-w-0 flex-1 pr-6">
              <p className="font-display text-sm font-bold">Deixa o Projetinho na tela de início 💗</p>
              {ios ? (
                <p className="mt-1 text-xs leading-snug text-cinza">
                  Toque em <Share size={12} className="inline" /> <strong>Compartilhar</strong> e
                  depois em <strong>Adicionar à Tela de Início</strong>.
                </p>
              ) : (
                <Botao
                  tipo="suave"
                  className="mt-2 px-4 py-2.5 text-sm"
                  onClick={async () => {
                    await evento?.prompt()
                    dispensar()
                  }}
                >
                  Adicionar agora 💗
                </Botao>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
