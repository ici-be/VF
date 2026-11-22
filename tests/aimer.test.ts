import { describe, expect, it } from 'vitest'
import { AIMER, questionAimer } from '../src/lib/aimer'

describe('Aimer', () => {
  it('chaque carte donne des phrases propres, la bonne réponse parmi les propositions', () => {
    AIMER.forEach((_, i) => {
      for (let n = 0; n < 300; n++) {
        const q = questionAimer(i)
        const tout = [q.avant, q.apres, q.uitleg, ...q.options]
        for (const t of tout) expect(t).not.toMatch(/undefined|NaN|\s{2}| [.,?]/)
        expect(q.boven).not.toMatch(/undefined|\s{2}| [.,]/)
        expect(q.options).toContain(q.bonnes[0])
        expect(new Set(q.options).size).toBe(q.options.length)
        expect(q.options.filter(o => q.bonnes.includes(o))).toHaveLength(1)
        expect(q.options.length === 2 || q.options.length === 4).toBe(true)
      }
    })
  })
  it('houden van : ik hou(d), jij houdt, hou je?', () => {
    for (let n = 0; n < 300; n++) {
      const q = questionAimer(0)
      if (q.avant === 'Ik ') expect(q.bonnes).toEqual(['hou', 'houd'])
      if (/^ (je|jij) van/.test(q.apres) && !q.avant) expect(q.bonnes).toEqual(['hou', 'houd'])
      if (/^(Jij|Je|Hij|U) $/.test(q.avant)) expect(q.bonnes).toEqual(['houdt'])
    }
  })
})
