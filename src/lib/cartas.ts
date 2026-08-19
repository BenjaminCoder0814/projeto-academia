import { CARTAS_DO_DIA, HORA_QUE_ABRE, type CartaDoDia } from '../conteudo/cartas'
import { diffDias, horaEmBrasilia } from './datas'
import { diasDoDesafio } from './fase'

export type EstadoDaCarta = {
  carta: CartaDoDia | null
  liberada: boolean
  /** por que ainda não abriu, em português de gente */
  aviso: string | null
}

/** A carta daquele dia do desafio. */
export function cartaDaData(data: string): CartaDoDia | null {
  const indice = diasDoDesafio().find((d) => d.data === data)?.indice
  return CARTAS_DO_DIA.find((c) => c.dia === indice) ?? null
}

/**
 * Cada carta abre só no dia dela, e só a partir das 14:00 — a hora do treino.
 * As de dias passados ficam sempre disponíveis pra ela reler.
 */
export function estadoDaCarta(data: string, hoje: string, agora: Date = new Date()): EstadoDaCarta {
  const carta = cartaDaData(data)
  if (!carta) return { carta: null, liberada: false, aviso: null }

  const distancia = diffDias(hoje, data) // > 0 = ainda vem

  if (distancia > 0) {
    return { carta, liberada: false, aviso: `abre no dia, às ${HORA_QUE_ABRE}h 💗` }
  }
  if (distancia < 0) return { carta, liberada: true, aviso: null }

  const hora = horaEmBrasilia(agora)
  if (hora < HORA_QUE_ABRE) {
    return { carta, liberada: false, aviso: `abre hoje às ${HORA_QUE_ABRE}h, na hora do treino 💗` }
  }
  return { carta, liberada: true, aviso: null }
}
