// Voornaamwoorden (Nederlands, chapitre 8) : des phrases toujours nouvelles où il faut mettre le bon voornaamwoord,
// comme dans les exercices du cours (« (Jan) ___ denkt aan ___ (Marieke) », ons of onze, hen of hun, son → zijn/haar).
// Une carte par notion ; chaque question accepte les formes onbeklemtoond et beklemtoond quand les deux vont (ze / zij).

type Hasard = () => number
const un = <T,>(t: readonly T[], h: Hasard): T => t[Math.floor(h() * t.length)]
function melange<T>(t: T[], h: Hasard): T[] {
  const r = [...t]
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(h() * (i + 1)); [r[i], r[j]] = [r[j], r[i]] }
  return r
}

export interface QuestionVnw {
  /** une ligne au-dessus de la phrase : la phrase française à traduire, le groupe dont on parle, la case du tableau */
  boven?: string
  /** la phrase, avant et après le trou ; l'indice entre parenthèses fait partie de la phrase, comme dans le cours */
  avant: string
  apres: string
  /** les réponses acceptées, la première est montrée (en minuscules) */
  bonnes: string[]
  /** quatre propositions (ou deux pour hen / hun), pour répondre en choisissant */
  options: string[]
  uitleg: string
}

/** Quatre propositions : la bonne réponse et trois pièges (les plus proches d'abord), jamais une autre forme acceptée. */
function options(bonnes: string[], pieges: string[], h: Hasard, n = 4): string[] {
  const autres = [...new Set(pieges)].filter(p => !bonnes.includes(p))
  return melange([bonnes[0], ...autres.slice(0, n - 1)], h)
}
const POSSESSIEF = ['mijn', 'jouw', 'uw', 'zijn', 'haar', 'ons', 'onze', 'jullie', 'hun']

// ------------------------------------------------------------ les antécédents
type Persoon = 'hij' | 'zij' | 'het' | 'wij' | 'jullie' | 'zijMv' | 'ik' | 'jij'
interface Woord { tekst: string; p: Persoon }
const JONGENS = ['Jan', 'Tom', 'Bart', 'Luc', 'Mark', 'Lucas', 'Noah', 'Vader', 'Mijn broer', 'De leraar', 'Opa', 'Meneer Peeters']
const MEISJES = ['Marieke', 'Sofie', 'Lies', 'Els', 'Mia', 'Emma', 'Lotte', 'Moeder', 'Mijn zus', 'De lerares', 'Oma', 'Mevrouw Janssens']
const GROEPEN = ['De kinderen', 'Mijn ouders', 'Jan en Piet', 'Sofie en Lies', 'De leerlingen', 'Oma en opa', 'Mijn vrienden']
/** des choses masculines (hij / hem), des het-woorden (het), des pluriels (ze) */
const DINGEN: Woord[] = [
  ...['De fiets', 'De bal', 'De stoel', 'De computer', 'De rugzak', 'De laptop', 'De sleutel'].map(tekst => ({ tekst, p: 'hij' as const })),
  ...['Het boek', 'Het schrift', 'Het potlood', 'Het spel', 'Het horloge', 'Het fototoestel'].map(tekst => ({ tekst, p: 'het' as const })),
  ...['De boeken', 'De schoenen', 'De sleutels', 'De stoelen', 'De potloden', 'De spelletjes'].map(tekst => ({ tekst, p: 'zijMv' as const })),
]
const klein = (s: string) => (/^(De|Het|Mijn|Oma|Opa|Vader|Moeder)\b/.test(s) ? s[0].toLowerCase() + s.slice(1) : s)
const hoofd = (s: string) => s[0].toUpperCase() + s.slice(1)

/** Une personne au hasard (un garçon, une fille, un groupe, « Lies en ik », « jij en Tom »). */
function persoon(h: Hasard, met: Persoon[] = ['hij', 'zij', 'zijMv', 'wij', 'jullie']): Woord {
  const p = un(met, h)
  if (p === 'hij') return { tekst: un(JONGENS, h), p }
  if (p === 'zij') return { tekst: un(MEISJES, h), p }
  if (p === 'zijMv') return { tekst: un(GROEPEN, h), p }
  const naam = un([...JONGENS.slice(0, 7), ...MEISJES.slice(0, 7)], h)
  return p === 'wij' ? { tekst: `${naam} en ik`, p } : { tekst: `Jij en ${naam}`, p }
}

// ------------------------------------------------------------ onderwerp
const ONDERWERP: Record<Persoon, string[]> = {
  ik: ['ik'], jij: ['je', 'jij'], hij: ['hij'], zij: ['ze', 'zij'], het: ['het'], wij: ['we', 'wij'], jullie: ['jullie'], zijMv: ['ze', 'zij'],
}
const UITLEG_P: Record<Persoon, string> = {
  ik: '1ste persoon enkelvoud', jij: '2de persoon enkelvoud', hij: '3de persoon enkelvoud, mannelijk', zij: '3de persoon enkelvoud, vrouwelijk',
  het: '3de persoon enkelvoud, onzijdig (een het-woord)', wij: '1ste persoon meervoud (… en ik = wij)', jullie: '2de persoon meervoud (jij en … = jullie)',
  zijMv: '3de persoon meervoud',
}
/** ce que fait la personne : au singulier, au pluriel */
const DOEN = [
  ['denkt altijd aan de vakantie.', 'denken altijd aan de vakantie.'], ['speelt in de tuin.', 'spelen in de tuin.'],
  ['gaat morgen naar zee.', 'gaan morgen naar zee.'], ['woont in Brussel.', 'wonen in Brussel.'], ['drinkt graag thee.', 'drinken graag thee.'],
  ['komt vandaag niet naar school.', 'komen vandaag niet naar school.'], ['leest een spannend boek.', 'lezen een spannend boek.'],
  ['helpt in de keuken.', 'helpen in de keuken.'], ['is ziek.', 'zijn ziek.'], ['heeft een nieuwe gsm.', 'hebben een nieuwe gsm.'],
]
const ZIJN_DING = [['is kapot.', 'zijn kapot.'], ['is te duur.', 'zijn te duur.'], ['is nieuw.', 'zijn nieuw.'], ['is van mijn broer.', 'zijn van mijn broer.']]

function onderwerp(h: Hasard): QuestionVnw {
  const ding = h() < .3
  const w = ding ? un(DINGEN, h) : persoon(h)
  const mv = w.p === 'wij' || w.p === 'jullie' || w.p === 'zijMv'
  const zin = un(ding ? ZIJN_DING : DOEN, h)[mv ? 1 : 0]
  const bonnes = ONDERWERP[w.p]
  const uitleg = ding
    ? `${w.tekst}: ${w.p === 'hij' ? 'een de-woord (mannelijk) → hij' : w.p === 'het' ? 'een het-woord → het' : 'meervoud → ze'}.`
    : `${w.tekst} = ${UITLEG_P[w.p]} → ${bonnes.join(' / ')}.`
  const pieges = w.p === 'hij' ? ['hem', 'het', 'zij'] : w.p === 'zij' ? ['haar', 'hij', 'hun'] : w.p === 'het' ? ['hij', 'ze', 'hem']
    : w.p === 'wij' ? ['ons', 'jullie', 'zij'] : w.p === 'jullie' ? ['jij', 'wij', 'u'] : ['hun', 'hen', 'wij']
  return { avant: `(${w.tekst}) `, apres: ` ${zin}`, bonnes, options: options(bonnes, pieges, h), uitleg: `Onderwerp: ${uitleg}` }
}

// ------------------------------------------------------------ objectpositie
const OBJECT: Record<Persoon, string[]> = {
  ik: ['mij', 'me'], jij: ['jou', 'je'], hij: ['hem'], zij: ['haar'], het: ['het'], wij: ['ons'], jullie: ['jullie'], zijMv: ['hen'],
}
/** après la personne : un verbe direct, ou une préposition (met, op, aan, voor) */
const ZIEN = [
  ['De lerares vraagt ', ' naar voren te komen.'], ['Mama belt ', ' morgen op.'], ['Iedereen kent ', ' goed.'], ['Ik zie ', ' elke dag.'],
  ['Opa wacht op ', '.'], ['Hij denkt vaak aan ', '.'], ['Rik gaat met ', ' naar de film.'], ['Dit cadeau is voor ', '.'], ['Nina speelt graag met ', '.'],
]
const KOPEN = [['Ik koop ', '.'], ['Waar heb je ', ' gelegd?'], ['Mijn broer neemt ', ' mee.'], ['We zoeken ', ' al een uur.'], ['Papa herstelt ', ' vandaag.']]
const GEVEN = [['Mama geeft ', ' een cadeau.'], ['De juf leest ', ' een verhaal voor.'], ['Opa stuurt ', ' een kaartje.']]

function object(h: Hasard): QuestionVnw {
  const soort = un(['persoon', 'persoon', 'ding', 'aan'] as const, h)
  if (soort === 'ding') {
    const w = un(DINGEN, h)
    const [a, b] = un(KOPEN, h)
    const bonnes = w.p === 'hij' ? ['hem'] : w.p === 'het' ? ['het'] : ['ze']
    const uitleg = w.p === 'hij' ? 'een de-woord (mannelijk) → hem' : w.p === 'het' ? 'een het-woord → het' : 'meervoud (dingen) → ze'
    return { avant: a, apres: ` (${klein(w.tekst)})${b}`, bonnes, options: options(bonnes, ['hij', 'hem', 'het', 'ze', 'hun', 'haar'], h), uitleg: `Bepaling: ${klein(w.tekst)} = ${uitleg}.` }
  }
  if (soort === 'aan') {
    // « Mama geeft ___ (aan Sofie) een cadeau » : à qui ? sans « aan »
    const p = un(['hij', 'zij', 'zijMv', 'ik', 'jij', 'wij', 'jullie'] as const, h)
    const wie = p === 'ik' ? 'mij' : p === 'jij' ? 'jou' : p === 'wij' ? 'ons' : p === 'jullie' ? 'jullie' : klein(persoon(h, [p]).tekst)
    const bonnes = p === 'zijMv' ? ['hun'] : OBJECT[p]
    const [a, b] = un(GEVEN, h)
    return { avant: a, apres: ` (aan ${wie})${b}`, bonnes, options: options(bonnes, p === 'zijMv' ? ['hen', 'ze', 'zij'] : ['ik', 'hij', 'zij', 'hem', 'haar', 'hun', 'wij', 'jij'].sort(() => h() - .5), h),
      uitleg: p === 'zijMv' ? `Aan wie? Aan ${wie} (meervoud) → hun (zonder « aan »: ik geef hun een cadeau).` : `Aan wie? Aan ${wie} → ${bonnes.join(' / ')}.` }
  }
  const w = persoon(h, ['hij', 'zij', 'zijMv', 'wij', 'jullie'])
  // « Lies en ik » → « Lies en mij » quand on n'est pas sujet
  const wie = w.p === 'wij' ? w.tekst.replace(/ en ik$/, ' en mij') : w.p === 'jullie' ? w.tekst.replace(/^Jij en (.*)$/, '$1 en jou') : klein(w.tekst)
  const [a, b] = un(ZIEN.filter(z => !(w.p === 'wij' && z[0].startsWith('Ik'))), h)
  // les personnes au pluriel : « hen », ou « ze » sans préposition (ik zie ze)
  const voorzetsel = /(op|aan|met|voor) $/.test(a)
  const bonnes = w.p === 'zijMv' && !voorzetsel ? ['hen', 'ze'] : OBJECT[w.p]
  const pieges = w.p === 'hij' ? ['hij', 'zijn', 'haar'] : w.p === 'zij' ? ['zij', 'hem', 'zijn'] : w.p === 'zijMv' ? ['hun', 'zij', 'haar'] : w.p === 'wij' ? ['wij', 'onze', 'hen'] : ['jij', 'jou', 'hen']
  return { avant: a, apres: ` (${wie})${b}`, bonnes, options: options(bonnes, pieges, h),
    uitleg: `Bepaling (niet het onderwerp): ${wie} → ${bonnes.join(' / ')}${w.p === 'zijMv' ? ' (personen; na een voorzetsel altijd hen)' : ''}.` }
}

// ------------------------------------------------------------ zijn of haar
const VAN = [
  ['zoekt ', ' jas.'], ['belt ', ' oma.'], ['schrijft een brief met ', ' nieuwe pen.'], ['wast ', ' fiets.'], ['vergeet ', ' huiswerk.'],
  ['speelt met ', ' broer.'], ['zit naast ', ' beste vriendin.'], ['ruimt ', ' kamer op.'],
]
function zijnHaar(h: Hasard): QuestionVnw {
  const dier = h() < .15
  if (dier) {
    const d = un(['De hond', 'Het paard', 'Het konijn', 'De hamster'], h)
    const [a, b] = un([['eet uit ', ' bakje.'], ['slaapt in ', ' mand.'], ['speelt met ', ' bal.']], h)
    return { avant: `${d} ${a}`, apres: b, bonnes: ['zijn'], options: options(['zijn'], ['haar', 'hun', 'hem'], h), uitleg: `${d} is een dier (mannelijk of onzijdig) → zijn.` }
  }
  const jongen = h() < .5
  const naam = un(jongen ? JONGENS : MEISJES, h)
  const bonnes = [jongen ? 'zijn' : 'haar']
  if (h() < .35) {
    // « Dit is Els en ___ vriend. »
    const [a, b] = un([['Dit is ', ' vriend.'], ['Waar zijn ', ' ouders?'], ['Ken je ', ' zus?']], h)
    return { avant: `${a}${klein(naam)} en `, apres: b, bonnes, options: options(bonnes, [jongen ? 'haar' : 'zijn', 'hun', jongen ? 'hem' : 'ze'], h),
      uitleg: `Van wie? Van ${klein(naam)}: ${jongen ? 'een jongen of een man → zijn' : 'een meisje of een vrouw → haar'}.` }
  }
  const [a, b] = un(VAN, h)
  return { avant: `${naam} ${a}`, apres: b, bonnes, options: options(bonnes, [jongen ? 'haar' : 'zijn', 'hun', jongen ? 'hem' : 'ze'], h),
    uitleg: `Van wie? Van ${klein(naam)}: ${jongen ? 'een jongen of een man → zijn' : 'een meisje of een vrouw → haar'}. Je kijkt naar de eigenaar, niet naar het woord erna.` }
}

// ------------------------------------------------------------ ons of onze
const ZELFST: { w: string; det: 'de' | 'het' | 'mv' }[] = [
  ...['huis', 'klaslokaal', 'schrift', 'team', 'konijn', 'appartement', 'dorp', 'paard', 'lievelingsliedje'].map(w => ({ w, det: 'het' as const })),
  ...['school', 'tuin', 'auto', 'kat', 'buurman', 'juf', 'klas', 'keuken', 'leraar', 'straat'].map(w => ({ w, det: 'de' as const })),
  ...['ouders', 'boeken', 'vrienden', 'fietsen', 'buren', 'grootouders'].map(w => ({ w, det: 'mv' as const })),
]
function onsOnze(h: Hasard): QuestionVnw {
  const z = un(ZELFST, h)
  const mv = z.det === 'mv'
  const [a, b] = un(mv
    ? [['Dit zijn ', '.'], ['Kijk, daar zijn ', '!'], ['We zijn trots op ', '.'], ['', ' wonen niet ver.']]
    : [['Dit is ', '.'], ['Kijk, daar is ', '!'], ['We zijn trots op ', '.'], ['We praten vaak over ', '.']], h)
  const bonnes = [z.det === 'het' ? 'ons' : 'onze']
  return { avant: a, apres: ` ${z.w}${b}`, bonnes, options: options(bonnes, [z.det === 'het' ? 'onze' : 'ons'], h, 2),
    uitleg: z.det === 'het' ? `Het ${z.w}: een het-woord in het enkelvoud → ons.` : mv ? `${hoofd(z.w)}: meervoud → onze.` : `De ${z.w}: een de-woord → onze.` }
}

// ------------------------------------------------------------ hen of hun
const HUN = [
  ['Waar is ', ' huis?', 'bez'], ['Ik ken ', ' ouders niet.', 'bez'], ['Geloof jij ', ' verhaal?', 'bez'], ['', ' kleren zijn nat.', 'bez'],
  ['Mijn buren zijn weg, maar ', ' hond blijft hier.', 'bez'], ['Ik heb het ', ' al gezegd.', 'mw'], ['Geef ', ' die boeken terug.', 'mw'],
  ['De leraar geeft ', ' een opdracht.', 'mw'], ['Ik stuur ', ' een berichtje.', 'mw'], ['Vertel ', ' de waarheid!', 'mw'],
] as const
const HEN = [
  ['Is die bal van ', '?'], ['Ik ga met ', ' naar zee.'], ['Is dat cadeau voor ', '?'], ['We wachten op ', '.'],
  ['Ik denk vaak aan ', '.'], ['Ik zie ', ' morgen.'], ['Ik help ', ' graag.'], ['Zit jij naast ', '?'],
]
function henHun(h: Hasard): QuestionVnw {
  const wie = klein(un(GROEPEN, h))
  if (h() < .5) {
    const [a, b, soort] = un(HUN, h)
    return { avant: a, apres: b, bonnes: ['hun'], options: options(['hun'], ['hen'], h, 2), boven: `Het gaat over ${wie}.`,
      uitleg: soort === 'bez' ? `Van wie? Van ${wie} → hun (= leur, leurs: bezittelijk voornaamwoord).` : `Aan wie? Aan ${wie}, zonder « aan » → hun (= leur).` }
  }
  const [a, b] = un(HEN, h)
  return { avant: a, apres: b, bonnes: ['hen'], options: options(['hen'], ['hun'], h, 2), boven: `Het gaat over ${wie}.`,
    uitleg: /van |met |voor |op |aan |naast /.test(a) ? `Na een voorzetsel (${a.trim().split(' ').pop()}) → hen (= eux).` : `${wie} ondergaan de actie → hen (= les).` }
}

// ------------------------------------------------------------ bezittelijk voornaamwoord, d'après le sujet
const WW = [
  { stam: 'zoek', inf: 'zoeken' }, { stam: 'vergeet', inf: 'vergeten' }, { stam: 'verlies', inf: 'verliezen' }, { stam: 'pak', inf: 'pakken' },
  { stam: 'neem', inf: 'nemen' }, { stam: 'vind', inf: 'vinden' },
]
const SPULLEN: { w: string; det: 'de' | 'het' | 'mv' }[] = [
  ...['jas', 'rugzak', 'fiets', 'gsm', 'brooddoos', 'pennenzak'].map(w => ({ w, det: 'de' as const })),
  ...['boek', 'schrift', 'potlood', 'huiswerk', 'woordenboek'].map(w => ({ w, det: 'het' as const })),
  ...['sleutels', 'schoenen', 'handschoenen', 'boeken'].map(w => ({ w, det: 'mv' as const })),
]
const ONDERW = [
  { s: 'Ik', bez: ['mijn'], v: 'ik' }, { s: 'Jij', bez: ['jouw', 'je'], v: 't' }, { s: 'Je', bez: ['je', 'jouw'], v: 't' }, { s: 'U', bez: ['uw'], v: 't' },
  { s: 'Hij', bez: ['zijn'], v: 't' }, { s: 'Ze', bez: ['haar'], v: 't', wie: 'ze (enkelvoud: één meisje of vrouw)' }, { s: 'Tom', bez: ['zijn'], v: 't' },
  { s: 'Lies', bez: ['haar'], v: 't' }, { s: 'We', bez: [], v: 'mv' }, { s: 'Jullie', bez: ['jullie'], v: 'mv' },
  { s: 'Ze', bez: ['hun'], v: 'mv', wie: 'ze (meervoud)' }, { s: 'Mijn ouders', bez: ['hun'], v: 'mv' },
]
function bezittelijk(h: Hasard): QuestionVnw {
  const o = un(ONDERW, h)
  const w = un(WW, h), z = un(SPULLEN, h)
  const vorm = o.v === 'ik' ? w.stam : o.v === 'mv' ? w.inf : w.stam.endsWith('t') ? w.stam : w.stam + 't'
  const bonnes = o.bez.length ? o.bez : [z.det === 'het' ? 'ons' : 'onze']
  const pieges: Record<string, string[]> = { mijn: ['mij', 'me'], jouw: ['jou', 'jullie'], je: ['jou', 'jullie'], uw: ['u', 'jouw'], zijn: ['haar', 'hun'],
    haar: ['zijn', 'hun'], ons: ['onze', 'hun'], onze: ['ons', 'hun'], jullie: ['jouw', 'hun'], hun: ['hen', 'haar', 'zijn'] }
  const hint = o.s === 'We' ? (z.det === 'het' ? ` (het ${z.w} → ons)` : ` (${z.det === 'mv' ? 'meervoud' : `de ${z.w}`} → onze)`) : ''
  return { avant: `${o.s} ${vorm} `, apres: ` ${z.w}.`, bonnes, options: options(bonnes, [...pieges[bonnes[0]], ...melange(POSSESSIEF, h)], h),
    uitleg: `Het onderwerp is ${o.wie ?? (/^(Ik|Jij|Je|U|Hij|We|Jullie)$/.test(o.s) ? o.s.toLowerCase() : klein(o.s))} → ${bonnes.join(' / ')}${hint}.` }
}

// ------------------------------------------------------------ son, sa, ses → zijn, haar, hun
const DINGEN_FR: { nl: string; det: 'de' | 'het' | 'mv'; fr: string; g: 'm' | 'f' | 'v' | 'mv' }[] = [
  { nl: 'fiets', det: 'de', fr: 'vélo', g: 'm' }, { nl: 'jas', det: 'de', fr: 'veste', g: 'f' }, { nl: 'boek', det: 'het', fr: 'livre', g: 'm' },
  { nl: 'kamer', det: 'de', fr: 'chambre', g: 'f' }, { nl: 'huis', det: 'het', fr: 'maison', g: 'f' }, { nl: 'school', det: 'de', fr: 'école', g: 'v' },
  { nl: 'vriendin', det: 'de', fr: 'amie', g: 'v' }, { nl: 'vriend', det: 'de', fr: 'ami', g: 'v' }, { nl: 'zus', det: 'de', fr: 'sœur', g: 'f' },
  { nl: 'broer', det: 'de', fr: 'frère', g: 'm' }, { nl: 'moeder', det: 'de', fr: 'mère', g: 'f' }, { nl: 'vader', det: 'de', fr: 'père', g: 'm' },
  { nl: 'sleutels', det: 'mv', fr: 'clés', g: 'mv' }, { nl: 'ouders', det: 'mv', fr: 'parents', g: 'mv' }, { nl: 'hond', det: 'de', fr: 'chien', g: 'm' },
  { nl: 'kat', det: 'de', fr: 'chat', g: 'm' }, { nl: 'adres', det: 'het', fr: 'adresse', g: 'v' }, { nl: 'tante', det: 'de', fr: 'tante', g: 'f' },
]
const FR_WW = [
  { fr: ['cherche', 'cherchent', 'cherchons'], nl: ['zoekt', 'zoeken', 'zoeken'] },
  { fr: ['voit', 'voient', 'voyons'], nl: ['ziet', 'zien', 'zien'] },
  { fr: ['aime', 'aiment', 'aimons'], nl: ['houdt van', 'houden van', 'houden van'] },
  { fr: ['connaît', 'connaissent', 'connaissons'], nl: ['kent', 'kennen', 'kennen'] },
]
const FR_NAMEN = [
  { fr: 'Pierre', nl: 'Pierre', p: 'hij' }, { fr: 'Lucas', nl: 'Lucas', p: 'hij' }, { fr: 'Mon frère', nl: 'Mijn broer', p: 'hij' },
  { fr: 'Marie', nl: 'Marie', p: 'zij' }, { fr: 'Julie', nl: 'Julie', p: 'zij' }, { fr: 'Ma sœur', nl: 'Mijn zus', p: 'zij' },
  { fr: 'Marie et Lucas', nl: 'Marie en Lucas', p: 'zijMv' }, { fr: 'Les enfants', nl: 'De kinderen', p: 'zijMv' }, { fr: 'Nous', nl: 'Wij', p: 'wij' },
] as const
function vertalen(h: Hasard): QuestionVnw {
  const e = un(FR_NAMEN, h), v = un(FR_WW, h)
  // pas « Ma sœur voit sa sœur »
  const d = un(DINGEN_FR.filter(x => !e.nl.endsWith(x.nl)), h)
  const i = e.p === 'zijMv' ? 1 : e.p === 'wij' ? 2 : 0
  const mv = d.g === 'mv'
  const fr = e.p === 'wij' ? (mv ? 'nos' : 'notre') : e.p === 'zijMv' ? (mv ? 'leurs' : 'leur') : mv ? 'ses' : d.g === 'f' ? 'sa' : 'son'
  const frans = `${e.fr} ${v.fr[i]} ${fr} ${d.fr}.`
  const bonnes = [e.p === 'hij' ? 'zijn' : e.p === 'zij' ? 'haar' : e.p === 'zijMv' ? 'hun' : d.det === 'het' ? 'ons' : 'onze']
  const uitleg = e.p === 'wij' ? `${d.det === 'het' ? `Het ${d.nl}: een het-woord → ons` : `${mv ? hoofd(d.nl) + ': meervoud' : `De ${d.nl}: een de-woord`} → onze`}.`
    : `In het Frans kijk je naar wat men bezit (${fr} ${d.fr}), in het Nederlands naar de eigenaar: ${e.nl} → ${bonnes[0]}.`
  return { boven: frans, avant: `${e.nl} ${v.nl[i]} `, apres: ` ${d.nl}.`, bonnes, options: options(bonnes, ['zijn', 'haar', 'hun', 'ons', 'onze', 'hen'].sort(() => h() - .5), h), uitleg }
}

// ------------------------------------------------------------ le tableau du cours
const RIJEN: [string, string[]][] = [
  // onderwerp (onbekl., bekl.), bepaling (onbekl., bekl.), bezittelijk (onbekl., bekl.)
  ['1ste persoon enkelvoud', ['ik', 'ik', 'me', 'mij', 'mijn', 'mijn']],
  ['2de persoon enkelvoud', ['je', 'jij', 'je', 'jou', 'je', 'jouw']],
  ['2de persoon, beleefdheidsvorm', ['u', 'u', 'u', 'u', 'uw', 'uw']],
  ['3de persoon enkelvoud, mannelijk', ['hij', 'hij', 'hem', 'hem', 'zijn', 'zijn']],
  ['3de persoon enkelvoud, vrouwelijk', ['ze', 'zij', 'haar', 'haar', 'haar', 'haar']],
  ['3de persoon enkelvoud, onzijdig', ['het', 'het', 'het', 'het', 'zijn', 'zijn']],
  ['1ste persoon meervoud', ['we', 'wij', 'ons', 'ons', 'ons / onze', 'ons / onze']],
  ['2de persoon meervoud', ['jullie', 'jullie', 'jullie', 'jullie', 'jullie', 'jullie']],
  ['3de persoon meervoud', ['ze', 'zij', 'hen', 'hen', 'hun', 'hun']],
]
/** « we / wij », ou une seule forme quand les deux sont pareilles */
const paar = (a: string, b: string) => (a === b ? a : `${a} / ${b}`)
const KOLOMMEN = ['onderwerp, onbeklemtoond', 'onderwerp, beklemtoond', 'bepaling, onbeklemtoond', 'bepaling, beklemtoond', 'bezittelijk, onbeklemtoond', 'bezittelijk, beklemtoond']
function schema(h: Hasard): QuestionVnw {
  // les cases où les formes diffèrent d'abord (je / jij, me / mij, we / wij…), plus souvent que les autres
  let r = 0, k = 0
  for (let n = 0; n < 4; n++) {
    r = Math.floor(h() * RIJEN.length); k = Math.floor(h() * 6)
    const [o, b] = RIJEN[r][1].slice(k - (k % 2), k - (k % 2) + 2)
    if (o !== b) break
  }
  const [rij, vormen] = RIJEN[r]
  const juist = vormen[k]
  const soort = k < 2 ? 'Persoonlijk voornaamwoord (onderwerp)' : k < 4 ? 'Persoonlijk voornaamwoord (bepaling)' : 'Bezittelijk voornaamwoord'
  const bonnes = juist.split(' / ')
  // les pièges : la même personne dans les autres colonnes, la même colonne pour d'autres personnes
  const pieges = [...melange(vormen.flatMap(x => x.split(' / ')), h), ...melange(RIJEN.map(x => x[1][k]), h).flatMap(x => x.split(' / '))]
  const opts = options(bonnes, pieges, h)
  return { boven: `${soort} · ${rij} · ${KOLOMMEN[k].split(', ')[1]}`, avant: '', apres: '', bonnes, options: opts,
    uitleg: `${rij}: onderwerp ${paar(vormen[0], vormen[1])} · bepaling ${paar(vormen[2], vormen[3])} · bezittelijk ${paar(vormen[4], vormen[5])}.` }
}

export const VOORNAAMWOORDEN = [
  { id: 'onderwerp', nl: 'persoonlijk voornaamwoord: onderwerp', fr: 'le pronom personnel sujet (ik, hij, ze…)', faire: onderwerp },
  { id: 'object', nl: 'persoonlijk voornaamwoord: bepaling', fr: 'le pronom personnel complément (mij, hem, haar…)', faire: object },
  { id: 'zijn-haar', nl: 'zijn of haar', fr: 'zijn ou haar', faire: zijnHaar },
  { id: 'ons-onze', nl: 'ons of onze', fr: 'ons ou onze', faire: onsOnze },
  { id: 'hen-hun', nl: 'hen of hun', fr: 'hen ou hun', faire: henHun },
  { id: 'bezittelijk', nl: 'bezittelijk voornaamwoord', fr: 'le déterminant possessif (mijn, jouw, hun…)', faire: bezittelijk },
  { id: 'vertalen', nl: 'son, sa, ses vertalen', fr: 'traduire son, sa, ses, leur, notre', faire: vertalen },
  { id: 'schema', nl: 'het schema van de voornaamwoorden', fr: 'le tableau des pronoms', faire: schema },
] as const
export const questionVoornaamwoord = (i: number, h: Hasard = Math.random) => VOORNAAMWOORDEN[i].faire(h)
