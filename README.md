# Vocabulaire NL

Application de révision du vocabulaire néerlandais et des cours d'immersion
(histoire, géographie, biologie…). Les mots viennent du tableau Google Sheets :
chaque onglet est une matière.

## Le tableau

Colonnes reconnues par leur nom (l'ordre n'a pas d'importance) :

| Colonne | Contenu |
|---|---|
| Néerlandais | le mot (obligatoire) |
| Dét. | `de` ou `het` pour les noms |
| Français | la traduction (obligatoire) ; variantes séparées par `,` ou `/`, précisions entre parenthèses |
| Définition | la définition en néerlandais |
| Exemple | une phrase ; la partie à trouver dans les textes à trous va entre crochets : `Het bevolkingsaantal [neemt af]` |
| Remarque | le reste : pluriel, synonyme, contraire, forme… |
| Chapitre | le chapitre (vide = « Sans chapitre ») |

Un nouvel onglet avec ces colonnes devient automatiquement une nouvelle matière.
Les changements du tableau apparaissent au prochain lancement de l'appli.

## Développer

```sh
npm install
npm run dev      # appli sur http://localhost:5173, rechargée à chaque modification
npm test         # tests (correction des réponses, lecture du tableau)
npm run build    # version finale dans dist/
```

## Mettre à jour l'appli

`git push` suffit : GitHub compile, teste et publie (onglet *Actions* du dépôt).
Les appareils reçoivent la nouvelle version au lancement suivant.

## Organisation

- `src/lib/` : la logique sans interface (lecture du tableau, correction, progression, séries)
- `src/ui/` : les écrans (accueil, exercices, fin, liste)
- `outils/ajouter-definitions.gs` : script ponctuel pour le tableau (colonnes Définition / Exemple)
