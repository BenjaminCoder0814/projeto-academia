import { AnimatePresence, motion } from 'framer-motion'
import { Undo2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { AGUA_ALEM_DA_META, COMEMORACOES, FESTA_DA_AGUA, sortear } from '../conteudo/mensagens'
import { litros } from '../lib/calculos'
import { chuvaDeCoracoes, soltarConfete } from '../lib/confete'
import { vibrar } from '../lib/feedback'
import { Botao, NumeroAnimado } from './ui'

const RAPIDOS = [200, 300, 500, 620]

export function CartaoAgua({
  aguaMl,
  metaMl,
  aoRegistrar,
  somenteLeitura,
}: {
  aguaMl: number
  metaMl: number
  aoRegistrar?: (novoTotal: number) => void
  somenteLeitura?: boolean
}) {
  const [historico, setHistorico] = useState<number[]>([])
  const [festa, setFesta] = useState(false)
  const jaComemorou = useRef(aguaMl >= metaMl)
  const proporcao = metaMl > 0 ? Math.min(1, aguaMl / metaMl) : 0
  const bateu = metaMl > 0 && aguaMl >= metaMl
  const aMais = Math.max(0, aguaMl - metaMl)
  const elogioExtra = sortear(AGUA_ALEM_DA_META, Math.floor(aMais / 100))

  useEffect(() => {
    if (bateu && !jaComemorou.current) {
      jaComemorou.current = true
      setFesta(true)
      soltarConfete(140)
      chuvaDeCoracoes(45)
      vibrar([90, 60, 90, 60, 200])
    }
    if (!bateu) jaComemorou.current = false
  }, [bateu])

  useEffect(() => {
    if (!festa) return
    const t = setTimeout(() => setFesta(false), 4200)
    return () => clearTimeout(t)
  }, [festa])

  function adicionar(ml: number) {
    if (!aoRegistrar) return
    setHistorico((h) => [...h, aguaMl])
    vibrar(30)
    aoRegistrar(Math.max(0, aguaMl + ml))
  }

  return (
    <div className="cartao-solido p-4">
      <div className="flex items-center gap-4">
        <Garrafinha proporcao={proporcao} bateu={bateu} />

        <div className="min-w-0 flex-1">
          <h3 className="font-display text-[15px] font-bold">💧 Água do dia</h3>
          <div className="mt-0.5 flex items-baseline gap-1">
            <NumeroAnimado
              valor={aguaMl / 1000}
              casas={1}
              className="font-display text-3xl font-extrabold leading-none text-carvao"
            />
            <span className="font-display text-base font-bold text-cinza">
              / {litros(metaMl)} L
            </span>
          </div>
          {bateu ? (
            <p className="mt-1 text-xs font-semibold text-verde">
              {aMais > 0 ? `meta batida + ${aMais} ml 💗` : COMEMORACOES.aguaBatida}
            </p>
          ) : (
            <p className="mt-1 text-xs text-cinza">
              faltam {litros(Math.max(0, metaMl - aguaMl))} L, amor
            </p>
          )}

          {bateu && !somenteLeitura && (
            <p className="font-bilhete mt-1 text-lg leading-tight text-magenta-texto">
              {aMais > 0 ? elogioExtra : 'pode continuar bebendo, viu? 💧'}
            </p>
          )}

          {!somenteLeitura && (
            <>
              <div className="mt-3 flex flex-wrap gap-2">
                {RAPIDOS.map((ml) => (
                  <Botao key={ml} tipo="suave" className="px-4 py-2.5 text-sm" onClick={() => adicionar(ml)}>
                    +{ml} ml
                  </Botao>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!aoRegistrar || !historico.length) return
                  const anterior = historico[historico.length - 1]
                  setHistorico((h) => h.slice(0, -1))
                  vibrar(20)
                  aoRegistrar(anterior)
                }}
                disabled={historico.length === 0}
                className="mt-2 inline-flex items-center gap-1.5 rounded-pill px-2 py-2 text-xs font-semibold text-cinza disabled:opacity-30"
              >
                <Undo2 size={14} /> desfazer
              </button>
            </>
          )}
        </div>
      </div>

      <p className="mt-3 rounded-2xl bg-rosa-50 p-2.5 text-center text-[11px] leading-snug text-cinza">
        conta água, chá sem açúcar e água de coco. Refri e café não valem, amor 😅
      </p>

      <FestaDaAgua aberta={festa} aoFechar={() => setFesta(false)} />
    </div>
  )
}

/** Tela cheia de parabéns quando ela fecha a água do dia. */
function FestaDaAgua({ aberta, aoFechar }: { aberta: boolean; aoFechar: () => void }) {
  return (
    <AnimatePresence>
      {aberta && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={aoFechar}
          className="fixed inset-0 z-[90] grid place-items-center bg-rosa-500/25 px-8 backdrop-blur-[3px]"
        >
          <motion.div
            initial={{ scale: 0.5, y: 30, rotate: -6 }}
            animate={{ scale: 1, y: 0, rotate: -1.5 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 14 }}
            className="w-full max-w-xs rounded-[28px] bg-white/95 p-6 text-center shadow-rosaForte"
          >
            <motion.p
              animate={{ scale: [1, 1.15, 1], rotate: [0, 6, -6, 0] }}
              transition={{ duration: 1.6, repeat: Infinity }}
              className="text-6xl"
            >
              💧
            </motion.p>

            <p className="font-manuscrita mt-2 text-3xl leading-tight text-rosa-500">
              {FESTA_DA_AGUA.titulo}
            </p>
            <p className="mt-1 text-sm font-semibold text-carvao/70">{FESTA_DA_AGUA.subtitulo}</p>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="font-bilhete mt-4 text-2xl leading-snug text-magenta-texto"
            >
              {FESTA_DA_AGUA.orgulho}
            </motion.p>

            <p className="mt-4 text-[11px] text-cinza">toca pra fechar</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Garrafinha rosa que enche de verdade, com ondinha. */
function Garrafinha({ proporcao, bateu }: { proporcao: number; bateu: boolean }) {
  const L = 74
  const A = 126
  const topoLiquido = 20 + (A - 32) * (1 - proporcao)

  return (
    <motion.svg
      width={L}
      height={A}
      viewBox={`0 0 ${L} ${A}`}
      className="shrink-0"
      aria-hidden="true"
      animate={bateu ? { scale: [1, 1.06, 1] } : { scale: 1 }}
      transition={{ duration: 1.6, repeat: bateu ? Infinity : 0 }}
    >
      <defs>
        <clipPath id="corpo-garrafinha">
          <path d="M21 6 h32 a4 4 0 0 1 4 4 v7 c0 4 6 8 6 15 v84 a10 10 0 0 1 -10 10 h-32 a10 10 0 0 1 -10 -10 v-84 c0 -7 6 -11 6 -15 v-7 a4 4 0 0 1 4 -4 z" />
        </clipPath>
        <linearGradient id="liquidinho" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={bateu ? '#FF74A8' : '#FFA0C4'} />
          <stop offset="100%" stopColor={bateu ? '#E8107A' : '#FF4D8D'} />
        </linearGradient>
      </defs>

      <g clipPath="url(#corpo-garrafinha)">
        <rect x="0" y="0" width={L} height={A} fill="#FFF5F9" />
        <motion.g
          initial={false}
          animate={{ y: topoLiquido }}
          transition={{ type: 'spring', stiffness: 60, damping: 18 }}
        >
          <motion.path
            d={`M-${L} 0 q ${L / 2} -7 ${L} 0 q ${L / 2} 7 ${L} 0 q ${L / 2} -7 ${L} 0 v ${A} h -${L * 3} z`}
            fill="url(#liquidinho)"
            animate={{ x: [0, L, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'linear' }}
          />
        </motion.g>
      </g>

      <path
        d="M21 6 h32 a4 4 0 0 1 4 4 v7 c0 4 6 8 6 15 v84 a10 10 0 0 1 -10 10 h-32 a10 10 0 0 1 -10 -10 v-84 c0 -7 6 -11 6 -15 v-7 a4 4 0 0 1 4 -4 z"
        fill="none"
        stroke="#FFC9DE"
        strokeWidth="2.5"
      />
      <rect x="25" y="2" width="24" height="8" rx="3" fill="#FFC9DE" />
      {bateu && (
        <motion.text
          x={L / 2}
          y={A / 2}
          textAnchor="middle"
          fontSize="20"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          💗
        </motion.text>
      )}
    </motion.svg>
  )
}
