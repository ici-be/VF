// Lecture minimale d'un classeur .xlsx (un zip de fichiers XML) : le nom de
// chaque onglet et le texte de ses cellules. Pas de formules ni de styles.
import { unzipSync, strFromU8 } from 'fflate'

export interface Onglet {
  nom: string
  lignes: string[][]
}

const NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
const NS_REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'

function xml(fichiers: Record<string, Uint8Array>, chemin: string): Document | null {
  const f = fichiers[chemin]
  return f ? new DOMParser().parseFromString(strFromU8(f), 'application/xml') : null
}

function texte(el: Element): string {
  // un texte peut être découpé en plusieurs morceaux <t> (mise en forme partielle)
  return Array.from(el.getElementsByTagNameNS(NS, 't')).map(t => t.textContent ?? '').join('')
}

function colonne(ref: string): number {
  let n = 0
  for (const c of ref.replace(/\d+$/, '')) n = n * 26 + (c.charCodeAt(0) - 64)
  return n - 1
}

function nombre(v: string): string {
  // 1 → « 1 », 1.5 → « 1.5 », et pas de 0.30000000000000004 ; cellule vide → ''
  if (v.trim() === '') return ''
  const n = Number(v)
  return Number.isFinite(n) ? String(Math.round(n * 1e9) / 1e9) : v
}

export function lireXlsx(octets: Uint8Array): Onglet[] {
  const fichiers = unzipSync(octets)
  const partages = Array.from(
    xml(fichiers, 'xl/sharedStrings.xml')?.getElementsByTagNameNS(NS, 'si') ?? [],
  ).map(texte)

  // nom de l'onglet → fichier de la feuille, via les relations du classeur
  const cibles = new Map<string, string>()
  for (const r of Array.from(xml(fichiers, 'xl/_rels/workbook.xml.rels')?.getElementsByTagName('Relationship') ?? [])) {
    const cible = r.getAttribute('Target') ?? ''
    cibles.set(r.getAttribute('Id') ?? '', cible.startsWith('/') ? cible.slice(1) : 'xl/' + cible)
  }

  const classeur = xml(fichiers, 'xl/workbook.xml')
  if (!classeur) throw new Error('Ce fichier n’est pas un classeur Excel valide.')
  return Array.from(classeur.getElementsByTagNameNS(NS, 'sheet')).map((s, i) => {
    const chemin = cibles.get(s.getAttributeNS(NS_REL, 'id') ?? '') ?? `xl/worksheets/sheet${i + 1}.xml`
    const lignes: string[][] = []
    for (const row of Array.from(xml(fichiers, chemin)?.getElementsByTagNameNS(NS, 'row') ?? [])) {
      const ligne: string[] = []
      for (const c of Array.from(row.getElementsByTagNameNS(NS, 'c'))) {
        const v = c.getElementsByTagNameNS(NS, 'v')[0]?.textContent ?? ''
        const type = c.getAttribute('t')
        ligne[colonne(c.getAttribute('r') ?? 'A')] =
          type === 's' ? (partages[Number(v)] ?? '')
          : type === 'inlineStr' ? texte(c)
          : type === 'str' || type === 'b' || type === 'e' ? v
          : nombre(v)
      }
      lignes[Number(row.getAttribute('r') ?? lignes.length + 1) - 1] = Array.from(ligne, x => x ?? '')
    }
    return { nom: s.getAttribute('name') ?? `Onglet ${i + 1}`, lignes: Array.from(lignes, x => x ?? []) }
  })
}
