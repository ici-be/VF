// Les leçons animées (faites avec le skill papermorph, dans public/lecons/<dossier>/chNN/) :
// quel chapitre de quelle matière a la sienne, et où l'ouvrir. Le registre est src/data/lecons.json.
import registre from '../data/lecons.json'

export interface Lecon {
  chapitre: string
  /** les pages du cours qu'elle couvre (« 46–57 ») */
  pages: string
  url: string
}

type Registre = Record<string, { dossier: string; chapitres: Record<string, { lecon: string; pages: string }> }>

/** Les leçons d'une matière (nom de son onglet), dans l'ordre du registre. */
export function leconsDe(matiere: string, base = import.meta.env.BASE_URL): Lecon[] {
  const m = (registre as Registre)[matiere]
  if (!m) return []
  return Object.entries(m.chapitres).map(([chapitre, l]) => ({ chapitre, pages: l.pages, url: `${base}lecons/${m.dossier}/${l.lecon}/` }))
}
