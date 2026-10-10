// Le haut de l'accueil : le logo (les deux bulles NL/FR de l'icône), le nom « Woordjes »
// et, dessous, un mot des matières choisies avec sa traduction, qui change toutes les trois secondes.
import { useEffect, useMemo, useState } from 'preact/hooks'
import type { Mot } from '../lib/mots'
import { melanger, nlComplet } from '../lib/seance'

export function Logo() {
  return (
    <svg class="logo" viewBox="80 110 360 360" aria-hidden="true">
      <rect x="96" y="120" width="230" height="160" rx="28" class="b-nl" />
      <path d="M150 280 l-10 60 l60 -60z" class="b-nl" />
      <text x="211" y="228" text-anchor="middle" class="t-nl">NL</text>
      <rect x="200" y="232" width="220" height="160" rx="28" class="b-fr" />
      <path d="M370 392 l10 60 l-60 -60z" class="b-fr" />
      <text x="310" y="342" text-anchor="middle" class="t-fr">FR</text>
    </svg>
  )
}

/** la première traduction, sans les précisions : « (se) souvenir (de), se rappeler » → « souvenir » */
const premiereTraduction = (fr: string) => fr.replace(/\([^)]*\)/g, ' ').split(/[\/,;]/)[0].replace(/\s+/g, ' ').trim()

const calme = () => matchMedia('(prefers-reduced-motion: reduce)').matches

export function MotsQuiDefilent({ mots }: { mots: Mot[] }) {
  // des mots courts (ils doivent tenir sur une ligne de téléphone), sans les formes conjuguées
  const paires = useMemo(() => melanger(
    mots.filter(m => !m.verbe)
      .map(m => [nlComplet(m), premiereTraduction(m.fr)] as const)
      .filter(([nl, fr]) => nl && fr && nl.length <= 18 && fr.length <= 20),
  ).slice(0, 40), [mots])
  const [i, setI] = useState(0)
  const [cache, setCache] = useState(false)
  useEffect(() => {
    setI(0)
    if (paires.length < 2 || calme()) return
    let fondu: number
    const minuterie = setInterval(() => {
      setCache(true)
      fondu = setTimeout(() => { setI(k => (k + 1) % paires.length); setCache(false) }, 300)
    }, 3000)
    return () => { clearInterval(minuterie); clearTimeout(fondu) }
  }, [paires])
  const p = paires[i]
  if (!p) return null
  return (
    <p class={`duo ${cache ? 'cache' : ''}`} aria-hidden="true">
      <span lang="nl" class="nl">{p[0]}</span><span class="fr">{p[1]}</span>
    </p>
  )
}
