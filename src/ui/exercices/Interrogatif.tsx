import { useMemo } from 'preact/hooks'
import { affirmation, corrigerQuestion, nomTemps, TEMPS, verbe, type Temps } from '../../lib/conjugaison'
import type { PropsExercice } from '../Seance'
import { dire } from './commun'
import { Saisie } from './Reponses'

// « Jij slaapt. » → « Slaap jij? » : le verbe conjugué passe devant le sujet.
export function Interrogatif({ carte, reglages, pause, suivant, annoncer }: PropsExercice) {
  const v = verbe(carte.mot.verbe!)!
  const { temps, personne } = useMemo(() => {
    const temps: Temps = reglages.temps === 'mix' ? TEMPS[Math.floor(Math.random() * TEMPS.length)].id : reglages.temps
    // « jij » plus souvent que les autres : c'est là que se cache le piège du -t
    const personne = Math.random() < 0.35 ? 1 : Math.floor(Math.random() * 7)
    return { temps, personne }
  }, [])
  const question = v.questionsTexte[temps][personne]

  return (
    <>
      <div class="carte">
        <p class="mot">{affirmation(v, temps, personne)}</p>
        <p class="sous-titre">{v.inf} – <strong>{v.fr}</strong> · {nomTemps(temps)}</p>
        <p class="consigne">Mets cette phrase à la forme interrogative.</p>
      </div>
      <Saisie
        langue="nl" attendu={question} mot={{ ...carte.mot, remarque: v.primitifs }} pause={pause}
        suivant={suivant} annoncer={annoncer} placeholder="La question…"
        lire={() => dire(reglages, question, 'nl')}
        corriger={t => corrigerQuestion(t, v, temps, personne)}
      />
    </>
  )
}
