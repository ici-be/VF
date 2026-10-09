// Les phrases à trous et les définitions « sans la réponse dedans ».
import type { Mot } from './mots'
import { sansAccents } from './correction'

export type Morceau = { texte: string } | { trou: string }

const MOT = /[\p{L}\p{N}'’-]+/gu
const racine = (s: string) => sansAccents(s.toLowerCase())

/** Les mots de l'expression néerlandaise assez longs pour être reconnus (« de », « van » ne comptent pas). */
function motsCles(nl: string): string[] {
  return nl.split(/\s+/).map(racine).filter(w => w.length >= 4)
}

/**
 * Un mot du texte est-il une forme du mot cherché ? On compare le début :
 * « carnivoren » pour « carnivoor », « autotrofe » pour « autotroof ».
 */
function estUneForme(token: string, cles: string[]): boolean {
  const t = racine(token)
  return cles.some(c => t.startsWith(c.slice(0, Math.max(4, c.length - 2))))
}

/** Le texte sans le mot cherché ni ses formes (remplacés par « … »). */
export function masquer(texte: string, nl: string): string {
  const cles = motsCles(nl)
  if (!cles.length) return texte
  return texte
    .replace(MOT, t => (estUneForme(t, cles) ? '…' : t))
    .replace(/…(\s+…)+/g, '…')
}

/**
 * Découpe un exemple en texte et trous. Les trous sont entre [crochets] ;
 * sans crochets, on cherche le mot (ou une de ses formes) dans la phrase.
 * Renvoie null si l'exemple ne contient pas de trou utilisable.
 */
export function decouper(exemple: string, nl: string): Morceau[] | null {
  const res: Morceau[] = []
  if (exemple.includes('[')) {
    let reste = exemple
    for (const m of exemple.matchAll(/\[([^\]]+)\]/g)) {
      const [avant] = reste.split(m[0], 1)
      if (avant) res.push({ texte: avant })
      res.push({ trou: m[1].trim() })
      reste = reste.slice(avant.length + m[0].length)
    }
    if (reste) res.push({ texte: reste })
  } else {
    const cles = motsCles(nl)
    let dernier = 0
    for (const m of exemple.matchAll(MOT)) {
      if (!cles.length || !estUneForme(m[0], cles)) continue
      if (m.index! > dernier) res.push({ texte: exemple.slice(dernier, m.index) })
      res.push({ trou: m[0] })
      dernier = m.index! + m[0].length
    }
    if (dernier < exemple.length) res.push({ texte: exemple.slice(dernier) })
  }
  return res.some(r => 'trou' in r) ? res : null
}

export const aDesTrous = (m: Mot) => !!m.exemple && decouper(m.exemple, m.nl) !== null
