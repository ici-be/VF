import { describe, expect, it } from 'vitest'
import type { Mot, Vocabulaire } from '../src/lib/mots'
import { aReviser, bornesPages, chapitreSeul, cleChapitre, motsChoisis, questionsChoisies, type Reglages } from '../src/lib/reglages'

const mot = (nl: string, chapitre: string, vraag = false): Mot => ({
  id: nl, matiere: 'Aard', chapitre, nl, det: '', fr: nl, definition: '', exemple: '', remarque: '',
  ...(vraag && { vraag: { leurres: [], page: '', elements: [], nombre: 0 } }),
})
const voc: Vocabulaire = {
  matieres: [{ nom: 'Aard', chapitres: ['1', '2'], mots: [mot('zee', '1'), mot('berg', '2')], questions: [mot('Wat is migratie?', '1', true), mot('Wat is TOLES?', '2', true)] }],
  misAJour: 0,
}
const r = (p: Partial<Reglages>) => ({ matieres: ['Aard'], chapitres: [], exercice: 'qcm', pages: {}, ...p }) as Reglages

describe('mots et questions à réviser', () => {
  it('les questions suivent le choix de matière et de chapitres, sans se mêler aux mots', () => {
    expect(motsChoisis(voc, r({})).map(m => m.nl)).toEqual(['zee', 'berg'])
    expect(questionsChoisies(voc, r({ chapitres: [cleChapitre('Aard', '2')] })).map(m => m.nl)).toEqual(['Wat is TOLES?'])
    expect(aReviser(voc, r({ exercice: 'questions' })).map(m => m.nl)).toEqual(['Wat is migratie?', 'Wat is TOLES?'])
    expect(aReviser(voc, r({ exercice: 'qcm' })).map(m => m.nl)).toEqual(['zee', 'berg'])
  })
  it('une copie enregistrée sans questions ne casse rien', () => {
    const ancien: Vocabulaire = { matieres: [{ ...voc.matieres[0], questions: undefined }], misAJour: 0 }
    expect(aReviser(ancien, r({ exercice: 'questions' }))).toEqual([])
  })
})

describe('exercices de Nederlands', () => {
  it('portent sur les verbes de Conjugaison même si un autre chapitre est coché', () => {
    const verbe = (nl: string): Mot => ({ ...mot(nl, 'Conjugaison'), verbe: nl })
    const ned: Vocabulaire = { matieres: [{ nom: 'Nederlands', chapitres: ['1', 'Conjugaison'], mots: [mot('klinker', '1'), verbe('zijn')] }], misAJour: 0 }
    const choix = r({ matieres: ['Nederlands'], chapitres: [cleChapitre('Nederlands', '1')] })
    expect(aReviser(ned, { ...choix, exercice: 'conjugaison' }).map(m => m.nl)).toEqual(['zijn'])
    expect(aReviser(ned, { ...choix, exercice: 'qcm' }).map(m => m.nl)).toEqual(['klinker'])
  })
})

describe('pages d’un chapitre', () => {
  const p = (m: Mot, page?: number): Mot => ({ ...m, ...(page !== undefined && { page }) })
  const v: Vocabulaire = {
    matieres: [{ nom: 'Aard', chapitres: ['1', '2'],
      mots: [p(mot('zee', '1'), 4), p(mot('rivier', '1'), 9), p(mot('meer', '1'), 15), mot('oud', '1'), p(mot('berg', '2'), 30)],
      questions: [p(mot('Wat is migratie?', '1', true), 20)] }],
    misAJour: 0,
  }
  const un = cleChapitre('Aard', '1')
  it('un seul chapitre choisi : ses bornes, mots et questions confondus', () => {
    expect(chapitreSeul(v, r({}))).toBeNull()                                  // les deux chapitres
    expect(chapitreSeul(v, r({ chapitres: [un] }))?.chapitre).toBe('1')
    expect(chapitreSeul(v, r({ chapitres: [un, cleChapitre('Aard', '2')] }))).toBeNull()
    expect(bornesPages(v, 'Aard', '1')).toEqual([4, 20])
  })
  it('seulement les pages retenues ; les mots sans page en sortent', () => {
    const choix = r({ chapitres: [un], pages: { [un]: [5, 15] } })
    expect(motsChoisis(v, choix).map(m => m.nl)).toEqual(['rivier', 'meer'])
    expect(questionsChoisies(v, choix)).toEqual([])
    expect(motsChoisis(v, { ...choix, pages: { [un]: [15, 5] } }).map(m => m.nl)).toEqual(['rivier', 'meer'])
  })
  it('les pages ne comptent plus quand plusieurs chapitres sont choisis', () => {
    expect(motsChoisis(v, r({ pages: { [un]: [5, 15] } }))).toHaveLength(5)
  })
})
