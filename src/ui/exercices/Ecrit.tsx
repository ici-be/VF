import { useEffect } from 'preact/hooks'
import { corriger } from '../../lib/correction'
import { question, reponse, synonymes } from '../../lib/seance'
import type { Correction } from '../../lib/correction'
import type { Mot } from '../../lib/mots'
import type { PropsExercice } from '../Seance'
import { dire, Langue } from './commun'
import { Saisie } from './Reponses'

export function Ecrit({ carte, tous, reglages, pause, suivant }: PropsExercice) {
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
        langue={rep.langue} attendu={rep.texte} mot={m} pause={pause} suivant={suivant}
        lire={() => dire(reglages, rep.texte, rep.langue)}
        corriger={t => meilleure([m, ...synonymes(carte, tous)], x => rep.langue === 'nl'
          // en néerlandais, on corrige le mot ; l'article est vérifié à part
          ? corriger(t, x.nl, 'nl', x.det, { exigerArticle: reglages.exigerArticle })
          : corriger(t, x.fr, 'fr'))}
      />
    </>
  )
}

const RANG = { juste: 0, presque: 1, faux: 2 }

/** La correction la plus favorable parmi le mot attendu et ses synonymes du tableau. */
function meilleure(mots: Mot[], corr: (m: Mot) => Correction): Correction {
  return mots.map(corr).reduce((a, b) => (RANG[b.resultat] < RANG[a.resultat] ? b : a))
}
