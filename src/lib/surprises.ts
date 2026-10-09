// Les surprises des mascottes (easter eggs validés dans la démo) : de temps en temps, une mascotte
// à l'écran joue une petite animation. Jamais moins de 30 secondes entre deux, souvent bien plus.
// Aussi dans les médaillons du menu des matières.
// Raccourci : S pour une surprise au hasard (sur une mascotte visible au hasard), Maj+S pour passer
// en revue celles de la mascotte du bloc « Commencer ».
// Six surprises communes, et une propre à chaque mascotte.
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

// un petit dessin par-dessus la mascotte (coordonnées du dessin : 120 × 150)
function ajout(svg: SVGSVGElement, markup: string) {
  const g = document.createElementNS(NS, 'g')
  g.setAttribute('class', 'bulle')
  g.innerHTML = markup
  svg.appendChild(g)
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
function etincelle(svg: SVGSVGElement, x: number, y: number) {
  const g = ajout(svg, `<g transform="translate(${x} ${y})"><path class="f" d="M0 -9 L2.5 -2.5 L9 0 L2.5 2.5 L0 9 L-2.5 2.5 L-9 0 L-2.5 -2.5 Z" fill="#ffd23f" stroke="${TRAIT}" stroke-width="1.2" stroke-linejoin="round"/></g>`)
  anim(g.querySelector('.f'), [{ transform: 'scale(.2) rotate(0)', opacity: 1 }, { transform: 'scale(1.4) rotate(90deg)', opacity: 0 }], { duration: 450, easing: 'ease-out' })
    .finally(() => g.remove())
}

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
  jouer: (svg: SVGSVGElement) => Promise<void>
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

// la surprise : une fois sur trois celle de la mascotte, sinon une commune ; jamais deux fois la même de suite
let derniere = ''
/** La mascotte tient-elle son flambeau ? (dans un médaillon du menu, pas toujours) */
export const tientLeFlambeau = (svg: SVGSVGElement) => {
  const f = svg.querySelector('.bras-d.repos .flambeau')
  return !!f && getComputedStyle(f).visibility !== 'hidden'
}

export function choisirSurprise(m: Mascotte, hasard = Math.random, avecFlambeau = true, medaillon = false): Surprise {
  const ok = (s: Surprise) => s.id !== derniere && (avecFlambeau || !s.flambeau) && !(medaillon && s.enPied)
  const propre = SURPRISES.find(s => s.pour === m && ok(s))
  const communes = SURPRISES.filter(s => !s.pour && ok(s))
  const s = propre && hasard() < 1 / 3 ? propre : communes[Math.floor(hasard() * communes.length)]
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

// --- le raccourci clavier : S = une surprise au hasard, Maj+S = la suivante dans l'ordre ---
let revue = -1
function declencher(dansLOrdre: boolean) {
  const candidates = [...document.querySelectorAll<SVGSVGElement>('svg.mascotte[data-mascotte]')]
    .filter(svg => { const r = svg.getBoundingClientRect(); return r.width > 0 && r.bottom > 0 && r.top < innerHeight && !svg.closest('.en-course') })
  if (!candidates.length) return
  // S : une mascotte visible au hasard (scène ou médaillon) ; Maj+S : la mascotte du bloc « Commencer »
  const svg = dansLOrdre ? candidates[0] : candidates[Math.floor(Math.random() * candidates.length)]
  const m = svg.dataset.mascotte as Mascotte
  interrompre(svg)
  if (svg.dataset.saute) return
  let s: Surprise
  if (dansLOrdre) {
    // les surprises possibles pour cette mascotte : les communes, puis la sienne
    const possibles = SURPRISES.filter(x => (!x.pour || x.pour === m) && (!x.flambeau || tientLeFlambeau(svg)))
    revue = (revue + 1) % possibles.length
    s = possibles[revue]
  } else {
    s = choisirSurprise(m, Math.random, tientLeFlambeau(svg), svg.classList.contains('buste'))
  }
  surprendre(svg, s)
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
  setTimeout(essayer, delai())
}
