import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { BarraProgresso, Cartao, Esqueleto, Etiqueta, Tela } from '../components/ui'
import { Comparador } from '../components/Comparador'
import { Polaroid, useUrlFoto } from '../components/Fotos'
import { useEstado } from '../data/estado'
import {
  calcularIMC,
  classificarIMC,
  faixaSaudavel,
  metaDePeso,
  progressoDoPeso,
  umaCasa,
} from '../lib/calculos'
import { diaMes } from '../lib/datas'
import { pesoEm, resumo } from '../lib/derivados'

const eixoPtBr = (v: number) =>
  v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

export function Evolucao() {
  const { snap, hoje } = useEstado()
  const [mostrarMeta, setMostrarMeta] = useState(false)
  const altura = snap.perfilIsabela?.altura_cm ?? 165
  const faixa = faixaSaudavel(altura)
  const meta = metaDePeso(altura)
  const r = resumo(hoje, snap)

  const serie = useMemo(
    () =>
      snap.pesos.map((p) => ({
        data: diaMes(p.data),
        peso: Number(p.peso_kg.toFixed(1)),
        imc: Number(calcularIMC(p.peso_kg, altura).toFixed(1)),
      })),
    [snap.pesos, altura],
  )

  const fotos = useMemo(
    () => snap.fotos.filter((f) => f.tipo === 'evolucao').sort((a, b) => a.data.localeCompare(b.data)),
    [snap.fotos],
  )

  const [iAntes, setIAntes] = useState(0)
  const [iDepois, setIDepois] = useState(Math.max(0, fotos.length - 1))
  const antes = fotos[Math.min(iAntes, fotos.length - 1)]
  const depois = fotos[Math.min(iDepois, fotos.length - 1)]
  const urlAntes = useUrlFoto(antes?.storage_path)
  const urlDepois = useUrlFoto(depois?.storage_path)

  const pesoInicial = snap.perfilIsabela?.peso_inicial_kg ?? snap.pesos[0]?.peso_kg ?? 0
  const pesoAtual = pesoEm(snap, hoje) ?? pesoInicial
  const imcAtual = pesoAtual ? calcularIMC(pesoAtual, altura) : 0
  const classe = classificarIMC(imcAtual)
  const perdeu = pesoInicial - pesoAtual

  return (
    <Tela>
      <h1 className="px-1 font-display text-2xl font-extrabold">Sua evolução 🌸</h1>

      {/* resumo do peso */}
      <Cartao>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="rotulo">Peso de agora</p>
            <p className="num font-display text-3xl font-extrabold">
              {umaCasa(pesoAtual)} <span className="text-lg text-cinza">kg</span>
            </p>
            {perdeu > 0.05 && (
              <p className="font-bilhete text-xl text-rosa-500">
                já foram {umaCasa(perdeu)} kg, amor 💗
              </p>
            )}
          </div>
          <Etiqueta texto={classe.rotulo} cor={classe.cor} className="mt-1 shrink-0" />
        </div>

        <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold">
          <span className="num text-cinza">{umaCasa(pesoInicial)} kg</span>
          <span className="text-magenta-texto">
            {Math.round(progressoDoPeso(pesoInicial, pesoAtual, meta))}% do caminho
          </span>
          <span className="num text-cinza">{umaCasa(meta)} kg</span>
        </div>
        <BarraProgresso valor={progressoDoPeso(pesoInicial, pesoAtual, meta)} />
        <p className="mt-2 text-center text-[11px] text-cinza">
          a metinha é o meio da faixa saudável ({umaCasa(faixa.min)} – {umaCasa(faixa.max)} kg)
        </p>
      </Cartao>

      {/* gráfico de peso */}
      <Cartao>
        <h2 className="mb-2 font-display text-base font-bold">Como o peso foi indo</h2>
        {serie.length < 2 ? (
          <p className="py-6 text-center text-sm text-cinza">
            registre o peso em dois dias e o gráfico aparece aqui 🌸
          </p>
        ) : (
          <>
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={serie} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaPeso" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF4D8D" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#FF4D8D" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#FFE4EF" vertical={false} />
                  <ReferenceArea y1={faixa.min} y2={faixa.max} fill="#4ADE80" fillOpacity={0.12} />
                  <ReferenceLine
                    y={meta}
                    stroke="#4ADE80"
                    strokeDasharray="6 4"
                    strokeWidth={2}
                    label={{
                      value: `metinha ${umaCasa(meta)}`,
                      fontSize: 10,
                      fill: '#3EA96A',
                      position: 'insideTopRight',
                    }}
                  />
                  <XAxis dataKey="data" tick={{ fontSize: 11, fill: '#76626F' }} tickLine={false} axisLine={false} />
                  <YAxis
                    domain={
                      mostrarMeta
                        ? [(min: number) => Math.min(min - 2, faixa.min - 2), 'dataMax + 2']
                        : ['dataMin - 2', 'dataMax + 2']
                    }
                    tick={{ fontSize: 11, fill: '#76626F' }}
                    tickFormatter={eixoPtBr}
                    tickLine={false}
                    axisLine={false}
                    width={52}
                  />
                  <Tooltip content={<Dica sufixo=" kg" />} />
                  <Area
                    type="monotone"
                    dataKey="peso"
                    stroke="#FF4D8D"
                    strokeWidth={3}
                    fill="url(#areaPeso)"
                    dot={{ r: 4, fill: '#fff', stroke: '#FF4D8D', strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <button
              type="button"
              onClick={() => setMostrarMeta((v) => !v)}
              className="mt-3 w-full rounded-2xl bg-rosa-50 px-4 py-2.5 text-xs font-semibold text-magenta-texto"
            >
              {mostrarMeta ? 'Ver só esses dias' : 'Ver o caminho todo 🌸'}
            </button>
          </>
        )}
      </Cartao>

      {/* IMC */}
      {serie.length >= 2 && (
        <Cartao>
          <h2 className="mb-2 font-display text-base font-bold">IMC</h2>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={serie} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#FFE4EF" vertical={false} />
                <ReferenceArea y1={18.5} y2={24.9} fill="#4ADE80" fillOpacity={0.12} />
                <XAxis dataKey="data" tick={{ fontSize: 11, fill: '#76626F' }} tickLine={false} axisLine={false} />
                <YAxis
                  domain={
                    mostrarMeta
                      ? [(min: number) => Math.min(min - 1, 17.5), 'dataMax + 1']
                      : ['dataMin - 1', 'dataMax + 1']
                  }
                  tick={{ fontSize: 11, fill: '#76626F' }}
                  tickFormatter={eixoPtBr}
                  tickLine={false}
                  axisLine={false}
                  width={52}
                />
                <Tooltip content={<Dica sufixo="" />} />
                <Line
                  type="monotone"
                  dataKey="imc"
                  stroke="#C7A9FF"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#fff', stroke: '#C7A9FF', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Cartao>
      )}

      {/* mural de fotinhas */}
      <Cartao>
        <h2 className="mb-3 font-display text-base font-bold">📸 Mural das fotinhas</h2>
        {fotos.length === 0 ? (
          <p className="py-6 text-center text-sm text-cinza">
            as fotinhas de cada dia aparecem aqui 💗
          </p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              {fotos.map((f, i) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => (i <= iDepois ? setIAntes(i) : setIDepois(i))}
                  className={`rounded-xl p-0.5 ${
                    i === iAntes || i === iDepois ? 'ring-2 ring-rosa-500' : ''
                  }`}
                >
                  <Polaroid foto={f} inclinacao={i % 2 === 0 ? -2.5 : 2} />
                </button>
              ))}
            </div>

            {fotos.length >= 2 && (
              <div className="mt-5">
                <p className="rotulo mb-2">Antes e depois — arrasta pra comparar</p>
                {urlAntes.url && urlDepois.url ? (
                  <Comparador
                    antes={{ url: urlAntes.url, data: antes.data, peso: pesoEm(snap, antes.data) }}
                    depois={{ url: urlDepois.url, data: depois.data, peso: pesoEm(snap, depois.data) }}
                  />
                ) : (
                  <Esqueleto className="aspect-[3/4] w-full" />
                )}
              </div>
            )}
          </>
        )}
      </Cartao>

      {/* como ela tá indo */}
      <Cartao>
        <h2 className="mb-4 font-display text-base font-bold">Como você tá indo 💪</h2>
        <p className="mb-3 text-[11px] leading-snug text-cinza">
          só contam os dias de treino — sexta bônus e folguinha ficam de fora da conta 💗
        </p>
        <div className="space-y-4">
          <Linha rotulo="🏃‍♀️ Corridas" dados={r.corridas} cor="var(--gradiente)" />
          <Linha rotulo="🏊‍♀️ Natações" dados={r.natacoes} cor="linear-gradient(135deg,#C7A9FF,#FF74A8)" />
          <Linha rotulo="💧 Água" dados={r.agua} cor="linear-gradient(135deg,#7DD3FC,#FF74A8)" />
          <Linha rotulo="📸 Fotinhas" dados={r.fotos} cor="linear-gradient(135deg,#FFC978,#FF4D8D)" />
          {r.fotosExtras > 0 && (
            <p className="text-center text-[11px] text-cinza">
              + {r.fotosExtras} {r.fotosExtras === 1 ? 'fotinha tirada' : 'fotinhas tiradas'} em dia
              livre 💗
            </p>
          )}
        </div>
        <div className="mt-4 flex gap-2">
          <p className="flex-1 rounded-2xl bg-rosa-50 p-3 text-center text-sm font-semibold text-magenta-texto">
            {r.diasPerfeitos} {r.diasPerfeitos === 1 ? 'dia perfeito' : 'dias perfeitos'} 💗
          </p>
          {r.bonus > 0 && (
            <p className="flex-1 rounded-2xl bg-dourado/20 p-3 text-center text-sm font-semibold text-[#B07520]">
              {r.bonus} {r.bonus === 1 ? 'bônus feito' : 'bônus feitos'} ⭐
            </p>
          )}
        </div>
      </Cartao>
    </Tela>
  )
}

function Dica({ active, payload, label, sufixo }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-2xl bg-white px-3 py-2 shadow-rosa">
      <p className="text-[11px] font-semibold text-cinza">{label}</p>
      <p className="num font-display text-sm font-bold text-magenta-texto">
        {payload[0].value}
        {sufixo}
      </p>
    </div>
  )
}

function Linha({
  rotulo,
  dados,
  cor,
}: {
  rotulo: string
  dados: { feitas: number; previstas: number; pct: number }
  cor: string
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="font-display text-sm font-bold">{rotulo}</span>
        <span className="num text-xs font-semibold text-cinza">
          {dados.feitas} de {dados.previstas}
        </span>
      </div>
      <BarraProgresso valor={dados.pct} cor={cor} altura={10} />
    </div>
  )
}
