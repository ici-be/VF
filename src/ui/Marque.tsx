// Le haut de l'accueil : le logo (les deux bulles NL/FR de l'icône), le nom « Woordjes »
// et, dessous, un mot des matières choisies avec sa traduction.
import { useEffect, useState } from 'preact/hooks'
import type { Mot } from '../lib/mots'
import { nlComplet } from '../lib/seance'

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

/** Un mot des matières choisies et sa traduction, tiré une fois : il ne change qu'au rechargement de la page. */
export function MotExemple({ mots }: { mots: Mot[] }) {
  const [paire, setPaire] = useState<readonly [string, string] | null>(null)
  useEffect(() => {
    if (paire) return
    // un mot court (il doit tenir sur une ligne de téléphone), sans les formes conjuguées
    const possibles = mots.filter(m => !m.verbe)
      .map(m => [nlComplet(m), premiereTraduction(m.fr)] as const)
      .filter(([nl, fr]) => nl && fr && nl.length <= 18 && fr.length <= 20)
    if (possibles.length) setPaire(possibles[Math.floor(Math.random() * possibles.length)])
  }, [mots])
  if (!paire) return null
  return (
    <p class="duo" aria-hidden="true">
      <span lang="nl" class="nl">{paire[0]}</span><span class="fr">{paire[1]}</span>
    </p>
  )
}
