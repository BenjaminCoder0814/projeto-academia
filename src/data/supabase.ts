import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_ANON_KEY, SUPABASE_URL, TEM_SUPABASE } from '../lib/config'

let cliente: SupabaseClient | null = null

export function supa(): SupabaseClient {
  if (!TEM_SUPABASE) throw new Error('Supabase nao configurado')
  if (!cliente) {
    cliente = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  }
  return cliente
}

export const BUCKET_FOTOS = 'fotos'
