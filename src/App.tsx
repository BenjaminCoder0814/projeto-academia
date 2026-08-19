import { AnimatePresence, motion } from 'framer-motion'
import { Suspense, lazy, useEffect, useState } from 'react'
import { Cabecalho } from './components/Cabecalho'
import { ConviteInstalar } from './components/ConviteInstalar'
import { CarregandoTela, FundoFofo } from './components/ui'
import { COMEMORACOES } from './conteudo/mensagens'
import { useEstado } from './data/estado'
import { DESAFIO_FIM } from './lib/calculos'
import { TEM_SERVIDOR, TEM_SUPABASE } from './lib/config'
import { chuvaDeCoracoes } from './lib/confete'
import { diffDias } from './lib/datas'
import { vibrar } from './lib/feedback'
import { CalendarioTela } from './screens/CalendarioTela'
import { Entrar } from './screens/Entrar'
import { Onboarding } from './screens/Onboarding'
import { QuemEhVoce } from './screens/QuemEhVoce'
import { Splash } from './screens/Splash'
import { Treino } from './screens/Treino'

// telas mais pesadas entram sob demanda
const Evolucao = lazy(() => import('./screens/Evolucao').then((m) => ({ default: m.Evolucao })))
const Galeria = lazy(() => import('./screens/Galeria').then((m) => ({ default: m.Galeria })))
const Nos = lazy(() => import('./screens/Nos').then((m) => ({ default: m.Nos })))
const Final = lazy(() => import('./screens/Final').then((m) => ({ default: m.Final })))

type Aba = 'calendario' | 'treino' | 'galeria' | 'evolucao' | 'nos'

const ABAS: { id: Aba; rotulo: string; emoji: string }[] = [
  { id: 'calendario', rotulo: 'Calendário', emoji: '📅' },
  { id: 'treino', rotulo: 'Treino', emoji: '🏃‍♀️' },
  { id: 'galeria', rotulo: 'Galeria', emoji: '📸' },
  { id: 'evolucao', rotulo: 'Evolução', emoji: '📈' },
  { id: 'nos', rotulo: 'Nós', emoji: '💗' },
]

const CHAVE_FINAL = 'projetinho:final-visto'

export function App() {
  const { pronto, perfil, souIsabela, snap, hoje } = useEstado()
  const [splash, setSplash] = useState(true)
  const [aba, setAba] = useState<Aba>('calendario')
  const [final, setFinal] = useState(false)

  const desafioFechou = diffDias(DESAFIO_FIM, hoje) >= 0

  useEffect(() => {
    if (!perfil || !desafioFechou) return
    if (localStorage.getItem(CHAVE_FINAL)) return
    setFinal(true)
  }, [perfil, desafioFechou])

  return (
    <>
      <AnimatePresence>{splash && <Splash aoTerminar={() => setSplash(false)} />}</AnimatePresence>

      {!pronto ? (
        <div className="relative min-h-dvh">
          <FundoFofo />
          <CarregandoTela />
        </div>
      ) : !perfil ? (
        // nuvem pede login; servidor de casa pergunta só quem é você;
        // sem nenhum dos dois, o app guarda no próprio aparelho
        TEM_SUPABASE ? (
          <Entrar />
        ) : TEM_SERVIDOR ? (
          <QuemEhVoce />
        ) : (
          <Onboarding />
        )
      ) : souIsabela && (!perfil.altura_cm || !perfil.peso_inicial_kg) ? (
        <Onboarding />
      ) : (
        <div className="relative min-h-dvh overflow-x-hidden">
          <FundoFofo />

          <div className="relative z-20 mx-auto w-full max-w-md">
            <Cabecalho />
          </div>

          <AnimatePresence mode="wait">
            <motion.main
              key={aba}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="mx-auto w-full max-w-md"
            >
              {!souIsabela && !snap.perfilIsabela ? (
                <div className="relative z-10 px-6 pt-24 text-center">
                  <p className="mb-3 text-5xl">💗</p>
                  <h1 className="font-display text-xl font-extrabold">quase lá</h1>
                  <p className="font-bilhete mt-2 text-xl text-carvao/70">
                    assim que a Isabela terminar o cadastro dela, tudo aparece aqui pra você
                  </p>
                </div>
              ) : (
                <Suspense fallback={<CarregandoTela />}>
                  {aba === 'calendario' && (
                    <CalendarioTela aoIrParaTreino={() => setAba('treino')} />
                  )}
                  {aba === 'treino' && <Treino />}
                  {aba === 'galeria' && <Galeria />}
                  {aba === 'evolucao' && <Evolucao />}
                  {aba === 'nos' && <Nos />}
                </Suspense>
              )}
            </motion.main>
          </AnimatePresence>

          <ConviteInstalar />
          <OuvidorDeBeijinhos />

          <nav className="area-segura-baixo fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md">
            <div className="mx-3 mb-3 flex items-center justify-around rounded-[26px] border border-white/70 bg-white/90 p-1.5 shadow-rosaForte backdrop-blur-xl">
              {ABAS.map((a) => {
                const ativa = aba === a.id
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      vibrar(12)
                      setAba(a.id)
                    }}
                    aria-label={a.rotulo}
                    aria-current={ativa ? 'page' : undefined}
                    className="relative flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 rounded-[20px] px-0.5 py-1.5"
                  >
                    {ativa && (
                      <motion.span
                        layoutId="aba-ativa"
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                        className="absolute inset-0 rounded-[20px] bg-rosa-100"
                      />
                    )}
                    <span className="relative z-10 text-[15px] leading-none">{a.emoji}</span>
                    <span
                      className={`relative z-10 font-display text-[9px] font-bold leading-tight ${
                        ativa ? 'text-rosa-500' : 'text-cinza'
                      }`}
                    >
                      {a.rotulo}
                    </span>
                  </button>
                )
              })}
            </div>
          </nav>

          <AnimatePresence>
            {final && (
              <Suspense fallback={null}>
                <Final
                  aoFechar={() => {
                    localStorage.setItem(CHAVE_FINAL, '1')
                    setFinal(false)
                  }}
                />
              </Suspense>
            )}
          </AnimatePresence>
        </div>
      )}
    </>
  )
}

/** Quando chega um beijinho do outro, cai chuva de coração aqui. */
function OuvidorDeBeijinhos() {
  const { snap, perfil, marcarBeijinhosVistos, souIsabela } = useEstado()
  const [aviso, setAviso] = useState(false)

  const novos = snap.beijinhos.filter((b) => !b.visto && b.autor_id !== perfil?.id)

  useEffect(() => {
    if (!novos.length) return
    chuvaDeCoracoes(55)
    vibrar([50, 60, 50, 60, 90])
    setAviso(true)
    void marcarBeijinhosVistos(novos.map((b) => b.id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [novos.length])

  // o aviso some sozinho — o timer vive separado pra não ser cancelado
  // quando a lista de beijinhos novos zera logo depois de marcar como visto
  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(false), 3400)
    return () => clearTimeout(t)
  }, [aviso])

  return (
    <AnimatePresence>
      {aviso && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="pointer-events-none fixed inset-x-6 top-24 z-[85] mx-auto max-w-xs rounded-card bg-white/95 p-4 text-center shadow-rosaForte"
        >
          <p className="text-3xl">😘</p>
          <p className="font-bilhete mt-1 text-xl text-rosa-500">
            {souIsabela ? COMEMORACOES.beijinho : 'a Isabela te mandou um beijinho 😘'}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
