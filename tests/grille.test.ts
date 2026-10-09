import { describe, expect, it } from 'vitest'
import { genererGrille, lettresDe, type Grille } from '../src/lib/grille'

const MOTS = ['aap', 'ademen', 'afbreker', 'afval', 'alg', 'biotoop', 'biocenose', 'bloed', 'carnivoor', 'consument',
  'ecosysteem', 'herbivoor', 'omnivoor', 'parasitisme', 'predatie', 'producent', 'reducent', 'teek', 'vis', 'voedselweb',
  'oriëntatie', 'dode materie', 'levende wezens']

function graine(n: number) {
  let x = n * 9301 + 49297
  return () => ((x = (x * 9301 + 49297) % 233280) / 233280)
}

/** toutes les suites de 2 lettres ou plus, en ligne et en colonne */
function suites(g: Grille): string[] {
  const res: string[] = []
  const lire = (cellules: (string | null)[]) => {
    let s = ''
    for (const c of [...cellules, null]) {
      if (c) s += c
      else { if (s.length > 1) res.push(s); s = '' }
    }
  }
  g.cases.forEach(l => lire(l))
  for (let c = 0; c < g.colonnes; c++) lire(g.cases.map(l => l[c]))
  return res.sort()
}

describe('mots croisés', () => {
  it('lettres utilisables', () => {
    expect(lettresDe('oriëntatie')).toBe('ORIENTATIE')
    expect(lettresDe('dode materie')).toBeNull()
    expect(lettresDe('al')).toBeNull()
  })

  it('grilles valides : chaque mot à sa place, aucun mot accidentel, tout est relié', () => {
    for (let s = 1; s <= 50; s++) {
      const g = genererGrille(MOTS.map(m => ({ mot: m, donnee: m })), 12, 20, graine(s))!
      expect(g.mots.length).toBeGreaterThanOrEqual(8)
      // chaque mot est écrit dans la grille
      for (const m of g.mots) {
        const lu = [...m.lettres].map((_, k) => m.sens === 'horizontal' ? g.cases[m.ligne][m.colonne + k] : g.cases[m.ligne + k][m.colonne]).join('')
        expect(lu).toBe(m.lettres)
      }
      // les seules suites de lettres sont les mots posés
      expect(suites(g)).toEqual(g.mots.map(m => m.lettres).sort())
      // tout est relié (parcours des cases pleines)
      const pleines = g.cases.flatMap((l, i) => l.map((c, j) => (c ? `${i},${j}` : ''))).filter(Boolean)
      const vus = new Set([pleines[0]]), pile = [pleines[0]]
      while (pile.length) {
        const [i, j] = pile.pop()!.split(',').map(Number)
        for (const [a, b] of [[i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]]) {
          const k = `${a},${b}`
          if (g.cases[a]?.[b] && !vus.has(k)) { vus.add(k); pile.push(k) }
        }
      }
      expect(vus.size).toBe(pleines.length)
    }
  })

  it('numéros dans l’ordre de lecture', () => {
    const g = genererGrille(MOTS.map(m => ({ mot: m, donnee: m })), 12, 20, graine(7))!
    const departs = g.mots.map(m => [m.ligne, m.colonne, m.numero])
    for (const [l, c, n] of departs) for (const [l2, c2, n2] of departs) {
      if (l < l2 || (l === l2 && c < c2)) expect(n).toBeLessThan(n2)
    }
  })

  it('pas de grille avec moins de deux mots utilisables', () => {
    expect(genererGrille([{ mot: 'aap', donnee: 1 }, { mot: 'dode materie', donnee: 2 }])).toBeNull()
  })
})
