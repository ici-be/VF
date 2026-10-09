import { describe, expect, it } from 'vitest'
import donnees from '../src/data/conjugaisons.json'

const V = Object.fromEntries(donnees.verbes.map(v => [v.inf, v]))
const P = { ik: 0, jij: 1, u: 2, hij: 3, wij: 4, jullie: 5, zij: 6 }
type Temps = 'present' | 'ovt' | 'vtt' | 'futur'
const forme = (inf: string, t: Temps, p: keyof typeof P) => V[inf].formes[t][P[p]]
const question = (inf: string, t: Temps, p: keyof typeof P) => V[inf].questions[t][P[p]]

describe('conjugaisons générées', () => {
  it('50 verbes, 4 temps, 7 personnes', () => {
    expect(donnees.verbes).toHaveLength(50)
    for (const v of donnees.verbes) for (const t of ['present', 'ovt', 'vtt', 'futur'] as Temps[]) {
      expect(v.formes[t]).toHaveLength(7)
      expect(v.questions[t]).toHaveLength(7)
    }
  })
  it('présent : réguliers, radical, -t', () => {
    expect(forme('slapen', 'present', 'ik')).toEqual(['slaap'])
    expect(forme('slapen', 'present', 'hij')).toEqual(['slaapt'])
    expect(forme('slapen', 'present', 'wij')).toEqual(['slapen'])
    expect(forme('zitten', 'present', 'hij')).toEqual(['zit'])
    expect(forme('worden', 'present', 'jij')).toEqual(['wordt'])
    expect(forme('lezen', 'present', 'ik')).toEqual(['lees'])
    expect(forme('geven', 'present', 'hij')).toEqual(['geeft'])
    expect(forme('gaan', 'present', 'hij')).toEqual(['gaat'])
    expect(forme('komen', 'present', 'ik')).toEqual(['kom'])
  })
  it('présent : irréguliers', () => {
    expect(forme('zijn', 'present', 'hij')).toEqual(['is'])
    expect(forme('hebben', 'present', 'u')).toEqual(['hebt', 'heeft'])
    expect(forme('kunnen', 'present', 'jij')).toEqual(['kunt', 'kan'])
    expect(forme('mogen', 'present', 'jij')).toEqual(['mag'])
  })
  it('imparfait : « ’t kofschip » et verbes forts', () => {
    expect(forme('werken', 'ovt', 'ik')).toEqual(['werkte'])
    expect(forme('leven', 'ovt', 'wij')).toEqual(['leefden'])
    expect(forme('wachten', 'ovt', 'ik')).toEqual(['wachtte'])
    expect(forme('betalen', 'ovt', 'ik')).toEqual(['betaalde'])
    expect(forme('slapen', 'ovt', 'zij')).toEqual(['sliepen'])
    expect(forme('zijn', 'ovt', 'wij')).toEqual(['waren'])
  })
  it('passé composé : auxiliaire et participe', () => {
    expect(forme('slapen', 'vtt', 'ik')).toEqual(['heb geslapen'])
    expect(forme('betalen', 'vtt', 'hij')).toEqual(['heeft betaald'])
    expect(forme('wachten', 'vtt', 'ik')).toEqual(['heb gewacht'])
    expect(forme('leven', 'vtt', 'ik')).toEqual(['heb geleefd'])
    expect(forme('komen', 'vtt', 'hij')).toEqual(['is gekomen'])
    expect(forme('zijn', 'vtt', 'wij')).toEqual(['zijn geweest'])
    expect(forme('lopen', 'vtt', 'ik')).toEqual(['heb gelopen', 'ben gelopen'])
  })
  it('futur', () => {
    expect(forme('slapen', 'futur', 'jij')).toEqual(['zult slapen', 'zal slapen'])
    expect(forme('slapen', 'futur', 'wij')).toEqual(['zullen slapen'])
  })
  it('forme interrogative : inversion, « jij » perd son -t', () => {
    expect(question('slapen', 'present', 'jij')).toContain('slaap jij')
    expect(question('slapen', 'present', 'jij')).toContain('slaap je')
    expect(question('slapen', 'present', 'jij')).not.toContain('slaapt jij')
    expect(question('slapen', 'present', 'hij')).toContain('slaapt hij')
    expect(question('slapen', 'present', 'u')).toEqual(['slaapt u'])
    expect(question('hebben', 'present', 'jij')).toContain('heb jij')
    expect(question('worden', 'present', 'jij')).toContain('word jij')
    expect(question('slapen', 'vtt', 'jij')).toContain('heb jij geslapen')
    expect(question('slapen', 'futur', 'jij')).toEqual(expect.arrayContaining(['zul jij slapen', 'zal jij slapen']))
    expect(V.slapen.questionsTexte.present[1]).toBe('Slaap jij?')
  })
  it('lecture à voix haute', () => {
    expect(V.slapen.lecture.present).toBe('ik slaap, jij slaapt, hij slaapt, wij slapen, jullie slapen, zij slapen')
    expect(V.zijn.rang).toBe(1)
  })
})
