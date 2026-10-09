import { useEffect, useRef, useState } from 'preact/hooks'
import { corriger, type Correction, type Resultat } from '../../lib/correction'
import { ecouteDisponible, ecouter, ErreurEcoute, type Ecoute } from '../../lib/ecoute'
import type { Mot } from '../../lib/mots'
import { question, reponse, synonymes } from '../../lib/seance'
import { parler } from '../../lib/voix'
import type { PropsExercice } from '../Seance'
import { attendre, Infos, Langue, Verdict } from './commun'

type Etape =
  | { nom: 'lecture' }                       // le mot est lu
  | { nom: 'ecoute' }                        // le micro écoute
  | { nom: 'rien' }                          // rien entendu
  | { nom: 'resultat'; entendu: string; c: Correction }
  | { nom: 'auto' }                          // sans micro : elle répond dans sa tête / à voix haute
  | { nom: 'auto-reponse' }                  // … puis regarde la réponse et dit si elle savait

const RANG = { juste: 0, presque: 1, faux: 2 }

// Le mot est lu (toujours : c'est un exercice oral), puis l'appli écoute la
// réponse au micro. Sans reconnaissance vocale (Firefox) ou si le micro est
// bloqué : auto-évaluation.
export function Oral({ carte, tous, pause, suivant }: PropsExercice) {
  const q = question(carte), rep = reponse(carte)
  const [micro, setMicro] = useState(ecouteDisponible())
  const [message, setMessage] = useState('')
  const [etape, setEtape] = useState<Etape>({ nom: 'lecture' })
  const [essais, setEssais] = useState(0)
  const ecoute = useRef<Ecoute | null>(null)
  const lectureReponse = useRef<Promise<void>>(Promise.resolve())

  const lireReponse = () => (lectureReponse.current = parler(rep.texte, rep.langue))

  // 1. lire le mot, 2. écouter (seulement après la lecture : sinon le micro entend l'appli)
  useEffect(() => {
    if (pause || etape.nom !== 'lecture') return
    let annule = false
    parler(q.texte, q.langue).then(() => { if (!annule) setEtape({ nom: micro ? 'ecoute' : 'auto' }) })
    return () => { annule = true }
  }, [etape, pause])

  useEffect(() => {
    if (pause || etape.nom !== 'ecoute') return
    let annule = false
    const e = ecouter(rep.langue)
    ecoute.current = e
    e.resultat.then(entendu => {
      if (annule) return
      if (!entendu.length) { setEtape({ nom: 'rien' }); return }
      const { texte, c } = meilleure(entendu, [carte.mot, ...synonymes(carte, tous)], rep.langue)
      setEssais(n => n + 1)
      setEtape({ nom: 'resultat', entendu: texte, c })
      lireReponse()
    }).catch((err: unknown) => {
      if (annule) return
      setMessage(err instanceof ErreurEcoute ? err.message : 'Le micro ne fonctionne pas.')
      setMicro(false)
      setEtape({ nom: 'auto' })
    })
    return () => { annule = true; e.arreter() }
  }, [etape, pause])

  // réponse juste : on enchaîne une fois la bonne réponse lue
  const juste = etape.nom === 'resultat' && etape.c.resultat === 'juste'
  useEffect(() => {
    if (!juste || pause) return
    let annule = false
    Promise.all([lectureReponse.current, attendre(900)]).then(() => { if (!annule) suivant(essais > 1 ? 'presque' : 'juste') })
    return () => { annule = true }
  }, [juste, pause])

  // le résultat final : une réussite après un raté ne compte que « presque »
  const finir = (r: Resultat) => suivant(r === 'juste' && essais > 1 ? 'presque' : r)
  const reessayer = () => setEtape({ nom: 'ecoute' })
  const voirReponse = () => { setEtape({ nom: 'auto-reponse' }); lireReponse() }

  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      if (pause) return
      if (e.key === 'Enter') {
        if (etape.nom === 'resultat' && !juste) finir(etape.c.resultat)
        else if (etape.nom === 'rien') reessayer()
        else if (etape.nom === 'auto') voirReponse()
      } else if (etape.nom === 'auto-reponse' && (e.key === '1' || e.key === 'o')) suivant('juste')
      else if (etape.nom === 'auto-reponse' && (e.key === '2' || e.key === 'n')) suivant('faux')
    }
    addEventListener('keydown', touche)
    return () => removeEventListener('keydown', touche)
  })

  const montrer = etape.nom === 'resultat' || etape.nom === 'auto-reponse'
  return (
    <>
      <div class="carte">
        <Langue l={q.langue} />
        <p class="mot">{q.texte}</p>
        {montrer && <><Langue l={rep.langue} /><p class="repondu">{rep.texte}</p></>}
      </div>

      {etape.nom === 'lecture' && <p class="astuce">Écoute…</p>}
      {etape.nom === 'ecoute' && (
        <button class="micro actif" onClick={() => ecoute.current?.arreter()} aria-label="J’écoute ; cliquer pour arrêter">
          <span aria-hidden="true">🎤</span> Je t’écoute… dis-le en {rep.langue === 'nl' ? 'néerlandais' : 'français'}
        </button>
      )}
      {etape.nom === 'rien' && (
        <>
          <p class="astuce">Je n’ai rien entendu.</p>
          <div class="actions">
            <button class="go" onClick={reessayer}>🎤 Réessayer ⏎</button>
            <button class="second" onClick={() => { setEtape({ nom: 'resultat', entendu: '', c: { resultat: 'faux', message: '' } }); lireReponse() }}>Je ne sais pas</button>
          </div>
        </>
      )}
      {etape.nom === 'resultat' && (
        <>
          {etape.entendu && <p class="entendu">J’ai entendu : « {etape.entendu} »</p>}
          <Verdict c={etape.c} attendu={rep.texte} />
          <Infos mot={carte.mot} />
          {!juste && (
            <div class="actions">
              <button class="go" onClick={() => finir(etape.c.resultat)}>Suivant ⏎</button>
              <button class="second" onClick={reessayer}>🎤 Réessayer</button>
              {etape.c.resultat === 'faux' && etape.entendu && (
                <button class="second" onClick={() => suivant('presque')} title="La reconnaissance vocale a mal compris une bonne réponse">L’appli m’a mal comprise</button>
              )}
            </div>
          )}
        </>
      )}
      {etape.nom === 'auto' && (
        <>
          {message && <p class="etat erreur">{message}</p>}
          {!message && !ecouteDisponible() && <p class="astuce">Pour que l’appli t’écoute, ouvre-la dans Google Chrome.</p>}
          <p class="astuce">Dis la réponse à voix haute, puis regarde si c’était juste.</p>
          <button class="go" onClick={voirReponse}>Voir la réponse ⏎</button>
        </>
      )}
      {etape.nom === 'auto-reponse' && (
        <>
          <Infos mot={carte.mot} />
          <div class="actions">
            <button class="go" onClick={() => suivant('juste')}>✓ Je savais <kbd>1</kbd></button>
            <button class="second" onClick={() => suivant('faux')}>✗ Je ne savais pas <kbd>2</kbd></button>
          </div>
        </>
      )}
    </>
  )
}

/** La meilleure correction parmi ce que la reconnaissance a compris et les réponses acceptées. */
function meilleure(entendu: string[], mots: Mot[], langue: 'fr' | 'nl'): { texte: string; c: Correction } {
  let best = { texte: entendu[0], c: { resultat: 'faux', message: '' } as Correction }
  for (const texte of entendu) {
    for (const m of mots) {
      const c = langue === 'nl' ? corriger(texte, m.nl, 'nl', m.det) : corriger(texte, m.fr, 'fr')
      // à l'oral, accents et lettre de travers viennent de la reconnaissance : seul l'article compte
      const c2: Correction = c.resultat === 'presque' && c.cause !== 'article' ? { resultat: 'juste', message: '' } : c
      if (RANG[c2.resultat] < RANG[best.c.resultat]) best = { texte, c: c2 }
    }
  }
  return best
}
