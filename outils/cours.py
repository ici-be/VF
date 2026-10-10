#!/usr/bin/env python3
"""Fait le lien entre les cours scannés et le tableau Google Sheets (voir la commande /cours).

    python3 outils/cours.py configurer URL CLE         # une fois : URL et clé de recevoir-mots.gs
    python3 outils/cours.py tester                     # vérifie la connexion
    python3 outils/cours.py lire "HW Aardrijkskunde"   # les mots de l'onglet, en TSV
    python3 outils/cours.py envoyer mots.tsv --onglet "HW Aardrijkskunde" [--essai] [--dater]

Le fichier envoyé est un TSV avec une ligne de titres :
Page, Néerlandais, Dét., Français, Remarque, Définition, Exemple, Chapitre.
L'URL et la clé restent dans ~/.config/vocabulaire-nl/envoi.json, hors du dépôt (public).
"""
import argparse
import csv
import html
import io
import json
import re
import sys
import urllib.parse
import urllib.request
import zipfile
from pathlib import Path

SHEET_ID = '11jHRMPgM1A3N8eBCXocn-eqs52uqaJCVtbFNq2U0K8Y'   # comme src/lib/mots.ts
CONFIG = Path.home() / '.config' / 'vocabulaire-nl' / 'envoi.json'

# titre de colonne (en minuscules) → clé attendue par recevoir-mots.gs
TITRES = {
    'page': 'page', 'néerlandais': 'nl', 'dét.': 'det', 'français': 'fr', 'remarque': 'remarque',
    'définition': 'definition', 'exemple': 'exemple', 'chapitre': 'chapitre',
}


def config() -> dict:
    if not CONFIG.exists():
        sys.exit(f'Pas encore configuré : python3 {sys.argv[0]} configurer')
    return json.loads(CONFIG.read_text())


def configurer(args):
    url = args.url or input('URL de l\'application Web (…/exec) : ').strip()
    cle = args.cle or input('Clé secrète (journal de la fonction installer) : ').strip()
    CONFIG.parent.mkdir(parents=True, exist_ok=True)
    CONFIG.write_text(json.dumps({'url': url, 'cle': cle}) + '\n')
    CONFIG.chmod(0o600)
    print(f'Enregistré dans {CONFIG}')
    tester(None)


def appeler(donnees: dict | None = None) -> dict:
    c = config()
    if donnees is None:
        req = urllib.request.Request(c['url'] + '?' + urllib.parse.urlencode({'cle': c['cle']}))
    else:
        corps = json.dumps({**donnees, 'cle': c['cle']}).encode()
        req = urllib.request.Request(c['url'], corps, {'Content-Type': 'application/json'})
    # Apps Script répond par une redirection, que urllib suit en GET : c'est ce qu'il faut
    with urllib.request.urlopen(req, timeout=120) as r:
        res = json.loads(r.read())
    if not res.get('ok'):
        sys.exit(f'Erreur du tableau : {res.get("erreur")}')
    return res


def tester(_):
    res = appeler()
    print('Connexion OK. Onglets :', ', '.join(res['onglets']))


def onglets_xlsx(octets: bytes) -> dict[str, list[list[str]]]:
    """Onglets du classeur → lignes de cellules (texte), sans dépendance externe."""
    z = zipfile.ZipFile(io.BytesIO(octets))
    lire = lambda nom: z.read(nom).decode()
    texte = lambda x: html.unescape(re.sub(r'<[^>]+>', '', x))
    partages = [texte(m) for m in re.findall(r'<si>(.*?)</si>', lire('xl/sharedStrings.xml'), re.S)] \
        if 'xl/sharedStrings.xml' in z.namelist() else []
    attribut = lambda balise, nom: re.search(fr'\b{nom}="([^"]+)"', balise).group(1)
    cibles = {attribut(b, 'Id'): attribut(b, 'Target')
              for b in re.findall(r'<Relationship [^>]*>', lire('xl/_rels/workbook.xml.rels'))}
    res = {}
    for nom, rid in re.findall(r'<sheet [^>]*?name="([^"]+)"[^>]*?r:id="([^"]+)"', lire('xl/workbook.xml')):
        chemin = 'xl/' + cibles[rid].lstrip('/').removeprefix('xl/')
        lignes = []
        for ligne in re.findall(r'<row[^>]*>(.*?)</row>', lire(chemin), re.S):
            cellules = {}
            for ref, attrs, contenu in re.findall(r'<c r="([A-Z]+)\d+"([^>]*?)(?:/>|>(.*?)</c>)', ligne, re.S):
                v = re.search(r'<v>(.*?)</v>', contenu)
                if 't="s"' in attrs and v:
                    val = partages[int(v.group(1))]
                elif 't="inlineStr"' in attrs:
                    val = texte(contenu)
                else:
                    val = html.unescape(v.group(1)) if v else ''
                col = 0
                for ch in ref:
                    col = col * 26 + ord(ch) - 64
                cellules[col - 1] = val
            lignes.append([cellules.get(i, '') for i in range(max(cellules, default=-1) + 1)])
        res[html.unescape(nom)] = lignes
    return res


def lire_onglet(args):
    url = f'https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=xlsx'
    with urllib.request.urlopen(url, timeout=60) as r:
        onglets = onglets_xlsx(r.read())
    if args.onglet not in onglets:
        sys.exit(f'Onglet introuvable. Onglets : {", ".join(onglets)}')
    lignes = onglets[args.onglet]
    largeur = max(map(len, lignes), default=0)
    w = csv.writer(sys.stdout, delimiter='\t', lineterminator='\n')
    for l in lignes:
        if any(c.strip() for c in l):
            w.writerow(l + [''] * (largeur - len(l)))


def envoyer(args):
    with open(args.fichier, newline='', encoding='utf-8') as f:
        lecteur = csv.reader(f, delimiter='\t')
        titres = [TITRES.get(t.strip().lower()) for t in next(lecteur)]
        if 'nl' not in titres or 'fr' not in titres or 'chapitre' not in titres:
            sys.exit('Il faut au moins les colonnes Néerlandais, Français et Chapitre.')
        lignes = [{k: v.strip() for k, v in zip(titres, l) if k} for l in lecteur if any(c.strip() for c in l)]
    for l in lignes:
        if l.get('page', '').isdigit():
            l['page'] = int(l['page'])
    res = appeler({'onglet': args.onglet, 'lignes': lignes, 'essai': args.essai, 'dater': args.dater})
    quoi = 'Serait fait' if args.essai else 'Fait'
    print(f'{quoi} dans « {args.onglet} » :')
    print(f'  {len(res["ajoutes"])} mots ajoutés : {", ".join(res["ajoutes"]) or "—"}')
    print(f'  {len(res["pages"])} mots déjà présents, page ajoutée')
    print(f'  {len(res["dejaLa"])} mots déjà présents avec leur page')
    if args.dater:
        print(f'  {len(res.get("dates", []))} mots déjà présents datés d\'aujourd\'hui')
    if not args.essai:
        print('  onglet trié par chapitre puis par page')


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sous = p.add_subparsers(required=True)
    s = sous.add_parser('configurer')
    s.add_argument('url', nargs='?')
    s.add_argument('cle', nargs='?')
    s.set_defaults(f=configurer)
    sous.add_parser('tester').set_defaults(f=tester)
    s = sous.add_parser('lire')
    s.add_argument('onglet')
    s.set_defaults(f=lire_onglet)
    s = sous.add_parser('envoyer')
    s.add_argument('fichier')
    s.add_argument('--onglet', required=True)
    s.add_argument('--essai', action='store_true', help='ne rien écrire, dire ce qui serait fait')
    s.add_argument('--dater', action='store_true', help='dater aussi d\'aujourd\'hui les mots déjà présents sans date')
    s.set_defaults(f=envoyer)
    args = p.parse_args()
    args.f(args)


if __name__ == '__main__':
    main()
