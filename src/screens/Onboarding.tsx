import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Minus, Plus } from 'lucide-react'
import { useState } from 'react'
import { useEstado } from '../data/estado'
import {
  calcularIMC,
  classificarIMC,
  faixaSaudavel,
  idadeDaIsabela,
  litros,
  metaAguaDoDia,
  metaDePeso,
  umaCasa,
} from '../lib/calculos'
import { soltarConfete } from '../lib/confete'
import { vibrar } from '../lib/feedback'
import { SeletorRolagem } from '../components/SeletorRolagem'
import { Botao, Campo, Etiqueta, FundoFofo, NumeroAnimado } from '../components/ui'

type Passo = 'nome' | 'altura' | 'peso' | 'revelacao'

export function Onboarding() {
  const { perfil, salvarPerfil, salvarPeso, hoje } = useEstado()
  const [passo, setPasso] = useState<Passo>('nome')
  const [nome, setNome] = useState(perfil?.nome ?? 'Isabela')
  const [altura, setAltura] = useState(perfil?.altura_cm ?? 165)
  const [peso, setPeso] = useState(perfil?.peso_inicial_kg ?? 75)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const idade = idadeDaIsabela()
  const imc = calcularIMC(peso, altura)
  const classe = classificarIMC(imc)
  const faixa = faixaSaudavel(altura)
  const meta = metaDePeso(altura)
  const metaAgua = metaAguaDoDia(peso, hoje)

  async function concluir() {
    setSalvando(true)
    setErro(null)
    try {
      await salvarPerfil({
        nome: nome.trim() || 'Isabela',
        altura_cm: altura,
        peso_inicial_kg: peso,
        data_nascimento: '2007-05-25',
      })
      await salvarPeso(hoje, peso)
      soltarConfete(130)
    } catch (e) {
      console.error('não deu pra salvar o começo', e)
      setErro(
        e instanceof Error
          ? `${e.message} — toca de novo pra tentar 💗`
          : 'não consegui salvar agora. Confere a internet e toca de novo 💗',
      )
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <FundoFofo />
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-8">
        <AnimatePresence mode="wait">
          {passo === 'nome' && (
            <PassoBase
              key="nome"
              titulo="Oi, amor 💗"
              subtitulo="como você quer que o app te chame?"
              aoAvancar={() => setPasso('altura')}
              podeAvancar={nome.trim().length > 0}
            >
              <Campo rotulo="Seu nome" valor={nome} aoMudar={setNome} placeholder="Isabela" autoFoco />
            </PassoBase>
          )}

          {passo === 'altura' && (
            <PassoBase
              key="altura"
              titulo="Qual sua altura?"
              subtitulo="deslize pra escolher 🌸"
              aoAvancar={() => setPasso('peso')}
              podeAvancar
            >
              <div className="rounded-card bg-white p-4">
                <SeletorRolagem min={130} max={200} valor={altura} aoMudar={setAltura} sufixo="cm" />
              </div>
            </PassoBase>
          )}

          {passo === 'peso' && (
            <PassoBase
              key="peso"
              titulo="E o peso de hoje?"
              subtitulo="esse vira o pontinho de partida — daqui é só evolução"
              aoAvancar={() => setPasso('revelacao')}
              podeAvancar
            >
              <div className="rounded-card bg-white p-5">
                <div className="flex items-center justify-between gap-3">
                  <BotaoPasso
                    icone={<Minus size={22} />}
                    aoTocar={() => setPeso((p) => Math.max(30, +(p - 0.1).toFixed(1)))}
                  />
                  <div className="text-center">
                    <span className="num font-display text-5xl font-extrabold text-rosa-500">
                      {umaCasa(peso)}
                    </span>
                    <span className="ml-1 font-display text-xl font-bold text-cinza">kg</span>
                  </div>
                  <BotaoPasso
                    icone={<Plus size={22} />}
                    aoTocar={() => setPeso((p) => Math.min(250, +(p + 0.1).toFixed(1)))}
                  />
                </div>
                <input
                  type="range"
                  min={35}
                  max={160}
                  step={0.5}
                  value={peso}
                  onChange={(e) => setPeso(Number(e.target.value))}
                  className="mt-5 w-full"
                  aria-label="Peso em quilos"
                />
              </div>
            </PassoBase>
          )}

          {passo === 'revelacao' && (
            <motion.div
              key="revelacao"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-1 flex-col justify-center gap-3 py-6"
            >
              <h2 className="font-manuscrita text-center text-3xl text-rosa-500">
                prontinho, {nome.trim() || 'amor'}
              </h2>
              <p className="font-bilhete mb-2 text-center text-xl text-carvao/70">
                esses são os seus numerinhos de partida
              </p>

              <div className="grid grid-cols-2 gap-3">
                <Bloco titulo="Idade">
                  <NumeroAnimado valor={idade} className="text-4xl" />{' '}
                  <span className="text-lg">anos</span>
                </Bloco>
                <Bloco titulo="IMC">
                  <NumeroAnimado valor={imc} casas={1} className="text-4xl" />
                  <div className="mt-1">
                    <Etiqueta texto={classe.rotulo} cor={classe.cor} />
                  </div>
                </Bloco>
              </div>

              <Bloco titulo="Faixa saudável">
                <span className="num text-3xl">
                  {umaCasa(faixa.min)} – {umaCasa(faixa.max)} <span className="text-lg">kg</span>
                </span>
                <p className="mt-2 text-xs font-normal text-cinza">
                  a metinha da barrinha:{' '}
                  <strong className="text-rosa-500">{umaCasa(meta)} kg</strong> — sem pressa e sem
                  pressão 💗
                </p>
              </Bloco>

              <Bloco titulo="Água de hoje">
                <NumeroAnimado valor={metaAgua / 1000} casas={1} className="text-4xl" />{' '}
                <span className="text-lg">litros</span>
                <p className="mt-2 text-xs font-normal text-cinza">
                  recalculada todo dia conforme o treino — hoje são {litros(metaAgua)} L.
                </p>
              </Bloco>

              <Botao className="mt-3 w-full" onClick={concluir} desabilitado={salvando}>
                {salvando ? 'preparando tudo…' : 'Bora começar 💗'}
              </Botao>

              {erro && (
                <p className="rounded-2xl bg-white/80 p-3 text-center text-sm font-semibold text-magenta-texto">
                  {erro}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function PassoBase({
  titulo,
  subtitulo,
  children,
  aoAvancar,
  podeAvancar,
}: {
  titulo: string
  subtitulo: string
  children: React.ReactNode
  aoAvancar: () => void
  podeAvancar: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="flex flex-1 flex-col justify-center gap-5"
    >
      <div>
        <h2 className="font-display text-2xl font-extrabold">{titulo}</h2>
        <p className="font-bilhete mt-1 text-xl text-carvao/70">{subtitulo}</p>
      </div>
      {children}
      <Botao
        className="flex w-full items-center justify-center gap-2"
        onClick={() => {
          vibrar(30)
          aoAvancar()
        }}
        desabilitado={!podeAvancar}
      >
        Continuar <ArrowRight size={18} />
      </Botao>
    </motion.div>
  )
}

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="cartao-solido p-4"
    >
      <p className="rotulo mb-1">{titulo}</p>
      <div className="font-display font-extrabold text-carvao">{children}</div>
    </motion.div>
  )
}

function BotaoPasso({ icone, aoTocar }: { icone: React.ReactNode; aoTocar: () => void }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.9 }}
      onClick={() => {
        vibrar(15)
        aoTocar()
      }}
      className="grid h-12 w-12 place-items-center rounded-full bg-rosa-100 text-rosa-500"
    >
      {icone}
    </motion.button>
  )
}
