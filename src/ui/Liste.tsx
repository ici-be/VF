import { useState } from 'preact/hooks'
import type { Mot, Vocabulaire } from '../lib/mots'
import { exercice, motsChoisis, type Reglages } from '../lib/reglages'
import { motsARevoir, type Suivi } from '../lib/progression'
import { construireSerie, type Carte } from '../lib/seance'
import { sansAccents } from '../lib/correction'
import { parler } from '../lib/voix'
import { choixMatieres, nomChapitre } from './Accueil'
import { apparence } from '../lib/apparence'
import { accord } from '../lib/texte'

export type Vue = 'tous' | 'revoir'

interface Props {
  voc: Vocabulaire
  reglages: Reglages
  vueInitiale: Vue
  retour: () => void
  lancer: (serie: Carte[]) => void
}

/** « aujourd'hui », « hier », « il y a 5 jours » */
function quand(ms: number): string {
  const jours = Math.floor((new Date().setHours(0, 0, 0, 0) - new Date(ms).setHours(0, 0, 0, 0)) / 86_400_000)
  return jours <= 0 ? 'aujourd’hui' : jours === 1 ? 'hier' : `il y a ${jours} jours`
}

type Tri = 'chapitre' | 'nl' | 'fr'
const cmp = (a: string, b: string) => a.localeCompare(b, 'fr', { sensitivity: 'base' })

export function Liste({ voc, reglages, vueInitiale, retour, lancer }: Props) {
  const [cherche, setCherche] = useState('')
  const [tri, setTri] = useState<Tri>('chapitre')
  const [vue, setVue] = useState<Vue>(vueInitiale)
  const simple = (s: string) => sansAccents(s.toLowerCase())
  const q = simple(cherche.trim())
  const choisis = motsChoisis(voc, reglages)
  const aRevoir = motsARevoir(choisis)
  const suivis = new Map<string, Suivi>(aRevoir.map(x => [x.mot.id, x.suivi]))
  let mots = (vue === 'revoir' ? aRevoir.map(x => x.mot) : choisis).filter(m =>
    !q || [m.nl, m.fr, m.definition, m.remarque, m.exemple].some(t => simple(t).includes(q)))
  // « à revoir » : dans l'ordre de priorité, sans regroupement par chapitre
  const trier = vue === 'tous' ? tri : null
  if (trier === 'chapitre') {
    // dans l'ordre des chapitres du tableau, même si les lignes y sont mélangées
    const rang = new Map(voc.matieres.flatMap((m, i) => m.chapitres.map((c, j) => [`${m.nom}|${c}`, i * 1000 + j] as const)))
    mots = [...mots].sort((a, b) => rang.get(`${a.matiere}|${a.chapitre}`)! - rang.get(`${b.matiere}|${b.chapitre}`)!)
  }
  if (trier === 'nl') mots = [...mots].sort((a, b) => cmp(a.nl, b.nl))
  if (trier === 'fr') mots = [...mots].sort((a, b) => cmp(a.fr.replace(/^(le |la |les |l')/i, ''), b.fr.replace(/^(le |la |les |l')/i, '')))

  const lignes: (Mot | string)[] = []
  let groupe = ''
  for (const m of mots) {
    const g = `${apparence(m.matiere).icone} ${apparence(m.matiere).titre} · ${nomChapitre(m.chapitre)}`
    if (trier === 'chapitre' && g !== groupe) { lignes.push(g); groupe = g }
    lignes.push(m)
  }

  const ex = exercice(reglages.exercice)
  const serieARevoir = construireSerie(aRevoir.map(x => x.mot), { ...reglages, nombre: 0, ordre: 'hasard' })
  const colonnes = vue === 'revoir' ? 4 : 3

  return (
    <main class="page">
      <div class="haut">
        <header class="entete">
          <button class="icone" onClick={retour} aria-label="Retour au menu">←</button>
          <h1>{vue === 'revoir' ? 'Mots à revoir' : 'Liste des mots'}</h1>
        </header>
        <p class="etat">{choixMatieres(reglages)} · la matière et les chapitres se choisissent dans le menu.</p>
      </div>
      <div class="segment">
        <button aria-pressed={vue === 'tous'} onClick={() => setVue('tous')}>Tous les mots <span class="n">{choisis.length}</span></button>
        <button aria-pressed={vue === 'revoir'} onClick={() => setVue('revoir')}>À revoir <span class="n">{aRevoir.length}</span></button>
      </div>
      {vue === 'revoir' && (
        <div class="bandeau">
          <p>{aRevoir.length > 1 ? `Les ${aRevoir.length} mots ratés` : aRevoir.length === 1 ? 'Le mot raté' : 'Les mots ratés'} ces 30 derniers jours et pas encore {accord(aRevoir.length, 'rattrapé')}, les plus souvent ratés d’abord (30 au maximum). Un mot sort de la liste quand il est réussi plusieurs fois de suite.</p>
          {aRevoir.length > 0 && (
            serieARevoir.length
              ? <button class="go" onClick={() => lancer(serieARevoir)}>S’entraîner sur {aRevoir.length > 1 ? 'ces mots' : 'ce mot'} · {ex.nom} ▶</button>
              : <p class="astuce gauche">L’exercice « {ex.nom} » ne convient à aucun de ces mots : choisis-en un autre dans le menu.</p>
          )}
        </div>
      )}
      <div class="outils">
        <input type="search" id="cherche" placeholder="Chercher un mot…" value={cherche} onInput={e => setCherche((e.target as HTMLInputElement).value)} />
        {vue === 'tous' && (
          <div class="segment">
            <button aria-pressed={tri === 'chapitre'} onClick={() => setTri('chapitre')}>Par chapitre</button>
            <button aria-pressed={tri === 'nl'} onClick={() => setTri('nl')}>A→Z NL</button>
            <button aria-pressed={tri === 'fr'} onClick={() => setTri('fr')}>A→Z FR</button>
          </div>
        )}
      </div>
      {mots.length === 0
        ? <p class="vide">{vue === 'revoir' && !q ? 'Aucun mot raté récemment dans ce choix. Bravo ! 🎉' : 'Aucun mot ne correspond.'}</p>
        : (
          <div class="tableau">
            <table>
              <thead><tr><th></th><th>Nederlands</th><th>Français</th>{vue === 'revoir' && <th>Raté</th>}</tr></thead>
              <tbody>
                {lignes.map(l => typeof l === 'string'
                  ? <tr class="chap"><td colSpan={colonnes}>{l}</td></tr>
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
                      {vue === 'revoir' && (() => {
                        const su = suivis.get(l.id)!
                        return <td class="rate">{su.rates}×<span class="extra">{quand(su.dernierRate!)}</span></td>
                      })()}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
    </main>
  )
}
