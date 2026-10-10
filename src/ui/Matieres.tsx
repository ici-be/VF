// Le nom d'une matière tel qu'il s'affiche partout : en gras, dans la couleur de sa carte
// du menu (plus d'icônes). Et la liste des matières choisies, avec leurs chapitres.
import type { Vocabulaire } from '../lib/mots'
import { apparence } from '../lib/apparence'
import { cleChapitre, type Reglages } from '../lib/reglages'

export const nomChapitre = (c: string) => (/^\d+(\.\d+)?$/.test(c) ? `Chapitre ${c}` : c)

const teinte = (nom: string) => {
  const m = apparence(nom).mascotte
  return m ? `teinte-${m}` : ''
}

export function NomMatiere({ nom }: { nom: string }) {
  return <b class={`nom-matiere-coul ${teinte(nom)}`}>{apparence(nom).titre}</b>
}

/** Plusieurs matières côte à côte (en-tête d'un exercice) : « Nederlands · Geschiedenis ». */
export function NomsCote({ noms }: { noms: string[] }) {
  return <>{noms.map((n, i) => <>{i > 0 && ' · '}<NomMatiere nom={n} /></>)}</>
}

/** Les matières choisies, chacune avec ses chapitres s'ils sont restreints (dans l'ordre du tableau). */
export function NomsMatieres({ voc, r }: { voc: Vocabulaire; r: Reglages }) {
  return (
    <>
      {r.matieres.map(m => {
        const ordre = voc.matieres.find(x => x.nom === m)?.chapitres ?? []
        const ch = ordre.filter(c => r.chapitres.includes(cleChapitre(m, c))).map(nomChapitre)
        return (
          <span class="nom-matiere">
            <NomMatiere nom={m} />{ch.length > 0 && <span class="chapitres-choisis">{ch.join(', ')}</span>}
          </span>
        )
      })}
    </>
  )
}
