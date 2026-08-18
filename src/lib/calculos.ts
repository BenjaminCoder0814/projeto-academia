import { diaDaSemana } from './datas'

/* ------------------------------------------------------------------ */
/* A Isabela                                                           */
/* ------------------------------------------------------------------ */

/** 25/05/2007 */
export const NASCIMENTO = '2007-05-25'

/** Idade em anos completos — sempre dinâmica, nunca escrita no código. */
export function idadeDaIsabela(nascimentoISO: string = NASCIMENTO, hoje: Date = new Date()): number {
  const [ano, mes, dia] = nascimentoISO.split('-').map(Number)
  const anos = hoje.getFullYear() - ano
  const antesDoAniversario =
    hoje.getMonth() + 1 < mes || (hoje.getMonth() + 1 === mes && hoje.getDate() < dia)
  return antesDoAniversario ? anos - 1 : anos
}

/* ------------------------------------------------------------------ */
/* IMC                                                                 */
/* ------------------------------------------------------------------ */

export type ClasseIMC = { rotulo: string; cor: string; saudavel: boolean }

export function calcularIMC(pesoKg: number, alturaCm: number): number {
  const m = alturaCm / 100
  return pesoKg / (m * m)
}

/** Tabela adulta da OMS (vale a partir dos 19 anos). Sempre exibida com carinho. */
export function classificarIMC(imc: number): ClasseIMC {
  if (imc < 18.5) return { rotulo: 'abaixo da faixa', cor: '#7DD3FC', saudavel: false }
  if (imc < 25) return { rotulo: 'faixa saudável', cor: '#4ADE80', saudavel: true }
  if (imc < 30) return { rotulo: 'acima da faixa', cor: '#FFC978', saudavel: false }
  return { rotulo: 'bem acima da faixa', cor: '#FF7A85', saudavel: false }
}

/* ------------------------------------------------------------------ */
/* Peso ideal                                                          */
/* ------------------------------------------------------------------ */

export type FaixaPeso = { min: number; max: number }

/** Faixa saudável da OMS: IMC 18,5 a 24,9. */
export function faixaSaudavel(alturaCm: number): FaixaPeso {
  const m2 = (alturaCm / 100) ** 2
  return { min: 18.5 * m2, max: 24.9 * m2 }
}

/** A meta fofa da barrinha: o pontinho no meio da faixa saudável (IMC 22). */
export function metaDePeso(alturaCm: number): number {
  return 22 * (alturaCm / 100) ** 2
}

export type FormulasPesoIdeal = {
  devine: number
  robinson: number
  miller: number
  hamwi: number
  media: number
}

/**
 * Fórmulas clássicas (versão feminina).
 * `pol` = polegadas acima de 1,524 m e PODE ficar negativa em alturas menores.
 * É assim que a tabela de conferência foi calculada (1,50 m → 46,5 kg) e é o
 * resultado coerente: travar em zero faria toda altura abaixo de 1,52 m cair no
 * mesmo número. Não "conserte" isso.
 */
export function formulasPesoIdeal(alturaCm: number): FormulasPesoIdeal {
  const pol = (alturaCm - 152.4) / 2.54
  const devine = 45.5 + 2.3 * pol
  const robinson = 49.0 + 1.7 * pol
  const miller = 53.1 + 1.36 * pol
  const hamwi = 45.5 + 2.2 * pol
  return { devine, robinson, miller, hamwi, media: (devine + robinson + miller + hamwi) / 4 }
}

/** Quanto do caminho ela já andou, travado entre 0 e 100. */
export function progressoDoPeso(pesoInicial: number, pesoAtual: number, meta: number): number {
  const total = pesoInicial - meta
  if (total <= 0) return 100
  return Math.min(100, Math.max(0, ((pesoInicial - pesoAtual) / total) * 100))
}

/* ------------------------------------------------------------------ */
/* A rotina da semana                                                  */
/* ------------------------------------------------------------------ */

export const CORRIDA_MIN = 40
export const NATACAO_MIN = 45
export const CORRIDA_CICLOS = 20
export const CORRIDA_HORARIO = '14:00 – 15:30'
export const NATACAO_HORARIO = '15:45 – 16:30'

export const DESAFIO_INICIO = '2026-08-18'
export const DESAFIO_FIM = '2026-09-01'

export type TipoDeDia = 'treino' | 'bonus' | 'folguinha'

export type PlanoDoDia = {
  tipo: TipoDeDia
  /** corrida obrigatória (segunda a quinta) */
  corrida: boolean
  /** corrida opcional (sexta) — nunca cobrada */
  corridaBonus: boolean
  /** natação só terça, quarta e quinta */
  natacao: boolean
  emoji: string
  legenda: string
}

/**
 * Segunda: só corrida · Terça, quarta e quinta: corrida + natação ·
 * Sexta: corrida bônus (sem pressão) · Sábado e domingo: folguinha.
 */
export function planoDoDia(iso: string): PlanoDoDia {
  const dow = diaDaSemana(iso)
  if (dow === 0 || dow === 6) {
    return {
      tipo: 'folguinha',
      corrida: false,
      corridaBonus: false,
      natacao: false,
      emoji: '💤',
      legenda: 'Folguinha',
    }
  }
  if (dow === 5) {
    return {
      tipo: 'bonus',
      corrida: false,
      corridaBonus: true,
      natacao: false,
      emoji: '⭐',
      legenda: 'Bônus — sem pressão',
    }
  }
  const natacao = dow >= 2 && dow <= 4
  return {
    tipo: 'treino',
    corrida: true,
    corridaBonus: false,
    natacao,
    emoji: natacao ? '💗🏊' : '💗',
    legenda: natacao ? 'Corrida + natação' : 'Dia de corrida',
  }
}

/** Minutos de atividade do dia — a sexta só conta se ela marcar o bônus. */
export function minutosDoDia(iso: string, bonusFeito = false): number {
  const p = planoDoDia(iso)
  let minutos = 0
  if (p.corrida) minutos += CORRIDA_MIN
  if (p.corridaBonus && bonusFeito) minutos += CORRIDA_MIN
  if (p.natacao) minutos += NATACAO_MIN
  return minutos
}

/* ------------------------------------------------------------------ */
/* Água                                                                */
/* ------------------------------------------------------------------ */

export const AGUA_MIN_ML = 2000
export const AGUA_MAX_ML = 4000
const ML_POR_KG = 35
const ML_POR_HORA_TREINO = 600

/**
 * Arredonda para o múltiplo de 50 mais próximo, resolvendo o empate para o
 * múltiplo par. É o único critério que reproduz a tabela de conferência linha
 * por linha: 65 kg em dia de natação = 3125 ml → 3100 ml, mas 75 kg = 3475 ml → 3500 ml.
 */
export function arredondarPara50(ml: number): number {
  const n = ml / 50
  const piso = Math.floor(n)
  const resto = n - piso
  let alvo: number
  if (resto > 0.5) alvo = piso + 1
  else if (resto < 0.5) alvo = piso
  else alvo = piso % 2 === 0 ? piso : piso + 1
  return alvo * 50
}

export function metaAguaMl(pesoKg: number, minutosAtividade: number): number {
  const bruto = arredondarPara50(ML_POR_KG * pesoKg + ML_POR_HORA_TREINO * (minutosAtividade / 60))
  return Math.min(AGUA_MAX_ML, Math.max(AGUA_MIN_ML, bruto))
}

/** Meta do dia, já considerando o plano e o bônus de sexta. */
export function metaAguaDoDia(pesoKg: number, iso: string, bonusFeito = false): number {
  return metaAguaMl(pesoKg, minutosDoDia(iso, bonusFeito))
}

/* ------------------------------------------------------------------ */
/* Formatação                                                          */
/* ------------------------------------------------------------------ */

export function umaCasa(n: number): string {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

export function litros(ml: number): string {
  return (ml / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}
