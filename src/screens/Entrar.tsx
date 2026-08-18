import { motion } from 'framer-motion'
import { useState } from 'react'
import { useEstado } from '../data/estado'
import type { Papel } from '../lib/tipos'
import { Botao, Campo, FundoFofo } from '../components/ui'

export function Entrar() {
  const { entrar, cadastrar } = useEstado()
  const [modo, setModo] = useState<'entrar' | 'criar'>('entrar')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [nome, setNome] = useState('')
  const [papel, setPapel] = useState<Papel>('isabela')
  const [erro, setErro] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setOcupado(true)
    try {
      if (modo === 'entrar') await entrar(email.trim(), senha)
      else
        await cadastrar(
          email.trim(),
          senha,
          nome.trim() || (papel === 'isabela' ? 'Isabela' : 'Benjamin'),
          papel,
        )
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não deu certo 🥺 tenta de novo')
    } finally {
      setOcupado(false)
    }
  }

  return (
    <div className="relative min-h-dvh">
      <FundoFofo />
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-7 text-center"
        >
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 1.6, repeat: Infinity }}
            className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-[26px] text-4xl shadow-rosaForte"
            style={{ background: 'var(--gradiente)' }}
          >
            💗
          </motion.div>
          <h1 className="font-manuscrita text-2xl text-rosa-500">Projetinho</h1>
          <p className="font-bilhete text-xl text-carvao/70">de Benjamin pra Isabela</p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={enviar}
          className="cartao-solido space-y-4 p-5"
        >
          {modo === 'criar' && (
            <>
              <Campo rotulo="Seu nome" valor={nome} aoMudar={setNome} placeholder="como te chamam" />
              <div>
                <span className="rotulo mb-1.5 block">Quem está entrando?</span>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { p: 'isabela' as Papel, texto: 'Sou a Isabela 💪' },
                      { p: 'benjamin' as Papel, texto: 'Sou o Benjamin 💗' },
                    ]
                  ).map(({ p, texto }) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPapel(p)}
                      className={`rounded-2xl border-2 px-3 py-3 text-sm font-semibold transition-colors toque ${
                        papel === p
                          ? 'border-rosa-500 bg-rosa-100 text-rosa-500'
                          : 'border-rosa-200 bg-white text-cinza'
                      }`}
                    >
                      {texto}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <Campo rotulo="E-mail" valor={email} aoMudar={setEmail} tipo="email" placeholder="voce@email.com" />
          <Campo rotulo="Senha" valor={senha} aoMudar={setSenha} tipo="senha" placeholder="pelo menos 6 letrinhas" />

          {erro && <p className="text-sm font-semibold text-magenta-texto">{erro}</p>}

          <Botao submit className="w-full" desabilitado={ocupado}>
            {ocupado ? 'um instantinho…' : modo === 'entrar' ? 'Entrar 💗' : 'Criar minha conta'}
          </Botao>

          <button
            type="button"
            onClick={() => {
              setModo(modo === 'entrar' ? 'criar' : 'entrar')
              setErro(null)
            }}
            className="w-full py-2 text-sm font-semibold text-magenta-texto"
          >
            {modo === 'entrar' ? 'ainda não tenho conta' : 'já tenho conta, quero entrar'}
          </button>
        </motion.form>

        <p className="font-bilhete mt-6 text-center text-lg text-carvao/70">
          18 de agosto a 1º de setembro 🌸
        </p>
      </div>
    </div>
  )
}
