// Ce qu'on a choisi la dernière fois : proposé tel quel au lancement suivant.
import { lire, ecrire } from './stockage'
import type { Mot, Vocabulaire } from './mots'
import { aDesTrous } from './trous'
import { lettresDe } from './grille'
import { estPrimitif, type Temps } from './conjugaison'

export type Sens = 'fr-nl' | 'nl-fr' | 'mix'
export type Ordre = 'hasard' | 'fragiles' | 'tableau'
export type ExerciceId = 'defilement' | 'oral' | 'ecrit' | 'qcm' | 'dictee' | 'dehet' | 'definitions' | 'trous' | 'conjugaison' | 'primitifs' | 'interrogatif' | 'motscroises'
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
  /** mots utilisables par cet exercice */
  accepte: (m: Mot) => boolean
}

export const EXERCICES: Exercice[] = [
  { id: 'defilement', nom: 'Défilement', description: 'Le mot, puis la réponse après quelques secondes. Je réponds dans ma tête.', avecSens: true, avecVitesse: true, accepte: () => true },
  { id: 'oral', nom: 'Oral', description: 'Le mot est lu, je réponds à voix haute au micro. Le micro comprend encore mal certains mots.', avecSens: true, avecVitesse: false, beta: true, accepte: () => true },
  { id: 'qcm', nom: 'QCM', description: 'Choisir la bonne traduction parmi quatre.', avecSens: true, avecVitesse: false, accepte: () => true },
  { id: 'ecrit', nom: 'Écrit', description: 'Taper la traduction au clavier.', avecSens: true, avecVitesse: false, accepte: () => true },
  { id: 'dictee', nom: 'Dictée', description: 'J’entends le mot néerlandais, je l’écris sans faute.', avecSens: false, avecVitesse: false, accepte: () => true },
  { id: 'definitions', nom: 'Définitions', description: 'Lire la définition, trouver le mot néerlandais.', avecSens: false, avecVitesse: false, avecRepondre: true, accepte: m => m.definition !== '' },
  { id: 'trous', nom: 'Textes à trous', description: 'Compléter la phrase avec le bon mot.', avecSens: false, avecVitesse: false, accepte: aDesTrous },
  { id: 'conjugaison', nom: 'Conjugaison', description: 'Le verbe à conjuguer à toutes les personnes (ik, jij, hij…), puis valider.', avecSens: false, avecVitesse: false, avecTemps: true, accepte: m => !!m.verbe },
  { id: 'primitifs', nom: 'Temps primitifs', description: 'komen → kwam, kwamen, is gekomen (les 30 verbes les plus courants).', avecSens: false, avecVitesse: false, accepte: m => estPrimitif(m.verbe) },
  { id: 'interrogatif', nom: 'Forme interrogative', description: '« Jij slaapt. » → « Slaap jij? » : mettre la phrase en question.', avecSens: false, avecVitesse: false, avecTemps: true, accepte: m => !!m.verbe },
  { id: 'motscroises', nom: 'Mots croisés', description: 'Jeu : remplir la grille avec les mots néerlandais, la traduction en indice.', avecSens: false, avecVitesse: false, jeu: true, accepte: m => lettresDe(m.nl) !== null },
  { id: 'dehet', nom: 'de ou het ?', description: 'Trouver l’article des noms.', avecSens: false, avecVitesse: false, accepte: m => m.det !== '' },
]

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
}

export const SEP = '␟'
export const cleChapitre = (matiere: string, chapitre: string) => matiere + SEP + chapitre

const DEFAUT: Reglages = {
  matieres: [], chapitres: [], exercice: 'qcm', sens: 'nl-fr', nombre: 20,
  delai: 4, voix: true, exigerArticle: false, ordre: 'fragiles', repondre: 'choix', temps: 'present',
}

/** Réglages enregistrés, nettoyés de ce qui n'existe plus dans le tableau. */
export function chargerReglages(voc: Vocabulaire | null): Reglages {
  const r: Reglages = { ...DEFAUT, ...lire<Partial<Reglages>>('reglages', {}) }
  if (!EXERCICES.some(e => e.id === r.exercice)) r.exercice = DEFAUT.exercice
  if (voc) {
    const noms = voc.matieres.map(m => m.nom)
    r.matieres = r.matieres.filter(n => noms.includes(n))
    if (!r.matieres.length) r.matieres = noms.slice(0, 1)
    const existants = new Set(voc.matieres.flatMap(m => m.chapitres.map(c => cleChapitre(m.nom, c))))
    // les chapitres des autres matières restent mémorisés, pour quand on y revient
    r.chapitres = r.chapitres.filter(c => existants.has(c))
  }
  return r
}

export function enregistrerReglages(r: Reglages): void {
  ecrire('reglages', r)
}

/** Les mots des matières et chapitres choisis (tous les chapitres d'une matière si aucun n'est coché pour elle). */
export function motsChoisis(voc: Vocabulaire, r: Reglages): Mot[] {
  return voc.matieres
    .filter(m => r.matieres.includes(m.nom))
    .flatMap(m => {
      const coches = r.chapitres.filter(c => c.startsWith(m.nom + SEP))
      return coches.length ? m.mots.filter(x => coches.includes(cleChapitre(m.nom, x.chapitre))) : m.mots
    })
}
