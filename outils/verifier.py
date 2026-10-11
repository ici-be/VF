#!/usr/bin/env python3
"""Vérifie le tableau de l'appli et liste ce qui cloche, onglet par onglet.

    python3 outils/verifier.py          # lit le tableau (public), n'écrit rien

Ce qui est cherché :
- les cases que Google Sheets a changées en date ou en nombre (« 7 / sept » → 46272) ;
- les doublons (un mot deux fois dans un chapitre, une question deux fois dans une matière) ;
- les lignes que l'appli ignore (sans traduction, sans réponse, ou vidées) ;
- les mots sans page (ils sortent des révisions « pages 5 à 12 ») ;
- les questions : matière inconnue, leurres manquants ou identiques à la réponse, réponse qui se
  repère à sa longueur, plusieurs trous ___, énumération qui demande plus d'éléments qu'elle n'en a.
Les corrections se font ensuite avec `cours.py corriger`, `cours.py supprimer` (voir /signalements).
"""
import re
import sys
import urllib.request
from collections import Counter, defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import cours  # noqa: E402  (même lecture du tableau)

ONGLETS_A_PART = {'vragen', 'signalements'}
NL = ['néerlandais', 'nederlands', 'nl', 'mot', 'terme', 'notion', 'mot-clé']


def ressemble_a_une_date(v: str) -> bool:
    """Un nombre de 5 chiffres que rien n'explique : une date que Sheets a convertie (jours depuis 1899)."""
    return bool(re.fullmatch(r'\d{5}(\.\d+)?', v.strip())) and 30000 < float(v) < 60000


def colonnes(titres: list[str], noms: dict[str, list[str]]) -> dict[str, int]:
    t = [x.strip().lower() for x in titres]
    return {k: next((i for i, x in enumerate(t) if x in n), -1) for k, n in noms.items()}


def verifier_mots(nom: str, lignes: list[list[str]], pb: list[str]):
    entete = next((i for i, l in enumerate(lignes) if any(c.strip().lower() in NL for c in l)), None)
    if entete is None:
        return
    col = colonnes(lignes[entete], {
        'nl': NL, 'fr': ['français', 'frans', 'fr'], 'definition': ['définition', 'definition', 'definitie'],
        'exemple': ['exemple', 'voorbeeld', 'phrase'], 'remarque': ['remarque', 'remarques', 'opmerking'],
        'chapitre': ['chapitre', 'hoofdstuk'], 'page': ['page', 'pagina', 'blz', 'blz.'],
    })
    v = lambda l, k: l[col[k]].strip() if 0 <= col[k] < len(l) else ''
    traduction = 'fr' if col['fr'] >= 0 else 'definition'
    vus, sans_page = Counter(), defaultdict(int)
    for n, l in enumerate(lignes[entete + 1:], start=entete + 2):
        if not any(c.strip() for c in l):
            continue
        mot = v(l, 'nl')
        if not mot:
            pb.append(f'[{nom}] ligne {n} : pas de mot, mais la ligne n’est pas vide (ligne vidée ? → supprimer --vides)')
            continue
        if not v(l, traduction):
            pb.append(f'[{nom}] « {mot} » : pas de {"traduction" if traduction == "fr" else "définition"}, l’appli l’ignore')
        for k in ('nl', 'fr', 'definition', 'exemple', 'remarque'):
            if v(l, k) and ressemble_a_une_date(v(l, k)):
                pb.append(f'[{nom}] « {mot} », colonne {k} : « {v(l, k)} » ressemble à une date convertie par Sheets')
        ex = v(l, 'exemple')
        if ex.count('[') != ex.count(']'):
            pb.append(f'[{nom}] « {mot} » : crochets mal fermés dans l’exemple « {ex} »')
        vus[(mot.lower(), v(l, 'chapitre'))] += 1
        if col['page'] >= 0 and not v(l, 'page'):
            sans_page[v(l, 'chapitre') or 'Sans chapitre'] += 1
    for (mot, ch), k in vus.items():
        if k > 1:
            pb.append(f'[{nom}] « {mot} » est {k} fois dans le chapitre « {ch} »')
    for ch, k in sans_page.items():
        pb.append(f'[{nom}] {k} mot(s) sans page dans « {ch} » (hors des révisions par pages)')


def verifier_questions(lignes: list[list[str]], matieres: set[str], pb: list[str]):
    entete = next((i for i, l in enumerate(lignes) if any(c.strip().lower() in ('question', 'vraag') for c in l)), None)
    if entete is None:
        return
    col = colonnes(lignes[entete], {
        'matiere': ['matière', 'matiere', 'vak'], 'chapitre': ['chapitre', 'hoofdstuk'], 'question': ['question', 'vraag'],
        'reponse': ['réponse', 'reponse', 'antwoord'], 'leurres': ['leurres', 'mauvaises réponses', 'fout'],
        'elements': ['éléments', 'elements', 'elementen'], 'nombre': ['nombre', 'aantal'],
    })
    v = lambda l, k: l[col[k]].strip() if 0 <= col[k] < len(l) else ''
    vues = Counter()
    for n, l in enumerate(lignes[entete + 1:], start=entete + 2):
        if not any(c.strip() for c in l):
            continue
        q, r, m = v(l, 'question'), v(l, 'reponse'), v(l, 'matiere')
        nom = f'[Vragen] « {q[:70]} »'
        if not q:
            pb.append(f'[Vragen] ligne {n} : pas de question, mais la ligne n’est pas vide (ligne vidée ? → supprimer --vides)')
            continue
        elements = [x.strip() for x in v(l, 'elements').split('|') if x.strip()]
        if not r and not elements:
            pb.append(f'{nom} : pas de réponse, l’appli l’ignore')
        if m.lower() not in matieres:
            pb.append(f'{nom} : matière « {m} » sans onglet de mots (faute de frappe ?)')
        if not v(l, 'chapitre'):
            pb.append(f'{nom} : pas de chapitre')
        for k in ('reponse', 'leurres', 'elements'):
            if v(l, k) and any(ressemble_a_une_date(x) for x in v(l, k).split('|')):
                pb.append(f'{nom}, colonne {k} : « {v(l, k)} » ressemble à une date convertie par Sheets')
        vues[(m.lower(), q.lower())] += 1
        if len(re.findall(r'_{3,}', q)) > 1:
            pb.append(f'{nom} : plusieurs trous ___ (un seul par question)')
        nombre = v(l, 'nombre')
        if nombre and elements and nombre.isdigit() and int(nombre) > len(elements):
            pb.append(f'{nom} : demande {nombre} éléments, n’en a que {len(elements)}')
        leurres = [x.strip() for x in v(l, 'leurres').split('|') if x.strip()]
        if elements or re.search(r'_{3,}', q):
            continue   # énumération ou phrase à compléter : pas de choix parmi 4
        if len(leurres) < 3:
            pb.append(f'{nom} : {len(leurres)} leurre(s) au lieu de 3 (l’appli en emprunte à d’autres questions)')
        variantes = {x.strip().lower() for x in r.split('/')}
        if any(x.lower() in variantes for x in leurres):
            pb.append(f'{nom} : un leurre est la bonne réponse')
        if leurres and len(r) >= 12:
            moyenne = sum(map(len, leurres)) / len(leurres)
            if len(r) > 1.8 * moyenne or len(r) < .5 * moyenne:
                pb.append(f'{nom} : la réponse ({len(r)} signes) se repère à sa longueur (leurres : {moyenne:.0f} en moyenne)')
    for (m, q), k in vues.items():
        if k > 1:
            pb.append(f'[Vragen] « {q[:70]} » est {k} fois en {m}')


def main():
    url = f'https://docs.google.com/spreadsheets/d/{cours.SHEET_ID}/export?format=xlsx'
    with urllib.request.urlopen(url, timeout=60) as r:
        onglets = cours.onglets_xlsx(r.read())
    pb: list[str] = []
    matieres = {n.lower() for n in onglets if n.lower() not in ONGLETS_A_PART}
    for nom, lignes in onglets.items():
        if nom.lower() == 'vragen':
            verifier_questions(lignes, matieres, pb)
        elif nom.lower() not in ONGLETS_A_PART:
            verifier_mots(nom, lignes, pb)
    if not pb:
        print('Rien à signaler.')
        return
    print(f'{len(pb)} point(s) à vérifier :')
    for p in pb:
        print('  ' + p)


if __name__ == '__main__':
    main()
