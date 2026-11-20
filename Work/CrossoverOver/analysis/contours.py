import sys, json, numpy as np, tifffile, contourpy
from shapely.geometry import LineString
S, OUT = sys.argv[1], sys.argv[2]
dem = tifffile.imread(f'{S}/dem/dem.tif').astype(float) * 3.28084
x0, y0, x1, y1 = [float(v) for v in open(f'{S}/dem/bbox.txt').read().split(',')]
H, W = dem.shape; res = (x1 - x0) / W
# smooth a little (3x3 box twice) for cartographic contours
k = dem.copy()
for _ in range(3):
    p = np.pad(k, 1, mode='edge'); k = sum(p[i:i+H, j:j+W] for i in range(3) for j in range(3)) / 9
xs = x0 + (np.arange(W) + .5) * res - x0; ys = (y1 - (np.arange(H) + .5) * res) - y0
gen = contourpy.contour_generator(xs, ys, k)
out = []
for lev in range(40, 440, 10):
    for seg in gen.lines(lev):
        if len(seg) < 6: continue
        ls = LineString(seg).simplify(1.5)
        if ls.length < 40: continue
        out.append([lev, [[round(a, 1), round(b, 1)] for a, b in ls.coords]])
fj = json.load(open(f'{S}/fulton.json'))
from pyproj import Transformer
T = Transformer.from_crs(4326, 26910, always_xy=True)
loc = lambda lon, lat: [round(T.transform(lon, lat)[0] - x0), round(T.transform(lon, lat)[1] - y0)]
data = dict(contours=out, fulton=fj['rows'], strip=fj['strip'], strip_acres=fj['strip_acres'], cross2=[loc(*fj['cross2'][0]), loc(*fj['cross2'][1])],
            owl=loc(-122.47470, 37.76880))
s = 'window.CROSSOVER_EXTRA=' + json.dumps(data, separators=(',', ':')) + ';\n'
open(OUT, 'w').write(s); print('contour lines', len(out), 'bytes', len(s))
