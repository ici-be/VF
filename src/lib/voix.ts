// Lecture à voix haute. D'abord les mp3 edge-tts préparés par outils/voix.py
// (voix belges, identiques sur tous les appareils) ; pour un mot qui n'a pas
// encore son mp3, la synthèse vocale du navigateur prend le relais.

export const VOIX = { nl: 'nl-BE-DenaNeural', fr: 'fr-BE-CharlineNeural' } as const
export const VITESSE = '-10%'

/**
 * Abréviations lues en entier (identiques à ABREVIATIONS dans outils/voix.py) :
 * sinon la voix néerlandaise épelle « v.C. ». Ajouter ici, et dans voix.py, celles des prochains cours.
 */
const ABREVIATIONS: [RegExp, string][] = [
  [/\bv\.\s?C(hr)?\./g, 'voor Christus'],
  [/\bn\.\s?C(hr)?\./g, 'na Christus'],
  [/\b(bv|bijv)\./g, 'bijvoorbeeld'],
  [/\b[Vv]b\./g, 'voorbeeld'],
  [/\benz\./g, 'enzovoort'],
  [/\bd\.w\.z\./g, 'dat wil zeggen'],
  [/\bm\.a\.w\./g, 'met andere woorden'],
  [/\bo\.a\./g, 'onder andere'],
  [/\bca\./g, 'circa'],
]

/** Le texte à lire : sans crochets ni précisions entre parenthèses (identique à outils/voix.py). */
export function texteALire(t: string): string {
  for (const [abr, mot] of ABREVIATIONS) t = t.replace(abr, mot)
  return t.normalize('NFC').replace(/\([^)]*\)/g, ' ').replace(/[\[\]]/g, '').replace(/\s*\/\s*/g, ', ').replace(/\s+/g, ' ').trim()
}

/** Nom du fichier mp3 d'un texte (identique à empreinte() dans outils/voix.py). */
export async function empreinte(langue: 'fr' | 'nl', texte: string): Promise<string> {
  const cle = new TextEncoder().encode(`${VOIX[langue]}|${VITESSE}|${texteALire(texte)}`)
  const h = new Uint8Array(await crypto.subtle.digest('SHA-1', cle))
  return Array.from(h.slice(0, 8), b => b.toString(16).padStart(2, '0')).join('')
}

// ---------------------------------------------------------- mp3 disponibles
let index: Promise<Set<string>> | null = null
function fichiersDisponibles(): Promise<Set<string>> {
  return (index ??= fetch('./audio/index.json')
    .then(r => (r.ok ? r.json() : { fichiers: [] }))
    .then(j => new Set<string>(j.fichiers ?? []))
    .catch(() => new Set<string>()))
}

async function urlMp3(texte: string, langue: 'fr' | 'nl'): Promise<string | null> {
  const h = await empreinte(langue, texte)
  return (await fichiersDisponibles()).has(h) ? `./audio/${h}.mp3` : null
}

/** Télécharge à l'avance les voix d'une série (pas d'attente, et disponibles hors ligne). */
export async function precharger(textes: { texte: string; langue: 'fr' | 'nl' }[]): Promise<void> {
  const urls = (await Promise.all(textes.map(t => urlMp3(t.texte, t.langue)))).filter((u): u is string => !!u)
  for (let i = 0; i < urls.length; i += 6) {
    await Promise.all(urls.slice(i, i + 6).map(u => fetch(u).catch(() => null)))
  }
}

// ------------------------------------------------------- voix du navigateur
const synth = typeof speechSynthesis !== 'undefined' ? speechSynthesis : null
let voixNavigateur: SpeechSynthesisVoice[] = []
const chargerVoix = () => (voixNavigateur = synth?.getVoices() ?? [])
chargerVoix()
synth?.addEventListener?.('voiceschanged', chargerVoix)

function choisirVoix(langue: 'fr' | 'nl'): SpeechSynthesisVoice | undefined {
  for (const code of langue === 'nl' ? ['nl-be', 'nl-nl', 'nl'] : ['fr-be', 'fr-fr', 'fr']) {
    const candidates = voixNavigateur.filter(v => v.lang.replace('_', '-').toLowerCase().startsWith(code))
    if (candidates.length) return candidates.find(v => /google|natural|online|neural/i.test(v.name)) ?? candidates[0]
  }
  return undefined
}

function parlerNavigateur(texte: string, langue: 'fr' | 'nl', vitesse: number, fini: () => void): () => void {
  if (!synth) { fini(); return () => {} }
  const u = new SpeechSynthesisUtterance(texte)
  const v = choisirVoix(langue)
  if (v) u.voice = v
  u.lang = v?.lang ?? (langue === 'nl' ? 'nl-BE' : 'fr-BE')
  u.rate = 0.9 * vitesse
  // filet de sécurité, large, pour les navigateurs qui n'envoient jamais « end »
  const secours = setTimeout(fini, 4000 + texte.length * 200)
  u.onend = u.onerror = () => { clearTimeout(secours); fini() }
  synth.speak(u)
  return () => { clearTimeout(secours); synth.cancel() }
}

// ---------------------------------------------------------------- lecture
const lecteur = typeof Audio !== 'undefined' ? new Audio() : null
let arreterEnCours: (() => void) | null = null

/**
 * Lit le texte ; la promesse se résout quand la lecture est finie (ou interrompue).
 * vitesse : 1 = normale, 0.7 = au ralenti (dictée).
 */
export function parler(texte: string, langue: 'fr' | 'nl', vitesse = 1): Promise<void> {
  taire()
  const t = texteALire(texte)
  if (!t) return Promise.resolve()
  return new Promise(resolve => {
    let termine = false
    let arreterNavigateur = () => {}
    const fini = () => {
      if (termine) return
      termine = true
      if (lecteur) { lecteur.onended = lecteur.onerror = null }
      arreterEnCours = null
      resolve()
    }
    arreterEnCours = () => { lecteur?.pause(); arreterNavigateur(); fini() }

    let secoursLance = false
    const secours = () => {
      if (termine || secoursLance) return
      secoursLance = true
      arreterNavigateur = parlerNavigateur(t, langue, vitesse, fini)
    }
    urlMp3(t, langue).then(url => {
      if (termine) return
      if (!url || !lecteur) { secours(); return }
      lecteur.onended = fini
      // mp3 introuvable (hors ligne et pas encore en cache…) : voix du navigateur
      lecteur.onerror = secours
      lecteur.src = url
      lecteur.defaultPlaybackRate = lecteur.playbackRate = vitesse
      lecteur.play().catch(secours)
    })
  })
}

/** Coupe la lecture en cours (la promesse de parler() se résout). */
export function taire(): void {
  arreterEnCours?.()
}
