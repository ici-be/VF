// Les mascottes des matières (dessins SVG validés dans la démo « Le relais des mascottes » ; puis le moine de la Religion, Pythagore des Mathématiques et Molière du Français).
// Chacune tient un flambeau, qu'elle passe à la suivante quand on change de matière.

import { interrompre } from './surprises'

export type Mascotte = 'renard' | 'chevalier' | 'colomb' | 'detective' | 'grenouille' | 'moine' | 'pythagore' | 'moliere'

const TRAIT = '#26303d'
const t = `stroke="${TRAIT}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"`
const ombrage = (d: string) => `<path d="${d}" fill="#000" opacity=".12"/>`

// le flambeau empoigné : le manche traverse le poing (dessiné par-dessus), un peu plus bas qu'avant
const FLAMBEAU = `
  <g class="flambeau">
    <rect x="89.5" y="44" width="5" height="40" rx="2" fill="#7a4f2a" ${t}/>
    <rect x="87.5" y="41" width="9" height="5" rx="1.5" fill="#4d3219" ${t}/>
    <g class="flamme">
      <path d="M92 18 C101.5 28 100.5 37 92 41 C83.5 37 82.5 28 92 18 Z" fill="#f08c1a" ${t}/>
      <path d="M92 26 C96.5 31 96 36 92 38.5 C88 36 87.5 31 92 26 Z" fill="#ffd66b"/>
    </g>
  </g>`
// bras droit : de l'épaule au poing qui serre le flambeau
// deux poses du bras droit : au repos (flambeau à hauteur d'épaule) et levé (pendant le saut, flambeau brandi bien droit)
const bras = (couleur: string, main: string) => `<g class="bras-d repos">
  <path d="M74 72 L90 71" stroke="${TRAIT}" stroke-width="9.5" stroke-linecap="round" fill="none"/>
  <path d="M74 72 L90 71" stroke="${couleur}" stroke-width="6" stroke-linecap="round" fill="none"/>
  ${FLAMBEAU}
  <rect x="86.5" y="66" width="11" height="10" rx="4.5" fill="${main}" ${t}/>
  <path d="M88.5 69.5 L95.5 69.5 M88.5 72.5 L95.5 72.5" stroke="${TRAIT}" stroke-width="1" opacity=".55"/></g>
  <g class="bras-d leve">
  <path d="M74 72 L86 50" stroke="${TRAIT}" stroke-width="9.5" stroke-linecap="round" fill="none"/>
  <path d="M74 72 L86 50" stroke="${couleur}" stroke-width="6" stroke-linecap="round" fill="none"/>
  <g transform="translate(-6 -22)">${FLAMBEAU}</g>
  <rect x="80.5" y="44" width="11" height="10" rx="4.5" fill="${main}" ${t}/>
  <path d="M82.5 47.5 L89.5 47.5 M82.5 50.5 L89.5 50.5" stroke="${TRAIT}" stroke-width="1" opacity=".55"/></g>`
const brasGauche = (couleur: string, main: string, x: number, y: number) => `
  <path d="M46 72 L${x} ${y}" stroke="${TRAIT}" stroke-width="9.5" stroke-linecap="round" fill="none"/>
  <path d="M46 72 L${x} ${y}" stroke="${couleur}" stroke-width="6" stroke-linecap="round" fill="none"/>
  <circle cx="${x}" cy="${y}" r="4.6" fill="${main}" ${t}/>`
const jambes = (couleur: string, pied: string) => `
  <g class="jambe g"><rect x="50" y="106" width="8" height="31" rx="3" fill="${couleur}" ${t}/><path d="M47 140 Q47 135 54 135 Q60 135 60 140 Z" fill="${pied}" ${t}/></g>
  <g class="jambe d"><rect x="62" y="106" width="8" height="31" rx="3" fill="${couleur}" ${t}/><path d="M60 140 Q60 135 66 135 Q73 135 73 140 Z" fill="${pied}" ${t}/></g>`
const ombre = `<ellipse cx="60" cy="141" rx="24" ry="3.5" fill="#000" opacity=".12"/>`
const peau = '#e9bf98'
const oeil = (x: number, y: number) => `<ellipse cx="${x}" cy="${y}" rx="1.5" ry="1.9" fill="${TRAIT}"/>`

const DESSINS: Record<Mascotte, string> = {
  // Reynaert de vos : le renard de l'épopée flamande, tunique médiévale et livre ouvert
  renard: `
    ${ombre}
    <g class="queue"><path d="M50 108 C30 110 20 96 22 76 C28 90 36 96 48 98 Z" fill="#d26a24" ${t}/>
      <path d="M22 76 C21 82 22 87 25 91 C27 85 26 80 22 76 Z" fill="#f6efe4" ${t}/></g>
    ${jambes('#a9531c', '#2a2a33')}
    <g class="corps">
      <path d="M55 52 L55 68 L65 68 L65 52 Z" fill="#d26a24" ${t}/>
      <path d="M46 66 Q60 60 74 66 L78 110 Q60 116 42 110 Z" fill="#3f7a52" ${t}/>
      ${ombrage('M62 62 Q70 63 74 66 L78 110 Q70 113 62 114 Z')}
      <path d="M44 100 L76 100" stroke="#c9a34a" stroke-width="2.4"/>
      <path d="M54 64 Q60 72 66 64" fill="#f6efe4" ${t}/>
      ${brasGauche('#3f7a52', '#d26a24', 44, 92)}
      <g transform="translate(30 80)">
        <path d="M-1 3 L16 6 L33 3 L33 22 L16 25 L-1 22 Z" fill="#5a3a22" ${t}/>
        <path d="M0 2 Q8 0 16 4 L16 22 Q8 19 0 21 Z" fill="#f4eee0" ${t}/>
        <path d="M32 2 Q24 0 16 4 L16 22 Q24 19 32 21 Z" fill="#f4eee0" ${t}/>
        <path d="M3 8 Q8 7 13 9 M3 12 Q8 11 13 13 M3 16 Q8 15 13 17 M19 9 Q24 7 29 8 M19 13 Q24 11 29 12 M19 17 Q24 15 29 16" stroke="#a7afbd" stroke-width="1" fill="none"/>
      </g>
      ${bras('#3f7a52', '#d26a24')}
      <path d="M45 34 L48 15 L57 30 Z" fill="#d26a24" ${t}/><path d="M48 29 L49.5 20 L54 29 Z" fill="#3a2418"/>
      <path d="M63 30 L72 15 L75 34 Z" fill="#d26a24" ${t}/><path d="M66 29 L70.5 20 L72 29 Z" fill="#3a2418"/>
      <path d="M43 42 Q45 28 60 28 Q75 28 77 42 Q74 52 60 62 Q46 52 43 42 Z" fill="#d26a24" ${t}/>
      <path d="M48 47 Q54 46 60 52 Q66 46 72 47 Q68 57 60 62 Q52 57 48 47 Z" fill="#f6efe4"/>
      <g class="yeux"><path d="M50 41 Q53.5 38.5 57 41 Q53.5 42.6 50 41 Z" fill="${TRAIT}"/><path d="M63 41 Q66.5 38.5 70 41 Q66.5 42.6 63 41 Z" fill="${TRAIT}"/></g>
      <ellipse cx="60" cy="59" rx="2.6" ry="2" fill="#1d1d24"/>
    </g>`,

  // un chevalier : heaume, tabard bleu à croix jaune, bannière
  chevalier: `
    ${ombre}
    ${jambes('#8f99a6', '#555e6b')}
    <g class="corps">
      <rect x="54" y="52" width="12" height="16" rx="3" fill="#aab3bf" ${t}/><path d="M54 60 L66 60" stroke="${TRAIT}" stroke-width="1" opacity=".5"/>
      <line x1="30" y1="16" x2="30" y2="138" stroke="${TRAIT}" stroke-width="5" stroke-linecap="round"/>
      <line x1="30" y1="16" x2="30" y2="138" stroke="#7a4f2a" stroke-width="2.6" stroke-linecap="round"/>
      <path class="drapeau" d="M31.5 18 L56 23 L31.5 36 Z" fill="#b8392b" ${t}/>
      <path d="M45 66 Q60 60 75 66 L78 110 Q60 116 42 110 Z" fill="#2c518f" ${t}/>
      ${ombrage('M62 62 Q70 63 75 66 L78 110 Q70 113 62 114 Z')}
      <rect x="57" y="70" width="6" height="36" rx="1.5" fill="#d9a92b"/>
      <rect x="49" y="81" width="22" height="6" rx="1.5" fill="#d9a92b"/>
      ${brasGauche('#aab3bf', '#8f99a6', 31, 88)}
      ${bras('#aab3bf', '#8f99a6')}
      <path class="plume" d="M60 25 C68 14 78 12 82 6 C83 16 76 24 64 28 Z" fill="#b8392b" ${t}/>
      <path d="M46 30 Q46 22 60 22 Q74 22 74 30 L74 56 Q60 64 46 56 Z" fill="#c3cad3" ${t}/>
      ${ombrage('M62 22 Q74 22 74 30 L74 56 Q68 60 62 61 Z')}
      <line x1="60" y1="23" x2="60" y2="37" stroke="${TRAIT}" stroke-width="1.6"/>
      <rect x="49" y="39" width="22" height="6" rx="3" fill="${TRAIT}"/>
      <g class="yeux"><circle cx="55" cy="42" r="1.6" fill="#fff"/><circle cx="65" cy="42" r="1.6" fill="#fff"/></g>
      <g fill="${TRAIT}"><circle cx="55" cy="51" r="1"/><circle cx="60" cy="52" r="1"/><circle cx="65" cy="51" r="1"/></g>
    </g>`,

  // Christophe Colomb : chapeau, cheveux longs, manteau rouge, longue-vue repliée dans la main
  colomb: `
    ${ombre}
    ${jambes('#3f2d22', '#1d1d24')}
    <g class="corps">
      <rect x="56" y="52" width="8" height="15" rx="2" fill="${peau}" ${t}/>
      <path d="M45 66 Q60 60 75 66 L80 114 Q60 120 40 114 Z" fill="#9e2f29" ${t}/>
      ${ombrage('M62 62 Q70 63 75 66 L80 114 Q70 117 62 118 Z')}
      <line x1="60" y1="68" x2="60" y2="116" stroke="${TRAIT}" stroke-width="1.5"/>
      <g fill="#c9a34a" ${t} stroke-width="1.2"><circle cx="64" cy="78" r="1.8"/><circle cx="64" cy="88" r="1.8"/><circle cx="64" cy="98" r="1.8"/></g>
      <path d="M50 64 Q60 70 70 64 L68 68 Q60 73 52 68 Z" fill="#f2efe8" ${t}/>
      ${brasGauche('#9e2f29', peau, 36, 96)}
      <g>
        <rect x="32.5" y="80" width="7" height="30" rx="2" fill="#b8913c" ${t}/>
        <rect x="31.5" y="78" width="9" height="5" rx="1.5" fill="#8e6c26" ${t}/>
        <rect x="31.5" y="107" width="9" height="5" rx="1.5" fill="#8e6c26" ${t}/>
      </g>
      ${bras('#9e2f29', peau)}
      <path d="M47 38 Q44 56 50 60 L52 40 Z M73 38 Q76 56 70 60 L68 40 Z" fill="#5e3d22" ${t}/>
      <ellipse cx="60" cy="44" rx="12" ry="14" fill="${peau}" ${t}/>
      ${ombrage('M62 30 Q72 32 72 44 Q72 56 62 58 Z')}
      <g class="yeux">${oeil(55.5, 44)}${oeil(64.5, 44)}</g>
      <path d="M58 49 Q60 51 62 49" stroke="${TRAIT}" stroke-width="1.3" fill="none"/>
      <path d="M56.5 53.5 Q60 55 63.5 53.5" stroke="${TRAIT}" stroke-width="1.4" fill="none" stroke-linecap="round"/>
      <g class="chapeau"><ellipse cx="60" cy="32" rx="22" ry="4.5" fill="#24242c" ${t}/>
        <path d="M47 31 Q48 17 60 16 Q72 17 73 31 Z" fill="#24242c" ${t}/>
        <path d="M70 21 Q80 12 86 15 Q78 17 72 26 Z" fill="#eceae4" ${t} stroke-width="1.4"/></g>
    </g>`,

  // une détective : manteau ajusté, chapeau à carreaux, queue de cheval rousse, loupe
  // une détective : manteau à pèlerine, chapeau à carreaux, queue de cheval rousse, loupe
  detective: `
    ${ombre}
    <g class="jambe g"><rect x="50" y="106" width="8" height="31" rx="3" fill="#2b3a55" ${t}/><path d="M47 140 Q46 132 50 131 L58 131 L59 140 Z" fill="#4a2f1b" ${t}/></g>
    <g class="jambe d"><rect x="62" y="106" width="8" height="31" rx="3" fill="#2b3a55" ${t}/><path d="M61 140 L62 131 L70 131 Q74 132 73 140 Z" fill="#4a2f1b" ${t}/></g>
    <g class="corps">
      <rect x="56" y="52" width="8" height="15" rx="2" fill="${peau}" ${t}/>
      <path d="M71 34 Q90 36 88 56 Q82 50 74 46 Z" fill="#b5532a" ${t}/>
      <rect x="70" y="36" width="5" height="7" rx="2" fill="#2b3a55" ${t} stroke-width="1.4"/>
      <path d="M47 66 Q60 61 73 66 L77 113 Q60 118 43 113 Z" fill="#c4a066" ${t}/>
      ${ombrage('M62 62 Q69 63 73 66 L77 113 Q69 116 62 117 Z')}
      <path d="M60 104 L60 117" stroke="${TRAIT}" stroke-width="1.4"/>
      <path d="M52 67 L60 86 L68 67" fill="#d8b67c" ${t} stroke-width="1.5"/>
      <path d="M52 67 L56 80 L60 86 M68 67 L64 80 L60 86" stroke="#a5834d" stroke-width="1.2" fill="none"/>
      <g fill="#5a3a22"><circle cx="55" cy="88" r="1.4"/><circle cx="65" cy="88" r="1.4"/><circle cx="55" cy="99" r="1.4"/><circle cx="65" cy="99" r="1.4"/></g>
      <rect x="44.5" y="92" width="31" height="4.6" fill="#6e4423" ${t} stroke-width="1.3"/>
      <rect x="57.5" y="91.2" width="5" height="6.2" rx="1" fill="none" stroke="#d9a92b" stroke-width="1.5"/>
      <path d="M47 104 L54 104 M66 104 L73 104" stroke="${TRAIT}" stroke-width="1.4" stroke-linecap="round"/>
      ${brasGauche('#c4a066', '#6e4423', 36, 88)}
      <g class="loupe"><line x1="36" y1="86" x2="31" y2="78" stroke="${TRAIT}" stroke-width="4.6" stroke-linecap="round"/>
        <line x1="36" y1="86" x2="31" y2="78" stroke="#5e3d22" stroke-width="2.4" stroke-linecap="round"/>
        <circle cx="26" cy="70" r="8.5" fill="#cfe8f3" fill-opacity=".9" ${t} stroke-width="2.4"/>
        <path d="M22 67 Q24 64 28 65" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round"/></g>
      ${bras('#c4a066', '#6e4423')}
      <path d="M44 67 Q60 59 76 67 L79 82 Q70 86 60 84 Q50 86 41 82 Z" fill="#a8844d" ${t}/>
      <path d="M60 84 L60 64" stroke="${TRAIT}" stroke-width="1.2" opacity=".5"/>
      <path d="M52 62 L56 54 L60 63 L64 54 L68 62 Q60 66 52 62 Z" fill="#a8844d" ${t} stroke-width="1.5"/>
      <ellipse cx="60" cy="45" rx="12" ry="13.5" fill="${peau}" ${t}/>
      ${ombrage('M62 32 Q72 34 72 45 Q72 56 62 58 Z')}
      <path d="M48 43 Q50 34 60 34 Q70 34 72 42 Q64 38 57 41 Q52 42 48 43 Z" fill="#b5532a"/>
      <g class="yeux">${oeil(55.5, 46)}${oeil(64.5, 46)}</g>
      <path d="M57 53 Q60 54.5 63 53" stroke="${TRAIT}" stroke-width="1.4" fill="none" stroke-linecap="round"/>
      <g class="chapeau"><path d="M47 35 Q48 20 60 20 Q72 20 73 35 Z" fill="#7d6a55" ${t}/>
        <path d="M53 21 L53 35 M60 20 L60 35 M67 21 L67 35 M48 28 L72 28" stroke="#5f4f3e" stroke-width="1.2"/>
        <path d="M43 35 Q60 30 77 35 Q79 38 74 38 Q60 34 46 38 Q41 38 43 35 Z" fill="#7d6a55" ${t}/>
        <path d="M58 20 Q60 16 62 20" stroke="#5f4f3e" stroke-width="1.6" fill="none"/></g>
    </g>`,

  grenouille: `
    ${ombre}
    <g class="jambe g"><path d="M48 106 L50 134 Q44 137 41 140 L57 140 L57 106 Z" fill="#4c9a48" ${t}/></g>
    <g class="jambe d"><path d="M72 106 L70 134 Q76 137 79 140 L63 140 L63 106 Z" fill="#4c9a48" ${t}/></g>
    <g class="corps">
      <path d="M44 70 Q60 60 76 70 Q80 96 74 110 Q60 116 46 110 Q40 96 44 70 Z" fill="#5aae52" ${t}/>
      ${ombrage('M62 63 Q70 64 76 70 Q80 96 74 110 Q68 113 62 114 Z')}
      <path d="M51 78 Q60 74 69 78 Q71 96 66 106 Q60 109 54 106 Q49 96 51 78 Z" fill="#cde8a6"/>
      ${brasGauche('#5aae52', '#4c9a48', 36, 90)}
      <g class="fiole"><g transform="translate(36 90)">
        <path d="M-3.5 -20 L3.5 -20 L3.5 -10 L11 6 Q12 9 9 9 L-9 9 Q-12 9 -11 6 L-3.5 -10 Z" fill="#e8f3f6" fill-opacity=".9" ${t}/>
        <path d="M-6.2 -1 L6.2 -1 L11 6 Q12 9 9 9 L-9 9 Q-12 9 -11 6 Z" fill="#7cc576"/>
        <rect x="-4.5" y="-22.5" width="9" height="3" rx="1" fill="#c8d2d8" ${t} stroke-width="1.2"/>
        <circle cx="-2" cy="3" r="1.1" fill="#fff" opacity=".8"/><circle cx="3" cy="5" r=".8" fill="#fff" opacity=".8"/>
      </g></g>
      ${bras('#5aae52', '#4c9a48')}
      <path d="M38 52 Q38 38 50 36 Q60 34 70 36 Q82 38 82 52 Q80 64 60 66 Q40 64 38 52 Z" fill="#5aae52" ${t}/>
      ${ombrage('M62 35 Q82 38 82 52 Q80 63 62 66 Z')}
      <circle cx="49" cy="38" r="7.5" fill="#5aae52" ${t}/><circle cx="71" cy="38" r="7.5" fill="#5aae52" ${t}/>
      <circle cx="49" cy="38" r="4.6" fill="#fdfaf2"/><circle cx="71" cy="38" r="4.6" fill="#fdfaf2"/>
      <g class="yeux"><circle cx="49.6" cy="38.6" r="2.2" fill="${TRAIT}"/><circle cx="71.6" cy="38.6" r="2.2" fill="${TRAIT}"/></g>
      <circle cx="49" cy="38" r="6" fill="none" stroke="#3b3b44" stroke-width="1.5"/>
      <circle cx="71" cy="38" r="6" fill="none" stroke="#3b3b44" stroke-width="1.5"/>
      <path d="M55 38 Q60 36 65 38" stroke="#3b3b44" stroke-width="1.5" fill="none"/>
      <path d="M48 56 Q60 62 72 56" stroke="${TRAIT}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    </g>`,

  // un moine : robe de bure, capuche, cordelière, tonsure, une Bible à la main
  moine: `
    ${ombre}
    ${jambes('#5a3a22', '#7a4f2a')}
    <g class="corps">
      <path d="M44 66 Q60 60 76 66 L81 135 Q60 140 39 135 Z" fill="#7a5236" ${t}/>
      ${ombrage('M62 62 Q70 63 76 66 L81 135 Q70 138 62 139 Z')}
      <path d="M52 104 L50 134 M68 104 L70 134" stroke="${TRAIT}" stroke-width="1.2" opacity=".35"/>
      <path d="M43 92 Q60 97 77 92" stroke="${TRAIT}" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M43 92 Q60 97 77 92" stroke="#e8d9b0" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      <path d="M50 94.5 L48 114" stroke="${TRAIT}" stroke-width="4.4" stroke-linecap="round"/>
      <path d="M50 94.5 L48 114" stroke="#e8d9b0" stroke-width="2.2" stroke-linecap="round"/>
      <circle cx="48.7" cy="104" r="2" fill="#e8d9b0" ${t} stroke-width="1.2"/><circle cx="48" cy="114" r="2.2" fill="#e8d9b0" ${t} stroke-width="1.2"/>
      ${brasGauche('#7a5236', peau, 37, 90)}
      <g class="bible" transform="translate(25 78)">
        <rect x="0" y="0" width="17" height="22" rx="2" fill="#6b2f2a" ${t}/>
        <path d="M2 1 L2 21" stroke="#4a1f1b" stroke-width="1.4"/>
        <path d="M9.5 5 L9.5 16 M5.5 9 L13.5 9" stroke="#e2b53c" stroke-width="2.2" stroke-linecap="round"/>
      </g>
      <circle cx="37" cy="90" r="4.6" fill="${peau}" ${t}/>
      ${bras('#7a5236', peau)}
      <path d="M45 64 Q46 54 60 55 Q74 54 75 64 Q68 70 60 69 Q52 70 45 64 Z" fill="#69452c" ${t}/>
      <rect x="56" y="52" width="8" height="10" rx="2" fill="${peau}" ${t}/>
      <ellipse class="crane" cx="60" cy="44" rx="13" ry="14" fill="${peau}" ${t}/>
      ${ombrage('M62 30 Q73 32 73 44 Q73 57 62 58 Z')}
      <path d="M48.2 42.5 Q47.6 37.5 50.5 35 M69.5 35 Q72.4 37.5 71.8 42.5" stroke="${TRAIT}" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M48.2 42.5 Q47.6 37.5 50.5 35 M69.5 35 Q72.4 37.5 71.8 42.5" stroke="#8a6040" stroke-width="3.6" fill="none" stroke-linecap="round"/>
      <circle cx="52" cy="50" r="2.6" fill="#e58f7e" opacity=".55"/><circle cx="68" cy="50" r="2.6" fill="#e58f7e" opacity=".55"/>
      <g class="yeux"><path d="M52.5 45 Q55 42.5 57.5 45" stroke="${TRAIT}" stroke-width="1.7" fill="none" stroke-linecap="round"/><path d="M62.5 45 Q65 42.5 67.5 45" stroke="${TRAIT}" stroke-width="1.7" fill="none" stroke-linecap="round"/></g>
      <path d="M55 51 Q60 55.5 65 51" stroke="${TRAIT}" stroke-width="1.6" fill="#b44a3a" stroke-linecap="round"/>
    </g>`,

  // Pythagore : toge blanche à bordure grecque, couronne de laurier, grande barbe, équerre à la main
  pythagore: `
    ${ombre}
    ${jambes(peau, '#8a5a36')}
    <g class="corps">
      <rect x="56" y="52" width="8" height="15" rx="2" fill="${peau}" ${t}/>
      <path d="M45 66 Q60 60 75 66 L79 116 Q60 121 41 116 Z" fill="#f6f3ea" ${t}/>
      ${ombrage('M62 62 Q70 63 75 66 L79 116 Q70 119 62 120 Z')}
      <path d="M41.5 110 Q60 115 78.5 110 L79 116 Q60 121 41 116 Z" fill="#2f6db0" ${t} stroke-width="1.4"/>
      <path d="M44 113 L44 115.5 L47 115.5 L47 113.5 M51 114.5 L51 117 L54 117 L54 115 M58 115 L58 117.5 L61 117.5 L61 115.3 M65 115 L65 117.3 L68 117.3 L68 114.8 M72 114 L72 116.3 L75 116.3 L75 113.6" stroke="#f6f3ea" stroke-width="1" fill="none"/>
      <path d="M47 66 L72 104" stroke="${TRAIT}" stroke-width="7" stroke-linecap="round"/>
      <path d="M47 66 L72 104" stroke="#2f6db0" stroke-width="4.4" stroke-linecap="round"/>
      <path d="M52 80 Q56 90 54 104 M66 74 Q64 86 67 100" stroke="${TRAIT}" stroke-width="1.1" fill="none" opacity=".35"/>
      ${brasGauche(peau, peau, 37, 90)}
      <g class="equerre" transform="translate(22 78)">
        <path d="M0 0 L0 26 L20 26 Z" fill="#e8c06a" ${t}/>
        <path d="M4 10 L4 22 L13 22 Z" fill="#f6f3ea" ${t} stroke-width="1.3"/>
        <path d="M0 6 L3 6 M0 12 L2 12 M0 18 L3 18 M6 26 L6 23 M12 26 L12 24 M18 26 L18 23" stroke="${TRAIT}" stroke-width="1" opacity=".7"/>
      </g>
      <circle cx="37" cy="90" r="4.6" fill="${peau}" ${t}/>
      ${bras(peau, peau)}
      <path d="M47 38 Q43 50 48 56 L50 42 Z M73 38 Q77 50 72 56 L70 42 Z" fill="#dfe3e8" ${t}/>
      <ellipse cx="60" cy="44" rx="12" ry="13.5" fill="${peau}" ${t}/>
      ${ombrage('M62 31 Q72 33 72 44 Q72 56 62 58 Z')}
      <path class="barbe" d="M48.5 47 Q46 64 60 75 Q74 64 71.5 47 Q67 53 60 52.5 Q53 53 48.5 47 Z" fill="#eef0f3" ${t}/>
      <path d="M54 56 Q57 62 56 68 M60 56 L60 70 M66 56 Q63 62 64 68" stroke="#c3c9d1" stroke-width="1.2" fill="none" stroke-linecap="round"/>
      <path d="M53 51 Q56.5 48.5 60 50.5 Q63.5 48.5 67 51 Q63.5 53.5 60 52 Q56.5 53.5 53 51 Z" fill="#dfe3e8" ${t} stroke-width="1.3"/>
      <path d="M52.5 40 Q55.5 38 58 39.5 M62 39.5 Q64.5 38 67.5 40" stroke="#b9c0c9" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <g class="yeux">${oeil(55.5, 43.5)}${oeil(64.5, 43.5)}</g>
      <path d="M60 44 Q58.5 48 60.5 48.5" stroke="${TRAIT}" stroke-width="1.2" fill="none" stroke-linecap="round"/>
      <g class="laurier">
        <path d="M47 37 Q60 26 73 37" stroke="#4e7d2e" stroke-width="1.6" fill="none"/>
        <g fill="#6aa23c" ${t} stroke-width="1.1">
          <ellipse cx="48.5" cy="33.5" rx="3.6" ry="1.9" transform="rotate(-50 48.5 33.5)"/><ellipse cx="52.5" cy="29.5" rx="3.6" ry="1.9" transform="rotate(-30 52.5 29.5)"/>
          <ellipse cx="57" cy="27.5" rx="3.6" ry="1.9" transform="rotate(-12 57 27.5)"/><ellipse cx="63" cy="27.5" rx="3.6" ry="1.9" transform="rotate(12 63 27.5)"/>
          <ellipse cx="67.5" cy="29.5" rx="3.6" ry="1.9" transform="rotate(30 67.5 29.5)"/><ellipse cx="71.5" cy="33.5" rx="3.6" ry="1.9" transform="rotate(50 71.5 33.5)"/>
        </g>
      </g>
    </g>`,

  // Molière : grande perruque bouclée, veste prune à galons dorés, jabot de dentelle, plume d'oie
  moliere: `
    ${ombre}
    <g class="jambe g"><rect x="50" y="106" width="8" height="31" rx="3" fill="#f2efe6" ${t}/><path d="M47 140 Q47 134 54 134 Q60 134 60 140 Z" fill="#2a2a33" ${t}/><rect x="51.5" y="134.5" width="5" height="2.6" rx=".6" fill="#d9a92b" ${t} stroke-width="1"/></g>
    <g class="jambe d"><rect x="62" y="106" width="8" height="31" rx="3" fill="#f2efe6" ${t}/><path d="M60 140 Q60 134 66 134 Q73 134 73 140 Z" fill="#2a2a33" ${t}/><rect x="63.5" y="134.5" width="5" height="2.6" rx=".6" fill="#d9a92b" ${t} stroke-width="1"/></g>
    <g class="corps">
      <g class="perruque">
        <path d="M47 34 Q35 46 38 66 Q42 74 50 70 Q47 56 50 42 Z M73 34 Q85 46 82 66 Q78 74 70 70 Q73 56 70 42 Z" fill="#4a3020" ${t}/>
        <g fill="#5e3d27" ${t} stroke-width="1.3"><circle cx="40" cy="52" r="4"/><circle cx="40.5" cy="61" r="4"/><circle cx="45" cy="68" r="3.6"/><circle cx="80" cy="52" r="4"/><circle cx="79.5" cy="61" r="4"/><circle cx="75" cy="68" r="3.6"/></g>
      </g>
      <rect x="56" y="52" width="8" height="15" rx="2" fill="${peau}" ${t}/>
      <path d="M45 66 Q60 60 75 66 L80 114 Q60 120 40 114 Z" fill="#6b3a7a" ${t}/>
      ${ombrage('M62 62 Q70 63 75 66 L80 114 Q70 117 62 118 Z')}
      <path d="M57 68 L55 116 M63 68 L65 116" stroke="#d9a92b" stroke-width="2.2"/>
      <g fill="#d9a92b" ${t} stroke-width="1.1"><circle cx="66.5" cy="80" r="1.6"/><circle cx="66.8" cy="90" r="1.6"/><circle cx="67.1" cy="100" r="1.6"/></g>
      <path d="M41.5 106 Q60 111 78.5 106" stroke="#d9a92b" stroke-width="2" fill="none"/>
      ${brasGauche('#6b3a7a', peau, 37, 90)}
      <path d="M33.5 86 Q37 84 40.5 86 L40 89 Q37 87.5 34 89 Z" fill="#fbfaf5" ${t} stroke-width="1.2"/>
      <g transform="translate(37 90)"><g class="plume-oie">
        <path d="M0 0 L-9 -26" stroke="${TRAIT}" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M-2 -6 Q-14 -18 -13 -34 Q-6 -24 -3 -10 Z" fill="#fbfaf5" ${t} stroke-width="1.3"/>
        <path d="M-3 -9 Q-8 -20 -12 -31" stroke="#c9d1dc" stroke-width="1" fill="none"/>
        <path d="M0.5 1.5 L-1.2 -3" stroke="#26303d" stroke-width="2.2" stroke-linecap="round"/>
      </g></g>
      <circle cx="37" cy="90" r="4.6" fill="${peau}" ${t}/>
      ${bras('#6b3a7a', peau)}
      <path d="M53 64 Q56 70 53 74 Q57 76 60 73 Q63 76 67 74 Q64 70 67 64 Q60 68 53 64 Z" fill="#fbfaf5" ${t} stroke-width="1.4"/>
      <path d="M55 70 Q57.5 71.5 60 70 Q62.5 71.5 65 70" stroke="#c9d1dc" stroke-width="1" fill="none"/>
      <ellipse class="crane" cx="60" cy="44" rx="12" ry="13.5" fill="${peau}" ${t}/>
      ${ombrage('M62 31 Q72 33 72 44 Q72 56 62 58 Z')}
      <g class="yeux">${oeil(55.5, 44)}${oeil(64.5, 44)}</g>
      <path d="M53 40 Q55.5 38.5 58 40 M62 40 Q64.5 38.5 67 40" stroke="#4a3020" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <path d="M60 45 Q58.5 48.5 60.5 49" stroke="${TRAIT}" stroke-width="1.2" fill="none" stroke-linecap="round"/>
      <path d="M54.5 51 Q57 49.5 60 50.6 Q63 49.5 65.5 51 Q66.5 49 67.5 49.5 Q66 52.5 63 52 Q61 51.5 60 52 Q59 51.5 57 52 Q54 52.5 52.5 49.5 Q53.5 49 54.5 51 Z" fill="#4a3020"/>
      <path d="M57 54 Q60 56 63 54" stroke="${TRAIT}" stroke-width="1.3" fill="none" stroke-linecap="round"/>
      <path d="M59 56.5 L61 56.5 L60 58.5 Z" fill="#4a3020"/>
      <g class="perruque">
        <path d="M46.5 42 Q45 27 60 26 Q75 27 73.5 42 Q70 34 64 33 Q60 36 56 33 Q50 34 46.5 42 Z" fill="#4a3020" ${t}/>
        <g fill="#5e3d27" ${t} stroke-width="1.3"><circle cx="48" cy="34" r="4"/><circle cx="54" cy="28.5" r="4"/><circle cx="60.5" cy="27" r="4"/><circle cx="67" cy="28.5" r="4"/><circle cx="72.5" cy="34" r="4"/><circle cx="44.5" cy="42" r="3.8"/><circle cx="75.5" cy="42" r="3.8"/></g>
      </g>
    </g>`,
}

/** Le buste, pour le médaillon du menu des matières : la tête et, à côté, le flambeau tenu à hauteur d'épaule. */
// dans le médaillon, certaines mascottes sont remontées un peu (de tant d'unités du dessin)
const HAUSSE_BUSTE: Partial<Record<Mascotte, number>> = { moine: 9, grenouille: 5 }

export const svgBuste = (nom: Mascotte) =>
  `<svg class="mascotte buste" data-mascotte="${nom}" viewBox="30 ${8 + (HAUSSE_BUSTE[nom] ?? 0)} 68 68" xmlns="http://www.w3.org/2000/svg"><g class="perso">${DESSINS[nom].replace(ombre, '')}</g></svg>`

export const svgMascotte = (nom: Mascotte, classe = '') =>
  `<svg class="mascotte ${classe}" data-mascotte="${nom}" viewBox="0 0 120 150" xmlns="http://www.w3.org/2000/svg">${ombre.replace('<ellipse', '<ellipse class="ombre-sol"')}<g class="perso">${DESSINS[nom].replace(ombre, '')}</g></svg>`

// Un saut de joie : élan (on se tasse), envol étiré et un peu penché, bras et flambeau levés,
// jambes écartées en l'air, réception qui s'écrase puis se stabilise ; l'ombre reste au sol et rétrécit.
const SAUT: Keyframe[] = [
  { transform: 'translateY(0) rotate(0) scale(1, 1)', offset: 0 },
  { transform: 'translateY(3px) rotate(0) scale(1.07, .88)', offset: .18, easing: 'cubic-bezier(.2,.8,.3,1)' },
  { transform: 'translateY(-22px) rotate(-4deg) scale(.95, 1.08)', offset: .42, easing: 'ease-out' },
  { transform: 'translateY(-28px) rotate(2deg) scale(1, 1)', offset: .56, easing: 'ease-in' },
  { transform: 'translateY(0) rotate(0) scale(1.08, .9)', offset: .8, easing: 'ease-out' },
  { transform: 'translateY(-3px) rotate(0) scale(.98, 1.03)', offset: .9 },
  { transform: 'translateY(0) rotate(0) scale(1, 1)', offset: 1 },
]
const OMBRE: Keyframe[] = [
  { transform: 'scale(1)', opacity: .12, offset: 0 },
  { transform: 'scale(1.1)', opacity: .14, offset: .18 },
  { transform: 'scale(.6)', opacity: .06, offset: .56 },
  { transform: 'scale(1.12)', opacity: .14, offset: .8 },
  { transform: 'scale(1)', opacity: .12, offset: 1 },
]
/** Fait sauter de joie la mascotte contenue dans `el` (ou `el` lui-même s'il s'agit du dessin). */
export async function sauter(el: Element, fois = 1, leverLeBras = true): Promise<void> {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const svgEl = (el.matches('svg') ? el : el.querySelector('svg')) as SVGSVGElement | null
  if (!svgEl || svgEl.dataset.saute) return
  interrompre(svgEl)   // le saut de joie passe avant une surprise en cours
  svgEl.dataset.saute = '1'
  const perso = svgEl.querySelector('.perso')!, sol = svgEl.querySelector('.ombre-sol')   // pas d'ombre dans un médaillon
  for (let i = 0; i < fois; i++) {
    const envol = setTimeout(() => leverLeBras && svgEl.classList.add('en-l-air'), 160)
    const atterrit = setTimeout(() => svgEl.classList.remove('en-l-air'), 470)
    sol?.animate(OMBRE, { duration: 720 })
    await perso.animate(SAUT, { duration: 720 }).finished
    clearTimeout(envol); clearTimeout(atterrit); svgEl.classList.remove('en-l-air')
  }
  delete svgEl.dataset.saute
}
