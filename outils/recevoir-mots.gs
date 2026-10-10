/**
 * Reçoit les mots extraits d'un cours (envoyés par outils/envoyer-mots.py) et les
 * range dans le bon onglet du tableau.
 *
 * Installation (une seule fois) :
 *  1. Dans le tableau : Extensions → Apps Script. Créer un fichier « recevoir-mots »
 *     (＋ à côté de Fichiers → Script), y coller ce code, enregistrer.
 *  2. Choisir la fonction installer, cliquer sur ▶ Exécuter, accepter l'autorisation.
 *     Le journal affiche la clé secrète.
 *  3. Déployer → Nouveau déploiement → type « Application Web » ;
 *     Exécuter en tant que : Moi ; Qui a accès : Tout le monde. Copier l'URL.
 *  4. Sur le laptop : python3 outils/envoyer-mots.py --configurer
 *     (il demande l'URL et la clé, et les garde hors du dépôt).
 *
 * Après une modification de ce code : Déployer → Gérer les déploiements → ✎ →
 * Version : Nouvelle version (l'URL reste la même).
 *
 * Ce que fait un envoi, pour chaque ligne :
 *  - le mot est déjà dans ce chapitre → seule sa case « Page » est remplie si elle était vide ;
 *  - sinon → il est ajouté, surligné en jaune (à relire, puis enlever la couleur).
 * Ensuite l'onglet est trié : chapitres dans leur ordre actuel, et dans chaque chapitre
 * les mots dans l'ordre des pages (les mots sans page restent à la fin du chapitre,
 * dans leur ordre actuel). Avec « essai », rien n'est écrit : la réponse dit ce qui serait fait.
 */

const JAUNE = '#fff2cc'

// mêmes noms de colonnes que l'appli (src/lib/mots.ts), plus « Page »
const COLONNES = {
  nl: ['néerlandais', 'nederlands', 'nl'],
  det: ['dét.', 'dét', 'det', 'déterminant', 'lidwoord', 'article'],
  fr: ['français', 'frans', 'fr'],
  definition: ['définition', 'definition', 'definitie'],
  exemple: ['exemple', 'voorbeeld', 'phrase'],
  remarque: ['remarque', 'remarques', 'opmerking'],
  chapitre: ['chapitre', 'hoofdstuk'],
  page: ['page', 'pagina', 'blz', 'blz.'],
}

function installer() {
  const props = PropertiesService.getScriptProperties()
  if (!props.getProperty('CLE')) props.setProperty('CLE', Utilities.getUuid().replace(/-/g, ''))
  Logger.log('Clé secrète : ' + props.getProperty('CLE'))
}

function doGet(e) {
  return repondre(() => {
    verifierCle(e.parameter.cle)
    return { ok: true, onglets: SpreadsheetApp.getActive().getSheets().map(s => s.getName()) }
  })
}

function doPost(e) {
  return repondre(() => {
    const req = JSON.parse(e.postData.contents)
    verifierCle(req.cle)
    const verrou = LockService.getScriptLock()
    verrou.waitLock(30000)
    try {
      return recevoir(req.onglet, req.lignes || [], !!req.essai)
    } finally {
      verrou.releaseLock()
    }
  })
}

function repondre(f) {
  let res
  try {
    res = f()
  } catch (err) {
    res = { ok: false, erreur: String(err.message || err) }
  }
  return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON)
}

function verifierCle(cle) {
  const attendue = PropertiesService.getScriptProperties().getProperty('CLE')
  if (!attendue || cle !== attendue) throw new Error('clé incorrecte')
}

const norm = s => String(s == null ? '' : s).trim().toLowerCase()

function recevoir(nomOnglet, lignes, essai) {
  const feuille = SpreadsheetApp.getActive().getSheetByName(nomOnglet)
  if (!feuille) throw new Error('onglet introuvable : ' + nomOnglet)

  let titres = feuille.getRange(1, 1, 1, feuille.getLastColumn()).getValues()[0].map(norm)
  const col = {}
  for (const cle in COLONNES) col[cle] = titres.findIndex(t => COLONNES[cle].includes(t))
  if (col.nl < 0 || col.fr < 0) throw new Error('colonnes « Néerlandais » et « Français » introuvables')
  if (col.page < 0 && !essai) {
    feuille.getRange(1, titres.length + 1).setValue('Page')
    col.page = titres.length
    titres.push('page')
  }
  const largeur = titres.length

  const n = feuille.getLastRow() - 1
  const donnees = n > 0 ? feuille.getRange(2, 1, n, largeur).getValues() : []
  const index = new Map()   // « mot␟chapitre » → numéro de ligne dans donnees
  donnees.forEach((l, i) => index.set(norm(l[col.nl]) + '␟' + norm(l[col.chapitre]), i))

  const res = { ok: true, essai, ajoutes: [], pages: [], dejaLa: [] }
  const nouvelles = []
  for (const m of lignes) {
    const cle = norm(m.nl) + '␟' + norm(m.chapitre)
    if (!norm(m.nl) || !norm(m.fr)) continue
    if (index.has(cle)) {
      const i = index.get(cle)   // -1 : mot en double dans l'envoi lui-même
      // (en essai, la colonne Page n'existe peut-être pas encore : elle serait vide)
      if (i >= 0 && m.page && (col.page < 0 || !String(donnees[i][col.page]).trim())) {
        res.pages.push(m.nl)
        if (!essai) feuille.getRange(i + 2, col.page + 1).setValue(m.page)
      } else {
        res.dejaLa.push(m.nl)
      }
      continue
    }
    const l = new Array(largeur).fill('')
    for (const k in COLONNES) if (col[k] >= 0 && m[k] != null) l[col[k]] = m[k]
    nouvelles.push(l)
    index.set(cle, -1)
    res.ajoutes.push(m.nl)
  }

  if (essai) return res
  if (nouvelles.length) {
    const r = feuille.getRange(feuille.getLastRow() + 1, 1, nouvelles.length, largeur)
    r.setValues(nouvelles)
    r.setBackground(JAUNE)
  }
  if (col.page >= 0 && col.chapitre >= 0) trierParPage(feuille, col, largeur)
  return res
}

/** Trie l'onglet : chapitres dans l'ordre de leur première apparition, puis page, puis ordre actuel. */
function trierParPage(feuille, col, largeur) {
  const n = feuille.getLastRow() - 1
  if (n < 2) return
  const donnees = feuille.getRange(2, 1, n, largeur).getValues()
  const rangChapitre = new Map()
  const cles = donnees.map((l, i) => {
    const ch = norm(l[col.chapitre])
    if (!rangChapitre.has(ch)) rangChapitre.set(ch, rangChapitre.size)
    const page = parseInt(l[col.page], 10)
    return [rangChapitre.get(ch) * 1e9 + (isNaN(page) ? 99999 : page) * 1e4 + i]
  })
  // colonne provisoire pour que le tri déplace aussi la mise en forme des lignes
  const tmp = largeur + 1
  feuille.insertColumnAfter(largeur)
  feuille.getRange(2, tmp, n, 1).setValues(cles)
  feuille.getRange(2, 1, n, tmp).sort(tmp)
  feuille.deleteColumn(tmp)
}
