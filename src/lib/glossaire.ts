// Les mots néerlandais du tableau reconnus dans un texte (une question, une définition) :
import { langueDe } from './apparence'
// au survol, l'appli en montre la traduction. Seulement les vrais mots du vocabulaire (pas les
// formes conjuguées ni les nombres générés), les expressions de plusieurs mots en priorité.
import type { Mot, Vocabulaire } from './mots'

export interface Entree {
  nl: string
  det: string
  fr: string
  matiere: string
}

export type Segment = string | { texte: string; entree: Entree }

type Index = Map<string, Entree[]>

const MOT = /[\p{L}\p{M}\p{N}'’-]+/gu
const cle = (s: string) => s.normalize('NFC').toLowerCase().replace(/’/g, "'")
/** les terminaisons d'un pluriel ou d'un adjectif : « eeuwen », « periodes », « klassieke », « dynastieën » */
const FINS = ['ën', 'en', "'s", 's', 'e', 'n']
const LONGUEUR_MIN = 4
const MOTS_MAX = 5

/** « (zich) herinneren / onthouden » → « herinneren », « onthouden » */
function formes(nl: string): string[] {
  return nl.replace(/\([^)]*\)/g, ' ').split(/[\/;]/).map(f => cle(f).replace(/\s+/g, ' ').trim()).filter(f => f.length >= LONGUEUR_MIN)
}

export function indexer(mots: Mot[]): Index {
  const index: Index = new Map()
  for (const m of mots) {
    if (m.verbe || m.getal !== undefined || m.vraag || m.genere || langueDe(m) === 'fr') continue
    const e: Entree = { nl: m.nl, det: m.det, fr: m.fr, matiere: m.matiere }
    for (const f of formes(m.nl)) {
      const l = index.get(f) ?? []
      if (!l.some(x => x.fr === e.fr)) l.push(e)
      index.set(f, l)
    }
  }
  return index
}

/** Le mot tel quel, ou sans sa terminaison de pluriel / d'accord. */
function chercher(index: Index, texte: string): Entree[] | undefined {
  const t = cle(texte)
  const direct = index.get(t)
  if (direct) return direct
  for (const fin of FINS) {
    if (t.endsWith(fin) && t.length - fin.length >= 4) {
      const e = index.get(t.slice(0, -fin.length))
      if (e) return e
    }
  }
  return undefined
}

/**
 * Le texte découpé : les morceaux reconnus portent leur entrée (de la même matière de préférence).
 * `exclure` : les mots à ne pas traduire (le mot à trouver, par exemple).
 */
export function decouper(index: Index, texte: string, matiere?: string, exclure: string[] = []): Segment[] {
  const jetons = [...texte.matchAll(MOT)].map(m => ({ t: m[0], debut: m.index!, fin: m.index! + m[0].length }))
  const exclus = new Set(exclure.flatMap(formes))
  const res: Segment[] = []
  let pos = 0
  for (let i = 0; i < jetons.length; i++) {
    // l'expression la plus longue d'abord (« de klassieke oudheid » avant « oudheid »),
    // ses mots séparés seulement par des espaces
    for (let n = Math.min(MOTS_MAX, jetons.length - i); n >= 1; n--) {
      const morceau = jetons.slice(i, i + n)
      if (morceau.some((j, k) => k > 0 && !/^\s+$/.test(texte.slice(morceau[k - 1].fin, j.debut)))) continue
      const brut = texte.slice(morceau[0].debut, morceau[n - 1].fin)
      const entrees = chercher(index, brut.replace(/\s+/g, ' '))
      if (!entrees || exclus.has(cle(brut)) || entrees.some(e => formes(e.nl).some(f => exclus.has(f)))) continue
      const entree = entrees.find(e => e.matiere === matiere) ?? entrees[0]
      if (morceau[0].debut > pos) res.push(texte.slice(pos, morceau[0].debut))
      res.push({ texte: brut, entree })
      pos = morceau[n - 1].fin
      i += n - 1
      break
    }
  }
  if (pos < texte.length) res.push(texte.slice(pos))
  return res
}

// l'index du vocabulaire en cours (recalculé quand le tableau change)
let courant: { voc: Vocabulaire; index: Index } | null = null

export function glossaire(voc: Vocabulaire): Index {
  if (courant?.voc !== voc) courant = { voc, index: indexer(voc.matieres.flatMap(m => m.mots)) }
  return courant.index
}

/** L'index du dernier vocabulaire chargé (vide avant le chargement). */
export const glossaireCourant = (): Index => courant?.index ?? new Map()
