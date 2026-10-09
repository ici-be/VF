import { useEffect, useRef, useState } from 'preact/hooks'
import { corriger, type Correction } from '../../lib/correction'
import { decouper } from '../../lib/trous'
import type { PropsExercice } from '../Seance'
import { dire, Infos, Verdict } from './commun'
import { Actions } from './Reponses'
import { nombre } from '../../lib/texte'

// L'exemple du tableau avec un trou (ou plusieurs) à compléter ; la traduction
// française du mot sert d'indice.
export function Trous({ carte, reglages, pause, suivant, annoncer }: PropsExercice) {
  const m = carte.mot
  const morceaux = decouper(m.exemple, m.nl) ?? [{ texte: m.exemple }]
  const trous = morceaux.flatMap(x => ('trou' in x ? [x.trou] : []))
  const [valeurs, setValeurs] = useState<string[]>(() => trous.map(() => ''))
  const [correction, setCorrection] = useState<Correction | null>(null)
  const [parTrou, setParTrou] = useState<Correction[]>([])
  const premier = useRef<HTMLInputElement>(null)

  useEffect(() => { if (!pause && !correction) premier.current?.focus() }, [pause])

  const valider = (abandon = false) => {
    if (correction) { suivant(correction.resultat); return }
    const res = trous.map((t, k) => (abandon ? { resultat: 'faux' as const, message: '' } : corriger(valeurs[k], t, 'nl', '', {})))
    const pire = res.some(r => r.resultat === 'faux') ? 'faux' : res.some(r => r.resultat === 'presque') ? 'presque' : 'juste'
    setParTrou(res)
    annoncer(pire)
    setCorrection({ resultat: pire, message: [...new Set(res.map(r => r.message).filter(Boolean))].join(' ') })
    dire(reglages, m.exemple, 'nl')
  }

  let k = -1
  return (
    <>
      <div class="carte">
        <p class="phrase">
          {morceaux.map(x => {
            if ('texte' in x) return <span>{x.texte}</span>
            const i = ++k
            if (correction) {
              const r = parTrou[i]?.resultat ?? 'faux'
              const tape = valeurs[i].trim()
              return (
                <>
                  {r !== 'juste' && tape && <s class="tape">{tape}</s>}
                  <span class={`trou-corrige ${r}`}>{r === 'juste' ? tape : x.trou}</span>
                </>
              )
            }
            return (
              <input
                ref={i === 0 ? premier : undefined} id={`trou${i}`} class="trou" value={valeurs[i]}
                style={{ width: `${Math.max(5, x.trou.length + 2)}ch` }}
                onInput={e => { const v = [...valeurs]; v[i] = (e.target as HTMLInputElement).value; setValeurs(v) }}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); valider() } }}
                autocomplete="off" autocapitalize="off" spellcheck={false} lang="nl"
                aria-label={trous.length > 1 ? `Trou ${i + 1}` : 'Le mot qui manque'}
              />
            )
          })}
        </p>
        <p class="astuce">Indice : <strong>{m.fr}</strong>{trous.length > 1 ? ` · ${nombre(trous.length, 'trou')}` : ''}</p>
      </div>
      {correction && <><Verdict c={correction} attendu={trous.join(' … ')} /><Infos mot={{ ...m, exemple: '' }} /></>}
      <Actions correction={correction} vide={valeurs.every(v => !v.trim())} valider={valider} />
      {/* Entrée sur le bouton « Suivant » après correction */}
      {correction && <EntreeSuivant onEntree={() => valider()} pause={pause} />}
    </>
  )
}

function EntreeSuivant({ onEntree, pause }: { onEntree: () => void; pause: boolean }) {
  useEffect(() => {
    const t = (e: KeyboardEvent) => { if (e.key === 'Enter' && !pause) { e.preventDefault(); onEntree() } }
    // ajouté au tour suivant, pour ne pas capter l'Entrée qui vient de valider
    const id = setTimeout(() => addEventListener('keydown', t))
    return () => { clearTimeout(id); removeEventListener('keydown', t) }
  })
  return null
}
