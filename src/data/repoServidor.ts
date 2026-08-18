import type { Dia, Papel, Perfil, Snapshot, TipoFoto } from '../lib/tipos'
import { snapshotVazio } from '../lib/tipos'
import { API_CHAVE, API_URL } from '../lib/config'
import type { Repo } from './repo'

/**
 * Repositório que fala com o servidor SQLite (servidor/servidor.mjs).
 *
 * É o banco de dados de verdade: os dois celulares apontam pro mesmo lugar, então
 * o que a Isabela marca aparece no celular do Benjamin. Não precisa de conta em
 * lugar nenhum — só do servidor rodando.
 */

const CHAVE_EU = 'projetinho:eu'

const ouvintes = new Set<() => void>()
const ouvintesSessao = new Set<(p: Perfil | null) => void>()

let relogio: number | null = null

function cabecalhos(json = true): HeadersInit {
  return json
    ? { 'content-type': 'application/json', 'x-chave': API_CHAVE }
    : { 'x-chave': API_CHAVE }
}

async function pedir<T>(caminho: string, opcoes: RequestInit = {}): Promise<T> {
  const resposta = await fetch(`${API_URL}${caminho}`, opcoes)
  if (!resposta.ok) {
    const detalhe = await resposta.json().catch(() => ({ erro: resposta.statusText }))
    throw new Error(detalhe.erro ?? 'o servidor não respondeu direito')
  }
  return (await resposta.json()) as T
}

function euGuardado(): Perfil | null {
  try {
    const bruto = localStorage.getItem(CHAVE_EU)
    return bruto ? (JSON.parse(bruto) as Perfil) : null
  } catch {
    return null
  }
}

function guardarEu(p: Perfil | null) {
  if (p) localStorage.setItem(CHAVE_EU, JSON.stringify(p))
  else localStorage.removeItem(CHAVE_EU)
  ouvintesSessao.forEach((cb) => cb(p))
}

function avisar() {
  ouvintes.forEach((cb) => cb())
}

export const repoServidor: Repo = {
  remoto: true,

  async sessao() {
    return euGuardado()
  },

  aoMudarSessao(cb) {
    ouvintesSessao.add(cb)
    return () => ouvintesSessao.delete(cb)
  },

  async entrar() {
    throw new Error('Neste modo é só escolher quem você é 💗')
  },

  /** No servidor não tem senha: os dois usuários são a Isabela e o Benjamin. */
  async cadastrar(_email: string, _senha: string, nome: string, papel: Papel) {
    const perfil = await pedir<Perfil>('/api/entrar', {
      method: 'POST',
      headers: cabecalhos(),
      body: JSON.stringify({ papel, nome }),
    })
    guardarEu(perfil)
    avisar()
  },

  async sair() {
    guardarEu(null)
  },

  async salvarPerfil(patch) {
    const eu = euGuardado()
    if (!eu) throw new Error('Ninguém está logado neste aparelho')
    const perfil = await pedir<Perfil>(`/api/perfil/${eu.id}`, {
      method: 'PATCH',
      headers: cabecalhos(),
      body: JSON.stringify(patch),
    })
    guardarEu(perfil)
    avisar()
    return perfil
  },

  async carregar(): Promise<Snapshot> {
    try {
      const s = await pedir<Snapshot>('/api/tudo', { headers: cabecalhos(false) })
      // o perfil de quem está aqui pode ter mudado no outro celular
      const eu = euGuardado()
      if (eu?.papel === 'isabela' && s.perfilIsabela) guardarEu(s.perfilIsabela)
      return s
    } catch (e) {
      console.error('servidor fora do ar', e)
      return snapshotVazio
    }
  },

  /** Sem websocket: uma espiada a cada 5 segundos já dá a sensação de tempo real. */
  aoMudarDados(cb) {
    ouvintes.add(cb)
    if (relogio === null) {
      relogio = window.setInterval(() => ouvintes.forEach((o) => o()), 5000)
    }
    return () => {
      ouvintes.delete(cb)
      if (ouvintes.size === 0 && relogio !== null) {
        clearInterval(relogio)
        relogio = null
      }
    }
  },

  async salvarPeso(data, pesoKg) {
    await pedir(`/api/pesos/${data}`, {
      method: 'PUT',
      headers: cabecalhos(),
      body: JSON.stringify({ peso_kg: pesoKg }),
    })
    avisar()
  },

  async salvarDia(data, patch: Partial<Dia>, metaMl) {
    await pedir(`/api/dias/${data}`, {
      method: 'PUT',
      headers: cabecalhos(),
      body: JSON.stringify({ ...patch, agua_meta_ml: metaMl }),
    })
    avisar()
  },

  async enviarFoto(data, tipo: TipoFoto, arquivo) {
    const foto = await pedir<{ id: string; criado_em: string }>(`/api/fotos/${data}/${tipo}`, {
      method: 'POST',
      headers: { 'content-type': 'image/jpeg', 'x-chave': API_CHAVE },
      body: arquivo,
    })
    avisar()
    return { ...foto, data, tipo, storage_path: foto.id }
  },

  async urlDaFoto(caminho) {
    return `${API_URL}/api/fotos/${caminho}?chave=${encodeURIComponent(API_CHAVE)}`
  },

  async enviarRecado(data, texto) {
    const eu = euGuardado()
    const { id } = await pedir<{ id: string }>('/api/recados', {
      method: 'POST',
      headers: cabecalhos(),
      body: JSON.stringify({ autor_id: eu?.id, data, texto }),
    })
    avisar()
    return {
      id,
      autor_id: eu?.id ?? '',
      autor_nome: eu?.nome,
      data,
      texto,
      lido: false,
      criado_em: new Date().toISOString(),
    }
  },

  async marcarRecadoLido(id) {
    await pedir(`/api/recados/${id}/lido`, { method: 'PATCH', headers: cabecalhos(false) })
    avisar()
  },

  async mandarBeijinho() {
    const eu = euGuardado()
    await pedir('/api/beijinhos', {
      method: 'POST',
      headers: cabecalhos(),
      body: JSON.stringify({ autor_id: eu?.id }),
    })
    avisar()
  },

  async marcarBeijinhosVistos(ids) {
    if (!ids.length) return
    await pedir('/api/beijinhos', {
      method: 'PATCH',
      headers: cabecalhos(),
      body: JSON.stringify({ ids }),
    })
    avisar()
  },
}
