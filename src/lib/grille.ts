// Génération d'une grille de mots croisés à partir d'une liste de mots.
// Méthode classique : on place les mots du plus long au plus court, chacun en
// croisant une lettre déjà posée, sans coller deux mots côte à côte ; on fait
// plusieurs essais dans des ordres différents et on garde la grille la plus
// fournie et la plus compacte.
import { sansAccents } from './correction'

export interface MotGrille<T = unknown> {
  /** les lettres à trouver, en majuscules sans accents : « ORIENTATIE » */
  lettres: string
  ligne: number
  colonne: number
  sens: 'horizontal' | 'vertical'
  numero: number
  /** ce que l'appelant veut retrouver (le mot du tableau, l'indice…) */
  donnee: T
}

export interface Grille<T = unknown> {
  lignes: number
  colonnes: number
  mots: MotGrille<T>[]
  /** la lettre attendue dans chaque case, ou null pour une case noire */
  cases: (string | null)[][]
}

/** « oriëntatie » → « ORIENTATIE » ; null si le mot ne convient pas (espace, tiret, chiffre…). */
export function lettresDe(mot: string): string | null {
  const l = sansAccents(mot.trim()).toUpperCase()
  return /^[A-Z]{3,13}$/.test(l) ? l : null
}

type Pose = { lettres: string; ligne: number; colonne: number; sens: 'horizontal' | 'vertical'; i: number }

function essayer(candidats: { lettres: string; i: number }[], max: number, hasard: () => number): Pose[] {
  const plateau = new Map<string, string>()
  const cle = (l: number, c: number) => `${l},${c}`
  const poses: Pose[] = []
  const poser = (p: Pose) => {
    for (let k = 0; k < p.lettres.length; k++) {
      const [l, c] = p.sens === 'horizontal' ? [p.ligne, p.colonne + k] : [p.ligne + k, p.colonne]
      plateau.set(cle(l, c), p.lettres[k])
    }
    poses.push(p)
  }
  /** nombre de croisements si le mot peut être posé là, -1 sinon */
  const croisements = (lettres: string, ligne: number, colonne: number, sens: Pose['sens']): number => {
    const [dl, dc] = sens === 'horizontal' ? [0, 1] : [1, 0]
    // pas de lettre juste avant ni juste après le mot
    if (plateau.has(cle(ligne - dl, colonne - dc)) || plateau.has(cle(ligne + dl * lettres.length, colonne + dc * lettres.length))) return -1
    let n = 0
    for (let k = 0; k < lettres.length; k++) {
      const l = ligne + dl * k, c = colonne + dc * k
      const ici = plateau.get(cle(l, c))
      if (ici !== undefined) {
        if (ici !== lettres[k]) return -1
        n++
      } else if (plateau.has(cle(l + dc, c + dl)) || plateau.has(cle(l - dc, c - dl))) {
        // une case vide ne doit pas toucher un autre mot sur le côté
        return -1
      }
    }
    // un mot entièrement superposé à un autre n'apporte rien
    return n === lettres.length ? -1 : n
  }

  for (const cand of candidats) {
    if (poses.length >= max) break
    if (!poses.length) { poser({ ...cand, ligne: 0, colonne: 0, sens: 'horizontal' }); continue }
    const [l0, l1, c0, c1] = bornes(poses)
    // une position vaut par ses croisements, moins ce qu'elle agrandit la grille
    const valeur = (p: Pose, n: number) => {
      const [m0, m1, d0, d1] = bornes([...poses, p])
      const h = m1 - m0 + 1, w = d1 - d0 + 1
      return n * 6 - (h + w - (l1 - l0 + 1) - (c1 - c0 + 1)) - Math.max(0, Math.min(h, w) - 13) * 20
    }
    let meilleures: Pose[] = [], meilleurScore = -Infinity
    for (const p of poses) {
      for (let a = 0; a < p.lettres.length; a++) {
        for (let b = 0; b < cand.lettres.length; b++) {
          if (p.lettres[a] !== cand.lettres[b]) continue
          const sens = p.sens === 'horizontal' ? 'vertical' : 'horizontal'
          const [ligne, colonne] = p.sens === 'horizontal' ? [p.ligne - b, p.colonne + a] : [p.ligne + a, p.colonne - b]
          const n = croisements(cand.lettres, ligne, colonne, sens)
          if (n < 1) continue
          const pose: Pose = { ...cand, ligne, colonne, sens }
          const v = valeur(pose, n)
          if (v > meilleurScore) { meilleurScore = v; meilleures = [] }
          if (v === meilleurScore) meilleures.push(pose)
        }
      }
    }
    if (meilleures.length) poser(meilleures[Math.floor(hasard() * meilleures.length)])
  }
  return poses
}

export function genererGrille<T>(mots: { mot: string; donnee: T }[], max = 12, essais = 40, hasard = Math.random): Grille<T> | null {
  // un même mot (ou deux mots identiques sans accents) une seule fois
  const vus = new Set<string>()
  const candidats = mots.flatMap((m, i) => {
    const lettres = lettresDe(m.mot)
    if (!lettres || vus.has(lettres)) return []
    vus.add(lettres)
    return [{ lettres, i }]
  })
  if (candidats.length < 2) return null

  let meilleur: Pose[] = [], meilleurScore = -Infinity
  for (let e = 0; e < essais; e++) {
    // les longs d'abord (ils structurent la grille), dans un ordre un peu mélangé
    const ordre = candidats.map(c => ({ c, k: c.lettres.length + hasard() * 4 })).sort((a, b) => b.k - a.k).map(x => x.c)
    const poses = essayer(ordre, max, hasard)
    const [l0, l1, c0, c1] = bornes(poses)
    const surface = (l1 - l0 + 1) * (c1 - c0 + 1)
    // compacte, et si possible pas plus de 13 cases de côté (lisible sur un téléphone)
    const trop = Math.max(0, Math.min(l1 - l0, c1 - c0) + 1 - 13)
    const score = poses.length * 1000 - surface - trop * 400
    if (score > meilleurScore) { meilleurScore = score; meilleur = poses }
  }
  if (meilleur.length < 2) return null
  // plus large que haute : on la fait pivoter (on fait défiler une page de haut en bas, pas de côté)
  {
    const [l0, l1, c0, c1] = bornes(meilleur)
    if (c1 - c0 > l1 - l0) {
      meilleur = meilleur.map(p => ({ ...p, ligne: p.colonne, colonne: p.ligne, sens: p.sens === 'horizontal' ? 'vertical' : 'horizontal' }))
    }
  }

  // recadrer en partant de (0, 0) et numéroter dans l'ordre de lecture
  const [l0, l1, c0, c1] = bornes(meilleur)
  const cases: (string | null)[][] = Array.from({ length: l1 - l0 + 1 }, () => new Array(c1 - c0 + 1).fill(null))
  for (const p of meilleur) {
    for (let k = 0; k < p.lettres.length; k++) {
      const [l, c] = p.sens === 'horizontal' ? [p.ligne - l0, p.colonne - c0 + k] : [p.ligne - l0 + k, p.colonne - c0]
      cases[l][c] = p.lettres[k]
    }
  }
  const departs = [...new Set(meilleur.map(p => `${p.ligne - l0},${p.colonne - c0}`))]
    .map(s => s.split(',').map(Number))
    .sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const numeroDe = new Map(departs.map(([l, c], k) => [`${l},${c}`, k + 1]))
  const motsGrille = meilleur
    .map(p => ({
      lettres: p.lettres, ligne: p.ligne - l0, colonne: p.colonne - c0, sens: p.sens,
      numero: numeroDe.get(`${p.ligne - l0},${p.colonne - c0}`)!, donnee: mots[p.i].donnee,
    }))
    .sort((a, b) => a.numero - b.numero)
  return { lignes: cases.length, colonnes: cases[0].length, mots: motsGrille, cases }
}

function bornes(poses: Pose[]): [number, number, number, number] {
  let l0 = Infinity, l1 = -Infinity, c0 = Infinity, c1 = -Infinity
  for (const p of poses) {
    const lf = p.sens === 'vertical' ? p.ligne + p.lettres.length - 1 : p.ligne
    const cf = p.sens === 'horizontal' ? p.colonne + p.lettres.length - 1 : p.colonne
    l0 = Math.min(l0, p.ligne); l1 = Math.max(l1, lf); c0 = Math.min(c0, p.colonne); c1 = Math.max(c1, cf)
  }
  return [l0, l1, c0, c1]
}
