import { AnimatePresence, motion } from 'framer-motion'
import { Flame } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  COMEMORACOES,
  FRASES_DO_DIA,
  TEMPO_NA_TELA,
  sementeDaData,
  sortear,
} from '../conteudo/mensagens'
import { DIA_SEM_FOTO, ELOGIOS_DO_DIA_COMPLETO, FECHOU_O_DIA } from '../conteudo/cartas'
import { estadoDaCarta } from '../lib/cartas'
import { AdicionarFotos, GradeDeFotos } from './GaleriaDeFotos'
import { useEstado } from '../data/estado'
import {
  CORRIDA_HORARIO,
  NATACAO_HORARIO,
  planoDoDia,
  umaCasa,
} from '../lib/calculos'
import { chuvaDeCoracoes, soltarConfete } from '../lib/confete'
import { dataPorExtenso, diffDias, somarDias } from '../lib/datas'
import { ehDiaPerfeito, fotoDe, pesoEm, tarefasDoDia } from '../lib/derivados'
import { diasDoDesafio } from '../lib/fase'
import { vibrar } from '../lib/feedback'
import { CartaoAgua } from './Agua'
import { CartinhaAberta, ChamadaDaCartinha, EnvelopeRecado } from './Envelope'
import { CartaoFoto } from './Fotos'
import { Botao, Campo, CheckCoracao, Etiqueta } from './ui'

const CARINHAS = ['😫', '😕', '🙂', '😄', '🥰']

export function TelaDoDia({
  data,
  aoFechar,
  aoIrParaTreino,
}: {
  data: string
  aoFechar: () => void
  aoIrParaTreino: () => void
}) {
  const { snap, hoje, agora, diaDe, metaAguaDe, salvarDia, salvarPeso, souIsabela, marcarRecadoLido } =
    useEstado()
  const plano = planoDoDia(data)
  const dia = diaDe(data)
  const tarefas = tarefasDoDia(data, dia, snap.fotos)
  const meta = metaAguaDe(data)
  const perfeito = ehDiaPerfeito(data, tarefas)
  const ehHoje = data === hoje
  const ehFuturo = diffDias(hoje, data) > 0
  /** dia que já passou não se mexe mais: fica de recordação, só pra ver */
  const encerrado = diffDias(hoje, data) < 0
  const somenteLeitura = !souIsabela || encerrado

  const indiceDoDia = useMemo(
    () => diasDoDesafio().find((d) => d.data === data)?.indice ?? 0,
    [data],
  )
  const { carta, liberada: cartaLiberada, aviso: avisoDaCarta } = estadoDaCarta(data, hoje, agora)
  const [cartinhaAberta, setCartinhaAberta] = useState(false)
  const [fechouODia, setFechouODia] = useState<(typeof FECHOU_O_DIA)[number] | null>(null)

  const temAlgumaFoto = snap.fotos.some((f) => f.data === data)
  const [semFoto, setSemFoto] = useState(false)
  const fotosDaGaleria = snap.fotos
    .filter((f) => f.data === data && f.tipo === 'galeria')
    .sort((a, b) => a.criado_em.localeCompare(b.criado_em))

  const frase = useMemo(
    () => sortear(FRASES_DO_DIA[plano.tipo], sementeDaData(data)),
    [plano.tipo, data],
  )

  const recados = snap.recados.filter((r) => r.data === data)

  // festa quando o dia fecha completo
  const jaFestejou = useRef(perfeito)
  const [festa, setFesta] = useState(false)
  useEffect(() => {
    if (perfeito && !jaFestejou.current) {
      jaFestejou.current = true
      setFesta(true)
      soltarConfete(130)
      chuvaDeCoracoes(40)
      vibrar([90, 60, 90, 60, 160])
      const t = setTimeout(() => setFesta(false), TEMPO_NA_TELA)
      return () => clearTimeout(t)
    }
    if (!perfeito) jaFestejou.current = false
  }, [perfeito])

  const selo =
    plano.tipo === 'folguinha'
      ? { texto: '💤 Folguinha', cor: '#FF7A85' }
      : plano.tipo === 'bonus'
        ? { texto: '⭐ Bônus — sem pressão', cor: '#C7A9FF' }
        : { texto: `💗 ${plano.legenda}`, cor: '#FF4D8D' }

  return (
    <div className="pb-6 pt-2">
      {/* cabeçalho do dia */}
      <div className="mb-1 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-extrabold first-letter:uppercase">
            {dataPorExtenso(data)}
          </h2>
          <p className="text-xs text-cinza">
            Dia {indiceDoDia} de 15{ehHoje ? ' · hoje 📍' : ''}
            {encerrado ? ' · encerrado 🔒' : ''}
          </p>
        </div>
        <Etiqueta texto={selo.texto} cor={selo.cor} className="mt-1 shrink-0" />
      </div>

      <p className="font-bilhete mb-4 text-xl text-rosa-500">{frase}</p>

      {encerrado && souIsabela && (
        <p className="mb-4 rounded-2xl bg-rosa-100 p-3 text-center text-xs leading-snug text-carvao/70">
          esse dia já fechou 🔒 — dá pra ver as fotinhas e reler a cartinha, mas não dá mais pra
          mexer 💗
        </p>
      )}

      <div className="space-y-3">
        {/* a cartinha do dia */}
        {carta && !ehFuturo && (
          <ChamadaDaCartinha
            cartinha={carta}
            trancada={!cartaLiberada}
            aviso={avisoDaCarta}
            aoAbrir={() => setCartinhaAberta(true)}
          />
        )}

        {/* recadinhos */}
        {recados.map((r) => (
          <EnvelopeRecado
            key={r.id}
            texto={r.texto}
            autor={r.autor_nome ?? 'Benjamin'}
            jaLido={r.lido && !souIsabela}
            aoAbrir={() => souIsabela && !r.lido && void marcarRecadoLido(r.id)}
          />
        ))}

        {/* corrida */}
        {plano.corrida && (
          <div className="cartao-solido p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🏃‍♀️</span>
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-[15px] font-bold">Corrida intervalada</h3>
                <p className="num text-xs font-semibold text-magenta-texto">
                  {CORRIDA_HORARIO} · 40 minutos
                </p>
                <p className="mt-0.5 text-xs text-cinza">
                  20 ciclos: 1 min caminhando + 1 min correndo
                </p>
              </div>
            </div>
            <CheckCoracao
              marcado={tarefas.corrida.feito}
              titulo="Fiz a corrida de hoje"
              somenteLeitura={somenteLeitura}
              aoMudar={(v) => void salvarDia(data, { corrida_ok: v })}
            />
            {souIsabela && ehHoje && !tarefas.corrida.feito && (
              <Botao
                className="mt-1 flex w-full items-center justify-center gap-2"
                onClick={() => {
                  aoFechar()
                  aoIrParaTreino()
                }}
              >
                <Flame size={18} /> Bora correr! 💗
              </Botao>
            )}
          </div>
        )}

        {/* bônus de sexta */}
        {plano.corridaBonus && (
          <div
            className="rounded-card p-4 shadow-rosa"
            style={{ background: 'linear-gradient(135deg,#FFF6E6 0%,#F4ECFF 100%)' }}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">⭐</span>
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-[15px] font-bold">Corridinha bônus</h3>
                <p className="mt-0.5 text-xs leading-snug text-carvao/70">
                  Hoje é opcional de verdade. Se você for, ganha estrelinha. Se não for, tá tudo
                  certo — nada muda por aqui 💗
                </p>
              </div>
            </div>
            <CheckCoracao
              tom="dourado"
              marcado={tarefas.bonus.feito}
              titulo="Fui correr! ⭐"
              descricao={CORRIDA_HORARIO}
              somenteLeitura={somenteLeitura}
              aoMudar={(v) => {
                void salvarDia(data, { bonus_sexta_ok: v })
                if (v) {
                  soltarConfete(110)
                  vibrar([80, 50, 120])
                }
              }}
            />
            {tarefas.bonus.feito && (
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-bilhete text-center text-xl text-dourado"
                style={{ color: '#C98A2B' }}
              >
                {COMEMORACOES.bonusFeito}
              </motion.p>
            )}
            {souIsabela && ehHoje && !tarefas.bonus.feito && (
              <Botao
                tipo="suave"
                className="mt-1 flex w-full items-center justify-center gap-2"
                onClick={() => {
                  aoFechar()
                  aoIrParaTreino()
                }}
              >
                <Flame size={17} /> Se eu quiser, abrir o cronômetro
              </Botao>
            )}
          </div>
        )}

        {/* natação */}
        {plano.natacao && (
          <div className="cartao-solido p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🏊‍♀️</span>
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-[15px] font-bold">Natação</h3>
                <p className="num text-xs font-semibold text-magenta-texto">
                  {NATACAO_HORARIO} · 45 minutos
                </p>
              </div>
            </div>
            <CheckCoracao
              marcado={tarefas.natacao.feito}
              titulo="Nadei hoje 🏊‍♀️"
              somenteLeitura={somenteLeitura}
              aoMudar={(v) => void salvarDia(data, { natacao_ok: v })}
            />
          </div>
        )}

        {/* folguinha */}
        {plano.tipo === 'folguinha' && (
          <div
            className="rounded-card p-4 text-center shadow-rosa"
            style={{ background: 'linear-gradient(135deg,#FFE3E6 0%,#FFF0F3 100%)' }}
          >
            <p className="text-3xl">💤</p>
            <p className="mt-1 font-display text-[15px] font-bold">Descanso merecido ❤️</p>
            <p className="mt-1 text-xs leading-snug text-carvao/70">
              Nada obrigatório hoje. Se quiser tirar a fotinha e registrar a água, pode — mas sem
              cobrança nenhuma.
            </p>
          </div>
        )}

        {/* água */}
        <CartaoAgua
          aguaMl={dia?.agua_ml ?? 0}
          metaMl={meta}
          somenteLeitura={somenteLeitura}
          aoRegistrar={(total) => void salvarDia(data, { agua_ml: total })}
        />

        {/* fotos */}
        <CartaoFoto
          titulo="📸 Foto do dia"
          descricao="Mesma pose, mesmo lugarzinho. É isso que faz o antes e depois ficar lindo."
          tipo="evolucao"
          data={data}
          foto={fotoDe(snap, data, 'evolucao')}
          fotoAnterior={fotoDe(snap, somarDias(data, -1), 'evolucao')}
          somenteLeitura={somenteLeitura}
        />

        {(plano.corrida || plano.corridaBonus) && (
          <>
            <CartaoFoto
              titulo="⌚ Foto do relógio"
              descricao="A telinha do relógio com o tempo, as calorias e os batimentos."
              tipo="relogio"
              data={data}
              foto={fotoDe(snap, data, 'relogio')}
              somenteLeitura={somenteLeitura}
            />
            {!somenteLeitura && (
              <div className="cartao-solido grid grid-cols-2 gap-3 p-4">
                <CampoNumero
                  rotulo="Calorias"
                  sufixo="kcal"
                  valor={dia?.calorias ?? null}
                  aoSalvar={(v) => void salvarDia(data, { calorias: v })}
                />
                <CampoNumero
                  rotulo="Batimentos"
                  sufixo="bpm"
                  valor={dia?.fc_media ?? null}
                  aoSalvar={(v) => void salvarDia(data, { fc_media: v })}
                />
              </div>
            )}
          </>
        )}

        {/* fotinhas do dia */}
        <div className="cartao-solido p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="font-display text-[15px] font-bold">📸 Fotinhas do dia</h3>
            {fotosDaGaleria.length > 0 && (
              <span className="rounded-pill bg-rosa-100 px-2.5 py-1 text-[11px] font-bold text-magenta-texto">
                {fotosDaGaleria.length}
              </span>
            )}
          </div>

          {fotosDaGaleria.length > 0 ? (
            <GradeDeFotos fotos={fotosDaGaleria} podeApagar={souIsabela} />
          ) : (
            <p className="rounded-2xl bg-rosa-50 p-3 text-center text-xs leading-snug text-cinza">
              manda quantas fotinhas quiser aqui, amor — todas ficam guardadas na Galeria 💗
            </p>
          )}

          {!somenteLeitura && (
            <div className="mt-3">
              <AdicionarFotos data={data} quantasJaTem={fotosDaGaleria.length} />
            </div>
          )}
        </div>

        {/* humor + anotação */}
        <div className="cartao-solido p-4">
          <h3 className="mb-2.5 font-display text-[15px] font-bold">Como me senti hoje</h3>
          <div className="flex justify-between gap-1.5">
            {CARINHAS.map((emoji, i) => {
              const nivel = i + 1
              const ativo = dia?.humor === nivel
              return (
                <motion.button
                  key={emoji}
                  type="button"
                  whileTap={{ scale: 0.88 }}
                  disabled={somenteLeitura}
                  onClick={() => {
                    vibrar(25)
                    void salvarDia(data, { humor: nivel })
                  }}
                  className={`grid h-14 flex-1 place-items-center rounded-2xl text-2xl transition-colors ${
                    ativo ? 'bg-rosa-100 ring-2 ring-rosa-400' : 'bg-rosa-50'
                  }`}
                  aria-label={`Carinha ${nivel} de 5`}
                >
                  {emoji}
                </motion.button>
              )
            })}
          </div>

          <div className="mt-4">
            <Anotacao
              valor={dia?.nota ?? ''}
              somenteLeitura={somenteLeitura}
              aoSalvar={(texto) => void salvarDia(data, { nota: texto })}
            />
          </div>
        </div>

        {/* peso */}
        {!somenteLeitura && <CartaoPeso data={data} aoSalvar={salvarPeso} />}

        {/* fechar o dia */}
        <FecharODia
          perfeito={perfeito}
          tarefas={tarefas}
          somenteLeitura={somenteLeitura}
          aoFechar={aoFechar}
          aoConcluir={async () => {
            const patch: Partial<typeof dia> = {}
            if (tarefas.corrida.aplicavel && !tarefas.corrida.feito) patch.corrida_ok = true
            if (tarefas.natacao.aplicavel && !tarefas.natacao.feito) patch.natacao_ok = true
            if (!tarefas.agua.feito) patch.agua_ml = Math.max(dia?.agua_ml ?? 0, meta)
            vibrar([60, 40, 90, 40, 140])
            await salvarDia(data, patch)
            if (temAlgumaFoto) {
              soltarConfete(150)
              chuvaDeCoracoes(45)
              setFechouODia(sortear(FECHOU_O_DIA, sementeDaData(data)))
            } else {
              setSemFoto(true)
            }
          }}
        />
      </div>

      {/* dia perfeito */}
      <AnimatePresence>
        {festa && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-0 z-[80] grid place-items-center bg-rosa-500/20 backdrop-blur-[2px]"
          >
            <motion.div
              initial={{ scale: 0.4, rotate: -8 }}
              animate={{ scale: 1, rotate: -2 }}
              transition={{ type: 'spring', stiffness: 200, damping: 12 }}
              className="mx-8 rounded-[26px] bg-white/95 px-7 py-6 text-center shadow-rosaForte"
            >
              <p className="font-manuscrita text-3xl leading-tight text-rosa-500">
                {COMEMORACOES.diaPerfeito}
              </p>
              <p className="font-bilhete mt-2 text-xl leading-snug text-carvao/80">
                {sortear(ELOGIOS_DO_DIA_COMPLETO, sementeDaData(data))}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {cartinhaAberta && carta && cartaLiberada && (
          <CartinhaAberta cartinha={carta} aoFechar={() => setCartinhaAberta(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {fechouODia && (
          <CartinhaAberta cartinha={fechouODia} aoFechar={() => setFechouODia(null)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {semFoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[92] grid place-items-center bg-carvao/45 px-7 backdrop-blur-[3px]"
          >
            <motion.div
              initial={{ scale: 0.7, y: 24 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 17 }}
              className="w-full max-w-xs rounded-[28px] bg-white p-6 text-center shadow-rosaForte"
            >
              <motion.p
                animate={{ rotate: [-3, 3, -3] }}
                transition={{ duration: 2.4, repeat: Infinity }}
                className="text-6xl"
              >
                🥺
              </motion.p>
              <p className="font-manuscrita mt-2 text-2xl leading-tight text-magenta-texto">
                {DIA_SEM_FOTO.titulo}
              </p>
              <p className="font-bilhete mt-3 whitespace-pre-line text-xl leading-snug text-carvao/80">
                {DIA_SEM_FOTO.texto}
              </p>
              <Botao className="mt-4 w-full" onClick={() => setSemFoto(false)}>
                vou mandar uma agora 📸
              </Botao>
              <button
                type="button"
                onClick={() => setSemFoto(false)}
                className="mt-1 w-full py-2 text-xs font-semibold text-cinza"
              >
                hoje não dá 🥺
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * O fecho do dia: marca de uma vez o que ela já fez e diz, sem cobrar,
 * o que ainda falta pro dia ficar perfeito.
 */
function FecharODia({
  perfeito,
  tarefas,
  somenteLeitura,
  aoConcluir,
  aoFechar,
}: {
  perfeito: boolean
  tarefas: ReturnType<typeof tarefasDoDia>
  somenteLeitura?: boolean
  aoConcluir: () => Promise<void>
  aoFechar: () => void
}) {
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const faltando = [
    tarefas.fotoEvolucao.aplicavel && !tarefas.fotoEvolucao.feito ? 'a fotinha do dia 📸' : null,
    tarefas.fotoRelogio.aplicavel && !tarefas.fotoRelogio.feito ? 'a foto do relógio ⌚' : null,
  ].filter(Boolean) as string[]

  if (somenteLeitura) {
    return (
      <Botao tipo="suave" className="w-full" onClick={aoFechar}>
        Fechar
      </Botao>
    )
  }

  if (perfeito) {
    return (
      <div
        className="rounded-card p-5 text-center shadow-rosa"
        style={{ background: 'linear-gradient(135deg,#FFE9B8 0%,#FFD9E8 100%)' }}
      >
        <p className="text-4xl">🏆</p>
        <p className="font-manuscrita mt-1 text-2xl text-magenta-texto">dia fechado 💗</p>
        <p className="mt-1 text-xs text-carvao/70">tudo que valia hoje está marcado</p>
        <Botao className="mt-3 w-full" onClick={aoFechar}>
          Voltar pro calendário
        </Botao>
      </div>
    )
  }

  return (
    <div className="cartao-solido p-4">
      <Botao
        className="w-full py-5 text-lg"
        desabilitado={salvando}
        onClick={async () => {
          setSalvando(true)
          setErro(null)
          try {
            await aoConcluir()
          } catch (e) {
            console.error(e)
            setErro(
              e instanceof Error
                ? `${e.message} — toca de novo 💗`
                : 'não consegui salvar agora. Confere a internet 💗',
            )
          } finally {
            setSalvando(false)
          }
        }}
      >
        {salvando ? 'marcando tudo…' : 'Concluir o dia 💗'}
      </Botao>

      <p className="mt-2 text-center text-[11px] leading-snug text-cinza">
        marca de uma vez o treino e a água do dia
      </p>

      {faltando.length > 0 && (
        <p className="mt-2 rounded-2xl bg-rosa-50 p-3 text-center text-xs leading-snug text-carvao/70">
          pro dia ficar perfeitinho ainda falta {faltando.join(' e ')} — sem pressa 💗
        </p>
      )}

      {erro && (
        <p className="mt-2 text-center text-sm font-semibold text-magenta-texto">{erro}</p>
      )}

      <Botao tipo="fantasma" className="mt-1 w-full text-sm" onClick={aoFechar}>
        fechar sem concluir
      </Botao>
    </div>
  )
}

function CampoNumero({
  rotulo,
  valor,
  sufixo,
  aoSalvar,
}: {
  rotulo: string
  valor: number | null
  sufixo: string
  aoSalvar: (v: number | null) => void
}) {
  const [texto, setTexto] = useState(valor?.toString() ?? '')
  useEffect(() => setTexto(valor?.toString() ?? ''), [valor])
  return (
    <label className="block">
      <span className="rotulo mb-1.5 block">{rotulo}</span>
      <span className="flex items-center gap-1 rounded-2xl border border-rosa-200 bg-white px-3 py-3">
        <input
          className="num w-full min-w-0 bg-transparent text-[17px] font-semibold outline-none"
          inputMode="numeric"
          value={texto}
          placeholder="—"
          onChange={(e) => setTexto(e.target.value.replace(/\D/g, ''))}
          onBlur={() => aoSalvar(texto === '' ? null : Number(texto))}
        />
        <span className="shrink-0 text-xs font-semibold text-cinza">{sufixo}</span>
      </span>
    </label>
  )
}

function Anotacao({
  valor,
  aoSalvar,
  somenteLeitura,
}: {
  valor: string
  aoSalvar: (v: string) => void
  somenteLeitura?: boolean
}) {
  const [texto, setTexto] = useState(valor)
  useEffect(() => setTexto(valor), [valor])

  if (somenteLeitura) {
    return (
      <>
        <span className="rotulo mb-1.5 block">Anotação do dia</span>
        <p className="font-bilhete rounded-2xl bg-rosa-50 p-3 text-xl text-carvao/80">
          {valor || 'sem anotação nesse dia'}
        </p>
      </>
    )
  }

  return (
    <label className="block">
      <span className="rotulo mb-1.5 block">Anotação do dia</span>
      <textarea
        value={texto}
        rows={2}
        maxLength={280}
        placeholder="escreve aqui como foi seu dia, amor"
        onChange={(e) => setTexto(e.target.value)}
        onBlur={() => aoSalvar(texto)}
        className="w-full resize-none rounded-2xl border border-rosa-200 bg-white p-3 text-[15px] outline-none focus:border-rosa-400"
      />
    </label>
  )
}

function CartaoPeso({
  data,
  aoSalvar,
}: {
  data: string
  aoSalvar: (data: string, kg: number) => Promise<void>
}) {
  const { snap } = useEstado()
  const registrado = snap.pesos.find((p) => p.data === data)
  const atual = pesoEm(snap, data)
  const [texto, setTexto] = useState('')
  const [aberto, setAberto] = useState(false)

  return (
    <div className="cartao-solido p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-[15px] font-bold">⚖️ Peso de hoje</h3>
          <p className="text-xs text-cinza">
            {registrado
              ? `você registrou ${umaCasa(registrado.peso_kg)} kg`
              : 'se quiser registrar — sem obrigação'}
          </p>
        </div>
        <Botao tipo="suave" className="px-4 py-2.5 text-sm" onClick={() => setAberto((v) => !v)}>
          {registrado ? 'Mudar' : 'Registrar'}
        </Botao>
      </div>

      <AnimatePresence>
        {aberto && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-3">
              <Campo
                rotulo="Peso"
                valor={texto}
                aoMudar={setTexto}
                tipo="decimal"
                sufixo="kg"
                placeholder={atual ? umaCasa(atual) : '00,0'}
              />
              <Botao
                className="mt-3 w-full"
                desabilitado={!texto}
                onClick={async () => {
                  const kg = Number(texto.replace(',', '.'))
                  if (!Number.isFinite(kg) || kg <= 0) return
                  await aoSalvar(data, kg)
                  setTexto('')
                  setAberto(false)
                  vibrar(40)
                }}
              >
                Salvar 💗
              </Botao>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
