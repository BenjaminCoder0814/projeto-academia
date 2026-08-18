/**
 * Banco de dados local do aparelho (IndexedDB).
 *
 * É onde tudo fica guardado quando o Supabase não está configurado: sobrevive a
 * fechar o app, desligar o celular e ficar sem internet. O localStorage não serve
 * pra isso — tem limite pequeno e o navegador limpa quando quer.
 */

const NOME = 'projetinho'
const VERSAO = 2

export const LOJAS = {
  estado: 'estado', // perfil e configurações (chave → valor)
  dias: 'dias', // um registro por data
  pesos: 'pesos', // um registro por data
  fotos: 'fotos', // os arquivos das fotinhas (Blob)
  recados: 'recados',
  beijinhos: 'beijinhos',
} as const

type Loja = (typeof LOJAS)[keyof typeof LOJAS]

let promessa: Promise<IDBDatabase> | null = null

export function abrirBanco(): Promise<IDBDatabase> {
  if (promessa) return promessa
  promessa = new Promise((ok, erro) => {
    const req = indexedDB.open(NOME, VERSAO)

    req.onupgradeneeded = () => {
      const db = req.result
      // a v1 já tinha a loja de fotos; as outras entram agora
      if (!db.objectStoreNames.contains(LOJAS.fotos)) db.createObjectStore(LOJAS.fotos)
      if (!db.objectStoreNames.contains(LOJAS.estado)) db.createObjectStore(LOJAS.estado)
      if (!db.objectStoreNames.contains(LOJAS.dias)) {
        db.createObjectStore(LOJAS.dias, { keyPath: 'data' })
      }
      if (!db.objectStoreNames.contains(LOJAS.pesos)) {
        db.createObjectStore(LOJAS.pesos, { keyPath: 'data' })
      }
      if (!db.objectStoreNames.contains(LOJAS.recados)) {
        db.createObjectStore(LOJAS.recados, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(LOJAS.beijinhos)) {
        db.createObjectStore(LOJAS.beijinhos, { keyPath: 'id' })
      }
    }

    req.onsuccess = () => ok(req.result)
    req.onerror = () => erro(req.error)
  })
  return promessa
}

function transacao<T>(
  loja: Loja,
  modo: IDBTransactionMode,
  acao: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return abrirBanco().then(
    (db) =>
      new Promise<T>((ok, erro) => {
        const tx = db.transaction(loja, modo)
        const req = acao(tx.objectStore(loja))
        req.onsuccess = () => ok(req.result)
        req.onerror = () => erro(req.error)
      }),
  )
}

export function guardar<T>(loja: Loja, valor: T, chave?: IDBValidKey): Promise<IDBValidKey> {
  return transacao(loja, 'readwrite', (s) => (chave === undefined ? s.put(valor) : s.put(valor, chave)))
}

export function ler<T>(loja: Loja, chave: IDBValidKey): Promise<T | undefined> {
  return transacao<T | undefined>(loja, 'readonly', (s) => s.get(chave) as IDBRequest<T | undefined>)
}

export function lerTudo<T>(loja: Loja): Promise<T[]> {
  return transacao<T[]>(loja, 'readonly', (s) => s.getAll() as IDBRequest<T[]>)
}

export function apagar(loja: Loja, chave: IDBValidKey): Promise<undefined> {
  return transacao<undefined>(loja, 'readwrite', (s) => s.delete(chave) as IDBRequest<undefined>)
}

export function limpar(loja: Loja): Promise<undefined> {
  return transacao<undefined>(loja, 'readwrite', (s) => s.clear() as IDBRequest<undefined>)
}

/* ------------------------------------------------------------------ */
/* Armazenamento permanente                                            */
/* ------------------------------------------------------------------ */

/**
 * Pede pro navegador NÃO apagar esses dados quando o celular ficar sem espaço.
 * No Android costuma ser concedido direto; no iPhone vale depois de adicionar
 * o app à tela de início.
 */
export async function pedirArmazenamentoPermanente(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false
    if (await navigator.storage.persisted?.()) return true
    return await navigator.storage.persist()
  } catch {
    return false
  }
}

export type EstadoDoArmazenamento = {
  permanente: boolean
  usadoMb: number | null
  disponivelMb: number | null
}

export async function estadoDoArmazenamento(): Promise<EstadoDoArmazenamento> {
  let permanente = false
  let usadoMb: number | null = null
  let disponivelMb: number | null = null
  try {
    permanente = (await navigator.storage?.persisted?.()) ?? false
    const e = await navigator.storage?.estimate?.()
    if (e?.usage != null) usadoMb = e.usage / (1024 * 1024)
    if (e?.quota != null) disponivelMb = e.quota / (1024 * 1024)
  } catch {
    /* navegador sem a API: segue a vida */
  }
  return { permanente, usadoMb, disponivelMb }
}
