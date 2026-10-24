# Woordjes — notes pour Claude

## Leçons animées (skill /papermorph)

Les leçons animées et racontées sont faites avec le skill `/papermorph` (`.claude/skills/papermorph/`), lancé dans ce dossier.
- **Langue** : néerlandais de Belgique. Voix `nl-BE-DenaNeural` (débit −8 %), sous-titres et textes de l'interface en nl-BE.
  Les réglages d'un livre sont dans `books/<livre>/style.json` (ex. `books/chimie/`). Le moteur n'a pas de bloc néerlandais :
  relancer `python3 tools/chimie/nl_interface.py` après chaque synchronisation du moteur (`engine.py`) ; il est idempotent.
- **Où vont les fichiers** : `site/` est un lien vers `public/lecons/` (un dossier par livre : `public/lecons/chimie/`,
  avec `index.html` = couverture et sommaire, `lib/` = moteur, `chNN/` = un chapitre). Vite le publie tel quel,
  donc ce que le skill écrit dans `site/<livre>/` est déjà dans l'appli. Sources : `books/<livre>/`, `content/<livre>/chNN/`
  (narration), `tools/<livre>/`. Les PDF (`*.pdf`) et `books/*/pages/` ne sont pas versionnés (dépôt public).
- **Brancher une leçon dans l'appli** : ajouter le chapitre dans `src/data/lecons.json`
  (`"<onglet>": { "dossier": "<livre>", "chapitres": { "<chapitre exact du tableau>": { "lecon": "chNN", "pages": "46–57" } } }`).
  L'accueil affiche alors « Leçon animée » sous les chapitres de la matière (`src/lib/lecons.ts`).
  Le sommaire d'un livre garde son lien « ← Woordjes » (`<a class="back" href="../../">`) dans `index.html`.
- Un nouveau livre : prendre `public/lecons/chimie/index.html` comme modèle de sommaire (lien retour compris) et `books/chimie/style.json` pour la voix.
- Le service worker ne met pas `lecons/` en cache de précaution (`vite.config.ts`) : les fichiers gardent leur nom quand on refait une leçon.

## Le reste
Voir `README.md` (matières, cours scannés, voix : `python3 outils/voix.py`, puis commit + push).
