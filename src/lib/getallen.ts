// Le chapitre « Getallen » de Nederlands : les mots de base des nombres (src/data/getallen.json),
// et l'exercice « Nombres » : écrire un nombre en lettres, ou l'inverse, jusqu'à deux millions.
import donnees from '../data/getallen.json'
import type { Matiere, Mot, Vocabulaire } from './mots'
import type { Correction } from './correction'

export const CHAPITRE = 'Getallen'
export const MAXIMUM = 2_000_000
const EST_NEDERLANDS = /^(nederlands|néerlandais|neerlandais)$/i

/** Ajoute le chapitre « Getallen » à la matière Nederlands (ou crée la matière). */
export function avecGetallen(voc: Vocabulaire): Vocabulaire {
  const i = voc.matieres.findIndex(m => EST_NEDERLANDS.test(m.nom.trim()))
  const nom = i >= 0 ? voc.matieres[i].nom : 'Nederlands'
  if (i >= 0 && voc.matieres[i].chapitres.includes(CHAPITRE)) return voc
  const mots: Mot[] = donnees.mots.map(g => ({
    id: `${nom}|${CHAPITRE}|${g.nl}`, matiere: nom, chapitre: CHAPITRE,
    nl: g.nl, det: '', fr: g.fr, definition: '', exemple: '', remarque: g.remarque, getal: g.getal,
  }))
  const matieres: Matiere[] = [...voc.matieres]
  if (i >= 0) matieres[i] = { ...matieres[i], chapitres: [...matieres[i].chapitres, CHAPITRE], mots: [...matieres[i].mots, ...mots] }
  else matieres.unshift({ nom, chapitres: [CHAPITRE], mots })
  return { ...voc, matieres }
}

// ------------------------------------------------------------ en lettres
const UNITES = ['nul', 'een', 'twee', 'drie', 'vier', 'vijf', 'zes', 'zeven', 'acht', 'negen',
  'tien', 'elf', 'twaalf', 'dertien', 'veertien', 'vijftien', 'zestien', 'zeventien', 'achttien', 'negentien']
const DIZAINES = ['', '', 'twintig', 'dertig', 'veertig', 'vijftig', 'zestig', 'zeventig', 'tachtig', 'negentig']

/** 1 à 99 : l'unité, puis « en » (« ën » après un e : tweeëntwintig), puis la dizaine. */
function jusqua99(n: number): string {
  if (n < 20) return UNITES[n]
  const u = n % 10, d = DIZAINES[Math.floor(n / 10)]
  return u ? UNITES[u] + (UNITES[u].endsWith('e') ? 'ën' : 'en') + d : d
}

/** 1 à 999, tout attaché, sans « een » devant honderd. */
function jusqua999(n: number): string {
  const c = Math.floor(n / 100), r = n % 100
  return (c ? (c > 1 ? jusqua99(c) : '') + 'honderd' : '') + (r ? jusqua99(r) : '')
}

/**
 * Le nombre en lettres, selon l'orthographe officielle (Taalunie) : tout attaché jusqu'à mille,
 * une espace après duizend et autour de miljoen. 2 345 → « tweeduizend driehonderdvijfenveertig ».
 */
export function enLettres(n: number): string {
  if (n === 0) return 'nul'
  const mi = Math.floor(n / 1_000_000), k = Math.floor(n / 1000) % 1000, r = n % 1000
  const parties: string[] = []
  if (mi) parties.push(`${jusqua999(mi)} miljoen`)
  if (k) parties.push((k > 1 ? jusqua999(k) : '') + 'duizend')
  if (r) parties.push(jusqua999(r))
  return parties.join(' ')
}

/** Toutes les écritures acceptées : de 1 100 à 9 999, on dit aussi « twaalfhonderdvijftig » (1 250). */
export function ecritures(n: number): string[] {
  const res = [enLettres(n)]
  const centaines = Math.floor(n / 100)
  if (n >= 1100 && n < 10_000 && centaines % 10 !== 0) res.push(jusqua99(centaines) + 'honderd' + (n % 100 ? jusqua99(n % 100) : ''))
  return res
}

/** En chiffres, groupés par trois avec une espace fine : 1 285 000. */
export const enChiffres = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

// ------------------------------------------------------------ correction
const minuscules = (s: string) => s.normalize('NFC').toLowerCase().trim()
/** sans espaces ni traits d'union ; é → e (één), mais le tréma (ë) compte */
const compact = (s: string) => minuscules(s).replace(/[\s\-‐–]+/g, '').replace(/[éè]/g, 'e')
const sansTrema = (s: string) => s.replace(/ë/g, 'e').replace(/ï/g, 'i')

/** Le nombre écrit en lettres. Les espaces ne comptent pas, mais on rappelle où elles vont. */
export function corrigerLettres(texte: string, n: number): Correction {
  const t = compact(texte)
  if (!t) return { resultat: 'faux', message: 'Pas de réponse.' }
  const formes = ecritures(n)
  const juste = formes.find(f => compact(f) === t)
  if (juste) {
    // mêmes lettres, mais pas les mêmes espaces : juste quand même, avec un rappel
    const espaces = minuscules(texte).replace(/[\s\-‐–]+/g, ' ').replace(/[éè]/g, 'e') !== juste
    return { resultat: 'juste', message: espaces ? `On écrit : « ${juste} ».` : '' }
  }
  if (formes.some(f => sansTrema(compact(f)) === sansTrema(t))) {
    return { resultat: 'presque', message: `Attention au tréma : « ${formes[0]} ».` }
  }
  return { resultat: 'faux', message: '' }
}

/** Le nombre écrit en chiffres : espaces, points ou apostrophes entre les milliers sont acceptés. */
export function corrigerChiffres(texte: string, n: number): Correction {
  const t = texte.replace(/[\s.,'’  ]/g, '')
  if (!t) return { resultat: 'faux', message: 'Pas de réponse.' }
  if (!/^\d+$/.test(t)) return { resultat: 'faux', message: 'Écris le nombre en chiffres.' }
  return Number(t) === n ? { resultat: 'juste', message: '' } : { resultat: 'faux', message: '' }
}

// ------------------------------------------------------------ tirage
/**
 * Un nombre au hasard (1 à 2 000 000) où l'on entend le mot de la carte :
 * « tachtig » → 80 à 89 quelque part (483, 85 120…), « duizend » → au moins 1 000.
 */
export function nombreAvec(getal: number, hasard = Math.random): number {
  const entre = (a: number, b: number) => a + Math.floor(hasard() * (b - a + 1))
  const ouRien = (p: number, f: () => number) => (hasard() < p ? 0 : f())
  // un groupe de trois chiffres (1 à 999) où l'on entend le mot
  const groupe = (): number => {
    const centaines = ouRien(0.5, () => entre(1, 9) * 100)
    if (getal === 100) return entre(1, 9) * 100 + ouRien(0.4, () => entre(1, 99))
    if (getal < 10) {
      // pas de dizaine 1 (ce serait dertien, veertien…)
      const d = [0, 2, 3, 4, 5, 6, 7, 8, 9][entre(0, 8)]
      const g = centaines + d * 10 + getal
      return g === 1 ? entre(1, 9) * 100 + 1 : g   // « een » seul devant duizend ne s'entendrait pas
    }
    if (getal < 20) return centaines + getal
    return centaines + getal + entre(0, 9)
  }
  if (getal === 1_000_000) return hasard() < 0.15 ? MAXIMUM : 1_000_000 + ouRien(0.2, () => entre(0, 999) * 1000 + entre(0, 999))
  if (getal === 1000) return entre(1, 999) * 1000 + ouRien(0.3, () => entre(1, 999))
  const s = hasard()
  if (s < 0.35) return groupe()
  if (s < 0.8) return hasard() < 0.5 ? groupe() * 1000 + ouRien(0.3, () => entre(1, 999)) : entre(1, 999) * 1000 + groupe()
  // un million et quelques
  return 1_000_000 + (hasard() < 0.5 ? groupe() * 1000 + entre(0, 999) : entre(0, 999) * 1000 + groupe())
}

// ------------------------------------------------------------ explication
/** 1 à 999 décomposé : « vijfhonderd + achtenzestig (acht + en + zestig) ». */
function decomposer999(n: number): string {
  const c = Math.floor(n / 100), r = n % 100
  const morceaux: string[] = []
  if (c) morceaux.push((c > 1 ? jusqua99(c) : '') + 'honderd')
  if (r) {
    const u = r % 10
    morceaux.push(r > 20 && u ? `${jusqua99(r)} (${UNITES[u]} + ${UNITES[u].endsWith('e') ? 'ën' : 'en'} + ${DIZAINES[Math.floor(r / 10)]})` : jusqua99(r))
  }
  return morceaux.join(' + ')
}

/**
 * Le nombre découpé comme on l'écrit : les millions, les milliers, le reste.
 * 568 086 → [568 000 : vijfhonderdachtenzestigduizend…, 86 : zesentachtig (zes + en + tachtig)]
 */
export function explication(n: number): { chiffres: string; lettres: string; detail: string }[] {
  if (n === 0) return [{ chiffres: '0', lettres: 'nul', detail: '' }]
  const mi = Math.floor(n / 1_000_000), k = Math.floor(n / 1000) % 1000, r = n % 1000
  const res: { chiffres: string; lettres: string; detail: string }[] = []
  if (mi) res.push({ chiffres: enChiffres(mi * 1_000_000), lettres: `${jusqua999(mi)} miljoen`, detail: mi === 1 ? 'avec een, et miljoen séparé' : `${decomposer999(mi)}, puis miljoen séparé` })
  if (k) res.push({ chiffres: enChiffres(k * 1000), lettres: (k > 1 ? jusqua999(k) : '') + 'duizend', detail: k === 1 ? 'duizend seul, sans een' : `${decomposer999(k)} + duizend, attachés` })
  if (r) res.push({ chiffres: enChiffres(r), lettres: jusqua999(r), detail: decomposer999(r) })
  return res
}
