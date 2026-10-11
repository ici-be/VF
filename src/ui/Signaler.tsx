import { useEffect, useRef, useState } from 'preact/hooks'
import { Flag } from 'lucide-preact'
import type { Mot } from '../lib/mots'
import type { Resultat } from '../lib/correction'
import { raisons, signaler } from '../lib/signalements'
import { apparence } from '../lib/apparence'
import { nomChapitre } from './Accueil'

// Le bouton drapeau (discret) et la petite fenêtre pour signaler une question ou un mot qui paraît faux.

/** Le petit drapeau gris : ouvre la fenêtre de signalement. */
export function BoutonSignaler({ onClick, classe = 'icone' }: { onClick: () => void; classe?: string }) {
  return (
    <button type="button" class={`${classe} bouton-signaler`} onClick={onClick} aria-label="Signaler une erreur" title="Signaler une erreur dans cette question ou ce mot">
      <Flag size={15} strokeWidth={2} />
    </button>
  )
}

interface Props {
  mot: Mot
  /** l'exercice en cours (absent depuis la liste des mots) */
  exercice?: string
  resultat?: Resultat
  fermer: () => void
}

/** La fenêtre : ce qui est signalé, les raisons à cocher, un commentaire, Envoyer. */
export function FenetreSignalement({ mot, exercice, resultat, fermer }: Props) {
  const dialogue = useRef<HTMLDialogElement>(null)
  const [choix, setChoix] = useState<string[]>([])
  const [commentaire, setCommentaire] = useState('')
  const [etat, setEtat] = useState<'saisie' | 'envoi' | 'envoye' | 'en-attente'>('saisie')

  useEffect(() => {
    const d = dialogue.current
    if (d && !d.open) d.showModal?.()
  }, [])
  // après le merci, la fenêtre se ferme toute seule
  useEffect(() => {
    if (etat !== 'envoye' && etat !== 'en-attente') return
    const t = setTimeout(fermer, 2600)
    return () => clearTimeout(t)
  }, [etat])

  const basculer = (id: string) => setChoix(c => (c.includes(id) ? c.filter(x => x !== id) : [...c, id]))
  const envoyer = async (e: Event) => {
    e.preventDefault()
    if (!choix.length && !commentaire.trim()) return
    setEtat('envoi')
    setEtat((await signaler(mot, choix, commentaire, exercice, resultat)) ? 'envoye' : 'en-attente')
  }
  const element = mot.det ? `${mot.det} ${mot.nl}` : mot.nl

  return (
    <dialog ref={dialogue} class="fenetre-signalement" onClose={fermer} onCancel={e => { e.preventDefault(); fermer() }}>
      {etat === 'envoye' || etat === 'en-attente'
        ? (
          <div class="merci" role="status">
            <p class="titre">Merci !</p>
            <p>{etat === 'envoye' ? 'Le signalement sera vérifié.' : 'Pas de connexion : le signalement partira dès que l’appareil sera connecté.'}</p>
            <button class="go" autoFocus onClick={fermer}>Fermer</button>
          </div>
        )
        : (
          <form onSubmit={envoyer}>
            <p class="titre"><Flag size={16} strokeWidth={2.2} /> Signaler une erreur</p>
            <div class="signale">
              <span class="element">{element}</span>
              <span class="reponse">{mot.fr}</span>
              <span class="ou">{apparence(mot.matiere).titre} · {nomChapitre(mot.chapitre)}</span>
            </div>
            <fieldset>
              <legend>Qu’est-ce qui ne va pas ?</legend>
              {raisons(mot).map(r => (
                <label class="case"><input type="checkbox" checked={choix.includes(r.id)} onChange={() => basculer(r.id)} /> {r.texte}</label>
              ))}
            </fieldset>
            <textarea rows={3} maxLength={500} placeholder="Ce qui ne va pas, ou la bonne réponse (facultatif)" value={commentaire}
              onInput={e => setCommentaire((e.target as HTMLTextAreaElement).value)} />
            <div class="actions">
              <button type="button" class="second" onClick={fermer}>Annuler</button>
              <button type="submit" class="go" disabled={etat === 'envoi' || (!choix.length && !commentaire.trim())}>{etat === 'envoi' ? 'Envoi…' : 'Envoyer'}</button>
            </div>
          </form>
        )}
    </dialog>
  )
}
