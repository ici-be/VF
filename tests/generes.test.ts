import { describe, expect, it } from 'vitest'
import { CALCULS, NATURES, TIJDVAKKEN, eeuw, eeuwVan, jarenVan, questionCalcul, questionEeuwen, questionNature, rangtelwoord, avecExercicesGeneres, type Nature } from '../src/lib/generes'
import type { Vocabulaire } from '../src/lib/mots'

// un tirage au hasard reproductible
const graine = (n: number) => () => { n = (n * 9301 + 49297) % 233280; return n / 233280 }
// évaluer une expression du cours (× : − ² ³ et parenthèses)
const evaluer = (e: string) => Function(`return (${e.replace(/×/g, '*').replace(/:/g, '/').replace(/−/g, '-').replace(/²/g, '**2').replace(/³/g, '**3')})`)() as number

describe('Eeuwen', () => {
  it('le siècle, le rang à la néerlandaise (règle du cours) et les années', () => {
    expect([eeuwVan(1789), eeuwVan(1800), eeuwVan(1801), eeuwVan(-3500), eeuwVan(-1), eeuwVan(1)]).toEqual([18, 18, 19, -35, -1, 1])
    expect([1, 2, 3, 8, 9, 19, 20, 21, 35].map(rangtelwoord)).toEqual(['1ste', '2de', '3de', '8ste', '9de', '19de', '20ste', '21ste', '35ste'])
    expect(eeuw(-35)).toBe('35ste eeuw v.C.')
    expect(jarenVan(2)).toBe('101 tot en met 200')
    expect(jarenVan(-2)).toBe('200 v.C. tot en met 101 v.C.')
  })
  it('chaque question : quatre propositions différentes, dont la bonne', () => {
    for (let s = 1; s < 400; s++) TIJDVAKKEN.forEach((_, i) => {
      const q = questionEeuwen(i, graine(s * 7 + i))
      expect(q.options).toContain(q.bonne)
      expect(new Set(q.options).size).toBe(q.options.length)
      expect(q.options.length).toBeGreaterThanOrEqual(3)
    })
  })
})

describe('Calcul mental', () => {
  it('les résultats à écrire sont justes, les propositions contiennent la bonne', () => {
    for (let s = 1; s < 300; s++) CALCULS.forEach((_, i) => {
      const q = questionCalcul(i, graine(s * 13 + i))
      if (q.options) {
        expect(q.options).toContain(q.bonne)
        expect(new Set(q.options).size).toBe(q.options.length)
      } else {
        expect(evaluer(q.sujet)).toBe(Number(q.bonne))
      }
    })
  })
})

describe('Natures des mots', () => {
  it('une phrase avec le mot de la bonne nature mis en évidence', () => {
    for (const n of Object.keys(NATURES) as Nature[]) for (let s = 1; s < 40; s++) {
      const q = questionNature(n, graine(s))
      expect(q.morceaux.filter(m => m.cible)).toHaveLength(1)
      expect(q.options).toContain(NATURES[n].nom)
      expect(q.bonne).toBe(NATURES[n].nom)
    }
  })
  it('les chapitres s’ajoutent une seule fois, à la bonne matière', () => {
    const voc: Vocabulaire = { misAJour: 0, matieres: [{ nom: 'HW Geschiedenis', chapitres: ['1'], mots: [] }, { nom: 'Français', chapitres: [], mots: [] }] }
    const v = avecExercicesGeneres(avecExercicesGeneres(voc))
    expect(v.matieres[0].chapitres).toEqual(['1', 'Eeuwen en tijdvakken'])
    expect(v.matieres[0].mots.every(m => m.genere === 'eeuwen')).toBe(true)
    expect(v.matieres[1].mots).toHaveLength(8)
  })
})
