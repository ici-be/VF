---
name: interro
description: Lire une interro corrigée scannée (PDF) et en tirer les questions, dans le style du professeur, pour l'onglet « Vragen » du tableau de l'appli, avec d'autres questions du même style sur le reste du chapitre. À utiliser quand l'utilisateur donne une interro scannée, ou tape /interro.
argument-hint: <interro.pdf> [autres PDF]
---

# Ajouter une interro scannée au tableau

Les interros sont des PDF scannés, remplis et corrigés à la main (immersion en néerlandais).
Une interro de **Français** ou de **Religion** se traite de la même façon, en français :
questions et réponses en français, Matière = `Français` ou `Religion`, chapitre au format du
cours (`1. Les figures de style`). Voir aussi `/cours`, section 8.
Le but : retrouver **les questions telles que le professeur les pose**, avec la bonne réponse,
pour que l'élève s'entraîne sur ce format (exercice « Questions de cours », feuille « Interro »).
On parle français avec l'utilisateur.

**Dans le tableau** (lisible publiquement) : les questions, les bonnes réponses, et les erreurs
de l'élève (colonne « Raté », d'accord de l'utilisateur). Jamais de nom, de note ni d'appréciation.

## 1. Lire le PDF

- Rendre les pages en images dans le scratchpad (un dossier neuf par PDF) :
  `pdftoppm -r 110 -png "<pdf>" <dossier>/p`, puis lire **toutes** les pages avec Read.
  Une écriture difficile à lire : rendre la page en 200 dpi.
- Relever : matière (« Vak: HW - Geschiedenis » → onglet `HW Geschiedenis`), numéro et titre
  de l'interro (« TOETS 5 »), date, chapitre visé (« H1 »).
- Ignorer l'auto-évaluation (« Zelfevaluatie »), le score, les appréciations.

## 2. Onglet, chapitre, réponses du cours

- Lire l'onglet des mots (`python3 outils/cours.py lire "<onglet>"`) et l'onglet des questions
  (`python3 outils/cours.py lire Vragen`), dans le scratchpad.
- **Chapitre** : un chapitre **existant** de l'onglet (le titre de l'interro peut différer :
  « H1: De tijd staat niet stil! » → `1. Werken met tijd`). En cas de vrai doute, demander.
- **Page** : celle du mot ou de la question du cours qui donne la réponse (le tableau a les
  pages) ; vide si on ne la trouve pas.
- **La bonne réponse** vient, dans l'ordre : de la correction du professeur (écrite en rouge,
  vert…) ; d'une réponse de l'élève cochée juste (✓) ; du cours (mots, définitions, questions
  de l'onglet). **Ne jamais deviner** : une question dont la réponse n'est ni corrigée ni dans
  le cours est mise de côté et signalée à l'utilisateur.

## 3. Écrire les questions de l'interro

Chaque élément noté de l'interro devient une ou plusieurs questions, dans l'ordre de l'interro,
en gardant **les mots du professeur** :

- **Phrase à compléter** (« Vul aan ») : la phrase telle quelle, le trou écrit `___` (trois
  traits bas ou plus), **un seul trou par question** ; la Réponse = le mot qui manque, avec ses
  variantes acceptées séparées par ` / ` (`eigen tijd / eigentijdse tijd`, `18de eeuw / 18e eeuw`).
  Pas de point final dans la réponse ; le reste de la phrase (ponctuation comprise) reste dans
  la question. L'appli fait écrire le mot et corrige l'orthographe (une lettre de travers =
  « presque », comme le demi-point du professeur).
- **Tableau à remplir** : une question par case à trouver, en reprenant la ligne du tableau
  dans la phrase : « De Romeinen bouwen het Colosseum in Rome tijdens ___. » → `de klassieke
  oudheid / klassieke oudheid` ; pour une date de début et de fin : une énumération
  (« Geef de start- en einddatum van de middeleeuwen. », Éléments `476 | 1492`).
- **Cases à cocher** (choix multiple) : une question normale avec Réponse et trois Leurres
  (les autres cases du professeur).
- **Fiche à remplir** (« identiteitskaart ») : une phrase à compléter par ligne de la fiche.
- **Question ouverte** : une question normale (Réponse en une phrase, trois Leurres), comme
  dans `/cours` (section 4 bis).

Colonnes : `Matière	Chapitre	Page	Question	Réponse	Leurres	Éléments	Nombre	Interro	Raté`,
avec **Interro** = `Toets N – JJ/MM/AAAA` (le numéro et la date de l'interro : l'appli date
l'erreur avec) et **Raté** = ce que l'élève a écrit, tel quel (`millenium`), ou `—` s'il n'a rien
écrit ; vide si la réponse est juste. Un demi-point compte comme raté (faute d'orthographe).
Dans un tableau, la case de l'élève pour cette question précise.

Une interro de **vocabulaire** (mots d'un onglet de matière) : un TSV de mots (`Néerlandais`,
`Français`, `Chapitre`… comme `/cours`) avec seulement les mots ratés, et `Interro` et `Raté` ;
les mots déjà là reçoivent ces deux cases si elles sont vides.

## 4. Questions du même style sur le reste du chapitre

Pour faire des interros blanches : 15 à 25 questions **du même genre** que celles du professeur
(surtout des phrases à compléter par un mot du cours), sur les notions du chapitre que
l'interro n'a pas posées, réparties sur toutes les pages du chapitre.

- Les phrases viennent du cours : définitions et questions de l'onglet, reformulées comme le
  professeur (« Een periode van 100 jaar noemen we een ___. »). Le trou = un **mot du tableau**.
- Pas de doublon avec une question déjà dans « Vragen » (même formulation) ni avec l'interro.
- **Interro** vide pour celles-ci (elles ne viennent pas d'une interro).

## 5. Fichier et relecture

Écrire toutes les questions (celles de l'interro d'abord) dans un TSV **à côté du PDF**, même
nom suivi de ` - questions.tsv`. Pas de tabulation ni de retour à la ligne dans une case.

Montrer un compte rendu court :
- onglet, chapitre, nom de l'interro ;
- les questions de l'interro (question → réponse, page), en liste compacte ;
- les erreurs (question → ce que l'élève a écrit) ;
- les questions écartées (réponse inconnue) et pourquoi ;
- les questions du même style, en liste compacte ;
- **ce que l'interro révèle** (types d'erreurs de l'élève : orthographe, notion confondue, calcul
  des siècles…) — dans la conversation seulement, jamais dans le tableau.

Appliquer les corrections demandées. N'envoyer **qu'après accord explicite**.

## 6. Envoyer

```sh
python3 outils/cours.py envoyer "<fichier - questions.tsv>" --onglet Vragen --essai
python3 outils/cours.py envoyer "<fichier - questions.tsv>" --onglet Vragen
```

Les colonnes « Interro » et « Raté » sont créées au premier envoi qui en a. Si elles n'apparaissent pas, le
script du tableau (`outils/recevoir-mots.gs`) n'est pas à jour : le recoller dans Apps Script
et redéployer (mode d'emploi en tête du fichier).

Puis les voix, comme pour `/cours` (section 7) : `python3 outils/voix.py`, commit de
`public/audio`, push, suivi de la publication.

Rappeler où les retrouver : « À revoir » sur l'accueil (les erreurs, avec ce que l'élève avait
écrit, à la prochaine ouverture de l'appli sur son appareil), exercice « Questions de cours » (les phrases à compléter se
répondent en écrivant le mot), liste des mots onglet « Questions » (avec l'étiquette de
l'interro), et le bouton « Interro » de l'accueil pour imprimer une interro blanche.
