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
 *  `aLaLigne` (bloc « Commencer ») : une hauteur à peu près stable, quel que soit le choix.
 *  Une matière : jusqu'à 3 chapitres, un par ligne ; au-delà, leur nombre (« 7 chapitres »).
 *  2 ou 3 matières : une par ligne, avec son chapitre s'il est seul, sinon leur nombre.
 *  Plus de 3 : « 6 matières », et leurs noms sur une ligne (coupée si trop longue). */
export function NomsMatieres({ voc, r, aLaLigne }: { voc: Vocabulaire; r: Reglages; aLaLigne?: boolean }) {
  const p = pagesChoisies(voc, r)
  const chapitres = (m: string) => {
    const ordre = voc.matieres.find(x => x.nom === m)?.chapitres ?? []
    return ordre.filter(c => r.chapitres.includes(cleChapitre(m, c))).map(nomChapitre)
  }
  if (aLaLigne && r.matieres.length > 3) return (
    <span class="nom-matiere" title={r.matieres.map(m => apparence(m).titre).join(', ')}>
      <b>{r.matieres.length} matières</b>
      <span class="chapitre-ligne">{r.matieres.map((m, i) => <>{i > 0 && ' · '}<NomMatiere nom={m} /></>)}</span>
    </span>
  )
  return (
    <>
      {r.matieres.map(m => {
        const ch = chapitres(m)
        const pages = p && `p. ${p.de}–${p.a}`
        if (aLaLigne && r.matieres.length === 1 && ch.length > 0 && ch.length <= 3) return (
          <span class="nom-matiere">
            <NomMatiere nom={m} />
            {ch.map(c => <span class="chapitre-ligne">{c}</span>)}
            {pages && <span class="chapitre-ligne">{pages}</span>}
          </span>
        )
        // leur nombre (« 2 chap. » sur téléphone, où les mascottes prennent de la place)
        const compte = aLaLigne && (r.matieres.length > 1 ? ch.length > 1 : ch.length > 3)
        const texte = compte
          ? <><span class="long">{ch.length} chapitres</span><span class="court">{ch.length} chap.</span></>
          : [ch.join(', '), pages].filter(Boolean).join(' · ')
        return (
          <span class="nom-matiere" title={aLaLigne && ch.length > 1 ? ch.join(', ') : undefined}>
            <NomMatiere nom={m} />{texte && <span class="chapitres-choisis">{texte}</span>}
          </span>
        )
      })}
    </>
  )
}
