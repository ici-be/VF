#!/usr/bin/env python3
"""Les dessins des définitions de géométrie (chapitre 3 de mathématiques) : un petit SVG par notion,
dans le style de l'appli (la notion en orange, les repères en bleu, le reste à l'encre).

    python3 outils/dessins.py     # écrit src/data/dessins.json (clé : le mot, tel qu'il est dans le tableau)

Pour un nouveau dessin : l'ajouter à F (coordonnées dans un cadre de 160 × 120), relancer, vérifier dans l'appli.
"""
import json
import math
INK='#15202f'; OR='#e2681f'; BL='#1f5fbf'; FOR='#fbe3d2'; FBL='#dde8f8'
def f(x): return f'{x:.1f}'.rstrip('0').rstrip('.')
def P(a,r,c): return (c[0]+r*math.cos(math.radians(a)), c[1]-r*math.sin(math.radians(a)))
def ang(c,p): return math.degrees(math.atan2(c[1]-p[1], p[0]-c[0]))%360
def line(a,b,col=INK,w=2,extra=''): return f'<line x1="{f(a[0])}" y1="{f(a[1])}" x2="{f(b[0])}" y2="{f(b[1])}" stroke="{col}" stroke-width="{w}" stroke-linecap="round"{extra}/>'
def dot(p,col=INK,r=3): return f'<circle cx="{f(p[0])}" cy="{f(p[1])}" r="{r}" fill="{col}"/>'
def txt(p,t,col=INK,size=13,anchor='middle',w=600): return f'<text x="{f(p[0])}" y="{f(p[1])}" font-size="{size}" font-weight="{w}" fill="{col}" text-anchor="{anchor}" font-family="Atkinson Hyperlegible, sans-serif">{t}</text>'
def arc(c,r,a1,a2,col=OR,w=2.5,fill=None):
    # de a1 à a2 dans le sens trigonométrique
    d=(a2-a1)%360
    p1=P(a1,r,c); p2=P(a2,r,c); large=1 if d>180 else 0
    if fill:
        return f'<path d="M{f(c[0])} {f(c[1])} L{f(p1[0])} {f(p1[1])} A{r} {r} 0 {large} 0 {f(p2[0])} {f(p2[1])} Z" fill="{fill}" stroke="none"/>'+f'<path d="M{f(p1[0])} {f(p1[1])} A{r} {r} 0 {large} 0 {f(p2[0])} {f(p2[1])}" fill="none" stroke="{col}" stroke-width="{w}"/>'
    return f'<path d="M{f(p1[0])} {f(p1[1])} A{r} {r} 0 {large} 0 {f(p2[0])} {f(p2[1])}" fill="none" stroke="{col}" stroke-width="{w}" stroke-linecap="round"/>'
def carre(c,a,s=11,col=BL):
    p1=P(a,s,c); p2=P(a+90,s,c); p3=(p1[0]+p2[0]-c[0],p1[1]+p2[1]-c[1])
    return f'<path d="M{f(p1[0])} {f(p1[1])} L{f(p3[0])} {f(p3[1])} L{f(p2[0])} {f(p2[1])}" fill="none" stroke="{col}" stroke-width="2"/>'
def tiret(m,a,col=BL,n=2):
    # petites marques de longueurs égales, perpendiculaires à la direction a
    out=''
    for k in range(n):
        o=(k-(n-1)/2)*4
        mm=(m[0]+o*math.cos(math.radians(a)), m[1]-o*math.sin(math.radians(a)))
        out+=line(P(a+90,5,mm),P(a-90,5,mm),col,2)
    return out
F={}
A,B=(40,82),(120,42)
F['droite']=line(P(ang(A,B)+180,30,A),P(ang(A,B),30,B),OR,3)+dot(A)+dot(B)+txt((A[0]-2,A[1]+18),'A')+txt((B[0]+4,B[1]+18),'B')+txt((140,20),'AB',OR)
A,B=(30,82),(110,46)
F['demi-droite']=line(A,P(ang(A,B),45,B),OR,3)+dot(A,INK,4)+dot(B)+txt((A[0],A[1]+20),'A')+txt((B[0]+4,B[1]+18),'B')+txt((140,22),'[AB',OR)
A,B=(30,82),(130,42)
F['segment de droite']=line(A,B,OR,3)+dot(A,INK,4)+dot(B,INK,4)+txt((A[0],A[1]+20),'A')+txt((B[0],B[1]+20),'B')+txt((80,30),'[AB]',OR)
F['droites parallèles']=line((15,48),(145,28),OR,3)+line((15,98),(145,78),OR,3)+txt((150,22),'d',OR,anchor='end')+txt((150,72),'e',OR,anchor='end')+txt((80,70),'d // e',BL)
F['droites sécantes']=line((15,95),(145,25),OR,3)+line((15,35),(145,90),OR,3)+dot((80.4,60.2),BL,4)+txt((80,108),'un point commun',BL,12)
F['droites perpendiculaires']=line((15,80),(145,80),OR,3)+line((80,12),(80,108),OR,3)+carre((80,80),0,12)+txt((125,72),'90°',BL,12)
# équerre : triangle rectangle isocèle, angle droit en bas
T1,T2,T3=(18,30),(142,30),(80,92)
tri=f'<path d="M{T1[0]} {T1[1]} L{T3[0]} {T3[1]} L{T2[0]} {T2[1]}" fill="none" stroke="{INK}" stroke-width="2" stroke-linejoin="round"/>'
F['hypoténuse']=tri+line(T1,T2,OR,4)+carre(T3,45,11)+txt((80,20),'le grand côté',OR,12)
grad=''.join(line((x,30),(x,36 if (x-80)%20 else 40),INK,1.2) for x in range(24,141,8))
F['zéro central']=tri+grad+arc((80,30),34,180,360,INK,1.2)+dot((80,30),OR,5)+txt((80,22),'0',OR,14)
A,B,M=(28,68),(132,68),(80,68)
F['médiatrice']=line(A,B,INK,2)+dot(A)+dot(B)+line((80,12),(80,112),OR,3)+carre(M,0,10)+tiret(((A[0]+M[0])/2,M[1]),0)+tiret(((B[0]+M[0])/2,M[1]),0)+txt((A[0],A[1]+20),'A')+txt((B[0],B[1]+20),'B')+txt((95,24),'m',OR,anchor='start')
V=(25,98); R1=(150,98); R2=(118,22)
a2=ang(V,R2); h=a2/2
F['bissectrice']=line(V,R1)+line(V,R2)+line(V,P(h,135,V),OR,3)+arc(V,58,0,h,BL,2)+arc(V,58,h,a2,BL,2)+tiret(P(h/2,58,V),h/2+90,BL,1)+tiret(P(h+(a2-h)/2,58,V),h+(a2-h)/2+90,BL,1)+dot(V)+txt((92,114),'deux angles égaux',BL,11)
V=(68,72); R1=(150,72); R2=(118,22); a2=ang(V,R2)
F['angle saillant']=arc(V,30,0,a2,OR,2.5,FOR)+arc(V,30,a2,360,BL,2,FBL)+line(V,R1)+line(V,R2)+dot(V)+txt((128,52),'saillant',OR,11)+txt((34,30),'rentrant',BL,11)
V=(25,98); R1=(150,98)
def angle_simple(deg,lab,r=34):
    R2=P(deg,120,V) if deg<=90 else None
    return R2
R2=P(33,125,V); F['angle aigu']=line(V,R1)+line(V,R2)+arc(V,36,0,33,OR,3)+dot(V)+txt((90,114),'entre 0° et 90°',OR,11)
R2=(25,12); F['angle droit']=line(V,R1)+line(V,R2)+carre(V,0,16,OR)+dot(V)+txt((100,86),'90°',OR,13)
V2=(78,98); R1b=(150,98); R2b=P(128,95,V2); F['angle obtus']=line(V2,R1b)+line(V2,R2b)+arc(V2,26,0,128,OR,3)+dot(V2)+txt((80,116),'entre 90° et 180°',OR,11)
V3=(80,82); F['angle plat']=line((12,82),(148,82))+arc(V3,30,0,180,OR,3)+dot(V3)+txt((80,108),'180°',OR,13)
V4=(70,66); a=40; R2c=P(a,80,V4); F['angle rentrant']=line(V4,(150,66))+line(V4,R2c)+arc(V4,26,a,360,OR,3)+dot(V4)+txt((50,108),'entre 180° et 360°',OR,11)
V5=(25,98); F['angles adjacents']=line(V5,(150,98))+line(V5,P(32,125,V5))+line(V5,P(75,95,V5))+arc(V5,40,0,32,OR,3)+arc(V5,32,32,75,BL,3)+dot(V5)+txt((100,116),'un côté commun',INK,11)
V6=(25,100); F['angles complémentaires']=line(V6,(150,100))+line(V6,(25,12))+line(V6,P(35,120,V6))+arc(V6,42,0,35,OR,3)+arc(V6,30,35,90,BL,3)+dot(V6)+txt((110,116),'α + β = 90°',INK,12)+txt(P(17,58,V6),'α',OR,12)+txt(P(65,44,V6),'β',BL,12)
V7=(80,92); F['angles supplémentaires']=line((10,92),(150,92))+line(V7,P(62,80,V7))+arc(V7,30,0,62,OR,3)+arc(V7,24,62,180,BL,3)+dot(V7)+txt((80,114),'α + β = 180°',INK,12)
C=(80,60); a=25
F['angles opposés par le sommet']=line(P(a,72,C),P(a+180,72,C))+line(P(-a,72,C),P(180-a,72,C))+arc(C,24,-a,a,OR,3)+arc(C,24,180-a,180+a,OR,3)+arc(C,18,a,180-a,BL,2)+arc(C,18,180+a,360-a,BL,2)+dot(C)+txt((80,114),'deux à deux égaux',INK,11)
V8=(25,98); F['angle']=line(V8,(150,98))+line(V8,P(40,120,V8))+arc(V8,34,0,40,OR,3)+dot(V8)+txt((100,114),'même origine',INK,11)
F["point d'intersection"]=F['droites sécantes']
import pathlib
cible = pathlib.Path(__file__).resolve().parent.parent / 'src' / 'data' / 'dessins.json'
# seulement l'intérieur du dessin : l'appli l'enveloppe dans <svg viewBox="0 0 160 120">

# ============================================================ Religion : le plan d'une église (entrée à gauche, chœur à droite)
GR, FOND = '#9aa3b1', '#ffffff'
def plan(ombre=''):
    """Le plan en croix, en gris ; « ombre » : une partie du plan à colorier (nef, transept, choeur, porche)."""
    parts = {
        'porche': f'<rect x="16" y="52" width="14" height="16" rx="1"',
        'nef': f'<rect x="30" y="44" width="66" height="32"',
        'transept': f'<rect x="96" y="20" width="20" height="80"',
        'choeur': f'<path d="M116 44 L134 44 A16 16 0 0 1 134 76 L116 76 Z"',
    }
    out = ''
    for k, d in parts.items():
        couleur = f'fill="{FOR}" stroke="{OR}" stroke-width="2.5"' if k == ombre else f'fill="{FOND}" stroke="{GR}" stroke-width="1.6"'
        out += d + f' {couleur}/>'
    # l'entrée (flèche) et les fenêtres, discrètes
    out += line((4, 60), (14, 60), GR, 1.4) + f'<path d="M11 57 L14 60 L11 63" fill="none" stroke="{GR}" stroke-width="1.4"/>'
    return out
def halo(x, y, r=12):
    """Un léger cercle orange autour d'un petit objet du plan, pour qu'on le trouve tout de suite."""
    return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{FOR}" stroke="{OR}" stroke-width="1" stroke-dasharray="2 2"/>'
R = {}
R['porche'] = plan('porche') + txt((23, 84), 'entrée', GR, 9)
R['portail'] = plan() + line((30, 53), (30, 67), OR, 4) + txt((23, 84), 'entrée', GR, 9)
R['transept'] = plan('transept')
R['chœur'] = plan('choeur')
R['bénitier'] = plan() + halo(38, 66) + f'<circle cx="38" cy="66" r="5" fill="{OR}"/>'
R['baptistère'] = plan() + halo(46, 64) + f'<path d="M41 61 L46 59 L51 61 L53 64 L51 67 L46 69 L41 67 L39 64 Z" fill="{OR}"/>'
R['chaire de vérité'] = plan() + halo(75, 47) + f'<path d="M68 44 A7 7 0 0 0 82 44 Z" fill="{OR}"/>'
# l'orgue : des tuyaux debout sur une base, le plus haut au milieu
R['orgue'] = plan() + halo(39, 52, 11) + ''.join(line((x, 57), (x, 57 - h), OR, 2.5) for x, h in zip(range(33, 46, 3), (5, 7, 9, 7, 5))) + line((31, 58), (47, 58), OR, 2.5)
R['vitrail'] = plan() + ''.join(line((x, 44), (x + 6, 44), OR, 3) for x in (40, 56, 72)) + ''.join(line((x, 76), (x + 6, 76), OR, 3) for x in (40, 56, 72))
R['statue'] = plan() + halo(106, 31) + f'<circle cx="106" cy="27" r="4" fill="{OR}"/><path d="M101 38 L106 31 L111 38 Z" fill="{OR}"/>'
R['ambon'] = plan() + halo(110, 51) + f'<rect x="105" y="46" width="10" height="6" rx="1" fill="{OR}"/>' + line((110, 52), (110, 57), OR, 2.5)
R['autel'] = plan() + f'<rect x="125" y="54" width="9" height="12" rx="1" fill="{OR}"/>'
R['croix'] = plan() + halo(129.5, 60) + f'<rect x="125" y="54" width="9" height="12" rx="1" fill="#e3e8ef"/>' + line((129.5, 55), (129.5, 65), OR, 2.5) + line((126.5, 58), (132.5, 58), OR, 2.5)
R['tabernacle'] = plan() + halo(143, 60) + f'<rect x="139" y="55" width="8" height="10" rx="1" fill="{OR}"/>'
R['lampe du sanctuaire'] = plan() + f'<rect x="139" y="55" width="8" height="10" rx="1" fill="#e3e8ef"/>' + halo(143, 47, 9) + f'<circle cx="143" cy="47" r="4" fill="#d4342a"/>'
R['cierge pascal'] = plan() + halo(110, 70) + line((110, 77), (110, 67), OR, 4) + f'<path d="M110 60 C113 63 113 65 110 66.5 C107 65 107 63 110 60 Z" fill="#f08c1a"/>'
R['crédence'] = plan() + halo(124, 70, 10) + f'<rect x="119" y="67" width="10" height="6" rx="1" fill="{OR}"/>'

# ============================================================ HW Geschiedenis : la frise du temps
# les tijdvakken : (nom, début, fin) ; une frise non proportionnelle, comme dans le cours
TIJD = [('prehistorie', 8, 30), ('oude nabije oosten', 30, 52), ('klassieke oudheid', 52, 74), ('middeleeuwen', 74, 96),
        ('nieuwe tijd', 96, 116), ('nieuwste tijd', 116, 136), ('eigen tijd', 136, 152)]
DATES = [(30, '3500\nv.C.'), (52, '753\nv.C.'), (74, '476'), (96, '1492'), (116, '1789'), (136, '1945')]
def frise(oranges=(), dates=True):
    out = ''
    for nom, a, b in TIJD:
        on = nom in oranges
        out += f'<rect x="{a}" y="46" width="{b - a}" height="18" fill="{OR if on else "#e8ecf2"}" stroke="#ffffff" stroke-width="1.5"/>'
    out += f'<path d="M152 46 L158 55 L152 64 Z" fill="#e8ecf2"/>'
    if dates:
        for x, t in DATES:
            l1, *l2 = t.split('\n')
            proche = any(nom in oranges and (a == x or b == x) for nom, a, b in TIJD)
            col = OR if proche else GR
            out += line((x, 64), (x, 70), col, 1.4) + txt((x, 79), l1, col, 8, w=700)
            if l2: out += txt((x, 88), l2[0], col, 7, w=700)
    return out
H = {}
for nom, a, b in TIJD:
    H[nom] = frise((nom,))
H['oudheid'] = frise(('oude nabije oosten', 'klassieke oudheid'))
H['hedendaagse tijd'] = frise(('nieuwste tijd', 'eigen tijd'))
H['tijdlijn'] = ''.join(f'<rect x="{a}" y="46" width="{b - a}" height="18" fill="{c}" stroke="#ffffff" stroke-width="1.5"/>'
                        for (nom, a, b), c in zip(TIJD, ['#fbe3d2', '#f6c9a8', '#efab7d', '#e88a52', '#e2681f', '#c65a19', '#a84c14'])) \
    + f'<path d="M152 46 L158 55 L152 64 Z" fill="#a84c14"/>' + txt((80, 34), 'het verleden → vandaag', INK, 10)
def axe(marques, orange=None, legende=''):
    """Un axe du temps avec des graduations ; « orange » : (x1, x2) la durée mise en valeur."""
    out = line((8, 70), (152, 70), INK, 2) + f'<path d="M150 66 L156 70 L150 74" fill="none" stroke="{INK}" stroke-width="2"/>'
    for x, t in marques:
        out += line((x, 66), (x, 74), INK, 1.6) + txt((x, 86), t, INK, 8, w=700)
    if orange:
        a, b = orange
        out += f'<rect x="{a}" y="64" width="{b - a}" height="12" fill="{OR}" opacity=".85"/>' + txt(((a + b) / 2, 56), legende, OR, 10)
    return out
H['decennium'] = axe([(20, '1950'), (50, '1960'), (80, '1970'), (110, '1980'), (140, '1990')], (50, 80), '10 jaar')
H['eeuw'] = axe([(20, '1500'), (50, '1600'), (80, '1700'), (110, '1800'), (140, '1900')], (80, 110), '100 jaar')
H['millennium'] = axe([(30, '1'), (90, '1000'), (150, '2000')], (30, 90), '1000 jaar')
H['voor Christus'] = axe([(30, '100 v.C.'), (80, '1'), (130, '100')], (10, 80), '') + f'<circle cx="80" cy="70" r="4" fill="{BL}"/>' + txt((80, 48), 'geboorte van Christus', BL, 9)
H['na Christus'] = axe([(30, '100 v.C.'), (80, '1'), (130, '100')], (80, 150), '') + f'<circle cx="80" cy="70" r="4" fill="{BL}"/>' + txt((80, 48), 'geboorte van Christus', BL, 9)
# dans le tableau, un seul mot pour les deux : « voor Christus, na Christus »
H['voor Christus, na Christus'] = axe([(30, '100 v.C.'), (80, '1'), (130, '100')]) + f'<rect x="10" y="64" width="70" height="12" fill="{BL}" opacity=".7"/><rect x="80" y="64" width="70" height="12" fill="{OR}" opacity=".85"/>' \
    + txt((45, 56), 'v.C.', BL, 11) + txt((115, 56), 'n.C.', OR, 11) + f'<circle cx="80" cy="70" r="4" fill="{INK}"/>' + txt((80, 104), 'geboorte van Christus', INK, 9)
del H['voor Christus'], H['na Christus']
H['startpunt'] = axe([(40, '…'), (80, '1'), (120, '…')]) + f'<circle cx="80" cy="70" r="6" fill="{OR}"/>'
H['islamitische jaartelling'] = axe([(30, '1'), (70, '622'), (130, '2000')], (70, 150), '') + f'<circle cx="70" cy="70" r="5" fill="{OR}"/>' + txt((70, 50), 'Hidjra', OR, 10)
H['Hidjra'] = f'<circle cx="38" cy="62" r="7" fill="{GR}"/>' + txt((38, 86), 'Mekka', INK, 10) + f'<circle cx="122" cy="62" r="7" fill="{GR}"/>' + txt((122, 86), 'Medina', INK, 10) \
    + f'<path d="M50 58 Q80 38 110 58" fill="none" stroke="{OR}" stroke-width="3" stroke-linecap="round"/><path d="M103 51 L110 58 L100 59" fill="none" stroke="{OR}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' + txt((80, 34), '622', OR, 11)
cible.write_text(json.dumps({'Mathématiques': F, 'Religion': R, 'HW Geschiedenis': H}, ensure_ascii=False, indent=1) + '\n')
print(len(F), 'dessins de mathématiques,', len(R), 'de religion,', len(H), "d'histoire, dans", cible)
