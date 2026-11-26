#!/usr/bin/env python3
"""Les images des mots-images : une illustration par mot difficile, générée par Gemini.

    python3 outils/images.py configurer CLE [--modele gemini-2.5-flash-image]   # une fois
    python3 outils/images.py generer scenes.tsv [--dossier public/images/mots] [--refaire] [--essai]

scenes.tsv : un TSV avec une ligne de titres, colonnes « Néerlandais » (le mot, tel qu'il est dans le
tableau) et « Scène » (la scène à dessiner, en anglais, écrite par Claude d'après le pont du mot).
Chaque image va dans <dossier>/<mot sans article>.webp (800 px de large) ; une image déjà là
n'est pas refaite sans --refaire. Avec --essai, rien n'est envoyé : la commande montre les consignes.
La clé reste dans ~/.config/vocabulaire-nl/gemini.json, hors du dépôt (public).
"""
import argparse
import base64
import csv
import io
import json
import re
import sys
import unicodedata
import urllib.error
import urllib.request
from pathlib import Path

CONFIG = Path.home() / '.config' / 'vocabulaire-nl' / 'gemini.json'
MODELE = 'gemini-2.5-flash-image'
DOSSIER = Path(__file__).resolve().parent.parent / 'public' / 'images' / 'mots'

# Le style commun : toutes les cartes doivent sembler venir du même livre.
STYLE = (
    "Children's picture-book illustration for a 12-year-old: bright warm colours, clean confident "
    "outlines, soft shading, simple light background, one clear focal action filling the frame, "
    "funny and friendly, never scary or gory. Absolutely no text, letters, numbers, labels, "
    "speech bubbles or captions anywhere in the image. Landscape 4:3."
)


def config() -> dict:
    if not CONFIG.exists():
        sys.exit(f'Pas encore configuré : python3 {sys.argv[0]} configurer CLE')
    return json.loads(CONFIG.read_text())


def configurer(args):
    CONFIG.parent.mkdir(parents=True, exist_ok=True)
    CONFIG.write_text(json.dumps({'cle': args.cle, 'modele': args.modele}) + '\n')
    CONFIG.chmod(0o600)
    print(f'Enregistré dans {CONFIG} (modèle {args.modele})')


def nom_fichier(mot: str) -> str:
    """« de ruggengraat » → « ruggengraat », « zich voeden » → « zich-voeden », « amfibieën » → « amfibieen »."""
    m = re.sub(r'^(de|het)\s+', '', mot.strip().lower())
    m = unicodedata.normalize('NFKD', m).encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9]+', '-', m).strip('-')


def generer_une(scene: str, c: dict) -> bytes:
    corps = {
        'contents': [{'parts': [{'text': f'{scene}\n\n{STYLE}'}]}],
        'generationConfig': {'responseModalities': ['IMAGE'], 'imageConfig': {'aspectRatio': '4:3'}},
    }
    url = f'https://generativelanguage.googleapis.com/v1beta/models/{c.get("modele", MODELE)}:generateContent'
    req = urllib.request.Request(url, json.dumps(corps).encode(),
                                 {'Content-Type': 'application/json', 'x-goog-api-key': c['cle']})
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            res = json.loads(r.read())
    except urllib.error.HTTPError as e:
        raise RuntimeError(f'HTTP {e.code} : {e.read().decode(errors="replace")[:400]}')
    for cand in res.get('candidates', []):
        for part in cand.get('content', {}).get('parts', []):
            donnees = part.get('inlineData') or part.get('inline_data')
            if donnees:
                return base64.b64decode(donnees['data'])
    raise RuntimeError(f'pas d\'image dans la réponse : {json.dumps(res)[:400]}')


def en_webp(png: bytes, dest: Path):
    from PIL import Image
    im = Image.open(io.BytesIO(png)).convert('RGB')
    if im.width > 800:
        im = im.resize((800, round(im.height * 800 / im.width)), Image.LANCZOS)
    im.save(dest, 'WEBP', quality=80, method=6)


def generer(args):
    lignes = list(csv.DictReader(open(args.tsv, encoding='utf-8'), delimiter='\t'))
    dossier = Path(args.dossier)
    dossier.mkdir(parents=True, exist_ok=True)
    c = None if args.essai else config()
    faites = 0
    for l in lignes:
        mot, scene = (l.get('Néerlandais') or '').strip(), (l.get('Scène') or '').strip()
        if not mot or not scene:
            continue
        dest = dossier / f'{nom_fichier(mot)}.webp'
        if dest.exists() and not args.refaire:
            print(f'· {mot} : déjà là ({dest.name})')
            continue
        if args.essai:
            print(f'· {mot} → {dest.name}\n  {scene}')
            continue
        try:
            en_webp(generer_une(scene, c), dest)
            faites += 1
            print(f'✓ {mot} → {dest}')
        except RuntimeError as e:
            print(f'✗ {mot} : {e}', file=sys.stderr)
    if not args.essai:
        print(f'{faites} image(s) faite(s).')


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    s = p.add_subparsers(dest='cmd', required=True)
    a = s.add_parser('configurer'); a.add_argument('cle'); a.add_argument('--modele', default=MODELE)
    a.set_defaults(f=configurer)
    a = s.add_parser('generer'); a.add_argument('tsv'); a.add_argument('--dossier', default=str(DOSSIER))
    a.add_argument('--refaire', action='store_true'); a.add_argument('--essai', action='store_true')
    a.set_defaults(f=generer)
    args = p.parse_args()
    args.f(args)


if __name__ == '__main__':
    main()
