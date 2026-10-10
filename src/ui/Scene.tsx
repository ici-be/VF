// La scène des mascottes, dans le bloc « Commencer ».
// Grand écran : quand on change de matière, la mascotte en place tend le flambeau
// à la suivante (course de relais). Téléphone : la mascotte en petit, en fondu.
// Les dessins sont manipulés directement (animations Web) : Preact ne gère que la boîte.
import { useEffect, useRef } from 'preact/hooks'
import { apparence } from '../lib/apparence'
import { svgMascotte, type Mascotte } from '../lib/mascottes'

const calme = () => matchMedia('(prefers-reduced-motion: reduce)').matches

function acteur(m: Mascotte, plusieurs = false): HTMLDivElement {
  const el = document.createElement('div')
  el.className = plusieurs ? 'acteur plusieurs' : 'acteur'
  el.dataset.mascotte = m
  el.innerHTML = svgMascotte(m)
  return el
}

function etincelle(scene: HTMLElement, x: number, y: number) {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  s.setAttribute('viewBox', '0 0 40 40')
  s.setAttribute('class', 'etincelle')
  s.style.left = `${x - 16}px`
  s.style.top = `${y - 16}px`
  s.innerHTML = '<path d="M20 2 L24 16 L38 20 L24 24 L20 38 L16 24 L2 20 L16 16 Z" fill="#ffd23f" stroke="#26303d" stroke-width="2" stroke-linejoin="round"/>'
  scene.appendChild(s)
  s.animate([{ transform: 'scale(.2) rotate(0)', opacity: 1 }, { transform: 'scale(1.3) rotate(90deg)', opacity: 0 }], { duration: 450, easing: 'ease-out' })
    .finished.then(() => s.remove())
}

/** Passage de relais entre deux mascottes (distances pour une mascotte de 88 px de large). */
async function relais(scene: HTMLElement, ancien: HTMLElement, nouveau: HTMLElement) {
  // pendant la course, les deux mascottes sont placées librement (au centre, en bas)
  ancien.classList.add('en-course')
  nouveau.classList.add('en-course', 'court', 'sans-flambeau')
  nouveau.style.transform = 'translateX(-170px)'
  scene.appendChild(nouveau)
  ancien.classList.add('vers-gauche')
  await Promise.all([
    ancien.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(27px)' }], { duration: 420, easing: 'ease-out', fill: 'forwards' }).finished,
    nouveau.animate([{ transform: 'translateX(-170px)' }, { transform: 'translateX(-28px)' }], { duration: 520, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' }).finished,
  ])
  ancien.classList.add('sans-flambeau')
  nouveau.classList.remove('sans-flambeau')
  etincelle(scene, scene.clientWidth / 2 - 2, scene.clientHeight - 64)
  ancien.classList.remove('vers-gauche')
  ancien.classList.add('court')
  ancien.animate([{ transform: 'translateX(27px)' }, { transform: 'translateX(200px)' }], { duration: 600, easing: 'ease-in', fill: 'forwards' })
    .finished.then(() => ancien.remove())
  await nouveau.animate([{ transform: 'translateX(-28px)' }, { transform: 'translateX(0)' }], { duration: 420, easing: 'ease-out', fill: 'forwards' }).finished
  nouveau.getAnimations().forEach(a => a.cancel())
  nouveau.style.transform = ''
  nouveau.classList.remove('court', 'en-course')
}

/** Remplace les mascottes de la scène, en fondu (ou d'un coup, la première fois). */
async function fondu(scene: HTMLElement, mascottes: Mascotte[], animer: boolean) {
  const anciens = [...scene.children] as HTMLElement[]
  if (animer && anciens.length) {
    await Promise.all(anciens.map(a => a.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' }).finished))
  }
  anciens.forEach(a => a.remove())
  for (const m of mascottes) {
    const el = acteur(m, mascottes.length > 1)
    scene.appendChild(el)
    if (animer) el.animate([{ opacity: 0, transform: 'scale(.85)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 320, easing: 'ease-out' })
  }
}

export function Scene({ matieres, petit = false }: { matieres: string[]; petit?: boolean }) {
  const boite = useRef<HTMLDivElement>(null)
  const avant = useRef<Mascotte[] | null>(null)
  const file = useRef<Promise<void>>(Promise.resolve())
  const mascottes = [...new Set(matieres.map(n => apparence(n).mascotte).filter((m): m is Mascotte => !!m))].slice(0, 3)
  const cle = mascottes.join('|')

  useEffect(() => {
    const scene = boite.current
    if (!scene) return
    const precedentes = avant.current
    avant.current = mascottes
    // les changements rapides s'enchaînent dans l'ordre, sans se marcher dessus
    file.current = file.current.then(async () => {
      const ancien = scene.querySelector<HTMLElement>('.acteur:only-child')
      if (precedentes && !petit && !calme() && precedentes.length === 1 && mascottes.length === 1 && ancien) {
        await relais(scene, ancien, acteur(mascottes[0]))
      } else {
        await fondu(scene, mascottes, !!precedentes && !calme())
      }
    })
  }, [cle])

  if (!mascottes.length) return null
  return <div ref={boite} class={petit ? 'scene-mini' : 'scene-mascottes'} aria-hidden="true" />
}
