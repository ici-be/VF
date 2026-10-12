import { useEffect, useRef, useState } from 'preact/hooks'
import type { Mot, Vocabulaire } from '../lib/mots'
import { exercice, type Reglages } from '../lib/reglages'
import { ArrowLeft, Volume2, VolumeX } from 'lucide-preact'
import { BoutonSignaler, FenetreSignalement } from './Signaler'
import { langueDe } from '../lib/apparence'
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
import { Getallen } from './exercices/Getallen'
import { Calcul, Eeuwen, Natures } from './exercices/Generes'
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
  // mise en pause toute seule (la page n'était plus affichée) : le bandeau le dit
  const [pauseAuto, setPauseAuto] = useState(false)
  useEffect(() => { if (!pause) setPauseAuto(false) }, [pause])
  // la fenêtre « Signaler une erreur » ouverte : l'exercice attend (sans le bandeau de pause)
  const [aSignaler, setASignaler] = useState(false)
  // bonnes réponses d'affilée (« presque » compte) ; une erreur remet à zéro
  const [combo, setCombo] = useState(0)
  const meilleurCombo = useRef(0)
  const annonce = useRef<Resultat | null>(null)   // le résultat de la carte en cours, s'il a déjà compté pour le combo
  const compter = (r: Resultat) => {
    const c = r === 'faux' ? 0 : combo + 1
    setCombo(c)
    meilleurCombo.current = Math.max(meilleurCombo.current, c)
    if (c > 0 && c % 10 === 0) confettis(80)
  }
  // la carte la plus loin atteinte : en deçà (revenu en arrière avec ←), une réponse ne compte plus
  // (ni progression, ni score, ni série, ni reprise en fin de série : la première réponse reste)
  const plusLoin = useRef(0)
  const revisite = () => i < plusLoin.current
  const annoncer = (r: Resultat) => { if (!annonce.current) { annonce.current = r; if (!revisite()) compter(r) } }
  // arrêter en cours de route : la carte affichée compte (ratée si on n'y a pas répondu),
  // les cartes qui restaient dans la série ne comptent pas
  const arreter = () => {
    const carte = file[i]
    if (carte && ex.id !== 'defilement' && !carte.reprise && !resultats.has(carte.mot.id)) noter(carte.mot.id, annonce.current ?? 'faux')
    quitter()
  }
  // l'exercice de la carte (la révision du jour en mélange plusieurs), sinon celui des réglages
  const ex = exercice(file[i]?.exercice ?? reglages.exercice)
  // pour les propositions du choix parmi 4 : tous les mots, ou toutes les questions
  const tous = voc.matieres.flatMap(m => (ex.surQuestions ? m.questions ?? [] : m.mots))

  // pause : Échap partout, Espace pour le défilement ; et automatiquement si on change d'onglet
  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      if (document.querySelector('dialog[open]')) return   // Échap ferme la fenêtre de signalement
      if (e.key === 'Escape' || (e.key === ' ' && ex.id === 'defilement')) { e.preventDefault(); setPause(p => !p) }
    }
    // la page n'est plus affichée (autre onglet, autre application, écran en veille, fenêtre recouverte) :
    // la voix se tait ; seul le défilement, qui avance tout seul, se met en pause (les autres attendent la réponse)
    const cache = () => {
      if (!document.hidden) return
      taire()
      if (ex.id === 'defilement') { setPause(true); setPauseAuto(true) }
    }
    addEventListener('keydown', touche)
    document.addEventListener('visibilitychange', cache)
    return () => { removeEventListener('keydown', touche); document.removeEventListener('visibilitychange', cache); taire() }
  }, [ex.id])
  useEffect(() => { if (pause) taire() }, [pause])
  // les voix de toute la série, téléchargées dès le départ
  useEffect(() => { if (reglages.voix || ex.id === 'oral' || ex.id === 'dictee') precharger(serie.flatMap(c => [
    // une question de cours et sa réponse sont toutes deux en néerlandais
    ...(c.mot.vraag ? [{ texte: c.mot.nl, langue: langueDe(c.mot) }, { texte: c.mot.fr, langue: langueDe(c.mot) }] : [question(c), reponse(c)]),
    ...[c.mot.definition, c.mot.exemple].filter(Boolean).map(texte => ({ texte, langue: langueDe(c.mot) })),
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
    if (r && !revisite()) {
      if (!annonce.current) compter(r)
      // la première réponse compte pour le score et la progression
      if (!carte.reprise && !res.has(carte.mot.id)) { res.set(carte.mot.id, r); noter(carte.mot.id, r) }
      // un mot raté revient une fois en fin de série
      if (r === 'faux' && !carte.reprise) nouvelleFile = [...file, { ...carte, reprise: true }]
    }
    annonce.current = null
    setResultats(res)
    setFile(nouvelleFile)
    if (i + 1 < nouvelleFile.length) { plusLoin.current = Math.max(plusLoin.current, i + 1); setI(i + 1); return }
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

  // ← : la carte d'avant, à nouveau (sa réponse a déjà compté)
  const precedente = () => {
    if (i === 0) return
    taire()
    annonce.current = null
    setPause(false)
    setI(i - 1)
  }

  const props: PropsExercice = { carte, tous, reglages, setReglages, pause: pause || aSignaler, suivant, annoncer }
  const justes = [...resultats.values()].filter(v => v !== 'faux').length

  return (
    <>
      <div class="barre">
        <button class="icone" onClick={arreter} aria-label="Quitter l’exercice" title="Quitter">✕</button>
        <span class="quoi"><IconeExercice id={ex.id} taille={16} />{ex.nom}{ex.beta ? ' (bêta)' : ''} · <NomsCote noms={voc.matieres.map(m => m.nom).filter(n => serie.some(c => c.mot.matiere === n))} /></span>
        {combo >= 3 && <span key={combo} class={`combo ${combo % 5 === 0 ? 'palier' : ''}`} title="Bonnes réponses d’affilée">🔥 ×{combo}</span>}
        {ex.id !== 'defilement' && <span class="compte" title="Bonnes réponses">✓ {justes}</span>}
        <span class="compte">{Math.min(i + 1, file.length)} / {file.length}</span>
        {carte && carte.mot.getal === undefined && <BoutonSignaler onClick={() => setASignaler(true)} />}
        <button class="icone" onClick={precedente} disabled={i === 0} aria-label="Question précédente" title="Revenir à la question précédente"><ArrowLeft size={16} strokeWidth={2.4} /></button>
        <button class="icone bouton-pause" onClick={() => setPause(p => !p)} aria-label={pause ? 'Reprendre' : 'Pause'} title={pause ? 'Reprendre (Échap)' : 'Pause (Échap)'}>{pause ? '▶' : '⏸'}</button>
        <BoutonSon ex={ex} reglages={reglages} setReglages={setReglages} />
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
        {ex.id === 'getallen' && <Getallen key={i} {...props} />}
        {ex.id === 'eeuwen' && <Eeuwen key={i} {...props} />}
        {ex.id === 'calcul' && <Calcul key={i} {...props} />}
        {ex.id === 'natures' && <Natures key={i} {...props} />}
      </main>
      {aSignaler && carte && (
        <FenetreSignalement mot={carte.mot} exercice={ex.nom} resultat={resultats.get(carte.mot.id) ?? annonce.current ?? undefined} fermer={() => setASignaler(false)} />
      )}
      {pause && (
        // un bandeau, pas un voile : la page reste lisible (le temps de lire une définition…)
        <div class="bandeau-pause" role="status">
          <span class="quoi-pause"><b>En pause</b>{pauseAuto && ' (la page n’était plus affichée)'} · {ex.surQuestions ? nombre(i, 'question vue', 'questions vues') : nombre(i, 'mot vu', 'mots vus')} sur {file.length}</span>
          <button class="go" autoFocus onClick={() => setPause(false)}>Reprendre ▶</button>
          <button class="second" onClick={arreter}>Arrêter</button>
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

/**
 * Le son de l'appli, à droite de la pause : un clic le coupe ou le remet (comme la case « Lire les mots à voix haute »).
 * Un exercice sans voix (Eeuwen, Calcul mental…) le dit discrètement ; la dictée et l'oral gardent toujours la voix.
 */
function BoutonSon({ ex, reglages, setReglages }: { ex: ReturnType<typeof exercice>; reglages: Reglages; setReglages: (r: Reglages) => void }) {
  const [dit, setDit] = useState('')
  useEffect(() => { if (!dit) return; const t = setTimeout(() => setDit(''), 2500); return () => clearTimeout(t) }, [dit])
  const actif = ex.son === 'toujours' || (ex.son !== 'muet' && reglages.voix)
  const titre = ex.son === 'muet' ? 'Pas de son pour cet exercice'
    : ex.son === 'toujours' ? 'Le son reste allumé : cet exercice se fait à l’oreille'
    : reglages.voix ? 'Couper le son' : 'Remettre le son'
  const clic = () => {
    if (ex.son) { setDit(ex.son === 'muet' ? 'Pas de son ici' : 'Son indispensable ici'); return }
    if (reglages.voix) taire()
    setReglages({ ...reglages, voix: !reglages.voix })
  }
  return (
    <span class="son-seance">
      <button class={`icone bouton-son ${ex.son ? 'fige' : ''}`} onClick={clic} aria-label={titre} aria-pressed={ex.son ? undefined : reglages.voix} title={titre}>
        {actif ? <Volume2 size={16} strokeWidth={2.4} /> : <VolumeX size={16} strokeWidth={2.4} />}
      </button>
      {dit && <span class="bulle-son" role="status">{dit}</span>}
    </span>
  )
}
