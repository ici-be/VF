import { describe, expect, it } from 'vitest'
import { BOEK_ZINNEN, WOORDVOLGORDE, controleer, lees, oplossing, questionWoordvolgorde, zinTekst } from '../src/lib/woordvolgorde'

const graine = (n: number) => () => { n = (n * 9301 + 49297) % 233280; return n / 233280 }
/** l'ordre des zinsdelen d'après la phrase écrite */
const ordre = (z: ReturnType<typeof lees>, zin: string) => {
  const rest = zin.replace(/[.?]$/, '').toLowerCase()
  const v: number[] = []
  let pos = 0
  while (pos < rest.length) {
    const i = z.delen.findIndex((d, k) => !v.includes(k) && rest.startsWith(d.t.toLowerCase(), pos) && (rest[pos + d.t.length] ?? ' ') === ' ')
    if (i < 0) throw new Error(`${zin} : ${rest.slice(pos)}`)
    v.push(i); pos += z.delen[i].t.length + 1
  }
  return v
}
const juist = (n: string, zin: string, vraag = false) => { const z = lees(n, vraag); return controleer(z, ordre(z, zin)) }

describe('Woordvolgorde', () => {
  it('les ordres justes du cours, et plusieurs ordres possibles', () => {
    const n = 'ik=o / ontmoet=p / Jan=lv / morgen=t / op school=P'
    for (const z of ['Ik ontmoet Jan morgen op school.', 'Ik ontmoet morgen Jan op school.', 'Morgen ontmoet ik Jan op school.', 'Op school ontmoet ik morgen Jan.'])
      expect(juist(n, z).juist, z).toBe(true)
    const tempo = 'Arthur=o / gaat=p / elk jaar in juli=t / met de jeugdclub=B / met de bus=M / naar Walibi=P'
    expect(juist(tempo, 'Arthur gaat elk jaar in juli met de jeugdclub met de bus naar Walibi.').juist).toBe(true)
    expect(juist('we=o / moeten=p / om halfvijf=T / hier=hier / zijn=s', 'We moeten hier om halfvijf zijn.').juist).toBe(true)
    expect(juist('we=o / moeten=p / om halfvijf=T / hier=hier / zijn=s', 'We moeten om halfvijf hier zijn.').juist).toBe(true)
    expect(juist('je=o / moet=p / het=vnw / haar=vnw / teruggeven=s', 'Je moet het haar teruggeven.').juist).toBe(true)
    expect(juist('kom=p / je=o / morgen=t / mee=s', 'Kom je morgen mee?', true).juist).toBe(true)
  })
  it('les fautes, avec la règle du cours', () => {
    const n = 'ik=o / ga=p / vandaag=t / naar school=P'
    expect(juist(n, 'Vandaag ik ga naar school.').waarom.nl).toMatch(/inversie/)
    expect(juist(n, 'Naar school ga ik vandaag.').waarom.nl).toMatch(/naar/)
    expect(juist('ik=o / studeer=p / vandaag=t / goed=bw / op school=P', 'Vandaag op school studeer ik goed.').waarom.nl).toMatch(/Maximaal één/)
    expect(juist('Arthur=o / gaat=p / met de bus=M / naar Walibi=P', 'Arthur gaat naar Walibi met de bus.').waarom.nl).toMatch(/TeMPo/)
    expect(juist('Arthur=o / moet=p / met de trein=M / naar Londen=P / gaan=s', 'Arthur moet gaan met de trein naar Londen.').waarom.nl).toMatch(/achteraan/)
    expect(juist('kom=p / je=o / morgen=t / mee=s', 'Je kom morgen mee?', true).waarom.nl).toMatch(/ja-neevraag/)
    expect(juist('ik=o / geef=p / mijn mama=mv / een cadeautje=lo', 'Ik geef een cadeautje mijn mama.').juist).toBe(false)
  })
  it('les phrases du livre : la solution est juste, et le livre aussi', () => {
    BOEK_ZINNEN.forEach(z => {
      expect(controleer(z, z.delen.map((_, i) => i)).juist, zinTekst(z, z.delen.map((_, i) => i))).toBe(true)
      expect(controleer(z, oplossing(z)).juist).toBe(true)
    })
  })
  it('chaque carte : des questions propres, la solution juste, le mélange faux', () => {
    for (let s = 1; s < 300; s++) WOORDVOLGORDE.forEach((_, i) => {
      const q = questionWoordvolgorde(i, graine(s * 13 + i))
      // l'explication en néerlandais et en français
      expect(q.uitleg.nl.length).toBeGreaterThan(10)
      expect(q.uitleg.fr.length).toBeGreaterThan(10)
      const textes = q.soort === 'puzzel' ? [q.uitleg.nl, ...q.zin.delen.map(d => d.t)] : [q.uitleg.nl, ...q.options]
      for (const t of textes) expect(t).not.toMatch(/undefined|NaN|\s{2}| [.,?]$/)
      if (q.soort === 'puzzel') {
        // une erreur s'explique dans les deux langues
        const o = controleer(q.zin, q.schud)
        expect(o.waarom.nl).not.toBe('')
        expect(o.waarom.fr).not.toBe('')
        // le français : une espace avant « ? », pas avant le point
        for (const t of [q.boven ?? '', q.zin.fr ?? '']) expect(t).not.toMatch(/undefined|\s{2}| [.,]|\S\?/)
        expect(controleer(q.zin, oplossing(q.zin)).juist, zinTekst(q.zin, oplossing(q.zin))).toBe(true)
        expect(controleer(q.zin, q.schud).juist).toBe(false)
        expect(q.zin.delen.length).toBeGreaterThanOrEqual(3)
        expect(new Set(q.zin.delen.map(d => d.t)).size).toBe(q.zin.delen.length)
      } else {
        expect(q.options).toContain(q.bonne)
        expect(new Set(q.options).size).toBe(q.options.length)
        expect(q.options.length).toBeGreaterThanOrEqual(3)
      }
    })
  })
})
