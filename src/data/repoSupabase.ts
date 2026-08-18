import type {
  Beijinho,
  Dia,
  Foto,
  Papel,
  Perfil,
  Peso,
  Recado,
  Snapshot,
  TipoFoto,
} from '../lib/tipos'
import type { Repo } from './repo'
import { BUCKET_FOTOS, supa } from './supabase'
import { enfileirar, pendentes, remover } from './fila'

const COLUNAS_DIA =
  'data, corrida_ok, natacao_ok, bonus_sexta_ok, agua_ml, agua_meta_ml, humor, calorias, fc_media, nota'

const cacheUrls = new Map<string, { url: string; expira: number }>()
let perfilEmCache: Perfil | null = null

async function perfilDoUsuario(id: string): Promise<Perfil | null> {
  const { data, error } = await supa().from('perfis').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return (data as Perfil) ?? null
}

async function perfilDaIsabela(): Promise<Perfil | null> {
  const { data, error } = await supa()
    .from('perfis')
    .select('*')
    .eq('papel', 'isabela')
    .order('criado_em', { ascending: true })
    .limit(1)
  if (error) throw error
  return (data?.[0] as Perfil) ?? null
}

async function idDaIsabela(): Promise<string> {
  if (perfilEmCache?.papel === 'isabela') return perfilEmCache.id
  const { data } = await supa().auth.getUser()
  if (!data.user) throw new Error('Sem sessão ativa')
  return data.user.id
}

function carimbo() {
  return Date.now().toString(36)
}

function traduzirErro(msg: string): string {
  if (/invalid login credentials/i.test(msg)) return 'E-mail ou senha não conferem 🥺'
  if (/user already registered/i.test(msg)) return 'Esse e-mail já tem conta. É só entrar 💗'
  if (/password should be at least/i.test(msg)) return 'A senha precisa de pelo menos 6 letrinhas'
  if (/email not confirmed/i.test(msg)) return 'Confirme o e-mail antes de entrar'
  return msg
}

/** Reenvia o que ficou pendente enquanto o celular estava sem internet. */
export async function escoarFila() {
  if (!navigator.onLine) return
  for (const item of pendentes()) {
    try {
      const tabela = item.tipo === 'dia' ? 'dias' : 'pesos'
      const { error } = await supa()
        .from(tabela)
        .upsert(item.carga, { onConflict: 'user_id,data' })
      if (error) throw error
      remover(item.id)
    } catch {
      return // tenta de novo na próxima oportunidade
    }
  }
}

export const repoSupabase: Repo = {
  remoto: true,

  async sessao() {
    const { data } = await supa().auth.getUser()
    if (!data.user) {
      perfilEmCache = null
      return null
    }
    perfilEmCache = await perfilDoUsuario(data.user.id)
    return perfilEmCache
  },

  aoMudarSessao(cb) {
    const { data } = supa().auth.onAuthStateChange(async (_evento, sessao) => {
      if (!sessao?.user) {
        perfilEmCache = null
        cb(null)
        return
      }
      perfilEmCache = await perfilDoUsuario(sessao.user.id)
      cb(perfilEmCache)
    })
    return () => data.subscription.unsubscribe()
  },

  async entrar(email, senha) {
    const { error } = await supa().auth.signInWithPassword({ email, password: senha })
    if (error) throw new Error(traduzirErro(error.message))
  },

  async cadastrar(email, senha, nome, papel: Papel) {
    const { data, error } = await supa().auth.signUp({
      email,
      password: senha,
      options: { data: { nome, papel } },
    })
    if (error) throw new Error(traduzirErro(error.message))
    const uid = data.user?.id
    if (!uid) return
    await supa().from('perfis').upsert({ id: uid, nome, papel }, { onConflict: 'id' })
  },

  async sair() {
    await supa().auth.signOut()
    perfilEmCache = null
  },

  async salvarPerfil(patch) {
    const { data: sessao } = await supa().auth.getUser()
    const id = sessao.user?.id
    if (!id) throw new Error('Sem sessão ativa')
    const { data, error } = await supa().from('perfis').update(patch).eq('id', id).select().single()
    if (error) throw error
    perfilEmCache = data as Perfil
    return perfilEmCache
  },

  async carregar(): Promise<Snapshot> {
    await escoarFila()
    const isabela = perfilEmCache?.papel === 'isabela' ? perfilEmCache : await perfilDaIsabela()
    if (!isabela) {
      return { perfilIsabela: null, pesos: [], dias: [], fotos: [], recados: [], beijinhos: [] }
    }

    const [pesos, dias, fotos, recados, beijinhos] = await Promise.all([
      supa().from('pesos').select('data, peso_kg').eq('user_id', isabela.id).order('data'),
      supa().from('dias').select(COLUNAS_DIA).eq('user_id', isabela.id).order('data'),
      supa()
        .from('fotos')
        .select('id, data, tipo, storage_path, criado_em')
        .eq('user_id', isabela.id)
        .order('data'),
      supa()
        .from('recados')
        .select('id, autor_id, data, texto, lido, criado_em, perfis:autor_id(nome)')
        .order('criado_em'),
      supa()
        .from('beijinhos')
        .select('id, autor_id, visto, criado_em')
        .order('criado_em', { ascending: false })
        .limit(20),
    ])

    for (const r of [pesos, dias, fotos, recados, beijinhos]) if (r.error) throw r.error

    return {
      perfilIsabela: isabela,
      pesos: (pesos.data ?? []) as Peso[],
      dias: (dias.data ?? []) as unknown as Dia[],
      fotos: (fotos.data ?? []) as Foto[],
      recados: ((recados.data ?? []) as any[]).map((r) => ({
        id: r.id,
        autor_id: r.autor_id,
        autor_nome: r.perfis?.nome,
        data: r.data,
        texto: r.texto,
        lido: r.lido,
        criado_em: r.criado_em,
      })),
      beijinhos: (beijinhos.data ?? []) as Beijinho[],
    }
  },

  aoMudarDados(cb) {
    const canal = supa().channel('projetinho')
    for (const tabela of ['dias', 'pesos', 'fotos', 'recados', 'perfis', 'beijinhos']) {
      canal.on('postgres_changes', { event: '*', schema: 'public', table: tabela }, () => cb())
    }
    canal.subscribe()
    return () => {
      supa().removeChannel(canal)
    }
  },

  async salvarPeso(data, pesoKg) {
    const id = await idDaIsabela()
    const registro = { user_id: id, data, peso_kg: pesoKg }
    try {
      const { error } = await supa().from('pesos').upsert(registro, { onConflict: 'user_id,data' })
      if (error) throw error
    } catch (e) {
      enfileirar({ tipo: 'peso', data, carga: registro })
      if (navigator.onLine) throw e
    }
  },

  async salvarDia(data, patch, metaMl) {
    const id = await idDaIsabela()
    const registro = { user_id: id, data, agua_meta_ml: metaMl, ...patch }
    try {
      const { error } = await supa()
        .from('dias')
        .upsert(registro, { onConflict: 'user_id,data' })
      if (error) throw error
    } catch (e) {
      enfileirar({ tipo: 'dia', data, carga: registro })
      if (navigator.onLine) throw e
    }
  },

  async enviarFoto(data, tipo: TipoFoto, arquivo) {
    const id = await idDaIsabela()
    const caminho = `${id}/${data}-${tipo}-${carimbo()}.jpg`
    const { error: erroUpload } = await supa()
      .storage.from(BUCKET_FOTOS)
      .upload(caminho, arquivo, { contentType: 'image/jpeg', upsert: false })
    if (erroUpload) throw erroUpload

    const { data: anterior } = await supa()
      .from('fotos')
      .select('storage_path')
      .eq('user_id', id)
      .eq('data', data)
      .eq('tipo', tipo)
      .maybeSingle()

    const { data: linha, error } = await supa()
      .from('fotos')
      .upsert({ user_id: id, data, tipo, storage_path: caminho }, { onConflict: 'user_id,data,tipo' })
      .select('id, data, tipo, storage_path, criado_em')
      .single()
    if (error) throw error

    if (anterior?.storage_path && anterior.storage_path !== caminho) {
      await supa().storage.from(BUCKET_FOTOS).remove([anterior.storage_path])
    }
    return linha as Foto
  },

  async urlDaFoto(caminho) {
    const emCache = cacheUrls.get(caminho)
    if (emCache && emCache.expira > Date.now()) return emCache.url
    const { data, error } = await supa().storage.from(BUCKET_FOTOS).createSignedUrl(caminho, 3600)
    if (error || !data) throw error ?? new Error('Não consegui abrir a foto')
    cacheUrls.set(caminho, { url: data.signedUrl, expira: Date.now() + 50 * 60 * 1000 })
    return data.signedUrl
  },

  async enviarRecado(data, texto) {
    const { data: sessao } = await supa().auth.getUser()
    const autor = sessao.user?.id
    if (!autor) throw new Error('Sem sessão ativa')
    const { data: linha, error } = await supa()
      .from('recados')
      .insert({ autor_id: autor, data, texto })
      .select('id, autor_id, data, texto, lido, criado_em')
      .single()
    if (error) throw error
    return linha as Recado
  },

  async marcarRecadoLido(id) {
    await supa().from('recados').update({ lido: true }).eq('id', id)
  },

  async mandarBeijinho() {
    const { data: sessao } = await supa().auth.getUser()
    const autor = sessao.user?.id
    if (!autor) throw new Error('Sem sessão ativa')
    const { error } = await supa().from('beijinhos').insert({ autor_id: autor })
    if (error) throw error
  },

  async marcarBeijinhosVistos(ids) {
    if (!ids.length) return
    await supa().from('beijinhos').update({ visto: true }).in('id', ids)
  },
}
