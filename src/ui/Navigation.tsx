import { CalendarCheck, ChartColumn, House, List, Sparkles } from 'lucide-preact'
import { derniersAjouts, type Vocabulaire } from '../lib/mots'

// La navigation entre les pages : sur ordinateur, des liens légers dans l'en-tête de l'accueil ;
// sur téléphone, une barre d'onglets en bas de l'écran (accueil, liste des mots, suivi).
// « À revoir » et les questions de cours (feuille d'interro) sont des onglets de la liste des mots.

export type Page = 'accueil' | 'mots' | 'nouveaux' | 'suivi'

export interface Aller {
  accueil: () => void
  reviser: () => void
  nouveaux: () => void
  mots: () => void
  suivi: () => void
}

/** Le nombre de mots du dernier envoi (/cours), signalés deux semaines ; 0 ensuite. */
export function nouveauxRecents(voc: Vocabulaire): number {
  const n = derniersAjouts(voc)
  return n.mots.length > 0 && Date.now() - new Date(n.date + 'T00:00').getTime() < 14 * 86_400_000 ? n.mots.length : 0
}

const TITRE_REVISER = 'Une séance courte, toutes matières : ce qui est à revoir aujourd’hui et les erreurs récentes'
const TITRE_SUIVI = 'Régularité, récompenses, ce qui est su, erreurs qui reviennent, changer d’appareil'

/** Dans l'en-tête de l'accueil (ordinateur, tablette). */
export function NavHaut({ voc, aller, nbDuJour }: { voc: Vocabulaire; aller: Aller; nbDuJour: number }) {
  const nouveaux = nouveauxRecents(voc)
  return (
    <nav class="nav-haut" aria-label="Pages">
      {nouveaux > 0 && <button class="lien-nav" onClick={aller.nouveaux}><Sparkles size={19} strokeWidth={2} aria-hidden="true" />Nouveaux <span class="n">{nouveaux}</span></button>}
      <button class="lien-nav" onClick={aller.mots}><List size={19} strokeWidth={2} aria-hidden="true" />Mots</button>
      <button class="lien-nav" onClick={aller.suivi} title={TITRE_SUIVI}><ChartColumn size={19} strokeWidth={2} aria-hidden="true" />Suivi</button>
      {nbDuJour > 0 && <button class="go jour" onClick={aller.reviser} title={TITRE_REVISER}><CalendarCheck size={19} strokeWidth={2.2} aria-hidden="true" />Réviser aujourd’hui · {nbDuJour}</button>}
    </nav>
  )
}

/** En bas de l'écran (téléphone), sur l'accueil, la liste des mots et le suivi. */
export function NavBas({ voc, aller, nbDuJour, page }: { voc: Vocabulaire; aller: Aller; nbDuJour: number; page: Page }) {
  const nouveaux = nouveauxRecents(voc)
  const onglet = (p: Page) => (page === p ? { 'aria-current': 'page' as const } : {})
  return (
    <>
      <div class="espace-nav-bas" aria-hidden="true" />
      <nav class="nav-bas" aria-label="Pages">
        <button {...onglet('accueil')} onClick={aller.accueil}><House size={22} strokeWidth={2} aria-hidden="true" />Accueil</button>
        <button class="reviser" onClick={aller.reviser} disabled={nbDuJour === 0} title={nbDuJour ? TITRE_REVISER : 'Rien à réviser aujourd’hui'}>
          <span class="ic"><CalendarCheck size={22} strokeWidth={2} aria-hidden="true" />{nbDuJour > 0 && <span class="badge">{nbDuJour}</span>}</span>Réviser
        </button>
        {nouveaux > 0 && (
          <button {...onglet('nouveaux')} onClick={aller.nouveaux}>
            <span class="ic"><Sparkles size={22} strokeWidth={2} aria-hidden="true" /><span class="badge bleu">{nouveaux}</span></span>Nouveaux
          </button>
        )}
        <button {...onglet('mots')} onClick={aller.mots}><List size={22} strokeWidth={2} aria-hidden="true" />Mots</button>
        <button {...onglet('suivi')} onClick={aller.suivi}><ChartColumn size={22} strokeWidth={2} aria-hidden="true" />Suivi</button>
      </nav>
    </>
  )
}
