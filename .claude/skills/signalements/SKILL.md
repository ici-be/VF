---
name: signalements
description: Traiter les signalements envoyés par le bouton drapeau de l'appli (onglet « Signalements » du tableau) - vérifier chaque question ou mot signalé dans le cours, proposer les corrections, les appliquer au tableau après accord et marquer les signalements traités. À utiliser quand l'utilisateur tape /signalements ou demande de regarder les signalements.
---

# Traiter les signalements

Le bouton drapeau de l'appli (dans un exercice, et dans la liste des mots) envoie un signalement
vers l'onglet **« Signalements »** du tableau : Date, Matière, Chapitre, Page, Élément (le mot ou la
question), Réponse attendue (la traduction, la définition ou la réponse), Exercice, Résultat (ce que
l'appli avait compté), Raisons, Commentaire, ID, Appareil, Traité. On parle français avec l'utilisateur.

## 1. Lire

```sh
python3 outils/cours.py lire Signalements > <scratchpad>/signalements.tsv
```

Ne garder que les lignes dont **Traité** est vide. S'il n'y en a pas : le dire, c'est fini.

## 2. Vérifier chaque signalement

Pour chacun, retrouver la ligne dans le tableau (`cours.py lire "<onglet de la matière>"`, ou
`cours.py lire Vragen` pour une question : Matière + Question) et **la source** :
- le PDF du cours ou de l'interro (dans `~/Documents`, souvent à côté d'un TSV du même nom :
  `<cours>.tsv`, `<cours> - questions.tsv`), à la page indiquée ;
- sinon ce que dit le cours ailleurs, ou une connaissance sûre (orthographe, grammaire, calcul).

Conclure, pour chacun : **erreur confirmée** (et la correction exacte, dans le style du tableau),
**pas d'erreur** (expliquer pourquoi, simplement — souvent l'élève a confondu deux notions), ou
**doute** (demander à l'utilisateur). Une « autre proposition juste aussi » dans un QCM : remplacer
le leurre fautif par un leurre clairement faux, ou ajouter la variante acceptée à la réponse (` / `).

## 3. Proposer

Un compte rendu court : pour chaque signalement, l'élément, ce qui est reproché, la conclusion et
la correction proposée (ancienne → nouvelle valeur). Ne rien écrire **sans accord explicite**.

## 4. Corriger et marquer

Écrire les corrections dans un TSV du scratchpad, colonnes
`Onglet	Matière	Question	Mot	Chapitre	Colonne	Valeur` :
- une question : Onglet `Vragen`, Matière et Question **exactes** (texte actuel du tableau),
  Colonne = `Question`, `Réponse`, `Leurres` (séparés par ` | `), `Éléments`, `Nombre`… ;
- un mot : Onglet de la matière, Mot (texte actuel) et Chapitre, Colonne = `Français` (ou
  `Définition` pour une matière en français), `Dét.`, `Exemple`, `Remarque`, `Néerlandais`/`Mot`…

```sh
python3 outils/cours.py corriger <corrections.tsv> --essai   # montre l'ancienne valeur de chaque case
python3 outils/cours.py corriger <corrections.tsv>
python3 outils/cours.py traiter <ID> <ID> --note "réponse corrigée"
python3 outils/cours.py traiter <ID> --note "pas d'erreur : …"
```

Changer le texte d'une question ou d'un mot (la colonne Question, Néerlandais ou Mot) en change
l'identifiant : sa progression dans l'appli repart de zéro. Le signaler à l'utilisateur.

Puis les voix si un texte lu a changé (`python3 outils/voix.py`, commit de `public/audio`, push,
suivi de la publication, comme dans `/cours` section 7). Rappeler que l'appli prend les
corrections au prochain chargement.
