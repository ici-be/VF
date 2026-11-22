// Aimer (Nederlands, chapitre 9 « Vertaling van het ww. "AIMER" ») : des phrases toujours nouvelles, la phrase française
// au-dessus, la phrase néerlandaise à compléter, comme dans le cours (Grammatica Oefenboek p. 29-30) :
// houden van + naamwoord, lusten (drank, voedsel), vervoegd werkwoord + graag, vervoegd werkwoord + liever.
import type { QuestionVnw } from './voornaamwoorden'

type Hasard = () => number
const un = <T,>(t: readonly T[], h: Hasard): T => t[Math.floor(h() * t.length)]
function melange<T>(t: T[], h: Hasard): T[] {
  const r = [...t]
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(h() * (i + 1)); [r[i], r[j]] = [r[j], r[i]] }
  return r
}
const hoofd = (s: string) => s[0].toUpperCase() + s.slice(1)

export interface QuestionAimer extends QuestionVnw {
  /** la consigne sous la phrase, quand ce n'est pas « Vul in » */
  astuce?: string
}

/** Quatre propositions : la bonne réponse et trois pièges, jamais une autre forme acceptée. */
function options(bonnes: string[], pieges: string[], h: Hasard, n = 4): string[] {
  const autres = [...new Set(pieges)].filter(p => !bonnes.includes(p))
  return melange([bonnes[0], ...autres.slice(0, n - 1)], h)
}

// ------------------------------------------------------------ les personnes
type P = 'ik' | 'jij' | 'hij' | 'u' | 'mv'
interface Onderwerp { nl: string; p: P; fr: string; v: number; hint?: string }
/** v : la personne du verbe français (je, tu, il, nous, vous, ils) */
const ONDERWERPEN: Onderwerp[] = [
  { nl: 'Ik', p: 'ik', fr: 'je', v: 0 }, { nl: 'Jij', p: 'jij', fr: 'tu', v: 1 }, { nl: 'Je', p: 'jij', fr: 'tu', v: 1 },
  { nl: 'Hij', p: 'hij', fr: 'il', v: 2 }, { nl: 'Ze', p: 'hij', fr: 'elle', v: 2 }, { nl: 'Marie', p: 'hij', fr: 'Marie', v: 2 },
  { nl: 'Mijn broer', p: 'hij', fr: 'mon frère', v: 2 }, { nl: 'U', p: 'u', fr: 'vous', v: 4, hint: 'u' },
  { nl: 'We', p: 'mv', fr: 'nous', v: 3 }, { nl: 'Jullie', p: 'mv', fr: 'vous', v: 4, hint: 'jullie' },
  { nl: 'Ze', p: 'mv', fr: 'ils', v: 5 }, { nl: 'Mijn ouders', p: 'mv', fr: 'mes parents', v: 5 },
]
/** les personnes à qui on pose une question : jij, jullie, u */
const VRAGERS = ONDERWERPEN.filter(o => o.nl === 'Jij' || o.nl === 'Je' || o.nl === 'Jullie' || o.nl === 'U')
const AIME = ['aime', 'aimes', 'aime', 'aimons', 'aimez', 'aiment']
const PREFERE = ['préfère', 'préfères', 'préfère', 'préférons', 'préférez', 'préfèrent']

/** « J’aime la mer. », « Je n’aime pas la mer. », « Aimes-tu la mer ? » (vous : « (jullie) » ou « (u) ») */
function frans(o: Onderwerp, verbes: string[], reste: string, soort: 'zin' | 'niet' | 'vraag' = 'zin'): string {
  const v = verbes[o.v], voyelle = /^[aeiouéè]/i.test(v), hint = o.hint ? ` (${o.hint})` : ''
  const r = reste ? ` ${reste}` : ''
  if (soort === 'vraag') return `${hoofd(v)}-${o.fr}${r} ?${hint}`
  if (soort === 'niet') return `${hoofd(o.fr)} ${voyelle ? 'n’' : 'ne '}${v} pas${r}.${hint}`
  return (o.fr === 'je' && voyelle ? `J’${v}${r}.` : `${hoofd(o.fr)} ${v}${r}.`) + hint
}

// ------------------------------------------------------------ houden van + naamwoord
const DINGEN: [string, string][] = [
  ['les enfants', 'kinderen'], ['ce livre', 'dit boek'], ['la musique', 'muziek'], ['la nature', 'de natuur'], ['le week-end', 'het weekend'],
  ['les films', 'films'], ['les animaux', 'dieren'], ['la mer', 'de zee'], ['le sport', 'sport'], ['ce pays', 'dit land'], ['Marie', 'Marie'],
  ['la musique classique', 'klassieke muziek'], ['les vacances', 'de vakantie'], ['l’hiver', 'de winter'], ['les chats', 'katten'],
  ['les mathématiques', 'wiskunde'], ['les examens', 'examens'],
]
/** les formes de houden : ik hou(d), jij houdt, hou(d) je?, hij houdt, u houdt, wij houden */
function houden(p: P, vraag = false): string[] {
  if (p === 'ik' || (p === 'jij' && vraag)) return ['hou', 'houd']
  return p === 'mv' ? ['houden'] : ['houdt']
}
const UITLEG_HOUDEN = 'Aimer + naamwoord → houden van. Ik hou(d), jij houdt, hou(d) je?, hij houdt, u houdt, wij houden.'

function houdenVan(h: Hasard): QuestionAimer {
  const soort = un(['zin', 'zin', 'niet', 'vraag', 'vraag'] as const, h)
  const o = un(soort === 'vraag' ? VRAGERS : ONDERWERPEN, h)
  const [fr, nl] = un(DINGEN.filter(d => d[1] !== o.nl), h)
  const bonnes = houden(o.p, soort === 'vraag')
  const pieges = ['hou', 'houdt', 'houden', 'lust', 'lusten']
  if (soort === 'vraag') {
    const s = o.nl.toLowerCase()
    return { boven: frans(o, AIME, fr, 'vraag'), avant: '', apres: ` ${s} van ${nl}?`, bonnes, options: options(bonnes, pieges, h),
      uitleg: `${UITLEG_HOUDEN}${o.p === 'jij' ? ' In een vraag met je of jij valt de t weg: hou(d) je?' : ''}` }
  }
  return { boven: frans(o, AIME, fr, soort), avant: `${o.nl} `, apres: ` ${soort === 'niet' ? 'niet ' : ''}van ${nl}.`, bonnes, options: options(bonnes, pieges, h),
    uitleg: `${UITLEG_HOUDEN}${soort === 'niet' ? ' Ne … pas → niet: hij houdt niet van muziek.' : ''}` }
}

// ------------------------------------------------------------ lusten (drank, voedsel)
const ETEN: [string, string][] = [
  ['l’eau', 'water'], ['les biscuits', 'koekjes'], ['le cola', 'cola'], ['le fromage', 'kaas'], ['les épinards', 'spinazie'],
  ['le chou-fleur', 'bloemkool'], ['les haricots bruns', 'bruine bonen'], ['les bananes', 'bananen'], ['les oranges', 'sinaasappels'],
  ['les pommes', 'appels'], ['le riz', 'rijst'], ['les frites', 'frieten'], ['le lait', 'melk'], ['le thé', 'thee'], ['le café', 'koffie'],
  ['le poisson', 'vis'], ['le Fanta', 'Fanta'], ['le chocolat', 'chocolade'],
]
const UITLEG_LUSTEN = 'Drank of voedsel → lusten. Ik lust, jij lust, lust je?, hij lust, wij lusten.'

function lusten(h: Hasard): QuestionAimer {
  const soort = un(['zin', 'zin', 'geen', 'niet', 'vraag'] as const, h)
  const o = un(soort === 'vraag' ? VRAGERS : ONDERWERPEN, h)
  const [fr, nl] = un(ETEN, h)
  const vorm = o.p === 'mv' ? 'lusten' : 'lust'
  const pieges = ['lust', 'lusten', 'lus', 'houdt', 'hou']
  if (soort === 'geen') {
    // le trou sur « geen » : ne … pas devant un nom sans lidwoord
    return { boven: frans(o, AIME, fr, 'niet'), avant: `${o.nl} ${vorm} `, apres: ` ${nl}.`, bonnes: ['geen'], options: options(['geen'], ['niet'], h, 2),
      uitleg: `Ne … pas + drank of voedsel (zonder lidwoord) → geen: ik lust geen ${nl}.` }
  }
  if (soort === 'vraag') {
    return { boven: frans(o, AIME, fr, 'vraag'), avant: '', apres: ` ${o.nl.toLowerCase()} ${nl}?`, bonnes: [vorm], options: options([vorm], pieges, h),
      uitleg: `${UITLEG_LUSTEN} De stam eindigt al op een t: lust je? (geen t die wegvalt).` }
  }
  return { boven: frans(o, AIME, fr, soort), avant: `${o.nl} `, apres: ` ${soort === 'niet' ? 'geen ' : ''}${nl}.`, bonnes: [vorm], options: options([vorm], pieges, h),
    uitleg: `${UITLEG_LUSTEN}${o.p === 'ik' ? ' De stam is lust (met een t): ik lust.' : ''}` }
}

// ------------------------------------------------------------ vervoegd werkwoord + graag / liever
interface Doen { fr: string; ik: string; t: string; mv: string; rest: string }
const DOEN: Doen[] = [
  { fr: 'jouer au foot', ik: 'speel', t: 'speelt', mv: 'spelen', rest: 'voetbal' },
  { fr: 'nager', ik: 'zwem', t: 'zwemt', mv: 'zwemmen', rest: '' },
  { fr: 'manger des frites', ik: 'eet', t: 'eet', mv: 'eten', rest: 'frieten' },
  { fr: 'lire', ik: 'lees', t: 'leest', mv: 'lezen', rest: '' },
  { fr: 'chanter', ik: 'zing', t: 'zingt', mv: 'zingen', rest: '' },
  { fr: 'danser', ik: 'dans', t: 'danst', mv: 'dansen', rest: '' },
  { fr: 'dessiner', ik: 'teken', t: 'tekent', mv: 'tekenen', rest: '' },
  { fr: 'regarder la télé', ik: 'kijk', t: 'kijkt', mv: 'kijken', rest: 'tv' },
  { fr: 'aller à l’école', ik: 'ga', t: 'gaat', mv: 'gaan', rest: 'naar school' },
  { fr: 'jouer de la guitare', ik: 'speel', t: 'speelt', mv: 'spelen', rest: 'gitaar' },
  { fr: 'boire du café', ik: 'drink', t: 'drinkt', mv: 'drinken', rest: 'koffie' },
  { fr: 'faire du vélo', ik: 'fiets', t: 'fietst', mv: 'fietsen', rest: '' },
  { fr: 'cuisiner', ik: 'kook', t: 'kookt', mv: 'koken', rest: '' },
  { fr: 'travailler', ik: 'werk', t: 'werkt', mv: 'werken', rest: '' },
  { fr: 'apprendre le néerlandais', ik: 'leer', t: 'leert', mv: 'leren', rest: 'Nederlands' },
  { fr: 'lire des livres', ik: 'lees', t: 'leest', mv: 'lezen', rest: 'boeken' },
]
/** le verbe conjugué : ik speel, jij speelt, speel je?, hij speelt, wij spelen */
const vervoegd = (d: Doen, p: P, vraag = false) => (p === 'ik' || (p === 'jij' && vraag) ? d.ik : p === 'mv' ? d.mv : d.t)
const r = (d: Doen) => (d.rest ? ` ${d.rest}` : '')

function graag(h: Hasard): QuestionAimer {
  const soort = un(['zin', 'zin', 'zin', 'niet', 'vraag', 'wat'] as const, h)
  const o = un(soort === 'vraag' || soort === 'wat' ? VRAGERS : ONDERWERPEN, h)
  const d = un(DOEN, h)
  const pieges = ['liever', 'lust', 'houdt', 'liefst']
  const zin = soort === 'vraag' ? `${hoofd(vervoegd(d, o.p, true))} ${o.nl.toLowerCase()} graag${r(d)}?` : `${o.nl} ${vervoegd(d, o.p)} graag${r(d)}.`
  const uitleg = `Aimer + werkwoord → onderwerp + vervoegd werkwoord + graag + bepaling(en): ${zin}`
  if (soort === 'niet') {
    return { boven: frans(o, AIME, d.fr, 'niet'), avant: `${o.nl} ${vervoegd(d, o.p)} `, apres: ` graag${r(d)}.`, bonnes: ['niet'], options: options(['niet'], ['geen'], h, 2),
      uitleg: `Ne … pas + werkwoord → niet graag: ${o.nl.toLowerCase()} ${vervoegd(d, o.p)} niet graag${r(d)}.` }
  }
  if (soort === 'wat') {
    // « Qu’aimes-tu faire ? » → « Wat doe je graag? »
    const s = o.nl.toLowerCase()
    const doe = o.p === 'jij' ? 'doe' : o.p === 'mv' ? 'doen' : 'doet'
    return { boven: `Qu’${o.v === 1 ? 'aimes-tu' : 'aimez-vous'} faire ?${o.hint ? ` (${o.hint})` : ''}`, avant: `Wat ${doe} ${s} `, apres: '?', bonnes: ['graag'], options: options(['graag'], pieges, h),
      uitleg: 'Aimer + werkwoord → vervoegd werkwoord + graag: wat doe je graag?' }
  }
  if (soort === 'vraag') {
    const s = o.nl.toLowerCase()
    return { boven: frans(o, AIME, d.fr, 'vraag'), avant: `${hoofd(vervoegd(d, o.p, true))} ${s} `, apres: `${r(d)}?`, bonnes: ['graag'], options: options(['graag'], pieges, h), uitleg }
  }
  return { boven: frans(o, AIME, d.fr), avant: `${o.nl} ${vervoegd(d, o.p)} `, apres: `${r(d)}.`, bonnes: ['graag'], options: options(['graag'], pieges, h), uitleg }
}

function liever(h: Hasard): QuestionAimer {
  const soort = un(['zin', 'zin', 'vraag', 'maar'] as const, h)
  const o = un(soort === 'vraag' ? VRAGERS : ONDERWERPEN, h)
  const d = un(DOEN, h)
  const pieges = ['graag', 'liefst', 'meer', 'lust']
  const zin = soort === 'vraag' ? `${hoofd(vervoegd(d, o.p, true))} ${o.nl.toLowerCase()} liever${r(d)}?` : `${o.nl} ${vervoegd(d, o.p)} liever${r(d)}.`
  const uitleg = `Préférer + werkwoord → onderwerp + vervoegd werkwoord + liever + bepaling(en): ${zin}`
  if (soort === 'maar') {
    // « J’aime chanter, mais je préfère danser. » → « Ik zing graag, maar ik dans liever. »
    const a = un(DOEN.filter(x => x.ik !== d.ik), h)
    // la reprise : « mais je préfère », « mais elle préfère » ; « maar ik », « maar ze »
    const pron = ['je', 'tu', o.fr === 'elle' || o.fr === 'Marie' ? 'elle' : 'il', 'nous', 'vous', 'ils'][o.v]
    const s = o.nl === 'Marie' || o.nl === 'Mijn ouders' ? 'ze' : o.nl === 'Mijn broer' ? 'hij' : o.nl.toLowerCase()
    const zonder = (t: string) => t.replace(/\.( \(.*\))?$/, '')
    const fr = `${zonder(frans(o, AIME, a.fr))}, mais ${pron} ${PREFERE[o.v]} ${d.fr}.${o.hint ? ` (${o.hint})` : ''}`
    return { boven: fr, avant: `${o.nl} ${vervoegd(a, o.p)} graag${r(a)}, maar ${s} ${vervoegd(d, o.p)} `, apres: `${r(d)}.`, bonnes: ['liever'], options: options(['liever'], pieges, h),
      uitleg: 'Aimer + werkwoord → graag, préférer + werkwoord → liever (graag, liever, liefst).' }
  }
  if (soort === 'vraag') {
    const s = o.nl.toLowerCase()
    return { boven: frans(o, PREFERE, d.fr, 'vraag'), avant: `${hoofd(vervoegd(d, o.p, true))} ${s} `, apres: `${r(d)}?`, bonnes: ['liever'], options: options(['liever'], pieges, h), uitleg }
  }
  return { boven: frans(o, PREFERE, d.fr), avant: `${o.nl} ${vervoegd(d, o.p)} `, apres: `${r(d)}.`, bonnes: ['liever'], options: options(['liever'], pieges, h), uitleg }
}

// ------------------------------------------------------------ houden van, lusten, graag of liever ?
function kiezen(h: Hasard): QuestionAimer {
  const soort = un(['houden van', 'lusten', 'graag', 'liever'] as const, h)
  const o = un(ONDERWERPEN, h)
  const vier = ['houden van', 'lusten', 'graag', 'liever']
  let boven: string, avant: string, uitleg: string
  if (soort === 'houden van') {
    const [fr, nl] = un(DINGEN.filter(d => d[1] !== o.nl), h)
    boven = frans(o, AIME, fr); avant = '« aimer » → '
    uitleg = `Aimer + naamwoord → houden van: ${o.nl} ${houden(o.p)[0]} van ${nl}.`
  } else if (soort === 'lusten') {
    const [fr, nl] = un(ETEN, h)
    boven = frans(o, AIME, fr); avant = '« aimer » → '
    uitleg = `Drank of voedsel → lusten: ${o.nl} ${o.p === 'mv' ? 'lusten' : 'lust'} ${nl}.`
  } else {
    const d = un(DOEN, h)
    boven = frans(o, soort === 'graag' ? AIME : PREFERE, d.fr); avant = soort === 'graag' ? '« aimer » → ' : '« préférer » → '
    uitleg = `${soort === 'graag' ? 'Aimer' : 'Préférer'} + werkwoord → vervoegd werkwoord + ${soort}: ${o.nl} ${vervoegd(d, o.p)} ${soort}${r(d)}.`
  }
  return { boven, avant, apres: '', bonnes: [soort], options: melange(vier, h), uitleg, astuce: 'Welke vertaling past in deze zin?' }
}

// ------------------------------------------------------------ les phrases du cours (p. 29-30)
const BOEK: { fr: string; avant: string; apres: string; bonnes: string[]; pieges: string[]; uitleg: string }[] = [
  { fr: 'Nous aimons notre école.', avant: 'We ', apres: ' van onze school.', bonnes: ['houden'], pieges: ['houdt', 'hou', 'lusten'], uitleg: UITLEG_HOUDEN },
  { fr: 'Ils aiment ce pays.', avant: 'Ze ', apres: ' van dit land.', bonnes: ['houden'], pieges: ['houdt', 'hou', 'lusten'], uitleg: UITLEG_HOUDEN },
  { fr: 'Il aime manger des frites.', avant: 'Hij eet ', apres: ' frieten.', bonnes: ['graag'], pieges: ['liever', 'lust', 'houdt'], uitleg: 'Aimer + werkwoord → onderwerp + vervoegd werkwoord + graag + bepaling(en).' },
  { fr: 'Il préfère manger des frites.', avant: 'Hij eet ', apres: ' frieten.', bonnes: ['liever'], pieges: ['graag', 'liefst', 'meer'], uitleg: 'Préférer + werkwoord → onderwerp + vervoegd werkwoord + liever + bepaling(en).' },
  { fr: 'Aimes-tu aller à l’école ?', avant: 'Ga je ', apres: ' naar school?', bonnes: ['graag'], pieges: ['liever', 'lust', 'houdt'], uitleg: 'Aimer + werkwoord → vervoegd werkwoord + graag.' },
  { fr: 'Aimez-vous le professeur de latin ? (jullie)', avant: '', apres: ' jullie van de leraar Latijn?', bonnes: ['houden'], pieges: ['houdt', 'hou', 'lusten'], uitleg: `Een persoon → houden van. ${UITLEG_HOUDEN}` },
  { fr: 'J’aime le Fanta.', avant: 'Ik ', apres: ' Fanta.', bonnes: ['lust'], pieges: ['lus', 'hou', 'lusten'], uitleg: UITLEG_LUSTEN },
  { fr: 'Elle aime la nature.', avant: 'Ze ', apres: ' van de natuur.', bonnes: ['houdt'], pieges: ['hou', 'houden', 'lust'], uitleg: UITLEG_HOUDEN },
  { fr: 'Je préfère regarder la télé.', avant: 'Ik kijk ', apres: ' tv.', bonnes: ['liever'], pieges: ['graag', 'liefst', 'meer'], uitleg: 'Préférer + werkwoord → vervoegd werkwoord + liever.' },
  { fr: 'L’élève aime travailler.', avant: 'De leerling werkt ', apres: '.', bonnes: ['graag'], pieges: ['liever', 'lust', 'houdt'], uitleg: 'Aimer + werkwoord (travailler) → vervoegd werkwoord + graag, niet houden van.' },
  { fr: 'Elle n’aime pas nager avec l’école.', avant: 'Ze zwemt ', apres: ' graag met de school.', bonnes: ['niet'], pieges: ['geen'], uitleg: 'Ne … pas + werkwoord → niet graag.' },
  { fr: 'Je n’aime pas les examens !', avant: 'Ik ', apres: ' niet van examens!', bonnes: ['hou', 'houd'], pieges: ['houdt', 'lust', 'houden'], uitleg: UITLEG_HOUDEN },
  { fr: 'J’aime les films.', avant: 'Ik ', apres: ' van films.', bonnes: ['hou', 'houd'], pieges: ['houdt', 'lust', 'houden'], uitleg: UITLEG_HOUDEN },
  { fr: 'Qu’aimes-tu faire ?', avant: 'Wat doe je ', apres: '?', bonnes: ['graag'], pieges: ['liever', 'lust', 'houdt'], uitleg: 'Aimer + werkwoord → vervoegd werkwoord + graag.' },
  { fr: 'Aimes-tu la musique classique ?', avant: '', apres: ' je van klassieke muziek?', bonnes: ['hou', 'houd'], pieges: ['houdt', 'lust', 'houden'], uitleg: `${UITLEG_HOUDEN} In een vraag met je valt de t weg.` },
  { fr: 'Mes amies aiment le fromage.', avant: 'Mijn vriendinnen ', apres: ' kaas.', bonnes: ['lusten'], pieges: ['lust', 'houden', 'houdt'], uitleg: UITLEG_LUSTEN },
  { fr: 'Qu’aimez-vous lire ? (jullie)', avant: 'Wat lezen jullie ', apres: '?', bonnes: ['graag'], pieges: ['liever', 'lust', 'houden'], uitleg: 'Aimer + werkwoord → vervoegd werkwoord + graag.' },
  { fr: 'Elle aime le week-end.', avant: 'Ze ', apres: ' van het weekend.', bonnes: ['houdt'], pieges: ['hou', 'houden', 'lust'], uitleg: UITLEG_HOUDEN },
  { fr: 'Je n’aime pas les épinards.', avant: 'Ik lust ', apres: ' spinazie.', bonnes: ['geen'], pieges: ['niet'], uitleg: 'Drank of voedsel → lusten; ne … pas + een naamwoord zonder lidwoord → geen.' },
  { fr: 'Nous préférons apprendre le néerlandais.', avant: 'We leren ', apres: ' Nederlands.', bonnes: ['liever'], pieges: ['graag', 'liefst', 'meer'], uitleg: 'Préférer + werkwoord → vervoegd werkwoord + liever.' },
  { fr: 'Je préfère être assis à côté de mon amie.', avant: 'Ik zit ', apres: ' naast mijn vriendin.', bonnes: ['liever'], pieges: ['graag', 'liefst', 'meer'], uitleg: 'Préférer + werkwoord → vervoegd werkwoord + liever.' },
  { fr: 'J’aime chanter, mais je préfère danser.', avant: 'Ik zing graag, maar ik dans ', apres: '.', bonnes: ['liever'], pieges: ['graag', 'liefst', 'meer'], uitleg: 'Aimer → graag, préférer → liever.' },
  { fr: 'J’aime jouer de la guitare.', avant: 'Ik speel ', apres: ' gitaar.', bonnes: ['graag'], pieges: ['liever', 'lust', 'houd'], uitleg: 'Aimer + werkwoord → vervoegd werkwoord + graag.' },
  { fr: 'Je préfère aller à vélo qu’en voiture.', avant: 'Ik ga ', apres: ' met de fiets dan met de auto.', bonnes: ['liever'], pieges: ['graag', 'liefst', 'meer'], uitleg: 'Préférer + werkwoord → vervoegd werkwoord + liever.' },
]
function boek(h: Hasard): QuestionAimer {
  const b = un(BOEK, h)
  return { boven: b.fr, avant: b.avant, apres: b.apres, bonnes: b.bonnes, options: options(b.bonnes, b.pieges, h, b.pieges.length === 1 ? 2 : 4), uitleg: b.uitleg }
}

export const AIMER = [
  { id: 'houden-van', nl: 'houden van + naamwoord', fr: 'aimer + un nom (Ik hou van kinderen)', faire: houdenVan },
  { id: 'lusten', nl: 'lusten (drank, voedsel)', fr: 'aimer à manger ou à boire (Ik lust kaas)', faire: lusten },
  { id: 'graag', nl: 'vervoegd werkwoord + graag', fr: 'aimer + un verbe (Ik speel graag voetbal)', faire: graag },
  { id: 'liever', nl: 'vervoegd werkwoord + liever', fr: 'préférer + un verbe (Ik speel liever voetbal)', faire: liever },
  { id: 'kiezen', nl: 'houden van, lusten, graag of liever?', fr: 'choisir la bonne traduction de « aimer »', faire: kiezen },
  { id: 'boek', nl: 'de zinnen van het boek', fr: 'les phrases du cours (p. 29-30)', faire: boek },
] as const
export const questionAimer = (i: number, h: Hasard = Math.random): QuestionAimer => AIMER[i].faire(h)
