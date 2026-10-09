import { useEffect, useState } from 'preact/hooks'
import type { Mot, Vocabulaire } from '../lib/mots'
import { exercice, type Reglages } from '../lib/reglages'
import { apparence } from '../lib/apparence'
import { question, reponse, type Carte } from '../lib/seance'
import type { Resultat } from '../lib/correction'
import { noter } from '../lib/progression'
import { precharger, taire } from '../lib/voix'
import { Defilement } from './exercices/Defilement'
import { Ecrit } from './exercices/Ecrit'
import { Qcm } from './exercices/Qcm'
import { DeHet } from './exercices/DeHet'
import { Definitions } from './exercices/Definitions'
import { Trous } from './exercices/Trous'
import { Oral } from './exercices/Oral'
import { Dictee } from './exercices/Dictee'

export interface Bilan {
  serie: Carte[]
  juste: number
  presque: number
  faux: number
  /** mots ratés ou presque, à revoir */
  aRevoir: Mot[]
  note: boolean   // false pour le défilement (pas de réponse notée)
}

/** Ce que reçoit chaque exercice. */
export interface PropsExercice {
  carte: Carte
  tous: Mot[]
  reglages: Reglages
  setReglages: (r: Reglages) => void
  pause: boolean
  /** passer à la carte suivante, avec le résultat (null = pas noté) */
  suivant: (r: Resultat | null) => void
}

interface Props {
  serie: Carte[]
  voc: Vocabulaire
  reglages: Reglages
  setReglages: (r: Reglages) => void
  quitter: () => void
  terminer: (b: Bilan) => void
}

export function Seance({ serie, voc, reglages, setReglages, quitter, terminer }: Props) {
  const [file, setFile] = useState<Carte[]>(serie)
  const [i, setI] = useState(0)
  const [resultats, setResultats] = useState<Map<string, Resultat>>(new Map())
  const [pause, setPause] = useState(false)
  const ex = exercice(reglages.exercice)
  const tous = voc.matieres.flatMap(m => m.mots)

  // pause : Échap partout, Espace pour le défilement ; et automatiquement si on change d'onglet
  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || (e.key === ' ' && ex.id === 'defilement')) { e.preventDefault(); setPause(p => !p) }
    }
    const cache = () => { if (document.hidden) setPause(true) }
    addEventListener('keydown', touche)
    document.addEventListener('visibilitychange', cache)
    return () => { removeEventListener('keydown', touche); document.removeEventListener('visibilitychange', cache); taire() }
  }, [ex.id])
  useEffect(() => { if (pause) taire() }, [pause])
  // les voix de toute la série, téléchargées dès le départ
  useEffect(() => { if (reglages.voix || ex.id === 'oral' || ex.id === 'dictee') precharger(serie.flatMap(c => [
    question(c), reponse(c),
    ...[c.mot.definition, c.mot.exemple].filter(Boolean).map(texte => ({ texte, langue: 'nl' as const })),
  ])) }, [])

  if (!file.length) {
    return <div class="vide"><p>Aucun mot à réviser avec ces réglages.</p><button class="go" onClick={quitter}>Retour</button></div>
  }

  const carte = file[i]
  const suivant = (r: Resultat | null) => {
    let nouvelleFile = file
    const res = new Map(resultats)
    if (r) {
      // la première réponse compte pour le score et la progression
      if (!carte.reprise && !res.has(carte.mot.id)) { res.set(carte.mot.id, r); noter(carte.mot.id, r) }
      // un mot raté revient une fois en fin de série
      if (r === 'faux' && !carte.reprise) nouvelleFile = [...file, { ...carte, reprise: true }]
    }
    setResultats(res)
    setFile(nouvelleFile)
    if (i + 1 < nouvelleFile.length) { setI(i + 1); return }
    taire()
    const valeurs = [...res.values()]
    terminer({
      serie,
      juste: valeurs.filter(v => v === 'juste').length,
      presque: valeurs.filter(v => v === 'presque').length,
      faux: valeurs.filter(v => v === 'faux').length,
      aRevoir: serie.filter(c => res.get(c.mot.id) && res.get(c.mot.id) !== 'juste').map(c => c.mot),
      note: r !== null,
    })
  }

  const props: PropsExercice = { carte, tous, reglages, setReglages, pause, suivant }
  const justes = [...resultats.values()].filter(v => v !== 'faux').length

  return (
    <>
      <div class="barre">
        <button class="icone" onClick={quitter} aria-label="Quitter l’exercice" title="Quitter">✕</button>
        <span class="quoi">{ex.nom}{ex.beta ? ' (bêta)' : ''} · {[...new Set(serie.map(c => c.mot.matiere))].map(n => `${apparence(n).icone} ${apparence(n).titre}`).join(' + ')}</span>
        {ex.id !== 'defilement' && <span class="compte" title="Bonnes réponses">✓ {justes}</span>}
        <span class="compte">{Math.min(i + 1, file.length)} / {file.length}</span>
        <button class="icone" onClick={() => setPause(true)} aria-label="Pause" title="Pause (Échap)">⏸</button>
      </div>
      <div class="progres"><div style={{ width: `${(i / file.length) * 100}%` }} /></div>
      <main class="scene">
        {ex.id === 'defilement' && <Defilement key={i} {...props} />}
        {ex.id === 'ecrit' && <Ecrit key={i} {...props} />}
        {ex.id === 'qcm' && <Qcm key={i} {...props} />}
        {ex.id === 'dehet' && <DeHet key={i} {...props} />}
        {ex.id === 'definitions' && <Definitions key={i} {...props} />}
        {ex.id === 'trous' && <Trous key={i} {...props} />}
        {ex.id === 'oral' && <Oral key={i} {...props} />}
        {ex.id === 'dictee' && <Dictee key={i} {...props} />}
      </main>
      {pause && (
        <div class="voile" role="dialog" aria-modal="true" aria-label="Pause">
          <div class="carte">
            <h2>Pause</h2>
            <p>{i} mot{i > 1 ? 's' : ''} sur {file.length} déjà vus.</p>
            <div class="actions">
              <button class="go" autoFocus onClick={() => setPause(false)}>Reprendre ▶</button>
              <button class="second" onClick={quitter}>Arrêter</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
