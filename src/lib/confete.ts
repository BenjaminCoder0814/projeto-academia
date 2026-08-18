import { reduzirMovimento } from './feedback'

const CORES = ['#FF4D8D', '#FF74A8', '#FFA0C4', '#C7A9FF', '#FFC978', '#FFFFFF']

type Particula = {
  x: number
  y: number
  vx: number
  vy: number
  giro: number
  vGiro: number
  tam: number
  cor: string
  coracao: boolean
}

type Opcoes = {
  quantidade?: number
  /** só coraçõezinhos, maiores e mais lentos */
  soCoracoes?: boolean
  duracao?: number
}

/** Confete rosa (e chuva de coração). Respeita prefers-reduced-motion. */
export function soltarConfete(opcoes: number | Opcoes = {}) {
  const { quantidade = 90, soCoracoes = false, duracao = 3200 } =
    typeof opcoes === 'number' ? { quantidade: opcoes } : opcoes

  if (reduzirMovimento()) return

  const canvas = document.createElement('canvas')
  canvas.setAttribute('aria-hidden', 'true')
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: '9999',
  } as CSSStyleDeclaration)
  document.body.appendChild(canvas)

  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const L = window.innerWidth
  const A = window.innerHeight
  canvas.width = L * dpr
  canvas.height = A * dpr
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    canvas.remove()
    return
  }
  ctx.scale(dpr, dpr)

  const particulas: Particula[] = Array.from({ length: quantidade }, () => ({
    x: Math.random() * L,
    y: -20 - Math.random() * A * (soCoracoes ? 0.8 : 0.4),
    vx: (Math.random() - 0.5) * (soCoracoes ? 1.1 : 2.4),
    vy: (soCoracoes ? 1.2 : 2) + Math.random() * (soCoracoes ? 1.8 : 3.4),
    giro: Math.random() * Math.PI * 2,
    vGiro: (Math.random() - 0.5) * (soCoracoes ? 0.06 : 0.25),
    tam: soCoracoes ? 14 + Math.random() * 18 : 6 + Math.random() * 8,
    cor: soCoracoes
      ? ['#FF4D8D', '#FF74A8', '#FFA0C4', '#E8107A'][Math.floor(Math.random() * 4)]
      : CORES[Math.floor(Math.random() * CORES.length)],
    coracao: soCoracoes || Math.random() < 0.28,
  }))

  function coracao(c: CanvasRenderingContext2D, t: number) {
    c.beginPath()
    c.moveTo(0, t * 0.3)
    c.bezierCurveTo(0, -t * 0.15, -t * 0.5, -t * 0.15, -t * 0.5, t * 0.15)
    c.bezierCurveTo(-t * 0.5, t * 0.45, 0, t * 0.6, 0, t * 0.85)
    c.bezierCurveTo(0, t * 0.6, t * 0.5, t * 0.45, t * 0.5, t * 0.15)
    c.bezierCurveTo(t * 0.5, -t * 0.15, 0, -t * 0.15, 0, t * 0.3)
    c.fill()
  }

  const inicio = performance.now()

  function quadro(agora: number) {
    const decorrido = agora - inicio
    ctx!.clearRect(0, 0, L, A)
    const fade = Math.max(0, 1 - Math.max(0, decorrido - duracao * 0.6) / (duracao * 0.4))
    ctx!.globalAlpha = fade
    for (const p of particulas) {
      p.x += p.vx
      p.y += p.vy
      p.vy += soCoracoes ? 0.012 : 0.035
      p.giro += p.vGiro
      ctx!.save()
      ctx!.translate(p.x, p.y)
      ctx!.rotate(p.giro)
      ctx!.fillStyle = p.cor
      if (p.coracao) coracao(ctx!, p.tam)
      else ctx!.fillRect(-p.tam / 2, -p.tam / 4, p.tam, p.tam / 2)
      ctx!.restore()
    }
    if (decorrido < duracao) requestAnimationFrame(quadro)
    else canvas.remove()
  }
  requestAnimationFrame(quadro)
}

/** Chuva de coraçõezinhos — usada no beijinho e no dia perfeito. */
export function chuvaDeCoracoes(quantidade = 45) {
  soltarConfete({ quantidade, soCoracoes: true, duracao: 4200 })
}
