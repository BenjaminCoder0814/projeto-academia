import type { Dia, Foto, Papel, Perfil, Recado, Snapshot, TipoFoto } from '../lib/tipos'

export type Repo = {
  /** true quando os dados vão para o Supabase (aí o Benjamin enxerga). */
  readonly remoto: boolean

  sessao(): Promise<Perfil | null>
  aoMudarSessao(cb: (p: Perfil | null) => void): () => void
  entrar(email: string, senha: string): Promise<void>
  cadastrar(email: string, senha: string, nome: string, papel: Papel): Promise<void>
  sair(): Promise<void>
  salvarPerfil(patch: Partial<Perfil>): Promise<Perfil>

  carregar(): Promise<Snapshot>
  aoMudarDados(cb: () => void): () => void

  salvarPeso(data: string, pesoKg: number): Promise<void>
  salvarDia(data: string, patch: Partial<Dia>, metaMl: number): Promise<void>
  enviarFoto(data: string, tipo: TipoFoto, arquivo: Blob): Promise<Foto>
  urlDaFoto(caminho: string): Promise<string>

  enviarRecado(data: string, texto: string): Promise<Recado>
  marcarRecadoLido(id: string): Promise<void>
  mandarBeijinho(): Promise<void>
  marcarBeijinhosVistos(ids: string[]): Promise<void>
}
