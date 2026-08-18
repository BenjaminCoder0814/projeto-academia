import { motion } from 'framer-motion'
import { Download, MoveHorizontal } from 'lucide-react'
import { useRef, useState } from 'react'
import { diaMes } from '../lib/datas'
import { umaCasa } from '../lib/calculos'
import { Botao } from './ui'

type LadoFoto = { url: string; data: string; peso?: number | null }

/** Comparador antes/depois: arrasta para revelar, e exporta a imagem pronta. */
export function Comparador({ antes, depois }: { antes: LadoFoto; depois: LadoFoto }) {
  const [posicao, setPosicao] = useState(50)
  const [exportando, setExportando] = useState(false)
  const areaRef = useRef<HTMLDivElement>(null)

  function mover(clienteX: number) {
    const caixa = areaRef.current?.getBoundingClientRect()
    if (!caixa) return
    const pct = ((clienteX - caixa.left) / caixa.width) * 100
    setPosicao(Math.min(100, Math.max(0, pct)))
  }

  async function exportar() {
    setExportando(true)
    try {
      const blob = await montarImagem(antes, depois)
      const arquivo = new File([blob], 'antes-e-depois.jpg', { type: 'image/jpeg' })
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
      if (nav.canShare?.({ files: [arquivo] })) {
        await navigator.share({ files: [arquivo], title: 'Minha evolução 💗' })
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'antes-e-depois.jpg'
        a.click()
        setTimeout(() => URL.revokeObjectURL(url), 4000)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setExportando(false)
    }
  }

  return (
    <div>
      <div
        ref={areaRef}
        className="relative aspect-[3/4] w-full select-none overflow-hidden rounded-card bg-rosa-100"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          mover(e.clientX)
        }}
        onPointerMove={(e) => e.currentTarget.hasPointerCapture(e.pointerId) && mover(e.clientX)}
      >
        <img src={depois.url} alt="Depois" className="absolute inset-0 h-full w-full object-cover" />
        {/* recorte por clip-path: as duas fotos ficam sempre do mesmo tamanho e alinhadas */}
        <img
          src={antes.url}
          alt="Antes"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ clipPath: `inset(0 ${100 - posicao}% 0 0)` }}
        />

        <div
          className="absolute inset-y-0 w-1 bg-white shadow-rosaForte"
          style={{ left: `${posicao}%`, transform: 'translateX(-50%)' }}
        >
          <motion.span
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute top-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-rosa-500 shadow-rosaForte"
          >
            <MoveHorizontal size={20} />
          </motion.span>
        </div>

        <span className="absolute left-3 top-3 rounded-pill bg-black/45 px-3 py-1.5 text-xs font-bold text-white">
          {diaMes(antes.data)}
          {antes.peso ? ` · ${umaCasa(antes.peso)} kg` : ''}
        </span>
        <span className="absolute right-3 top-3 rounded-pill bg-rosa-500/90 px-3 py-1.5 text-xs font-bold text-white">
          {diaMes(depois.data)}
          {depois.peso ? ` · ${umaCasa(depois.peso)} kg` : ''}
        </span>
      </div>

      <Botao
        tipo="suave"
        className="mt-3 flex w-full items-center justify-center gap-2"
        onClick={exportar}
        desabilitado={exportando}
      >
        <Download size={17} /> {exportando ? 'preparando…' : 'Salvar o antes e depois 💗'}
      </Botao>
    </div>
  )
}

async function carregar(url: string): Promise<HTMLImageElement> {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.src = url
  await img.decode()
  return img
}

/** Monta a imagem lado a lado que ela manda no WhatsApp. */
async function montarImagem(antes: LadoFoto, depois: LadoFoto): Promise<Blob> {
  const [a, b] = await Promise.all([carregar(antes.url), carregar(depois.url)])
  const L = 1080
  const A = 1350
  const meia = L / 2
  const canvas = document.createElement('canvas')
  canvas.width = L
  canvas.height = A + 130
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#FFF5F9'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const desenhar = (img: HTMLImageElement, x: number) => {
    const escala = Math.max(meia / img.width, A / img.height)
    const l = img.width * escala
    const h = img.height * escala
    ctx.save()
    ctx.beginPath()
    ctx.rect(x, 0, meia, A)
    ctx.clip()
    ctx.drawImage(img, x + (meia - l) / 2, (A - h) / 2, l, h)
    ctx.restore()
  }

  desenhar(a, 0)
  desenhar(b, meia)

  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(meia - 3, 0, 6, A)

  const etiqueta = (texto: string, x: number, cor: string) => {
    ctx.font = 'bold 34px Outfit, system-ui, sans-serif'
    const largura = ctx.measureText(texto).width + 44
    ctx.fillStyle = cor
    ctx.beginPath()
    ctx.roundRect(x - largura / 2, 34, largura, 62, 31)
    ctx.fill()
    ctx.fillStyle = '#FFFFFF'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(texto, x, 66)
  }

  etiqueta(
    `${diaMes(antes.data)}${antes.peso ? ` · ${umaCasa(antes.peso)} kg` : ''}`,
    meia / 2,
    'rgba(43,30,40,.7)',
  )
  etiqueta(
    `${diaMes(depois.data)}${depois.peso ? ` · ${umaCasa(depois.peso)} kg` : ''}`,
    meia + meia / 2,
    '#FF4D8D',
  )

  ctx.fillStyle = '#2B1E28'
  ctx.font = 'bold 36px Outfit, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('Projetinho de Benjamin pra Isabela 💗', L / 2, A + 68)

  return new Promise<Blob>((ok, erro) =>
    canvas.toBlob((blob) => (blob ? ok(blob) : erro(new Error('falha'))), 'image/jpeg', 0.9),
  )
}
