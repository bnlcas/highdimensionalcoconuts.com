import sys, base64, json, math
S = sys.argv[1]; OUT = sys.argv[2]
src = open(f'{S}/analyze3.py').read()
src = src.replace("json.dump(out, open(f'{S}/analysis3.json', 'w'), indent=1)\nfor k, v in out.items(): print(k, v)", "")
exec(src)
import numpy as np
from shapely.geometry import LineString, Polygon

_,_,_Lq = grid_levels([], Lmain=out['L15']['day']-4.0, Lspur=out['L15_spur_day']-4.0)
grids['quiet'] = _Lq
out['acres_quiet'] = {th: round(float(((_Lq > th) & inpark).sum() * 100 / 4046.86), 1) for th in (50, 55, 57, 60, 65, 67, 70)}
def b64(a): return base64.b64encode(np.ascontiguousarray(a).tobytes()).decode()
# DEM at 5 m
xs5 = np.arange(x0 + 2.5, x1, 5); ys5 = np.arange(y0 + 2.5, y1, 5)
D = np.array([[z(x, y) for x in xs5] for y in ys5]) * FT
D = np.nan_to_num(D, nan=float(np.nanmin(D)))
dem_i16 = np.round(D * 10).astype('<i2')
NZ = {k: np.clip(np.round(v * 2), 0, 255).astype('u1') for k, v in grids.items()}
loc = lambda pts, nd=0: [[round(px - x0, nd), round(py - y0, nd)] for px, py in pts]
def simp(coords, tol=1.0):
    ls = LineString(coords).simplify(tol); return loc(ls.coords)
vec = {'park': loc(LineString(park.exterior.coords).simplify(2).coords)}
lakes = []
for e in E:
    t = e.get('tags', {})
    if t.get('natural') != 'water': continue
    try:
        if e['type'] == 'way':
            pg = Polygon(proj(e['geometry']))
        else:
            from shapely.ops import linemerge as LM
            from shapely.geometry import MultiLineString as MLS
            ls = [LineString(proj(m['geometry'])) for m in e['members'] if m.get('role') == 'outer' and m.get('geometry')]
            mm = LM(MLS(ls)); gs = mm.geoms if hasattr(mm, 'geoms') else [mm]
            pg = Polygon(max(gs, key=lambda g: g.length).coords)
        if pg.area < 150: continue
        holes = []
        if e['type'] == 'relation':
            for m in e['members']:
                if m.get('role') == 'inner' and m.get('geometry') and len(m['geometry']) > 3:
                    holes.append(simp(proj(m['geometry']), 1.0))
        lakes.append(dict(name=t.get('name', ''), ring=simp(pg.exterior.coords, 1.0), holes=holes))
    except Exception as ex:
        pass
vec['lakes'] = lakes
cls = {'ca1': [], 'spur': [], 'promenade': [], 'road': [], 'path': [], 'street': []}
for w in ways.values():
    t = w.get('tags', {}); h = t.get('highway')
    if not h: continue
    pts = proj(w['geometry'])
    if len(pts) < 2: continue
    if t.get('ref') == 'CA 1' and t.get('name') in ('Crossover Drive', 'Park Presidio Bypass Drive'): cls['ca1'].append(simp(pts, 0.5))
    elif t.get('name') == 'Crossover Drive': cls['spur'].append(simp(pts, 0.5))
    elif h == 'pedestrian' or 'Promenade' in (t.get('name') or ''): cls['promenade'].append(simp(pts))
    elif h in ('footway', 'path', 'cycleway', 'steps', 'track'):
        if t.get('footway') in ('sidewalk', 'crossing'): continue
        cls['path'].append(simp(pts, 1.5))
    elif h in ('trunk', 'primary', 'secondary', 'tertiary', 'unclassified', 'residential', 'trunk_link', 'primary_link', 'secondary_link'):
        inside = park.buffer(-5).intersects(LineString(pts))
        (cls['road'] if inside else cls['street']).append(simp(pts))
vec.update(cls)
blds = []
for w in ways.values():
    t = w.get('tags', {})
    if 'building' in t:
        pg = Polygon(proj(w['geometry'])) if len(w['geometry']) > 3 else None
        if pg is None or pg.area < 250: continue
        if not park.contains(pg.centroid): continue
        blds.append(simp(pg.exterior.coords, 1.0))
vec['buildings'] = blds
# centerline stations every 10 m
cl = [[round(C.interpolate(s).x - x0, 1), round(C.interpolate(s).y - y0, 1)] for s in range(0, int(C.length) + 1, 10)]
# long profile
longp = []
for s in range(0, int(C.length) + 1, 10):
    p = C.interpolate(s); q = C.interpolate(min(C.length, s + 5)); r = C.interpolate(max(0, s - 5))
    dx, dy = q.x - r.x, q.y - r.y; n = math.hypot(dx, dy) or 1; px, py = -dy / n, dx / n
    g = [z(p.x + px * o, p.y + py * o) * FT for o in (-40, -30, 30, 40)]
    longp.append([s, round(z(p.x, p.y) * FT, 1), round(min(g[0], g[1]), 1), round(max(g[2], g[3]), 1), round(g[0], 1), round(g[3], 1)])
# fix JFK bridge (bare-earth DEM shows the JFK road below the deck): interpolate road between s=840 and s=910
ss = [r[0] for r in longp]
i0, i1 = ss.index(840), ss.index(910)
for i in range(i0 + 1, i1):
    f = (ss[i] - 840) / 70; longp[i][1] = round(longp[i0][1] * (1 - f) + longp[i1][1] * f, 1)
def section(s, half=130, step=2):
    p = C.interpolate(s); q = C.interpolate(min(C.length, s + 5)); r = C.interpolate(max(0, s - 5))
    dx, dy = q.x - r.x, q.y - r.y; n = math.hypot(dx, dy) or 1; px, py = -dy / n, dx / n
    offs = list(range(-half, half + 1, step))
    return dict(s=s, px=round(px, 4), py=round(py, 4), cx=round(p.x - x0, 1), cy=round(p.y - y0, 1), road=round(z(p.x, p.y) * FT, 1), offs=offs, z=[round(z(p.x + px * o, p.y + py * o) * FT, 1) for o in offs])
sections = {k: section(v) for k, v in dict(bridge=1160, grotto=440, lid=1310, bypass=640).items()}
lab = lambda lon, lat: [round(P(lon, lat)[0] - x0), round(P(lon, lat)[1] - y0)]
labels = {k: lab(*v) for k, v in places.items()}
labels.update({'Strawberry Hill': lab(-122.47485, 37.76862), 'de Young': lab(-122.46876, 37.77146), 'Cal Academy': lab(-122.46610, 37.76990),
               'Spreckels Lake': lab(-122.49400, 37.77100), 'Polo Field': lab(-122.49330, 37.76780), 'Elk Glen': lab(-122.48200, 37.76740),
               'Lloyd Lake': lab(-122.48190, 37.77082), 'Fulton St': lab(-122.4865, 37.7733), 'Lincoln Way': lab(-122.4865, 37.7638),
               '19th Ave': lab(-122.47733, 37.7641), 'Park Presidio': lab(-122.47180, 37.7745)})
data = dict(
    meta=dict(x0=x0, y0=y0, x1=x1, y1=y1, crs='EPSG:26910', dem_res=5, dem_nx=len(xs5), dem_ny=len(ys5), nres=10, nnx=len(xs), nny=len(ys),
              built='2026-11-21', sources='OSM (ODbL) via Overpass 2026-11-21; USGS 3DEP 1/3-arc-second+lidar via 3DEPElevation ImageServer; Caltrans 2024 AADT'),
    dem=b64(dem_i16), noise={k: b64(v) for k, v in NZ.items()}, inpark=b64(inpark.astype('u1')),
    vec=vec, cl=cl, longp=longp, sections=sections, labels=labels,
    bridgeA=dict(e=lab(*out['bridgeA']['east']), w=lab(*out['bridgeA']['west'])),
    grotto=dict(n=lab(*out['bridgeB']['north']), s=lab(*out['bridgeB']['south'])),
    scen=dict(lid=scen['lid'], pearls=scen['pearls'], tunnel=scen['tunnel'], pearls_spur=[[round(cx - x0), round(cy - y0), r] for cx, cy, r in spur_cover['pearls']]),
    stats={k: v for k, v in out.items() if k != 'level_vs_distance_west_of_s1160'},
    level_vs_distance=out['level_vs_distance_west_of_s1160'],
)
js = 'window.CROSSOVER_DATA=' + json.dumps(data, separators=(',', ':')) + ';\n'
open(OUT, 'w').write(js)
print('bytes', len(js), 'dem', dem_i16.shape, 'noise', NZ['existing'].shape, 'paths', len(cls['path']), 'blds', len(blds), 'lakes', len(lakes))
json.dump(data['stats'], open(f'{S}/stats_final.json', 'w'), indent=1)
