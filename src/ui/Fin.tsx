import type { Reglages } from '../lib/reglages'
import { exercice } from '../lib/reglages'
import { nlComplet, type Carte } from '../lib/seance'
import { noteSerie, type Bilan } from './Seance'
import { useEffect } from 'preact/hooks'
import { confettis } from '../lib/confettis'
import { accord, niveauNote, nombre, note } from '../lib/texte'

interface Props {
  bilan: Bilan
  reglages: Reglages
  rejouer: (serie?: Carte[]) => void
  accueil: () => void
}

export function Fin({ bilan, reglages, rejouer, accueil }: Props) {
  const sur20 = noteSerie(bilan)
  const parfait = bilan.notee && bilan.faux === 0 && bilan.juste + bilan.presque > 0
  const bravo = parfait ? 'Parfait !' : sur20 >= 16 ? 'Très bien !' : sur20 >= 10 ? 'Pas mal, continue !' : 'Il faut encore s’entraîner.'
  useEffect(() => { if (parfait) confettis() }, [])
  const aRevoir = bilan.serie.filter(c => bilan.aRevoir.includes(c.mot)).map(c => ({ ...c, reprise: false }))

  return (
    <main class="scene">
      <div class="carte">
        {bilan.notee && <p class={`note-serie ${niveauNote(sur20)}`}>{note(sur20)}</p>}
        <p class="mot">{bilan.notee ? bravo : 'Série terminée'}</p>
        <p class="astuce">{exercice(reglages.exercice).nom} · {nombre(bilan.serie.length, 'mot')}</p>
      </div>
      {bilan.notee && (
        <div class="score">
          <div class="j"><b>{bilan.juste}</b>{accord(bilan.juste, 'juste')}</div>
          {bilan.presque > 0 && <div class="p"><b>{bilan.presque}</b>presque</div>}
          <div class="f"><b>{bilan.faux}</b>{accord(bilan.faux, 'raté')}</div>
          {bilan.meilleurCombo >= 3 && <div class="c"><b>🔥 ×{bilan.meilleurCombo}</b>meilleur combo</div>}
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
        {aRevoir.length > 0 && <button class="go" onClick={() => rejouer(aRevoir)}>{aRevoir.length > 1 ? `Revoir les ${aRevoir.length} mots ratés` : 'Revoir le mot raté'}</button>}
        <button class={aRevoir.length ? 'second' : 'go'} onClick={() => rejouer()}>Nouvelle série</button>
        <button class="second" onClick={accueil}>Menu</button>
      </div>
    </main>
  )
}
