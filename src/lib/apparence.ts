// Icône, nom en français et mascotte de chaque matière, d'après le nom de l'onglet.
import type { Mascotte } from './mascottes'
// Un onglet dont le nom commence par un emoji garde cet emoji comme icône.

interface Apparence {
  icone: string
  /** le nom sans l'emoji ni le préfixe « HW » / « NW » */
  titre: string
  /** nom français, si on le connaît (même identique : Biologie) */
  fr?: string
  /** la mascotte de la matière (les cinq matières actuelles) */
  mascotte?: Mascotte
}

/** La langue du cours : néerlandais (immersion), ou français (Français, Religion, Mathématiques, onglets « FR … »). */
export type LangueCours = 'nl' | 'fr'

const CONNUES: [RegExp, string, string, Mascotte?][] = [
  [/geschiedenis|histoire/i, '🏛️', 'Histoire', 'chevalier'],
  [/aardrijkskunde|geografie|géographie/i, '🌍', 'Géographie', 'colomb'],
  [/socio|economi/i, '🤝', 'Socio-économie', 'detective'],
  [/biologie/i, '🌱', 'Biologie', 'grenouille'],
  [/wetenschap|sciences?/i, '🔬', 'Sciences'],
  [/fysica|natuurkunde|physique/i, '⚛️', 'Physique'],
  [/chemie|chimie/i, '🧪', 'Chimie', 'curie'],
  [/wiskunde|math/i, '📐', 'Mathématiques', 'pythagore'],
  [/techn/i, '⚙️', 'Technologie'],
  [/informatica|informatique/i, '💻', 'Informatique'],
  [/muziek|musique/i, '🎵', 'Musique'],
  [/kunst|beeldende|\barts?\b/i, '🎨', 'Arts'],
  [/lichamelijke|sport|\bLO\b/i, '⚽', 'Sport'],
  [/godsdienst|religi|levensbeschouw|morale?/i, '🕊️', 'Religion', 'moine'],
  [/fran[cç]ais|\bfrans\b/i, '📖', 'Français', 'moliere'],
  [/engels|anglais|english/i, '🇬🇧', 'Anglais'],
  [/duits|allemand/i, '🇩🇪', 'Allemand'],
  [/néerlandais|nederlands|neerlandais/i, '💬', 'Néerlandais', 'renard'],
]

// les matières données en français (pas en immersion) : leurs mots et questions sont en français
const EN_FRANCAIS = /godsdienst|religi|levensbeschouw|morale?|fran[cç]ais|\bfrans\b|math/i
const PREFIXE_FR = /^FR\s+/

const EMOJI_DEBUT = /^(\p{Extended_Pictographic}|\p{Regional_Indicator}{2})️?\s*/u

export function apparence(nom: string): Apparence {
  const emoji = nom.match(EMOJI_DEBUT)
  const sansEmoji = emoji ? nom.slice(emoji[0].length) : nom
  const titre = sansEmoji.replace(/^(HW|NW|MW|AV|FR)\s+/, '').trim() || sansEmoji
  const connue = CONNUES.find(([re]) => re.test(sansEmoji))
  return { icone: emoji ? emoji[1] : connue?.[1] ?? '📚', titre, fr: connue?.[2], mascotte: connue?.[3] }
}

/** La langue d'une matière, d'après le nom de son onglet. */
export function langueMatiere(nom: string): LangueCours {
  const sansEmoji = nom.replace(EMOJI_DEBUT, '')
  return PREFIXE_FR.test(sansEmoji) || EN_FRANCAIS.test(sansEmoji) ? 'fr' : 'nl'
}

/** La langue d'un mot ou d'une question : celle de sa matière. */
export const langueDe = (m: { matiere: string }) => langueMatiere(m.matiere)
