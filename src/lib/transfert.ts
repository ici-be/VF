// Le transfert de la progression d'un appareil à l'autre (téléphone ↔ ordinateur) : un lien qui contient
// toute la progression, compressée (#transfert=…). Rien ne passe par le tableau : le lien va directement
// d'un appareil à l'autre (message, mail…). À l'ouverture, l'appli fusionne : le plus récent l'emporte.
import { fusionner, sauvegarde, type Sauvegarde } from './progression'

const PREFIXE = '#transfert='

type Octets = Uint8Array<ArrayBuffer>
// par morceaux : une longue progression dépasserait la limite d'arguments de String.fromCharCode
const versBase64 = (o: Octets) => {
  let b = ''
  for (let i = 0; i < o.length; i += 0x8000) b += String.fromCharCode(...o.subarray(i, i + 0x8000))
  return btoa(b).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
const depuisBase64 = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))

async function transformer(octets: Octets, flux: CompressionStream | DecompressionStream): Promise<Octets> {
  return new Uint8Array(await new Response(new Blob([octets]).stream().pipeThrough(flux)).arrayBuffer())
}

/** Le lien de transfert : l'adresse de l'appli suivie de la progression compressée (« z. ») ou brute (« j. »). */
export async function lienTransfert(base = location.href.split('#')[0]): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(sauvegarde()))
  if (typeof CompressionStream === 'undefined') return `${base}${PREFIXE}j.${versBase64(json)}`
  return `${base}${PREFIXE}z.${versBase64(await transformer(json, new CompressionStream('deflate-raw')))}`
}

export const estUnTransfert = (hash: string) => hash.startsWith(PREFIXE)

/** Lit un lien de transfert et fusionne sa progression ; renvoie le nombre de mots repris (null si illisible). */
export async function importerTransfert(hash: string): Promise<number | null> {
  try {
    const [type, donnees] = [hash.slice(PREFIXE.length, PREFIXE.length + 2), hash.slice(PREFIXE.length + 2)]
    let octets: Octets = depuisBase64(donnees)
    if (type === 'z.') octets = await transformer(octets, new DecompressionStream('deflate-raw'))
    else if (type !== 'j.') return null
    const s = JSON.parse(new TextDecoder().decode(octets)) as Sauvegarde
    if (!s || typeof s.progression !== 'object') return null
    return fusionner(s)
  } catch {
    return null
  }
}
