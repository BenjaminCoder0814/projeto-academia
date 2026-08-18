import { diffDias, hojeISO, somarDias } from './datas'
import { DESAFIO_FIM, DESAFIO_INICIO, planoDoDia, type PlanoDoDia } from './calculos'

export type DiaDoDesafio = {
  data: string
  /** 1..15 */
  indice: number
  plano: PlanoDoDia
}

/** Os 15 dias do desafio, gerados a partir das datas limite. */
export function diasDoDesafio(inicio = DESAFIO_INICIO, fim = DESAFIO_FIM): DiaDoDesafio[] {
  const total = diffDias(inicio, fim) + 1
  return Array.from({ length: total }, (_, i) => {
    const data = somarDias(inicio, i)
    return { data, indice: i + 1, plano: planoDoDia(data) }
  })
}

export const TOTAL_DIAS = diffDias(DESAFIO_INICIO, DESAFIO_FIM) + 1

export function dentroDoDesafio(iso: string): boolean {
  return diffDias(DESAFIO_INICIO, iso) >= 0 && diffDias(iso, DESAFIO_FIM) >= 0
}

export type StatusDoDesafio = {
  diaAtual: number
  totalDias: number
  diasRestantes: number
  aindaNaoComecou: boolean
  terminou: boolean
  /** dia usado nas telas: preso ao intervalo do desafio */
  dataFoco: string
}

export function statusDoDesafio(hoje = hojeISO()): StatusDoDesafio {
  const passados = diffDias(DESAFIO_INICIO, hoje)
  const restantes = diffDias(hoje, DESAFIO_FIM)
  return {
    diaAtual: passados + 1,
    totalDias: TOTAL_DIAS,
    diasRestantes: Math.max(0, restantes),
    aindaNaoComecou: passados < 0,
    terminou: restantes < 0,
    dataFoco: passados < 0 ? DESAFIO_INICIO : restantes < 0 ? DESAFIO_FIM : hoje,
  }
}

/** 15 dias · 9 corridas · 7 natações · 2 sextas bônus · 4 folguinhas · 15 fotos */
export function totaisDoDesafio() {
  const dias = diasDoDesafio()
  return {
    dias: dias.length,
    corridas: dias.filter((d) => d.plano.corrida).length,
    natacoes: dias.filter((d) => d.plano.natacao).length,
    bonus: dias.filter((d) => d.plano.corridaBonus).length,
    folguinhas: dias.filter((d) => d.plano.tipo === 'folguinha').length,
    fotos: dias.length,
  }
}
