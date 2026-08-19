import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { AdicionarFotos, GradeDeFotos, RecadoFlutuante } from '../components/GaleriaDeFotos'
import { Cartao, Tela } from '../components/ui'
import { BRONCAS } from '../conteudo/cartas'
import { sortear } from '../conteudo/mensagens'
import { useEstado } from '../data/estado'
import { dataPorExtenso, diffDias, horaEmBrasilia } from '../lib/datas'
import { diasDoDesafio } from '../lib/fase'
import { REFEICOES, type TipoRefeicao } from '../lib/tipos'

/**
 * A galeria das refeições: café da manhã, almoço e janta, dia por dia.
 * Se ela pular uma refeição e postar a de depois, leva bronca fofa.
 */
export function Refeicoes() {
  const { snap, hoje, agora, souIsabela } = useEstado()
  const [bronca, setBronca] = useState<string | null>(null)

  const dias = useMemo(() => {
    return diasDoDesafio()
      .filter((d) => diffDias(hoje, d.data) <= 0)
      .map((d) => ({
        ...d,
        porRefeicao: Object.fromEntries(
          REFEICOES.map((r) => [
            r.tipo,
            snap.fotos
              .filter((f) => f.data === d.data && f.tipo === r.tipo)
              .sort((a, b) => a.criado_em.localeCompare(b.criado_em)),
          ]),
        ) as Record<TipoRefeicao, typeof snap.fotos>,
      }))
      .reverse()
  }, [snap.fotos, hoje])

  const deHoje = dias.find((d) => d.data === hoje)
  const hora = horaEmBrasilia(agora)
  const semCafeAindaHoje =
    Boolean(deHoje) && deHoje!.porRefeicao.cafe.length === 0 && hora >= 10 && hora < 22

  /** Antes de mandar a foto, confere se ela pulou a refeição anterior. */
  function conferirOrdem(tipo: TipoRefeicao, porRefeicao: Record<TipoRefeicao, unknown[]>) {
    if (tipo === 'almoco' && porRefeicao.cafe.length === 0) {
      setBronca(sortear(BRONCAS.semCafe, Date.now()))
      return
    }
    if (tipo === 'janta' && porRefeicao.almoco.length === 0) {
      setBronca(sortear(BRONCAS.semAlmoco, Date.now()))
      return
    }
    // as três no capricho merece elogio
    const total =
      porRefeicao.cafe.length + porRefeicao.almoco.length + porRefeicao.janta.length
    if (tipo === 'janta' && porRefeicao.cafe.length && porRefeicao.almoco.length && total >= 2) {
      setBronca(sortear(BRONCAS.tudoCerto, Date.now()))
    }
  }

  return (
    <Tela>
      <div className="px-1">
        <h1 className="font-manuscrita text-2xl text-rosa-500">as refeições 🍽️</h1>
        <p className="font-bilhete text-xl text-carvao/70">
          café da manhã, almoço e janta — quero ver as três 💗
        </p>
      </div>

      {semCafeAindaHoje && souIsabela && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-card p-4 text-center shadow-rosa"
          style={{ background: 'linear-gradient(135deg,#FFE9B8 0%,#FFD9E8 100%)' }}
        >
          <p className="text-3xl">🥺</p>
          <p className="font-bilhete mt-1 text-xl leading-snug text-carvao/80">
            {sortear(BRONCAS.cafeAtrasado, Number(hoje.split('-').join('')))}
          </p>
        </motion.div>
      )}

      {dias.map((d) => {
        const encerrado = diffDias(hoje, d.data) < 0
        const feitas = REFEICOES.filter((r) => d.porRefeicao[r.tipo].length > 0).length
        return (
          <Cartao key={d.data} className={d.data === hoje ? 'ring-2 ring-rosa-300' : ''}>
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display text-base font-bold first-letter:uppercase">
                  {dataPorExtenso(d.data)}
                </p>
                <p className="text-xs text-cinza">
                  Dia {d.indice} de 15{d.data === hoje ? ' · hoje 📍' : ''}
                  {encerrado ? ' · encerrado 🔒' : ''}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-pill px-2.5 py-1 text-[11px] font-bold ${
                  feitas === 3 ? 'bg-verde/20 text-[#2F8A50]' : 'bg-rosa-100 text-magenta-texto'
                }`}
              >
                {feitas}/3 {feitas === 3 ? '🥰' : '🍽️'}
              </span>
            </div>

            <div className="space-y-3">
              {REFEICOES.map((r) => {
                const fotos = d.porRefeicao[r.tipo]
                return (
                  <div key={r.tipo} className="rounded-2xl bg-rosa-50 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="font-display text-sm font-bold">
                        {r.emoji} {r.nome}
                      </p>
                      {fotos.length > 0 && (
                        <span className="num text-[11px] font-bold text-magenta-texto">
                          {fotos.length} 📸
                        </span>
                      )}
                    </div>

                    {fotos.length > 0 ? (
                      <GradeDeFotos fotos={fotos} podeApagar={souIsabela && !encerrado} />
                    ) : (
                      <p className="py-1 text-center text-[11px] text-cinza">
                        {encerrado ? 'esse dia passou sem foto dessa refeição' : 'ainda não 🌸'}
                      </p>
                    )}

                    {souIsabela && !encerrado && (
                      <div className="mt-2">
                        <AdicionarFotos
                          data={d.data}
                          tipo={r.tipo}
                          quantasJaTem={fotos.length}
                          rotulo={fotos.length ? 'mandar mais' : `mandar o ${r.nome.toLowerCase()}`}
                          semDica
                          aoTerminar={() => conferirOrdem(r.tipo, d.porRefeicao)}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </Cartao>
        )
      })}

      <AnimatePresence>
        <RecadoFlutuante
          aberto={Boolean(bronca)}
          emoji="🥺"
          texto={bronca}
          aoFechar={() => setBronca(null)}
        />
      </AnimatePresence>
    </Tela>
  )
}
