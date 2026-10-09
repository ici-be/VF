import { useEffect } from 'preact/hooks'
import type { Mot } from '../../lib/mots'
import type { Correction } from '../../lib/correction'
import { parler } from '../../lib/voix'
import type { Reglages } from '../../lib/reglages'

export const attendre = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

/** Lit le texte si la voix est activée (la promesse se résout tout de suite sinon). */
export const dire = (r: Reglages, texte: string, langue: 'fr' | 'nl') =>
  r.voix ? parler(texte, langue) : Promise.resolve()

export function Langue({ l }: { l: 'fr' | 'nl' }) {
  return <span class={`langue ${l}`}>{l === 'fr' ? 'Français' : 'Nederlands'}</span>
}

/** Définition, remarque et exemple du mot, montrés après la réponse. */
export function Infos({ mot }: { mot: Mot }) {
  if (!mot.definition && !mot.remarque && !mot.exemple) return null
  return (
    <div class="info">
      {mot.definition && <span><b>Définition :</b> {mot.definition}</span>}
      {mot.exemple && <span><b>Exemple :</b> {mot.exemple.replace(/[\[\]]/g, '')}</span>}
      {mot.remarque && <span><b>Remarque :</b> {mot.remarque}</span>}
    </div>
  )
}

const TITRES = { juste: 'Juste !', presque: 'Presque !', faux: 'Raté' }

export function Verdict({ c, attendu }: { c: Correction; attendu: string }) {
  return (
    <div class={`verdict ${c.resultat}`} role="status">
      <b>{TITRES[c.resultat]}</b>
      {c.message && <span>{c.message}</span>}
      {c.resultat !== 'juste' && <span class="attendu">Réponse : <strong>{attendu}</strong></span>}
    </div>
  )
}

/** Entrée = « Suivant » une fois la réponse corrigée (écoute ajoutée au tour suivant, pour ne pas capter l'Entrée qui vient de valider). */
export function EntreeSuivant({ onEntree, pause }: { onEntree: () => void; pause: boolean }) {
  useEffect(() => {
    const t = (e: KeyboardEvent) => { if (e.key === 'Enter' && !pause) { e.preventDefault(); onEntree() } }
    // ajouté au tour suivant, pour ne pas capter l'Entrée qui vient de valider
    const id = setTimeout(() => addEventListener('keydown', t))
    return () => { clearTimeout(id); removeEventListener('keydown', t) }
  })
  return null
}
