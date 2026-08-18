import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { TEM_SERVIDOR, TEM_SUPABASE } from '../lib/config'
import { hojeISO } from '../lib/datas'
import { metaAguaDoDia } from '../lib/calculos'
import { pesoEm } from '../lib/derivados'
import { snapshotVazio, type Dia, type Papel, type Perfil, type Snapshot, type TipoFoto } from '../lib/tipos'
import type { Repo } from './repo'
import { repoLocal } from './repoLocal'

type Estado = {
  repo: Repo
  remoto: boolean
  pronto: boolean
  perfil: Perfil | null
  souIsabela: boolean
  snap: Snapshot
  hoje: string
  metaAguaDe: (data: string) => number
  diaDe: (data: string) => Dia | undefined
  recarregar: () => Promise<void>
  entrar: (email: string, senha: string) => Promise<void>
  cadastrar: (email: string, senha: string, nome: string, papel: Papel) => Promise<void>
  sair: () => Promise<void>
  salvarPerfil: (patch: Partial<Perfil>) => Promise<void>
  salvarPeso: (data: string, kg: number) => Promise<void>
  salvarDia: (data: string, patch: Partial<Dia>) => Promise<void>
  enviarFoto: (data: string, tipo: TipoFoto, arquivo: Blob) => Promise<void>
  urlDaFoto: (caminho: string) => Promise<string>
  enviarRecado: (data: string, texto: string) => Promise<void>
  marcarRecadoLido: (id: string) => Promise<void>
  mandarBeijinho: () => Promise<void>
  marcarBeijinhosVistos: (ids: string[]) => Promise<void>
}

const Ctx = createContext<Estado | null>(null)

export function ProvedorEstado({ children }: { children: ReactNode }) {
  const [repo, setRepo] = useState<Repo>(repoLocal)
  const [pronto, setPronto] = useState(false)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [snap, setSnap] = useState<Snapshot>(snapshotVazio)
  const [hoje, setHoje] = useState(hojeISO())
  const repoRef = useRef<Repo>(repoLocal)
  const snapRef = useRef<Snapshot>(snapshotVazio)

  snapRef.current = snap

  // escolhe onde os dados vivem: nuvem > servidor de casa > aparelho
  useEffect(() => {
    let vivo = true
    ;(async () => {
      let escolhido: Repo = repoLocal
      if (TEM_SUPABASE) {
        const { repoSupabase } = await import('./repoSupabase')
        escolhido = repoSupabase
      } else if (TEM_SERVIDOR) {
        const { repoServidor } = await import('./repoServidor')
        escolhido = repoServidor
      }
      if (!vivo) return
      repoRef.current = escolhido
      setRepo(escolhido)
      try {
        const p = await escolhido.sessao()
        if (vivo) setPerfil(p)
      } catch {
        /* sessão inválida: segue deslogado */
      }
      if (vivo) setPronto(true)
    })()
    return () => {
      vivo = false
    }
  }, [])

  const recarregar = useCallback(async () => {
    try {
      setSnap(await repoRef.current.carregar())
    } catch (e) {
      console.error('Falha ao carregar', e)
    }
  }, [])

  useEffect(() => {
    if (!pronto) return
    return repo.aoMudarSessao((p) => setPerfil(p))
  }, [repo, pronto])

  useEffect(() => {
    if (!pronto || !perfil) {
      setSnap(snapshotVazio)
      return
    }
    void recarregar()
    const parar = repo.aoMudarDados(() => void recarregar())
    const aoVoltar = () => void recarregar()
    window.addEventListener('online', aoVoltar)
    document.addEventListener('visibilitychange', aoVoltar)
    return () => {
      parar()
      window.removeEventListener('online', aoVoltar)
      document.removeEventListener('visibilitychange', aoVoltar)
    }
  }, [repo, pronto, perfil, recarregar])

  // a virada da meia-noite de Brasília troca o dia sozinha
  useEffect(() => {
    const t = setInterval(() => {
      const agora = hojeISO()
      setHoje((antigo) => (antigo === agora ? antigo : agora))
    }, 60_000)
    return () => clearInterval(t)
  }, [])

  const souIsabela = perfil?.papel === 'isabela'
  const isabela = snap.perfilIsabela ?? (souIsabela ? perfil : null)

  const metaAguaDe = useCallback(
    (data: string) => {
      const s = snapRef.current
      const peso = pesoEm(s, data) ?? isabela?.peso_inicial_kg ?? 70
      const bonus = Boolean(s.dias.find((d) => d.data === data)?.bonus_sexta_ok)
      return metaAguaDoDia(peso, data, bonus)
    },
    [isabela],
  )

  const diaDe = useCallback((data: string) => snap.dias.find((d) => d.data === data), [snap.dias])

  const valor = useMemo<Estado>(
    () => ({
      repo,
      remoto: repo.remoto,
      pronto,
      perfil,
      souIsabela,
      snap,
      hoje,
      metaAguaDe,
      diaDe,
      recarregar,
      entrar: async (email, senha) => {
        await repo.entrar(email, senha)
        setPerfil(await repo.sessao())
      },
      cadastrar: async (email, senha, nome, papel) => {
        await repo.cadastrar(email, senha, nome, papel)
        setPerfil(await repo.sessao())
      },
      sair: async () => {
        await repo.sair()
        setPerfil(null)
      },
      salvarPerfil: async (patch) => {
        const p = await repo.salvarPerfil(patch)
        setPerfil(p)
        await recarregar()
      },
      salvarPeso: async (data, kg) => {
        await repo.salvarPeso(data, kg)
        await recarregar()
      },
      salvarDia: async (data, patch) => {
        // o bônus de sexta muda a meta de água na hora
        const s = snapRef.current
        const atual = s.dias.find((d) => d.data === data)
        const bonus = patch.bonus_sexta_ok ?? atual?.bonus_sexta_ok ?? false
        const peso = pesoEm(s, data) ?? isabela?.peso_inicial_kg ?? 70
        await repo.salvarDia(data, patch, metaAguaDoDia(peso, data, bonus))
        await recarregar()
      },
      enviarFoto: async (data, tipo, arquivo) => {
        await repo.enviarFoto(data, tipo, arquivo)
        await recarregar()
      },
      urlDaFoto: (caminho) => repo.urlDaFoto(caminho),
      enviarRecado: async (data, texto) => {
        await repo.enviarRecado(data, texto)
        await recarregar()
      },
      marcarRecadoLido: async (id) => {
        await repo.marcarRecadoLido(id)
        await recarregar()
      },
      mandarBeijinho: async () => {
        await repo.mandarBeijinho()
        await recarregar()
      },
      marcarBeijinhosVistos: async (ids) => {
        await repo.marcarBeijinhosVistos(ids)
        await recarregar()
      },
    }),
    [repo, pronto, perfil, souIsabela, snap, hoje, metaAguaDe, diaDe, recarregar, isabela],
  )

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>
}

export function useEstado(): Estado {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useEstado precisa estar dentro de ProvedorEstado')
  return ctx
}
