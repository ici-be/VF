// Le chapitre « Conjugaison » : les 50 verbes de src/data/conjugaisons.json
// (généré par outils/conjugaisons.ts), ajoutés à la matière Nederlands.
import donnees from '../data/conjugaisons.json'
import type { Matiere, Mot, Vocabulaire } from './mots'
import { simplifier } from './correction'
import type { Correction } from './correction'

export type Temps = 'present' | 'ovt' | 'vtt' | 'futur'
export const TEMPS: { id: Temps; nom: string; aide: string }[] = [
  { id: 'present', nom: 'Présent', aide: 'Présent (OTT) : ik slaap, hij slaapt' },
  { id: 'ovt', nom: 'Imparfait', aide: 'Imparfait (OVT) : ik sliep, ik werkte' },
  { id: 'vtt', nom: 'Passé composé', aide: 'Passé composé (VTT) : hebben / zijn + participe — ik heb geslapen' },
  { id: 'futur', nom: 'Futur', aide: 'Futur : zullen + infinitif — ik zal slapen' },
]
export const nomTemps = (t: Temps) => TEMPS.find(x => x.id === t)!.nom

/** les personnes telles qu'on les affiche dans un tableau de conjugaison */
export const PERSONNES = ['ik', 'jij / je', 'u', 'hij / zij / het', 'wij / we', 'jullie', 'zij / ze']
/** le pronom en début de phrase : « Jij slaapt. » */
const SUJETS = ['Ik', 'Jij', 'U', 'Hij', 'Wij', 'Jullie', 'Zij']

export type Verbe = (typeof donnees.verbes)[number]
const PAR_INF = new Map(donnees.verbes.map(v => [v.inf, v]))
export const verbe = (inf: string) => PAR_INF.get(inf)

export const CHAPITRE = 'Conjugaison'
const EST_NEDERLANDS = /^(nederlands|néerlandais|neerlandais)$/i

/** Ajoute le chapitre « Conjugaison » à la matière Nederlands (ou crée la matière). */
export function avecConjugaison(voc: Vocabulaire): Vocabulaire {
  const i = voc.matieres.findIndex(m => EST_NEDERLANDS.test(m.nom.trim()))
  const nom = i >= 0 ? voc.matieres[i].nom : 'Nederlands'
  if (i >= 0 && voc.matieres[i].chapitres.includes(CHAPITRE)) return voc
  const mots: Mot[] = donnees.verbes.map(v => ({
    id: `${nom}|${CHAPITRE}|${v.inf}`, matiere: nom, chapitre: CHAPITRE,
    nl: v.inf, det: '', fr: v.fr, definition: '', exemple: '', remarque: v.primitifs, verbe: v.inf,
  }))
  const matieres: Matiere[] = [...voc.matieres]
  if (i >= 0) matieres[i] = { ...matieres[i], chapitres: [...matieres[i].chapitres, CHAPITRE], mots: [...matieres[i].mots, ...mots] }
  else matieres.unshift({ nom, chapitres: [CHAPITRE], mots })
  return { ...voc, matieres }
}

/** Ce qu'elle a tapé, sans pronom au début ni ponctuation : « Ik slaap. » → « slaap ». */
function nettoyer(texte: string, pronoms: string[]): string {
  let t = simplifier(texte).replace(/[?.!]/g, '').replace(/\s+/g, ' ').trim()
  for (const p of pronoms) if (t.startsWith(p + ' ')) { t = t.slice(p.length + 1); break }
  return t
}

/** Une case du tableau de conjugaison : orthographe exacte (c'est tout l'enjeu). */
export function corrigerForme(texte: string, v: Verbe, t: Temps, personne: number): Correction {
  const t2 = nettoyer(texte, donnees.pronoms[personne])
  if (!t2) return { resultat: 'faux', message: '' }
  return v.formes[t][personne].includes(t2) ? { resultat: 'juste', message: '' } : { resultat: 'faux', message: '' }
}

/** La phrase affirmative : « Jij slaapt. », « Hij heeft geslapen. » */
export const affirmation = (v: Verbe, t: Temps, personne: number) => `${SUJETS[personne]} ${v.formes[t][personne][0]}.`

/** La forme interrogative, avec un mot d'explication pour l'erreur la plus courante. */
export function corrigerQuestion(texte: string, v: Verbe, t: Temps, personne: number): Correction {
  const r = simplifier(texte).replace(/[?.!]/g, '').replace(/\s+/g, ' ').trim()
  if (!r) return { resultat: 'faux', message: '' }
  if (v.questions[t][personne].includes(r)) return { resultat: 'juste', message: '' }
  // « slaapt jij ? » : avec jij (ou je) derrière le verbe, le -t disparaît
  if (personne === 1 && t === 'present' && v.questions.present[1].some(q => r === q.replace(/^(\S+)/, '$1t'))) {
    return { resultat: 'faux', message: 'Quand « jij » vient après le verbe, le -t disparaît.' }
  }
  if (v.questions[t][personne].some(q => r.split(' ').sort().join(' ') === q.split(' ').sort().join(' '))) {
    return { resultat: 'faux', message: 'Les bons mots, mais pas dans le bon ordre : le verbe conjugué vient en premier.' }
  }
  return { resultat: 'faux', message: '' }
}
