import { useEffect, useState } from 'preact/hooks'
import { telechargerVocabulaire, vocabulaireEnCache, type Vocabulaire } from '../lib/mots'
import { appliquerRates } from '../lib/progression'
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

  switch (ecran.nom) {
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
        />
      )
  }
}

