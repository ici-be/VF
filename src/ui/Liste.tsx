import { useEffect, useState } from 'preact/hooks'
import { derniersAjouts, type Mot, type Vocabulaire } from '../lib/mots'
import { exercice, motsChoisis, type Reglages } from '../lib/reglages'
import { motsARevoir, type Suivi } from '../lib/progression'
import { construireSerie, type Carte } from '../lib/seance'
import { sansAccents } from '../lib/correction'
import { parler } from '../lib/voix'
import { choixMatieres, nomChapitre } from './Accueil'
import { SEP } from '../lib/reglages'
import { nombre } from '../lib/texte'
import { estPrimitif, NB_PRIMITIFS, PRIMITIFS, verbe } from '../lib/conjugaison'
import { apparence } from '../lib/apparence'
import { accord } from '../lib/texte'

export type Vue = 'tous' | 'revoir' | 'primitifs' | 'nouveaux'

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
  // les temps primitifs : les verbes les plus courants du choix, dans l'ordre de fréquence
  const verbesPrimitifs = choisis.filter(m => estPrimitif(m.verbe)).sort((a, b) => verbe(a.verbe!)!.rang - verbe(b.verbe!)!.rang)
  // les mots du dernier envoi /cours, toutes matières confondues (pas seulement celles choisies)
  const nouveaux = derniersAjouts(voc)
  const dateNouveaux = nouveaux.date && new Date(nouveaux.date + 'T12:00').toLocaleDateString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' })
  let mots = (vue === 'revoir' ? aRevoir.map(x => x.mot) : vue === 'primitifs' ? verbesPrimitifs : vue === 'nouveaux' ? nouveaux.mots : choisis).filter(m =>
    !q || [m.nl, m.fr, m.definition, m.remarque, m.exemple].some(t => simple(t).includes(q)))
  // « à revoir » : dans l'ordre de priorité, sans regroupement par chapitre
  const trier = vue === 'tous' ? tri : vue === 'nouveaux' ? 'chapitre' : null
  if (trier === 'chapitre') {
    // dans l'ordre des chapitres du tableau, même si les lignes y sont mélangées
    const rang = new Map(voc.matieres.flatMap((m, i) => m.chapitres.map((c, j) => [`${m.nom}|${c}`, i * 1000 + j] as const)))
    mots = [...mots].sort((a, b) => rang.get(`${a.matiere}|${a.chapitre}`)! - rang.get(`${b.matiere}|${b.chapitre}`)!)
  }
  if (trier === 'nl') mots = [...mots].sort((a, b) => cmp(a.nl, b.nl))
  if (trier === 'fr') mots = [...mots].sort((a, b) => cmp(a.fr.replace(/^(le |la |les |l')/i, ''), b.fr.replace(/^(le |la |les |l')/i, '')))

  const lignes: (Mot | { groupe: string; matiere: string })[] = []
  let groupe = ''
  for (const m of mots) {
    const g = `${apparence(m.matiere).titre} · ${nomChapitre(m.chapitre)}`
    if (trier === 'chapitre' && g !== groupe) { lignes.push({ groupe: g, matiere: m.matiere }); groupe = g }
    lignes.push(m)
  }

  const ex = exercice(reglages.exercice)
  const serieARevoir = construireSerie(aRevoir.map(x => x.mot), { ...reglages, nombre: 0, ordre: 'hasard' })
  const serieNouveaux = construireSerie(nouveaux.mots, { ...reglages, nombre: 0, ordre: 'hasard' })
  const colonnes = vue === 'revoir' ? 4 : 3

  // titre de la page imprimée : « Biologie / Biologie — 1. De ecosystemen »
  const titreMatieres = reglages.matieres.map(n => {
    const a = apparence(n)
    const ch = reglages.chapitres.filter(c => c.startsWith(n + SEP)).map(c => nomChapitre(c.split(SEP)[1]))
    return { nom: a.fr && a.fr !== a.titre ? `${a.titre} / ${a.fr}` : a.titre, chapitres: ch.length ? ch.join(', ') : 'tous les chapitres' }
  })
  const titreImpression = vue === 'nouveaux'
    ? `Nouveaux mots – ${dateNouveaux}`
    : `${vue === 'revoir' ? 'Mots à revoir' : vue === 'primitifs' ? 'Temps primitifs' : 'Vocabulaire'} – ${titreMatieres.map(t => `${t.nom} – ${t.chapitres}`).join(' + ')}`
  // le titre du document sert de nom au PDF enregistré depuis la fenêtre d'impression
  useEffect(() => {
    const avant = document.title
    const pendant = () => { document.title = titreImpression }
    const apres = () => { document.title = avant }
    addEventListener('beforeprint', pendant)
    addEventListener('afterprint', apres)
    return () => { removeEventListener('beforeprint', pendant); removeEventListener('afterprint', apres); document.title = avant }
  }, [titreImpression])
  const aujourdhui = new Date().toLocaleDateString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <main class="page liste">
      {/* en-tête de la page imprimée (caché à l'écran) */}
      <header class="impression">
        <h1>{vue === 'revoir' ? 'Mots à revoir' : vue === 'primitifs' ? `Temps primitifs – les ${NB_PRIMITIFS} verbes les plus courants` : vue === 'nouveaux' ? `Nouveaux mots – ajoutés le ${dateNouveaux}` : 'Vocabulaire néerlandais'}</h1>
        {vue !== 'nouveaux' && titreMatieres.map(t => <p class="sujet"><b>{t.nom}</b> · {t.chapitres}</p>)}
        <p class="meta">{nombre(mots.length, vue === 'primitifs' ? 'verbe' : 'mot')}{q ? ` contenant « ${cherche.trim()} »` : ''} · {aujourdhui}</p>
      </header>
      <div class="haut">
        <header class="entete">
          <button class="icone" onClick={retour} aria-label="Retour au menu">←</button>
          <h1>{vue === 'revoir' ? 'Mots à revoir' : vue === 'primitifs' ? 'Temps primitifs' : vue === 'nouveaux' ? 'Nouveaux mots' : 'Liste des mots'}</h1>
          <button class="second" onClick={() => print()} title="Imprimer (Ctrl+P)">🖨 Imprimer</button>
        </header>
        <p class="etat">{choixMatieres(reglages)} · la matière et les chapitres se choisissent dans le menu.</p>
      </div>
      <div class="segment">
        <button aria-pressed={vue === 'tous'} onClick={() => setVue('tous')}>Tous les mots <span class="n">{choisis.length}</span></button>
        <button aria-pressed={vue === 'revoir'} onClick={() => setVue('revoir')}>À revoir <span class="n">{aRevoir.length}</span></button>
        {verbesPrimitifs.length > 0 && (
          <button aria-pressed={vue === 'primitifs'} onClick={() => setVue('primitifs')}>Temps primitifs <span class="n">{verbesPrimitifs.length}</span></button>
        )}
        {nouveaux.mots.length > 0 && (
          <button aria-pressed={vue === 'nouveaux'} onClick={() => setVue('nouveaux')}>Nouveaux <span class="n">{nouveaux.mots.length}</span></button>
        )}
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
      {vue === 'nouveaux' && (
        <div class="bandeau">
          <p>{nombre(nouveaux.mots.length, 'mot')} {accord(nouveaux.mots.length, 'ajouté')} au tableau le {dateNouveaux}, toutes matières confondues, dans l’ordre du cours.</p>
          {serieNouveaux.length
            ? <button class="go" onClick={() => lancer(serieNouveaux)}>S’entraîner sur ces mots · {ex.nom} ▶</button>
            : <p class="astuce gauche">L’exercice « {ex.nom} » ne convient à aucun de ces mots : choisis-en un autre dans le menu.</p>}
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
      {vue === 'primitifs' && mots.length > 0 && (
        <div class="tableau primitifs">
          <table>
            <thead><tr><th>Infinitief</th>{PRIMITIFS.map(p => <th>{p.nom}</th>)}<th>Français</th></tr></thead>
            <tbody>
              {mots.map(m => {
                const v = verbe(m.verbe!)!
                return (
                  <tr>
                    <td class="nl">{v.inf}<button class="ecouter" onClick={() => parler(v.lecturePrimitifs, 'nl')} aria-label={`Écouter ${v.inf}`} title="Écouter">🔊</button></td>
                    {PRIMITIFS.map(p => <td class="forme">{p.formes(v).join(' / ')}</td>)}
                    <td>{v.fr}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      {vue === 'primitifs' ? null : mots.length === 0
        ? <p class="vide">{vue === 'revoir' && !q ? 'Aucun mot raté récemment dans ce choix. Bravo ! 🎉' : 'Aucun mot ne correspond.'}</p>
        : (
          <div class="tableau">
            <table>
              <thead><tr><th></th><th>Nederlands</th><th>Français</th><th class="details">Définition · exemple · remarque</th>{vue === 'revoir' && <th>Raté</th>}</tr></thead>
              <tbody>
                {lignes.map(l => 'groupe' in l
                  ? <tr class={`chap ${lignes.filter(x => 'groupe' in x).length === 1 ? 'seul' : ''}`}><td colSpan={colonnes + 1}><span class="ico-matiere">{apparence(l.matiere).icone} </span>{l.groupe}</td></tr>
                  : (
                    <tr>
                      <td class="det">{l.det}</td>
                      <td class="nl">
                        {l.nl}
                        <button class="ecouter" onClick={() => parler(l.det ? `${l.det} ${l.nl}` : l.nl, 'nl')} aria-label={`Écouter ${l.nl}`} title="Écouter">🔊</button>
                      </td>
                      <td>
                        {l.fr}
                        <Details m={l} />
                      </td>
                      {/* à l'impression, les détails passent dans leur propre colonne (une ligne par mot) */}
                      <td class="details"><Details m={l} /></td>
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

function Details({ m }: { m: Mot }) {
  return (
    <>
      {m.definition && <span class="extra"><i>Définition :</i> {m.definition}</span>}
      {m.exemple && <span class="extra"><i>Exemple :</i> {m.exemple.replace(/[\[\]]/g, '')}</span>}
      {m.remarque && <span class="extra"><i>Remarque :</i> {m.remarque}</span>}
    </>
  )
}
