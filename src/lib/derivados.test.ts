import { describe, expect, it } from 'vitest'
import { estadoDoDia, resumo, sequencia, tarefasDoDia, ehDiaPerfeito } from './derivados'
import { metaAguaDoDia } from './calculos'
import { snapshotVazio, type Dia, type Foto, type Snapshot } from './tipos'

const ALTURA = 168
const PESO = 80

const perfil = {
  id: 'i',
  nome: 'Isabela',
  papel: 'isabela' as const,
  data_nascimento: '2007-05-25',
  altura_cm: ALTURA,
  peso_inicial_kg: PESO,
}

function foto(data: string, tipo: 'evolucao' | 'relogio'): Foto {
  return { id: `${data}-${tipo}`, data, tipo, storage_path: `x/${data}-${tipo}`, criado_em: '' }
}

/** Monta um dia já com a meta de água daquele dia. */
function dia(data: string, patch: Partial<Dia> = {}): Dia {
  const meta = metaAguaDoDia(PESO, data, Boolean(patch.bonus_sexta_ok))
  return {
    data,
    corrida_ok: false,
    natacao_ok: false,
    bonus_sexta_ok: false,
    agua_ml: 0,
    agua_meta_ml: meta,
    humor: null,
    calorias: null,
    fc_media: null,
    nota: null,
    ...patch,
  }
}

/** Dia de treino fechado inteirinho. */
function diaCompleto(data: string): { dia: Dia; fotos: Foto[] } {
  const meta = metaAguaDoDia(PESO, data)
  return {
    dia: dia(data, { corrida_ok: true, natacao_ok: true, agua_ml: meta }),
    fotos: [foto(data, 'evolucao'), foto(data, 'relogio')],
  }
}

function snap(dias: Dia[], fotos: Foto[] = []): Snapshot {
  return { ...snapshotVazio, perfilIsabela: perfil, dias, fotos }
}

/* ------------------------------------------------------------------ */
/* A sexta é bônus: nunca cobra, nunca pune                            */
/* ------------------------------------------------------------------ */

describe('sexta bônus', () => {
  const SEXTA = '2026-08-21'

  it('sem o bônus, o dia fica em "bonus" — nunca "deixouPassar"', () => {
    const s = snap([])
    expect(estadoDoDia(SEXTA, '2026-08-24', s)).toBe('bonus')
  })

  it('com o bônus, vira "bonusFeito"', () => {
    const s = snap([dia(SEXTA, { bonus_sexta_ok: true })])
    expect(estadoDoDia(SEXTA, '2026-08-24', s)).toBe('bonusFeito')
  })

  it('não entra no denominador da aderência', () => {
    const treino = diaCompleto('2026-08-20') // quinta
    const s = snap([treino.dia], treino.fotos)
    const r = resumo(SEXTA, s)
    // até a sexta houve 3 dias de treino (18, 19, 20) — a sexta não conta
    expect(r.corridas.previstas).toBe(3)
    expect(r.agua.previstas).toBe(3)
    expect(r.fotos.previstas).toBe(3)
  })

  it('a sexta em branco não derruba a barra pra baixo de 100% quando a semana foi cumprida', () => {
    const dias: Dia[] = []
    const fotos: Foto[] = []
    for (const d of ['2026-08-18', '2026-08-19', '2026-08-20']) {
      const c = diaCompleto(d)
      dias.push(c.dia)
      fotos.push(...c.fotos)
    }
    const r = resumo(SEXTA, snap(dias, fotos))
    expect(Math.round(r.corridas.pct)).toBe(100)
    expect(Math.round(r.fotos.pct)).toBe(100)
  })

  it('não quebra a sequência: a sexta em branco passa reto', () => {
    const c = diaCompleto('2026-08-20') // quinta
    const s = snap([c.dia], c.fotos)
    // domingo + sábado + (sexta pulada) + quinta cumprida = 3 dias na conta
    expect(sequencia('2026-08-23', s)).toBe(3)
  })

  it('a semana inteira cumprida atravessa a sexta sem perder nada', () => {
    const dias: Dia[] = []
    const fotos: Foto[] = []
    for (const d of ['2026-08-18', '2026-08-19', '2026-08-20']) {
      const c = diaCompleto(d)
      dias.push(c.dia)
      fotos.push(...c.fotos)
    }
    // 18, 19, 20 cumpridos + 22 e 23 de folga (a sexta 21 não entra nem soma nem quebra)
    expect(sequencia('2026-08-23', snap(dias, fotos))).toBe(5)
  })
})

/* ------------------------------------------------------------------ */
/* Folguinha                                                           */
/* ------------------------------------------------------------------ */

describe('folguinha', () => {
  const SABADO = '2026-08-22'

  it('sem nada marcado continua sendo folguinha, nunca dia perdido', () => {
    expect(estadoDoDia(SABADO, '2026-08-24', snap([]))).toBe('folguinha')
  })

  it('com fotinha e água vira folguinha caprichada e conta como dia perfeito', () => {
    const meta = metaAguaDoDia(PESO, SABADO)
    const s = snap([dia(SABADO, { agua_ml: meta })], [foto(SABADO, 'evolucao')])
    expect(estadoDoDia(SABADO, '2026-08-24', s)).toBe('folguinhaCheia')
    expect(resumo(SABADO, s).diasPerfeitos).toBe(1)
  })

  it('a fotinha do fim de semana soma como extra, sem entrar no denominador', () => {
    const s = snap([], [foto(SABADO, 'evolucao')])
    const r = resumo(SABADO, s)
    expect(r.fotosExtras).toBe(1)
    expect(r.fotos.previstas).toBe(3) // só terça, quarta e quinta
  })
})

/* ------------------------------------------------------------------ */
/* Dia de treino                                                       */
/* ------------------------------------------------------------------ */

describe('dia de treino', () => {
  const TERCA = '2026-08-18'

  it('só fica perfeito com corrida, natação, água e as duas fotos', () => {
    const c = diaCompleto(TERCA)
    const completo = tarefasDoDia(TERCA, c.dia, c.fotos)
    expect(ehDiaPerfeito(TERCA, completo)).toBe(true)

    const semRelogio = tarefasDoDia(TERCA, c.dia, [foto(TERCA, 'evolucao')])
    expect(ehDiaPerfeito(TERCA, semRelogio)).toBe(false)
  })

  it('parcial aparece como "quaseLa" e passado em branco como "deixouPassar"', () => {
    const s = snap([dia(TERCA, { corrida_ok: true })])
    expect(estadoDoDia(TERCA, '2026-08-24', s)).toBe('quaseLa')
    expect(estadoDoDia(TERCA, '2026-08-24', snap([]))).toBe('deixouPassar')
  })

  it('o dia de hoje em branco nunca aparece como perdido', () => {
    expect(estadoDoDia(TERCA, TERCA, snap([]))).toBe('vemAi')
  })
})
