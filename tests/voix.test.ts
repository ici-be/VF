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
})
