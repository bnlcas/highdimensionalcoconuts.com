import json, math, sys
import numpy as np, tifffile
from pyproj import Transformer
from shapely.geometry import LineString, Polygon, Point, MultiLineString
from shapely.ops import unary_union, linemerge

S = sys.argv[1]
d = json.load(open(f'{S}/osm/area.json'))
E = d['elements']
T = Transformer.from_crs(4326, 26910, always_xy=True)
dem = tifffile.imread(f'{S}/dem/dem.tif').astype(float)
x0, y0, x1, y1 = [float(v) for v in open(f'{S}/dem/bbox.txt').read().split(',')]
H, W = dem.shape
res = (x1 - x0) / W
FT = 3.28084

def z(x, y):
    c = (x - x0) / res - 0.5; r = (y1 - y) / res - 0.5
    c0, r0 = int(c), int(r)
    if not (0 <= c0 < W - 1 and 0 <= r0 < H - 1): return float('nan')
    fc, fr = c - c0, r - r0
    a = dem[r0, c0] * (1 - fc) + dem[r0, c0 + 1] * fc
    b = dem[r0 + 1, c0] * (1 - fc) + dem[r0 + 1, c0 + 1] * fc
    return a * (1 - fr) + b * fr

def proj(geom):
    return [T.transform(p['lon'], p['lat']) for p in geom]

ways = {e['id']: e for e in E if e['type'] == 'way'}
out = {}

# park polygon
park = Polygon(proj(ways[158602261]['geometry']))
out['park_acres'] = park.area / 4046.86

# Highway 1 mainline inside park: between Lincoln (south) and Fulton (north)
ylin = T.transform(-122.4773, 37.76545)[1]; yful = T.transform(-122.4718, 37.77314)[1]
ca1 = [w for w in ways.values() if w.get('tags', {}).get('ref') == 'CA 1'
       and w['tags'].get('name') in ('Crossover Drive', 'Park Presidio Bypass Drive')]
spur = [w for w in ways.values() if w.get('tags', {}).get('name') == 'Crossover Drive'
        and w['tags'].get('highway') == 'secondary']
def total_len(ws):
    return sum(LineString(proj(w['geometry'])).length for w in ws)
out['ca1_carriageway_m'] = total_len(ca1)
out['spur_carriageway_m'] = total_len(spur)

# northbound carriageway chain for profile: Crossover NB (87235200,760431406,42385032?,...) -> use merged lines
mainlines = linemerge(MultiLineString([LineString(proj(w['geometry'])) for w in ca1]))
parts = list(mainlines.geoms) if hasattr(mainlines, 'geoms') else [mainlines]
parts.sort(key=lambda l: -l.length)
out['merged_parts_m'] = [round(p.length) for p in parts[:6]]
# centerline approx = average of two longest directional chains
cl_len = (parts[0].length + parts[1].length) / 2 if len(parts) > 1 else parts[0].length
out['centerline_m'] = cl_len
out['centerline_mi'] = cl_len / 1609.34

# profile along longest chain
L = parts[0]
prof = []
n = int(L.length // 10)
for i in range(n + 1):
    p = L.interpolate(i * 10)
    # perpendicular direction
    q = L.interpolate(min(L.length, i * 10 + 5)); r_ = L.interpolate(max(0, i * 10 - 5))
    dx, dy = q.x - r_.x, q.y - r_.y; nrm = math.hypot(dx, dy) or 1
    px, py = -dy / nrm, dx / nrm
    road = z(p.x, p.y)
    side = []
    for off in (-60, -40, -25, 25, 40, 60):
        side.append(z(p.x + px * off, p.y + py * off))
    lat_lon = Transformer.from_crs(26910, 4326, always_xy=True).transform(p.x, p.y)
    prof.append(dict(s=i * 10, x=p.x, y=p.y, lon=lat_lon[0], lat=lat_lon[1], road=road, side=side))
out['profile_dir'] = 'start->end of longest chain'
out['profile'] = [dict(s=a['s'], road_ft=round(a['road'] * FT, 1), lat=round(a['lat'], 5), lon=round(a['lon'], 5),
                       left40=round(a['side'][1] * FT, 1), right40=round(a['side'][4] * FT, 1),
                       left60=round(a['side'][0] * FT, 1), right60=round(a['side'][5] * FT, 1)) for a in prof]
grades = [abs(prof[i + 1]['road'] - prof[i]['road']) / 10 for i in range(len(prof) - 1)]
out['max_grade_pct_10m'] = max(grades) * 100

# lake surfaces / landmarks
def poly_from(eid, kind='way'):
    if kind == 'way': return Polygon(proj(ways[eid]['geometry']))
    rel = [e for e in E if e['type'] == 'relation' and e['id'] == eid][0]
    outers = [LineString(proj(m['geometry'])) for m in rel['members'] if m.get('role') == 'outer' and 'geometry' in m]
    merged = linemerge(MultiLineString(outers))
    gs = merged.geoms if hasattr(merged, 'geoms') else [merged]
    return unary_union([Polygon(g.coords) for g in gs if g.is_ring])

def surface(poly):
    # water surface ~ 10th percentile of DEM samples in the interior (lidar water returns are noisy)
    inner = poly.buffer(-3)
    minx, miny, maxx, maxy = inner.bounds
    vals = []
    for xx in np.arange(minx, maxx, 4):
        for yy in np.arange(miny, maxy, 4):
            if inner.contains(Point(xx, yy)): vals.append(z(xx, yy))
    vals = np.array([v for v in vals if not math.isnan(v)])
    return float(np.median(vals)) if len(vals) else float('nan'), len(vals)

lakes = {'Stow Lake': (12908, 'rel'), 'Lloyd Lake': (100844604, 'way'), 'Elk Glen Lake': (100844313, 'way'),
         'Mallard Lake': (1439751, 'rel'), 'Metson Lake': (100844658, 'way'), 'Middle Lake': (1439752, 'rel'),
         'Spreckels Lake': (16750564, 'way'), 'Lily Pond': (265332416, 'way')}
out['lakes_ft'] = {}
lake_polys = {}
for k, (i, kind) in lakes.items():
    try:
        pg = poly_from(i, kind); lake_polys[k] = pg
        v, nn = surface(pg)
        out['lakes_ft'][k] = (round(v * FT, 1), nn, round(pg.area / 4046.86, 2))
    except Exception as ex:
        out['lakes_ft'][k] = str(ex)

# Strawberry Hill summit: max DEM inside Stow Lake ring
stow = lake_polys.get('Stow Lake')
# Points of interest
pois = {
    'Crossover x MLK signal': (-122.47738, 37.76605),
    'Crossover x JFK (JFK below)': (-122.47920, 37.77074),
    'Transverse Dr midpoint': (-122.47967, 37.76778),
    'Transverse Dr @ MLK': (-122.47851, 37.76617),
    'Lincoln & 19th': (-122.47733, 37.76545),
    'Fulton & Park Presidio': (-122.47180, 37.77314),
    'Fulton & 25th Ave': (-122.48421, 37.77257),
    'Stow Lake Dr west (approx)': (-122.47720, 37.76830),
}
out['poi_ft'] = {k: round(z(*T.transform(*v)) * FT, 1) for k, v in pois.items()}
# summit
best = (-1, None)
for r in range(H):
    pass
sub_mask_vals = []
minx, miny, maxx, maxy = (stow.bounds if stow is not None else (0, 0, 0, 0))
for xx in np.arange(minx, maxx, 3):
    for yy in np.arange(miny, maxy, 3):
        v = z(xx, yy)
        if v > best[0]: best = (v, (xx, yy))
out['strawberry_hill_ft'] = round(best[0] * FT, 1)

# Buffers clipped to park
cl_geom = unary_union([LineString(proj(w['geometry'])) for w in ca1])
sp_geom = unary_union([LineString(proj(w['geometry'])) for w in spur])
allr = unary_union([cl_geom, sp_geom])
out['buffers_acres'] = {}
for ft in (25, 50, 100, 200, 300, 400, 500, 750, 1000):
    m = ft / FT
    out['buffers_acres'][ft] = dict(mainline=round(cl_geom.buffer(m).intersection(park).area / 4046.86, 1),
                                    with_spur=round(allr.buffer(m).intersection(park).area / 4046.86, 1))
# pavement footprint estimate: union of carriageways buffered by half-width (3 lanes*3.6m + shoulders ~ 13m => 6.5m)
out['pavement_acres_est'] = round(cl_geom.buffer(6.5).intersection(park).area / 4046.86, 2)
out['spur_pavement_acres_est'] = round(sp_geom.buffer(4.5).intersection(park).area / 4046.86, 2)

json.dump(out, open(f'{S}/analysis.json', 'w'), indent=1)
# also dump projected geometry for drawing
geo = dict(park=list(park.exterior.coords), ca1=[proj(w['geometry']) for w in ca1], spur=[proj(w['geometry']) for w in spur])
json.dump(geo, open(f'{S}/geo_utm.json', 'w'))
for k, v in out.items():
    if k != 'profile': print(k, v)
print('profile samples', len(out['profile']))
for a in out['profile'][::5]: print(a)
