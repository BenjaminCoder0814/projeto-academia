import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { BarraProgresso, Cartao, NumeroAnimado, Tela } from '../components/ui'
import { MOTIVACIONAIS } from '../conteudo/cartas'
import { sementeDaData, sortear } from '../conteudo/mensagens'
import { useEstado } from '../data/estado'
import { diaMes, diffDias, nomeDoDia } from '../lib/datas'
import {
  RECOMPENSA_FIM,
  calcularRecompensa,
  diasAntesDoApp,
  diasDaRecompensa,
} from '../lib/recompensa'
import { DESAFIO_INICIO } from '../lib/calculos'
import { vibrar } from '../lib/feedback'

/** A aba do prêmio: o quanto ela está perto do lookinho e do presente. */
export function Premio({ aoVerEvolucao }: { aoVerEvolucao?: () => void }) {
  const { snap, hoje, souIsabela, salvarDia } = useEstado()
  const r = useMemo(() => calcularRecompensa(hoje, snap), [hoje, snap])
  const dias = useMemo(() => diasDaRecompensa(hoje, snap), [hoje, snap])
  const frase = sortear(MOTIVACIONAIS, sementeDaData(hoje))
  const anteriores = diasAntesDoApp(DESAFIO_INICIO)
  const faltamMarcar = anteriores.some((d) => !snap.dias.find((x) => x.data === d))

  return (
    <Tela>
      <div className="px-1">
        <h1 className="font-manuscrita text-2xl text-rosa-500">o prêmio do mês 🎁</h1>
        <p className="font-bilhete text-xl text-carvao/70">
          desde 11 de agosto, o dia em que você começou
        </p>
      </div>

      {/* a barra grande */}
      <Cartao className="text-center">
        <p className="rotulo">quanto falta pro lookinho</p>
        <p className="my-1">
          <NumeroAnimado
            valor={Math.round(r.porcentagem)}
            className="font-display text-6xl font-extrabold text-rosa-500"
          />
          <span className="font-display text-2xl font-bold text-carvao/70">%</span>
        </p>
        <BarraProgresso valor={r.porcentagem} altura={16} />
        <p className="num mt-2 text-xs text-cinza">
          {r.feitos} de {r.totalDoMes} dias de treino do mês
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2 text-center">
          <div className="rounded-2xl bg-rosa-50 p-3">
            <p className="num font-display text-xl font-extrabold text-magenta-texto">
              {Math.round(r.porcentagemAteAgora)}%
            </p>
            <p className="text-[11px] leading-tight text-cinza">do que já passou</p>
          </div>
          <div className="rounded-2xl bg-rosa-50 p-3">
            <p className="num font-display text-xl font-extrabold text-magenta-texto">
              {r.faltamDias}
            </p>
            <p className="text-[11px] leading-tight text-cinza">dias até o fim do mês</p>
          </div>
        </div>
      </Cartao>

      {aoVerEvolucao && (
        <button
          type="button"
          onClick={aoVerEvolucao}
          className="mx-1 flex items-center justify-between rounded-card bg-white/85 px-4 py-3 text-left shadow-rosa"
        >
          <span>
            <span className="block font-display text-sm font-bold">📈 Sua evolução</span>
            <span className="block text-[11px] text-cinza">
              peso, IMC, mural das fotinhas e o antes e depois
            </span>
          </span>
          <span className="text-magenta-texto">›</span>
        </button>
      )}

      {/* a frase do dia */}
      <Cartao className="!bg-white/70 text-center">
        <p className="font-bilhete text-xl leading-snug text-magenta-texto">{frase}</p>
      </Cartao>

      {/* os dois prêmios */}
      <Cartao
        className="!p-0 overflow-hidden"
        solido
      >
        <div
          className="p-5"
          style={{ background: 'linear-gradient(135deg,#FFE3EF 0%,#F3E4FF 100%)' }}
        >
          <div className="flex items-start gap-3">
            <span className="text-3xl">🎽</span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-base font-bold">Lookinho de academia</p>
              <p className="text-xs text-cinza">o presente que você vai se dar 💗</p>
              <p className="mt-2 text-sm font-semibold">
                {r.lookGarantido ? (
                  <span className="text-verde">conquistado — vai lá comprar o seu 🏆</span>
                ) : r.lookEmJogo ? (
                  <span className="text-magenta-texto">
                    tá de pé — nenhum dia perdido até agora 💗
                  </span>
                ) : (
                  <span className="text-carvao/70">
                    {r.perdidos} {r.perdidos === 1 ? 'dia ficou' : 'dias ficaram'} pra trás — mas
                    quem decide isso é você, viu? 🥺
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-start gap-3">
            <span className="text-3xl">🎁</span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-base font-bold">Presente surpresa do Benjamin</p>
              <p className="text-xs text-cinza">se você for em TODAS as sextas bônus</p>
              <p className="num mt-2 text-sm font-semibold text-magenta-texto">
                {r.sextas.feitas} de {r.sextas.total} sextas
              </p>
              <div className="mt-2">
                <BarraProgresso
                  valor={r.sextas.total ? (r.sextas.feitas / r.sextas.total) * 100 : 0}
                  cor="linear-gradient(135deg,#FFC978,#FF4D8D)"
                  altura={10}
                />
              </div>
              <p className="mt-2 text-xs leading-snug text-carvao/70">
                {r.presenteGarantido
                  ? 'todas as sextas! o presente é seu, e é surpresa 🥰'
                  : r.presenteEmJogo
                    ? 'ainda dá pra ganhar — nenhuma sexta perdida até agora ⭐'
                    : 'a surpresa desse mês escapou, mas a sexta continua valendo estrelinha 💗'}
              </p>
            </div>
          </div>
        </div>
      </Cartao>

      {/* a semana que ela fez antes do app */}
      {souIsabela && faltamMarcar && (
        <Cartao>
          <h2 className="font-display text-base font-bold">a semana que você já tinha feito</h2>
          <p className="mt-1 text-xs leading-snug text-cinza">
            você começou antes do app existir — marca aqui os dias em que treinou, que eles entram
            na conta 💗
          </p>
          <div className="mt-3 space-y-2">
            {anteriores.map((data) => {
              const registro = snap.dias.find((d) => d.data === data)
              const feito = Boolean(registro?.corrida_ok)
              return (
                <button
                  key={data}
                  type="button"
                  onClick={() => {
                    vibrar(40)
                    void salvarDia(data, {
                      corrida_ok: !feito,
                      natacao_ok: !feito,
                    })
                  }}
                  className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left ${
                    feito ? 'bg-rosa-500 text-white' : 'bg-rosa-50 text-carvao'
                  }`}
                >
                  <span className="font-display text-sm font-semibold first-letter:uppercase">
                    {nomeDoDia(data)} · {diaMes(data)}
                  </span>
                  <span className="text-lg">{feito ? '💗' : '🤍'}</span>
                </button>
              )
            })}
          </div>
        </Cartao>
      )}

      {/* o mês inteiro */}
      <Cartao>
        <h2 className="mb-3 font-display text-base font-bold">agosto inteiro</h2>
        <div className="grid grid-cols-7 gap-1.5">
          {dias.map((d, i) => {
            const cor =
              d.tipo === 'namorado'
                ? '#FFD9E8'
                : d.feito
                  ? d.tipo === 'bonus'
                    ? '#FFC978'
                    : '#FF4D8D'
                  : d.passou
                    ? '#F1EAEE'
                    : 'transparent'
            return (
              <motion.div
                key={d.data}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.015 }}
                className={`num grid aspect-square place-items-center rounded-xl text-[11px] font-bold ${
                  d.feito && d.tipo !== 'namorado' ? 'text-white' : 'text-carvao/70'
                } ${d.data === hoje ? 'ring-2 ring-rosa-500 ring-offset-1' : ''}`}
                style={{
                  background: cor,
                  border: cor === 'transparent' ? '1.5px dashed #FFC9DE' : undefined,
                }}
                title={d.data}
              >
                {Number(d.data.slice(-2))}
              </motion.div>
            )
          })}
        </div>

        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 text-[11px] text-cinza">
          <Legenda cor="#FF4D8D" texto="treinou" />
          <Legenda cor="#FFC978" texto="sexta bônus" />
          <Legenda cor="#FFD9E8" texto="dia do namorado 💗" />
          <Legenda cor="#F1EAEE" texto="passou em branco" />
        </div>
      </Cartao>

      <p className="px-3 text-center text-[11px] leading-relaxed text-cinza">
        a conta vai de 11/08 até {diaMes(RECOMPENSA_FIM)} · sexta é bônus, fim de semana é dia de
        namorado e não entra na conta 💗
        {diffDias(hoje, RECOMPENSA_FIM) < 0 ? ' · esse mês já fechou' : ''}
      </p>
    </Tela>
  )
}

function Legenda({ cor, texto }: { cor: string; texto: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-3 w-3 rounded-full" style={{ background: cor }} />
      {texto}
    </span>
  )
}
