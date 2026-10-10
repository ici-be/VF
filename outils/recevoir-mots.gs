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
 *
 * Les questions de cours (lignes avec « question ») vont dans l'onglet « Vragen », créé au
 * premier envoi : une question est reconnue par sa matière et son texte. Pour une question déjà
 * là, l'envoi complète les cases vides (par exemple « Éléments » d'une énumération).
 * Ensuite l'onglet est trié : chapitres dans leur ordre actuel, et dans chaque chapitre
 * les mots dans l'ordre des pages (les mots sans page restent à la fin du chapitre,
 * dans leur ordre actuel). Avec « essai », rien n'est écrit : la réponse dit ce qui serait fait.
 */

// mêmes noms de colonnes que l'appli (src/lib/mots.ts) ; les six dernières pour l'onglet « Vragen »
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
  matiere: ['matière', 'matiere', 'vak'],
  question: ['question', 'vraag'],
  reponse: ['réponse', 'reponse', 'antwoord'],
  leurres: ['leurres', 'mauvaises réponses', 'fout'],
  elements: ['éléments', 'elements', 'elementen'],
  nombre: ['nombre', 'aantal'],
}

// l'onglet des questions de cours, créé au premier envoi de questions
const TITRES_QUESTIONS = ['Matière', 'Chapitre', 'Page', 'Question', 'Réponse', 'Leurres', 'Éléments', 'Nombre', 'Ajouté']
// champs d'une question qu'un nouvel envoi peut compléter s'ils sont vides
const COMPLETABLES = ['reponse', 'leurres', 'elements', 'nombre', 'page']

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
  const envoiQuestions = lignes.some(m => m.question)
  let feuille = SpreadsheetApp.getActive().getSheetByName(nomOnglet)
  if (!feuille && !envoiQuestions) throw new Error('onglet introuvable : ' + nomOnglet)
  if (!feuille && essai) {
    return { ok: true, essai, nouvelOnglet: true, ajoutes: lignes.map(m => m.question), pages: [], dejaLa: [], dates: [] }
  }
  if (!feuille) {
    feuille = SpreadsheetApp.getActive().insertSheet(nomOnglet)
    feuille.getRange(1, 1, 1, TITRES_QUESTIONS.length).setValues([TITRES_QUESTIONS]).setFontWeight('bold')
    feuille.setFrozenRows(1)
  }

  const titres = feuille.getRange(1, 1, 1, feuille.getLastColumn()).getValues()[0].map(norm)
  const col = {}
  for (const cle in COLONNES) col[cle] = titres.findIndex(t => COLONNES[cle].includes(t))
  // deux sortes d'onglets : les mots d'une matière, ou les questions de cours
  const questions = col.question >= 0
  if (questions !== envoiQuestions) throw new Error(`« ${nomOnglet} » n'est pas un onglet de ${envoiQuestions ? 'questions' : 'mots'}`)
  if (questions ? col.reponse < 0 || col.matiere < 0 : col.nl < 0 || col.fr < 0) {
    throw new Error(questions ? 'colonnes « Matière » et « Réponse » introuvables' : 'colonnes « Néerlandais » et « Français » introuvables')
  }
  // ce qui identifie une ligne : le mot dans son chapitre, ou la question dans sa matière
  const identite = questions ? l => [l[col.matiere], l[col.question]] : l => [l[col.nl], l[col.chapitre]]
  const identiteEnvoi = questions ? m => [m.matiere, m.question] : m => [m.nl, m.chapitre]
  const nom = m => (questions ? m.question : m.nl)
  if (!essai) {
    col.page = colonne(feuille, titres, 'page', 'Page')
    col.ajoute = colonne(feuille, titres, 'ajoute', 'Ajouté')
    // les énumérations, ajoutées après la création de l'onglet « Vragen »
    if (questions && lignes.some(m => m.elements)) {
      col.elements = colonne(feuille, titres, 'elements', 'Éléments')
      col.nombre = colonne(feuille, titres, 'nombre', 'Nombre')
    }
  }
  const largeur = titres.length

  const n = feuille.getLastRow() - 1
  const donnees = n > 0 ? feuille.getRange(2, 1, n, largeur).getValues() : []
  const index = new Map()   // « mot␟chapitre » (ou « matière␟question ») → numéro de ligne dans donnees
  donnees.forEach((l, i) => index.set(identite(l).map(norm).join('␟'), i))

  const res = { ok: true, essai, ajoutes: [], pages: [], dejaLa: [], dates: [], completes: [] }
  const nouvelles = []
  for (const m of lignes) {
    const cle = identiteEnvoi(m).map(norm).join('␟')
    if (questions ? !norm(m.question) || !norm(m.reponse) : !norm(m.nl) || !norm(m.fr)) continue
    if (index.has(cle)) {
      const i = index.get(cle)   // -1 : mot en double dans l'envoi lui-même
      // « dater » : les mots déjà là reçoivent aussi la date du jour (s'ils n'en ont pas)
      if (dater && i >= 0 && (col.ajoute < 0 || !String(donnees[i][col.ajoute]).trim())) {
        res.dates.push(nom(m))
        if (!essai) feuille.getRange(i + 2, col.ajoute + 1).setNumberFormat('@').setValue(aujourdhui())
      }
      // une question déjà là : ses cases vides (éléments, leurres…) sont complétées, jamais écrasées
      if (questions && i >= 0) {
        const vides = COMPLETABLES.filter(k => m[k] != null && String(m[k]).trim() !== '' && (col[k] < 0 || !String(donnees[i][col[k]]).trim()))
        if (vides.length) {
          res.completes.push(nom(m))
          if (!essai) for (const k of vides) feuille.getRange(i + 2, col[k] + 1).setValue(m[k])
        } else {
          res.dejaLa.push(nom(m))
        }
        continue
      }
      // (en essai, la colonne Page n'existe peut-être pas encore : elle serait vide)
      if (i >= 0 && m.page && (col.page < 0 || !String(donnees[i][col.page]).trim())) {
        res.pages.push(nom(m))
        if (!essai) feuille.getRange(i + 2, col.page + 1).setValue(m.page)
      } else {
        res.dejaLa.push(nom(m))
      }
      continue
    }
    const l = new Array(largeur).fill('')
    for (const k in COLONNES) if (col[k] >= 0 && m[k] != null) l[col[k]] = m[k]
    if (col.ajoute >= 0) l[col.ajoute] = aujourdhui()
    nouvelles.push(l)
    index.set(cle, -1)
    res.ajoutes.push(nom(m))
  }

  if (essai) return res
  if (nouvelles.length) {
    const debut = feuille.getLastRow() + 1
    // en texte, sinon Sheets transforme la date en nombre
    feuille.getRange(debut, col.ajoute + 1, nouvelles.length, 1).setNumberFormat('@')
    feuille.getRange(debut, 1, nouvelles.length, largeur).setValues(nouvelles)
  }
  if (col.page >= 0 && col.chapitre >= 0) trierParPage(feuille, col, largeur, questions)
  return res
}

/**
 * Trie l'onglet : chapitres dans l'ordre de leur première apparition (pour les questions :
 * par matière et numéro de chapitre), puis page, puis ordre actuel.
 */
function trierParPage(feuille, col, largeur, questions) {
  const n = feuille.getLastRow() - 1
  if (n < 2) return
  const donnees = feuille.getRange(2, 1, n, largeur).getValues()
  const groupe = l => (questions ? norm(l[col.matiere]) + '␟' : '') + norm(l[col.chapitre])
  const groupes = [...new Set(donnees.map(groupe))]
  // l'onglet des questions mélange les envois : matières et chapitres dans l'ordre (1., 2., … 10.)
  if (questions) groupes.sort((a, b) => a.localeCompare(b, 'fr', { numeric: true }))
  const rangChapitre = new Map(groupes.map((g, i) => [g, i]))
  const cles = donnees.map((l, i) => {
    const ch = groupe(l)
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
