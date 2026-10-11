import { describe, expect, it } from 'vitest'
import { decouper, indexer } from '../src/lib/glossaire'
import type { Mot } from '../src/lib/mots'

const mot = (nl: string, fr: string, extra: Partial<Mot> = {}): Mot =>
  ({ id: nl, matiere: 'Geschiedenis', chapitre: '1', nl, det: '', fr, definition: '', exemple: '', remarque: '', ...extra })
const index = indexer([
  mot('eeuw', 'le siècle'), mot('oudheid', "l'Antiquité"), mot('klassieke oudheid', "l'Antiquité classique"),
  mot('dynastie', 'la dynastie'), mot('(zich) herinneren / onthouden', 'se souvenir'),
  mot('koning', 'le roi', { matiere: 'Nederlands' }), mot('koning', 'le monarque'),
  mot('twee', 'deux', { getal: 2 }), mot('lopen', 'marcher', { verbe: 'lopen' }), mot('de', 'le'),
])
const reconnus = (t: string, exclure?: string[]) =>
  decouper(index, t, 'Geschiedenis', exclure).filter(s => typeof s !== 'string').map(s => typeof s === 'string' ? s : `${s.texte}=${s.entree.fr}`)

describe('glossaire', () => {
  it('reconnaît les mots, l’expression la plus longue d’abord, et rend le texte intact', () => {
    const t = 'In de klassieke oudheid, twee eeuwen lang, regeren koningen.'
    expect(reconnus(t)).toEqual(["klassieke oudheid=l'Antiquité classique", 'eeuwen=le siècle', 'koningen=le monarque'])
    expect(decouper(index, t).map(s => typeof s === 'string' ? s : s.texte).join('')).toBe(t)
  })
  it('les variantes, les pluriels en -ën ; pas les nombres, les verbes conjugués ni les mots courts', () => {
    expect(reconnus('Dynastieën: wie kan het zich herinneren? Twee lopen de weg.')).toEqual(['Dynastieën=la dynastie', 'herinneren=se souvenir'])
  })
  it('jamais le mot à trouver', () => {
    expect(reconnus('Een dynastie duurt eeuwen.', ['dynastie'])).toEqual(['eeuwen=le siècle'])
  })
  it('une expression coupée par une virgule ne compte pas comme un tout', () => {
    expect(reconnus('klassieke, oudheid')).toEqual(["oudheid=l'Antiquité"])
  })
})
