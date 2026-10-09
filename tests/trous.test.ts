import { describe, expect, it } from 'vitest'
import { decouper, masquer } from '../src/lib/trous'

describe('définitions sans la réponse', () => {
  it('cache le mot et ses formes', () => {
    expect(masquer('Biologie is de studie van het leven', 'biologie')).toBe('… is de studie van het leven')
    expect(masquer('Carnivoren zijn levende wezens die zich exclusief voeden met dieren', 'carnivoor')).toBe('… zijn levende wezens die zich exclusief voeden met dieren')
    expect(masquer('Autotrofe organismen hebben geen andere levende wezens nodig', 'autotroof')).toBe('… organismen hebben geen andere levende wezens nodig')
    expect(masquer('Een object is dode materie als het …', 'dode materie')).toBe('Een object is … als het …')
  })
  it('laisse une définition qui ne contient pas le mot', () => {
    expect(masquer('Het aantal inwoners per km²', 'bevolkingsdichtheid')).toBe('Het aantal inwoners per km²')
  })
})

describe('phrases à trous', () => {
  it('trous entre crochets', () => {
    expect(decouper('Het bevolkingsaantal [neemt af]', 'afnemen')).toEqual([{ texte: 'Het bevolkingsaantal ' }, { trou: 'neemt af' }])
    expect(decouper('In de atlas [vind] je veel informatie [terug]', 'terugvinden')).toEqual([
      { texte: 'In de atlas ' }, { trou: 'vind' }, { texte: ' je veel informatie ' }, { trou: 'terug' },
    ])
  })
  it('sans crochets : cherche le mot dans la phrase', () => {
    expect(decouper('Afrika heeft een jongere bevolking', 'bevolking')).toEqual([{ texte: 'Afrika heeft een jongere ' }, { trou: 'bevolking' }])
  })
  it('null si le mot n’est pas dans la phrase', () => {
    expect(decouper('Het regent vandaag', 'bevolking')).toBeNull()
  })
})
