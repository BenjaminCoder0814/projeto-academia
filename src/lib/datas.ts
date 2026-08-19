/**
 * Tudo neste app acontece no fuso America/Sao_Paulo.
 * O "dia" vira a meia-noite de Brasilia, por isso as datas de registro
 * circulam como string ISO 'YYYY-MM-DD' e nunca como timestamp UTC.
 */
export const FUSO = 'America/Sao_Paulo'

const fmtISO = new Intl.DateTimeFormat('en-CA', {
  timeZone: FUSO,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** Data de hoje em Brasilia, no formato 'YYYY-MM-DD'. */
export function hojeISO(agora: Date = new Date()): string {
  return fmtISO.format(agora)
}

/** Converte 'YYYY-MM-DD' em Date ao meio-dia local (imune a virada de fuso). */
export function isoParaData(iso: string): Date {
  const [a, m, d] = iso.split('-').map(Number)
  return new Date(a, m - 1, d, 12, 0, 0, 0)
}

/** Converte um Date em 'YYYY-MM-DD' usando os campos locais dele. */
export function dataParaISO(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** Soma dias a uma data ISO. */
export function somarDias(iso: string, dias: number): string {
  const d = isoParaData(iso)
  d.setDate(d.getDate() + dias)
  return dataParaISO(d)
}

/** Diferenca em dias inteiros entre duas datas ISO (b - a). */
export function diffDias(a: string, b: string): number {
  const ms = isoParaData(b).getTime() - isoParaData(a).getTime()
  return Math.round(ms / 86400000)
}

/** 0 = domingo ... 6 = sabado */
export function diaDaSemana(iso: string): number {
  return isoParaData(iso).getDay()
}

const DIAS_LONGOS = [
  'domingo',
  'segunda-feira',
  'terca-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sabado',
]
const DIAS_CURTOS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const MESES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
]

/** "terça-feira, 18 de agosto" */
export function dataPorExtenso(iso: string): string {
  const d = isoParaData(iso)
  const nome = d.toLocaleDateString('pt-BR', { weekday: 'long' })
  return `${nome}, ${d.getDate()} de ${MESES[d.getMonth()]}`
}

export function nomeDoDia(iso: string): string {
  return DIAS_LONGOS[diaDaSemana(iso)]
}

export function letraDoDia(indice: number): string {
  return DIAS_CURTOS[indice]
}

/** "18/08" */
export function diaMes(iso: string): string {
  const d = isoParaData(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}`
}

/** "agosto de 2026" */
export function nomeDoMes(ano: number, mes: number): string {
  return `${MESES[mes]} de ${ano}`
}

/** Grade do mês: células vazias no começo + todos os dias em ISO. */
export function gradeDoMes(ano: number, mes: number): (string | null)[] {
  const primeiro = new Date(ano, mes, 1, 12)
  const total = new Date(ano, mes + 1, 0, 12).getDate()
  const vazios = Array.from({ length: primeiro.getDay() }, () => null)
  const dias = Array.from({ length: total }, (_, i) => dataParaISO(new Date(ano, mes, i + 1, 12)))
  return [...vazios, ...dias]
}

/** Só o número do dia. */
export function numeroDoDia(iso: string): number {
  return Number(iso.slice(8, 10))
}

/** Hora cheia em Brasília (0 a 23). */
export function horaEmBrasilia(agora: Date = new Date()): number {
  return Number(
    new Intl.DateTimeFormat('pt-BR', { timeZone: FUSO, hour: '2-digit', hour12: false }).format(
      agora,
    ),
  )
}

/** Saudacao pelo horario de Brasilia. */
export function saudacao(agora: Date = new Date()): string {
  const hora = Number(
    new Intl.DateTimeFormat('pt-BR', { timeZone: FUSO, hour: '2-digit', hour12: false }).format(agora),
  )
  if (hora < 12) return 'Bom dia'
  if (hora < 18) return 'Boa tarde'
  return 'Boa noite'
}
