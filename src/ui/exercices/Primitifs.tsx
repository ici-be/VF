import { useEffect, useRef, useState } from 'preact/hooks'
import { corrigerPrimitif, PRIMITIFS, verbe } from '../../lib/conjugaison'
import type { Correction, Resultat } from '../../lib/correction'
import type { PropsExercice } from '../Seance'
import { dire, EntreeSuivant } from './commun'

// Les temps primitifs : slapen → sliep, sliepen, heeft geslapen.
export function Primitifs({ carte, reglages, pause, suivant, annoncer }: PropsExercice) {
  const v = verbe(carte.mot.verbe!)!
  const [valeurs, setValeurs] = useState(['', '', ''])
  const [corrections, setCorrections] = useState<Correction[] | null>(null)
  const [resultat, setResultat] = useState<Resultat | null>(null)
  const champs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => { if (!pause && !corrections) champs.current.find(c => c && !c.value)?.focus() }, [pause])

  const valider = (abandon = false) => {
    if (resultat) { suivant(resultat); return }
    const cs = PRIMITIFS.map((_, i) => (abandon ? { resultat: 'faux' as const, message: '' } : corrigerPrimitif(valeurs[i], v, i)))
    const fautes = cs.filter(c => c.resultat === 'faux').length
    const r: Resultat = fautes === 0 ? 'juste' : fautes === 1 ? 'presque' : 'faux'
    setCorrections(cs)
    setResultat(r)
    annoncer(r)
    dire(reglages, v.lecturePrimitifs, 'nl')
  }

  return (
    <>
      <div class="carte">
        <p class="mot">{v.inf}</p>
        <p class="sous-titre"><strong>{v.fr}</strong> · temps primitifs</p>
        <p class="consigne">Imparfait singulier et pluriel, puis participe passé avec son auxiliaire (heeft / is).</p>
      </div>
      <form class="conjugaison" onSubmit={e => { e.preventDefault(); valider() }}>
        {PRIMITIFS.map((p, i) => {
          const c = corrections?.[i]
          return (
            <div class={`ligne-conj ${c ? c.resultat : ''}`}>
              <label for={`prim${i}`}>{p.nom}</label>
              {!c
                ? <input
                    id={`prim${i}`} ref={el => { champs.current[i] = el }} value={valeurs[i]}
                    onInput={e => { const n = [...valeurs]; n[i] = (e.target as HTMLInputElement).value; setValeurs(n) }}
                    onKeyDown={e => {
                      if (e.key !== 'Enter') return
                      e.preventDefault()
                      if (i < PRIMITIFS.length - 1) champs.current[i + 1]?.focus()
                      else valider()
                    }}
                    autocomplete="off" autocapitalize="off" spellcheck={false} lang="nl"
                  />
                : <span class="corrige">
                    {c.resultat === 'juste'
                      ? valeurs[i].trim()
                      : <>{valeurs[i].trim() && <s class="tape">{valeurs[i].trim()}</s>} <b>{p.formes(v).join(' / ')}</b></>}
                    {c.message && <small class="pourquoi">{c.message}</small>}
                  </span>}
            </div>
          )
        })}
        <button type="submit" hidden />
      </form>
      {resultat && (
        <div class={`verdict ${resultat}`} role="status">
          <b>{resultat === 'juste' ? 'Tout juste !' : resultat === 'presque' ? 'Presque : une seule erreur' : 'À revoir'}</b>
          <span>{v.primitifs}</span>
        </div>
      )}
      <div class="actions">
        {resultat
          ? <button class="go" onClick={() => valider()}>Suivant ⏎</button>
          : <>
              <button class="go" onClick={() => valider()} disabled={valeurs.every(x => !x.trim())}>Valider ⏎</button>
              <button class="second" onClick={() => valider(true)}>Je ne sais pas</button>
            </>}
      </div>
      {resultat && <EntreeSuivant onEntree={() => valider()} pause={pause} />}
    </>
  )
}
