import { describe, expect, it } from 'vitest'
import { corrigerChiffres, corrigerLettres, ecritures, enLettres, MAXIMUM, nombreAvec } from '../src/lib/getallen'

describe('enLettres', () => {
  it('écrit les nombres selon la Taalunie', () => {
    const cas: [number, string][] = [
      [0, 'nul'], [1, 'een'], [13, 'dertien'], [14, 'veertien'], [18, 'achttien'],
      [21, 'eenentwintig'], [22, 'tweeëntwintig'], [23, 'drieëntwintig'], [40, 'veertig'], [80, 'tachtig'], [99, 'negenennegentig'],
      [100, 'honderd'], [101, 'honderdeen'], [110, 'honderdtien'], [342, 'driehonderdtweeënveertig'],
      [1000, 'duizend'], [1001, 'duizend een'], [2345, 'tweeduizend driehonderdvijfenveertig'],
      [21_000, 'eenentwintigduizend'], [100_000, 'honderdduizend'], [999_999, 'negenhonderdnegenennegentigduizend negenhonderdnegenennegentig'],
      [1_000_000, 'een miljoen'], [1_200_000, 'een miljoen tweehonderdduizend'], [1_000_005, 'een miljoen vijf'], [MAXIMUM, 'twee miljoen'],
    ]
    for (const [n, l] of cas) expect(enLettres(n), String(n)).toBe(l)
  })
  it('accepte aussi « twaalfhonderdvijftig » de 1 100 à 9 999', () => {
    expect(ecritures(1250)).toEqual(['duizend tweehonderdvijftig', 'twaalfhonderdvijftig'])
    expect(ecritures(2000)).toEqual(['tweeduizend'])
    expect(ecritures(1050)).toEqual(['duizend vijftig'])
  })
})

describe('correction', () => {
  it('en lettres : espaces et accents libres, tréma exigé', () => {
    expect(corrigerLettres('tweeduizend driehonderdvijfenveertig', 2345)).toEqual({ resultat: 'juste', message: '' })
    expect(corrigerLettres('tweeduizenddriehonderd vijfenveertig', 2345).resultat).toBe('juste')
    expect(corrigerLettres('tweeduizenddriehonderd vijfenveertig', 2345).message).toContain('tweeduizend driehonderdvijfenveertig')
    expect(corrigerLettres('één miljoen', 1_000_000).resultat).toBe('juste')
    expect(corrigerLettres('tweeentwintig', 22).resultat).toBe('presque')
    expect(corrigerLettres('viertig', 40).resultat).toBe('faux')
    expect(corrigerLettres('twaalfhonderdvijftig', 1250).resultat).toBe('juste')
  })
  it('en chiffres : séparateurs de milliers acceptés', () => {
    expect(corrigerChiffres('1 285 000', 1_285_000).resultat).toBe('juste')
    expect(corrigerChiffres('1.285.000', 1_285_000).resultat).toBe('juste')
    expect(corrigerChiffres('128500', 1_285_000).resultat).toBe('faux')
    expect(corrigerChiffres('mille', 1000).message).toBe('Écris le nombre en chiffres.')
  })
})

describe('nombreAvec', () => {
  it('tire un nombre où l’on entend le mot, sans dépasser deux millions', () => {
    let graine = 1
    const hasard = () => ((graine = (graine * 16807) % 2147483647) / 2147483647)
    for (const g of [1, 2, 7, 11, 13, 18, 20, 40, 80, 90, 100, 1000, 1_000_000]) {
      for (let i = 0; i < 300; i++) {
        const n = nombreAvec(g, hasard)
        expect(n).toBeGreaterThanOrEqual(1)
        expect(n).toBeLessThanOrEqual(MAXIMUM)
        if (g >= 1000) expect(n).toBeGreaterThanOrEqual(g)
        const mot = enLettres(g).replace('een miljoen', 'miljoen')
        expect(enLettres(n), `${g} → ${n}`).toContain(mot)
      }
    }
  })
})
