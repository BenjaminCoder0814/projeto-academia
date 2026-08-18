import { motion } from 'framer-motion'
import { Camera, RefreshCw, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { vibrar } from '../lib/feedback'

/**
 * Camera dentro do app para a foto de progresso: silhueta-guia + a foto do dia
 * anterior como fantasma a 25%. E o que faz o "antes e depois" ficar alinhado.
 */
export function CameraGuiada({
  urlFantasma,
  aoCapturar,
  aoFechar,
  comGuia = true,
}: {
  urlFantasma?: string | null
  aoCapturar: (blob: Blob) => void
  aoFechar: () => void
  comGuia?: boolean
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [frontal, setFrontal] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [mostrarFantasma, setMostrarFantasma] = useState(true)
  const [contagem, setContagem] = useState<number | null>(null)

  const iniciar = useCallback(async (usarFrontal: boolean) => {
    setErro(null)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: usarFrontal ? 'user' : 'environment',
          width: { ideal: 1440 },
          height: { ideal: 1920 },
        },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => undefined)
      }
    } catch {
      setErro('Não consegui abrir a câmera. Use o botão de escolher da galeria.')
    }
  }, [])

  useEffect(() => {
    void iniciar(frontal)
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [frontal, iniciar])

  function capturar() {
    const video = videoRef.current
    if (!video || !video.videoWidth) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0)
    canvas.toBlob(
      (blob) => {
        if (blob) {
          vibrar(60)
          aoCapturar(blob)
        }
      },
      'image/jpeg',
      0.92,
    )
  }

  function disparar() {
    setContagem(3)
    let n = 3
    const t = setInterval(() => {
      n -= 1
      vibrar(25)
      if (n === 0) {
        clearInterval(t)
        setContagem(null)
        capturar()
      } else {
        setContagem(n)
      }
    }, 1000)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-carvao"
    >
      <video
        ref={videoRef}
        playsInline
        muted
        className="absolute inset-0 h-full w-full object-cover"
      />

      {urlFantasma && mostrarFantasma && (
        <img
          src={urlFantasma}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-25"
        />
      )}

      {comGuia && <SilhuetaGuia />}

      {contagem !== null && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <motion.span
            key={contagem}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="font-display text-[120px] font-extrabold text-white drop-shadow-lg"
          >
            {contagem}
          </motion.span>
        </div>
      )}

      {erro && (
        <div className="absolute inset-x-4 top-24 rounded-card bg-white/95 p-4 text-center text-sm text-carvao">
          {erro}
        </div>
      )}

      <div className="area-segura-alto absolute inset-x-0 top-0 flex items-center justify-between p-4">
        <button
          type="button"
          onClick={aoFechar}
          aria-label="Fechar câmera"
          className="grid h-12 w-12 place-items-center rounded-full bg-black/40 text-white"
        >
          <X size={22} />
        </button>
        <p className="rounded-pill bg-black/40 px-4 py-2 text-xs font-semibold text-white">
          {urlFantasma ? 'Alinhe com a foto de ontem' : 'Fique dentro da silhueta'}
        </p>
        <button
          type="button"
          onClick={() => setFrontal((f) => !f)}
          aria-label="Trocar de câmera"
          className="grid h-12 w-12 place-items-center rounded-full bg-black/40 text-white"
        >
          <RefreshCw size={20} />
        </button>
      </div>

      <div className="area-segura-baixo absolute inset-x-0 bottom-0 flex items-center justify-around p-6 pb-10">
        {urlFantasma ? (
          <button
            type="button"
            onClick={() => setMostrarFantasma((v) => !v)}
            className="rounded-pill bg-black/40 px-4 py-3 text-xs font-semibold text-white toque"
          >
            {mostrarFantasma ? 'Ocultar ontem' : 'Mostrar ontem'}
          </button>
        ) : (
          <span className="w-24" />
        )}

        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          onClick={disparar}
          aria-label="Tirar foto"
          className="grid h-20 w-20 place-items-center rounded-full border-4 border-white bg-rosa-500 text-white shadow-rosaForte"
        >
          <Camera size={30} />
        </motion.button>

        <span className="w-24" />
      </div>
    </motion.div>
  )
}

function SilhuetaGuia() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 100 200"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <g fill="none" stroke="rgba(255,255,255,.65)" strokeWidth="0.8" strokeDasharray="3 2.5">
        <circle cx="50" cy="42" r="11" />
        <path d="M39 62 q11 -6 22 0 l4 34 q-13 5 -30 0 z" />
        <path d="M39 62 l-7 32 M61 62 l7 32" />
        <path d="M43 96 l-2 44 M57 96 l2 44" />
        <line x1="50" y1="20" x2="50" y2="180" strokeWidth="0.35" strokeDasharray="2 4" />
      </g>
    </svg>
  )
}
