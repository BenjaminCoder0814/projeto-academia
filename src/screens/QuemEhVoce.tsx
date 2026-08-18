import { motion } from 'framer-motion'
import { useState } from 'react'
import { Botao, FundoFofo } from '../components/ui'
import { useEstado } from '../data/estado'
import type { Papel } from '../lib/tipos'
import { vibrar } from '../lib/feedback'

/**
 * Modo servidor: não tem senha, tem só duas pessoas.
 * Cada celular escolhe uma vez quem está ali e pronto.
 */
export function QuemEhVoce() {
  const { cadastrar } = useEstado()
  const [ocupado, setOcupado] = useState<Papel | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  async function escolher(papel: Papel) {
    setErro(null)
    setOcupado(papel)
    vibrar(40)
    try {
      await cadastrar('', '', papel === 'isabela' ? 'Isabela' : 'Benjamin', papel)
    } catch (e) {
      setErro(
        e instanceof Error
          ? `${e.message} — o servidor está ligado?`
          : 'não consegui falar com o servidor',
      )
    } finally {
      setOcupado(null)
    }
  }

  return (
    <div className="relative min-h-dvh">
      <FundoFofo />
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 1.6, repeat: Infinity }}
            className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-[26px] text-4xl shadow-rosaForte"
            style={{ background: 'var(--gradiente)' }}
          >
            💗
          </motion.div>
          <h1 className="font-manuscrita text-2xl text-rosa-500">quem está aqui?</h1>
          <p className="font-bilhete text-xl text-carvao/70">
            é só escolher uma vez neste celular
          </p>
        </motion.div>

        <div className="space-y-3">
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            disabled={ocupado !== null}
            onClick={() => escolher('isabela')}
            className="cartao-solido flex w-full items-center gap-4 p-5 text-left disabled:opacity-60"
          >
            <span className="text-4xl">💪</span>
            <span>
              <span className="block font-display text-lg font-extrabold">Sou a Isabela</span>
              <span className="block text-xs text-cinza">
                marco os treinos, a água e as fotinhas
              </span>
            </span>
          </motion.button>

          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            disabled={ocupado !== null}
            onClick={() => escolher('benjamin')}
            className="cartao-solido flex w-full items-center gap-4 p-5 text-left disabled:opacity-60"
          >
            <span className="text-4xl">💗</span>
            <span>
              <span className="block font-display text-lg font-extrabold">Sou o Benjamin</span>
              <span className="block text-xs text-cinza">
                acompanho, mando recadinho e beijinho
              </span>
            </span>
          </motion.button>
        </div>

        {erro && <p className="mt-4 text-center text-sm font-semibold text-magenta-texto">{erro}</p>}

        {ocupado && (
          <p className="font-bilhete mt-4 text-center text-xl text-rosa-500">um instantinho…</p>
        )}

        <p className="mt-8 text-center text-[11px] leading-relaxed text-cinza">
          os dados ficam no banco que roda no computador de casa — os dois celulares veem o mesmo
        </p>

        <Botao
          tipo="fantasma"
          className="mt-2 w-full text-xs"
          onClick={() => window.location.reload()}
        >
          recarregar
        </Botao>
      </div>
    </div>
  )
}
