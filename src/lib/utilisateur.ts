// L'utilisateur : un prénom, sans mot de passe (https://ici.be/VF/u/Olivia). Sa progression est gardée par le
// script du tableau (action « profil », dans un classeur privé à part) et suit le prénom d'un appareil à l'autre :
// chaque appareil où ce prénom a été choisi en dernier envoie ses réponses et reprend celles des autres (pour
// chaque mot, la plus récente l'emporte, comme le lien de transfert). Changer de prénom remplace la progression
// de l'appareil par celle du nouveau prénom (rien pour un prénom nouveau) ; l'ancienne reste gardée à son nom.
import { lire, ecrire } from './stockage'
import { fusionner, recordDeJours, remplacer, RECOMPENSES, sauvegarde, surChangement, type Sauvegarde } from './progression'
import { appeler, compresser, decompresser, racine } from './script'

/** Le prénom, d'une seule ligne, sans espaces en trop ; 30 caractères au plus. */
export const nettoyerNom = (nom: string) => nom.replace(/\s+/g, ' ').trim().slice(0, 30)
const cle = (nom: string) => nettoyerNom(nom).normalize('NFC').toLocaleLowerCase('fr')
export const memeNom = (a: string, b: string) => cle(a) === cle(b)
export const initiale = (nom: string) => [...nettoyerNom(nom)][0]?.toLocaleUpperCase('fr') ?? ''
/** https://ici.be/VF/u/Olivia */
export const lienUtilisateur = (nom: string, base = racine()) => `${base}u/${encodeURIComponent(nettoyerNom(nom))}`

const PREFIXE = '#u='
export const estUnUtilisateur = (hash: string) => hash.startsWith(PREFIXE)
/** Le prénom d'une adresse « #u=Olivia » (venue de …/u/Olivia) ; vide s'il est illisible. */
export function nomDuLien(hash: string): string {
  try {
    return nettoyerNom(decodeURIComponent(hash.slice(PREFIXE.length)))
  } catch {
    return ''
  }
}

export const nomUtilisateur = () => lire<string>('utilisateur', '')
// des réponses pas encore envoyées (pas de réseau, appli fermée trop tôt) : elles partiront au prochain envoi
const A_ENVOYER = 'utilisateur-a-envoyer'
const DERNIERE = 'utilisateur-synchro'
/** La date du dernier échange réussi avec le tableau (0 : jamais). */
export const derniereSynchro = () => lire<number>(DERNIERE, 0)
export const enAttente = () => lire<boolean>(A_ENVOYER, false)

let enCours: Promise<boolean> | null = null
let apres: (n: number) => void = () => {}

/**
 * Envoie la progression de l'appareil (si elle a changé) et reprend celle des autres appareils du même prénom.
 * Vrai si l'échange a eu lieu.
 */
export function synchroniser(): Promise<boolean> {
  const nom = nomUtilisateur()
  if (!nom) return Promise.resolve(true)
  return (enCours ??= (async () => {
    const aEnvoyer = enAttente()
    try {
      // les réponses données pendant l'échange remettront la marque
      ecrire(A_ENVOYER, false)
      const res = await appeler<{ donnees: string }>({ action: 'profil', nom, donnees: aEnvoyer ? await compresser(sauvegarde()) : '' })
      if (!memeNom(nomUtilisateur(), nom)) return false   // prénom changé entre-temps
      const n = res.donnees ? fusionner(await decompresser<Sauvegarde>(res.donnees)) : 0
      ecrire(DERNIERE, Date.now())
      apres(n)
      return true
    } catch {
      if (aEnvoyer) ecrire(A_ENVOYER, true)
      return false
    } finally {
      enCours = null
    }
  })())
}

let minuterie: ReturnType<typeof setTimeout> | undefined
/**
 * Au lancement de l'appli : échange tout de suite, puis 20 s après chaque série de réponses, quand l'appli passe
 * en arrière-plan (téléphone), et quand elle revient au premier plan (un autre appareil a pu avancer).
 * « recu » est appelé après chaque échange, avec le nombre de mots repris d'ailleurs.
 */
export function demarrerSynchro(recu: (n: number) => void): void {
  apres = recu
  surChangement(() => {
    if (!nomUtilisateur()) return
    ecrire(A_ENVOYER, true)
    clearTimeout(minuterie)
    minuterie = setTimeout(synchroniser, 20_000)
  })
  addEventListener('visibilitychange', () => {
    if (!nomUtilisateur()) return
    if (document.visibilityState === 'hidden' ? enAttente() : Date.now() - derniereSynchro() > 60_000) synchroniser()
  })
  addEventListener('online', () => { if (enAttente()) synchroniser() })
  synchroniser()
}

export type Changement = { etat: 'meme' | 'premier' | 'repris' | 'nouveau'; nom: string }

/**
 * Choisit l'utilisateur de cet appareil.
 * - le même prénom : rien ne change (l'échange habituel) ;
 * - pas encore de prénom : ce qui a été fait sur l'appareil lui est attribué (réuni avec son historique s'il en a un) ;
 * - un autre prénom : l'historique de l'appareil part au nom de l'ancien, et l'appareil prend celui du nouveau
 *   (« repris »), ou repart de zéro (« nouveau »). Il faut le réseau.
 */
export async function choisirUtilisateur(nom: string): Promise<Changement> {
  nom = nettoyerNom(nom)
  if (!nom) throw new Error('Il faut un prénom.')
  const avant = nomUtilisateur()
  if (avant && memeNom(avant, nom)) {
    synchroniser()
    return { etat: 'meme', nom: avant }
  }
  if (!avant) {
    ecrire('utilisateur', nom)
    ecrire(A_ENVOYER, true)
    synchroniser()
    return { etat: 'premier', nom }
  }
  // l'ancien prénom garde ce qui n'était pas encore parti
  if (enAttente() && !(await synchroniser())) throw new Error('Pas de connexion : impossible de changer d’utilisateur maintenant.')
  let res: { nom: string; existe: boolean; donnees: string }
  try {
    res = await appeler({ action: 'profil', nom })
  } catch {
    throw new Error('Pas de connexion : impossible de changer d’utilisateur maintenant.')
  }
  const s: Sauvegarde = res.donnees ? await decompresser<Sauvegarde>(res.donnees) : { progression: {}, journal: {}, ratesInterro: [] }
  // les erreurs d'interro (colonne « Raté ») déjà comptées sur cet appareil ne le sont pas une deuxième fois pour le nouveau prénom
  remplacer({ ...s, ratesInterro: [...new Set([...(s.ratesInterro ?? []), ...lire<string[]>('rates-interro', [])])] })
  // les récompenses déjà gagnées par ce prénom ne sont pas réannoncées ; les autres le seront
  ecrire('recompenses-vues', RECOMPENSES.filter(r => recordDeJours() >= r.jours).map(r => r.jours))
  ecrire('utilisateur', res.nom || nom)
  ecrire(A_ENVOYER, false)
  ecrire(DERNIERE, Date.now())
  apres(0)
  return { etat: res.existe ? 'repris' : 'nouveau', nom: res.nom || nom }
}
