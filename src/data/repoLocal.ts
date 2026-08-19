import type { Beijinho, Dia, Foto, Papel, Perfil, Peso, Recado, Snapshot, TipoFoto } from '../lib/tipos'
import { diaVazio } from '../lib/tipos'
import type { Repo } from './repo'
import {
  LOJAS,
  apagar,
  guardar,
  ler,
  lerTudo,
  pedirArmazenamentoPermanente,
} from './bancoLocal'

/**
 * Repositório do aparelho: guarda tudo no IndexedDB do celular dela.
 *
 * Entra em cena quando o Supabase não está configurado. Os dados persistem de
 * verdade (fecham e abrem o app, reiniciam o celular, ficam offline), mas vivem
 * só naquele aparelho — o Benjamin não enxerga daqui. Pra isso, Supabase.
 */

const CHAVE_PERFIL = 'perfil'
const CHAVE_ANTIGA = 'projetinho:demo' // localStorage da versão anterior

const ouvintes = new Set<() => void>()
const ouvintesSessao = new Set<(p: Perfil | null) => void>()
const urlsEmCache = new Map<string, string>()

function avisar() {
  ouvintes.forEach((cb) => cb())
}

/* ------------------------------------------------------------------ */
/* Migração: nada do que ela já registrou pode se perder               */
/* ------------------------------------------------------------------ */

let migrado = false

async function migrarDoLocalStorage() {
  if (migrado) return
  migrado = true
  let bruto: string | null = null
  try {
    bruto = localStorage.getItem(CHAVE_ANTIGA)
  } catch {
    return
  }
  if (!bruto) return

  try {
    const antigo = JSON.parse(bruto) as {
      perfil?: Perfil | null
      dias?: Dia[]
      pesos?: Peso[]
      fotos?: Foto[]
      recados?: Recado[]
      beijinhos?: Beijinho[]
    }
    if (antigo.perfil) await guardar(LOJAS.estado, antigo.perfil, CHAVE_PERFIL)
    for (const d of antigo.dias ?? []) await guardar(LOJAS.dias, d)
    for (const p of antigo.pesos ?? []) await guardar(LOJAS.pesos, p)
    for (const f of antigo.fotos ?? []) await guardar(LOJAS.estado, f, `foto:${f.data}:${f.tipo}`)
    for (const r of antigo.recados ?? []) await guardar(LOJAS.recados, r)
    for (const b of antigo.beijinhos ?? []) await guardar(LOJAS.beijinhos, b)
    // guarda o original de lado, por segurança, e desativa a chave antiga
    localStorage.setItem(`${CHAVE_ANTIGA}:migrado`, bruto)
    localStorage.removeItem(CHAVE_ANTIGA)
  } catch (e) {
    console.error('não deu pra migrar os dados antigos', e)
  }
}

/* ------------------------------------------------------------------ */
/* Fotos: metadado no estado, arquivo na loja de fotos                 */
/* ------------------------------------------------------------------ */

const chaveMeta = (data: string, tipo: TipoFoto, id?: string) =>
  tipo === 'galeria' ? `foto:${data}:galeria:${id}` : `foto:${data}:${tipo}`

async function listarFotos(): Promise<Foto[]> {
  const db = await import('./bancoLocal').then((m) => m.abrirBanco())
  return new Promise((ok, erro) => {
    const tx = db.transaction(LOJAS.estado, 'readonly')
    const loja = tx.objectStore(LOJAS.estado)
    const req = loja.openCursor()
    const fotos: Foto[] = []
    req.onsuccess = () => {
      const cursor = req.result
      if (!cursor) {
        ok(fotos.sort((a, b) => a.data.localeCompare(b.data)))
        return
      }
      if (typeof cursor.key === 'string' && cursor.key.startsWith('foto:')) {
        fotos.push(cursor.value as Foto)
      }
      cursor.continue()
    }
    req.onerror = () => erro(req.error)
  })
}

/* ------------------------------------------------------------------ */

export const repoLocal: Repo = {
  remoto: false,

  async sessao() {
    await migrarDoLocalStorage()
    void pedirArmazenamentoPermanente()
    return (await ler<Perfil>(LOJAS.estado, CHAVE_PERFIL)) ?? null
  },

  aoMudarSessao(cb) {
    ouvintesSessao.add(cb)
    return () => ouvintesSessao.delete(cb)
  },

  async entrar() {
    throw new Error('Sem nuvem por enquanto: configure o Supabase pra usar login.')
  },

  async cadastrar(_email: string, _senha: string, nome: string, papel: Papel) {
    const perfil: Perfil = {
      id: 'local',
      nome,
      papel,
      data_nascimento: '2007-05-25',
      altura_cm: null,
      peso_inicial_kg: null,
    }
    await guardar(LOJAS.estado, perfil, CHAVE_PERFIL)
    ouvintesSessao.forEach((cb) => cb(perfil))
    avisar()
  },

  async sair() {
    await apagar(LOJAS.estado, CHAVE_PERFIL)
    ouvintesSessao.forEach((cb) => cb(null))
    avisar()
  },

  async salvarPerfil(patch) {
    const atual = await ler<Perfil>(LOJAS.estado, CHAVE_PERFIL)
    const base: Perfil = atual ?? {
      id: 'local',
      nome: 'Isabela',
      papel: 'isabela',
      data_nascimento: '2007-05-25',
      altura_cm: null,
      peso_inicial_kg: null,
    }
    const perfil = { ...base, ...patch }
    await guardar(LOJAS.estado, perfil, CHAVE_PERFIL)
    ouvintesSessao.forEach((cb) => cb(perfil))
    avisar()
    return perfil
  },

  async carregar(): Promise<Snapshot> {
    await migrarDoLocalStorage()
    const [perfil, dias, pesos, fotos, recados, beijinhos] = await Promise.all([
      ler<Perfil>(LOJAS.estado, CHAVE_PERFIL),
      lerTudo<Dia>(LOJAS.dias),
      lerTudo<Peso>(LOJAS.pesos),
      listarFotos(),
      lerTudo<Recado>(LOJAS.recados),
      lerTudo<Beijinho>(LOJAS.beijinhos),
    ])
    return {
      perfilIsabela: perfil ?? null,
      dias: dias.sort((a, b) => a.data.localeCompare(b.data)),
      pesos: pesos.sort((a, b) => a.data.localeCompare(b.data)),
      fotos,
      recados: recados.sort((a, b) => a.criado_em.localeCompare(b.criado_em)),
      beijinhos: beijinhos.sort((a, b) => b.criado_em.localeCompare(a.criado_em)),
    }
  },

  aoMudarDados(cb) {
    ouvintes.add(cb)
    return () => ouvintes.delete(cb)
  },

  async salvarPeso(data, pesoKg) {
    await guardar(LOJAS.pesos, { data, peso_kg: pesoKg })
    avisar()
  },

  async salvarDia(data, patch, metaMl) {
    const atual = await ler<Dia>(LOJAS.dias, data)
    const novo: Dia = { ...diaVazio(data, metaMl), ...atual, ...patch, agua_meta_ml: metaMl }
    await guardar(LOJAS.dias, novo)
    avisar()
  },

  async enviarFoto(data, tipo: TipoFoto, arquivo) {
    const marca = tipo === 'galeria' ? `-${Date.now().toString(36)}` : ''
    const caminho = `local/${data}-${tipo}${marca}`
    await guardar(LOJAS.fotos, arquivo, caminho)
    const foto: Foto = {
      id: caminho,
      data,
      tipo,
      storage_path: caminho,
      criado_em: new Date().toISOString(),
    }
    await guardar(LOJAS.estado, foto, chaveMeta(data, tipo, caminho))
    const antiga = urlsEmCache.get(caminho)
    if (antiga) {
      URL.revokeObjectURL(antiga)
      urlsEmCache.delete(caminho)
    }
    avisar()
    return foto
  },

  async apagarFoto(foto) {
    await apagar(LOJAS.fotos, foto.storage_path)
    await apagar(LOJAS.estado, chaveMeta(foto.data, foto.tipo, foto.storage_path))
    const url = urlsEmCache.get(foto.storage_path)
    if (url) {
      URL.revokeObjectURL(url)
      urlsEmCache.delete(foto.storage_path)
    }
    avisar()
  },

  async urlDaFoto(caminho) {
    const emCache = urlsEmCache.get(caminho)
    if (emCache) return emCache
    const blob = await ler<Blob>(LOJAS.fotos, caminho)
    if (!blob) throw new Error('Fotinha não encontrada neste aparelho')
    const url = URL.createObjectURL(blob)
    urlsEmCache.set(caminho, url)
    return url
  },

  async enviarRecado(data, texto) {
    const perfil = await ler<Perfil>(LOJAS.estado, CHAVE_PERFIL)
    const recado: Recado = {
      id: `r${Date.now()}`,
      autor_id: perfil?.papel === 'isabela' ? 'isabela' : 'benjamin',
      autor_nome: perfil?.papel === 'isabela' ? 'Benjamin' : 'Isabela',
      data,
      texto,
      lido: false,
      criado_em: new Date().toISOString(),
    }
    await guardar(LOJAS.recados, recado)
    avisar()
    return recado
  },

  async marcarRecadoLido(id) {
    const r = await ler<Recado>(LOJAS.recados, id)
    if (!r) return
    await guardar(LOJAS.recados, { ...r, lido: true })
    avisar()
  },

  async mandarBeijinho() {
    const perfil = await ler<Perfil>(LOJAS.estado, CHAVE_PERFIL)
    const beijinho: Beijinho = {
      id: `b${Date.now()}`,
      autor_id: perfil?.papel === 'isabela' ? 'isabela' : 'benjamin',
      visto: false,
      criado_em: new Date().toISOString(),
    }
    await guardar(LOJAS.beijinhos, beijinho)
    avisar()
  },

  async marcarBeijinhosVistos(ids) {
    for (const id of ids) {
      const b = await ler<Beijinho>(LOJAS.beijinhos, id)
      if (b) await guardar(LOJAS.beijinhos, { ...b, visto: true })
    }
    avisar()
  },
}
