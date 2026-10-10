import { useEffect, useRef, useState } from 'preact/hooks'
import { derniersAjouts, type Vocabulaire } from '../lib/mots'
import {
  EXERCICES, aReviser, cleChapitre, exercice, motsChoisis, SEP,
  type Ordre, type Reglages, type Sens,
} from '../lib/reglages'
import type { Chargement } from './App'
import { apparence } from '../lib/apparence'
import { motsARevoir, noteSur20, suivi } from '../lib/progression'
import type { Vue } from './Liste'
import { niveauNote, nombre, note } from '../lib/texte'
import type { Mot } from '../lib/mots'
import { TEMPS } from '../lib/conjugaison'
import { IconeExercice } from './icones'
import { Scene } from './Scene'
import { sauter, svgBuste } from '../lib/mascottes'
import { Logo, MotExemple } from './Marque'

export { nomChapitre } from './Matieres'
import { nomChapitre, NomsMatieres } from './Matieres'

export const SENS: { id: Sens; nom: string }[] = [
  { id: 'nl-fr', nom: 'NL → FR' },
  { id: 'fr-nl', nom: 'FR → NL' },
  { id: 'mix', nom: 'Mélangé' },
]
const NOMBRES = [10, 20, 30, 0]
const ORDRES: { id: Ordre; nom: string; aide: string }[] = [
  { id: 'fragiles', nom: 'À revoir', aide: 'Les mots ratés ou pas encore sus d’abord' },
  { id: 'hasard', nom: 'Au hasard', aide: 'Des mots tirés au hasard' },
  { id: 'tableau', nom: 'Dans l’ordre', aide: 'Dans l’ordre du tableau' },
]

/** La note de maîtrise d'un groupe de mots, s'il a déjà été travaillé. */
function Note({ mots, r }: { mots: Mot[]; r: Reglages }) {
  // les notes ne s'affichent que si on l'a demandé dans les réglages
  const n = r.notes && mots.some(m => suivi(m.id)) ? noteSur20(mots) : null
  return n === null ? null : (
    <span class={`note ${niveauNote(n)}`} title="Ce que tu sais déjà : un mot compte comme su après 3 bonnes réponses sans erreur">{note(n)}</span>
  )
}

/** « NL → FR · 20 mots », sous « Commencer » */
export function resume(voc: Vocabulaire, r: Reglages): string {
  const ex = exercice(r.exercice)
  const dispo = aReviser(voc, r, ex).length
  const n = r.nombre > 0 ? Math.min(r.nombre, dispo) : dispo
  return [ex.avecSens ? SENS.find(s => s.id === r.sens)!.nom : '', nombre(n, ex.surQuestions ? 'question' : 'mot')]
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

function useLarge(): boolean {
  const requete = '(min-width: 1000px)'
  const [large, setLarge] = useState(() => matchMedia(requete).matches)
  useEffect(() => {
    const m = matchMedia(requete)
    const f = () => setLarge(m.matches)
    m.addEventListener('change', f)
    return () => m.removeEventListener('change', f)
  }, [])
  return large
}

export function Accueil({ voc, chargement, actualiser, reglages: r, setReglages, lancer, liste }: Props) {
  const large = useLarge()
  const maj = (p: Partial<Reglages>) => setReglages({ ...r, ...p })
  const ex = exercice(r.exercice)
  const choisis = motsChoisis(voc, r)
  const dispo = aReviser(voc, r, ex).length
  const unite = ex.surQuestions ? 'question' : 'mot'
  const nbARevoir = motsARevoir(choisis).length
  // le dernier envoi /cours reste signalé deux semaines sur l'accueil
  const nouveaux = derniersAjouts(voc)
  const nouveauxRecents = nouveaux.mots.length > 0 && Date.now() - new Date(nouveaux.date + 'T00:00').getTime() < 14 * 86_400_000

  // la mascotte d'une matière qu'on vient de choisir reçoit le flambeau : petit saut dans son médaillon
  const avant = useRef(r.matieres)
  useEffect(() => {
    const nouvelles = r.matieres.filter(n => !avant.current.includes(n))
    avant.current = r.matieres
    for (const n of nouvelles) {
      const el = [...document.querySelectorAll<HTMLElement>('.matiere')].find(t => t.dataset.matiere === n)?.querySelector('.medaillon')
      if (el) sauter(el, 1, false)
    }
  }, [r.matieres.join('|')])

  // « Commencer » : la mascotte saute de joie, puis la série démarre (pendant la réception)
  const commencer = () => {
    const visibles = [...document.querySelectorAll<HTMLElement>('.reprendre .acteur')].filter(el => el.offsetParent !== null)
    if (!visibles.length || matchMedia('(prefers-reduced-motion: reduce)').matches) { lancer(); return }
    visibles.forEach(el => sauter(el))
    setTimeout(lancer, 600)
  }

  // un clic choisit cette matière seule ; « + » l'ajoute aux autres, « − » la retire
  const choisirMatiere = (nom: string) => maj({ matieres: [nom] })
  const ajouterMatiere = (nom: string) => maj({ matieres: [...r.matieres, nom] })
  const retirerMatiere = (nom: string) => { if (r.matieres.length > 1) maj({ matieres: r.matieres.filter(m => m !== nom) }) }
  const basculerChapitre = (cle: string) =>
    maj({ chapitres: r.chapitres.includes(cle) ? r.chapitres.filter(c => c !== cle) : [...r.chapitres, cle] })
  const tousChapitres = (matiere: string) => maj({ chapitres: r.chapitres.filter(c => !c.startsWith(matiere + SEP)) })

  const blocChapitres = (
      <section class="bloc">
        <h2>Chapitres</h2>
        {voc.matieres.filter(m => r.matieres.includes(m.nom)).map(m => {
          const coches = r.chapitres.filter(c => c.startsWith(m.nom + SEP))
          const a = apparence(m.nom)
          // les chapitres d'une matière dans sa couleur (celle de sa carte dans « Matière »)
          return (
            <div class={`chapitres-matiere ${a.mascotte ? `teinte-${a.mascotte}` : ''}`}>
              {r.matieres.length > 1 && <p class="sous">{a.titre}</p>}
              <div class="puces">
                <button class="puce" aria-pressed={coches.length === 0} onClick={() => tousChapitres(m.nom)}>Tous</button>
                {m.chapitres.map(c => {
                  const cle = cleChapitre(m.nom, c)
                  return (
                    <button class="puce" aria-pressed={coches.includes(cle)} onClick={() => basculerChapitre(cle)}>
                      {nomChapitre(c)} <span class="n">{m.mots.filter(x => x.chapitre === c).length}</span>
                      <Note mots={m.mots.filter(x => x.chapitre === c)} r={r} />
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </section>
  )
  const blocReglages = (
      <section class="bloc reglages-bloc">
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
          {ex.avecTemps && (
            <div class="reglage">
              <span class="lbl">Temps</span>
              <div class="segment">
                {TEMPS.map(t => <button aria-pressed={r.temps === t.id} onClick={() => maj({ temps: t.id })} title={t.aide}>{t.nom}</button>)}
                <button aria-pressed={r.temps === 'mix'} onClick={() => maj({ temps: 'mix' })}>Mélangés</button>
              </div>
            </div>
          )}
          {ex.avecRepondre && (
            <div class="reglage">
              <span class="lbl">Réponse</span>
              <div class="segment">
                <button aria-pressed={r.repondre === 'choix'} onClick={() => maj({ repondre: 'choix' })}>Choisir parmi 4</button>
                <button aria-pressed={r.repondre === 'ecrit'} onClick={() => maj({ repondre: 'ecrit' })}>{ex.surQuestions ? 'Dans ma tête' : 'Écrire le mot'}</button>
              </div>
            </div>
          )}
          {ex.avecVitesse && (
            <div class="reglage">
              <label for="delai">Réflexion <span class="valeur">{r.delai} s</span></label>
              <input id="delai" type="range" min="1" max="15" step="1" value={r.delai}
                onInput={e => maj({ delai: Number((e.target as HTMLInputElement).value) })} />
            </div>
          )}
          <div class="reglage">
            <label class="case"><input id="voix" type="checkbox" checked={r.voix} onChange={e => maj({ voix: (e.target as HTMLInputElement).checked })} /> Lire les mots à voix haute</label>
            <label class="case"><input id="notes" type="checkbox" checked={r.notes} onChange={e => maj({ notes: (e.target as HTMLInputElement).checked })} /> Afficher les notes sur 20</label>
            {(r.exercice === 'ecrit' || r.exercice === 'dictee' || (r.exercice === 'definitions' && r.repondre === 'ecrit')) && (
              <label class="case"><input id="article" type="checkbox" checked={r.exigerArticle} onChange={e => maj({ exigerArticle: (e.target as HTMLInputElement).checked })} /> Exiger l’article (de / het)</label>
            )}
          </div>
        </div>
      </section>
  )

  // « Mots » : combien de mots, et lesquels (avec les chapitres, c'est le choix des mots à réviser)
  const blocMots = (
      <section class="bloc reglages-bloc mots-bloc">
        <h2>{ex.surQuestions ? 'Questions' : 'Mots'}</h2>
        <div class="reglages">
          <div class="reglage">
            <div class="segment" role="group" aria-label="Combien de mots ?">
              {NOMBRES.map(n => <button aria-pressed={r.nombre === n} onClick={() => maj({ nombre: n })} title={n ? nombre(n, unite) : `Tous les ${unite}s`}>{n ? nombre(n, unite) : 'Tous'}</button>)}
            </div>
          </div>
          <div class="reglage">
            <div class="segment" role="group" aria-label="Quels mots ?">
              {ORDRES.map(o => <button aria-pressed={r.ordre === o.id} onClick={() => maj({ ordre: o.id })} title={o.aide}>{o.nom}</button>)}
            </div>
          </div>
        </div>
      </section>
  )


  return (
    <main class="page accueil">
      <div class="haut">
      <header class="entete">
        <Logo />
        <div class="marque">
          <h1>Woord<span class="nl">jes</span></h1>
          <MotExemple mots={choisis} />
        </div>
        {nbARevoir > 0 && <button class="second revoir" onClick={() => liste('revoir')}>À revoir ({nbARevoir})</button>}
        {nouveauxRecents && <button class="second" onClick={() => liste('nouveaux')}>Nouveaux ({nouveaux.mots.length})</button>}
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
        <Scene matieres={r.matieres} />
        <Scene matieres={r.matieres} petit />
        <div class="resume">
          <p class="titre"><IconeExercice id={ex.id} taille={22} />{ex.nom}{ex.beta && <span class="beta">bêta</span>}</p>
          {/* plusieurs matières : une par ligne, sans la description ; le sens et le nombre sont dans le bouton */}
          <p class={`detail ${r.matieres.length > 1 ? 'plusieurs' : ''}`}><NomsMatieres voc={voc} r={r} /></p>
          {/* rien à réviser : l'explication prend la place de la description, sans décaler la page */}
          {dispo === 0
            ? <p class="description-exercice alerte" role="status">Rien à réviser avec ce choix : il faut {{ dehet: 'des noms avec de/het', definitions: 'des mots avec une définition', trous: 'des mots avec un exemple', conjugaison: 'le chapitre Conjugaison de Nederlands', primitifs: 'le chapitre Conjugaison de Nederlands', interrogatif: 'le chapitre Conjugaison de Nederlands', questions: 'des questions de cours (onglet « Vragen » du tableau)' }[ex.id as string] ?? 'des mots'}.</p>
            : r.matieres.length === 1 && <p class="description-exercice">{ex.description}</p>}
        </div>
        <button class="go lancer" onClick={commencer} disabled={dispo === 0}>
          <span>Commencer ▶</span>
          <span class="sous-bouton">{resume(voc, r)}</span>
        </button>
      </section>

      {/* grand écran : matière et réglages à gauche, exercice, chapitres et mots à droite ;
          téléphone : dans l'ordre de lecture (matière, chapitres, mots, exercice, réglages) */}
      <div class="accueil-corps">
        <div class="col-choix">
      <section class="bloc">
        <h2>Matière <span class="indice-titre">+ pour en réviser plusieurs</span></h2>
        <div class="matieres">
          {voc.matieres.map(m => {
            const a = apparence(m.nom)
            const choisie = r.matieres.includes(m.nom)
            return (
              <div class={`matiere ${choisie ? 'choisie' : ''} ${a.mascotte ? `teinte-${a.mascotte}` : ''}`} data-matiere={m.nom}>
                <button class="matiere-choix" aria-pressed={choisie} onClick={() => choisirMatiere(m.nom)}>
                  {a.mascotte
                    ? <span class="medaillon" aria-hidden="true" dangerouslySetInnerHTML={{ __html: svgBuste(a.mascotte) }} />
                    : <span class="ico" aria-hidden="true">{a.icone}</span>}
                  <span class="noms"><b>{a.titre}</b><span>{a.fr}{a.fr && ' '}<Note mots={m.mots} r={r} /></span></span>
                  <span class="n">{m.mots.length}</span>
                </button>
                {!choisie
                  ? <button class="ajout" onClick={() => ajouterMatiere(m.nom)} title="Ajouter aux matières choisies" aria-label={`Ajouter ${a.titre} aux matières choisies`}>+</button>
                  : r.matieres.length > 1 && <button class="ajout" onClick={() => retirerMatiere(m.nom)} title="Retirer" aria-label={`Retirer ${a.titre}`}>−</button>}
              </div>
            )
          })}
        </div>
        <p class="astuce gauche astuce-matiere">Un clic choisit la matière. <b>+</b> pour réviser plusieurs matières ensemble.</p>
      </section>
      {large ? blocReglages : <>{blocChapitres}{blocMots}</>}
        </div>
        <div class="col-exercice">
      <section class="bloc">
        <h2>Exercice</h2>
        <div class="tuiles">
          {EXERCICES.map(e => {
            const n = aReviser(voc, r, e).length
            return (
              <button class="tuile" aria-pressed={r.exercice === e.id} onClick={() => maj({ exercice: e.id })} disabled={n === 0}
                title={n === 0 ? `${e.description} (rien à réviser avec ce choix de matière et de chapitres)` : e.description}>
                <IconeExercice id={e.id} />
                <b>{e.nom}{e.beta && <span class="beta">bêta</span>}</b>
              </button>
            )
          })}
        </div>
      </section>
      {large ? <>{blocChapitres}{blocMots}</> : blocReglages}
        </div>
      </div>
    </main>
  )
}
