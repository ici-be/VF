# Woordjes

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
| Page | la page du cours : quand un seul chapitre est choisi, l'accueil permet de ne réviser que certaines pages (« Pages 5 à 12 », pour une interro sur une partie du chapitre ; les mots sans page en sont exclus) |
| Ajouté | la date d'ajout par `/cours` (AAAA-MM-JJ) : les mots de la date la plus récente sont les « Nouveaux » de l'appli |

Les **questions de cours** sont dans l'onglet « Vragen » (créé par `/cours`) : colonnes
Matière (le nom exact de l'onglet des mots), Chapitre, Page, Question, Réponse, Leurres
(trois mauvaises réponses séparées par `|`, pour le choix parmi 4), Éléments et Nombre
(pour les énumérations : `Titel | Oriëntatie | Legende | Schaal`, variantes séparées par
`/`, et combien en donner si la question en demande moins), Interro (l'interro d'où vient
la question, remplie par `/interro`) et Ajouté. Une **phrase à compléter** s'écrit avec `___` à
la place du trou dans « Question », le mot attendu dans « Réponse » : l'élève l'écrit, et
l'orthographe compte (une lettre de travers = « presque »). Elles servent
à l'exercice « Questions de cours » et à l'onglet « Questions » de la liste des mots.
Le bouton **Interro** de l'accueil (ou de cet onglet) imprime une **feuille d'interro** : les questions numérotées avec des
lignes pour répondre à la main (selon la longueur de la réponse, une par élément pour les
énumérations), puis les réponses sur une page à part.

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
   mots fréquents) avec chapitre et page, ainsi que des questions de cours avec leur réponse ;
   les propositions sont aussi enregistrées en `.tsv` à côté du PDF.
3. Après relecture et accord, il les envoie : les nouveaux mots arrivent dans l'onglet avec
   la date du jour (colonne « Ajouté »), et l'onglet est trié par chapitre puis par page.
   Dans l'appli, la liste des mots les montre dans l'onglet **Nouveaux** (et un bouton
   « Nouveaux » reste deux semaines sur l'accueil).

Installation de l'envoi (une fois) : voir l'en-tête de `outils/recevoir-mots.gs`, puis
`python3 outils/cours.py configurer <URL> <clé>`.

## Matières en français

**Français**, **Religion** et **Mathématiques** (et tout onglet dont le nom commence par « FR ») sont des cours
en français, pas en immersion : leurs mots et questions sont lus avec la voix française et
corrigés en français, sans traduction.
- Onglet des mots : colonnes **Mot** et **Définition** (la définition tient lieu de
  traduction), plus Exemple, Remarque, Chapitre, Page comme ailleurs.
- Questions : dans « Vragen », avec Matière = `Français`, `Religion` ou `Mathématiques`. Une matière peut
  n'avoir que des questions, sans onglet de mots.
- Exercices : Questions de cours, Définitions, Textes à trous, Défilement (le mot, puis sa
  définition) et Mots croisés. Les exercices de traduction et de néerlandais (QCM, Écrit,
  Dictée, de/het, Oral…) n'en prennent pas les mots.

## Traductions au survol

Dans les questions de cours et les définitions (exercices et liste), les mots néerlandais qui
sont dans le tableau sont soulignés d'un pointillé discret : au survol (ou en touchant le mot
sur téléphone), leur traduction s'affiche. Les expressions de plusieurs mots passent d'abord
(« klassieke oudheid »), les pluriels simples sont reconnus (« eeuwen », « dynastieën »), et le
mot à trouver n'est jamais traduit.

## Ajouter une interro

Dans Claude Code, `/interro` suivi du PDF d'une interro corrigée scannée : les questions sont
reprises dans le style du professeur (phrases à compléter, tableaux, cases à cocher), avec la
bonne réponse (correction du professeur ou cours), et une vingtaine de questions du même style
sur le reste du chapitre, pour des interros blanches. Elles vont dans l'onglet « Vragen ».

Les **erreurs de l'élève** vont dans la colonne **Raté** (ce qu'il avait écrit, « — » s'il n'a
rien écrit ; la même colonne existe pour les mots d'une interro de vocabulaire, avec Interro).
À l'ouverture, l'appli compte chaque erreur comme une réponse fausse du jour de l'interro (une
seule fois par appareil ; si la question a été réussie dans l'appli depuis, rien ne change) :
elle apparaît dans **À revoir**, qui montre les mots et les questions de cours, avec ce que
l'élève avait écrit, et un bouton pour s'entraîner sur les questions ratées. Ni nom ni note
ne vont dans le tableau.

## Réviser aujourd'hui, suivi, récompenses

- **Réviser aujourd'hui** (bouton de l'accueil) : une séance courte, toutes matières confondues, avec
  les erreurs récentes puis ce dont la date de révision est arrivée (boîtes de Leitner), une
  vingtaine de cartes au plus. Chaque carte a son exercice : questions de cours, définitions
  (matières en français), QCM (néerlandais).
- **Suivi** (bouton de l'accueil) : régularité (série de jours, record, calendrier des cinq
  dernières semaines ; un jour compte à partir de 10 réponses), récompenses, ce qui est su par
  matière et par chapitre, erreurs qui reviennent, et le **lien de transfert** pour réunir la
  progression de deux appareils (rien ne passe par le tableau ; pour chaque mot, la plus récente
  l'emporte).
- **Récompenses** : une surprise de mascotte de plus à 3, 7, 14 et 30 jours de révision d'affilée
  (confettis, feu d'artifice, couronne, arc-en-ciel de trèfles), annoncée sur l'accueil et acquise
  pour de bon.

## Exercices fabriqués par l'appli

Sans fin, une question nouvelle à chaque carte ; chacun ajoute un chapitre à sa matière et
n'apparaît que si elle est choisie :
- **Eeuwen** (Geschiedenis, en néerlandais) : une année → son siècle ou son tijdvak, un siècle →
  ses années, avec les pièges classiques (le siècle d'à côté, « v.C. » oublié) et le calcul expliqué ;
- **Calcul mental** (Mathématiques) : priorité des opérations, parenthèses, distributivité (réponse
  écrite), coder, décoder, propriétés (choix parmi 4) ;
- **Natures des mots** (Français) : la nature du mot souligné dans une phrase, et le test du cours
  (les phrases sont dans `src/data/natures.json`).

## Vérifier et nettoyer le tableau

`python3 outils/verifier.py` liste ce qui cloche : cases changées en date par Sheets, doublons,
lignes ignorées ou vidées, mots sans page, leurres manquants, réponses qui se repèrent à leur
longueur, énumérations incohérentes. Ensuite `cours.py corriger`, et
`cours.py supprimer [lignes.tsv] --onglet … [--vides]` pour retirer des lignes (ou les lignes vidées).

## Signaler une erreur

Un petit drapeau gris (dans la barre d'un exercice, et au survol d'une ligne de la liste des mots)
ouvre une fenêtre pour signaler une question ou un mot qui paraît faux : raisons à cocher et
commentaire facultatif. Le signalement arrive dans l'onglet **« Signalements »** du tableau (sans
réseau, il attend sur l'appareil). Le script du tableau n'accepte sans clé que cette action-là,
limitée (textes coupés, dix par minute et par appareil). Dans Claude Code, `/signalements` les
vérifie dans le cours, propose les corrections, les applique après accord
(`cours.py corriger`) et marque les signalements traités (`cours.py traiter`).

## Partager des réglages

L'icône 🔗 discrète à côté du nom de l'exercice, sur l'accueil, copie un **permalien** :
l'adresse de l'appli avec les réglages en cours (matières, chapitres, pages, exercice, sens,
nombre de mots, réponse, voix…). Qui l'ouvre arrive sur l'accueil avec ces réglages, qui
restent ensuite les siens (l'adresse est nettoyée aussitôt).

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
python3 outils/voix.py   # voix des nouvelles formes
```

## Le chapitre Getallen

Lui non plus ne vient pas du tableau : `src/data/getallen.json` contient les mots de base
des nombres (nul à twintig, les dizaines, honderd, duizend, miljoen), avec leurs pièges en
remarque. L'appli l'ajoute comme chapitre « Getallen » à la matière Nederlands. L'exercice
« Nombres » tire pour chaque mot un nombre où on l'entend (tachtig → 483, 85 120…), jusqu'à
deux millions, à écrire en lettres ou en chiffres. L'orthographe suit la Taalunie
(`src/lib/getallen.ts`) : tout attaché jusqu'à mille, une espace après duizend et autour de
miljoen ; les espaces ne comptent pas à la correction, le tréma (tweeëntwintig) si. Ces
nombres-là ne sont pas lus à voix haute ; après une erreur en lettres, l'exercice montre
le nombre décomposé et la règle.

## Les voix

Les mots sont lus par des voix belges (edge-tts : `nl-BE-DenaNeural`, `fr-BE-CharlineNeural`),
préparées en mp3 par `outils/voix.py` dans `public/audio/`. Depuis octobre 2026, le serveur
de voix de Microsoft refuse les serveurs de GitHub (erreur 403) : le script est lancé sur
l'ordinateur avant chaque commit, et les nouvelles voix partent avec le push. GitHub essaie
encore toutes les heures (au cas où Microsoft les accepterait de nouveau) ; un échec ne bloque
pas la publication. En attendant sa voix, un mot est lu par la voix du navigateur. Pour changer de voix : `VOIX` et `VITESSE` dans
`outils/voix.py` **et** dans `src/lib/voix.ts` (le test `tests/voix.test.ts` vérifie
qu'ils calculent les mêmes noms de fichiers).

## Mettre à jour l'appli

`git push` suffit : GitHub compile, teste et publie (onglet *Actions* du dépôt).
Les appareils reçoivent la nouvelle version au lancement suivant.

## Organisation

- `src/lib/` : la logique sans interface (lecture du tableau, correction, progression, séries)
- `src/ui/` : les écrans (accueil, exercices, fin, liste)
- `outils/voix.py` : prépare les voix (mp3)
- `outils/dessins.py` : les dessins des définitions de géométrie (`src/data/dessins.json`), montrés dans la liste des mots et l'exercice Définitions
- `outils/ajouter-definitions.gs` : script ponctuel pour le tableau (colonnes Définition / Exemple)
