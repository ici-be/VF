// Écoute au micro (reconnaissance vocale de Chrome : Google Chrome sur Linux,
// Chrome sur Android). Firefox ne l'a pas : l'oral passe alors en auto-évaluation.

interface Reconnaissance {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  continuous: boolean
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start(): void
  abort(): void
}

type Constructeur = new () => Reconnaissance

function constructeur(): Constructeur | null {
  const w = globalThis as unknown as { SpeechRecognition?: Constructeur; webkitSpeechRecognition?: Constructeur }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export const ecouteDisponible = () => constructeur() !== null

export class ErreurEcoute extends Error {
  constructor(public raison: 'micro-refuse' | 'reseau' | 'autre', message: string) { super(message) }
}

export interface Ecoute {
  /** ce que la reconnaissance a compris (plusieurs propositions) ; [] si rien entendu */
  resultat: Promise<string[]>
  arreter: () => void
}

export function ecouter(langue: 'fr' | 'nl'): Ecoute {
  const C = constructeur()
  if (!C) return { resultat: Promise.reject(new ErreurEcoute('autre', 'Pas de reconnaissance vocale dans ce navigateur.')), arreter: () => {} }
  const r = new C()
  r.lang = langue === 'nl' ? 'nl-BE' : 'fr-BE'
  r.interimResults = false
  r.maxAlternatives = 5
  r.continuous = false
  let fini = false
  const resultat = new Promise<string[]>((resolve, reject) => {
    let entendu: string[] = []
    r.onresult = e => {
      const res = e.results[0]
      entendu = Array.from({ length: res?.length ?? 0 }, (_, i) => res[i].transcript.trim()).filter(Boolean)
    }
    r.onerror = e => {
      fini = true
      if (e.error === 'no-speech' || e.error === 'aborted') resolve([])
      else if (e.error === 'not-allowed' || e.error === 'service-not-allowed') reject(new ErreurEcoute('micro-refuse', 'Le micro est bloqué. Autorise-le dans Chrome (icône à gauche de l’adresse).'))
      else if (e.error === 'network') reject(new ErreurEcoute('reseau', 'La reconnaissance vocale a besoin d’internet.'))
      else reject(new ErreurEcoute('autre', `Le micro ne fonctionne pas (${e.error}).`))
    }
    r.onend = () => { fini = true; resolve(entendu) }
  })
  r.start()
  return { resultat, arreter: () => { if (!fini) r.abort() } }
}
