// Les deux façons de répondre, partagées par plusieurs exercices :
// choisir parmi quelques propositions, ou écrire la réponse.
import { useEffect, useRef, useState } from 'preact/hooks'
import type { Correction, Resultat } from '../../lib/correction'
import type { Mot } from '../../lib/mots'
import { attendre, Infos, Verdict } from './commun'

interface PropsChoix {
  options: string[]
  bonne: string
  mot: Mot
  pause: boolean
  /** lit la bonne réponse ; l'enchaînement attend la fin de la lecture */
  lire: () => Promise<void>
  suivant: (r: Resultat) => void
}

export function Choix({ options, bonne, mot, pause, lire, suivant }: PropsChoix) {
  const [choisi, setChoisi] = useState<number | null>(null)
  const juste = choisi !== null && options[choisi] === bonne
  const lecture = useRef<Promise<void>>(Promise.resolve())

  const choisir = (k: number) => {
    if (choisi !== null) return
    setChoisi(k)
    lecture.current = lire()
  }

  // bonne réponse : on enchaîne tout seul, une fois la réponse lue ; erreur : on laisse le temps de lire
  useEffect(() => {
    if (!juste || pause) return
    let annule = false
    Promise.all([lecture.current, attendre(1000)]).then(() => { if (!annule) suivant('juste') })
    return () => { annule = true }
  }, [juste, pause])

  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      if (pause) return
      const n = Number(e.key)
      if (n >= 1 && n <= options.length) choisir(n - 1)
      else if (e.key === 'Enter' && choisi !== null) suivant(juste ? 'juste' : 'faux')
    }
    addEventListener('keydown', touche)
    return () => removeEventListener('keydown', touche)
  })

  return (
    <>
      <div class="choix">
        {options.map((o, k) => (
          <button
            class={choisi === null ? '' : o === bonne ? 'bon' : k === choisi ? 'mauvais' : ''}
            onClick={() => choisir(k)} disabled={choisi !== null && o !== bonne && k !== choisi}
          >
            <span class="k">{k + 1}</span><span>{o}</span>
          </button>
        ))}
      </div>
      {choisi !== null && <Infos mot={mot} />}
      {choisi !== null && !juste && <button class="go" autoFocus onClick={() => suivant('faux')}>Suivant ⏎</button>}
      {choisi === null && <p class="astuce">Touches <kbd>1</kbd> à <kbd>{options.length}</kbd></p>}
    </>
  )
}

const LETTRES = { nl: ['ë', 'ï', 'é', 'ö', 'ü'], fr: ['é', 'è', 'ê', 'à', 'ç', 'ï', 'ô', 'û'] }

interface PropsSaisie {
  langue: 'fr' | 'nl'
  /** la réponse telle qu'on l'affiche après correction */
  attendu: string
  mot: Mot
  pause: boolean
  corriger: (texte: string) => Correction
  lire: () => Promise<void>
  suivant: (r: Resultat) => void
}

export function Saisie({ langue, attendu, mot, pause, corriger, lire, suivant }: PropsSaisie) {
  const [texte, setTexte] = useState('')
  const [correction, setCorrection] = useState<Correction | null>(null)
  const champ = useRef<HTMLInputElement>(null)

  useEffect(() => { if (!pause) champ.current?.focus() }, [pause, correction])

  const valider = (abandon = false) => {
    if (correction) { suivant(correction.resultat); return }
    setCorrection(abandon ? { resultat: 'faux', message: '' } : corriger(texte))
    lire()
  }

  const inserer = (l: string) => {
    const el = champ.current
    if (!el) return
    const debut = el.selectionStart ?? texte.length, fin = el.selectionEnd ?? texte.length
    setTexte(texte.slice(0, debut) + l + texte.slice(fin))
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(debut + 1, debut + 1) })
  }

  return (
    <>
      <form class="saisie" onSubmit={e => { e.preventDefault(); valider() }}>
        <input
          ref={champ} id="reponse" value={texte} readOnly={!!correction}
          onInput={e => setTexte((e.target as HTMLInputElement).value)}
          autocomplete="off" autocapitalize="off" spellcheck={false} lang={langue}
          aria-label="Ta réponse"
        />
        {!correction && (
          <div class="lettres">{LETTRES[langue].map(l => <button type="button" onClick={() => inserer(l)}>{l}</button>)}</div>
        )}
      </form>
      {correction && <><Verdict c={correction} attendu={attendu} /><Infos mot={mot} /></>}
      <Actions correction={correction} vide={!texte.trim()} valider={valider} />
    </>
  )
}

/** « Vérifier » / « Je ne sais pas », puis « Suivant ». */
export function Actions({ correction, vide, valider }: { correction: Correction | null; vide: boolean; valider: (abandon?: boolean) => void }) {
  return (
    <div class="actions">
      {correction
        ? <button class="go" onClick={() => valider()}>Suivant ⏎</button>
        : <>
            <button class="go" onClick={() => valider()} disabled={vide}>Vérifier ⏎</button>
            <button class="second" onClick={() => valider(true)}>Je ne sais pas</button>
          </>}
    </div>
  )
}
