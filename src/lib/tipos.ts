export type Papel = 'isabela' | 'benjamin'

export type Perfil = {
  id: string
  nome: string
  papel: Papel
  data_nascimento: string | null
  altura_cm: number | null
  peso_inicial_kg: number | null
}

export type Peso = {
  data: string
  peso_kg: number
}

export type Dia = {
  data: string
  corrida_ok: boolean
  natacao_ok: boolean
  bonus_sexta_ok: boolean
  agua_ml: number
  agua_meta_ml: number
  humor: number | null
  calorias: number | null
  fc_media: number | null
  nota: string | null
}

/**
 * `evolucao` e `relogio` são uma por dia (a do antes e depois e a prova do treino).
 * `galeria` é livre: ela manda quantas quiser, todo dia.
 */
export type TipoFoto = 'evolucao' | 'relogio' | 'galeria'

export type Foto = {
  id: string
  data: string
  tipo: TipoFoto
  storage_path: string
  criado_em: string
}

export type Recado = {
  id: string
  autor_id: string
  autor_nome?: string
  data: string
  texto: string
  lido: boolean
  criado_em: string
}

export type Beijinho = {
  id: string
  autor_id: string
  visto: boolean
  criado_em: string
}

export type Snapshot = {
  perfilIsabela: Perfil | null
  pesos: Peso[]
  dias: Dia[]
  fotos: Foto[]
  recados: Recado[]
  beijinhos: Beijinho[]
}

export const snapshotVazio: Snapshot = {
  perfilIsabela: null,
  pesos: [],
  dias: [],
  fotos: [],
  recados: [],
  beijinhos: [],
}

export const diaVazio = (data: string, metaMl: number): Dia => ({
  data,
  corrida_ok: false,
  natacao_ok: false,
  bonus_sexta_ok: false,
  agua_ml: 0,
  agua_meta_ml: metaMl,
  humor: null,
  calorias: null,
  fc_media: null,
  nota: null,
})
