const LADO_MAX = 1440
const QUALIDADE = 0.82

/**
 * Comprime a foto no proprio celular antes de subir:
 * no maximo 1440 px no maior lado, JPEG 0.82, com a orientacao EXIF ja aplicada
 * (`imageOrientation: 'from-image'` evita a foto deitada do iPhone).
 */
export async function comprimirFoto(arquivo: File | Blob): Promise<Blob> {
  const bitmap = await carregarBitmap(arquivo)
  const escala = Math.min(1, LADO_MAX / Math.max(bitmap.width, bitmap.height))
  const largura = Math.round(bitmap.width * escala)
  const altura = Math.round(bitmap.height * escala)

  const canvas = document.createElement('canvas')
  canvas.width = largura
  canvas.height = altura
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Não foi possível preparar a imagem')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, 0, 0, largura, altura)
  if ('close' in bitmap) (bitmap as ImageBitmap).close()

  const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, 'image/jpeg', QUALIDADE))
  if (!blob) throw new Error('Não foi possível comprimir a imagem')
  return blob
}

async function carregarBitmap(arquivo: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(arquivo, { imageOrientation: 'from-image' })
    } catch {
      /* cai no fallback */
    }
  }
  const url = URL.createObjectURL(arquivo)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    return img
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 5000)
  }
}

export function tamanhoLegivel(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
