import { describe, expect, it } from 'vitest'
import { empreinte, texteALire } from '../src/lib/voix'

describe('voix', () => {
  it('même empreinte que outils/voix.py', async () => {
    // valeur calculée par le script Python pour le fichier public/audio/fb03b438c83fabce.mp3
    expect(await empreinte('nl', 'het geloof')).toBe('fb03b438c83fabce')
  })
  it('texte lu sans crochets ni parenthèses', () => {
    expect(texteALire('la légende (d’une carte)')).toBe('la légende')
    expect(texteALire('Het bevolkingsaantal [neemt af]')).toBe('Het bevolkingsaantal neemt af')
    expect(texteALire('barrer / biffer')).toBe('barrer, biffer')
    expect(texteALire('Een periode van 1000 jaar noemen we een ___.')).toBe('Een periode van 1000 jaar noemen we een ….')
  })
  it('abréviations lues en entier', () => {
    expect(texteALire('Van 3500 v.C. tot 753 v.C.')).toBe('Van 3500 voor Christus tot 753 voor Christus')
    expect(texteALire('In 622 n.C., met de Hidjra')).toBe('In 622 na Christus, met de Hidjra')
    expect(texteALire('46 v.Chr. en 622 n. Chr.')).toBe('46 voor Christus en 622 na Christus')
    expect(texteALire('vogels, vissen, enz. (bv. een merel)')).toBe('vogels, vissen, enzovoort')
    // un calcul, en français : opérateurs en mots, parenthèses gardées ; en néerlandais, rien ne change
    expect(texteALire('//', 'fr')).toBe('parallèle à')
    expect(texteALire('X ∉ AB]', 'fr')).toBe('X n’appartient pas à AB')
    expect(texteALire('28 + 12 : 4 + ((3 · 2 + 7) · 2) = 57', 'fr')).toBe('28 + 12 divisé par 4 + ((3 fois 2 + 7) fois 2) = 57')
    expect(texteALire('15 − 2 = 13', 'fr')).toBe('15 moins 2 = 13')
    expect(texteALire('trois (3)', 'fr')).toBe('trois')
    expect(texteALire('5 ∈ ℕ', 'fr')).toBe('5 appartient à N')
    expect(texteALire('een breuk (1 : 200 000 000)', 'nl')).toBe('een breuk')
  })
})
