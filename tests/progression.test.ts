import { beforeEach, describe, expect, it } from 'vitest'
import { motsARevoir, noter, suivi, _reinitialiser } from '../src/lib/progression'
import type { Mot } from '../src/lib/mots'

const mot = (nl: string): Mot => ({ id: nl, matiere: 'Bio', chapitre: '1', nl, det: '', fr: nl, definition: '', exemple: '', remarque: '' })
const JOUR = 86_400_000
const t0 = Date.UTC(2026, 9, 1)

describe('mots à revoir', () => {
  beforeEach(() => _reinitialiser())
  it('compte les échecs et leur date', () => {
    noter('aap', 'faux', t0)
    noter('aap', 'juste', t0 + JOUR)
    noter('aap', 'faux', t0 + 2 * JOUR)
    expect(suivi('aap')).toMatchObject({ rates: 2, dernierRate: t0 + 2 * JOUR, boite: 0, vus: 3, justes: 1 })
  })
  it('les plus fragiles d’abord, puis les plus souvent ratés, puis les plus récents', () => {
    const mots = ['aap', 'dier', 'plant', 'boom', 'vis'].map(mot)
    noter('aap', 'faux', t0)                                   // raté il y a longtemps (dans le mois)
    noter('dier', 'faux', t0 + 5 * JOUR)                       // raté plus récemment
    noter('plant', 'faux', t0); noter('plant', 'juste', t0 + JOUR)   // raté puis réussi une fois : boîte 1
    noter('boom', 'faux', t0)
    for (let i = 1; i <= 3; i++) noter('boom', 'juste', t0 + i * JOUR) // rattrapé : plus à revoir
    noter('vis', 'juste', t0)                                  // jamais raté
    expect(motsARevoir(mots, 30, t0 + 6 * JOUR).map(x => x.mot.nl)).toEqual(['dier', 'aap', 'plant'])
    noter('aap', 'faux', t0 + JOUR)                            // aap : 2 échecs, passe devant dier
    expect(motsARevoir(mots, 30, t0 + 6 * JOUR).map(x => x.mot.nl)).toEqual(['aap', 'dier', 'plant'])
  })
  it('oublie les échecs de plus de 30 jours et se limite à max', () => {
    const mots = Array.from({ length: 40 }, (_, i) => mot('m' + i))
    mots.forEach((m, i) => noter(m.id, 'faux', t0 + i * 1000))
    expect(motsARevoir(mots, 30, t0 + JOUR)).toHaveLength(30)
    expect(motsARevoir(mots, 30, t0 + 31 * JOUR)).toHaveLength(0)
  })
})
