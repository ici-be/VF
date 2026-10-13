// Le nom d'une matière tel qu'il s'affiche partout : en gras, dans la couleur de sa carte
// du menu (plus d'icônes). Et la liste des matières choisies, avec leurs chapitres.
import type { Vocabulaire } from '../lib/mots'
import { apparence } from '../lib/apparence'
import { cleChapitre, pagesChoisies, type Reglages } from '../lib/reglages'

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

/** Les matières choisies, chacune avec ses chapitres s'ils sont restreints (dans l'ordre du tableau).
 *  `aLaLigne` (bloc « Commencer ») : jusqu'à 3 chapitres, un par ligne ; au-delà, séparés par des virgules. */
export function NomsMatieres({ voc, r, aLaLigne }: { voc: Vocabulaire; r: Reglages; aLaLigne?: boolean }) {
  const p = pagesChoisies(voc, r)
  return (
    <>
      {r.matieres.map(m => {
        const ordre = voc.matieres.find(x => x.nom === m)?.chapitres ?? []
        const ch = ordre.filter(c => r.chapitres.includes(cleChapitre(m, c))).map(nomChapitre)
        if (aLaLigne && ch.length > 0 && ch.length <= 3) return (
          <span class="nom-matiere">
            <NomMatiere nom={m} />
            {ch.map(c => <span class="chapitre-ligne">{c}</span>)}
            {p && <span class="chapitre-ligne">p. {p.de}–{p.a}</span>}
          </span>
        )
        return (
          <span class="nom-matiere">
            <NomMatiere nom={m} />{(ch.length > 0 || p) && <span class="chapitres-choisis">{[ch.join(', '), p && `p. ${p.de}–${p.a}`].filter(Boolean).join(' · ')}</span>}
          </span>
        )
      })}
    </>
  )
}
