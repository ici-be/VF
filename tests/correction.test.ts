import { describe, expect, it } from 'vitest'
import { corriger, variantes } from '../src/lib/correction'

const res = (r: string, a: string, l: 'fr' | 'nl', det = '', o = {}) => corriger(r, a, l, det, o).resultat

describe('réponses en français', () => {
  it('accepte sans article ni majuscule', () => {
    expect(res('Croyance', 'la croyance', 'fr')).toBe('juste')
    expect(res("l'histoire", "l'histoire", 'fr')).toBe('juste')
    expect(res('histoire', "l’histoire", 'fr')).toBe('juste')
  })
  it('accepte chaque variante', () => {
    expect(res('biffer', 'barrer / biffer', 'fr')).toBe('juste')
    expect(res('le futur', "l'avenir, le futur", 'fr')).toBe('juste')
    expect(res("l'avenir, le futur", "l'avenir, le futur", 'fr')).toBe('juste')
  })
  it('ignore les précisions entre parenthèses', () => {
    expect(res('la légende', "la légende (d'une carte)", 'fr')).toBe('juste')
    expect(res('repasser', 'repasser (un trait), décalquer', 'fr')).toBe('juste')
  })
  it('« presque » pour les accents ou une faute de frappe', () => {
    expect(res('la diversite', 'la diversité', 'fr')).toBe('presque')
    expect(res('croyence', 'la croyance', 'fr')).toBe('presque')
  })
  it('faux sinon', () => {
    expect(res('la société', 'la croyance', 'fr')).toBe('faux')
    expect(res('', 'la croyance', 'fr')).toBe('faux')
    expect(res('sel', 'sec, sèche', 'fr')).toBe('faux') // mot court : pas de tolérance d'une lettre
  })
  it('verbes pronominaux', () => {
    expect(res('distinguer', 'se distinguer / se différencier', 'fr')).toBe('juste')
  })
})

describe('réponses en néerlandais', () => {
  it('article facultatif, mais juste s’il est donné', () => {
    expect(res('geloof', 'geloof', 'nl', 'het')).toBe('juste')
    expect(res('het geloof', 'geloof', 'nl', 'het')).toBe('juste')
    expect(res('de geloof', 'geloof', 'nl', 'het')).toBe('presque')
    expect(corriger('de geloof', 'geloof', 'nl', 'het').message).toContain('het geloof')
  })
  it('article exigé si demandé', () => {
    expect(res('geloof', 'geloof', 'nl', 'het', { exigerArticle: true })).toBe('presque')
    expect(res('het geloof', 'geloof', 'nl', 'het', { exigerArticle: true })).toBe('juste')
  })
  it('dictée : orthographe exacte', () => {
    expect(res('Oriëntatie', 'oriëntatie', 'nl', '', { strict: true })).toBe('juste')
    expect(res('orientatie', 'oriëntatie', 'nl', '', { strict: true })).toBe('faux')
    expect(res('orientatie', 'oriëntatie', 'nl')).toBe('presque')
  })
  it('expressions avec variantes', () => {
    expect(res('na Christus', 'voor Christus, na Christus', 'nl')).toBe('juste')
    expect(variantes('onderscheiden (= verschillen zien)', 'nl')).toContain('onderscheiden')
  })
})

import { leurres } from '../src/lib/seance'
import type { Mot } from '../src/lib/mots'
describe('QCM', () => {
  const mot = (nl: string, det: string, fr: string, chapitre = '1'): Mot =>
    ({ id: nl, matiere: 'Bio', chapitre, nl, det, fr, definition: '', exemple: '', remarque: '' })
  const tous = [mot('predatie', '', 'la prédation'), mot('plant', 'de', 'la plante'), mot('dier', 'het', "l'animal"),
    mot('parasitisme', 'het', 'le parasitisme'), mot('ademen', '', 'respirer'), mot('groeien', '', 'grandir'), mot('sterven', '', 'mourir')]
  it('leurres sans article pour une réponse sans article (FR → NL)', () => {
    const l = leurres({ mot: tous[0], sens: 'fr-nl' }, tous)
    expect(l).toHaveLength(3)
    expect(l.every(x => !/^(de|het) /.test(x))).toBe(true)
  })
  it('jamais la bonne réponse parmi les leurres', () => {
    for (let k = 0; k < 20; k++) expect(leurres({ mot: tous[1], sens: 'nl-fr' }, tous)).not.toContain('la plante')
  })
})
