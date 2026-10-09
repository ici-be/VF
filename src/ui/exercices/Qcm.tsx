import { useEffect, useMemo, useState } from 'preact/hooks'
import { leurres, melanger, question, reponse } from '../../lib/seance'
import type { PropsExercice } from '../Seance'
import { dire, Infos, Langue } from './commun'

export function Qcm({ carte, tous, reglages, pause, suivant }: PropsExercice) {
  const q = question(carte), rep = reponse(carte)
  const options = useMemo(() => melanger([rep.texte, ...leurres(carte, tous)]), [])
  const [choisi, setChoisi] = useState<number | null>(null)
  const juste = choisi !== null && options[choisi] === rep.texte

  useEffect(() => { dire(reglages, q.texte, q.langue) }, [])

  const choisir = (k: number) => {
    if (choisi !== null) return
    setChoisi(k)
    dire(reglages, rep.texte, rep.langue)
  }

  // bonne réponse : on enchaîne tout seul ; erreur : on laisse le temps de lire
  useEffect(() => {
    if (!juste || pause) return
    const t = setTimeout(() => suivant('juste'), 1300)
    return () => clearTimeout(t)
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
      <div class="carte">
        <Langue l={q.langue} />
        <p class="mot">{q.texte}</p>
      </div>
      <div class="choix">
        {options.map((o, k) => (
          <button
            class={choisi === null ? '' : o === rep.texte ? 'bon' : k === choisi ? 'mauvais' : ''}
            onClick={() => choisir(k)} disabled={choisi !== null && o !== rep.texte && k !== choisi}
          >
            <span class="k">{k + 1}</span><span>{o}</span>
          </button>
        ))}
      </div>
      {choisi !== null && <Infos mot={carte.mot} />}
      {choisi !== null && !juste && <button class="go" autoFocus onClick={() => suivant('faux')}>Suivant ⏎</button>}
      {choisi === null && <p class="astuce">Touches <kbd>1</kbd> à <kbd>{options.length}</kbd></p>}
    </>
  )
}
