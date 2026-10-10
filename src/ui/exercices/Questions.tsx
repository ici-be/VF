import { useEffect, useMemo, useState } from 'preact/hooks'
import { leurres, melanger } from '../../lib/seance'
import { nomChapitre } from '../Accueil'
import type { PropsExercice } from '../Seance'
import { dire, EntreeSuivant, Langue } from './commun'
import { Choix } from './Reponses'

// Une question du cours (onglet « Vragen ») : choisir la bonne réponse parmi 4,
// ou y répondre dans sa tête, voir la réponse et dire honnêtement si on la savait.
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
      {reglages.repondre === 'choix'
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
