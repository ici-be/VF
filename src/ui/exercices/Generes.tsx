import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import { corriger, type Correction, type Resultat } from '../../lib/correction'
import { cleDe, questionCalcul, questionEeuwen, questionNature, type Nature } from '../../lib/generes'
import { questionAimer, type QuestionAimer } from '../../lib/aimer'
import { questionVoornaamwoord } from '../../lib/voornaamwoorden'
import { controleer, oplossing, questionWoordvolgorde, zinTekst, type Oordeel, type Zin } from '../../lib/woordvolgorde'
import type { PropsExercice } from '../Seance'
import { attendre, Langue, Verdict } from './commun'
import { Actions, Choix, Saisie } from './Reponses'

// Les exercices fabriqués par l'appli (src/lib/generes.ts) : une question nouvelle à chaque carte,
// puis l'explication (le calcul du siècle, le détail du calcul, le test de la nature).
// Pas de voix : ces textes n'ont pas de fichier enregistré.
const sansVoix = () => Promise.resolve()

/** Eeuwen : l'année → le siècle ou le tijdvak, un siècle → ses années (en néerlandais, comme le cours). */
export function Eeuwen({ carte, pause, suivant, annoncer }: PropsExercice) {
  const q = useMemo(() => questionEeuwen(Number(cleDe(carte.mot))), [])
  const [repondu, setRepondu] = useState<Resultat | null>(null)
  return (
    <>
      <div class="carte">
        <Langue l="nl" />
        <p class="mot petit">{q.question}</p>
      </div>
      <Choix options={q.options} bonne={q.bonne} mot={carte.mot} pause={pause} lire={sansVoix} suivant={suivant}
        annoncer={r => { setRepondu(r); annoncer(r) }} />
      {repondu && <div class="info explication"><b>Uitleg</b><span>{q.uitleg}</span></div>}
    </>
  )
}

/** Calcul mental : un calcul à faire (réponse écrite), ou une expression à coder, décoder, une propriété à reconnaître. */
export function Calcul({ carte, pause, suivant, annoncer }: PropsExercice) {
  const q = useMemo(() => questionCalcul(Number(cleDe(carte.mot))), [])
  const [repondu, setRepondu] = useState<Resultat | null>(null)
  const corriger = (t: string): Correction =>
    t.replace(/\s/g, '') === q.bonne ? { resultat: 'juste', message: '' } : { resultat: 'faux', message: '' }
  return (
    <>
      <div class="carte">
        <p class="astuce">{q.question}</p>
        <p class={`mot ${q.options ? 'petit' : 'nombre'}`}>{q.sujet}</p>
      </div>
      {q.options
        ? <>
            <Choix options={q.options} bonne={q.bonne} mot={carte.mot} pause={pause} lire={sansVoix} suivant={suivant}
              annoncer={r => { setRepondu(r); annoncer(r) }} longues={q.options.some(o => o.length > 24)} />
            {repondu && <div class="info explication"><b>Explication</b><span>{q.explication}</span></div>}
          </>
        : <Saisie langue="fr" attendu={q.bonne} mot={carte.mot} pause={pause} lire={sansVoix} suivant={suivant} annoncer={annoncer}
            corriger={corriger} chiffres placeholder="Le résultat"
            apres={() => <div class="info explication"><b>Explication</b><span>{q.explication}</span></div>} />}
    </>
  )
}

/** Natures des mots : la nature du mot en gras dans la phrase. */
export function Natures({ carte, pause, suivant, annoncer }: PropsExercice) {
  const q = useMemo(() => questionNature(cleDe(carte.mot) as Nature), [])
  const [repondu, setRepondu] = useState<Resultat | null>(null)
  return (
    <>
      <div class="carte">
        <p class="phrase">{q.morceaux.map(m => (m.cible ? <strong class="cible">{m.texte}</strong> : m.texte))}</p>
        <p class="astuce">Quelle est la nature du mot souligné ?</p>
      </div>
      <Choix options={q.options} bonne={q.bonne} mot={carte.mot} pause={pause} lire={sansVoix} suivant={suivant}
        annoncer={r => { setRepondu(r); annoncer(r) }} />
      {repondu && <div class="info explication"><b>Le test</b><span>{q.explication}</span></div>}
    </>
  )
}

/** Voornaamwoorden : la phrase à compléter (l'indice entre parenthèses), en choisissant ou en écrivant le mot. */
export function Voornaamwoorden(props: PropsExercice) {
  const q = useMemo(() => questionVoornaamwoord(Number(cleDe(props.carte.mot))), [])
  return <PhraseATrou {...props} q={q} astuce="Vul in met het juiste voornaamwoord." placeholder="Het voornaamwoord" />
}

/** Aimer : la phrase française au-dessus, la phrase néerlandaise à compléter (houden van, lusten, graag, liever). */
export function Aimer(props: PropsExercice) {
  const q = useMemo(() => questionAimer(Number(cleDe(props.carte.mot))), [])
  return <PhraseATrou {...props} q={q} astuce={q.astuce ?? 'Vertaal: vul de zin aan.'} placeholder="Het ontbrekende woord" />
}

/** Une phrase néerlandaise à trou, en choisissant ou en écrivant le mot, puis l'explication (Uitleg). */
function PhraseATrou({ carte, reglages, pause, suivant, annoncer, q, astuce, placeholder }: PropsExercice & { q: QuestionAimer; astuce: string; placeholder: string }) {
  const [repondu, setRepondu] = useState<Resultat | null>(null)
  // en début de phrase, avec une majuscule
  const vorm = (s: string) => (q.avant ? s : s[0].toUpperCase() + s.slice(1))
  const attendu = q.bonnes.map(vorm).join(' / ')
  const uitleg = <div class="info explication"><b>Uitleg</b><span>{q.uitleg}</span></div>
  const annoncer2 = (r: Resultat) => { setRepondu(r); annoncer(r) }
  return (
    <>
      <div class="carte">
        <Langue l="nl" />
        {q.boven && <p class="astuce boven">{q.boven}</p>}
        <p class="phrase">
          {q.avant}
          <span class={repondu ? `trou-corrige ${repondu}` : 'trou-vnw'}>{repondu ? vorm(q.bonnes[0]) : '…'}</span>
          {q.apres}
        </p>
        <p class="astuce">{astuce}</p>
      </div>
      {reglages.repondre === 'choix'
        ? <>
            <Choix options={q.options.map(vorm)} bonne={vorm(q.bonnes[0])} mot={carte.mot} pause={pause} lire={sansVoix} suivant={suivant} annoncer={annoncer2} />
            {repondu && uitleg}
          </>
        : <Saisie langue="nl" attendu={attendu} mot={carte.mot} pause={pause} lire={sansVoix} suivant={suivant} annoncer={annoncer2}
            corriger={t => corriger(t, q.bonnes.join(' / '), 'nl')} placeholder={placeholder} apres={() => uitleg} />}
    </>
  )
}

/** La phrase, avec la PV en rouge et l'onderwerp en vert comme dans le cours, l'infinitif ou la particule en orange. */
function ZinKleur({ zin, volgorde }: { zin: Zin; volgorde: number[] }) {
  const tekst = zinTekst(zin, volgorde)
  let pos = 0
  return (
    <span class="wv-kleur">
      {volgorde.map((i, k) => {
        const d = zin.delen[i]
        const t = tekst.slice(pos, pos + d.t.length)
        pos += d.t.length + 1
        return <>{k > 0 && ' '}<span class={`wv-${d.rol}`}>{t}</span></>
      })}
      {tekst.slice(-1)}
    </span>
  )
}

/** Woordvolgorde : les zinsdelen à remettre dans l'ordre (en les touchant), ou une question à choix (PV, onderwerp, welke zin is juist?). */
export function Woordvolgorde(props: PropsExercice) {
  const q = useMemo(() => questionWoordvolgorde(Number(cleDe(props.carte.mot))), [])
  const [repondu, setRepondu] = useState<Resultat | null>(null)
  if (q.soort === 'puzzel') return <Puzzel {...props} q={q} />
  const { carte, pause, suivant, annoncer } = props
  return (
    <>
      <div class="carte">
        <Langue l="nl" />
        {q.zin && <p class="phrase">{repondu ? <ZinKleur zin={q.zin} volgorde={q.volgorde!} /> : zinTekst(q.zin, q.volgorde!)}</p>}
        <p class={q.zin ? 'astuce' : 'mot petit'}>{q.vraag}</p>
      </div>
      <Choix options={q.options} bonne={q.bonne} mot={carte.mot} pause={pause} lire={sansVoix} suivant={suivant}
        annoncer={r => { setRepondu(r); annoncer(r) }} longues={q.longues} />
      {repondu && <div class="info explication"><b>Uitleg</b><span>{q.uitleg}</span></div>}
    </>
  )
}

type Puzzelvraag = Extract<ReturnType<typeof questionWoordvolgorde>, { soort: 'puzzel' }>

function Puzzel({ pause, suivant, annoncer, q }: PropsExercice & { q: Puzzelvraag }) {
  const { zin } = q
  const [gekozen, zetGekozen] = useState<number[]>([])
  // la phrase en cours, à jour tout de suite (des touches tapées vite ne prennent pas deux fois le même zinsdeel)
  const huidig = useRef<number[]>([])
  const setGekozen = (f: (g: number[]) => number[]) => { huidig.current = f(huidig.current); zetGekozen(huidig.current) }
  const [oordeel, setOordeel] = useState<Oordeel | null>(null)
  const [opgegeven, setOpgegeven] = useState(false)
  const over = q.schud.filter(i => !gekozen.includes(i))
  const vol = gekozen.length === zin.delen.length
  const juist = !!oordeel?.juist
  // la solution montrée : celle qui commence comme la réponse, si ce début est possible
  const eerste = gekozen.length ? zin.delen[gekozen[0]] : undefined
  const goed = juist ? gekozen : oplossing(zin, eerste?.voor && !zin.vraag ? gekozen[0] : undefined)

  const kies = (i: number) => { if (!oordeel && !pause) setGekozen(g => (g.includes(i) ? g : [...g, i])) }
  const terug = (i: number) => { if (!oordeel && !pause) setGekozen(g => g.filter(x => x !== i)) }
  const valider = (abandon = false) => {
    if (oordeel) { suivant(juist ? 'juste' : 'faux'); return }
    if (!abandon && huidig.current.length < zin.delen.length) return
    const o: Oordeel = abandon ? { juist: false, waarom: '' } : controleer(zin, huidig.current)
    if (abandon) setOpgegeven(true)
    setOordeel(o)
    annoncer(o.juist ? 'juste' : 'faux')
  }

  // juste : on enchaîne tout seul, après un temps pour voir la phrase en couleurs
  useEffect(() => {
    if (!juist || pause) return
    let annule = false
    attendre(1800).then(() => { if (!annule) suivant('juste') })
    return () => { annule = true }
  }, [juist, pause])

  // clavier : 1 à 9 prend un zinsdeel, Retour arrière enlève le dernier, Entrée vérifie puis passe à la suite
  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      if (pause) return
      const n = Number(e.key), nu = huidig.current
      const rest = q.schud.filter(i => !nu.includes(i))
      if (n >= 1 && n <= rest.length) kies(rest[n - 1])
      else if (e.key === 'Backspace' && nu.length && !oordeel) { e.preventDefault(); terug(nu[nu.length - 1]) }
      else if (e.key === 'Enter' && (nu.length === zin.delen.length || oordeel)) { e.preventDefault(); valider() }
    }
    addEventListener('keydown', touche)
    return () => removeEventListener('keydown', touche)
  })

  const correction: Correction | null = oordeel && { resultat: juist ? 'juste' : 'faux', message: oordeel.waarom }
  return (
    <>
      <div class="carte">
        <Langue l="nl" />
        {q.boven && <p class="astuce boven">{q.boven}</p>}
        <div class={`wv-zin ${oordeel ? (juist ? 'juste' : 'faux') : ''}`} aria-label="Ta phrase">
          {gekozen.length === 0 && !oordeel && <span class="wv-leeg">Touche les morceaux dans le bon ordre</span>}
          {opgegeven && gekozen.length === 0 && <span class="wv-leeg">—</span>}
          {gekozen.map((i, k) => (
            <button class="wv-stuk" onClick={() => terug(i)} disabled={!!oordeel} title="Enlever">
              {k === 0 ? zin.delen[i].t[0].toUpperCase() + zin.delen[i].t.slice(1) : zin.delen[i].t}
            </button>
          ))}
          {vol && <span class="wv-punt">{zin.vraag ? '?' : '.'}</span>}
        </div>
        <p class="astuce">{q.astuce}</p>
      </div>
      {!oordeel && (
        <div class="wv-pool">
          {over.map((i, k) => (
            <button class="wv-stuk" onClick={() => kies(i)}><span class="k">{k + 1}</span>{zin.delen[i].t}</button>
          ))}
        </div>
      )}
      {correction && <Verdict c={correction} attendu={zinTekst(zin, goed)} />}
      {oordeel && <div class="info explication"><b>Uitleg</b><span><ZinKleur zin={zin} volgorde={goed} /></span><span>{q.uitleg}</span></div>}
      <Actions correction={correction} vide={!vol} valider={valider} />
    </>
  )
}
