import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import { leurres, melanger } from '../../lib/seance'
import { corrigerListe, type CorrectionListe } from '../../lib/correction'
import { nomChapitre } from '../Accueil'
import type { PropsExercice } from '../Seance'
import { dire, EntreeSuivant, Langue } from './commun'
import { Actions, Choix } from './Reponses'

// Une question du cours (onglet « Vragen ») : choisir la bonne réponse parmi 4,
// ou y répondre dans sa tête, voir la réponse et dire honnêtement si on la savait.
// Une énumération (« Noem drie … ») se répond toujours en écrivant chaque élément.
export function Questions({ carte, tous, reglages, pause, suivant, annoncer }: PropsExercice) {
  const m = carte.mot
  const vraag = m.vraag!
  // les mauvaises réponses écrites avec la question ; s'il en manque, les réponses d'autres questions
  const options = useMemo(() => {
    const propres = vraag.leurres.filter(l => l !== m.fr).slice(0, 3)
    return melanger([m.fr, ...propres, ...leurres({ mot: m, sens: 'nl-fr' }, tous, 3 - propres.length)])
  }, [])
  const lireReponse = () => dire(reglages, m.fr, 'nl')

  useEffect(() => { dire(reglages, m.nl, 'nl') }, [])

  return (
    <>
      <div class="carte">
        <Langue l="nl" />
        <p class="mot petit">{m.nl}</p>
        <p class="astuce">{nomChapitre(m.chapitre)}{vraag.page && ` · p. ${vraag.page}`}</p>
      </div>
      {vraag.nombre > 0
        ? <Enumeration elements={vraag.elements} nombre={vraag.nombre} pause={pause} lire={lireReponse} suivant={suivant} annoncer={annoncer} />
        : reglages.repondre === 'choix'
        ? <Choix options={options} bonne={m.fr} mot={m} pause={pause} lire={lireReponse} suivant={suivant} annoncer={annoncer} longues />
        : <DansMaTete reponse={m.fr} pause={pause} lire={lireReponse} suivant={suivant} annoncer={annoncer} />}
    </>
  )
}

const AUTO = [
  { r: 'faux', nom: 'Pas encore', classe: 'mauvais' },
  { r: 'presque', nom: 'À peu près', classe: '' },
  { r: 'juste', nom: 'Je savais', classe: 'bon' },
] as const

function DansMaTete({ reponse, pause, lire, suivant, annoncer }: {
  reponse: string
  pause: boolean
  lire: () => Promise<void>
  suivant: PropsExercice['suivant']
  annoncer: PropsExercice['annoncer']
}) {
  const [vue, setVue] = useState(false)
  const voir = () => { if (!vue) { setVue(true); lire() } }
  const noter = (k: number) => { annoncer(AUTO[k].r); suivant(AUTO[k].r) }

  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      if (pause || !vue) return
      const n = Number(e.key)
      if (n >= 1 && n <= AUTO.length) noter(n - 1)
    }
    addEventListener('keydown', touche)
    return () => removeEventListener('keydown', touche)
  })

  if (!vue) {
    return (
      <>
        <p class="astuce">Réponds dans ta tête (ou à voix haute), puis regarde la réponse.</p>
        <button class="go" autoFocus onClick={voir}>Voir la réponse ⏎</button>
        <EntreeSuivant onEntree={voir} pause={pause} />
      </>
    )
  }
  return (
    <>
      <div class="info reponse-modele"><b>Réponse :</b> <span>{reponse}</span></div>
      <p class="astuce">Ta réponse disait-elle l’essentiel ?</p>
      <div class="choix auto-eval">
        {AUTO.map((a, k) => (
          <button class={a.classe} onClick={() => noter(k)}><span class="k">{k + 1}</span><span>{a.nom}</span></button>
        ))}
      </div>
    </>
  )
}

const CLASSE = { juste: 'ok', presque: 'presque', faux: 'ko' }

function Enumeration({ elements, nombre, pause, lire, suivant, annoncer }: {
  elements: string[]
  nombre: number
  pause: boolean
  lire: () => Promise<void>
  suivant: PropsExercice['suivant']
  annoncer: PropsExercice['annoncer']
}) {
  const [textes, setTextes] = useState<string[]>(() => new Array(nombre).fill(''))
  const [c, setC] = useState<CorrectionListe | null>(null)
  const champs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => { if (!pause && !c) champs.current[0]?.focus() }, [pause])

  const valider = (abandon = false) => {
    if (c) { suivant(c.resultat); return }
    const res = corrigerListe(abandon ? textes.map(() => '') : textes, elements)
    setC(res)
    annoncer(res.resultat)
    lire()
  }
  // Entrée : champ suivant, puis « Vérifier » au dernier (ensuite, EntreeSuivant prend le relais)
  const entree = (i: number) => {
    if (i + 1 < nombre) champs.current[i + 1]?.focus()
    else valider()
  }

  return (
    <>
      <p class="astuce">{nombre < elements.length ? `Donne-en ${nombre} (n’importe lesquels, dans n’importe quel ordre).` : `${nombre} réponses, dans n’importe quel ordre.`}</p>
      <div class="enumeration">
        {textes.map((t, i) => (
          <label class={c ? CLASSE[c.champs[i].resultat] : ''}>
            <span class="k">{i + 1}</span>
            <input
              ref={el => { champs.current[i] = el }} value={t} readOnly={!!c} lang="nl"
              autocomplete="off" autocapitalize="off" spellcheck={false} aria-label={`Réponse ${i + 1}`}
              onInput={e => { const v = (e.target as HTMLInputElement).value; setTextes(ts => ts.map((x, j) => (j === i ? v : x))) }}
              onKeyDown={e => { if (e.key === 'Enter' && !c) { e.preventDefault(); entree(i) } }}
            />
            {c && c.champs[i].resultat === 'presque' && <span class="corrige">{c.champs[i].element}</span>}
            {c && c.champs[i].message && c.champs[i].resultat === 'faux' && <span class="corrige">{c.champs[i].message}</span>}
          </label>
        ))}
      </div>
      {c && (
        <div class={`verdict ${c.resultat}`} role="status">
          <b>{{ juste: 'Juste !', presque: 'Presque !', faux: 'Raté' }[c.resultat]}</b>
          {c.manquants.length > 0 && (
            <span class="attendu">{nombre < elements.length ? 'Tu pouvais aussi citer' : 'Il manquait'} : <strong>{c.manquants.join(' · ')}</strong></span>
          )}
        </div>
      )}
      <Actions correction={c && { resultat: c.resultat, message: '' }} vide={textes.every(t => !t.trim())} valider={valider} />
      {c && <EntreeSuivant onEntree={() => valider()} pause={pause} />}
    </>
  )
}
