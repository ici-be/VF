// Pluie de confettis, sans bibliothèque : un canevas posé sur la page le temps
// de l'animation. Rien si l'appareil demande de réduire les animations.

const COULEURS = ['--accent', '--blue', '--ok', '--mid', '--ko']

export function confettis(quantite = 140): void {
  if (typeof window === 'undefined' || matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const styles = getComputedStyle(document.documentElement)
  const couleurs = COULEURS.map(c => styles.getPropertyValue(c).trim() || '#e2681f')
  const canevas = document.createElement('canvas')
  canevas.className = 'confettis'
  canevas.setAttribute('aria-hidden', 'true')
  const dpr = devicePixelRatio || 1
  canevas.width = innerWidth * dpr
  canevas.height = innerHeight * dpr
  document.body.appendChild(canevas)
  const ctx = canevas.getContext('2d')!
  ctx.scale(dpr, dpr)

  const morceaux = Array.from({ length: quantite }, () => ({
    x: innerWidth / 2 + (Math.random() - 0.5) * innerWidth * 0.4,
    y: innerHeight * 0.35,
    vx: (Math.random() - 0.5) * 14,
    vy: -Math.random() * 13 - 5,
    angle: Math.random() * Math.PI,
    rotation: (Math.random() - 0.5) * 0.35,
    largeur: 6 + Math.random() * 6,
    hauteur: 9 + Math.random() * 8,
    couleur: couleurs[Math.floor(Math.random() * couleurs.length)],
  }))

  const debut = performance.now(), duree = 2800
  const image = (t: number) => {
    const ecoule = t - debut
    ctx.clearRect(0, 0, innerWidth, innerHeight)
    ctx.globalAlpha = Math.max(0, 1 - Math.max(0, ecoule - duree * 0.6) / (duree * 0.4))
    for (const m of morceaux) {
      m.vy += 0.32; m.vx *= 0.99
      m.x += m.vx; m.y += m.vy; m.angle += m.rotation
      ctx.save()
      ctx.translate(m.x, m.y)
      ctx.rotate(m.angle)
      ctx.fillStyle = m.couleur
      ctx.fillRect(-m.largeur / 2, -m.hauteur / 2, m.largeur, m.hauteur * Math.abs(Math.cos(m.angle * 2)))
      ctx.restore()
    }
    if (ecoule < duree) requestAnimationFrame(image)
    else canevas.remove()
  }
  requestAnimationFrame(image)
}
