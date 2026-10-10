/**
 * Reçoit les mots extraits d'un cours (envoyés par outils/cours.py) et les
 * range dans le bon onglet du tableau.
 *
 * Installation (une seule fois) :
 *  1. Dans le tableau : Extensions → Apps Script. Créer un fichier « recevoir-mots »
 *     (＋ à côté de Fichiers → Script), y coller ce code, enregistrer.
 *  2. Choisir la fonction installer, cliquer sur ▶ Exécuter, accepter l'autorisation.
 *     Le journal affiche la clé secrète.
 *  3. Déployer → Nouveau déploiement → type « Application Web » ;
 *     Exécuter en tant que : Moi ; Qui a accès : Tout le monde. Copier l'URL.
 *  4. Sur le laptop : python3 outils/cours.py configurer <URL> <clé>
 *     (les garde hors du dépôt, dans ~/.config/vocabulaire-nl/).
 *
 * Après une modification de ce code : Déployer → Gérer les déploiements → ✎ →
 * Version : Nouvelle version (l'URL reste la même).
 *
 * Ce que fait un envoi, pour chaque ligne :
 *  - le mot est déjà dans ce chapitre → seule sa case « Page » est remplie si elle était vide ;
 *  - sinon → il est ajouté, avec la date du jour dans « Ajouté » : l'appli montre les mots
 *    du dernier envoi dans la liste des mots (onglet « Nouveaux »).
 * Les colonnes « Page » et « Ajouté » sont créées au premier envoi dans un onglet.
 * Avec « dater », les mots déjà présents reçoivent aussi la date du jour s'ils n'en ont pas.
 * Ensuite l'onglet est trié : chapitres dans leur ordre actuel, et dans chaque chapitre
 * les mots dans l'ordre des pages (les mots sans page restent à la fin du chapitre,
 * dans leur ordre actuel). Avec « essai », rien n'est écrit : la réponse dit ce qui serait fait.
 */

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
  ajoute: ['ajouté', 'ajoute', 'ajouté le', 'toegevoegd'],
}

const aujourdhui = () => Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd')

/** Indice (0 = A) de la colonne, créée à droite avec ce titre si elle manque. */
function colonne(feuille, titres, cle, titre) {
  const i = titres.findIndex(t => COLONNES[cle].includes(t))
  if (i >= 0) return i
  feuille.getRange(1, titres.length + 1).setValue(titre)
  titres.push(norm(titre))
  return titres.length - 1
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
      return recevoir(req.onglet, req.lignes || [], !!req.essai, !!req.dater)
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

function recevoir(nomOnglet, lignes, essai, dater) {
  const feuille = SpreadsheetApp.getActive().getSheetByName(nomOnglet)
  if (!feuille) throw new Error('onglet introuvable : ' + nomOnglet)

  const titres = feuille.getRange(1, 1, 1, feuille.getLastColumn()).getValues()[0].map(norm)
  const col = {}
  for (const cle in COLONNES) col[cle] = titres.findIndex(t => COLONNES[cle].includes(t))
  if (col.nl < 0 || col.fr < 0) throw new Error('colonnes « Néerlandais » et « Français » introuvables')
  if (!essai) {
    col.page = colonne(feuille, titres, 'page', 'Page')
    col.ajoute = colonne(feuille, titres, 'ajoute', 'Ajouté')
  }
  const largeur = titres.length

  const n = feuille.getLastRow() - 1
  const donnees = n > 0 ? feuille.getRange(2, 1, n, largeur).getValues() : []
  const index = new Map()   // « mot␟chapitre » → numéro de ligne dans donnees
  donnees.forEach((l, i) => index.set(norm(l[col.nl]) + '␟' + norm(l[col.chapitre]), i))

  const res = { ok: true, essai, ajoutes: [], pages: [], dejaLa: [], dates: [] }
  const nouvelles = []
  for (const m of lignes) {
    const cle = norm(m.nl) + '␟' + norm(m.chapitre)
    if (!norm(m.nl) || !norm(m.fr)) continue
    if (index.has(cle)) {
      const i = index.get(cle)   // -1 : mot en double dans l'envoi lui-même
      // « dater » : les mots déjà là reçoivent aussi la date du jour (s'ils n'en ont pas)
      if (dater && i >= 0 && (col.ajoute < 0 || !String(donnees[i][col.ajoute]).trim())) {
        res.dates.push(m.nl)
        if (!essai) feuille.getRange(i + 2, col.ajoute + 1).setNumberFormat('@').setValue(aujourdhui())
      }
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
    if (col.ajoute >= 0) l[col.ajoute] = aujourdhui()
    nouvelles.push(l)
    index.set(cle, -1)
    res.ajoutes.push(m.nl)
  }

  if (essai) return res
  if (nouvelles.length) {
    const debut = feuille.getLastRow() + 1
    // en texte, sinon Sheets transforme la date en nombre
    feuille.getRange(debut, col.ajoute + 1, nouvelles.length, 1).setNumberFormat('@')
    feuille.getRange(debut, 1, nouvelles.length, largeur).setValues(nouvelles)
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
