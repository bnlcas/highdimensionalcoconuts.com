import sys
S=sys.argv[1]
src=open(f'{S}/analyze3.py').read().split("# ---------------- walking network")[0]
exec(src)
import math
r=remel(48); r2=remel(56)
print('speed 35->30 mph delta autos', round(L15(3787,48)-L15(3787,56),2))
for lab,dl in (('pave-3',-3),('speed-1.9',-1.9),('both-4.9',-4.9)):
    _,_,Lq=grid_levels([],Lmain=out['L15']['day']+dl, Lspur=out['L15_spur_day']+dl)
    print(lab,{th: round(float(((Lq>th)&inpark).sum()*100/4046.86),1) for th in (55,60,65)})
    np.save(f'{S}/noise_quiet.npy',Lq) if lab=='both-4.9' else None
