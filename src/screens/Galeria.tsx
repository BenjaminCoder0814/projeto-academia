import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { AdicionarFotos, GradeDeFotos } from '../components/GaleriaDeFotos'
import { Cartao, Tela } from '../components/ui'
import { useEstado } from '../data/estado'
import { planoDoDia } from '../lib/calculos'
import { dataPorExtenso, diffDias } from '../lib/datas'
import { diasDoDesafio } from '../lib/fase'

/** A galeria do desafio: um álbum por dia, do mais novo pro mais antigo. */
export function Galeria() {
  const { snap, hoje, souIsabela } = useEstado()
  const [soComFoto, setSoComFoto] = useState(false)

  const dias = useMemo(() => {
    const ateHoje = diasDoDesafio().filter((d) => diffDias(hoje, d.data) <= 0)
    return ateHoje
      .map((d) => ({
        ...d,
        fotos: snap.fotos
          .filter((f) => f.data === d.data)
          .sort((a, b) => a.criado_em.localeCompare(b.criado_em)),
      }))
      .reverse()
  }, [snap.fotos, hoje])

  const total = snap.fotos.length
  const visiveis = soComFoto ? dias.filter((d) => d.fotos.length > 0) : dias

  return (
    <Tela>
      <div className="px-1">
        <h1 className="font-manuscrita text-2xl text-rosa-500">a galeria de vocês 📸</h1>
        <p className="font-bilhete text-xl text-carvao/70">
          {total === 0
            ? 'as fotinhas de cada dia vão aparecer aqui'
            : `${total} ${total === 1 ? 'fotinha guardada' : 'fotinhas guardadas'} até agora 💗`}
        </p>
      </div>

      {total > 0 && (
        <button
          type="button"
          onClick={() => setSoComFoto((v) => !v)}
          className="mx-1 self-start rounded-pill bg-rosa-100 px-4 py-2 text-xs font-semibold text-magenta-texto"
        >
          {soComFoto ? 'mostrar todos os dias' : 'mostrar só os dias com fotinha'}
        </button>
      )}

      {visiveis.map((d) => {
        const plano = planoDoDia(d.data)
        const ehHoje = d.data === hoje
        const encerrado = diffDias(hoje, d.data) < 0
        return (
          <Cartao key={d.data} className={ehHoje ? 'ring-2 ring-rosa-300' : ''}>
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display text-base font-bold first-letter:uppercase">
                  {dataPorExtenso(d.data)}
                </p>
                <p className="text-xs text-cinza">
                  Dia {d.indice} de 15 · {plano.legenda}
                  {ehHoje ? ' · hoje 📍' : ''}
                  {encerrado ? ' · encerrado 🔒' : ''}
                </p>
              </div>
              {d.fotos.length > 0 && (
                <span className="shrink-0 rounded-pill bg-rosa-100 px-2.5 py-1 text-[11px] font-bold text-magenta-texto">
                  {d.fotos.length} 📸
                </span>
              )}
            </div>

            {d.fotos.length > 0 ? (
              <GradeDeFotos fotos={d.fotos} podeApagar={souIsabela && !encerrado} />
            ) : (
              <p className="rounded-2xl bg-rosa-50 p-4 text-center text-xs text-cinza">
                nenhuma fotinha nesse dia ainda 🌸
              </p>
            )}

            {souIsabela && !encerrado && (
              <div className="mt-3">
                <AdicionarFotos
                  data={d.data}
                  quantasJaTem={d.fotos.length}
                  rotulo={d.fotos.length ? 'Adicionar mais 📸' : 'Adicionar fotinhas 📸'}
                />
              </div>
            )}
          </Cartao>
        )
      })}

      {visiveis.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="cartao-solido p-8 text-center"
        >
          <p className="text-5xl">🌸</p>
          <p className="font-bilhete mt-2 text-xl text-carvao/70">
            ainda não tem fotinha nenhuma por aqui
          </p>
        </motion.div>
      )}
    </Tela>
  )
}
