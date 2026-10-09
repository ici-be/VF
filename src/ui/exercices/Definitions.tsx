import { useEffect, useMemo } from 'preact/hooks'
import { corriger } from '../../lib/correction'
import { leurres, melanger, nlComplet } from '../../lib/seance'
import { masquer } from '../../lib/trous'
import type { PropsExercice } from '../Seance'
import { dire, Langue } from './commun'
import { Choix, Saisie } from './Reponses'

// La définition (sans le mot qu'elle définit), il faut trouver le mot néerlandais.
export function Definitions({ carte, tous, reglages, pause, suivant }: PropsExercice) {
  const m = carte.mot
  const definition = masquer(m.definition, m.nl)
  const bonne = nlComplet(m)
  // les propositions : d'autres mots qui ont aussi une définition, de préférence
  const avecDef = tous.filter(x => x.definition)
  const options = useMemo(
    () => melanger([bonne, ...leurres({ mot: m, sens: 'fr-nl' }, avecDef.length >= 4 ? avecDef : tous)]),
    [],
  )
  const lireMot = () => dire(reglages, bonne, 'nl')

  // la définition n'est lue à voix haute que si elle ne contient pas la réponse
  useEffect(() => { if (definition === m.definition) dire(reglages, definition, 'nl') }, [])

  return (
    <>
      <div class="carte">
        <Langue l="nl" />
        <p class="mot petit">{definition}</p>
        <p class="astuce">Quel mot correspond à cette définition ?</p>
      </div>
      {reglages.repondre === 'choix'
        ? <Choix options={options} bonne={bonne} mot={m} pause={pause} lire={lireMot} suivant={suivant} />
        : <Saisie langue="nl" attendu={`${bonne} (${m.fr})`} mot={m} pause={pause} lire={lireMot} suivant={suivant}
            corriger={t => corriger(t, m.nl, 'nl', m.det, { exigerArticle: reglages.exigerArticle })} />}
    </>
  )
}
