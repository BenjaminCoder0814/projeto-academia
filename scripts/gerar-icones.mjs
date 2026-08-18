// Gera os icones do PWA sem depender de nada externo.
// Uso: npm run icons
import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')

const TABELA_CRC = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = TABELA_CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(tipo, dados) {
  const tam = Buffer.alloc(4)
  tam.writeUInt32BE(dados.length)
  const corpo = Buffer.concat([Buffer.from(tipo, 'ascii'), dados])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(corpo))
  return Buffer.concat([tam, corpo, crc])
}

function png(largura, altura, rgba) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(largura, 0)
  ihdr.writeUInt32BE(altura, 4)
  ihdr[8] = 8 // bits por canal
  ihdr[9] = 6 // RGBA
  const linhas = Buffer.alloc((largura * 4 + 1) * altura)
  for (let y = 0; y < altura; y++) {
    const destino = y * (largura * 4 + 1)
    linhas[destino] = 0 // filtro "none"
    rgba.copy(linhas, destino + 1, y * largura * 4, (y + 1) * largura * 4)
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(linhas, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const misturar = (a, b, t) => a + (b - a) * t

/** Coracao implicito: (x²+y²−1)³ − x²y³ ≤ 0 */
function dentroDoCoracao(x, y) {
  const a = x * x + y * y - 1
  return a * a * a - x * x * y * y * y <= 0
}

function gerar(tamanho, { margem = 0 } = {}) {
  const AA = 3 // supersampling
  const rgba = Buffer.alloc(tamanho * tamanho * 4)
  const raio = tamanho * 0.235
  const borda = tamanho * margem

  for (let y = 0; y < tamanho; y++) {
    for (let x = 0; x < tamanho; x++) {
      let r = 0
      let g = 0
      let b = 0
      let alfa = 0

      for (let sy = 0; sy < AA; sy++) {
        for (let sx = 0; sx < AA; sx++) {
          const px = x + (sx + 0.5) / AA
          const py = y + (sy + 0.5) / AA

          // quadrado arredondado
          const dx = Math.max(borda + raio - px, px - (tamanho - borda - raio), 0)
          const dy = Math.max(borda + raio - py, py - (tamanho - borda - raio), 0)
          if (Math.hypot(dx, dy) > raio) continue

          // gradiente 135deg rosa -> lavanda
          const t = (px / tamanho + py / tamanho) / 2
          let cr = misturar(0xff, 0xc7, t)
          let cg = misturar(0x4d, 0xa9, t)
          let cb = misturar(0x8d, 0xff, t)

          // coracao branco no centro
          const hx = (px - tamanho / 2) / (tamanho * 0.27)
          const hy = -(py - tamanho * 0.47) / (tamanho * 0.27)
          if (dentroDoCoracao(hx, hy)) {
            cr = 0xff
            cg = 0xff
            cb = 0xff
          }

          r += cr
          g += cg
          b += cb
          alfa += 255
        }
      }

      const amostras = AA * AA
      const i = (y * tamanho + x) * 4
      if (alfa > 0) {
        const cobertura = alfa / (amostras * 255)
        rgba[i] = Math.round(r / (amostras * cobertura))
        rgba[i + 1] = Math.round(g / (amostras * cobertura))
        rgba[i + 2] = Math.round(b / (amostras * cobertura))
        rgba[i + 3] = Math.round(cobertura * 255)
      }
    }
  }
  return png(tamanho, tamanho, rgba)
}

const arquivos = [
  ['public/icone-192.png', gerar(192)],
  ['public/icone-512.png', gerar(512)],
  ['public/icone-180.png', gerar(180)],
]

for (const [caminho, dados] of arquivos) {
  writeFileSync(join(raiz, caminho), dados)
  console.log('gerado', caminho, `${(dados.length / 1024).toFixed(1)} KB`)
}
