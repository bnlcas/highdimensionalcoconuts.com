# Crossover-Over analysis

Scripts that produce every number on `../index.html`. Copy them into a work directory `$S`, fetch the
raw public data there as below, and run them from `$S`; `export.py` writes `../data/crossover-data.js`.

## Fetch the inputs (into `$S`)

```bash
mkdir -p $S/osm $S/dem
# OpenStreetMap: roads, paths, lakes, buildings, park boundary (ODbL)
Q='[out:json][timeout:90];(way["highway"](37.7625,-122.4990,37.7765,-122.4560);way["natural"="water"](37.7625,-122.5120,37.7765,-122.4520);relation["natural"="water"](37.7625,-122.5120,37.7765,-122.4520);way["leisure"~"park|garden|pitch|playground|golf_course"](37.7625,-122.4990,37.7765,-122.4560);way["building"](37.7625,-122.4990,37.7765,-122.4560);relation["name"="Golden Gate Park"];way["landuse"~"grass|meadow|forest"](37.7625,-122.4990,37.7765,-122.4560);way["natural"~"wood|scrub|grassland"](37.7625,-122.4990,37.7765,-122.4560););out geom;'
curl -s --data-urlencode "data=$Q" https://overpass-api.de/api/interpreter -o $S/osm/area.json
# USGS 3DEP bare-earth DEM, 2 m, UTM 10N
echo "544130,4179580,547910,4181160" > $S/dem/bbox.txt
curl -s -o $S/dem/dem.tif "https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer/exportImage?bbox=544130,4179580,547910,4181160&bboxSR=26910&imageSR=26910&size=1890,790&format=tiff&pixelType=F32&interpolation=RSP_BilinearInterpolation&f=image"
```

Traffic counts come from the Caltrans AADT and Truck AADT GIS layers (2024), queried by
bounding box; the values are hard-coded in `analyze3.py` (71,000 AADT, 5,200 peak hour, 1.56% trucks).

## Run

Python 3 with `numpy shapely pyproj tifffile`.

| Script | What it does |
| --- | --- |
| `analyze.py` | Park area, highway length, buffer acreage, lake and landmark elevations |
| `analyze2.py` | Cross-sections every 10 m along the centerline, first walking-network pass |
| `analyze3.py` | Noise grid for each scenario, acres over thresholds, walking detours with the Grotto and Bridge |
| `quiet.py` | Phase 0 (quiet pavement, 30 mph) sensitivity |
| `slide.py` | Slides a 240 m lid along the road to find the best location |
| `homes.py` | Noise change at homes outside the park |
| `export.py` | Writes `../data/crossover-data.js` for the page |

`python3 export.py $S ../data/crossover-data.js`

## Model notes

- Noise: FHWA RD-77-108 reference energy mean emission levels, 5 m point-source elements per
  carriageway, soft-ground excess attenuation (alpha 0.5), 10 m grid, no foliage or terrain shielding.
  Only Highway 1 and the 25th Ave spur are sources.
- Covered sections remove their sources; each portal re-radiates 30 m worth of open-road energy less 3 dB.
- Station `s` is metres along the centerline from Fulton St & Park Presidio. The page shows it in
  Caltrans-style feet (STA 38+06 = 3,806 ft).
