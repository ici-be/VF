import { useEffect, useRef, useState } from 'preact/hooks'
import { contenu, type Vocabulaire } from '../lib/mots'
import { NavHaut } from './Navigation'
import {
  EXERCICES, aReviser, bornesPages, chapitreSeul, cleChapitre, exercice, lienReglages, motsChoisis, SEP,
  type ExerciceId, type Ordre, type Reglages, type Sens,
} from '../lib/reglages'
import type { Chargement } from './App'
import { apparence, langueMatiere } from '../lib/apparence'
import { noteSur20, recordDeJours, RECOMPENSES } from '../lib/progression'
import { lire, ecrire } from '../lib/stockage'
import { confettis } from '../lib/confettis'
import { SURPRISES, interrompre, surprendre } from '../lib/surprises'
import type { Vue } from './Liste'
import { niveauNote, nombre, note } from '../lib/texte'
import type { Mot } from '../lib/mots'
import { TEMPS } from '../lib/conjugaison'
import { IconeExercice } from './icones'
import { ArrowRight, Check, Link } from 'lucide-preact'
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
/** les nombres : on passe des chiffres aux lettres néerlandaises, ou l'inverse */
const SENS_NOMBRES: Record<Sens, string> = { 'nl-fr': 'Lettres → chiffres', 'fr-nl': 'Chiffres → lettres', mix: 'Mélangé' }
const nomSens = (s: Sens, ex: ExerciceId) => (ex === 'getallen' ? SENS_NOMBRES[s] : SENS.find(x => x.id === s)!.nom)
const NOMBRES = [10, 20, 30, 0]
const ORDRES: { id: Ordre; nom: string; aide: string }[] = [
  { id: 'fragiles', nom: 'À revoir', aide: 'Les mots ratés ou pas encore sus d’abord' },
  { id: 'hasard', nom: 'Au hasard', aide: 'Des mots tirés au hasard' },
  { id: 'tableau', nom: 'Dans l’ordre', aide: 'Dans l’ordre du tableau' },
]

/** La note de maîtrise d'un groupe de mots, s'il a déjà été travaillé. */
function Note({ mots, r }: { mots: Mot[]; r: Reglages }) {
  // les notes ne s'affichent que si on l'a demandé dans les réglages
  const n = r.notes ? noteSur20(mots) : null
  return n === null ? null : (
    <span class={`note ${niveauNote(n)}`} title="Ce que tu sais déjà : un mot compte comme su après 3 bonnes réponses sans erreur">{note(n)}</span>
  )
}

/** Les pages du chapitre choisi sur lesquelles porte l'exercice : « Pages [5] à [12] ». */
function Pages({ cle, bornes, r, maj, n, unite }: {
  cle: string
  bornes: [number, number]
  r: Reglages
  maj: (p: Partial<Reglages>) => void
  n: number
  unite: string
}) {
  const [min, max] = bornes
  const [de, a] = r.pages[cle] ?? bornes
  const limite = !!r.pages[cle]
  const changer = (i: 0 | 1, champ: HTMLInputElement) => {
    const p: [number, number] = [de, a]
    p[i] = Math.min(max, Math.max(min, Math.round(Number(champ.value)) || bornes[i]))
    if (p[0] > p[1]) p.reverse()
    champ.value = String(p[i])   // une page hors du chapitre est ramenée dans ses bornes
    const pages = { ...r.pages }
    // tout le chapitre : rien à retenir
    if (p[0] <= min && p[1] >= max) delete pages[cle]
    else pages[cle] = p
    maj({ pages })
  }
  return (
    <div class={`pages-chapitre ${limite ? 'limite' : ''}`}>
      <label for="page-de">Pages</label>
      <input id="page-de" type="number" inputMode="numeric" min={min} max={max} value={de} onChange={e => changer(0, e.target as HTMLInputElement)} aria-label="Première page" />
      <span>à</span>
      <input type="number" inputMode="numeric" min={min} max={max} value={a} onChange={e => changer(1, e.target as HTMLInputElement)} aria-label="Dernière page" />
      {limite
        ? <button class="lien" onClick={() => { const pages = { ...r.pages }; delete pages[cle]; maj({ pages }) }}>tout le chapitre (p. {min}–{max})</button>
        : <span class="astuce-pages">tout le chapitre</span>}
      {limite && <span class="astuce-pages">{nombre(n, unite)}</span>}
    </div>
  )
}

/** Une petite icône discrète : copie le permalien de ces réglages. */
function CopierLien({ r }: { r: Reglages }) {
  const [copie, setCopie] = useState(false)
  const copier = async () => {
    try {
      await navigator.clipboard.writeText(lienReglages(r))
      setCopie(true)
      setTimeout(() => setCopie(false), 2000)
    } catch {
      prompt('Copier le lien :', lienReglages(r))
    }
  }
  return (
    <button class={`copier-lien ${copie ? 'copie' : ''}`} onClick={copier} title={copie ? 'Lien copié' : 'Copier le lien vers ces réglages (matière, chapitres, pages, exercice…)'} aria-label="Copier le lien vers ces réglages">
      {copie ? <Check size={15} strokeWidth={2.4} /> : <Link size={15} strokeWidth={2} />}
      {copie && <span>Lien copié</span>}
    </button>
  )
}

/** Ce qu'on compte : « mot », « question », « calcul »… */
const uniteDe = (ex: ReturnType<typeof exercice>) => ex.unite ?? (ex.surQuestions ? 'question' : 'mot')

/** « NL → FR · 20 mots », sous « Commencer » */
export function resume(voc: Vocabulaire, r: Reglages): string {
  const ex = exercice(r.exercice)
  const dispo = aReviser(voc, r, ex).length
  const n = r.nombre > 0 ? Math.min(r.nombre, dispo) : dispo
  // le sens (NL → FR…) seulement si une matière en néerlandais est choisie : pas en maths, en français, en religion
  const avecSens = ex.avecSens && r.matieres.some(m => langueMatiere(m) === 'nl')
  return [avecSens ? nomSens(r.sens, ex.id) : '', nombre(n, uniteDe(ex))]
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
  liste: (vue: Vue | 'interro') => void
  /** la page de suivi */
  suivi: () => void
  /** « Réviser aujourd'hui » : la séance du jour, toutes matières confondues */
  reviserAujourdhui: () => void
  nbDuJour: number
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

export function Accueil({ voc, chargement, actualiser, reglages: r, setReglages, lancer, liste, suivi, reviserAujourdhui, nbDuJour }: Props) {
  const large = useLarge()
  const maj = (p: Partial<Reglages>) => setReglages({ ...r, ...p })
  const ex = exercice(r.exercice)
  const choisis = motsChoisis(voc, r)
  const dispo = aReviser(voc, r, ex).length
  const unite = uniteDe(ex)
  // la conjugaison et les nombres n'existent que dans Nederlands : leurs exercices n'apparaissent que si cette matière est choisie
  // le sens NL → FR n'a de sens que pour une matière en néerlandais
  const avecSens = r.matieres.some(n => langueMatiere(n) === 'nl')
  const avecNederlands = voc.matieres.some(m => r.matieres.includes(m.nom) && m.mots.some(x => x.verbe || x.getal !== undefined))
  // un exercice de Nederlands choisi alors que Nederlands ne l'est plus : on passe au QCM
  // un exercice fabriqué pour une matière (Eeuwen, calcul, natures) : seulement si elle est choisie
  const pourLesMatieres = (e: typeof ex) => !e.pourMatiere || r.matieres.some(n => e.pourMatiere!.test(n))
  useEffect(() => { if ((ex.nederlands && !avecNederlands) || !pourLesMatieres(ex)) maj({ exercice: 'qcm' }) }, [ex.nederlands, avecNederlands, ex.id, r.matieres.join('|')])
  // les mots et les questions de cours ratés (à l'appli ou à une interro en classe)
  // une récompense gagnée (série de jours) : annoncée une fois, avec des confettis et la surprise jouée
  const [nouvelle, setNouvelle] = useState<typeof RECOMPENSES[number] | null>(null)
  useEffect(() => {
    const vues = lire<number[]>('recompenses-vues', [])
    const r2 = RECOMPENSES.find(x => recordDeJours() >= x.jours && !vues.includes(x.jours))
    if (!r2) return
    ecrire('recompenses-vues', [...vues, r2.jours])
    setNouvelle(r2)
    confettis(120)
    setTimeout(() => {
      const svg = [...document.querySelectorAll<SVGSVGElement>('.reprendre svg.mascotte')].find(x => x.getBoundingClientRect().width > 0)
      const surprise = SURPRISES.find(x => x.id === r2.surprise)
      if (svg && surprise) { interrompre(svg); surprendre(svg, surprise) }
    }, 1200)
  }, [])

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

  // un nouveau choix de matières ou de chapitres où l'exercice choisi n'a rien (Religion et ses seules questions,
  // Français et le QCM, le chapitre « Calcul mental (entraînement) » et le QCM, « 1. Calcul mental » et le calcul mental) :
  // on passe au QCM s'il trouve de quoi réviser, sinon au premier exercice qui en trouve
  const avecChoix = (p: Partial<Reglages>) => {
    const r2 = { ...r, ...p }
    if (aReviser(voc, r2).length > 0) return maj(p)
    const ex2 = [exercice('qcm'), ...EXERCICES].find(e => !e.jeu && aReviser(voc, r2, e).length > 0)
    maj(ex2 ? { ...p, exercice: ex2.id } : p)
  }
  // un clic choisit cette matière seule ; « + » l'ajoute aux autres, « − » la retire
  const choisirMatiere = (nom: string) => avecChoix({ matieres: [nom] })
  const ajouterMatiere = (nom: string) => avecChoix({ matieres: [...r.matieres, nom] })
  const retirerMatiere = (nom: string) => { if (r.matieres.length > 1) avecChoix({ matieres: r.matieres.filter(m => m !== nom) }) }
  const basculerChapitre = (cle: string) =>
    avecChoix({ chapitres: r.chapitres.includes(cle) ? r.chapitres.filter(c => c !== cle) : [...r.chapitres, cle] })
  const tousChapitres = (matiere: string) => avecChoix({ chapitres: r.chapitres.filter(c => !c.startsWith(matiere + SEP)) })
  // un seul chapitre choisi : on peut n'en garder que quelques pages (la prochaine interro)
  const seul = chapitreSeul(voc, r)
  const bornes = seul && bornesPages(voc, seul.matiere, seul.chapitre)

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
                      {nomChapitre(c)} <span class="n">{contenu(m).filter(x => x.chapitre === c).length}</span>
                      <Note mots={contenu(m).filter(x => x.chapitre === c)} r={r} />
                    </button>
                  )
                })}
              </div>
              {seul?.matiere === m.nom && bornes && <Pages cle={seul.cle} bornes={bornes} r={r} maj={maj} n={dispo} unite={unite} />}
            </div>
          )
        })}
      </section>
  )
  const blocReglages = (
      <section class="bloc reglages-bloc">
        <h2>Réglages</h2>
        <div class="reglages">
          {ex.avecSens && avecSens && (
            <div class="reglage">
              <span class="lbl">Sens</span>
              <div class="segment">
                {SENS.map(s => <button aria-pressed={r.sens === s.id} onClick={() => maj({ sens: s.id })}>{nomSens(s.id, ex.id)}</button>)}
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
        <NavHaut voc={voc} nbDuJour={nbDuJour} aller={{ accueil: () => {}, reviser: reviserAujourdhui, nouveaux: () => liste('nouveaux'), mots: () => liste('tous'), suivi }} />
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

      {nouvelle && (
        <div class="bandeau-recompense" role="status">
          <span><b>Nouvelle surprise gagnée : {nouvelle.nom} !</b> {nouvelle.jours} jours de révision d’affilée. {nouvelle.texte}</span>
          <button class="icone" onClick={() => setNouvelle(null)} aria-label="Fermer">✕</button>
        </div>
      )}
      <section class="reprendre" aria-label="Exercice choisi">
        <Scene matieres={r.matieres} />
        <Scene matieres={r.matieres} petit />
        <div class="resume">
          <p class="titre"><IconeExercice id={ex.id} taille={22} />{ex.nom}{ex.beta && <span class="beta">bêta</span>}<CopierLien r={r} /></p>
          {/* plusieurs matières : une par ligne, sans la description ; le sens et le nombre sont dans le bouton */}
          <p class={`detail ${r.matieres.length > 1 ? 'plusieurs' : ''}`}><NomsMatieres voc={voc} r={r} /></p>
          {/* rien à réviser : l'explication prend la place de la description, sans décaler la page */}
          {dispo === 0
            ? <p class="description-exercice alerte" role="status">Rien à réviser avec ce choix : il faut {{ dehet: 'des noms avec de/het', definitions: 'des mots avec une définition', trous: 'des mots avec un exemple', conjugaison: 'le chapitre Conjugaison de Nederlands', primitifs: 'le chapitre Conjugaison de Nederlands', interrogatif: 'le chapitre Conjugaison de Nederlands', getallen: 'la matière Nederlands', questions: 'des questions de cours (onglet « Vragen » du tableau)' }[ex.id as string] ?? 'des mots'}.</p>
            : r.matieres.length === 1 && <p class="description-exercice">{ex.description}</p>}
        </div>
        <button class="go lancer" onClick={commencer} disabled={dispo === 0}>
          <span class="textes">
            <span class="titre-bouton">Commencer</span>
            <span class="sous-bouton">{resume(voc, r)}</span>
          </span>
          <span class="fleche" aria-hidden="true"><ArrowRight size={20} strokeWidth={2.4} /></span>
        </button>
      </section>

      {/* grand écran : matière à gauche ; exercice, chapitres, mots et réglages à droite ;
          téléphone : dans l'ordre de lecture (matière, chapitres, mots, exercice, réglages) */}
      <div class="accueil-corps">
        <div class="col-choix">
      <section class="bloc">
        <h2>Matière <span class="indice-titre">+ pour en réviser plusieurs</span></h2>
        <div class="matieres">
          {/* les matières en néerlandais (immersion) d'abord, puis celles données en français */}
          {[...voc.matieres].sort((a, b) => Number(langueMatiere(a.nom) === 'fr') - Number(langueMatiere(b.nom) === 'fr')).map(m => {
            const a = apparence(m.nom)
            const choisie = r.matieres.includes(m.nom)
            return (
              <div class={`matiere ${choisie ? 'choisie' : ''} ${a.mascotte ? `teinte-${a.mascotte}` : ''}`} data-matiere={m.nom}>
                <button class="matiere-choix" aria-pressed={choisie} onClick={() => choisirMatiere(m.nom)}>
                  {a.mascotte
                    ? <span class="medaillon" aria-hidden="true" dangerouslySetInnerHTML={{ __html: svgBuste(a.mascotte) }} />
                    : <span class="ico" aria-hidden="true">{a.icone}</span>}
                  <span class="noms"><b>{a.titre}</b><span>{a.fr}{a.fr && ' '}<Note mots={contenu(m)} r={r} /></span></span>
                  <span class="n">{contenu(m).filter(x => !x.genere).length}</span>
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
      {!large && <>{blocChapitres}{blocMots}</>}
        </div>
        <div class="col-exercice">
      <section class="bloc">
        <h2>Exercice</h2>
        <div class="tuiles">
          {EXERCICES.filter(e => (!e.nederlands || avecNederlands) && pourLesMatieres(e)).map(e => {
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
      {large ? <>{blocChapitres}{blocMots}{blocReglages}</> : blocReglages}
        </div>
      </div>
    </main>
  )
}
