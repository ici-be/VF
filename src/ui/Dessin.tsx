import dessins from '../data/dessins.json'
import type { Mot } from '../lib/mots'

// Les dessins des définitions (géométrie) : outils/dessins.py les écrit dans src/data/dessins.json,
// par matière puis par mot, tels qu'ils sont dans le tableau.
const DESSINS = dessins as Record<string, Record<string, string>>

export const dessinDe = (m: Mot): string | null => DESSINS[m.matiere]?.[m.nl] ?? null

/** Le dessin d'un mot, s'il en a un ; « label » : ce que lit le lecteur d'écran (sans donner la réponse en exercice). */
export function Dessin({ m, grand = false, label }: { m: Mot; grand?: boolean; label?: string }) {
  const d = dessinDe(m)
  if (!d) return null
  return <svg class={`dessin ${grand ? 'grand' : ''}`} viewBox="0 0 160 120" role="img" aria-label={label ?? `Dessin : ${m.nl}`} dangerouslySetInnerHTML={{ __html: d }} />
}
