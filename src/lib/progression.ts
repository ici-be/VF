// Suivi de chaque mot (système de Leitner) : une bonne réponse fait monter le
// mot d'une boîte, une erreur le renvoie à la première. Plus la boîte est
// haute, plus le mot est su et plus on attend avant de le reproposer.
import { lire, ecrire } from './stockage'
import type { Resultat } from './correction'

export interface Suivi {
  boite: number        // 0 (jamais su) … 5 (bien su)
  vus: number
  justes: number
  dernier: number      // date de la dernière réponse (ms)
}

/** Jours d'attente avant de revoir un mot, selon sa boîte (pour la séance du jour). */
export const INTERVALLES = [0, 1, 2, 4, 8, 16]
const JOUR = 86_400_000

let cache: Record<string, Suivi> | null = null
const tout = () => (cache ??= lire<Record<string, Suivi>>('progression', {}))

export function suivi(id: string): Suivi | undefined {
  return tout()[id]
}

export function noter(id: string, resultat: Resultat, maintenant = Date.now()): Suivi {
  const s = { ...(tout()[id] ?? { boite: 0, vus: 0, justes: 0, dernier: 0 }) }
  s.vus++
  if (resultat === 'juste') { s.justes++; s.boite = Math.min(5, s.boite + 1) }
  else if (resultat === 'presque') { s.justes++ }      // ni monté ni descendu
  else s.boite = 0
  s.dernier = maintenant
  tout()[id] = s
  ecrire('progression', tout())
  return s
}

/** Plus c'est petit, plus le mot a besoin d'être revu (jamais vu = au milieu). */
export function fragilite(id: string, maintenant = Date.now()): number {
  const s = suivi(id)
  if (!s) return 1.5
  const enRetard = maintenant - s.dernier > INTERVALLES[s.boite] * JOUR
  return s.boite + (enRetard ? 0 : 3)
}

/** Pour les tests : oublier la copie en mémoire. */
export function _reinitialiser(): void {
  cache = null
}
