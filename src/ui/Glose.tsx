import { decouper, glossaireCourant } from '../lib/glossaire'

// Un texte néerlandais dont les mots du vocabulaire sont soulignés en pointillé discret :
// au survol (ou en touchant le mot sur téléphone), leur traduction s'affiche.
export function Glose({ texte, matiere, exclure }: { texte: string; matiere?: string; exclure?: string[] }) {
  return (
    <>
      {decouper(glossaireCourant(), texte, matiere, exclure).map(s => typeof s === 'string'
        ? s
        : <span class="glose" data-fr={s.entree.fr} tabIndex={-1}>{s.texte}</span>)}
    </>
  )
}
