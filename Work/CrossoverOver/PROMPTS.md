# Concept renders: base images and prompts

Draft, November 21, 2026. These prompts assume the layout in RESEARCH.md §13: two lids on the Strawberry Hill
bench, one on the bypass along Fulton, one on the 25th Avenue spur, and one Fulton crossing at 17th–18th.

## Getting a base image at ~3,000 ft

A drone can't get there. Part 107 caps you at 400 ft above ground, and the park sits under SFO's Class B airspace.
(Separately, Rec & Park requires a permit to fly from park property, I believe. Worth checking before the
footage goes in front of that department. [verify])

Options, best first:

1. **Render it from the lidar we already have.** The page's three.js scene is built from the 2 m USGS DEM.
   Set the camera to the shot you want, then export (a) a depth map and (b) a flat-shaded or orthophoto-draped
   render. Feed the depth map to a ControlNet-depth / structure-reference model. The geometry (the bench cut into
   Strawberry Hill, the lake, the curve onto the bypass) stays true, and the model only invents texture. This is
   the most honest base, since every hill is where it is. To get the drape, use a NAIP or SF orthophoto on the
   DEM in Blender (BlenderGIS).
2. **Google Earth (Studio or the desktop app) 3D tiles.** Fast, photoreal and correctly placed. Attribution is
   required, and Google's terms limit derivative use, so use it as a reference or an init image you paint over
   heavily, not as the published image.
3. **Your own stills, for the low-oblique shots.** `crossover1.jpg` (85 m up, fog, looking along the road with
   a lake on one side) is an excellent init image for a "lid in fog" render. Use inpainting with a mask over the
   roadway, not a whole-image restyle. `crossover3_overlook.jpg` (straight down on the six lanes) is the right
   base for a plan-view lid edge or a footbridge.

Strip EXIF before any still goes on the web; the JPGs carry GPS. (`exiftool -all= file.jpg`)

## Fixed facts to hold every prompt to

- Six lanes, three each way, a narrow median with a concrete barrier. About 105 ft curb to curb.
- Monterey cypress, Monterey pine, blue gum eucalyptus; coast live oak in the older groves; ivy and
  blackberry understory. Grass is green from November to May and gold in late summer.
- Blue Heron Lake sits about 80 ft above Transverse Drive and about 30–40 ft above the road. The road is a bench
  cut into the west flank of Strawberry Hill.
- Light: marine layer, soft and grey-white, low sun from the southwest in the afternoon. No hard blue skies unless
  you mean it.
- The lids are low and planted, not monuments. Portals are board-formed concrete or rough stone like the WPA
  work already in the park, never glass and steel.

Negative prompt for all of them: *glass canopy, futuristic, neon, skyscrapers in the park, palm trees, desert
plants, snow, tropical, cable-stayed bridge, suspension bridge, people in a crowd, cars on the lid, text, watermark*

---

## 1. Hero aerial: Route 1 from the Sunset to the Golden Gate

*Base: lidar depth render, camera ~3,000 ft over 19th Ave & Irving, looking due north, 35 mm equivalent, 25–30° below horizon.*

> Aerial photograph from 3,000 feet over San Francisco's Sunset District looking north along 19th Avenue into
> Golden Gate Park, late afternoon, thin marine layer burning off. A six-lane highway enters the dark green park and
> disappears under two long, low, planted lids, each about 800 feet long, with a short open gap between them where
> the road briefly shows. The lids are covered in meadow grass and young oaks and read as continuous hillside
> joining the wooded Strawberry Hill and the oval Blue Heron Lake on the right. North of the park the highway runs
> along Fulton Street, partly covered by a third lid, then continues as a boulevard through the Richmond District to
> the Presidio, with the Golden Gate Bridge towers rising out of fog on the horizon. Realistic, documentary aerial
> photography, natural color, slight haze, no exaggeration.

## 2. Lid in fog (inpainting `crossover1.jpg`)

*Mask the roadway and its shoulders from the bottom of the frame to where the road meets the buildings.*

> The same view, but the highway is covered by a planted lid: a gentle grassy ridge with young coast live oaks
> and a winding gravel footpath where the lanes were, continuous with the woods on both sides. Near the far end
> the road emerges from a low board-formed concrete portal, partly screened by cypress. Morning fog, soft light,
> wet grass. Photorealistic, matched to the original drone photo's lens, color and fog.

## 3. On the lid: the walk from the lake to the woods

*Base: none, or a ground photo from the west shore of Blue Heron Lake. Eye level, 28 mm.*

> Eye-level photograph standing on a grassy meadow on top of a highway lid in Golden Gate Park, looking west and
> downhill toward a eucalyptus and cypress forest. Behind the viewer is a small lake with a stone bridge. A
> decomposed-granite path at an easy grade curves down the slope into the trees. A woman with a dog and an older man
> on a bench. No road is visible or audible; the only hint is a low railing at the meadow's edge. Overcast winter
> afternoon, bright green grass, a great horned owl's silhouette in a cypress. Natural, unstaged, documentary.

## 4. The driver's view: the drive gets better too

*Base: a dashcam still southbound from the JFK overcrossing, if you have one.*

> View from the driver's seat on a six-lane parkway through a forest, approaching a low tunnel portal faced in rough
> grey stone with a planted meadow and cypress trees on top. The portal is short; daylight is visible at the far end
> and through the open gap beyond it. Clean lighting inside, wide shoulders, no clutter. Overcast San Francisco
> afternoon, light traffic. Photorealistic.

The point of this one is to show that a lid is not a long dark tube.

## 5. The Fulton crossing at 17th–18th Avenue

*Base: Street View-style ground photo on Fulton at 18th looking south into the park (the 5 Fulton stop is right there).*

> Street-level photograph on Fulton Street in San Francisco's Inner Richmond looking south toward Golden Gate Park. A
> new park entrance sits between a Muni bus stop and a row of 1920s stucco houses: a wide path at a gentle grade
> rising onto a planted lid that covers the highway beyond the park fence, with cypress trees and a stone low wall
> echoing the park's WPA-era stonework. A family with a stroller walks in. Overcast, soft light. Realistic.

Variant, if the crossing is an underpass:

> ...a low, wide stone-faced archway in the style of the 1889 Alvord Lake Bridge, carved with stalactite-like
> concrete, a gentle ramp descending to it from the sidewalk, daylight and trees visible straight through.

## 6. Minimal option: a Romain Street-style footbridge

*Base: inpaint `crossover3_overlook.jpg` (plan view) or a ground photo on the Strawberry Hill shore path.*

> A plain, slender concrete footbridge with simple steel railings crossing a six-lane highway in a eucalyptus
> forest. The east end lands directly on a wooded hillside at grade; the west end meets a path that switchbacks down
> through the trees. Utilitarian 1990s municipal design, painted steel, nothing decorative. Overcast. Realistic.

This is the cheap version, and it should look cheap and decent, like the bridge over Upper Market.

## 7. Watercolor plates, to match the page

Run any of the above through this style, or use it as the whole prompt with the depth map:

> Ink-and-watercolor field-atlas illustration on warm off-white paper, in the manner of a 19th-century survey plate.
> Loose sap-green and ochre washes, fine sepia pen lines for contours and trees, the lake in a soft blue-grey wash,
> visible paper texture and pigment granulation, a few areas left unpainted. Restrained palette: sap green, ochre,
> sepia, slate blue, a touch of madder red for the highway. No black outlines on everything; no digital gradients.

The page's palette for reference: paper `#eceee5`, ink `#25303a`, sepia `#8c7356`, sap `#577a43`, water `#4f86a0`,
madder `#a2424f`, ochre `#c49a45`.

---

## Notes

- Image models are bad at counting lanes and keeping a lid's length to scale. The depth-map route fixes both.
  Otherwise expect to inpaint the road a few times.
- Make a "today" render from the same camera for every "after" render. Side-by-side pairs persuade far better than
  single images, and the "today" one keeps the "after" honest.
- Label every render "concept, not a design" on the page. A planner who sees a pretty picture with no caption
  assumes someone is selling something.
