// Suivi de chaque mot (système de Leitner) : une bonne réponse fait monter le
// mot d'une boîte, une erreur le renvoie à la première. Plus la boîte est
// haute, plus le mot est su et plus on attend avant de le reproposer.
import { lire, ecrire } from './stockage'
import type { Resultat } from './correction'
import type { Mot } from './mots'

export interface Suivi {
  boite: number        // 0 (jamais su) … 5 (bien su)
  vus: number
  justes: number
  dernier: number      // date de la dernière réponse (ms)
  rates: number        // nombre de réponses fausses
  dernierRate?: number // date de la dernière réponse fausse (ms)
}

/** Jours d'attente avant de revoir un mot, selon sa boîte (pour la séance du jour). */
export const INTERVALLES = [0, 1, 2, 4, 8, 16]
const JOUR = 86_400_000

let cache: Record<string, Suivi> | null = null
const tout = () => (cache ??= lire<Record<string, Suivi>>('progression', {}))

export function suivi(id: string): Suivi | undefined {
  const s = tout()[id]
  // suivis enregistrés avant qu'on compte les échecs : on les estime
  if (s && s.rates === undefined) {
    s.rates = s.vus - s.justes
    if (s.rates > 0) s.dernierRate = s.dernier
  }
  return s
}

export function noter(id: string, resultat: Resultat, maintenant = Date.now()): Suivi {
  const s = { ...(suivi(id) ?? { boite: 0, vus: 0, justes: 0, dernier: 0, rates: 0 }) }
  s.vus++
  if (resultat === 'juste') { s.justes++; s.boite = Math.min(5, s.boite + 1) }
  else if (resultat === 'presque') { s.justes++ }      // ni monté ni descendu
  else { s.boite = 0; s.rates++; s.dernierRate = maintenant }
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

/** Ce qui est su d'un mot : 0 (jamais réussi) … 1 (su : 3 bonnes réponses sans erreur depuis). */
export const maitrise = (id: string) => Math.min(3, suivi(id)?.boite ?? 0) / 3

/** Note sur 20 d'un ensemble de mots (un chapitre, une matière) : la part de ce qui est su, au demi-point. */
export function noteSur20(mots: Mot[]): number | null {
  if (!mots.length) return null
  return Math.round((mots.reduce((t, m) => t + maitrise(m.id), 0) / mots.length) * 40) / 2
}

export const RECEMMENT = 30 * JOUR
/** Un mot réussi assez de fois depuis son dernier échec (boîte 3) n'est plus « à revoir ». */
const SU = 3

export interface ARevoir {
  mot: Mot
  suivi: Suivi
}

/**
 * Les mots ratés récemment et pas encore rattrapés : d'abord les plus fragiles
 * (boîte basse), puis les plus souvent ratés, puis les plus récemment ratés.
 */
export function motsARevoir(mots: Mot[], max = 30, maintenant = Date.now()): ARevoir[] {
  return mots
    .map(mot => ({ mot, suivi: suivi(mot.id) }))
    .filter((x): x is ARevoir => !!x.suivi?.dernierRate && maintenant - x.suivi.dernierRate < RECEMMENT && x.suivi.boite < SU)
    .sort((a, b) => a.suivi.boite - b.suivi.boite || b.suivi.rates - a.suivi.rates || b.suivi.dernierRate! - a.suivi.dernierRate!)
    .slice(0, max)
}

/** Pour les tests : oublier la copie en mémoire. */
export function _reinitialiser(): void {
  cache = null
}
