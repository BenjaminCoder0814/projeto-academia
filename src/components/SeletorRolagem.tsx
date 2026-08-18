import { useEffect, useRef } from 'react'
import { vibrar } from '../lib/feedback'

const ITEM = 52

/** Seletor de rolagem com encaixe — usado para a altura no onboarding. */
export function SeletorRolagem({
  min,
  max,
  valor,
  aoMudar,
  sufixo = '',
}: {
  min: number
  max: number
  valor: number
  aoMudar: (v: number) => void
  sufixo?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const ultimo = useRef(valor)
  const valores = Array.from({ length: max - min + 1 }, (_, i) => min + i)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const alvo = (valor - min) * ITEM
    if (Math.abs(el.scrollTop - alvo) > 2) el.scrollTo({ top: alvo, behavior: 'auto' })
    // roda so na montagem: depois quem manda e o gesto do usuario
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function aoRolar() {
    const el = ref.current
    if (!el) return
    const indice = Math.round(el.scrollTop / ITEM)
    const novo = Math.min(max, Math.max(min, min + indice))
    if (novo !== ultimo.current) {
      ultimo.current = novo
      vibrar(8)
      aoMudar(novo)
    }
  }

  return (
    <div className="relative mx-auto h-[156px] w-40">
      <div className="pointer-events-none absolute inset-x-0 top-1/2 z-10 h-[52px] -translate-y-1/2 rounded-2xl border-2 border-rosa-300 bg-rosa-100/50" />
      <div
        ref={ref}
        onScroll={aoRolar}
        className="h-full snap-y snap-mandatory overflow-y-auto"
        style={{ scrollbarWidth: 'none', paddingTop: ITEM, paddingBottom: ITEM }}
      >
        {valores.map((v) => (
          <div
            key={v}
            className={`num flex snap-center items-center justify-center font-display text-2xl font-bold transition-colors ${
              v === valor ? 'text-rosa-500' : 'text-cinza/50'
            }`}
            style={{ height: ITEM }}
          >
            {v}
            <span className="ml-1 text-sm font-semibold">{sufixo}</span>
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[52px] bg-gradient-to-b from-white to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[52px] bg-gradient-to-t from-white to-transparent" />
    </div>
  )
}
