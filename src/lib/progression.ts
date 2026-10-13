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
  compterDansLeJournal(maintenant)
  return s
}

// ---------- le journal : combien de réponses chaque jour (régularité, séries de jours, récompenses) ----------

/** Une journée compte comme « jour de révision » à partir de ce nombre de réponses. */
export const REPONSES_PAR_JOUR = 10
const jour = (ms: number) => { const d = new Date(ms); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
let cacheJournal: Record<string, number> | null = null
/** Les réponses données, jour par jour (AAAA-MM-JJ, heure locale). */
export const journal = () => (cacheJournal ??= lire<Record<string, number>>('journal', {}))
function compterDansLeJournal(maintenant: number) {
  const j = jour(maintenant)
  journal()[j] = (journal()[j] ?? 0) + 1
  ecrire('journal', journal())
}
const actif = (j: string) => (journal()[j] ?? 0) >= REPONSES_PAR_JOUR
const veille = (ms: number) => ms - 86_400_000

/** La série en cours : jours de révision d'affilée jusqu'à aujourd'hui (ou hier, si aujourd'hui n'est pas encore fait). */
export function serieDeJours(maintenant = Date.now()): number {
  let t = actif(jour(maintenant)) ? maintenant : veille(maintenant), n = 0
  while (actif(jour(t))) { n++; t = veille(t) }
  return n
}

/** La plus longue série jamais faite (elle débloque les récompenses, qui restent acquises). */
export function recordDeJours(): number {
  const jours = Object.keys(journal()).filter(actif).sort()
  let record = 0, n = 0, avant = ''
  for (const j of jours) {
    n = avant && jour(veille(new Date(j + 'T12:00').getTime())) === avant ? n + 1 : 1
    record = Math.max(record, n)
    avant = j
  }
  return record
}

/** Les récompenses : une surprise de mascotte de plus à chaque palier de jours de révision d'affilée. */
export const RECOMPENSES = [
  { jours: 3, surprise: 'confettis', nom: 'Les confettis', texte: 'La mascotte lance des confettis à pleines mains.' },
  { jours: 7, surprise: 'feu-artifice', nom: 'Le feu d’artifice', texte: 'Le flambeau tire une fusée qui éclate en étoiles.' },
  { jours: 14, surprise: 'couronne', nom: 'La couronne', texte: 'Une couronne dorée descend sur sa tête, toute fière.' },
  { jours: 30, surprise: 'arc-trefles', nom: 'L’arc-en-ciel de trèfles', texte: 'Un grand saut sous une arche de trèfles et d’étoiles.' },
] as const
/** La surprise est-elle débloquée ? (celles qui ne sont pas des récompenses le sont toujours) */
export const debloquee = (surprise: string) => {
  const r = RECOMPENSES.find(x => x.surprise === surprise)
  return !r || recordDeJours() >= r.jours
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

/**
 * Les erreurs des interros en classe (colonne « Raté » du tableau) comptent comme des
 * réponses fausses, le jour de l'interro, une seule fois par appareil. Si l'élève a déjà
 * retravaillé le mot depuis l'interro, ce qu'il a fait après garde la main (sa boîte reste).
 * Renvoie le nombre d'erreurs nouvellement prises en compte.
 */
export function appliquerRates(mots: Mot[]): number {
  const faits = new Set(lire<string[]>('rates-interro', []))
  let n = 0
  for (const m of mots) {
    if (!m.rate) continue
    const cle = `${m.id}|${m.rate.date}`
    if (faits.has(cle)) continue
    faits.add(cle)
    const date = new Date(m.rate.date + 'T12:00').getTime()
    const avant = suivi(m.id)
    const s = { ...(avant ?? { boite: 0, vus: 0, justes: 0, dernier: 0, rates: 0 }) }
    s.vus++
    s.rates++
    s.dernierRate = Math.max(s.dernierRate ?? 0, date)
    if (s.dernier < date) { s.boite = 0; s.dernier = date }
    tout()[m.id] = s
    n++
  }
  if (n) {
    ecrire('progression', tout())
    ecrire('rates-interro', [...faits])
  }
  return n
}

/** Pour les tests : oublier la copie en mémoire. */
export function _reinitialiser(): void {
  cache = null
  cacheJournal = null
}

/** Pour le transfert entre appareils : tout ce qui fait la progression, et sa fusion avec celle d'un autre appareil. */
export interface Sauvegarde { progression: Record<string, Suivi>; journal: Record<string, number>; ratesInterro: string[] }
export const sauvegarde = (): Sauvegarde => ({ progression: tout(), journal: journal(), ratesInterro: lire<string[]>('rates-interro', []) })
/**
 * Fusionne la progression d'un autre appareil : pour chaque mot, le suivi le plus récent l'emporte ;
 * le journal garde, pour chaque jour, le plus grand nombre de réponses. Renvoie le nombre de mots repris.
 */
export function fusionner(s: Sauvegarde): number {
  let n = 0
  for (const [id, autre] of Object.entries(s.progression ?? {})) {
    const ici = suivi(id)
    if (!ici || autre.dernier > ici.dernier) { tout()[id] = autre; n++ }
  }
  for (const [j, k] of Object.entries(s.journal ?? {})) journal()[j] = Math.max(journal()[j] ?? 0, k)
  ecrire('progression', tout())
  ecrire('journal', journal())
  ecrire('rates-interro', [...new Set([...lire<string[]>('rates-interro', []), ...(s.ratesInterro ?? [])])])
  return n
}
