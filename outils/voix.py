#!/usr/bin/env python3
"""Prépare les voix (mp3 edge-tts) de tous les mots du tableau.

Pour chaque mot : le néerlandais avec son article, le français, la définition et
l'exemple. Chaque fichier s'appelle d'après une empreinte de (voix, vitesse, texte) :
l'appli calcule la même empreinte (src/lib/voix.ts) pour retrouver le fichier.
Seuls les fichiers manquants sont créés ; ceux qui ne servent plus sont supprimés.

    pip install edge-tts
    python3 outils/voix.py            # écrit dans public/audio/
"""
import asyncio
import hashlib
import io
import json
import os
import tempfile
import re
import sys
import unicodedata
import urllib.request
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

import edge_tts

SHEET_ID = '11jHRMPgM1A3N8eBCXocn-eqs52uqaJCVtbFNq2U0K8Y'
VOIX = {'nl': 'nl-BE-DenaNeural', 'fr': 'fr-BE-CharlineNeural'}
VITESSE = '-10%'
DOSSIER = Path(__file__).resolve().parent.parent / 'public' / 'audio'
EN_PARALLELE = 6

# Mêmes noms de colonnes que src/lib/mots.ts
COLONNES = {
    'nl': ['néerlandais', 'nederlands', 'nl'],
    'det': ['dét.', 'dét', 'det', 'déterminant', 'lidwoord', 'article'],
    'fr': ['français', 'frans', 'fr'],
    'definition': ['définition', 'definition', 'definitie'],
    'exemple': ['exemple', 'voorbeeld', 'phrase'],
}
NS = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
NS_REL = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}'


def texte_a_lire(t: str) -> str:
    """Identique à texteALire() dans src/lib/voix.ts."""
    t = unicodedata.normalize('NFC', t)
    t = re.sub(r'\([^)]*\)', ' ', t)
    t = re.sub(r'[\[\]]', '', t)
    t = re.sub(r'\s*/\s*', ', ', t)
    return re.sub(r'\s+', ' ', t).strip()


def empreinte(langue: str, texte: str) -> str:
    """Identique à empreinte() dans src/lib/voix.ts."""
    cle = f'{VOIX[langue]}|{VITESSE}|{texte_a_lire(texte)}'
    return hashlib.sha1(cle.encode('utf-8')).hexdigest()[:16]


def lire_onglets(octets: bytes):
    """(nom, lignes) pour chaque onglet du classeur .xlsx."""
    z = zipfile.ZipFile(io.BytesIO(octets))
    partages = []
    if 'xl/sharedStrings.xml' in z.namelist():
        for si in ET.fromstring(z.read('xl/sharedStrings.xml')).iter(NS + 'si'):
            partages.append(''.join(t.text or '' for t in si.iter(NS + 't')))
    rels = {r.get('Id'): r.get('Target') for r in ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
    for feuille in ET.fromstring(z.read('xl/workbook.xml')).iter(NS + 'sheet'):
        cible = rels[feuille.get(NS_REL + 'id')]
        chemin = cible.lstrip('/') if cible.startswith('/') else 'xl/' + cible
        lignes = []
        for row in ET.fromstring(z.read(chemin)).iter(NS + 'row'):
            ligne = {}
            for c in row.iter(NS + 'c'):
                col = 0
                for ch in re.match(r'[A-Z]+', c.get('r')).group():
                    col = col * 26 + ord(ch) - 64
                v = c.find(NS + 'v')
                if c.get('t') == 's' and v is not None:
                    ligne[col - 1] = partages[int(v.text)]
                elif c.get('t') == 'inlineStr':
                    ligne[col - 1] = ''.join(t.text or '' for t in c.iter(NS + 't'))
                else:
                    ligne[col - 1] = v.text if v is not None and v.text else ''
            lignes.append([ligne.get(i, '') for i in range(max(ligne, default=-1) + 1)])
        yield feuille.get('name'), lignes


def textes(octets: bytes) -> set[tuple[str, str]]:
    """Tous les (langue, texte) que l'appli peut lire à voix haute."""
    res = set()
    for _, lignes in lire_onglets(octets):
        res |= textes_questions(lignes)
        entete = next((i for i, l in enumerate(lignes) if any(c.strip().lower() in COLONNES['nl'] for c in l)), None)
        if entete is None:
            continue
        titres = [c.strip().lower() for c in lignes[entete]]
        col = {k: next((i for i, t in enumerate(titres) if t in noms), -1) for k, noms in COLONNES.items()}
        if col['fr'] < 0:
            continue
        for l in lignes[entete + 1:]:
            val = lambda k: l[col[k]].strip() if 0 <= col[k] < len(l) else ''
            nl, fr = val('nl'), val('fr')
            if not nl or not fr or nl.lower() in COLONNES['nl']:
                continue
            det = val('det').lower()
            res.add(('nl', f'{det} {nl}' if det in ('de', 'het') else nl))
            res.add(('fr', fr))
            for k in ('definition', 'exemple'):
                if val(k):
                    res.add(('nl', val(k)))
    return {(lg, t) for lg, t in res if texte_a_lire(t)}


def textes_questions(lignes: list[list[str]]) -> set[tuple[str, str]]:
    """Un onglet de questions de cours (« Vragen ») : questions et réponses, en néerlandais."""
    entete = next((i for i, l in enumerate(lignes) if any(c.strip().lower() in ('question', 'vraag') for c in l)), None)
    if entete is None:
        return set()
    titres = [c.strip().lower() for c in lignes[entete]]
    cols = [i for i, t in enumerate(titres) if t in ('question', 'vraag', 'réponse', 'reponse', 'antwoord')]
    return {('nl', l[i].strip()) for l in lignes[entete + 1:] for i in cols if i < len(l) and l[i].strip()}


def textes_conjugaison() -> set[tuple[str, str]]:
    """Le chapitre Conjugaison (src/data/conjugaisons.json) : verbes, lecture des temps, questions."""
    chemin = Path(__file__).resolve().parent.parent / 'src' / 'data' / 'conjugaisons.json'
    res = set()
    for v in json.loads(chemin.read_text())['verbes']:
        res |= {('nl', v['inf']), ('fr', v['fr'])}
        res |= {('nl', t) for t in v['lecture'].values()}
        if v['rang'] <= 30:
            res.add(('nl', v['lecturePrimitifs']))
        res |= {('nl', q) for qs in v['questionsTexte'].values() for q in qs}
    return res


async def creer(langue: str, texte: str, fichier: Path, limite: asyncio.Semaphore) -> bool:
    async with limite:
        for essai in range(3):
            try:
                tmp = fichier.with_suffix('.tmp')
                await edge_tts.Communicate(texte_a_lire(texte), VOIX[langue], rate=VITESSE).save(str(tmp))
                tmp.rename(fichier)
                return True
            except Exception as e:  # coupure réseau, limite de débit…
                if essai == 2:
                    print(f'  échec : {texte!r} ({e})', file=sys.stderr)
                await asyncio.sleep(2 * (essai + 1))
    return False


async def main() -> int:
    url = f'https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=xlsx'
    with urllib.request.urlopen(url, timeout=60) as r:
        tous = textes(r.read()) | textes_conjugaison()
    DOSSIER.mkdir(parents=True, exist_ok=True)
    voulus = {empreinte(lg, t): (lg, t) for lg, t in tous}
    manquants = {h: v for h, v in voulus.items() if not (DOSSIER / f'{h}.mp3').exists()}
    print(f'{len(voulus)} textes, {len(manquants)} voix à créer')

    limite = asyncio.Semaphore(EN_PARALLELE)
    if not manquants and os.environ.get('GITHUB_EVENT_NAME', 'schedule') != 'schedule':
        # rien à créer : on vérifie quand même qu'edge-tts répond (sinon les prochains mots n'auraient pas de voix)
        with tempfile.TemporaryDirectory() as d:
            if not await creer('nl', 'de test', Path(d) / 'test.mp3', limite):
                print('edge-tts ne répond pas', file=sys.stderr)
                return 1
            print('edge-tts répond')

    await asyncio.gather(*(creer(lg, t, DOSSIER / f'{h}.mp3', limite) for h, (lg, t) in manquants.items()))

    inutiles = [f for f in DOSSIER.glob('*.mp3') if f.stem not in voulus]
    for f in inutiles:
        f.unlink()
    presents = sorted(f.stem for f in DOSSIER.glob('*.mp3'))
    index = {'voix': VOIX, 'vitesse': VITESSE, 'fichiers': presents}
    (DOSSIER / 'index.json').write_text(json.dumps(index, separators=(',', ':')) + '\n')
    rates = len(voulus) - len(presents)
    print(f'{len(presents)} voix prêtes, {len(inutiles)} supprimées' + (f', {rates} en échec' if rates else ''))
    # quelques échecs ne bloquent pas : ces mots seront lus par la voix du navigateur
    return 1 if rates > len(voulus) // 10 else 0


if __name__ == '__main__':
    sys.exit(asyncio.run(main()))
