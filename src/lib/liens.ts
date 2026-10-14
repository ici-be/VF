// Les liens courts : https://ici.be/VF/z/G8T9 au lieu d'un permalien (#r=…) ou d'un lien de transfert
// (#transfert=…) de plusieurs centaines de caractères. Le script du tableau garde le lien long un peu plus
// d'un mois sous un code de 4 caractères. GitHub Pages ne connaît pas l'adresse …/z/G8T9 : 404.html (et
// index.html, pour l'appli installée) la change en …/#z=G8T9, que l'appli ouvre ici.
import { appeler, racine } from './script'

const PREFIXE = '#z='

/** Le lien court d'un lien de l'appli ; le lien long tel quel si le script n'est pas joignable. */
export async function raccourcir(long: string): Promise<string> {
  const i = long.indexOf('#')
  try {
    const { code } = await appeler<{ code: string }>({ action: 'raccourcir', lien: long.slice(i) })
    return `${racine()}z/${code}`
  } catch {
    return long
  }
}

export const estUnRaccourci = (hash: string) => hash.startsWith(PREFIXE)

/** Le lien long (« #r=… ») derrière « #z=G8T9 » ; une erreur si le lien a expiré ou sans réseau. */
export async function deplier(hash: string): Promise<string> {
  try {
    return (await appeler<{ lien: string }>({ action: 'lien', code: hash.slice(PREFIXE.length) })).lien
  } catch (e) {
    throw new Error(e instanceof Error && /expiré/.test(e.message)
      ? 'Ce lien court a expiré (ils durent un mois) ou n’existe pas.'
      : 'Pas de connexion : ce lien court ne peut pas être ouvert pour l’instant.')
  }
}

/** Copie un texte qui n'est pas encore prêt (le lien court arrive du script) ; faux si le navigateur refuse. */
export async function copierBientot(texte: Promise<string>): Promise<boolean> {
  try {
    // Safari n'accepte de copier que pendant le clic : on lui donne la promesse tout de suite
    if (typeof ClipboardItem !== 'undefined' && ClipboardItem.supports?.('text/plain') !== false) {
      await navigator.clipboard.write([new ClipboardItem({ 'text/plain': texte.then(t => new Blob([t], { type: 'text/plain' })) })])
    } else {
      await navigator.clipboard.writeText(await texte)
    }
    return true
  } catch {
    try {
      await navigator.clipboard.writeText(await texte)
      return true
    } catch {
      return false
    }
  }
}
