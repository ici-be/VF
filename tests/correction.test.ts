import { describe, expect, it } from 'vitest'
import { corriger, corrigerListe, variantes } from '../src/lib/correction'

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

import { synonymes } from '../src/lib/seance'
describe('synonymes du tableau', () => {
  const mot = (nl: string, fr: string): Mot => ({ id: nl, matiere: 'Aard', chapitre: '2', nl, det: 'de', fr, definition: '', exemple: '', remarque: '' })
  const tous = [mot('themakaart', 'la carte thématique'), mot('thematische kaart', 'la carte thématique'), mot('legende', 'la légende'),
    mot('schaal', "l'échelle"), mot('titel', 'le titre'), mot('atlas', "l'atlas")]
  it('un synonyme n’est jamais un leurre', () => {
    for (let k = 0; k < 20; k++) expect(leurres({ mot: tous[0], sens: 'fr-nl' }, tous)).not.toContain('de thematische kaart')
  })
  it('les synonymes sont trouvés', () => {
    expect(synonymes({ mot: tous[0], sens: 'fr-nl' }, tous).map(m => m.nl)).toEqual(['thematische kaart'])
    expect(synonymes({ mot: tous[0], sens: 'nl-fr' }, tous)).toEqual([])
  })
})

import { differences } from '../src/lib/correction'
describe('différences lettre à lettre (dictée)', () => {
  const vue = (t: string, a: string) => differences(t, a).map(s => s.etat === 'ok' ? s.texte : s.etat === 'faux' ? `(${s.texte})` : `[${s.texte}]`).join('')
  it('lettre oubliée, en trop, remplacée', () => {
    expect(vue('orientatie', 'oriëntatie')).toBe('ori(e)[ë]ntatie')
    expect(vue('geloof', 'geloof')).toBe('geloof')
    expect(vue('gelooff', 'geloof')).toBe('geloof(f)')
    expect(vue('glof', 'geloof')).toBe('g[e]lo[o]f')
    expect(vue('Geloof', 'geloof')).toBe('Geloof')
  })
})

describe('énumérations', () => {
  const toles = ['Titel', 'Oriëntatie', 'Legende', 'Schaal']
  it('accepte les éléments dans n’importe quel ordre, avec la tolérance de l’écrit', () => {
    const c = corrigerListe(['schaal', 'de legende', 'Titel', 'orientatie'], toles)
    expect(c.champs.map(x => x.resultat)).toEqual(['juste', 'juste', 'juste', 'presque'])
    expect(c.resultat).toBe('presque')
    expect(c.manquants).toEqual([])
    expect(corrigerListe(['Schaal', 'Legende', 'Titel', 'Oriëntatie'], toles).resultat).toBe('juste')
  })
  it('ne compte pas deux fois le même élément, et dit ce qui manque', () => {
    const c = corrigerListe(['Titel', 'titel', '', 'kleur'], toles)
    expect(c.champs.map(x => x.message)).toEqual(['', 'Déjà donné.', 'Pas de réponse.', ''])
    expect(c.resultat).toBe('faux')
    expect(c.manquants).toEqual(['Oriëntatie', 'Legende', 'Schaal'])
  })
  it('« Noem drie » parmi plus d’éléments, avec des variantes', () => {
    const oceanen = ['Atlantische Oceaan', 'Stille Oceaan / Grote Oceaan', 'Indische Oceaan', 'Noordelijke IJszee', 'Zuidelijke IJszee']
    const c = corrigerListe(['grote oceaan', 'Indische Oceaan', 'Zuidelijke IJszee'], oceanen)
    expect(c.resultat).toBe('juste')
    expect(c.champs[0].element).toBe('Stille Oceaan / Grote Oceaan')
    expect(c.manquants).toEqual(['Atlantische Oceaan', 'Noordelijke IJszee'])
  })
  it('« presque » quand au moins la moitié est trouvée', () => {
    expect(corrigerListe(['Titel', 'Schaal', 'x', 'y'], toles).resultat).toBe('presque')
    expect(corrigerListe(['Titel', 'x', 'y', 'z'], toles).resultat).toBe('faux')
  })
})
