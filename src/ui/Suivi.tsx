import { useEffect, useRef, useState } from 'preact/hooks'
import { TROU, type Mot, type Vocabulaire } from '../lib/mots'
import { journal, motsARevoir, recordDeJours, RECOMPENSES, REPONSES_PAR_JOUR, serieDeJours, suivi } from '../lib/progression'
import { apparence } from '../lib/apparence'
import { dateCourte, nomChapitre } from './Accueil'
import { CircleCheck } from 'lucide-preact'
import { NomMatiere } from './Matieres'
import { lienTransfert } from '../lib/transfert'
import { copierBientot, raccourcir } from '../lib/liens'
import { lienUtilisateur, nomUtilisateur } from '../lib/utilisateur'
import { svgMascotte, type Mascotte } from '../lib/mascottes'
import { SURPRISES, interrompre, surprendre } from '../lib/surprises'
import { nombre } from '../lib/texte'

// La page de suivi (pour les parents, et pour l'élève) : la régularité, les récompenses, ce qui est su
// par matière et par chapitre, les erreurs qui reviennent, et le lien pour changer d'appareil.
// Tout vient de cet appareil : rien n'est envoyé nulle part.

interface Props {
  voc: Vocabulaire
  retour: () => void
  /** « Réviser aujourd'hui » : la séance du jour */
  reviser: () => void
  nbDuJour: number
}

/** Ce qu'on suit : les mots et les questions, sans les formes conjuguées, les nombres ni les cartes fabriquées. */
const suivis = (mots: Mot[]) => mots.filter(m => !m.verbe && m.getal === undefined && !m.genere)

/** su (3 bonnes réponses sans erreur depuis), en cours (déjà vu), jamais vu */
function bilan(mots: Mot[]) {
  let su = 0, enCours = 0
  for (const m of mots) {
    const s = suivi(m.id)
    if (!s) continue
    if (s.boite >= 3) su++
    else enCours++
  }
  return { su, enCours, jamais: mots.length - su - enCours, total: mots.length }
}

function Barre({ b }: { b: ReturnType<typeof bilan> }) {
  const pc = (n: number) => `${b.total ? (n / b.total) * 100 : 0}%`
  return (
    <div class="barre-suivi" role="img" aria-label={`${b.su} sus, ${b.enCours} en cours, ${b.jamais} jamais vus sur ${b.total}`}>
      <span class="su" style={{ width: pc(b.su) }} /><span class="en-cours" style={{ width: pc(b.enCours) }} />
    </div>
  )
}

/** La colonne « Su » : ce qui est su, et en dessous ce qui est en cours (pour que les premiers progrès se voient). */
const Su = ({ b }: { b: ReturnType<typeof bilan> }) => (
  <td class="nombre">{b.su}/{b.total}{b.enCours > 0 && <span class="en-cours-nb">{b.enCours} en cours</span>}</td>
)

const jourIso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** Les 5 dernières semaines, du lundi au dimanche : une case par jour, plus foncée selon le nombre de réponses. */
function Calendrier() {
  const j = journal()
  const auj = new Date()
  // le lundi d'il y a quatre semaines : cinq semaines en tout, jusqu'à aujourd'hui
  const debut = new Date(auj)
  debut.setDate(auj.getDate() - 28)
  debut.setDate(debut.getDate() - ((debut.getDay() + 6) % 7))
  const jours: Date[] = []
  for (let d = new Date(debut); d <= auj; d.setDate(d.getDate() + 1)) jours.push(new Date(d))
  const niveau = (n: number) => (n === 0 ? 0 : n < REPONSES_PAR_JOUR ? 1 : n < 40 ? 2 : 3)
  return (
    <div class="calendrier">
      {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(x => <span class="entete-jour">{x}</span>)}
      {jours.map(d => {
        const n = j[jourIso(d)] ?? 0
        return <span class={`jour n${niveau(n)} ${jourIso(d) === jourIso(auj) ? 'aujourdhui' : ''}`}
          title={`${d.toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'long' })} : ${nombre(n, 'réponse')}`} />
      })}
    </div>
  )
}

/** Une récompense : la mascotte qui la joue (si débloquée), ou ce qu'il reste à faire. */
function Recompense({ r, record, mascotte }: { r: typeof RECOMPENSES[number]; record: number; mascotte: Mascotte }) {
  const scene = useRef<HTMLDivElement>(null)
  const ok = record >= r.jours
  const voir = () => {
    const svg = scene.current?.querySelector<SVGSVGElement>('svg.mascotte')
    const s = SURPRISES.find(x => x.id === r.surprise)
    if (!svg || !s) return
    interrompre(svg)
    surprendre(svg, s)
  }
  return (
    <li class={`recompense ${ok ? 'gagnee' : 'a-gagner'}`}>
      <div class="mini-scene acteur" ref={scene} dangerouslySetInnerHTML={{ __html: svgMascotte(mascotte) }} />
      <div class="texte">
        <b>{r.nom}</b>
        <span>{r.texte}</span>
        <span class="condition">{ok ? `Gagnée : ${r.jours} jours de révision d’affilée.` : `À gagner : ${r.jours} jours d’affilée (record : ${record}).`}</span>
      </div>
      {ok && <button class="second" onClick={voir}>Voir</button>}
    </li>
  )
}

export function Suivi({ voc, retour, reviser, nbDuJour }: Props) {
  const [ouverte, setOuverte] = useState<string | null>(null)
  const [lien, setLien] = useState<{ etat: 'rien' | 'copie' | 'a-copier'; texte?: string }>({ etat: 'rien' })
  const serie = serieDeJours(), record = recordDeJours()
  const tous = suivis(voc.matieres.flatMap(m => [...m.mots, ...(m.questions ?? [])]))
  const erreurs = tous.map(m => ({ m, s: suivi(m.id) })).filter(x => x.s && x.s.rates >= 2)
    .sort((a, b) => b.s!.rates - a.s!.rates || a.s!.boite - b.s!.boite).slice(0, 12)
  const mascotte = (voc.matieres.map(m => apparence(m.nom).mascotte).find(Boolean) ?? 'renard') as Mascotte
  useEffect(() => { scrollTo(0, 0) }, [])

  // avec un utilisateur, son lien (ici.be/VF/u/Olivia) ; sinon le lien de transfert, raccourci (ici.be/VF/z/G8T9)
  const nom = nomUtilisateur()
  const copier = async () => {
    const texte = nom ? Promise.resolve(lienUtilisateur(nom)) : lienTransfert().then(raccourcir)
    setLien({ etat: (await copierBientot(texte)) ? 'copie' : 'a-copier', texte: await texte })
  }

  return (
    <main class="page suivi">
      <header class="entete">
        <button class="icone" onClick={retour} aria-label="Retour au menu">←</button>
        <h1>Suivi</h1>
      </header>
      <p class="etat">Tout ce qui suit vient de cet appareil : rien n’est envoyé nulle part.</p>

      <section class="bloc">
        <h2>Régularité</h2>
        <div class="regularite">
          <p class="chiffre"><b>{serie}</b> {serie > 1 ? 'jours de révision d’affilée' : 'jour de révision'}<span>record : {nombre(record, 'jour')}</span></p>
          <Calendrier />
        </div>
        <p class="astuce gauche">Un jour compte à partir de {REPONSES_PAR_JOUR} réponses. Plus la case est foncée, plus il y a eu de réponses.</p>
        {nbDuJour > 0 && <button class="go" onClick={reviser}>Réviser aujourd’hui · {nombre(nbDuJour, 'carte')} ▶</button>}
      </section>

      <section class="bloc">
        <h2>Récompenses</h2>
        <p class="astuce gauche">Une surprise de mascotte de plus à chaque palier de jours de révision d’affilée. Une fois gagnée, elle le reste.</p>
        <ul class="recompenses">{RECOMPENSES.map(r => <Recompense r={r} record={record} mascotte={mascotte} />)}</ul>
      </section>

      <section class="bloc">
        <h2>Par matière</h2>
        <p class="legende-suivi"><span><span class="pastille su" /> su (3 bonnes réponses d’affilée)</span> <span><span class="pastille en-cours" /> en cours</span> <span><span class="pastille jamais" /> jamais vu</span></p>
        <table class="table-suivi">
          <thead><tr><th>Matière</th><th>Où on en est</th><th>Su</th><th>À revoir</th></tr></thead>
          <tbody>
            {voc.matieres.map(mat => {
              const items = suivis([...mat.mots, ...(mat.questions ?? [])])
              if (!items.length) return null
              const b = bilan(items), revoir = motsARevoir(items, 999).length
              const ouvert = ouverte === mat.nom
              return (
                <>
                  <tr class="ligne-matiere" onClick={() => setOuverte(ouvert ? null : mat.nom)}>
                    <td><button class="lien" aria-expanded={ouvert}><svg class="chevron" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M6 3.5 10.5 8 6 12.5" /></svg> <NomMatiere nom={mat.nom} /></button></td>
                    <td><Barre b={b} /></td>
                    <Su b={b} />
                    <td class="nombre">{revoir || '–'}</td>
                  </tr>
                  {ouvert && mat.chapitres.map(ch => {
                    const it = items.filter(m => m.chapitre === ch)
                    if (!it.length) return null
                    const bc = bilan(it)
                    return (
                      <tr class="ligne-chapitre">
                        <td>{nomChapitre(ch)}</td><td><Barre b={bc} /></td><Su b={bc} /><td class="nombre">{motsARevoir(it, 999).length || '–'}</td>
                      </tr>
                    )
                  })}
                </>
              )
            })}
          </tbody>
        </table>
      </section>

      <section class="bloc">
        <h2>Les erreurs qui reviennent</h2>
        {erreurs.length
          ? <ul class="erreurs-suivi">
              {erreurs.map(({ m, s }) => (
                <li><span class="combien">{s!.rates}×</span><span class="quoi"><b>{m.det ? `${m.det} ${m.nl}` : m.nl.replace(TROU, '…')}</b> → {m.fr}</span><span class="ou">{apparence(m.matiere).titre} · {nomChapitre(m.chapitre)}{s!.boite >= 3 ? ' · rattrapé' : ''}</span></li>
              ))}
            </ul>
          : <p class="astuce gauche">Aucune erreur répétée pour l’instant.</p>}
      </section>

      <section class="bloc">
        <h2>Changer d’appareil</h2>
        {nom
          ? <p class="astuce gauche">Les exercices de <b>{nom}</b> le suivent sur chaque appareil où ce prénom a été choisi en dernier. Pour les retrouver sur un autre appareil (téléphone, ordinateur) : copie ton lien, envoie-le-toi (message, mail) et ouvre-le là-bas. Pour changer d’utilisateur : le bouton de l’initiale, en haut de l’accueil.</p>
          : <p class="astuce gauche">Pour retrouver cette progression sur un autre appareil (téléphone, ordinateur) : copie le lien, envoie-le-toi (message, mail) et ouvre-le sur l’autre appareil. Les deux progressions sont réunies : pour chaque mot, la plus récente l’emporte. Mieux : choisis un prénom (bouton en haut de l’accueil), tes exercices te suivront partout.</p>}
        <button class="second" onClick={copier}>{nom ? `Copier le lien de ${nom}` : 'Copier le lien de transfert'}</button>
        {lien.etat === 'copie' && <p class="astuce gauche" role="status">Lien copié. Ouvre-le sur l’autre appareil.</p>}
        {lien.etat === 'a-copier' && <textarea class="lien-transfert" readOnly rows={3} value={lien.texte} onFocus={e => (e.target as HTMLTextAreaElement).select()} aria-label="Lien de transfert, à copier" />}
      <p class="date-mots"><CircleCheck size={15} strokeWidth={2} aria-hidden="true" />Mots du tableau : mis à jour le {dateCourte(voc.misAJour)}</p>
      </section>
    </main>
  )
}
