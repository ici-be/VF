import { useEffect, useState } from 'preact/hooks'
import { langueDe } from '../lib/apparence'
import { derniersAjouts, type Mot, type Vocabulaire } from '../lib/mots'
import { exercice, motsChoisis, pagesChoisies, questionsChoisies, type Reglages } from '../lib/reglages'
import { motsARevoir, type Suivi } from '../lib/progression'
import { construireSerie, type Carte } from '../lib/seance'
import { sansAccents } from '../lib/correction'
import { parler } from '../lib/voix'
import { nomChapitre } from './Accueil'
import { NomMatiere, NomsMatieres } from './Matieres'
import { SEP } from '../lib/reglages'
import { nombre } from '../lib/texte'
import { estPrimitif, NB_PRIMITIFS, PRIMITIFS, verbe } from '../lib/conjugaison'
import { apparence } from '../lib/apparence'
import { accord } from '../lib/texte'
import { FeuilleInterro } from './FeuilleInterro'
import { Glose } from './Glose'
import { BoutonSignaler, FenetreSignalement } from './Signaler'
import { Dessin, dessinDe } from './Dessin'
import { PhraseATrou } from './exercices/Questions'
import { TROU } from '../lib/mots'

export type Vue = 'tous' | 'revoir' | 'primitifs' | 'nouveaux' | 'questions'

interface Props {
  voc: Vocabulaire
  reglages: Reglages
  /** « interro » : la vue des questions, avec la feuille d'interro imprimée tout de suite */
  vueInitiale: Vue | 'interro'
  retour: () => void
  lancer: (serie: Carte[]) => void
  /** les questions ratées : avec l'exercice « Questions de cours » */
  lancerQuestions: (serie: Carte[]) => void
}

/** « aujourd'hui », « hier », « il y a 5 jours » */
function quand(ms: number): string {
  const jours = Math.floor((new Date().setHours(0, 0, 0, 0) - new Date(ms).setHours(0, 0, 0, 0)) / 86_400_000)
  return jours <= 0 ? 'aujourd’hui' : jours === 1 ? 'hier' : `il y a ${jours} jours`
}

type Tri = 'chapitre' | 'nl' | 'fr'
const cmp = (a: string, b: string) => a.localeCompare(b, 'fr', { sensitivity: 'base' })

export function Liste({ voc, reglages, vueInitiale, retour, lancer, lancerQuestions }: Props) {
  const [cherche, setCherche] = useState('')
  // le mot ou la question signalé (fenêtre « Signaler une erreur » ouverte)
  const [aSignaler, setASignaler] = useState<Mot | null>(null)
  const [tri, setTri] = useState<Tri>('chapitre')
  const [vue, setVue] = useState<Vue>(vueInitiale === 'interro' ? 'questions' : vueInitiale)
  // imprimer la feuille d'interro (questions + lignes, réponses à part) plutôt que la liste
  const [feuille, setFeuille] = useState(vueInitiale === 'interro')
  const simple = (s: string) => sansAccents(s.toLowerCase())
  const q = simple(cherche.trim())
  const choisis = motsChoisis(voc, reglages)
  const questions = questionsChoisies(voc, reglages)
  // les mots et les questions de cours ratés (à l'appli ou à une interro en classe)
  const aRevoir = motsARevoir([...choisis, ...questions])
  const suivis = new Map<string, Suivi>(aRevoir.map(x => [x.mot.id, x.suivi]))
  const motsRates = aRevoir.map(x => x.mot).filter(m => !m.vraag)
  const questionsRatees = aRevoir.map(x => x.mot).filter(m => m.vraag)
  // « mots », « questions » ou « mots et questions »
  const quoiRate = [motsRates.length && 'mot', questionsRatees.length && 'question'].filter(Boolean) as string[]
  const ratesNom = quoiRate.length ? quoiRate.map(x => x + 's').join(' et ') : 'mots'
  // rien que des questions : le tableau des questions (Vraag, Antwoord), et les accords au féminin
  const enQuestions = vue === 'questions' || (vue === 'revoir' && questionsRatees.length > 0 && !motsRates.length)
  const e = enQuestions ? 'e' : ''
  // les temps primitifs : les verbes les plus courants du choix, dans l'ordre de fréquence
  const verbesPrimitifs = choisis.filter(m => estPrimitif(m.verbe)).sort((a, b) => verbe(a.verbe!)!.rang - verbe(b.verbe!)!.rang)
  // les mots du dernier envoi /cours, toutes matières confondues (pas seulement celles choisies)
  const nouveaux = derniersAjouts(voc)
  const dateNouveaux = nouveaux.date && new Date(nouveaux.date + 'T12:00').toLocaleDateString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' })
  let mots = (vue === 'revoir' ? aRevoir.map(x => x.mot) : vue === 'primitifs' ? verbesPrimitifs : vue === 'nouveaux' ? nouveaux.mots : vue === 'questions' ? questions : choisis).filter(m =>
    !q || [m.nl, m.fr, m.definition, m.remarque, m.exemple].some(t => simple(t).includes(q)))
  // « à revoir » : dans l'ordre de priorité, sans regroupement par chapitre
  const trier = vue === 'tous' ? tri : vue === 'nouveaux' || vue === 'questions' ? 'chapitre' : null
  if (trier === 'chapitre') {
    // dans l'ordre des chapitres du tableau, même si les lignes y sont mélangées
    const rang = new Map(voc.matieres.flatMap((m, i) => m.chapitres.map((c, j) => [`${m.nom}|${c}`, i * 1000 + j] as const)))
    mots = [...mots].sort((a, b) => rang.get(`${a.matiere}|${a.chapitre}`)! - rang.get(`${b.matiere}|${b.chapitre}`)!)
  }
  if (trier === 'nl') mots = [...mots].sort((a, b) => cmp(a.nl, b.nl))
  if (trier === 'fr') mots = [...mots].sort((a, b) => cmp(a.fr.replace(/^(le |la |les |l')/i, ''), b.fr.replace(/^(le |la |les |l')/i, '')))

  // que des matières en français : titres de colonnes en français (Mot, Définition…)
  const toutFr = mots.length > 0 && mots.every(m => langueDe(m) === 'fr')
  const lignes: (Mot | { groupe: string; matiere: string; chapitre: string })[] = []
  let groupe = ''
  for (const m of mots) {
    const g = `${apparence(m.matiere).titre} · ${nomChapitre(m.chapitre)}`
    if (trier === 'chapitre' && g !== groupe) { lignes.push({ groupe: g, matiere: m.matiere, chapitre: m.chapitre }); groupe = g }
    lignes.push(m)
  }

  const ex = exercice(reglages.exercice)
  const serieARevoir = ex.surQuestions ? [] : construireSerie(motsRates, { ...reglages, nombre: 0, ordre: 'hasard' })
  const serieQuestions = construireSerie(questionsRatees, { ...reglages, exercice: 'questions', nombre: 0, ordre: 'hasard' })
  const serieNouveaux = construireSerie(nouveaux.mots, { ...reglages, nombre: 0, ordre: 'hasard' })
  // colonnes imprimées (le titre d'un chapitre les couvre toutes, sans en créer une de trop qui prendrait de la place) :
  // l'article s'il y en a, le mot, la traduction, les détails (sauf cours en français : sous la définition), « Raté »
  const avecDet = mots.some(m => m.det)
  const colonnes = (avecDet ? 1 : 0) + 2 + (toutFr ? 0 : 1) + (vue === 'revoir' ? 1 : 0)

  // titre de la page imprimée : « Biologie / Biologie — 1. De ecosystemen »
  const pages = pagesChoisies(voc, reglages)
  const titreMatieres = reglages.matieres.map(n => {
    const a = apparence(n)
    const ch = reglages.chapitres.filter(c => c.startsWith(n + SEP)).map(c => nomChapitre(c.split(SEP)[1]))
    const chapitres = (ch.length ? ch.join(', ') : 'tous les chapitres') + (pages ? `, p. ${pages.de}–${pages.a}` : '')
    return { nom: a.fr && a.fr !== a.titre ? `${a.titre} / ${a.fr}` : a.titre, chapitres }
  })
  const titreImpression = feuille ? `Interro – ${titreMatieres.map(t => `${t.nom} – ${t.chapitres}`).join(' + ')}` : vue === 'nouveaux'
    ? `Nouveaux mots – ${dateNouveaux}`
    : `${vue === 'revoir' ? 'À revoir' : vue === 'primitifs' ? 'Temps primitifs' : vue === 'questions' ? 'Questions de cours' : 'Vocabulaire'} – ${titreMatieres.map(t => `${t.nom} – ${t.chapitres}`).join(' + ')}`
  // le titre du document sert de nom au PDF enregistré depuis la fenêtre d'impression
  useEffect(() => {
    const avant = document.title
    const pendant = () => { document.title = titreImpression }
    const apres = () => { document.title = avant }
    addEventListener('beforeprint', pendant)
    addEventListener('afterprint', apres)
    return () => { removeEventListener('beforeprint', pendant); removeEventListener('afterprint', apres); document.title = avant }
  }, [titreImpression])
  // la feuille est rendue avant d'ouvrir la fenêtre d'impression, puis on revient à la liste
  useEffect(() => {
    if (!feuille) return
    const fini = () => setFeuille(false)
    addEventListener('afterprint', fini)
    print()
    return () => removeEventListener('afterprint', fini)
  }, [feuille])
  const aujourdhui = new Date().toLocaleDateString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <main class={`page liste ${feuille ? 'mode-feuille' : ''}`}>
      {/* en-tête de la page imprimée (caché à l'écran) */}
      <header class="impression">
        <h1>{vue === 'revoir' ? 'À revoir' : vue === 'primitifs' ? `Temps primitifs – les ${NB_PRIMITIFS} verbes les plus courants` : vue === 'nouveaux' ? `Nouveaux mots – ajoutés le ${dateNouveaux}` : vue === 'questions' ? 'Questions de cours' : toutFr ? 'Vocabulaire' : 'Vocabulaire néerlandais'}</h1>
        {vue !== 'nouveaux' && titreMatieres.map(t => <p class="sujet"><b>{t.nom}</b> · {t.chapitres}</p>)}
        <p class="meta">{nombre(mots.length, vue === 'primitifs' ? 'verbe' : enQuestions ? 'question' : 'mot')}{q ? ` contenant « ${cherche.trim()} »` : ''} · {aujourdhui}</p>
      </header>
      <div class="haut">
        <header class="entete">
          <button class="icone" onClick={retour} aria-label="Retour au menu">←</button>
          <h1>{vue === 'revoir' ? 'À revoir' : vue === 'primitifs' ? 'Temps primitifs' : vue === 'nouveaux' ? 'Nouveaux mots' : vue === 'questions' ? 'Questions de cours' : 'Liste des mots'}</h1>
          {vue === 'questions' && mots.length > 0 && <button class="second" onClick={() => setFeuille(true)} title="Les questions avec des lignes pour répondre, les réponses sur une page à part">🖨 Interro</button>}
          <button class="second" onClick={() => print()} title="Imprimer (Ctrl+P)">🖨 Imprimer</button>
        </header>
        <p class="etat">{vue === 'nouveaux' ? 'Toutes les matières, quel que soit le choix du menu.' : <span><NomsMatieres voc={voc} r={reglages} /> · la matière et les chapitres se choisissent dans le menu.</span>}</p>
      </div>
      <div class="segment">
        <button aria-pressed={vue === 'tous'} onClick={() => setVue('tous')}>Tous les mots <span class="n">{choisis.length}</span></button>
        <button aria-pressed={vue === 'revoir'} onClick={() => setVue('revoir')}>À revoir <span class="n">{aRevoir.length}</span></button>
        {verbesPrimitifs.length > 0 && (
          <button aria-pressed={vue === 'primitifs'} onClick={() => setVue('primitifs')}>Temps primitifs <span class="n">{verbesPrimitifs.length}</span></button>
        )}
        {questions.length > 0 && (
          <button aria-pressed={vue === 'questions'} onClick={() => setVue('questions')}>Questions <span class="n">{questions.length}</span></button>
        )}
        {nouveaux.mots.length > 0 && (
          <button aria-pressed={vue === 'nouveaux'} onClick={() => setVue('nouveaux')}>Nouveaux <span class="n">{nouveaux.mots.length}</span></button>
        )}
      </div>
      {vue === 'revoir' && (
        <div class="bandeau">
          <p>{aRevoir.length > 1 ? `Les ${aRevoir.length} ${ratesNom} raté${e}s` : aRevoir.length === 1 ? (enQuestions ? 'La question ratée' : 'Le mot raté') : 'Les mots ratés'} ces 30 derniers jours (à l’appli ou à une interro en classe) et pas encore {accord(aRevoir.length, `rattrapé${e}`)}, les plus souvent raté{e}s d’abord (30 au maximum). Ce qui est réussi plusieurs fois de suite sort de la liste.</p>
          {motsRates.length > 0 && (
            serieARevoir.length
              ? <button class="go" onClick={() => lancer(serieARevoir)}>S’entraîner sur {motsRates.length > 1 ? 'ces mots' : 'ce mot'} · {ex.nom} ▶</button>
              : <p class="astuce gauche">L’exercice « {ex.nom} » ne convient à aucun de ces mots : choisis-en un autre dans le menu.</p>
          )}
          {serieQuestions.length > 0 && (
            <button class="go" onClick={() => lancerQuestions(serieQuestions)}>S’entraîner sur {questionsRatees.length > 1 ? 'ces questions' : 'cette question'} · Questions de cours ▶</button>
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
        <input type="search" id="cherche" placeholder={enQuestions ? 'Chercher une question…' : 'Chercher un mot…'} value={cherche} onInput={e => setCherche((e.target as HTMLInputElement).value)} />
        {vue === 'tous' && (
          <div class="segment">
            <button aria-pressed={tri === 'chapitre'} onClick={() => setTri('chapitre')}>Par chapitre</button>
            <button aria-pressed={tri === 'nl'} onClick={() => setTri('nl')}>{toutFr ? 'A→Z mot' : 'A→Z NL'}</button>
            <button aria-pressed={tri === 'fr'} onClick={() => setTri('fr')}>{toutFr ? 'A→Z définition' : 'A→Z FR'}</button>
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
        ? <p class="vide">{vue === 'revoir' && !q ? 'Rien de raté récemment dans ce choix. Bravo ! 🎉' : vue === 'questions' ? 'Aucune question ne correspond.' : 'Aucun mot ne correspond.'}</p>
        : (
          <div class={`tableau ${enQuestions ? 'questions' : ''} ${toutFr ? 'tout-fr' : ''} ${avecDet ? '' : 'sans-det'}`}>
            <table>
              <thead><tr><th></th>{enQuestions ? (toutFr ? <><th>Question</th><th>Réponse</th></> : <><th>Vraag</th><th>Antwoord</th></>) : toutFr ? <><th>Mot</th><th>Définition</th></> : <><th>Nederlands</th><th>Français</th></>}<th class="details">{enQuestions ? '' : 'Définition · exemple · remarque'}</th>{vue === 'revoir' && <th>Raté</th>}</tr></thead>
              <tbody>
                {lignes.map(l => 'groupe' in l
                  ? <tr class={`chap ${lignes.filter(x => 'groupe' in x).length === 1 ? 'seul' : ''}`}><td colSpan={colonnes}><NomMatiere nom={l.matiere} /> · {nomChapitre(l.chapitre)}</td></tr>
                  : (
                    <tr>
                      <td class="det">{l.det}</td>
                      <td class={`nl ${l.vraag ? 'vraag' : ''}`}>
                        {/* le terme à gauche (il passe à la ligne s'il le faut), écouter et signaler groupés à droite */}
                        <div class="cellule-mot">
                          <span class="terme" lang={langueDe(l)}>
                            {l.det && <span class="det-court">{l.det} </span>}
                            {l.vraag ? (TROU.test(l.nl) ? <PhraseATrou phrase={l.nl} matiere={l.matiere} /> : <Glose texte={l.nl} matiere={l.matiere} />) : l.nl}
                            {l.vraag?.interro && <span class="tag-interro">{l.vraag.interro}</span>}
                          </span>
                          <span class="actions-mot">
                            <button class="ecouter" onClick={() => parler(l.det ? `${l.det} ${l.nl}` : l.nl, langueDe(l))} aria-label={`Écouter ${l.nl}`} title="Écouter">🔊</button>
                            {l.getal === undefined && <BoutonSignaler classe="signaler-ligne" onClick={() => setASignaler(l)} />}
                          </span>
                        </div>
                      </td>
                      <td>
                        {dessinDe(l)
                          ? <div class="def-avec-dessin"><div>{l.fr}<Details m={l} /></div><Dessin m={l} /></div>
                          : <>{l.fr}<Details m={l} /></>}
                      </td>
                      {/* à l'impression, les détails passent dans leur propre colonne (une ligne par mot) */}
                      <td class="details"><Details m={l} /></td>
                      {vue === 'revoir' && (() => {
                        const su = suivis.get(l.id)!
                        return (
                          <td class="rate">{su.rates}×<span class="extra">{quand(su.dernierRate!)}</span>
                            {l.rate && <span class="extra interro-rate" title={l.rate.interro}>{l.rate.interro.replace(/\s*[–-]\s*[\d/]+$/, '')} : {l.rate.reponse ? <>« {l.rate.reponse} »</> : 'pas de réponse'}</span>}
                          </td>
                        )
                      })()}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      {aSignaler && <FenetreSignalement mot={aSignaler} fermer={() => setASignaler(null)} />}
      {vue === 'questions' && feuille && <FeuilleInterro questions={mots} titre="Questions de cours" sujets={titreMatieres} />}
    </main>
  )
}

function Details({ m }: { m: Mot }) {
  return (
    <>
      {m.definition && m.definition !== m.fr && <span class="extra"><i>Définition :</i> <Glose texte={m.definition} matiere={m.matiere} exclure={[m.nl]} /></span>}
      {m.exemple && <span class="extra"><i>Exemple :</i> {m.exemple.replace(/[\[\]]/g, '')}</span>}
      {m.remarque && <span class="extra"><i>Remarque :</i> {m.remarque}</span>}
    </>
  )
}
