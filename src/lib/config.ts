/* De onde o app tira os dados, em ordem de preferência:
   1. Supabase  (nuvem, funciona em qualquer lugar)
   2. Servidor  (SQLite rodando na sua máquina, funciona na rede de casa)
   3. Aparelho  (IndexedDB, só naquele celular)                                */

const limpar = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

export const SUPABASE_URL = limpar(import.meta.env.VITE_SUPABASE_URL)
export const SUPABASE_ANON_KEY = limpar(import.meta.env.VITE_SUPABASE_ANON_KEY)
export const API_URL = limpar(import.meta.env.VITE_API_URL).replace(/\/$/, '')
export const API_CHAVE = limpar(import.meta.env.VITE_API_CHAVE)

export const TEM_SUPABASE = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL.startsWith('http'),
)

export const TEM_SERVIDOR = Boolean(API_URL && API_CHAVE && API_URL.startsWith('http'))

export type ModoDeDados = 'supabase' | 'servidor' | 'aparelho'

export const MODO: ModoDeDados = TEM_SUPABASE ? 'supabase' : TEM_SERVIDOR ? 'servidor' : 'aparelho'
