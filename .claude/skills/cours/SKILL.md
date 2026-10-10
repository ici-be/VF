---
name: cours
description: Extraire le vocabulaire et les questions de cours d'un cours scanné (PDF) et les ajouter au tableau Google Sheets de l'appli, dans l'ordre du cours, avec chapitre et page. À utiliser quand l'utilisateur donne un ou plusieurs PDF de cours, ou tape /cours.
argument-hint: <fichier.pdf> [autres PDF]
---

# Ajouter un cours scanné au tableau

Les cours sont des PDF scannés (immersion en néerlandais : histoire, géographie, biologie…).
Le but : en tirer les mots utiles, les proposer à l'utilisateur, puis les envoyer dans le
tableau avec `outils/cours.py`. On parle français avec l'utilisateur.

## 1. Lire le PDF

- Rendre les pages en images dans le scratchpad (un dossier neuf par PDF) :
  `pdftoppm -r 110 -png "<pdf>" <dossier>/p`, puis lire **toutes** les pages avec Read.
  Si le gras est douteux sur une page, la rendre en 200 dpi.
- Numéro de page = celui **imprimé** sur la page (pas l'ordre dans le PDF).
  Signaler les pages manquantes dans la suite (ex. « pages 14 et 24-26 absentes du scan »).

## 2. Onglet et chapitre

- **Onglet** : d'après le pied ou l'en-tête de page (« HW - Aardrijkskunde » → `HW Aardrijkskunde`)
  ou le nom du fichier. Liste des onglets : `python3 outils/cours.py lire x` (l'erreur les liste).
- Lire l'onglet : `python3 outils/cours.py lire "<onglet>" > <scratchpad>/onglet.tsv`.
- **Chapitre** : d'après le nom du fichier (`Aardrijkskunde - 3. Klimaat.pdf`) ou le titre du
  chapitre dans le cours. Reprendre exactement le format des chapitres existants de l'onglet
  (`N. Titel`, en néerlandais, comme dans le cours). Si les pages continuent un chapitre déjà
  présent, garder son nom tel quel. Ne demander à l'utilisateur qu'en cas de vrai doute.
  Les « Activiteit », « Technische fiche n° 12 »… ne sont pas des chapitres.

## 3. Choisir les mots

Dans l'ordre des pages, de haut en bas :
- tous les mots et groupes **en gras** (et soulignés ou surlignés par l'enseignant) ;
- tous les mots **définis** (encadrés, « … is … », « = … », exercices « verbind met de juiste
  definitie ») ;
- les mots qui reviennent souvent ou sans lesquels on ne comprend pas le cours, y compris les
  verbes de consigne (omcirkelen, noteren, vergelijken…) ;
- les noms géographiques ou propres seulement s'ils sont à connaître (océans, régions de la
  leçon), pas les exemples isolés.
- Pas de mots transparents évidents (`Canada`, `de auto`), pas de chiffres.

Un mot **déjà dans ce chapitre** : le garder dans la proposition (il recevra sa page, c'est
ce qui permet de trier dans l'ordre du cours). Un mot **déjà dans un autre chapitre** de
l'onglet : ne pas le reprendre, mais le citer dans le compte rendu (l'utilisateur peut le
demander quand même ; l'appli accepte un mot dans deux chapitres).

## 4. Remplir les colonnes (comme le tableau existant)

- **Néerlandais** : forme de base (singulier, infinitif), sans article. Groupes figés gardés
  tels quels (`natuurlijke aangroei`, `gelijk blijven`). Majuscule seulement pour les noms propres.
- **Dét.** : `de` ou `het` pour les noms, vide sinon.
- **Français** : avec l'article (`la densité de population`, `l'habitant`) ; variantes séparées
  par `, ` ; précision entre parenthèses (`la légende (d'une carte)`).
- **Remarque** : `Pluraal: …` si irrégulier ou utile, `Synoniem: …`, `Tegengestelde: …`,
  `Afkorting: …`, `Vb. …`, comparatif (`Ouder = plus âgé`), phrases séparées par `. `.
- **Définition** : en néerlandais, reprise **du cours** (raccourcie si besoin), sans point final.
  Vide si le cours n'en donne pas.
- **Exemple** : une phrase du cours où le mot est utile, la partie à trouver entre crochets :
  `Het bevolkingsaantal [neemt af]`. Seulement pour les verbes, adjectifs, expressions,
  ou quand la phrase aide vraiment.
- **Page** : la page imprimée de la première apparition dans le chapitre.
- **Chapitre** : celui choisi à l'étape 2.
- Pas de tabulation ni de retour à la ligne dans une case.

Écrire la proposition en TSV, avec la ligne de titres
`Page	Néerlandais	Dét.	Français	Remarque	Définition	Exemple	Chapitre`,
**à côté du PDF**, même nom en `.tsv` (l'utilisateur peut l'ouvrir dans LibreOffice).

## 4 bis. Questions de cours

Pour l'exercice « Questions de cours » : ce qu'un élève doit savoir répondre à l'interro.
Compter 1 à 2 questions par page de contenu (moins pour les pages d'exercices pratiques).

- **Sources**, par ordre de priorité : les questions que le cours pose lui-même
  (« Wat is bevolkingsgroei? ») ; les encadrés ⚠ et définitions en gras ; les conclusions
  (« Conclusie: … ») ; les tableaux de synthèse (types de cartes, lokalisatiefactoren…).
- **Pas** de questions sur un exercice à faire en classe dont la réponse n'est pas dans le
  cours (« Welke landen hebben de hoogste geboortecijfers? » avec une ligne vide), ni sur des
  chiffres isolés d'un document (inwoners van Caïro).
- **Question** : en néerlandais, courte, comme un professeur la poserait : `Wat is …?`,
  `Waarom …?`, `Wat is het verschil tussen … en …?`, `Noem twee …`, `Hoe bereken je …?`.
- **Réponse** : en néerlandais, **avec les mots du cours**, une phrase (deux au plus), sans
  point final. Elle doit se comprendre seule.
- **Leurres** : trois mauvaises réponses, séparées par ` | `, plausibles pour un élève qui
  confond (une notion voisine du même chapitre, l'inverse, une réponse à moitié juste),
  de même longueur et même forme que la bonne réponse, et clairement fausses pour qui a étudié.
  La bonne réponse ne doit **jamais** se repérer à sa longueur ou à sa précision : raccourcir
  la réponse ou allonger les leurres pour qu'ils se ressemblent.
  Jamais « toutes les réponses » ni de piège sur un détail de formulation.
- **Matière** : le nom exact de l'onglet des mots (`HW Aardrijkskunde`).
- **Chapitre**, **Page** : comme pour les mots.

Écrire les questions dans un second TSV à côté du PDF, nom suivi de ` - questions.tsv`, avec
la ligne de titres `Matière	Chapitre	Page	Question	Réponse	Leurres`, dans l'ordre du cours.
Avant d'en écrire, lire l'onglet des questions (`python3 outils/cours.py lire Vragen`, s'il
existe) pour ne pas reposer une question déjà là.

## 5. Faire relire

Montrer un compte rendu court :
- onglet, chapitre, pages lues et pages manquantes ;
- les **nouveaux** mots (néerlandais → français, page), en tableau compact ;
- le nombre de mots déjà présents qui recevront leur page ;
- les mots écartés car déjà dans un autre chapitre ;
- les doutes (lecture incertaine, traduction à vérifier) ;
- les **questions** proposées (question → réponse, page), en liste compacte ; les leurres
  restent dans le TSV, sauf si l'utilisateur veut les voir.

Appliquer les corrections demandées dans le TSV. N'envoyer **qu'après accord explicite**.

## 6. Envoyer

```sh
python3 outils/cours.py envoyer "<fichier.tsv>" --onglet "<onglet>" --essai   # vérifier
python3 outils/cours.py envoyer "<fichier.tsv>" --onglet "<onglet>"
python3 outils/cours.py envoyer "<fichier - questions.tsv>" --onglet Vragen   # (--essai d'abord aussi)
```

Si `cours.py` dit « Pas encore configuré », renvoyer l'utilisateur au mode d'emploi en tête
de `outils/recevoir-mots.gs`. Les nouveaux mots reçoivent la date du jour (colonne « Ajouté »),
l'onglet est trié par chapitre puis par page. Rappeler que l'appli les montre dans la liste
des mots, onglet « Nouveaux », que les questions sont dans l'exercice « Questions de cours »
(et la liste des mots, onglet « Questions »), et que les voix suivent dans l'heure.
