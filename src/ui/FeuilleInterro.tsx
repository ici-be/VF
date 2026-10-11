import type { Mot } from '../lib/mots'
import { apparence } from '../lib/apparence'
import { nomChapitre } from './Accueil'
import { TROU } from '../lib/mots'

// La feuille d'interro imprimable : les questions de cours numérotées, avec des lignes
// pour répondre à la main, puis le corrigé sur une page à part. Cachée à l'écran.

/** Lettres écrites à la main sur une ligne de la feuille (largeur A4, écriture d'élève). */
const PAR_LIGNE = 55

/** Lignes laissées pour une réponse : de quoi l'écrire, plus une de marge. */
export const lignesPour = (reponse: string) => Math.min(12, Math.max(2, Math.ceil(reponse.length / PAR_LIGNE) + 1))

interface Props {
  questions: Mot[]
  titre: string
  sujets: { nom: string; chapitres: string }[]
}

export function FeuilleInterro({ questions, titre, sujets }: Props) {
  // un intertitre à chaque chapitre, s'il y en a plusieurs
  const plusieurs = new Set(questions.map(q => `${q.matiere}|${q.chapitre}`)).size > 1
  const intertitre = (q: Mot, i: number) => plusieurs && (i === 0 || `${q.matiere}|${q.chapitre}` !== `${questions[i - 1].matiere}|${questions[i - 1].chapitre}`)
    ? <h2>{apparence(q.matiere).titre} · {nomChapitre(q.chapitre)}</h2>
    : null
  const enTete = (
    <header>
      <h1>{titre}</h1>
      {sujets.map(t => <p class="sujet"><b>{t.nom}</b> · {t.chapitres}</p>)}
    </header>
  )

  return (
    <div class="feuille-interro">
      <section class="enonce">
        {enTete}
        <p class="eleve"><span>Nom :</span><span>Date :</span></p>
        {questions.map((q, i) => {
          const v = q.vraag!
          // une phrase à compléter : le trou est la place pour répondre
          const [avant, ...apres] = q.nl.split(TROU)
          return (
            <>
              {intertitre(q, i)}
              <div class="question">
                <p><b>{i + 1}.</b> {apres.length ? <>{avant}<span class="blanc" />{apres.join('…')}</> : q.nl}{v.nombre > 0 && v.nombre < v.elements.length && <i> ({v.nombre} au choix)</i>}</p>
                {apres.length ? null : v.nombre > 0
                  ? <ol class="lignes">{Array.from({ length: v.nombre }, () => <li />)}</ol>
                  : <div class="lignes">{Array.from({ length: lignesPour(q.fr) }, () => <span />)}</div>}
              </div>
            </>
          )
        })}
      </section>
      <section class="reponses">
        <header><h1>Réponses</h1><p class="sujet">{titre}</p></header>
        <ol>
          {questions.map(q => {
            const v = q.vraag!
            return (
              <li>
                <span class="q">{q.nl.replace(TROU, '…')}</span>
                {v.nombre > 0
                  ? <span class="r">{v.nombre < v.elements.length && <i>{v.nombre} parmi : </i>}{v.elements.join(' · ')}</span>
                  : <span class="r">{q.fr}</span>}
                {v.page && <span class="p-cours"> (p. {v.page})</span>}
              </li>
            )
          })}
        </ol>
      </section>
    </div>
  )
}
