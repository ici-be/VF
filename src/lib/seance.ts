// Une série d'exercices : quels mots, dans quel ordre, dans quel sens.
import type { Mot } from './mots'
import { exercice, type Reglages } from './reglages'
import { fragilite } from './progression'
import { simplifier } from './correction'

export interface Carte {
  mot: Mot
  sens: 'fr-nl' | 'nl-fr'
  /** déjà reposée après une erreur : on ne la remet pas une troisième fois */
  reprise?: boolean
}

export function melanger<T>(t: T[], hasard = Math.random): T[] {
  const r = [...t]
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(hasard() * (i + 1))
    ;[r[i], r[j]] = [r[j], r[i]]
  }
  return r
}

export function construireSerie(mots: Mot[], r: Reglages, hasard = Math.random): Carte[] {
  const ex = exercice(r.exercice)
  let choisis = mots.filter(ex.accepte)
  if (r.ordre === 'hasard') choisis = melanger(choisis, hasard)
  else if (r.ordre === 'fragiles') {
    // mélangés d'abord, pour que les mots de même fragilité ne sortent pas toujours dans le même ordre
    const f = new Map(choisis.map(m => [m.id, fragilite(m.id)]))
    choisis = melanger(choisis, hasard).sort((a, b) => f.get(a.id)! - f.get(b.id)!)
  }
  if (r.nombre > 0) choisis = choisis.slice(0, r.nombre)
  // l'ordre « fragiles » sert à choisir les mots ; on les mélange ensuite pour la série
  if (r.ordre === 'fragiles') choisis = melanger(choisis, hasard)
  return choisis.map(mot => ({
    mot,
    sens: r.sens === 'mix' ? (hasard() < 0.5 ? 'fr-nl' : 'nl-fr') : r.sens,
  }))
}

/** Le mot néerlandais avec son article : « het geloof ». */
export const nlComplet = (m: Mot) => (m.det ? `${m.det} ${m.nl}` : m.nl)

export function question(c: Carte): { texte: string; langue: 'fr' | 'nl' } {
  return c.sens === 'fr-nl' ? { texte: c.mot.fr, langue: 'fr' } : { texte: nlComplet(c.mot), langue: 'nl' }
}

export function reponse(c: Carte): { texte: string; langue: 'fr' | 'nl' } {
  return c.sens === 'fr-nl' ? { texte: nlComplet(c.mot), langue: 'nl' } : { texte: c.mot.fr, langue: 'fr' }
}

/**
 * Trois mauvaises propositions pour un QCM : de préférence du même chapitre,
 * puis de la même matière, puis d'ailleurs, sans doublon avec la bonne réponse.
 */
export function leurres(c: Carte, tous: Mot[], n = 3, hasard = Math.random): string[] {
  const texte = (m: Mot) => (c.sens === 'fr-nl' ? nlComplet(m) : m.fr)
  const bonne = simplifier(texte(c.mot))
  // en néerlandais, un leurre avec article à côté d'une réponse sans article la trahirait
  const memeForme = (m: Mot) => c.sens === 'nl-fr' || (m.det === '') === (c.mot.det === '')
  const memeChapitre = (m: Mot) => m.matiere === c.mot.matiere && m.chapitre === c.mot.chapitre
  const memeMatiere = (m: Mot) => m.matiere === c.mot.matiere
  const groupes = [
    tous.filter(m => memeChapitre(m) && memeForme(m)),
    tous.filter(m => memeMatiere(m) && memeForme(m)),
    tous.filter(memeForme),
    tous.filter(memeMatiere),
    tous,
  ]
  const res: string[] = []
  const vus = new Set([bonne])
  for (const g of groupes) {
    for (const m of melanger(g, hasard)) {
      if (res.length >= n) return res
      const t = texte(m), s = simplifier(t)
      if (vus.has(s) || m.nl === c.mot.nl) continue
      vus.add(s)
      res.push(t)
    }
  }
  return res
}
