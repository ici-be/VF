import { useEffect, useMemo } from 'preact/hooks'
import { differences } from '../../lib/correction'
import { corrigerChiffres, corrigerLettres, enChiffres, enLettres, nombreAvec } from '../../lib/getallen'
import type { PropsExercice } from '../Seance'
import { dire, Langue } from './commun'
import { Saisie } from './Reponses'

// Les nombres (chapitre Getallen) : un nombre tiré au hasard, où l'on entend le mot de la carte,
// à écrire en lettres néerlandaises (« Chiffres → lettres ») ou en chiffres (« Lettres → chiffres »).
export function Getallen({ carte, reglages, pause, suivant, annoncer }: PropsExercice) {
  const n = useMemo(() => nombreAvec(carte.mot.getal!), [])
  const lettres = enLettres(n)
  const versLettres = carte.sens === 'fr-nl'
  const lire = () => dire(reglages, lettres, 'nl')

  // en lettres → chiffres, on entend le nombre en même temps qu'on le lit
  useEffect(() => { if (!versLettres) lire() }, [])

  return (
    <>
      <div class="carte">
        {!versLettres && <Langue l="nl" />}
        <p class={`mot ${versLettres ? 'nombre' : 'petit'}`}>{versLettres ? enChiffres(n) : lettres}</p>
        <p class="astuce">{versLettres ? 'Écris ce nombre en lettres, en néerlandais' : 'Écris ce nombre en chiffres'}</p>
      </div>
      <Saisie
        langue="nl" mot={carte.mot} pause={pause} suivant={suivant} annoncer={annoncer} lire={lire}
        attendu={versLettres ? lettres : enChiffres(n)} chiffres={!versLettres}
        corriger={t => (versLettres ? corrigerLettres(t, n) : corrigerChiffres(t, n))}
        apres={(t, c) => versLettres && c.resultat !== 'juste' && t.trim() && (
          <p class="lettres-diff petit" aria-label="Ta réponse, lettre par lettre">
            Ta réponse : {differences(t.trim().toLowerCase(), lettres).map(s => <span class={s.etat}>{s.texte}</span>)}
            <span class="astuce legende">barré : en trop · en vert : oublié</span>
          </p>
        )}
      />
    </>
  )
}
