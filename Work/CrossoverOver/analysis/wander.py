"""Freedom to wander: which crossings carry cross-Crossover walks, and how much longer those walks are."""
import sys, random
S = sys.argv[1]
src = open(f'{S}/analyze3.py').read().split("# ---------------- noise ----------------")[0]
exec(src)
exec(open(f'{S}/analyze3.py').read().split("# ---------------- walking network ----------------")[1].split("places = {")[0])  # nodes, adj, dijkstra, bridges
from shapely.ops import unary_union
barrier = unary_union([LineString(proj(w['geometry'])) for w in ca1 + spur]).buffer(6)
parts = sorted([g for g in park.difference(barrier).geoms], key=lambda g: -g.area)
print('park parts (acres):', [round(g.area / 4046.86, 1) for g in parts[:6]])
W_, E_ = parts[0], parts[1]
# which is west? smaller mean x
if W_.centroid.x > E_.centroid.x: W_, E_ = E_, W_
pW, pE = prepared.prep(W_), prepared.prep(E_)
def side(n):
    p = Point(nodes[n]); return 'W' if pW.contains(p) else ('E' if pE.contains(p) else None)
ins = [n for n in nodes if ppark.contains(Point(nodes[n]))]
west = [n for n in ins if side(n) == 'W']; east = [n for n in ins if side(n) == 'E']
print('nodes west', len(west), 'east', len(east))
def tree(srcn, extra=()):
    ex = {}
    for a, b, w in extra: ex.setdefault(a, []).append((b, w)); ex.setdefault(b, []).append((a, w))
    dist = {srcn: 0}; prev = {}; pq = [(0, srcn)]
    while pq:
        dd, u = heapq.heappop(pq)
        if dd > dist[u]: continue
        for v, w in adj.get(u, []) + ex.get(u, []):
            nd = dd + w
            if nd < dist.get(v, 1e18): dist[v] = nd; prev[v] = u; heapq.heappush(pq, (nd, v))
    return dist, prev
Cl = C
def gate(path):
    for a, b in zip(path, path[1:]):
        seg = LineString([nodes[a], nodes[b]]) if a in nodes and b in nodes else None
        if seg is None: continue
        if seg.intersects(Cl):
            s_ = Cl.project(seg.intersection(Cl).representative_point())
            return 'Fulton & Park Presidio' if s_ < 150 else 'JFK underpass' if 780 < s_ < 960 else 'MLK signal' if 1380 < s_ < 1465 else 'Lincoln & 19th' if s_ >= 1465 else f'other s={int(s_)}'
    return 'new crossing'
random.seed(1)
sw = random.sample(west, 160); se = set(random.sample(east, 400))
res = {'today': [], 'crossings': []}
for scen, extra in (('today', ()), ('crossings', bridges)):
    for o in sw:
        dist, prev = tree(o, extra)
        for d in se:
            crow = math.dist(nodes[o], nodes[d])
            if crow > 1500 or d not in dist: continue
            path = [d]
            while path[-1] != o: path.append(prev[path[-1]])
            res[scen].append((crow, dist[d], gate(path[::-1])))
from collections import Counter
for scen, rows in res.items():
    n = len(rows); c = Counter(g for _, _, g in rows)
    r = sorted(d / cr for cr, d, _ in rows)
    near = [d / cr for cr, d, _ in rows if cr < 600]
    print(f'\n{scen}: {n} west-east pairs within 1.5 km')
    for g, k in c.most_common(): print(f'   {g:24s} {100*k/n:5.1f}%')
    print(f'   detour: median {r[n//2]:.2f}, 90th pct {r[int(.9*n)]:.2f}; pairs <600 m apart: median {sorted(near)[len(near)//2]:.2f} (n={len(near)})')
# same-side baseline
rows = []
for o in random.sample(west, 80):
    dist, _ = tree(o)
    for d in random.sample(west, 200):
        crow = math.dist(nodes[o], nodes[d])
        if 100 < crow < 1500 and d in dist: rows.append(dist[d] / crow)
rows.sort(); print(f'\nsame side (west-west) baseline detour: median {rows[len(rows)//2]:.2f}, 90th pct {rows[int(.9*len(rows))]:.2f}')
