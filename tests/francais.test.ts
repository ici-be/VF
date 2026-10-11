// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { zipSync, strToU8 } from 'fflate'
import { apparence, langueMatiere } from '../src/lib/apparence'
import { contenu, matiereDepuisOnglet, vocabulaireDepuisXlsx } from '../src/lib/mots'
import { aReviser, exercice, type Reglages } from '../src/lib/reglages'
import { construireSerie, question, reponse } from '../src/lib/seance'
import { decouper, indexer } from '../src/lib/glossaire'

/** un classeur .xlsx de plusieurs onglets, cellules en texte */
function classeur(onglets: Record<string, string[][]>): Uint8Array {
  const ns = 'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"'
  const nsr = 'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"'
  const noms = Object.keys(onglets)
  const col = (i: number) => String.fromCharCode(65 + i)
  const fichiers: Record<string, Uint8Array> = {
    'xl/workbook.xml': strToU8(`<workbook ${ns} ${nsr}><sheets>${noms.map((n, i) => `<sheet name="${n}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>`),
    'xl/_rels/workbook.xml.rels': strToU8(`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${noms.map((_, i) => `<Relationship Id="rId${i + 1}" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}</Relationships>`),
  }
  noms.forEach((n, i) => {
    const lignes = onglets[n].map((l, r) => `<row r="${r + 1}">${l.map((c, k) => `<c r="${col(k)}${r + 1}" t="inlineStr"><is><t>${c}</t></is></c>`).join('')}</row>`)
    fichiers[`xl/worksheets/sheet${i + 1}.xml`] = strToU8(`<worksheet ${ns}><sheetData>${lignes.join('')}</sheetData></worksheet>`)
  })
  return zipSync(fichiers)
}

const voc = vocabulaireDepuisXlsx(classeur({
  'HW Geschiedenis': [['Néerlandais', 'Français', 'Chapitre'], ['eeuw', 'le siècle', '1. Tijd']],
  'Français': [['Chapitre', 'Page', 'Mot', 'Définition', 'Exemple'],
    ['1. Figures de style', '4', 'métaphore', 'comparaison sans outil de comparaison', 'Cette femme est une [métaphore] vivante.'],
    ['1. Figures de style', '5', 'comparaison', 'rapprochement de deux éléments avec un outil de comparaison', '']],
  'Vragen': [['Matière', 'Chapitre', 'Question', 'Réponse'],
    ['Religion', '1. La Bible', 'Combien de livres compte la Bible ?', '73'],
    ['Français', '1. Figures de style', 'Qu’est-ce qu’une antithèse ?', 'Deux idées opposées rapprochées'],
    ['HW Geschiedenis', '1. Tijd', 'Wat is een eeuw?', 'Een periode van 100 jaar']],
}))
const matiere = (nom: string) => voc.matieres.find(m => m.nom === nom)!
const reglages = (p: Partial<Reglages>): Reglages => ({
  matieres: [], chapitres: [], pages: {}, exercice: 'qcm', sens: 'mix', repondre: 'choix', nombre: 0, ordre: 'hasard',
  delai: 5, voix: false, notes: false, exigerArticle: false, temps: 'present', ...p,
} as Reglages)

describe('matières en français', () => {
  it('Français et Religion sont en français, sans préfixe ; « FR » pour les autres', () => {
    expect(['Français', 'Religion', '🕊️ Religion', 'FR Latin', 'Frans'].map(langueMatiere)).toEqual(['fr', 'fr', 'fr', 'fr', 'fr'])
    expect(['HW Geschiedenis', 'Nederlands', 'NW Biologie', 'HW Socio-economie'].map(langueMatiere)).toEqual(['nl', 'nl', 'nl', 'nl'])
    expect(apparence('FR Latin').titre).toBe('Latin')
    expect(apparence('Français')).toMatchObject({ icone: '📖', titre: 'Français' })
  })
  it('un onglet « Mot / Définition » : la définition tient lieu de traduction', () => {
    const [m] = matiere('Français').mots
    expect(m).toMatchObject({ nl: 'métaphore', fr: 'comparaison sans outil de comparaison', definition: 'comparaison sans outil de comparaison', page: 4 })
    // un onglet néerlandais avec une colonne « Mot » n'est pas lu ainsi
    expect(matiereDepuisOnglet({ nom: 'HW Geschiedenis', lignes: [['Mot', 'Définition'], ['a', 'b']] })).toBeNull()
  })
  it('une matière sans onglet de mots garde ses questions', () => {
    const religion = matiere('Religion')
    expect(religion.mots).toEqual([])
    expect(religion.chapitres).toEqual(['1. La Bible'])
    expect(contenu(religion).map(q => q.fr)).toEqual(['73'])
  })
  it('seuls les exercices qui conviennent au français prennent ces mots', () => {
    const r = reglages({ matieres: ['Français', 'HW Geschiedenis'] })
    const pour = (id: string) => aReviser(voc, r, exercice(id as Reglages['exercice'])).map(m => m.nl)
    expect(pour('qcm')).toEqual(['eeuw'])
    expect(pour('dehet')).toEqual([])
    expect(pour('definitions')).toEqual(['métaphore', 'comparaison'])
    expect(pour('defilement')).toEqual(['eeuw', 'métaphore', 'comparaison'])
    expect(pour('questions')).toHaveLength(2)
  })
  it('en français : le mot puis sa définition, lus en français', () => {
    const [c] = construireSerie([matiere('Français').mots[0]], reglages({ exercice: 'defilement', sens: 'fr-nl' }))
    expect(c.sens).toBe('nl-fr')
    expect(question(c)).toEqual({ texte: 'métaphore', langue: 'fr' })
    expect(reponse(c).langue).toBe('fr')
  })
  it('pas de traduction au survol pour les mots français', () => {
    const index = indexer(voc.matieres.flatMap(m => m.mots))
    expect(decouper(index, 'Een eeuw, une métaphore').filter(s => typeof s !== 'string').map(s => (s as { texte: string }).texte)).toEqual(['eeuw'])
  })
})

