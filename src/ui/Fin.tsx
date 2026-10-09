import type { Reglages } from '../lib/reglages'
import { exercice } from '../lib/reglages'
import { nlComplet, type Carte } from '../lib/seance'
import type { Bilan } from './Seance'

interface Props {
  bilan: Bilan
  reglages: Reglages
  rejouer: (serie?: Carte[]) => void
  accueil: () => void
}

export function Fin({ bilan, reglages, rejouer, accueil }: Props) {
  const total = bilan.juste + bilan.presque + bilan.faux
  const pourcent = total ? Math.round(((bilan.juste + bilan.presque) / total) * 100) : 0
  const bravo = pourcent === 100 ? 'Parfait !' : pourcent >= 80 ? 'Très bien !' : pourcent >= 50 ? 'Pas mal, continue !' : 'Il faut encore s’entraîner.'
  const aRevoir = bilan.serie.filter(c => bilan.aRevoir.includes(c.mot)).map(c => ({ ...c, reprise: false }))

  return (
    <main class="scene">
      <div class="carte">
        <p class="mot">{bilan.note ? bravo : 'Série terminée'}</p>
        <p class="astuce">{exercice(reglages.exercice).nom} · {bilan.serie.length} mots</p>
      </div>
      {bilan.note && (
        <div class="score">
          <div class="j"><b>{bilan.juste}</b>justes</div>
          {bilan.presque > 0 && <div class="p"><b>{bilan.presque}</b>presque</div>}
          <div class="f"><b>{bilan.faux}</b>ratés</div>
        </div>
      )}
      {bilan.aRevoir.length > 0 && (
        <div class="rates">
          <ul>
            {bilan.aRevoir.map(m => <li><strong>{nlComplet(m)}</strong><span>{m.fr}</span></li>)}
          </ul>
        </div>
      )}
      <div class="actions">
        {aRevoir.length > 0 && <button class="go" onClick={() => rejouer(aRevoir)}>Revoir les {aRevoir.length} mots ratés</button>}
        <button class={aRevoir.length ? 'second' : 'go'} onClick={() => rejouer()}>Nouvelle série</button>
        <button class="second" onClick={accueil}>Menu</button>
      </div>
    </main>
  )
}
