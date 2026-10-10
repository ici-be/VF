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
  })
  it('abréviations lues en entier', () => {
    expect(texteALire('Van 3500 v.C. tot 753 v.C.')).toBe('Van 3500 voor Christus tot 753 voor Christus')
    expect(texteALire('In 622 n.C., met de Hidjra')).toBe('In 622 na Christus, met de Hidjra')
    expect(texteALire('46 v.Chr. en 622 n. Chr.')).toBe('46 voor Christus en 622 na Christus')
    expect(texteALire('vogels, vissen, enz. (bv. een merel)')).toBe('vogels, vissen, enzovoort')
  })
})
