import { motion } from 'framer-motion'
import { useEffect } from 'react'

const TEXTO = 'Projetinho de Benjamin pra Isabela'

/** Abertura: o coração se desenha e o texto aparece letra por letra. */
export function Splash({ aoTerminar }: { aoTerminar: () => void }) {
  useEffect(() => {
    const t = setTimeout(aoTerminar, 2400)
    return () => clearTimeout(t)
  }, [aoTerminar])

  return (
    <motion.div
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[90] grid place-items-center"
      style={{ background: 'linear-gradient(160deg,#FFF5F9 0%,#FFE4EF 55%,#F3E8FF 100%)' }}
    >
      <div className="px-8 text-center">
        <svg width="132" height="132" viewBox="0 0 24 24" className="mx-auto">
          <defs>
            <linearGradient id="grad-coracao" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FF4D8D" />
              <stop offset="100%" stopColor="#C7A9FF" />
            </linearGradient>
          </defs>
          <motion.path
            d="M12 21s-6.7-4.35-9.33-8.02C.6 10.1 1.3 6.3 4.2 4.9 6.5 3.8 9 4.6 10.4 6.3L12 8.2l1.6-1.9c1.4-1.7 3.9-2.5 6.2-1.4 2.9 1.4 3.6 5.2 1.53 8.08C18.7 16.65 12 21 12 21z"
            fill="url(#grad-coracao)"
            stroke="#FF4D8D"
            strokeWidth="0.6"
            strokeLinejoin="round"
            initial={{ pathLength: 0, fillOpacity: 0 }}
            animate={{ pathLength: 1, fillOpacity: 1 }}
            transition={{
              pathLength: { duration: 1.2, ease: 'easeInOut' },
              fillOpacity: { delay: 0.9, duration: 0.6 },
            }}
          />
        </svg>

        <p className="mt-5 flex flex-wrap justify-center gap-x-1.5">
          {TEXTO.split(' ').map((palavra, p) => (
            <span key={p} className="whitespace-nowrap">
              {palavra.split('').map((letra, i) => (
                <motion.span
                  key={`${p}-${i}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 + (p * 4 + i) * 0.035, duration: 0.25 }}
                  className={
                    palavra === 'Benjamin' || palavra === 'Isabela'
                      ? 'font-manuscrita text-2xl text-rosa-500'
                      : 'font-corpo text-lg font-semibold text-carvao/70'
                  }
                >
                  {letra}
                </motion.span>
              ))}
            </span>
          ))}
        </p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.9 }}
          className="font-bilhete mt-3 text-xl text-magenta-texto"
        >
          feito com amor 💗
        </motion.p>
      </div>
    </motion.div>
  )
}
