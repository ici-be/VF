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
cible.write_text(json.dumps({'Mathématiques': F}, ensure_ascii=False, indent=1) + '\n')
print(len(F), 'dessins dans', cible)
