// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { zipSync, strToU8 } from 'fflate'
import { lireXlsx } from '../src/lib/xlsx'
import { dateAjout, derniersAjouts, matiereDepuisOnglet, SANS_CHAPITRE, vocabulaireDepuisXlsx } from '../src/lib/mots'

// petit classeur .xlsx fabriqué à la main, avec la même structure que Google Sheets
function classeur(): Uint8Array {
  const ns = 'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"'
  const nsr = 'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"'
  const partages = ['Néerlandais', 'Dét.', 'Français', 'Définition', 'Chapitre', 'geloof', 'het', 'la croyance', 'Het geloven in God', '0. Inleiding', 'klinker', 'la voyelle']
  const s = (ref: string, i: number) => `<c r="${ref}" t="s"><v>${i}</v></c>`
  const feuille = `<worksheet ${ns}><sheetData>
    <row r="1">${s('A1', 0)}${s('B1', 1)}${s('C1', 2)}${s('D1', 3)}${s('E1', 4)}</row>
    <row r="2">${s('A2', 5)}${s('B2', 6)}${s('C2', 7)}${s('D2', 8)}${s('E2', 9)}</row>
    <row r="4">${s('A4', 10)}${s('C4', 11)}<c r="E4" s="3"/></row>
    <row r="5"><c r="A5" t="inlineStr"><is><t>aanduiden</t></is></c><c r="C5" t="inlineStr"><is><t>indiquer</t></is></c><c r="E5"><v>1</v></c></row>
  </sheetData></worksheet>`
  return zipSync({
    'xl/workbook.xml': strToU8(`<workbook ${ns} ${nsr}><sheets><sheet name="HW Geschiedenis" sheetId="1" r:id="rId1"/></sheets></workbook>`),
    'xl/_rels/workbook.xml.rels': strToU8('<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>'),
    'xl/sharedStrings.xml': strToU8(`<sst ${ns}>${partages.map(p => `<si><t>${p}</t></si>`).join('')}</sst>`),
    'xl/worksheets/sheet1.xml': strToU8(feuille),
  })
}

describe('lecture du tableau', () => {
  it('lit les onglets et les cellules', () => {
    const [o] = lireXlsx(classeur())
    expect(o.nom).toBe('HW Geschiedenis')
    expect(o.lignes[1]).toEqual(['geloof', 'het', 'la croyance', 'Het geloven in God', '0. Inleiding'])
    expect(o.lignes[3][1]).toBe('')
    expect(o.lignes[4][4]).toBe('1')
  })
  it('reconnaît les colonnes par leur nom et range les mots sans chapitre', () => {
    const v = vocabulaireDepuisXlsx(classeur())
    const m = v.matieres[0]
    expect(m.mots).toHaveLength(3)
    expect(m.mots[0]).toMatchObject({ nl: 'geloof', det: 'het', fr: 'la croyance', definition: 'Het geloven in God', chapitre: '0. Inleiding', exemple: '' })
    expect(m.mots[1].chapitre).toBe(SANS_CHAPITRE)
    expect(m.chapitres).toEqual(['0. Inleiding', '1', SANS_CHAPITRE])
  })
  it('ignore un onglet sans colonnes reconnues', () => {
    expect(matiereDepuisOnglet({ nom: 'Notes', lignes: [['bla', 'bla']] })).toBeNull()
  })
  it('donne un identifiant unique aux doublons de chapitres différents', () => {
    const m = matiereDepuisOnglet({ nom: 'A', lignes: [['Néerlandais', 'Français', 'Chapitre'], ['rivier', 'la rivière', '1'], ['rivier', 'la rivière', '2']] })!
    expect(new Set(m.mots.map(x => x.id)).size).toBe(2)
  })
  it('lit la date d’ajout, en texte ou convertie en nombre par Sheets', () => {
    expect(dateAjout('2026-10-10')).toBe('2026-10-10')
    expect(dateAjout('46305')).toBe('2026-10-10')
    expect(dateAjout('')).toBe('')
    expect(dateAjout('3')).toBe('')
  })
  it('donne les mots du dernier envoi, toutes matières confondues', () => {
    const titres = ['Néerlandais', 'Français', 'Chapitre', 'Ajouté']
    const a = matiereDepuisOnglet({ nom: 'A', lignes: [titres, ['oud', 'vieux', '1', ''], ['zee', 'la mer', '1', '2026-10-10'], ['berg', 'la montagne', '1', '2026-09-01']] })!
    const b = matiereDepuisOnglet({ nom: 'B', lignes: [titres, ['cel', 'la cellule', '1', '2026-10-10']] })!
    const d = derniersAjouts({ matieres: [a, b], misAJour: 0 })
    expect(d.date).toBe('2026-10-10')
    expect(d.mots.map(m => m.nl)).toEqual(['zee', 'cel'])
    expect(a.mots[0].ajoute).toBeUndefined()
    expect(derniersAjouts({ matieres: [], misAJour: 0 })).toEqual({ date: '', mots: [] })
  })
})
