import { useEffect, useMemo } from 'preact/hooks'
import { leurres, melanger, question, reponse } from '../../lib/seance'
import type { PropsExercice } from '../Seance'
import { dire, Langue } from './commun'
import { Choix } from './Reponses'

export function Qcm({ carte, tous, reglages, pause, suivant }: PropsExercice) {
  const q = question(carte), rep = reponse(carte)
  const options = useMemo(() => melanger([rep.texte, ...leurres(carte, tous)]), [])

  useEffect(() => { dire(reglages, q.texte, q.langue) }, [])

  return (
    <>
      <div class="carte">
        <Langue l={q.langue} />
        <p class="mot">{q.texte}</p>
      </div>
      <Choix options={options} bonne={rep.texte} mot={carte.mot} pause={pause}
        lire={() => dire(reglages, rep.texte, rep.langue)} suivant={suivant} />
    </>
  )
}
