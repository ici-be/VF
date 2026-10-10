// Correction d'une réponse écrite : tolérante sur ce qui n'est pas le sujet
// (majuscules, articles, précisions entre parenthèses, variantes « a, b / c »),
// et qui distingue « juste », « presque » (accents, une lettre, article) et « faux ».

export type Resultat = 'juste' | 'presque' | 'faux'

export interface Correction {
  resultat: Resultat
  message: string   // explication courte quand ce n'est pas « juste »
  /** pourquoi « presque » : mauvais article, accents, ou une lettre de travers */
  cause?: 'article' | 'accents' | 'lettre'
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
  if (exact) return messageArticle ? { resultat: 'presque', message: messageArticle, cause: 'article' } : { resultat: 'juste', message: '' }

  if (!options.strict) {
    const accepteSA = accepte.map(sansAccents)
    if (candidats.some(c => accepteSA.includes(sansAccents(c)))) {
      return { resultat: 'presque', message: `Attention aux accents. ${messageArticle}`.trim(), cause: 'accents' }
    }
    // une seule lettre de travers, sur un mot assez long pour que ce soit une faute de frappe
    const proche = accepte.find(a => a.length >= 5 && candidats.some(c => distance(sansAccents(c), sansAccents(a)) === 1))
    if (proche) return { resultat: 'presque', message: `Presque : une lettre à corriger. ${messageArticle}`.trim(), cause: 'lettre' }
  }
  return { resultat: 'faux', message: '' }
}

export interface CorrectionListe {
  resultat: Resultat
  /** pour chaque champ : sa correction et l'élément qu'il a trouvé */
  champs: (Correction & { element?: string })[]
  /** les éléments que personne n'a trouvés */
  manquants: string[]
}

/**
 * Corrige une énumération (« Noem de vier basiselementen ») : chaque champ peut donner
 * n'importe quel élément, dans n'importe quel ordre, mais chacun une seule fois. Juste si
 * tous les champs sont justes, presque si la moitié au moins est trouvée.
 */
export function corrigerListe(reponses: string[], elements: string[]): CorrectionListe {
  const champs: CorrectionListe['champs'] = reponses.map(() => ({ resultat: 'faux', message: '' }))
  const pris = new Set<number>()
  // d'abord les réponses exactes, puis les « presque » parmi les éléments restants
  for (const voulu of ['juste', 'presque'] as const) {
    reponses.forEach((r, i) => {
      if (champs[i].element !== undefined || !r.trim()) return
      const k = elements.findIndex((e, j) => !pris.has(j) && corriger(r, e, 'nl').resultat === voulu)
      if (k < 0) return
      pris.add(k)
      champs[i] = { ...corriger(r, elements[k], 'nl'), element: elements[k] }
    })
  }
  reponses.forEach((r, i) => {
    if (champs[i].element !== undefined) return
    if (!r.trim()) champs[i] = { resultat: 'faux', message: 'Pas de réponse.' }
    // un élément déjà donné dans un autre champ
    else if (elements.some(e => corriger(r, e, 'nl').resultat !== 'faux')) champs[i] = { resultat: 'faux', message: 'Déjà donné.' }
  })
  const trouves = champs.filter(c => c.resultat !== 'faux').length
  const resultat: Resultat = champs.every(c => c.resultat === 'juste') ? 'juste' : trouves * 2 >= reponses.length ? 'presque' : 'faux'
  return { resultat, champs, manquants: elements.filter((_, j) => !pris.has(j)) }
}

export interface Segment {
  texte: string
  /** 'ok' : lettre juste ; 'faux' : lettre en trop ou erronée ; 'manque' : lettre oubliée */
  etat: 'ok' | 'faux' | 'manque'
}

/**
 * Compare lettre à lettre la réponse tapée et l'attendu (sans tenir compte des
 * majuscules) : ce qui est juste, en trop, et oublié, dans l'ordre de lecture.
 */
export function differences(tape: string, attendu: string): Segment[] {
  const a = [...tape], b = [...attendu]
  const egal = (x: string, y: string) => x.toLowerCase() === y.toLowerCase()
  // plus longue sous-suite commune
  const L = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0))
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      L[i][j] = egal(a[i], b[j]) ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1])
  const res: Segment[] = []
  const pousser = (texte: string, etat: Segment['etat']) => {
    const der = res[res.length - 1]
    if (der && der.etat === etat) der.texte += texte
    else res.push({ texte, etat })
  }
  let i = 0, j = 0
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && egal(a[i], b[j])) { pousser(a[i], 'ok'); i++; j++ }
    else if (j < b.length && (i >= a.length || L[i][j + 1] > L[i + 1][j])) { pousser(b[j], 'manque'); j++ }
    else { pousser(a[i], 'faux'); i++ }
  }
  return res
}
