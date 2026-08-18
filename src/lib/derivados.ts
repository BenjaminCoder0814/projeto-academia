import { planoDoDia } from './calculos'
import { diffDias } from './datas'
import { dentroDoDesafio, diasDoDesafio } from './fase'
import type { Dia, Foto, Snapshot, TipoFoto } from './tipos'

export type Tarefa = { aplicavel: boolean; feito: boolean }

export type TarefasDoDia = {
  corrida: Tarefa
  natacao: Tarefa
  /** sexta: nunca entra na conta do dia perfeito */
  bonus: Tarefa
  agua: Tarefa
  fotoEvolucao: Tarefa
  fotoRelogio: Tarefa
}

export function tarefasDoDia(data: string, dia: Dia | undefined, fotos: Foto[]): TarefasDoDia {
  const plano = planoDoDia(data)
  const doDia = fotos.filter((f) => f.data === data)
  const treino = plano.tipo === 'treino'
  return {
    corrida: { aplicavel: plano.corrida, feito: Boolean(dia?.corrida_ok) },
    natacao: { aplicavel: plano.natacao, feito: Boolean(dia?.natacao_ok) },
    bonus: { aplicavel: plano.corridaBonus, feito: Boolean(dia?.bonus_sexta_ok) },
    agua: {
      aplicavel: treino,
      feito: Boolean(dia && dia.agua_meta_ml > 0 && dia.agua_ml >= dia.agua_meta_ml),
    },
    fotoEvolucao: { aplicavel: treino, feito: doDia.some((f) => f.tipo === 'evolucao') },
    fotoRelogio: { aplicavel: treino, feito: doDia.some((f) => f.tipo === 'relogio') },
  }
}

/**
 * Dia de treino: perfeito quando tudo que valia pra ele está marcado.
 * Folguinha: nada é obrigatório, mas se ela tirar a fotinha e bater a água,
 * o dia também vira perfeito (carinho, não cobrança).
 * Sexta: nunca entra aqui — o bônus tem estado próprio e jamais cobra nada.
 */
export function ehDiaPerfeito(data: string, tarefas: TarefasDoDia): boolean {
  const tipo = planoDoDia(data).tipo
  if (tipo === 'bonus') return false
  if (tipo === 'folguinha') return tarefas.fotoEvolucao.feito && tarefas.agua.feito

  const obrigatorias = [
    tarefas.corrida,
    tarefas.natacao,
    tarefas.agua,
    tarefas.fotoEvolucao,
    tarefas.fotoRelogio,
  ]
  if (!obrigatorias.some((t) => t.aplicavel)) return false
  return obrigatorias.every((t) => !t.aplicavel || t.feito)
}

export function algumaCoisaFeita(tarefas: TarefasDoDia): boolean {
  return Object.values(tarefas).some((t) => t.feito)
}

export type EstadoDoDia =
  | 'arrasou' // treino cumprido inteirinho
  | 'quaseLa' // treino em parte
  | 'vemAi' // treino que ainda não chegou
  | 'deixouPassar' // treino que passou em branco
  | 'bonusFeito' // sexta com a corrida bônus
  | 'bonus' // sexta sem pressão nenhuma
  | 'folguinha' // sábado e domingo
  | 'folguinhaCheia' // folguinha com fotinha e água — ganha coraçãozinho
  | 'foraDoDesafio'

export function estadoDoDia(data: string, hoje: string, snap: Snapshot): EstadoDoDia {
  if (!dentroDoDesafio(data)) return 'foraDoDesafio'
  const plano = planoDoDia(data)
  const dia = snap.dias.find((d) => d.data === data)
  const tarefas = tarefasDoDia(data, dia, snap.fotos)

  if (plano.tipo === 'folguinha') {
    return ehDiaPerfeito(data, tarefas) ? 'folguinhaCheia' : 'folguinha'
  }
  if (plano.tipo === 'bonus') return tarefas.bonus.feito ? 'bonusFeito' : 'bonus'

  if (ehDiaPerfeito(data, tarefas)) return 'arrasou'
  if (algumaCoisaFeita(tarefas)) return 'quaseLa'
  // hoje e o futuro nunca aparecem como perdidos
  return diffDias(hoje, data) >= 0 ? 'vemAi' : 'deixouPassar'
}

/**
 * Dias seguidos sem deixar treino passar.
 * Sexta, sábado e domingo nunca quebram — só somam quando ela faz algo.
 */
export function sequencia(hoje: string, snap: Snapshot): number {
  const dias = diasDoDesafio().filter((d) => diffDias(hoje, d.data) <= 0)
  let conta = 0
  for (let i = dias.length - 1; i >= 0; i--) {
    const { data } = dias[i]
    const estado = estadoDoDia(data, hoje, snap)
    if (
      estado === 'arrasou' ||
      estado === 'bonusFeito' ||
      estado === 'folguinha' ||
      estado === 'folguinhaCheia'
    ) {
      conta++
      continue
    }
    if (estado === 'bonus') continue // sexta sem bônus: passa reto, sem punir
    if (data === hoje) continue // o dia de hoje ainda está aberto
    break
  }
  return conta
}

export type Resumo = {
  corridas: { feitas: number; previstas: number; pct: number }
  natacoes: { feitas: number; previstas: number; pct: number }
  agua: { feitas: number; previstas: number; pct: number }
  fotos: { feitas: number; previstas: number; pct: number }
  fotosExtras: number
  bonus: number
  diasPerfeitos: number
}

const pct = (feitas: number, previstas: number) => (previstas === 0 ? 0 : (feitas / previstas) * 100)

/** Conta só o que já aconteceu — o futuro nunca pesa contra ela. */
export function resumo(hoje: string, snap: Snapshot): Resumo {
  const ateHoje = diasDoDesafio().filter((d) => diffDias(hoje, d.data) <= 0)
  let corridasP = 0
  let corridasF = 0
  let natacoesP = 0
  let natacoesF = 0
  let aguaP = 0
  let aguaF = 0
  let fotosP = 0
  let fotosF = 0
  let fotosExtras = 0
  let bonus = 0
  let perfeitos = 0

  for (const d of ateHoje) {
    const dia = snap.dias.find((x) => x.data === d.data)
    const t = tarefasDoDia(d.data, dia, snap.fotos)
    if (t.corrida.aplicavel) {
      corridasP++
      if (t.corrida.feito) corridasF++
    }
    if (t.natacao.aplicavel) {
      natacoesP++
      if (t.natacao.feito) natacoesF++
    }
    if (t.agua.aplicavel) {
      aguaP++
      if (t.agua.feito) aguaF++
    }
    if (t.bonus.feito) bonus++
    // as fotinhas só contam nos dias de treino: sexta e fim de semana são livres
    if (t.fotoEvolucao.aplicavel) {
      fotosP++
      if (t.fotoEvolucao.feito) fotosF++
    } else if (t.fotoEvolucao.feito) {
      fotosExtras++
    }
    if (ehDiaPerfeito(d.data, t)) perfeitos++
  }

  return {
    corridas: { feitas: corridasF, previstas: corridasP, pct: pct(corridasF, corridasP) },
    natacoes: { feitas: natacoesF, previstas: natacoesP, pct: pct(natacoesF, natacoesP) },
    agua: { feitas: aguaF, previstas: aguaP, pct: pct(aguaF, aguaP) },
    fotos: { feitas: fotosF, previstas: fotosP, pct: pct(fotosF, fotosP) },
    /** fotinhas tiradas em dia livre — só somam, nunca cobram */
    fotosExtras,
    bonus,
    diasPerfeitos: perfeitos,
  }
}

/** Peso mais recente registrado até a data pedida. */
export function pesoEm(snap: Snapshot, data: string): number | null {
  const anteriores = snap.pesos.filter((p) => diffDias(p.data, data) >= 0)
  if (anteriores.length) return anteriores[anteriores.length - 1].peso_kg
  return snap.pesos[0]?.peso_kg ?? null
}

export function fotoDe(snap: Snapshot, data: string, tipo: TipoFoto): Foto | undefined {
  return snap.fotos.find((f) => f.data === data && f.tipo === tipo)
}
