import type { Beijinho, Dia, Foto, Perfil, Peso, Recado } from '../lib/tipos'
import { LOJAS, abrirBanco, guardar, ler, lerTudo } from './bancoLocal'

/**
 * Backup do aparelho: um arquivo único com tudo dentro, fotinhas incluídas.
 *
 * É a rede de segurança do modo local — serve pra levar tudo pra outro celular,
 * ou pra guardar uma cópia antes de configurar a nuvem.
 */

const CHAVE_PERFIL = 'perfil'

export type ArquivoDeBackup = {
  app: 'projetinho'
  versao: 1
  criado_em: string
  perfil: Perfil | null
  dias: Dia[]
  pesos: Peso[]
  recados: Recado[]
  beijinhos: Beijinho[]
  fotos: (Foto & { arquivo: string })[]
}

function blobParaTexto(blob: Blob): Promise<string> {
  return new Promise((ok, erro) => {
    const leitor = new FileReader()
    leitor.onload = () => ok(String(leitor.result))
    leitor.onerror = () => erro(leitor.error)
    leitor.readAsDataURL(blob)
  })
}

async function textoParaBlob(texto: string): Promise<Blob> {
  const resposta = await fetch(texto)
  return resposta.blob()
}

async function listarMetaDasFotos(): Promise<Foto[]> {
  const db = await abrirBanco()
  return new Promise((ok, erro) => {
    const req = db.transaction(LOJAS.estado, 'readonly').objectStore(LOJAS.estado).openCursor()
    const fotos: Foto[] = []
    req.onsuccess = () => {
      const c = req.result
      if (!c) return ok(fotos)
      if (typeof c.key === 'string' && c.key.startsWith('foto:')) fotos.push(c.value as Foto)
      c.continue()
    }
    req.onerror = () => erro(req.error)
  })
}

/** Monta o arquivo de backup com tudo que está guardado no aparelho. */
export async function montarBackup(): Promise<ArquivoDeBackup> {
  const [perfil, dias, pesos, recados, beijinhos, meta] = await Promise.all([
    ler<Perfil>(LOJAS.estado, CHAVE_PERFIL),
    lerTudo<Dia>(LOJAS.dias),
    lerTudo<Peso>(LOJAS.pesos),
    lerTudo<Recado>(LOJAS.recados),
    lerTudo<Beijinho>(LOJAS.beijinhos),
    listarMetaDasFotos(),
  ])

  const fotos: (Foto & { arquivo: string })[] = []
  for (const f of meta) {
    const blob = await ler<Blob>(LOJAS.fotos, f.storage_path)
    if (blob) fotos.push({ ...f, arquivo: await blobParaTexto(blob) })
  }

  return {
    app: 'projetinho',
    versao: 1,
    criado_em: new Date().toISOString(),
    perfil: perfil ?? null,
    dias,
    pesos,
    recados,
    beijinhos,
    fotos,
  }
}

/** Gera o arquivo e entrega pro celular salvar ou compartilhar. */
export async function salvarBackup(): Promise<{ nome: string; tamanhoMb: number }> {
  const dados = await montarBackup()
  const nome = `projetinho-backup-${dados.criado_em.slice(0, 10)}.json`
  const blob = new Blob([JSON.stringify(dados)], { type: 'application/json' })
  const arquivo = new File([blob], nome, { type: 'application/json' })

  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
  if (nav.canShare?.({ files: [arquivo] })) {
    await navigator.share({ files: [arquivo], title: 'Backup do Projetinho 💗' })
  } else {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = nome
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 4000)
  }
  return { nome, tamanhoMb: blob.size / (1024 * 1024) }
}

/** Lê um arquivo de backup e devolve tudo pro banco do aparelho. */
export async function restaurarBackup(arquivo: File): Promise<{ dias: number; fotos: number }> {
  const texto = await arquivo.text()
  const dados = JSON.parse(texto) as ArquivoDeBackup
  if (dados.app !== 'projetinho') throw new Error('Esse arquivo não é um backup do Projetinho')

  if (dados.perfil) await guardar(LOJAS.estado, dados.perfil, CHAVE_PERFIL)
  for (const d of dados.dias ?? []) await guardar(LOJAS.dias, d)
  for (const p of dados.pesos ?? []) await guardar(LOJAS.pesos, p)
  for (const r of dados.recados ?? []) await guardar(LOJAS.recados, r)
  for (const b of dados.beijinhos ?? []) await guardar(LOJAS.beijinhos, b)
  for (const f of dados.fotos ?? []) {
    const { arquivo: conteudo, ...meta } = f
    await guardar(LOJAS.fotos, await textoParaBlob(conteudo), meta.storage_path)
    await guardar(LOJAS.estado, meta, `foto:${meta.data}:${meta.tipo}`)
  }
  return { dias: dados.dias?.length ?? 0, fotos: dados.fotos?.length ?? 0 }
}
