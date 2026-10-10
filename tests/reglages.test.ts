import { describe, expect, it } from 'vitest'
import type { Mot, Vocabulaire } from '../src/lib/mots'
import { aReviser, cleChapitre, motsChoisis, questionsChoisies, type Reglages } from '../src/lib/reglages'

const mot = (nl: string, chapitre: string, vraag = false): Mot => ({
  id: nl, matiere: 'Aard', chapitre, nl, det: '', fr: nl, definition: '', exemple: '', remarque: '',
  ...(vraag && { vraag: { leurres: [], page: '' } }),
})
const voc: Vocabulaire = {
  matieres: [{ nom: 'Aard', chapitres: ['1', '2'], mots: [mot('zee', '1'), mot('berg', '2')], questions: [mot('Wat is migratie?', '1', true), mot('Wat is TOLES?', '2', true)] }],
  misAJour: 0,
}
const r = (p: Partial<Reglages>) => ({ matieres: ['Aard'], chapitres: [], exercice: 'qcm', ...p }) as Reglages

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
