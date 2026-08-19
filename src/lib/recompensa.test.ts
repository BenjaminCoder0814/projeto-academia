import { describe, expect, it } from 'vitest'
import {
  RECOMPENSA_FIM,
  RECOMPENSA_INICIO,
  calcularRecompensa,
  diasDaRecompensa,
} from './recompensa'
import { metaAguaDoDia } from './calculos'
import { snapshotVazio, type Dia, type Snapshot } from './tipos'

const PESO = 80

function dia(data: string, patch: Partial<Dia> = {}): Dia {
  return {
    data,
    corrida_ok: false,
    natacao_ok: false,
    bonus_sexta_ok: false,
    agua_ml: 0,
    agua_meta_ml: metaAguaDoDia(PESO, data),
    humor: null,
    calorias: null,
    fc_media: null,
    nota: null,
    ...patch,
  }
}

/** Marca o dia como treinado de verdade (corrida e, se tiver, natação). */
function treinou(data: string): Dia {
  return dia(data, { corrida_ok: true, natacao_ok: true })
}

const snap = (dias: Dia[]): Snapshot => ({ ...snapshotVazio, dias })

describe('o mês da recompensa', () => {
  it('vai de 11/08 (a terça em que ela começou) até o fim de agosto', () => {
    const dias = diasDaRecompensa('2026-08-18', snapshotVazio)
    expect(dias[0].data).toBe(RECOMPENSA_INICIO)
    expect(dias[dias.length - 1].data).toBe(RECOMPENSA_FIM)
  })

  it('separa os dias: segunda a quinta contam, sexta é bônus, fim de semana é do namorado', () => {
    const dias = diasDaRecompensa('2026-08-31', snapshotVazio)
    const conta = (tipo: string) => dias.filter((d) => d.tipo === tipo).length
    expect(conta('obrigatorio')).toBe(12) // 3 semanas de seg–qui, menos a segunda 10/08
    expect(conta('bonus')).toBe(3) // 14, 21 e 28 de agosto
    expect(conta('namorado')).toBe(6) // três fins de semana
    expect(dias.length).toBe(21)
  })
})

describe('a porcentagem do lookinho', () => {
  it('conta a semana que ela fez antes do app existir', () => {
    // 11, 12 e 13/08 foram terça, quarta e quinta
    const s = snap([treinou('2026-08-11'), treinou('2026-08-12'), treinou('2026-08-13')])
    const r = calcularRecompensa('2026-08-14', s)
    expect(r.feitos).toBe(3)
    expect(Math.round(r.porcentagemAteAgora)).toBe(100)
    expect(r.lookEmJogo).toBe(true)
  })

  it('dia obrigatório que passou em branco tira o lookinho de jogo', () => {
    const s = snap([treinou('2026-08-11')]) // faltou 12 e 13
    const r = calcularRecompensa('2026-08-14', s)
    expect(r.perdidos).toBe(2)
    expect(r.lookEmJogo).toBe(false)
    expect(r.lookGarantido).toBe(false)
  })

  it('corrida sem natação em dia que pede as duas não conta', () => {
    const s = snap([dia('2026-08-12', { corrida_ok: true })]) // quarta pede natação
    expect(calcularRecompensa('2026-08-13', s).feitos).toBe(0)
  })

  it('na segunda basta a corrida', () => {
    const s = snap([dia('2026-08-17', { corrida_ok: true })]) // segunda
    expect(calcularRecompensa('2026-08-18', s).feitos).toBe(1)
  })

  it('o mês inteiro cumprido garante o lookinho', () => {
    const todos = diasDaRecompensa('2026-08-31', snapshotVazio)
      .filter((d) => d.tipo === 'obrigatorio')
      .map((d) => treinou(d.data))
    const r = calcularRecompensa('2026-08-31', snap(todos))
    expect(r.lookGarantido).toBe(true)
    expect(Math.round(r.porcentagem)).toBe(100)
  })

  it('o dia de hoje ainda em branco não conta como perdido', () => {
    const r = calcularRecompensa('2026-08-18', snap([treinou('2026-08-11')]))
    // 12, 13 e 17 passaram em branco; o 18 (hoje) não entra na conta de perdidos
    expect(r.perdidos).toBe(3)
  })
})

describe('o presente surpresa das sextas', () => {
  it('só vale com todas as sextas do mês', () => {
    const s = snap([
      dia('2026-08-14', { bonus_sexta_ok: true }),
      dia('2026-08-21', { bonus_sexta_ok: true }),
      dia('2026-08-28', { bonus_sexta_ok: true }),
    ])
    const r = calcularRecompensa('2026-08-31', s)
    expect(r.sextas.feitas).toBe(3)
    expect(r.presenteGarantido).toBe(true)
  })

  it('uma sexta perdida tira o presente de jogo, mas não mexe no lookinho', () => {
    const obrigatorios = diasDaRecompensa('2026-08-21', snapshotVazio)
      .filter((d) => d.tipo === 'obrigatorio' && d.passou)
      .map((d) => treinou(d.data))
    const r = calcularRecompensa('2026-08-21', snap(obrigatorios)) // a sexta 14/08 passou em branco
    expect(r.sextas.perdidas).toBe(1)
    expect(r.presenteEmJogo).toBe(false)
    expect(r.lookEmJogo).toBe(true)
  })

  it('fim de semana não entra em conta nenhuma', () => {
    const s = snap([treinou('2026-08-15'), treinou('2026-08-16')]) // sábado e domingo
    const r = calcularRecompensa('2026-08-17', s)
    expect(r.feitos).toBe(0)
    expect(r.diasDeNamorado).toBe(6)
  })
})
