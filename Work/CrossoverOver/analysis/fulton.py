import sys
S=sys.argv[1]
src=open(f'{S}/analyze3.py').read().split("# ---------------- noise ----------------")[0]
exec(src)
import heapq, re
from shapely.ops import polygonize
FOOT = {'footway','path','pedestrian','steps','cycleway','service','tertiary','unclassified','residential','secondary','living_street','track','primary','secondary_link','tertiary_link'}
nodes={}; adj={}
def add(a,b,w): adj.setdefault(a,[]).append((b,w)); adj.setdefault(b,[]).append((a,w))
for w in ways.values():
    t=w.get('tags',{})
    if t.get('highway') not in FOOT or t.get('ref')=='CA 1' or t.get('name')=='Crossover Drive': continue
    if t.get('foot')=='no' or t.get('access')=='no': continue
    g=w['geometry']; ns=w['nodes']
    for k in range(1,len(ns)):
        xa,ya=P(g[k-1]['lon'],g[k-1]['lat']); xb,yb=P(g[k]['lon'],g[k]['lat'])
        nodes[ns[k-1]]=(xa,ya); nodes[ns[k]]=(xb,yb); add(ns[k-1],ns[k],math.hypot(xb-xa,yb-ya))
# spur crossings are mapped as footway crossings -> already included (they are footways crossing the spur). Add spur at-grade where Transverse/25th cross: included as their own ways.
def dij(src, extra=()):
    ex={}
    for a,b,w in extra: ex.setdefault(a,[]).append((b,w)); ex.setdefault(b,[]).append((a,w))
    dist={src:0}; pq=[(0,src)]
    while pq:
        d,u=heapq.heappop(pq)
        if d>dist[u]: continue
        for v,w in adj.get(u,[])+ex.get(u,[]):
            nd=d+w
            if nd<dist.get(v,1e18): dist[v]=nd; heapq.heappush(pq,(nd,v))
    return dist
# Fulton x avenue intersections
ful=[w for w in ways.values() if w.get('tags',{}).get('name')=='Fulton Street']
fnodes=set(n for w in ful for n in w['nodes'])
ints={}
for w in ways.values():
    nm=w.get('tags',{}).get('name') or ''
    m=re.match(r'(\d+)(st|nd|rd|th) Avenue$',nm)
    if m and 14<=int(m.group(1))<=27:
        for n in w['nodes']:
            if n in fnodes and n in nodes: ints[int(m.group(1))]=n
    if nm=='Park Presidio Boulevard':
        for n in w['nodes']:
            if n in fnodes and n in nodes: ints[14.5]=n
print('found', sorted(ints))
# targets: the park's spine (JFK Drive / Promenade nodes), boathouse, Lloyd Lake
jfk=set(n for w in ways.values() if (w.get('tags',{}).get('name') or '').startswith('John F') for n in w['nodes'] if n in nodes)
def nearest(lon,lat):
    x,y=P(lon,lat); return min(nodes,key=lambda n:(nodes[n][0]-x)**2+(nodes[n][1]-y)**2)
boat=nearest(-122.47555,37.76935); lloyd=nearest(-122.48190,37.77082)
# Fulton crossing edge from analysis3 (between 17th and 18th)
sB=C.interpolate(440)
def near_named(x,y,pred):
    best=None
    for w in ways.values():
        if not pred(w.get('tags',{})): continue
        for nd in w['nodes']:
            if nd in nodes:
                dd=(nodes[nd][0]-x)**2+(nodes[nd][1]-y)**2
                if best is None or dd<best[0]: best=(dd,nd)
    return best[1]
nB=near_named(sB.x,sB.y+70,lambda t:t.get('name')=='Fulton Street' or t.get('footway')=='sidewalk')
sBn=near_named(sB.x,sB.y-60,lambda t:t.get('highway') in ('footway','path') and t.get('footway')!='sidewalk')
grotto=[(nB,sBn,math.hypot(nodes[nB][0]-nodes[sBn][0],nodes[nB][1]-nodes[sBn][1])*1.3)]
rows=[]
for av in sorted(ints):
    n=ints[av]; d0=dij(n); d1=dij(n,grotto)
    j0=min(d0.get(t,1e9) for t in jfk); j1=min(d1.get(t,1e9) for t in jfk)
    x,y=nodes[n]; jcrow=min(math.hypot(nodes[t][0]-x,nodes[t][1]-y) for t in jfk)
    rows.append(dict(ave=av, jfk_now=round(j0), jfk_grotto=round(j1), jfk_crow=round(jcrow), boat_now=round(d0.get(boat,0)), boat_grotto=round(d1.get(boat,0)), lloyd_now=round(d0.get(lloyd,0))))
for r in rows: print(r)
# Frontage: length of Fulton between Park Presidio and 25th where highway separates Fulton from park interior
fl=unary_union([LineString(proj(w['geometry'])) for w in ful])
x_pp=nodes[ints[14.5]][0]; x25=nodes[ints[25]][0]
from shapely.geometry import box
seg=fl.intersection(box(x25,y0,x_pp,y1))
print('Fulton PP->25th length m', round(seg.length/2 if seg.length>2500 else seg.length), 'raw', round(seg.length))
# park strip cut off: polygonize park boundary + ca1 + spur lines
lines=unary_union([LineString(park.exterior.coords)]+[LineString(proj(w['geometry'])) for w in ca1+spur])
faces=list(polygonize(lines))
ful_line=fl
strip=[f for f in faces if f.area>500 and f.distance(ful_line)<40 and f.centroid.x<x_pp+50 and f.centroid.x>x25-50 and park.contains(f.representative_point())]
tot=sum(f.area for f in strip)/4046.86
print('cut-off strip faces', len(strip), 'acres', round(tot,1), [round(f.area/4046.86,2) for f in strip])
import json
json.dump(dict(rows=rows, strip_acres=round(tot,1), strip=[[ [round(a-x0,1),round(b-y0,1)] for a,b in f.exterior.simplify(1).coords] for f in strip]), open(f'{S}/fulton.json','w'))
# residential buildings north of Fulton between PP and 26th within bbox
cnt=0; area=0
fy_=lambda x: fl.interpolate(fl.project(Point(x,0))).y
for w in ways.values():
    t=w.get('tags',{})
    if 'building' not in t or len(w['geometry'])<4: continue
    pg=Polygon(proj(w['geometry'])); c=pg.centroid
    if x25-100<c.x<x_pp and not park.contains(c) and c.y>park.bounds[3]-200 and fl.distance(c)<330 and c.y>fl.interpolate(fl.project(c)).y:
        cnt+=1; area+=pg.area
print('buildings north of Fulton within 330 m, 14th-26th', cnt, 'footprint acres', round(area/4046.86,1))
