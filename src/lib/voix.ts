// Lecture à voix haute. Pour l'instant : la synthèse vocale du navigateur, en
// choisissant la meilleure voix belge / néerlandaise / française disponible.
// (Étape suivante : des mp3 edge-tts préparés à l'avance, cette voix-ci en secours.)

const PREFERENCES: Record<'fr' | 'nl', string[]> = {
  nl: ['nl-BE', 'nl-NL', 'nl'],
  fr: ['fr-BE', 'fr-FR', 'fr'],
}

const synth = typeof speechSynthesis !== 'undefined' ? speechSynthesis : null
let voixDispo: SpeechSynthesisVoice[] = []
const charger = () => (voixDispo = synth?.getVoices() ?? [])
charger()
synth?.addEventListener?.('voiceschanged', charger)

function choisirVoix(langue: 'fr' | 'nl'): SpeechSynthesisVoice | undefined {
  for (const code of PREFERENCES[langue]) {
    const candidates = voixDispo.filter(v => v.lang.replace('_', '-').toLowerCase().startsWith(code.toLowerCase()))
    if (!candidates.length) continue
    // les voix « en ligne » / Google / Natural sont nettement moins robotiques
    return candidates.find(v => /google|natural|online|neural/i.test(v.name)) ?? candidates[0]
  }
  return undefined
}

/** Le texte à lire : sans crochets ni précisions entre parenthèses. */
export function texteALire(t: string): string {
  return t.replace(/\([^)]*\)/g, ' ').replace(/[\[\]]/g, '').replace(/\s*\/\s*/g, ', ').replace(/\s+/g, ' ').trim()
}

/** Lit le texte ; la promesse se résout à la fin (ou tout de suite sans voix). */
export function parler(texte: string, langue: 'fr' | 'nl', vitesse = 0.9): Promise<void> {
  if (!synth || !texte.trim()) return Promise.resolve()
  synth.cancel()
  return new Promise(resolve => {
    const u = new SpeechSynthesisUtterance(texteALire(texte))
    const v = choisirVoix(langue)
    if (v) u.voice = v
    u.lang = v?.lang ?? PREFERENCES[langue][0]
    u.rate = vitesse
    // filet de sécurité : certains navigateurs n'envoient jamais « end »
    const fin = setTimeout(resolve, 1500 + texte.length * 120)
    u.onend = u.onerror = () => { clearTimeout(fin); resolve() }
    synth.speak(u)
  })
}

export function taire(): void {
  synth?.cancel()
}

export const voixDisponible = () => synth !== null
