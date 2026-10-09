import { describe, expect, it } from 'vitest'
import { affirmation, avecConjugaison, corrigerForme, corrigerPrimitif, corrigerQuestion, estPrimitif, formesLigne, verbe, CHAPITRE } from '../src/lib/conjugaison'

const slapen = verbe('slapen')!

describe('chapitre Conjugaison', () => {
  it('ajouté à Nederlands, une seule fois', () => {
    const voc = { misAJour: 0, matieres: [{ nom: 'Nederlands', chapitres: ['1'], mots: [] }, { nom: 'NW Biologie', chapitres: [], mots: [] }] }
    const v = avecConjugaison(avecConjugaison(voc))
    expect(v.matieres[0].chapitres).toEqual(['1', CHAPITRE])
    expect(v.matieres[0].mots).toHaveLength(50)
    expect(v.matieres[0].mots[0]).toMatchObject({ nl: 'zijn', fr: 'être', verbe: 'zijn', remarque: 'zijn – was (waren) – is geweest' })
  })
  it('crée la matière si elle manque', () => {
    expect(avecConjugaison({ misAJour: 0, matieres: [] }).matieres[0].nom).toBe('Nederlands')
  })
})

describe('correction', () => {
  it('une case du tableau : orthographe exacte, pronom toléré', () => {
    // lignes : 0 ik, 1 jij/je/u, 2 hij/zij/het, 3 wij, 4 jullie, 5 zij
    expect(corrigerForme('slaapt', slapen, 'present', 2).resultat).toBe('juste')
    expect(corrigerForme('Hij slaapt.', slapen, 'present', 2).resultat).toBe('juste')
    expect(corrigerForme('slaapd', slapen, 'present', 2).resultat).toBe('faux')
    expect(corrigerForme('slaap', slapen, 'present', 2).resultat).toBe('faux')
    expect(corrigerForme('heb geslapen', slapen, 'vtt', 0).resultat).toBe('juste')
    expect(corrigerForme('zal slapen', slapen, 'futur', 1).resultat).toBe('juste')
    expect(corrigerForme('u slaapt', slapen, 'present', 1).resultat).toBe('juste')
  })
  it('ligne « jij / je / u » : les formes de jij et de u', () => {
    expect(formesLigne(verbe('hebben')!, 'present', 1)).toEqual(['hebt', 'heeft'])
    expect(corrigerForme('heeft', verbe('hebben')!, 'present', 1).resultat).toBe('juste')
    expect(formesLigne(slapen, 'present', 1)).toEqual(['slaapt'])
  })
  it('forme interrogative', () => {
    expect(affirmation(slapen, 'present', 1)).toBe('Jij slaapt.')
    expect(corrigerQuestion('Slaap jij?', slapen, 'present', 1).resultat).toBe('juste')
    expect(corrigerQuestion('slaap je', slapen, 'present', 1).resultat).toBe('juste')
    const t = corrigerQuestion('Slaapt jij?', slapen, 'present', 1)
    expect(t.resultat).toBe('faux')
    expect(t.message).toContain('-t disparaît')
    expect(corrigerQuestion('Jij slaap?', slapen, 'present', 1).message).toContain('ordre')
    expect(corrigerQuestion('Heeft hij geslapen?', slapen, 'vtt', 3).resultat).toBe('juste')
  })
})

describe('temps primitifs', () => {
  it('les 30 verbes les plus fréquents', () => {
    expect(estPrimitif('zijn')).toBe(true)
    expect(estPrimitif('horen')).toBe(true)      // 30e
    expect(estPrimitif('beginnen')).toBe(false)  // 31e
    expect(estPrimitif('slapen')).toBe(false)
  })
  it('correction, auxiliaire compris', () => {
    const komen = verbe('komen')!
    expect(corrigerPrimitif('kwam', komen, 0).resultat).toBe('juste')
    expect(corrigerPrimitif('kwamen', komen, 1).resultat).toBe('juste')
    expect(corrigerPrimitif('is gekomen', komen, 2).resultat).toBe('juste')
    expect(corrigerPrimitif('gekomen', komen, 2).message).toContain('auxiliaire')
    expect(corrigerPrimitif('heeft gekomen', komen, 2).message).toContain('is gekomen')
    expect(corrigerPrimitif('komde', komen, 0).resultat).toBe('faux')
  })
})
