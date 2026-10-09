import { useEffect } from 'preact/hooks'
import { corriger, differences, simplifier } from '../../lib/correction'
import { nlComplet } from '../../lib/seance'
import { parler } from '../../lib/voix'
import type { PropsExercice } from '../Seance'
import { Saisie } from './Reponses'

// J'entends le mot néerlandais (avec son article) et je l'écris : orthographe exacte.
// La voix est toujours lue ici, même si elle est coupée dans les réglages.
export function Dictee({ carte, reglages, pause, suivant, annoncer }: PropsExercice) {
  const m = carte.mot
  const complet = nlComplet(m)
  const ecouter = (vitesse = 1) => parler(complet, 'nl', vitesse)

  useEffect(() => { if (!pause) ecouter() }, [])

  // la réponse comparée lettre à lettre : avec l'article si elle l'a écrit
  const lettres = (texte: string) => {
    const t = simplifier(texte)
    const cible = /^(de|het) /.test(t) ? complet : m.nl
    return differences(t, cible.toLowerCase())
  }

  return (
    <>
      <div class="carte">
        <div class="actions">
          <button class="go grand" onClick={() => ecouter()} aria-label="Écouter le mot">🔊 Écouter</button>
          <button class="second" onClick={() => ecouter(0.7)} aria-label="Écouter lentement">🐢 Lentement</button>
        </div>
        <p class="astuce">Indice : <strong>{m.fr}</strong></p>
      </div>
      <Saisie
        langue="nl" attendu={complet} mot={m} pause={pause} suivant={suivant} annoncer={annoncer}
        placeholder="Écris le mot entendu"
        lire={() => ecouter()}
        corriger={t => corriger(t, m.nl, 'nl', m.det, { strict: true, exigerArticle: reglages.exigerArticle })}
        apres={(t, c) => c.resultat !== 'juste' && t.trim() && (
          <p class="lettres-diff" aria-label="Ta réponse, lettre par lettre">
            Ta réponse : {lettres(t).map(s => <span class={s.etat}>{s.texte}</span>)}
            <span class="astuce legende">barré : en trop · en vert : oublié</span>
          </p>
        )}
      />
    </>
  )
}
