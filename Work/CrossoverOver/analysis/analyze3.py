"""Noise grid + walking-network detours + export of drawing data."""
import json, math, sys, heapq
import numpy as np, tifffile
from pyproj import Transformer
from shapely.geometry import LineString, Polygon, Point, MultiLineString
from shapely.ops import unary_union, linemerge
from shapely import prepared

S = sys.argv[1]
d = json.load(open(f'{S}/osm/area.json')); E = d['elements']
T = Transformer.from_crs(4326, 26910, always_xy=True); TI = Transformer.from_crs(26910, 4326, always_xy=True)
dem = tifffile.imread(f'{S}/dem/dem.tif').astype(float)
x0, y0, x1, y1 = [float(v) for v in open(f'{S}/dem/bbox.txt').read().split(',')]
H, W = dem.shape; res = (x1 - x0) / W; FT = 3.28084
def z(x, y):
    c = (x - x0) / res - 0.5; r = (y1 - y) / res - 0.5; c0, r0 = int(c), int(r)
    if not (0 <= c0 < W - 1 and 0 <= r0 < H - 1): return float('nan')
    fc, fr = c - c0, r - r0
    return (dem[r0, c0] * (1 - fc) + dem[r0, c0 + 1] * fc) * (1 - fr) + (dem[r0 + 1, c0] * (1 - fc) + dem[r0 + 1, c0 + 1] * fc) * fr
P = lambda lon, lat: T.transform(lon, lat)
proj = lambda g: [T.transform(p['lon'], p['lat']) for p in g]
ways = {e['id']: e for e in E if e['type'] == 'way'}
park = Polygon(proj(ways[158602261]['geometry'])); ppark = prepared.prep(park)
ca1 = [w for w in ways.values() if w.get('tags', {}).get('ref') == 'CA 1' and w['tags'].get('name') in ('Crossover Drive', 'Park Presidio Bypass Drive')]
spur = [w for w in ways.values() if w.get('tags', {}).get('name') == 'Crossover Drive' and w['tags'].get('highway') == 'secondary']
mg = linemerge(MultiLineString([LineString(proj(w['geometry'])) for w in ca1]))
chains = sorted(mg.geoms, key=lambda l: -l.length); A, B = chains[0], chains[1]
cpts = []
for i in range(0, int(A.length), 5):
    p = A.interpolate(i); q = B.interpolate(B.project(p)); cpts.append(((p.x + q.x) / 2, (p.y + q.y) / 2))
C = LineString(cpts)  # centerline, s=0 at Fulton/Park Presidio, increasing toward Lincoln
out = {}

# ---------------- noise ----------------
def remel(S_kmh):
    return dict(auto=38.1 * math.log10(S_kmh) - 2.4, med=33.9 * math.log10(S_kmh) + 16.4, heavy=24.6 * math.log10(S_kmh) + 38.5)
def L15(N, S_kmh, trk=0.0156, med_share=0.685):
    r = remel(S_kmh); n = dict(auto=N * (1 - trk), med=N * trk * med_share, heavy=N * trk * (1 - med_share))
    tot = sum(10 ** ((r[k] + 10 * math.log10(n[k] * math.pi * 15 / (1000 * S_kmh))) / 10) for k in r if n[k] > 0)
    return 10 * math.log10(tot)
AADT = 71000; PEAK = 5200
DAY = 0.80 * AADT / 15  # avg hour 7am-10pm
cases = {'day': (DAY, 61), 'peak': (PEAK, 56)}
out['L15'] = {k: round(L15(*v), 1) for k, v in cases.items()}
# spur: assumed 8,000 ADT at 40 km/h (assumption flagged)
SPUR_ADT = 8000
out['L15_spur_day'] = round(L15(0.8 * SPUR_ADT / 15, 40), 1)

# discretise sources: 5 m elements along each carriageway with station s (from centerline projection)
src = []
for w in ca1:
    L = LineString(proj(w['geometry']))
    for i in np.arange(2.5, L.length, 5):
        p = L.interpolate(i); src.append((p.x, p.y, C.project(p), 'main'))
for w in spur:
    L = LineString(proj(w['geometry']))
    for i in np.arange(2.5, L.length, 5):
        p = L.interpolate(i); src.append((p.x, p.y, -1, 'spur'))
src = np.array([(a, b, c, 1 if t == 'spur' else 0) for a, b, c, t in src])
# each carriageway carries half the volume -> per-carriageway L15 is L15-3; element energy: I = I15 * (15/pi) * dl / r^2 * (15/r)^alpha
def grid_levels(covered, alpha=0.5, Lmain=None, Lspur=None, portal_db=-3, spur_cover=()):
    Lmain = Lmain if Lmain is not None else out['L15']['day']; Lspur = Lspur if Lspur is not None else out['L15_spur_day']
    I_main = 10 ** ((Lmain - 3) / 10); I_spur = 10 ** ((Lspur - 3) / 10)
    keep = np.ones(len(src), bool)
    wts = np.where(src[:, 3] == 1, I_spur, I_main).astype(float)
    for (sa, sb) in covered:
        m = (src[:, 3] == 0) & (src[:, 2] >= sa) & (src[:, 2] <= sb)
        keep &= ~m
        # portal re-radiation: a tunnel mouth radiates roughly like the open road continuing; we add a lumped source
    spur_portals = []
    for (cx, cy, rad) in spur_cover:  # spur lids: remove spur elements within rad of (cx, cy); portals at the two farthest removed elements
        m = (src[:, 3] == 1) & (np.hypot(src[:, 0] - cx, src[:, 1] - cy) <= rad)
        keep &= ~m
        idx = np.where(m)[0]
        if len(idx): spur_portals += [src[idx[0], :2], src[idx[-1], :2]]
    sx, sy, sw = src[keep, 0], src[keep, 1], wts[keep]
    xs = np.arange(x0 + 5, x1, 10); ys = np.arange(y0 + 5, y1, 10)
    GX, GY = np.meshgrid(xs, ys)
    I = np.zeros_like(GX)
    for k in range(0, len(sx), 400):
        dx = GX[..., None] - sx[None, None, k:k + 400]; dy = GY[..., None] - sy[None, None, k:k + 400]
        r = np.maximum(np.hypot(dx, dy), 8.0)
        I += (sw[None, None, k:k + 400] * (15 / math.pi) * 5 / r ** 2 * (15 / r) ** alpha).sum(-1)
    # portals: for each covered range add point sources at both ends with energy of 30 m of open road
    for (sa, sb) in covered:
        for s_ in (sa, sb):
            p = C.interpolate(s_)
            r = np.maximum(np.hypot(GX - p.x, GY - p.y), 8.0)
            I += 2 * I_main * (15 / math.pi) * 30 * 10 ** (portal_db / 10) / r ** 2 * (15 / r) ** alpha
    for (px_, py_) in spur_portals:  # one-way carriageway: one element's worth of spur energy per mouth
        r = np.maximum(np.hypot(GX - px_, GY - py_), 8.0)
        I += I_spur * (15 / math.pi) * 30 * 10 ** (portal_db / 10) / r ** 2 * (15 / r) ** alpha
    return xs, ys, 10 * np.log10(np.maximum(I, 1e-3))

inpark = None
# String of Lids (Nov 21 layout): two 200 m (656 ft) lids on the Strawberry Hill bench with a 100 m gap,
# one 240 m (787 ft) lid on the bypass centered between Fulton & 17th (s=390) and 18th (s=490),
# and a ~100 m lid on the 25th Ave spur where the 22nd Ave path crosses it. A sweep of two-lid placements on the
# bench (L 180-240 m, gap 60-150 m) is in the Nov 21 notes; a 60 m gap gains only ~1 acre over 100 m.
SPUR22 = P(-122.48101, 37.77182)
scen = {
    'existing': [],
    'lid': [(1210, 1410)],              # first lid of the string: Strawberry Hill south, 200 m (656 ft)
    'tunnel': [(170, 1360)],            # full cut-and-cover, ~1190 m
    'pearls': [(910, 1110), (1210, 1410), (320, 560)],
}
spur_cover = {'pearls': [(SPUR22[0], SPUR22[1], 50)]}
grids = {}
for name, cov in scen.items():
    xs, ys, Lg = grid_levels(cov, spur_cover=spur_cover.get(name, ()))
    if inpark is None:
        inpark = np.array([[ppark.contains(Point(x, y)) for x in xs] for y in ys])
    cell_ac = 100 / 4046.86
    out[f'acres_{name}'] = {th: round(float(((Lg > th) & inpark).sum() * cell_ac), 1) for th in (50, 55, 57, 60, 65, 67, 70)}
    grids[name] = Lg
# sensitivity: hard ground for existing
_, _, Lh = grid_levels([], alpha=0.0)
out['acres_existing_hardground'] = {th: round(float(((Lh > th) & inpark).sum() * 100 / 4046.86), 1) for th in (55, 60, 65)}
_, _, Lp = grid_levels([], Lmain=out['L15']['peak'])
out['acres_existing_peak'] = {th: round(float(((Lp > th) & inpark).sum() * 100 / 4046.86), 1) for th in (55, 60, 65)}
# distance from centerline (perpendicular, mid-segment) to thresholds, existing day
st = C.interpolate(1160); q = C.interpolate(1165)
nx, ny = -(q.y - st.y), (q.x - st.x); nn = math.hypot(nx, ny); nx, ny = nx / nn, ny / nn
prof = []
for off in range(10, 600, 5):
    for sgn in (-1,):
        X, Y = st.x + sgn * nx * off, st.y + sgn * ny * off
        ci = int(round((X - xs[0]) / 10)); ri = int(round((Y - ys[0]) / 10))
        if 0 <= ci < len(xs) and 0 <= ri < len(ys): prof.append((off, round(float(grids['existing'][ri, ci]), 1)))
out['level_vs_distance_west_of_s1160'] = prof[::6]
np.savez_compressed(f'{S}/noise.npz', xs=xs, ys=ys, inpark=inpark, **grids)

# ---------------- walking network ----------------
FOOT = {'footway', 'path', 'pedestrian', 'steps', 'cycleway', 'service', 'tertiary', 'unclassified', 'residential', 'secondary', 'living_street', 'track', 'primary', 'secondary_link', 'tertiary_link'}
nodes = {}; adj = {}
def add(a, b, w):
    adj.setdefault(a, []).append((b, w)); adj.setdefault(b, []).append((a, w))
for w in ways.values():
    t = w.get('tags', {})
    if t.get('highway') not in FOOT or t.get('ref') == 'CA 1' or t.get('name') == 'Crossover Drive': continue
    if t.get('foot') == 'no' or t.get('access') == 'no': continue
    g = w['geometry']; ns = w['nodes']
    for k in range(1, len(ns)):
        xa, ya = P(g[k - 1]['lon'], g[k - 1]['lat']); xb, yb = P(g[k]['lon'], g[k]['lat'])
        nodes[ns[k - 1]] = (xa, ya); nodes[ns[k]] = (xb, yb); add(ns[k - 1], ns[k], math.hypot(xb - xa, yb - ya))
def near_named(x, y, pred):
    best = None
    for w in ways.values():
        if not pred(w.get('tags', {})): continue
        for nd in w['nodes']:
            if nd in nodes:
                dd = (nodes[nd][0] - x) ** 2 + (nodes[nd][1] - y) ** 2
                if best is None or dd < best[0]: best = (dd, nd)
    return best[1]
def dijkstra(srcn, extra=()):
    ex = {}
    for a, b, w in extra: ex.setdefault(a, []).append((b, w)); ex.setdefault(b, []).append((a, w))
    dist = {srcn: 0}; pq = [(0, srcn)]
    while pq:
        dd, u = heapq.heappop(pq)
        if dd > dist[u]: continue
        for v, w in adj.get(u, []) + ex.get(u, []):
            nd = dd + w
            if nd < dist.get(v, 1e18): dist[v] = nd; heapq.heappush(pq, (nd, v))
    return dist
# Bridge A "Strawberry Hill Bridge": Stow Lake Drive (west side) <-> Transverse Drive Trail, crossing at s~1160
sA = C.interpolate(1160)
eA = near_named(sA.x + 70, sA.y, lambda t: (t.get('name') or '').startswith('Blue Heron Lake Drive'))
wA = near_named(sA.x - 70, sA.y, lambda t: t.get('name') in ('Transverse Drive Trail', 'Transverse Drive'))
lenA = math.hypot(nodes[eA][0] - nodes[wA][0], nodes[eA][1] - nodes[wA][1])
out['bridgeA'] = dict(east=TI.transform(*nodes[eA]), west=TI.transform(*nodes[wA]), straight_m=round(lenA), z_east_ft=round(z(*nodes[eA]) * FT), z_west_ft=round(z(*nodes[wA]) * FT))
pathA = lenA * 1.6  # deck + 5% descent ramp on the west side
# Bridge B "Fulton crossing": over/under the Bypass between Fulton & 17th and 18th (s~440), Fulton St sidewalk (north) <-> park path (south)
sB = C.interpolate(440)
nB = near_named(sB.x, sB.y + 70, lambda t: t.get('name') == 'Fulton Street' or t.get('footway') == 'sidewalk')
sBn = near_named(sB.x, sB.y - 60, lambda t: t.get('highway') in ('footway', 'path') and t.get('footway') != 'sidewalk')
lenB = math.hypot(nodes[nB][0] - nodes[sBn][0], nodes[nB][1] - nodes[sBn][1])
out['bridgeB'] = dict(north=TI.transform(*nodes[nB]), south=TI.transform(*nodes[sBn]), straight_m=round(lenB), z_n_ft=round(z(*nodes[nB]) * FT), z_s_ft=round(z(*nodes[sBn]) * FT))
pathB = lenB * 1.3
ex0,ey0 = P(-122.48150, 37.76790)
elkN = min((n for n in nodes if math.hypot(nodes[n][0]-ex0, nodes[n][1]-ey0) < 60 and n != wA), key=lambda n: math.hypot(nodes[n][0]-ex0, nodes[n][1]-ey0))
trailA = math.hypot(nodes[elkN][0]-nodes[wA][0], nodes[elkN][1]-nodes[wA][1]) * 1.2
out['bridgeA_trail_m'] = round(trailA)
bridges = [(eA, wA, pathA), (wA, elkN, trailA), (nB, sBn, pathB)]

places = {
    'Blue Heron Lake Boathouse': (-122.47555, 37.76935), 'Strawberry Hill summit': (-122.47485, 37.76862),
    'Blue Heron Lake (west shore)': (-122.47712, 37.76800), 'de Young Museum': (-122.46876, 37.77146),
    'Lloyd Lake / Portals of the Past': (-122.48190, 37.77082), 'Elk Glen Lake': (-122.48200, 37.76740),
    'Speedway Meadow': (-122.48700, 37.77000), 'Lindley Meadow': (-122.48930, 37.76880),
    'Marx Meadow': (-122.48530, 37.77140), 'Fulton St & 20th Ave': (-122.47870, 37.77300),
    'Fulton St & 22nd Ave': (-122.48090, 37.77290), 'Rainbow Falls / Prayer Book Cross': (-122.47760, 37.77130),
    'Middle Lake': (-122.49930, 37.76700), 'Japanese Tea Garden': (-122.47090, 37.77010), 'Fulton St & 17th Ave': (-122.47510, 37.77320),
}
pn = {}
for k, v in places.items():
    x, y = P(*v); pn[k] = min(nodes, key=lambda n: (nodes[n][0] - x) ** 2 + (nodes[n][1] - y) ** 2)
pairs = [('Blue Heron Lake (west shore)', 'Elk Glen Lake'), ('Strawberry Hill summit', 'Elk Glen Lake'), ('Blue Heron Lake Boathouse', 'Lloyd Lake / Portals of the Past'),
         ('Blue Heron Lake (west shore)', 'Lindley Meadow'), ('Blue Heron Lake Boathouse', 'Marx Meadow'), ('Blue Heron Lake (west shore)', 'Middle Lake'),
         ('Fulton St & 20th Ave', 'Blue Heron Lake Boathouse'), ('Fulton St & 20th Ave', 'Japanese Tea Garden'), ('Fulton St & 22nd Ave', 'Rainbow Falls / Prayer Book Cross'),
         ('Fulton St & 20th Ave', 'de Young Museum'), ('Fulton St & 17th Ave', 'Blue Heron Lake Boathouse'), ('Fulton St & 17th Ave', 'Japanese Tea Garden')]
rows = []
for a, b in pairs:
    d0 = dijkstra(pn[a]).get(pn[b]); d1 = dijkstra(pn[a], bridges).get(pn[b])
    xa, ya = P(*places[a]); xb, yb = P(*places[b]); crow = math.hypot(xb - xa, yb - ya)
    rows.append(dict(a=a, b=b, crow=round(crow), now=round(d0), bridges=round(d1), tunnel=round(min(d1, crow * 1.3))))
out['pairs'] = rows
json.dump(out, open(f'{S}/analysis3.json', 'w'), indent=1)
for k, v in out.items(): print(k, v)
