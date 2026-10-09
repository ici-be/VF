/**
 * Complète la colonne « Dét. » des noms qui n'avaient pas leur article.
 *
 * Mode d'emploi : dans le tableau, Extensions → Apps Script, remplacer le code
 * par celui-ci, enregistrer, choisir la fonction ajouterDeterminants et cliquer
 * sur ▶ Exécuter. Le journal affiche ce qui a été fait.
 *
 * Sans risque : une case n'est remplie que si le mot néerlandais est toujours
 * celui attendu sur cette ligne et que la case « Dét. » est encore vide.
 */
const ARTICLES = {
  "Nederlands": [
    [30, "klinker", "de"], [31, "medeklinker", "de"], [32, "stam", "de"],
    [33, "werkwoord", "het"], [34, "klank", "de"], [35, "tweeklank", "de"]
  ],
  "HW Socio-economische vorming": [
    [10, "bijzondere persoonsgegevens", "de"], [12, "biometrische gegevens", "de"],
    [37, "locatiegegevens", "de"], [47, "onrechtstreekse gegevens", "de"],
    [54, "rechtstreekse gegevens", "de"]
  ],
  "NW Biologie": [
    [24, "bloed", "het"], [29, "competitie", "de"], [35, "dode materie", "de"],
    [37, "relaties tussen levende organismen", "de"], [61, "hout", "het"],
    [85, "levende wezens", "de"], [92, "model", "het"], [95, "nadeel", "het"],
    [98, "netwerk", "het"], [119, "predatie", "de"], [141, "teek", "de"],
    [154, "vis", "de"], [163, "voedselweb", "het"], [168, "voordeel", "het"]
  ]
};

function ajouterDeterminants() {
  const classeur = SpreadsheetApp.getActiveSpreadsheet();
  for (const [nom, lignes] of Object.entries(ARTICLES)) {
    const feuille = classeur.getSheetByName(nom);
    if (!feuille) { Logger.log('Onglet introuvable : ' + nom); continue; }
    const entetes = feuille.getRange(1, 1, 1, feuille.getLastColumn()).getValues()[0].map(t => String(t).trim().toLowerCase());
    const colNl = entetes.findIndex(t => t === 'néerlandais' || t === 'nederlands') + 1 || 1;
    const colDet = entetes.findIndex(t => /^d[ée]t\.?$/.test(t)) + 1;
    if (!colDet) { Logger.log(nom + ' : pas de colonne « Dét. », onglet ignoré.'); continue; }
    let faites = 0;
    const sautees = [];
    for (const [ligne, mot, article] of lignes) {
      const nl = String(feuille.getRange(ligne, colNl).getValue()).trim();
      const det = feuille.getRange(ligne, colDet);
      if (nl !== mot) { sautees.push(ligne + ' (' + mot + ' attendu, « ' + nl + ' » trouvé)'); continue; }
      if (String(det.getValue()).trim() !== '') continue;
      det.setValue(article);
      faites++;
    }
    Logger.log(nom + ' : ' + faites + ' article(s) ajouté(s).' + (sautees.length ? ' Lignes sautées car le tableau a changé : ' + sautees.join(', ') : ''));
  }
}
