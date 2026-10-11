import { describe, expect, it } from 'vitest'
import type { Mot, Vocabulaire } from '../src/lib/mots'
import { appliquerLien, aReviser, bornesPages, chapitreSeul, cleChapitre, lienReglages, motsChoisis, questionsChoisies, reglagesDuLien, type Reglages } from '../src/lib/reglages'

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

describe('permalien', () => {
  const bio = cleChapitre('NW Biologie', '1. De ecosystemen')
  const aard = cleChapitre('Aard', '2')
  const partage = r({ matieres: ['NW Biologie'], chapitres: [bio, aard], pages: { [bio]: [5, 12], [aard]: [1, 3] }, exercice: 'questions', voix: false, repondre: 'ecrit' })
  it('aller-retour : les réglages, avec seulement les chapitres et pages des matières choisies', () => {
    const lien = lienReglages(partage, 'https://ici-be.github.io/VF/')
    expect(lien).toMatch(/^https:\/\/ici-be\.github\.io\/VF\/#r=[\w-]+$/)
    const lu = reglagesDuLien(lien.slice(lien.indexOf('#')))!
    expect(lu).toMatchObject({ matieres: ['NW Biologie'], chapitres: [bio], pages: { [bio]: [5, 12] }, exercice: 'questions', voix: false, repondre: 'ecrit' })
  })
  it('ignore un lien abîmé et les champs inconnus ou mal typés', () => {
    expect(reglagesDuLien('')).toBeNull()
    expect(reglagesDuLien('#r=%%%')).toBeNull()
    const b64 = btoa(JSON.stringify({ voix: 'oui', pirate: 1, nombre: 10 }))
    expect(reglagesDuLien('#r=' + b64)).toEqual({ nombre: 10 })
  })
  it('garde la mémoire des chapitres des autres matières', () => {
    const avant = r({ matieres: ['Aard'], chapitres: [aard, cleChapitre('NW Biologie', '2. Cellen')], pages: { [aard]: [1, 3] } })
    const apres = appliquerLien(avant, { matieres: ['NW Biologie'], chapitres: [bio], pages: { [bio]: [5, 12] } })
    expect(apres.matieres).toEqual(['NW Biologie'])
    expect(apres.chapitres).toEqual([aard, bio])
    expect(apres.pages).toEqual({ [aard]: [1, 3], [bio]: [5, 12] })
  })
})
