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
 * Une matière en français (Français, Religion) a les colonnes « Mot » et « Définition » (la
 * définition tient lieu de traduction) ; avec « creer », son onglet est créé s'il n'existe pas.
 * Avec « dater », les mots déjà présents reçoivent aussi la date du jour s'ils n'en ont pas.
 *
 * Les questions de cours (lignes avec « question ») vont dans l'onglet « Vragen », créé au
 * premier envoi : une question est reconnue par sa matière et son texte. Pour une question déjà
 * là, l'envoi complète les cases vides (par exemple « Éléments » d'une énumération).
 * Les questions (ou les mots) d'une interro (/interro) ont en plus la colonne « Interro », et
 * « Raté » (ce que l'élève avait écrit, « — » si rien) pour ceux qu'il a ratés : l'appli les met
 * « à revoir ». Ces colonnes sont créées au premier envoi qui en a ; pour une ligne déjà là,
 * elles ne sont remplies que si elles sont vides.
 * Ensuite l'onglet est trié : chapitres dans leur ordre actuel, et dans chaque chapitre
 * les mots dans l'ordre des pages (les mots sans page restent à la fin du chapitre,
 * dans leur ordre actuel). Avec « essai », rien n'est écrit : la réponse dit ce qui serait fait.
 *
 * Signalements : le bouton drapeau de l'appli envoie l'action « signaler », la seule possible
 * sans clé (une ligne dans l'onglet « Signalements », créé au premier). La commande /signalements
 * corrige ensuite le tableau avec « modifier » (ou « supprimer ») et marque les lignes avec « traiter » (avec clé).
 *
 * Liens courts et utilisateurs (sans clé eux aussi, limités) : « raccourcir » et « lien » pour les liens
 * ici.be/VF/z/G8T9, « profil » pour la progression d'un utilisateur (ici.be/VF/u/Olivia). Ils sont rangés
 * dans un classeur à part, privé, créé au premier usage (« Woordjes — liens courts et utilisateurs ») :
 * ce tableau-ci est public et l'appli le télécharge en entier. Ces actions demandent une autorisation
 * de plus : après avoir collé ce code, exécuter une fois installer (▶) et accepter, puis redéployer.
 */

// mêmes noms de colonnes que l'appli (src/lib/mots.ts) ; de « matiere » à « nombre » pour l'onglet « Vragen »
const COLONNES = {
  // « Mot » : l'onglet d'une matière en français (Français, Religion), dont la définition tient lieu de traduction
  nl: ['néerlandais', 'nederlands', 'nl', 'mot', 'terme', 'notion', 'mot-clé'],
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
  interro: ['interro', 'toets'],
  rate: ['raté', 'rate', 'ratée', 'fout op toets'],
}

// l'onglet des questions de cours, créé au premier envoi de questions
const TITRES_QUESTIONS = ['Matière', 'Chapitre', 'Page', 'Question', 'Réponse', 'Leurres', 'Éléments', 'Nombre', 'Ajouté']
// l'onglet des mots d'une matière en français, créé au premier envoi avec « creer »
const TITRES_MOTS_FR = ['Chapitre', 'Page', 'Mot', 'Définition', 'Exemple', 'Remarque', 'Ajouté']
// champs d'une question qu'un nouvel envoi peut compléter s'ils sont vides
const COMPLETABLES = ['reponse', 'leurres', 'elements', 'nombre', 'page', 'interro', 'rate']
// pour un mot déjà là : de quelle interro il vient, et ce que l'élève y avait écrit
const COMPLETABLES_MOTS = ['interro', 'rate']

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
  Logger.log('Liens courts et utilisateurs : ' + classeurPrive().getUrl())
}

function doGet(e) {
  return repondre(() => {
    verifierCle(e.parameter.cle)
    return { ok: true, onglets: SpreadsheetApp.getActive().getSheets().map(s => s.getName()) }
  })
}

const SANS_CLE = ['signaler', 'raccourcir', 'lien', 'profil']

function doPost(e) {
  return repondre(() => {
    const req = JSON.parse(e.postData.contents)
    // les actions sans clé, ouvertes à l'appli (voir signaler, raccourcir, lien, profil) : limitées
    if (!SANS_CLE.includes(req.action)) verifierCle(req.cle)
    const verrou = LockService.getScriptLock()
    verrou.waitLock(30000)
    try {
      if (req.action === 'signaler') return signaler(req)
      if (req.action === 'raccourcir') return raccourcir(req)
      if (req.action === 'lien') return lien(req)
      if (req.action === 'profil') return profil(req)
      if (req.action === 'modifier') return modifier(req.modifications || [], !!req.essai)
      if (req.action === 'traiter') return traiter(req.ids || [], String(req.note || ''))
      if (req.action === 'supprimer') return supprimer(req.onglet, req.suppressions || [], !!req.vides, !!req.essai)
      return recevoir(req.onglet, req.lignes || [], !!req.essai, !!req.dater, !!req.creer)
    } finally {
      verrou.releaseLock()
    }
  })
}

// ---------- signalements (bouton drapeau de l'appli) ----------

const ONGLET_SIGNALEMENTS = 'Signalements'
const TITRES_SIGNALEMENTS = ['Date', 'Matière', 'Chapitre', 'Page', 'Élément', 'Réponse attendue', 'Exercice', 'Résultat', 'Raisons', 'Commentaire', 'ID', 'Appareil', 'Traité']
const LONGUEUR_MAX = 600

/**
 * Ajoute un signalement : ouvert à tous (l'appli est publique), donc limité. Rien d'autre
 * n'est possible sans clé : une ligne de plus dans l'onglet « Signalements », textes coupés,
 * dix par minute et par appareil, soixante par minute en tout, et un même signalement (ID) une seule fois.
 */
function signaler(req) {
  const texte = v => String(v == null ? '' : v).replace(/[\t\r\n]+/g, ' ').trim().slice(0, LONGUEUR_MAX)
  const id = texte(req.id).slice(0, 64), appareil = texte(req.appareil).slice(0, 64)
  if (!id || !appareil || !texte(req.element)) throw new Error('signalement incomplet')
  compter('sig-tous', 60, 'signalements')
  compter('sig-' + appareil, 10, 'signalements')
  const classeur = SpreadsheetApp.getActive()
  let feuille = classeur.getSheetByName(ONGLET_SIGNALEMENTS)
  if (!feuille) {
    feuille = classeur.insertSheet(ONGLET_SIGNALEMENTS)
    feuille.getRange(1, 1, 1, TITRES_SIGNALEMENTS.length).setValues([TITRES_SIGNALEMENTS]).setFontWeight('bold')
    feuille.setFrozenRows(1)
  }
  // déjà reçu (l'appli renvoie ce qui n'a pas eu de réponse) : rien à faire
  const colId = TITRES_SIGNALEMENTS.indexOf('ID') + 1
  const n = feuille.getLastRow() - 1
  if (n > 0 && feuille.getRange(2, colId, n, 1).getValues().some(l => String(l[0]) === id)) return { ok: true, deja: true }
  const ligne = [aujourdhui() + ' ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'HH:mm'),
    texte(req.matiere), texte(req.chapitre), texte(req.page), texte(req.element), texte(req.reponse), texte(req.exercice),
    texte(req.resultat), texte(req.raisons), texte(req.commentaire), id, appareil, '']
  // en texte : Sheets ne transforme ni la date ni les nombres
  feuille.getRange(feuille.getLastRow() + 1, 1, 1, ligne.length).setNumberFormat('@').setValues([ligne])
  return { ok: true }
}

/** Au plus « max » appels par minute pour cette clé (un appareil, ou tous). */
function compter(cle, max, quoi) {
  const cache = CacheService.getScriptCache()
  const n = Number(cache.get(cle) || 0) + 1
  if (n > max) throw new Error('trop de ' + quoi + ', réessayer dans une minute')
  cache.put(cle, String(n), 60)
}

// ---------- liens courts et utilisateurs (classeur privé à part) ----------

/** Le classeur privé des liens courts et des utilisateurs, créé au premier usage (dans le Drive du propriétaire). */
function classeurPrive() {
  const props = PropertiesService.getScriptProperties()
  const id = props.getProperty('CLASSEUR_PRIVE')
  if (id) return SpreadsheetApp.openById(id)
  const c = SpreadsheetApp.create('Woordjes — liens courts et utilisateurs')
  props.setProperty('CLASSEUR_PRIVE', c.getId())
  return c
}

/** Un onglet du classeur privé, créé avec ses titres s'il manque. */
function ongletPrive(nom, titres) {
  const c = classeurPrive()
  let f = c.getSheetByName(nom)
  if (!f) {
    f = c.insertSheet(nom)
    f.getRange(1, 1, 1, titres.length).setValues([titres]).setFontWeight('bold')
    f.setFrozenRows(1)
    // la feuille vide du classeur neuf ne sert à rien
    const vide = c.getSheets().find(x => x.getName() !== nom && x.getLastRow() === 0)
    if (vide) c.deleteSheet(vide)
  }
  return f
}

// un long texte (progression, lien de transfert) est coupé en morceaux : une case en tient 50 000 caractères au plus
const MORCEAU = 45000
/** Écrit le texte à partir de la colonne « col » de la ligne (en texte, morceau par morceau ; les cases de trop sont vidées). */
function ecrireMorceaux(feuille, ligne, col, texte) {
  const morceaux = []
  for (let i = 0; i < texte.length; i += MORCEAU) morceaux.push(texte.slice(i, i + MORCEAU))
  const avant = Math.max(0, feuille.getLastColumn() - col + 1)
  while (morceaux.length < avant) morceaux.push('')
  if (morceaux.length) feuille.getRange(ligne, col, 1, morceaux.length).setNumberFormat('@').setValues([morceaux])
}
const lireMorceaux = (valeurs, col) => valeurs.slice(col - 1).map(String).join('')

// liens courts : 4 caractères sans ceux qu'on confond (0/O, 1/I/L), gardés un peu plus d'un mois
const ONGLET_LIENS = 'Liens', TITRES_LIENS = ['Code', 'Créé', 'Lien']
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'
const DUREE_LIENS = 35 * 86400000
const LIEN_MAX = 400000

/** Enregistre un lien de l'appli (« #r=… » réglages, « #transfert=… ») et renvoie son code court. */
function raccourcir(req) {
  const appareil = String(req.appareil || '').slice(0, 64)
  const texte = String(req.lien || '')
  if (!appareil || !/^#(r|transfert)=[\w.=-]+$/.test(texte) || texte.length > LIEN_MAX) throw new Error('lien refusé')
  compter('rac-tous', 120, 'liens')
  compter('rac-' + appareil, 20, 'liens')
  const f = ongletPrive(ONGLET_LIENS, TITRES_LIENS)
  const maintenant = Date.now()
  const n = f.getLastRow() - 1
  const lignes = n > 0 ? f.getRange(2, 1, n, Math.max(3, f.getLastColumn())).getValues() : []
  // le même lien déjà raccourci : même code, rajeuni
  const deja = lignes.findIndex(l => lireMorceaux(l, 3) === texte)
  if (deja >= 0) {
    f.getRange(deja + 2, 2).setValue(maintenant)
    return { ok: true, code: String(lignes[deja][0]) }
  }
  // les liens de plus d'un mois sont oubliés (du bas vers le haut : les numéros de ligne ne bougent pas)
  for (let i = lignes.length - 1; i >= 0; i--) if (maintenant - Number(lignes[i][1]) > DUREE_LIENS) f.deleteRow(i + 2)
  const pris = new Set(lignes.map(l => String(l[0])))
  let code
  do {
    code = ''
    for (let i = 0; i < 4; i++) code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  } while (pris.has(code))
  const ligne = f.getLastRow() + 1
  f.getRange(ligne, 1, 1, 2).setNumberFormat('@').setValues([[code, '']])
  f.getRange(ligne, 2).setNumberFormat('0').setValue(maintenant)
  ecrireMorceaux(f, ligne, 3, texte)
  return { ok: true, code }
}

/** Le lien derrière un code court (inconnu ou trop vieux : erreur « lien expiré »). */
function lien(req) {
  const appareil = String(req.appareil || '').slice(0, 64)
  const code = String(req.code || '').toUpperCase()
  if (!appareil || !/^[A-Z0-9]{4}$/.test(code)) throw new Error('lien expiré')
  compter('lien-' + appareil, 60, 'liens')
  const f = classeurPrive().getSheetByName(ONGLET_LIENS)
  const n = f ? f.getLastRow() - 1 : 0
  const l = n > 0 ? f.getRange(2, 1, n, Math.max(3, f.getLastColumn())).getValues().find(x => String(x[0]) === code) : null
  if (!l || Date.now() - Number(l[1]) > DUREE_LIENS) throw new Error('lien expiré')
  return { ok: true, lien: lireMorceaux(l, 3) }
}

// utilisateurs : un prénom (sans mot de passe) et sa progression, compressée (gzip, base64), réunie à chaque envoi
const ONGLET_UTILISATEURS = 'Utilisateurs', TITRES_UTILISATEURS = ['Clé', 'Prénom', 'Mis à jour', 'Mots', 'Progression']
const PROGRESSION_MAX = 4000000
const cleUtilisateur = nom => nom.normalize('NFC').toLowerCase()

/**
 * La progression d'un utilisateur. Avec « donnees » (celle d'un appareil), elle est d'abord réunie avec celle
 * déjà gardée, comme le fait l'appli (src/lib/progression.ts, fusionner) : pour chaque mot, le suivi le plus
 * récent l'emporte ; pour chaque jour, le plus grand nombre de réponses. Renvoie la progression réunie (vide
 * pour un prénom inconnu) : l'appareil la reprend.
 */
function profil(req) {
  const appareil = String(req.appareil || '').slice(0, 64)
  const nom = String(req.nom || '').replace(/\s+/g, ' ').trim()
  const donnees = String(req.donnees || '')
  if (!appareil || !nom || nom.length > 30 || donnees.length > PROGRESSION_MAX) throw new Error('utilisateur refusé')
  compter('profil-tous', 300, 'envois')
  compter('profil-' + appareil, 30, 'envois')
  const f = ongletPrive(ONGLET_UTILISATEURS, TITRES_UTILISATEURS)
  const cle = cleUtilisateur(nom)
  const n = f.getLastRow() - 1
  const cles = n > 0 ? f.getRange(2, 1, n, 1).getValues().map(l => String(l[0])) : []
  const i = cles.indexOf(cle)
  const ligne = i >= 0 ? f.getRange(i + 2, 1, 1, Math.max(5, f.getLastColumn())).getValues()[0] : null
  let s = ligne ? decompresser(lireMorceaux(ligne, 5)) : null
  if (donnees) {
    s = reunir(s || { progression: {}, journal: {}, ratesInterro: [] }, decompresser(donnees))
    const ou = i >= 0 ? i + 2 : f.getLastRow() + 1
    f.getRange(ou, 1, 1, 4).setNumberFormat('@')
      .setValues([[cle, ligne ? String(ligne[1]) : nom, aujourdhui() + ' ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'HH:mm'), String(Object.keys(s.progression).length)]])
    ecrireMorceaux(f, ou, 5, compresser(s))
  }
  return { ok: true, nom: ligne ? String(ligne[1]) : nom, existe: !!ligne, donnees: s ? compresser(s) : '' }
}

function reunir(s, autre) {
  for (const id in autre.progression || {}) {
    const ici = s.progression[id], la = autre.progression[id]
    if (!ici || la.dernier > ici.dernier) s.progression[id] = la
  }
  for (const j in autre.journal || {}) s.journal[j] = Math.max(s.journal[j] || 0, autre.journal[j])
  s.ratesInterro = [...new Set([...(s.ratesInterro || []), ...(autre.ratesInterro || [])])]
  return s
}

const compresser = s => Utilities.base64EncodeWebSafe(Utilities.gzip(Utilities.newBlob(JSON.stringify(s), 'application/json')).getBytes())
function decompresser(texte) {
  if (!texte) return null
  const s = JSON.parse(Utilities.ungzip(Utilities.newBlob(Utilities.base64DecodeWebSafe(texte), 'application/x-gzip')).getDataAsString('UTF-8'))
  if (!s || typeof s.progression !== 'object') throw new Error('progression illisible')
  return { progression: s.progression || {}, journal: s.journal || {}, ratesInterro: s.ratesInterro || [] }
}

/** Marque des signalements comme traités (colonne « Traité » : date et note). */
function traiter(ids, note) {
  const feuille = SpreadsheetApp.getActive().getSheetByName(ONGLET_SIGNALEMENTS)
  if (!feuille) throw new Error('pas encore de signalements')
  const n = feuille.getLastRow() - 1
  const colId = TITRES_SIGNALEMENTS.indexOf('ID'), colTraite = TITRES_SIGNALEMENTS.indexOf('Traité')
  const donnees = n > 0 ? feuille.getRange(2, 1, n, TITRES_SIGNALEMENTS.length).getValues() : []
  const faits = []
  donnees.forEach((l, i) => {
    if (!ids.includes(String(l[colId]))) return
    feuille.getRange(i + 2, colTraite + 1).setNumberFormat('@').setValue((aujourdhui() + ' ' + note).trim())
    faits.push(String(l[colId]))
  })
  return { ok: true, traites: faits }
}

/**
 * Supprime des lignes d'un onglet : celles désignées (onglet de mots : nl et chapitre ; « Vragen » :
 * matière et question), et avec « vides » celles dont le mot ou la question est vide (lignes vidées
 * avant que cette action existe). Avec « essai », rien n'est supprimé : la réponse dit ce qui le serait.
 */
function supprimer(nomOnglet, suppressions, vides, essai) {
  const feuille = SpreadsheetApp.getActive().getSheetByName(nomOnglet)
  if (!feuille) throw new Error('onglet introuvable : ' + nomOnglet)
  const titres = feuille.getRange(1, 1, 1, feuille.getLastColumn()).getValues()[0].map(norm)
  const col = {}
  for (const cle in COLONNES) col[cle] = titres.findIndex(t => COLONNES[cle].includes(t))
  const questions = col.question >= 0
  const cleIdentite = questions ? col.question : col.nl
  const n = feuille.getLastRow() - 1
  const donnees = n > 0 ? feuille.getRange(2, 1, n, titres.length).getValues() : []
  const lignes = new Set(), introuvables = []
  for (const m of suppressions) {
    const i = donnees.findIndex(l => questions
      ? norm(l[col.matiere]) === norm(m.matiere) && norm(l[col.question]) === norm(m.question)
      : norm(l[col.nl]) === norm(m.nl) && (col.chapitre < 0 || !m.chapitre || norm(l[col.chapitre]) === norm(m.chapitre)))
    if (i < 0) introuvables.push(m); else lignes.add(i)
  }
  // une ligne vidée : plus de mot ou de question, mais il reste autre chose (matière, chapitre…)
  if (vides) donnees.forEach((l, i) => { if (!norm(l[cleIdentite]) && l.some(c => norm(c))) lignes.add(i) })
  const res = { ok: true, essai, supprimees: [...lignes].sort((a, b) => a - b).map(i => donnees[i].map(String).filter(Boolean).join(' · ').slice(0, 120)), introuvables }
  if (!essai) [...lignes].sort((a, b) => b - a).forEach(i => feuille.deleteRow(i + 2))
  return res
}

/**
 * Corrige des cases déjà remplies (après un signalement) : chaque modification désigne une ligne
 * (onglet de mots : nl et chapitre ; « Vragen » : matière et question), la colonne (clé de COLONNES)
 * et la nouvelle valeur. Avec « essai », rien n'est écrit : la réponse dit l'ancienne valeur.
 */
function modifier(modifications, essai) {
  const res = { ok: true, essai, faites: [], introuvables: [] }
  for (const m of modifications) {
    const feuille = SpreadsheetApp.getActive().getSheetByName(m.onglet)
    if (!feuille) { res.introuvables.push(m); continue }
    const titres = feuille.getRange(1, 1, 1, feuille.getLastColumn()).getValues()[0].map(norm)
    const col = {}
    for (const cle in COLONNES) col[cle] = titres.findIndex(t => COLONNES[cle].includes(t))
    const questions = col.question >= 0
    // la colonne « Définition » tient lieu de « Français » dans un onglet en français
    const champ = !questions && m.champ === 'fr' && col.fr < 0 ? 'definition' : m.champ
    if (!(champ in col) || col[champ] < 0) { res.introuvables.push(m); continue }
    const n = feuille.getLastRow() - 1
    const donnees = n > 0 ? feuille.getRange(2, 1, n, titres.length).getValues() : []
    const i = donnees.findIndex(l => questions
      ? norm(l[col.matiere]) === norm(m.matiere) && norm(l[col.question]) === norm(m.question)
      : norm(l[col.nl]) === norm(m.nl) && (col.chapitre < 0 || !m.chapitre || norm(l[col.chapitre]) === norm(m.chapitre)))
    if (i < 0) { res.introuvables.push(m); continue }
    res.faites.push({ ...m, avant: String(donnees[i][col[champ]]) })
    if (!essai) feuille.getRange(i + 2, col[champ] + 1).setNumberFormat('@').setValue(m.valeur)
  }
  return res
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

function recevoir(nomOnglet, lignes, essai, dater, creer) {
  const envoiQuestions = lignes.some(m => m.question)
  let feuille = SpreadsheetApp.getActive().getSheetByName(nomOnglet)
  if (!feuille && !envoiQuestions && !creer) throw new Error('onglet introuvable : ' + nomOnglet + ' (avec --creer, il est créé)')
  if (!feuille && essai) {
    return { ok: true, essai, nouvelOnglet: true, ajoutes: lignes.map(m => m.question || m.nl), pages: [], dejaLa: [], dates: [], completes: [] }
  }
  if (!feuille) {
    const t = envoiQuestions ? TITRES_QUESTIONS : TITRES_MOTS_FR
    feuille = SpreadsheetApp.getActive().insertSheet(nomOnglet)
    feuille.getRange(1, 1, 1, t.length).setValues([t]).setFontWeight('bold')
    feuille.setFrozenRows(1)
  }

  const titres = feuille.getRange(1, 1, 1, feuille.getLastColumn()).getValues()[0].map(norm)
  const col = {}
  for (const cle in COLONNES) col[cle] = titres.findIndex(t => COLONNES[cle].includes(t))
  // deux sortes d'onglets : les mots d'une matière, ou les questions de cours
  const questions = col.question >= 0
  if (questions !== envoiQuestions) throw new Error(`« ${nomOnglet} » n'est pas un onglet de ${envoiQuestions ? 'questions' : 'mots'}`)
  // une matière en français : pas de colonne « Français », la définition en tient lieu
  const sansTraduction = !questions && col.fr < 0 && col.definition >= 0
  if (questions ? col.reponse < 0 || col.matiere < 0 : col.nl < 0 || (col.fr < 0 && !sansTraduction)) {
    throw new Error(questions ? 'colonnes « Matière » et « Réponse » introuvables' : 'colonnes « Néerlandais » et « Français » (ou « Mot » et « Définition ») introuvables')
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
    // une interro scannée (/interro) : de quelle interro viennent les lignes, et les erreurs de l'élève
    if (lignes.some(m => m.interro)) col.interro = colonne(feuille, titres, 'interro', 'Interro')
    if (lignes.some(m => m.rate)) col.rate = colonne(feuille, titres, 'rate', 'Raté')
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
    if (questions ? !norm(m.question) || !norm(m.reponse) : !norm(m.nl) || !norm(sansTraduction ? m.definition : m.fr)) continue
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
          if (!essai) for (const k of vides) feuille.getRange(i + 2, col[k] + 1).setNumberFormat('@').setValue(m[k])
        } else {
          res.dejaLa.push(nom(m))
        }
        continue
      }
      // un mot raté à une interro : sa case Interro et sa case Raté, si elles sont vides
      const vides = i < 0 ? [] : COMPLETABLES_MOTS.filter(k => m[k] != null && String(m[k]).trim() !== '' && (col[k] < 0 || !String(donnees[i][col[k]]).trim()))
      if (vides.length) {
        res.completes.push(nom(m))
        if (!essai) for (const k of vides) feuille.getRange(i + 2, col[k] + 1).setValue(m[k])
      }
      // (en essai, la colonne Page n'existe peut-être pas encore : elle serait vide)
      if (i >= 0 && m.page && (col.page < 0 || !String(donnees[i][col.page]).trim())) {
        res.pages.push(nom(m))
        if (!essai) feuille.getRange(i + 2, col.page + 1).setNumberFormat('@').setValue(m.page)
      } else if (!vides.length) {
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
    // tout en texte : sinon Sheets transforme « 7 / sept » en date, « 2026-10-11 » en nombre…
    feuille.getRange(debut, 1, nouvelles.length, largeur).setNumberFormat('@')
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
