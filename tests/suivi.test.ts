import { beforeEach, describe, expect, it } from 'vitest'
import { _reinitialiser, debloquee, fusionner, journal, noter, recordDeJours, serieDeJours, suivi } from '../src/lib/progression'
import { aReviserAujourdhui } from '../src/lib/revision'
import { importerTransfert, lienTransfert } from '../src/lib/transfert'
import type { Mot, Vocabulaire } from '../src/lib/mots'

const JOUR = 86_400_000
const midi = (d: string) => new Date(d + 'T12:00').getTime()
const mot = (nl: string, p: Partial<Mot> = {}): Mot => ({ id: nl, matiere: 'HW Geschiedenis', chapitre: '1', nl, det: '', fr: nl, definition: '', exemple: '', remarque: '', ...p })
const repondre = (jour: string, n: number) => { for (let i = 0; i < n; i++) noter(`m${i}`, 'juste', midi(jour) + i) }

describe('journal, séries et récompenses', () => {
  beforeEach(() => {
    const m = new Map<string, string>()
    globalThis.localStorage = { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) } as Storage
    _reinitialiser()
  })
  it('un jour compte à partir de 10 réponses ; la série et le record', () => {
    repondre('2026-10-05', 10); repondre('2026-10-06', 12); repondre('2026-10-07', 3); repondre('2026-10-09', 10); repondre('2026-10-10', 10)
    expect(journal()['2026-10-07']).toBe(3)
    expect(serieDeJours(midi('2026-10-10'))).toBe(2)
    expect(serieDeJours(midi('2026-10-11'))).toBe(2)     // aujourd'hui pas encore fait : la série d'hier compte
    expect(serieDeJours(midi('2026-10-12'))).toBe(0)
    expect(recordDeJours()).toBe(2)
    expect(debloquee('confettis')).toBe(false)
    repondre('2026-10-11', 10)
    expect(recordDeJours()).toBe(3)
    expect(debloquee('confettis')).toBe(true)
    expect(debloquee('gigue')).toBe(true)                // pas une récompense : toujours là
  })
  it('fusion avec un autre appareil : le suivi le plus récent l’emporte, le journal garde le plus grand', () => {
    noter('a', 'juste', 1000); noter('b', 'faux', 5000)
    journal()['2026-10-01'] = 4
    const n = fusionner({ progression: { a: { boite: 3, vus: 4, justes: 4, dernier: 9000, rates: 0 }, b: { boite: 2, vus: 1, justes: 1, dernier: 10, rates: 0 } }, journal: { '2026-10-01': 9, '2026-10-02': 15 }, ratesInterro: [] })
    expect(n).toBe(1)
    expect(suivi('a')!.boite).toBe(3)
    expect(suivi('b')!.rates).toBe(1)
    expect(journal()['2026-10-01']).toBe(9)
    expect(journal()['2026-10-02']).toBe(15)
  })
  it('le lien de transfert, aller et retour', async () => {
    noter('eeuw', 'juste', 1000)
    const lien = await lienTransfert('https://exemple.be/VF/')
    expect(lien.startsWith('https://exemple.be/VF/#transfert=')).toBe(true)
    _reinitialiser()
    const m = new Map<string, string>()
    globalThis.localStorage = { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) } as Storage
    expect(await importerTransfert(lien.slice(lien.indexOf('#')))).toBe(1)
    expect(suivi('eeuw')!.justes).toBe(1)
    expect(await importerTransfert('#transfert=z.nimportequoi')).toBeNull()
  })
  it('révision du jour : les erreurs récentes, puis ce qui attend ; chaque carte avec son exercice', () => {
    const maintenant = midi('2026-10-11')
    const voc: Vocabulaire = { misAJour: 0, matieres: [
      { nom: 'HW Geschiedenis', chapitres: ['1'], mots: [mot('eeuw'), mot('jaar'), mot('nieuw')], questions: [mot('Wat is een eeuw?', { vraag: { leurres: [], page: '', elements: [], nombre: 0 } })] },
      { nom: 'Religion', chapitres: ['1'], mots: [mot('autel', { matiere: 'Religion' })] },
    ] }
    noter('eeuw', 'faux', maintenant - JOUR)                 // erreur récente
    noter('jaar', 'juste', maintenant - 5 * JOUR)            // boîte 1, attend depuis 5 jours (1 jour suffit)
    noter('Wat is een eeuw?', 'juste', maintenant - 3 * JOUR)
    noter('autel', 'juste', maintenant - 2 * JOUR)
    // « nieuw » jamais vu : pas dans la révision du jour
    const cartes = aReviserAujourdhui(voc, maintenant, () => .3)
    expect(cartes.map(c => c.mot.nl).sort()).toEqual(['Wat is een eeuw?', 'autel', 'eeuw', 'jaar'])
    expect(Object.fromEntries(cartes.map(c => [c.mot.nl, c.exercice]))).toEqual({ eeuw: 'qcm', jaar: 'qcm', 'Wat is een eeuw?': 'questions', autel: 'definitions' })
  })
})
