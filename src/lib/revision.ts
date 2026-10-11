// « Réviser aujourd'hui » : une séance courte, toutes matières confondues, avec ce dont la date de
// révision est arrivée (les boîtes de Leitner de progression.ts) et les erreurs récentes. Chaque carte
// a l'exercice qui lui convient : questions de cours, définitions (matières en français), QCM (néerlandais).
import type { Mot, Vocabulaire } from './mots'
import { INTERVALLES, motsARevoir, suivi } from './progression'
import { melanger, type Carte } from './seance'
import { langueDe } from './apparence'
import type { ExerciceId } from './reglages'

/** Une dizaine de minutes : une vingtaine de cartes au plus. */
export const MAX_DU_JOUR = 20
const JOUR = 86_400_000

/** L'exercice d'une carte de la révision du jour. */
export function exerciceDuJour(m: Mot): ExerciceId {
  if (m.genere) return m.genere
  if (m.vraag) return 'questions'
  return langueDe(m) === 'fr' ? 'definitions' : 'qcm'
}

/** Ce qui est à revoir aujourd'hui : les erreurs récentes d'abord, puis ce qui attend depuis le plus longtemps. */
export function aReviserAujourdhui(voc: Vocabulaire, maintenant = Date.now(), hasard = Math.random): Carte[] {
  // ni les formes conjuguées ni les nombres (ils ont leur propre entraînement)
  const tous = voc.matieres.flatMap(m => [...m.mots, ...(m.questions ?? [])]).filter(m => !m.verbe && m.getal === undefined)
  const erreurs = motsARevoir(tous, MAX_DU_JOUR, maintenant).map(x => x.mot)
  const dejaLa = new Set(erreurs.map(m => m.id))
  const enRetard = tous
    .map(mot => ({ mot, s: suivi(mot.id) }))
    .filter(x => x.s && !dejaLa.has(x.mot.id) && maintenant - x.s.dernier >= INTERVALLES[x.s.boite] * JOUR)
    // la boîte la plus basse d'abord, puis le plus ancien
    .sort((a, b) => a.s!.boite - b.s!.boite || a.s!.dernier - b.s!.dernier)
    .map(x => x.mot)
  const choisis = [...erreurs, ...enRetard].slice(0, MAX_DU_JOUR)
  return melanger(choisis, hasard).map(mot => ({
    mot, exercice: exerciceDuJour(mot),
    sens: langueDe(mot) === 'fr' || mot.vraag ? 'nl-fr' : hasard() < .5 ? 'nl-fr' : 'fr-nl',
  }))
}
