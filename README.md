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
| Page | la page du cours (ignorée par l'appli ; sert à garder l'ordre du cours) |
| Ajouté | la date d'ajout par `/cours` (AAAA-MM-JJ) : les mots de la date la plus récente sont les « Nouveaux » de l'appli |

Un nouvel onglet avec ces colonnes devient automatiquement une nouvelle matière.
Son icône est choisie d'après son nom (🏛️ Geschiedenis, 🌍 Aardrijkskunde, 🌱 Biologie,
📐 Wiskunde…, 📚 sinon) ; pour en imposer une, commencer le nom de l'onglet par un
emoji, par exemple « 🦖 NW Biologie ».
Les changements du tableau apparaissent au prochain lancement de l'appli.

## Ajouter un cours

1. Scanner le chapitre en PDF (300 dpi, couleur), nommé par exemple
   `Aardrijkskunde - 3. Klimaat.pdf`, dans un dossier hors du dépôt.
2. Dans ce dossier, lancer `claude` puis `/cours ~/Documents/Cours/Aardrijkskunde - 3. Klimaat.pdf`.
   Claude lit les pages, compare avec le tableau et propose les mots (gras, définitions,
   mots fréquents) avec chapitre et page ; la proposition est aussi enregistrée en `.tsv`
   à côté du PDF.
3. Après relecture et accord, il les envoie : les nouveaux mots arrivent dans l'onglet avec
   la date du jour (colonne « Ajouté »), et l'onglet est trié par chapitre puis par page.
   Dans l'appli, la liste des mots les montre dans l'onglet **Nouveaux** (et un bouton
   « Nouveaux » reste deux semaines sur l'accueil).

Installation de l'envoi (une fois) : voir l'en-tête de `outils/recevoir-mots.gs`, puis
`python3 outils/cours.py configurer <URL> <clé>`.

## Installer

Adresse : **https://ici-be.github.io/VF/**

- **Laptop Fedora** : installer Google Chrome (`sudo dnf install google-chrome-stable`
  après avoir activé le dépôt Google dans *Logiciels*), puis copier l'icône :
  ```sh
  curl -o ~/Bureau/vocabulaire-nl.desktop https://raw.githubusercontent.com/ici-be/VF/main/outils/vocabulaire-nl.desktop
  mkdir -p ~/.local/share/icons && curl -o ~/.local/share/icons/vocabulaire-nl.png https://ici-be.github.io/VF/icon-512.png
  chmod +x ~/Bureau/vocabulaire-nl.desktop
  ```
  (ou, dans Chrome, menu ⋮ → *Caster, enregistrer et partager* → *Installer la page en tant qu'application*).
- **Android** : ouvrir l'adresse dans Chrome, menu ⋮ → *Ajouter à l'écran d'accueil* → *Installer*.

La progression et les réglages sont enregistrés sur chaque appareil séparément.

## Développer

```sh
npm install
npm run dev      # appli sur http://localhost:5173, rechargée à chaque modification
npm test         # tests (correction des réponses, lecture du tableau)
npm run build    # version finale dans dist/
```

## Le chapitre Conjugaison

Il ne vient pas du tableau : `outils/conjugaisons.ts` contient les 50 verbes les plus
courants (traduction, formes irrégulières) et les règles des verbes réguliers, et écrit
`src/data/conjugaisons.json` (4 temps : présent, imparfait, passé composé, futur ; forme
interrogative). L'appli l'ajoute comme chapitre « Conjugaison » à la matière Nederlands.
Pour ajouter ou corriger un verbe : modifier `outils/conjugaisons.ts`, puis

```sh
node --experimental-strip-types outils/conjugaisons.ts
npm test                 # tests/conjugaisons.test.ts vérifie des formes connues
python3 outils/voix.py   # voix des nouvelles formes (sinon GitHub le fait dans l'heure)
```

## Les voix

Les mots sont lus par des voix belges (edge-tts : `nl-BE-DenaNeural`, `fr-BE-CharlineNeural`),
préparées en mp3 par `outils/voix.py` dans `public/audio/`. GitHub relance ce script
toutes les heures : un mot ajouté dans le tableau a sa voix dans l'heure. En attendant,
il est lu par la voix du navigateur. Pour ne pas attendre : onglet *Actions* →
*Publier* → *Run workflow*. Pour changer de voix : `VOIX` et `VITESSE` dans
`outils/voix.py` **et** dans `src/lib/voix.ts` (le test `tests/voix.test.ts` vérifie
qu'ils calculent les mêmes noms de fichiers).

## Mettre à jour l'appli

`git push` suffit : GitHub compile, teste et publie (onglet *Actions* du dépôt).
Les appareils reçoivent la nouvelle version au lancement suivant.

## Organisation

- `src/lib/` : la logique sans interface (lecture du tableau, correction, progression, séries)
- `src/ui/` : les écrans (accueil, exercices, fin, liste)
- `outils/voix.py` : prépare les voix (mp3)
- `outils/ajouter-definitions.gs` : script ponctuel pour le tableau (colonnes Définition / Exemple)
