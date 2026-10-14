import { useEffect, useRef, useState } from 'preact/hooks'
import { Check, User } from 'lucide-preact'
import { choisirUtilisateur, derniereSynchro, enAttente, initiale, lienUtilisateur, memeNom, nomUtilisateur, type Changement } from '../lib/utilisateur'
import { copierBientot } from '../lib/liens'
import { dateCourte } from './Accueil'

// Le bouton de l'utilisateur (son initiale, à côté du son sur l'accueil) et sa petite fenêtre : son lien
// (ici.be/VF/u/Olivia) et le changement de prénom.

export function BoutonUtilisateur() {
  const [ouverte, setOuverte] = useState(false)
  const nom = nomUtilisateur()
  return <>
    <button class="icone utilisateur-accueil" onClick={() => setOuverte(true)} aria-haspopup="dialog"
      title={nom ? `Utilisateur : ${nom}` : 'Choisir un utilisateur'} aria-label={nom ? `Utilisateur : ${nom}` : 'Choisir un utilisateur'}>
      {nom ? <span class="initiale" aria-hidden="true">{initiale(nom)}</span> : <User size={20} strokeWidth={2.2} />}
    </button>
    {ouverte && <FenetreUtilisateur fermer={() => setOuverte(false)} />}
  </>
}

const MESSAGES: Record<Changement['etat'], (nom: string) => string> = {
  meme: nom => `C’est déjà ${nom}.`,
  premier: nom => `Bonjour ${nom} ! Les exercices faits ici sont maintenant enregistrés à ton nom.`,
  repris: nom => `Bonjour ${nom} ! Ton historique est repris sur cet appareil.`,
  nouveau: nom => `Bonjour ${nom} ! Nouveau prénom : l’historique repart de zéro.`,
}

function FenetreUtilisateur({ fermer }: { fermer: () => void }) {
  const dialogue = useRef<HTMLDialogElement>(null)
  const [saisie, setSaisie] = useState('')
  const [etat, setEtat] = useState<{ quoi: 'saisie' | 'envoi' } | { quoi: 'fait' | 'erreur'; message: string }>({ quoi: 'saisie' })
  const [copie, setCopie] = useState(false)
  const nom = nomUtilisateur()
  useEffect(() => {
    const d = dialogue.current
    if (d && !d.open) d.showModal?.()
  }, [])

  const changer = async (e: Event) => {
    e.preventDefault()
    if (!saisie.trim()) return
    setEtat({ quoi: 'envoi' })
    try {
      const c = await choisirUtilisateur(saisie)
      setEtat({ quoi: 'fait', message: MESSAGES[c.etat](c.nom) })
      setSaisie('')
    } catch (err) {
      setEtat({ quoi: 'erreur', message: err instanceof Error ? err.message : 'Le changement n’a pas pu se faire.' })
    }
  }
  const copier = async () => {
    if (await copierBientot(Promise.resolve(lienUtilisateur(nom)))) {
      setCopie(true)
      setTimeout(() => setCopie(false), 2000)
    } else prompt('Copier le lien :', lienUtilisateur(nom))
  }
  const synchro = derniereSynchro()

  return (
    <dialog ref={dialogue} class="fenetre-signalement fenetre-utilisateur" onClose={fermer} onCancel={e => { e.preventDefault(); fermer() }}>
      <p class="titre"><User size={17} strokeWidth={2.2} /> Utilisateur</p>
      {nom
        ? <>
            <p>Les exercices sont enregistrés au nom de <b>{nom}</b>, sur chaque appareil où ce prénom a été choisi en dernier.</p>
            <div class="lien-utilisateur">
              <span>{lienUtilisateur(nom).replace(/^https?:\/\//, '')}</span>
              <button type="button" class="second" onClick={copier}>{copie ? <><Check size={15} strokeWidth={2.4} /> Copié</> : 'Copier'}</button>
            </div>
            <p class="astuce gauche">Ce lien, ouvert sur un autre appareil, y retrouve tes exercices.
              {' '}{enAttente() ? 'Des réponses attendent la connexion pour partir.' : synchro ? `Enregistré le ${dateCourte(synchro)}.` : ''}</p>
          </>
        : <p>Personne pour l’instant : les exercices restent sur cet appareil. Avec un prénom, ils te suivent sur tes autres appareils.</p>}
      {etat.quoi === 'fait' && <p class="message-utilisateur" role="status">{etat.message}</p>}
      {etat.quoi === 'erreur' && <p class="message-utilisateur erreur" role="alert">{etat.message}</p>}
      <form onSubmit={changer}>
        <label for="prenom">{nom ? 'Changer d’utilisateur' : 'Ton prénom'}</label>
        <input id="prenom" type="text" maxLength={30} autoComplete="given-name" placeholder="Prénom" value={saisie}
          onInput={e => setSaisie((e.target as HTMLInputElement).value)} />
        {saisie.trim() && (
          <p class="astuce gauche">{!nom
            ? 'Ce qui a déjà été fait sur cet appareil lui sera attribué.'
            : memeNom(saisie, nom) ? `C’est déjà ${nom}.`
            : `Cet appareil prendra l’historique de ce prénom, ou repartira de zéro si le prénom est nouveau. Celui de ${nom} reste gardé à son nom.`}</p>
        )}
        <div class="actions">
          <button type="button" class="second" onClick={fermer}>Fermer</button>
          <button type="submit" class="go" disabled={etat.quoi === 'envoi' || !saisie.trim() || (!!nom && memeNom(saisie, nom))}>
            {etat.quoi === 'envoi' ? 'Un instant…' : nom ? 'Changer' : 'Choisir'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
