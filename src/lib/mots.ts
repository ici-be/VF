// Le tableau Google → une liste de mots. Les colonnes sont reconnues par leur
// nom (peu importe leur ordre), chaque onglet est une matière. Un onglet avec les
// colonnes « Question » et « Réponse » (« Vragen ») contient les questions de cours.
import { lireXlsx, type Onglet } from './xlsx'
import { lire, ecrire } from './stockage'
import { avecConjugaison } from './conjugaison'

export const SHEET_ID = '11jHRMPgM1A3N8eBCXocn-eqs52uqaJCVtbFNq2U0K8Y'
export const SANS_CHAPITRE = 'Sans chapitre'

export interface Mot {
  id: string           // matière + mot néerlandais : sert à suivre la progression
  matiere: string
  chapitre: string
  nl: string
  det: string          // de | het | ''
  fr: string
  definition: string
  exemple: string      // la partie à trouver est entre [crochets]
  remarque: string
  /** date d'ajout par /cours (AAAA-MM-JJ), absente si inconnue */
  ajoute?: string
  /** pour le chapitre Conjugaison : l'infinitif du verbe (voir conjugaison.ts) */
  verbe?: string
  /** question de cours : nl = la question, fr = la réponse (en néerlandais aussi) */
  vraag?: Vraag
}

export interface Vraag {
  /** mauvaises réponses proposées dans le choix parmi 4 */
  leurres: string[]
  /** page du cours, '' si inconnue */
  page: string
}

export interface Matiere {
  nom: string
  chapitres: string[]  // dans l'ordre du tableau
  mots: Mot[]
  /** questions de cours (absentes des copies enregistrées avant leur arrivée) */
  questions?: Mot[]
}

export interface Vocabulaire {
  matieres: Matiere[]
  misAJour: number     // date du téléchargement (ms)
}

const COLONNES: Record<keyof Pick<Mot, 'nl' | 'det' | 'fr' | 'definition' | 'exemple' | 'remarque' | 'chapitre' | 'ajoute'>, string[]> = {
  nl: ['néerlandais', 'nederlands', 'nl'],
  det: ['dét.', 'dét', 'det', 'déterminant', 'lidwoord', 'article'],
  fr: ['français', 'frans', 'fr'],
  definition: ['définition', 'definition', 'definitie'],
  exemple: ['exemple', 'voorbeeld', 'phrase'],
  remarque: ['remarque', 'remarques', 'opmerking'],
  chapitre: ['chapitre', 'hoofdstuk'],
  ajoute: ['ajouté', 'ajoute', 'ajouté le', 'toegevoegd'],
}

/** « 2026-10-10 », ou une date que Sheets a convertie en nombre (jours depuis le 30/12/1899) → AAAA-MM-JJ */
export function dateAjout(v: string): string {
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10)
  const n = Number(v)
  return v && Number.isFinite(n) && n > 30000 ? new Date(Date.UTC(1899, 11, 30) + Math.floor(n) * 86_400_000).toISOString().slice(0, 10) : ''
}

const norm = (s: string) => s.trim().toLowerCase()

export function matiereDepuisOnglet(onglet: Onglet): Matiere | null {
  const entete = onglet.lignes.findIndex(l => l.some(c => COLONNES.nl.includes(norm(c))))
  if (entete < 0) return null
  const titres = onglet.lignes[entete].map(norm)
  const col = Object.fromEntries(
    Object.entries(COLONNES).map(([cle, noms]) => [cle, titres.findIndex(t => noms.includes(t))]),
  ) as Record<keyof typeof COLONNES, number>
  if (col.fr < 0) return null

  const mots: Mot[] = []
  const chapitres: string[] = []
  const vus = new Set<string>()
  for (const ligne of onglet.lignes.slice(entete + 1)) {
    const val = (k: keyof typeof COLONNES) => (col[k] >= 0 ? (ligne[col[k]] ?? '').trim() : '')
    const nl = val('nl'), fr = val('fr')
    if (!nl || !fr || COLONNES.nl.includes(norm(nl))) continue   // ligne vide ou en-tête répété
    const chapitre = val('chapitre') || SANS_CHAPITRE
    if (!chapitres.includes(chapitre)) chapitres.push(chapitre)
    // un même mot peut apparaître dans deux chapitres : l'identifiant reste unique
    let id = `${onglet.nom}|${nl}`
    if (vus.has(id)) id += `|${chapitre}`
    vus.add(id)
    const det = norm(val('det'))
    const ajoute = dateAjout(val('ajoute'))
    mots.push({
      id, matiere: onglet.nom, chapitre, nl, fr,
      det: det === 'de' || det === 'het' ? det : '',
      definition: val('definition'), exemple: val('exemple'), remarque: val('remarque'),
      ...(ajoute && { ajoute }),
    })
  }
  // « Sans chapitre » toujours en dernier
  chapitres.sort((a, b) => Number(a === SANS_CHAPITRE) - Number(b === SANS_CHAPITRE))
  return mots.length ? { nom: onglet.nom, chapitres, mots } : null
}

/** Les mots du dernier envoi /cours (la date d'ajout la plus récente), toutes matières confondues. */
export function derniersAjouts(voc: Vocabulaire): { date: string; mots: Mot[] } {
  const tous = voc.matieres.flatMap(m => m.mots)
  const date = tous.reduce((d, m) => (m.ajoute && m.ajoute > d ? m.ajoute : d), '')
  return { date, mots: date ? tous.filter(m => m.ajoute === date) : [] }
}

const COLONNES_QUESTIONS = {
  matiere: ['matière', 'matiere', 'vak'],
  chapitre: COLONNES.chapitre,
  page: ['page', 'pagina', 'blz', 'blz.'],
  question: ['question', 'vraag'],
  reponse: ['réponse', 'reponse', 'antwoord'],
  leurres: ['leurres', 'mauvaises réponses', 'fout'],
  ajoute: COLONNES.ajoute,
}

/** Les questions d'un onglet « Vragen » (null si l'onglet n'en est pas un). */
export function questionsDepuisOnglet(onglet: Onglet): Mot[] | null {
  const entete = onglet.lignes.findIndex(l => l.some(c => COLONNES_QUESTIONS.question.includes(norm(c))))
  if (entete < 0) return null
  const titres = onglet.lignes[entete].map(norm)
  const col = Object.fromEntries(
    Object.entries(COLONNES_QUESTIONS).map(([cle, noms]) => [cle, titres.findIndex(t => noms.includes(t))]),
  ) as Record<keyof typeof COLONNES_QUESTIONS, number>
  if (col.reponse < 0 || col.matiere < 0) return null
  const res: Mot[] = []
  for (const ligne of onglet.lignes.slice(entete + 1)) {
    const val = (k: keyof typeof COLONNES_QUESTIONS) => (col[k] >= 0 ? (ligne[col[k]] ?? '').trim() : '')
    const q = val('question'), r = val('reponse'), matiere = val('matiere')
    if (!q || !r || !matiere) continue
    const ajoute = dateAjout(val('ajoute'))
    res.push({
      id: `${matiere}|?|${q}`, matiere, chapitre: val('chapitre') || SANS_CHAPITRE, nl: q, fr: r,
      det: '', definition: '', exemple: '', remarque: '',
      vraag: { leurres: val('leurres').split('|').map(x => x.trim()).filter(Boolean), page: val('page') },
      ...(ajoute && { ajoute }),
    })
  }
  return res
}

export function vocabulaireDepuisXlsx(octets: Uint8Array): Vocabulaire {
  const onglets = lireXlsx(octets)
  const matieres = onglets.map(matiereDepuisOnglet).filter((m): m is Matiere => m !== null)
  if (!matieres.length) throw new Error('Aucun onglet du tableau n’a de colonnes « Néerlandais » et « Français ».')
  // chaque question rejoint sa matière (colonne « Matière » = nom de l'onglet des mots)
  for (const q of onglets.flatMap(o => questionsDepuisOnglet(o) ?? [])) {
    const m = matieres.find(x => norm(x.nom) === norm(q.matiere))
    if (!m) continue
    q.matiere = m.nom
    q.id = `${m.nom}|?|${q.nl}`
    ;(m.questions ??= []).push(q)
    if (!m.chapitres.includes(q.chapitre)) {
      // un chapitre sans mots, seulement des questions : avant « Sans chapitre »
      const i = m.chapitres.indexOf(SANS_CHAPITRE)
      m.chapitres.splice(i < 0 ? m.chapitres.length : i, 0, q.chapitre)
    }
  }
  return { matieres, misAJour: Date.now() }
}

const CLE = 'vocabulaire'

/** Dernière copie téléchargée (pour démarrer tout de suite, et hors ligne). */
export function vocabulaireEnCache(): Vocabulaire | null {
  const v = lire<Vocabulaire | null>(CLE, null)
  return v && avecConjugaison(v)
}

/** Télécharge le tableau ; en cas d'échec, l'appelant garde la copie en cache. */
export async function telechargerVocabulaire(): Promise<Vocabulaire> {
  const rep = await fetch(
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=xlsx&t=${Date.now()}`,
    { cache: 'no-store' },
  )
  if (!rep.ok) throw new Error(`Le tableau n’a pas pu être lu (erreur ${rep.status}).`)
  const voc = vocabulaireDepuisXlsx(new Uint8Array(await rep.arrayBuffer()))
  ecrire(CLE, voc)
  return avecConjugaison(voc)
}
