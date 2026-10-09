// Le tableau Google → une liste de mots. Les colonnes sont reconnues par leur
// nom (peu importe leur ordre), chaque onglet est une matière.
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
  /** pour le chapitre Conjugaison : l'infinitif du verbe (voir conjugaison.ts) */
  verbe?: string
}

export interface Matiere {
  nom: string
  chapitres: string[]  // dans l'ordre du tableau
  mots: Mot[]
}

export interface Vocabulaire {
  matieres: Matiere[]
  misAJour: number     // date du téléchargement (ms)
}

const COLONNES: Record<keyof Pick<Mot, 'nl' | 'det' | 'fr' | 'definition' | 'exemple' | 'remarque' | 'chapitre'>, string[]> = {
  nl: ['néerlandais', 'nederlands', 'nl'],
  det: ['dét.', 'dét', 'det', 'déterminant', 'lidwoord', 'article'],
  fr: ['français', 'frans', 'fr'],
  definition: ['définition', 'definition', 'definitie'],
  exemple: ['exemple', 'voorbeeld', 'phrase'],
  remarque: ['remarque', 'remarques', 'opmerking'],
  chapitre: ['chapitre', 'hoofdstuk'],
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
    mots.push({
      id, matiere: onglet.nom, chapitre, nl, fr,
      det: det === 'de' || det === 'het' ? det : '',
      definition: val('definition'), exemple: val('exemple'), remarque: val('remarque'),
    })
  }
  // « Sans chapitre » toujours en dernier
  chapitres.sort((a, b) => Number(a === SANS_CHAPITRE) - Number(b === SANS_CHAPITRE))
  return mots.length ? { nom: onglet.nom, chapitres, mots } : null
}

export function vocabulaireDepuisXlsx(octets: Uint8Array): Vocabulaire {
  const matieres = lireXlsx(octets).map(matiereDepuisOnglet).filter((m): m is Matiere => m !== null)
  if (!matieres.length) throw new Error('Aucun onglet du tableau n’a de colonnes « Néerlandais » et « Français ».')
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
