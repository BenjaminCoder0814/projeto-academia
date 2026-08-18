import { motion } from 'framer-motion'
import { useState } from 'react'
import { Calendario, LegendaDoCalendario } from '../components/Calendario'
import { TelaDoDia } from '../components/TelaDoDia'
import { Cartao, FitaDeProgresso, Folhinha, NumeroAnimado, Tela } from '../components/ui'
import { useEstado } from '../data/estado'
import { resumo, sequencia } from '../lib/derivados'
import { statusDoDesafio, totaisDoDesafio } from '../lib/fase'

export function CalendarioTela({ aoIrParaTreino }: { aoIrParaTreino: () => void }) {
  const { snap, hoje, souIsabela } = useEstado()
  const [diaAberto, setDiaAberto] = useState<string | null>(null)
  const status = statusDoDesafio(hoje)
  const totais = totaisDoDesafio()
  const seq = sequencia(hoje, snap)
  const r = resumo(hoje, snap)

  const diaMostrado = Math.max(1, Math.min(status.totalDias, status.diaAtual))
  const progresso = (diaMostrado / status.totalDias) * 100

  return (
    <>
      <Tela>
        {/* contador regressivo */}
        <Cartao className="relative overflow-hidden text-center !py-4">
          <Adesivo emoji="🎀" className="left-2 top-2 -rotate-12" />
          <Adesivo emoji="🏋️‍♀️" className="right-2 top-2 rotate-12" />
          <Adesivo emoji="👟" className="bottom-2 left-2 rotate-6" />
          <Adesivo emoji="🧴" className="bottom-2 right-2 -rotate-6" />
          {status.terminou ? (
            <p className="font-manuscrita text-2xl text-rosa-500">desafio concluído 🎉💗</p>
          ) : (
            <>
              <p className="font-display text-[15px] font-semibold text-carvao/70">
                {status.aindaNaoComecou ? 'o desafio começa em' : 'faltam'}
              </p>
              <p className="my-0.5 flex items-baseline justify-center gap-2">
                <NumeroAnimado
                  valor={
                    status.aindaNaoComecou
                      ? Math.abs(status.diaAtual - 1)
                      : status.diasRestantes
                  }
                  className="font-display text-5xl font-extrabold text-rosa-500"
                />
                <span className="font-display text-xl font-bold text-carvao/70">
                  {status.diasRestantes === 1 ? 'dia' : 'dias'} 🌸
                </span>
              </p>
              <p className="font-bilhete text-lg text-carvao/70">
                {status.aindaNaoComecou ? 'já já a gente começa' : 'pro fim do desafio'}
              </p>
            </>
          )}

          <div className="mt-3">
            <FitaDeProgresso valor={progresso} rotulo={`Dia ${diaMostrado} de ${status.totalDias}`} />
          </div>
        </Cartao>

        {/* sequência */}
        <Cartao className="flex items-center gap-3 !py-4">
          <motion.span
            animate={seq > 0 ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 1.4, repeat: Infinity }}
            className="text-3xl"
          >
            🔥
          </motion.span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-xl font-extrabold">
              <NumeroAnimado valor={seq} /> {seq === 1 ? 'dia seguido' : 'dias seguidos'}
            </p>
            <p className="text-xs text-cinza">
              {seq === 0
                ? 'fecha um dia e a sequência começa 💗'
                : 'sexta, sábado e domingo nunca quebram a sequência'}
            </p>
          </div>
          {r.bonus > 0 && (
            <span className="shrink-0 rounded-pill bg-dourado/25 px-2.5 py-1 text-[11px] font-bold text-[#B07520]">
              ⭐ {r.bonus} {r.bonus === 1 ? 'bônus' : 'bônus'}
            </span>
          )}
        </Cartao>

        {/* o calendário */}
        <motion.div variants={{ oculto: { opacity: 0, y: 16 }, visivel: { opacity: 1, y: 0 } }}>
          <Calendario aoAbrirDia={(d) => setDiaAberto(d)} />
        </motion.div>

        {/* legenda */}
        <Cartao>
          <h2 className="mb-3 font-display text-base font-bold">O que cada cor quer dizer</h2>
          <LegendaDoCalendario />
        </Cartao>

        {/* resumo do desafio */}
        <Cartao className="!py-4">
          <div className="flex items-center justify-around text-center">
            <Numerinho valor={`${r.corridas.feitas}/${totais.corridas}`} rotulo="corridas" emoji="🏃‍♀️" />
            <Numerinho valor={`${r.natacoes.feitas}/${totais.natacoes}`} rotulo="natações" emoji="🏊‍♀️" />
            <Numerinho valor={`${r.bonus}/${totais.bonus}`} rotulo="bônus" emoji="⭐" />
            <Numerinho
              valor={`${r.fotos.feitas + r.fotosExtras}/${totais.fotos}`}
              rotulo="fotinhas"
              emoji="📸"
            />
          </div>
        </Cartao>

        <p className="px-3 pt-1 text-center text-[11px] leading-relaxed text-cinza">
          Feito com amor pelo Benjamin 💗 — Este app é só um acompanhamento pessoal e não substitui
          orientação de educador físico, nutricionista ou médico. As metas de peso e de água são
          estimativas gerais.
        </p>
      </Tela>

      <Folhinha aberta={Boolean(diaAberto)} aoFechar={() => setDiaAberto(null)}>
        {diaAberto && (
          <TelaDoDia
            data={diaAberto}
            aoFechar={() => setDiaAberto(null)}
            aoIrParaTreino={aoIrParaTreino}
          />
        )}
      </Folhinha>

      {!souIsabela && (
        <p className="relative z-10 -mt-24 mb-28 text-center text-[11px] text-cinza">
          modo acompanhamento: você vê tudo, mas quem marca é ela 💗
        </p>
      )}
    </>
  )
}

/** Adesivinho decorativo do fundo dos cartões. */
function Adesivo({ emoji, className = '' }: { emoji: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute select-none text-lg opacity-25 ${className}`}
    >
      {emoji}
    </span>
  )
}

function Numerinho({ valor, rotulo, emoji }: { valor: string; rotulo: string; emoji: string }) {
  return (
    <div>
      <p className="text-xl">{emoji}</p>
      <p className="num font-display text-lg font-extrabold text-rosa-500">{valor}</p>
      <p className="text-[11px] text-cinza">{rotulo}</p>
    </div>
  )
}
