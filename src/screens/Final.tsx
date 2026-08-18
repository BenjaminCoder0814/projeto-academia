import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { CARTA_FINAL } from '../conteudo/mensagens'
import { Polaroid } from '../components/Fotos'
import { Botao, NumeroAnimado } from '../components/ui'
import { useEstado } from '../data/estado'
import { DESAFIO_FIM, DESAFIO_INICIO, calcularIMC, umaCasa } from '../lib/calculos'
import { chuvaDeCoracoes, soltarConfete } from '../lib/confete'
import { fotoDe, pesoEm, resumo } from '../lib/derivados'

/** O grande final: 01/09/2026. */
export function Final({ aoFechar }: { aoFechar: () => void }) {
  const { snap, hoje } = useEstado()
  const r = resumo(hoje, snap)
  const altura = snap.perfilIsabela?.altura_cm ?? 165
  const pesoInicial = snap.perfilIsabela?.peso_inicial_kg ?? snap.pesos[0]?.peso_kg ?? 0
  const pesoFinal = pesoEm(snap, hoje) ?? pesoInicial
  const perdeu = pesoInicial - pesoFinal
  const imcInicial = pesoInicial ? calcularIMC(pesoInicial, altura) : 0
  const imcFinal = pesoFinal ? calcularIMC(pesoFinal, altura) : 0

  const primeira =
    fotoDe(snap, DESAFIO_INICIO, 'evolucao') ?? snap.fotos.find((f) => f.tipo === 'evolucao')
  const ultima =
    fotoDe(snap, DESAFIO_FIM, 'evolucao') ??
    [...snap.fotos].reverse().find((f) => f.tipo === 'evolucao')

  useEffect(() => {
    soltarConfete(180)
    chuvaDeCoracoes(60)
    const t = setTimeout(() => soltarConfete(140), 1500)
    return () => clearTimeout(t)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[75] overflow-y-auto"
      style={{ background: 'linear-gradient(160deg,#FFF5F9 0%,#FFE4EF 55%,#F3E8FF 100%)' }}
    >
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center gap-4 px-5 py-10">
        <motion.p
          initial={{ scale: 0.4, rotate: -12, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 13 }}
          className="text-7xl"
        >
          🏆
        </motion.p>

        <h1 className="font-manuscrita text-center text-3xl leading-tight text-rosa-500">
          {CARTA_FINAL.titulo}
        </h1>

        {/* antes e depois lado a lado */}
        {primeira && ultima && (
          <div className="grid w-full grid-cols-2 gap-3">
            <div>
              <Polaroid foto={primeira} inclinacao={-3} />
              <p className="mt-1 text-center text-[11px] font-semibold text-cinza">o começo</p>
            </div>
            <div>
              <Polaroid foto={ultima} inclinacao={3} />
              <p className="mt-1 text-center text-[11px] font-semibold text-magenta-texto">agora 💗</p>
            </div>
          </div>
        )}

        {/* números */}
        <div className="grid w-full grid-cols-2 gap-3">
          <Bloco titulo="Corridas">
            <NumeroAnimado valor={r.corridas.feitas} className="text-4xl" />
            <span className="text-lg text-cinza">/{r.corridas.previstas}</span>
          </Bloco>
          <Bloco titulo="Natações">
            <NumeroAnimado valor={r.natacoes.feitas} className="text-4xl" />
            <span className="text-lg text-cinza">/{r.natacoes.previstas}</span>
          </Bloco>
          <Bloco titulo="Dias perfeitos">
            <NumeroAnimado valor={r.diasPerfeitos} className="text-4xl" />
          </Bloco>
          <Bloco titulo="Bônus de sexta">
            <NumeroAnimado valor={r.bonus} className="text-4xl" />
            <span className="text-lg"> ⭐</span>
          </Bloco>
        </div>

        <div className="w-full rounded-card bg-white/90 p-5 shadow-rosa backdrop-blur">
          <p className="rotulo mb-2 text-center">de onde saiu, onde chegou</p>
          <div className="flex items-center justify-between text-center">
            <div>
              <p className="num font-display text-2xl font-extrabold">{umaCasa(pesoInicial)} kg</p>
              <p className="num text-xs text-cinza">IMC {umaCasa(imcInicial)}</p>
            </div>
            <div className="px-2">
              <p className="font-display text-sm font-bold text-magenta-texto">
                {perdeu > 0.05 ? `−${umaCasa(perdeu)} kg` : 'firme e forte'}
              </p>
              <p className="text-[11px] text-cinza">15 dias</p>
            </div>
            <div>
              <p className="num font-display text-2xl font-extrabold text-rosa-500">
                {umaCasa(pesoFinal)} kg
              </p>
              <p className="num text-xs text-cinza">IMC {umaCasa(imcFinal)}</p>
            </div>
          </div>
        </div>

        {/* a cartinha */}
        <motion.div
          initial={{ opacity: 0, y: 30, rotate: -2 }}
          animate={{ opacity: 1, y: 0, rotate: -0.6 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 180, damping: 20 }}
          className="w-full rounded-[22px] bg-white p-5 shadow-rosaForte"
          style={{
            backgroundImage:
              'repeating-linear-gradient(180deg, transparent, transparent 31px, #FFE4EF 31px, #FFE4EF 32px)',
          }}
        >
          <p className="font-bilhete whitespace-pre-line text-[22px] leading-8 text-carvao">
            {CARTA_FINAL.texto}
          </p>
          <p className="font-manuscrita mt-3 text-right text-xl text-rosa-500">
            {CARTA_FINAL.assinatura}
          </p>
        </motion.div>

        <Botao className="mt-2 w-full" onClick={aoFechar}>
          Guardar pra sempre 💗
        </Botao>
      </div>
    </motion.div>
  )
}

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      className="rounded-card bg-white/90 p-4 text-center shadow-rosa backdrop-blur"
    >
      <p className="rotulo mb-1">{titulo}</p>
      <p className="font-display font-extrabold text-carvao">{children}</p>
    </motion.div>
  )
}
