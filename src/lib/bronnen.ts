// Bronnen (HW Geschiedenis, chapitre 2 « Ad fontes! », p. 39-53) : à chaque question, une source à classer comme dans
// le cours, puis la justification à choisir (« Leg uit! ») :
// - geschreven of ongeschreven ; publiek of privé ; officieel of niet-officieel (p. 40-41) ;
// - de vijf ongeschreven bronnen : archeologisch, beeldbron, iconografisch, audiovisueel, mondelinge getuigenis (p. 42-44) ;
// - « Wat voor bron? Wees volledig! » (p. 45-47) ;
// - primair, secundair of historisch werk (p. 50-53), avec les sources du cours et des sources aux dates toujours nouvelles.
import type { Tweetalig } from './woordvolgorde'

type Hasard = () => number
const un = <T,>(t: readonly T[], h: Hasard): T => t[Math.floor(h() * t.length)]
const entre = (a: number, b: number, h: Hasard) => a + Math.floor(h() * (b - a + 1))
function melange<T>(t: T[], h: Hasard): T[] {
  const r = [...t]
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(h() * (i + 1)); [r[i], r[j]] = [r[j], r[i]] }
  return r
}
const tw = (nl: string, fr: string): Tweetalig => ({ nl, fr })

// ============================================================ les sortes de sources
type Ongeschreven = 'archeologisch' | 'beeld' | 'iconografisch' | 'audiovisueel' | 'mondeling'
export type Soort = 'geschreven' | Ongeschreven
const ONGESCHREVEN: Ongeschreven[] = ['archeologisch', 'beeld', 'iconografisch', 'audiovisueel', 'mondeling']

const NAAM: Record<Soort, string> = {
  geschreven: 'Geschreven bron', archeologisch: 'Archeologische bron', beeld: 'Beeldbron',
  iconografisch: 'Iconografische bron', audiovisueel: 'Audiovisuele bron', mondeling: 'Mondelinge getuigenis',
}
/** les définitions du cours */
const DEF: Record<Soort | 'ongeschreven' | 'publiek' | 'prive' | 'officieel' | 'niet', Tweetalig> = {
  geschreven: tw('Geschreven bronnen zijn teksten met letters en/of cijfers, maar ook symbolen of tekens, op steen, papier, perkament…',
    'Les sources écrites sont des textes avec des lettres et/ou des chiffres, mais aussi des symboles ou des signes, sur pierre, papier, parchemin…'),
  ongeschreven: tw('Ongeschreven bronnen zijn gebouwen, voorwerpen of objecten uit het verleden, of bronnen om naar te kijken of te luisteren (foto’s, muziek, films).',
    'Les sources non écrites sont des bâtiments, des objets du passé, ou des sources à regarder ou à écouter (photos, musique, films).'),
  archeologisch: tw('Archeologische bronnen zijn overblijfselen of resten van oude culturen: gebouwen, maar ook gebruiksvoorwerpen.',
    'Les sources archéologiques sont des vestiges ou des restes de cultures anciennes : des bâtiments, mais aussi des objets de tous les jours.'),
  beeld: tw('Beeldbronnen stellen informatie over het verleden op een visuele manier voor, zoals een grafiek of een schema.',
    'Les beeldbronnen présentent des informations sur le passé de manière visuelle, comme un graphique ou un schéma.'),
  iconografisch: tw('Iconografische bronnen zijn een speciale soort beeldbronnen die een verhaal willen vertellen: vaak artistieke voorwerpen zoals schilderijen, standbeelden of foto’s.',
    'Les sources iconographiques sont une sorte spéciale de beeldbronnen qui veulent raconter une histoire : souvent des objets artistiques comme des peintures, des statues ou des photos.'),
  audiovisueel: tw('Een audiovisuele bron gebruikt beeld en/of geluid om informatie over te brengen: een film, een documentaire, een podcast, een toneelstuk, muziek.',
    'Une source audiovisuelle utilise l’image et/ou le son pour transmettre des informations : un film, un documentaire, un podcast, une pièce de théâtre, de la musique.'),
  mondeling: tw('Een mondelinge getuigenis is een verhaal dat mondeling verteld wordt door een ooggetuige: iemand die de gebeurtenis gezien of meegemaakt heeft.',
    'Un témoignage oral est un récit raconté de vive voix par un témoin oculaire : quelqu’un qui a vu ou vécu l’événement.'),
  publiek: tw('Publiek: iedereen mag het document lezen.', 'Publique : tout le monde peut lire le document.'),
  prive: tw('Privé: het document is geschreven voor een privépubliek (één persoon of een klein groepje).',
    'Privée : le document est écrit pour un public privé (une personne ou un petit groupe).'),
  officieel: tw('Officieel: de koning, de staat, de keizer of een officiële instelling heeft de bron gemaakt.',
    'Officielle : le roi, l’État, l’empereur ou une institution officielle a fait la source.'),
  niet: tw('Niet-officieel: een gewone persoon heeft de bron gemaakt, niet de koning, de staat of een officiële instelling.',
    'Non officielle : une personne ordinaire a fait la source, pas le roi, l’État ou une institution officielle.'),
}
/** les justifications (« Leg uit! ») */
const WANT: Record<Soort | 'ongeschreven' | 'publiek' | 'prive' | 'officieel' | 'niet', string> = {
  geschreven: 'Want het is een tekst met letters, cijfers, symbolen of tekens.',
  ongeschreven: 'Want het is geen tekst: het is een gebouw, een voorwerp, een beeld of een geluid.',
  archeologisch: 'Want het is een overblijfsel van een oude cultuur: een gebouw of een gebruiksvoorwerp.',
  beeld: 'Want het toont informatie op een visuele manier: een grafiek, een schema, een kaart.',
  iconografisch: 'Want het is een kunstwerk dat een verhaal vertelt: een schilderij, een standbeeld, een foto.',
  audiovisueel: 'Want het gebruikt beeld en/of geluid om informatie over te brengen.',
  mondeling: 'Want een ooggetuige vertelt mondeling wat hij gezien of meegemaakt heeft.',
  publiek: 'Want iedereen mag de bron lezen.',
  prive: 'Want de bron is geschreven voor één persoon of een klein publiek.',
  officieel: 'Want de koning, de staat, de keizer of een officiële instelling heeft de bron gemaakt.',
  niet: 'Want een gewone persoon heeft de bron gemaakt, niet de koning of de staat.',
}
/** les fausses bonnes raisons : vraies parfois, mais pas ce qui décide */
const OUD = 'Want de bron is heel oud.'
const MUSEUM = 'Want de bron ligt vandaag in een museum.'
const STEEN = 'Want de bron is op steen geschreven.'

// ============================================================ les sources
/** une époque : ce dont parle la source, pour dire « tijdens … » ou « na … » */
interface Tijdperk { tijdens: Tweetalig; na: Tweetalig }
interface Tijd { soort: 'primair' | 'secundair' | 'historisch'; wanneer: Tweetalig; over: Tijdperk }
export interface Bron {
  nl: string
  fr: string
  soort: Soort
  /** une autre sorte qu'on accepte aussi (une pièce de monnaie : archéologique et iconographique) */
  ook?: Ongeschreven
  publiek?: boolean
  officieel?: boolean
  tijd?: Tijd
  /** la page du livre */
  p?: number
  /** ce qu'en dit le cours, ou ce qui décide */
  noot?: Tweetalig
}
const tp = (tijdensNl: string, tijdensFr: string, naNl = tijdensNl, naFr = tijdensFr): Tijdperk =>
  ({ tijdens: tw(tijdensNl, tijdensFr), na: tw(naNl, naFr) })
const ATTILA = tp('het leven van Attila de Hun (ca. 400–453)', 'la vie d’Attila le Hun (vers 400-453)', 'de dood van Attila de Hun (453)', 'la mort d’Attila le Hun (453)')

const G = (nl: string, fr: string, publiek: boolean | undefined, officieel: boolean | undefined, x: Partial<Bron> = {}): Bron =>
  ({ nl, fr, soort: 'geschreven', publiek, officieel, ...x })
const O = (soort: Ongeschreven, nl: string, fr: string, x: Partial<Bron> = {}): Bron => ({ nl, fr, soort, ...x })

export const BRONNEN: Bron[] = [
  // ---------------------------------------------- geschreven bronnen (p. 40-41, 46-47)
  G('Het decreet van Canopus: een wet uit het oude Egypte, in de 3de eeuw v.C. gepubliceerd door koning Ptolemaeus III Euergetes I.',
    'Le décret de Canope : une loi de l’Égypte ancienne, publiée au 3e siècle av. J.-C. par le roi Ptolémée III Évergète Ier.', true, true, { p: 40 }),
  G('Een Egyptisch huwelijkscontract uit de 1ste eeuw.', 'Un contrat de mariage égyptien du 1er siècle.', false, true, { p: 41,
    noot: tw('Het contract is alleen voor het koppel (privé), maar het is opgesteld door een officiële instelling (officieel).',
      'Le contrat ne concerne que le couple (privé), mais il est rédigé par une institution officielle (officiel).') }),
  G('Een Romeinse brief uit de 1ste eeuw, geschreven op hout.', 'Une lettre romaine du 1er siècle, écrite sur du bois.', false, false, { p: 41 }),
  G('Tekst op een graftombe van een vrijgelaten slavin uit het Romeinse Rijk (ca. 80 v.C.).',
    'Un texte sur le tombeau d’une esclave affranchie de l’Empire romain (vers 80 av. J.-C.).', true, false, { p: 41,
      noot: tw('Iedereen die voorbijkomt, kan de tekst lezen (publiek); de familie liet hem maken, niet de staat (niet-officieel).',
        'Tous les passants peuvent lire le texte (public) ; c’est la famille qui l’a fait faire, pas l’État (non officiel).') }),
  G('De Acta Diurna: kranten die in het Romeinse Rijk door de overheid op stenen werden gepubliceerd.',
    'Les Acta Diurna : des journaux que les autorités de l’Empire romain publiaient sur des pierres.', true, true, { p: 47 }),
  G('Een brief van een Romeinse soldaat aan zijn vader, uit de 2de eeuw.', 'Une lettre d’un soldat romain à son père, du 2e siècle.', false, false, { p: 47 }),
  G('Het boek “Goden van Egypte”, op zoek naar de wetten van de kosmos, in een boekhandel van vandaag.',
    'Le livre « Goden van Egypte » (Les dieux d’Égypte), dans une librairie d’aujourd’hui.', true, false, { p: 47 }),
  G('De Steen van Rosetta (196 v.C.): een besluit van de Egyptische priesters ter ere van koning Ptolemaeus V, in een tempel opgesteld zodat iedereen het kon lezen.',
    'La pierre de Rosette (196 av. J.-C.) : un décret des prêtres égyptiens en l’honneur du roi Ptolémée V, placé dans un temple pour que tout le monde puisse le lire.', true, true),
  G('De wetten van koning Hammurabi van Babylon (ca. 1750 v.C.), gebeiteld op een grote stenen zuil die iedereen kon zien.',
    'Les lois du roi Hammurabi de Babylone (vers 1750 av. J.-C.), gravées sur une grande colonne de pierre que tout le monde pouvait voir.', true, true),
  G('Een verkiezingsaffiche die een inwoner van Pompeï in de 1ste eeuw op een muur van zijn huis schilderde.',
    'Une affiche électorale qu’un habitant de Pompéi a peinte au 1er siècle sur le mur de sa maison.', true, false),
  G('Een uitnodiging voor een verjaardagsfeest die Claudia Severa rond 100 op een houten plankje schreef voor haar vriendin Sulpicia.',
    'Une invitation à une fête d’anniversaire que Claudia Severa a écrite vers 100 sur une tablette de bois pour son amie Sulpicia.', false, false),
  G('Een Romeinse mijlpaal langs de weg, met de naam van de keizer die de weg liet aanleggen.',
    'Une borne milliaire romaine au bord de la route, avec le nom de l’empereur qui a fait construire la route.', true, true),
  G('Het edict van keizer Diocletianus (301) met de hoogste prijzen voor alle producten, op stenen platen op de markt.',
    'L’édit de l’empereur Dioclétien (301) avec les prix maximum de tous les produits, sur des plaques de pierre au marché.', true, true),
  G('De schrijfoefeningen van een Egyptische leerling op een scherf aardewerk.', 'Les exercices d’écriture d’un élève égyptien sur un morceau de poterie.', false, false),
  G('Een boodschappenlijstje van een Romeinse vrouw op een wastafeltje.', 'Une liste de courses d’une Romaine sur une tablette de cire.', false, false),
  G('Een brief van keizer Trajanus aan Plinius, de gouverneur van een provincie, met bevelen voor zijn werk.',
    'Une lettre de l’empereur Trajan à Pline, le gouverneur d’une province, avec des ordres pour son travail.', false, true, {
      noot: tw('De keizer schrijft hem (officieel), maar alleen voor Plinius (privé).', 'C’est l’empereur qui l’écrit (officiel), mais seulement pour Pline (privé).') }),
  G('Een Romeins militair diploma: een bronzen plaatje waarmee de keizer een oud-soldaat het burgerrecht geeft.',
    'Un diplôme militaire romain : une plaque de bronze par laquelle l’empereur donne la citoyenneté à un ancien soldat.', false, true, {
      noot: tw('De keizer geeft het (officieel), aan één oud-soldaat (privé).', 'C’est l’empereur qui le donne (officiel), à un seul ancien soldat (privé).') }),
  G('Een graffito op een muur in Pompeï: “Gaius was hier”.', 'Un graffiti sur un mur de Pompéi : « Gaius était ici ».', true, false),
  G('De brieven die Cicero, een belangrijke Romeinse politicus, in 49 v.C. aan zijn vriend Atticus schreef over de burgeroorlog tussen Pompeius en Caesar.',
    'Les lettres que Cicéron, un homme politique romain important, a écrites en 49 av. J.-C. à son ami Atticus sur la guerre civile entre Pompée et César.', false, false, { p: 50,
      tijd: { soort: 'primair', wanneer: tw('in 49 v.C.', 'en 49 av. J.-C.'),
        over: tp('de burgeroorlog tussen Pompeius en Caesar (49–45 v.C.)', 'la guerre civile entre Pompée et César (49-45 av. J.-C.)') } }),
  G('Een officieel document uit 33 v.C. waarin Cleopatra, de farao van Egypte, beslist dat een Romeinse man geen belastingen moet betalen op wijn en graan.',
    'Un document officiel de 33 av. J.-C. dans lequel Cléopâtre, la pharaonne d’Égypte, décide qu’un Romain ne doit pas payer d’impôts sur le vin et le grain.', undefined, true, { p: 52,
      tijd: { soort: 'primair', wanneer: tw('in 33 v.C.', 'en 33 av. J.-C.'),
        over: tp('het leven van Cleopatra (69–30 v.C.)', 'la vie de Cléopâtre (69-30 av. J.-C.)', 'de dood van Cleopatra (30 v.C.)', 'la mort de Cléopâtre (30 av. J.-C.)') } }),
  G('De Ilias: Homerus schreef dit boek rond 800 v.C. over de Trojaanse Oorlog (12de of 13de eeuw v.C.).',
    'L’Iliade : Homère a écrit ce livre vers 800 av. J.-C. sur la guerre de Troie (12e ou 13e siècle av. J.-C.).', undefined, undefined, { p: 50,
      tijd: { soort: 'secundair', wanneer: tw('rond 800 v.C.', 'vers 800 av. J.-C.'),
        over: tp('de Trojaanse Oorlog (12de of 13de eeuw v.C.)', 'la guerre de Troie (12e ou 13e siècle av. J.-C.)') },
      noot: tw('De Ilias is heel oud, maar Homerus schreef ze vele eeuwen na de oorlog.', 'L’Iliade est très ancienne, mais Homère l’a écrite des siècles après la guerre.') }),
  G('Rubicon: de Engelse historicus Tom Holland schreef dit boek in 2003 over de Romeinse Republiek, na een analyse van primaire en secundaire bronnen.',
    'Rubicon : l’historien anglais Tom Holland a écrit ce livre en 2003 sur la République romaine, après avoir analysé des sources primaires et secondaires.', true, false, { p: 50,
      tijd: { soort: 'historisch', wanneer: tw('in 2003', 'en 2003'), over: tp('de Romeinse Republiek', 'la République romaine') } }),
  G('“De Hunnen. Het volk van Attila, de gesel Gods”: een boek van historicus Hermann Schreiber, gepubliceerd in 1976.',
    '« Les Huns. Le peuple d’Attila, le fléau de Dieu » : un livre de l’historien Hermann Schreiber, publié en 1976.', true, false, { p: 51,
      tijd: { soort: 'historisch', wanneer: tw('in 1976', 'en 1976'), over: ATTILA } }),
  G('In 2019 schreef C.P. een meesterproef aan de Universiteit van Leuven over de Romeinen in de Lage Landen in de 2de eeuw. Hij deed een jaar lang onderzoek in primaire en secundaire bronnen.',
    'En 2019, C.P. a écrit un mémoire à l’Université de Louvain sur les Romains dans les Pays-Bas au 2e siècle. Il a fait des recherches pendant un an dans des sources primaires et secondaires.', undefined, undefined, { p: 53,
      tijd: { soort: 'historisch', wanneer: tw('in 2019', 'en 2019'), over: tp('de Romeinen in de Lage Landen (2de eeuw)', 'les Romains dans les Pays-Bas (2e siècle)') } }),
  G('“Verborgen levens, publieke figuren. Romeinse vrouwen buiten Rome”: een boek van Emily Hemelrijk, uitgegeven in Amsterdam in 2021.',
    '« Vies cachées, figures publiques. Les femmes romaines hors de Rome » : un livre d’Emily Hemelrijk, publié à Amsterdam en 2021.', true, false, { p: 49,
      tijd: { soort: 'historisch', wanneer: tw('in 2021', 'en 2021'), over: tp('de Romeinse vrouwen', 'les femmes romaines') } }),
  G('De Gallische Oorlog: het verslag dat Julius Caesar tussen 58 en 50 v.C. schreef over zijn eigen oorlog in Gallië.',
    'La Guerre des Gaules : le récit que Jules César a écrit entre 58 et 50 av. J.-C. sur sa propre guerre en Gaule.', undefined, undefined, {
      tijd: { soort: 'primair', wanneer: tw('tussen 58 en 50 v.C.', 'entre 58 et 50 av. J.-C.'), over: tp('de oorlog in Gallië (58–50 v.C.)', 'la guerre en Gaule (58-50 av. J.-C.)') } }),

  // ---------------------------------------------- archeologische bronnen (p. 42, 46-47, 49, 51, 53)
  O('archeologisch', 'De ruïne van het paleis van Knossos (Kreta).', 'Les ruines du palais de Cnossos (Crète).', { p: 46 }),
  O('archeologisch', 'De piramiden van Gizeh, gebouwd tussen ca. 2551 en 2472 v.C. in opdracht van de koningen van de Vierde Dynastie.',
    'Les pyramides de Gizeh, construites entre 2551 et 2472 av. J.-C. environ sur ordre des rois de la quatrième dynastie.', { p: 49 }),
  O('archeologisch', 'Een Griekse tempel met zuilen, uit de 5de eeuw v.C.', 'Un temple grec à colonnes, du 5e siècle av. J.-C.', { p: 42 }),
  O('archeologisch', 'Amforen: grote kruiken waarin de Romeinen wijn en olijfolie vervoerden.', 'Des amphores : de grandes cruches dans lesquelles les Romains transportaient le vin et l’huile d’olive.', { p: 42 }),
  O('archeologisch', 'De mummie van een poes, uit de 1ste eeuw n.C.', 'La momie d’un chat, du 1er siècle apr. J.-C.', { p: 47,
    noot: tw('Een overblijfsel van de Egyptische cultuur: de Egyptenaren mummificeerden ook dieren.', 'Un vestige de la culture égyptienne : les Égyptiens momifiaient aussi les animaux.') }),
  O('archeologisch', 'Een Romeinse olielamp uit klei.', 'Une lampe à huile romaine en terre cuite.'),
  O('archeologisch', 'De resten van een Romeinse villa, opgegraven in een veld in België.', 'Les restes d’une villa romaine, découverts dans un champ en Belgique.'),
  O('archeologisch', 'Het Colosseum in Rome.', 'Le Colisée à Rome.'),
  O('archeologisch', 'Een bronzen helm van een Griekse soldaat.', 'Un casque de bronze d’un soldat grec.'),
  O('archeologisch', 'Een kam uit been, gevonden in een Romeins legerkamp.', 'Un peigne en os, trouvé dans un camp militaire romain.'),
  O('archeologisch', 'De Zuil van Marcianus werd in 452 in Constantinopel (Istanbul) gebouwd om de overwinning op Attila de Hun te vieren.',
    'La colonne de Marcien a été construite en 452 à Constantinople (Istanbul) pour fêter la victoire sur Attila le Hun.', { p: 51,
      tijd: { soort: 'primair', wanneer: tw('in 452', 'en 452'), over: ATTILA } }),
  O('archeologisch', 'Romeinse munten.', 'Des pièces de monnaie romaines.', { p: 46, ook: 'iconografisch' }),
  O('archeologisch', 'Een gouden dinar (een munt) uit Damascus, uit de 7de eeuw (de bron is de munt, niet de foto van de munt).',
    'Un dinar d’or (une pièce de monnaie) de Damas, du 7e siècle (la source est la pièce, pas la photo de la pièce).', { p: 53, ook: 'iconografisch',
      tijd: { soort: 'primair', wanneer: tw('in de 7de eeuw', 'au 7e siècle'), over: tp('de periode waarover de munt ons iets leert (de 7de eeuw)', 'la période dont la pièce nous parle (le 7e siècle)') } }),

  // ---------------------------------------------- beeldbronnen (p. 42, 46)
  O('beeld', 'Een kaart van het Romeinse Keizerrijk in 117 n.C., in een schoolboek.', 'Une carte de l’Empire romain en 117 apr. J.-C., dans un manuel scolaire.', { p: 42 }),
  O('beeld', 'Een tijdlijn van het oude Griekenland (800 v.C. tot 30 v.C.) met de archaïsche, de klassieke en de hellenistische periode.',
    'Une ligne du temps de la Grèce antique (800 à 30 av. J.-C.) avec les périodes archaïque, classique et hellénistique.', { p: 42 }),
  O('beeld', 'Een cirkeldiagram: “Romeinse keizers: aantal jaar aan de macht” (13 % minder dan een jaar, 43 % 1 tot 5 jaar…).',
    'Un diagramme circulaire : « Empereurs romains : nombre d’années au pouvoir » (13 % moins d’un an, 43 % de 1 à 5 ans…).', { p: 46 }),
  O('beeld', 'Een schema van de Egyptische samenleving: de farao bovenaan, de slaven onderaan.', 'Un schéma de la société égyptienne : le pharaon en haut, les esclaves en bas.'),
  O('beeld', 'Een grafiek van het aantal inwoners van Rome tussen 500 v.C. en 500 n.C.', 'Un graphique du nombre d’habitants de Rome entre 500 av. J.-C. et 500 apr. J.-C.'),
  O('beeld', 'Een plattegrond van een Romeins legerkamp, in een boek over de Romeinen.', 'Un plan d’un camp militaire romain, dans un livre sur les Romains.'),

  // ---------------------------------------------- iconografische bronnen (p. 43, 46, 48, 51-52)
  O('iconografisch', 'Een mozaïek uit Pompeï: Alexander de Grote te paard in de strijd tegen de Perzen.', 'Une mosaïque de Pompéi : Alexandre le Grand à cheval au combat contre les Perses.', { p: 43 }),
  O('iconografisch', 'Een Griekse vaas met een beschildering.', 'Un vase grec peint.', { p: 43, ook: 'archeologisch' }),
  O('iconografisch', 'Het gouden dodenmasker van farao Toetanchamon.', 'Le masque funéraire en or du pharaon Toutânkhamon.', { p: 43, ook: 'archeologisch' }),
  O('iconografisch', 'Een standbeeld van de god Apollo uit de 2de eeuw.', 'Une statue du dieu Apollon du 2e siècle.', { p: 46 }),
  O('iconografisch', 'Een standbeeld van keizer Augustus te paard, in 2007 gemaakt door de Spaanse beeldhouwer Eduardo Zancada Pérez.',
    'Une statue équestre de l’empereur Auguste, faite en 2007 par le sculpteur espagnol Eduardo Zancada Pérez.', { p: 48 }),
  O('iconografisch', 'Het schilderij “De dood van Julius Caesar”, in 1806 gemaakt door de schilder Vincenzo Camuccini.',
    'Le tableau « La mort de Jules César », peint en 1806 par Vincenzo Camuccini.', { p: 52,
      tijd: { soort: 'secundair', wanneer: tw('in 1806', 'en 1806'),
        over: tp('het leven van Julius Caesar (100–44 v.C.)', 'la vie de Jules César (100-44 av. J.-C.)', 'de dood van Julius Caesar (44 v.C.)', 'la mort de Jules César (44 av. J.-C.)') } }),
  O('iconografisch', 'Een gravure van Attila de Hun, in 1493 gemaakt voor de Liber Chronicarum (een boek over de wereldgeschiedenis).',
    'Une gravure d’Attila le Hun, faite en 1493 pour le Liber Chronicarum (un livre sur l’histoire du monde).', { p: 51,
      tijd: { soort: 'secundair', wanneer: tw('in 1493', 'en 1493'), over: ATTILA } }),
  O('iconografisch', 'Een muurschildering (fresco) in een huis in Pompeï: een feestmaal.', 'Une peinture murale (fresque) dans une maison de Pompéi : un banquet.'),
  O('iconografisch', 'De buste (het beeld van hoofd en schouders) van koningin Nefertiti.', 'Le buste (la sculpture de la tête et des épaules) de la reine Néfertiti.'),
  O('iconografisch', 'Een foto uit 1922: archeoloog Howard Carter opent het graf van Toetanchamon.', 'Une photo de 1922 : l’archéologue Howard Carter ouvre la tombe de Toutânkhamon.'),

  // ---------------------------------------------- audiovisuele bronnen (p. 43, 46)
  O('audiovisueel', 'Een documentaire in de bioscoop over de Egyptische farao’s.', 'Un documentaire au cinéma sur les pharaons égyptiens.', { p: 46 }),
  O('audiovisueel', '“Ancient Rome: the rise and fall of an empire”, een reeks van de BBC op dvd.', '« Ancient Rome: the rise and fall of an empire », une série de la BBC en DVD.', { p: 43 }),
  O('audiovisueel', '“History of Egypt”, een podcast.', '« History of Egypt », un podcast.', { p: 43 }),
  O('audiovisueel', 'De film “Gladiator” (2000), over een Romeinse generaal die gladiator wordt.', 'Le film « Gladiator » (2000), sur un général romain qui devient gladiateur.'),
  O('audiovisueel', 'Een toneelstuk over Julius Caesar in de schouwburg.', 'Une pièce de théâtre sur Jules César au théâtre.'),
  O('audiovisueel', 'Een liedje over de Romeinen op de radio.', 'Une chanson sur les Romains à la radio.'),

  // ---------------------------------------------- mondelinge getuigenissen (p. 44, 46)
  O('mondeling', 'In november 2026 vertelt Anna aan haar vrienden over haar gegidste bezoek aan de Acropolis in Athene.',
    'En novembre 2026, Anna raconte à ses amis sa visite guidée de l’Acropole à Athènes.', { p: 46 }),
  O('mondeling', 'Een interview met een archeoloog die vertelt wat hij zag toen hij een Egyptisch graf opende.',
    'Une interview d’un archéologue qui raconte ce qu’il a vu quand il a ouvert une tombe égyptienne.', { p: 44 }),
  O('mondeling', 'Opa vertelt hoe hij in 1958 de Wereldtentoonstelling in Brussel bezocht.', 'Papy raconte comment il a visité l’Exposition universelle de Bruxelles en 1958.'),
  O('mondeling', 'Een vrouw vertelt in de klas hoe ze als kind de oorlog in haar land heeft meegemaakt.', 'Une dame raconte en classe comment elle a vécu la guerre dans son pays quand elle était enfant.'),
]

// ============================================================ primair of secundair : des sources aux dates toujours nouvelles
interface Gebeurtenis {
  /** le personnage (pour « een munt met het hoofd van … »), ou l'événement */
  wie?: Tweetalig
  over: Tweetalig
  van: number
  tot: number
  /** les années de règne : pièces, inscriptions, statues faites de son vivant */
  macht?: [number, number]
  munt?: boolean
  /** des lettres écrites pendant l'événement */
  brief?: boolean
  tijdperk: Tijdperk
  /** pour situer : « Julius Caesar leefde van 100 tot 44 v.C. » */
  context: Tweetalig
}
const GEBEURTENISSEN: Gebeurtenis[] = [
  { wie: tw('Julius Caesar', 'Jules César'), over: tw('Julius Caesar', 'Jules César'), van: -100, tot: -44, macht: [-49, -44], munt: true, brief: true,
    tijdperk: tp('het leven van Julius Caesar (100–44 v.C.)', 'la vie de Jules César (100-44 av. J.-C.)', 'de dood van Julius Caesar (44 v.C.)', 'la mort de Jules César (44 av. J.-C.)'),
    context: tw('Julius Caesar leefde van 100 tot 44 v.C.', 'Jules César a vécu de 100 à 44 av. J.-C.') },
  { wie: tw('Cleopatra', 'Cléopâtre'), over: tw('Cleopatra', 'Cléopâtre'), van: -69, tot: -30, macht: [-51, -30], munt: true, brief: true,
    tijdperk: tp('het leven van Cleopatra (69–30 v.C.)', 'la vie de Cléopâtre (69-30 av. J.-C.)', 'de dood van Cleopatra (30 v.C.)', 'la mort de Cléopâtre (30 av. J.-C.)'),
    context: tw('Cleopatra, de laatste farao van Egypte, leefde van 69 tot 30 v.C.', 'Cléopâtre, la dernière pharaonne d’Égypte, a vécu de 69 à 30 av. J.-C.') },
  { wie: tw('keizer Augustus', 'l’empereur Auguste'), over: tw('keizer Augustus', 'l’empereur Auguste'), van: -63, tot: 14, macht: [-27, 14], munt: true, brief: true,
    tijdperk: tp('het leven van keizer Augustus (63 v.C.–14 n.C.)', 'la vie de l’empereur Auguste (63 av. J.-C.-14 apr. J.-C.)', 'de dood van keizer Augustus (14 n.C.)', 'la mort de l’empereur Auguste (14 apr. J.-C.)'),
    context: tw('Keizer Augustus leefde van 63 v.C. tot 14 n.C.', 'L’empereur Auguste a vécu de 63 av. J.-C. à 14 apr. J.-C.') },
  { wie: tw('keizer Nero', 'l’empereur Néron'), over: tw('keizer Nero', 'l’empereur Néron'), van: 37, tot: 68, macht: [54, 68], munt: true, brief: true,
    tijdperk: tp('het leven van keizer Nero (37–68)', 'la vie de l’empereur Néron (37-68)', 'de dood van keizer Nero (68)', 'la mort de l’empereur Néron (68)'),
    context: tw('Keizer Nero leefde van 37 tot 68.', 'L’empereur Néron a vécu de 37 à 68.') },
  { wie: tw('keizer Trajanus', 'l’empereur Trajan'), over: tw('keizer Trajanus', 'l’empereur Trajan'), van: 53, tot: 117, macht: [98, 117], munt: true, brief: true,
    tijdperk: tp('het leven van keizer Trajanus (53–117)', 'la vie de l’empereur Trajan (53-117)', 'de dood van keizer Trajanus (117)', 'la mort de l’empereur Trajan (117)'),
    context: tw('Keizer Trajanus leefde van 53 tot 117.', 'L’empereur Trajan a vécu de 53 à 117.') },
  { wie: tw('Attila de Hun', 'Attila le Hun'), over: tw('Attila de Hun', 'Attila le Hun'), van: 400, tot: 453, macht: [434, 453], brief: true,
    tijdperk: ATTILA, context: tw('Attila de Hun leefde van ca. 400 tot 453.', 'Attila le Hun a vécu de 400 à 453 environ.') },
  { wie: tw('farao Ramses II', 'le pharaon Ramsès II'), over: tw('farao Ramses II', 'le pharaon Ramsès II'), van: -1303, tot: -1213, macht: [-1279, -1213],
    tijdperk: tp('het leven van farao Ramses II (ca. 1303–1213 v.C.)', 'la vie du pharaon Ramsès II (vers 1303-1213 av. J.-C.)', 'de dood van farao Ramses II (1213 v.C.)', 'la mort du pharaon Ramsès II (1213 av. J.-C.)'),
    context: tw('Farao Ramses II leefde van ca. 1303 tot 1213 v.C.', 'Le pharaon Ramsès II a vécu de 1303 à 1213 av. J.-C. environ.') },
  { wie: tw('Alexander de Grote', 'Alexandre le Grand'), over: tw('Alexander de Grote', 'Alexandre le Grand'), van: -356, tot: -323, macht: [-336, -323], brief: true,
    tijdperk: tp('het leven van Alexander de Grote (356–323 v.C.)', 'la vie d’Alexandre le Grand (356-323 av. J.-C.)', 'de dood van Alexander de Grote (323 v.C.)', 'la mort d’Alexandre le Grand (323 av. J.-C.)'),
    context: tw('Alexander de Grote leefde van 356 tot 323 v.C.', 'Alexandre le Grand a vécu de 356 à 323 av. J.-C.') },
  { over: tw('de uitbarsting van de Vesuvius', 'l’éruption du Vésuve'), van: 79, tot: 79, brief: true,
    tijdperk: tp('de uitbarsting van de Vesuvius (79)', 'l’éruption du Vésuve (79)'),
    context: tw('De Vesuvius barstte uit in 79 en bedolf Pompeï.', 'Le Vésuve est entré en éruption en 79 et a enseveli Pompéi.') },
  { over: tw('de burgeroorlog tussen Caesar en Pompeius', 'la guerre civile entre César et Pompée'), van: -49, tot: -45, brief: true,
    tijdperk: tp('de burgeroorlog tussen Caesar en Pompeius (49–45 v.C.)', 'la guerre civile entre César et Pompée (49-45 av. J.-C.)'),
    context: tw('De burgeroorlog tussen Caesar en Pompeius duurde van 49 tot 45 v.C.', 'La guerre civile entre César et Pompée a duré de 49 à 45 av. J.-C.') },
  { over: tw('de Trojaanse Oorlog', 'la guerre de Troie'), van: -1250, tot: -1180,
    tijdperk: tp('de Trojaanse Oorlog (12de of 13de eeuw v.C.)', 'la guerre de Troie (12e ou 13e siècle av. J.-C.)'),
    context: tw('De Trojaanse Oorlog vond plaats in de 12de of 13de eeuw v.C.', 'La guerre de Troie a eu lieu au 12e ou au 13e siècle av. J.-C.') },
  { over: tw('de bouw van de piramiden van Gizeh', 'la construction des pyramides de Gizeh'), van: -2551, tot: -2472,
    tijdperk: tp('de bouw van de piramiden van Gizeh (ca. 2551–2472 v.C.)', 'la construction des pyramides de Gizeh (vers 2551-2472 av. J.-C.)'),
    context: tw('De piramiden van Gizeh werden gebouwd tussen ca. 2551 en 2472 v.C.', 'Les pyramides de Gizeh ont été construites entre 2551 et 2472 av. J.-C. environ.') },
]
const jaar = (j: number): Tweetalig => (j < 0 ? tw(`${-j} v.C.`, `${-j} av. J.-C.`) : tw(String(j), String(j)))

/** Une source datée sur l'événement : faite pendant (primaire), après (secondaire), ou un ouvrage d'historien depuis 1945. */
export function gedateerdeBron(h: Hasard): { bron: Bron; context: Tweetalig } {
  const e = un(GEBEURTENISSEN, h)
  const soorten: Tijd['soort'][] = [...(e.macht || e.brief ? ['primair', 'primair'] as const : []), 'secundair', 'secundair', 'historisch']
  const soort = un(soorten, h)
  const wie = e.wie
  type Sjabloon = (j: Tweetalig) => [string, string]
  let j: number, sjablonen: Sjabloon[]
  if (soort === 'primair') {
    const [a, b] = e.macht ?? [e.van, e.tot]
    j = entre(a, b, h)
    sjablonen = [
      ...(e.brief ? [(y: Tweetalig) => [`Een brief over ${e.over.nl}, geschreven in ${y.nl}.`, `Une lettre sur ${e.over.fr}, écrite en ${y.fr}.`] as [string, string]] : []),
      ...(wie && e.macht ? [
        (y: Tweetalig) => [`Een inscriptie op steen, in ${y.nl} gemaakt in opdracht van ${wie.nl}.`, `Une inscription sur pierre, faite en ${y.fr} sur ordre de ${wie.fr}.`] as [string, string],
        (y: Tweetalig) => [`Een standbeeld van ${wie.nl}, gemaakt in ${y.nl}.`, `Une statue de ${wie.fr}, faite en ${y.fr}.`] as [string, string],
      ] : []),
      ...(wie && e.munt ? [(y: Tweetalig) => [`Een munt met het hoofd van ${wie.nl}, geslagen in ${y.nl}.`, `Une pièce de monnaie à l’effigie de ${wie.fr}, frappée en ${y.fr}.`] as [string, string]] : []),
    ]
  } else if (soort === 'secundair') {
    const vroeg = Math.max(e.tot + 60, -1000)
    const sjabloon = un([
      'brief', 'boek', 'schilderij', ...(wie ? ['standbeeld'] : []),
    ] as const, h)
    j = sjabloon === 'schilderij' ? entre(1500, 1900, h) : sjabloon === 'standbeeld' ? entre(1600, 1930, h) : entre(vroeg, 1900, h)
    sjablonen = [{
      brief: (y: Tweetalig) => [`Een brief over ${e.over.nl}, geschreven in ${y.nl}.`, `Une lettre sur ${e.over.fr}, écrite en ${y.fr}.`],
      boek: (y: Tweetalig) => [`Een boek over ${e.over.nl}, geschreven in ${y.nl}.`, `Un livre sur ${e.over.fr}, écrit en ${y.fr}.`],
      schilderij: (y: Tweetalig) => [`Een schilderij over ${e.over.nl}, geschilderd in ${y.nl}.`, `Un tableau sur ${e.over.fr}, peint en ${y.fr}.`],
      standbeeld: (y: Tweetalig) => [`Een standbeeld van ${wie!.nl}, gemaakt in ${y.nl}.`, `Une statue de ${wie!.fr}, faite en ${y.fr}.`],
    }[sjabloon] as Sjabloon]
  } else {
    j = entre(1950, 2025, h)
    sjablonen = [
      y => [`Een boek van een historicus over ${e.over.nl}, uitgegeven in ${y.nl}, na jaren onderzoek van primaire en secundaire bronnen.`,
        `Un livre d’un historien sur ${e.over.fr}, publié en ${y.fr}, après des années de recherches dans des sources primaires et secondaires.`],
      y => [`Een meesterproef over ${e.over.nl}, in ${y.nl} geschreven aan de universiteit, na een jaar onderzoek van primaire en secundaire bronnen.`,
        `Un mémoire sur ${e.over.fr}, écrit en ${y.fr} à l’université, après un an de recherches dans des sources primaires et secondaires.`],
      y => [`Een artikel van een historicus over ${e.over.nl} (${y.nl}), gebaseerd op onderzoek van andere bronnen.`,
        `Un article d’un historien sur ${e.over.fr} (${y.fr}), basé sur des recherches dans d’autres sources.`],
    ]
  }
  if (j === 0) j = 1 // pas d'an 0
  const y = jaar(j)
  const [nl, fr] = un(sjablonen, h)(y)
  return { bron: { nl, fr, soort: 'geschreven', tijd: { soort, wanneer: tw(`in ${y.nl}`, `en ${y.fr}`), over: e.tijdperk } }, context: e.context }
}

// ============================================================ les questions
export interface Stap {
  vraag: Tweetalig
  options: string[]
  /** les réponses acceptées (deux quand une source est de deux sortes) */
  bonnes: string[]
}
export interface QuestionBron {
  /** pour situer la source dans le temps */
  context?: Tweetalig
  bron: Bron
  /** d'abord la sorte de source, puis « Waarom? » */
  stappen: [Stap, Stap]
  uitleg: Tweetalig
}

const WAAROM = tw('Waarom? Leg uit!', 'Pourquoi ? Explique !')
/** les bonnes réponses, puis les autres sans doublon, jusqu'à n propositions, mélangées */
function opties(bonnes: string[], andere: string[], h: Hasard, n = 4): string[] {
  const rest = melange([...new Set(andere)].filter(a => !bonnes.includes(a)), h)
  return melange([...bonnes, ...rest].slice(0, Math.max(n, bonnes.length)), h)
}
const samen = (...t: (Tweetalig | undefined)[]): Tweetalig => {
  const d = t.filter((x): x is Tweetalig => !!x)
  return tw(d.map(x => x.nl).join(' '), d.map(x => x.fr).join(' '))
}

/** les cartes de l'exercice : une notion du cours chacune */
export const BRONNEN_KAARTEN: Tweetalig[] = [
  tw('Geschreven of ongeschreven?', 'Écrite ou non écrite ?'),
  tw('Publiek of privé?', 'Publique ou privée ?'),
  tw('Officieel of niet-officieel?', 'Officielle ou non officielle ?'),
  tw('Welke ongeschreven bron?', 'Quelle source non écrite ?'),
  tw('Wat voor bron? Wees volledig!', 'Quelle sorte de source ? Sois complet !'),
  tw('Primair of secundair? Leg uit!', 'Primaire ou secondaire ? Explique !'),
  tw('Primair of secundair? (met datums)', 'Primaire ou secondaire ? (avec des dates)'),
  tw('De bronnen van het boek (p. 40-53)', 'Les sources du livre (p. 40-53)'),
]

function geschrevenOfNiet(b: Bron, h: Hasard): QuestionBron {
  const g = b.soort === 'geschreven'
  const ja = 'Geschreven bron', nee = 'Ongeschreven bron'
  return {
    bron: b,
    stappen: [
      { vraag: tw('Is het een geschreven of een ongeschreven bron?', 'Est-ce une source écrite ou non écrite ?'), options: [ja, nee], bonnes: [g ? ja : nee] },
      { vraag: WAAROM, bonnes: [g ? WANT.geschreven : WANT.ongeschreven],
        options: opties([g ? WANT.geschreven : WANT.ongeschreven], [g ? WANT.ongeschreven : WANT.geschreven, ...melange([OUD, MUSEUM, 'Want je kan de bron vastnemen.'], h).slice(0, 2)], h) },
    ],
    uitleg: samen(g ? DEF.geschreven : DEF.ongeschreven, b.noot),
  }
}

function publiekOfPrive(b: Bron, h: Hasard): QuestionBron {
  const p = !!b.publiek
  const goed = p ? WANT.publiek : WANT.prive
  return {
    bron: b,
    stappen: [
      { vraag: tw('Is deze geschreven bron publiek of privé?', 'Cette source écrite est-elle publique ou privée ?'), options: ['Publiek', 'Privé'], bonnes: [p ? 'Publiek' : 'Privé'] },
      { vraag: WAAROM, bonnes: [goed],
        options: opties([goed], [p ? WANT.prive : WANT.publiek, ...melange(['Want de koning of de staat heeft de bron gemaakt.', STEEN, OUD, MUSEUM], h).slice(0, 2)], h) },
    ],
    uitleg: samen(p ? DEF.publiek : DEF.prive, b.noot ?? tw('Publiek of privé? Kijk naar wie de bron mag lezen, niet naar wie ze gemaakt heeft.',
      'Publique ou privée ? Regarde qui peut lire la source, pas qui l’a faite.')),
  }
}

function officieelOfNiet(b: Bron, h: Hasard): QuestionBron {
  const o = !!b.officieel
  const goed = o ? WANT.officieel : WANT.niet
  return {
    bron: b,
    stappen: [
      { vraag: tw('Is deze geschreven bron officieel of niet-officieel?', 'Cette source écrite est-elle officielle ou non officielle ?'),
        options: ['Officieel', 'Niet-officieel'], bonnes: [o ? 'Officieel' : 'Niet-officieel'] },
      { vraag: WAAROM, bonnes: [goed],
        options: opties([goed], [o ? WANT.niet : WANT.officieel, ...melange(['Want iedereen mag de bron lezen.', 'Want de bron gaat over belangrijke zaken.', STEEN, OUD], h).slice(0, 2)], h) },
    ],
    uitleg: samen(o ? DEF.officieel : DEF.niet, b.noot ?? tw('Officieel of niet? Kijk naar wie de bron gemaakt heeft, niet naar wie ze mag lezen.',
      'Officielle ou non ? Regarde qui a fait la source, pas qui peut la lire.')),
  }
}

/** les sortes acceptées pour une source non écrite */
const soortenVan = (b: Bron) => [b.soort, ...(b.ook ? [b.ook] : [])] as Ongeschreven[]

function welkeOngeschreven(b: Bron, h: Hasard): QuestionBron {
  const goed = soortenVan(b)
  return {
    bron: b,
    stappen: [
      { vraag: tw('Welke soort ongeschreven bron is het?', 'Quelle sorte de source non écrite est-ce ?'),
        options: melange(ONGESCHREVEN.map(s => NAAM[s]), h), bonnes: goed.map(s => NAAM[s]) },
      { vraag: WAAROM, bonnes: goed.map(s => WANT[s]), options: opties(goed.map(s => WANT[s]), ONGESCHREVEN.map(s => WANT[s]), h) },
    ],
    uitleg: samen(...goed.map(s => DEF[s]), b.noot),
  }
}

/** « Geschreven – publiek – officieel », « Ongeschreven – archeologische bron » */
const volledig = (p: boolean, o: boolean) => `Geschreven – ${p ? 'publiek' : 'privé'} – ${o ? 'officieel' : 'niet-officieel'}`
const ongeschrevenNaam = (s: Ongeschreven) => `Ongeschreven – ${NAAM[s][0].toLowerCase()}${NAAM[s].slice(1)}`
const kort = {
  publiek: 'iedereen mag de bron lezen', prive: 'de bron is voor één persoon of een klein publiek',
  officieel: 'de koning, de staat of een officiële instelling heeft ze gemaakt', niet: 'een gewone persoon heeft ze gemaakt',
}
const volledigWant = (p: boolean, o: boolean) => `Want ${p ? kort.publiek : kort.prive}, en ${o ? kort.officieel : kort.niet}.`

function weesVolledig(b: Bron, h: Hasard): QuestionBron {
  const vraag = tw('Wat voor bron is het? Wees volledig!', 'Quelle sorte de source est-ce ? Sois complet !')
  if (b.soort === 'geschreven') {
    const p = !!b.publiek, o = !!b.officieel
    const combis = [[true, true], [true, false], [false, true], [false, false]] as const
    return {
      bron: b,
      stappen: [
        { vraag, options: combis.map(([x, y]) => volledig(x, y)), bonnes: [volledig(p, o)] },
        { vraag: WAAROM, bonnes: [volledigWant(p, o)], options: melange(combis.map(([x, y]) => volledigWant(x, y)), h) },
      ],
      uitleg: samen(p ? DEF.publiek : DEF.prive, o ? DEF.officieel : DEF.niet, b.noot),
    }
  }
  const goed = soortenVan(b)
  const andere = melange(ONGESCHREVEN.filter(s => !goed.includes(s)), h)
  return {
    bron: b,
    stappen: [
      { vraag, bonnes: goed.map(ongeschrevenNaam),
        options: melange([...goed.map(ongeschrevenNaam), ...andere.slice(0, 3 - goed.length).map(ongeschrevenNaam), volledig(un([true, false], h), un([true, false], h))], h) },
      { vraag: WAAROM, bonnes: goed.map(s => WANT[s]), options: opties(goed.map(s => WANT[s]), [WANT.geschreven, ...andere.map(s => WANT[s])], h) },
    ],
    uitleg: samen(...goed.map(s => DEF[s]), b.noot),
  }
}

const TIJD_NAAM = { primair: 'Primaire bron', secundair: 'Secundaire bron', historisch: 'Secundaire bron: een historisch werk' }
function primairOfSecundair(b: Bron, h: Hasard, context?: Tweetalig): QuestionBron {
  const t = b.tijd!
  const w = t.wanneer, tijdens = t.over.tijdens, na = t.over.na
  const R = {
    tijdens: `Want de bron is ${w.nl} gemaakt, tijdens ${tijdens.nl}.`,
    na: `Want de bron is ${w.nl} gemaakt, ná ${na.nl}.`,
    historisch: `Want de bron is ${w.nl} gemaakt (na 1945), op basis van onderzoek van andere bronnen.`,
  }
  const goed = t.soort === 'primair' ? R.tijdens : t.soort === 'secundair' ? R.na : R.historisch
  const fout = t.soort === 'primair' ? [R.na, OUD, MUSEUM, 'Want de bron toont de gebeurtenis zelf.']
    : t.soort === 'secundair' ? [R.tijdens, OUD, 'Want de bron toont de gebeurtenis zelf.', MUSEUM]
    : [R.tijdens, 'Want de schrijver heeft de gebeurtenis zelf meegemaakt.', 'Want het is een boek over de geschiedenis.', OUD]
  const uitleg = {
    primair: tw(`Primaire bron: de bron is ${w.nl} gemaakt, TIJDENS ${tijdens.nl}. Een primaire bron is gemaakt tijdens de gebeurtenis of periode waarover ze gaat.`,
      `Source primaire : elle a été faite ${w.fr}, PENDANT ${tijdens.fr}. Une source primaire est faite pendant l’événement ou la période dont elle parle.`),
    secundair: tw(`Secundaire bron: de bron is ${w.nl} gemaakt, NA ${na.nl}. Een secundaire bron is gemaakt na de gebeurtenis of periode waarover ze gaat.`,
      `Source secondaire : elle a été faite ${w.fr}, APRÈS ${na.fr}. Une source secondaire est faite après l’événement ou la période dont elle parle.`),
    historisch: tw(`Historisch werk: een secundaire bron uit onze eigen tijd (vanaf 1945, hier ${w.nl}), het resultaat van onderzoek op basis van andere (primaire en secundaire) bronnen.`,
      `Ouvrage historique (historisch werk) : une source secondaire de notre époque (depuis 1945, ici ${w.fr}), le résultat de recherches basées sur d’autres sources (primaires et secondaires).`),
  }[t.soort]
  const geenHistorisch = t.soort === 'secundair' && /boek|livre/i.test(b.nl + b.fr)
    ? tw('Geen historisch werk: het boek is gemaakt vóór 1945.', 'Pas un ouvrage historique : le livre a été fait avant 1945.') : undefined
  return {
    context,
    bron: b,
    stappen: [
      { vraag: tw('Is het een primaire of een secundaire bron?', 'Est-ce une source primaire ou secondaire ?'),
        options: [TIJD_NAAM.primair, TIJD_NAAM.secundair, TIJD_NAAM.historisch], bonnes: [TIJD_NAAM[t.soort]] },
      { vraag: WAAROM, bonnes: [goed], options: opties([goed], fout, h) },
    ],
    uitleg: samen(uitleg, geenHistorisch, b.noot),
  }
}

const geschreven = BRONNEN.filter(b => b.soort === 'geschreven')
/** les questions qu'on peut poser sur une source */
function vragenOver(b: Bron): ((b: Bron, h: Hasard) => QuestionBron)[] {
  const g = b.soort === 'geschreven'
  return [
    ...(!b.ook ? [geschrevenOfNiet] : []),
    ...(g && b.publiek !== undefined ? [publiekOfPrive] : []),
    ...(g && b.officieel !== undefined ? [officieelOfNiet] : []),
    ...(!g ? [welkeOngeschreven] : []),
    ...(!g || (b.publiek !== undefined && b.officieel !== undefined) ? [weesVolledig, weesVolledig] : []),
    ...(b.tijd ? [primairOfSecundair, primairOfSecundair, primairOfSecundair] : []),
  ]
}

/** Une question de la carte n (voir BRONNEN_KAARTEN). */
export function questionBron(n: number, h: Hasard = Math.random): QuestionBron {
  switch (n) {
    case 0: return geschrevenOfNiet(un(BRONNEN.filter(b => !b.ook), h), h)
    case 1: return publiekOfPrive(un(geschreven.filter(b => b.publiek !== undefined), h), h)
    case 2: return officieelOfNiet(un(geschreven.filter(b => b.officieel !== undefined), h), h)
    case 3: return welkeOngeschreven(un(BRONNEN.filter(b => b.soort !== 'geschreven'), h), h)
    case 4: return weesVolledig(un(BRONNEN.filter(b => vragenOver(b).includes(weesVolledig)), h), h)
    case 5: return primairOfSecundair(un(BRONNEN.filter(b => b.tijd), h), h)
    case 6: { const { bron, context } = gedateerdeBron(h); return primairOfSecundair(bron, h, context) }
    default: {
      const b = un(BRONNEN.filter(x => x.p), h)
      return un(vragenOver(b), h)(b, h)
    }
  }
}
