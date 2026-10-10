import { useMemo } from 'preact/hooks'
import { differences } from '../../lib/correction'
import { corrigerChiffres, corrigerLettres, enChiffres, enLettres, explication, nombreAvec } from '../../lib/getallen'
import type { PropsExercice } from '../Seance'
import { Langue } from './commun'
import { Saisie } from './Reponses'

// Les nombres (chapitre Getallen) : un nombre tiré au hasard, où l'on entend le mot de la carte,
// à écrire en lettres néerlandaises (« Chiffres → lettres ») ou en chiffres (« Lettres → chiffres »).
// Pas de lecture à voix haute : ces nombres n'ont pas de voix enregistrée.
export function Getallen({ carte, pause, suivant, annoncer }: PropsExercice) {
  const n = useMemo(() => nombreAvec(carte.mot.getal!), [])
  const lettres = enLettres(n)
  const versLettres = carte.sens === 'fr-nl'

  return (
    <>
      <div class="carte">
        {!versLettres && <Langue l="nl" />}
        <p class={`mot ${versLettres ? 'nombre' : 'petit'}`}>{versLettres ? enChiffres(n) : lettres}</p>
        <p class="astuce">{versLettres ? 'Écris ce nombre en lettres, en néerlandais' : 'Écris ce nombre en chiffres'}</p>
      </div>
      <Saisie
        langue="nl" mot={carte.mot} pause={pause} suivant={suivant} annoncer={annoncer} lire={() => Promise.resolve()}
        attendu={versLettres ? lettres : enChiffres(n)} chiffres={!versLettres}
        corriger={t => (versLettres ? corrigerLettres(t, n) : corrigerChiffres(t, n))}
        apres={(t, c) => versLettres && c.resultat !== 'juste' && <>
          {t.trim() && (
            <p class="lettres-diff petit" aria-label="Ta réponse, lettre par lettre">
              Ta réponse : {differences(t.trim().toLowerCase(), lettres).map(s => <span class={s.etat}>{s.texte}</span>)}
              <span class="astuce legende">barré : en trop · en vert : oublié</span>
            </p>
          )}
          <Regle n={n} />
        </>}
      />
    </>
  )
}

/** Comment écrire ce nombre-là, puis la règle générale. */
function Regle({ n }: { n: number }) {
  return (
    <div class="info regle-nombres">
      <b>Comment l’écrire</b>
      <table>
        {explication(n).map(p => (
          <tr><td class="chiffres">{p.chiffres}</td><td><strong>{p.lettres}</strong>{p.detail && p.detail !== p.lettres && <small>{p.detail}</small>}</td></tr>
        ))}
      </table>
      <b>La règle</b>
      <ul>
        <li>Jusqu’à mille, <b>tout attaché</b> : driehonderdvijfenveertig.</li>
        <li>L’<b>unité avant la dizaine</b>, reliées par <b>en</b> : vijfenveertig (5 + en + 40). Après twee et drie, <b>ën</b> : tweeëntwintig.</li>
        <li><b>Pas de een</b> devant honderd et duizend : honderd, duizend. Mais <b>een miljoen</b>.</li>
        <li>Une <b>espace après duizend</b> et autour de <b>miljoen</b> : tweeduizend vijfhonderd, een miljoen tweehonderdduizend.</li>
      </ul>
    </div>
  )
}
