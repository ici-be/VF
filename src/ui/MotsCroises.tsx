import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import type { Mot } from '../lib/mots'
import type { Reglages } from '../lib/reglages'
import { genererGrille, type Grille, type MotGrille } from '../lib/grille'
import { noter } from '../lib/progression'
import { nlComplet } from '../lib/seance'
import { parler, taire } from '../lib/voix'
import { confettis } from '../lib/confettis'
import { apparence } from '../lib/apparence'
import { nombre } from '../lib/texte'
import { simplifier } from '../lib/correction'

// Mots croisés : les mots néerlandais du choix, la traduction française en
// définition. Un mot trouvé s'allume en vert (et il est lu à voix haute).

interface Props {
  mots: Mot[]
  reglages: Reglages
  quitter: () => void
  rejouer: () => void
}

type MG = MotGrille<Mot>
const cle = (l: number, c: number) => `${l},${c}`
const cases = (m: MG) => [...m.lettres].map((_, k) => (m.sens === 'horizontal' ? cle(m.ligne, m.colonne + k) : cle(m.ligne + k, m.colonne)))

export function MotsCroises({ mots, reglages, quitter, rejouer }: Props) {
  const grille = useMemo(() => {
    // une seule fois chaque définition : « le décomposeur » = afbreker ou reducent, impossible à départager
    const vues = new Set<string>()
    const uniques = mots.filter(m => { const d = simplifier(m.fr); if (vues.has(d)) return false; vues.add(d); return true })
    return genererGrille(uniques.map(m => ({ mot: m.nl, donnee: m })), Math.min(12, reglages.nombre || 12))
  }, [])
  if (!grille) {
    return (
      <main class="page"><div class="vide">
        <p>Pas assez de mots d’un seul tenant dans ce choix pour faire une grille.</p>
        <button class="go" onClick={quitter}>Retour</button>
      </div></main>
    )
  }
  return <Partie grille={grille} reglages={reglages} quitter={quitter} rejouer={rejouer} />
}

function Partie({ grille, reglages, quitter, rejouer }: { grille: Grille<Mot> } & Omit<Props, 'mots'>) {
  const [saisie, setSaisie] = useState<Record<string, string>>({})
  const [actif, setActifEtat] = useState<MG | null>(grille.mots[0])
  // le mot en cours, aussi dans une référence : le focus d'une case (synchrone) doit voir
  // le mot qu'on vient de choisir, avant que l'affichage soit mis à jour
  const actifRef = useRef(actif)
  const setActif = (m: MG) => { actifRef.current = m; setActifEtat(m) }
  const [verifie, setVerifie] = useState(false)          // montrer les lettres fausses
  const [aides, setAides] = useState<Set<string>>(new Set())   // cases données en aide
  const [solution, setSolution] = useState(false)
  const debut = useRef(Date.now())
  const champs = useRef<Record<string, HTMLInputElement | null>>({})
  const annonces = useRef<Set<MG>>(new Set())
  const lecture = useRef(0)
  // les mots déjà trouvés quand elle a demandé la solution (les autres sont « révélés »)
  const [avantSolution, setAvantSolution] = useState<Set<MG> | null>(null)

  const trouve = (m: MG) => cases(m).every((k, i) => saisie[k] === m.lettres[i])
  const trouves = grille.mots.filter(trouve)
  const fini = trouves.length === grille.mots.length

  // un mot qui vient d'être trouvé : lu à voix haute, noté (s'il a été trouvé sans aide)
  useEffect(() => {
    for (const m of trouves) {
      if (annonces.current.has(m)) continue
      annonces.current.add(m)
      if (solution) continue
      if (reglages.voix) {
        // le mot néerlandais, puis sa traduction (« beginnen… commencer ») ;
        // si un autre mot est trouvé entre-temps, cette traduction-là ne vient pas le couper
        const moi = ++lecture.current
        parler(nlComplet(m.donnee), 'nl').then(() => { if (moi === lecture.current) parler(m.donnee.fr, 'fr') })
      }
      noter(m.donnee.id, cases(m).some(k => aides.has(k)) ? 'presque' : 'juste')
    }
    if (fini && !solution) confettis()
  }, [trouves.length])
  useEffect(() => () => taire(), [])

  const motsDe = (k: string) => grille.mots.filter(m => cases(m).includes(k))
  const focaliser = (k: string | undefined) => { if (k) champs.current[k]?.focus() }

  const ecrire = (k: string, lettre: string) => {
    if (solution) return
    const l = lettre.normalize('NFD').replace(/\p{M}/gu, '').toUpperCase().replace(/[^A-Z]/g, '').slice(-1)
    setSaisie(s => ({ ...s, [k]: l }))
    const a = actifRef.current
    if (!l || !a) return
    // case suivante du mot en cours
    const cs = cases(a), i = cs.indexOf(k)
    // case suivante du mot, sans en sauter : on peut taper le mot en entier, croisements compris
    focaliser(cs[i + 1])
  }

  const touche = (k: string, e: KeyboardEvent) => {
    const [l, c] = k.split(',').map(Number)
    const depl: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }
    if (depl[e.key]) {
      e.preventDefault()
      const [dl, dc] = depl[e.key]
      for (let n = 1; n < 15; n++) {
        const k2 = cle(l + dl * n, c + dc * n)
        if (grille.cases[l + dl * n]?.[c + dc * n]) {
          const ms = motsDe(k2)
          setActif(ms.find(m => m.sens === (dl ? 'vertical' : 'horizontal')) ?? ms[0])
          focaliser(k2)
          break
        }
        if (l + dl * n < 0 || c + dc * n < 0 || l + dl * n >= grille.lignes || c + dc * n >= grille.colonnes) break
      }
    } else if (e.key === 'Backspace' && !saisie[k] && actifRef.current) {
      // case déjà vide : on recule dans le mot et on efface
      e.preventDefault()
      const cs = cases(actifRef.current), prec = cs[cs.indexOf(k) - 1]
      if (prec) { setSaisie(s => ({ ...s, [prec]: '' })); focaliser(prec) }
    }
  }

  // arrivée sur une case (clic, tabulation ou frappe) : on garde le mot en cours s'il passe par là
  const arriverSur = (k: string) => {
    const ms = motsDe(k), a = actifRef.current
    if (!a || !ms.includes(a)) setActif(ms.find(m => !trouve(m)) ?? ms[0])
  }
  // nouveau clic sur la case qui a déjà le curseur, à un croisement : on change de sens
  const dejaLa = useRef(false)
  const cliquer = (k: string) => {
    const ms = motsDe(k), a = actifRef.current
    if (dejaLa.current && a && ms.length > 1 && ms.includes(a)) setActif(ms.find(m => m !== a)!)
  }

  const choisirMot = (m: MG) => {
    setActif(m)
    // la première case du mot : on peut le taper en entier
    focaliser(cases(m)[0])
  }

  const uneLettre = () => {
    const m = actif && !trouve(actif) ? actif : grille.mots.find(x => !trouve(x))
    if (!m) return
    const k = cases(m).find((x, i) => saisie[x] !== m.lettres[i])!
    const i = cases(m).indexOf(k)
    setSaisie(s => ({ ...s, [k]: m.lettres[i] }))
    setAides(a => new Set(a).add(k))
    setActif(m)
    focaliser(k)
  }

  const montrerSolution = () => {
    setAvantSolution(new Set(grille.mots.filter(trouve)))
    for (const m of grille.mots) if (!trouve(m)) noter(m.donnee.id, 'faux')
    setSolution(true)
    setSaisie(Object.fromEntries(grille.mots.flatMap(m => cases(m).map((k, i) => [k, m.lettres[i]]))))
  }

  const actives = new Set(actif ? cases(actif) : [])
  const vertes = new Set(trouves.flatMap(cases))
  const numeros = new Map(grille.mots.map(m => [cle(m.ligne, m.colonne), m.numero]))
  const secondes = Math.round((Date.now() - debut.current) / 1000)
  const matieres = [...new Set(grille.mots.map(m => m.donnee.matiere))]

  const indices = (sens: MG['sens']) => grille.mots.filter(m => m.sens === sens).map(m => (
    <li class={`${m === actif ? 'actif' : ''} ${trouve(m) ? 'trouve' : ''}`} data-cases={cases(m).join(' ')}>
      <button onClick={() => choisirMot(m)}>
        <b>{m.numero}</b>
        <span class="def">
          {m.donnee.fr} <span class="long">({m.lettres.length})</span>
          {trouve(m) && (() => {
            const parElle = !avantSolution || avantSolution.has(m)
            return <span class={`mot-trouve ${parElle ? '' : 'revele'}`}>→ {nlComplet(m.donnee)}{parElle ? ' ✓' : ''}</span>
          })()}
        </span>
      </button>
    </li>
  ))

  return (
    <>
      <div class="haut-jeu">
      <div class="barre">
        <button class="icone" onClick={quitter} aria-label="Quitter le jeu" title="Quitter">✕</button>
        <span class="quoi">Mots croisés (bêta) · {matieres.map(n => `${apparence(n).icone} ${apparence(n).titre}`).join(' + ')}</span>
        <span class="compte" title="Mots trouvés">{trouves.length} / {grille.mots.length}</span>
      </div>
      {/* la définition du mot en cours reste visible, même avec le clavier du téléphone ouvert */}
      {actif && !fini && (
        <p class="indice-actif" aria-live="polite">
          <b>{actif.numero} {actif.sens === 'horizontal' ? '→' : '↓'}</b> {actif.donnee.fr} <span class="long">({actif.lettres.length})</span>
        </p>
      )}
      </div>
      <main class="page jeu">
        {fini && (
          <div class="bandeau">
            <p>{solution
              ? 'Voici la solution. Les mots non trouvés sont ajoutés aux mots à revoir.'
              : `Grille terminée en ${Math.floor(secondes / 60)} min ${String(secondes % 60).padStart(2, '0')} s${aides.size ? `, avec ${nombre(aides.size, 'lettre donnée', 'lettres données')}` : ', sans aide'} ! 🎉`}</p>
            <div class="actions">
              <button class="go" onClick={rejouer}>Nouvelle grille</button>
              <button class="second" onClick={quitter}>Menu</button>
            </div>
          </div>
        )}
        <div class="jeu-corps">
        <div class="jeu-grille">
        <div class="grille-zone">
          <div class="grille" style={{ '--colonnes': grille.colonnes } as Record<string, number>} role="grid" aria-label="Grille de mots croisés">
            {grille.cases.flatMap((ligne, l) => ligne.map((lettre, c) => {
              const k = cle(l, c)
              if (!lettre) return <div class="noire" aria-hidden="true" />
              const faux = verifie && saisie[k] && saisie[k] !== lettre
              return (
                <div class={`case ${actives.has(k) ? 'active' : ''} ${vertes.has(k) ? 'trouvee' : ''} ${faux ? 'fausse' : ''} ${aides.has(k) ? 'aidee' : ''}`}>
                  {numeros.has(k) && <span class="num">{numeros.get(k)}</span>}
                  <input
                    ref={el => { champs.current[k] = el }} data-cle={k}
                    value={saisie[k] ?? ''} maxLength={2} readOnly={solution || vertes.has(k) && motsDe(k).every(trouve)}
                    autocomplete="off" autocapitalize="characters" spellcheck={false} inputMode="text"
                    aria-label={`Ligne ${l + 1}, colonne ${c + 1}`}
                    onPointerDown={() => { dejaLa.current = document.activeElement === champs.current[k] }}
                    onFocus={() => arriverSur(k)}
                    onClick={() => cliquer(k)}
                    onInput={e => { setVerifie(false); ecrire(k, (e.target as HTMLInputElement).value) }}
                    onKeyDown={e => touche(k, e)}
                  />
                </div>
              )
            }))}
          </div>
        </div>
        {!fini && (
          <div class="actions">
            <button class="second" onClick={() => setVerifie(true)}>Vérifier</button>
            <button class="second" onClick={uneLettre}>Une lettre</button>
            <button class="second" onClick={montrerSolution}>Solution</button>
          </div>
        )}
        </div>
        <div class="indices">
          <section><h2>Horizontalement</h2><ol>{indices('horizontal')}</ol></section>
          <section><h2>Verticalement</h2><ol>{indices('vertical')}</ol></section>
        </div>
        </div>
      </main>
    </>
  )
}
