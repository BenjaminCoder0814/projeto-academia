import { describe, expect, it } from 'vitest'
import {
  calcularIMC,
  classificarIMC,
  faixaSaudavel,
  formulasPesoIdeal,
  idadeDaIsabela,
  metaAguaDoDia,
  metaAguaMl,
  metaDePeso,
  minutosDoDia,
  planoDoDia,
  progressoDoPeso,
} from './calculos'
import { diasDoDesafio, statusDoDesafio, totaisDoDesafio } from './fase'

const r1 = (n: number) => Math.round(n * 10) / 10

describe('idade da Isabela', () => {
  it('mostra 19 anos em 18/08/2026', () => {
    expect(idadeDaIsabela('2007-05-25', new Date(2026, 7, 18))).toBe(19)
  })
  it('ainda é 18 na véspera do aniversário de 2026', () => {
    expect(idadeDaIsabela('2007-05-25', new Date(2026, 4, 24))).toBe(18)
  })
  it('vira 19 no dia do aniversário', () => {
    expect(idadeDaIsabela('2007-05-25', new Date(2026, 4, 25))).toBe(19)
  })
})

describe('IMC', () => {
  it('calcula peso / altura²', () => {
    expect(r1(calcularIMC(70, 165))).toBe(25.7)
  })
  it('usa a tabela adulta da OMS, com palavras gentis', () => {
    expect(classificarIMC(18.4).rotulo).toBe('abaixo da faixa')
    expect(classificarIMC(18.5).saudavel).toBe(true)
    expect(classificarIMC(24.9).saudavel).toBe(true)
    expect(classificarIMC(25).saudavel).toBe(false)
    expect(classificarIMC(31).rotulo).toBe('bem acima da faixa')
  })
  it('não usa nenhuma palavra de julgamento', () => {
    const proibidas = ['obes', 'gord', 'falh']
    for (const imc of [16, 20, 27, 32, 38, 45]) {
      const rotulo = classificarIMC(imc).rotulo.toLowerCase()
      for (const p of proibidas) expect(rotulo).not.toContain(p)
    }
  })
})

describe('tabela de peso ideal (seção 9.2 do briefing)', () => {
  const tabela = [
    { cm: 150, min: 41.6, max: 56.0, meta: 49.5, media: 46.5 },
    { cm: 155, min: 44.4, max: 59.8, meta: 52.9, media: 50.2 },
    { cm: 160, min: 47.4, max: 63.7, meta: 56.3, media: 53.9 },
    { cm: 165, min: 50.4, max: 67.8, meta: 59.9, media: 57.7 },
    { cm: 170, min: 53.5, max: 72.0, meta: 63.6, media: 61.4 },
    { cm: 175, min: 56.7, max: 76.3, meta: 67.4, media: 65.1 },
  ]
  for (const linha of tabela) {
    it(`${linha.cm} cm`, () => {
      const f = faixaSaudavel(linha.cm)
      expect(r1(f.min)).toBe(linha.min)
      expect(r1(f.max)).toBe(linha.max)
      expect(r1(metaDePeso(linha.cm))).toBe(linha.meta)
      expect(r1(formulasPesoIdeal(linha.cm).media)).toBe(linha.media)
    })
  }
})

describe('barrinha do peso', () => {
  it('vai de 0 a 100 e não estoura', () => {
    expect(progressoDoPeso(90, 90, 60)).toBe(0)
    expect(progressoDoPeso(90, 75, 60)).toBe(50)
    expect(progressoDoPeso(90, 55, 60)).toBe(100)
    expect(progressoDoPeso(90, 95, 60)).toBe(0)
  })
})

describe('rotina da semana', () => {
  // 24/08/2026 é uma segunda
  const semana = {
    '2026-08-24': { tipo: 'treino', corrida: true, natacao: false }, // segunda
    '2026-08-25': { tipo: 'treino', corrida: true, natacao: true }, // terça
    '2026-08-26': { tipo: 'treino', corrida: true, natacao: true }, // quarta
    '2026-08-27': { tipo: 'treino', corrida: true, natacao: true }, // quinta
    '2026-08-28': { tipo: 'bonus', corrida: false, natacao: false }, // sexta
    '2026-08-29': { tipo: 'folguinha', corrida: false, natacao: false }, // sábado
    '2026-08-30': { tipo: 'folguinha', corrida: false, natacao: false }, // domingo
  } as const

  for (const [data, esperado] of Object.entries(semana)) {
    it(data, () => {
      const p = planoDoDia(data)
      expect(p.tipo).toBe(esperado.tipo)
      expect(p.corrida).toBe(esperado.corrida)
      expect(p.natacao).toBe(esperado.natacao)
    })
  }

  it('natação só terça, quarta e quinta', () => {
    const comNatacao = diasDoDesafio()
      .filter((d) => d.plano.natacao)
      .map((d) => new Date(d.data + 'T12:00:00').getDay())
    expect([...new Set(comNatacao)].sort()).toEqual([2, 3, 4])
  })

  it('a sexta nunca é corrida obrigatória', () => {
    const sextas = diasDoDesafio().filter(
      (d) => new Date(d.data + 'T12:00:00').getDay() === 5,
    )
    expect(sextas.length).toBe(2)
    for (const s of sextas) {
      expect(s.plano.corrida).toBe(false)
      expect(s.plano.corridaBonus).toBe(true)
    }
  })

  it('o bônus de sexta só entra na conta se ela marcar', () => {
    expect(minutosDoDia('2026-08-28', false)).toBe(0)
    expect(minutosDoDia('2026-08-28', true)).toBe(40)
  })
})

describe('tabela de água (seção 8 do briefing)', () => {
  // [peso, ter/qua/qui, segunda, fim de semana]
  const tabela: [number, number, number, number][] = [
    [60, 2950, 2500, 2100],
    [65, 3100, 2700, 2300],
    [70, 3300, 2850, 2450],
    [75, 3500, 3000, 2600],
    [80, 3650, 3200, 2800],
    [85, 3800, 3400, 3000],
    [90, 4000, 3550, 3150],
    [95, 4000, 3700, 3300],
  ]

  for (const [peso, completo, soCorrida, descanso] of tabela) {
    it(`${peso} kg`, () => {
      expect(metaAguaMl(peso, 85)).toBe(completo)
      expect(metaAguaMl(peso, 40)).toBe(soCorrida)
      expect(metaAguaMl(peso, 0)).toBe(descanso)
      // pelos dias reais do calendário
      expect(metaAguaDoDia(peso, '2026-08-25')).toBe(completo) // terça
      expect(metaAguaDoDia(peso, '2026-08-26')).toBe(completo) // quarta
      expect(metaAguaDoDia(peso, '2026-08-27')).toBe(completo) // quinta (agora tem natação)
      expect(metaAguaDoDia(peso, '2026-08-24')).toBe(soCorrida) // segunda
      expect(metaAguaDoDia(peso, '2026-08-29')).toBe(descanso) // sábado
      // sexta: sem bônus fica na base, com bônus vira igual à segunda
      expect(metaAguaDoDia(peso, '2026-08-28', false)).toBe(descanso)
      expect(metaAguaDoDia(peso, '2026-08-28', true)).toBe(soCorrida)
    })
  }

  it('respeita o piso de 2 L e o teto de 4 L', () => {
    expect(metaAguaMl(40, 0)).toBe(2000)
    expect(metaAguaMl(200, 85)).toBe(4000)
  })
})

describe('calendário do desafio (seção 14)', () => {
  it('tem 15 dias, 9 corridas, 7 natações, 2 sextas bônus e 4 folguinhas', () => {
    expect(totaisDoDesafio()).toEqual({
      dias: 15,
      corridas: 9,
      natacoes: 7,
      bonus: 2,
      folguinhas: 4,
      fotos: 15,
    })
  })

  it('começa em 18/08/2026 e termina em 01/09/2026', () => {
    const dias = diasDoDesafio()
    expect(dias[0].data).toBe('2026-08-18')
    expect(dias[14].data).toBe('2026-09-01')
    expect(dias[14].indice).toBe(15)
  })

  it('conta os dias que faltam', () => {
    expect(statusDoDesafio('2026-08-18').diasRestantes).toBe(14)
    expect(statusDoDesafio('2026-08-20').diaAtual).toBe(3)
    expect(statusDoDesafio('2026-09-01').diasRestantes).toBe(0)
    expect(statusDoDesafio('2026-09-02').terminou).toBe(true)
  })
})
