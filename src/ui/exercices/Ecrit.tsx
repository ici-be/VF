import { useEffect } from 'preact/hooks'
import { corrigerParmi } from '../../lib/correction'
import { autresReponses, question, reponse } from '../../lib/seance'
import type { PropsExercice } from '../Seance'
import { dire, Langue } from './commun'
import { Saisie } from './Reponses'

export function Ecrit({ carte, tous, reglages, pause, suivant, annoncer }: PropsExercice) {
  const q = question(carte), rep = reponse(carte)
  const m = carte.mot

  useEffect(() => { dire(reglages, q.texte, q.langue) }, [])

  return (
    <>
      <div class="carte">
        <Langue l={q.langue} />
        <p class="mot">{q.texte}</p>
        <p class="astuce">Écris la traduction en {rep.langue === 'nl' ? 'néerlandais' : 'français'}</p>
      </div>
      <Saisie
        langue={rep.langue} attendu={rep.texte} mot={m} pause={pause} suivant={suivant} annoncer={annoncer}
        lire={() => dire(reglages, rep.texte, rep.langue)}
        // le mot attendu ou un synonyme (en néerlandais, l'article est vérifié à part)
        corriger={t => corrigerParmi(t, carte.sens === 'fr-nl' ? { texte: m.nl, det: m.det } : { texte: m.fr, det: '' },
          autresReponses(carte, tous), rep.langue, { exigerArticle: reglages.exigerArticle })}
      />
    </>
  )
}
