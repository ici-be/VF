import { useState } from 'preact/hooks'
import type { Mot, Vocabulaire } from '../lib/mots'
import { motsChoisis, type Reglages } from '../lib/reglages'
import { sansAccents } from '../lib/correction'
import { parler } from '../lib/voix'
import { choixMatieres, nomChapitre } from './Accueil'
import { apparence } from '../lib/apparence'

interface Props {
  voc: Vocabulaire
  reglages: Reglages
  retour: () => void
}

type Tri = 'chapitre' | 'nl' | 'fr'
const cmp = (a: string, b: string) => a.localeCompare(b, 'fr', { sensitivity: 'base' })

export function Liste({ voc, reglages, retour }: Props) {
  const [cherche, setCherche] = useState('')
  const [tri, setTri] = useState<Tri>('chapitre')
  const simple = (s: string) => sansAccents(s.toLowerCase())
  const q = simple(cherche.trim())
  let mots = motsChoisis(voc, reglages).filter(m =>
    !q || [m.nl, m.fr, m.definition, m.remarque, m.exemple].some(t => simple(t).includes(q)))
  if (tri === 'chapitre') {
    // dans l'ordre des chapitres du tableau, même si les lignes y sont mélangées
    const rang = new Map(voc.matieres.flatMap((m, i) => m.chapitres.map((c, j) => [`${m.nom}|${c}`, i * 1000 + j] as const)))
    mots = [...mots].sort((a, b) => rang.get(`${a.matiere}|${a.chapitre}`)! - rang.get(`${b.matiere}|${b.chapitre}`)!)
  }
  if (tri === 'nl') mots = [...mots].sort((a, b) => cmp(a.nl, b.nl))
  if (tri === 'fr') mots = [...mots].sort((a, b) => cmp(a.fr.replace(/^(le |la |les |l')/i, ''), b.fr.replace(/^(le |la |les |l')/i, '')))

  const lignes: (Mot | string)[] = []
  let groupe = ''
  for (const m of mots) {
    const g = `${apparence(m.matiere).icone} ${apparence(m.matiere).titre} · ${nomChapitre(m.chapitre)}`
    if (tri === 'chapitre' && g !== groupe) { lignes.push(g); groupe = g }
    lignes.push(m)
  }

  return (
    <main class="page">
      <header class="entete">
        <button class="icone" onClick={retour} aria-label="Retour au menu">←</button>
        <h1>Liste des mots</h1>
      </header>
      <p class="etat">{choixMatieres(reglages)} · {mots.length} mots. La matière et les chapitres se choisissent dans le menu.</p>
      <div class="outils">
        <input type="search" id="cherche" placeholder="Chercher un mot…" value={cherche} onInput={e => setCherche((e.target as HTMLInputElement).value)} />
        <div class="segment">
          <button aria-pressed={tri === 'chapitre'} onClick={() => setTri('chapitre')}>Par chapitre</button>
          <button aria-pressed={tri === 'nl'} onClick={() => setTri('nl')}>A→Z NL</button>
          <button aria-pressed={tri === 'fr'} onClick={() => setTri('fr')}>A→Z FR</button>
        </div>
      </div>
      {mots.length === 0
        ? <p class="vide">Aucun mot ne correspond.</p>
        : (
          <div class="tableau">
            <table>
              <thead><tr><th></th><th>Nederlands</th><th>Français</th></tr></thead>
              <tbody>
                {lignes.map(l => typeof l === 'string'
                  ? <tr class="chap"><td colSpan={3}>{l}</td></tr>
                  : (
                    <tr>
                      <td class="det">{l.det}</td>
                      <td class="nl">
                        {l.nl}
                        <button class="ecouter" onClick={() => parler(l.det ? `${l.det} ${l.nl}` : l.nl, 'nl')} aria-label={`Écouter ${l.nl}`} title="Écouter">🔊</button>
                      </td>
                      <td>
                        {l.fr}
                        {l.definition && <span class="extra"><i>Définition :</i> {l.definition}</span>}
                        {l.exemple && <span class="extra"><i>Exemple :</i> {l.exemple.replace(/[\[\]]/g, '')}</span>}
                        {l.remarque && <span class="extra"><i>Remarque :</i> {l.remarque}</span>}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
    </main>
  )
}
