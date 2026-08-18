import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { RECADINHOS_DO_TOPO, sortear } from '../conteudo/mensagens'

/**
 * O cabeçalho é a alma do app: fica no topo de todas as telas, com o
 * coraçãozinho batendo e um recadinho que troca a cada abertura.
 */
export function Cabecalho() {
  // sorteado uma vez por abertura do app
  const recadinho = useMemo(() => sortear(RECADINHOS_DO_TOPO), [])

  return (
    <header
      className="area-segura-alto sticky top-0 z-30 w-full overflow-hidden"
      style={{ background: 'var(--gradiente-topo)' }}
    >
      <CoracoesDoTopo />

      <div className="relative z-10 px-4 pb-2.5 pt-3 text-center">
        <h1 className="flex flex-wrap items-center justify-center gap-x-1.5 leading-tight">
          <span className="text-sm">✨</span>
          <span className="font-corpo text-[13px] font-semibold text-carvao/70">Projetinho de</span>
          <span className="font-manuscrita text-xl text-rosa-500">Benjamin</span>
          <span className="font-corpo text-[13px] font-semibold text-carvao/70">pra</span>
          <span className="font-manuscrita text-xl text-magenta-texto">Isabela</span>
          <motion.span
            animate={{ scale: [1, 1.12, 1, 1.08, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            className="text-base"
          >
            💗
          </motion.span>
          <span className="text-sm">✨</span>
        </h1>

        <motion.p
          key={recadinho}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="font-bilhete mt-0.5 text-[15px] text-carvao/70"
        >
          {recadinho}
        </motion.p>
      </div>
    </header>
  )
}

function CoracoesDoTopo() {
  const coracoes = [
    { esquerda: '6%', atraso: 0, duracao: 9 },
    { esquerda: '28%', atraso: 2.4, duracao: 11 },
    { esquerda: '52%', atraso: 4.8, duracao: 10 },
    { esquerda: '74%', atraso: 1.2, duracao: 12 },
    { esquerda: '92%', atraso: 3.6, duracao: 9.5 },
  ]
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {coracoes.map((c, i) => (
        <span
          key={i}
          className="coracao-fundo text-[11px]"
          style={{
            left: c.esquerda,
            animationDelay: `${c.atraso}s`,
            animationDuration: `${c.duracao}s`,
            opacity: 0.2,
          }}
        >
          💗
        </span>
      ))}
    </div>
  )
}
