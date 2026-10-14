import { describe, expect, it } from 'vitest'
import { initiale, lienUtilisateur, memeNom, nettoyerNom, nomDuLien } from '../src/lib/utilisateur'
import { compresser, decompresser } from '../src/lib/script'
import { readFileSync } from 'node:fs'

describe('utilisateur', () => {
  it('le prénom : une ligne, sans espaces en trop, sans tenir compte des majuscules', () => {
    expect(nettoyerNom('  Olivia \n Marie ')).toBe('Olivia Marie')
    expect(memeNom('olivia', ' OLIVIA')).toBe(true)
    expect(memeNom('Zoé', 'Zoe')).toBe(false)
    expect(initiale('élodie')).toBe('É')
  })
  it('le lien de l’utilisateur, et le prénom qu’on en relit', () => {
    expect(lienUtilisateur('Olivia', 'https://ici.be/VF/')).toBe('https://ici.be/VF/u/Olivia')
    expect(lienUtilisateur('Zoé Lou', 'https://ici.be/VF/')).toBe('https://ici.be/VF/u/Zo%C3%A9%20Lou')
    expect(nomDuLien('#u=Zo%C3%A9%20Lou')).toBe('Zoé Lou')
    expect(nomDuLien('#u=%E0')).toBe('')
  })
})

describe('liens courts', () => {
  // la redirection de public/404.html et d'index.html
  const script = readFileSync('public/404.html', 'utf8').match(/var m = location\.pathname\.match\((\/.*\/)\)/)![1]
  const re = new RegExp(script.slice(1, -1))
  const vers = (chemin: string) => { const m = chemin.match(re); return m && m[1] + '#' + m[2] + '=' + m[3] }
  it('…/z/G8T9 et …/u/Olivia mènent à l’accueil', () => {
    expect(vers('/VF/z/G8T9')).toBe('/VF/#z=G8T9')
    expect(vers('/VF/u/Zo%C3%A9/')).toBe('/VF/#u=Zo%C3%A9')
    expect(vers('/z/G8T9')).toBe('/#z=G8T9')
    expect(vers('/VF/')).toBe(null)
    expect(vers('/VF/audio/x.mp3')).toBe(null)
  })
  it('index.html redirige de la même façon', () => {
    expect(readFileSync('index.html', 'utf8')).toContain(`location.pathname.match(${script})`)
  })
  it('la progression compressée se relit', async () => {
    const s = { progression: { 'Aard|zee': { boite: 2, dernier: 5 } }, journal: { '2026-10-14': 12 }, ratesInterro: ['é'] }
    const t = await compresser(s)
    expect(t).toMatch(/^[\w-]+=*$/)
    expect(await decompresser(t)).toEqual(s)
  })
})
