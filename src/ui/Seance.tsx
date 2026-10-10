import { useEffect, useRef, useState } from 'preact/hooks'
import type { Mot, Vocabulaire } from '../lib/mots'
import { exercice, type Reglages } from '../lib/reglages'
import { IconeExercice } from './icones'
import { question, reponse, type Carte } from '../lib/seance'
import type { Resultat } from '../lib/correction'
import { noter } from '../lib/progression'
import { precharger, taire } from '../lib/voix'
import { confettis } from '../lib/confettis'
import { verbe, TEMPS } from '../lib/conjugaison'
import { Defilement } from './exercices/Defilement'
import { Ecrit } from './exercices/Ecrit'
import { Qcm } from './exercices/Qcm'
import { DeHet } from './exercices/DeHet'
import { Definitions } from './exercices/Definitions'
import { Trous } from './exercices/Trous'
import { Oral } from './exercices/Oral'
import { Dictee } from './exercices/Dictee'
import { Conjugaison } from './exercices/Conjugaison'
import { Interrogatif } from './exercices/Interrogatif'
import { Primitifs } from './exercices/Primitifs'
import { Questions } from './exercices/Questions'
import { NomsCote } from './Matieres'
import { nombre } from '../lib/texte'

export interface Bilan {
  serie: Carte[]
  juste: number
  presque: number
  faux: number
  /** mots ratés ou presque, à revoir */
  aRevoir: Mot[]
  notee: boolean   // false pour le défilement (pas de réponse notée)
  meilleurCombo: number
}

/** Note sur 20 d'une série, au demi-point (un « presque » vaut un demi). */
export const noteSerie = (b: Bilan) => {
  const total = b.juste + b.presque + b.faux
  return total ? Math.round(((b.juste + b.presque / 2) / total) * 40) / 2 : 0
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
  /** signaler le résultat dès qu'il est connu (le combo réagit tout de suite) */
  annoncer: (r: Resultat) => void
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
  // bonnes réponses d'affilée (« presque » compte) ; une erreur remet à zéro
  const [combo, setCombo] = useState(0)
  const meilleurCombo = useRef(0)
  const annonce = useRef(false)   // le résultat de la carte en cours a-t-il déjà compté pour le combo ?
  const compter = (r: Resultat) => {
    const c = r === 'faux' ? 0 : combo + 1
    setCombo(c)
    meilleurCombo.current = Math.max(meilleurCombo.current, c)
    if (c > 0 && c % 10 === 0) confettis(80)
  }
  const annoncer = (r: Resultat) => { if (!annonce.current) { annonce.current = true; compter(r) } }
  const ex = exercice(reglages.exercice)
  // pour les propositions du choix parmi 4 : tous les mots, ou toutes les questions
  const tous = voc.matieres.flatMap(m => (ex.surQuestions ? m.questions ?? [] : m.mots))

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
    // une question de cours et sa réponse sont toutes deux en néerlandais
    ...(c.mot.vraag ? [{ texte: c.mot.nl, langue: 'nl' as const }, { texte: c.mot.fr, langue: 'nl' as const }] : [question(c), reponse(c)]),
    ...[c.mot.definition, c.mot.exemple].filter(Boolean).map(texte => ({ texte, langue: 'nl' as const })),
    // conjugaison : la lecture du temps choisi et ses questions
    ...(c.mot.verbe ? vocalesConjugaison(c.mot.verbe, reglages.temps) : []),
  ])) }, [])

  if (!file.length) {
    return <div class="vide"><p>{ex.surQuestions ? 'Aucune question' : 'Aucun mot'} à réviser avec ces réglages.</p><button class="go" onClick={quitter}>Retour</button></div>
  }

  const carte = file[i]
  const suivant = (r: Resultat | null) => {
    let nouvelleFile = file
    const res = new Map(resultats)
    if (r) {
      if (!annonce.current) compter(r)
      // la première réponse compte pour le score et la progression
      if (!carte.reprise && !res.has(carte.mot.id)) { res.set(carte.mot.id, r); noter(carte.mot.id, r) }
      // un mot raté revient une fois en fin de série
      if (r === 'faux' && !carte.reprise) nouvelleFile = [...file, { ...carte, reprise: true }]
    }
    annonce.current = false
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
      notee: r !== null,
      meilleurCombo: meilleurCombo.current,
    })
  }

  const props: PropsExercice = { carte, tous, reglages, setReglages, pause, suivant, annoncer }
  const justes = [...resultats.values()].filter(v => v !== 'faux').length

  return (
    <>
      <div class="barre">
        <button class="icone" onClick={quitter} aria-label="Quitter l’exercice" title="Quitter">✕</button>
        <span class="quoi"><IconeExercice id={ex.id} taille={16} />{ex.nom}{ex.beta ? ' (bêta)' : ''} · <NomsCote noms={voc.matieres.map(m => m.nom).filter(n => serie.some(c => c.mot.matiere === n))} /></span>
        {combo >= 3 && <span key={combo} class={`combo ${combo % 5 === 0 ? 'palier' : ''}`} title="Bonnes réponses d’affilée">🔥 ×{combo}</span>}
        {ex.id !== 'defilement' && <span class="compte" title="Bonnes réponses">✓ {justes}</span>}
        <span class="compte">{Math.min(i + 1, file.length)} / {file.length}</span>
        <button class="icone" onClick={() => setPause(p => !p)} aria-label={pause ? 'Reprendre' : 'Pause'} title={pause ? 'Reprendre (Échap)' : 'Pause (Échap)'}>{pause ? '▶' : '⏸'}</button>
      </div>
      <div class="progres"><div style={{ width: `${(i / file.length) * 100}%` }} /></div>
      <main class={`scene ${pause ? 'en-pause' : ''}`}>
        {ex.id === 'defilement' && <Defilement key={i} {...props} />}
        {ex.id === 'ecrit' && <Ecrit key={i} {...props} />}
        {ex.id === 'qcm' && <Qcm key={i} {...props} />}
        {ex.id === 'dehet' && <DeHet key={i} {...props} />}
        {ex.id === 'definitions' && <Definitions key={i} {...props} />}
        {ex.id === 'trous' && <Trous key={i} {...props} />}
        {ex.id === 'oral' && <Oral key={i} {...props} />}
        {ex.id === 'dictee' && <Dictee key={i} {...props} />}
        {ex.id === 'conjugaison' && <Conjugaison key={i} {...props} />}
        {ex.id === 'interrogatif' && <Interrogatif key={i} {...props} />}
        {ex.id === 'primitifs' && <Primitifs key={i} {...props} />}
        {ex.id === 'questions' && <Questions key={i} {...props} />}
      </main>
      {pause && (
        // un bandeau, pas un voile : la page reste lisible (le temps de lire une définition…)
        <div class="bandeau-pause" role="status">
          <span class="quoi-pause"><b>En pause</b> · {ex.surQuestions ? nombre(i, 'question vue', 'questions vues') : nombre(i, 'mot vu', 'mots vus')} sur {file.length}</span>
          <button class="go" autoFocus onClick={() => setPause(false)}>Reprendre ▶</button>
          <button class="second" onClick={quitter}>Arrêter</button>
        </div>
      )}
    </>
  )
}

function vocalesConjugaison(inf: string, temps: Reglages['temps']) {
  const v = verbe(inf)
  if (!v) return []
  const ts = temps === 'mix' ? TEMPS.map(t => t.id) : [temps]
  return [v.lecturePrimitifs, ...ts.flatMap(t => [v.lecture[t], ...v.questionsTexte[t]])].map(texte => ({ texte, langue: 'nl' as const }))
}
