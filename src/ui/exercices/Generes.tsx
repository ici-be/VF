import { useMemo, useState } from 'preact/hooks'
import type { Correction, Resultat } from '../../lib/correction'
import { cleDe, questionCalcul, questionEeuwen, questionNature, type Nature } from '../../lib/generes'
import type { PropsExercice } from '../Seance'
import { Langue } from './commun'
import { Choix, Saisie } from './Reponses'

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
