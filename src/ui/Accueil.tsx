import type { Vocabulaire } from '../lib/mots'
import {
  EXERCICES, cleChapitre, exercice, motsChoisis, SEP,
  type Ordre, type Reglages, type Sens,
} from '../lib/reglages'
import type { Chargement } from './App'
import { apparence } from '../lib/apparence'
import { motsARevoir, noteSur20, suivi } from '../lib/progression'
import type { Vue } from './Liste'
import { niveauNote, nombre, note } from '../lib/texte'
import type { Mot } from '../lib/mots'

export const nomChapitre = (c: string) => (/^\d+(\.\d+)?$/.test(c) ? `Chapitre ${c}` : c)

export const SENS: { id: Sens; nom: string }[] = [
  { id: 'nl-fr', nom: 'NL → FR' },
  { id: 'fr-nl', nom: 'FR → NL' },
  { id: 'mix', nom: 'Mélangé' },
]
const NOMBRES = [10, 20, 30, 0]
const ORDRES: { id: Ordre; nom: string }[] = [
  { id: 'fragiles', nom: 'Mots à revoir d’abord' },
  { id: 'hasard', nom: 'Au hasard' },
  { id: 'tableau', nom: 'Ordre du tableau' },
]

/** La note de maîtrise d'un groupe de mots, s'il a déjà été travaillé. */
function Note({ mots }: { mots: Mot[] }) {
  const n = mots.some(m => suivi(m.id)) ? noteSur20(mots) : null
  return n === null ? null : (
    <span class={`note ${niveauNote(n)}`} title="Ce que tu sais déjà : un mot compte comme su après 3 bonnes réponses sans erreur">{note(n)}</span>
  )
}

/** « NW Biologie (1. De ecosystemen) + HW Geschiedenis » */
export function choixMatieres(r: Reglages): string {
  return r.matieres.map(m => {
    const ch = r.chapitres.filter(c => c.startsWith(m + SEP)).map(c => nomChapitre(c.split(SEP)[1]))
    const a = apparence(m)
    return `${a.icone} ${a.titre}` + (ch.length ? ` (${ch.join(', ')})` : '')
  }).join(' + ')
}

/** « NW Biologie (1. De ecosystemen) · NL → FR · 20 mots » */
export function resume(voc: Vocabulaire, r: Reglages): string {
  const ex = exercice(r.exercice)
  const dispo = motsChoisis(voc, r).filter(ex.accepte).length
  const n = r.nombre > 0 ? Math.min(r.nombre, dispo) : dispo
  return [choixMatieres(r), ex.avecSens ? SENS.find(s => s.id === r.sens)!.nom : '', nombre(n, 'mot')]
    .filter(Boolean).join(' · ')
}

function dateCourte(ms: number): string {
  return new Date(ms).toLocaleString('fr-BE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

interface Props {
  voc: Vocabulaire
  chargement: Chargement
  actualiser: () => void
  reglages: Reglages
  setReglages: (r: Reglages) => void
  lancer: () => void
  liste: (vue: Vue) => void
}

export function Accueil({ voc, chargement, actualiser, reglages: r, setReglages, lancer, liste }: Props) {
  const maj = (p: Partial<Reglages>) => setReglages({ ...r, ...p })
  const ex = exercice(r.exercice)
  const choisis = motsChoisis(voc, r)
  const dispo = choisis.filter(ex.accepte).length
  const nbARevoir = motsARevoir(choisis).length

  // un clic choisit cette matière seule ; « + » l'ajoute aux autres, « − » la retire
  const choisirMatiere = (nom: string) => maj({ matieres: [nom] })
  const ajouterMatiere = (nom: string) => maj({ matieres: [...r.matieres, nom] })
  const retirerMatiere = (nom: string) => { if (r.matieres.length > 1) maj({ matieres: r.matieres.filter(m => m !== nom) }) }
  const basculerChapitre = (cle: string) =>
    maj({ chapitres: r.chapitres.includes(cle) ? r.chapitres.filter(c => c !== cle) : [...r.chapitres, cle] })
  const tousChapitres = (matiere: string) => maj({ chapitres: r.chapitres.filter(c => !c.startsWith(matiere + SEP)) })

  return (
    <main class="page">
      <div class="haut">
      <header class="entete">
        <h1>Vocabulaire <span class="nl">NL</span></h1>
        {nbARevoir > 0 && <button class="second revoir" onClick={() => liste('revoir')}>À revoir ({nbARevoir})</button>}
        <button class="second" onClick={() => liste('tous')}>Liste des mots</button>
      </header>
      <p class={`etat ${chargement.etat === 'hors-ligne' ? 'erreur' : ''}`} role="status">
        {chargement.etat === 'chargement' && 'Mise à jour des mots…'}
        {chargement.etat === 'ok' && `Mots à jour (${dateCourte(voc.misAJour)})`}
        {chargement.etat === 'hors-ligne' && <>
          {chargement.message} Copie du {dateCourte(voc.misAJour)} utilisée.
          <button class="lien" onClick={actualiser}>Réessayer</button>
        </>}
      </p>
      </div>

      <section class="reprendre" aria-label="Exercice choisi">
        <div class="resume">
          <p class="titre">{ex.nom}{ex.beta && <span class="beta">bêta</span>}</p>
          <p class="detail">{resume(voc, r)}</p>
        </div>
        <button class="go" onClick={lancer} disabled={dispo === 0}>Commencer ▶</button>
      </section>
      {dispo === 0 && <p class="etat erreur">Aucun mot ne convient à cet exercice dans ce choix ({ex.nom} : il faut {{ dehet: 'des noms avec de/het', definitions: 'des mots avec une définition', trous: 'des mots avec un exemple' }[ex.id as string] ?? 'des mots'}).</p>}

      <section class="bloc">
        <h2>Matière</h2>
        <div class="matieres">
          {voc.matieres.map(m => {
            const a = apparence(m.nom)
            const choisie = r.matieres.includes(m.nom)
            return (
              <div class={`matiere ${choisie ? 'choisie' : ''}`}>
                <button class="matiere-choix" aria-pressed={choisie} onClick={() => choisirMatiere(m.nom)}>
                  <span class="ico" aria-hidden="true">{a.icone}</span>
                  <span class="noms"><b>{a.titre}</b><span>{a.fr}{a.fr && ' '}<Note mots={m.mots} /></span></span>
                  <span class="n">{m.mots.length}</span>
                </button>
                {!choisie
                  ? <button class="ajout" onClick={() => ajouterMatiere(m.nom)} title="Ajouter aux matières choisies" aria-label={`Ajouter ${a.titre} aux matières choisies`}>+</button>
                  : r.matieres.length > 1 && <button class="ajout" onClick={() => retirerMatiere(m.nom)} title="Retirer" aria-label={`Retirer ${a.titre}`}>−</button>}
              </div>
            )
          })}
        </div>
        <p class="astuce gauche">Un clic choisit la matière. <b>+</b> pour réviser plusieurs matières ensemble.</p>
      </section>

      <section class="bloc">
        <h2>Chapitres</h2>
        {voc.matieres.filter(m => r.matieres.includes(m.nom)).map(m => {
          const coches = r.chapitres.filter(c => c.startsWith(m.nom + SEP))
          return (
            <div>
              {r.matieres.length > 1 && <p class="sous">{apparence(m.nom).icone} {apparence(m.nom).titre}</p>}
              <div class="puces">
                <button class="puce" aria-pressed={coches.length === 0} onClick={() => tousChapitres(m.nom)}>Tous</button>
                {m.chapitres.map(c => {
                  const cle = cleChapitre(m.nom, c)
                  return (
                    <button class="puce" aria-pressed={coches.includes(cle)} onClick={() => basculerChapitre(cle)}>
                      {nomChapitre(c)} <span class="n">{m.mots.filter(x => x.chapitre === c).length}</span>
                      <Note mots={m.mots.filter(x => x.chapitre === c)} />
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </section>

      <section class="bloc">
        <h2>Exercice</h2>
        <div class="tuiles">
          {EXERCICES.map(e => {
            const n = choisis.filter(e.accepte).length
            return (
              <button class="tuile" aria-pressed={r.exercice === e.id} onClick={() => maj({ exercice: e.id })} disabled={n === 0}>
                <b>{e.nom}{e.beta && <span class="beta">bêta</span>}</b>
                <span>{e.description}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section class="bloc">
        <h2>Réglages</h2>
        <div class="reglages">
          {ex.avecSens && (
            <div class="reglage">
              <span class="lbl">Sens</span>
              <div class="segment">
                {SENS.map(s => <button aria-pressed={r.sens === s.id} onClick={() => maj({ sens: s.id })}>{s.nom}</button>)}
              </div>
            </div>
          )}
          {ex.avecRepondre && (
            <div class="reglage">
              <span class="lbl">Réponse</span>
              <div class="segment">
                <button aria-pressed={r.repondre === 'choix'} onClick={() => maj({ repondre: 'choix' })}>Choisir parmi 4</button>
                <button aria-pressed={r.repondre === 'ecrit'} onClick={() => maj({ repondre: 'ecrit' })}>Écrire le mot</button>
              </div>
            </div>
          )}
          <div class="reglage">
            <span class="lbl">Nombre de mots</span>
            <div class="segment">
              {NOMBRES.map(n => <button aria-pressed={r.nombre === n} onClick={() => maj({ nombre: n })}>{n || 'Tous'}</button>)}
            </div>
          </div>
          {ex.avecVitesse && (
            <div class="reglage">
              <label for="delai">Temps pour réfléchir <span class="valeur">{r.delai} s</span></label>
              <input id="delai" type="range" min="1" max="15" step="1" value={r.delai}
                onInput={e => maj({ delai: Number((e.target as HTMLInputElement).value) })} />
            </div>
          )}
          <div class="reglage">
            <span class="lbl">Quels mots ?</span>
            <div class="segment">
              {ORDRES.map(o => <button aria-pressed={r.ordre === o.id} onClick={() => maj({ ordre: o.id })}>{o.nom}</button>)}
            </div>
          </div>
          <div class="reglage">
            <label class="case"><input id="voix" type="checkbox" checked={r.voix} onChange={e => maj({ voix: (e.target as HTMLInputElement).checked })} /> Lire les mots à voix haute</label>
            {(r.exercice === 'ecrit' || r.exercice === 'dictee' || (r.exercice === 'definitions' && r.repondre === 'ecrit')) && (
              <label class="case"><input id="article" type="checkbox" checked={r.exigerArticle} onChange={e => maj({ exigerArticle: (e.target as HTMLInputElement).checked })} /> Exiger l’article (de / het)</label>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
