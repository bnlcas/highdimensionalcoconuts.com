import sys, random
S = sys.argv[1]
exec(open(f'{S}/wander.py').read().split("random.seed(1)")[0].replace("S = sys.argv[1]", ""))
# edges that cross the mainline, by station
cross_edges = {}
for u in adj:
    for v, w in adj[u]:
        if u < v:
            seg = LineString([nodes[u], nodes[v]])
            if seg.intersects(C):
                cross_edges[(u, v)] = C.project(seg.intersection(C).representative_point())
mlk = {k for k, s_ in cross_edges.items() if not (780 < s_ < 960)}  # every at-grade crossing of the six lanes
print('mainline-crossing edges:', sorted(round(s_) for s_ in cross_edges.values()))
def run(src_, extra=(), pen=0):
    ex = {}
    for a, b, w in extra: ex.setdefault(a, []).append((b, w)); ex.setdefault(b, []).append((a, w))
    dist = {src_: 0}; pq = [(0, src_)]
    while pq:
        dd, u = heapq.heappop(pq)
        if dd > dist[u]: continue
        for v, w in adj.get(u, []) + ex.get(u, []):
            nd = dd + w + (pen if ((u, v) in mlk or (v, u) in mlk) else 0)
            if nd < dist.get(v, 1e18): dist[v] = nd; heapq.heappush(pq, (nd, v))
    return dist
# 10-minute reach: park nodes within 800 m walk, converted to area via a 20 m grid of reached cells
def reach_acres(dist, lim=800):
    cells = set((int(nodes[n][0] // 20), int(nodes[n][1] // 20)) for n, d in dist.items() if d <= lim and n in insset)
    return len(cells) * 400 / 4046.86
insset = set(ins)
spots = {'Blue Heron Lake, west shore': (-122.47712, 37.76800), 'Strawberry Hill summit': (-122.47485, 37.76862),
         'Elk Glen Lake': (-122.48200, 37.76740), 'Lloyd Lake': (-122.48190, 37.77082), 'Hellman Hollow': (-122.48700, 37.77000),
         'Fulton & 18th Ave': (-122.47625, 37.77302), 'Rainbow Falls': (-122.47760, 37.77130)}
print('\n10-minute walk (800 m): acres of park within reach [walk-network cells, 20 m]')
print('(today -> with the Strawberry Hill and Fulton crossings)')
for k, v in spots.items():
    x, y = P(*v); n0 = min(nodes, key=lambda n: (nodes[n][0] - x) ** 2 + (nodes[n][1] - y) ** 2)
    r = [reach_acres(run(n0, ex_, pen)) for pen in (0, 150) for ex_ in ((), bridges)]
    print(f'{k:30s} no penalty {r[0]:4.0f} -> {r[1]:4.0f}   at-grade +150 m {r[2]:4.0f} -> {r[3]:4.0f}')
# sensitivity: share through JFK vs MLK with an MLK penalty
random.seed(1); sw = random.sample(west, 120); se = random.sample(east, 300)
print('\nwest-east walks within 1.5 km: share crossing at MLK vs JFK underpass, by MLK penalty')
for pen in (0, 60, 150, 300):
    c = {'MLK': 0, 'JFK': 0, 'other': 0}
    for o in sw:
        ex = {}; dist = {o: 0}; prev = {}; pq = [(0, o)]
        while pq:
            dd, u = heapq.heappop(pq)
            if dd > dist[u]: continue
            for v, w in adj.get(u, []):
                nd = dd + w + (pen if ((u, v) in mlk or (v, u) in mlk) else 0)
                if nd < dist.get(v, 1e18): dist[v] = nd; prev[v] = u; heapq.heappush(pq, (nd, v))
        for d in se:
            if d not in dist or math.dist(nodes[o], nodes[d]) > 1500: continue
            p = d; g = 'other'
            while p != o:
                q = prev[p]; k = (p, q) if (p, q) in cross_edges else (q, p)
                if k in cross_edges:
                    s_ = cross_edges[k]; g = 'JFK' if 780 < s_ < 960 else ('MLK' if 1380 < s_ < 1465 else 'other'); break
                p = q
            c[g] += 1
    n = sum(c.values()); print(f'  penalty {pen:3d} m: MLK {100*c["MLK"]/n:4.1f}%  JFK {100*c["JFK"]/n:4.1f}%  other {100*c["other"]/n:4.1f}%')
