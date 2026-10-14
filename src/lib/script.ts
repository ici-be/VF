// Les appels de l'appli au script du tableau (outils/recevoir-mots.gs) sans clé : liens courts et utilisateurs.
// En texte brut : une requête « simple », sans vérification préalable du navigateur.
import { URL_SCRIPT, appareil } from './signalements'

/** L'adresse de l'accueil de l'appli (https://ici.be/VF/), sans ce qui suit. */
export const racine = () => new URL('.', location.href.split('#')[0]).href

/** Appelle une action du script ; une erreur si pas de réseau, ou si le script refuse (son message). */
export async function appeler<T>(requete: Record<string, unknown>): Promise<T> {
  const rep = await fetch(URL_SCRIPT, { method: 'POST', body: JSON.stringify({ ...requete, appareil: appareil() }), headers: { 'Content-Type': 'text/plain;charset=utf-8' } })
  const res = await rep.json().catch(() => ({ ok: false, erreur: 'réponse illisible' }))
  if (!res.ok) throw new Error(res.erreur ?? 'refusé')
  return res as T
}

type Octets = Uint8Array<ArrayBuffer>
const transformer = async (octets: Octets, flux: CompressionStream | DecompressionStream): Promise<Octets> =>
  new Uint8Array(await new Response(new Blob([octets]).stream().pipeThrough(flux)).arrayBuffer())

/** Un objet en JSON compressé (gzip), en base64url : ce que le script sait lire (Utilities.ungzip). */
export async function compresser(valeur: unknown): Promise<string> {
  const o = await transformer(new TextEncoder().encode(JSON.stringify(valeur)), new CompressionStream('gzip'))
  let b = ''
  for (let i = 0; i < o.length; i += 0x8000) b += String.fromCharCode(...o.subarray(i, i + 0x8000))
  return btoa(b).replace(/\+/g, '-').replace(/\//g, '_')
}

export async function decompresser<T>(texte: string): Promise<T> {
  const o = Uint8Array.from(atob(texte.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))
  return JSON.parse(new TextDecoder().decode(await transformer(o, new DecompressionStream('gzip'))))
}
