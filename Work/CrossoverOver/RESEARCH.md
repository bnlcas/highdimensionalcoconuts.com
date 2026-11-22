# Crossover-Over: research notes

Highway 1 through Golden Gate Park: what it is, how it got there, what it costs the park, and what has been done elsewhere.

Compiled November 20, 2026. Every fact is tagged by how solid it is:

- **[source]**: from a published source, linked at the end of its section.
- **[measured]**: computed here from public data (OpenStreetMap, USGS lidar, Caltrans counts). Scripts are in `analysis/`.
- **[modeled]**: an output of the noise or cost model. Treat it as an estimate.
- **[verify]**: from memory or a single weak source. Check it before it goes in front of anyone.

---

## 1. The short version

| | Value | Basis |
|---|---|---|
| Highway 1 inside the park | 0.93 mi centerline (1,494 m); Caltrans postmiles 4.05–5.00 | [measured] [source] |
| Plus the spur to Fulton & 25th Ave | 0.3 mi of two-lane road (996 m of carriageway) | [measured] |
| Daily traffic | 71,000 vehicles (2024 AADT at Fulton); 68,000–71,000 at Lincoln | [source] |
| Peak hour | 5,200 vehicles | [source] |
| Trucks | 1.56% (1,045 a day), 68.5% of them two-axle | [source] |
| Lanes and speed | 3 + 3, divided; posted 35 mph (30 near Lincoln) | [measured, OSM tags] |
| Park within 400 ft of the roadways | 81 acres (mainline), 99 acres (with spur) | [measured] |
| Park above 55 dBA from this traffic alone | 96 acres (soft ground), up to 219 (hard ground) | [modeled] |
| Park above the federal 67 dBA criterion for parks | about 20 acres | [modeled] |
| Places to cross on foot, MLK to JFK | 0 for 1,840 ft | [measured] |
| Places to cross on foot along Fulton, Park Presidio to the JFK bridge | 0 for about 2,900 ft of highway | [measured] |
| Park stranded between Fulton and the highway or spur | 19 acres | [measured] |
| Built | 1936–1940, Works Progress Administration (WPA), as the Golden Gate Bridge approach | [source] |
| Who controls it | Caltrans (state highway); everything around it is Rec & Park | [source] |

### Corrections to the original pitch

| Claim | Finding |
|---|---|
| Crossover runs from 19th to Park Presidio "about 12th Ave" | Park Presidio sits on the 14th/15th Avenue line; the spur reaches 25th. |
| About 150 ft of drop from Stow Lake to Transverse | 75–80 ft. (Strawberry Hill's summit is about 220 ft above Transverse.) |
| Stow Lake | Renamed Blue Heron Lake in January 2024. |
| The MacArthur Tunnel has a rainbow portal | That's the Robin Williams Tunnel on US-101 in Marin. MacArthur has Art Deco portals. |
| Hard to get from Middle Lake to Stow Lake | Partly. The MLK signal and JFK underpass bracket the lake. The worst gap is the Fulton edge (section 7). |
| Bridges over Market Street with spiral ramps | Confirmed by Ben: the Romain Street and Corbett footbridges over Upper Market. OPAC's project page describes Romain's helical ramp (section 13.3). |
| Sutro's gifts of the forest and the Baths | The Baths were Sutro's business, and Mount Sutro's forest is UCSF land. His civic gifts were land, not those two places. See section 13.1. |
| ~150 ft from the lake to Transverse | Ben re-measured: ~80 ft, which matches the lidar. Settled. |
| Everything else (Highway 1 through the park, ~100 acres, loud, Tunnel Tops, Olmsted, Chesky's $100M) | Holds. |

---

## 2. The road

**Name and route.** State Route 1 comes north up 19th Avenue, enters the park at Lincoln Way, and becomes **Crossover Drive**. It crosses over JFK Drive (now the JFK Promenade) on a WPA-era bridge. North of JFK it curves east as **Park Presidio Bypass Drive**, running just inside the park parallel to Fulton Street until it exits at **Fulton & Park Presidio Boulevard** (about the 14th/15th Avenue line, not 12th). [measured, OSM]

**The spur.** A separate two-lane road, also named Crossover Drive on maps but not signed as Highway 1, branches west from the junction near JFK and exits at **Fulton & 25th Avenue**. Transverse Drive crosses it at grade, and there is a marked crosswalk near 23rd Avenue and a signal at 25th. [measured, OSM] Who owns the spur, Caltrans or the city, is unconfirmed. [verify]

**Geometry.** Two one-way carriageways about 11 m (36 ft) apart, centerline to centerline. The median strip is narrow, so a lid has to span about 105 ft. [measured]

**Ownership.** An SFMTA document on Golden Gate Park traffic states that all park roads are under Rec & Park jurisdiction *except* Crossover Drive/Highway 1, which Caltrans controls. Wikipedia describes Park Presidio Boulevard as maintained by Caltrans and Rec & Park. [source]

**Traffic.** Caltrans 2024 counts (the count year runs October to September):

| Count point | Postmile | Back AADT | Ahead AADT | Peak hour |
|---|---|---|---|---|
| Lincoln Way | 4.05 | 68,000 | 71,000 | 4,900 / 5,200 |
| Fulton Street | 5.00 | 71,000 | 71,000 | 5,200 |
| Lake Street (north, for context) | 5.88 | 62,000 | 62,000 | 4,400 / 5,100 |

No traffic count was found for the 25th Avenue spur. The noise model assumes 8,000 a day. [verify]

**Safety.**
- A driver died on Christmas Day 2024 when his car left the road and hit a tree near where Crossover Drive merges into the Park Presidio Bypass. The car caught fire. [source]
- A 2017 crash near Crossover and Park Presidio injured three people, one severely. [source]
- Pedestrians were struck in 2024 at the Fulton & Park Presidio bus stop, and separately near the Crossover entrance at 25th Avenue & Fulton. [source]
- An April 2026 public comment to SFCTA (see section 4) says Park Presidio is on the 2024 High Injury Network. It also says that, as of April 2026, SFPD data shows the Park Presidio Bypass with more speeding citations than anywhere else in the city. This comes from an advocate, not SFPD. [verify]

Sources: [Caltrans AADT GIS](https://gisdata.dot.ca.gov/arcgis/rest/services/CHhighway/Traffic_AADT/MapServer/0) · [Caltrans Truck AADT](https://gisdata.dot.ca.gov/arcgis/rest/services/CHhighway/Truck_Volumes_AADT/MapServer/0) · [SFMTA document](https://www.sfmta.com/media/42914/download) · [Park Presidio Boulevard (Wikipedia)](https://www.wikipedia.org/wiki/Park_Presidio_Boulevard) · [ABC7, Christmas 2024 crash](https://abc7news.com/post/person-killed-fiery-christmas-day-crash-san-francisco-golden-gate-park/15708385/) · [SFist, 2017 crash](https://sfist.com/2017/10/26/man_fights_for_life_following_crash) · [ABC7, Fulton & Park Presidio bus stop](https://abc7news.com/amp/post/san-francisco-bus-stop-crash-pedestrian-injured-fulton-street-park-presidio/14565884/)

---

## 3. History

| Year | Event | Basis |
|---|---|---|
| 1866 | Frederick Law Olmsted tells the city the Outside Lands' soil and climate can't support a park of lawns and big shade trees. | [source] |
| 1870–71 | William Hammond Hall begins surveying the dunes (Aug 1870) and is named park engineer (Aug 1871). By the 1880s the dunes are stabilized and planted. | [source] |
| 1889 | Alvord Lake Bridge, by Ernest Ransome: the first reinforced-concrete bridge in the United States, a pedestrian underpass beneath a park road. ASCE landmark, 1969. | [source] |
| 1895 | Adolph Sutro gives UC the Parnassus land for the Affiliated Colleges (today's UCSF). He serves as mayor 1895–97. | [verify] |
| 1903 | The city buys the Park Presidio strip for $360,000 as an extension of Golden Gate Park. | [source, via Wikipedia] |
| Nov 1936 | Park Presidio is converted into the approach road for the Golden Gate Bridge (which opens May 1937). | [source] |
| 1936–40 | WPA crews build Crossover Drive and the Park Presidio Bypass. Photos show the "completed WPA construction of Crossover Drive" by July 1940. | [source] |
| 1938–40 | The MacArthur Tunnel (about 1,300 ft, Art Deco portals) carries Route 1 into the Presidio and opens April 21, 1940. | [source] |
| 1955 | The proposed Western Freeway rouses Sunset residents, an early spark of the freeway revolt. | [source] |
| 1964 | The state's Panhandle–Golden Gate Freeway would take 60% of the Panhandle and **tunnel under the north edge of Golden Gate Park** to Park Presidio. After a May 17 rally at the Polo Field, the Board of Supervisors rejects it 6–5 on October 13. | [source] |
| 1966 | Revised Panhandle and Golden Gate freeway plans are rejected again, 6–5. | [source] |
| 2004 | Golden Gate Park is listed on the National Register of Historic Places as a district. The nomination lists Crossover Drive and the Park Presidio Bypass among its 1930s public works; whether they are *contributing* resources is not confirmed. | [source] [verify status] |
| 2015 | The Presidio Parkway (Doyle Drive replacement) opens with two pairs of cut-and-cover tunnels. | [source] |
| 2018 | The SF Planning "Golden Gate Park Edges" existing-conditions study (section 6). | [source] |
| Jul 2022 | Presidio Tunnel Tops opens on the Parkway's tunnels. | [source] |
| Nov 2022 | Voters keep the JFK Promenade car-free (Prop J). | [source] |
| Jan 2024 | The Rec & Park Commission renames Stow Lake **Blue Heron Lake** (4–3); the drive and boathouse are renamed too. | [source] |
| Nov 2024 | Prop K closes the Upper Great Highway, now Sunset Dunes park. A recall of the District 4 supervisor followed in 2025. | [verify] |
| Dec 2024 | A driver dies in a fire after crashing near the Crossover/Bypass merge. | [source] |
| Apr 2026 | A public comment to the SFCTA Board asks for a feasibility and environmental study of **undergrounding Park Presidio Boulevard** with cut-and-cover tunnels on the Presidio Parkway model (section 4). | [source] |
| Nov 9, 2026 | Brian Chesky pledges $100M to SF parks, the largest single-donor gift in city history. About $39M goes first to five projects; Rec & Park has a year to choose the rest. | [source] |

Sources: [Pacific Horticulture](https://pacifichorticulture.org/articles/olmsteds-law-refuted/) · [TCLF, William Hammond Hall](https://tclf.org/pioneer/william-hammond-hall) · [ASCE, Alvord Lake Bridge](https://asce.org/about-civil-engineering/history-and-heritage/historic-landmarks/alvord-lake-bridge) · [OpenSFHistory WPA photos](https://test.opensfhistory.org/photo/wnp14.0221) · [MacArthur Tunnel (Wikipedia)](https://en.wikipedia.org/wiki/MacArthur_Tunnel) · [Streetsblog, freeway revolt](https://sf.streetsblog.org/2009/06/11/revisiting-the-san-francisco-freeway-revolt) · [NRHP nomination](https://npgallery.nps.gov/pdfhost/docs/NRHP/Text/04001137.pdf) · [TunnelTalk, Presidio Parkway](https://tunneltalk.com/USA-22May2015-San-Francisco-Presidio-Parkway-final-preparations.php) · [Presidio Trust, Tunnel Tops](https://presidio.gov/about/press/presidio-tunnel-tops-free-world-class-national-park-destination-in-the-presidio-opens-to-the-public/) · [CBS, Prop J](https://www.cbsnews.com/amp/sanfrancisco/news/san-francisco-voters-ensure-stretch-of-jfk-drive-remains-closed-to-cars) · [Axios, Blue Heron Lake](https://www.axios.com/local/san-francisco/2024/01/22/golden-gate-stow-lake-renamed) · [KALW, $100M gift](https://www.kalw.org/bay-area-news/2026-11-10/airbnb-co-founder-donates-100-million-to-san-francisco-parks-department)

---

## 4. Others already asking

**Park Presidio Parkway public comment (April 28, 2026).** A one-page fact sheet from a Lake Street law office to the SFCTA Board, titled "Healing the Presidio & Reconnecting the Richmond District." It calls Park Presidio "the second branch of the Doyle Drive problem." It proposes cut-and-cover tunnels on the Presidio Parkway model to remove the surface conflicts at Fulton and Geary, and to "reconnect 1.5 miles of fragmented parkland." It names Caltrans and SFCTA as the natural lead agencies and asks SFCTA to fund a feasibility and environmental study.

**Why it matters here:** it is the same corridor one mile north, the same remedy, and the same agencies. Crossover-Over and this proposal are two halves of one Route 1 story, from Lincoln Way to the Presidio. A joint feasibility study of the whole corridor is a stronger ask than either alone.

Source: [SFCTA Board Item 12 public comment, 2026-04-28 (PDF)](https://www.sfcta.org/sites/default/files/2026-04/SFCTA_Board_Item12_PUBLICCOMMENT_2026-04-28.pdf)

---

## 5. Terrain

From the USGS 3DEP bare-earth elevation model (NAVD88 feet). [measured]

| Place | Elevation |
|---|---|
| Strawberry Hill summit | ~429 ft |
| Blue Heron Lake water surface | ~285 ft |
| Highway 1 north of MLK (the bench) | 241–255 ft |
| Highway 1 high point on the bypass curve | ~278 ft |
| Crossover × MLK signal | ~228 ft |
| Lincoln & 19th | ~221 ft |
| Transverse Drive (mid) | ~205 ft |
| Lloyd Lake | ~197 ft |
| Elk Glen Lake | ~167 ft |
| Fulton & 25th Ave | ~180 ft |
| Fulton & Park Presidio | ~233 ft |
| Middle Lake (Chain of Lakes) | ~66 ft |

- **Lake to Transverse:** 75–80 ft of drop, not 150. Strawberry Hill's summit is about 220 ft above Transverse.
- **The shape:** between MLK and JFK the highway is a bench cut into Strawberry Hill's west flank. The ground rises 30–40 ft to the lake side within 60 m and falls 20–40 ft toward Transverse. Along Fulton the bypass is nearly level and sits a few feet above the ground to its south.
- **Distances:** the lake shore is 63 m (about 210 ft) from the nearest lane.

---

## 6. Acres affected

### Buffers (park land only, clipped to the park polygon) [measured]

| Distance each side | Mainline only | With the spur |
|---|---|---|
| 50 ft | 15 ac | 20 ac |
| 100 ft | 26 ac | 34 ac |
| 200 ft | 46 ac | 59 ac |
| 300 ft | 64 ac | 80 ac |
| 400 ft | 81 ac | 99 ac |
| 500 ft | 98 ac | 119 ac |
| 1,000 ft | 180 ac | 212 ac |

The pavement itself is about 9 acres of mainline and 2 acres of spur. The OSM park polygon measures 1,004 acres against the official 1,017.

### Noise [modeled]

The model uses FHWA reference vehicle emission levels with 71,000 a day, an average daytime hour of about 3,800 vehicles at 38 mph, 5 m source elements and soft ground. Only Highway 1 and the spur are counted as sources. Level at 50 ft: about 72 dBA.

| Park acres above | Today | Quiet pavement + 30 mph | Strawberry Hill Lid | String of Lids | Full tunnel |
|---|---|---|---|---|---|
| 55 dBA (WHO daytime outdoor guideline) | 96 | 59 | 82 | 51 | 23 |
| 57 dBA (FHWA Category A) | 75 | 45 | 63 | 37 | 18 |
| 60 dBA | 52 | 30 | 43 | 23 | 12 |
| 67 dBA (FHWA Category C, parks) | 20 | 12 | 17 | 8 | 4 |

Sensitivity: hard ground gives 219 acres above 55 dBA, and the peak hour gives 102. No foliage or terrain shielding is counted, which pulls the other way.

Level vs. distance west of the bridge site (daytime): 64 dBA at 130 ft, 58 at 330 ft, 54 at 620 ft, 48 at 1,310 ft.

Homes: about 160 homes along Fulton and Lincoln would get 1 dB or more quieter with a full tunnel. Most already sit next to Fulton's own traffic.

---

## 7. Access, and the Fulton edge

### Every way across Highway 1 inside the park [measured, OSM]

| Station from Fulton | Crossing | Type |
|---|---|---|
| STA 0+00 | Fulton & Park Presidio | Signal |
| none for ~2,900 ft | Bypass along Fulton, 15th to 21st Ave | — |
| STA 29+00 | JFK Promenade | Underpass (Crossover bridges over JFK) |
| none for ~1,840 ft | Strawberry Hill bench | — |
| STA 47+20 | MLK Drive | Signal, at grade, 6 lanes |
| STA 48+90 | Lincoln Way & 19th Ave | Signal |
| Spur | Transverse Drive; marked crosswalk near 23rd; 25th Ave signal | At grade, 2 lanes |

### The Fulton edge, block by block [measured]

Walking distance from each Fulton intersection to the nearest point on JFK Drive or the Promenade, the park's spine. The ratio is network distance divided by straight-line distance; 1.0 means you can walk straight in.

| Fulton at | Straight line | Walk today | Ratio | With a Grotto at 17th | With a 2nd crossing at 19th |
|---|---|---|---|---|---|
| 14th Ave | 248 m | 283 m | 1.1 | 283 | 283 |
| Park Presidio | 217 m | 232 m | 1.1 | 232 | 232 |
| 15th Ave | 201 m | 381 m | 1.9 | 381 | 381 |
| 16th Ave | 156 m | 481 m | **3.1** | 310 | 310 |
| 17th Ave | 139 m | 574 m | **4.1** | 387 | 387 |
| 18th Ave | 145 m | 652 m | **4.5** | 482 | 419 |
| 19th Ave | 163 m | 558 m | **3.4** | 558 | 344 |
| 20th Ave | 191 m | 479 m | **2.5** | 479 | 438 |
| 21st Ave | 230 m | 385 m | 1.7 | 385 | 385 |
| 22nd Ave | 263 m | 337 m | 1.3 | 337 | 337 |
| 23rd Ave | 292 m | 430 m | 1.5 | 430 | 430 |
| 24th Ave | 269 m | 402 m | 1.5 | 402 | 402 |
| 25th Ave | 267 m | 308 m | 1.2 | 308 | 308 |
| 26th Ave | 228 m | 250 m | 1.1 | 250 | 250 |

**What this shows**

- **Fulton between 15th and 20th Avenues is the most cut-off stretch of Golden Gate Park's entire north edge.** Six blocks of the Inner Richmond face the park and can't walk into it. From Fulton & 18th, JFK is 145 m away in a straight line and 652 m on foot.
- From Fulton & 17th to the Blue Heron Lake boathouse: 1,248 m on foot against about 430 m straight. A Grotto at 17th cuts that to 891 m.
- The highway runs between Fulton and the park interior for 1,100 m (0.68 mi) of Fulton frontage, from Park Presidio to 25th Avenue.
- **19 acres of park** sit stranded between Fulton and the highway or spur: a 15.5-acre strip along the bypass plus 2.3 and 1.2 acres in the spur wedges. That is more than Tunnel Tops (14 acres), and it already exists. It has no way out except back onto Fulton.
- **The 25th Avenue spur** is a softer barrier, since it is two lanes with at-grade crossings. It still adds 40–60% to walks from 23rd–24th. A 2024 news report places a pedestrian struck near the Crossover entrance at 25th & Fulton.
- 22nd Avenue works (ratio 1.3) because of a 2023 project: a signalized bike connection and a newly paved path into the park. That is a cheap, recent precedent on this exact edge.
- Within about 330 m (three blocks) north of Fulton between 14th and 26th Avenues there are roughly 910 buildings in OSM.

**A second crossing at about 19th Avenue (STA 19+00).** The road is at 271 ft and the hill to the south (toward Prayer Book Cross) at about 290 ft, so a bridge would land on the park side at grade. On the Fulton side (~245 ft) it needs a long ramp, which the stranded strip has room for: a landscaped ramp-path along the strip.

### SF Planning, Golden Gate Park Edges study (March 2018) [source]

- Park perimeter is about 7 miles; the north and south edges are each more than 3 miles. There are 4-lane streets on all four sides. The study cites 13 million annual visitors (Rec & Park now says 24–25 million).
- **Fulton has 54 intersections, and 28% have no crosswalk.** Lincoln has 53, and 43% have no crosswalk.
- About two-thirds of intersections on both streets are uncontrolled, with no signal or stop sign.
- About one-third of Fulton's 18 bus-stop intersections have no formal park entrance.
- "People are crossing the street and entering the park wherever they desire, regardless of the lack of a formal park entrance, safety measures… or highly sloped terrain." It photographs "Fulton Street – near Crossover Drive" as an example of open green space that is hard to reach.

### Fulton Street Safety and Transit Project (SFMTA / SFCTA) [source]

- About three miles, Stanyan to La Playa. It added signalized bike connections into the park at **10th and 22nd Avenues** and paved a path at 22nd. It was reported as completed in a September 2023 SFCTA post, with construction listed for fall 2024.
- Fulton's speed limit dropped from 30 to 25 mph (signs October 2024). New signals went in at 4th and 39th to "close two long gaps between traffic signals."
- The 5/5R Fulton carried 22,000+ weekday boardings before the pandemic and about 15,000 more recently.
- Neither source mentions Crossover, the bypass or Highway 1. The highway edge has fallen between Caltrans and the city's Fulton projects.

Sources: [GG Park Edges presentation (PDF, 31 MB)](https://www.sfcta.org/sites/default/files/2021-01/GG%20Park%20Edges%20Existing%20Conditions%20Analysis%20Final%20Presentation_March%202018.pdf) · [SFMTA Fulton project](https://www.sfmta.com/projects/fulton-street-safety-and-transit-project) · [SFCTA blog, Sept 2023](https://www.sfcta.org/blogs/improving-safety-and-accessibility-along-fulton-street) · [SFCTA District 1 Multimodal Study 2024](https://www.sfcta.org/sites/default/files/2024-11/SFCTA_D1_Multimodal_Transportation_Study_FINAL_2024-11-19.pdf)

---

## 8. Owls, and other listeners

- **Great horned owls nest on Strawberry Hill**, a few hundred feet from the highway. An SF Environment post describes a pair there raising four young, and another nest in the western park raising two. ABC7 covered a nest near the bison paddock. [source; the year of the Strawberry Hill nest is not stated]
- **Hooting season is now.** Great horned owls court and hoot most in December and January. Presidio birders reported mating calls starting in February 2009. In San Francisco's mild climate, nesting likely runs from late winter into spring. [source; the local timing is an inference]
- **Traffic noise hurts owl hunting.** In a field experiment with 78 wild owls, Senzaki et al. (2016, *Scientific Reports* 6:30602) found prey detection fell 17% with traffic noise at just 40 dB and 89% at 80 dB. They estimate the effect reaches more than 120 m from a road. Owls hunt by ear, and the Strawberry Hill nest sits inside the modeled 55–60 dBA zone. [source]

Sources: [SF Environment](https://sfenvironment.org/node/2980) · [ABC7](https://abc7news.com/archive/9025222/) · [Presidio Trust 2009](https://presidio.gov/about/press/love-is-in-the-air) · [The Nature Conservancy](https://blog.nature.org/2014/12/08/the-hooting-season-enjoying-great-horned-owls) · [Senzaki et al. 2016](https://eprints.lib.hokudai.ac.jp/dspace/handle/2115/63402)

---

## 9. Comparable projects

### Covering highways

| Project | Year | What | Size | Cost | Funding |
|---|---|---|---|---|---|
| Presidio Tunnel Tops, SF | 2022 | Park on top of Caltrans' cut-and-cover tunnels | 14 ac | $118M (landscape only) | $98M philanthropic (Parks Conservancy), $20M Presidio Trust; 5M visits in its first 3 years |
| Presidio Parkway, SF | 2015 | Doyle Drive replacement: Battery tunnels (850 ft) and Main Post tunnels (1,020 ft), cut-and-cover, plus viaducts | 1.6 mi | $852M–$1.2B (sources differ) | State/federal, availability-payment P3 |
| MacArthur Tunnel, SF | 1940 | Route 1 under the Presidio | ~1,300 ft | — | — |
| Klyde Warren Park, Dallas | 2012 | Deck over a sunken freeway | 5.2 ac | $110M | $50M+ private; $20M city bonds, $20M TxDOT, $16.7M federal stimulus |
| The Stitch, Atlanta | planned | Cap over the Downtown Connector | 14 ac | ~$713M est. (~$51M/ac) | ~$200M secured incl. $157.6M federal |

### Crossing highways on foot

| Project | Year | What | Cost | Notes |
|---|---|---|---|---|
| Wallis Annenberg Wildlife Crossing, Agoura Hills | 2026 | 165-ft-wide planted bridge over 10 lanes of US-101 | ~$114M | $25M Annenberg Foundation; >$34M philanthropy total; state the rest. Donor-named. |
| Adobe Creek bike/ped bridge, Palo Alto | 2021 | Over US-101 | $23.7M | City's figure; $23.1M in press |
| East Palo Alto bike/ped bridge | 2019 | Over US-101 | ~$14M | |
| Romain Street bridge, SF | design 1998 | Pedestrian bridge over Upper Market St, 100-ft simple span, two steel girders and a concrete deck | — | Links Corbett Ave and Twin Peaks to the Castro/Noe side. Walking guides describe spiral ramps on this route. [verify ramp details] |
| Geary & Steiner bridge, SF | 1962–2020 | Spiral and folded ramps over Geary | — | **Removed in 2020**: ramps at 11–17% grade far exceeded ADA. The lesson for this project: design every approach at 5% or flatter. |
| Alvord Lake Bridge, Golden Gate Park | 1889 | Pedestrian grotto under a park road | — | First reinforced-concrete bridge in the US. The park's own precedent for a Fulton Grotto. |

**Upper Market.** Walking guides describe a footbridge over Market Street between Romain Street and Corbett Avenue, with a spiral ramp at the Corbett end, and a second crossing near the Corbett bus stop. OPAC Consulting Engineers lists the Romain Street bridge as a 100-ft span designed in 1998. Its construction date and the ramp grades weren't found. [verify on site; these are the spirals you remembered]

Sources: [Presidio Trust](https://presidio.gov/about/press/presidio-tunnel-tops-free-world-class-national-park-destination-in-the-presidio-opens-to-the-public/) · [Planetizen](https://planetizen.com/news/2022/07/117856-presidio-tunnel-tops-links-san-francisco-parks-above-seven-lanes-traffic) · [Presidio 2025 visits](https://wp.presidio.gov/wp-content/uploads/2025/07/7.14.25-Outpost-Meadow-Opening-PR.pdf) · [TIFIA](https://webarchive.library.unt.edu/web/20161104165340/https://www.transportation.gov/tifia/financed-projects/presidio-parkway) · [FHWA, Klyde Warren](https://www.fhwa.dot.gov/ipd/project_profiles/tx_klyde_warren_park.aspx) · [GPB, The Stitch](https://www.gpb.org/news/2025/10/23/atlanta-commits-highway-capping-project-the-stitch-despite-funding-challenges) · [Governor's office, Annenberg](https://www.gov.ca.gov/2026/02/02/california-closes-in-on-completing-the-worlds-largest-wildlife-crossing) · [Palo Alto](https://www.paloalto.gov/Departments/Public-Works/Engineering-Services/Engineering-Projects/Highway-101-Pedestrian-Bike-Bridge-Project) · [Palo Alto Online, EPA bridge](https://www.paloaltoonline.com/news/2019/11/19/palo-alto-prepares-to-launch-construction-on-bike-bridge/) · [OPAC, Romain St](https://opacengineers.com/projects/RomainSt) · [Twin Peaks walking guide](http://www.noevalleyvoice.com/1999/April/twinpeaks.html) · [SFMTA, Geary/Steiner](https://www.sfmta.com/blog/memorial-day-weekend-street-closures-geary-and-steiner-remove-pedestrian-bridge)

---

## 10. Rules that shape the design

- **Tunnel fire safety (NFPA 502).** Requirements step up with length. Mechanical smoke ventilation becomes conditionally mandatory above about 240 m (787 ft), and full provisions apply at 1,000 m (3,280 ft) and beyond. A 787-ft lid avoids the ventilation plant; a 3,900-ft tunnel gets all of it. [source, partial; confirm the category table in NFPA 502 itself]
- **Federal noise criteria (23 CFR 772).** 67 dBA Leq(h) for parks and recreation (Category C); 57 dBA where serenity is essential (Category A). [source]
- **WHO.** 55 dB daytime outdoors is the threshold for serious annoyance (Guidelines for Community Noise, 1999). [source]
- **CEQA exemption for active transportation.** Public Resources Code §21080.25 exempts qualifying pedestrian and bicycle projects, with a sunset of January 1, 2030. [verify the eligibility conditions]
- **Historic review.** The park is a National Register district, so any federal money triggers Section 106; CEQA treats it as a historic resource regardless. [source]
- **ADA.** A walkway at 5% or flatter is not a "ramp" and needs no handrails or landings. The Geary/Steiner bridge is the cautionary tale. [verify]
- **Value of recreation.** Army Corps unit day values for FY2025 run $5.17–15.52 per general recreation day. [source]
- **Quieter pavement.** Caltrans test sections found rubberized open-graded asphalt holds its noise reduction longest. The benefit is mostly above 30 mph. [source]

Sources: [NCHRP 20-07(363)](https://onlinepubs.trb.org/onlinepubs/nchrp/docs/NCHRP20-07%28363%29_FR.pdf) · [Seattle NFPA 502 amendments](https://www.seattle.gov/documents/departments/fire/business/nfpa502amendments2012sfc.pdf) · [23 CFR 772](https://www.ecfr.gov/current/title-23/chapter-I/subchapter-H/part-772) · [PRC §21080.25](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=PRC&sectionNum=21080.25) · [USACE EGM 25-04](https://planning.erdc.dren.mil/toolbox/library/EGMs/EGM25-04.pdf) · [Caltrans quieter pavement](https://dot.ca.gov/-/media/dot-media/programs/research-innovation-system-information/documents/f0016609-ca13-2600-finalreport.pdf)

---

## 11. Costs and benefits (summary of the model)

All figures are in 2026 dollars and are planning-level (AACE Class 5: actual cost could land 50% lower or 100% higher). [modeled]

| Phase | Cost | Acres moved below 55 dBA | New surface | Notes |
|---|---|---|---|---|
| 0. Quiet pavement + 30 mph | $3–8M | 38 | — | Benefit-cost roughly 6–16 at default assumptions |
| 1. Fulton Grotto + Strawberry Hill Bridge | $29–51M | — | ~0.2 ac | Near break-even on time and visits; the real case is access |
| 1b. Second Fulton crossing at ~19th | $20–35M | — | — | Not costed in detail; bridge-class |
| 2. Strawberry Hill Lid (787 ft) | $140–240M | 15 | 2.0 ac | Tunnel Tops scale; NFPA Category A |
| 3a. String of Lids (4 × 787 ft) | $550–950M | 46 | 8.1 ac | Subject to fire-safety review of the gaps |
| 3b. Full tunnel (3,900 ft) | $0.9–1.6B | 73 | ~10 ac | $4–6M a year to operate |

The case for Phases 2 and 3 rests on land-equivalent value (about 80 acres of quiet central parkland that cannot be bought) rather than conventional benefit-cost.

---

## 12. Open questions

1. Who owns the 25th Avenue spur, Caltrans or the city? Is there a traffic count for it?
2. Is Crossover Drive a contributing resource in the NRHP district? Check the nomination's inventory table.
3. What are the JFK overcrossing bridge's Caltrans bridge number and condition rating? (FHWA National Bridge Inventory.) A deficient rating would open a state funding path.
4. ~~Does Caltrans have SHOPP resurfacing programmed for SR-1 at postmiles 4–5?~~ Probably not soon. Caltrans repaved 19th Ave from Lincoln to Holloway in Dec 2025–2026 (south of the park) and replaced the median barrier inside the park in 2019–20. Nothing found for Crossover itself. Quiet pavement is dropped as a lead item (section 13.5).
5. Check the SFPD speeding-citation claim for the Park Presidio Bypass (April 2026).
6. Get crash records for Crossover, MLK and the 25th Ave spur from TIMS/SWITRS, 2015–2025.
7. Field-check the noise model; the protocol is on the proposal page.
8. ~~Is the Romain Street / Corbett spiral ramp still standing?~~ Yes (Ben). Still worth getting the ramp grade and the construction cost from SF Public Works.
9. The Strawberry Hill owl nest: which year, and is it active this season?
10. The Anthropic IPO: as of the latest reports found (Nov 13), pricing was expected the week of Nov 16 and was not yet confirmed.

---

## 13. Round two (November 21, 2026)

Responses to Ben's notes from November 21, plus new findings. Section 14 replaces the phase list in section 11 as the working design. Section 11 stays as the record of what the page currently shows.

### 13.1 Adolph Sutro

Two corrections to the sketch, then the numbers.

- **He had a wife and children.** He married Leah Harris in the mid-1850s (sources give 1854, 1855 and 1856) and had six children; one source says seven. Emma Sutro Merritt became one of San Francisco's first women physicians and later looked after Sutro Heights. [verify] Leah filed for divorce in 1879, they separated in 1880, and she died in 1893. So the "no wife or children" premise doesn't hold. Nothing I found speaks to his private life beyond that. [source]
- **He was a promoter and builder, not an employee.** The Sutro Tunnel (finished 1878) was his own venture. He conceived it, raised the money for it, and fought the Bank of California's "Bank Ring" over it for a decade. It drained hot water out of the Comstock and ventilated the lower workings. By the time it was finished the richest ore was mostly worked out. He sold his interest in 1878–79 for roughly $900,000 and put it into San Francisco land. The parallel to tech is real but different from the one in the sketch: an engineer-founder who solved an infrastructure problem, got out at the top, and turned the gain into land. [source]
- **The land.** At his peak he owned about 2,200 acres, roughly a twelfth of the city, much of it west of Twin Peaks and in what became the Sunset. He planted much of it in eucalyptus, which is where Sutro Forest comes from. He died land-rich and cash-poor. [source]
- **His public life.** Elected mayor as a Populist in 1894 and served 1895–97. He fought the Southern Pacific over the five-cent fare to his Baths. [verify]
- **The gifts were partly his heirs'.** Sutro was declared incompetent in 1897 and died in 1898, and his estate was litigated for years. The Sutro Heights estate went to the city on the condition that it be "forever held and maintained as a free public resort or park." Sources date the transfer variously to 1920, 1933 (maintenance) and 1938. The surviving library went to the state in 1913 on the condition it never leave San Francisco. [source]

| Gift | Then | In 2026 dollars (CPI) | What it would fetch now | Basis |
|---|---|---|---|---|
| Tunnel stake sold, 1878–79 | ~$900,000 | ~$29–30M | — | [source; one source gives ~$30M] |
| Parnassus land for the Affiliated Colleges (now UCSF), 1895 | 13 acres [verify] | land then was cheap; no price found | ~$130M as raw land at $10M/acre | [modeled; acreage from memory] |
| Sutro Heights, to the city 1920s–1938 | ~18 acres [verify] plus gardens | WPA improvements after 1938 cost $90,994 (≈ $2M) | ~$180M as raw land at $10M/acre; it would never be sold | [source for WPA cost; land value modeled] |
| Sutro Library, to the state 1913 | perhaps 250,000 volumes at peak; more than half burned in 1906; ~90,000 given | legislature gave $70,000 a year for upkeep (≈ $2.3M) | rare-book value unknown; incunabula and Mexican imprints are the prizes | [source] |

CPI multipliers used: 1880 ≈ ×33, 1895 ≈ ×39, 1913 ≈ ×33, 1938 ≈ ×23. They are rough, and pre-1913 figures are backcast estimates. The $10M/acre land figure is the same assumption as the page's ledger, which is cautious for oceanfront. A 1910 appraisal of the whole Sutro estate (by A. S. Baldwin) exists in the archives. It is the place to go for a period valuation.

Sources: [Wikipedia, Adolph Sutro](https://en.wikipedia.org/wiki/Adolph_Sutro) · [NPS, Adolph Sutro](https://www.nps.gov/goga/historyculture/adolph-sutro.htm) · [NPS, Citizen Sutro](https://www.nps.gov/places/000/citizen-sutro.htm) · [Museum of the City of SF](https://sfmuseum.org/sutro/bio.html) · [FoundSF, Sutro and West of Twin Peaks](https://foundsf.org/Farms,_Fire_and_Forest:_Adolph_Sutro_and_Development_“West_of_Twin_Peaks”) · [OAC, Sutro papers](https://oac.cdlib.org/findaid/ark:/13030/c83r0thp) · [NPS Sutro Historic District CLR, 1993](https://www.nps.gov/goga/learn/historyculture/upload/Sutro-Historic-District-CLR-1993.pdf) · [Sutro Library (Wikipedia)](https://en.wikipedia.org/wiki/Sutro_Library) · [Capitol Museum, State Library history](https://capitolmuseum.ca.gov/exhibits/outofthevault/history-of-the-csl/expansion-of-csl/)

### 13.2 Names

Blue Heron Lake is the official name and goes in anything sent to the city. Stow Lake can appear in history. W. W. Stow pushed the lake through, and Collis Huntington paid for the falls.

### 13.3 The Upper Market footbridges

OPAC Consulting Engineers: Romain Street pedestrian overcrossing, a 100-ft simply supported span over Market. A 22-ft reinforced-concrete slab links the northeast end to a reinforced-concrete **helical ramp**. Design was finished in 1998 for the city. Ben confirms both bridges stand and share the design.

**Why they are the right reference.** They cross a fast, wide road on a steep grade. They are plain and cheap, and they are well used because they connect to something worth walking to (the Corbett steps up Twin Peaks). The Geary/Steiner bridge was the wrong comparison: Geary has signals every block, so people waited at the lights rather than climb.

**The ADA argument.** Transverse Drive and the Strawberry Hill paths are steep enough now that most wheelchair users need help to reach the bridge site at all. The honest standard is "as accessible as the route it joins": a 5%-or-flatter approach where the terrain allows (the lake side lands at grade), and a helical or switchback ramp where it doesn't. The Upper Market bridges are the city's own precedent for exactly this tradeoff. The SF Mayor's Office on Disability will review any city-sponsored design. Bring the precedent and the existing-grade survey to that meeting. Don't expect to argue it away. [the review step is from general practice; verify]

Source: [OPAC, Romain St](https://opacengineers.com/projects/RomainSt)

### 13.4 The Annenberg crossing as a reference

| | Annenberg (US-101, Agoura Hills) | Strawberry Hill lid, one unit |
|---|---|---|
| Size | ~210 × 165 ft, about 0.8 ac of structure; ~12–13 ac of habitat work around it | 787 × ~105 ft, about 1.9 ac |
| Lanes spanned | 10, plus Agoura Road | 6, with a median wall that can carry the roof |
| Cost | $92M at the start (2022), ~$114M now | $140–240M in the current model |
| Cost per sq ft of structure | ~$3,300 | ~$1,700–2,900 |
| Funding | $25M Annenberg Foundation challenge grant; >$34M philanthropy in all; state ~$58M plus a final $18M (Feb 2026) | — |
| Status | Opening set for **December 2, 2026** | — |

- **The controversy.** The overrun was about 23%. USDOT Secretary Duffy mocked it as a "bridge to nowhere," and the Governor's office blamed tariffs. Its backers say the overrun is below the norm for highway work. A critic noted that California's other wildlife crossings averaged about $16M. The fair reading is that the price is high per square foot, mostly because of the span, the work over a live 10-lane freeway, and the soil and planting load. Those are the same things that drive our cost.
- **What to take from it.** A lid over a narrow road with a center wall should cost less per square foot than Annenberg, because it is two ~50-ft spans, not one long one. That is the cost argument for lids over a single bridge-like deck. It is not yet an engineer's number.
- **The politics.** A December 2 opening is a news hook. "San Francisco's version for owls and people, at half the cost per square foot" is a pitch. Don't make it until the per-square-foot number has an engineer behind it.

Sources: [Wikipedia](https://en.wikipedia.org/wiki/Wallis_Annenberg_Wildlife_Crossing) · [Governor's office, Feb 2026](https://www.gov.ca.gov/2026/02/02/california-closes-in-on-completing-the-worlds-largest-wildlife-crossing) · [ABC7, final $18M](https://abc7.com/post/california-provide-18-million-finish-wildlife-crossing-101-freeway-agoura-hills/18555105/) · [Save LA Cougars on the criticism](https://savelacougars.org/wildlife-bridge-faces-criticism-but-challenges-explain-costs/) · [Fox News, Duffy](https://www.foxnews.com/politics/duffy-mocks-newsoms-bridges-nowhere-california-wildlife-crossing-overruns-21m) · [KTLA, opening date](https://ktla.com/news/local-news/annenberg-wildlife-crossing-opening-date/amp/) · [WEF, dimensions](https://weforum.org/stories/2022/04/wildlife-crossing-california-highway-101) · [Reason, 35,700 sq ft](https://reason.com/2025/09/22/mountain-lions-in-los-angeles-dont-need-a-92-million-government-project-to-survive/printer/)

### 13.5 Quiet pavement: dropped as a lead item

Ben's point stands. Caltrans just finished repaving 19th Avenue from Lincoln to Holloway (work began Dec 2025, final phase spring 2026, ~18.8 lane-miles). The in-park stretch had its median barrier replaced in a ~$15M project in 2019–20. Crossover isn't due, and asking to tear up a sound roadbed on a 71,000-car artery buys opposition for 38 acres of modeled benefit. Keep it as a footnote: "when Caltrans next resurfaces, specify rubberized open-graded asphalt." That costs nothing to ask for now and can go in the cooperative agreement.

Sources: [Caltrans, 19th Ave rehabilitation](https://dot.ca.gov/caltrans-near-me/district-4/d4-projects/d4-san-francisco-freeway-and-road-rehabilitation/d4-19th-ave-paving-and-rehabilitation) · [Caltrans, Dec 2025 start](https://dot.ca.gov/caltrans-near-me/district-4/d4-news/2025-11-21-19th-ave-rehabilitation-project-to-begiin) · [Caltrans, median barrier in GGP](https://dot.ca.gov/caltrans-near-me/district-4/d4-news/caltrans-to-replace-median-barrier-on-state-route-1-in-golden-gate-park)

### 13.6 The crossings, re-evaluated

Ben's field knowledge changes the set:

| Crossing | Verdict | Why |
|---|---|---|
| **Strawberry Hill: Blue Heron Lake → Transverse** | **The main one.** | The 1,840-ft gap. The MLK intersection is the most congested spot in the park and an unpleasant walk even without fatalities on record. People walking from Elk Glen detour up to JFK to avoid it. |
| **Fulton at 17th–18th** | **The one Fulton crossing.** | 18th is the worst ratio on the whole edge (4.5×). There's already a 5 Fulton stop, paths on both sides of the bypass, and a favorable grade. |
| ~~Fulton at 19th (Prayer Book Cross Bridge)~~ | **Drop.** | It lands on a hill behind Prayer Book Cross and the falls that is steep, sometimes marshy, and hard to connect to JFK. It mostly duplicates 17th–18th. |
| **25th Ave spur at 22nd Ave** (optional third) | **Fix cheaply first.** | 22nd has a 5 stop, the 2023 signal and paved path. The problem is crossing the spur, where fast traffic and a loosely enforced yield at 25th make it unpleasant. |

**Pushback on the spur.** It's two lanes. A raised crosswalk with flashing beacons where the 22nd path meets the spur, plus a proper stop or signal at the 25th merge, would probably cost well under $1M. A bridge or short lid would be more like $5–15M. [modeled guess] The cheap version is also the kind of thing SFMTA and Caltrans do routinely, and it doesn't wait on the bigger project. Ownership of the spur (Caltrans or city, open question 1) decides who you ask.

**Grotto vs. bridge at Fulton 17th–18th.** By the page's own estimates the grotto is cheaper: $9–16M against $20–35M for a bridge. The road here sits only a few feet above the park side, so an underpass needs about 14 ft of drop (~280 ft of ramp at 5%) and lands at grade on the park side. A bridge needs about 21 ft of rise (17 ft clearance plus the structure), which means ~420 ft of ramp at 5% or a helical ramp. General guidance (LA's Complete Streets manual) is that underpasses usually cost less where the road is at or above grade, and more where you must dig deep or pump water. Underpass costs run about $900–5,600 per linear foot (Eagle County, CO), and our grotto is only ~110 ft long. The risks are particular to this site: groundwater (Ben's "sometimes marshy"), drainage, and people's sense of safety in a tunnel. A short, wide, well-lit grotto with daylight visible straight through answers the last of these. **Ben's access point stands either way.** The park-side landing has to turn east along the toe of the Prayer Book Cross hill toward JFK. A grotto that dumps you into the hillside doesn't solve the problem. This needs a path design on the lidar before a cost.

Sources: [LA Complete Streets, overpass vs underpass](https://completestreetdesignmanual.engineering.lacity.gov/e-500-design-criteria-special-street-components-and-projects/e-540-grade-separations/e-543-overpass) · [Michigan Tech CEW 2025, box culvert costs](https://ctt.mtu.edu/sites/ctt/files/resources/cew/2025/02a_Hedden_CEW_Prez_2025-02-13.pdf) · [walkinginfo.org](https://www.walkinginfo.org/engineering/crossings-overpasses/)

### 13.7 Why walking distance matters (before adding travel times)

The research supports the oblique benefit, with some care about scale:

- **Visits fall off with distance.** An NYU analysis of ~60 million park visits in 20 US metros found visits decline by a roughly constant percentage per mile, with a metro-specific half-distance (about 2 miles in Detroit). Falloff is steeper in neighborhoods with fewer cars. [source]
- **People travel farther than policy assumes.** A European survey found typical trips of 1.4–1.9 km, more than the few hundred meters used in policy targets. Large parks draw from far away; daily short visits are what local access drives. [source]
- **The 10-minute walk** (half a mile, Trust for Public Land's ParkScore) is the US planning standard. Everyone on Fulton is inside it as the crow flies. The point here is that the *network* distance, not the straight line, is what people experience. [verify the TPL definition]
- Studies of physical activity (Cohen et al., *AJPH* 2007, Los Angeles; Giles-Corti et al. 2005, Perth) link proximity and easy access to more park use and more walking. [from memory; verify before citing]

**What this means in minutes.** At 1.4 m/s, Fulton & 18th to JFK is about 2 minutes as the crow flies and about 8 minutes on foot today. That adds roughly 12 minutes to every round trip for a dog walk or a lunch break. The short, frequent visits are the ones most sensitive to that overhead. That's the honest frame for a travel-time layer on the map: minutes per round trip, block by block, today and with the crossing.

Sources: [NYU Tandon](https://engineering.nyu.edu/news/new-research-explains-how-far-will-people-go-day-park) · [Forests 2024, Changsha distance decay](https://mdpi.com/1999-4907/15/9/1589) · [Schindler et al. 2022](https://orbilu.uni.lu/bitstream/10993/58734/1/SchindlerLeTexierCaruso_Applied2022.pdf)

### 13.8 Ownership and money

City (Rec & Park) and state (Caltrans), as before. Federal money is a weaker bet than it looked. The federal Reconnecting Communities and Neighborhood Access grant programs have been cut back, and the current USDOT has made the Annenberg crossing a punchline. Assume no federal discretionary money before 2029. [verify the rescission details] The state's Highways to Boulevards pilot (~$149M) made its first awards in March 2024 (Arcata, South San Francisco, National City), and no new call has been found. The realistic stack is local sales tax (Prop L), state ATP for the crossings, and philanthropy for the lids.

Sources: [Caltrans RC:H2B](https://dot.ca.gov/programs/local-assistance/fed-and-state-programs/rc-h2b) · [Governor's office, 2024 awards](https://www.gov.ca.gov/2024/03/12/groundbreaking-effort-reconnects-communities-divided-by-freeways)

### 13.9 Owls

Ben reports the hooting has started and the owls are more active. It's an El Niño year with record eastern-Pacific warmth, so timing may run off the usual calendar. Field note, November 2026.

---

## 14. Working design (supersedes section 11's phase list)

1. **Strawberry Hill crossing.** A plain footbridge on the Romain Street model as the minimum; a lid as the full version.
2. **One Fulton crossing at 17th–18th.** A grotto or a bridge, decided by a path design and a groundwater check.
3. **Spur fix at 22nd.** Calming and a raised crossing first; a bridge only if that fails.
4. **String of four lids**, modular, each ≤787 ft so no ventilation plant is needed:
   - two on the Strawberry Hill bench between MLK and JFK (one of which is the "Strawberry Hill Lid" of section 11);
   - one on the bypass along Fulton, centered on 17th–18th, which also serves as the Fulton crossing;
   - one on the 25th Avenue spur, short because the road is narrow.

   **Modeled (Nov 21, now on the page):** the bench is only ~560 m (1,840 ft) from JFK to the MLK signal, so two 787-ft lids would nearly touch. A sweep of two-lid placements (lengths 180–240 m, gaps 60–150 m) found that closing the gap from 100 m to 60 m gains only about 1 acre. The page uses:

   | Lid | Stations (m from Fulton) | Length | Acres moved below 55 dBA, alone |
   |---|---|---|---|
   | Strawberry Hill north | 910–1110 | 656 ft | 9.6 |
   | Strawberry Hill south ("first lid" on the page) | 1210–1410 | 656 ft | 10.0 |
   | Bypass, Fulton 16th–18th | 320–560 | 787 ft | 7.4 |
   | Spur at the 22nd Ave path | ~100 m of spur | ~330 ft | 1.0 |
   | **All four** | | | **29.8** (96.3 → 66.5 acres above 55 dBA) |

   The old placement (four 787-ft lids along the mainline) quieted 46 acres. The new one trades about 16 acres of quiet for a crossing at every place people want one. The spur lid is all access and almost no quiet, which argues again for the cheap spur crossing first. Costs on the page: first lid $115–200M (scaled by length from $140–240M), all four $0.4–0.7B, crossings $30–52M. **Still open:** whether the 100 m (328 ft) gap is enough for a fire engineer to treat the bench lids as two short tunnels under NFPA 502. The Strawberry Hill footbridge sits in that gap at station 1160.

   **The Fulton crossing moved** from station 330 (16th–17th) to 440 (17th–18th). The lidar shows the bypass there on a low bank, road ~263 ft with ground ~249–253 ft on both sides, so an underpass lands nearly at grade at both ends; a 5% ramp to Fulton is ~72 ft. Walks to JFK: from 18th, 652 m → 218 m; from 17th, 574 → 246; from 16th, 481 → 340; from 19th, 558 → 312. Fulton & 17th to the boathouse: 1,212 → 807 m.
5. **Full tunnel**: kept on the page as the upper bound, not advocated. Ventilation over 3,900 ft makes it an unpleasant drive and a permanent operating cost, and the spur junction makes it hard to build.
6. **Quiet pavement**: a footnote ask for the next resurfacing (13.5).

---

## 15. Freedom to wander (November 21, prototype)

Ben's observation: walking and cycling on JFK feel an order of magnitude busier than on MLK, the JFK underpass is the choke point, and Hellman Hollow sees far more people than Elk Glen Lake on the MLK side. The question is whether Crossover's cost includes the plain joy of moving freely through the park, beyond noise. Scripts: `analysis/wander.py`, `wander2.py`, `wander3.py` (run from `$S` like the others). [modeled]

**What the walking network shows**

- **Two gates.** Inside the park, between Lincoln and Fulton, the six lanes can be crossed at exactly two places: the JFK underpass (station ~876 m) and the MLK signal (~1,420 m, two crosswalks across a divided road). Every walk between the west and east halves of the park uses one of them or goes out to Lincoln or Fulton. The highway splits the park into a 545-acre west part and a 434-acre east part, plus the 14-acre stranded strip. [measured]
- **By distance alone the split is even.** For 16,000 random west–east walks under 1.5 km, shortest paths use MLK 51% and JFK 46%. The gates are only ~550 m apart, so distance doesn't force anyone through JFK.
- **Any reluctance to cross six lanes at grade tips it.** Add even a 60 m "unpleasantness" penalty to the at-grade crossings and JFK takes the larger share. At 150 m, almost no one uses MLK; walks go through JFK or out to Lincoln. The exact numbers are model artifacts (MLK is two crosswalks, so a per-crossing penalty counts it twice), but the direction is robust. **If Ben's observed funneling is real, it is a choice about the quality of the crossing, not about distance.** That is a useful claim, because it's what a bridge or lid fixes and what a longer green light doesn't.
- **10-minute reach (800 m on foot), acres of park:**

  | From | Today | With the two crossings | With lids too |
  |---|---|---|---|
  | Fulton & 18th Ave | 24 | **60** | 60 |
  | Elk Glen Lake | 62 | 64 | 65 |
  | Blue Heron Lake, west shore | 89 | 89 | 89 |
  | Rainbow Falls | 84 | 85 | 85 |
  | Strawberry Hill summit | 75 | 75 | 76 |
  | Lloyd Lake | 54 | 54 | 54 |
  | Hellman Hollow | 46 | 46 | 46 |

  Honest reading: **inside the park, reach by distance barely changes.** The Strawberry Hill bridge and the lids don't open much new ground within ten minutes, because the JFK underpass and MLK are already close. The big gain is at the edge, from Fulton. So the wandering case for the bridge and lids is about how the walk feels (no six-lane crosswalk, no traffic noise, a continuous woodland walk from the lake to the western meadows), not about minutes.

**What would make this a real finding**

1. **Counts.** SFMTA and SFCTA have counted walkers and cyclists on JFK (a 2022 analysis between Kezar and the Tea Garden; Rec & Park reported pedestrian visits up 42% after the car-free change), and SFMTA counted vehicles on MLK. I found no published walking or cycling count for MLK, and none on either side of the Crossover gates. Ask SFMTA or Rec & Park for any automated counter data on JFK west of Crossover and on MLK; a weekend of manual counts at the two gates would also do. [open]
2. **Strava Metro.** Free to government agencies and their partners, not to individuals. A request through Rec & Park or SFCTA would give observed running and cycling volumes by segment, and would show the JFK–MLK imbalance directly if it's there. [verify terms]
3. **A "flow" plate.** Route many random walks across the network and draw each path's share of them, like a river map. The JFK underpass would light up as the neck of an hourglass. This is a good illustration, but it's a model of potential movement, so it needs the counts beside it.

**Names.** Speedway Meadow has been officially Hellman Hollow since 2011; the page's map still says Speedway Meadow. [verify the date]

Sources: [SFMTA, JFK data update 2022](https://www.sfmta.com/node/26260) · [SFCTA, JFK trip analysis 2022](https://sfcta.org/sites/default/files/2022-04/SFCTA-BOS_Board_GGP-JFKTripAnalysisKezarandTeaGardenPRESENTATION_2022-04-26.pdf) · [SFCTA, GGP weekend access 2007](https://SFCTA.org/sites/default/files/2021-02/GGP_weekend_access_2007.pdf)
