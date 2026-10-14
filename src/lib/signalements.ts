// Le bouton drapeau : signaler une question ou un mot qui paraît faux. Le signalement part vers le
// script du tableau (outils/recevoir-mots.gs, action « signaler », la seule possible sans clé), qui
// l'ajoute à l'onglet « Signalements » ; la commande /signalements de Claude Code les traite.
// Sans réseau, il attend sur l'appareil et part au prochain chargement ou retour du réseau.
import { lire, ecrire } from './stockage'
import type { Mot } from './mots'
import type { Resultat } from './correction'
import { langueDe } from './apparence'

/** L'application Web du script du tableau (son adresse est publique ; tout le reste demande la clé). */
export const URL_SCRIPT = 'https://script.google.com/macros/s/AKfycbyIcxBXbF9wXBkeqJMy6jMuYoe1KfVBz_zzcmCJ0NeZckHABFmTF-s7-5Gt913uoYCXsw/exec'

export interface Raison {
  id: string
  texte: string
}

/** Ce qu'on peut reprocher à une question de cours, ou à un mot (selon sa langue). */
export function raisons(m: Mot): Raison[] {
  if (m.vraag) return [
    { id: 'question', texte: 'La question est fausse ou pas claire' },
    { id: 'reponse', texte: 'La réponse est fausse' },
    { id: 'autre-juste', texte: 'Une autre proposition est juste aussi' },
    { id: 'orthographe', texte: 'Faute d’orthographe' },
    { id: 'autre', texte: 'Autre chose' },
  ]
  const fr = langueDe(m) === 'fr'
  return [
    { id: 'traduction', texte: fr ? 'La définition est fausse' : 'La traduction est fausse' },
    ...(fr ? [] : [{ id: 'article', texte: 'L’article (de / het) est faux' }]),
    { id: 'details', texte: fr ? 'L’exemple ou la remarque est faux' : 'La définition, l’exemple ou la remarque est faux' },
    { id: 'orthographe', texte: 'Faute d’orthographe' },
    { id: 'autre', texte: 'Autre chose' },
  ]
}

interface Signalement {
  action: 'signaler'
  id: string
  appareil: string
  matiere: string
  chapitre: string
  page: string
  element: string
  reponse: string
  exercice: string
  resultat: string
  raisons: string
  commentaire: string
}

const CLE = 'signalements-a-envoyer'
const id = () => (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`)

/** Un identifiant au hasard pour cet appareil (rien de personnel) : le script limite les envois par appareil. */
export function appareil(): string {
  let a = lire<string>('appareil', '')
  if (!a) { a = id(); ecrire('appareil', a) }
  return a
}

/** Enregistre le signalement sur l'appareil, puis tente de l'envoyer. */
export function signaler(m: Mot, choix: string[], commentaire: string, exercice = '', resultat?: Resultat): Promise<boolean> {
  const textes = raisons(m).filter(r => choix.includes(r.id)).map(r => r.texte)
  const s: Signalement = {
    action: 'signaler', id: id(), appareil: appareil(),
    matiere: m.matiere, chapitre: m.chapitre, page: m.page !== undefined ? String(m.page) : m.vraag?.page ?? '',
    element: m.det ? `${m.det} ${m.nl}` : m.nl, reponse: m.fr,
    exercice, resultat: resultat ?? '', raisons: textes.join(' ; '), commentaire: commentaire.trim(),
  }
  ecrire(CLE, [...lire<Signalement[]>(CLE, []), s])
  return envoyerEnAttente()
}

let enCours: Promise<boolean> | null = null

/** Envoie les signalements en attente ; vrai si tout est parti. */
export function envoyerEnAttente(): Promise<boolean> {
  return (enCours ??= (async () => {
    try {
      for (const s of lire<Signalement[]>(CLE, [])) {
        // en texte brut : une requête « simple », sans vérification préalable du navigateur
        const rep = await fetch(URL_SCRIPT, { method: 'POST', body: JSON.stringify(s), headers: { 'Content-Type': 'text/plain;charset=utf-8' } })
        const res: { ok?: boolean; erreur?: string } = await rep.json().catch(() => ({ ok: false, erreur: 'réponse illisible' }))
        // trop d'envois d'un coup, réponse illisible, ou script du tableau pas encore redéployé (il demande
        // la clé) : on réessaiera plus tard ; refusé pour une autre raison : on l'oublie
        if (!res.ok && /trop|illisible|clé/.test(res.erreur ?? '')) return false
        ecrire(CLE, lire<Signalement[]>(CLE, []).filter(x => x.id !== s.id))
      }
      return true
    } catch {
      return false   // pas de réseau : on réessaiera
    } finally {
      enCours = null
    }
  })())
}

/** Au lancement, et au retour du réseau : ce qui attend encore part. */
export function surveillerEnvois(): void {
  if (lire<Signalement[]>(CLE, []).length) envoyerEnAttente()
  addEventListener('online', () => { envoyerEnAttente() })
}
