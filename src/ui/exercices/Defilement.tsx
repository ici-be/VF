import { useEffect, useState } from 'preact/hooks'
import { question, reponse } from '../../lib/seance'
import type { PropsExercice } from '../Seance'
import { dire, Infos, Langue } from './commun'

// Le mot s'affiche (et est lu), la réponse arrive après « délai » secondes,
// puis on passe au mot suivant. La pause arrête tout et reprend l'étape en cours.
export function Defilement({ carte, reglages, setReglages, pause, suivant }: PropsExercice) {
  const [etape, setEtape] = useState<'question' | 'reponse'>('question')
  const q = question(carte), rep = reponse(carte)
  const delai = reglages.delai

  useEffect(() => {
    if (pause) return
    let annule = false
    const attendre = (ms: number) => new Promise(r => setTimeout(r, ms))
    ;(async () => {
      if (etape === 'question') {
        await Promise.all([dire(reglages, q.texte, q.langue), attendre(delai * 1000)])
        if (!annule) setEtape('reponse')
      } else {
        await Promise.all([dire(reglages, rep.texte, rep.langue), attendre(Math.max(2000, delai * 500))])
        if (!annule) suivant(null)
      }
    })()
    return () => { annule = true }
  }, [etape, pause, delai])

  const changerDelai = (d: number) => setReglages({ ...reglages, delai: Math.min(15, Math.max(1, d)) })

  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      if (pause) return
      if (e.key === '-') changerDelai(delai - 1)
      else if (e.key === '+' || e.key === '=') changerDelai(delai + 1)
      else if (e.key === 'ArrowRight') etape === 'question' ? setEtape('reponse') : suivant(null)
    }
    addEventListener('keydown', touche)
    return () => removeEventListener('keydown', touche)
  })

  return (
    <>
      <div class="carte">
        <Langue l={q.langue} />
        <p class="mot">{q.texte}</p>
        {etape === 'question'
          ? <>
              <p class="attente" aria-hidden="true">· · ·</p>
              {/* la clé relance l'animation à chaque reprise après une pause */}
              <div class="minuteur"><div key={String(pause)} style={{ animation: pause ? 'none' : `vider ${delai}s linear forwards` }} /></div>
            </>
          : <>
              <Langue l={rep.langue} />
              <p class="repondu">{rep.texte}</p>
              <Infos mot={carte.mot} />
            </>}
      </div>
      <div class="actions">
        <div class="vitesse" aria-label="Temps pour réfléchir">
          <button class="icone" onClick={() => changerDelai(delai - 1)} aria-label="Plus vite">−</button>
          <span>{delai} s</span>
          <button class="icone" onClick={() => changerDelai(delai + 1)} aria-label="Plus lent">+</button>
        </div>
        {etape === 'question'
          ? <button class="second" onClick={() => setEtape('reponse')}>Voir la réponse</button>
          : <button class="second" onClick={() => suivant(null)}>Mot suivant ⏭</button>}
      </div>
      <p class="astuce"><kbd>Espace</kbd> pause · <kbd>→</kbd> suivant · <kbd>−</kbd> <kbd>+</kbd> vitesse</p>
    </>
  )
}
