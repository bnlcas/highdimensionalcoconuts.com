import sys
S = sys.argv[1]
exec(open(f'{S}/wander2.py').read().split("# sensitivity:")[0].split("print('\\n10-minute")[0])
# lids: connect the nearest path node on each side every 40 m along each covered range (a path over the roof)
def lid_edges(ranges):
    out = []
    for a, b in ranges:
        for s_ in range(a + 20, b, 40):
            p = C.interpolate(s_); q = C.interpolate(s_ + 5); nx_, ny_ = -(q.y - p.y), q.x - p.x; nn = math.hypot(nx_, ny_); nx_, ny_ = nx_ / nn, ny_ / nn
            sides = {}
            for n in ins:
                dx, dy = nodes[n][0] - p.x, nodes[n][1] - p.y; d = math.hypot(dx, dy)
                if 25 < d < 110:
                    sd = 1 if dx * nx_ + dy * ny_ > 0 else -1
                    if sd not in sides or d < sides[sd][0]: sides[sd] = (d, n)
            if len(sides) == 2: out.append((sides[1][1], sides[-1][1], (sides[1][0] + sides[-1][0]) * 1.15))
    return out
LIDS = lid_edges([(910, 1110), (1210, 1410), (320, 560)])
print('lid path links', len(LIDS))
spots = {'Blue Heron Lake, west shore': (-122.47712, 37.76800), 'Elk Glen Lake': (-122.48200, 37.76740), 'Lloyd Lake': (-122.48190, 37.77082),
         'Hellman Hollow': (-122.48700, 37.77000), 'Fulton & 18th Ave': (-122.47625, 37.77302), 'Rainbow Falls': (-122.47760, 37.77130), 'Strawberry Hill summit': (-122.47485, 37.76862)}
print(f"{'10-min reach, acres':30s} today  crossings  +lids")
for k, v in spots.items():
    x, y = P(*v); n0 = min(nodes, key=lambda n: (nodes[n][0] - x) ** 2 + (nodes[n][1] - y) ** 2)
    r = [reach_acres(run(n0, ex_, 0)) for ex_ in ((), bridges, list(bridges) + LIDS)]
    print(f'{k:30s} {r[0]:5.0f}  {r[1]:9.0f}  {r[2]:5.0f}')
