import { beforeEach, describe, expect, it, vi } from 'vitest'
import { envoyerEnAttente, raisons, signaler } from '../src/lib/signalements'
import type { Mot } from '../src/lib/mots'

const mot = (p: Partial<Mot> = {}): Mot => ({ id: 'x', matiere: 'HW Geschiedenis', chapitre: '1. Tijd', nl: 'eeuw', det: 'de', fr: 'le siècle', definition: '', exemple: '', remarque: '', page: 12, ...p })
const enAttente = () => JSON.parse(localStorage.getItem('vocab-nl.signalements-a-envoyer') ?? '[]')

describe('signalements', () => {
  beforeEach(() => {
    const m = new Map<string, string>()
    globalThis.localStorage = { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) } as Storage
  })
  it('les raisons selon le genre : question, mot néerlandais (avec de/het), mot français', () => {
    expect(raisons(mot({ vraag: { leurres: [], page: '', elements: [], nombre: 0 } })).map(r => r.id)).toContain('autre-juste')
    expect(raisons(mot()).map(r => r.id)).toContain('article')
    expect(raisons(mot({ matiere: 'Religion' })).map(r => r.texte)).toContain('La définition est fausse')
  })
  it('envoyé : la file se vide ; le signalement contient le mot, la réponse et les raisons choisies', async () => {
    const f = vi.fn(async (_url: string, _options?: RequestInit) => new Response(JSON.stringify({ ok: true })))
    globalThis.fetch = f as typeof fetch
    expect(await signaler(mot(), ['traduction'], '  plutôt « le siècle »  ', 'QCM', 'faux')).toBe(true)
    expect(enAttente()).toEqual([])
    const corps = JSON.parse(f.mock.calls[0][1]!.body as string)
    expect(corps).toMatchObject({ action: 'signaler', matiere: 'HW Geschiedenis', element: 'de eeuw', reponse: 'le siècle', page: '12', raisons: 'La traduction est fausse', commentaire: 'plutôt « le siècle »', exercice: 'QCM', resultat: 'faux' })
    expect(corps.appareil).toBeTruthy()
  })
  it('pas de réseau, ou trop d’envois : le signalement attend ; refusé : il est oublié', async () => {
    globalThis.fetch = (async () => { throw new TypeError('Failed to fetch') }) as typeof fetch
    expect(await signaler(mot(), ['autre'], '')).toBe(false)
    expect(enAttente()).toHaveLength(1)
    globalThis.fetch = (async () => new Response(JSON.stringify({ ok: false, erreur: 'trop de signalements, réessayer dans une minute' }))) as typeof fetch
    expect(await envoyerEnAttente()).toBe(false)
    expect(enAttente()).toHaveLength(1)
    // le script du tableau pas encore redéployé (il demande la clé) : on attend aussi
    globalThis.fetch = (async () => new Response(JSON.stringify({ ok: false, erreur: 'clé incorrecte' }))) as typeof fetch
    expect(await envoyerEnAttente()).toBe(false)
    expect(enAttente()).toHaveLength(1)
    globalThis.fetch = (async () => new Response(JSON.stringify({ ok: false, erreur: 'signalement incomplet' }))) as typeof fetch
    expect(await envoyerEnAttente()).toBe(true)
    expect(enAttente()).toHaveLength(0)
  })
})
