import json, math, sys, heapq
import numpy as np, tifffile
from pyproj import Transformer
from shapely.geometry import LineString, Polygon, Point, MultiLineString
from shapely.ops import unary_union, linemerge

S = sys.argv[1]
d = json.load(open(f'{S}/osm/area.json'))
E = d['elements']
T = Transformer.from_crs(4326, 26910, always_xy=True)
TI = Transformer.from_crs(26910, 4326, always_xy=True)
dem = tifffile.imread(f'{S}/dem/dem.tif').astype(float)
x0, y0, x1, y1 = [float(v) for v in open(f'{S}/dem/bbox.txt').read().split(',')]
H, W = dem.shape; res = (x1 - x0) / W; FT = 3.28084
def z(x, y):
    c = (x - x0) / res - 0.5; r = (y1 - y) / res - 0.5
    c0, r0 = int(c), int(r)
    if not (0 <= c0 < W - 1 and 0 <= r0 < H - 1): return float('nan')
    fc, fr = c - c0, r - r0
    return (dem[r0, c0] * (1 - fc) + dem[r0, c0 + 1] * fc) * (1 - fr) + (dem[r0 + 1, c0] * (1 - fc) + dem[r0 + 1, c0 + 1] * fc) * fr
def P(lon, lat): return T.transform(lon, lat)
proj = lambda g: [T.transform(p['lon'], p['lat']) for p in g]
ways = {e['id']: e for e in E if e['type'] == 'way'}
rels = {e['id']: e for e in E if e['type'] == 'relation'}
out = {}

def relpoly(rid):
    r = rels[rid]
    def rings(role):
        ls = [LineString(proj(m['geometry'])) for m in r['members'] if m.get('role') == role and m.get('geometry')]
        if not ls: return []
        mg = linemerge(MultiLineString(ls)); gs = mg.geoms if hasattr(mg, 'geoms') else [mg]
        return [Polygon(g.coords) for g in gs if g.is_ring]
    o = unary_union(rings('outer')); i = unary_union(rings('inner')) if rings('inner') else None
    return o.difference(i) if i is not None else o

def surf(pg):
    inner = pg.buffer(-4); vals = []
    minx, miny, maxx, maxy = inner.bounds
    for xx in np.arange(minx, maxx, 3):
        for yy in np.arange(miny, maxy, 3):
            if inner.contains(Point(xx, yy)): vals.append(z(xx, yy))
    v = np.array(vals); return float(np.percentile(v, 25)), float(np.median(v))
stow = relpoly(12908)
out['stow_lake_surface_ft'] = [round(v * FT, 1) for v in surf(stow)]
out['stow_lake_water_acres'] = round(stow.area / 4046.86, 2)
# Stow Lake west shore point nearest crossover
ca1 = [w for w in ways.values() if w.get('tags', {}).get('ref') == 'CA 1' and w['tags'].get('name') in ('Crossover Drive', 'Park Presidio Bypass Drive')]
spur = [w for w in ways.values() if w.get('tags', {}).get('name') == 'Crossover Drive' and w['tags'].get('highway') == 'secondary']
cl = unary_union([LineString(proj(w['geometry'])) for w in ca1])
out['stow_shore_to_highway_m'] = round(stow.exterior.distance(cl), 1)

# ---- cross sections for drawings ----
mg = linemerge(MultiLineString([LineString(proj(w['geometry'])) for w in ca1]))
chains = sorted(mg.geoms, key=lambda l: -l.length)
A, B = chains[0], chains[1]
# centerline: sample A, find nearest on B, average
cpts = []
for i in range(0, int(A.length), 5):
    p = A.interpolate(i); q = B.interpolate(B.project(p))
    cpts.append(((p.x + q.x) / 2, (p.y + q.y) / 2, p.distance(q)))
C = LineString([(a, b) for a, b, _ in cpts])
out['centerline_len_m'] = round(C.length, 1)
sep = [c for *_, c in cpts]
out['carriageway_separation_m'] = dict(min=round(min(sep), 1), max=round(max(sep), 1), median=round(float(np.median(sep)), 1))

stations = []
for s in range(0, int(C.length) + 1, 10):
    p = C.interpolate(s); q = C.interpolate(min(C.length, s + 5)); r = C.interpolate(max(0, s - 5))
    dx, dy = q.x - r.x, q.y - r.y; n = math.hypot(dx, dy) or 1
    px, py = -dy / n, dx / n
    offs = list(range(-120, 121, 4))
    prof = [round(z(p.x + px * o, p.y + py * o) * FT, 1) for o in offs]
    lon, lat = TI.transform(p.x, p.y)
    stations.append(dict(s=s, lon=round(lon, 6), lat=round(lat, 6), x=round(p.x, 1), y=round(p.y, 1), nx=round(px, 4), ny=round(py, 4), road=round(z(p.x, p.y) * FT, 1), offs=offs, prof=prof))
out['n_stations'] = len(stations)
json.dump(stations, open(f'{S}/sections.json', 'w'))
# summary cut/fill: for each station, ground at +-30m vs road
cut = []
for st in stations:
    i30, j30 = st['offs'].index(-32), st['offs'].index(32)
    cut.append((st['s'], st['road'], st['prof'][i30], st['prof'][j30]))
out['sections_summary'] = cut[::8]

# ---- pedestrian network ----
FOOT = {'footway', 'path', 'pedestrian', 'steps', 'cycleway', 'service', 'tertiary', 'unclassified', 'residential', 'secondary', 'living_street', 'track', 'primary', 'secondary_link', 'tertiary_link'}
nodes = {}; adj = {}
def add(a, b, w):
    adj.setdefault(a, []).append((b, w)); adj.setdefault(b, []).append((a, w))
for w in ways.values():
    t = w.get('tags', {})
    if t.get('highway') not in FOOT: continue
    if t.get('ref') == 'CA 1': continue
    if t.get('foot') == 'no' or t.get('access') == 'no': continue
    if t.get('name') == 'Crossover Drive':  # spur: walkable only via crossings; no walking along it
        continue
    g = w['geometry']; ns = w['nodes']
    for k in range(1, len(ns)):
        xa, ya = P(g[k - 1]['lon'], g[k - 1]['lat']); xb, yb = P(g[k]['lon'], g[k]['lat'])
        nodes[ns[k - 1]] = (xa, ya); nodes[ns[k]] = (xb, yb)
        add(ns[k - 1], ns[k], math.hypot(xb - xa, yb - ya))
def nearest(x, y):
    return min(nodes, key=lambda n: (nodes[n][0] - x) ** 2 + (nodes[n][1] - y) ** 2)
def dijkstra(src, extra=()):
    ex = {}
    for a, b, w in extra:
        ex.setdefault(a, []).append((b, w)); ex.setdefault(b, []).append((a, w))
    dist = {src: 0}; pq = [(0, src)]
    while pq:
        dd, u = heapq.heappop(pq)
        if dd > dist[u]: continue
        for v, w in adj.get(u, []) + ex.get(u, []):
            nd = dd + w
            if nd < dist.get(v, 1e18): dist[v] = nd; heapq.heappush(pq, (nd, v))
    return dist

places = {
    'Stow Lake Boathouse': (-122.47555, 37.76935),
    'Strawberry Hill summit': (-122.47485, 37.76862),
    'Stow Lake west shore': (-122.47712, 37.76800),
    'Rose Garden': (-122.46717, 37.77182),
    'de Young Museum': (-122.46876, 37.77146),
    'Lloyd Lake / Portals of the Past': (-122.48190, 37.77082),
    'Elk Glen Lake': (-122.48200, 37.76740),
    'Speedway Meadow': (-122.48700, 37.77000),
    'Lindley Meadow': (-122.48930, 37.76880),
    'Marx Meadow': (-122.48530, 37.77140),
    'Polo Field': (-122.49330, 37.76780),
    'Spreckels Lake': (-122.49400, 37.77100),
}
pn = {k: nearest(*P(*v)) for k, v in places.items()}
out['place_snap_m'] = {k: round(math.hypot(nodes[pn[k]][0] - P(*places[k])[0], nodes[pn[k]][1] - P(*places[k])[1]), 1) for k in places}

# proposed crossings: (1) Stow-Transverse bridge mid-segment; (2) MLK grade separation is a safety/time fix (same geometry)
# Bridge: west landing on Transverse Drive Trail, east landing at Stow Lake Drive west side, near lat 37.7682
def nearest_filtered(x, y, maxd_from_cl_min, side):
    best = None
    for n, (a, b) in nodes.items():
        dcl = cl.distance(Point(a, b))
        if dcl < maxd_from_cl_min: continue
        # side test: east (positive x relative to centerline) or west
        q = cl.interpolate(cl.project(Point(a, b)))
        if side == 'W' and a > q.x: continue
        if side == 'E' and a < q.x: continue
        dd = (a - x) ** 2 + (b - y) ** 2
        if best is None or dd < best[0]: best = (dd, n)
    return best[1]
bx, by = P(-122.47840, 37.76830)
wl = nearest_filtered(bx - 40, by, 12, 'W'); el = nearest_filtered(bx + 40, by, 12, 'E')
span = math.hypot(nodes[wl][0] - nodes[el][0], nodes[wl][1] - nodes[el][1])
out['bridge_landings'] = dict(west=TI.transform(*nodes[wl]), east=TI.transform(*nodes[el]), straight_m=round(span, 1),
                              z_west_ft=round(z(*nodes[wl]) * FT, 1), z_east_ft=round(z(*nodes[el]) * FT, 1), road_ft=round(z(bx, by) * FT, 1))
bridge = [(wl, el, span * 1.15)]
# second bridge: over the Park Presidio Bypass to reach the north strip / Fulton between 19th and 22nd (no crossing today)
bx2, by2 = P(-122.47650, 37.77245)
nl = nearest_filtered(bx2, by2 + 35, 10, 'E'); sl = nearest_filtered(bx2, by2 - 35, 10, 'W')

pairs = [('Stow Lake Boathouse', 'Lloyd Lake / Portals of the Past'), ('Stow Lake west shore', 'Elk Glen Lake'),
         ('Strawberry Hill summit', 'Speedway Meadow'), ('Stow Lake west shore', 'Lindley Meadow'),
         ('de Young Museum', 'Polo Field'), ('Rose Garden', 'Spreckels Lake'), ('Stow Lake Boathouse', 'Marx Meadow'),
         ('Strawberry Hill summit', 'Elk Glen Lake')]
res_pairs = []
for a, b in pairs:
    d0 = dijkstra(pn[a]).get(pn[b]); d1 = dijkstra(pn[a], bridge).get(pn[b])
    xa, ya = P(*places[a]); xb, yb = P(*places[b])
    crow = math.hypot(xb - xa, yb - ya)
    res_pairs.append(dict(a=a, b=b, crow_m=round(crow), now_m=round(d0) if d0 else None, bridge_m=round(d1) if d1 else None,
                          lid_m=round(min(d1 or 1e9, crow * 1.25))))
out['pairs'] = res_pairs

# catchment: share of walkable network nodes within 800 m (10 min) of Stow Lake west shore, now vs bridge
src = pn['Stow Lake west shore']
for lab, ex in (('now', ()), ('bridge', bridge)):
    dd = dijkstra(src, ex)
    west = [n for n, v in dd.items() if v <= 800 and nodes[n][0] < cl.interpolate(cl.project(Point(*nodes[n]))).x and cl.distance(Point(*nodes[n])) > 15]
    out[f'west_nodes_10min_{lab}'] = len(west)
json.dump(out, open(f'{S}/analysis2.json', 'w'), indent=1)
for k, v in out.items(): print(k, v)
