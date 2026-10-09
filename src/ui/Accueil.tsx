import type { Vocabulaire } from '../lib/mots'
import {
  EXERCICES, cleChapitre, exercice, motsChoisis, SEP,
  type Ordre, type Reglages, type Sens,
} from '../lib/reglages'
import type { Chargement } from './App'

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

/** « NW Biologie (1. De ecosystemen) + HW Geschiedenis » */
export function choixMatieres(r: Reglages): string {
  return r.matieres.map(m => {
    const ch = r.chapitres.filter(c => c.startsWith(m + SEP)).map(c => nomChapitre(c.split(SEP)[1]))
    return ch.length ? `${m} (${ch.join(', ')})` : m
  }).join(' + ')
}

/** « NW Biologie (1. De ecosystemen) · NL → FR · 20 mots » */
export function resume(voc: Vocabulaire, r: Reglages): string {
  const ex = exercice(r.exercice)
  const dispo = motsChoisis(voc, r).filter(ex.accepte).length
  const n = r.nombre > 0 ? Math.min(r.nombre, dispo) : dispo
  return [choixMatieres(r), ex.avecSens ? SENS.find(s => s.id === r.sens)!.nom : '', `${n} mot${n > 1 ? 's' : ''}`]
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
  liste: () => void
}

export function Accueil({ voc, chargement, actualiser, reglages: r, setReglages, lancer, liste }: Props) {
  const maj = (p: Partial<Reglages>) => setReglages({ ...r, ...p })
  const ex = exercice(r.exercice)
  const choisis = motsChoisis(voc, r)
  const dispo = choisis.filter(ex.accepte).length

  const basculerMatiere = (nom: string) => {
    const deja = r.matieres.includes(nom)
    if (deja && r.matieres.length === 1) return              // il en faut au moins une
    maj({
      matieres: deja ? r.matieres.filter(m => m !== nom) : [...r.matieres, nom],
      chapitres: deja ? r.chapitres.filter(c => !c.startsWith(nom + SEP)) : r.chapitres,
    })
  }
  const basculerChapitre = (cle: string) =>
    maj({ chapitres: r.chapitres.includes(cle) ? r.chapitres.filter(c => c !== cle) : [...r.chapitres, cle] })
  const tousChapitres = (matiere: string) => maj({ chapitres: r.chapitres.filter(c => !c.startsWith(matiere + SEP)) })

  return (
    <main class="page">
      <header class="entete">
        <h1>Vocabulaire <span class="nl">NL</span></h1>
        <button class="second" onClick={liste}>Liste des mots</button>
      </header>
      <p class={`etat ${chargement.etat === 'hors-ligne' ? 'erreur' : ''}`} role="status">
        {chargement.etat === 'chargement' && 'Mise à jour des mots…'}
        {chargement.etat === 'ok' && `Mots à jour (${dateCourte(voc.misAJour)})`}
        {chargement.etat === 'hors-ligne' && <>
          {chargement.message} Copie du {dateCourte(voc.misAJour)} utilisée.
          <button class="lien" onClick={actualiser}>Réessayer</button>
        </>}
      </p>

      <section class="reprendre" aria-label="Exercice choisi">
        <div class="resume">
          <p class="titre">{ex.nom}</p>
          <p class="detail">{resume(voc, r)}</p>
        </div>
        <button class="go" onClick={lancer} disabled={dispo === 0}>Commencer ▶</button>
      </section>
      {dispo === 0 && <p class="etat erreur">Aucun mot ne convient à cet exercice dans ce choix ({ex.nom} : il faut {ex.id === 'dehet' ? 'des noms avec de/het' : 'des mots'}).</p>}

      <section class="bloc">
        <h2>Matière</h2>
        <div class="puces">
          {voc.matieres.map(m => (
            <button class="puce" aria-pressed={r.matieres.includes(m.nom)} onClick={() => basculerMatiere(m.nom)}>
              {m.nom} <span class="n">{m.mots.length}</span>
            </button>
          ))}
        </div>
      </section>

      <section class="bloc">
        <h2>Chapitres</h2>
        {voc.matieres.filter(m => r.matieres.includes(m.nom)).map(m => {
          const coches = r.chapitres.filter(c => c.startsWith(m.nom + SEP))
          return (
            <div>
              {r.matieres.length > 1 && <p class="sous">{m.nom}</p>}
              <div class="puces">
                <button class="puce" aria-pressed={coches.length === 0} onClick={() => tousChapitres(m.nom)}>Tous</button>
                {m.chapitres.map(c => {
                  const cle = cleChapitre(m.nom, c)
                  return (
                    <button class="puce" aria-pressed={coches.includes(cle)} onClick={() => basculerChapitre(cle)}>
                      {nomChapitre(c)} <span class="n">{m.mots.filter(x => x.chapitre === c).length}</span>
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
                <b>{e.nom}</b>
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
            {r.exercice === 'ecrit' && (
              <label class="case"><input id="article" type="checkbox" checked={r.exigerArticle} onChange={e => maj({ exigerArticle: (e.target as HTMLInputElement).checked })} /> Exiger l’article (de / het)</label>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
