// Le tableau Google → une liste de mots. Les colonnes sont reconnues par leur
// nom (peu importe leur ordre), chaque onglet est une matière. Un onglet avec les
// colonnes « Question » et « Réponse » (« Vragen ») contient les questions de cours.
import { lireXlsx, type Onglet } from './xlsx'
import { lire, ecrire } from './stockage'
import { avecConjugaison } from './conjugaison'
import { avecGetallen } from './getallen'
import { langueMatiere } from './apparence'

export const SHEET_ID = '11jHRMPgM1A3N8eBCXocn-eqs52uqaJCVtbFNq2U0K8Y'
export const SANS_CHAPITRE = 'Sans chapitre'

export interface Mot {
  id: string           // matière + mot néerlandais : sert à suivre la progression
  matiere: string
  chapitre: string
  /** le mot dans la langue du cours : néerlandais, ou français pour une matière en français (voir langueMatiere) */
  nl: string
  det: string          // de | het | ''
  /** la traduction française ; pour une matière en français, la définition du mot */
  fr: string
  definition: string
  exemple: string      // la partie à trouver est entre [crochets]
  remarque: string
  /** date d'ajout par /cours (AAAA-MM-JJ), absente si inconnue */
  ajoute?: string
  /** page du cours (colonne « Page »), absente si inconnue */
  page?: number
  /** pour le chapitre Conjugaison : l'infinitif du verbe (voir conjugaison.ts) */
  verbe?: string
  /** pour le chapitre Getallen : la valeur du mot (twintig → 20, voir getallen.ts) */
  getal?: number
  /** question de cours : nl = la question, fr = la réponse (en néerlandais aussi) */
  vraag?: Vraag
  /** raté à une interro en classe (colonnes « Interro » et « Raté ») : l'appli le met « à revoir » */
  rate?: RateInterro
}

export interface RateInterro {
  /** « Toets 5 – 05/10/2026 » */
  interro: string
  /** ce que l'élève avait écrit, '' si rien */
  reponse: string
  /** date de l'interro (AAAA-MM-JJ), tirée du nom de l'interro */
  date: string
}

/** « Toets 5 – 05/10/2026 » → 2026-10-05 ; sans date → '' */
export function dateInterro(interro: string): string {
  const d = interro.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  return d ? `${d[3]}-${d[2].padStart(2, '0')}-${d[1].padStart(2, '0')}` : ''
}

const RATE = ['raté', 'rate', 'ratée', 'fout op toets']
/** Une erreur d'interro, si la case « Raté » est remplie et que l'interro a une date. « — » = rien écrit. */
function lireRate(interro: string, rate: string): { rate?: RateInterro } {
  const date = dateInterro(interro)
  return rate && date ? { rate: { interro, reponse: /^[-—–?]+$/.test(rate) ? '' : rate, date } } : {}
}

export interface Vraag {
  /** mauvaises réponses proposées dans le choix parmi 4 */
  leurres: string[]
  /** page du cours, '' si inconnue */
  page: string
  /** question à énumération (« Noem drie … ») : les éléments acceptés, chacun avec ses variantes « a / b » */
  elements: string[]
  /** combien d'éléments donner (≤ elements.length) ; 0 si ce n'est pas une énumération */
  nombre: number
  /** l'interro d'où vient la question (« Toets 5 – 05/10/2026 »), '' sinon */
  interro?: string
}

/** Le trou d'une phrase à compléter : « Een periode van 1000 jaar noemen we een ___. » */
export const TROU = /_{3,}/
export const aTrou = (m: Mot) => !!m.vraag && TROU.test(m.nl)

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
/** une matière en français : le mot dans « Mot », sa définition sert de traduction */
const MOT_FR = ['mot', 'terme', 'notion', 'mot-clé']
const PAGE = ['page', 'pagina', 'blz', 'blz.']
const INTERRO = ['interro', 'toets']
/** « 12 » → 12 ; vide ou illisible → rien */
const lirePage = (v: string) => { const n = parseInt(v, 10); return Number.isFinite(n) ? { page: n } : {} }

export function matiereDepuisOnglet(onglet: Onglet): Matiere | null {
  const francais = langueMatiere(onglet.nom) === 'fr'
  const nomsNl = francais ? [...MOT_FR, ...COLONNES.nl] : COLONNES.nl
  const entete = onglet.lignes.findIndex(l => l.some(c => nomsNl.includes(norm(c))))
  if (entete < 0) return null
  const titres = onglet.lignes[entete].map(norm)
  const col = Object.fromEntries(
    Object.entries({ ...COLONNES, nl: nomsNl }).map(([cle, noms]) => [cle, titres.findIndex(t => noms.includes(t))]),
  ) as Record<keyof typeof COLONNES, number>
  // en français, pas de traduction : la définition en tient lieu
  if (francais && col.fr < 0) col.fr = col.definition
  if (col.fr < 0) return null
  const colPage = titres.findIndex(t => PAGE.includes(t))
  const colInterro = titres.findIndex(t => INTERRO.includes(t)), colRate = titres.findIndex(t => RATE.includes(t))

  const mots: Mot[] = []
  const chapitres: string[] = []
  const vus = new Set<string>()
  for (const ligne of onglet.lignes.slice(entete + 1)) {
    const val = (k: keyof typeof COLONNES) => (col[k] >= 0 ? (ligne[col[k]] ?? '').trim() : '')
    const nl = val('nl'), fr = val('fr')
    if (!nl || !fr || norm(nl) === titres[col.nl]) continue   // ligne vide ou en-tête répété (« terme » reste un mot)
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
      ...(colPage >= 0 && lirePage(ligne[colPage] ?? '')),
      ...(colRate >= 0 && lireRate((ligne[colInterro] ?? '').trim(), (ligne[colRate] ?? '').trim())),
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
  page: PAGE,
  question: ['question', 'vraag'],
  reponse: ['réponse', 'reponse', 'antwoord'],
  leurres: ['leurres', 'mauvaises réponses', 'fout'],
  elements: ['éléments', 'elements', 'elementen'],
  nombre: ['nombre', 'aantal'],
  interro: INTERRO,
  rate: RATE,
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
    const elements = val('elements').split('|').map(x => x.trim()).filter(Boolean)
    // une énumération sans réponse rédigée : la liste des éléments en tient lieu
    const q = val('question'), r = val('reponse') || elements.join(', '), matiere = val('matiere')
    if (!q || !r || !matiere) continue
    const n = parseInt(val('nombre'), 10)
    const nombre = elements.length >= 2 ? Math.min(elements.length, n > 0 ? n : elements.length) : 0
    const ajoute = dateAjout(val('ajoute'))
    res.push({
      id: `${matiere}|?|${q}`, matiere, chapitre: val('chapitre') || SANS_CHAPITRE, nl: q, fr: r,
      det: '', definition: '', exemple: '', remarque: '',
      vraag: {
        leurres: val('leurres').split('|').map(x => x.trim()).filter(Boolean), page: val('page'), elements: nombre ? elements : [], nombre,
        ...(val('interro') && { interro: val('interro') }),
      },
      ...(ajoute && { ajoute }),
      ...lirePage(val('page')),
      ...lireRate(val('interro'), val('rate')),
    })
  }
  return res
}

export function vocabulaireDepuisXlsx(octets: Uint8Array): Vocabulaire {
  const onglets = lireXlsx(octets)
  const matieres = onglets.map(matiereDepuisOnglet).filter((m): m is Matiere => m !== null)
  if (!matieres.length) throw new Error('Aucun onglet du tableau n’a de colonnes « Néerlandais » et « Français ».')
  // chaque question rejoint sa matière (colonne « Matière » = nom de l'onglet des mots) ;
  // une matière sans onglet de mots (Religion, au début) n'a que ses questions
  for (const q of onglets.flatMap(o => questionsDepuisOnglet(o) ?? [])) {
    let m = matieres.find(x => norm(x.nom) === norm(q.matiere))
    if (!m) matieres.push(m = { nom: q.matiere, chapitres: [], mots: [] })
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
  return v && avecGetallen(avecConjugaison(v))
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
  return avecGetallen(avecConjugaison(voc))
}

/** Ce que compte une matière (ou un chapitre) : ses mots, ou ses questions si elle n'a pas de mots. */
export const contenu = (m: Matiere): Mot[] => (m.mots.length ? m.mots : m.questions ?? [])
