import { describe, expect, it } from 'vitest'
import { interpretar } from './leituraDoRelogio'

/**
 * O OCR erra às vezes; o que precisa ser confiável é a interpretação do texto
 * que ele devolve. Estes são recortes do formato que os relógios costumam ter.
 */
describe('lendo a tela do relógio', () => {
  it('pega caloria e batimento com a unidade colada', () => {
    expect(interpretar('417 KCAL\n148 BPM')).toEqual({ calorias: 417, fcMedia: 148 })
  })

  it('funciona com a unidade antes do número', () => {
    expect(interpretar('kcal 380\nbpm 152')).toEqual({ calorias: 380, fcMedia: 152 })
  })

  it('entende português', () => {
    expect(interpretar('40:12\n412 calorias\n139 batimentos')).toEqual({
      calorias: 412,
      fcMedia: 139,
    })
  })

  it('a unidade manda mais que a faixa: 180 kcal não é batimento', () => {
    // sem olhar a unidade, 180 cairia na faixa de batimento e sairia tudo trocado
    expect(interpretar('180 kcal\n95 bpm')).toEqual({ calorias: 180, fcMedia: 95 })
  })

  it('o número de uma linha não pula pra unidade da linha de baixo', () => {
    // "380" é caloria; o "bpm" da linha seguinte não pode roubá-lo
    expect(interpretar('380 kcal\nbpm 152').fcMedia).toBe(152)
  })

  it('sem unidade nenhuma, usa as faixas plausíveis', () => {
    const r = interpretar('00:40:00\n455\n146')
    expect(r.fcMedia).toBe(146)
    expect(r.calorias).toBe(455)
  })

  it('não confunde o mesmo número nos dois campos', () => {
    const r = interpretar('150')
    expect(r.fcMedia).toBe(150)
    expect(r.calorias).toBeNull()
  })

  it('descarta número impossível', () => {
    expect(interpretar('99999 kcal').calorias).toBeNull()
    expect(interpretar('8 bpm').fcMedia).toBeNull()
  })

  it('sobrevive a texto sem número', () => {
    expect(interpretar('treino concluído')).toEqual({ calorias: null, fcMedia: null })
  })

  it('aguenta o O trocado por zero, que é erro clássico de OCR', () => {
    expect(interpretar('4O5 kcal').calorias).toBe(405)
  })
})
