/**
 * Ajoute les colonnes « Définition » et « Exemple » à chaque onglet (juste après
 * « Remarque »), puis y déplace les définitions et exemples relus ensemble.
 *
 * Mode d'emploi : dans le tableau, Extensions → Apps Script, coller ce fichier
 * à la place du contenu, cliquer sur ▶ Exécuter (fonction ajouterDefinitions),
 * accepter l'autorisation. Le journal affiche ce qui a été fait.
 *
 * Sans risque à relancer : les colonnes ne sont créées qu'une fois, et une ligne
 * n'est modifiée que si le mot néerlandais est toujours celui attendu et que la
 * remarque n'a pas déjà été déplacée.
 */
const MODIFS = {
 "HW Geschiedenis": [
  [
   4,
   "geschiedenis",
   "De studie van het verleden van de mens",
   "",
   ""
  ],
  [
   16,
   "verleden",
   "Alles wat mensen vroeger hebben gedaan, gedacht en meegemaakt, vóór vandaag",
   "",
   ""
  ],
  [
   19,
   "afkorting",
   "",
   "We gebruiken steeds een [afkorting] om te noteren of de datum VOOR of NA de geboorte van Jezus was",
   ""
  ],
  [
   22,
   "bijgeloof",
   "Het geloof dat iets geluk of pech brengt",
   "",
   ""
  ],
  [
   23,
   "Chinese kalender",
   "Een traditionele tijdrekening belangrijk voor het bepalen van Chinese feesten zoals het Chinese Nieuwjaar",
   "",
   ""
  ],
  [
   25,
   "decennium",
   "10 jaar",
   "",
   ""
  ],
  [
   27,
   "eeuw",
   "100 jaar",
   "",
   "Voor de jaartallen 1, 8, 20 en met 100 gebruiken we \"ste\" (zoals 8ste eeuw). Voor de andere jaartallen: \"de\""
  ],
  [
   28,
   "Egyptische kalender",
   "Een kalender gemaakt in Oude Egypte, die telt drie seizoenen (vier maanden van dertig dagen), dus 360 dagen en ook vijf toegevoegde dagen voor de geboortedagen van enkele goden",
   "",
   ""
  ],
  [
   29,
   "eigen tijd",
   "De tijd na de Tweede Wereldoorlog (vanaf 1945)",
   "",
   ""
  ],
  [
   35,
   "gebeurtenis",
   "Een historisch evenement dat op een specifiek moment in de geschiedenis gebeurt",
   "",
   ""
  ],
  [
   39,
   "hedendaagse tijd",
   "[de nieuwste tijd - de eigen tijd]",
   "",
   ""
  ],
  [
   40,
   "Hidjra",
   "De migratie van Mohammed en zijn volgelingen van Mekka naar Medina",
   "",
   ""
  ],
  [
   42,
   "islamitische jaartelling",
   "Begint in het jaar 622 na Christus met de Hidjra",
   "",
   ""
  ],
  [
   44,
   "Joodse kalender",
   "De Joodse kalender volgt vooral de maan en niet de zon. Dit jaar is korter, ongeveer 354 dagen",
   "",
   ""
  ],
  [
   45,
   "kalender",
   "Een systeem om dagen, maanden en jaren te tellen en ordenen",
   "",
   ""
  ],
  [
   47,
   "klassieke oudheid",
   "De tijd van Kelten, Grieken, Romeinen (753 v.C. tot 476)",
   "",
   ""
  ],
  [
   49,
   "middeleeuwen",
   "De tijd van kastelen en steden (476 tot 1492)",
   "",
   ""
  ],
  [
   50,
   "millenium",
   "1000 jaar",
   "",
   ""
  ],
  [
   51,
   "nieuwste tijd",
   "De tijd van de industrialisatie (1789 tot 1945)",
   "",
   ""
  ],
  [
   52,
   "onderzoeksvraag",
   "Een vraag waarop je het antwoord nog niet weet",
   "",
   ""
  ],
  [
   53,
   "ongeluksgetal",
   "",
   "Het bijgeloof rond het [ongeluksgetal] 13 zou zijn origine hebben in de Egyptische kalender",
   ""
  ],
  [
   58,
   "oude nabije oosten",
   "De eerste beschavingen (Egypte en Mesopotamië) (3500 v.C. tot 753 v.C.)",
   "",
   ""
  ],
  [
   59,
   "oudheid",
   "[het oude nabije oosten / de klassieke oudheid] (3500 v.C. tot 476)",
   "",
   ""
  ],
  [
   60,
   "periode",
   "Een langere tijd van meerdere jaren waarin bepaalde kenmerken of evoluties belangrijk zijn",
   "",
   ""
  ],
  [
   61,
   "prehistorie",
   "Het begin van de mensheid (2.500.000 v.C. tot 3500 v.C.)",
   "",
   ""
  ],
  [
   62,
   "Ramadan",
   "De periode waarin moslims tussen zonsopgang en zonsondergang vasten",
   "",
   ""
  ],
  [
   63,
   "Romeinse kalender",
   "Eerst met tien lange maanden gebaseerd op natuurfenomenen. Niets voor wintermaanden januari en februari omdat er dan weinig landbouw is",
   "",
   ""
  ],
  [
   66,
   "tijdlijn",
   "",
   "Om ons te kunnen oriënteren in de tijd, plaatsen we gebeurtenissen of periodes op een [tijdlijn]",
   ""
  ]
 ],
 "HW Aardrijkskunde": [
  [
   19,
   "afnemen",
   "",
   "Het bevolkingsaantal [neemt af]",
   "Synoniem: dalen"
  ],
  [
   20,
   "agglomeratie",
   "Een grote stad met de gemeenten errond",
   "",
   ""
  ],
  [
   27,
   "bevolkingsaantal",
   "Dit is hoeveel mensen er op een plaats wonen",
   "",
   ""
  ],
  [
   28,
   "bevolkingsdichtheid",
   "Het aantal inwoners per km²",
   "",
   ""
  ],
  [
   29,
   "bevolkingsgroei",
   "Dit gebeurt wanneer er meer mensen zijn dan vroeger. = De stijging van een bevolking over een bepaalde periode",
   "",
   ""
  ],
  [
   30,
   "bevolkingsspreiding",
   "Hoe de mensen verspreid zijn over de wereld",
   "",
   ""
  ],
  [
   32,
   "binnenlandse migratie",
   "Mensen verhuizen van een stad naar een andere binnen hetzelfde land",
   "",
   ""
  ],
  [
   36,
   "continentaal",
   "Schaal van een continent",
   "",
   ""
  ],
  [
   38,
   "depressie",
   "Een gebied dat lager ligt dan de omgeving",
   "",
   ""
  ],
  [
   39,
   "dichtbevolkt",
   "Regio's met veel inwoners op dezelfde plaats (hoge bevolkingsdichtheid)",
   "",
   ""
  ],
  [
   42,
   "dunbevolkt",
   "Regio's met weinig inwoners op dezelfde plaats (lage bevolkingsdichtheid)",
   "",
   ""
  ],
  [
   44,
   "emigrant",
   "De mensen die weggaan uit een land",
   "",
   "Pluraal: emigranten"
  ],
  [
   45,
   "emigratie",
   "Mensen verlaten een land",
   "",
   ""
  ],
  [
   46,
   "evenaar",
   "De breedtelijn van 0°",
   "",
   ""
  ],
  [
   51,
   "geboortecijfer",
   "Het aantal geboorten per 1000 mensen",
   "",
   ""
  ],
  [
   52,
   "gelijk blijven",
   "",
   "Het bevolkingsaantal [blijft gelijk]",
   ""
  ],
  [
   54,
   "gemiddeld",
   "",
   "de [gemiddelde] jaartemperatuur",
   ""
  ],
  [
   56,
   "groeien",
   "",
   "De bevolking [groeit]",
   ""
  ],
  [
   58,
   "gunstig",
   "Dit maakt het wonen (overleven) gemakkelijker",
   "",
   "Tegengestelde: ongunstig"
  ],
  [
   61,
   "historisch erfgoed",
   "Zorgt voor toerisme en geeft een stad of regio een unieke identiteit",
   "",
   ""
  ],
  [
   64,
   "hypothese",
   "Een mogelijke verklaring die je nog moet controleren",
   "",
   "Pluraal: hypothesen"
  ],
  [
   65,
   "immigrant",
   "De mensen die aankomen in een land",
   "",
   "Pluraal: immigranten"
  ],
  [
   66,
   "immigratie",
   "Mensen komen in een land wonen",
   "",
   ""
  ],
  [
   69,
   "inhoudstafel",
   "Vooraan in de atlas",
   "",
   ""
  ],
  [
   70,
   "internationale migratie",
   "Mensen verhuizen van een land naar een ander land",
   "",
   ""
  ],
  [
   72,
   "irrigatie",
   "Water naar de velden brengen",
   "",
   ""
  ],
  [
   75,
   "jong",
   "",
   "Afrika heeft een [jongere] bevolking",
   ""
  ],
  [
   80,
   "klimaat",
   "",
   "Een zacht [klimaat] maakt het wonen gemakkelijker; te koude of te droge klimaten maken het moeilijker",
   ""
  ],
  [
   82,
   "Kreeftskeerkring",
   "Keerkring op het noordelijk halfrond",
   "",
   ""
  ],
  [
   83,
   "kwalitatief",
   "Het gaat over de karakteristieken (kenmerken) van de verschillende landen",
   "",
   ""
  ],
  [
   84,
   "kwantitatief",
   "Het gaat over cijfermateriaal of statistische gegevens",
   "",
   ""
  ],
  [
   88,
   "legende",
   "Uitleg bij de kleuren en symbolen van een kaart",
   "",
   ""
  ],
  [
   89,
   "lijngrafiek",
   "Een grafiek met een lijn die toont hoe iets evolueert",
   "",
   ""
  ],
  [
   90,
   "lokalisatiefactor",
   "Geografische elementen die verklaren waarom mensen ergens wonen",
   "",
   "Pluraal: lokalisatiefactoren"
  ],
  [
   91,
   "menselijke lokalisatiefactor",
   "Menselijke elementen die een geografisch fenomeen kunnen verklaren. Vb. historisch erfgoed, politieke (in)stabiliteit, infrastructuur",
   "",
   ""
  ],
  [
   92,
   "migratie",
   "De verplaatsing van mensen van de ene naar de andere plaats om daar te blijven wonen",
   "",
   ""
  ],
  [
   93,
   "migratiesaldo",
   "Het verschil tussen het aantal immigranten en het aantal emigranten",
   "",
   ""
  ],
  [
   94,
   "miljard",
   "1 000 000 000",
   "",
   ""
  ],
  [
   96,
   "mondiaal",
   "Schaal van de hele wereld",
   "",
   ""
  ],
  [
   98,
   "nationaal",
   "Schaal van een land",
   "",
   ""
  ],
  [
   100,
   "natuurlijke aangroei",
   "Geboortecijfer minus sterftecijfer",
   "",
   ""
  ],
  [
   101,
   "natuurlijke bevolkingsaangroei",
   "Het verschil tussen het aantal geboorten (geboortecijfer) en het aantal sterften (sterftecijfer)",
   "",
   "Synoniem: natuurlijke aangroei"
  ],
  [
   102,
   "natuurlijke lokalisatiefactor",
   "Natuurlijke elementen die een geografisch fenomeen kunnen verklaren. Vb. het reliëf, rivieren, het klimaat",
   "",
   ""
  ],
  [
   107,
   "oase",
   "Een plaats met water en planten in de woestijn",
   "",
   ""
  ],
  [
   110,
   "onbevolkt",
   "Regio's waar niemand woont",
   "",
   "Synoniem: onbewoond"
  ],
  [
   112,
   "ongelijk verspreid",
   "",
   "De mensen zijn [ongelijk verspreid] over de aarde",
   ""
  ],
  [
   113,
   "ongunstig",
   "Dit maakt het wonen (overleven) moeilijker",
   "",
   "Tegengestelde: gunstig"
  ],
  [
   115,
   "oud",
   "",
   "In Europa is de bevolking gemiddeld [ouder]",
   "Ouder = plus âgé"
  ],
  [
   116,
   "overbevolking",
   "Dit betekent dat er te veel mensen op een plaats wonen",
   "",
   ""
  ],
  [
   118,
   "overtrekken",
   "",
   "[Overtrek] de keerkringen in het paars",
   ""
  ],
  [
   126,
   "register",
   "Alfabetische lijst achteraan in de atlas",
   "",
   ""
  ],
  [
   131,
   "som",
   "Het resultaat van een optelling (+)",
   "",
   ""
  ],
  [
   133,
   "stagneren",
   "Het blijft (bijna) gelijk",
   "",
   ""
  ],
  [
   134,
   "Steenbokskeerkring",
   "Keerkring op het zuidelijk halfrond",
   "",
   ""
  ],
  [
   136,
   "sterftecijfer",
   "Het aantal sterftes per 1000 mensen",
   "",
   ""
  ],
  [
   141,
   "toenemen",
   "",
   "Het bevolkingsaantal [neemt toe]",
   "Synoniem: stijgen"
  ],
  [
   143,
   "uitdaging",
   "",
   "[uitdagingen] in de landbouw",
   "Pluraal: uitdagingen"
  ],
  [
   144,
   "urbanisatie",
   "Steeds meer mensen wonen samen in steden",
   "",
   ""
  ],
  [
   150,
   "verschil",
   "Het resultaat van een aftrekking (−)",
   "",
   ""
  ],
  [
   154,
   "vruchtbaar",
   "",
   "[Vruchtbare] gronden zijn goed voor de landbouw",
   ""
  ],
  [
   156,
   "wereldbevolking",
   "Meer dan 8 miljard mensen (2022)",
   "",
   ""
  ],
  [
   161,
   "aanwezig",
   "",
   "De basiselementen (TOLES) moeten altijd [aanwezig] zijn",
   ""
  ],
  [
   162,
   "afkorting",
   "",
   "Gebruik geen [afkortingen] op de kaart",
   ""
  ],
  [
   163,
   "algemene legende",
   "Op de binnenkaft vooraan in de atlas. Daar vind je alle kaartsymbolen van de overzichtskaarten",
   "",
   ""
  ],
  [
   165,
   "arceren",
   "",
   "Kleuren of [arceren] in de legende",
   ""
  ],
  [
   166,
   "atlas",
   "Een verzameling kaarten over natuurkundige en menselijke informatie",
   "",
   ""
  ],
  [
   168,
   "bevolkingsdichtheid",
   "Het aantal inwoners per km²",
   "",
   ""
  ],
  [
   170,
   "bladwijzer",
   "",
   "Gebruik de [bladwijzer] als je weet waar een stad of land op aarde is",
   ""
  ],
  [
   172,
   "bosmassa",
   "De hoeveelheid bos, in ton/ha",
   "",
   ""
  ],
  [
   174,
   "bronvermelding",
   "Waar komt de informatie vandaan?",
   "",
   "Vb. Bron: Census 2011"
  ],
  [
   175,
   "categorie",
   "",
   "Alles binnen dezelfde [categorie] plaats je samen en heeft dezelfde kleur",
   ""
  ],
  [
   187,
   "geografisch",
   "",
   "[geografische] onderzoeksvragen",
   ""
  ],
  [
   195,
   "inhoudstafel",
   "",
   "Gebruik de [inhoudstafel] als je een themakaart of synthesekaart zoekt",
   ""
  ],
  [
   197,
   "kaart",
   "Een kaart dient om te tonen waar iets is op aarde",
   "",
   ""
  ],
  [
   198,
   "kaartsymbool",
   "De iconen, tekeningen, lijnen, ... die men gebruikt om de variabelen op een kaart voor te stellen",
   "",
   "Pluraal: kaartsymbolen"
  ],
  [
   202,
   "kwalitatief",
   "Kwalitatieve gegevens: kenmerken van een plaats zonder precieze cijfers (reliëf, woestijn, landschapstype, talen, ...)",
   "",
   ""
  ],
  [
   203,
   "kwantitatief",
   "Kwantitatieve gegevens: precieze cijfers over een thema (het aantal inwoners, bevolkingsgroei in %, ...)",
   "",
   ""
  ],
  [
   208,
   "legende",
   "",
   "Lees de [legende]: Hoeveel variabelen zijn er? Kwantitatief of kwalitatief? Welke eenheden? Ontcijfer de kaartsymbolen",
   ""
  ],
  [
   209,
   "lijn",
   "LIJNEN of lijnvormige figuren: een limiet of een relatie tussen twee plaatsen (grens, communicatieweg, verplaatsingen, ...)",
   "",
   ""
  ],
  [
   210,
   "lijnschaal",
   "Een lijn met de afstand, vb. 0 — 25 km",
   "",
   ""
  ],
  [
   214,
   "menselijk",
   "Menselijke informatie: economie, bevolking, ...",
   "",
   ""
  ],
  [
   215,
   "natuurkundig",
   "Natuurkundige informatie: gebergten, rivieren, ...",
   "",
   ""
  ],
  [
   216,
   "natuurkundige kaart",
   "Grote reliëfgebieden (gebergten, plateaus, ...), grote stromen, meren, zeeën en oceanen, ...",
   "",
   ""
  ],
  [
   218,
   "nomenclatuur",
   "De namen op de kaart (steden, rivieren, zeeën, ...)",
   "",
   ""
  ],
  [
   222,
   "ontcijferen",
   "",
   "[Ontcijfer] de kaartsymbolen",
   ""
  ],
  [
   224,
   "ordelijk",
   "",
   "Alle informatie op een kaart moet [ordelijk] en leesbaar zijn",
   ""
  ],
  [
   225,
   "oriëntatie",
   "Toont waar het noorden is (windroos of noordpijl)",
   "",
   ""
  ],
  [
   226,
   "overzichtskaart",
   "Bestaat in twee soorten: de natuurkundige en de staatkundige kaart",
   "",
   "Pluraal: overzichtskaarten"
  ],
  [
   228,
   "plattegrond",
   "Schematisch en eenvoudig (enkele landschapselementen)",
   "",
   ""
  ],
  [
   231,
   "rand",
   "",
   "Schrijf de namen binnen de [randen] van de kaart",
   ""
  ],
  [
   233,
   "register",
   "",
   "Gebruik het [register] als je niet weet waar een stad of land op aarde is",
   ""
  ],
  [
   235,
   "ruimte",
   "Waar ligt het?",
   "",
   "Synoniem: gebied. Vb. België"
  ],
  [
   236,
   "schaal",
   "Lijnschaal of breukschaal, meestal onderaan rechts",
   "",
   ""
  ],
  [
   238,
   "situeren",
   "",
   "Zet een punt om een stad te [situeren]",
   ""
  ],
  [
   239,
   "soort",
   "",
   "[soorten] bossen wereldwijd",
   "Pluraal: soorten"
  ],
  [
   240,
   "staatkundige kaart",
   "De landsgrenzen of de territoriale structuur van een land (provincies, ...), belangrijke steden, wegen, ...",
   "",
   ""
  ],
  [
   241,
   "stafkaart",
   "Heel gedetailleerd (alle landschapselementen), hoogtelijnen",
   "",
   "Synoniem: topografische kaart"
  ],
  [
   244,
   "synthesekaart",
   "Informatie over twee of meerdere natuurlijke of menselijke geografische elementen (= minstens 2 thema's)",
   "",
   ""
  ],
  [
   246,
   "terugvinden",
   "",
   "In de atlas [vind] je veel informatie [terug]",
   ""
  ],
  [
   247,
   "thema",
   "Waarover gaat de kaart?",
   "",
   "Pluraal: thema's. Vb. bevolkingsdichtheid"
  ],
  [
   249,
   "thematische kaart",
   "Informatie over één natuurlijk of menselijk geografisch element (= één thema)",
   "",
   "Synoniem: themakaart"
  ],
  [
   250,
   "tijd",
   "Over wanneer gaat de kaart?",
   "",
   ""
  ],
  [
   251,
   "titel",
   "",
   "Lees de [titel]: Wat is het thema? Waar ligt het gebied? Over wanneer gaat de kaart?",
   ""
  ],
  [
   252,
   "TOLES",
   "Titel – Oriëntatie – LEgende – Schaal",
   "",
   "Ze moeten altijd aanwezig zijn"
  ],
  [
   253,
   "ton per hectare",
   "Eenheid op de kaart over de bosmassa",
   "",
   "Afkorting: ton/ha"
  ],
  [
   257,
   "verklaring",
   "",
   "In de legende vind je een gedetailleerde [verklaring] voor elk kaartsymbool",
   ""
  ],
  [
   260,
   "vlak",
   "VLAKKEN: figuren die een oppervlakte weergeven (een land, een klimaat, een natuurreservaat, ...). In de legende altijd rechthoeken",
   "",
   ""
  ],
  [
   261,
   "voorstellen",
   "",
   "Hoe is de informatie op een kaart [voorgesteld]?",
   ""
  ]
 ],
 "NW Biologie": [
  [
   11,
   "autotroof",
   "Autotrofe organismen hebben geen andere levende wezens nodig om te leven",
   "Planten zijn [autotrofe] organismen",
   ""
  ],
  [
   20,
   "biocenose",
   "Alle levende organismen die in eenzelfde omgeving leven",
   "",
   ""
  ],
  [
   21,
   "biologie",
   "Biologie is de studie van het leven [bios (het leven) + logos (de studie)]",
   "",
   ""
  ],
  [
   22,
   "biotoop",
   "Een leefomgeving of plaats waar dieren en planten leven. Het bevat alles wat niet leeft, maar wel nodig is om te kunnen overleven",
   "",
   ""
  ],
  [
   28,
   "carnivoor",
   "Carnivoren zijn levende wezens die zich exclusief voeden met dieren",
   "",
   ""
  ],
  [
   29,
   "competitie",
   "Competitie is als twee levende wezens strijden om hetzelfde, bijvoorbeeld voedsel of ruimte",
   "",
   ""
  ],
  [
   32,
   "consument",
   "Herbivoren, carnivoren en omnivoren zijn dieren. We noemen de dieren de consumenten",
   "",
   ""
  ],
  [
   33,
   "dier",
   "",
   "Er bestaan meer dan 2 miljoen soorten [dieren]",
   ""
  ],
  [
   35,
   "dode materie",
   "Een object is dode materie als het minstens 1 van de karakteristieken van levende wezens niet heeft",
   "",
   ""
  ],
  [
   41,
   "ecosysteem",
   "Een plaats waar alles wat leeft en alles wat niet leeft met elkaar verbonden is. Biotoop + Biocenose.",
   "",
   ""
  ],
  [
   47,
   "geheel",
   "",
   "Biotoop en biocenose vormen samen één [geheel]: het ecosysteem",
   ""
  ],
  [
   49,
   "gewerveld",
   "Dieren met een ruggengraat [5 klassen: vissen, zoogdieren, amfibieën, vogels, reptielen]",
   "",
   ""
  ],
  [
   54,
   "groeien",
   "",
   "In de winter stoppen veel planten met [groeien]",
   ""
  ],
  [
   57,
   "herbivoor",
   "Herbivoren zijn levende wezens die zich exclusief voeden met planten",
   "",
   ""
  ],
  [
   59,
   "heterotroof",
   "Organismen die andere levende wezens nodig hebben om zich te voeden",
   "",
   ""
  ],
  [
   85,
   "levende wezens",
   "6 karakteristieken: ademen, zich voeden, zich voortplanten, geboren worden, groeien, sterven",
   "",
   ""
  ],
  [
   99,
   "omnivoor",
   "Omnivoren zijn levende wezens die zich kunnen voeden met dieren en planten",
   "",
   ""
  ],
  [
   100,
   "ongewerveld",
   "Dieren zonder ruggengraat",
   "",
   ""
  ],
  [
   110,
   "parasitisme",
   "Parasitisme is als een organisme (de parasiet) leeft ten koste van een ander (de gastheer), zonder het meteen te doden (zoals een teek op een hond)",
   "",
   ""
  ],
  [
   114,
   "plant",
   "Planten gebruiken water, mineralen, zonlicht en koolstofdioxide om te leven en te groeien. Planten zijn producenten.",
   "",
   ""
  ],
  [
   119,
   "predatie",
   "Predatie is als een dier een ander dier eet (zoals een vos die een konijn vangt)",
   "",
   ""
  ],
  [
   120,
   "producent",
   "Producenten zijn levende wezens die zich voeden met dode materie (zonlicht, water, mineralen, koolstofdioxide)",
   "",
   ""
  ],
  [
   122,
   "reducent",
   "Levende wezens die dood organisch materiaal composteren. Reducenten zijn heterotrofe organismen",
   "",
   ""
  ],
  [
   129,
   "samenwerking",
   "Samenwerking gebeurt als 2 soorten elkaar helpen (zoals bijen en bloemen)",
   "",
   ""
  ],
  [
   137,
   "biodiversiteit",
   "Biodiversiteit betekent dat er veel verschillende soorten planten en dieren aanwezig zijn",
   "",
   ""
  ],
  [
   161,
   "voedselketen",
   "Een voedselketen start altijd met een producent (een plant). In een voedselketen worden 2 schakels door een pijl verbonden",
   "",
   ""
  ],
  [
   163,
   "voedselweb",
   "Een voedselweb is een netwerk van verschillende levende wezens. Elk levend wezen is een schakel in het voedselweb",
   "",
   ""
  ],
  [
   164,
   "voedselpiramide",
   "Een ruimtelijke voorstelling van een voedselweb. De producenten vormen de basis, de andere lagen worden gevormd door de consumenten",
   "",
   ""
  ],
  [
   166,
   "biologisch evenwicht",
   "Wanneer de hoeveelheid levende wezens stabiel blijft over de jaren",
   "",
   ""
  ],
  [
   177,
   "wetenschappelijk model",
   "Een wetenschappelijk model is een vereenvoudigde voorstelling van de werkelijkheid",
   "",
   ""
  ]
 ]
};

// Fautes d'orthographe dans la colonne « Néerlandais » : [ligne, avant, après]
const MOTS_CORRIGES = {
 "HW Geschiedenis": [[50, "millenium", "millennium"]]
};

function ajouterDefinitions() {
  const classeur = SpreadsheetApp.getActiveSpreadsheet();
  for (const feuille of classeur.getSheets()) {
    const entetes = feuille.getRange(1, 1, 1, feuille.getLastColumn()).getValues()[0].map(String);
    let colRem = entetes.findIndex(t => /^remarques?$/i.test(t.trim())) + 1;
    if (!colRem) { Logger.log(feuille.getName() + ' : pas de colonne « Remarque », onglet ignoré.'); continue; }
    let colDef = entetes.findIndex(t => /^d[ée]finition$/i.test(t.trim())) + 1;
    let colEx = entetes.findIndex(t => /^exemple$/i.test(t.trim())) + 1;
    if (!colDef) {
      feuille.insertColumnAfter(colRem);
      feuille.getRange(1, colRem + 1).setValue('Définition');
      colDef = colRem + 1;
      if (colEx > colRem) colEx++;
    }
    if (!colEx) {
      feuille.insertColumnAfter(colDef);
      feuille.getRange(1, colDef + 1).setValue('Exemple');
      colEx = colDef + 1;
    }
    // mêmes largeur et style d'en-tête que « Remarque »
    feuille.getRange(1, colRem).copyFormatToRange(feuille, colDef, colEx, 1, 1);
    feuille.setColumnWidth(colDef, Math.max(220, feuille.getColumnWidth(colRem)));
    feuille.setColumnWidth(colEx, Math.max(220, feuille.getColumnWidth(colRem)));

    let faites = 0, sautees = [];
    for (const [ligne, mot, def, ex, rem] of (MODIFS[feuille.getName()] || [])) {
      const nl = String(feuille.getRange(ligne, 1).getValue()).trim();
      const dejaFait = feuille.getRange(ligne, colDef).getValue() !== '' || feuille.getRange(ligne, colEx).getValue() !== '';
      if (nl !== mot) { sautees.push(ligne + ' (' + mot + ' attendu, « ' + nl + ' » trouvé)'); continue; }
      if (dejaFait) continue;
      feuille.getRange(ligne, colDef).setValue(def);
      feuille.getRange(ligne, colEx).setValue(ex);
      feuille.getRange(ligne, colRem).setValue(rem);
      faites++;
    }
    for (const [ligne, avant, apres] of (MOTS_CORRIGES[feuille.getName()] || [])) {
      const cellule = feuille.getRange(ligne, 1);
      if (String(cellule.getValue()).trim() === avant) {
        cellule.setValue(apres);
        Logger.log(feuille.getName() + ' : « ' + avant + ' » corrigé en « ' + apres + ' ».');
      }
    }
    Logger.log(feuille.getName() + ' : ' + faites + ' ligne(s) modifiée(s).' + (sautees.length ? ' Lignes sautées car le tableau a changé : ' + sautees.join(', ') : ''));
  }
}
