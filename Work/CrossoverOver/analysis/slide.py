import sys
S=sys.argv[1]
src=open(f'{S}/analyze3.py').read().split("inpark = None")[0]
exec(src)
from shapely import prepared
_,_,L0=grid_levels([])
xs_ = np.arange(x0 + 5, x1, 10); ys_ = np.arange(y0 + 5, y1, 10)
ip=np.array([[ppark.contains(Point(x, y)) for x in xs_] for y in ys_])
base=((L0>55)&ip).sum()
for a in range(100,1260,40):
    _,_,L=grid_levels([(a,a+240)])
    print(a,a+240, round(float((base-((L>55)&ip).sum())*100/4046.86),1), round(float((((L0>60)&ip).sum()-((L>60)&ip).sum())*100/4046.86),1))
