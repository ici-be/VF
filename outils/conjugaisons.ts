// Génère src/data/conjugaisons.json : les 50 verbes néerlandais les plus courants,
// conjugués à 4 temps, avec la forme interrogative.
//
//   node --experimental-strip-types outils/conjugaisons.ts
//
// Les verbes réguliers suivent les règles (radical, « 't kofschip ») ; les formes
// irrégulières sont données à la main ci-dessous. Chaque forme est une liste :
// la première est celle qu'on affiche, les suivantes sont aussi acceptées.
import { writeFileSync } from 'node:fs'

type Aux = 'hebben' | 'zijn' | 'hebben/zijn'

interface Verbe {
  inf: string
  fr: string
  /** radical, si la règle ne le trouve pas (komen → kom) */
  stam?: string
  /** présent entièrement irrégulier : ik, jij, u, hij, (pluriel = infinitif) */
  present?: [string[], string[], string[], string[]]
  /** forme de jij quand le verbe vient avant (« slaap jij ») si elle n'est pas le radical */
  jijInverse?: string[]
  /** imparfait des verbes forts / irréguliers : singulier, pluriel */
  ovt?: [string[], string[]]
  /** participe passé des verbes forts / irréguliers */
  participe?: string[]
  aux?: Aux
}

// Les 50 verbes les plus fréquents (listes de fréquence du néerlandais), sans
// « zullen » qui sert d'auxiliaire du futur.
const VERBES: Verbe[] = [
  { inf: 'zijn', fr: 'être', present: [['ben'], ['bent'], ['bent'], ['is']], jijInverse: ['ben'], ovt: [['was'], ['waren']], participe: ['geweest'], aux: 'zijn' },
  { inf: 'hebben', fr: 'avoir', present: [['heb'], ['hebt'], ['hebt', 'heeft'], ['heeft']], jijInverse: ['heb'], ovt: [['had'], ['hadden']], participe: ['gehad'] },
  { inf: 'worden', fr: 'devenir', ovt: [['werd'], ['werden']], participe: ['geworden'], aux: 'zijn' },
  { inf: 'kunnen', fr: 'pouvoir', present: [['kan'], ['kunt', 'kan'], ['kunt', 'kan'], ['kan']], jijInverse: ['kun', 'kan'], ovt: [['kon'], ['konden']], participe: ['gekund'] },
  { inf: 'moeten', fr: 'devoir', ovt: [['moest'], ['moesten']], participe: ['gemoeten'] },
  { inf: 'willen', fr: 'vouloir', present: [['wil'], ['wilt', 'wil'], ['wilt', 'wil'], ['wil']], jijInverse: ['wil'], ovt: [['wilde', 'wou'], ['wilden']], participe: ['gewild'] },
  { inf: 'mogen', fr: 'avoir le droit de', present: [['mag'], ['mag'], ['mag'], ['mag']], jijInverse: ['mag'], ovt: [['mocht'], ['mochten']], participe: ['gemogen', 'gemocht'] },
  { inf: 'gaan', fr: 'aller', stam: 'ga', ovt: [['ging'], ['gingen']], participe: ['gegaan'], aux: 'zijn' },
  { inf: 'komen', fr: 'venir', stam: 'kom', ovt: [['kwam'], ['kwamen']], participe: ['gekomen'], aux: 'zijn' },
  { inf: 'zien', fr: 'voir', stam: 'zie', ovt: [['zag'], ['zagen']], participe: ['gezien'] },
  { inf: 'zeggen', fr: 'dire', ovt: [['zei'], ['zeiden']], participe: ['gezegd'] },
  { inf: 'doen', fr: 'faire', stam: 'doe', ovt: [['deed'], ['deden']], participe: ['gedaan'] },
  { inf: 'maken', fr: 'faire, fabriquer' },
  { inf: 'krijgen', fr: 'recevoir', ovt: [['kreeg'], ['kregen']], participe: ['gekregen'] },
  { inf: 'laten', fr: 'laisser', ovt: [['liet'], ['lieten']], participe: ['gelaten'] },
  { inf: 'staan', fr: 'être debout', stam: 'sta', ovt: [['stond'], ['stonden']], participe: ['gestaan'] },
  { inf: 'weten', fr: 'savoir', ovt: [['wist'], ['wisten']], participe: ['geweten'] },
  { inf: 'geven', fr: 'donner', ovt: [['gaf'], ['gaven']], participe: ['gegeven'] },
  { inf: 'vinden', fr: 'trouver', ovt: [['vond'], ['vonden']], participe: ['gevonden'] },
  { inf: 'nemen', fr: 'prendre', ovt: [['nam'], ['namen']], participe: ['genomen'] },
  { inf: 'denken', fr: 'penser', ovt: [['dacht'], ['dachten']], participe: ['gedacht'] },
  { inf: 'liggen', fr: 'être couché', ovt: [['lag'], ['lagen']], participe: ['gelegen'] },
  { inf: 'zitten', fr: 'être assis', ovt: [['zat'], ['zaten']], participe: ['gezeten'] },
  { inf: 'houden', fr: 'tenir', ovt: [['hield'], ['hielden']], participe: ['gehouden'] },
  { inf: 'blijven', fr: 'rester', ovt: [['bleef'], ['bleven']], participe: ['gebleven'], aux: 'zijn' },
  { inf: 'brengen', fr: 'apporter', ovt: [['bracht'], ['brachten']], participe: ['gebracht'] },
  { inf: 'kijken', fr: 'regarder', ovt: [['keek'], ['keken']], participe: ['gekeken'] },
  { inf: 'spreken', fr: 'parler', ovt: [['sprak'], ['spraken']], participe: ['gesproken'] },
  { inf: 'lopen', fr: 'marcher', ovt: [['liep'], ['liepen']], participe: ['gelopen'], aux: 'hebben/zijn' },
  { inf: 'horen', fr: 'entendre' },
  { inf: 'beginnen', fr: 'commencer', ovt: [['begon'], ['begonnen']], participe: ['begonnen'], aux: 'zijn' },
  { inf: 'kennen', fr: 'connaître' },
  { inf: 'vragen', fr: 'demander', ovt: [['vroeg'], ['vroegen']], participe: ['gevraagd'] },
  { inf: 'werken', fr: 'travailler' },
  { inf: 'spelen', fr: 'jouer' },
  { inf: 'leren', fr: 'apprendre' },
  { inf: 'wonen', fr: 'habiter' },
  { inf: 'schrijven', fr: 'écrire', ovt: [['schreef'], ['schreven']], participe: ['geschreven'] },
  { inf: 'lezen', fr: 'lire', ovt: [['las'], ['lazen']], participe: ['gelezen'] },
  { inf: 'eten', fr: 'manger', ovt: [['at'], ['aten']], participe: ['gegeten'] },
  { inf: 'drinken', fr: 'boire', ovt: [['dronk'], ['dronken']], participe: ['gedronken'] },
  { inf: 'slapen', fr: 'dormir', ovt: [['sliep'], ['sliepen']], participe: ['geslapen'] },
  { inf: 'zoeken', fr: 'chercher', ovt: [['zocht'], ['zochten']], participe: ['gezocht'] },
  { inf: 'leven', fr: 'vivre' },
  { inf: 'betalen', fr: 'payer' },
  { inf: 'kopen', fr: 'acheter', ovt: [['kocht'], ['kochten']], participe: ['gekocht'] },
  { inf: 'helpen', fr: 'aider', ovt: [['hielp'], ['hielpen']], participe: ['geholpen'] },
  { inf: 'rijden', fr: 'rouler, conduire', ovt: [['reed'], ['reden']], participe: ['gereden'], aux: 'hebben/zijn' },
  { inf: 'vallen', fr: 'tomber', ovt: [['viel'], ['vielen']], participe: ['gevallen'], aux: 'zijn' },
  { inf: 'wachten', fr: 'attendre' },
]

export const PERSONNES = ['ik', 'jij', 'u', 'hij/zij/het', 'wij', 'jullie', 'zij']
/** les pronoms acceptés pour chaque personne (le premier est affiché) */
const PRONOMS = [['ik'], ['jij', 'je'], ['u'], ['hij', 'zij', 'ze', 'het'], ['wij', 'we'], ['jullie'], ['zij', 'ze']]
export const TEMPS = { present: 'Présent', ovt: 'Imparfait', vtt: 'Passé composé', futur: 'Futur' } as const
type Temps = keyof typeof TEMPS

const KOFSCHIP = /(t|k|f|s|ch|p)$/
const VOYELLE = /[aeiou]/

/** Radical : slapen → slaap, zitten → zit, lezen → lees, geven → geef. */
function radical(v: Verbe): { stam: string; consonne: string } {
  if (v.stam) return { stam: v.stam, consonne: v.stam.slice(-1) }
  let b = v.inf.replace(/en$/, '')
  if (/(.)\1$/.test(b) && !VOYELLE.test(b.slice(-1))) b = b.slice(0, -1)             // zitt → zit
  else if (/(^|[^aeiou])[aeou][^aeiouy]$/.test(b)) b = b.slice(0, -2) + b.slice(-2, -1) + b.slice(-2)   // slap → slaap
  const consonne = b.slice(-1)                       // avant z→s, v→f : leven → leef + de (v n'est pas dans 't kofschip)
  const stam = b.replace(/z$/, 's').replace(/v$/, 'f')
  return { stam, consonne: /ch$/.test(b) ? 'ch' : consonne }
}

const fois3 = (x: string[]) => [x, x, x]
const plus = (formes: string[], suite: string) => formes.map(f => `${f} ${suite}`)

function conjuguer(v: Verbe) {
  const { stam, consonne } = radical(v)
  const zachte = !KOFSCHIP.test(consonne)            // « 't kofschip » : -te/-t si la consonne en fait partie
  // hij + t : slaap → slaapt, zit → zit (déjà un t), ga → gaat (voyelle seule doublée)
  const avecT = (s: string) => (/t$/.test(s) ? s : /(^|[^aeiou])[aou]$/.test(s) ? s + s.slice(-1) + 't' : s + 't')
  const present: string[][] = v.present
    ? [...v.present, ...fois3([v.inf])]
    : [[stam], [avecT(stam)], [avecT(stam)], [avecT(stam)], ...fois3([v.inf])]
  const jijInverse = v.jijInverse ?? [stam]

  const ovt: string[][] = v.ovt
    ? [v.ovt[0], v.ovt[0], v.ovt[0], v.ovt[0], ...fois3(v.ovt[1])]
    : (() => { const s = stam + (zachte ? 'de' : 'te'); return [[s], [s], [s], [s], ...fois3([s + 'n'])] })()

  const sansGe = /^(be|ge|her|ver|ont|er)/.test(v.inf)
  const participe = v.participe ?? [(sansGe ? '' : 'ge') + (/[td]$/.test(stam) ? stam : stam + (zachte ? 'd' : 't'))]

  const HEBBEN = [['heb'], ['hebt'], ['hebt', 'heeft'], ['heeft'], ...fois3(['hebben'])]
  const ZIJN = [['ben'], ['bent'], ['bent'], ['is'], ...fois3(['zijn'])]
  const ZULLEN = [['zal'], ['zult', 'zal'], ['zult', 'zal'], ['zal'], ...fois3(['zullen'])]
  const aux = v.aux ?? 'hebben'
  const auxi = (i: number) => aux === 'zijn' ? ZIJN[i] : aux === 'hebben' ? HEBBEN[i] : [...HEBBEN[i], ...ZIJN[i]]
  const auxiInverse = (i: number) => i !== 1 ? auxi(i) : aux === 'zijn' ? ['ben'] : aux === 'hebben' ? ['heb'] : ['heb', 'ben']

  const formes: Record<Temps, string[][]> = {
    present,
    ovt,
    vtt: PERSONNES.map((_, i) => participe.flatMap(p => plus(auxi(i), p))),
    futur: PERSONNES.map((_, i) => plus(ZULLEN[i], v.inf)),
  }

  // forme interrogative : le verbe (conjugué) passe devant le pronom ; « jij » perd son -t
  const devant = (verbes: string[], i: number, suite = '') =>
    verbes.flatMap(f => PRONOMS[i].map(p => `${f} ${p}${suite ? ' ' + suite : ''}`))
  const questions: Record<Temps, string[][]> = {
    present: PERSONNES.map((_, i) => devant(i === 1 ? jijInverse : present[i], i)),
    ovt: PERSONNES.map((_, i) => devant(ovt[i], i)),
    vtt: PERSONNES.map((_, i) => participe.flatMap(p => devant(auxiInverse(i), i, p))),
    futur: PERSONNES.map((_, i) => devant(i === 1 ? ['zul', 'zal'] : ZULLEN[i], i, v.inf)),
  }

  // ce qu'on lit à voix haute après un exercice (le même texte sert aux voix mp3)
  const temps = Object.keys(TEMPS) as Temps[]
  // sans « u » : dans le tableau de conjugaison, u partage la ligne de jij
  const lecture = Object.fromEntries(temps.map(t => [t, PERSONNES.map((_, i) => `${PRONOMS[i][0]} ${formes[t][i][0]}`).filter((_, i) => i !== 2).join(', ')]))
  const questionsTexte = Object.fromEntries(temps.map(t => [t, questions[t].map(q => q[0][0].toUpperCase() + q[0].slice(1) + '?')]))
  const auxAffiche = aux === 'zijn' ? 'is' : aux === 'hebben' ? 'heeft' : 'heeft/is'
  return {
    inf: v.inf,
    fr: v.fr,
    // les temps primitifs, comme dans les listes de verbes : slapen – sliep – heeft geslapen
    primitifs: `${v.inf} – ${ovt[0][0]} (${ovt[4][0]}) – ${auxAffiche} ${participe[0]}`,
    formes,
    questions,
    lecture,
    questionsTexte,
    // « slapen, sliep, sliepen, heeft geslapen »
    lecturePrimitifs: `${v.inf}, ${ovt[0][0]}, ${ovt[4][0]}, ${formes.vtt[3][0]}`,
  }
}

const sortie = {
  genere: 'par outils/conjugaisons.ts — ne pas modifier à la main',
  personnes: PERSONNES,
  pronoms: PRONOMS,
  temps: TEMPS,
  // dans l'ordre de fréquence : rang 1 = zijn
  verbes: VERBES.map((v, i) => ({ rang: i + 1, ...conjuguer(v) })),
}
const chemin = new URL('../src/data/conjugaisons.json', import.meta.url)
writeFileSync(chemin, JSON.stringify(sortie, null, 1) + '\n')
console.log(`${sortie.verbes.length} verbes écrits dans src/data/conjugaisons.json`)
