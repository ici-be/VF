// Les exercices fabriqués par l'appli, sans fin : chacun ajoute à sa matière un chapitre de cartes
// (une par notion, pour suivre la progression), et invente une question nouvelle à chaque carte.
// - Eeuwen (Geschiedenis, en néerlandais) : l'année → le siècle ou le tijdvak, un siècle → ses années ;
// - Calcul mental (Mathématiques) : priorité des opérations, de gauche à droite, exposants, parenthèses, distributivité
//   (dans les deux sens), calcul astucieux, coder, décoder, propriétés, vocabulaire des opérations ;
// - Natures des mots (Français) : dans une phrase, la nature du mot mis en évidence ;
// - Voornaamwoorden (Nederlands) : la phrase à compléter par le bon voornaamwoord (src/lib/voornaamwoorden.ts).
import donneesNatures from '../data/natures.json'
import type { Matiere, Mot, Vocabulaire } from './mots'
import { VOORNAAMWOORDEN } from './voornaamwoorden'

type Hasard = () => number
const entre = (a: number, b: number, h: Hasard) => a + Math.floor(h() * (b - a + 1))
const un = <T,>(t: readonly T[], h: Hasard): T => t[Math.floor(h() * t.length)]
function melange<T>(t: T[], h: Hasard): T[] {
  const r = [...t]
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(h() * (i + 1)); [r[i], r[j]] = [r[j], r[i]] }
  return r
}

// ============================================================ Eeuwen
/** Les tijdvakken du cours (questions de « 1. Werken met tijd ») ; les années avant Christus sont négatives. */
export const TIJDVAKKEN = [
  { nl: 'de prehistorie', fr: 'la Préhistoire', de: -9000, tot: -3500, uitleg: 'van ca. 2 500 000 v.C. tot 3500 v.C.' },
  { nl: 'het oude nabije oosten', fr: 'l’Ancien Proche-Orient', de: -3500, tot: -753, uitleg: 'van 3500 v.C. tot 753 v.C.' },
  { nl: 'de klassieke oudheid', fr: 'l’Antiquité classique', de: -753, tot: 476, uitleg: 'van 753 v.C. tot 476' },
  { nl: 'de middeleeuwen', fr: 'le Moyen Âge', de: 476, tot: 1492, uitleg: 'van 476 tot 1492' },
  { nl: 'de nieuwe tijd', fr: 'les Temps modernes', de: 1492, tot: 1789, uitleg: 'van 1492 tot 1789' },
  { nl: 'de nieuwste tijd', fr: 'l’époque contemporaine (1789-1945)', de: 1789, tot: 1945, uitleg: 'van 1789 tot 1945' },
  { nl: 'de eigen tijd', fr: 'le temps présent', de: 1945, tot: 2025, uitleg: 'vanaf 1945' },
] as const

/** « 1789 », « 500 v.C. » (pas d'année 0). */
export const jaartal = (j: number) => (j < 0 ? `${-j} v.C.` : String(j))
/** Le siècle d'une année : 1789 → 18, 1800 → 18, 500 v.C. → −5. */
export const eeuwVan = (j: number) => (j < 0 ? -Math.ceil(-j / 100) : Math.ceil(j / 100))
/** Règle du cours : « ste » pour 1, 8 et 20 à 100, « de » pour les autres. */
export const rangtelwoord = (n: number) => `${n}${n === 1 || n === 8 || (n >= 20 && n <= 100) ? 'ste' : 'de'}`
/** « de 18de eeuw », « de 35ste eeuw v.C. » (sans l'article : « 18de eeuw ») */
export const eeuw = (e: number) => `${rangtelwoord(Math.abs(e))} eeuw${e < 0 ? ' v.C.' : ''}`
/** Les années d'un siècle, comme dans le cours : « 1401 tot en met 1500 », « 200 v.C. tot en met 101 v.C. ». */
export const jarenVan = (e: number) => (e > 0 ? `${(e - 1) * 100 + 1} tot en met ${e * 100}` : `${-e * 100} v.C. tot en met ${(-e - 1) * 100 + 1} v.C.`)

export interface QuestionChoix {
  question: string
  bonne: string
  options: string[]
  /** l'explication montrée après la réponse */
  uitleg: string
  /** la ligne de réponse mise en évidence (une année, une expression…) */
  sujet?: string
}

/** Une question Eeuwen pour un tijdvak : une année tirée dans le tijdvak, loin de ses bornes. */
export function questionEeuwen(i: number, h: Hasard = Math.random): QuestionChoix {
  const t = TIJDVAKKEN[i]
  // une année au hasard, sans les années de passage (476, 1492…), et jamais 0
  let j = entre(t.de + 3, t.tot - 3, h)
  if (t.de < -3000) j = -100 * entre(Math.ceil(-t.tot / 100) + 1, Math.floor(-t.de / 100), h) + entre(0, 99, h)   // dans la prehistorie, n'importe quelle année
  if (j === 0) j = 1
  const e = eeuwVan(j)
  const sorte = un(['eeuw', 'tijdvak', 'jaren'] as const, h)
  if (sorte === 'tijdvak') {
    const voisins = [TIJDVAKKEN[i - 1], TIJDVAKKEN[i + 1]].filter(Boolean)
    const autres = melange(TIJDVAKKEN.filter(x => x !== t && !voisins.includes(x)), h)
    const fausses = [...voisins, ...autres].slice(0, 3).map(x => x.nl)
    return { question: `In welk tijdvak valt het jaar ${jaartal(j)}?`, sujet: jaartal(j), bonne: t.nl, options: melange([t.nl, ...fausses], h), uitleg: `${jaartal(j)} valt in ${t.nl}: ${t.uitleg}.` }
  }
  if (sorte === 'jaren') {
    const juste = jarenVan(e)
    // les pièges : un siècle à côté (1400 tot en met 1499), le suivant, le précédent
    const decale = e > 0 ? `${(e - 1) * 100} tot en met ${e * 100 - 1}` : `${-e * 100 + 1} v.C. tot en met ${(-e - 1) * 100 + 2} v.C.`
    const fausses = [decale, jarenVan(e > 0 ? e + 1 : e - 1), jarenVan(e > 1 ? e - 1 : e > 0 ? -1 : e + 1 || 1)]
    return { question: `Welke jaren horen bij de ${eeuw(e)}?`, sujet: eeuw(e), bonne: juste, options: melange([juste, ...new Set(fausses)].slice(0, 4), h), uitleg: `De ${eeuw(e)}: ${juste}.` }
  }
  const juste = eeuw(e)
  // les pièges : le siècle d'à côté (oublier le « +1 »), le suivant, et l'autre côté de l'an 1
  const fausses = [eeuw(e > 0 ? e - 1 || 1 : e + 1 || -1), eeuw(e > 0 ? e + 1 : e - 1), eeuw(-e)]
  const centaines = Math.floor(Math.abs(j) / 100), reste = Math.abs(j) % 100
  const calcul = reste === 0
    ? `${Math.abs(j)} is het laatste jaar van de ${eeuw(e)}.`
    : `${Math.abs(j)}: ${centaines} honderdtallen + 1 = ${centaines + 1} → de ${eeuw(e)}.`
  return { question: `In welke eeuw valt het jaar ${jaartal(j)}?`, sujet: jaartal(j), bonne: juste, options: melange([juste, ...new Set(fausses.filter(f => f !== juste))].slice(0, 4), h), uitleg: calcul }
}

// ============================================================ Calcul mental
export interface QuestionCalcul {
  /** à calculer (réponse écrite) ou à choisir (options) */
  question: string
  sujet: string
  bonne: string
  options?: string[]
  explication: string
}
const fois = (a: number | string, b: number | string) => `${a} × ${b}`

/** Priorité des opérations : multiplications et divisions d'abord, de gauche à droite. */
function priorite(h: Hasard): QuestionCalcul {
  const a = entre(2, 30, h), b = entre(2, 9, h), c = entre(2, 9, h)
  const formes = [
    () => ({ e: `${a} + ${b} × ${c}`, r: a + b * c, x: `${b} × ${c} = ${b * c}, puis ${a} + ${b * c}` }),
    () => ({ e: `${a + b * c} − ${b} × ${c}`, r: a, x: `${b} × ${c} = ${b * c}, puis ${a + b * c} − ${b * c}` }),
    () => ({ e: `${a} + ${b * c} : ${c}`, r: a + b, x: `${b * c} : ${c} = ${b}, puis ${a} + ${b}` }),
    () => ({ e: `${b} × ${c} + ${a} × 2`, r: b * c + a * 2, x: `${b} × ${c} = ${b * c} et ${a} × 2 = ${a * 2}, puis ${b * c} + ${a * 2}` }),
  ]
  const f = un(formes, h)()
  return { question: 'Calcule (attention à la priorité des opérations)', sujet: f.e, bonne: String(f.r), explication: `${f.x} = ${f.r}. Les multiplications et divisions passent avant les additions et soustractions.` }
}
/** Parenthèses d'abord. */
function parentheses(h: Hasard): QuestionCalcul {
  const a = entre(2, 12, h), b = entre(2, 9, h), c = entre(2, 9, h), d = entre(1, 5, h)
  const formes = [
    () => ({ e: `(${a} + ${b}) × ${c}`, r: (a + b) * c, x: `${a} + ${b} = ${a + b}, puis ${a + b} × ${c}` }),
    () => ({ e: `${c} × (${a + d} − ${d})`, r: c * a, x: `${a + d} − ${d} = ${a}, puis ${c} × ${a}` }),
    () => ({ e: `(${a} + ${b}) × (${c} − ${Math.min(d, c - 1)})`, r: (a + b) * (c - Math.min(d, c - 1)), x: `${a} + ${b} = ${a + b} et ${c} − ${Math.min(d, c - 1)} = ${c - Math.min(d, c - 1)}, puis ${a + b} × ${c - Math.min(d, c - 1)}` }),
    () => ({ e: `${a} + (${b} × ${c} + ${d}) × 2`, r: a + (b * c + d) * 2, x: `${b} × ${c} + ${d} = ${b * c + d}, puis × 2 = ${(b * c + d) * 2}, puis ${a} + ${(b * c + d) * 2}` }),
  ]
  const f = un(formes, h)()
  return { question: 'Calcule (les parenthèses d’abord)', sujet: f.e, bonne: String(f.r), explication: `${f.x} = ${f.r}.` }
}
/** Distributivité simple : 7 × 18 = 7 × (20 − 2) = 140 − 14. */
function distributivite(h: Hasard): QuestionCalcul {
  const a = entre(3, 9, h), dizaines = entre(1, 9, h) * 10, u = entre(1, 3, h)
  const plus = h() < .5, b = plus ? dizaines + u : dizaines - u
  const x = plus
    ? `${fois(a, b)} = ${fois(a, `(${dizaines} + ${u})`)} = ${a * dizaines} + ${a * u} = ${a * b}`
    : `${fois(a, b)} = ${fois(a, `(${dizaines} − ${u})`)} = ${a * dizaines} − ${a * u} = ${a * b}`
  return { question: 'Calcule de tête, avec la distributivité', sujet: fois(a, b), bonne: String(a * b), explication: x }
}
const PHRASES_CODE = [
  (a: number, b: number) => ({ fr: `la somme de ${a} et de ${b}`, e: `${a} + ${b}`, faux: [`${a} × ${b}`, `${a} − ${b}`, `${b} − ${a}`] }),
  (a: number, b: number) => ({ fr: `la différence entre ${a + b} et ${b}`, e: `${a + b} − ${b}`, faux: [`${b} − ${a + b}`, `${a + b} + ${b}`, `${a + b} : ${b}`] }),
  (a: number, b: number) => ({ fr: `le produit de ${a} par ${b}`, e: fois(a, b), faux: [`${a} + ${b}`, `${a} : ${b}`, `${a} − ${b}`] }),
  (a: number, b: number) => ({ fr: `le quotient de ${a * b} par ${b}`, e: `${a * b} : ${b}`, faux: [`${b} : ${a * b}`, fois(a * b, b), `${a * b} − ${b}`] }),
  (a: number, b: number) => ({ fr: `le double de ${a} augmenté de ${b}`, e: `2 × ${a} + ${b}`, faux: [`2 × (${a} + ${b})`, `2 + ${a} + ${b}`, `${a} × ${b} + 2`] }),
  (a: number, b: number) => ({ fr: `le triple de la somme de ${a} et de ${b}`, e: `3 × (${a} + ${b})`, faux: [`3 × ${a} + ${b}`, `3 + ${a} + ${b}`, `${a} + 3 × ${b}`] }),
  (a: number, b: number) => ({ fr: `la somme du double de ${a} et du triple de ${b}`, e: `2 × ${a} + 3 × ${b}`, faux: [`2 × (${a} + 3) × ${b}`, `(2 + ${a}) × (3 + ${b})`, `3 × ${a} + 2 × ${b}`] }),
]
function coder(h: Hasard, decoder: boolean): QuestionCalcul {
  // deux nombres différents : « 5 − 5 » et « 5 − 5 » ne se distingueraient pas
  const a = entre(2, 12, h)
  let b = entre(2, 9, h)
  if (b === a) b = a === 9 ? 2 : a + 1
  const p = un(PHRASES_CODE, h)(a, b)
  if (decoder) {
    const fausses = PHRASES_CODE.filter(x => x !== null).map(f => f(entre(2, 12, h), entre(2, 9, h)).fr)
    // les fausses traductions : l'expression lue avec un autre mot d'opération
    const autres = [p.fr.replace(/\b(de )?la somme/, (_, de) => (de ? 'du produit' : 'le produit')).replace(/la différence entre (\d+) et/, 'la somme de $1 et de'), p.fr.replace('double', 'triple').replace('produit', 'quotient'), p.fr.replace('triple', 'double').replace('quotient', 'produit')]
      .filter(x => x !== p.fr)
    const options = [...new Set([p.fr, ...autres, ...fausses])].slice(0, 4)
    return { question: 'Décode : comment dit-on cette expression en français\u00a0?', sujet: p.e, bonne: p.fr, options: melange(options, h), explication: `${p.e} se dit « ${p.fr} ».` }
  }
  return { question: 'Code : quelle expression correspond à cette phrase\u00a0?', sujet: `« ${p.fr} »`, bonne: p.e, options: melange([...new Set([p.e, ...p.faux])], h), explication: `« ${p.fr} » se code ${p.e}.` }
}
const PROPRIETES = ['la commutativité', 'l’associativité', 'l’élément neutre', 'l’élément absorbant', 'la distributivité'] as const
function proprietes(h: Hasard): QuestionCalcul {
  const a = entre(2, 12, h), b = entre(2, 9, h), c = entre(2, 9, h)
  const cas = un([
    { e: `${a} + ${b} = ${b} + ${a}`, p: 0 }, { e: `${fois(a, b)} = ${fois(b, a)}`, p: 0 },
    { e: `(${a} + ${b}) + ${c} = ${a} + (${b} + ${c})`, p: 1 }, { e: `(${fois(a, b)}) × ${c} = ${a} × (${fois(b, c)})`, p: 1 },
    { e: `${a} + 0 = ${a}`, p: 2 }, { e: `${fois(a, 1)} = ${a}`, p: 2 },
    { e: `${fois(a, 0)} = 0`, p: 3 },
    { e: `${a} × (${b} + ${c}) = ${fois(a, b)} + ${fois(a, c)}`, p: 4 },
  ] as const, h)
  const bonne = PROPRIETES[cas.p]
  return { question: 'Quelle propriété est utilisée\u00a0?', sujet: cas.e, bonne, options: melange([bonne, ...melange(PROPRIETES.filter(x => x !== bonne), h).slice(0, 3)], h), explication: `${cas.e} : c’est ${bonne}.` }
}
/** De gauche à droite : multiplications et divisions entre elles, additions et soustractions entre elles. */
function gaucheDroite(h: Hasard): QuestionCalcul {
  const a = entre(2, 9, h), b = entre(2, 9, h), c = entre(2, 9, h), x = entre(30, 90, h), y = entre(5, 25, h)
  const formes = [
    () => ({ e: `${a * b} : ${b} × ${c}`, r: a * c, x: `${a * b} : ${b} = ${a}, puis ${a} × ${c}`, piege: `et pas ${a * b} : ${b * c}` }),
    () => ({ e: `${a * b * c} : ${b} : ${c}`, r: a, x: `${a * b * c} : ${b} = ${a * c}, puis ${a * c} : ${c}`, piege: '' }),
    () => ({ e: `${x} − ${y} + ${c}`, r: x - y + c, x: `${x} − ${y} = ${x - y}, puis ${x - y} + ${c}`, piege: `et pas ${x} − ${y + c}` }),
    () => ({ e: `${x} − ${y} − ${c}`, r: x - y - c, x: `${x} − ${y} = ${x - y}, puis ${x - y} − ${c}`, piege: '' }),
  ]
  const f = un(formes, h)()
  return { question: 'Calcule (de gauche à droite)', sujet: f.e, bonne: String(f.r), explication: `${f.x} = ${f.r}${f.piege ? ` (${f.piege})` : ''}. Multiplications et divisions se font de gauche à droite, comme additions et soustractions.` }
}
/** Les exposants (le E de PEMDAS) : après les parenthèses, avant les multiplications. */
function exposants(h: Hasard): QuestionCalcul {
  const a = entre(2, 9, h), b = entre(2, 9, h), c = entre(2, 5, h), d = entre(2, 6, h)
  const formes = [
    () => ({ e: `${a} + ${b}²`, r: a + b * b, x: `${b}² = ${b} × ${b} = ${b * b}, puis ${a} + ${b * b}` }),
    () => ({ e: `${c} × ${d}²`, r: c * d * d, x: `${d}² = ${d * d}, puis ${c} × ${d * d}`, piege: `et pas (${c} × ${d})² = ${(c * d) ** 2}` }),
    () => ({ e: `(${c} + ${d})²`, r: (c + d) ** 2, x: `${c} + ${d} = ${c + d}, puis ${c + d}² = ${c + d} × ${c + d}` }),
    () => ({ e: `${c}³ − ${a}`, r: c ** 3 - a, x: `${c}³ = ${c} × ${c} × ${c} = ${c ** 3}, puis ${c ** 3} − ${a}` }),
    () => ({ e: `2 × ${b}² + ${a}`, r: 2 * b * b + a, x: `${b}² = ${b * b}, puis 2 × ${b * b} = ${2 * b * b}, puis ${2 * b * b} + ${a}` }),
  ]
  const f: { e: string; r: number; x: string; piege?: string } = un(formes, h)()
  return { question: 'Calcule (attention aux exposants)', sujet: f.e, bonne: String(f.r), explication: `${f.x} = ${f.r}${f.piege ? ` (${f.piege})` : ''}. Les exposants passent après les parenthèses, avant les multiplications.` }
}
/** Calcul astucieux : changer l'ordre (commutativité) et grouper (associativité) pour faire 10, 100… */
function astucieux(h: Hasard): QuestionCalcul {
  const n = entre(3, 19, h)
  const paires = [[25, 4], [4, 25], [2, 5], [5, 2], [50, 2], [20, 5]] as const
  if (h() < .6) {
    const [p, q] = un(paires, h)
    return { question: 'Calcule de tête, en groupant astucieusement', sujet: `${p} × ${n} × ${q}`, bonne: String(p * q * n),
      explication: `On change l’ordre et on groupe : (${p} × ${q}) × ${n} = ${p * q} × ${n} = ${p * q * n} (commutativité et associativité).` }
  }
  const a = entre(11, 89, h), b = entre(11, 89, h), c = 100 - a
  return { question: 'Calcule de tête, en groupant astucieusement', sujet: `${a} + ${b} + ${c}`, bonne: String(100 + b),
    explication: `On change l’ordre et on groupe : (${a} + ${c}) + ${b} = 100 + ${b} = ${100 + b} (commutativité et associativité).` }
}
/** La distributivité dans l'autre sens : 7 × 23 + 7 × 77 = 7 × (23 + 77) = 700. */
function miseEnEvidence(h: Hasard): QuestionCalcul {
  const a = entre(3, 9, h), total = un([10, 100, 100, 1000], h)
  if (h() < .6) {
    const b = entre(1, total - 1, h), c = total - b
    return { question: 'Calcule de tête, avec la distributivité', sujet: `${fois(a, b)} + ${fois(a, c)}`, bonne: String(a * total),
      explication: `${fois(a, b)} + ${fois(a, c)} = ${fois(a, `(${b} + ${c})`)} = ${fois(a, total)} = ${a * total}.` }
  }
  const c = entre(1, total - 1, h), b = total + c
  return { question: 'Calcule de tête, avec la distributivité', sujet: `${fois(a, b)} − ${fois(a, c)}`, bonne: String(a * total),
    explication: `${fois(a, b)} − ${fois(a, c)} = ${fois(a, `(${b} − ${c})`)} = ${fois(a, total)} = ${a * total}.` }
}
/** Le vocabulaire du cours : terme, somme, différence, facteur, produit, dividende, diviseur, quotient. */
const PIEGES: Record<string, string[]> = {
  'un terme': ['la somme', 'la différence', 'un facteur'], 'la somme': ['un terme', 'le produit', 'la différence'],
  'la différence': ['un terme', 'la somme', 'le quotient'], 'un facteur': ['le produit', 'un terme', 'le diviseur'],
  'le produit': ['un facteur', 'la somme', 'le quotient'], 'le dividende': ['le diviseur', 'le quotient', 'le produit'],
  'le diviseur': ['le dividende', 'le quotient', 'un facteur'], 'le quotient': ['le dividende', 'le diviseur', 'le produit'],
}
function vocabulaire(h: Hasard): QuestionCalcul {
  // des nombres tous différents, pour qu'on sache duquel on parle
  const a = entre(6, 12, h), b = entre(2, 5, h), s = entre(20, 60, h), t = entre(3, 19, h)
  const cas = un([
    { e: `${s} + ${t} = ${s + t}`, n: s + t, bonne: 'la somme' },
    { e: `${s} + ${t} = ${s + t}`, n: t, bonne: 'un terme' },
    { e: `${s + t} − ${t} = ${s}`, n: s, bonne: 'la différence' },
    { e: `${fois(a, b)} = ${a * b}`, n: a * b, bonne: 'le produit' },
    { e: `${fois(a, b)} = ${a * b}`, n: b, bonne: 'un facteur' },
    { e: `${a * b} : ${b} = ${a}`, n: a * b, bonne: 'le dividende' },
    { e: `${a * b} : ${b} = ${a}`, n: b, bonne: 'le diviseur' },
    { e: `${a * b} : ${b} = ${a}`, n: a, bonne: 'le quotient' },
  ], h)
  return { question: `Dans ce calcul, comment s’appelle le nombre ${cas.n}\u00a0?`, sujet: cas.e, bonne: cas.bonne,
    options: melange([cas.bonne, ...PIEGES[cas.bonne]], h), explication: `Dans ${cas.e}, ${cas.n} est ${cas.bonne}.` }
}
export const CALCULS = [
  { id: 'priorite', fr: 'la priorité des opérations', faire: priorite },
  { id: 'parentheses', fr: 'les parenthèses', faire: parentheses },
  { id: 'distributivite', fr: 'la distributivité', faire: distributivite },
  { id: 'coder', fr: 'coder une phrase', faire: (h: Hasard) => coder(h, false) },
  { id: 'decoder', fr: 'décoder une expression', faire: (h: Hasard) => coder(h, true) },
  { id: 'proprietes', fr: 'les propriétés des opérations', faire: proprietes },
  // ajoutés ensuite : à la fin, pour garder la progression des cartes déjà là (leur clé est leur rang)
  { id: 'gauche-droite', fr: 'calculer de gauche à droite', faire: gaucheDroite },
  { id: 'exposants', fr: 'les exposants', faire: exposants },
  { id: 'astucieux', fr: 'le calcul astucieux', faire: astucieux },
  { id: 'mise-en-evidence', fr: 'la distributivité à l’envers', faire: miseEnEvidence },
  { id: 'vocabulaire', fr: 'le vocabulaire des opérations', faire: vocabulaire },
] as const
export const questionCalcul = (i: number, h: Hasard = Math.random) => CALCULS[i].faire(h)

// ============================================================ Natures des mots
export const NATURES = {
  nom: { nom: 'un nom', test: 'On peut mettre « un », « une » ou « des » devant ; il nomme un être, un objet, une idée.' },
  determinant: { nom: 'un déterminant', test: 'Il se place devant un nom pour former un groupe nominal (on peut le mettre devant « fille » ou « garçon »).' },
  adjectif: { nom: 'un adjectif', test: 'Il précise un nom ; on peut le mettre après « il est » ou « elle est », et on peut l’enlever.' },
  verbe: { nom: 'un verbe', test: 'Il se conjugue : on peut mettre « je », « tu » ou « il » devant.' },
  pronom: { nom: 'un pronom', test: 'Il remplace un nom ou un groupe nominal.' },
  adverbe: { nom: 'un adverbe', test: 'Il est invariable et complète un verbe, un adjectif ou un autre adverbe ; on peut souvent l’enlever.' },
  motlien: { nom: 'un mot-lien', test: 'Il est invariable et accroche des parties de phrase (préposition ou conjonction).' },
  interjection: { nom: 'une interjection', test: 'Elle exprime une émotion ou attire l’attention, souvent suivie de « ! ».' },
} as const
export type Nature = keyof typeof NATURES
const PHRASES = donneesNatures.phrases as [string, Nature | null][][]

export interface QuestionNature {
  /** la phrase, en morceaux ; « cible » : le mot dont on demande la nature */
  morceaux: { texte: string; cible?: boolean }[]
  bonne: string
  options: string[]
  explication: string
}
/** Une phrase avec un mot de cette nature, mis en évidence ; quatre natures proposées. */
export function questionNature(nature: Nature, h: Hasard = Math.random): QuestionNature {
  const candidates = PHRASES.flatMap((p, i) => p.map((m, j) => [i, j, m[1]] as const)).filter(x => x[2] === nature)
  const [i, j] = un(candidates, h)
  const morceaux: QuestionNature['morceaux'] = []
  PHRASES[i].forEach(([texte], k) => {
    // espaces à la française : rien avant la virgule et le point, une espace fine avant ! et ?, rien après l'apostrophe
    const avant = k === 0 || /^[.,]$/.test(texte) || /[’']$/.test(PHRASES[i][k - 1][0]) ? '' : /^[!?;:]$/.test(texte) ? ' ' : ' '
    if (avant) morceaux.push({ texte: avant })
    morceaux.push({ texte, ...(k === j && { cible: true }) })
  })
  const bonne = NATURES[nature].nom
  const autres = melange((Object.keys(NATURES) as Nature[]).filter(n => n !== nature), h).slice(0, 3).map(n => NATURES[n].nom)
  return { morceaux, bonne, options: melange([bonne, ...autres], h), explication: `« ${PHRASES[i][j][0]} » est ${bonne}. ${NATURES[nature].test}` }
}

// ============================================================ les chapitres
const CHAPITRES = [
  { matiere: /geschiedenis|histoire/i, chapitre: 'Eeuwen en tijdvakken', genere: 'eeuwen' as const,
    cartes: TIJDVAKKEN.map((t, i) => ({ cle: String(i), nl: t.nl, fr: t.fr })) },
  { matiere: /math/i, chapitre: 'Calcul mental (entraînement)', genere: 'calcul' as const,
    cartes: CALCULS.map((c, i) => ({ cle: String(i), nl: c.fr, fr: c.fr })) },
  { matiere: /fran[cç]ais|\bfrans\b/i, chapitre: 'Natures des mots (entraînement)', genere: 'natures' as const,
    cartes: (Object.keys(NATURES) as Nature[]).map(n => ({ cle: n, nl: NATURES[n].nom, fr: NATURES[n].nom })) },
  { matiere: /^nederlands$/i, chapitre: 'Voornaamwoorden (oefening)', genere: 'voornaamwoorden' as const,
    cartes: VOORNAAMWOORDEN.map((v, i) => ({ cle: String(i), nl: v.nl, fr: v.fr })) },
]
/** La notion d'une carte fabriquée (l'indice du tijdvak ou du calcul, la nature). */
export const cleDe = (m: Mot) => m.id.split('|').pop()!

/** Ajoute à chaque matière concernée les cartes de son exercice fabriqué (une seule fois). Leur chapitre n'est pas
 *  dans la liste des chapitres : il ne sert qu'à cet exercice, proposé dès que la matière est choisie. */
export function avecExercicesGeneres(voc: Vocabulaire): Vocabulaire {
  let matieres: Matiere[] = voc.matieres
  for (const c of CHAPITRES) {
    const i = matieres.findIndex(m => c.matiere.test(m.nom))
    if (i < 0 || matieres[i].mots.some(m => m.genere === c.genere)) continue
    const nom = matieres[i].nom
    const mots: Mot[] = c.cartes.map(k => ({
      id: `${nom}|${c.chapitre}|${k.cle}`, matiere: nom, chapitre: c.chapitre, nl: k.nl, det: '', fr: k.fr,
      definition: '', exemple: '', remarque: '', genere: c.genere,
    }))
    matieres = matieres.map((m, j) => (j === i ? { ...m, mots: [...m.mots, ...mots] } : m))
  }
  return matieres === voc.matieres ? voc : { ...voc, matieres }
}
