/**
 * Fila de saida para funcionar offline.
 * ATENCAO: isto e apenas um buffer de reenvio — a fonte de verdade continua
 * sendo o Postgres do Supabase. Nada e lido daqui para exibir na tela.
 */
export type ItemFila = {
  id: string
  tipo: 'dia' | 'peso'
  data: string
  carga: Record<string, unknown>
}

const CHAVE = 'projetinho:fila'

function ler(): ItemFila[] {
  try {
    return JSON.parse(localStorage.getItem(CHAVE) || '[]') as ItemFila[]
  } catch {
    return []
  }
}

function gravar(itens: ItemFila[]) {
  localStorage.setItem(CHAVE, JSON.stringify(itens))
}

export function enfileirar(item: Omit<ItemFila, 'id'>) {
  const itens = ler()
  // um registro por (tipo, data): o ultimo estado vence
  const semDuplicata = itens.filter((i) => !(i.tipo === item.tipo && i.data === item.data))
  semDuplicata.push({ ...item, id: `${item.tipo}:${item.data}` })
  gravar(semDuplicata)
}

export function pendentes(): ItemFila[] {
  return ler()
}

export function remover(id: string) {
  gravar(ler().filter((i) => i.id !== id))
}

export function limpar() {
  gravar([])
}
