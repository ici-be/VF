import { useEffect, useMemo } from 'preact/hooks'
import { corriger } from '../../lib/correction'
import { leurres, melanger, nlComplet } from '../../lib/seance'
import { masquer } from '../../lib/trous'
import type { PropsExercice } from '../Seance'
import { dire, Langue } from './commun'
import { Choix, Saisie } from './Reponses'
import { Glose } from '../Glose'
import { langueDe } from '../../lib/apparence'
import { Dessin, dessinDe } from '../Dessin'

// La définition (sans le mot qu'elle définit), il faut trouver le mot néerlandais.
export function Definitions({ carte, tous, reglages, pause, suivant, annoncer }: PropsExercice) {
  const m = carte.mot
  const definition = masquer(m.definition, m.nl)
  const bonne = nlComplet(m)
  const langue = langueDe(m)
  // les propositions : d'autres mots qui ont aussi une définition, de préférence
  const avecDef = tous.filter(x => x.definition)
  const options = useMemo(
    () => melanger([bonne, ...leurres({ mot: m, sens: 'fr-nl' }, avecDef.length >= 4 ? avecDef : tous)]),
    [],
  )
  const lireMot = () => dire(reglages, bonne, langue)

  // la définition n'est lue à voix haute que si elle ne contient pas la réponse
  useEffect(() => { if (definition === m.definition) dire(reglages, definition, langue) }, [])

  return (
    <>
      <div class="carte">
        <Langue l={langue} />
        {/* le dessin (géométrie) à côté de la définition, comme indice */}
        <div class={dessinDe(m) ? 'carte-dessin' : 'carte-texte'}>
          <Dessin m={m} grand label="Dessin explicatif" />
          <div class="carte-texte">
            {/* jamais la traduction du mot à trouver */}
            <p class="mot petit"><Glose texte={definition} matiere={m.matiere} exclure={[m.nl]} /></p>
            <p class="astuce">Quel mot correspond à cette définition ?</p>
          </div>
        </div>
      </div>
      {reglages.repondre === 'choix'
        ? <Choix options={options} bonne={bonne} mot={m} pause={pause} lire={lireMot} suivant={suivant} annoncer={annoncer} />
        : <Saisie langue={langue} attendu={langue === 'fr' ? bonne : `${bonne} (${m.fr})`} mot={m} pause={pause} lire={lireMot} suivant={suivant} annoncer={annoncer}
            corriger={t => corriger(t, m.nl, langue, m.det, { exigerArticle: reglages.exigerArticle })} />}
    </>
  )
}
