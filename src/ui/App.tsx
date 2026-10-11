import { useEffect, useRef, useState } from 'preact/hooks'
import { telechargerVocabulaire, vocabulaireEnCache, type Vocabulaire } from '../lib/mots'
import { appliquerRates } from '../lib/progression'
import { glossaire } from '../lib/glossaire'
import { surveillerEnvois } from '../lib/signalements'
import { estUnTransfert, importerTransfert } from '../lib/transfert'
import { aReviserAujourdhui } from '../lib/revision'
import { Suivi } from './Suivi'
import { aReviser, chargerReglages, enregistrerReglages, reglagesDuLien, type Reglages } from '../lib/reglages'
import { construireSerie, type Carte } from '../lib/seance'
import { Accueil } from './Accueil'
import { Seance, type Bilan } from './Seance'
import { Fin } from './Fin'
import { Liste, type Vue } from './Liste'
import { MotsCroises } from './MotsCroises'
import { exercice } from '../lib/reglages'
import type { Mot } from '../lib/mots'

export type Chargement =
  | { etat: 'chargement' }
  | { etat: 'ok' }
  | { etat: 'hors-ligne'; message: string }

type Ecran =
  | { nom: 'accueil' }
  | { nom: 'seance'; serie: Carte[]; cle: number }
  | { nom: 'fin'; bilan: Bilan }
  | { nom: 'liste'; vue: Vue | 'interro' }
  | { nom: 'jeu'; mots: Mot[]; cle: number }
  | { nom: 'suivi' }

/** Les erreurs des interros en classe (colonne « Raté ») rejoignent les mots « à revoir ». */
function avecRates(voc: Vocabulaire | null): Vocabulaire | null {
  if (voc) appliquerRates(voc.matieres.flatMap(m => [...m.mots, ...(m.questions ?? [])]))
  return voc
}

export function App() {
  const [voc, setVoc] = useState<Vocabulaire | null>(() => avecRates(vocabulaireEnCache()))
  const [chargement, setChargement] = useState<Chargement>({ etat: 'chargement' })
  const [reglages, setReglagesBruts] = useState<Reglages>(() => chargerReglages(voc))
  const [ecran, setEcran] = useState<Ecran>({ nom: 'accueil' })

  // les traductions montrées au survol des mots néerlandais (questions, définitions)
  if (voc) glossaire(voc)

  const setReglages = (r: Reglages) => { setReglagesBruts(r); enregistrerReglages(r) }

  const actualiser = async () => {
    setChargement({ etat: 'chargement' })
    try {
      const v = await telechargerVocabulaire()
      setVoc(avecRates(v))
      // les réglages enregistrés, nettoyés de ce qui n'existe plus dans le tableau
      setReglagesBruts(chargerReglages(v))
      setChargement({ etat: 'ok' })
    } catch (e) {
      setChargement({ etat: 'hors-ligne', message: e instanceof Error && !/fetch/i.test(e.message) ? e.message : 'Pas de connexion internet.' })
    }
  }
  useEffect(() => { actualiser() }, [])
  // les signalements restés sur l'appareil (pas de réseau) partent dès que possible
  useEffect(() => { surveillerEnvois() }, [])
  // un petit bandeau en haut de l'écran (lien de transfert importé…), qui s'efface tout seul
  const [annonce, setAnnonce] = useState<string | null>(null)
  useEffect(() => {
    if (!annonce) return
    const t = setTimeout(() => setAnnonce(null), 7000)
    return () => clearTimeout(t)
  }, [annonce])
  // un lien de transfert (progression d'un autre appareil) : à l'ouverture, ou collé dans l'onglet ouvert
  useEffect(() => {
    const importer = async () => {
      if (!estUnTransfert(location.hash)) return
      const n = await importerTransfert(location.hash)
      history.replaceState(null, '', location.pathname + location.search)
      setAnnonce(n === null ? 'Ce lien de transfert est illisible (incomplet ?) : rien n’a changé.' : `Progression de l’autre appareil réunie avec celle-ci : ${n} ${n > 1 ? 'mots repris' : 'mot repris'}.`)
      setReglagesBruts(r => ({ ...r }))
    }
    importer()
    addEventListener('hashchange', importer)
    return () => removeEventListener('hashchange', importer)
  }, [])

  // le geste « retour » du téléphone (ou le bouton ← du navigateur) ramène à l'accueil au lieu
  // de quitter le site : hors de l'accueil, une entrée est ajoutée à l'historique ; le retour la
  // consomme. Revenu à l'accueil par un bouton de l'appli, on la retire pour ne pas la laisser traîner.
  const empile = useRef(false)
  useEffect(() => {
    if (ecran.nom !== 'accueil' && !empile.current) {
      history.pushState({ woordjes: 'ecran' }, '')
      empile.current = true
    } else if (ecran.nom === 'accueil' && empile.current) {
      empile.current = false
      history.back()
    }
  }, [ecran.nom])
  useEffect(() => {
    const retour = () => {
      if (!empile.current) return
      empile.current = false
      setEcran({ nom: 'accueil' })
    }
    addEventListener('popstate', retour)
    return () => removeEventListener('popstate', retour)
  }, [])
  // un permalien collé dans l'onglet déjà ouvert : seule la fin de l'adresse (#r=…) change,
  // la page ne se recharge pas ; on applique ses réglages et on revient à l'accueil
  useEffect(() => {
    const lien = () => {
      if (!reglagesDuLien(location.hash)) return
      setReglagesBruts(chargerReglages(voc))
      setEcran({ nom: 'accueil' })
    }
    addEventListener('hashchange', lien)
    return () => removeEventListener('hashchange', lien)
  }, [voc])

  const lancer = (serie?: Carte[]) => {
    if (!voc) return
    if (exercice(reglages.exercice).jeu) {
      // une trentaine de mots (les plus utiles d'abord, selon « Quels mots ? ») parmi lesquels la grille choisit
      const cartes = serie ?? construireSerie(aReviser(voc, reglages), { ...reglages, nombre: 30 })
      setEcran({ nom: 'jeu', mots: cartes.map(c => c.mot), cle: Date.now() })
      return
    }
    setEcran({ nom: 'seance', serie: serie ?? construireSerie(aReviser(voc, reglages), reglages), cle: Date.now() })
  }

  if (!voc) {
    return (
      <main class="page">
        <div class="vide">
          {chargement.etat === 'chargement'
            ? <p>Chargement du vocabulaire…</p>
            : <>
                <p>Le vocabulaire n’a pas pu être chargé : {chargement.etat === 'hors-ligne' ? chargement.message : ''}</p>
                <p>Il faut une connexion internet la première fois.</p>
                <button class="go" onClick={actualiser}>Réessayer</button>
              </>}
        </div>
      </main>
    )
  }

  // « Réviser aujourd'hui » : la séance du jour, toutes matières confondues
  const nbDuJour = aReviserAujourdhui(voc).length
  const reviserAujourdhui = () => setEcran({ nom: 'seance', serie: aReviserAujourdhui(voc), cle: Date.now() })

  const vue = (() => {
  switch (ecran.nom) {
    case 'suivi':
      return <Suivi voc={voc} retour={() => setEcran({ nom: 'accueil' })} reviser={reviserAujourdhui} nbDuJour={nbDuJour} />
    case 'seance':
      return (
        <Seance
          key={ecran.cle}
          serie={ecran.serie}
          voc={voc}
          reglages={reglages}
          setReglages={setReglages}
          quitter={() => setEcran({ nom: 'accueil' })}
          terminer={bilan => setEcran({ nom: 'fin', bilan })}
        />
      )
    case 'jeu':
      return <MotsCroises key={ecran.cle} mots={ecran.mots} reglages={reglages} quitter={() => setEcran({ nom: 'accueil' })} rejouer={() => lancer()} />
    case 'fin':
      return (
        <Fin
          bilan={ecran.bilan}
          reglages={reglages}
          rejouer={lancer}
          accueil={() => setEcran({ nom: 'accueil' })}
        />
      )
    case 'liste':
      return <Liste key={ecran.vue} voc={voc} reglages={reglages} vueInitiale={ecran.vue} retour={() => setEcran({ nom: 'accueil' })} lancer={lancer}
        lancerQuestions={serie => { setReglages({ ...reglages, exercice: 'questions' }); setEcran({ nom: 'seance', serie, cle: Date.now() }) }} />
    default:
      return (
        <Accueil
          voc={voc}
          chargement={chargement}
          actualiser={actualiser}
          reglages={reglages}
          setReglages={setReglages}
          lancer={() => lancer()}
          liste={(vue: Vue | 'interro') => setEcran({ nom: 'liste', vue })}
          suivi={() => setEcran({ nom: 'suivi' })}
          reviserAujourdhui={reviserAujourdhui}
          nbDuJour={nbDuJour}
        />
      )
  }
  })()
  return <>{annonce && <div class="annonce-app" role="status"><span>{annonce}</span><button class="icone" onClick={() => setAnnonce(null)} aria-label="Fermer">✕</button></div>}{vue}</>
}

