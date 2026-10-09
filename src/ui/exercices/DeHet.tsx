import { useEffect, useRef, useState } from 'preact/hooks'
import type { PropsExercice } from '../Seance'
import { attendre, dire, Infos } from './commun'

export function DeHet({ carte, reglages, pause, suivant }: PropsExercice) {
  const mot = carte.mot
  const [choisi, setChoisi] = useState<string | null>(null)
  const juste = choisi === mot.det
  const lecture = useRef<Promise<void>>(Promise.resolve())

  const choisir = (a: string) => {
    if (choisi) return
    setChoisi(a)
    lecture.current = dire(reglages, `${mot.det} ${mot.nl}`, 'nl')
  }

  useEffect(() => {
    if (!juste || pause) return
    let annule = false
    Promise.all([lecture.current, attendre(800)]).then(() => { if (!annule) suivant('juste') })
    return () => { annule = true }
  }, [juste, pause])

  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      if (pause) return
      if (e.key === 'd' || e.key === '1') choisir('de')
      else if (e.key === 'h' || e.key === '2') choisir('het')
      else if (e.key === 'Enter' && choisi) suivant(juste ? 'juste' : 'faux')
    }
    addEventListener('keydown', touche)
    return () => removeEventListener('keydown', touche)
  })

  return (
    <>
      <div class="carte">
        <p class="mot">{choisi ? `${mot.det} ${mot.nl}` : `… ${mot.nl}`}</p>
        <p class="astuce">{mot.fr}</p>
      </div>
      <div class="choix dehet">
        {['de', 'het'].map(a => (
          <button class={choisi === null ? '' : a === mot.det ? 'bon' : a === choisi ? 'mauvais' : ''} onClick={() => choisir(a)}>{a}</button>
        ))}
      </div>
      {choisi && !juste && <><Infos mot={mot} /><button class="go" autoFocus onClick={() => suivant('faux')}>Suivant ⏎</button></>}
      {!choisi && <p class="astuce">Touches <kbd>D</kbd> ou <kbd>H</kbd></p>}
    </>
  )
}
