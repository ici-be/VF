// Correction d'une réponse écrite : tolérante sur ce qui n'est pas le sujet
// (majuscules, articles, précisions entre parenthèses, variantes « a, b / c »),
// et qui distingue « juste », « presque » (accents, une lettre, article) et « faux ».

export type Resultat = 'juste' | 'presque' | 'faux'

export interface Correction {
  resultat: Resultat
  message: string   // explication courte quand ce n'est pas « juste »
}

export interface OptionsCorrection {
  /** Orthographe exacte exigée (dictée) : accents et lettres comptent. */
  strict?: boolean
  /** L'article de/het doit être donné (mots néerlandais qui en ont un). */
  exigerArticle?: boolean
}

const ARTICLES_FR = /^(le |la |les |l'|un |une |des |du |de la |de l')/
const ARTICLES_NL = /^(de |het |een |'t )/

export function simplifier(s: string): string {
  return s
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/\[|\]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^[\s.,;:!?¿¡"«»]+|[\s.,;:!?"«»]+$/g, '')
    .trim()
}

export function sansAccents(s: string): string {
  return s.normalize('NFD').replace(/\p{M}/gu, '')
}

function sansArticle(s: string, langue: 'fr' | 'nl'): string {
  return s.replace(langue === 'fr' ? ARTICLES_FR : ARTICLES_NL, '')
}

/** Toutes les réponses acceptées pour une case du tableau, déjà simplifiées. */
export function variantes(attendu: string, langue: 'fr' | 'nl'): string[] {
  const sansParentheses = attendu.replace(/\([^)]*\)/g, ' ')
  const morceaux = [sansParentheses, ...sansParentheses.split(/[\/,;]/)]
  const res = new Set<string>()
  for (const m of morceaux) {
    const s = simplifier(m)
    if (!s) continue
    res.add(s)
    res.add(sansArticle(s, langue))
    if (langue === 'fr') res.add(s.replace(/^(se |s')/, ''))
  }
  res.delete('')
  return [...res]
}

export function distance(a: string, b: string): number {
  if (a === b) return 0
  const prec = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let diag = prec[0]
    prec[0] = i
    for (let j = 1; j <= b.length; j++) {
      const tmp = prec[j]
      prec[j] = Math.min(prec[j] + 1, prec[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1))
      diag = tmp
    }
  }
  return prec[b.length]
}

export function corriger(
  reponse: string,
  attendu: string,
  langue: 'fr' | 'nl',
  det = '',
  options: OptionsCorrection = {},
): Correction {
  const r = simplifier(reponse)
  if (!r) return { resultat: 'faux', message: 'Pas de réponse.' }
  const accepte = variantes(attendu, langue)

  // l'article de/het : s'il est donné, il doit être le bon
  let messageArticle = ''
  let rMot = r
  if (langue === 'nl') {
    const article = r.match(/^(de|het) /)?.[1]
    rMot = sansArticle(r, 'nl')
    if (det && article && article !== det) messageArticle = `C’est « ${det} ${sansArticle(simplifier(attendu), 'nl')} », pas « ${article} ».`
    else if (det && !article && options.exigerArticle) messageArticle = `N’oublie pas l’article : « ${det} ».`
  } else {
    rMot = sansArticle(r, 'fr')
  }
  const candidats = [r, rMot]

  const exact = candidats.some(c => accepte.includes(c))
  if (exact) return messageArticle ? { resultat: 'presque', message: messageArticle } : { resultat: 'juste', message: '' }

  if (!options.strict) {
    const accepteSA = accepte.map(sansAccents)
    if (candidats.some(c => accepteSA.includes(sansAccents(c)))) {
      return { resultat: 'presque', message: `Attention aux accents. ${messageArticle}`.trim() }
    }
    // une seule lettre de travers, sur un mot assez long pour que ce soit une faute de frappe
    const proche = accepte.find(a => a.length >= 5 && candidats.some(c => distance(sansAccents(c), sansAccents(a)) === 1))
    if (proche) return { resultat: 'presque', message: `Presque : une lettre à corriger. ${messageArticle}`.trim() }
  }
  return { resultat: 'faux', message: '' }
}
