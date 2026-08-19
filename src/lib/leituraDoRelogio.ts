/**
 * Lê as calorias e os batimentos direto da foto do relógio.
 *
 * Usa OCR no próprio celular (tesseract.js, carregado só na hora). Não é
 * mágica: tela de relógio tem fonte pequena, brilho e reflexo, então às vezes
 * erra — por isso os números continuam editáveis na tela do dia.
 */

export type LeituraDoRelogio = {
  calorias: number | null
  fcMedia: number | null
  /** o texto cru que saiu do OCR, útil pra entender um erro */
  bruto: string
}

/** Deixa a foto mais fácil de ler: cinza, contraste alto e tamanho bom. */
async function preparar(arquivo: Blob): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(arquivo)
    const alvo = 1200
    const escala = Math.min(2, Math.max(1, alvo / Math.max(bitmap.width, bitmap.height)))
    const largura = Math.round(bitmap.width * escala)
    const altura = Math.round(bitmap.height * escala)

    const canvas = document.createElement('canvas')
    canvas.width = largura
    canvas.height = altura
    const ctx = canvas.getContext('2d')
    if (!ctx) return arquivo
    ctx.drawImage(bitmap, 0, 0, largura, altura)
    bitmap.close?.()

    const imagem = ctx.getImageData(0, 0, largura, altura)
    const p = imagem.data
    for (let i = 0; i < p.length; i += 4) {
      const cinza = 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2]
      // contraste forte: tela de relógio costuma ser clara sobre fundo escuro
      const ajustado = cinza < 110 ? Math.max(0, cinza - 40) : Math.min(255, cinza + 40)
      p[i] = p[i + 1] = p[i + 2] = ajustado
    }
    ctx.putImageData(imagem, 0, 0)

    const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, 'image/png'))
    return blob ?? arquivo
  } catch {
    return arquivo
  }
}

const soNumero = (t: string) => Number(t.replace(/[^0-9]/g, ''))

/**
 * Acha "417 kcal" e também "kcal 417".
 * O `[ \t]*` (em vez de `\s*`) é de propósito: sem isso o número de uma linha
 * gruda na unidade da linha de baixo e sai tudo trocado.
 */
function acharComUnidade(texto: string, unidades: string, digitos: string): number | null {
  const depois = texto.match(new RegExp('([0-9]{' + digitos + '})[ \\t]*(' + unidades + ')'))
  if (depois) return soNumero(depois[1])
  const antes = texto.match(new RegExp('(' + unidades + ')[^0-9\\n]{0,6}([0-9]{' + digitos + '})'))
  if (antes) return soNumero(antes[2])
  return null
}

/**
 * Tira os números do texto do OCR.
 * Primeiro procura com a unidade colada (417 kcal, 148 bpm), que é o caso
 * confiável. Só se não achar é que usa faixa plausível: batimento entre 40 e
 * 220, caloria entre 50 e 3000.
 */
export function interpretar(texto: string): Omit<LeituraDoRelogio, 'bruto'> {
  const base = texto.toLowerCase()
  // o tempo do treino (00:40:00, 40:12) não é caloria nem batimento
  const semTempo = base.replace(/[0-9]{1,2}:[0-9]{2}(:[0-9]{2})?/g, ' ')
  // erro clássico de OCR: O no lugar de zero — mas só quando está junto de dígito,
  // senão "calorias" viraria "cal0rias" e a unidade se perderia
  const limpo = semTempo
    .replace(/(?<=[0-9])o|o(?=[0-9])/g, '0')
    .replace(/(?<=[0-9])[|l]|[|l](?=[0-9])/g, '1')

  let calorias = acharComUnidade(limpo, 'kcal|cal\\b|calorias?', '2,4')
  let fcMedia = acharComUnidade(limpo, 'bpm|batimentos?', '2,3')

  if (calorias === null || fcMedia === null) {
    const numeros = [...limpo.matchAll(/[0-9]{2,4}/g)].map((m) => Number(m[0]))
    if (fcMedia === null) fcMedia = numeros.find((n) => n >= 40 && n <= 220) ?? null
    if (calorias === null) {
      calorias = numeros.find((n) => n >= 50 && n <= 3000 && n !== fcMedia) ?? null
    }
  }

  // sanidade: nada de 9999 calorias nem 5 batimentos
  if (calorias !== null && (calorias < 20 || calorias > 4000)) calorias = null
  if (fcMedia !== null && (fcMedia < 35 || fcMedia > 230)) fcMedia = null

  return { calorias, fcMedia }
}

/** Roda o OCR na foto do relógio. Devolve nulos se não conseguir ler. */
export async function lerRelogio(arquivo: Blob): Promise<LeituraDoRelogio> {
  try {
    const { createWorker } = await import('tesseract.js')
    const preparada = await preparar(arquivo)
    const worker = await createWorker('eng')
    try {
      const { data } = await worker.recognize(preparada)
      const bruto = data.text ?? ''
      return { ...interpretar(bruto), bruto }
    } finally {
      await worker.terminate()
    }
  } catch (e) {
    console.error('não deu pra ler o relógio', e)
    return { calorias: null, fcMedia: null, bruto: '' }
  }
}
