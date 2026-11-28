import { describe, expect, it } from 'vitest'
import { BRONNEN, BRONNEN_KAARTEN, gedateerdeBron, questionBron } from '../src/lib/bronnen'

const graine = (n: number) => () => { n = (n * 9301 + 49297) % 233280; return n / 233280 }

describe('Bronnen (Ad fontes!)', () => {
  it('chaque carte : des questions propres, la bonne réponse parmi les choix', () => {
    for (let s = 1; s < 400; s++) BRONNEN_KAARTEN.forEach((_, i) => {
      const q = questionBron(i, graine(s * 17 + i))
      expect(q.stappen).toHaveLength(2)
      const textes = [q.bron.nl, q.bron.fr, q.uitleg.nl, q.uitleg.fr, ...q.stappen.flatMap(st => [st.vraag.nl, ...st.options])]
      for (const t of textes) expect(t, t).not.toMatch(/undefined|NaN|\s{2}|\bin 0\b|-\d+ v\.C/)
      for (const st of q.stappen) {
        expect(st.options.length).toBeGreaterThanOrEqual(2)
        expect(new Set(st.options).size).toBe(st.options.length)
        for (const b of st.bonnes) expect(st.options).toContain(b)
        expect(st.bonnes.length).toBeLessThan(st.options.length)
      }
    })
  })
  it('les dates : primaire pendant, secondaire après, historisch werk depuis 1945', () => {
    for (let s = 1; s < 500; s++) {
      const { bron } = gedateerdeBron(graine(s))
      const m = bron.tijd!.wanneer.nl.match(/in (\d+)( v\.C\.)?/)!
      const j = m[2] ? -Number(m[1]) : Number(m[1])
      if (bron.tijd!.soort === 'historisch') expect(j).toBeGreaterThanOrEqual(1945)
      if (bron.tijd!.soort === 'secundair') expect(j).toBeLessThan(1945)
    }
  })
  it('les sources du livre (p. 40-53) comme corrigées dans le cahier', () => {
    const b = (debut: string) => BRONNEN.find(x => x.nl.startsWith(debut))!
    expect(b('Het decreet van Canopus')).toMatchObject({ publiek: true, officieel: true })
    expect(b('Een Egyptisch huwelijkscontract')).toMatchObject({ publiek: false, officieel: true })
    expect(b('Een Romeinse brief')).toMatchObject({ publiek: false, officieel: false })
    expect(b('Tekst op een graftombe')).toMatchObject({ publiek: true, officieel: false })
    expect(b('De Zuil van Marcianus').tijd!.soort).toBe('primair')
    expect(b('Het schilderij “De dood van Julius Caesar”').tijd!.soort).toBe('secundair')
    expect(b('In 2019 schreef C.P.').tijd!.soort).toBe('historisch')
    expect(b('De Ilias').tijd!.soort).toBe('secundair')
  })
})
