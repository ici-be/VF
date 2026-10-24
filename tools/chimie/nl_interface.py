#!/usr/bin/env python3
"""Add the Dutch (nl, Belgium) interface text to this book's engine copy (lib/engine.js, lib/contents.js).
The engine has no Dutch block; rerun this after every `engine.py` sync (it is idempotent)."""
import pathlib, sys

LIB = pathlib.Path(__file__).resolve().parents[2] / 'site' / 'chimie' / 'lib'

ENGINE_NL = r"""  nl: {
    decimalSign: ',', stageLabel: 'Animatie van de les', stageLabelTitled: 'Animatie van de les: {title}',
    shortcuts: 'Sneltoetsen', lesson: 'Les', questions: 'Vragen',
    helpPlay: 'Afspelen of pauzeren', helpStep: 'Vorige of volgende stap', helpStepInQuestion: 'Van stap veranderen tijdens een vraag', helpRestart: 'Opnieuw beginnen',
    helpCaptions: 'Ondertitels aan of uit', helpSpeed: 'Trager of sneller', helpFullScreen: 'Volledig scherm', helpList: 'Deze lijst tonen',
    helpChoose: 'Een antwoord of een ring kiezen', helpTrueFalse: 'Waar of niet waar', helpRows: 'Tussen de rijen bewegen',
    helpNumberLine: 'Over de getallenas bewegen, of een getal kiezen om te sorteren', helpEnter: 'Controleren, en dan verdergaan',
    helpShowAnswer: 'Het antwoord tonen', helpLeaveBox: 'Een antwoordvak verlaten', helpClose: 'Druk op {key} om te sluiten.',
    paused: 'Gepauzeerd. Druk op de spatiebalk of klik om verder te gaan.',
    soundFailed: 'Het geluid kon niet worden afgespeeld. De les gaat verder met de tekst op het scherm.',
    startLesson: 'Les starten', startFilm: 'Afspelen', aboutMinutesFilm: 'Ongeveer {n} minuten, met geluid.', coverKeys: 'Druk op {space} om te starten, op {help} voor de sneltoetsen.', spaceKey: 'spatiebalk',
    chapterNumber: 'Hoofdstuk {n}', aboutMinutes: 'Ongeveer {n} minuten, met geluid en korte controlevragen.',
    allChapters: 'Alle hoofdstukken', playLabel: 'Afspelen of pauzeren (spatiebalk)', backLabel: 'Vorige stap (pijl links)', restartLabel: 'De les opnieuw starten',
    checksInLesson: 'De controlevragen en oefeningen staan in de interactieve les.',
    volumeLabel: 'Volume aanpassen', volumeTitle: 'Volume (0 = gedempt)', volumeSlider: 'Volume',
    helpLabel: 'Sneltoetsen (?)', speedLabel: 'Afspeelsnelheid (< en >)', captionsLabel: 'Ondertitels (C)', fullScreenLabel: 'Volledig scherm', goToStep: 'Naar stap {n}: {title}',
    quickCheck: 'Even controleren', countOf: '{k} van {n}', check: 'Controleren', showAnswer: 'Antwoord tonen', nextQuestion: 'Volgende vraag', continue: 'Verdergaan',
    correct: 'Juist. ', notQuite: 'Nog niet helemaal. ', answerPrefix: 'Antwoord: ', keysPrefix: 'Toetsen: ',
    hintMove: ' bewegen, ', hintChoose: ' kiezen', hintChooseOrClickGrid: ' kiezen, of klik op het rooster', hintMoveAlongLine: ' langs de as bewegen, ',
    hintChooseOrClick: ' kiezen, of klik', hintRow: ' rij, ', hintTypeFraction: 'typ getallen zoals 3/4 of −2 1/4, ', hintTypeNumber: 'typ het getal, ',
    hintTypeDecimal: 'typ het getal, ', hintNextBox: ' volgend vak, ', hintCheck: ' controleren, ', hintLeaveBox: ' het vak verlaten',
    hintPickNumber: ' een getal kiezen, ', hintPickRing: ' de ring kiezen',
    rowsRight: '{r} van de {n} juist. Verbeter de rijen met ✗ en controleer opnieuw.',
    choicesShown: 'de juiste keuzes zijn nu geselecteerd.', numbersShown: 'de juiste getallen zijn ingevuld.',
    notPlacedYet: '{x} is nog niet geplaatst.',
    realRingIsEmpty: '{x}: elk reëel getal is rationaal of irrationaal, dus deze ruimte heeft geen eigen getallen.',
    ringsRight: '{r} van de {n} in de juiste ring.', ringsShown: 'elk getal staat nu in zijn kleinste ring.',
    chipPlaced: '{x}, geplaatst in {ring}', chipNotPlaced: '{x}, niet geplaatst', pointLabel: 'Het punt {v}', answerBox: 'Antwoord',
    stepsLeftOfZero: '{n} stappen links van 0',
    natural: 'Natuurlijke', whole: 'Hele', integers: 'Gehele', rational: 'Rationale', irrational: 'Irrationale', real: 'Reële', integerColumn: 'Geheel',
    trueLabel: 'Waar', falseLabel: 'Niet waar',
    chapterComplete: 'Hoofdstuk {n} afgewerkt', quickChecks: 'Controlevragen', chapterPractice: 'Oefeningen bij het hoofdstuk', sources: 'Bronnen in dit hoofdstuk', opensSource: '{label}, opent de bron in een nieuw tabblad',
    firstTryScore: '{name}: {r} van de {t} juist bij de eerste poging.', notAttempted: '{name}: niet geprobeerd.',
    watchAgain: 'Opnieuw bekijken', nextChapter: 'Volgend hoofdstuk',
  },
"""
CONTENTS_NL = r"""    nl: {
      open: 'Het boek openen', toCover: 'Terug naar de voorkant', resume: 'Verdergaan · Hoofdstuk {n}', unit: 'Deel {n}', minutes: '{n} min',
      meta: '{chapters}{samples} · {units} · met geluid', metaChapters: { one: '{n} hoofdstuk', other: '{n} hoofdstukken' },
      metaUnits: { one: '{n} deel', other: '{n} delen' }, metaSamples: { one: ' + {n} voorbeeld', other: ' + {n} voorbeelden' }, samples: 'Voorbeeldhoofdstukken, een andere stijl',
      chapterCount: { one: '{n} hoofdstuk', other: '{n} hoofdstukken' }, finished: '{done} van {n} afgewerkt',
      doneMark: '✓ Afgewerkt · ', lastMark: ' · Laatst geopend',
      references: 'Bronnen', viewAll: 'Alles bekijken →', backToContents: '← Inhoud',
      refsLead: 'Alle werken die in de lessen worden aangehaald.',
      refsCount: { one: '{n} werk aangehaald in de lessen', other: '{n} werken aangehaald in de lessen' },
      refsAllLinked: ', elk met een link naar de bron', refsSomeLinked: ', {n} met een link naar de bron',
    },
"""

def patch(name, block, anchor):
    p = LIB / name
    s = p.read_text()
    if block.split('\n', 1)[0] in s:
        print(name, 'already has nl'); return
    i = s.index(anchor)
    p.write_text(s[:i] + block + s[i:])
    print(name, 'patched')

patch('engine.js', ENGINE_NL, '  ru: {')
patch('contents.js', CONTENTS_NL, '    ru: {')
