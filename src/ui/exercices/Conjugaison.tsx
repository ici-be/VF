import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import { corrigerForme, formesLigne, LIGNES, nomTemps, TEMPS, verbe, type Temps } from '../../lib/conjugaison'
import type { Correction, Resultat } from '../../lib/correction'
import type { PropsExercice } from '../Seance'
import { dire, EntreeSuivant, Infos } from './commun'

// Le verbe à conjuguer à toutes les personnes, puis on valide le tout.
export function Conjugaison({ carte, reglages, pause, suivant, annoncer }: PropsExercice) {
  const v = verbe(carte.mot.verbe!)!
  const temps = useMemo<Temps>(() => (reglages.temps === 'mix' ? TEMPS[Math.floor(Math.random() * TEMPS.length)].id : reglages.temps), [])
  const [valeurs, setValeurs] = useState<string[]>(() => LIGNES.map(() => ''))
  const [corrections, setCorrections] = useState<Correction[] | null>(null)
  const [resultat, setResultat] = useState<Resultat | null>(null)
  const champs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => { if (!pause && !corrections) champs.current.find(c => c && !c.value)?.focus() }, [pause])

  const valider = (abandon = false) => {
    if (resultat) { suivant(resultat); return }
    const cs = LIGNES.map((_, i) => (abandon ? { resultat: 'faux' as const, message: '' } : corrigerForme(valeurs[i], v, temps, i)))
    const fautes = cs.filter(c => c.resultat === 'faux').length
    const r: Resultat = fautes === 0 ? 'juste' : fautes === 1 ? 'presque' : 'faux'
    setCorrections(cs)
    setResultat(r)
    annoncer(r)
    dire(reglages, v.lecture[temps], 'nl')
  }

  const fautes = corrections?.filter(c => c.resultat === 'faux').length ?? 0
  return (
    <>
      <div class="carte">
        <p class="mot">{v.inf}</p>
        <p class="sous-titre"><strong>{v.fr}</strong> · {nomTemps(temps)}</p>
        <p class="consigne">{TEMPS.find(t => t.id === temps)!.aide}</p>
      </div>
      <form class="conjugaison" onSubmit={e => { e.preventDefault(); valider() }}>
        {LIGNES.map((ligne, i) => {
          const c = corrections?.[i]
          return (
            <div class={`ligne-conj ${c ? c.resultat : ''}`}>
              <label for={`conj${i}`}>{ligne.nom}</label>
              {!c
                ? <input
                    id={`conj${i}`} ref={el => { champs.current[i] = el }} value={valeurs[i]}
                    onInput={e => { const n = [...valeurs]; n[i] = (e.target as HTMLInputElement).value; setValeurs(n) }}
                    onKeyDown={e => {
                      if (e.key !== 'Enter') return
                      e.preventDefault()
                      if (i < LIGNES.length - 1) champs.current[i + 1]?.focus()
                      else valider()
                    }}
                    autocomplete="off" autocapitalize="off" spellcheck={false} lang="nl"
                  />
                : <span class="corrige">
                    {c.resultat === 'juste'
                      ? valeurs[i].trim()
                      : <>{valeurs[i].trim() && <s class="tape">{valeurs[i].trim()}</s>} <b>{formesLigne(v, temps, i).join(' / ')}</b></>}
                  </span>}
            </div>
          )
        })}
        <button type="submit" hidden />
      </form>
      {resultat && (
        <div class={`verdict ${resultat}`} role="status">
          <b>{resultat === 'juste' ? 'Tout juste !' : resultat === 'presque' ? 'Presque : une seule erreur' : `${fautes} erreurs`}</b>
          <span>{v.primitifs}</span>
        </div>
      )}
      {resultat && <Infos mot={{ ...carte.mot, remarque: '' }} />}
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
