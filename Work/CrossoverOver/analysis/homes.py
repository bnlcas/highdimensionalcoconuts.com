import sys
S=sys.argv[1]
src=open(f'{S}/analyze3.py').read().split("# ---------------- walking network")[0]
exec(src)
streets=[LineString(proj(w['geometry'])) for w in ways.values() if w.get('tags',{}).get('name') in ('Fulton Street','Lincoln Way','19th Avenue','Park Presidio Boulevard') and w['tags'].get('ref')!='CA 1' or (w.get('tags',{}).get('name') in ('19th Avenue','Park Presidio Boulevard'))]
SL=unary_union(streets)
res={}
cnt=0;rows=[]
for w in ways.values():
    t=w.get('tags',{})
    if 'building' not in t or len(w['geometry'])<4: continue
    pg=Polygon(proj(w['geometry']))
    if pg.area<40 or park.contains(pg.centroid): continue
    c=pg.centroid
    if cl.distance(c) if False else C.distance(c)>450: continue
    ci=int(round((c.x-xs[0])/10)); ri=int(round((c.y-ys[0])/10))
    if not(0<=ci<len(xs) and 0<=ri<len(ys)): continue
    bg=62 if SL.distance(c)<35 else 52
    def tot(L): return 10*math.log10(10**(L/10)+10**(bg/10))
    b=tot(grids['existing'][ri,ci]); a=tot(grids['tunnel'][ri,ci]); l=tot(grids['lid'][ri,ci]); p=tot(grids['pearls'][ri,ci])
    rows.append((b,a,l,p,pg.area))
import numpy as np
r=np.array(rows)
def gain(after):
    d=np.maximum(0,np.minimum(r[:,0],r[:,0])-np.maximum(after,55)); d=np.where(r[:,0]>55,np.maximum(0,r[:,0]-np.maximum(after,55)),0); return d
for k,i in (('tunnel',1),('lid',2),('pearls',3)):
    d=gain(r[:,i]); print(k,'buildings',len(r),'with >=1dB gain',int((d>=1).sum()),'>=3dB',int((d>=3).sum()),'sum dB',round(d.sum(),1),'mean dB of benefitting',round(d[d>=1].mean() if (d>=1).any() else 0,2))
print('existing >60 dBA total at bldgs', int((r[:,0]>60).sum()), '>65', int((r[:,0]>65).sum()))
