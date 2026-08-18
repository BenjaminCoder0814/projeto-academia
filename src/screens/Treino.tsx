import { AnimatePresence, motion } from 'framer-motion'
import { Flame, Pause, Play, Square } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Botao, Cartao, Tela } from '../components/ui'
import { TIMER } from '../conteudo/mensagens'
import { useEstado } from '../data/estado'
import { CORRIDA_CICLOS, CORRIDA_HORARIO, NATACAO_HORARIO, planoDoDia } from '../lib/calculos'
import { chuvaDeCoracoes, soltarConfete } from '../lib/confete'
import { dataPorExtenso, nomeDoDia, somarDias } from '../lib/datas'
import { statusDoDesafio } from '../lib/fase'
import { mmss, useTimerIntervalado } from '../lib/timer'

const FUNDO = {
  parado: '#FFF5F9',
  caminhar: '#FFE4EF',
  correr: '#E8107A',
  concluido: '#FF4D8D',
}

export function Treino() {
  const { hoje, souIsabela, salvarDia } = useEstado()
  const status = statusDoDesafio(hoje)
  const data = status.dataFoco
  const plano = planoDoDia(data)
  const [pedindoSaida, setPedindoSaida] = useState(false)

  const aoConcluir = useCallback(() => {
    soltarConfete(150)
    chuvaDeCoracoes(40)
    if (!souIsabela) return
    if (plano.corrida) void salvarDia(data, { corrida_ok: true })
    else if (plano.corridaBonus) void salvarDia(data, { bonus_sexta_ok: true })
  }, [data, plano, salvarDia, souIsabela])

  const t = useTimerIntervalado(aoConcluir)
  const parado = !t.rodando && !t.pausado && !t.concluido

  if (!plano.corrida && !plano.corridaBonus && parado) {
    return <DiaDeFolga hoje={hoje} />
  }

  const correndo = t.fase === 'correr'
  const claro = t.fase === 'correr' || t.fase === 'concluido'

  return (
    <motion.div
      className="relative min-h-dvh"
      animate={{ backgroundColor: FUNDO[t.fase] }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
    >
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-32 pt-4">
        {/* barra dos 40 min */}
        <div className="mb-5">
          <div className="mb-2 flex items-center justify-between">
            <span className={`font-display text-sm font-bold ${claro ? 'text-white/90' : 'text-carvao'}`}>
              Corrida intervalada · 40 min
            </span>
            <span
              className={`num font-display text-sm font-bold ${claro ? 'text-white/90' : 'text-rosa-500'}`}
            >
              {mmss(t.restanteTotal)}
            </span>
          </div>
          <div
            className="h-2.5 w-full overflow-hidden rounded-pill"
            style={{ background: claro ? 'rgba(255,255,255,.28)' : '#FFE4EF' }}
          >
            <motion.div
              className="h-full rounded-pill"
              style={{ background: claro ? '#fff' : 'var(--gradiente)' }}
              animate={{ width: `${t.progressoTotal * 100}%` }}
              transition={{ ease: 'linear', duration: 0.2 }}
            />
          </div>
        </div>

        {parado ? (
          <PainelInicio
            data={data}
            ehBonus={plano.corridaBonus}
            temNatacao={plano.natacao}
            podeIniciar={souIsabela}
            aoIniciar={t.iniciar}
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={t.fase}
                initial={{ opacity: 0, y: 18, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -18, scale: 0.9 }}
                className="mb-3 text-center"
              >
                <p className="text-5xl">{t.concluido ? '🎉' : correndo ? '🏃‍♀️' : '🚶‍♀️'}</p>
                <p
                  className={`mt-1 font-display text-4xl font-extrabold tracking-tight ${
                    claro ? 'text-white' : 'text-rosa-500'
                  }`}
                >
                  {t.concluido ? 'TERMINOU 💗' : correndo ? 'CORRER' : 'CAMINHAR'}
                </p>
              </motion.div>
            </AnimatePresence>

            <AnelDoMinuto progresso={t.progressoSegmento} claro={claro}>
              <span
                className={`num font-display text-6xl font-extrabold ${
                  claro ? 'text-white' : 'text-carvao'
                }`}
              >
                {t.concluido ? '00:00' : mmss(t.restanteSegmento)}
              </span>
              <span
                className={`mt-1 font-display text-sm font-bold ${claro ? 'text-white/85' : 'text-cinza'}`}
              >
                Ciclo {Math.min(t.ciclo, CORRIDA_CICLOS)} de {CORRIDA_CICLOS}
              </span>
            </AnelDoMinuto>

            <p
              className={`font-bilhete mt-4 text-center text-2xl ${
                claro ? 'text-white' : 'text-rosa-500'
              }`}
            >
              {t.concluido ? TIMER.fim : correndo ? TIMER.correr : TIMER.caminhar}
            </p>
            <p className={`mt-1 text-center text-xs ${claro ? 'text-white/80' : 'text-cinza'}`}>
              {correndo ? 'sugestão 8,0 a 9,0 km/h' : 'sugestão 6,0 a 6,5 km/h'}
            </p>

            <div className="mt-7 flex items-center gap-3">
              {!t.concluido &&
                (t.pausado ? (
                  <Botao onClick={t.retomar} className="flex items-center gap-2 px-7">
                    <Play size={18} /> Voltar
                  </Botao>
                ) : (
                  <button
                    type="button"
                    onClick={t.pausar}
                    className={`flex items-center gap-2 rounded-pill px-7 py-4 font-display font-bold toque ${
                      claro ? 'bg-white/25 text-white' : 'bg-white text-rosa-500 shadow-rosa'
                    }`}
                  >
                    <Pause size={18} /> Pausar
                  </button>
                ))}
              <button
                type="button"
                onClick={() => (t.concluido ? t.encerrar() : setPedindoSaida(true))}
                className={`flex items-center gap-2 rounded-pill px-6 py-4 font-display font-semibold toque ${
                  claro ? 'bg-white/20 text-white' : 'bg-rosa-100 text-rosa-500'
                }`}
              >
                <Square size={16} /> {t.concluido ? 'Fechar' : 'Encerrar'}
              </button>
            </div>

            <p className={`mt-6 text-center text-[11px] ${claro ? 'text-white/75' : 'text-cinza'}`}>
              pode desligar a tela: o cronômetro continua certinho pelo relógio do celular 💗
            </p>
          </div>
        )}
      </div>

      {/* confirmação fofinha */}
      <AnimatePresence>
        {pedindoSaida && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-carvao/40 backdrop-blur-sm"
              onClick={() => setPedindoSaida(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-x-6 top-1/2 z-50 mx-auto max-w-xs -translate-y-1/2 rounded-card bg-white p-5 text-center shadow-rosaForte"
            >
              <p className="text-4xl">🥺</p>
              <p className="font-bilhete mt-2 text-2xl text-carvao">{TIMER.confirmarSaida}</p>
              <div className="mt-4 flex gap-2">
                <Botao
                  tipo="suave"
                  className="flex-1"
                  onClick={() => {
                    setPedindoSaida(false)
                    t.encerrar()
                  }}
                >
                  Encerrar
                </Botao>
                <Botao className="flex-1" onClick={() => setPedindoSaida(false)}>
                  Continuar 💗
                </Botao>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function AnelDoMinuto({
  progresso,
  claro,
  children,
}: {
  progresso: number
  claro: boolean
  children: React.ReactNode
}) {
  const tamanho = 262
  const espessura = 16
  const raio = (tamanho - espessura) / 2
  const circ = 2 * Math.PI * raio
  const cor = claro ? '#FFFFFF' : '#FF4D8D'
  const trilha = claro ? 'rgba(255,255,255,.24)' : '#FFE4EF'

  return (
    <div className="relative grid place-items-center" style={{ width: tamanho, height: tamanho }}>
      <svg width={tamanho} height={tamanho} className="-rotate-90">
        <circle cx={tamanho / 2} cy={tamanho / 2} r={raio} fill="none" stroke={trilha} strokeWidth={espessura} />
        <circle
          cx={tamanho / 2}
          cy={tamanho / 2}
          r={raio}
          fill="none"
          stroke={cor}
          strokeWidth={espessura}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * Math.min(1, Math.max(0, progresso))}
          style={{ transition: 'stroke-dashoffset .2s linear' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  )
}

function PainelInicio({
  data,
  ehBonus,
  temNatacao,
  podeIniciar,
  aoIniciar,
}: {
  data: string
  ehBonus: boolean
  temNatacao: boolean
  podeIniciar: boolean
  aoIniciar: () => void
}) {
  return (
    <div className="flex flex-1 flex-col justify-center gap-5">
      <div className="text-center">
        <p className="rotulo">{ehBonus ? 'sexta bônus' : 'treino de hoje'}</p>
        <h1 className="mt-1 font-display text-2xl font-extrabold first-letter:uppercase">
          {dataPorExtenso(data)}
        </h1>
      </div>

      <div className="cartao-solido space-y-3 p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🏃‍♀️</span>
          <div>
            <p className="font-display font-bold">Corrida intervalada · 40 min</p>
            <p className="num text-sm font-semibold text-magenta-texto">{CORRIDA_HORARIO}</p>
            <p className="mt-1 text-xs leading-snug text-cinza">
              {CORRIDA_CICLOS} ciclos de 1 minuto caminhando rápido (6,0–6,5 km/h) + 1 minuto
              correndo (8,0–9,0 km/h).
            </p>
          </div>
        </div>

        {temNatacao && (
          <div className="flex items-start gap-3 border-t border-rosa-100 pt-3">
            <span className="text-2xl">🏊‍♀️</span>
            <div>
              <p className="font-display font-bold">Natação · 45 min</p>
              <p className="num text-sm font-semibold text-magenta-texto">{NATACAO_HORARIO}</p>
              <p className="mt-1 text-xs text-cinza">é só marcar o coraçãozinho quando terminar 💗</p>
            </div>
          </div>
        )}

        {ehBonus && (
          <p className="rounded-2xl bg-lavanda/15 p-3 text-center text-xs font-semibold text-carvao/70">
            hoje é bônus: se você não for, tá tudo certo. nada muda ⭐
          </p>
        )}
      </div>

      {podeIniciar ? (
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={aoIniciar}
          className="botao-principal flex w-full items-center justify-center gap-3 py-6 text-xl"
        >
          <Flame size={24} /> Bora correr! 💗
        </motion.button>
      ) : (
        <p className="text-center text-sm text-cinza">quem começa o treino é ela 💗</p>
      )}

      <p className="text-center text-[11px] leading-relaxed text-cinza">
        o celular avisa com som e vibração 3 segundinhos antes de cada troca. deixa o volume ligado 🔊
      </p>
    </div>
  )
}

function DiaDeFolga({ hoje }: { hoje: string }) {
  let proxima = hoje
  for (let i = 1; i <= 7; i++) {
    const candidato = somarDias(hoje, i)
    const p = planoDoDia(candidato)
    if (p.corrida || p.corridaBonus) {
      proxima = candidato
      break
    }
  }
  const plano = planoDoDia(proxima)

  return (
    <Tela>
      <Cartao className="mt-6 text-center">
        <p className="mb-2 text-5xl">💤</p>
        <h1 className="font-display text-2xl font-extrabold">Hoje é folguinha</h1>
        <p className="font-bilhete mt-2 text-xl leading-snug text-carvao/70">
          descansa, amor. seu corpo tá construindo o resultado agora ❤️
        </p>
      </Cartao>

      <Cartao>
        <p className="rotulo mb-1">Próximo treino</p>
        <p className="font-display text-lg font-bold first-letter:uppercase">{nomeDoDia(proxima)}</p>
        <p className="mt-1 text-sm text-cinza">
          {plano.corridaBonus ? 'Corridinha bônus (se você quiser)' : 'Corrida intervalada 40 min'} ·{' '}
          {CORRIDA_HORARIO}
          {plano.natacao && ` · Natação 45 min · ${NATACAO_HORARIO}`}
        </p>
      </Cartao>
    </Tela>
  )
}
