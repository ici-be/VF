// Ce qu'on a choisi la dernière fois : proposé tel quel au lancement suivant.
import { lire, ecrire } from './stockage'
import type { Mot, Vocabulaire } from './mots'
import { aDesTrous } from './trous'
import { lettresDe } from './grille'
import { langueDe } from './apparence'
import { estPrimitif, type Temps } from './conjugaison'

export type Sens = 'fr-nl' | 'nl-fr' | 'mix'
export type Ordre = 'hasard' | 'fragiles' | 'tableau'
export type ExerciceId = 'defilement' | 'oral' | 'ecrit' | 'qcm' | 'dictee' | 'dehet' | 'definitions' | 'trous' | 'conjugaison' | 'primitifs' | 'interrogatif' | 'motscroises' | 'questions' | 'getallen' | 'eeuwen' | 'calcul' | 'natures'
export type Repondre = 'choix' | 'ecrit'

export interface Exercice {
  id: ExerciceId
  nom: string
  description: string
  /** le sens FR→NL / NL→FR a-t-il un effet ? */
  avecSens: boolean
  /** l'exercice avance-t-il tout seul (réglage de vitesse) ? */
  avecVitesse: boolean
  /** répondre en choisissant parmi 4 ou en écrivant ? */
  avecRepondre?: boolean
  /** le réglage du temps (présent, imparfait…) a-t-il un effet ? */
  avecTemps?: boolean
  /** un jeu (écran à part) plutôt qu'une série de questions */
  jeu?: boolean
  /** encore en rodage : affiché « bêta » */
  beta?: boolean
  /** seulement pour Nederlands (chapitres Conjugaison et Getallen) : caché si Nederlands n'est pas choisi */
  nederlands?: boolean
  /** un exercice fabriqué par l'appli pour une matière (Eeuwen, calcul mental, natures) : affiché si elle est choisie */
  pourMatiere?: RegExp
  /** ce qu'on compte sous « Commencer » (« 6 calculs ») : sinon « mot », ou « question » pour les questions de cours */
  unite?: string
  /** porte sur les questions de cours (onglet « Vragen ») plutôt que sur les mots */
  surQuestions?: boolean
  /** convient aussi aux matières en français (Français, Religion) : sinon, seulement au néerlandais */
  enFrancais?: boolean
  /** mots utilisables par cet exercice */
  accepte: (m: Mot) => boolean
}

export const EXERCICES: Exercice[] = [
  { id: 'defilement', nom: 'Défilement', description: 'Le mot, puis la réponse après quelques secondes. Je réponds dans ma tête.', avecSens: true, avecVitesse: true, enFrancais: true, accepte: () => true },
  { id: 'qcm', nom: 'QCM', description: 'Choisir la bonne traduction parmi quatre.', avecSens: true, avecVitesse: false, accepte: () => true },
  { id: 'ecrit', nom: 'Écrit', description: 'Taper la traduction au clavier.', avecSens: true, avecVitesse: false, accepte: () => true },
  { id: 'dictee', nom: 'Dictée', description: 'J’entends le mot néerlandais, je l’écris sans faute.', avecSens: false, avecVitesse: false, accepte: () => true },
  { id: 'definitions', nom: 'Définitions', description: 'Lire la définition, trouver le mot.', avecSens: false, avecVitesse: false, avecRepondre: true, enFrancais: true, accepte: m => m.definition !== '' },
  { id: 'trous', nom: 'Textes à trous', description: 'Compléter la phrase avec le bon mot.', avecSens: false, avecVitesse: false, enFrancais: true, accepte: aDesTrous },
  { id: 'questions', nom: 'Questions de cours', description: 'Une question du cours : choisir la bonne réponse, ou y répondre dans sa tête puis vérifier.', avecSens: false, avecVitesse: false, avecRepondre: true, surQuestions: true, enFrancais: true, accepte: m => !!m.vraag },
  { id: 'motscroises', nom: 'Mots croisés', description: 'Jeu : remplir la grille avec les mots, la traduction (ou la définition) en indice.', avecSens: false, avecVitesse: false, jeu: true, enFrancais: true, accepte: m => lettresDe(m.nl) !== null },
  { id: 'dehet', nom: 'de ou het ?', description: 'Trouver l’article des noms.', avecSens: false, avecVitesse: false, accepte: m => m.det !== '' },
  // à la fin : l'oral, encore en rodage, puis ce qui ne vaut que pour Nederlands (chapitres Conjugaison et Getallen)
  { id: 'oral', nom: 'Oral', description: 'Le mot est lu, je réponds à voix haute au micro.', avecSens: true, avecVitesse: false, beta: true, accepte: () => true },
  { id: 'conjugaison', nom: 'Conjugaison', description: 'Le verbe à conjuguer à toutes les personnes (ik, jij, hij…), puis valider.', avecSens: false, nederlands: true, avecVitesse: false, avecTemps: true, accepte: m => !!m.verbe },
  { id: 'primitifs', nom: 'Temps primitifs', description: 'komen → kwam, kwamen, is gekomen (les 30 verbes les plus courants).', avecSens: false, nederlands: true, avecVitesse: false, accepte: m => estPrimitif(m.verbe) },
  { id: 'interrogatif', nom: 'Forme interrogative', description: '« Jij slaapt. » → « Slaap jij? » : mettre la phrase en question.', avecSens: false, nederlands: true, avecVitesse: false, avecTemps: true, accepte: m => !!m.verbe },
  { id: 'eeuwen', nom: 'Eeuwen', description: 'Een jaartal → de eeuw of het tijdvak, een eeuw → haar jaren (1789 → 18de eeuw, nieuwste tijd).', avecSens: false, avecVitesse: false, enFrancais: true, pourMatiere: /geschiedenis|histoire/i, accepte: m => m.genere === 'eeuwen' },
  { id: 'calcul', nom: 'Calcul mental', description: 'Des calculs toujours nouveaux : priorité des opérations, exposants, parenthèses, distributivité, calcul astucieux, coder et décoder, propriétés, vocabulaire.', avecSens: false, avecVitesse: false, enFrancais: true, unite: 'calcul', pourMatiere: /math/i, accepte: m => m.genere === 'calcul' },
  { id: 'natures', nom: 'Natures des mots', description: 'Dans une phrase, trouver la nature du mot souligné : nom, déterminant, adjectif, verbe, pronom…', avecSens: false, avecVitesse: false, enFrancais: true, pourMatiere: /fran[cç]ais|\bfrans\b/i, accepte: m => m.genere === 'natures' },
  { id: 'getallen', nom: 'Nombres', description: 'Écrire un nombre en lettres (2 345 → tweeduizend driehonderdvijfenveertig), ou l’inverse, jusqu’à deux millions.', avecSens: true, nederlands: true, avecVitesse: false, accepte: m => !!m.getal },
]

// les exercices propres au néerlandais (traduction, de/het, dictée, oral…) ne prennent pas
// les mots et questions des matières en français
for (const e of EXERCICES) {
  const accepte = e.accepte
  // les cartes fabriquées (Eeuwen, calcul, natures) ne vont qu'à leur exercice
  e.accepte = m => (!m.genere || m.genere === e.id) && (e.enFrancais || langueDe(m) === 'nl') && accepte(m)
}

export const exercice = (id: ExerciceId) => EXERCICES.find(e => e.id === id) ?? EXERCICES[0]

export interface Reglages {
  matieres: string[]
  /** `${matière}␟${chapitre}` de toutes les matières, même non choisies (mémoire) ; aucun pour une matière = tous ses chapitres */
  chapitres: string[]
  exercice: ExerciceId
  sens: Sens
  /** nombre de mots par série ; 0 = tous */
  nombre: number
  /** secondes de réflexion avant la réponse (défilement) */
  delai: number
  voix: boolean
  exigerArticle: boolean
  ordre: Ordre
  /** définitions : choisir parmi 4 ou écrire le mot */
  repondre: Repondre
  /** conjugaison : le temps, ou « mix » pour les mélanger */
  temps: Temps | 'mix'
  /** afficher les notes sur 20 (matières, chapitres, fin de série) */
  notes: boolean
  /** pages du cours retenues dans un chapitre (`${matière}␟${chapitre}` → [de, à]) ; absent = tout le chapitre */
  pages: Record<string, [number, number]>
}

export const SEP = '␟'
export const cleChapitre = (matiere: string, chapitre: string) => matiere + SEP + chapitre

const DEFAUT: Reglages = {
  matieres: [], chapitres: [], exercice: 'qcm', sens: 'nl-fr', nombre: 20,
  delai: 4, voix: true, exigerArticle: false, ordre: 'fragiles', repondre: 'choix', temps: 'present', notes: false, pages: {},
}

// Le permalien : les réglages de l'accueil dans l'adresse (#r=…), en JSON encodé en base64url.
// Seuls les chapitres et les pages des matières choisies y sont ; le reste de la mémoire de
// la personne qui l'ouvre (chapitres d'autres matières) est gardé.
const LIEN = 'r'

const versBase64 = (texte: string) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(texte))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const depuisBase64 = (b64: string) =>
  new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)))

/** L'adresse de l'appli avec ces réglages. */
export function lienReglages(r: Reglages, base = location.origin + location.pathname): string {
  const dans = (c: string) => r.matieres.some(m => c.startsWith(m + SEP))
  const partage: Reglages = {
    ...r,
    chapitres: r.chapitres.filter(dans),
    pages: Object.fromEntries(Object.entries(r.pages).filter(([c]) => dans(c))),
  }
  return `${base}#${LIEN}=${versBase64(JSON.stringify(partage))}`
}

/** Les réglages d'un permalien (« #r=… »), seulement les champs connus et du bon type ; null sinon. */
export function reglagesDuLien(hash: string): Partial<Reglages> | null {
  const b64 = new URLSearchParams(hash.replace(/^#/, '')).get(LIEN)
  if (!b64) return null
  try {
    const brut = JSON.parse(depuisBase64(b64)) as Record<string, unknown>
    const ok = Object.entries(brut).filter(([k, v]) =>
      k in DEFAUT && (Array.isArray(DEFAUT[k as keyof Reglages]) ? Array.isArray(v) : typeof v === typeof DEFAUT[k as keyof Reglages] && v !== null))
    return ok.length ? Object.fromEntries(ok) as Partial<Reglages> : null
  } catch {
    return null
  }
}

/** Les réglages enregistrés, avec par-dessus ceux du lien : ses matières y gardent seulement ses chapitres et ses pages. */
export function appliquerLien(r: Reglages, lien: Partial<Reglages>): Reglages {
  const matieres = lien.matieres ?? r.matieres
  const ailleurs = (c: string) => !matieres.some(m => c.startsWith(m + SEP))
  return {
    ...r, ...lien,
    chapitres: [...r.chapitres.filter(ailleurs), ...(lien.chapitres ?? [])],
    pages: { ...Object.fromEntries(Object.entries(r.pages).filter(([c]) => ailleurs(c))), ...lien.pages },
  }
}

/** Réglages enregistrés, nettoyés de ce qui n'existe plus dans le tableau. */
export function chargerReglages(voc: Vocabulaire | null): Reglages {
  let r: Reglages = { ...DEFAUT, ...lire<Partial<Reglages>>('reglages', {}) }
  // ouvert depuis un permalien : ses réglages sont retenus, puis l'adresse est nettoyée
  const lien = typeof location !== 'undefined' ? reglagesDuLien(location.hash) : null
  if (lien) {
    r = appliquerLien(r, lien)
    enregistrerReglages(r)
    history.replaceState(null, '', location.pathname + location.search)
  }
  if (!EXERCICES.some(e => e.id === r.exercice)) r.exercice = DEFAUT.exercice
  if (voc) {
    const noms = voc.matieres.map(m => m.nom)
    r.matieres = r.matieres.filter(n => noms.includes(n))
    if (!r.matieres.length) r.matieres = noms.slice(0, 1)
    const existants = new Set(voc.matieres.flatMap(m => m.chapitres.map(c => cleChapitre(m.nom, c))))
    // les chapitres des autres matières restent mémorisés, pour quand on y revient
    r.chapitres = r.chapitres.filter(c => existants.has(c))
    r.pages = Object.fromEntries(Object.entries(r.pages).filter(([c]) => existants.has(c)))
  }
  return r
}

export function enregistrerReglages(r: Reglages): void {
  ecrire('reglages', r)
}

/** Le chapitre choisi quand il n'y en a qu'un (une seule matière, un seul chapitre coché ou existant). */
export function chapitreSeul(voc: Vocabulaire, r: Reglages): { matiere: string; chapitre: string; cle: string } | null {
  if (r.matieres.length !== 1) return null
  const m = voc.matieres.find(x => x.nom === r.matieres[0])
  if (!m) return null
  const coches = r.chapitres.filter(c => c.startsWith(m.nom + SEP))
  const chapitre = coches.length === 1 ? coches[0].slice(m.nom.length + SEP.length) : !coches.length && m.chapitres.length === 1 ? m.chapitres[0] : null
  return chapitre === null ? null : { matiere: m.nom, chapitre, cle: cleChapitre(m.nom, chapitre) }
}

/** Première et dernière page connues d'un chapitre (mots et questions) ; null si aucune page. */
export function bornesPages(voc: Vocabulaire, matiere: string, chapitre: string): [number, number] | null {
  const m = voc.matieres.find(x => x.nom === matiere)
  const pages = [...(m?.mots ?? []), ...(m?.questions ?? [])].filter(x => x.chapitre === chapitre && x.page !== undefined).map(x => x.page!)
  return pages.length ? [Math.min(...pages), Math.max(...pages)] : null
}

/** Les pages retenues, quand un seul chapitre est choisi et qu'on en a limité les pages. */
export function pagesChoisies(voc: Vocabulaire, r: Reglages): { cle: string; de: number; a: number } | null {
  const seul = chapitreSeul(voc, r)
  const p = seul && r.pages[seul.cle]
  return p ? { cle: seul.cle, de: Math.min(...p), a: Math.max(...p) } : null
}

/**
 * Les mots des matières et chapitres choisis (tous les chapitres d'une matière si aucun n'est coché pour elle).
 * Un seul chapitre choisi et ses pages limitées : seulement ces pages (les mots sans page en sortent).
 */
export function motsChoisis(voc: Vocabulaire, r: Reglages, questions = false): Mot[] {
  const mots = voc.matieres
    .filter(m => r.matieres.includes(m.nom))
    .flatMap(m => {
      const tous = questions ? m.questions ?? [] : m.mots
      const coches = r.chapitres.filter(c => c.startsWith(m.nom + SEP))
      return coches.length ? tous.filter(x => coches.includes(cleChapitre(m.nom, x.chapitre))) : tous
    })
  const p = pagesChoisies(voc, r)
  // les cartes des exercices fabriqués n'ont rien à faire dans la liste ni dans les autres exercices
  const vrais = mots.filter(x => !x.genere)
  return p ? vrais.filter(x => x.page !== undefined && x.page >= p.de && x.page <= p.a) : vrais
}

/** Les questions de cours des matières et chapitres choisis. */
export const questionsChoisies = (voc: Vocabulaire, r: Reglages) => motsChoisis(voc, r, true)

/** Ce que l'exercice peut réviser avec ce choix de matières et de chapitres : des mots ou des questions. */
export const aReviser = (voc: Vocabulaire, r: Reglages, ex = exercice(r.exercice)) =>
  ex.nederlands || ex.pourMatiere
    // les verbes de Conjugaison, les nombres de Getallen, les exercices fabriqués : même si d'autres chapitres sont cochés
    ? voc.matieres.filter(m => r.matieres.includes(m.nom)).flatMap(m => m.mots).filter(ex.accepte)
    : motsChoisis(voc, r, !!ex.surQuestions).filter(ex.accepte)
