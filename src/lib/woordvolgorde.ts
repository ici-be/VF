// Woordvolgorde (Nederlands, chapitre 10 « De woordvolgorde », Grammatica Oefenboek p. 31-36) : des phrases toujours
// nouvelles à remettre dans l'ordre en touchant les zinsdelen, comme l'exercice III du cours, et quelques questions à choix.
// Le schéma du cours (p. 33) :
//   OND + PV + bepalingen zonder voorzetsel + bepalingen met voorzetsel + 2de deel van de werkwoordgroep
//   of : maximum 1 bepaling + PV + OND + … (inversie, PV op de 2de plaats, geen komma)
// Bepalingen zonder voorzetsel : voornaamwoorden (het, haar), graag, veel, tijd, LV, MV ; met voorzetsel : TeMPo
// (tijd, begeleiding, manier, plaats) ; achteraan : scheidbaar deel, infinitief. Een bepaling met « naar » staat nooit vooraan.
// Plusieurs ordres sont souvent justes (« Ik ontmoet Jan morgen », « Ik ontmoet morgen Jan », « Morgen ontmoet ik Jan ») :
// chaque zinsdeel a une place [lo, hi] dans le milieu de la phrase, et un ordre est juste quand aucun zinsdeel ne passe
// devant un autre qui doit le précéder.

type Hasard = () => number
const un = <T,>(t: readonly T[], h: Hasard): T => t[Math.floor(h() * t.length)]
function melange<T>(t: T[], h: Hasard): T[] {
  const r = [...t]
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(h() * (i + 1)); [r[i], r[j]] = [r[j], r[i]] }
  return r
}
const hoofd = (s: string) => s[0].toUpperCase() + s.slice(1)

export type Rol = 'ond' | 'pv' | 'vw' | 'bep' | 'slot'
export interface Deel {
  t: string
  rol: Rol
  /** la place dans le milieu de la phrase (après OND + PV) : un zinsdeel ne peut pas passer devant un autre dont hi < son lo */
  lo: number
  hi: number
  /** peut se mettre en tête de phrase (avec inversie) */
  voor: boolean
  /** pour l'explication : tijd, plaats, manier, begeleiding, lijdend voorwerp… */
  naam: string
  /** sa place dans l'ordre montré comme solution, quand ce n'est pas lo */
  kern?: number
}
export interface Zin {
  delen: Deel[]
  /** ja-neevraag ou vraag met vraagwoord : la phrase finit par « ? » */
  vraag: boolean
  /** l'indice du zinsdeel imposé en tête (« Begin met … ») */
  begin?: number
  /** la phrase française (vertalen) */
  fr?: string
}

// ------------------------------------------------------------ les sortes de zinsdelen
const ZONES = {
  vnw: { lo: 1, hi: 1, voor: false, naam: 'voornaamwoord' },
  t: { lo: 1.5, hi: 2.5, voor: true, naam: 'tijd' },
  lv: { lo: 1.8, hi: 2.6, voor: false, naam: 'lijdend voorwerp' },
  bw: { lo: 2, hi: 2, voor: false, naam: 'bepaling zonder voorzetsel' },
  bw2: { lo: 2, hi: 3.5, voor: false, naam: 'bepaling zonder voorzetsel' },
  hier: { lo: 2, hi: 3.5, voor: true, naam: 'plaats' },
  mv: { lo: 2.2, hi: 2.2, voor: false, naam: 'meewerkend voorwerp' },
  lo: { lo: 2.6, hi: 2.6, voor: false, naam: 'lijdend voorwerp' },
  niet: { lo: 2.9, hi: 2.9, voor: false, naam: 'niet' },
  T: { lo: 3, hi: 3, voor: true, naam: 'tijd' },
  B: { lo: 4, hi: 4, voor: true, naam: 'begeleiding' },
  M: { lo: 5, hi: 5, voor: true, naam: 'manier' },
  P: { lo: 6, hi: 6, voor: true, naam: 'plaats' },
  x: { lo: 8, hi: 8, voor: false, naam: 'werkwoordgroep' },
  s: { lo: 9, hi: 9, voor: false, naam: '2de deel van de werkwoordgroep' },
} as const
type Zone = keyof typeof ZONES

function bep(t: string, z: Zone): Deel {
  const k = ZONES[z]
  const naar = z === 'P' && /^naar\b/.test(t)
  return { t, rol: z === 's' ? 'slot' : 'bep', lo: k.lo, hi: k.hi, voor: k.voor && !naar, naam: k.naam }
}
const ond = (t: string): Deel => ({ t, rol: 'ond', lo: 0, hi: 0, voor: false, naam: 'onderwerp' })
const pv = (t: string): Deel => ({ t, rol: 'pv', lo: 0, hi: 0, voor: false, naam: 'persoonsvorm' })
const vw = (t: string): Deel => ({ t, rol: 'vw', lo: 0, hi: 0, voor: false, naam: 'vraagwoord' })

/** « ik=o / ontmoet=p / Jan=lv / morgen=t / op school=P » ; « ^ » devant le zinsdeel imposé en tête. */
export function lees(notatie: string, vraag = false, fr?: string): Zin {
  let begin: number | undefined
  const delen = notatie.split(' / ').map((s, i) => {
    let [t, z] = s.split('=')
    if (t.startsWith('^')) { t = t.slice(1); begin = i }
    if (z === 'o') return ond(t)
    if (z === 'p') return pv(t)
    if (z === 'w') return vw(t)
    if (!(z in ZONES)) throw new Error(`zone inconnue : ${s}`)
    return bep(t, z as Zone)
  })
  // plusieurs voornaamwoorden : dans l'ordre donné (het haar)
  let n = 0
  for (const d of delen) if (d.naam === 'voornaamwoord') { d.lo = d.hi = 1 + n++ / 100 }
  return { delen, vraag, begin, fr }
}

// ------------------------------------------------------------ juste ou pas ?
export interface Oordeel { juist: boolean; waarom: string }
const q = (d: Deel) => `« ${d.t} »`

/** Le milieu de la phrase : aucun zinsdeel devant un autre qui doit le précéder. */
function midden(rest: Deel[]): Oordeel {
  for (let i = 0; i < rest.length; i++) for (let j = i + 1; j < rest.length; j++) {
    const a = rest[i], b = rest[j]
    if (a.lo <= b.hi) continue
    if (a.rol === 'ond' || a.rol === 'pv' || b.rol === 'ond' || b.rol === 'pv' || a.rol === 'vw' || b.rol === 'vw')
      return { juist: false, waarom: 'De persoonsvorm en het onderwerp staan vooraan.' }
    if (a.rol === 'slot') return { juist: false, waarom: `Het 2de deel van de werkwoordgroep (${q(a)}) staat helemaal achteraan.` }
    if (b.rol === 'slot') return { juist: false, waarom: `Het 2de deel van de werkwoordgroep (${q(b)}) staat helemaal achteraan.` }
    if (b.lo === 8) return { juist: false, waarom: `${hoofd(q(b))} hoort bij het werkwoord: het staat achteraan.` }
    if (b.naam === 'voornaamwoord') return { juist: false, waarom: `Voornaamwoorden zoals ${q(b)} staan vlak na de PV en het onderwerp.` }
    if (a.lo >= 3 && b.hi < 3) return { juist: false, waarom: `Bepalingen zonder voorzetsel (${q(b)}) komen vóór bepalingen met voorzetsel (${q(a)}).` }
    if (a.lo >= 3 && b.lo >= 3) return { juist: false, waarom: `TeMPo: tijd – (begeleiding) – manier – plaats. ${hoofd(q(b))} (${b.naam}) komt vóór ${q(a)} (${a.naam}).` }
    if (b.naam === 'meewerkend voorwerp') return { juist: false, waarom: `Het meewerkend voorwerp (${q(b)}) komt vóór het lijdend voorwerp (${q(a)}).` }
    return { juist: false, waarom: `${hoofd(q(b))} komt vóór ${q(a)}.` }
  }
  return { juist: true, waarom: '' }
}

/** L'ordre choisi (les indices des zinsdelen) est-il juste ? Avec la règle du cours qui ne l'est pas. */
export function controleer(z: Zin, volgorde: number[]): Oordeel {
  const d = volgorde.map(i => z.delen[i])
  const pvd = z.delen.find(x => x.rol === 'pv')!, ondd = z.delen.find(x => x.rol === 'ond')!
  const vwd = z.delen.find(x => x.rol === 'vw')
  if (z.begin !== undefined && volgorde[0] !== z.begin) return { juist: false, waarom: `Begin de zin met ${q(z.delen[z.begin])}.` }
  if (vwd) {
    if (d[0] !== vwd) return { juist: false, waarom: `Een vraag met een vraagwoord begint met het vraagwoord (${q(vwd)}).` }
    if (d[1] !== pvd || d[2] !== ondd) return { juist: false, waarom: `Na het vraagwoord: eerst de PV, dan het onderwerp (${q(pvd)} + ${q(ondd)}).` }
    return midden(d.slice(3))
  }
  if (z.vraag) {
    if (d[0] !== pvd || d[1] !== ondd) return { juist: false, waarom: `Een ja-neevraag begint met de PV, dan het onderwerp: ${hoofd(pvd.t)} ${ondd.t} …?` }
    return midden(d.slice(2))
  }
  if (d[0] === pvd) return { juist: false, waarom: `Dit is geen vraag: de PV (${q(pvd)}) staat op de tweede plaats.` }
  if (d[0] === ondd) {
    if (d[1] !== pvd) return { juist: false, waarom: `De PV (${q(pvd)}) staat altijd op de tweede plaats, meteen na het onderwerp.` }
    return midden(d.slice(2))
  }
  const eerste = d[0]
  if (d[1] !== pvd) {
    if (d[1] === ondd) return { juist: false, waarom: `Je begint met ${q(eerste)}: dan inversie! Eerst de PV, dan het onderwerp: ${q(eerste)} ${pvd.t} ${ondd.t} …` }
    return { juist: false, waarom: `Maximaal één bepaling vóór de PV: de PV (${q(pvd)}) staat altijd op de tweede plaats.` }
  }
  if (!eerste.voor) {
    if (/^naar\b/.test(eerste.t)) return { juist: false, waarom: `Een bepaling van plaats met « naar » staat nooit op de eerste plaats.` }
    if (eerste.rol === 'slot') return { juist: false, waarom: `Het 2de deel van de werkwoordgroep (${q(eerste)}) staat achteraan, niet vooraan.` }
    return { juist: false, waarom: `Begin met het onderwerp, of met één bepaling van tijd, plaats, manier of begeleiding — niet met ${q(eerste)}.` }
  }
  if (d[2] !== ondd) return { juist: false, waarom: `Je begint met ${q(eerste)}: inversie! Na de PV komt meteen het onderwerp (${q(ondd)}).` }
  return midden(d.slice(3))
}

/** Un ordre juste : celui qui commence par l'onderwerp (ou par l'élément donné, avec inversie). */
export function oplossing(z: Zin, eerst?: number): number[] {
  const idx = (r: Rol) => z.delen.findIndex(x => x.rol === r)
  const pvI = idx('pv'), ondI = idx('ond'), vwI = idx('vw')
  const kop = vwI >= 0 ? [vwI, pvI, ondI] : z.vraag ? [pvI, ondI]
    : (eerst ?? z.begin) !== undefined && (eerst ?? z.begin) !== ondI ? [(eerst ?? z.begin)!, pvI, ondI] : [ondI, pvI]
  const plek = (d: Deel) => d.kern ?? d.lo
  const rest = z.delen.map((_, i) => i).filter(i => !kop.includes(i)).sort((a, b) => plek(z.delen[a]) - plek(z.delen[b]) || a - b)
  return [...kop, ...rest]
}

/** La phrase écrite : majuscule, point ou point d'interrogation. */
export const zinTekst = (z: Zin, volgorde: number[]) =>
  hoofd(volgorde.map(i => z.delen[i].t).join(' ')) + (z.vraag ? '?' : '.')

/** Les zinsdelen dans un ordre mélangé, jamais un ordre déjà juste. */
export function schudden(z: Zin, h: Hasard): number[] {
  const n = z.delen.map((_, i) => i)
  for (let k = 0; k < 30; k++) {
    const s = melange(n, h)
    if (!controleer(z, s).juist) return s
  }
  return [...n].reverse()
}

// ------------------------------------------------------------ les phrases inventées
interface Ond { nl: string; fr: string; p: number }
/** p : la personne (je, tu, il, nous, vous, ils) */
const ONDERWERPEN: Ond[] = [
  { nl: 'ik', fr: 'je', p: 0 }, { nl: 'hij', fr: 'il', p: 2 }, { nl: 'ze', fr: 'elle', p: 2 }, { nl: 'Lola', fr: 'Lola', p: 2 },
  { nl: 'Arthur', fr: 'Arthur', p: 2 }, { nl: 'mijn broer', fr: 'mon frère', p: 2 }, { nl: 'de leerlingen', fr: 'les élèves', p: 5 },
  { nl: 'we', fr: 'nous', p: 3 }, { nl: 'mijn ouders', fr: 'mes parents', p: 5 }, { nl: 'Tom en Sofie', fr: 'Tom et Sofie', p: 5 },
]
/** dans les questions : je (tu), jullie (vous) */
const VRAGERS: Ond[] = [{ nl: 'je', fr: 'tu', p: 1 }, { nl: 'je', fr: 'tu', p: 1 }, { nl: 'jullie', fr: 'vous', p: 4 }]
type B = [string, string]
interface Act {
  /** ik, hij, wij (je dans une question : la forme de ik) */
  nl: [string, string, string]
  inf: string
  /** scheidbaar deel (sta … op) */
  deel?: string
  fr: string[]
  frInf?: string
  frRest?: string
  lv?: B[]
  P?: B[]
  M?: B[]
  /** pas de bepaling de begeleiding */
  alleen?: boolean
  /** toujours une bepaling de plaats (« ik ga » seul ne se dit pas) */
  metP?: boolean
}
const NAAR: B[] = [['naar school', 'à l’école'], ['naar de bioscoop', 'au cinéma'], ['naar zee', 'à la mer'], ['naar Walibi', 'à Walibi'],
  ['naar het zwembad', 'à la piscine'], ['naar Brussel', 'à Bruxelles'], ['naar oma', 'chez grand-mère'], ['naar Mechelen', 'à Malines']]
const VERVOER: B[] = [['met de bus', 'en bus'], ['met de trein', 'en train'], ['met de fiets', 'à vélo'], ['te voet', 'à pied'], ['met de auto', 'en voiture']]
const ACTS: Act[] = [
  { nl: ['ga', 'gaat', 'gaan'], inf: 'gaan', fr: ['vais', 'vas', 'va', 'allons', 'allez', 'vont'], frInf: 'aller', P: NAAR, M: VERVOER, metP: true },
  { nl: ['vertrek', 'vertrekt', 'vertrekken'], inf: 'vertrekken', fr: ['pars', 'pars', 'part', 'partons', 'partez', 'partent'], frInf: 'partir',
    P: [['naar zee', 'à la mer'], ['naar Spanje', 'en Espagne'], ['naar Londen', 'à Londres'], ['naar school', 'à l’école']], M: VERVOER },
  { nl: ['zwem', 'zwemt', 'zwemmen'], inf: 'zwemmen', fr: ['nage', 'nages', 'nage', 'nageons', 'nagez', 'nagent'], frInf: 'nager',
    P: [['in het zwembad', 'à la piscine'], ['in de zee', 'dans la mer'], ['in het meer', 'dans le lac']] },
  { nl: ['wandel', 'wandelt', 'wandelen'], inf: 'wandelen', fr: ['fais', 'fais', 'fait', 'faisons', 'faites', 'font'], frInf: 'faire', frRest: 'une promenade',
    P: [['in het bos', 'dans le bois'], ['in de duinen', 'dans les dunes'], ['in het park', 'dans le parc']] },
  { nl: ['speel', 'speelt', 'spelen'], inf: 'spelen', fr: ['joue', 'joues', 'joue', 'jouons', 'jouez', 'jouent'], frInf: 'jouer',
    lv: [['voetbal', 'au football'], ['tennis', 'au tennis'], ['basketbal', 'au basket']], P: [['op het plein', 'sur la place'], ['in het park', 'dans le parc'], ['op school', 'à l’école']] },
  { nl: ['eet', 'eet', 'eten'], inf: 'eten', fr: ['mange', 'manges', 'mange', 'mangeons', 'mangez', 'mangent'], frInf: 'manger',
    lv: [['een boterham', 'une tartine'], ['frieten', 'des frites'], ['soep', 'de la soupe'], ['een appel', 'une pomme']],
    P: [['in de keuken', 'dans la cuisine'], ['in de refter', 'au réfectoire'], ['in de tuin', 'au jardin']] },
  { nl: ['lees', 'leest', 'lezen'], inf: 'lezen', fr: ['lis', 'lis', 'lit', 'lisons', 'lisez', 'lisent'], frInf: 'lire',
    lv: [['een boek', 'un livre'], ['een strip', 'une BD'], ['de krant', 'le journal']], P: [['in bed', 'au lit'], ['in de bibliotheek', 'à la bibliothèque'], ['in de tuin', 'au jardin']], alleen: true },
  { nl: ['ontmoet', 'ontmoet', 'ontmoeten'], inf: 'ontmoeten', fr: ['rencontre', 'rencontres', 'rencontre', 'rencontrons', 'rencontrez', 'rencontrent'], frInf: 'rencontrer',
    lv: [['Jan', 'Jan'], ['de buren', 'les voisins'], ['de trainer', 'l’entraîneur']], P: [['op school', 'à l’école'], ['in het park', 'dans le parc'], ['in de stad', 'en ville']], alleen: true },
  { nl: ['studeer', 'studeert', 'studeren'], inf: 'studeren', fr: ['étudie', 'étudies', 'étudie', 'étudions', 'étudiez', 'étudient'], frInf: 'étudier',
    P: [['in de bibliotheek', 'à la bibliothèque'], ['in de klas', 'en classe']] },
  { nl: ['werk', 'werkt', 'werken'], inf: 'werken', fr: ['travaille', 'travailles', 'travaille', 'travaillons', 'travaillez', 'travaillent'], frInf: 'travailler',
    P: [['in de tuin', 'au jardin'], ['in de klas', 'en classe'], ['op kantoor', 'au bureau']] },
]
/** les verbes à particule séparable : le 2de deel van de werkwoordgroep */
const SCHEIDBAAR: Act[] = [
  { nl: ['sta', 'staat', 'staan'], inf: 'opstaan', deel: 'op', fr: ['me lève', 'te lèves', 'se lève', 'nous levons', 'vous levez', 'se lèvent'], alleen: true },
  { nl: ['maak', 'maakt', 'maken'], inf: 'klaarmaken', deel: 'klaar', fr: ['prépare', 'prépares', 'prépare', 'préparons', 'préparez', 'préparent'],
    lv: [['het ontbijt', 'le petit-déjeuner'], ['het avondeten', 'le souper'], ['de soep', 'la soupe']], P: [['in de keuken', 'dans la cuisine']] },
  { nl: ['bel', 'belt', 'bellen'], inf: 'opbellen', deel: 'op', fr: ['téléphone', 'téléphones', 'téléphone', 'téléphonons', 'téléphonez', 'téléphonent'],
    lv: [['oma', 'à grand-mère'], ['de dokter', 'au médecin'], ['de leraar', 'au professeur']], alleen: true },
  { nl: ['kom', 'komt', 'komen'], inf: 'terugkomen', deel: 'terug', fr: ['reviens', 'reviens', 'revient', 'revenons', 'revenez', 'reviennent'],
    P: [['uit Spanje', 'd’Espagne'], ['uit Frankrijk', 'de France'], ['uit Londen', 'de Londres']], M: [['met de trein', 'en train'], ['met het vliegtuig', 'en avion'], ['met de bus', 'en bus']] },
  { nl: ['was', 'wast', 'wassen'], inf: 'afwassen', deel: 'af', fr: ['fais', 'fais', 'fait', 'faisons', 'faites', 'font'], frRest: 'la vaisselle', alleen: true },
]
interface Modal { nl: [string, string, string]; fr: string[] }
const MODALEN: Modal[] = [
  { nl: ['moet', 'moet', 'moeten'], fr: ['dois', 'dois', 'doit', 'devons', 'devez', 'doivent'] },
  { nl: ['wil', 'wil', 'willen'], fr: ['veux', 'veux', 'veut', 'voulons', 'voulez', 'veulent'] },
  { nl: ['mag', 'mag', 'mogen'], fr: ['peux', 'peux', 'peut', 'pouvons', 'pouvez', 'peuvent'] },
]
const TIJD: B[] = [['morgen', 'demain'], ['vandaag', 'aujourd’hui'], ['vanavond', 'ce soir'], ['elke dag', 'chaque jour'], ['elke vrijdag', 'chaque vendredi'],
  ['volgende week', 'la semaine prochaine'], ['overmorgen', 'après-demain'], ['elke morgen', 'chaque matin'], ['zaterdagmorgen', 'samedi matin']]
/** les heures, qui vont avec un jour (« elke morgen om halfacht »), puis les périodes, seules */
const UREN: B[] = [['om acht uur', 'à huit heures'], ['om halfacht', 'à sept heures et demie'], ['na school', 'après l’école'], ['na het eten', 'après le repas']]
const TIJD_VZ: B[] = [...UREN, ['in het weekend', 'le week-end'], ['op woensdag', 'le mercredi'], ['in juli', 'en juillet'], ['tijdens de vakantie', 'pendant les vacances']]
const BEGELEIDING: B[] = [['met de klas', 'avec la classe'], ['met de jeugdclub', 'avec le club de jeunes'], ['met vrienden', 'avec des amis'],
  ['met oma', 'avec grand-mère'], ['met de scouts', 'avec les scouts'], ['met de buren', 'avec les voisins']]

const vorm = (nl: [string, string, string], p: number) => (p <= 1 ? nl[0] : p === 2 ? nl[1] : nl[2])
const lidwoord = (t: string) => /^(de|het|mijn|oma|Jan)\b/.test(t)

interface Spec {
  o: Ond; act: Act; modal?: Modal
  lv?: B; t?: B; T?: B; B?: B; M?: B; P?: B
  /** ja-neevraag, ou le vraagwoord qui remplace une bepaling */
  vraag?: 'janee' | 'wanneer' | 'hoe' | 'met wie' | 'waar'
}

const VW_FR = { wanneer: 'Quand', hoe: 'Comment', 'met wie': 'Avec qui', waar: 'Où' }

function bouw(s: Spec): Zin {
  const { o, act, modal } = s
  const delen: Deel[] = []
  const vraagwoord = s.vraag && s.vraag !== 'janee' ? s.vraag : undefined
  if (vraagwoord) delen.push(vw(vraagwoord))
  delen.push(ond(o.nl), pv(modal ? vorm(modal.nl, o.p) : vorm(act.nl, o.p)))
  if (s.lv) {
    const lv = bep(s.lv[0], lidwoord(s.lv[0]) ? 'lv' : 'lo')
    // « moet met de klas voetbal spelen » : devant l'infinitif ou la particule, le LV sans lidwoord peut aller à la fin
    if (!lidwoord(s.lv[0]) && (modal || act.deel)) { lv.hi = 8; lv.kern = 8 }
    delen.push(lv)
  }
  if (s.t && vraagwoord !== 'wanneer') delen.push(bep(s.t[0], 't'))
  if (s.T && vraagwoord !== 'wanneer') delen.push(bep(s.T[0], 'T'))
  if (s.B && vraagwoord !== 'met wie') delen.push(bep(s.B[0], 'B'))
  if (s.M && vraagwoord !== 'hoe') delen.push(bep(s.M[0], 'M'))
  if (s.P && vraagwoord !== 'waar') delen.push(bep(s.P[0], 'P'))
  if (modal) delen.push(bep(act.inf, 's'))
  else if (act.deel) delen.push(bep(act.deel, 's'))
  // la phrase française
  const verbe = modal ? modal.fr[o.p] : act.fr[o.p]
  const suite = [modal ? act.frInf : '', act.frRest, s.lv?.[1], s.M && vraagwoord !== 'hoe' ? s.M[1] : '', s.B && vraagwoord !== 'met wie' ? s.B[1] : '',
    s.P && vraagwoord !== 'waar' ? s.P[1] : ''].filter(Boolean)
  let fr: string
  if (s.vraag) {
    const tijd = vraagwoord === 'wanneer' ? [] : [s.t?.[1], s.T?.[1]].filter(Boolean)
    const kop = `${verbe}-${o.fr}`
    fr = `${vraagwoord ? `${VW_FR[vraagwoord]} ${kop}` : hoofd(kop)} ${[...suite, ...tijd].join(' ')}`.trim() + ' ?' + (o.p === 4 ? ' (jullie)' : '')
  } else {
    const sujet = o.fr === 'je' && /^[aeiouéèh]/.test(verbe) ? 'j’' : `${o.fr} `
    const kern = `${sujet}${verbe} ${[...suite, s.T?.[1]].filter(Boolean).join(' ')}`.trim()
    fr = s.t ? `${hoofd(s.t[1])}, ${kern}.` : `${hoofd(kern)}.`
  }
  return { delen, vraag: !!s.vraag, fr: fr.replace(/\s+/g, ' ').replace(/ ([.,])/g, '$1') }
}

/** Une phrase au hasard, avec au moins `min` zinsdelen. */
function verzin(h: Hasard, opties: { scheidbaar?: boolean; modal?: boolean; vraag?: boolean; tempo?: boolean; min?: number } = {}): Spec {
  const act = un(opties.scheidbaar ? SCHEIDBAAR : ACTS, h)
  // pas de modal avec un verbe à particule (la phrase française ne suivrait pas)
  const modal = opties.modal && !opties.scheidbaar ? un(MODALEN, h) : undefined
  const o = un(opties.vraag ? VRAGERS : ONDERWERPEN, h)
  const s: Spec = { o, act, modal }
  if (act.lv) s.lv = un(act.lv, h)
  const kans = opties.tempo ? .75 : .5
  if (h() < .6) s.t = un(TIJD, h)
  if (h() < (s.t ? .3 : kans)) s.T = un(s.t ? UREN : TIJD_VZ, h)
  if (!act.alleen && h() < kans) s.B = un(BEGELEIDING, h)
  if (act.M && h() < kans) s.M = un(act.M, h)
  if (act.P && (act.metP || h() < (opties.tempo ? .9 : .7))) s.P = un(act.P, h)
  const aantal = () => 2 + [s.lv, s.t, s.T, s.B, s.M, s.P, modal || act.deel].filter(Boolean).length
  // assez de zinsdelen pour que l'ordre compte
  const min = opties.min ?? 4
  for (const k of melange(['t', 'T', 'P', 'M', 'B'] as const, h)) {
    if (aantal() >= min) break
    if (k === 't' && !s.t) s.t = un(TIJD, h)
    if (k === 'T' && !s.T) s.T = un(s.t ? UREN : TIJD_VZ, h)
    if (k === 'P' && !s.P && act.P) s.P = un(act.P, h)
    if (k === 'M' && !s.M && act.M) s.M = un(act.M, h)
    if (k === 'B' && !s.B && !act.alleen) s.B = un(BEGELEIDING, h)
  }
  if (aantal() < min && !s.t) s.t = un(TIJD, h)
  if (aantal() < min && !s.T) s.T = un(UREN, h)
  return s
}

// ------------------------------------------------------------ les questions
export type QuestionWv =
  | { soort: 'puzzel'; zin: Zin; schud: number[]; boven?: string; astuce: string; uitleg: string }
  | { soort: 'keuze'; zin?: Zin; volgorde?: number[]; vraag: string; options: string[]; bonne: string; uitleg: string; longues?: boolean }

const UITLEG_SCHEMA = 'Onderwerp + PV + bepalingen zonder voorzetsel + bepalingen met voorzetsel (TeMPo) + 2de deel van de werkwoordgroep.'
const UITLEG_INVERSIE = 'Begin je met een bepaling, dan doe je een inversie: de PV blijft op de tweede plaats, het onderwerp komt erna. Geen komma!'

function puzzel(zin: Zin, h: Hasard, astuce: string, uitleg: string, boven?: string): QuestionWv {
  return { soort: 'puzzel', zin, schud: schudden(zin, h), boven, astuce, uitleg }
}

/** Een ja-neevraag maken : la PV en tête, puis l'onderwerp (le zinsdeel mis en tête retourne à sa place). */
function janee(z: Zin): string {
  const v = oplossing({ ...z, begin: undefined, vraag: true })
  return zinTekst({ ...z, vraag: true }, v)
}

/** PV of onderwerp : la phrase, et le zinsdeel à trouver parmi quatre. */
function pvOnd(z: Zin, volgorde: number[], h: Hasard): QuestionWv {
  const zoek = h() < .5 ? 'pv' : 'ond'
  const juist = z.delen.find(d => d.rol === zoek)!
  // les pièges : l'autre (ond ou pv), l'infinitif ou la particule, puis les autres zinsdelen
  const anderen = melange(z.delen.filter(d => d !== juist), h).sort((a, b) => Number(b.rol !== 'bep') - Number(a.rol !== 'bep'))
  const options = melange([juist.t, ...[...new Set(anderen.map(d => d.t))].filter(t => t !== juist.t).slice(0, 3)], h)
  const pvd = z.delen.find(d => d.rol === 'pv')!, ondd = z.delen.find(d => d.rol === 'ond')!
  const eerste = z.delen[volgorde[0]]
  const inversie = !z.vraag && eerste.rol === 'bep' ? ` De zin begint met « ${eerste.t} »: inversie, het onderwerp staat na de PV.` : ''
  const slot = z.delen.find(d => d.rol === 'slot')
  const uitleg = zoek === 'pv'
    ? `Maak er een ja-neevraag van: « ${janee(z)} » De PV is het eerste woord: ${pvd.t}.${slot ? ` « ${slot.t} » is geen PV: het is het 2de deel van de werkwoordgroep.` : ''}`
    : `Vraag « wie of wat ${pvd.t} …? » → ${ondd.t}.${inversie}`
  return { soort: 'keuze', zin: z, volgorde, vraag: zoek === 'pv' ? 'Wat is de persoonsvorm (PV)?' : 'Wat is het onderwerp?', options, bonne: juist.t, uitleg }
}

/** Un ordre juste au hasard : l'onderwerp en tête, ou une bepaling (inversie). */
function volgordeZin(z: Zin, h: Hasard): number[] {
  const vooraan = z.delen.map((d, i) => (d.voor ? i : -1)).filter(i => i >= 0)
  return !z.vraag && vooraan.length && h() < .5 ? oplossing(z, un(vooraan, h)) : oplossing(z)
}

function kaartPvOnd(h: Hasard): QuestionWv {
  const z = bouw(verzin(h, { modal: h() < .25, scheidbaar: h() < .2 }))
  return pvOnd(z, volgordeZin(z, h), h)
}

function kaartInversie(h: Hasard): QuestionWv {
  for (;;) {
    const z = bouw(verzin(h, { modal: h() < .25 }))
    const vooraan = z.delen.map((d, i) => (d.voor ? i : -1)).filter(i => i >= 0)
    if (!vooraan.length) continue
    z.begin = un(vooraan, h)
    return puzzel(z, h, `Begin de zin met « ${z.delen[z.begin].t} ».`, UITLEG_INVERSIE)
  }
}

function kaartTempo(h: Hasard): QuestionWv {
  for (;;) {
    const z = bouw(verzin(h, { tempo: true, min: 5 }))
    if (z.delen.filter(d => d.lo >= 3 && d.lo <= 6).length < 2) continue
    return puzzel(z, h, 'Zet de zinsdelen in de goede volgorde.', `TeMPo: Tijd – Manier – Plaats (begeleiding vóór manier). ${UITLEG_SCHEMA}`)
  }
}

function kaartWerkwoordgroep(h: Hasard): QuestionWv {
  const scheidbaar = h() < .5
  const s = verzin(h, { scheidbaar, modal: !scheidbaar })
  const z = bouw(s)
  const slot = z.delen.find(d => d.rol === 'slot')!
  return puzzel(z, h, 'Zet de zinsdelen in de goede volgorde.',
    `${scheidbaar ? `« ${s.act.inf} » is een scheidbaar werkwoord: het deel « ${slot.t} »` : `De infinitief « ${slot.t} »`} is het 2de deel van de werkwoordgroep: helemaal achteraan.`)
}

function kaartVragen(h: Hasard): QuestionWv {
  for (;;) {
    const s = verzin(h, { vraag: true, modal: h() < .25, scheidbaar: h() < .15 })
    const mogelijk: NonNullable<Spec['vraag']>[] = ['janee', 'janee']
    if (s.t || s.T) mogelijk.push('wanneer')
    if (s.M) mogelijk.push('hoe')
    if (s.B) mogelijk.push('met wie')
    if (s.P && !/^naar\b/.test(s.P[0])) mogelijk.push('waar')
    s.vraag = un(mogelijk, h)
    const z = bouw(s)
    if (z.delen.length < 4) continue
    const je = s.o.nl === 'je' ? ' Met « je » na de PV valt de t weg: ga je, kom je.' : ''
    const uitleg = s.vraag === 'janee'
      ? `Een ja-neevraag begint met de PV, dan komt het onderwerp.${je}`
      : `Een vraagwoord (« ${s.vraag} ») staat vooraan, dan de PV, dan het onderwerp.${je}`
    return puzzel(z, h, 'Maak een vraag: zet de zinsdelen in de goede volgorde.', uitleg)
  }
}

/** Comme l'exercice I du cours : « Ik ontmoet Jan. (op school, morgen) ». */
function kaartAanvullen(h: Hasard): QuestionWv {
  for (;;) {
    const z = bouw(verzin(h, { modal: h() < .2, min: 5 }))
    const extra = z.delen.filter(d => d.rol === 'bep' && d.lo >= 1.5 && d.lo <= 6 && d.naam !== 'lijdend voorwerp')
    if (extra.length < 2) continue
    const basis = z.delen.filter(d => !extra.includes(d))
    const zonder: Zin = { delen: basis, vraag: false }
    const kort = zinTekst(zonder, oplossing(zonder))
    return puzzel(z, h, 'Vul de zin aan met de bepalingen tussen haakjes.', UITLEG_SCHEMA, `${kort} (${melange(extra, h).map(d => d.t).join(', ')})`)
  }
}

function kaartVertalen(h: Hasard): QuestionWv {
  const k = h()
  const s = k < .2 ? verzin(h, { vraag: true }) : verzin(h, { modal: k < .4, scheidbaar: k > .85 })
  if (k < .2) s.vraag = 'janee'
  const z = bouw(s)
  return puzzel(z, h, 'Vertaal: zet de zinsdelen in de goede volgorde.', s.vraag ? 'Een ja-neevraag: PV + onderwerp + de rest.' : `${UITLEG_SCHEMA} ${UITLEG_INVERSIE}`, z.fr)
}

// ------------------------------------------------------------ welke zin is juist ? (les règles p. 32)
interface Deelzin { o: string; v: string; r: string }
const VOEGWOORDEN: { vw: string; a: string; b: Deelzin }[] = [
  { vw: 'want', a: 'Piet gaat niet naar school', b: { o: 'hij', v: 'is', r: 'ziek' } },
  { vw: 'want', a: 'Ik neem een jas', b: { o: 'het', v: 'is', r: 'koud' } },
  { vw: 'want', a: 'We blijven thuis', b: { o: 'het', v: 'regent', r: 'buiten' } },
  { vw: 'want', a: 'Sofie eet niets', b: { o: 'ze', v: 'heeft', r: 'geen honger' } },
  { vw: 'want', a: 'Ik ga vroeg slapen', b: { o: 'ik', v: 'ben', r: 'moe' } },
  { vw: 'want', a: 'Tom lacht', b: { o: 'de film', v: 'is', r: 'grappig' } },
  { vw: 'maar', a: 'Op zaterdag sta ik om 7 uur op', b: { o: 'ik', v: 'ga', r: 'niet naar school' } },
  { vw: 'maar', a: 'Ik hou van sport', b: { o: 'ik', v: 'speel', r: 'geen voetbal' } },
  { vw: 'maar', a: 'Het regent', b: { o: 'we', v: 'gaan', r: 'toch naar het park' } },
  { vw: 'maar', a: 'Ik lust kaas', b: { o: 'ik', v: 'lust', r: 'geen melk' } },
  { vw: 'maar', a: 'Mijn broer is groot', b: { o: 'hij', v: 'is', r: 'niet sterk' } },
  { vw: 'en', a: 'Rik heeft een zus', b: { o: 'ik', v: 'heb', r: 'een broer' } },
  { vw: 'en', a: 'Ik speel gitaar', b: { o: 'mijn zus', v: 'zingt', r: 'een lied' } },
  { vw: 'en', a: 'Lola leest een boek', b: { o: 'Arthur', v: 'kijkt', r: 'tv' } },
  { vw: 'en', a: 'Mama kookt', b: { o: 'papa', v: 'dekt', r: 'de tafel' } },
  { vw: 'of', a: 'Hij gaat zeilen', b: { o: 'hij', v: 'blijft', r: 'thuis' } },
  { vw: 'of', a: 'We gaan naar zee', b: { o: 'we', v: 'blijven', r: 'in Brussel' } },
  { vw: 'of', a: 'Ik neem de bus', b: { o: 'ik', v: 'ga', r: 'te voet' } },
]
const JANEE: { w: string; b: Deelzin }[] = [
  { w: 'Ja', b: { o: 'ik', v: 'kom', r: 'morgen ook' } }, { w: 'Neen', b: { o: 'ik', v: 'kom', r: 'morgen niet' } },
  { w: 'Ja', b: { o: 'we', v: 'gaan', r: 'naar zee' } }, { w: 'Neen', b: { o: 'hij', v: 'is', r: 'niet thuis' } },
  { w: 'Ja', b: { o: 'ik', v: 'lust', r: 'spruitjes' } }, { w: 'Neen', b: { o: 'ze', v: 'speelt', r: 'geen piano' } },
  { w: 'Ja', b: { o: 'ik', v: 'heb', r: 'mijn huiswerk gemaakt' } }, { w: 'Neen', b: { o: 'we', v: 'hebben', r: 'geen tijd' } },
]

function kaartRegels(h: Hasard): QuestionWv {
  const soort = un(['voegwoord', 'voegwoord', 'janee', 'zinsbouw', 'zinsbouw'] as const, h)
  let bonne: string, fout: string[], uitleg: string
  if (soort === 'voegwoord') {
    const { vw: w, a, b } = un(VOEGWOORDEN, h)
    const komma = w === 'want' || w === 'maar' ? ',' : ''
    bonne = `${a}${komma} ${w} ${b.o} ${b.v} ${b.r}.`
    fout = [`${a}${komma} ${w} ${b.v} ${b.o} ${b.r}.`, `${a}${komma} ${w} ${b.o} ${b.r} ${b.v}.`,
      komma ? `${a} ${w} ${b.o} ${b.v} ${b.r}.` : `${a}, ${w} ${b.v} ${b.o} ${b.r}.`]
    uitleg = `Na « ${w} » is er geen inversie: onderwerp + PV (${w} ${b.o} ${b.v}). Je schrijft een komma vóór « want » en « maar ».`
  } else if (soort === 'janee') {
    const { w, b } = un(JANEE, h)
    bonne = `${w}, ${b.o} ${b.v} ${b.r}.`
    fout = [`${w} ${b.o} ${b.v} ${b.r}.`, `${w}, ${b.v} ${b.o} ${b.r}.`, `${w} ${b.v} ${b.o} ${b.r}.`]
    uitleg = `Na « ja » en « neen » schrijf je een komma, en er is geen inversie: ${bonne}`
  } else {
    // une phrase avec une bepaling de temps et « naar … »
    let s: Spec
    do { s = verzin(h, { min: 4 }) } while (!s.P || !/^naar\b/.test(s.P[0]))
    s.t ??= un(TIJD, h); s.B = undefined; s.T = undefined; s.lv = undefined
    const z = bouw(s)
    const d = (r: Rol) => z.delen.find(x => x.rol === r)!.t
    const t = s.t[0], p = s.P[0], m = s.M?.[0]
    const rest = (zonder: string[]) => [m, p].filter(x => x && !zonder.includes(x)).join(' ')
    const zin = (x: string) => hoofd(x.replace(/\s+/g, ' ').trim()) + '.'
    bonne = h() < .5 ? zin(`${t} ${d('pv')} ${d('ond')} ${rest([])}`) : zin(`${d('ond')} ${d('pv')} ${t} ${rest([])}`)
    fout = melange([
      zin(`${p} ${d('pv')} ${d('ond')} ${t} ${rest([p])}`),
      zin(`${t} ${p} ${d('pv')} ${d('ond')} ${rest([p])}`),
      zin(`${t} ${d('ond')} ${d('pv')} ${rest([])}`),
      zin(`${t}, ${d('pv')} ${d('ond')} ${rest([])}`),
    ], h).slice(0, 3)
    uitleg = `Na één bepaling vooraan: inversie (PV + onderwerp), zonder komma. Maximaal één bepaling vóór de PV, en een bepaling met « naar » staat nooit vooraan.`
  }
  return { soort: 'keuze', vraag: 'Welke zin is juist?', options: melange([...new Set([bonne, ...fout])], h), bonne, uitleg, longues: true }
}

// ------------------------------------------------------------ les phrases du cours
const BOEK_PV: string[] = [
  'Ibrahim=o / staat=p / in de badkamer=P', 'ik=o / kook=p / een lekkere maaltijd=lo', 'hij=o / zwemt=p / bijna honderd lengtes=lo',
  'mijn zus=o / leent=p / altijd=bw / mijn kleren=lv', 'jullie=o / gaan=p / te voet=M / naar school=P', 'mijn schrift=o / steekt=p / in mijn bank=P',
  'in de klas=P / is=p / het=o / altijd=bw / koud=x', 'morgen=t / gaan=p / we=o / op excursie=P', 'met mijn vrienden=B / maak=p / ik=o / veel plezier=lo',
  'elke vrijdag=t / neem=p / ik=o / mijn zwemspullen=lv / mee=s',
]
const BOEK: { n: string; vraag?: boolean; boven?: string; bron: string }[] = [
  // la théorie (p. 31-34)
  { n: 'Luna=o / gaat=p / twee keer per maand=t / met haar vriendin=B / naar de bioscoop=P', bron: 'p. 32' },
  { n: 'ze=o / ontbijt=p / elke morgen=t / om 8 uur=T / met haar broer=B / in de keuken=P', bron: 'p. 32' },
  { n: 'ik=o / geef=p / mijn mama=mv / een cadeautje=lo / voor Moederdag=T', bron: 'p. 32' },
  { n: '^als ontbijt=M / eet=p / ik=o / een boterham met choco=lo', bron: 'p. 32' },
  { n: 'vandaag=t / studeer=p / ik=o / goed=bw / op school=P', bron: 'p. 32' },
  { n: 'Lola=o / vertrekt=p / elke morgen=t / om halfacht=T / met de bus=M / naar school=P', bron: 'p. 34' },
  { n: 'Arthur=o / gaat=p / elk jaar in juli=t / met de jeugdclub=B / met de bus=M / naar Walibi=P', bron: 'p. 34' },
  { n: 'Arthur=o / moet=p / overmorgen=t / met de trein=M / naar Londen=P / gaan=s', bron: 'p. 34' },
  // oefening I
  { n: 'ik=o / ontmoet=p / Jan=lv / morgen=t / op school=P', boven: 'Ik ontmoet Jan. (op school, morgen)', bron: 'oefening I' },
  { n: 'die jongen=o / speelt=p / graag=bw / volleybal=lo / met zijn trainer=B / in zijn club=P', boven: 'Die jongen speelt graag volleybal. (met zijn trainer, in zijn club)', bron: 'oefening I' },
  { n: 'hij=o / wandelt=p / elke dag=t / veel=bw / met zijn kinderen=B / in de duinen=P', boven: 'Hij wandelt veel. (elke dag, in de duinen, met zijn kinderen)', bron: 'oefening I' },
  { n: 'ik=o / ga=p / vanavond=t / met mijn beste vriendin=B / naar de bioscoop=P', boven: 'Ik ga naar de bioscoop. (vanavond, met mijn beste vriendin)', bron: 'oefening I' },
  { n: 'mijn grootouders=o / reizen=p / graag=bw / met hun kleinkinderen=B / naar zee=P', boven: 'Mijn grootouders reizen graag met hun kleinkinderen. (naar zee)', bron: 'oefening I' },
  // oefening II
  { n: 'ik=o / wil=p / vandaag=t / mijn lessen=lv / niet=niet / studeren=s', boven: 'Je ne veux pas étudier mes leçons aujourd’hui.', bron: 'oefening II' },
  { n: 'we=o / moeten=p / om halfvijf=T / hier=hier / zijn=s', boven: 'Nous devons être ici pour quatre heures et demie.', bron: 'oefening II' },
  { n: 'wanneer=w / ga=p / je=o / met je klas=B / naar Parijs=P', vraag: true, boven: 'Quand vas-tu à Paris avec ta classe ?', bron: 'oefening II' },
  { n: 'volgende week=t / gaan=p / de leerlingen van het eerste=o / naar Mechelen=P', boven: 'La semaine prochaine, les élèves de première vont à Malines.', bron: 'oefening II' },
  { n: 'elke vrijdag=t / gaat=p / hij=o / naar de voetbalclub=P', boven: 'Chaque vendredi, il va au club de football.', bron: 'oefening II' },
  // oefening III
  { n: 'vandaag=t / schrijf=p / ik=o / mijn naam=lv / met dat potlood=M / op het formulier=P', bron: 'oefening III' },
  { n: 'gaat=p / die jongen=o / elke vrijdag=t / naar zijn voetbalclub=P', vraag: true, bron: 'oefening III' },
  { n: 'vanavond=t / maakt=p / moeder=o / het avondeten=lv / niet=niet / klaar=s', bron: 'oefening III' },
  { n: 'we=o / gaan=p / deze winter=t / met onze nichten=B / in Zwitserland=P / skiën=s', bron: 'oefening III' },
  { n: 'je=o / moet=p / het=vnw / haar=vnw / teruggeven=s', bron: 'oefening III' },
  { n: 'zaterdagmorgen=t / doet=p / Mieke=o / met haar zus=B / boodschappen=x', bron: 'oefening III' },
  { n: 'om halfzes=T / is=p / Mark=o / al=bw2 / in het zwembad=P', bron: 'oefening III' },
  { n: 'de meeste kinderen=o / liggen=p / door de week=T / om halftien=T / in bed=P', bron: 'oefening III' },
  { n: 'in het weekend=T / gaan=p / ze=o / tussen halftien en elf uur=T / naar bed=P', bron: 'oefening III' },
  { n: 'kom=p / je=o / morgen=t / mee=s', vraag: true, bron: 'oefening III' },
]
export const BOEK_ZINNEN = BOEK.map(b => lees(b.n, b.vraag))

function kaartBoek(h: Hasard): QuestionWv {
  if (h() < .25) {
    const z = lees(un(BOEK_PV, h))
    return pvOnd(z, z.delen.map((_, i) => i), h)
  }
  const b = un(BOEK, h)
  const z = lees(b.n, b.vraag)
  const astuce = b.boven && b.bron === 'oefening II' ? 'Vertaal: zet de zinsdelen in de goede volgorde.'
    : b.boven ? 'Vul de zin aan met de bepalingen tussen haakjes.'
    : z.begin !== undefined ? `Begin de zin met « ${z.delen[z.begin].t} ».` : 'Zet de zinsdelen in de goede volgorde.'
  return puzzel(z, h, astuce, `${z.vraag ? 'Een vraag: PV + onderwerp (na een vraagwoord: vraagwoord + PV + onderwerp).' : `${UITLEG_SCHEMA} ${UITLEG_INVERSIE}`} (Grammatica Oefenboek, ${b.bron})`, b.boven)
}

export const WOORDVOLGORDE = [
  { id: 'pv-ond', nl: 'de persoonsvorm en het onderwerp', fr: 'trouver la PV et le sujet', faire: kaartPvOnd },
  { id: 'inversie', nl: 'inversie: begin met een bepaling', fr: 'commencer par une bepaling (PV en 2e place)', faire: kaartInversie },
  { id: 'tempo', nl: 'TeMPo: tijd, manier, plaats', fr: 'l’ordre des bepalingen (temps, manière, lieu)', faire: kaartTempo },
  { id: 'werkwoordgroep', nl: 'het 2de deel van de werkwoordgroep', fr: 'l’infinitif et la particule à la fin', faire: kaartWerkwoordgroep },
  { id: 'vragen', nl: 'vragen maken', fr: 'l’ordre des mots dans une question', faire: kaartVragen },
  { id: 'aanvullen', nl: 'vul aan met de bepalingen', fr: 'compléter la phrase (exercice I)', faire: kaartAanvullen },
  { id: 'vertalen', nl: 'vertaal de zin', fr: 'traduire en remettant les mots dans l’ordre', faire: kaartVertalen },
  { id: 'regels', nl: 'welke zin is juist?', fr: 'les règles : want, maar, ja, neen, naar, une seule bepaling', faire: kaartRegels },
  { id: 'boek', nl: 'de zinnen van het boek', fr: 'les phrases du cours (p. 31-36)', faire: kaartBoek },
] as const
export const questionWoordvolgorde = (i: number, h: Hasard = Math.random): QuestionWv => WOORDVOLGORDE[i].faire(h)
