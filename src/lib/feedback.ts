/** Vibracao e som — sempre tolerantes a navegador que nao suporta. */

export function vibrar(padrao: number | number[] = 80) {
  try {
    if ('vibrate' in navigator) navigator.vibrate(padrao)
  } catch {
    /* silencioso */
  }
}

let audioCtx: AudioContext | null = null

function contexto(): AudioContext | null {
  try {
    if (!audioCtx) {
      const Ctor = window.AudioContext ?? (window as any).webkitAudioContext
      if (!Ctor) return null
      audioCtx = new Ctor()
    }
    if (audioCtx.state === 'suspended') void audioCtx.resume()
    return audioCtx
  } catch {
    return null
  }
}

/** Destrava o audio no primeiro toque (exigencia do iOS). */
export function destravarAudio() {
  const ctx = contexto()
  if (!ctx) return
  const osc = ctx.createOscillator()
  const ganho = ctx.createGain()
  ganho.gain.value = 0.0001
  osc.connect(ganho).connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + 0.01)
}

export function bipe(frequencia = 880, duracao = 0.15, volume = 0.25) {
  const ctx = contexto()
  if (!ctx) return
  const osc = ctx.createOscillator()
  const ganho = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = frequencia
  ganho.gain.setValueAtTime(0, ctx.currentTime)
  ganho.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01)
  ganho.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duracao)
  osc.connect(ganho).connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + duracao + 0.02)
}

/** Aviso de 3 segundos antes da troca. */
export function bipeAviso() {
  bipe(660, 0.12)
  vibrar(40)
}

/** Momento exato da troca de intervalo. */
export function bipeTroca(paraCorrer: boolean) {
  if (paraCorrer) {
    bipe(1046, 0.16)
    setTimeout(() => bipe(1318, 0.22), 170)
    vibrar([90, 60, 140])
  } else {
    bipe(660, 0.2)
    vibrar([120])
  }
}

export function bipeFim() {
  ;[880, 1108, 1318, 1760].forEach((f, i) => setTimeout(() => bipe(f, 0.25), i * 180))
  vibrar([120, 80, 120, 80, 220])
}

export function reduzirMovimento(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}
