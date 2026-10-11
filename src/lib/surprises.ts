// Les surprises des mascottes (easter eggs validés dans la démo) : de temps en temps, une mascotte
// à l'écran joue une petite animation. Jamais moins de 30 secondes entre deux, souvent bien plus.
// Aussi dans les médaillons du menu des matières.
// Raccourci : S pour une surprise au hasard (sur une mascotte visible au hasard), Maj+S pour passer
// en revue celles de la mascotte du bloc « Commencer », dans un ordre au hasard (toutes avant de
// recommencer). Sur téléphone (et à la souris) : toucher cette mascotte fait la même chose.
// Treize surprises communes (dont sept avec le flambeau, dont la gigue), et deux propres à chaque mascotte.
import type { Mascotte } from './mascottes'

const NS = 'http://www.w3.org/2000/svg'
const TRAIT = '#26303d'
const MINUTE = 60_000

// les minuteries d'une surprise en cours, pour pouvoir l'interrompre proprement
const minuteries = new WeakMap<SVGSVGElement, number[]>()
const apres = (svg: SVGSVGElement, ms: number, f: () => void) => {
  minuteries.get(svg)?.push(window.setTimeout(f, ms))
}
const attendre = (svg: SVGSVGElement, ms: number) => new Promise<void>(r => apres(svg, ms, r))
// (une animation annulée par une interruption compte comme finie)
const anim = (el: Element | null, kf: Keyframe[], o: number | KeyframeAnimationOptions) =>
  el ? el.animate(kf, o).finished.then(() => {}, () => {}) : Promise.resolve()

// un petit dessin par-dessus la mascotte (coordonnées du dessin : 120 × 150), ou dans `dans`, ou juste avant `avant`
function ajout(svg: SVGSVGElement, markup: string, dans: Element = svg, avant: Element | null = null) {
  const g = document.createElementNS(NS, 'g')
  g.setAttribute('class', 'bulle')
  g.innerHTML = markup
  if (avant) avant.before(g)
  else dans.appendChild(g)
  return g
}
interface Envol { dx?: number; dy?: number; duree?: number; delai?: number; echelle?: number }
/** Un petit dessin qui apparaît en (x, y), s'envole et s'efface. */
function envol(svg: SVGSVGElement, markup: string, x: number, y: number, { dx = 10, dy = -30, duree = 1400, delai = 0, echelle = 1.3 }: Envol = {}) {
  apres(svg, delai, () => {
    const g = ajout(svg, `<g transform="translate(${x} ${y})"><g class="f" opacity="0">${markup}</g></g>`)
    anim(g.querySelector('.f'), [
      { transform: 'translate(0,0) scale(.5)', opacity: 0 },
      { transform: `translate(${dx * .3}px,${dy * .3}px) scale(1)`, opacity: 1, offset: .25 },
      { transform: `translate(${dx}px,${dy}px) scale(${echelle})`, opacity: 0 },
    ], { duration: duree, easing: 'ease-out' }).finally(() => g.remove())
  })
}
const texte = (t: string, taille = 14, style = '') => `<text text-anchor="middle" font-size="${taille}" fill="currentColor" ${style}>${t}</text>`
function etincelle(svg: SVGSVGElement, x: number, y: number, taille = 1) {
  const g = ajout(svg, `<g transform="translate(${x} ${y}) scale(${taille})"><path class="f" d="M0 -9 L2.5 -2.5 L9 0 L2.5 2.5 L0 9 L-2.5 2.5 L-9 0 L-2.5 -2.5 Z" fill="#ffd23f" stroke="${TRAIT}" stroke-width="1.2" stroke-linejoin="round"/></g>`)
  anim(g.querySelector('.f'), [{ transform: 'scale(.2) rotate(0)', opacity: 1 }, { transform: 'scale(1.4) rotate(90deg)', opacity: 0 }], { duration: 450, easing: 'ease-out' })
    .finally(() => g.remove())
}

// la bouche (ou le museau, ou la fente du heaume) de chaque mascotte
const BOUCHE: Record<Mascotte, [number, number]> = { renard: [60, 60], chevalier: [60, 52], colomb: [60, 54], detective: [60, 53.5], grenouille: [60, 58.5], moine: [60, 53], pythagore: [60, 51.5], moliere: [60, 54] }
const bouche = (svg: SVGSVGElement) => BOUCHE[svg.dataset.mascotte as Mascotte] ?? [60, 55]

/** Quelques ronds de fumée grise qui montent de (x, y). */
function fumee(svg: SVGSVGElement, x: number, y: number, n = 3, delai = 0, taille = 3) {
  for (let i = 0; i < n; i++) envol(svg, `<circle r="${taille + i * .8}" fill="#9aa3ae" opacity=".7"/>`, x, y, { dx: -6 + i * 6, dy: -20 - i * 6, duree: 1100, delai: delai + i * 130, echelle: 1.9 })
}
// une petite flamme, centrée sur sa base (0, 0)
const FLAMMECHE = `<path d="M0 -12 C6 -6 5.5 -1 0 1 C-5.5 -1 -6 -6 0 -12 Z" fill="#f08c1a" stroke="${TRAIT}" stroke-width="1.1" stroke-linejoin="round"/><path d="M0 -6.5 C2.6 -3.6 2.3 -1 0 .2 C-2.3 -1 -2.6 -3.6 0 -6.5 Z" fill="#ffd66b"/>`
/** Une flammèche qui s'allume en (x, y), crépite, puis s'éteint, entre `de` et `a` (ms). */
function petitFeu(svg: SVGSVGElement, x: number, y: number, de: number, a: number, { dans = svg as Element, taille = 1 } = {}) {
  const g = ajout(svg, `<g transform="translate(${x} ${y}) scale(${taille})"><g class="c" opacity="0">${FLAMMECHE}</g></g>`, dans)
  const crepite: Keyframe[] = []
  for (let t = .2; t < .85; t += .1) crepite.push({ transform: `scale(${1 + (Math.random() - .5) * .35}, ${1 + (Math.random() - .3) * .4}) rotate(${(Math.random() - .5) * 18}deg)`, opacity: 1, offset: t })
  anim(g.querySelector('.c'), [{ transform: 'scale(0)', opacity: 1 }, { transform: 'scale(1)', opacity: 1, offset: .15 }, ...crepite, { transform: 'scale(1)', opacity: 1, offset: .9 }, { transform: 'scale(0)', opacity: 0 }], { duration: a - de, delay: de })
    .finally(() => g.remove())
}
/** Des traits de souffle, de la bouche vers (vx, vy). */
function souffle(svg: SVGSVGElement, delai: number, vx = 26, vy = -16) {
  const [x, y] = bouche(svg)
  for (let i = 0; i < 3; i++) apres(svg, delai + i * 110, () => {
    const g = ajout(svg, `<path d="M0 0 q3 -2 6 0" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".6" transform="translate(${x + 5} ${y - 2 + (i - 1) * 3})"/>`)
    anim(g, [{ transform: 'translate(0,0)', opacity: 0 }, { transform: `translate(${vx * .3}px,${vy * .3}px)`, opacity: 1, offset: .3 }, { transform: `translate(${vx}px,${vy}px)`, opacity: 0 }], { duration: 500, easing: 'ease-out' })
      .finally(() => g.remove())
  })
}
/** De la suie sur le visage, sous les yeux (qui restent visibles) ; s'efface d'elle-même. */
function suie(svg: SVGSVGElement, delai: number, duree: number) {
  apres(svg, delai, () => {
    const yeux = svg.querySelector<SVGGElement>('.yeux')
    if (!yeux) return
    const b = yeux.getBBox(), cx = b.x + b.width / 2, cy = b.y + b.height / 2
    const taches = [[-6, -1, 6, 4.5], [5, 1, 6.5, 5], [0, 6, 7, 3.5], [-3, -5, 5, 3], [8, -4, 3.5, 2.5], [-9, 4, 3, 2.5]]
    const g = ajout(svg, taches.map(([x, y, rx, ry]) => `<ellipse cx="${cx + x}" cy="${cy + y}" rx="${rx}" ry="${ry}" fill="#2b2b2b"/>`).join(''), svg, yeux)
    anim(g, [{ opacity: 0 }, { opacity: .72, offset: .05 }, { opacity: .72, offset: .85 }, { opacity: 0 }], duree).finally(() => g.remove())
  })
}
/** Une explosion de petites boules de couleur en (x, y). */
function eclat(svg: SVGSVGElement, x: number, y: number, couleurs: string[], rayon = 16, n = 12) {
  const g = ajout(svg, `<g transform="translate(${x} ${y})">${tour(n, i => `<circle r="1.7" fill="${couleurs[i % couleurs.length]}" stroke="${TRAIT}" stroke-width=".4"/>`).join('')}<circle class="flash" r="4" fill="#fff6c8" opacity=".9"/></g>`)
  const boules = [...g.querySelectorAll('circle:not(.flash)')].map((c, i) => {
    const a = i / n * Math.PI * 2, r = rayon * (.8 + Math.random() * .4)
    return anim(c, [{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${Math.cos(a) * r * .8}px,${Math.sin(a) * r * .8}px) scale(1)`, opacity: 1, offset: .5 }, { transform: `translate(${Math.cos(a) * r}px,${Math.sin(a) * r + 6}px) scale(.4)`, opacity: 0 }], { duration: 950, easing: 'ease-out' })
  })
  anim(g.querySelector('.flash'), [{ transform: 'scale(.3)', opacity: .9 }, { transform: 'scale(2.2)', opacity: 0 }], 300)
  Promise.all(boules).finally(() => g.remove())
}
/** Les images clés de « coups » brefs aux instants donnés (0..1), entre deux repos. */
const coups = (instants: number[], au: string, repos = 'none', largeur = .06): Keyframe[] => [
  { transform: repos, offset: 0 },
  ...instants.flatMap(t => [{ transform: repos, offset: t - .02 }, { transform: au, offset: t }, { transform: repos, offset: t + largeur }]),
  { transform: repos, offset: 1 },
]

const parties = (svg: SVGSVGElement) => ({
  perso: svg.querySelector('.perso'), corps: svg.querySelector('.corps'), yeux: svg.querySelector('.yeux'),
  flambeau: svg.querySelector('.bras-d.repos .flambeau'), flamme: svg.querySelector('.bras-d.repos .flamme'),
  jg: svg.querySelector('.jambe.g'), jd: svg.querySelector('.jambe.d'),
})
const tour = <T,>(n: number, f: (i: number) => T) => Array.from({ length: n }, (_, i) => f(i))

interface Surprise {
  id: string
  pour?: Mascotte
  /** la surprise joue avec le flambeau : seulement si la mascotte le tient (dans le menu, seule celle de la matière choisie) */
  flambeau?: boolean
  /** ce qui bouge sort du cadre d'un médaillon (la queue du renard) : seulement en pied */
  enPied?: boolean
  /** les mascottes à qui cette surprise commune ne va pas */
  sauf?: Mascotte[]
  jouer: (svg: SVGSVGElement) => Promise<void>
}

// ---------- la gigue (danse irlandaise) : le haut du corps raide, tout dans les jambes ----------

const GIGUE_TEMPS = 300                       // un pas
const GIGUE_PAS = 8                           // huit pas, puis le grand saut
const GIGUE_D = GIGUE_TEMPS * GIGUE_PAS + 1100
const NOTE = (c: string) => `<g fill="${c}" stroke="${TRAIT}" stroke-width="1"><ellipse cx="0" cy="0" rx="3.4" ry="2.6" transform="rotate(-20)"/><path d="M3 -1 L3 -15 Q8 -13 9 -8 Q6 -11 4.5 -11 L4.5 -1 Z"/></g>`
const TREFLE = `<g stroke="${TRAIT}" stroke-width=".9" fill="#3aa05a"><circle cx="0" cy="-4" r="3.4"/><circle cx="-3.6" cy="1" r="3.4"/><circle cx="3.6" cy="1" r="3.4"/><path d="M0 1 Q1 6 3 9" fill="none" stroke="#2a7a40" stroke-width="1.6"/></g>`
/** Un éclat (étoile qui tourne et s'efface), à l'instant voulu, de la couleur voulue. */
function eclair(svg: SVGSVGElement, x: number, y: number, taille: number, couleur: string, delai: number) {
  apres(svg, delai, () => {
    const g = ajout(svg, `<g transform="translate(${x} ${y}) scale(${taille})"><path class="f" d="M0 -9 L2.5 -2.5 L9 0 L2.5 2.5 L0 9 L-2.5 2.5 L-9 0 L-2.5 -2.5 Z" fill="${couleur}" stroke="${TRAIT}" stroke-width="1.2" stroke-linejoin="round"/></g>`)
    anim(g.querySelector('.f'), [{ transform: 'scale(.2) rotate(0)', opacity: 1 }, { transform: 'scale(1.4) rotate(90deg)', opacity: 0 }], { duration: 450, easing: 'ease-out' }).finally(() => g.remove())
  })
}

/**
 * Une gigue : huit petits sauts raides (coup de pied d'un côté, de l'autre, pied croisé derrière), notes et
 * trèfles qui s'envolent, puis le grand saut, talons claqués en l'air. Chaque mascotte y ajoute sa touche ;
 * avec le flambeau, il est lancé au grand saut et rattrapé à la réception.
 */
function gigue(svg: SVGSVGElement, { flambeau = false, delai = 0 } = {}): Promise<void> {
  const p = parties(svg), m = svg.dataset.mascotte as Mascotte
  const q = (sel: string) => svg.querySelector(sel)
  const T = GIGUE_TEMPS, N = GIGUE_PAS, D = GIGUE_D
  const h = m === 'grenouille' ? 2 : 1                    // la grenouille saute deux fois plus haut
  const o: KeyframeAnimationOptions = { duration: D, delay: delai, easing: 'linear' }
  const t = (i: number) => (i * T) / D
  const fin = (N * T) / D

  const perso: Keyframe[] = [{ transform: 'translateY(0) scale(1,1)', offset: 0 }]
  for (let i = 0; i < N; i++) {
    perso.push({ transform: `translateY(${-7 * h}px) scale(1,1)`, offset: t(i) + .4 * T / D, easing: 'ease-in' })
    perso.push({ transform: 'translateY(0) scale(1.03,.97)', offset: t(i + 1) - .05 * T / D, easing: 'ease-out' })
  }
  perso.push({ transform: 'translateY(3px) scale(1.06,.9)', offset: fin + .08, easing: 'cubic-bezier(.2,.8,.3,1)' })
  perso.push({ transform: `translateY(${-30 * h}px) scale(.97,1.05)`, offset: fin + .17, easing: 'ease-in' })
  perso.push({ transform: 'translateY(0) scale(1.07,.92)', offset: fin + .25, easing: 'ease-out' })
  perso.push({ transform: 'translateY(0) scale(1,1)', offset: 1 })
  anim(svg.querySelector('.ombre-sol'), perso.map(k => ({ offset: k.offset, transform: String(k.transform).includes('-') ? 'scale(.75)' : 'scale(1)' })), o)

  // les jambes : à gauche, à droite, croisée derrière… puis ouvertes en l'air et talons claqués
  const motif = [[22, 0], [0, -22], [-10, 0], [0, 10], [22, 0], [0, -22], [26, 0], [0, -26]]
  ;([[p.jg, 0], [p.jd, 1]] as const).forEach(([jambe, k]) => {
    const kf: Keyframe[] = [{ transform: 'rotate(0)', offset: 0 }]
    motif.forEach((a, i) => {
      kf.push({ transform: `rotate(${a[k]}deg)`, offset: t(i) + .45 * T / D })
      kf.push({ transform: 'rotate(0)', offset: t(i + 1) - .02 * T / D })
    })
    kf.push({ transform: `rotate(${k ? -24 : 24}deg)`, offset: fin + .13 }, { transform: `rotate(${k ? 8 : -8}deg)`, offset: fin + .17 },
      { transform: `rotate(${k ? -6 : 6}deg)`, offset: fin + .19 }, { transform: 'rotate(0)', offset: fin + .25 }, { transform: 'rotate(0)', offset: 1 })
    anim(jambe, kf, o)
  })
  // le regard fixe, menton levé
  anim(p.yeux, [{ transform: 'translateY(0)' }, { transform: 'translateY(-1px)', offset: .05 }, { transform: 'translateY(-1px)', offset: .95 }, { transform: 'translateY(0)' }], o)
  // notes et trèfles au rythme, de chaque côté
  for (let i = 0; i < N; i += 2) {
    const gauche = (i / 2) % 2 === 0
    envol(svg, i % 4 === 0 ? TREFLE : NOTE(['#1f5fbf', '#c0506a', '#2f8c88'][(i / 2) % 3]), gauche ? 30 : 92, 60, { dx: gauche ? -14 : 14, dy: -40, duree: 1300, delai: delai + i * T + 100, echelle: 1.2 })
  }
  // les talons qui claquent, puis la réception
  eclair(svg, 60, 112, .8, '#fff6c8', delai + D * (fin + .18))
  eclair(svg, 46, 140, .9, '#ffd23f', delai + D * (fin + .25))
  eclair(svg, 76, 138, .7, '#ffd23f', delai + D * (fin + .27))

  if (flambeau) anim(p.flambeau, [
    { transform: 'translate(0,0) rotate(0)', offset: 0 }, { transform: 'translate(0,0) rotate(0)', offset: fin + .1 },
    { transform: 'translate(-6px,-34px) rotate(360deg)', offset: fin + .19, easing: 'ease-out' },
    { transform: 'translate(0,0) rotate(720deg)', offset: fin + .28, easing: 'ease-in' }, { transform: 'translate(0,0) rotate(720deg)', offset: 1 },
  ], o)

  // la touche de chacun : une petite secousse à chaque pas
  const aChaquePas = (f: (i: number) => string) => {
    const kf: Keyframe[] = [{ transform: 'none', offset: 0 }]
    for (let i = 0; i < N; i++) kf.push({ transform: f(i), offset: t(i) + .5 * T / D }, { transform: 'none', offset: t(i + 1) })
    return [...kf, { transform: 'none', offset: 1 }]
  }
  if (m === 'renard') anim(q('.queue'), aChaquePas(i => `rotate(${i % 2 ? -14 : 18}deg)`), o)
  if (m === 'chevalier') {
    anim(q('.drapeau'), aChaquePas(i => `scaleX(${i % 2 ? .85 : 1.08}) skewY(${i % 2 ? -8 : 8}deg)`), o)
    for (let i = 0; i < N; i++) eclair(svg, i % 2 ? 72 : 48, 118, .45, '#ffffff', delai + (i + 1) * T - 20)
  }
  if (m === 'colomb') anim(q('.chapeau'), aChaquePas(() => 'translateY(-5px) rotate(-6deg)'), { ...o, delay: delai + T * .35 })
  if (m === 'detective') anim(q('.loupe'), aChaquePas(i => `rotate(${i % 2 ? 12 : -16}deg)`), o)
  if (m === 'moine') anim(p.corps, aChaquePas(i => `skewX(${i % 2 ? 4 : -4}deg)`), o)
  if (m === 'pythagore') anim(q('.laurier'), aChaquePas(() => 'translateY(-4px) rotate(4deg)'), { ...o, delay: delai + T * .3 })
  if (m === 'moliere') svg.querySelectorAll('.perruque').forEach(g => anim(g, [
    ...aChaquePas(() => 'translateY(-4px)').slice(0, -1),
    { transform: 'translateY(-10px)', offset: fin + .19 }, { transform: 'translate(1px,1px) rotate(-9deg)', offset: fin + .25 },
    { transform: 'translate(1px,1px) rotate(-9deg)', offset: .975 }, { transform: 'none', offset: 1 },
  ], { ...o, delay: delai + T * .25 }))
  return anim(p.perso, perso, o)
}

/**
 * La gigue de toute la troupe : les autres mascottes de la même scène (plusieurs matières choisies)
 * dansent avec celle-ci, en synchro ou en canon (deux pas de décalage chacune).
 */
async function gigueEnTroupe(svg: SVGSVGElement, flambeau: boolean) {
  const scene = svg.closest('.scene-mascottes, .scene-mini')
  const autres = scene ? [...scene.querySelectorAll<SVGSVGElement>('svg.mascotte[data-mascotte]')].filter(x => x !== svg && !x.dataset.surprise && !x.dataset.saute) : []
  const canon = autres.length > 0 && Math.random() < .5
  autres.forEach((x, i) => {
    x.dataset.surprise = 'gigue'
    minuteries.set(x, [])
    gigue(x, { flambeau: flambeau && tientLeFlambeau(x), delai: canon ? (i + 1) * GIGUE_TEMPS * 2 : 0 })
      .finally(() => { if (x.dataset.surprise === 'gigue') { minuteries.delete(x); delete x.dataset.surprise } })
  })
  await gigue(svg, { flambeau })
}

export const SURPRISES: Surprise[] = [
  // elle lance le flambeau, qui fait deux tours en l'air, le suit des yeux et le rattrape
  { id: 'jonglage', flambeau: true, async jouer(svg) {
    const p = parties(svg), D = 1300
    anim(p.yeux, [{ transform: 'translate(0,0)' }, { transform: 'translate(1px,-2px)', offset: .15 }, { transform: 'translate(1px,-2.5px)', offset: .75 }, { transform: 'translate(0,0)' }], D)
    anim(p.perso, [{ transform: 'scale(1,1)' }, { transform: 'scale(1,1)', offset: .86 }, { transform: 'scale(1.04,.95)', offset: .92 }, { transform: 'scale(1,1)' }], D)
    await anim(p.flambeau, [
      { transform: 'translate(0,0) rotate(0)', easing: 'cubic-bezier(.2,.7,.4,1)' },
      { transform: 'translate(-4px,-48px) rotate(360deg)', offset: .45, easing: 'cubic-bezier(.6,0,.8,.3)' },
      { transform: 'translate(0,0) rotate(720deg)', offset: .88 },
      { transform: 'translate(0,0) rotate(720deg)' },
    ], D)
  } },

  // deux inspirations, l'éternuement souffle la flamme, un peu de fumée, puis elle se rallume
  { id: 'atchoum', flambeau: true, async jouer(svg) {
    const p = parties(svg), D = 2400
    anim(p.yeux, [{ transform: 'scaleY(1)' }, { transform: 'scaleY(1)', offset: .32 }, { transform: 'scaleY(.12)', offset: .4 }, { transform: 'scaleY(.12)', offset: .6 }, { transform: 'scaleY(1)', offset: .66 }, { transform: 'scaleY(1)' }], D)
    anim(p.flamme, [{ transform: 'scale(1)' }, { transform: 'scale(1)', offset: .5 }, { transform: 'scale(0)', offset: .53 }, { transform: 'scale(0)', offset: .82 }, { transform: 'scale(1.35)', offset: .88 }, { transform: 'scale(1)' }], D)
    for (let i = 0; i < 3; i++) envol(svg, `<circle r="${3 + i}" fill="#9aa3ae" opacity=".7"/>`, 92, 38, { dx: -6 + i * 7, dy: -26 - i * 6, duree: 1100, delai: D * .53 + i * 140, echelle: 1.8 })
    envol(svg, texte('atchoum !', 11, 'font-style="italic"'), 34, 30, { dx: -6, dy: -14, duree: 1000, delai: D * .53 })
    apres(svg, D * .83, () => etincelle(svg, 92, 30))
    await anim(p.perso, [
      { transform: 'rotate(0) scale(1,1)' },
      { transform: 'rotate(-3deg) scale(1,1.03)', offset: .16 },
      { transform: 'rotate(-1deg) scale(1,1)', offset: .26 },
      { transform: 'rotate(-6deg) scale(1,1.05)', offset: .46, easing: 'cubic-bezier(.7,0,1,.5)' },
      { transform: 'translateX(3px) rotate(8deg) scale(1.03,.95)', offset: .53 },
      { transform: 'rotate(0) scale(1,1)', offset: .66 },
      { transform: 'rotate(0) scale(1,1)' },
    ], D)
  } },

  // quatre pas chaloupés, jambes alternées, et quelques notes de musique
  { id: 'danse', async jouer(svg) {
    const p = parties(svg), D = 2400
    anim(p.jg, [...tour(4, i => ({ transform: `rotate(${i % 2 ? 0 : 18}deg)` })), { transform: 'rotate(0)' }], D)
    anim(p.jd, [...tour(4, i => ({ transform: `rotate(${i % 2 ? -18 : 0}deg)` })), { transform: 'rotate(0)' }], D)
    envol(svg, texte('♪', 16), 24, 50, { dx: -8, dy: -30, duree: 1300 })
    envol(svg, texte('♫', 16), 104, 22, { dx: 8, dy: -24, duree: 1300, delai: 600 })
    envol(svg, texte('♪', 13), 30, 30, { dx: -10, dy: -24, duree: 1300, delai: 1200 })
    await anim(p.perso, [
      ...tour(4, i => [{ transform: 'translateY(0) rotate(0)' }, { transform: `translateY(-6px) rotate(${i % 2 ? 7 : -7}deg)`, easing: 'ease-in' }]).flat(),
      { transform: 'translateY(0) rotate(0)' },
    ], { duration: D, easing: 'ease-in-out' })
  } },

  // un coup d'œil à gauche, puis à droite, comme si quelqu'un approchait
  { id: 'regard', async jouer(svg) {
    const p = parties(svg), D = 2600
    anim(p.corps, [{ transform: 'rotate(0)' }, { transform: 'rotate(-2deg)', offset: .12 }, { transform: 'rotate(-2deg)', offset: .4 }, { transform: 'rotate(2deg)', offset: .52 }, { transform: 'rotate(2deg)', offset: .8 }, { transform: 'rotate(0)', offset: .9 }, { transform: 'rotate(0)' }], D)
    await anim(p.yeux, [{ transform: 'translateX(0)' }, { transform: 'translateX(-2.6px)', offset: .1 }, { transform: 'translateX(-2.6px)', offset: .4 }, { transform: 'translateX(2.6px)', offset: .5 }, { transform: 'translateX(2.6px)', offset: .8 }, { transform: 'translateX(0)', offset: .88 }, { transform: 'translateX(0)' }], D)
  } },

  // les yeux se ferment, elle pique du nez, la flamme baisse, des « z » s'envolent… puis elle sursaute
  { id: 'sieste', async jouer(svg) {
    const p = parties(svg), D = 5000
    anim(p.yeux, [{ transform: 'scaleY(1)' }, { transform: 'scaleY(.12)', offset: .1 }, { transform: 'scaleY(.12)', offset: .78 }, { transform: 'scaleY(1.2)', offset: .8 }, { transform: 'scaleY(1)' }], D)
    anim(p.corps, [{ transform: 'rotate(0) translateY(0)' }, { transform: 'rotate(4deg) translateY(2px)', offset: .3 }, { transform: 'rotate(5deg) translateY(2.5px)', offset: .78 }, { transform: 'rotate(0) translateY(0)', offset: .8 }, { transform: 'rotate(0)' }], D)
    anim(p.flamme, [{ transform: 'scale(1)' }, { transform: 'scale(.5)', offset: .3 }, { transform: 'scale(.5)', offset: .78 }, { transform: 'scale(1.3)', offset: .82 }, { transform: 'scale(1)' }], D)
    ;[.18, .36, .54].forEach((t, i) => envol(svg, texte('z', 10 + i * 2), 76, 30, { dx: 16, dy: -28, duree: 1500, delai: t * D, echelle: 1.6 }))
    envol(svg, texte('!', 22), 60, 10, { dx: 0, dy: -10, duree: 900, delai: D * .79, echelle: 1.1 })
    await anim(p.perso, [{ transform: 'translateY(0)' }, { transform: 'translateY(0)', offset: .78 }, { transform: 'translateY(-10px)', offset: .83 }, { transform: 'translateY(0)', offset: .9 }, { transform: 'translateY(0)' }], D)
  } },

  // Reynaert remue la queue en se dandinant, et un petit cœur s'envole
  { id: 'queue', pour: 'renard', enPied: true, async jouer(svg) {
    const p = parties(svg), D = 1800
    envol(svg, `<path d="M0 3 C-6 -2 -4 -7 0 -4 C4 -7 6 -2 0 3 Z" fill="#e0607e" stroke="${TRAIT}" stroke-width="1"/>`, 30, 70, { dx: -6, dy: -40, duree: 1500, delai: 300, echelle: 1.6 })
    anim(p.perso, [...tour(4, i => [{ transform: 'rotate(0)' }, { transform: `rotate(${i % 2 ? 2 : -2}deg)` }]).flat(), { transform: 'rotate(0)' }], D)
    await anim(svg.querySelector('.queue'), [0, 14, -10, 14, -10, 14, -10, 0].map(d => ({ transform: `rotate(${d}deg)` })), { duration: D, easing: 'ease-in-out' })
  } },

  // une rafale : la bannière et le panache du chevalier claquent au vent, il se redresse, fier
  { id: 'banniere', pour: 'chevalier', async jouer(svg) {
    const p = parties(svg), D = 2000
    ;[18, 28, 12].forEach((y, i) => {
      const g = ajout(svg, `<path d="M0 ${y} q8 -3 16 0 t16 0" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round" opacity="0"/>`)
      anim(g.firstElementChild, [{ transform: 'translateX(-30px)', opacity: 0 }, { transform: 'translateX(20px)', opacity: .5, offset: .4 }, { transform: 'translateX(110px)', opacity: 0 }], { duration: 1000, delay: i * 180, easing: 'ease-in' })
        .finally(() => g.remove())
    })
    anim(svg.querySelector('.drapeau'), [{ transform: 'none' }, ...tour(6, i => ({ transform: `scaleX(${i % 2 ? .85 : 1.08}) skewY(${i % 2 ? -7 : 9}deg)` })), { transform: 'none' }], { duration: D, easing: 'ease-in-out' })
    anim(svg.querySelector('.plume'), [{ transform: 'rotate(0)' }, ...tour(5, i => ({ transform: `rotate(${i % 2 ? -4 : 10}deg)` })), { transform: 'rotate(0)' }], D)
    await anim(p.perso, [{ transform: 'scale(1,1)' }, { transform: 'scale(.98,1.04)', offset: .25 }, { transform: 'scale(.98,1.04)', offset: .8 }, { transform: 'scale(1,1)' }], D)
  } },

  // Colomb soulève son chapeau pour saluer, avec une petite courbette
  { id: 'chapeau', pour: 'colomb', async jouer(svg) {
    const p = parties(svg), D = 1900
    anim(p.yeux, [{ transform: 'scaleY(1)' }, { transform: 'scaleY(.25)', offset: .25 }, { transform: 'scaleY(.25)', offset: .62 }, { transform: 'scaleY(1)', offset: .72 }, { transform: 'scaleY(1)' }], D)
    anim(p.corps, [{ transform: 'rotate(0)' }, { transform: 'rotate(-5deg) translateY(2px)', offset: .3 }, { transform: 'rotate(-5deg) translateY(2px)', offset: .62 }, { transform: 'rotate(0)', offset: .8 }, { transform: 'rotate(0)' }], D)
    await anim(svg.querySelector('.chapeau'), [
      { transform: 'translate(0,0) rotate(0)' },
      { transform: 'translate(-12px,-16px) rotate(-28deg)', offset: .28, easing: 'ease-out' },
      { transform: 'translate(-13px,-17px) rotate(-22deg)', offset: .45 },
      { transform: 'translate(-12px,-16px) rotate(-28deg)', offset: .62, easing: 'ease-in' },
      { transform: 'translate(0,1px) rotate(2deg)', offset: .82 },
      { transform: 'translate(0,0) rotate(0)' },
    ], D)
  } },

  // la détective balaie les alentours à la loupe, les yeux suivent… indice trouvé !
  { id: 'loupe', pour: 'detective', async jouer(svg) {
    const p = parties(svg), D = 2800
    anim(p.yeux, [{ transform: 'translate(0,0)' }, { transform: 'translate(-2.6px,1px)', offset: .15 }, { transform: 'translate(-2.6px,-1.5px)', offset: .4 }, { transform: 'translate(-1.5px,1px)', offset: .62 }, { transform: 'translate(0,0) scale(1.25)', offset: .75 }, { transform: 'translate(0,0) scale(1.25)', offset: .9 }, { transform: 'translate(0,0)' }], D)
    envol(svg, texte('!', 22), 26, 40, { dx: 0, dy: -18, duree: 900, delai: D * .7, echelle: 1.15 })
    await anim(svg.querySelector('.loupe'), [
      { transform: 'rotate(0) scale(1)' },
      { transform: 'rotate(-28deg) scale(1)', offset: .18 },
      { transform: 'rotate(14deg) scale(1)', offset: .42 },
      { transform: 'rotate(-10deg) scale(1)', offset: .6 },
      { transform: 'rotate(4deg) scale(1.25)', offset: .72 },
      { transform: 'rotate(4deg) scale(1.25)', offset: .88 },
      { transform: 'rotate(0) scale(1)' },
    ], { duration: D, easing: 'ease-in-out' })
  } },

  // une mouche tourne autour de la grenouille, qui la suit des yeux et… slurp
  { id: 'mouche', pour: 'grenouille', async jouer(svg) {
    const p = parties(svg), D = 2600
    const mouche = ajout(svg, `<g><ellipse cx="-1.5" cy="-2.5" rx="2.6" ry="1.5" fill="#dfeef7" stroke="${TRAIT}" stroke-width=".7" transform="rotate(-30 -1.5 -2.5)"/><ellipse cx="1.5" cy="-2.5" rx="2.6" ry="1.5" fill="#dfeef7" stroke="${TRAIT}" stroke-width=".7" transform="rotate(30 1.5 -2.5)"/><circle r="2" fill="${TRAIT}"/></g>`)
    const vol = anim(mouche.firstElementChild, [
      { transform: 'translate(-20px,10px)' }, { transform: 'translate(4px,30px)', offset: .15 }, { transform: 'translate(14px,6px)', offset: .3 },
      { transform: 'translate(26px,26px)', offset: .45 }, { transform: 'translate(18px,24px)', offset: .58 },
      { transform: 'translate(18px,24px)', offset: .64 }, { transform: 'translate(58px,56px)', offset: .72, easing: 'ease-in' }, { transform: 'translate(60px,57px)', opacity: 0 },
    ], { duration: D, fill: 'forwards' }).finally(() => mouche.remove())
    anim(p.yeux, [{ transform: 'translate(0,0)' }, { transform: 'translate(-2px,-1px)', offset: .15 }, { transform: 'translate(-1.5px,-2px)', offset: .3 }, { transform: 'translate(-1px,-.5px)', offset: .45 }, { transform: 'translate(-1.5px,-1px)', offset: .58 }, { transform: 'scaleY(.3)', offset: .78 }, { transform: 'scaleY(.3)', offset: .92 }, { transform: 'none' }], D)
    await attendre(svg, D * .59)
    const lg = Math.hypot(42, 33)
    const langue = ajout(svg, `<line x1="60" y1="57" x2="18" y2="24" stroke="${TRAIT}" stroke-width="4.2" stroke-linecap="round"/><line x1="60" y1="57" x2="18" y2="24" stroke="#e0607e" stroke-width="2.6" stroke-linecap="round"/>`)
    langue.querySelectorAll('line').forEach(l => {
      l.style.strokeDasharray = String(lg)
      anim(l, [{ strokeDashoffset: lg }, { strokeDashoffset: 0, offset: .4 }, { strokeDashoffset: 0, offset: .5 }, { strokeDashoffset: lg }], { duration: D * .14, fill: 'forwards' })
    })
    await attendre(svg, D * .15)
    langue.remove()
    anim(p.corps, [{ transform: 'scale(1,1)' }, { transform: 'scale(1.06,.95)', offset: .3 }, { transform: 'scale(.98,1.02)', offset: .6 }, { transform: 'scale(1,1)' }], 500)
    await vol
  } },

  // le moine ferme les yeux et chante à pleine voix, en se balançant : les notes s'envolent
  { id: 'chant', pour: 'moine', async jouer(svg) {
    const p = parties(svg), D = 3200
    const [x, y] = bouche(svg)
    const o = ajout(svg, `<ellipse cx="${x}" cy="${y}" rx="3.4" ry="3" fill="#7a2a22" stroke="${TRAIT}" stroke-width="1.3"/>`)
    anim(o, [{ transform: 'scale(1)', opacity: 1 }, ...tour(8, i => ({ transform: `scale(${i % 2 ? .7 : 1.15})`, opacity: 1 })), { transform: 'scale(1)', opacity: 0 }], { duration: D, easing: 'ease-in-out' })
      .then(() => o.remove())
    o.style.transformOrigin = `${x}px ${y}px`
    tour(6, i => envol(svg, `<text text-anchor="middle" font-size="${13 + (i % 3) * 2}" font-weight="700" fill="${['#6b4a2e', '#c0506a', '#2f6db0'][i % 3]}" stroke="${TRAIT}" stroke-width=".4">${i % 2 ? '♫' : '♪'}</text>`, x + (i % 2 ? 8 : -6), y - 6, { dx: i % 2 ? 18 : -16, dy: -34, duree: 1500, delai: 150 + i * 420, echelle: 1.2 }))
    await anim(p.corps, [{ transform: 'rotate(0)' }, ...tour(6, i => ({ transform: `rotate(${i % 2 ? -4 : 4}deg) translateY(${i % 2 ? 0 : -1}px)` })), { transform: 'rotate(0)' }], { duration: D, easing: 'ease-in-out' })
  } },

  // Pythagore réfléchit, les yeux en l'air : des symboles s'envolent de sa tête… Eurêka ! petit saut de joie
  { id: 'eureka', pour: 'pythagore', async jouer(svg) {
    const p = parties(svg), D = 3400
    const symboles = ['π', '+', '²', '×', '√', '=']
    symboles.forEach((c, i) => envol(svg, `<text text-anchor="middle" font-size="${12 + (i % 2) * 3}" font-weight="700" fill="${['#2f6db0', '#c0506a', '#2f8c88'][i % 3]}" stroke="${TRAIT}" stroke-width=".4">${c}</text>`, 60 + (i % 2 ? 10 : -10), 26, { dx: i % 2 ? 14 : -14, dy: -26, duree: 1200, delai: 100 + i * 260, echelle: 1.3 }))
    envol(svg, `<text text-anchor="middle" font-size="13" font-weight="800" fill="#e2681f" stroke="${TRAIT}" stroke-width=".5">Eurêka !</text>`, 60, 18, { dx: 0, dy: -16, duree: 1300, delai: D * .62, echelle: 1.25 })
    apres(svg, D * .64, () => { etincelle(svg, 40, 20); etincelle(svg, 82, 16, .8); etincelle(svg, 50, 6, .7) })
    anim(p.yeux, [{ transform: 'none' }, { transform: 'translate(1.5px,-2.5px)', offset: .12 }, { transform: 'translate(-1.5px,-2.5px)', offset: .35 }, { transform: 'translate(1px,-2.5px)', offset: .55 }, { transform: 'scale(1.3)', offset: .64 }, { transform: 'scale(1.3)', offset: .8 }, { transform: 'none' }], D)
    await anim(p.perso, [{ transform: 'translateY(0)' }, { transform: 'translateY(0)', offset: .6 }, { transform: 'translateY(3px) scale(1.04,.95)', offset: .64 }, { transform: 'translateY(-12px)', offset: .72 }, { transform: 'translateY(0) scale(1.04,.95)', offset: .8 }, { transform: 'translateY(0)', offset: .86 }, { transform: 'translateY(0)' }], D)
  } },

  // Molière déclame : les lettres s'envolent de sa bouche, il agite sa plume… et finit par une révérence
  { id: 'tirade', pour: 'moliere', async jouer(svg) {
    const p = parties(svg), D = 3600
    const [x, y] = bouche(svg)
    ;['A', 'é', 'ç', '!', 'Ô', '?'].forEach((c, i) => envol(svg, `<text text-anchor="middle" font-size="${12 + (i % 3) * 2}" font-weight="800" font-family="serif" fill="${['#6b3a7a', '#c0506a', '#2f6db0'][i % 3]}" stroke="${TRAIT}" stroke-width=".4">${c}</text>`, x - 6, y, { dx: -18 - (i % 2) * 8, dy: -22 - (i % 3) * 6, duree: 1200, delai: 120 + i * 300, echelle: 1.3 }))
    anim(svg.querySelector('.plume-oie'), [{ transform: 'rotate(0)' }, { transform: 'rotate(-14deg)', offset: .15 }, { transform: 'rotate(8deg)', offset: .3 }, { transform: 'rotate(-14deg)', offset: .45 }, { transform: 'rotate(0)', offset: .6 }, { transform: 'rotate(0)' }], D)
    anim(p.yeux, [{ transform: 'none' }, { transform: 'translate(-1px,-1.5px)', offset: .15 }, { transform: 'translate(-1px,-1.5px)', offset: .58 }, { transform: 'scaleY(.25)', offset: .7 }, { transform: 'scaleY(.25)', offset: .9 }, { transform: 'none' }], D)
    await anim(p.corps, [{ transform: 'rotate(0)' }, { transform: 'rotate(-4deg)', offset: .15 }, { transform: 'rotate(3deg)', offset: .3 }, { transform: 'rotate(-4deg)', offset: .45 }, { transform: 'rotate(0)', offset: .58 },
      { transform: 'rotate(-14deg) translate(-2px,6px)', offset: .72 }, { transform: 'rotate(-14deg) translate(-2px,6px)', offset: .86 }, { transform: 'rotate(0)' }], { duration: D, easing: 'ease-in-out' })
  } },

  // ---------- deuxième série (démo du 9 octobre) : surtout avec le feu du flambeau ----------

  // la flamme s'agite de plus en plus, la mascotte la surveille… pouf ! visage noirci, deux clignements ahuris
  { id: 'pouf', flambeau: true, async jouer(svg) {
    const p = parties(svg), D = 3400
    apres(svg, D * .38, () => { eclat(svg, 92, 28, ['#ffd23f', '#f08c1a', '#ffb347'], 18, 10); fumee(svg, 92, 30, 3, 100, 4) })
    suie(svg, D * .39, D * .56)
    apres(svg, D * .45, () => { const y = svg.querySelector<SVGGElement>('.yeux')?.getBBox().y ?? 40; fumee(svg, 58, y - 12, 3, 0, 2.2) })
    apres(svg, D * .84, () => etincelle(svg, 92, 30))
    anim(p.yeux, [{ transform: 'none' }, { transform: 'translate(2px,-1px)', offset: .06 }, { transform: 'translate(2px,-1px)', offset: .36 }, { transform: 'scaleY(.1)', offset: .39 }, { transform: 'scale(1.25)', offset: .46 }, { transform: 'scale(1.25)', offset: .58 }, { transform: 'scaleY(.1)', offset: .61 }, { transform: 'scale(1.25)', offset: .64 }, { transform: 'scale(1.25)', offset: .7 }, { transform: 'scaleY(.1)', offset: .73 }, { transform: 'none', offset: .77 }, { transform: 'none' }], D)
    anim(p.perso, [{ transform: 'rotate(0)' }, { transform: 'rotate(0)', offset: .37 }, { transform: 'translateX(-4px) rotate(-8deg)', offset: .4 }, { transform: 'rotate(-2deg)', offset: .48 }, { transform: 'rotate(0)', offset: .56 }, { transform: 'rotate(0)' }], D)
    await anim(p.flamme, [{ transform: 'scale(1)' }, { transform: 'scale(1.2,.9) rotate(8deg)', offset: .06 }, { transform: 'scale(.9,1.3) rotate(-10deg)', offset: .12 }, { transform: 'scale(1.3,1) rotate(6deg)', offset: .18 }, { transform: 'scale(.8,1.4) rotate(-12deg)', offset: .24 }, { transform: 'scale(1.5) rotate(4deg)', offset: .3 }, { transform: 'scale(1.9)', offset: .36 }, { transform: 'scale(0)', offset: .38 }, { transform: 'scale(0)', offset: .82 }, { transform: 'scale(1.3)', offset: .87 }, { transform: 'scale(1)' }], D)
  } },

  // la flamme souffle trois ronds de fumée ; le dernier, plus petit et plus rapide, passe à travers le précédent
  { id: 'ronds', flambeau: true, async jouer(svg) {
    const p = parties(svg), D = 3200
    const rond = (delai: number, dx: number, duree: number, taille: number) => apres(svg, delai, () => {
      const g = ajout(svg, `<g transform="translate(92 14)"><ellipse class="r" rx="${4 * taille}" ry="${1.8 * taille}" fill="none" stroke="#a7afba" stroke-width="1.6"/></g>`)
      anim(g.querySelector('.r'), [{ transform: 'translate(0,0) scale(.6)', opacity: 0 }, { transform: 'translate(0,-4px) scale(1)', opacity: .95, offset: .12 }, { transform: `translate(${dx}px,-44px) scale(2.4)`, opacity: 0 }], { duration: duree, easing: 'ease-out' })
        .finally(() => g.remove())
    })
    rond(D * .12, -10, 1700, 1)
    rond(D * .36, -16, 1800, 1)
    rond(D * .5, -16, 1100, .7)
    anim(p.flamme, coups([.12, .36, .5], 'scale(1.2,.75)', 'scale(1)', .05), D)
    anim(p.yeux, [{ transform: 'none' }, { transform: 'scaleY(.45)', offset: .1 }, { transform: 'scaleY(.45)', offset: .85 }, { transform: 'none', offset: .9 }, { transform: 'none' }], D)
    await anim(p.corps, [{ transform: 'scale(1,1)' }, { transform: 'scale(1.03,1.04)', offset: .1 }, { transform: 'scale(1.03,1.04)', offset: .85 }, { transform: 'scale(1,1)' }], D)
  } },

  // la flamme grossit et passe par toutes les couleurs en lançant des étincelles
  { id: 'arcenciel', flambeau: true, async jouer(svg) {
    const p = parties(svg), D = 3000
    const [dehors, dedans] = p.flamme ? [...p.flamme.children] : []
    anim(dehors, ['#f08c1a', '#3f8fe8', '#4fbf5a', '#a35ad8', '#e0507e', '#f08c1a'].map(fill => ({ fill })), D)
    anim(dedans, ['#ffd66b', '#cfe6ff', '#e2ffd0', '#f0dcff', '#ffd6e2', '#ffd66b'].map(fill => ({ fill })), D)
    ;[[.2, 104, 18], [.45, 80, 14], [.7, 102, 34]].forEach(([t, x, y]) => apres(svg, D * t, () => etincelle(svg, x, y, .7)))
    anim(p.yeux, [{ transform: 'none' }, { transform: 'translate(2px,-1px) scale(1.3)', offset: .1 }, { transform: 'translate(2px,-1px) scale(1.3)', offset: .88 }, { transform: 'none' }], D)
    await anim(p.flamme, [{ transform: 'scale(1)' }, { transform: 'scale(1.35)', offset: .1 }, { transform: 'scale(1.25,1.45)', offset: .5 }, { transform: 'scale(1.35)', offset: .88 }, { transform: 'scale(1)' }], D)
  } },

  // un bout de flamme, avec deux yeux, s'échappe et fait le tour de la mascotte, qui le suit du regard
  { id: 'follet', flambeau: true, enPied: true, async jouer(svg) {
    const p = parties(svg), D = 3800
    const g = ajout(svg, `<g opacity="0">${FLAMMECHE}<circle cx="-1.5" cy="-4" r=".8" fill="${TRAIT}"/><circle cx="1.5" cy="-4" r=".8" fill="${TRAIT}"/></g>`)
    const chemin = [[92, 22, 0], [78, 4, .12], [40, 8, .28], [14, 42, .42], [20, 92, .55], [104, 102, .7], [104, 62, .82], [92, 24, .94], [92, 26, 1]]
    anim(g.firstElementChild, chemin.map(([x, y, offset], i) => ({ transform: `translate(${x}px,${y}px) scale(.75) rotate(${i % 2 ? 10 : -10}deg)`, opacity: i === 0 || i === chemin.length - 1 ? 0 : 1, offset, easing: 'ease-in-out' })), D)
      .finally(() => g.remove())
    anim(p.flamme, [{ transform: 'scale(1)' }, { transform: 'scale(.6)', offset: .08 }, { transform: 'scale(.6)', offset: .92 }, { transform: 'scale(1.15)', offset: .96 }, { transform: 'scale(1)' }], D)
    await anim(p.yeux, [{ transform: 'none' }, { transform: 'translate(1.5px,-2.5px)', offset: .12 }, { transform: 'translate(-1.5px,-2.5px)', offset: .28 }, { transform: 'translate(-2.6px,-1px)', offset: .42 }, { transform: 'translate(-2.6px,1.6px)', offset: .55 }, { transform: 'translate(2.6px,1.8px)', offset: .7 }, { transform: 'translate(2.6px,0)', offset: .82 }, { transform: 'translate(2px,-1.5px)', offset: .94 }, { transform: 'none' }], { duration: D, easing: 'ease-in-out' })
  } },

  // trois hoquets qui la font sursauter ; à chaque fois, la flamme fait un bond elle aussi
  { id: 'hoquet', async jouer(svg) {
    const p = parties(svg), D = 2800, t = [.12, .45, .78]
    anim(p.flamme, coups(t, 'scale(1,1.6)', 'scale(1)'), D)
    anim(p.yeux, coups(t, 'scale(1.35)'), D)
    await anim(p.perso, coups(t, 'translateY(-7px) scale(.98,1.04)', 'translateY(0)'), D)
  } },

  // une bulle rose qui gonfle en deux fois, en louchant dessus… et qui éclate sur toute la figure
  // (pas pour le chevalier : on ne fait pas de bulle à travers un heaume)
  { id: 'chewing-gum', sauf: ['chevalier'], async jouer(svg) {
    const p = parties(svg), D = 3400, [x, y] = bouche(svg)
    if (!p.corps) return
    const bulle = ajout(svg, `<g transform="translate(${x} ${y + 1})"><g class="b"><circle r="10" fill="#f59ac0" stroke="${TRAIT}" stroke-width="1.1"/><path d="M-5.5 -4 Q-3.5 -7 0 -7.5" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".8"/></g></g>`, p.corps)
    anim(bulle.querySelector('.b'), [{ transform: 'scale(0)' }, { transform: 'scale(.4)', offset: .15 }, { transform: 'scale(.34)', offset: .22 }, { transform: 'scale(.72)', offset: .38 }, { transform: 'scale(.64)', offset: .44 }, { transform: 'scale(1.05)', offset: .6 }, { transform: 'scale(1.15)', offset: .64 }, { transform: 'scale(1.15)' }], D * .64)
      .finally(() => bulle.remove())
    apres(svg, D * .64, () => {
      const taches = [[-7, -7, 5, 3.5], [7, -10, 4.5, 3], [0, 1, 7, 4], [-11, 1, 3, 2.5], [11, -1, 3.5, 3], [-3, -14, 3, 2]]
      const g = ajout(svg, taches.map(([dx, dy, rx, ry]) => `<ellipse class="c" cx="${x + dx}" cy="${y + dy}" rx="${rx}" ry="${ry}" fill="#f59ac0" stroke="${TRAIT}" stroke-width=".7"/>`).join(''), p.corps!)
      Promise.all([...g.querySelectorAll('.c')].map(c => anim(c, [{ transform: 'scale(0)' }, { transform: 'scale(1.2)', offset: .08 }, { transform: 'scale(1)', offset: .14 }, { transform: 'scale(1)', offset: .8 }, { transform: 'scale(0)' }], D * .36)))
        .finally(() => g.remove())
    })
    await anim(p.yeux, [{ transform: 'none' }, { transform: 'translateY(1.5px)', offset: .12 }, { transform: 'translateY(1.5px)', offset: .62 }, { transform: 'scaleY(.1)', offset: .65 }, { transform: 'scaleY(.1)', offset: .7 }, { transform: 'scale(1.3)', offset: .73 }, { transform: 'scale(1.3)', offset: .86 }, { transform: 'none', offset: .9 }, { transform: 'none' }], D)
  } },

  // une guimauve sur une pique dore, brunit… et prend feu ; Reynaert souffle et la mange quand même, carbonisée
  { id: 'guimauve', pour: 'renard', flambeau: true, async jouer(svg) {
    const p = parties(svg), D = 4600
    const g = ajout(svg, `<g class="pique"><line x1="104" y1="27" x2="126" y2="46" stroke="${TRAIT}" stroke-width="2.8" stroke-linecap="round"/><line x1="104" y1="27" x2="126" y2="46" stroke="#b58a5a" stroke-width="1.4" stroke-linecap="round"/><rect class="guim" x="98.5" y="21.5" width="8.5" height="7.5" rx="2.8" fill="#fbf6ee" stroke="${TRAIT}" stroke-width="1"/></g>`)
    anim(g.querySelector('.pique'), [{ transform: 'translate(26px,12px)', opacity: 0 }, { transform: 'translate(0,0)', opacity: 1, offset: .1 }, { transform: 'translate(0,0)', opacity: 1, offset: .74 }, { transform: 'translate(-42px,35px) rotate(-8deg)', opacity: 1, offset: .83 }, { transform: 'translate(-43px,36px) rotate(-8deg)', opacity: 0, offset: .85 }, { transform: 'translate(-43px,36px)', opacity: 0 }], D)
      .finally(() => g.remove())
    anim(g.querySelector('.guim'), [{ fill: '#fbf6ee' }, { fill: '#fbf6ee', offset: .1 }, { fill: '#ecc98f', offset: .3 }, { fill: '#c4874a', offset: .42 }, { fill: '#a8622e', offset: .5 }, { fill: '#a8622e', offset: .62 }, { fill: '#2b2219', offset: .66 }, { fill: '#2b2219' }], { duration: D, fill: 'forwards' })
    petitFeu(svg, 102.7, 22.5, D * .5, D * .66, { taille: .8 })
    fumee(svg, 103, 18, 3, D * .66, 2.5)
    souffle(svg, D * .58, 34, -28)
    envol(svg, texte('!', 22), 44, 14, { dx: 0, dy: -10, duree: 800, delai: D * .52, echelle: 1.1 })
    anim(p.yeux, [{ transform: 'none' }, { transform: 'translate(2.4px,-1.5px)', offset: .12 }, { transform: 'translate(2.4px,-1.5px)', offset: .5 }, { transform: 'translate(2.4px,-1.5px) scale(1.35)', offset: .53 }, { transform: 'translate(2.4px,-1.5px) scale(1.35)', offset: .66 }, { transform: 'translate(1px,1px)', offset: .76 }, { transform: 'scaleY(.3)', offset: .86 }, { transform: 'scaleY(.3)', offset: .97 }, { transform: 'none' }], D)
    await anim(p.corps, coups([.88, .92, .96], 'scale(1.05,.96)', 'scale(1,1)', .015), D)
  } },

  // une étincelle saute sur la bannière, qui prend feu au bout ; le chevalier la secoue dans tous les sens et l'éteint
  { id: 'banniere-feu', pour: 'chevalier', flambeau: true, async jouer(svg) {
    const p = parties(svg), D = 3800
    const s = ajout(svg, `<circle r="1.7" fill="#ffd23f" stroke="${TRAIT}" stroke-width=".6"/>`)
    anim(s.firstElementChild, [{ transform: 'translate(92px,18px)' }, { transform: 'translate(80px,3px)', offset: .35 }, { transform: 'translate(64px,6px)', offset: .65 }, { transform: 'translate(54px,22px)' }], { duration: D * .18, delay: D * .03 })
      .finally(() => s.remove())
    petitFeu(svg, 52, 23, D * .21, D * .68)
    const noir = ajout(svg, `<path d="M46 20.5 L56 23 L46 28 Z" fill="#2b2219"/>`)
    anim(noir, [{ opacity: 0 }, { opacity: 0, offset: .3 }, { opacity: .75, offset: .5 }, { opacity: .75, offset: .9 }, { opacity: 0 }], D).finally(() => noir.remove())
    fumee(svg, 52, 20, 3, D * .68, 2.6)
    envol(svg, texte('!', 22), 72, 12, { dx: 0, dy: -10, duree: 800, delai: D * .28, echelle: 1.1 })
    anim(p.yeux, [{ transform: 'none' }, { transform: 'translate(-2px,-1.5px)', offset: .25 }, { transform: 'translate(-2px,-1.5px) scale(1.3)', offset: .3 }, { transform: 'translate(-2px,-1.5px) scale(1.3)', offset: .7 }, { transform: 'scaleY(.3)', offset: .76 }, { transform: 'scaleY(.3)', offset: .9 }, { transform: 'none' }], D)
    anim(svg.querySelector('.drapeau'), [{ transform: 'none' }, { transform: 'none', offset: .4 }, ...tour(9, i => ({ transform: `scaleX(${i % 2 ? .8 : 1.1}) skewY(${i % 2 ? -14 : 14}deg)`, offset: .42 + i * .03 })), { transform: 'none', offset: .72 }, { transform: 'none' }], D)
    await anim(p.perso, [{ transform: 'rotate(0)' }, { transform: 'rotate(0)', offset: .4 }, ...tour(9, i => ({ transform: `translateY(${i % 2 ? -3 : 0}px) rotate(${i % 2 ? 4 : -4}deg)`, offset: .42 + i * .03 })), { transform: 'rotate(0)', offset: .72 }, { transform: 'scale(1.02,.97)', offset: .8 }, { transform: 'rotate(0)' }], D)
  } },

  // la flamme se penche vers la plume du chapeau, qui s'enflamme ; Colomb bondit, le chapeau s'envole et retombe, plume noircie
  { id: 'plume', pour: 'colomb', flambeau: true, async jouer(svg) {
    const p = parties(svg), D = 3600, chapeau = svg.querySelector('.chapeau')
    if (!chapeau) return
    petitFeu(svg, 84, 13, D * .22, D * .62, { dans: chapeau, taille: .8 })
    const noir = ajout(svg, `<path d="M79 15 Q82.5 12 86 14.6 Q83 15.6 81 17.6 Z" fill="#2b2219"/>`, chapeau)
    anim(noir, [{ opacity: 0 }, { opacity: 0, offset: .4 }, { opacity: .8, offset: .62 }, { opacity: .8, offset: .9 }, { opacity: 0 }], D).finally(() => noir.remove())
    fumee(svg, 84, 0, 3, D * .62, 2.4)
    envol(svg, texte('!', 22), 38, 16, { dx: 0, dy: -10, duree: 800, delai: D * .34, echelle: 1.1 })
    anim(p.flamme, [{ transform: 'rotate(0) scale(1)' }, { transform: 'rotate(-32deg) scale(1.25)', offset: .14 }, { transform: 'rotate(-28deg) scale(1.3)', offset: .22 }, { transform: 'rotate(0) scale(1)', offset: .3 }, { transform: 'rotate(0) scale(1)' }], D)
    anim(p.yeux, [{ transform: 'none' }, { transform: 'translate(1.5px,-2.6px)', offset: .3 }, { transform: 'translate(1.5px,-2.6px) scale(1.35)', offset: .36 }, { transform: 'translate(1.5px,-2.6px) scale(1.35)', offset: .7 }, { transform: 'scaleY(.3)', offset: .8 }, { transform: 'scaleY(.3)', offset: .92 }, { transform: 'none' }], D)
    anim(chapeau, [{ transform: 'none' }, { transform: 'none', offset: .48 }, { transform: 'translate(-3px,-26px) rotate(-18deg)', offset: .6, easing: 'ease-in' }, { transform: 'translate(0,1px) rotate(3deg)', offset: .74 }, { transform: 'translate(0,-2px) rotate(-2deg)', offset: .79 }, { transform: 'none', offset: .84 }, { transform: 'none' }], D)
    await anim(p.perso, [{ transform: 'translateY(0)' }, { transform: 'translateY(0)', offset: .44 }, { transform: 'translateY(3px) scale(1.04,.94)', offset: .48 }, { transform: 'translateY(-12px)', offset: .56 }, { transform: 'translateY(0) scale(1.04,.94)', offset: .66 }, { transform: 'translateY(0)', offset: .72 }, { transform: 'translateY(0)' }], D)
  } },

  // un rayon de soleil traverse la loupe et se concentre au sol : fumée, petite flamme… écrasée d'un coup de talon
  { id: 'loupe-feu', pour: 'detective', enPied: true, async jouer(svg) {
    const p = parties(svg), D = 4000
    const rayon = ajout(svg, `<path d="M6 -14 L44 -14 L33 66 L19 66 Z" fill="#ffd84d" opacity=".28"/><path d="M19 74 L33 74 L51 139 Z" fill="#ffd84d" opacity=".5"/>`, svg, p.perso)
    anim(rayon, [{ opacity: 0 }, { opacity: 1, offset: .12 }, { opacity: 1, offset: .52 }, { opacity: 0, offset: .6 }, { opacity: 0 }], D).finally(() => rayon.remove())
    const point = ajout(svg, `<circle cx="51" cy="139" r="2.4" fill="#fff3b0" stroke="#f08c1a" stroke-width=".6"/>`)
    anim(point, [{ opacity: 0 }, { opacity: 0, offset: .14 }, { opacity: 1, offset: .26 }, { opacity: 1, offset: .55 }, { opacity: 0, offset: .6 }, { opacity: 0 }], D).finally(() => point.remove())
    fumee(svg, 51, 136, 3, D * .24, 1.8)
    petitFeu(svg, 51, 139, D * .38, D * .66, { taille: .75 })
    fumee(svg, 51, 136, 3, D * .66, 3.2)
    envol(svg, texte('!', 22), 40, 14, { dx: 0, dy: -10, duree: 800, delai: D * .42, echelle: 1.1 })
    anim(p.yeux, [{ transform: 'none' }, { transform: 'translate(-1px,2px)', offset: .26 }, { transform: 'translate(-1px,2px) scale(1.3)', offset: .42 }, { transform: 'translate(-1px,2px) scale(1.3)', offset: .64 }, { transform: 'scaleY(.35)', offset: .74 }, { transform: 'scaleY(.35)', offset: .9 }, { transform: 'none' }], D)
    anim(p.jg, [{ transform: 'none' }, { transform: 'none', offset: .54 }, { transform: 'translateY(-9px)', offset: .61, easing: 'ease-in' }, { transform: 'translateY(0)', offset: .65 }, { transform: 'none' }], D)
    await anim(p.perso, [{ transform: 'scale(1,1)' }, { transform: 'scale(1,1)', offset: .54 }, { transform: 'rotate(3deg)', offset: .61 }, { transform: 'scale(1.04,.95)', offset: .66 }, { transform: 'scale(1,1)', offset: .72 }, { transform: 'scale(1,1)' }], D)
  } },

  // la fiole bouillonne de plus en plus, tremble… et explose en un nuage de couleurs ; la grenouille en ressort noircie
  { id: 'potion', pour: 'grenouille', async jouer(svg) {
    const p = parties(svg), D = 3800
    for (let i = 0; i < 9; i++) envol(svg, `<circle r="${1.2 + Math.random()}" fill="#9ad88f" stroke="${TRAIT}" stroke-width=".5"/>`, 35 + Math.random() * 3, 67, { dx: (Math.random() - .5) * 10, dy: -14 - Math.random() * 10, duree: 700, delai: D * (.02 + i * .05) * (1 - i * .03), echelle: 1.2 })
    anim(svg.querySelector('.fiole'), [{ transform: 'rotate(0)' }, { transform: 'rotate(0)', offset: .2 }, ...tour(10, i => ({ transform: `rotate(${(i % 2 ? -1 : 1) * (3 + i * .6)}deg)`, offset: .22 + i * .026 })), { transform: 'rotate(0)', offset: .5 }, { transform: 'rotate(0)' }], D)
    apres(svg, D * .5, () => {
      const nuage = ajout(svg, [[36, 62, 9, '#c48cff'], [26, 54, 7, '#7cc576'], [46, 52, 8, '#5ab0ff'], [34, 46, 7, '#ffd23f'], [52, 64, 6, '#e0607e'], [20, 66, 6, '#ff9a3c']].map(([x, y, r, c]) => `<circle class="c" cx="${x}" cy="${y}" r="${r}" fill="${c}" stroke="${TRAIT}" stroke-width=".8"/>`).join(''))
      Promise.all([...nuage.querySelectorAll('.c')].map((c, i) => anim(c, [{ transform: 'scale(0)', opacity: 1 }, { transform: 'scale(1.15)', opacity: 1, offset: .2 }, { transform: 'scale(1.3) translateY(-4px)', opacity: .8, offset: .6 }, { transform: 'scale(1.5) translateY(-10px)', opacity: 0 }], { duration: 1300, delay: i * 40, easing: 'ease-out' })))
        .finally(() => nuage.remove())
    })
    suie(svg, D * .52, D * .44)
    anim(p.yeux, [{ transform: 'none' }, { transform: 'translate(-2px,1.5px)', offset: .1 }, { transform: 'translate(-2px,1.5px) scale(1.2)', offset: .48 }, { transform: 'scaleY(.1)', offset: .51 }, { transform: 'scale(1.25)', offset: .6 }, { transform: 'scale(1.25)', offset: .7 }, { transform: 'scaleY(.1)', offset: .73 }, { transform: 'scale(1.2)', offset: .76 }, { transform: 'scale(1.2)', offset: .86 }, { transform: 'none', offset: .9 }, { transform: 'none' }], D)
    await anim(p.perso, [{ transform: 'rotate(0)' }, { transform: 'rotate(0)', offset: .49 }, { transform: 'translateX(3px) rotate(7deg)', offset: .52 }, { transform: 'rotate(2deg)', offset: .6 }, { transform: 'rotate(0)', offset: .7 }, { transform: 'rotate(0)' }], D)
  } },

  // la flamme se penche vers le crâne tonsuré, qui prend feu : le moine bondit, souffle… crâne rouge et fumant
  { id: 'crane', pour: 'moine', flambeau: true, async jouer(svg) {
    const p = parties(svg), D = 3600
    anim(p.flamme, [{ transform: 'rotate(0) scale(1)' }, { transform: 'rotate(-40deg) scale(1.3)', offset: .14 }, { transform: 'rotate(-36deg) scale(1.35)', offset: .22 }, { transform: 'rotate(0) scale(1)', offset: .3 }, { transform: 'rotate(0) scale(1)' }], D)
    // le feu et la rougeur dans le corps : ils suivent le moine quand il bondit
    petitFeu(svg, 60, 31, D * .22, D * .6, { dans: p.corps ?? svg, taille: .9 })
    const rouge = ajout(svg, `<ellipse cx="60" cy="36" rx="9" ry="5.5" fill="#e0503a"/>`, svg, p.yeux)
    anim(rouge, [{ opacity: 0 }, { opacity: 0, offset: .3 }, { opacity: .55, offset: .55 }, { opacity: .55, offset: .85 }, { opacity: 0 }], D).finally(() => rouge.remove())
    fumee(svg, 60, 28, 3, D * .6, 2.6)
    souffle(svg, D * .62, 8, -26)
    envol(svg, texte('!', 22), 82, 22, { dx: 0, dy: -10, duree: 800, delai: D * .3, echelle: 1.1 })
    anim(p.yeux, [{ transform: 'none' }, { transform: 'scale(1.4,1.8)', offset: .3 }, { transform: 'scale(1.4,1.8)', offset: .62 }, { transform: 'none', offset: .7 }, { transform: 'none' }], D)
    await anim(p.perso, [{ transform: 'translateY(0)' }, { transform: 'translateY(0)', offset: .3 }, { transform: 'translateY(3px) scale(1.04,.94)', offset: .34 }, { transform: 'translateY(-14px)', offset: .42 }, { transform: 'translateY(0) scale(1.05,.93)', offset: .5 }, ...tour(4, i => ({ transform: `rotate(${i % 2 ? 3 : -3}deg)`, offset: .54 + i * .03 })), { transform: 'rotate(0)', offset: .68 }, { transform: 'translateY(0)' }], D)
  } },

  // la flamme se penche vers la grande barbe, qui prend feu au bout : Pythagore bondit, se secoue… barbe roussie
  { id: 'barbe', pour: 'pythagore', flambeau: true, async jouer(svg) {
    const p = parties(svg), D = 3600, barbe = svg.querySelector('.barbe')
    anim(p.flamme, [{ transform: 'rotate(0) scale(1)' }, { transform: 'rotate(-48deg) scale(1.35)', offset: .14 }, { transform: 'rotate(-44deg) scale(1.4)', offset: .22 }, { transform: 'rotate(0) scale(1)', offset: .3 }, { transform: 'rotate(0) scale(1)' }], D)
    // dans le corps : le feu et la suie suivent Pythagore quand il bondit
    petitFeu(svg, 60, 74, D * .22, D * .62, { dans: p.corps ?? svg, taille: .85 })
    const roussi = ajout(svg, `<path d="M51.5 62 Q55 70 60 75 Q65 70 68.5 62 Q64 66 60 65.5 Q56 66 51.5 62 Z" fill="#2b2219"/>`, p.corps ?? svg, barbe?.nextElementSibling ?? null)
    anim(roussi, [{ opacity: 0 }, { opacity: 0, offset: .4 }, { opacity: .8, offset: .62 }, { opacity: .8, offset: .9 }, { opacity: 0 }], D).finally(() => roussi.remove())
    fumee(svg, 60, 72, 3, D * .62, 2.6)
    souffle(svg, D * .64, -4, 18)
    envol(svg, texte('!', 22), 82, 22, { dx: 0, dy: -10, duree: 800, delai: D * .3, echelle: 1.1 })
    anim(p.yeux, [{ transform: 'none' }, { transform: 'translate(0,2px)', offset: .26 }, { transform: 'translate(0,2px) scale(1.4)', offset: .32 }, { transform: 'translate(0,2px) scale(1.4)', offset: .66 }, { transform: 'scaleY(.3)', offset: .76 }, { transform: 'scaleY(.3)', offset: .9 }, { transform: 'none' }], D)
    await anim(p.perso, [{ transform: 'translateY(0)' }, { transform: 'translateY(0)', offset: .32 }, { transform: 'translateY(3px) scale(1.04,.94)', offset: .36 }, { transform: 'translateY(-14px)', offset: .44 }, { transform: 'translateY(0) scale(1.05,.93)', offset: .52 }, ...tour(4, i => ({ transform: `rotate(${i % 2 ? 4 : -4}deg)`, offset: .55 + i * .03 })), { transform: 'rotate(0)', offset: .68 }, { transform: 'translateY(0)' }], D)
  } },

  // la flamme met le feu à la perruque : elle s'envole (Molière est chauve !), retombe et fume
  { id: 'perruque', pour: 'moliere', flambeau: true, async jouer(svg) {
    const p = parties(svg), D = 3800, perruques = [...svg.querySelectorAll('.perruque')]
    anim(p.flamme, [{ transform: 'rotate(0) scale(1)' }, { transform: 'rotate(-36deg) scale(1.3)', offset: .14 }, { transform: 'rotate(-32deg) scale(1.35)', offset: .22 }, { transform: 'rotate(0) scale(1)', offset: .3 }, { transform: 'rotate(0) scale(1)' }], D)
    const devant = perruques[perruques.length - 1]
    if (devant) petitFeu(svg, 70, 30, D * .2, D * .62, { dans: devant, taille: .8 })
    envol(svg, texte('!', 22), 84, 22, { dx: 0, dy: -10, duree: 800, delai: D * .3, echelle: 1.1 })
    perruques.forEach(g => anim(g, [{ transform: 'none' }, { transform: 'none', offset: .36 }, { transform: 'translate(2px,-30px) rotate(10deg)', offset: .5, easing: 'ease-out' }, { transform: 'translate(3px,-34px) rotate(-6deg)', offset: .6 }, { transform: 'translate(0,1px) rotate(2deg)', offset: .72, easing: 'ease-in' }, { transform: 'translate(0,-1px) rotate(-1deg)', offset: .78 }, { transform: 'none', offset: .84 }, { transform: 'none' }], D))
    fumee(svg, 66, 26, 3, D * .7, 2.6)
    anim(p.yeux, [{ transform: 'none' }, { transform: 'translate(0,-2px)', offset: .3 }, { transform: 'translate(0,-2px) scale(1.4)', offset: .42 }, { transform: 'translate(0,-2px) scale(1.4)', offset: .72 }, { transform: 'scaleY(.3)', offset: .8 }, { transform: 'scaleY(.3)', offset: .92 }, { transform: 'none' }], D)
    await anim(p.perso, [{ transform: 'translateY(0)' }, { transform: 'translateY(0)', offset: .34 }, { transform: 'translateY(3px) scale(1.04,.94)', offset: .38 }, { transform: 'translateY(-6px)', offset: .46 }, { transform: 'translateY(0) scale(1.03,.96)', offset: .54 }, { transform: 'translateY(0)', offset: .6 }, { transform: 'translateY(0)' }], D)
  } },

  // ---------- la gigue (danse irlandaise), pour toutes les mascottes ; la troupe danse ensemble ----------
  { id: 'gigue', enPied: true, async jouer(svg) { await gigueEnTroupe(svg, false) } },
  { id: 'gigue-flambeau', flambeau: true, enPied: true, async jouer(svg) { await gigueEnTroupe(svg, true) } },
]

/** Joue une surprise sur le dessin (s'il n'est pas déjà occupé). */
export async function surprendre(svg: SVGSVGElement, s: Surprise): Promise<void> {
  if (svg.dataset.saute || svg.dataset.surprise) return
  svg.dataset.surprise = s.id
  minuteries.set(svg, [])
  await s.jouer(svg)
  // les petits dessins encore en vol finissent tranquillement
  if (svg.dataset.surprise === s.id) { minuteries.delete(svg); delete svg.dataset.surprise }
}

/** Arrête net la surprise en cours (par exemple quand la mascotte doit sauter de joie). */
export function interrompre(svg: SVGSVGElement) {
  if (!svg.dataset.surprise) return
  minuteries.get(svg)?.forEach(clearTimeout)
  minuteries.delete(svg)
  svg.getAnimations({ subtree: true }).filter(a => !(a instanceof CSSAnimation || a instanceof CSSTransition)).forEach(a => a.cancel())
  svg.querySelectorAll('.bulle').forEach(b => b.remove())
  delete svg.dataset.surprise
}

// la surprise : une fois sur trois une des siennes, sinon une commune ; jamais deux fois la même de suite
let derniere = ''
/** La mascotte tient-elle son flambeau ? (dans un médaillon du menu, pas toujours) */
export const tientLeFlambeau = (svg: SVGSVGElement) => {
  const f = svg.querySelector('.bras-d.repos .flambeau')
  return !!f && getComputedStyle(f).visibility !== 'hidden'
}

export function choisirSurprise(m: Mascotte, hasard = Math.random, avecFlambeau = true, medaillon = false): Surprise {
  const ok = (s: Surprise) => s.id !== derniere && (avecFlambeau || !s.flambeau) && !(medaillon && s.enPied) && !s.sauf?.includes(m)
  const propres = SURPRISES.filter(s => s.pour === m && ok(s))
  const communes = SURPRISES.filter(s => !s.pour && ok(s))
  const s = propres.length && hasard() < 1 / 3 ? propres[Math.floor(hasard() * propres.length)] : communes[Math.floor(hasard() * communes.length)]
  derniere = s.id
  return s
}

// --- le calendrier : au moins 30 secondes entre deux surprises, au plus six minutes ---
let calme = 0
const delai = () => (0.5 + Math.random() * 5.5) * MINUTE
const visible = (svg: SVGSVGElement) => {
  if (svg.dataset.saute || svg.dataset.surprise || svg.closest('.en-course')) return false
  const r = svg.getBoundingClientRect()
  return r.width > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth
}

function essayer() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return void setTimeout(essayer, delai())
  const candidates = [...document.querySelectorAll<SVGSVGElement>('svg.mascotte[data-mascotte]')].filter(visible)
  // onglet caché, élève en pleine action ou mascotte occupée : on retente dans 30 secondes
  if (document.hidden || Date.now() - calme < 5000 || !candidates.length) return void setTimeout(essayer, 30_000)
  const svg = candidates[Math.floor(Math.random() * candidates.length)]
  surprendre(svg, choisirSurprise(svg.dataset.mascotte as Mascotte, Math.random, tientLeFlambeau(svg), svg.classList.contains('buste')))
  setTimeout(essayer, delai())
}

// --- le raccourci clavier : S = une surprise au hasard, Maj+S = la suivante de la revue ---

// la revue des surprises d'une mascotte : toutes, dans un ordre tiré au hasard, puis un nouveau tirage
// (jamais la même deux fois de suite, même d'un tirage à l'autre)
const revues = new Map<string, { reste: Surprise[]; derniere?: Surprise }>()
function prochaine(svg: SVGSVGElement): Surprise {
  const m = svg.dataset.mascotte as Mascotte, flambeau = tientLeFlambeau(svg)
  const cle = `${m}|${flambeau}`
  const r = revues.get(cle) ?? { reste: [] }
  if (!r.reste.length) {
    const possibles = SURPRISES.filter(x => (!x.pour || x.pour === m) && !x.sauf?.includes(m) && (!x.flambeau || flambeau))
    for (let i = possibles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[possibles[i], possibles[j]] = [possibles[j], possibles[i]]
    }
    if (possibles.length > 1 && possibles[0] === r.derniere) possibles.push(possibles.shift()!)
    r.reste = possibles
  }
  r.derniere = r.reste.shift()!
  revues.set(cle, r)
  return r.derniere
}

/** Toucher (ou cliquer) la mascotte du bloc « Commencer » : sa prochaine surprise. */
function toucher(e: Event) {
  const svg = (e.target as Element | null)?.closest?.<SVGSVGElement>('.reprendre svg.mascotte[data-mascotte]')
  if (!svg || svg.closest('.en-course')) return
  interrompre(svg)
  if (!svg.dataset.saute) surprendre(svg, prochaine(svg))
}

function declencher(dansLOrdre: boolean) {
  const candidates = [...document.querySelectorAll<SVGSVGElement>('svg.mascotte[data-mascotte]')]
    .filter(svg => { const r = svg.getBoundingClientRect(); return r.width > 0 && r.bottom > 0 && r.top < innerHeight && !svg.closest('.en-course') })
  if (!candidates.length) return
  // S : une mascotte visible au hasard (scène ou médaillon) ; Maj+S : la mascotte du bloc « Commencer »
  const svg = dansLOrdre ? candidates[0] : candidates[Math.floor(Math.random() * candidates.length)]
  const m = svg.dataset.mascotte as Mascotte
  interrompre(svg)
  if (svg.dataset.saute) return
  surprendre(svg, dansLOrdre ? prochaine(svg) : choisirSurprise(m, Math.random, tientLeFlambeau(svg), svg.classList.contains('buste')))
}

const dansUnChamp = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))

let lance = false
/** Démarre le calendrier des surprises (une seule fois, au lancement de l'app). */
export function lancerSurprises() {
  if (lance) return
  lance = true
  const agit = () => { calme = Date.now() }
  addEventListener('pointerdown', agit, { passive: true, capture: true })
  addEventListener('keydown', agit, { capture: true })
  addEventListener('keydown', e => {
    if (e.key.toLowerCase() !== 's' || e.ctrlKey || e.altKey || e.metaKey || e.repeat || dansUnChamp(e.target)) return
    declencher(e.shiftKey)
  })
  addEventListener('click', toucher)
  setTimeout(essayer, delai())
}
