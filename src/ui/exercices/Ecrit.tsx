import { useEffect, useRef, useState } from 'preact/hooks'
import { corriger, type Correction } from '../../lib/correction'
import { question, reponse } from '../../lib/seance'
import type { PropsExercice } from '../Seance'
import { dire, Infos, Langue, Verdict } from './commun'

const LETTRES = { nl: ['ë', 'ï', 'é', 'ö', 'ü'], fr: ['é', 'è', 'ê', 'à', 'ç', 'ï', 'ô', 'û'] }

export function Ecrit({ carte, reglages, pause, suivant }: PropsExercice) {
  const [texte, setTexte] = useState('')
  const [correction, setCorrection] = useState<Correction | null>(null)
  const champ = useRef<HTMLInputElement>(null)
  const q = question(carte), rep = reponse(carte)

  useEffect(() => { dire(reglages, q.texte, q.langue) }, [])
  useEffect(() => { if (!pause) champ.current?.focus() }, [pause, correction])

  const valider = (abandon = false) => {
    if (correction) { suivant(correction.resultat); return }
    // en néerlandais, on corrige le mot (l'article est vérifié à part)
    const c = abandon
      ? { resultat: 'faux' as const, message: '' }
      : corriger(texte, rep.langue === 'nl' ? carte.mot.nl : carte.mot.fr, rep.langue, rep.langue === 'nl' ? carte.mot.det : '', { exigerArticle: reglages.exigerArticle })
    setCorrection(c)
    dire(reglages, rep.texte, rep.langue)
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
      <div class="carte">
        <Langue l={q.langue} />
        <p class="mot">{q.texte}</p>
        <p class="astuce">Écris la traduction en {rep.langue === 'nl' ? 'néerlandais' : 'français'}</p>
      </div>
      <form class="saisie" onSubmit={e => { e.preventDefault(); valider() }}>
        <input
          ref={champ} id="reponse" value={texte} readOnly={!!correction}
          onInput={e => setTexte((e.target as HTMLInputElement).value)}
          autocomplete="off" autocapitalize="off" spellcheck={false} lang={rep.langue}
          aria-label="Ta réponse"
        />
        {!correction && (
          <div class="lettres">{LETTRES[rep.langue].map(l => <button type="button" onClick={() => inserer(l)}>{l}</button>)}</div>
        )}
      </form>
      {correction && <><Verdict c={correction} attendu={rep.texte} /><Infos mot={carte.mot} /></>}
      <div class="actions">
        {correction
          ? <button class="go" onClick={() => valider()}>Suivant ⏎</button>
          : <>
              <button class="go" onClick={() => valider()} disabled={!texte.trim()}>Vérifier ⏎</button>
              <button class="second" onClick={() => valider(true)}>Je ne sais pas</button>
            </>}
      </div>
    </>
  )
}
