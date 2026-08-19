import { planoDoDia } from './calculos'
import { diaDaSemana, diffDias, somarDias } from './datas'
import { tarefasDoDia } from './derivados'
import type { Snapshot } from './tipos'

/* =====================================================================
 * A RECOMPENSA DO MÊS
 *
 * Ela começou na terça, 11/08 — antes mesmo do app existir. A conta vale
 * desse dia até o fim de agosto.
 *
 *   • Segunda a quinta: dia que conta. Faltou, tira da porcentagem.
 *   • Sexta: bônus. Se ela for em TODAS, ganha o presente surpresa dele.
 *   • Sábado e domingo: dia do namorado — não entra na conta.
 *
 * O lookinho de academia é o acordo com a mãe dela: precisa dos dias
 * obrigatórios todos feitos.
 * ===================================================================== */

export const RECOMPENSA_INICIO = '2026-08-11'
export const RECOMPENSA_FIM = '2026-08-31'

export type DiaDaRecompensa = {
  data: string
  tipo: 'obrigatorio' | 'bonus' | 'namorado'
  feito: boolean
  passou: boolean
}

/** Um dia de treino só conta quando a corrida (e a natação, se tiver) saiu. */
function treinouNoDia(data: string, snap: Snapshot): boolean {
  const dia = snap.dias.find((d) => d.data === data)
  if (!dia) return false
  const t = tarefasDoDia(data, dia, snap.fotos)
  if (t.natacao.aplicavel) return t.corrida.feito && t.natacao.feito
  return t.corrida.feito
}

export function diasDaRecompensa(hoje: string, snap: Snapshot): DiaDaRecompensa[] {
  const total = diffDias(RECOMPENSA_INICIO, RECOMPENSA_FIM) + 1
  return Array.from({ length: total }, (_, i) => {
    const data = somarDias(RECOMPENSA_INICIO, i)
    const dow = diaDaSemana(data)
    const tipo: DiaDaRecompensa['tipo'] =
      dow === 0 || dow === 6 ? 'namorado' : dow === 5 ? 'bonus' : 'obrigatorio'
    const dia = snap.dias.find((d) => d.data === data)
    return {
      data,
      tipo,
      feito: tipo === 'bonus' ? Boolean(dia?.bonus_sexta_ok) : treinouNoDia(data, snap),
      passou: diffDias(hoje, data) < 0,
    }
  })
}

export type Recompensa = {
  /** dias obrigatórios já cumpridos */
  feitos: number
  /** dias obrigatórios que já passaram (o que valia até agora) */
  ateAgora: number
  /** todos os dias obrigatórios do mês */
  totalDoMes: number
  /** % em relação ao mês inteiro — é a barra do prêmio */
  porcentagem: number
  /** % só do que já passou — é o "como você está indo" */
  porcentagemAteAgora: number
  /** dias obrigatórios que passaram em branco */
  perdidos: number
  /** ainda dá pra ganhar o lookinho? (nenhum dia perdido) */
  lookEmJogo: boolean
  lookGarantido: boolean
  sextas: { feitas: number; total: number; passadas: number; perdidas: number }
  /** o presente surpresa dele depende de TODAS as sextas */
  presenteEmJogo: boolean
  presenteGarantido: boolean
  /** dias de namorado no mês (fim de semana) */
  diasDeNamorado: number
  faltamDias: number
}

export function calcularRecompensa(hoje: string, snap: Snapshot): Recompensa {
  const dias = diasDaRecompensa(hoje, snap)

  const obrigatorios = dias.filter((d) => d.tipo === 'obrigatorio')
  const feitos = obrigatorios.filter((d) => d.feito).length
  const passados = obrigatorios.filter((d) => d.passou)
  const perdidos = passados.filter((d) => !d.feito).length

  const sextas = dias.filter((d) => d.tipo === 'bonus')
  const sextasFeitas = sextas.filter((d) => d.feito).length
  const sextasPassadas = sextas.filter((d) => d.passou)
  const sextasPerdidas = sextasPassadas.filter((d) => !d.feito).length

  const totalDoMes = obrigatorios.length
  const porcentagem = totalDoMes ? (feitos / totalDoMes) * 100 : 0
  const porcentagemAteAgora = passados.length ? (passados.filter((d) => d.feito).length / passados.length) * 100 : 100

  return {
    feitos,
    ateAgora: passados.length,
    totalDoMes,
    porcentagem,
    porcentagemAteAgora,
    perdidos,
    lookEmJogo: perdidos === 0,
    lookGarantido: feitos === totalDoMes,
    sextas: {
      feitas: sextasFeitas,
      total: sextas.length,
      passadas: sextasPassadas.length,
      perdidas: sextasPerdidas,
    },
    presenteEmJogo: sextasPerdidas === 0,
    presenteGarantido: sextasFeitas === sextas.length,
    diasDeNamorado: dias.filter((d) => d.tipo === 'namorado').length,
    faltamDias: Math.max(0, diffDias(hoje, RECOMPENSA_FIM)),
  }
}

/** Os dias da semana em que ela começou, antes do app existir. */
export function diasAntesDoApp(inicioDoApp: string): string[] {
  const total = diffDias(RECOMPENSA_INICIO, inicioDoApp)
  return Array.from({ length: Math.max(0, total) }, (_, i) => somarDias(RECOMPENSA_INICIO, i)).filter(
    (data) => planoDoDia(data).tipo !== 'folguinha',
  )
}
