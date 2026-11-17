# Nightshift – regional places research (East Anglia, Kent, London)

_Compiled 17 November 2026. Research only – no app code changed._

## How this was put together

- **Sources:** driving and riding guides (PistonHeads "My Dream Drive", Porsche Roads, BestBikingRoads, Lexham, Wemoto), venue lists (The Biker Guide, MCN, Devitt), official sites (National Trust, English Heritage, Forestry England, MSV, TfL), and council and court notices for the places to avoid. Each row links its sources.
- **Coordinates:** points come from OpenStreetMap (Nominatim) and are matched against the named place or car park. Where only a postcode was available, the postcode centroid was used (postcodes.io) and confidence is set to medium.
- **Drive lines:** each drive was routed with OSRM (OpenStreetMap road data) through on-road points on the named roads. The road numbers it used were then checked against the source's description. Out-and-back spurs were removed. Waypoints are sampled from the routed line every ~1.2 miles (East Anglia), ~1 mile (Kent) or ~0.4 miles (London), so they sit on the actual road. The "Line" note says where the routed line leaves the named road.
- **Legal and safe:** every stop is a public car park, a visitor site or a venue that welcomes visitors. Known PSPO and injunction areas are listed separately under **Avoid**. Opening times, prices and meet dates change, so check before you publish them as live data.
- **Confidence:** _high_ means the place is confirmed against an official or map listing and the line follows the named roads. _medium_ means a postcode centroid, a route rebuilt from village names, or a partial deviation. _low_ means unverified.


## East Anglia

### Drives / routes (11)

| Name | Start → End | Miles | Description | Why it's good | Warnings | Line | Conf. | Sources |
|---|---|---|---|---|---|---|---|---|
| **A149 Norfolk Coast Road** | Hunstanton → Cromer | 37.4 | The classic north Norfolk coast road through flint villages, salt marshes and harbours (Brancaster, Holkham, Wells, Blakeney, Cley, Sheringham). | Described as a scenic, twisty ~34-mile coast road with seaside towns to stop in (Lexham); widely recommended as the north-coast route. | Very busy in summer and at weekends; repeated 30/40 mph village limits and narrow pinch points (Cley, Blakeney, Brancaster); lots of cyclists and walkers; vehicle-ASB PSPO in force in parts of Cromer (North Norfolk DC, from Aug 2024). | Line follows the A149 throughout (checked against road refs). (32 waypoints) | high | [1](https://lexhaminsurance.co.uk/blog/7-hidden-treasures-in-norfolk-for-motorcycle-enthusiasts) [2](https://modgov.north-norfolk.gov.uk/documents/s20322/Prohibition%20of%20inconsiderate%20and%20inappropriate%20vehicle%20use%20related%20to%20Antisocial%20Behaviour_.pdf) |
| **A1065 through Thetford Forest** | Barton Mills / Mildenhall → Fakenham | 37.8 | Sweeping A-road through the pine plantations of Thetford Forest, then open Breckland to Swaffham and on to Fakenham. | BestBikingRoads review of the A1065 Fakenham–Mildenhall praises the sweeping bends through Thetford Forest. | Tree cover limits visibility in places (source); deer and HGVs; town limits and level crossing at Brandon; the STANTA military training area borders the road north of Mundford – no stopping at gates. | Line is on the A1065 for its whole length. (32 waypoints) | high | [1](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/east-anglia/ride/a1065-fakenham-mildenhall) |
| **B1145 trans-Norfolk byway** | North Walsham → King's Lynn (Gaywood) | 49.0 | A quiet cross-county B-road from the north-east of Norfolk to King's Lynn, mixing long straights with tighter village sections. | PistonHeads "My Dream Drive": long straights, chicanes and challenging curves, often quiet because the A140 takes the traffic; listed on BestBikingRoads as "a trans-Norfolk byway". | Pheasants and other wildlife; tall hedges hide the view in low cars; greasy when wet; crosses the A140 at Aylsham. | On the B1145 except ~3 miles near Gayton where the router used parallel lanes. (41 waypoints) | medium | [1](https://www.pistonheads.com/news/ph-mydreamdrive/my-dream-drive-the-b1145/28186) [2](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/east-anglia/ride/b1145-mundesley-kings-lynn-a-trans-norfolk-byway) |
| **Suffolk Heritage Coast B-roads** | Orford → Beccles | 38.7 | Tight, hedge-lined B-roads behind the Suffolk coast via Snape, Leiston, Blythburgh and Southwold, finishing on the B1127 to Beccles. | PistonHeads "Suffolk B-road blast": B1084/B1069/B1122/B1125, constant precision needed, best section the winding B1127 towards Beccles; quiet early mornings. | Narrow sections, bumps and cambers; Snape and Leiston slow you down; A1095 into Southwold busy with tourists; Southwold parking very busy in summer. | Follows the roads named in the source. (33 waypoints) | high | [1](https://www.pistonheads.com/news/ph-mydreamdrive/suffolk-b-road-blast-my-dream-drive/29837) |
| **B1077 Ipswich to Attleborough** | Westerfield (Ipswich) → Attleborough | 36.8 | Rural B-road running parallel to the A140 through Debenham, Eye and Diss, alternating hedge-lined bends with open, fast sections. | PistonHeads "My Dream Drive" (to Wymondham): Occold–Debenham is the highlight, Quidenham section fast and well-sighted; quiet on Sunday mornings. | First miles out of Ipswich narrow and built-up; awkward A140 crossing with 40 mph limits; mud, tractors and animals. | Mostly on the B1077; short detours on lanes near Shelfanger and Diss. (32 waypoints) | medium | [1](https://www.pistonheads.com/news/ph-mydreamdrive/the-route-to-zenos-my-dream-drive/31287) |
| **Two Windmills (Suffolk B-roads)** | The Swan, Westerfield → Framlingham | 17.9 | A short twisty loop of mid-Suffolk lanes past Helmingham Hall and two windmills, finishing at Framlingham Castle. | Porsche Roads route (36 km): few junctions, "fast and flowing with some technical corners"; Saxtead Green mill flagged as a good convoy photo stop. | Congestion around Helmingham Hall events; standing water in places when wet; only fuel stop is Framlingham. | Porsche does not publish road numbers; line rebuilt through the named villages. (16 waypoints) | medium | [1](https://roads.porsche.com/content/en/routes/two-windmills-long-suffolk-b-road) |
| **Norfolk east coast road (old B1159)** | Caister-on-Sea → Cromer | 33.2 | Minor coast road behind the dunes via Winterton, Horsey, Sea Palling, Happisburgh, Mundesley and Overstrand. | Former B1159 Cromer–Great Yarmouth coast road (now mostly C-road, per Wikipedia); Horsey and Happisburgh are popular stops; Lexham lists Horsey–Bastwick among Broads rides. | Narrow, many 30 mph villages, caravans and summer traffic at Hemsby/Winterton; coastal erosion closures possible near Happisburgh; Great Yarmouth borough has a vehicle-ASB PSPO. | Uses several minor roads; small inland deviations around Happisburgh and Mundesley. (29 waypoints) | medium | [1](https://en.wikipedia.org/wiki/B1159_road) [2](https://lexhaminsurance.co.uk/blog/7-hidden-treasures-in-norfolk-for-motorcycle-enthusiasts) |
| **Northern Broads run** | Hoveton (Wroxham) → Acle | 16.1 | Through the heart of the northern Broads via Horning, Ludham and Potter Heigham, past rivers, mills and staithes. | Lexham lists Hoveton–Horning and other Broads loops as recommended rides; Broads National Park scenery. | Hoveton/Wroxham and Potter Heigham very busy in summer; boatyard traffic; many 30/40 mph limits. | On the A1062, A149 and A1064. (15 waypoints) | medium | [1](https://lexhaminsurance.co.uk/blog/7-hidden-treasures-in-norfolk-for-motorcycle-enthusiasts) |
| **Reedham Ferry crossing** | Acle → Bungay | 21.1 | Marshland lanes from Acle to Reedham, across the Yare on Norfolk's last chain ferry, then south through Loddon to Bungay. | Lexham lists Reedham among Broads routes; Reedham Ferry is the only vehicle crossing of the Yare between Norwich and Great Yarmouth (Wikipedia: carries three cars). | Ferry is tolled, small (3 cars) and can stop in very high/low water – check before you go; short stretch of the busy A47 Acle Straight; single-track marsh lanes. | Router confirms the ferry leg. (19 waypoints) | high | [1](https://en.wikipedia.org/wiki/Reedham_Ferry) [2](https://lexhaminsurance.co.uk/blog/7-hidden-treasures-in-norfolk-for-motorcycle-enthusiasts) |
| **B1108 Norwich to Bodney** | Colney (Norwich) → Bodney (A1065) | 25.7 | Straightforward rural B-road south-west of Norwich through Hingham and Watton, linking to the A1065 and Thetford Forest. | BestBikingRoads: a good alternative route south from Norwich, reaching the A1065 and Norfolk's other B-roads. | Watton town traffic; village limits; military land near Bodney – no stopping at gates. | Entirely on the B1108. (22 waypoints) | high | [1](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/east-anglia/ride/b1108-colney-bodney-alternative-route-south-from-norwich) |
| **Lowestoft to Southwold** | Pakefield (Lowestoft) → Southwold | 10.6 | Short coastal link from Britain's most easterly town down the A12 to Wrentham, then the B1127 into Southwold. | Natural connector between Ness Point and Southwold Pier photo stops; the B1127 is part of the PistonHeads Suffolk B-road route. | A12 single carriageway with HGVs; Kessingland limits; Southwold busy in summer. | On the A12 and B1127. (10 waypoints) | medium | [1](https://www.pistonheads.com/news/ph-mydreamdrive/suffolk-b-road-blast-my-dream-drive/29837) |

### Photo spots (15)

| Name | Lat, Lng | Description | Why it's good / events | Warnings | Conf. | Sources |
|---|---|---|---|---|---|---|
| **Ness Point, Lowestoft** | 52.4812, 1.7627 | Britain's most easterly point, with the Euroscope marker and wind turbine. | Unique "most easterly" landmark. | Industrial approach; park in the town car parks (Hamilton Road) and walk – don't block the access road. | high | [1](https://en.wikipedia.org/wiki/Ness_Point) |
| **Southwold Pier & North Parade** | 52.3304, 1.6868 | Pier, beach huts and seafront; the pier car park and North Road parking are a short walk away. | Well-known Suffolk seaside backdrop. | Very busy in summer; pay parking; North Parade is narrow. | high | [1](https://southwoldpier.co.uk/) |
| **Dunwich Heath (Coastguard Cottages)** | 52.2520, 1.6280 | National Trust clifftop car park on the heath, purple heather in late summer. | NT car park with sea and heath views. | NT car park charges for non-members; check closing times. | high | [1](https://www.nationaltrust.org.uk/visit/suffolk/dunwich-heath-and-beach) |
| **The Scallop, Aldeburgh** | 52.1605, 1.6058 | Maggi Hambling's steel shell sculpture on the shingle north of Aldeburgh; car park on Thorpe Road nearby. | Distinctive sculpture and big skies. | Car park only – never drive on the shingle; busy at weekends. | high | [1](https://www.thesuffolkcoast.co.uk/) |
| **Orford Quay** | 52.0909, 1.5392 | Quay car park on the River Ore looking towards Orford Ness. | Quiet riverside backdrop at the end of the Suffolk coast route. | Pay car park; small and busy on summer weekends. | high | [1](https://www.pistonheads.com/news/ph-mydreamdrive/suffolk-b-road-blast-my-dream-drive/29837) |
| **Framlingham Castle** | 52.2242, 1.3467 | English Heritage castle with its own car park, at the end of the Two Windmills route. | Named point on the Porsche Roads route. | EH opening hours; car park charge for non-members. | high | [1](https://www.english-heritage.org.uk/visit/places/framlingham-castle/) [2](https://roads.porsche.com/content/en/routes/two-windmills-long-suffolk-b-road) |
| **Saxtead Green Post Mill** | 52.2319, 1.2984 | Restored post mill beside the A1120 on the village green. | Porsche Roads calls it "a good convoy photo spot". | Park considerately; don't drive on the green; A1120 traffic. | high | [1](https://www.english-heritage.org.uk/visit/places/saxtead-green-post-mill/) [2](https://roads.porsche.com/content/en/routes/two-windmills-long-suffolk-b-road) |
| **Horsey Windpump** | 52.7411, 1.6390 | National Trust drainage mill beside Horsey Mere, with a car park. | Iconic Broads windmill on the east coast road. | NT car park charges; busy in seal season (Nov–Feb). | high | [1](https://www.nationaltrust.org.uk/visit/norfolk/horsey-windpump) |
| **St Benet's Abbey** | 52.6861, 1.5251 | Ruined abbey gatehouse with a windmill built into it, on the marshes by the River Bure. | Classic Broads landmark. | Narrow single-track access lane with a small car park; soft verges. | high | [1](https://en.wikipedia.org/wiki/St_Benet%27s_Abbey) |
| **Happisburgh Lighthouse** | 52.8205, 1.5370 | Red-and-white striped lighthouse, the only independently run lighthouse in Britain. | Striking backdrop on the east coast road. | Lighthouse Lane is narrow – use the village car park; erosion closures near the cliff. | high | [1](https://www.happisburgh.org/lighthouse) |
| **Cromer Pier & clifftop** | 52.9337, 1.3014 | Victorian pier below the town, with clifftop viewpoints. | End point of both coast routes. | Pay car parks; North Norfolk vehicle-ASB PSPO covers parts of Cromer – no gatherings or revving. | high | [1](https://www.cromer-pier.com/) [2](https://modgov.north-norfolk.gov.uk/documents/s20322/Prohibition%20of%20inconsiderate%20and%20inappropriate%20vehicle%20use%20related%20to%20Antisocial%20Behaviour_.pdf) |
| **Old Hunstanton lighthouse & cliffs** | 52.9513, 0.4963 | Clifftop car park by the old lighthouse above the striped cliffs; west-facing sunsets over the Wash. | Start of the A149 coast road; Biker Guide notes plenty of parking at the Cliff Top café. | Pay parking; busy summer evenings. | high | [1](https://www.thebikerguide.co.uk/bikerfriendlyplacescafespubsnorfolk) |
| **Lady Anne's Drive, Holkham** | 52.9646, 0.8145 | Estate-run drive and parking leading to Holkham beach and pinewoods. | Famous beach access off the A149. | Private estate road with paid parking; strictly no gatherings; very busy in summer. | high | [1](https://www.holkham.co.uk/) |
| **Blakeney Quay** | 52.9558, 1.0164 | Quayside car park on the salt marshes, with boats and big skies. | Popular north Norfolk harbour. | The quay car park floods on high spring tides – check tide times; pay parking. | high | [1](https://www.nationaltrust.org.uk/visit/norfolk/blakeney-national-nature-reserve) |
| **High Lodge, Thetford Forest** | 52.4345, 0.6632 | Forestry England visitor centre deep in Thetford Forest, reached by a forest drive. | Tall pines and forest roads. | Paid entry/parking; gates close at set times; 10–20 mph on site. | high | [1](https://www.forestryengland.uk/high-lodge) |

### Tracks, circuits & sprint venues (12)

| Name | Lat, Lng | Description | Why it's good / events | Warnings | Conf. | Sources |
|---|---|---|---|---|---|---|
| **Snetterton Circuit** | 52.4654, 0.9476 | MSV-run 300/200/100 circuit off the A11; British Superbikes, club racing and track days. | The main circuit in East Anglia (Lexham, MSV). | Track days and events must be booked; noise limits. | high | [1](https://www.msv.com/snetterton) [2](https://lexhaminsurance.co.uk/blog/7-hidden-treasures-in-norfolk-for-motorcycle-enthusiasts) |
| **Ellough Park Raceway** | 52.4341, 1.6006 | Outdoor kart circuit near Beccles. | Closest circuit to Lowestoft. | Booking required. | high | [1](https://www.elloughparkraceway.co.uk/) |
| **Adrian Flux Arena, King's Lynn** | 52.7302, 0.3892 | Speedway and oval stock-car stadium at Saddlebow. | Regular spectator motorsport. | Spectator venue; check fixtures. | high | [1](https://www.adrianfluxarena.co.uk/) |
| **Foxhall Stadium, Ipswich** | 52.0544, 1.2251 | Oval stadium hosting Spedeworth stock cars/bangers and Ipswich speedway. | Long-running Suffolk oval venue. | Spectator venue; check fixtures. | high | [1](https://www.spedeworth.co.uk/) |
| **Great Yarmouth Stadium** | 52.6370, 1.7278 | Oval track at Caister hosting Spedeworth stock-car meetings (and greyhounds). | Spectator oval racing near Great Yarmouth. | Spectator venue; check fixtures. | high | [1](https://www.spedeworth.co.uk/) |
| **Swaffham Raceway** | 52.6548, 0.6310 | Oval short-track for stock cars and bangers. | Regular oval racing. | Spectator venue; check fixtures. | high | [1](https://www.swaffhamraceway.co.uk/) |
| **Mildenhall Stadium, West Row** | 52.3686, 0.4290 | Oval stadium (stock cars; former Fen Tigers speedway). | Spedeworth listed stock-car meetings in 2026. | Damaged by fire in 2024; check current fixtures. Coordinate from postcode IP28 8QU. | medium | [1](https://en.wikipedia.org/wiki/Mildenhall_Stadium) [2](https://spedeworth.co.uk/bookedin.php?id=2982) |
| **Bentwaters Parks** | 52.1232, 1.4304 | Former USAF airbase near Woodbridge used for driving experiences, events and filming. | Historic speed-trial venue (Motor Sport archive). | Private site – event/booking access only. | medium | [1](https://www.bentwatersparks.com/) [2](https://www.motorsportmagazine.com/archive/article/june-2006/80/a-rival-to-snetterton-cicruit/) |
| **Hit the Dirt, Swaffham** | 52.6564, 0.6257 | Off-road motocross/dirt track next to Swaffham Raceway. | Lexham: open in most weather, youth track for small bikes. | Booking; off-road bikes only. | high | [1](https://lexhaminsurance.co.uk/blog/7-hidden-treasures-in-norfolk-for-motorcycle-enthusiasts) |
| **Santa Pod Raceway (near)** | 52.2357, -0.6016 | Europe's best-known drag strip, on the Beds/Northants border; public Run What You Brung days. | Nearest drag strip to East Anglia. | Outside the three areas (Bedfordshire); event tickets. | high | [1](https://www.santapod.co.uk/) |
| **Bedford Autodrome (near)** | 52.2341, -0.4719 | MSV airfield circuit at Thurleigh used for track days and driving experiences. | Popular track-day venue within reach of East Anglia and London. | Outside the three areas (Bedfordshire); booking required. | high | [1](https://www.msv.com/bedford-autodrome) |
| **Rockingham (closed)** | 52.5146, -0.6597 | Former oval/road circuit at Corby, closed to racing in 2018 and now a logistics hub – listed so it is not added as an active venue. | Historical only. | Not open to the public for driving. | medium | [1](https://en.wikipedia.org/wiki/Rockingham_Motor_Speedway) |

### Meet venues (cafés, bike nights, cars & coffee) (14)

| Name | Lat, Lng | Description | Why it's good / events | Warnings | Conf. | Sources |
|---|---|---|---|---|---|---|
| **Whitwell & Reepham Station** | 52.7520, 1.0974 | Heritage station with bar and food near Reepham. | Official Friday bike night 5–10pm, Mar–Oct; up to 1,000 bikes in summer (Biker Guide). | Seasonal; bikes focus. | high | [1](https://www.thebikerguide.co.uk/bikerfriendlyplacescafespubsnorfolk) [2](https://lexhaminsurance.co.uk/blog/7-hidden-treasures-in-norfolk-for-motorcycle-enthusiasts) |
| **Grumpy's Café, Earsham Mill** | 52.4469, 1.4226 | Café at the old mill near Bungay. | Official Wednesday bike meet Mar–Oct, from 5pm. | Seasonal; check dates. | high | [1](https://www.thebikerguide.co.uk/bikerfriendlyplacescafespubsnorfolk) [2](https://eadt.co.uk/news/24726213.biker-nights-return-grumpys-cafe-earsham-mill) |
| **Red Hart, Bodham** | 52.9160, 1.1614 | Village pub near Holt. | Bike night last Monday of the month, Mar–Sep, from 5pm. | Pub – no drink-driving. | high | [1](https://www.thebikerguide.co.uk/bikerfriendlyplacescafespubsnorfolk) |
| **Ox & Plough, Old Buckenham** | 52.4821, 1.0421 | Pub on the village green. | "Two Wheel Tuesday" summer meet, from ~30 to 700+ bikes (Lexham). | Seasonal; check current dates. | medium | [1](https://lexhaminsurance.co.uk/blog/7-hidden-treasures-in-norfolk-for-motorcycle-enthusiasts) |
| **The Angel, Larling** | 52.4630, 0.9169 | Pub just off the A11 near Snetterton. | "Throttle Thursdays" weekly meet (Visit Norwich). | Check current season. | medium | [1](https://www.visitnorwich.co.uk/?p=85480) |
| **Route 11 Kitchen, Besthorpe** | 52.5328, 1.0518 | Roadside café on the A11 Attleborough bypass. | Lexham: space for bike meets. | A11 northbound access only. | medium | [1](https://lexhaminsurance.co.uk/blog/7-hidden-treasures-in-norfolk-for-motorcycle-enthusiasts) |
| **Rondo's, Fendick Fisheries** | 52.5487, 0.5503 | Café at a fishery near King's Lynn. | "Wicked Wheelie Wednesdays" every other Wednesday from March (Biker Guide). | Coordinate from postcode PE33 9GP. | medium | [1](https://www.thebikerguide.co.uk/bikerfriendlyplacescafespubsnorfolk) |
| **Krazy Horse, Bury St Edmunds** | 52.2684, 0.7052 | Motorcycle dealer with café and showroom. | Official bike night 1st Thursday of the month, Apr–Oct, 6–10pm. | Check dates. | high | [1](https://www.thebikerguide.co.uk/bikerfriendlymeetingplacescafespubssuffolk) [2](https://www.krazyhorse.co.uk/) |
| **The Limeburners, Offton** | 52.1016, 1.0284 | Pub with chip shop next door, near Ipswich. | Official bike night 1st Wednesday of each month, all year. | Pub – no drink-driving. Coordinate from postcode. | medium | [1](https://www.thebikerguide.co.uk/bikerfriendlymeetingplacescafespubssuffolk) |
| **TTT Motorcycle Village, Sudbury** | 52.0364, 0.7137 | Bike dealer, workshop, dyno and café. | Monday late nights with outdoor events and live music. | Check events. | high | [1](https://www.thebikerguide.co.uk/bikerfriendlymeetingplacescafespubssuffolk) [2](https://www.tttmotorcyclevillage.co.uk/) |
| **Skydive Diner, Beccles** | 52.4351, 1.6022 | Diner at Beccles heliport/airfield. | Monthly "Bikes & Breakfast" meet (dates vary). | Fri–Sun 09:00–14:00; coordinate from postcode. | medium | [1](https://www.thebikerguide.co.uk/bikerfriendlymeetingplacescafespubssuffolk) |
| **Kersey Mill (Miller's Kitchen)** | 52.0616, 0.9335 | Mill complex with café near Hadleigh. | AROC East Anglia "Italian Cars & Coffee" and free Cars & Coffee events. | Club-run dates; check AROC. | medium | [1](https://aroc-uk.com/community/area-sections/east-anglia/) |
| **Norfolk & Suffolk Aviation Museum, Flixton** | 52.4355, 1.3968 | Aviation museum near Bungay with parking. | Listed by The Biker Guide (Norfolk and Suffolk pages) as a ride-out stop. | Wed/Sat/Sun 10:00–16:00 only; no regular meet. | high | [1](https://www.thebikerguide.co.uk/bikerfriendlymeetingplacescafespubssuffolk) [2](https://www.thebikerguide.co.uk/bikerfriendlyplacescafespubsnorfolk) |
| **Norfolk Motorcycle Museum, North Walsham** | 52.8169, 1.3851 | 150+ motorcycles from the 1900s–1980s. | Recommended by Lexham. | Small site; check hours. | high | [1](https://lexhaminsurance.co.uk/blog/7-hidden-treasures-in-norfolk-for-motorcycle-enthusiasts) |

## Kent

### Drives / routes (8)

| Name | Start → End | Miles | Description | Why it's good | Warnings | Line | Conf. | Sources |
|---|---|---|---|---|---|---|---|---|
| **Alkham Valley Road** | Hawkinge (A260) → Kearsney (Dover) | 4.7 | Short, flowing valley road through Alkham between Folkestone and Dover, used by local riders instead of the A20. | BestBikingRoads: good bends and cambers, popular local alternative to the A20. | Reviewers say 40/50 mph limits now cover most of it and police are seen more; a couple of bends and junctions have poor visibility. | Entirely on Alkham Valley Road. (6 waypoints) | high | [1](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/south-east-england/ride/alkham-valley-road-folkestone-dover) |
| **Stone Street (B2068)** | Stanford (M20 J11) → Canterbury | 12.3 | Arrow-straight Roman road over the North Downs with crests and dips, via Stelling Minnis and Petham. | Listed on BestBikingRoads (17 km). | Staggered crossroads (source); the long straights invite speed – keep it legal; farm traffic. | Entirely on the B2068. (13 waypoints) | high | [1](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/south-east-england/ride/b2068-stanford-canterbury-stone-street) |
| **Romney Marsh coast** | Hythe → Camber (East Sussex border) | 17.4 | Flat, open marsh roads from Hythe along the Dymchurch coast to New Romney and Lydd, then past the ranges to Camber. | Wemoto "Across the Marsh": a favourite testing ground; BestBikingRoads A259 review rates the back road past Lydd ranges to Camber. | Police presence across the marsh (source); Lydd ranges – obey red flags and don't stop; Dymchurch seafront busy in summer. | A259, St Mary's Road and B2075/Jury's Gap Road. (18 waypoints) | high | [1](https://www.wemoto.com/blogs/across_the_marsh) [2](https://bestbikingroads.nl/motorroutes/verenigd-koninkrijk/south-east-england/ride/a259-hythe-hastings) |
| **Dungeness coast road** | New Romney → Lydd | 7.9 | Coast Drive past Greatstone to the shingle headland at Dungeness, with its lighthouses and black huts, returning inland to Lydd. | Popular ride-out destination (MyRoute "Round trip from Orpington to Dungeness"; Light Railway Café listed by The Biker Guide). | Dungeness is a privately owned estate and nature reserve – stay on the road and in car parks, never drive on the shingle; homes there are private; don't stop at the power station gates. | Coast Drive and Dungeness Road. (9 waypoints) | medium | [1](https://www.myrouteapp.com/motor-and-car-routes/gb/1561782/Round-trip-from-Orpington-to-Dungeness-) [2](https://www.thebikerguide.co.uk/bikerfriendlycafemeetingplaceskent) |
| **Kentish countryside loop** | Tonbridge → Tonbridge | 59.3 | Weald loop via Lamberhurst, Newenden, Tenterden, Biddenden and Goudhurst on the A21, A28 and A262. | BestBikingRoads (69 km): mix of fast sweepers and tighter corners; best on late weekday mornings. | Patchy repairs; speed cameras in villages; police most likely at Tenterden, Hawkhurst and on the A21; weekend traffic. | Router cut a corner near Hawkhurst via lanes; otherwise on the named A-roads. (60 waypoints) | medium | [1](https://bestbikingroads.nl/motorroutes/verenigd-koninkrijk/south-east-england/ride/a21-a262-tonbridge-lamberhurst-newenden-tenterden-biddenden-goudhurst-kentish-countryside-loop) |
| **White Cliffs to Deal** | Dover → Deal | 11.5 | Up out of Dover past the castle to St Margaret's at Cliffe and Kingsdown, then along the front to Walmer and Deal. | Links the National Trust White Cliffs car park, St Margaret's Bay and Deal pier (biker-friendly cafés listed by The Biker Guide). | St Margaret's Bay hill is steep and narrow; Deal seafront busy in summer. | A258 plus village roads. (13 waypoints) | medium | [1](https://www.nationaltrust.org.uk/visit/kent/the-white-cliffs-of-dover) [2](https://www.thebikerguide.co.uk/bikerfriendlycafemeetingplaceskent) |
| **Folkestone–Dover clifftop (B2011)** | Folkestone → Dover | 8.2 | The old clifftop road via Capel-le-Ferne and the Battle of Britain Memorial, with Channel views, dropping into Dover on the A20. | Quieter, more scenic alternative to the A20; passes the Battle of Britain Memorial (visitor car park). | Clifftop gusts; Capel-le-Ferne 30 mph; A20 into Dover carries port freight traffic. | B2011 then A20. (10 waypoints) | medium | [1](https://www.battleofbritainmemorial.org/) |
| **Thanet coast** | Herne Bay → Ramsgate | 20.2 | Along the north Kent coast from Herne Bay past Reculver Towers to Margate, Broadstairs and Ramsgate. | Strings together Reculver Towers, Botany Bay and the Thanet seafronts; Thanet regularly hosts large bike events (KentOnline). | Margate/Broadstairs seafronts slow and busy in summer; 20 mph zones; parking charges. | Mix of A299/A28 and coast roads. (21 waypoints) | medium | [1](https://www.english-heritage.org.uk/visit/places/reculver-towers-and-roman-fort/) [2](https://www.kentonline.co.uk/kent/news/thousands-of-bikers-heading-for-thanet-in-f-a103989/) |

### Photo spots (10)

| Name | Lat, Lng | Description | Why it's good / events | Warnings | Conf. | Sources |
|---|---|---|---|---|---|---|
| **Dungeness Old Lighthouse** | 50.9137, 0.9697 | Old and new lighthouses, the light railway and black huts on the shingle; parking by the old lighthouse. | Much-photographed, otherworldly landscape. | Private estate and nature reserve – park only in marked areas, never on the shingle; respect private homes. | high | [1](https://www.rhdr.org.uk/) [2](https://www.thebikerguide.co.uk/bikerfriendlycafemeetingplaceskent) |
| **Samphire Hoe** | 51.1049, 1.2753 | Country park made from Channel Tunnel spoil, reached through a traffic-light-controlled tunnel from the A20. | Under the white cliffs with sea views. | Single-lane access tunnel; pay car park; gates close in the evening. | medium | [1](https://www.samphirehoe.com/) |
| **White Cliffs of Dover (Langdon Cliffs)** | 51.1316, 1.3375 | National Trust car park and visitor centre on the clifftop overlooking Dover port. | Views over the cliffs and ferries. | Car park 07:00–19:00; charge for non-members (£5–6). | high | [1](https://www.nationaltrust.org.uk/visit/kent/the-white-cliffs-of-dover) |
| **Battle of Britain Memorial, Capel-le-Ferne** | 51.0985, 1.2060 | Clifftop memorial with Spitfire and Hurricane replicas and a visitor car park. | On the B2011 clifftop route. | Respectful memorial site – no meets. | high | [1](https://www.battleofbritainmemorial.org/) |
| **St Margaret's Bay** | 51.1509, 1.3856 | Small shingle bay under the cliffs with a beach car park. | Quiet cove on the White Cliffs to Deal route. | Steep, narrow hill down; small car park fills fast. | high | [1](https://www.nationaltrust.org.uk/visit/kent/the-white-cliffs-of-dover) |
| **Reculver Towers** | 51.3795, 1.1997 | Twin towers of a ruined church on the coast, with a country park car park. | Landmark on the Thanet coast route. | Pay car park; exposed in bad weather. | high | [1](https://www.english-heritage.org.uk/visit/places/reculver-towers-and-roman-fort/) |
| **Botany Bay, Kingsgate** | 51.3884, 1.4340 | Chalk stacks and sandy bay; clifftop car park on Botany Road. | Classic Thanet coastline. | Pay parking; busy summer weekends. | high | [1](https://www.visitkent.co.uk/) |
| **Folkestone Harbour Arm** | 51.0762, 1.1925 | Restored harbour arm and old station with food stalls; harbour parking nearby. | Industrial-chic seafront backdrop. | Pay parking; events at weekends. | high | [1](https://www.folkestoneharbourarm.co.uk/) |
| **Bluebell Hill picnic site** | 51.3315, 0.5012 | Kent County Council picnic site and viewpoint over the Medway valley. | Elevated view near Chatham. | Check closing times; no meets; A229 junctions are fast. | medium | [1](https://www.explorekent.org/) |
| **Historic Dockyard Chatham** | 51.3949, 0.5283 | Georgian dockyard and film location with paid visitor parking. | Period buildings and cobbles (with permission). | Ticketed site; commercial/car shoots need permission. | high | [1](https://www.thedockyard.co.uk/) |

### Tracks, circuits & sprint venues (3)

| Name | Lat, Lng | Description | Why it's good / events | Warnings | Conf. | Sources |
|---|---|---|---|---|---|---|
| **Brands Hatch** | 51.3575, 0.2600 | MSV Indy and GP circuits near West Kingsdown; BSB, BTCC, club racing and track days. | Kent's major circuit. | Booking/tickets; noise limits; M20/A20 traffic on event days. | high | [1](https://www.msv.com/brands-hatch) |
| **Lydden Hill Race Circuit** | 51.1782, 1.1988 | Short circuit near Canterbury; rallycross, sprints, track days and Cars, Bikes & Coffee evenings. | Runs its own public Cars, Bikes & Coffee meets (from £3) and SBD sprints. | Event tickets; check dates. | high | [1](https://lyddenhill.co.uk/) [2](https://lyddenhill.co.uk/events/cbc) [3](https://sbdmotorsport.co.uk/events/lydden-sprint-3/) |
| **Buckmore Park Karting** | 51.3430, 0.5012 | Well-known kart circuit near Chatham. | Classic Kent karting venue. | Booking required. | high | [1](https://www.buckmore.co.uk/) |

### Meet venues (cafés, bike nights, cars & coffee) (9)

| Name | Lat, Lng | Description | Why it's good / events | Warnings | Conf. | Sources |
|---|---|---|---|---|---|---|
| **Oakdene Café, Wrotham** | 51.3042, 0.3332 | Truckers' and bikers' café on the A20 near Brands Hatch. | Large Wednesday evening bike nights (MCN "Meet of the week"); open to 10pm Weds. | A20 junction; busy Wednesday evenings. | high | [1](https://motorcyclenews.com/news/2017/october/oakdene-cafe-meet-of-the-week) |
| **Nell's Café, Gravesend** | 51.4088, 0.3877 | Biker café on the A2 with a large car park. | Official Thursday bike night 6–9pm; owner welcomes meets. | A2 slip-road access. | high | [1](https://www.thebikerguide.co.uk/bikerfriendlycafemeetingplaceskent) |
| **Airport Café, Sellindge** | 51.0907, 1.0155 | Classic A20 café with off-road parking. | Regular car and bike nights; very popular on Sundays. | Check event nights. | high | [1](https://www.thebikerguide.co.uk/bikerfriendlycafemeetingplaceskent) [2](https://www.devittinsurance.com/?p=60358) |
| **Blue & White Café, Smeeth** | 51.1184, 0.9532 | A20 café with a large parking area. | Used by local bikers on Sunday rides. | Coordinate from postcode TN25 6SP. | medium | [1](https://www.thebikerguide.co.uk/bikerfriendlycafemeetingplaceskent) [2](https://devittinsurance.com/?p=58988) |
| **Hook & Hatchet Inn, Hucking** | 51.2936, 0.6340 | Country pub on the North Downs with camping. | Official "Two Wheeled Tuesdays" bike nights in summer. | Narrow lanes; pub – no drink-driving. | high | [1](https://www.thebikerguide.co.uk/bikerfriendlycafemeetingplaceskent) [2](https://www.hookandhatchet.co.uk/) |
| **The Picnic Hut, Burmarsh** | 51.0401, 1.0023 | Farm café on Romney Marsh. | Listed with Monday 5–8pm bike meets. | Coordinate from postcode TN29 0JR. | medium | [1](https://www.thebikerguide.co.uk/bikerfriendlycafemeetingplaceskent) |
| **E-Type UK, Hadlow** | 51.2251, 0.3076 | Jaguar E-Type specialist with private parking. | Hosts "Coffee, Cakes & Classic Cars" meets. | Event dates only; coordinate from postcode TN11 9QU. | medium | [1](https://etypeuk.com/) |
| **Dover Transport Museum** | 51.1506, 1.2904 | Transport museum with 70+ classic motorcycles and café. | Biker Guide listing. | Wed & Sun only; phone ahead for groups. | high | [1](https://www.thebikerguide.co.uk/bikerfriendlycafemeetingplaceskent) [2](https://www.dovertransportmuseum.org.uk/) |
| **Light Railway Café, Dungeness** | 50.9142, 0.9706 | Café at Dungeness station on the RH&DR. | Biker Guide listing; end point of the Dungeness route. | Private estate parking rules. | medium | [1](https://www.thebikerguide.co.uk/bikerfriendlycafemeetingplaceskent) [2](https://www.rhdr.org.uk/) |

## London

### Drives / routes (5)

| Name | Start → End | Miles | Description | Why it's good | Warnings | Line | Conf. | Sources |
|---|---|---|---|---|---|---|---|---|
| **Embankment & Tower Bridge night loop** | Parliament Square → Westminster Bridge | 7.7 | Classic after-dark loop: Victoria Embankment and Upper/Lower Thames Street east to Tower Bridge, back along the South Bank to Westminster Bridge. | Takes in the most-photographed river frontage (Parliament, the Embankment, Tower Bridge) on public main roads. | ULEZ applies 24/7 (non-compliant vehicles pay daily). Congestion Charge (£18/day from Jan 2026) applies Mon–Fri 07:00–18:00 and Sat/Sun/bank holidays 12:00–18:00 – run it after 18:00. 20 mph limits on most central roads; red routes = no stopping. Westminster/K&C High Court injunction and PSPO: no racing, stunts, revving or organised meets – revving/dangerous driving penalties apply 18:00–07:00. Tower Bridge closes for lifts. | A3211/A100/A3200 – checked. (20 waypoints) | high | [1](https://tfl.gov.uk/modes/driving/congestion-charge) [2](https://tfl.gov.uk/modes/driving/ultra-low-emission-zone) [3](https://localgovernmentlawyer.co.uk/transport-and-highways/443-transport-and-highways-news/100859-westminster-secures-injunction-in-bid-to-tackle-anti-social-driving-in-central-london) |
| **Chelsea & Battersea river loop** | Millbank → Millbank | 6.9 | West along Grosvenor Road and Chelsea Embankment, over Battersea Bridge and back past Battersea Power Station and Nine Elms. | Riverside roads with views of the Power Station and Albert Bridge lights. | ULEZ applies 24/7 (non-compliant vehicles pay daily). Congestion Charge (£18/day from Jan 2026) applies Mon–Fri 07:00–18:00 and Sat/Sun/bank holidays 12:00–18:00 – run it after 18:00. 20 mph limits on most central roads; red routes = no stopping. | A3212/A3220/A3205/A3036. (18 waypoints) | high | [1](https://tfl.gov.uk/modes/driving/congestion-charge) [2](https://tfl.gov.uk/modes/driving/ultra-low-emission-zone) [3](https://batterseapowerstation.co.uk/) |
| **Canary Wharf & Isle of Dogs loop** | Limehouse Link → Limehouse Link | 8.2 | Through the Limehouse Link tunnel to Westferry Circus, round the Isle of Dogs on Westferry and Manchester Roads, back via Aspen Way. | Skyscraper views at night on public roads around the Canary Wharf estate. | Canary Wharf estate roads are private and patrolled – no stopping or filming there without permission; no stopping in the tunnel; 20 mph in Tower Hamlets. ULEZ applies (outside the Congestion Charge zone). | A1203/A1261/A1206. (21 waypoints) | high | [1](https://tfl.gov.uk/modes/driving/ultra-low-emission-zone) [2](https://canarywharf.com/) |
| **Royal Docks & Woolwich Ferry** | Canning Town → Greenwich Peninsula | 8.9 | Past Royal Victoria and Royal Albert Docks and London City Airport, across the Thames on the free Woolwich Ferry, back west to the Peninsula. | Free TfL vehicle ferry with views of the Thames Barrier; open dockside roads. | Ferry runs daytime/early evening only and can be suspended for fog or tides (check TfL); ULEZ applies; Blackwall and Silvertown tunnels nearby are tolled during the day. | Router confirms the ferry leg. (23 waypoints) | high | [1](https://tfl.gov.uk/modes/river/woolwich-ferry) [2](https://tfl.gov.uk/modes/driving/ultra-low-emission-zone) |
| **Westway (A40) elevated** | Marylebone Road → White City | 3.4 | The elevated A40 Westway from Paddington to White City, at its best at night with the city lights below. | Iconic elevated urban motorway-style road (Wikipedia). | Speed cameras; no stopping; ULEZ applies. | On the A40. (9 waypoints) | high | [1](https://en.wikipedia.org/wiki/Westway_(London)) [2](https://tfl.gov.uk/modes/driving/ultra-low-emission-zone) |

### Photo spots (12)

| Name | Lat, Lng | Description | Why it's good / events | Warnings | Conf. | Sources |
|---|---|---|---|---|---|---|
| **Battersea Power Station** | 51.4818, -0.1446 | Restored power station and riverside; use the on-site car park. | Iconic chimneys and river views. | Private estate – security may stop filming; ULEZ. | high | [1](https://batterseapowerstation.co.uk/) |
| **Greenwich Peninsula / The O2** | 51.5029, 0.0032 | Riverside around the O2 with Canary Wharf across the water; O2 car parks. | Skyline views at night. | Private estate in parts; Blackwall/Silvertown tunnels tolled in the day; ULEZ. | high | [1](https://www.greenwichpeninsula.co.uk/) |
| **Royal Victoria Dock** | 51.5066, 0.0284 | Dockside with cable car and ExCeL; use the ExCeL or dockside car parks. | Wide open waterside views. | Busy during ExCeL events; ULEZ. | high | [1](https://www.royaldocks.london/) |
| **Canary Wharf (Canada Square)** | 51.5051, -0.0178 | Glass towers and lit-up plazas; park in the estate car parks. | Classic night-time city backdrop. | Private estate: security stops unauthorised filming and stopping; no gatherings. | medium | [1](https://canarywharf.com/) |
| **Tower Bridge from Potters Fields** | 51.5042, -0.0784 | Shoot Tower Bridge from the Potters Fields riverside; the bridge itself is a no-stopping red route. | London's most recognisable bridge. | No stopping on the bridge or approaches; pay parking nearby; 20 mph; Congestion Charge in the day. | high | [1](https://en.wikipedia.org/wiki/Potters_Fields_Park) [2](https://tfl.gov.uk/modes/driving/congestion-charge) |
| **Westminster Bridge & Parliament** | 51.5009, -0.1218 | Rolling or pavement shots of cars with Big Ben behind. | Iconic London backdrop. | No stopping (red route); Westminster car-meet injunction/PSPO – no gatherings or revving; Congestion Charge in the day. | high | [1](https://localgovernmentlawyer.co.uk/transport-and-highways/443-transport-and-highways-news/100859-westminster-secures-injunction-in-bid-to-tackle-anti-social-driving-in-central-london) [2](https://tfl.gov.uk/modes/driving/congestion-charge) |
| **Victoria Embankment** | 51.5102, -0.1172 | Lamp-lined riverside road with views to the London Eye; good for moving shots. | Classic night-run backdrop. | No stopping on the red route – use nearby paid car parks; Westminster PSPO 18:00–07:00 for revving/anti-social driving. | high | [1](https://localgovernmentlawyer.co.uk/transport-and-highways/443-transport-and-highways-news/100859-westminster-secures-injunction-in-bid-to-tackle-anti-social-driving-in-central-london) [2](https://tfl.gov.uk/modes/driving/congestion-charge) |
| **Alexandra Palace terrace** | 51.5950, -0.1289 | Hilltop palace with a panoramic view over London; on-site car parks. | One of the best free skyline views. | Park in marked bays only; no meets; events can close car parks. | medium | [1](https://www.alexandrapalace.com/) |
| **Greenwich Park (General Wolfe viewpoint)** | 51.4777, -0.0004 | Viewpoint over Queen's House and Canary Wharf; Blackheath Avenue car park alongside. | Classic London panorama. | Royal Parks car park is pay-and-display and closes with the park at dusk. | high | [1](https://www.royalparks.org.uk/visit/parks/greenwich-park) |
| **Thames Barrier Park** | 51.5007, 0.0342 | Landscaped park looking out to the Thames Barrier gates. | Unusual industrial-river backdrop. | Park opening hours; limited parking nearby; ULEZ. | medium | [1](https://www.royaldocks.london/) |
| **Queen Elizabeth Olympic Park (Orbit)** | 51.5383, -0.0130 | ArcelorMittal Orbit, London Stadium and modern architecture; park car parks. | Modern architecture backdrop. | Event-day closures; private estate rules on filming. | high | [1](https://www.queenelizabetholympicpark.co.uk/) |
| **Richmond Hill viewpoint** | 51.4542, -0.2999 | Protected view over the Thames towards Twickenham. | Famous protected view. | Limited roadside parking – use local pay car parks; residents nearby, no gatherings. | medium | [1](https://en.wikipedia.org/wiki/Richmond_Hill,_London) |

### Meet venues (cafés, bike nights, cars & coffee) (8)

| Name | Lat, Lng | Description | Why it's good / events | Warnings | Conf. | Sources |
|---|---|---|---|---|---|---|
| **Ace Café London** | 51.5413, -0.2777 | The original rockers' café on the North Circular at Stonebridge. | Runs regular themed bike and car nights and monthly club meets (Ace Café website). | Behave on exit – the North Circular is heavily policed; ULEZ. | high | [1](https://london.acecafe.com/) |
| **Bike Shed Motorcycle Club, Shoreditch** | 51.5270, -0.0787 | Motorcycle café, bar and shop in railway arches on Old Street. | Well-known London bike hangout with bike parking. | Congestion Charge zone edge; limited parking. | high | [1](https://www.thebikeshed.cc/) |
| **Krazy Horse London, Welling** | 51.4645, 0.0935 | Motorcycle shop with café and workshop. | Biker Guide listing. | Coordinate from postcode DA16 3RQ. | medium | [1](https://www.thebikerguide.co.uk/bikerfriendlycafemeetingplaceskent) |
| **Biggin Hill Memorial Museum** | 51.3271, 0.0239 | RAF memorial museum with café and car park. | Biker Guide listing; Spitfire history. | Tue–Sun 10:00–17:00. | high | [1](https://www.thebikerguide.co.uk/bikerfriendlycafemeetingplaceskent) |
| **London Concours (HAC, City Road)** | 51.5230, -0.0885 | Annual summer concours at the Honourable Artillery Company grounds. | Official annual car event. | Ticketed; Congestion Charge zone. | high | [1](https://www.londonconcours.co.uk/) |
| **Concours of Elegance, Hampton Court Palace** | 51.4037, -0.3377 | Annual concours in the palace grounds (Richmond upon Thames). | Official annual car event. | Ticketed; ULEZ. | high | [1](https://www.concoursofelegance.co.uk/) |
| **Ryka's, Box Hill (Surrey – outside area)** | 51.2555, -0.3224 | Famous bikers' café at the foot of Box Hill, Surrey. | Long-standing bike meet spot; included for reference only. | Surrey, not London; heavy police attention on the A24/Zig Zag Road. | high | [1](https://www.rykas.co.uk/) |
| **Brooklands Museum (Surrey – outside area)** | 51.3552, -0.4633 | Museum on the old banked circuit at Weybridge with regular car events. | Official events and club days; reference only. | Surrey, not London; ticketed. | high | [1](https://www.brooklandsmuseum.com/) |

## Avoid – PSPO, injunction and dispersal hotspots

These are not suggestions. Use them to keep the app from surfacing these places, and to warn users nearby. They are not in the JSON.

| Area | Place / order | What applies | Sources |
|---|---|---|---|
| East Anglia | **Great Yarmouth – vehicle PSPO (seafront incl. Marine Parade, North Drive area, South Denes)** | Vehicle-ASB PSPO since 2017, renewed to 2029; noise camera on Marine Parade; £80 FPNs; 2025 consultation proposed extending it borough-wide. Problem roads named: Gorleston/Bradwell link road, Lowestoft Road, Caister bypass/Norwich Road. | [1](https://www.great-yarmouth.gov.uk/article/15590/Measures-renewed-to-tackle-vehicle-related-anti-social-behaviour-in-Great-Yarmouth) [2](https://www.great-yarmouth.gov.uk/article/15166/Have-your-say-on-proposals-to-tackle-vehicle-anti-social-behaviour-in-Great-Yarmouth) |
| East Anglia | **Felixstowe seafront – PSPO bans car meets** | East Suffolk PSPO (Dec 2025, to Dec 2028): illegal to organise, promote or take part in a car meet in the restricted area. | [1](https://www.eastsuffolk.gov.uk/sites/default/files/2025-12/Felixstowe%20Public%20Space%20Protection%20Order.pdf) |
| East Anglia | **Norwich – vehicle-ASB PSPO** | Covers several city locations; renewed from 26 July 2026 for three years. | [1](https://www.norwich.gov.uk/your-council-explained/policies-plans-and-strategies/public-spaces-protection-orders-pspos/vehicle) |
| East Anglia | **Broadland & South Norfolk (incl. Longwater Retail Park)** | District-wide vehicle PSPOs; Longwater was the start point of a large unofficial meet that moved to Caister/Great Yarmouth (police crackdown reported). Norfolk Police run Operation Octane against car-meet ASB. | [1](https://www.southnorfolkandbroadland.gov.uk/news/9-reduction-in-vehicle-related-anti-social-behaviour-1) [2](https://www.greatyarmouthmercury.co.uk/news/24200148.police-crack-illegal-driving-norfolk-car-meet/) [3](https://norfolk.gov.uk/article/65499/Operation-Octane) |
| East Anglia | **Cromer – North Norfolk vehicle PSPO** | In force from 20 Aug 2024 for three years. | [1](https://modgov.north-norfolk.gov.uk/documents/s20322/Prohibition%20of%20inconsiderate%20and%20inappropriate%20vehicle%20use%20related%20to%20Antisocial%20Behaviour_.pdf) |
| London | **Westminster & Kensington and Chelsea – High Court car-cruising injunction** | Interim order 24 June 2026, full order 30 July 2026, with power of arrest: Knightsbridge & Belgravia, Hyde Park, St James and West End wards (Westminster) and Brompton & Hans Town (K&C); Exhibition Road named hotspot. Bans racing, stunts, revving/dangerous driving (18:00–07:00) and organising/promoting meets. Treat Knightsbridge/Mayfair "supercar spotting" as look-only, no gatherings. | [1](https://www.rbkc.gov.uk/community-and-local-life/community-safety/car-cruising-injunction-order) [2](https://localgovernmentlawyer.co.uk/transport-and-highways/443-transport-and-highways-news/100859-westminster-secures-injunction-in-bid-to-tackle-anti-social-driving-in-central-london) [3](https://southlondon.co.uk/news/council-applies-for-borough-wide-injunction-to-tackle-illegal-car-meets/) |
| London | **Enfield – borough-wide car-cruising injunction** | In force since Dec 2024, extended; power of arrest and custodial sentences for breaches. Named hotspots: A10 (average-speed cameras), Enfield Retail Park (EN1 1TH), Southbury Leisure Centre. | [1](https://enfield.gov.uk/services/your-council/injunction-order-car-cruising) [2](https://enfielddispatch.co.uk/injunction-against-car-cruising-in-enfield-extended-for-another-year/) |
| Kent | **Halstead / Polhill area (Sevenoaks) – nuisance-vehicle PSPO** | Sevenoaks DC PSPO after complaints of car meets and racing, with Kent Police, the Met and Bromley. | [1](https://www.kentonline.co.uk/sevenoaks/news/boy-racers-face-fines-over-noisy-car-cruising-events-304087/) |
| Kent | **Medway, Dartford and Sheerness – police dispersal orders** | Kent Police have used 48-hour dispersal zones against planned car meets (Medway, Sheerness) and Dartford. | [1](https://www.kentonline.co.uk/medway/news/police-take-action-to-stop-boy-racers-267107/) [2](https://www.kentonline.co.uk/sheerness/news/dispersal-order-to-stop-planned-race-meet-300812/) [3](https://www.kentonline.co.uk/dartford/news/this-is-good-progress-but-it-needs-to-happen-every-week-243773/) |

Also excluded on purpose: residential streets, private land without public access (e.g. Fersfield airfield, now private), the Knightsbridge/Mayfair "supercar spotting" streets as a gathering place (they sit inside the Westminster/K&C injunction area), and the A47 Acle Straight as a "drive" (it is a fast, narrow, high-casualty road; only a short link is used on the Reedham route).

## Route waypoints

The full waypoint lists are in the `path` field of each drive in the JSON below (lat/lng to 4 decimal places, on the routed road line).

## Machine-readable data

```json
[
 {
  "id": "ea-a149-coast",
  "kind": "drive",
  "name": "A149 Norfolk Coast Road",
  "area": "East Anglia",
  "description": "The classic north Norfolk coast road through flint villages, salt marshes and harbours (Brancaster, Holkham, Wells, Blakeney, Cley, Sheringham).",
  "warnings": "Very busy in summer and at weekends; repeated 30/40 mph village limits and narrow pinch points (Cley, Blakeney, Brancaster); lots of cyclists and walkers; vehicle-ASB PSPO in force in parts of Cromer (North Norfolk DC, from Aug 2024).",
  "at": {
   "lat": 52.9393,
   "lng": 0.4904
  },
  "path": [
   {
    "lat": 52.9393,
    "lng": 0.4904
   },
   {
    "lat": 52.9509,
    "lng": 0.505
   },
   {
    "lat": 52.9566,
    "lng": 0.5316
   },
   {
    "lat": 52.9587,
    "lng": 0.5595
   },
   {
    "lat": 52.9596,
    "lng": 0.5888
   },
   {
    "lat": 52.9619,
    "lng": 0.6179
   },
   {
    "lat": 52.9628,
    "lng": 0.6464
   },
   {
    "lat": 52.966,
    "lng": 0.6745
   },
   {
    "lat": 52.9631,
    "lng": 0.7034
   },
   {
    "lat": 52.9555,
    "lng": 0.7279
   },
   {
    "lat": 52.963,
    "lng": 0.7507
   },
   {
    "lat": 52.9601,
    "lng": 0.7788
   },
   {
    "lat": 52.9602,
    "lng": 0.8063
   },
   {
    "lat": 52.9578,
    "lng": 0.8343
   },
   {
    "lat": 52.9521,
    "lng": 0.8562
   },
   {
    "lat": 52.947,
    "lng": 0.8825
   },
   {
    "lat": 52.9502,
    "lng": 0.9096
   },
   {
    "lat": 52.9484,
    "lng": 0.9363
   },
   {
    "lat": 52.9531,
    "lng": 0.9579
   },
   {
    "lat": 52.9556,
    "lng": 0.985
   },
   {
    "lat": 52.9536,
    "lng": 1.0124
   },
   {
    "lat": 52.9527,
    "lng": 1.0394
   },
   {
    "lat": 52.9548,
    "lng": 1.0644
   },
   {
    "lat": 52.9517,
    "lng": 1.0913
   },
   {
    "lat": 52.9427,
    "lng": 1.1138
   },
   {
    "lat": 52.9428,
    "lng": 1.1412
   },
   {
    "lat": 52.9409,
    "lng": 1.1713
   },
   {
    "lat": 52.9422,
    "lng": 1.2001
   },
   {
    "lat": 52.9369,
    "lng": 1.2267
   },
   {
    "lat": 52.9374,
    "lng": 1.2546
   },
   {
    "lat": 52.9336,
    "lng": 1.2824
   },
   {
    "lat": 52.931,
    "lng": 1.3012
   }
  ],
  "miles": 37.4,
  "start": "Hunstanton",
  "end": "Cromer",
  "sources": [
   "https://lexhaminsurance.co.uk/blog/7-hidden-treasures-in-norfolk-for-motorcycle-enthusiasts",
   "https://modgov.north-norfolk.gov.uk/documents/s20322/Prohibition%20of%20inconsiderate%20and%20inappropriate%20vehicle%20use%20related%20to%20Antisocial%20Behaviour_.pdf"
  ],
  "confidence": "high"
 },
 {
  "id": "ea-a1065-forest",
  "kind": "drive",
  "name": "A1065 through Thetford Forest",
  "area": "East Anglia",
  "description": "Sweeping A-road through the pine plantations of Thetford Forest, then open Breckland to Swaffham and on to Fakenham.",
  "warnings": "Tree cover limits visibility in places (source); deer and HGVs; town limits and level crossing at Brandon; the STANTA military training area borders the road north of Mundford – no stopping at gates.",
  "at": {
   "lat": 52.3667,
   "lng": 0.5401
  },
  "path": [
   {
    "lat": 52.3667,
    "lng": 0.5401
   },
   {
    "lat": 52.3844,
    "lng": 0.5425
   },
   {
    "lat": 52.3968,
    "lng": 0.5603
   },
   {
    "lat": 52.4066,
    "lng": 0.5798
   },
   {
    "lat": 52.424,
    "lng": 0.584
   },
   {
    "lat": 52.4371,
    "lng": 0.6026
   },
   {
    "lat": 52.4484,
    "lng": 0.6236
   },
   {
    "lat": 52.4644,
    "lng": 0.6333
   },
   {
    "lat": 52.4799,
    "lng": 0.646
   },
   {
    "lat": 52.4977,
    "lng": 0.6519
   },
   {
    "lat": 52.5139,
    "lng": 0.66
   },
   {
    "lat": 52.5349,
    "lng": 0.6714
   },
   {
    "lat": 52.5522,
    "lng": 0.6775
   },
   {
    "lat": 52.5688,
    "lng": 0.6883
   },
   {
    "lat": 52.5826,
    "lng": 0.7001
   },
   {
    "lat": 52.6004,
    "lng": 0.6976
   },
   {
    "lat": 52.6172,
    "lng": 0.6924
   },
   {
    "lat": 52.6344,
    "lng": 0.689
   },
   {
    "lat": 52.6494,
    "lng": 0.6888
   },
   {
    "lat": 52.6677,
    "lng": 0.6879
   },
   {
    "lat": 52.6851,
    "lng": 0.6883
   },
   {
    "lat": 52.7004,
    "lng": 0.7015
   },
   {
    "lat": 52.7147,
    "lng": 0.7177
   },
   {
    "lat": 52.7311,
    "lng": 0.7257
   },
   {
    "lat": 52.7475,
    "lng": 0.7403
   },
   {
    "lat": 52.765,
    "lng": 0.7467
   },
   {
    "lat": 52.774,
    "lng": 0.771
   },
   {
    "lat": 52.7838,
    "lng": 0.7945
   },
   {
    "lat": 52.8002,
    "lng": 0.8051
   },
   {
    "lat": 52.8145,
    "lng": 0.8216
   },
   {
    "lat": 52.8285,
    "lng": 0.8374
   },
   {
    "lat": 52.8349,
    "lng": 0.8373
   }
  ],
  "miles": 37.8,
  "start": "Barton Mills / Mildenhall",
  "end": "Fakenham",
  "sources": [
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/east-anglia/ride/a1065-fakenham-mildenhall"
  ],
  "confidence": "high"
 },
 {
  "id": "ea-b1145",
  "kind": "drive",
  "name": "B1145 trans-Norfolk byway",
  "area": "East Anglia",
  "description": "A quiet cross-county B-road from the north-east of Norfolk to King's Lynn, mixing long straights with tighter village sections.",
  "warnings": "Pheasants and other wildlife; tall hedges hide the view in low cars; greasy when wet; crosses the A140 at Aylsham.",
  "at": {
   "lat": 52.831,
   "lng": 1.3895
  },
  "path": [
   {
    "lat": 52.831,
    "lng": 1.3895
   },
   {
    "lat": 52.824,
    "lng": 1.3705
   },
   {
    "lat": 52.8206,
    "lng": 1.3474
   },
   {
    "lat": 52.819,
    "lng": 1.3236
   },
   {
    "lat": 52.8131,
    "lng": 1.2995
   },
   {
    "lat": 52.8094,
    "lng": 1.2736
   },
   {
    "lat": 52.792,
    "lng": 1.2671
   },
   {
    "lat": 52.787,
    "lng": 1.2472
   },
   {
    "lat": 52.7866,
    "lng": 1.2232
   },
   {
    "lat": 52.7766,
    "lng": 1.1996
   },
   {
    "lat": 52.7692,
    "lng": 1.1739
   },
   {
    "lat": 52.7739,
    "lng": 1.1474
   },
   {
    "lat": 52.77,
    "lng": 1.123
   },
   {
    "lat": 52.7621,
    "lng": 1.0999
   },
   {
    "lat": 52.7594,
    "lng": 1.0725
   },
   {
    "lat": 52.7537,
    "lng": 1.0455
   },
   {
    "lat": 52.7436,
    "lng": 1.0269
   },
   {
    "lat": 52.7444,
    "lng": 0.9988
   },
   {
    "lat": 52.742,
    "lng": 0.9702
   },
   {
    "lat": 52.7451,
    "lng": 0.9415
   },
   {
    "lat": 52.7527,
    "lng": 0.9154
   },
   {
    "lat": 52.7524,
    "lng": 0.8922
   },
   {
    "lat": 52.7457,
    "lng": 0.8682
   },
   {
    "lat": 52.7395,
    "lng": 0.8415
   },
   {
    "lat": 52.7306,
    "lng": 0.8154
   },
   {
    "lat": 52.7236,
    "lng": 0.7895
   },
   {
    "lat": 52.7266,
    "lng": 0.7622
   },
   {
    "lat": 52.733,
    "lng": 0.7364
   },
   {
    "lat": 52.7436,
    "lng": 0.7143
   },
   {
    "lat": 52.7539,
    "lng": 0.6907
   },
   {
    "lat": 52.7585,
    "lng": 0.6627
   },
   {
    "lat": 52.7537,
    "lng": 0.6355
   },
   {
    "lat": 52.7449,
    "lng": 0.6102
   },
   {
    "lat": 52.746,
    "lng": 0.5827
   },
   {
    "lat": 52.7553,
    "lng": 0.567
   },
   {
    "lat": 52.7499,
    "lng": 0.5383
   },
   {
    "lat": 52.7473,
    "lng": 0.5109
   },
   {
    "lat": 52.7503,
    "lng": 0.4821
   },
   {
    "lat": 52.7535,
    "lng": 0.4527
   },
   {
    "lat": 52.757,
    "lng": 0.4248
   },
   {
    "lat": 52.754,
    "lng": 0.4041
   }
  ],
  "miles": 49.0,
  "start": "North Walsham",
  "end": "King's Lynn (Gaywood)",
  "sources": [
   "https://www.pistonheads.com/news/ph-mydreamdrive/my-dream-drive-the-b1145/28186",
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/east-anglia/ride/b1145-mundesley-kings-lynn-a-trans-norfolk-byway"
  ],
  "confidence": "medium"
 },
 {
  "id": "ea-suffolk-coast-b",
  "kind": "drive",
  "name": "Suffolk Heritage Coast B-roads",
  "area": "East Anglia",
  "description": "Tight, hedge-lined B-roads behind the Suffolk coast via Snape, Leiston, Blythburgh and Southwold, finishing on the B1127 to Beccles.",
  "warnings": "Narrow sections, bumps and cambers; Snape and Leiston slow you down; A1095 into Southwold busy with tourists; Southwold parking very busy in summer.",
  "at": {
   "lat": 52.0949,
   "lng": 1.5341
  },
  "path": [
   {
    "lat": 52.0949,
    "lng": 1.5341
   },
   {
    "lat": 52.1111,
    "lng": 1.5259
   },
   {
    "lat": 52.1211,
    "lng": 1.5035
   },
   {
    "lat": 52.1333,
    "lng": 1.4832
   },
   {
    "lat": 52.1423,
    "lng": 1.4608
   },
   {
    "lat": 52.1502,
    "lng": 1.4618
   },
   {
    "lat": 52.1581,
    "lng": 1.4861
   },
   {
    "lat": 52.1718,
    "lng": 1.5009
   },
   {
    "lat": 52.1799,
    "lng": 1.519
   },
   {
    "lat": 52.1831,
    "lng": 1.5428
   },
   {
    "lat": 52.1942,
    "lng": 1.5643
   },
   {
    "lat": 52.2096,
    "lng": 1.5746
   },
   {
    "lat": 52.2255,
    "lng": 1.582
   },
   {
    "lat": 52.2398,
    "lng": 1.5667
   },
   {
    "lat": 52.2534,
    "lng": 1.5677
   },
   {
    "lat": 52.2681,
    "lng": 1.5808
   },
   {
    "lat": 52.2837,
    "lng": 1.5909
   },
   {
    "lat": 52.3009,
    "lng": 1.5932
   },
   {
    "lat": 52.3176,
    "lng": 1.5991
   },
   {
    "lat": 52.3312,
    "lng": 1.609
   },
   {
    "lat": 52.3379,
    "lng": 1.633
   },
   {
    "lat": 52.3354,
    "lng": 1.66
   },
   {
    "lat": 52.3405,
    "lng": 1.6768
   },
   {
    "lat": 52.3564,
    "lng": 1.677
   },
   {
    "lat": 52.372,
    "lng": 1.6714
   },
   {
    "lat": 52.3894,
    "lng": 1.6714
   },
   {
    "lat": 52.4076,
    "lng": 1.6785
   },
   {
    "lat": 52.4163,
    "lng": 1.6566
   },
   {
    "lat": 52.4229,
    "lng": 1.6324
   },
   {
    "lat": 52.4348,
    "lng": 1.6131
   },
   {
    "lat": 52.4432,
    "lng": 1.5906
   },
   {
    "lat": 52.4533,
    "lng": 1.5688
   },
   {
    "lat": 52.4582,
    "lng": 1.5624
   }
  ],
  "miles": 38.7,
  "start": "Orford",
  "end": "Beccles",
  "sources": [
   "https://www.pistonheads.com/news/ph-mydreamdrive/suffolk-b-road-blast-my-dream-drive/29837"
  ],
  "confidence": "high"
 },
 {
  "id": "ea-b1077",
  "kind": "drive",
  "name": "B1077 Ipswich to Attleborough",
  "area": "East Anglia",
  "description": "Rural B-road running parallel to the A140 through Debenham, Eye and Diss, alternating hedge-lined bends with open, fast sections.",
  "warnings": "First miles out of Ipswich narrow and built-up; awkward A140 crossing with 40 mph limits; mud, tractors and animals.",
  "at": {
   "lat": 52.0851,
   "lng": 1.1723
  },
  "path": [
   {
    "lat": 52.0851,
    "lng": 1.1723
   },
   {
    "lat": 52.1011,
    "lng": 1.1815
   },
   {
    "lat": 52.1165,
    "lng": 1.1874
   },
   {
    "lat": 52.1331,
    "lng": 1.1868
   },
   {
    "lat": 52.1483,
    "lng": 1.1959
   },
   {
    "lat": 52.1652,
    "lng": 1.1976
   },
   {
    "lat": 52.181,
    "lng": 1.2035
   },
   {
    "lat": 52.1959,
    "lng": 1.2032
   },
   {
    "lat": 52.2084,
    "lng": 1.1929
   },
   {
    "lat": 52.2216,
    "lng": 1.1833
   },
   {
    "lat": 52.2374,
    "lng": 1.1825
   },
   {
    "lat": 52.2527,
    "lng": 1.1727
   },
   {
    "lat": 52.2694,
    "lng": 1.1686
   },
   {
    "lat": 52.2828,
    "lng": 1.1516
   },
   {
    "lat": 52.2971,
    "lng": 1.1546
   },
   {
    "lat": 52.314,
    "lng": 1.1543
   },
   {
    "lat": 52.3286,
    "lng": 1.1458
   },
   {
    "lat": 52.3408,
    "lng": 1.1304
   },
   {
    "lat": 52.3554,
    "lng": 1.1312
   },
   {
    "lat": 52.3697,
    "lng": 1.1235
   },
   {
    "lat": 52.3768,
    "lng": 1.1023
   },
   {
    "lat": 52.3938,
    "lng": 1.1007
   },
   {
    "lat": 52.4107,
    "lng": 1.0966
   },
   {
    "lat": 52.4253,
    "lng": 1.0874
   },
   {
    "lat": 52.4381,
    "lng": 1.0732
   },
   {
    "lat": 52.4548,
    "lng": 1.073
   },
   {
    "lat": 52.4713,
    "lng": 1.0624
   },
   {
    "lat": 52.4778,
    "lng": 1.0401
   },
   {
    "lat": 52.4912,
    "lng": 1.0279
   },
   {
    "lat": 52.5082,
    "lng": 1.0278
   },
   {
    "lat": 52.5165,
    "lng": 1.0094
   },
   {
    "lat": 52.5178,
    "lng": 1.0102
   }
  ],
  "miles": 36.8,
  "start": "Westerfield (Ipswich)",
  "end": "Attleborough",
  "sources": [
   "https://www.pistonheads.com/news/ph-mydreamdrive/the-route-to-zenos-my-dream-drive/31287"
  ],
  "confidence": "medium"
 },
 {
  "id": "ea-two-windmills",
  "kind": "drive",
  "name": "Two Windmills (Suffolk B-roads)",
  "area": "East Anglia",
  "description": "A short twisty loop of mid-Suffolk lanes past Helmingham Hall and two windmills, finishing at Framlingham Castle.",
  "warnings": "Congestion around Helmingham Hall events; standing water in places when wet; only fuel stop is Framlingham.",
  "at": {
   "lat": 52.0851,
   "lng": 1.1723
  },
  "path": [
   {
    "lat": 52.0851,
    "lng": 1.1723
   },
   {
    "lat": 52.0905,
    "lng": 1.195
   },
   {
    "lat": 52.1038,
    "lng": 1.2058
   },
   {
    "lat": 52.118,
    "lng": 1.2187
   },
   {
    "lat": 52.1316,
    "lng": 1.2338
   },
   {
    "lat": 52.1432,
    "lng": 1.2211
   },
   {
    "lat": 52.16,
    "lng": 1.2158
   },
   {
    "lat": 52.1745,
    "lng": 1.2028
   },
   {
    "lat": 52.1902,
    "lng": 1.2075
   },
   {
    "lat": 52.1998,
    "lng": 1.2097
   },
   {
    "lat": 52.2091,
    "lng": 1.2258
   },
   {
    "lat": 52.2172,
    "lng": 1.2527
   },
   {
    "lat": 52.2243,
    "lng": 1.2762
   },
   {
    "lat": 52.2315,
    "lng": 1.3015
   },
   {
    "lat": 52.2276,
    "lng": 1.3283
   },
   {
    "lat": 52.2222,
    "lng": 1.3415
   }
  ],
  "miles": 17.9,
  "start": "The Swan, Westerfield",
  "end": "Framlingham",
  "sources": [
   "https://roads.porsche.com/content/en/routes/two-windmills-long-suffolk-b-road"
  ],
  "confidence": "medium"
 },
 {
  "id": "ea-norfolk-east-coast",
  "kind": "drive",
  "name": "Norfolk east coast road (old B1159)",
  "area": "East Anglia",
  "description": "Minor coast road behind the dunes via Winterton, Horsey, Sea Palling, Happisburgh, Mundesley and Overstrand.",
  "warnings": "Narrow, many 30 mph villages, caravans and summer traffic at Hemsby/Winterton; coastal erosion closures possible near Happisburgh; Great Yarmouth borough has a vehicle-ASB PSPO.",
  "at": {
   "lat": 52.6509,
   "lng": 1.7237
  },
  "path": [
   {
    "lat": 52.6509,
    "lng": 1.7237
   },
   {
    "lat": 52.667,
    "lng": 1.7155
   },
   {
    "lat": 52.6807,
    "lng": 1.6997
   },
   {
    "lat": 52.6953,
    "lng": 1.6882
   },
   {
    "lat": 52.7109,
    "lng": 1.6892
   },
   {
    "lat": 52.7162,
    "lng": 1.6738
   },
   {
    "lat": 52.7238,
    "lng": 1.6532
   },
   {
    "lat": 52.7396,
    "lng": 1.6399
   },
   {
    "lat": 52.7538,
    "lng": 1.6447
   },
   {
    "lat": 52.7658,
    "lng": 1.6254
   },
   {
    "lat": 52.7795,
    "lng": 1.6156
   },
   {
    "lat": 52.7851,
    "lng": 1.591
   },
   {
    "lat": 52.7834,
    "lng": 1.5632
   },
   {
    "lat": 52.7943,
    "lng": 1.5488
   },
   {
    "lat": 52.8005,
    "lng": 1.5304
   },
   {
    "lat": 52.806,
    "lng": 1.5089
   },
   {
    "lat": 52.8212,
    "lng": 1.5045
   },
   {
    "lat": 52.8381,
    "lng": 1.5028
   },
   {
    "lat": 52.8479,
    "lng": 1.4829
   },
   {
    "lat": 52.8564,
    "lng": 1.4639
   },
   {
    "lat": 52.8641,
    "lng": 1.4406
   },
   {
    "lat": 52.8789,
    "lng": 1.4355
   },
   {
    "lat": 52.883,
    "lng": 1.408
   },
   {
    "lat": 52.896,
    "lng": 1.3934
   },
   {
    "lat": 52.9024,
    "lng": 1.3675
   },
   {
    "lat": 52.9135,
    "lng": 1.3478
   },
   {
    "lat": 52.9201,
    "lng": 1.3211
   },
   {
    "lat": 52.9302,
    "lng": 1.3025
   },
   {
    "lat": 52.931,
    "lng": 1.3012
   }
  ],
  "miles": 33.2,
  "start": "Caister-on-Sea",
  "end": "Cromer",
  "sources": [
   "https://en.wikipedia.org/wiki/B1159_road",
   "https://lexhaminsurance.co.uk/blog/7-hidden-treasures-in-norfolk-for-motorcycle-enthusiasts"
  ],
  "confidence": "medium"
 },
 {
  "id": "ea-broads-north",
  "kind": "drive",
  "name": "Northern Broads run",
  "area": "East Anglia",
  "description": "Through the heart of the northern Broads via Horning, Ludham and Potter Heigham, past rivers, mills and staithes.",
  "warnings": "Hoveton/Wroxham and Potter Heigham very busy in summer; boatyard traffic; many 30/40 mph limits.",
  "at": {
   "lat": 52.7126,
   "lng": 1.4106
  },
  "path": [
   {
    "lat": 52.7126,
    "lng": 1.4106
   },
   {
    "lat": 52.7095,
    "lng": 1.4366
   },
   {
    "lat": 52.7077,
    "lng": 1.4638
   },
   {
    "lat": 52.7005,
    "lng": 1.4893
   },
   {
    "lat": 52.702,
    "lng": 1.5146
   },
   {
    "lat": 52.71,
    "lng": 1.5349
   },
   {
    "lat": 52.7138,
    "lng": 1.5626
   },
   {
    "lat": 52.7102,
    "lng": 1.5829
   },
   {
    "lat": 52.6972,
    "lng": 1.6005
   },
   {
    "lat": 52.6867,
    "lng": 1.6185
   },
   {
    "lat": 52.6708,
    "lng": 1.6138
   },
   {
    "lat": 52.6631,
    "lng": 1.5957
   },
   {
    "lat": 52.6527,
    "lng": 1.5736
   },
   {
    "lat": 52.6403,
    "lng": 1.5547
   },
   {
    "lat": 52.6392,
    "lng": 1.5481
   }
  ],
  "miles": 16.1,
  "start": "Hoveton (Wroxham)",
  "end": "Acle",
  "sources": [
   "https://lexhaminsurance.co.uk/blog/7-hidden-treasures-in-norfolk-for-motorcycle-enthusiasts"
  ],
  "confidence": "medium"
 },
 {
  "id": "ea-reedham-ferry",
  "kind": "drive",
  "name": "Reedham Ferry crossing",
  "area": "East Anglia",
  "description": "Marshland lanes from Acle to Reedham, across the Yare on Norfolk's last chain ferry, then south through Loddon to Bungay.",
  "warnings": "Ferry is tolled, small (3 cars) and can stop in very high/low water – check before you go; short stretch of the busy A47 Acle Straight; single-track marsh lanes.",
  "at": {
   "lat": 52.6392,
   "lng": 1.5481
  },
  "path": [
   {
    "lat": 52.6392,
    "lng": 1.5481
   },
   {
    "lat": 52.6319,
    "lng": 1.5738
   },
   {
    "lat": 52.6242,
    "lng": 1.6001
   },
   {
    "lat": 52.6074,
    "lng": 1.5866
   },
   {
    "lat": 52.5978,
    "lng": 1.5757
   },
   {
    "lat": 52.5874,
    "lng": 1.5658
   },
   {
    "lat": 52.5726,
    "lng": 1.5684
   },
   {
    "lat": 52.5619,
    "lng": 1.5536
   },
   {
    "lat": 52.5494,
    "lng": 1.5359
   },
   {
    "lat": 52.537,
    "lng": 1.521
   },
   {
    "lat": 52.5341,
    "lng": 1.4967
   },
   {
    "lat": 52.527,
    "lng": 1.4811
   },
   {
    "lat": 52.5116,
    "lng": 1.473
   },
   {
    "lat": 52.4949,
    "lng": 1.4668
   },
   {
    "lat": 52.4831,
    "lng": 1.4547
   },
   {
    "lat": 52.4785,
    "lng": 1.4289
   },
   {
    "lat": 52.4712,
    "lng": 1.438
   },
   {
    "lat": 52.4574,
    "lng": 1.4358
   },
   {
    "lat": 52.4562,
    "lng": 1.4374
   }
  ],
  "miles": 21.1,
  "start": "Acle",
  "end": "Bungay",
  "sources": [
   "https://en.wikipedia.org/wiki/Reedham_Ferry",
   "https://lexhaminsurance.co.uk/blog/7-hidden-treasures-in-norfolk-for-motorcycle-enthusiasts"
  ],
  "confidence": "high"
 },
 {
  "id": "ea-b1108",
  "kind": "drive",
  "name": "B1108 Norwich to Bodney",
  "area": "East Anglia",
  "description": "Straightforward rural B-road south-west of Norwich through Hingham and Watton, linking to the A1065 and Thetford Forest.",
  "warnings": "Watton town traffic; village limits; military land near Bodney – no stopping at gates.",
  "at": {
   "lat": 52.6258,
   "lng": 1.2215
  },
  "path": [
   {
    "lat": 52.6258,
    "lng": 1.2215
   },
   {
    "lat": 52.6243,
    "lng": 1.2104
   },
   {
    "lat": 52.6244,
    "lng": 1.1818
   },
   {
    "lat": 52.6247,
    "lng": 1.1535
   },
   {
    "lat": 52.6218,
    "lng": 1.1265
   },
   {
    "lat": 52.6208,
    "lng": 1.0995
   },
   {
    "lat": 52.6094,
    "lng": 1.0778
   },
   {
    "lat": 52.5985,
    "lng": 1.0575
   },
   {
    "lat": 52.5867,
    "lng": 1.0388
   },
   {
    "lat": 52.5786,
    "lng": 1.0152
   },
   {
    "lat": 52.579,
    "lng": 0.987
   },
   {
    "lat": 52.5769,
    "lng": 0.9606
   },
   {
    "lat": 52.5704,
    "lng": 0.932
   },
   {
    "lat": 52.5701,
    "lng": 0.9053
   },
   {
    "lat": 52.5705,
    "lng": 0.8774
   },
   {
    "lat": 52.5706,
    "lng": 0.8479
   },
   {
    "lat": 52.5703,
    "lng": 0.8233
   },
   {
    "lat": 52.5669,
    "lng": 0.7967
   },
   {
    "lat": 52.5648,
    "lng": 0.7683
   },
   {
    "lat": 52.5556,
    "lng": 0.7451
   },
   {
    "lat": 52.5559,
    "lng": 0.7162
   },
   {
    "lat": 52.5553,
    "lng": 0.6982
   }
  ],
  "miles": 25.7,
  "start": "Colney (Norwich)",
  "end": "Bodney (A1065)",
  "sources": [
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/east-anglia/ride/b1108-colney-bodney-alternative-route-south-from-norwich"
  ],
  "confidence": "high"
 },
 {
  "id": "ea-lowestoft-southwold",
  "kind": "drive",
  "name": "Lowestoft to Southwold",
  "area": "East Anglia",
  "description": "Short coastal link from Britain's most easterly town down the A12 to Wrentham, then the B1127 into Southwold.",
  "warnings": "A12 single carriageway with HGVs; Kessingland limits; Southwold busy in summer.",
  "at": {
   "lat": 52.4524,
   "lng": 1.727
  },
  "path": [
   {
    "lat": 52.4524,
    "lng": 1.727
   },
   {
    "lat": 52.4417,
    "lng": 1.7237
   },
   {
    "lat": 52.4236,
    "lng": 1.7086
   },
   {
    "lat": 52.4136,
    "lng": 1.6854
   },
   {
    "lat": 52.3979,
    "lng": 1.6715
   },
   {
    "lat": 52.3806,
    "lng": 1.6715
   },
   {
    "lat": 52.3647,
    "lng": 1.6747
   },
   {
    "lat": 52.3488,
    "lng": 1.6819
   },
   {
    "lat": 52.3332,
    "lng": 1.6742
   },
   {
    "lat": 52.3261,
    "lng": 1.6793
   }
  ],
  "miles": 10.6,
  "start": "Pakefield (Lowestoft)",
  "end": "Southwold",
  "sources": [
   "https://www.pistonheads.com/news/ph-mydreamdrive/suffolk-b-road-blast-my-dream-drive/29837"
  ],
  "confidence": "medium"
 },
 {
  "id": "ea-p-ness-point",
  "kind": "photo",
  "name": "Ness Point, Lowestoft",
  "area": "East Anglia",
  "description": "Britain's most easterly point, with the Euroscope marker and wind turbine. Unique \"most easterly\" landmark.",
  "warnings": "Industrial approach; park in the town car parks (Hamilton Road) and walk – don't block the access road.",
  "at": {
   "lat": 52.4812,
   "lng": 1.7627
  },
  "sources": [
   "https://en.wikipedia.org/wiki/Ness_Point"
  ],
  "confidence": "high"
 },
 {
  "id": "ea-p-southwold-pier",
  "kind": "photo",
  "name": "Southwold Pier & North Parade",
  "area": "East Anglia",
  "description": "Pier, beach huts and seafront; the pier car park and North Road parking are a short walk away. Well-known Suffolk seaside backdrop.",
  "warnings": "Very busy in summer; pay parking; North Parade is narrow.",
  "at": {
   "lat": 52.3304,
   "lng": 1.6868
  },
  "sources": [
   "https://southwoldpier.co.uk/"
  ],
  "confidence": "high"
 },
 {
  "id": "ea-p-dunwich-heath",
  "kind": "photo",
  "name": "Dunwich Heath (Coastguard Cottages)",
  "area": "East Anglia",
  "description": "National Trust clifftop car park on the heath, purple heather in late summer. NT car park with sea and heath views.",
  "warnings": "NT car park charges for non-members; check closing times.",
  "at": {
   "lat": 52.252,
   "lng": 1.628
  },
  "sources": [
   "https://www.nationaltrust.org.uk/visit/suffolk/dunwich-heath-and-beach"
  ],
  "confidence": "high"
 },
 {
  "id": "ea-p-scallop",
  "kind": "photo",
  "name": "The Scallop, Aldeburgh",
  "area": "East Anglia",
  "description": "Maggi Hambling's steel shell sculpture on the shingle north of Aldeburgh; car park on Thorpe Road nearby. Distinctive sculpture and big skies.",
  "warnings": "Car park only – never drive on the shingle; busy at weekends.",
  "at": {
   "lat": 52.1605,
   "lng": 1.6058
  },
  "sources": [
   "https://www.thesuffolkcoast.co.uk/"
  ],
  "confidence": "high"
 },
 {
  "id": "ea-p-orford-quay",
  "kind": "photo",
  "name": "Orford Quay",
  "area": "East Anglia",
  "description": "Quay car park on the River Ore looking towards Orford Ness. Quiet riverside backdrop at the end of the Suffolk coast route.",
  "warnings": "Pay car park; small and busy on summer weekends.",
  "at": {
   "lat": 52.0909,
   "lng": 1.5392
  },
  "sources": [
   "https://www.pistonheads.com/news/ph-mydreamdrive/suffolk-b-road-blast-my-dream-drive/29837"
  ],
  "confidence": "high"
 },
 {
  "id": "ea-p-framlingham",
  "kind": "photo",
  "name": "Framlingham Castle",
  "area": "East Anglia",
  "description": "English Heritage castle with its own car park, at the end of the Two Windmills route. Named point on the Porsche Roads route.",
  "warnings": "EH opening hours; car park charge for non-members.",
  "at": {
   "lat": 52.2242,
   "lng": 1.3467
  },
  "sources": [
   "https://www.english-heritage.org.uk/visit/places/framlingham-castle/",
   "https://roads.porsche.com/content/en/routes/two-windmills-long-suffolk-b-road"
  ],
  "confidence": "high"
 },
 {
  "id": "ea-p-saxtead",
  "kind": "photo",
  "name": "Saxtead Green Post Mill",
  "area": "East Anglia",
  "description": "Restored post mill beside the A1120 on the village green. Porsche Roads calls it \"a good convoy photo spot\".",
  "warnings": "Park considerately; don't drive on the green; A1120 traffic.",
  "at": {
   "lat": 52.2319,
   "lng": 1.2984
  },
  "sources": [
   "https://www.english-heritage.org.uk/visit/places/saxtead-green-post-mill/",
   "https://roads.porsche.com/content/en/routes/two-windmills-long-suffolk-b-road"
  ],
  "confidence": "high"
 },
 {
  "id": "ea-p-horsey",
  "kind": "photo",
  "name": "Horsey Windpump",
  "area": "East Anglia",
  "description": "National Trust drainage mill beside Horsey Mere, with a car park. Iconic Broads windmill on the east coast road.",
  "warnings": "NT car park charges; busy in seal season (Nov–Feb).",
  "at": {
   "lat": 52.7411,
   "lng": 1.639
  },
  "sources": [
   "https://www.nationaltrust.org.uk/visit/norfolk/horsey-windpump"
  ],
  "confidence": "high"
 },
 {
  "id": "ea-p-st-benets",
  "kind": "photo",
  "name": "St Benet's Abbey",
  "area": "East Anglia",
  "description": "Ruined abbey gatehouse with a windmill built into it, on the marshes by the River Bure. Classic Broads landmark.",
  "warnings": "Narrow single-track access lane with a small car park; soft verges.",
  "at": {
   "lat": 52.6861,
   "lng": 1.5251
  },
  "sources": [
   "https://en.wikipedia.org/wiki/St_Benet%27s_Abbey"
  ],
  "confidence": "high"
 },
 {
  "id": "ea-p-happisburgh",
  "kind": "photo",
  "name": "Happisburgh Lighthouse",
  "area": "East Anglia",
  "description": "Red-and-white striped lighthouse, the only independently run lighthouse in Britain. Striking backdrop on the east coast road.",
  "warnings": "Lighthouse Lane is narrow – use the village car park; erosion closures near the cliff.",
  "at": {
   "lat": 52.8205,
   "lng": 1.537
  },
  "sources": [
   "https://www.happisburgh.org/lighthouse"
  ],
  "confidence": "high"
 },
 {
  "id": "ea-p-cromer-pier",
  "kind": "photo",
  "name": "Cromer Pier & clifftop",
  "area": "East Anglia",
  "description": "Victorian pier below the town, with clifftop viewpoints. End point of both coast routes.",
  "warnings": "Pay car parks; North Norfolk vehicle-ASB PSPO covers parts of Cromer – no gatherings or revving.",
  "at": {
   "lat": 52.9337,
   "lng": 1.3014
  },
  "sources": [
   "https://www.cromer-pier.com/",
   "https://modgov.north-norfolk.gov.uk/documents/s20322/Prohibition%20of%20inconsiderate%20and%20inappropriate%20vehicle%20use%20related%20to%20Antisocial%20Behaviour_.pdf"
  ],
  "confidence": "high"
 },
 {
  "id": "ea-p-hunstanton",
  "kind": "photo",
  "name": "Old Hunstanton lighthouse & cliffs",
  "area": "East Anglia",
  "description": "Clifftop car park by the old lighthouse above the striped cliffs; west-facing sunsets over the Wash. Start of the A149 coast road; Biker Guide notes plenty of parking at the Cliff Top café.",
  "warnings": "Pay parking; busy summer evenings.",
  "at": {
   "lat": 52.9513,
   "lng": 0.4963
  },
  "sources": [
   "https://www.thebikerguide.co.uk/bikerfriendlyplacescafespubsnorfolk"
  ],
  "confidence": "high"
 },
 {
  "id": "ea-p-holkham",
  "kind": "photo",
  "name": "Lady Anne's Drive, Holkham",
  "area": "East Anglia",
  "description": "Estate-run drive and parking leading to Holkham beach and pinewoods. Famous beach access off the A149.",
  "warnings": "Private estate road with paid parking; strictly no gatherings; very busy in summer.",
  "at": {
   "lat": 52.9646,
   "lng": 0.8145
  },
  "sources": [
   "https://www.holkham.co.uk/"
  ],
  "confidence": "high"
 },
 {
  "id": "ea-p-blakeney",
  "kind": "photo",
  "name": "Blakeney Quay",
  "area": "East Anglia",
  "description": "Quayside car park on the salt marshes, with boats and big skies. Popular north Norfolk harbour.",
  "warnings": "The quay car park floods on high spring tides – check tide times; pay parking.",
  "at": {
   "lat": 52.9558,
   "lng": 1.0164
  },
  "sources": [
   "https://www.nationaltrust.org.uk/visit/norfolk/blakeney-national-nature-reserve"
  ],
  "confidence": "high"
 },
 {
  "id": "ea-p-high-lodge",
  "kind": "photo",
  "name": "High Lodge, Thetford Forest",
  "area": "East Anglia",
  "description": "Forestry England visitor centre deep in Thetford Forest, reached by a forest drive. Tall pines and forest roads.",
  "warnings": "Paid entry/parking; gates close at set times; 10–20 mph on site.",
  "at": {
   "lat": 52.4345,
   "lng": 0.6632
  },
  "sources": [
   "https://www.forestryengland.uk/high-lodge"
  ],
  "confidence": "high"
 },
 {
  "id": "ea-t-snetterton",
  "kind": "track",
  "name": "Snetterton Circuit",
  "area": "East Anglia",
  "description": "MSV-run 300/200/100 circuit off the A11; British Superbikes, club racing and track days. The main circuit in East Anglia (Lexham, MSV).",
  "warnings": "Track days and events must be booked; noise limits.",
  "at": {
   "lat": 52.4654,
   "lng": 0.9476
  },
  "sources": [
   "https://www.msv.com/snetterton",
   "https://lexhaminsurance.co.uk/blog/7-hidden-treasures-in-norfolk-for-motorcycle-enthusiasts"
  ],
  "confidence": "high"
 },
 {
  "id": "ea-t-ellough",
  "kind": "track",
  "name": "Ellough Park Raceway",
  "area": "East Anglia",
  "description": "Outdoor kart circuit near Beccles. Closest circuit to Lowestoft.",
  "warnings": "Booking required.",
  "at": {
   "lat": 52.4341,
   "lng": 1.6006
  },
  "sources": [
   "https://www.elloughparkraceway.co.uk/"
  ],
  "confidence": "high"
 },
 {
  "id": "ea-t-adrian-flux",
  "kind": "track",
  "name": "Adrian Flux Arena, King's Lynn",
  "area": "East Anglia",
  "description": "Speedway and oval stock-car stadium at Saddlebow. Regular spectator motorsport.",
  "warnings": "Spectator venue; check fixtures.",
  "at": {
   "lat": 52.7302,
   "lng": 0.3892
  },
  "sources": [
   "https://www.adrianfluxarena.co.uk/"
  ],
  "confidence": "high"
 },
 {
  "id": "ea-t-foxhall",
  "kind": "track",
  "name": "Foxhall Stadium, Ipswich",
  "area": "East Anglia",
  "description": "Oval stadium hosting Spedeworth stock cars/bangers and Ipswich speedway. Long-running Suffolk oval venue.",
  "warnings": "Spectator venue; check fixtures.",
  "at": {
   "lat": 52.0544,
   "lng": 1.2251
  },
  "sources": [
   "https://www.spedeworth.co.uk/"
  ],
  "confidence": "high"
 },
 {
  "id": "ea-t-yarmouth-stadium",
  "kind": "track",
  "name": "Great Yarmouth Stadium",
  "area": "East Anglia",
  "description": "Oval track at Caister hosting Spedeworth stock-car meetings (and greyhounds). Spectator oval racing near Great Yarmouth.",
  "warnings": "Spectator venue; check fixtures.",
  "at": {
   "lat": 52.637,
   "lng": 1.7278
  },
  "sources": [
   "https://www.spedeworth.co.uk/"
  ],
  "confidence": "high"
 },
 {
  "id": "ea-t-swaffham",
  "kind": "track",
  "name": "Swaffham Raceway",
  "area": "East Anglia",
  "description": "Oval short-track for stock cars and bangers. Regular oval racing.",
  "warnings": "Spectator venue; check fixtures.",
  "at": {
   "lat": 52.6548,
   "lng": 0.631
  },
  "sources": [
   "https://www.swaffhamraceway.co.uk/"
  ],
  "confidence": "high"
 },
 {
  "id": "ea-t-mildenhall",
  "kind": "track",
  "name": "Mildenhall Stadium, West Row",
  "area": "East Anglia",
  "description": "Oval stadium (stock cars; former Fen Tigers speedway). Spedeworth listed stock-car meetings in 2026.",
  "warnings": "Damaged by fire in 2024; check current fixtures. Coordinate from postcode IP28 8QU.",
  "at": {
   "lat": 52.3686,
   "lng": 0.429
  },
  "sources": [
   "https://en.wikipedia.org/wiki/Mildenhall_Stadium",
   "https://spedeworth.co.uk/bookedin.php?id=2982"
  ],
  "confidence": "medium"
 },
 {
  "id": "ea-t-bentwaters",
  "kind": "track",
  "name": "Bentwaters Parks",
  "area": "East Anglia",
  "description": "Former USAF airbase near Woodbridge used for driving experiences, events and filming. Historic speed-trial venue (Motor Sport archive).",
  "warnings": "Private site – event/booking access only.",
  "at": {
   "lat": 52.1232,
   "lng": 1.4304
  },
  "sources": [
   "https://www.bentwatersparks.com/",
   "https://www.motorsportmagazine.com/archive/article/june-2006/80/a-rival-to-snetterton-cicruit/"
  ],
  "confidence": "medium"
 },
 {
  "id": "ea-t-hit-the-dirt",
  "kind": "track",
  "name": "Hit the Dirt, Swaffham",
  "area": "East Anglia",
  "description": "Off-road motocross/dirt track next to Swaffham Raceway. Lexham: open in most weather, youth track for small bikes.",
  "warnings": "Booking; off-road bikes only.",
  "at": {
   "lat": 52.6564,
   "lng": 0.6257
  },
  "sources": [
   "https://lexhaminsurance.co.uk/blog/7-hidden-treasures-in-norfolk-for-motorcycle-enthusiasts"
  ],
  "confidence": "high"
 },
 {
  "id": "ea-t-santa-pod",
  "kind": "track",
  "name": "Santa Pod Raceway (near)",
  "area": "East Anglia",
  "description": "Europe's best-known drag strip, on the Beds/Northants border; public Run What You Brung days. Nearest drag strip to East Anglia.",
  "warnings": "Outside the three areas (Bedfordshire); event tickets.",
  "at": {
   "lat": 52.2357,
   "lng": -0.6016
  },
  "sources": [
   "https://www.santapod.co.uk/"
  ],
  "confidence": "high"
 },
 {
  "id": "ea-t-bedford",
  "kind": "track",
  "name": "Bedford Autodrome (near)",
  "area": "East Anglia",
  "description": "MSV airfield circuit at Thurleigh used for track days and driving experiences. Popular track-day venue within reach of East Anglia and London.",
  "warnings": "Outside the three areas (Bedfordshire); booking required.",
  "at": {
   "lat": 52.2341,
   "lng": -0.4719
  },
  "sources": [
   "https://www.msv.com/bedford-autodrome"
  ],
  "confidence": "high"
 },
 {
  "id": "ea-t-rockingham",
  "kind": "track",
  "name": "Rockingham (closed)",
  "area": "East Anglia",
  "description": "Former oval/road circuit at Corby, closed to racing in 2018 and now a logistics hub – listed so it is not added as an active venue. Historical only.",
  "warnings": "Not open to the public for driving.",
  "at": {
   "lat": 52.5146,
   "lng": -0.6597
  },
  "sources": [
   "https://en.wikipedia.org/wiki/Rockingham_Motor_Speedway"
  ],
  "confidence": "medium"
 },
 {
  "id": "ea-v-whitwell",
  "kind": "venue",
  "name": "Whitwell & Reepham Station",
  "area": "East Anglia",
  "description": "Heritage station with bar and food near Reepham. Official Friday bike night 5–10pm, Mar–Oct; up to 1,000 bikes in summer (Biker Guide).",
  "warnings": "Seasonal; bikes focus.",
  "at": {
   "lat": 52.752,
   "lng": 1.0974
  },
  "sources": [
   "https://www.thebikerguide.co.uk/bikerfriendlyplacescafespubsnorfolk",
   "https://lexhaminsurance.co.uk/blog/7-hidden-treasures-in-norfolk-for-motorcycle-enthusiasts"
  ],
  "confidence": "high"
 },
 {
  "id": "ea-v-grumpys",
  "kind": "venue",
  "name": "Grumpy's Café, Earsham Mill",
  "area": "East Anglia",
  "description": "Café at the old mill near Bungay. Official Wednesday bike meet Mar–Oct, from 5pm.",
  "warnings": "Seasonal; check dates.",
  "at": {
   "lat": 52.4469,
   "lng": 1.4226
  },
  "sources": [
   "https://www.thebikerguide.co.uk/bikerfriendlyplacescafespubsnorfolk",
   "https://eadt.co.uk/news/24726213.biker-nights-return-grumpys-cafe-earsham-mill"
  ],
  "confidence": "high"
 },
 {
  "id": "ea-v-red-hart",
  "kind": "venue",
  "name": "Red Hart, Bodham",
  "area": "East Anglia",
  "description": "Village pub near Holt. Bike night last Monday of the month, Mar–Sep, from 5pm.",
  "warnings": "Pub – no drink-driving.",
  "at": {
   "lat": 52.916,
   "lng": 1.1614
  },
  "sources": [
   "https://www.thebikerguide.co.uk/bikerfriendlyplacescafespubsnorfolk"
  ],
  "confidence": "high"
 },
 {
  "id": "ea-v-ox-plough",
  "kind": "venue",
  "name": "Ox & Plough, Old Buckenham",
  "area": "East Anglia",
  "description": "Pub on the village green. \"Two Wheel Tuesday\" summer meet, from ~30 to 700+ bikes (Lexham).",
  "warnings": "Seasonal; check current dates.",
  "at": {
   "lat": 52.4821,
   "lng": 1.0421
  },
  "sources": [
   "https://lexhaminsurance.co.uk/blog/7-hidden-treasures-in-norfolk-for-motorcycle-enthusiasts"
  ],
  "confidence": "medium"
 },
 {
  "id": "ea-v-angel-larling",
  "kind": "venue",
  "name": "The Angel, Larling",
  "area": "East Anglia",
  "description": "Pub just off the A11 near Snetterton. \"Throttle Thursdays\" weekly meet (Visit Norwich).",
  "warnings": "Check current season.",
  "at": {
   "lat": 52.463,
   "lng": 0.9169
  },
  "sources": [
   "https://www.visitnorwich.co.uk/?p=85480"
  ],
  "confidence": "medium"
 },
 {
  "id": "ea-v-route11",
  "kind": "venue",
  "name": "Route 11 Kitchen, Besthorpe",
  "area": "East Anglia",
  "description": "Roadside café on the A11 Attleborough bypass. Lexham: space for bike meets.",
  "warnings": "A11 northbound access only.",
  "at": {
   "lat": 52.5328,
   "lng": 1.0518
  },
  "sources": [
   "https://lexhaminsurance.co.uk/blog/7-hidden-treasures-in-norfolk-for-motorcycle-enthusiasts"
  ],
  "confidence": "medium"
 },
 {
  "id": "ea-v-rondos",
  "kind": "venue",
  "name": "Rondo's, Fendick Fisheries",
  "area": "East Anglia",
  "description": "Café at a fishery near King's Lynn. \"Wicked Wheelie Wednesdays\" every other Wednesday from March (Biker Guide).",
  "warnings": "Coordinate from postcode PE33 9GP.",
  "at": {
   "lat": 52.5487,
   "lng": 0.5503
  },
  "sources": [
   "https://www.thebikerguide.co.uk/bikerfriendlyplacescafespubsnorfolk"
  ],
  "confidence": "medium"
 },
 {
  "id": "ea-v-krazy-horse-bury",
  "kind": "venue",
  "name": "Krazy Horse, Bury St Edmunds",
  "area": "East Anglia",
  "description": "Motorcycle dealer with café and showroom. Official bike night 1st Thursday of the month, Apr–Oct, 6–10pm.",
  "warnings": "Check dates.",
  "at": {
   "lat": 52.2684,
   "lng": 0.7052
  },
  "sources": [
   "https://www.thebikerguide.co.uk/bikerfriendlymeetingplacescafespubssuffolk",
   "https://www.krazyhorse.co.uk/"
  ],
  "confidence": "high"
 },
 {
  "id": "ea-v-limeburners",
  "kind": "venue",
  "name": "The Limeburners, Offton",
  "area": "East Anglia",
  "description": "Pub with chip shop next door, near Ipswich. Official bike night 1st Wednesday of each month, all year.",
  "warnings": "Pub – no drink-driving. Coordinate from postcode.",
  "at": {
   "lat": 52.1016,
   "lng": 1.0284
  },
  "sources": [
   "https://www.thebikerguide.co.uk/bikerfriendlymeetingplacescafespubssuffolk"
  ],
  "confidence": "medium"
 },
 {
  "id": "ea-v-ttt",
  "kind": "venue",
  "name": "TTT Motorcycle Village, Sudbury",
  "area": "East Anglia",
  "description": "Bike dealer, workshop, dyno and café. Monday late nights with outdoor events and live music.",
  "warnings": "Check events.",
  "at": {
   "lat": 52.0364,
   "lng": 0.7137
  },
  "sources": [
   "https://www.thebikerguide.co.uk/bikerfriendlymeetingplacescafespubssuffolk",
   "https://www.tttmotorcyclevillage.co.uk/"
  ],
  "confidence": "high"
 },
 {
  "id": "ea-v-skydive",
  "kind": "venue",
  "name": "Skydive Diner, Beccles",
  "area": "East Anglia",
  "description": "Diner at Beccles heliport/airfield. Monthly \"Bikes & Breakfast\" meet (dates vary).",
  "warnings": "Fri–Sun 09:00–14:00; coordinate from postcode.",
  "at": {
   "lat": 52.4351,
   "lng": 1.6022
  },
  "sources": [
   "https://www.thebikerguide.co.uk/bikerfriendlymeetingplacescafespubssuffolk"
  ],
  "confidence": "medium"
 },
 {
  "id": "ea-v-kersey-mill",
  "kind": "venue",
  "name": "Kersey Mill (Miller's Kitchen)",
  "area": "East Anglia",
  "description": "Mill complex with café near Hadleigh. AROC East Anglia \"Italian Cars & Coffee\" and free Cars & Coffee events.",
  "warnings": "Club-run dates; check AROC.",
  "at": {
   "lat": 52.0616,
   "lng": 0.9335
  },
  "sources": [
   "https://aroc-uk.com/community/area-sections/east-anglia/"
  ],
  "confidence": "medium"
 },
 {
  "id": "ea-v-aviation-museum",
  "kind": "venue",
  "name": "Norfolk & Suffolk Aviation Museum, Flixton",
  "area": "East Anglia",
  "description": "Aviation museum near Bungay with parking. Listed by The Biker Guide (Norfolk and Suffolk pages) as a ride-out stop.",
  "warnings": "Wed/Sat/Sun 10:00–16:00 only; no regular meet.",
  "at": {
   "lat": 52.4355,
   "lng": 1.3968
  },
  "sources": [
   "https://www.thebikerguide.co.uk/bikerfriendlymeetingplacescafespubssuffolk",
   "https://www.thebikerguide.co.uk/bikerfriendlyplacescafespubsnorfolk"
  ],
  "confidence": "high"
 },
 {
  "id": "ea-v-motorcycle-museum",
  "kind": "venue",
  "name": "Norfolk Motorcycle Museum, North Walsham",
  "area": "East Anglia",
  "description": "150+ motorcycles from the 1900s–1980s. Recommended by Lexham.",
  "warnings": "Small site; check hours.",
  "at": {
   "lat": 52.8169,
   "lng": 1.3851
  },
  "sources": [
   "https://lexhaminsurance.co.uk/blog/7-hidden-treasures-in-norfolk-for-motorcycle-enthusiasts"
  ],
  "confidence": "high"
 },
 {
  "id": "k-alkham-valley",
  "kind": "drive",
  "name": "Alkham Valley Road",
  "area": "Kent",
  "description": "Short, flowing valley road through Alkham between Folkestone and Dover, used by local riders instead of the A20.",
  "warnings": "Reviewers say 40/50 mph limits now cover most of it and police are seen more; a couple of bends and junctions have poor visibility.",
  "at": {
   "lat": 51.1115,
   "lng": 1.1873
  },
  "path": [
   {
    "lat": 51.1115,
    "lng": 1.1873
   },
   {
    "lat": 51.1215,
    "lng": 1.2014
   },
   {
    "lat": 51.1319,
    "lng": 1.2153
   },
   {
    "lat": 51.1388,
    "lng": 1.2351
   },
   {
    "lat": 51.1456,
    "lng": 1.2564
   },
   {
    "lat": 51.1477,
    "lng": 1.2688
   }
  ],
  "miles": 4.7,
  "start": "Hawkinge (A260)",
  "end": "Kearsney (Dover)",
  "sources": [
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/south-east-england/ride/alkham-valley-road-folkestone-dover"
  ],
  "confidence": "high"
 },
 {
  "id": "k-stone-street",
  "kind": "drive",
  "name": "Stone Street (B2068)",
  "area": "Kent",
  "description": "Arrow-straight Roman road over the North Downs with crests and dips, via Stelling Minnis and Petham.",
  "warnings": "Staggered crossroads (source); the long straights invite speed – keep it legal; farm traffic.",
  "at": {
   "lat": 51.1023,
   "lng": 1.0458
  },
  "path": [
   {
    "lat": 51.1023,
    "lng": 1.0458
   },
   {
    "lat": 51.116,
    "lng": 1.0436
   },
   {
    "lat": 51.1273,
    "lng": 1.0477
   },
   {
    "lat": 51.1429,
    "lng": 1.0506
   },
   {
    "lat": 51.1578,
    "lng": 1.0513
   },
   {
    "lat": 51.1724,
    "lng": 1.0529
   },
   {
    "lat": 51.188,
    "lng": 1.0547
   },
   {
    "lat": 51.2026,
    "lng": 1.0577
   },
   {
    "lat": 51.2172,
    "lng": 1.0604
   },
   {
    "lat": 51.2323,
    "lng": 1.0625
   },
   {
    "lat": 51.2428,
    "lng": 1.0779
   },
   {
    "lat": 51.2565,
    "lng": 1.0863
   },
   {
    "lat": 51.2684,
    "lng": 1.0929
   }
  ],
  "miles": 12.3,
  "start": "Stanford (M20 J11)",
  "end": "Canterbury",
  "sources": [
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/south-east-england/ride/b2068-stanford-canterbury-stone-street"
  ],
  "confidence": "high"
 },
 {
  "id": "k-romney-marsh",
  "kind": "drive",
  "name": "Romney Marsh coast",
  "area": "Kent",
  "description": "Flat, open marsh roads from Hythe along the Dymchurch coast to New Romney and Lydd, then past the ranges to Camber.",
  "warnings": "Police presence across the marsh (source); Lydd ranges – obey red flags and don't stop; Dymchurch seafront busy in summer.",
  "at": {
   "lat": 51.0689,
   "lng": 1.0844
  },
  "path": [
   {
    "lat": 51.0689,
    "lng": 1.0844
   },
   {
    "lat": 51.0672,
    "lng": 1.0657
   },
   {
    "lat": 51.059,
    "lng": 1.0475
   },
   {
    "lat": 51.0477,
    "lng": 1.0349
   },
   {
    "lat": 51.0377,
    "lng": 1.0178
   },
   {
    "lat": 51.03,
    "lng": 0.9995
   },
   {
    "lat": 51.0232,
    "lng": 0.9832
   },
   {
    "lat": 51.0233,
    "lng": 0.9613
   },
   {
    "lat": 51.0124,
    "lng": 0.9519
   },
   {
    "lat": 50.9983,
    "lng": 0.9479
   },
   {
    "lat": 50.986,
    "lng": 0.9406
   },
   {
    "lat": 50.9849,
    "lng": 0.9222
   },
   {
    "lat": 50.9706,
    "lng": 0.9231
   },
   {
    "lat": 50.957,
    "lng": 0.9163
   },
   {
    "lat": 50.9479,
    "lng": 0.899
   },
   {
    "lat": 50.9424,
    "lng": 0.879
   },
   {
    "lat": 50.9339,
    "lng": 0.86
   },
   {
    "lat": 50.9346,
    "lng": 0.8392
   }
  ],
  "miles": 17.4,
  "start": "Hythe",
  "end": "Camber (East Sussex border)",
  "sources": [
   "https://www.wemoto.com/blogs/across_the_marsh",
   "https://bestbikingroads.nl/motorroutes/verenigd-koninkrijk/south-east-england/ride/a259-hythe-hastings"
  ],
  "confidence": "high"
 },
 {
  "id": "k-dungeness",
  "kind": "drive",
  "name": "Dungeness coast road",
  "area": "Kent",
  "description": "Coast Drive past Greatstone to the shingle headland at Dungeness, with its lighthouses and black huts, returning inland to Lydd.",
  "warnings": "Dungeness is a privately owned estate and nature reserve – stay on the road and in car parks, never drive on the shingle; homes there are private; don't stop at the power station gates.",
  "at": {
   "lat": 50.9849,
   "lng": 0.9432
  },
  "path": [
   {
    "lat": 50.9849,
    "lng": 0.9432
   },
   {
    "lat": 50.9827,
    "lng": 0.9628
   },
   {
    "lat": 50.9703,
    "lng": 0.9631
   },
   {
    "lat": 50.9556,
    "lng": 0.9643
   },
   {
    "lat": 50.9398,
    "lng": 0.9701
   },
   {
    "lat": 50.933,
    "lng": 0.9574
   },
   {
    "lat": 50.9388,
    "lng": 0.9359
   },
   {
    "lat": 50.9485,
    "lng": 0.918
   },
   {
    "lat": 50.951,
    "lng": 0.9064
   }
  ],
  "miles": 7.9,
  "start": "New Romney",
  "end": "Lydd",
  "sources": [
   "https://www.myrouteapp.com/motor-and-car-routes/gb/1561782/Round-trip-from-Orpington-to-Dungeness-",
   "https://www.thebikerguide.co.uk/bikerfriendlycafemeetingplaceskent"
  ],
  "confidence": "medium"
 },
 {
  "id": "k-countryside-loop",
  "kind": "drive",
  "name": "Kentish countryside loop",
  "area": "Kent",
  "description": "Weald loop via Lamberhurst, Newenden, Tenterden, Biddenden and Goudhurst on the A21, A28 and A262.",
  "warnings": "Patchy repairs; speed cameras in villages; police most likely at Tenterden, Hawkhurst and on the A21; weekend traffic.",
  "at": {
   "lat": 51.1955,
   "lng": 0.2751
  },
  "path": [
   {
    "lat": 51.1955,
    "lng": 0.2751
   },
   {
    "lat": 51.1846,
    "lng": 0.279
   },
   {
    "lat": 51.175,
    "lng": 0.2964
   },
   {
    "lat": 51.1624,
    "lng": 0.3062
   },
   {
    "lat": 51.148,
    "lng": 0.3035
   },
   {
    "lat": 51.1397,
    "lng": 0.3228
   },
   {
    "lat": 51.1367,
    "lng": 0.3452
   },
   {
    "lat": 51.1265,
    "lng": 0.3593
   },
   {
    "lat": 51.1185,
    "lng": 0.3747
   },
   {
    "lat": 51.1117,
    "lng": 0.3942
   },
   {
    "lat": 51.1011,
    "lng": 0.404
   },
   {
    "lat": 51.0887,
    "lng": 0.3992
   },
   {
    "lat": 51.0802,
    "lng": 0.4179
   },
   {
    "lat": 51.0694,
    "lng": 0.4317
   },
   {
    "lat": 51.0586,
    "lng": 0.4468
   },
   {
    "lat": 51.0452,
    "lng": 0.4464
   },
   {
    "lat": 51.0337,
    "lng": 0.4597
   },
   {
    "lat": 51.0257,
    "lng": 0.4748
   },
   {
    "lat": 51.0275,
    "lng": 0.4974
   },
   {
    "lat": 51.0269,
    "lng": 0.5185
   },
   {
    "lat": 51.0386,
    "lng": 0.5313
   },
   {
    "lat": 51.0423,
    "lng": 0.5309
   },
   {
    "lat": 51.0344,
    "lng": 0.549
   },
   {
    "lat": 51.0258,
    "lng": 0.5671
   },
   {
    "lat": 51.0217,
    "lng": 0.5908
   },
   {
    "lat": 51.0243,
    "lng": 0.608
   },
   {
    "lat": 51.038,
    "lng": 0.6139
   },
   {
    "lat": 51.0489,
    "lng": 0.6287
   },
   {
    "lat": 51.0576,
    "lng": 0.643
   },
   {
    "lat": 51.0654,
    "lng": 0.6618
   },
   {
    "lat": 51.0672,
    "lng": 0.684
   },
   {
    "lat": 51.0678,
    "lng": 0.701
   },
   {
    "lat": 51.0691,
    "lng": 0.7017
   },
   {
    "lat": 51.081,
    "lng": 0.6947
   },
   {
    "lat": 51.0876,
    "lng": 0.6785
   },
   {
    "lat": 51.0965,
    "lng": 0.6699
   },
   {
    "lat": 51.1037,
    "lng": 0.6535
   },
   {
    "lat": 51.113,
    "lng": 0.643
   },
   {
    "lat": 51.1152,
    "lng": 0.624
   },
   {
    "lat": 51.116,
    "lng": 0.603
   },
   {
    "lat": 51.1096,
    "lng": 0.5826
   },
   {
    "lat": 51.109,
    "lng": 0.5598
   },
   {
    "lat": 51.1109,
    "lng": 0.5385
   },
   {
    "lat": 51.1119,
    "lng": 0.5165
   },
   {
    "lat": 51.1099,
    "lng": 0.4937
   },
   {
    "lat": 51.1138,
    "lng": 0.4712
   },
   {
    "lat": 51.1107,
    "lng": 0.4506
   },
   {
    "lat": 51.1113,
    "lng": 0.43
   },
   {
    "lat": 51.1112,
    "lng": 0.4075
   },
   {
    "lat": 51.1144,
    "lng": 0.3868
   },
   {
    "lat": 51.1223,
    "lng": 0.3692
   },
   {
    "lat": 51.1314,
    "lng": 0.3562
   },
   {
    "lat": 51.1384,
    "lng": 0.3367
   },
   {
    "lat": 51.1436,
    "lng": 0.316
   },
   {
    "lat": 51.1495,
    "lng": 0.3029
   },
   {
    "lat": 51.1646,
    "lng": 0.3059
   },
   {
    "lat": 51.1761,
    "lng": 0.2933
   },
   {
    "lat": 51.1806,
    "lng": 0.283
   },
   {
    "lat": 51.1912,
    "lng": 0.2709
   },
   {
    "lat": 51.1955,
    "lng": 0.2751
   }
  ],
  "miles": 59.3,
  "start": "Tonbridge",
  "end": "Tonbridge",
  "sources": [
   "https://bestbikingroads.nl/motorroutes/verenigd-koninkrijk/south-east-england/ride/a21-a262-tonbridge-lamberhurst-newenden-tenterden-biddenden-goudhurst-kentish-countryside-loop"
  ],
  "confidence": "medium"
 },
 {
  "id": "k-white-cliffs-coast",
  "kind": "drive",
  "name": "White Cliffs to Deal",
  "area": "Kent",
  "description": "Up out of Dover past the castle to St Margaret's at Cliffe and Kingsdown, then along the front to Walmer and Deal.",
  "warnings": "St Margaret's Bay hill is steep and narrow; Deal seafront busy in summer.",
  "at": {
   "lat": 51.1251,
   "lng": 1.3133
  },
  "path": [
   {
    "lat": 51.1251,
    "lng": 1.3133
   },
   {
    "lat": 51.1255,
    "lng": 1.3245
   },
   {
    "lat": 51.1368,
    "lng": 1.3313
   },
   {
    "lat": 51.1497,
    "lng": 1.3399
   },
   {
    "lat": 51.1546,
    "lng": 1.3601
   },
   {
    "lat": 51.1623,
    "lng": 1.361
   },
   {
    "lat": 51.1737,
    "lng": 1.366
   },
   {
    "lat": 51.1848,
    "lng": 1.3797
   },
   {
    "lat": 51.1855,
    "lng": 1.4019
   },
   {
    "lat": 51.1997,
    "lng": 1.4023
   },
   {
    "lat": 51.2128,
    "lng": 1.4024
   },
   {
    "lat": 51.2229,
    "lng": 1.4
   },
   {
    "lat": 51.2242,
    "lng": 1.4027
   }
  ],
  "miles": 11.5,
  "start": "Dover",
  "end": "Deal",
  "sources": [
   "https://www.nationaltrust.org.uk/visit/kent/the-white-cliffs-of-dover",
   "https://www.thebikerguide.co.uk/bikerfriendlycafemeetingplaceskent"
  ],
  "confidence": "medium"
 },
 {
  "id": "k-folkestone-dover-clifftop",
  "kind": "drive",
  "name": "Folkestone–Dover clifftop (B2011)",
  "area": "Kent",
  "description": "The old clifftop road via Capel-le-Ferne and the Battle of Britain Memorial, with Channel views, dropping into Dover on the A20.",
  "warnings": "Clifftop gusts; Capel-le-Ferne 30 mph; A20 into Dover carries port freight traffic.",
  "at": {
   "lat": 51.0801,
   "lng": 1.1875
  },
  "path": [
   {
    "lat": 51.0801,
    "lng": 1.1875
   },
   {
    "lat": 51.0906,
    "lng": 1.1901
   },
   {
    "lat": 51.0964,
    "lng": 1.1991
   },
   {
    "lat": 51.1034,
    "lng": 1.2193
   },
   {
    "lat": 51.1048,
    "lng": 1.2413
   },
   {
    "lat": 51.1116,
    "lng": 1.2618
   },
   {
    "lat": 51.1178,
    "lng": 1.2821
   },
   {
    "lat": 51.1245,
    "lng": 1.3018
   },
   {
    "lat": 51.1263,
    "lng": 1.3158
   },
   {
    "lat": 51.1251,
    "lng": 1.3133
   }
  ],
  "miles": 8.2,
  "start": "Folkestone",
  "end": "Dover",
  "sources": [
   "https://www.battleofbritainmemorial.org/"
  ],
  "confidence": "medium"
 },
 {
  "id": "k-thanet-coast",
  "kind": "drive",
  "name": "Thanet coast",
  "area": "Kent",
  "description": "Along the north Kent coast from Herne Bay past Reculver Towers to Margate, Broadstairs and Ramsgate.",
  "warnings": "Margate/Broadstairs seafronts slow and busy in summer; 20 mph zones; parking charges.",
  "at": {
   "lat": 51.3725,
   "lng": 1.1307
  },
  "path": [
   {
    "lat": 51.3725,
    "lng": 1.1307
   },
   {
    "lat": 51.3713,
    "lng": 1.1472
   },
   {
    "lat": 51.3699,
    "lng": 1.1652
   },
   {
    "lat": 51.3717,
    "lng": 1.1852
   },
   {
    "lat": 51.3647,
    "lng": 1.2043
   },
   {
    "lat": 51.3607,
    "lng": 1.2283
   },
   {
    "lat": 51.3584,
    "lng": 1.2527
   },
   {
    "lat": 51.3589,
    "lng": 1.2749
   },
   {
    "lat": 51.3651,
    "lng": 1.2951
   },
   {
    "lat": 51.375,
    "lng": 1.3111
   },
   {
    "lat": 51.3788,
    "lng": 1.3328
   },
   {
    "lat": 51.3799,
    "lng": 1.3556
   },
   {
    "lat": 51.3862,
    "lng": 1.3743
   },
   {
    "lat": 51.3868,
    "lng": 1.3926
   },
   {
    "lat": 51.3813,
    "lng": 1.4138
   },
   {
    "lat": 51.3812,
    "lng": 1.4343
   },
   {
    "lat": 51.3763,
    "lng": 1.446
   },
   {
    "lat": 51.3621,
    "lng": 1.4424
   },
   {
    "lat": 51.352,
    "lng": 1.4397
   },
   {
    "lat": 51.3404,
    "lng": 1.4299
   },
   {
    "lat": 51.3335,
    "lng": 1.4197
   }
  ],
  "miles": 20.2,
  "start": "Herne Bay",
  "end": "Ramsgate",
  "sources": [
   "https://www.english-heritage.org.uk/visit/places/reculver-towers-and-roman-fort/",
   "https://www.kentonline.co.uk/kent/news/thousands-of-bikers-heading-for-thanet-in-f-a103989/"
  ],
  "confidence": "medium"
 },
 {
  "id": "k-p-dungeness",
  "kind": "photo",
  "name": "Dungeness Old Lighthouse",
  "area": "Kent",
  "description": "Old and new lighthouses, the light railway and black huts on the shingle; parking by the old lighthouse. Much-photographed, otherworldly landscape.",
  "warnings": "Private estate and nature reserve – park only in marked areas, never on the shingle; respect private homes.",
  "at": {
   "lat": 50.9137,
   "lng": 0.9697
  },
  "sources": [
   "https://www.rhdr.org.uk/",
   "https://www.thebikerguide.co.uk/bikerfriendlycafemeetingplaceskent"
  ],
  "confidence": "high"
 },
 {
  "id": "k-p-samphire-hoe",
  "kind": "photo",
  "name": "Samphire Hoe",
  "area": "Kent",
  "description": "Country park made from Channel Tunnel spoil, reached through a traffic-light-controlled tunnel from the A20. Under the white cliffs with sea views.",
  "warnings": "Single-lane access tunnel; pay car park; gates close in the evening.",
  "at": {
   "lat": 51.1049,
   "lng": 1.2753
  },
  "sources": [
   "https://www.samphirehoe.com/"
  ],
  "confidence": "medium"
 },
 {
  "id": "k-p-white-cliffs",
  "kind": "photo",
  "name": "White Cliffs of Dover (Langdon Cliffs)",
  "area": "Kent",
  "description": "National Trust car park and visitor centre on the clifftop overlooking Dover port. Views over the cliffs and ferries.",
  "warnings": "Car park 07:00–19:00; charge for non-members (£5–6).",
  "at": {
   "lat": 51.1316,
   "lng": 1.3375
  },
  "sources": [
   "https://www.nationaltrust.org.uk/visit/kent/the-white-cliffs-of-dover"
  ],
  "confidence": "high"
 },
 {
  "id": "k-p-bob-memorial",
  "kind": "photo",
  "name": "Battle of Britain Memorial, Capel-le-Ferne",
  "area": "Kent",
  "description": "Clifftop memorial with Spitfire and Hurricane replicas and a visitor car park. On the B2011 clifftop route.",
  "warnings": "Respectful memorial site – no meets.",
  "at": {
   "lat": 51.0985,
   "lng": 1.206
  },
  "sources": [
   "https://www.battleofbritainmemorial.org/"
  ],
  "confidence": "high"
 },
 {
  "id": "k-p-st-margarets",
  "kind": "photo",
  "name": "St Margaret's Bay",
  "area": "Kent",
  "description": "Small shingle bay under the cliffs with a beach car park. Quiet cove on the White Cliffs to Deal route.",
  "warnings": "Steep, narrow hill down; small car park fills fast.",
  "at": {
   "lat": 51.1509,
   "lng": 1.3856
  },
  "sources": [
   "https://www.nationaltrust.org.uk/visit/kent/the-white-cliffs-of-dover"
  ],
  "confidence": "high"
 },
 {
  "id": "k-p-reculver",
  "kind": "photo",
  "name": "Reculver Towers",
  "area": "Kent",
  "description": "Twin towers of a ruined church on the coast, with a country park car park. Landmark on the Thanet coast route.",
  "warnings": "Pay car park; exposed in bad weather.",
  "at": {
   "lat": 51.3795,
   "lng": 1.1997
  },
  "sources": [
   "https://www.english-heritage.org.uk/visit/places/reculver-towers-and-roman-fort/"
  ],
  "confidence": "high"
 },
 {
  "id": "k-p-botany-bay",
  "kind": "photo",
  "name": "Botany Bay, Kingsgate",
  "area": "Kent",
  "description": "Chalk stacks and sandy bay; clifftop car park on Botany Road. Classic Thanet coastline.",
  "warnings": "Pay parking; busy summer weekends.",
  "at": {
   "lat": 51.3884,
   "lng": 1.434
  },
  "sources": [
   "https://www.visitkent.co.uk/"
  ],
  "confidence": "high"
 },
 {
  "id": "k-p-folkestone-harbour",
  "kind": "photo",
  "name": "Folkestone Harbour Arm",
  "area": "Kent",
  "description": "Restored harbour arm and old station with food stalls; harbour parking nearby. Industrial-chic seafront backdrop.",
  "warnings": "Pay parking; events at weekends.",
  "at": {
   "lat": 51.0762,
   "lng": 1.1925
  },
  "sources": [
   "https://www.folkestoneharbourarm.co.uk/"
  ],
  "confidence": "high"
 },
 {
  "id": "k-p-bluebell-hill",
  "kind": "photo",
  "name": "Bluebell Hill picnic site",
  "area": "Kent",
  "description": "Kent County Council picnic site and viewpoint over the Medway valley. Elevated view near Chatham.",
  "warnings": "Check closing times; no meets; A229 junctions are fast.",
  "at": {
   "lat": 51.3315,
   "lng": 0.5012
  },
  "sources": [
   "https://www.explorekent.org/"
  ],
  "confidence": "medium"
 },
 {
  "id": "k-p-chatham-dockyard",
  "kind": "photo",
  "name": "Historic Dockyard Chatham",
  "area": "Kent",
  "description": "Georgian dockyard and film location with paid visitor parking. Period buildings and cobbles (with permission).",
  "warnings": "Ticketed site; commercial/car shoots need permission.",
  "at": {
   "lat": 51.3949,
   "lng": 0.5283
  },
  "sources": [
   "https://www.thedockyard.co.uk/"
  ],
  "confidence": "high"
 },
 {
  "id": "k-t-brands",
  "kind": "track",
  "name": "Brands Hatch",
  "area": "Kent",
  "description": "MSV Indy and GP circuits near West Kingsdown; BSB, BTCC, club racing and track days. Kent's major circuit.",
  "warnings": "Booking/tickets; noise limits; M20/A20 traffic on event days.",
  "at": {
   "lat": 51.3575,
   "lng": 0.26
  },
  "sources": [
   "https://www.msv.com/brands-hatch"
  ],
  "confidence": "high"
 },
 {
  "id": "k-t-lydden",
  "kind": "track",
  "name": "Lydden Hill Race Circuit",
  "area": "Kent",
  "description": "Short circuit near Canterbury; rallycross, sprints, track days and Cars, Bikes & Coffee evenings. Runs its own public Cars, Bikes & Coffee meets (from £3) and SBD sprints.",
  "warnings": "Event tickets; check dates.",
  "at": {
   "lat": 51.1782,
   "lng": 1.1988
  },
  "sources": [
   "https://lyddenhill.co.uk/",
   "https://lyddenhill.co.uk/events/cbc",
   "https://sbdmotorsport.co.uk/events/lydden-sprint-3/"
  ],
  "confidence": "high"
 },
 {
  "id": "k-t-buckmore",
  "kind": "track",
  "name": "Buckmore Park Karting",
  "area": "Kent",
  "description": "Well-known kart circuit near Chatham. Classic Kent karting venue.",
  "warnings": "Booking required.",
  "at": {
   "lat": 51.343,
   "lng": 0.5012
  },
  "sources": [
   "https://www.buckmore.co.uk/"
  ],
  "confidence": "high"
 },
 {
  "id": "k-v-oakdene",
  "kind": "venue",
  "name": "Oakdene Café, Wrotham",
  "area": "Kent",
  "description": "Truckers' and bikers' café on the A20 near Brands Hatch. Large Wednesday evening bike nights (MCN \"Meet of the week\"); open to 10pm Weds.",
  "warnings": "A20 junction; busy Wednesday evenings.",
  "at": {
   "lat": 51.3042,
   "lng": 0.3332
  },
  "sources": [
   "https://motorcyclenews.com/news/2017/october/oakdene-cafe-meet-of-the-week"
  ],
  "confidence": "high"
 },
 {
  "id": "k-v-nells",
  "kind": "venue",
  "name": "Nell's Café, Gravesend",
  "area": "Kent",
  "description": "Biker café on the A2 with a large car park. Official Thursday bike night 6–9pm; owner welcomes meets.",
  "warnings": "A2 slip-road access.",
  "at": {
   "lat": 51.4088,
   "lng": 0.3877
  },
  "sources": [
   "https://www.thebikerguide.co.uk/bikerfriendlycafemeetingplaceskent"
  ],
  "confidence": "high"
 },
 {
  "id": "k-v-airport-cafe",
  "kind": "venue",
  "name": "Airport Café, Sellindge",
  "area": "Kent",
  "description": "Classic A20 café with off-road parking. Regular car and bike nights; very popular on Sundays.",
  "warnings": "Check event nights.",
  "at": {
   "lat": 51.0907,
   "lng": 1.0155
  },
  "sources": [
   "https://www.thebikerguide.co.uk/bikerfriendlycafemeetingplaceskent",
   "https://www.devittinsurance.com/?p=60358"
  ],
  "confidence": "high"
 },
 {
  "id": "k-v-blue-white",
  "kind": "venue",
  "name": "Blue & White Café, Smeeth",
  "area": "Kent",
  "description": "A20 café with a large parking area. Used by local bikers on Sunday rides.",
  "warnings": "Coordinate from postcode TN25 6SP.",
  "at": {
   "lat": 51.1184,
   "lng": 0.9532
  },
  "sources": [
   "https://www.thebikerguide.co.uk/bikerfriendlycafemeetingplaceskent",
   "https://devittinsurance.com/?p=58988"
  ],
  "confidence": "medium"
 },
 {
  "id": "k-v-hook-hatchet",
  "kind": "venue",
  "name": "Hook & Hatchet Inn, Hucking",
  "area": "Kent",
  "description": "Country pub on the North Downs with camping. Official \"Two Wheeled Tuesdays\" bike nights in summer.",
  "warnings": "Narrow lanes; pub – no drink-driving.",
  "at": {
   "lat": 51.2936,
   "lng": 0.634
  },
  "sources": [
   "https://www.thebikerguide.co.uk/bikerfriendlycafemeetingplaceskent",
   "https://www.hookandhatchet.co.uk/"
  ],
  "confidence": "high"
 },
 {
  "id": "k-v-picnic-hut",
  "kind": "venue",
  "name": "The Picnic Hut, Burmarsh",
  "area": "Kent",
  "description": "Farm café on Romney Marsh. Listed with Monday 5–8pm bike meets.",
  "warnings": "Coordinate from postcode TN29 0JR.",
  "at": {
   "lat": 51.0401,
   "lng": 1.0023
  },
  "sources": [
   "https://www.thebikerguide.co.uk/bikerfriendlycafemeetingplaceskent"
  ],
  "confidence": "medium"
 },
 {
  "id": "k-v-etype-uk",
  "kind": "venue",
  "name": "E-Type UK, Hadlow",
  "area": "Kent",
  "description": "Jaguar E-Type specialist with private parking. Hosts \"Coffee, Cakes & Classic Cars\" meets.",
  "warnings": "Event dates only; coordinate from postcode TN11 9QU.",
  "at": {
   "lat": 51.2251,
   "lng": 0.3076
  },
  "sources": [
   "https://etypeuk.com/"
  ],
  "confidence": "medium"
 },
 {
  "id": "k-v-dover-transport",
  "kind": "venue",
  "name": "Dover Transport Museum",
  "area": "Kent",
  "description": "Transport museum with 70+ classic motorcycles and café. Biker Guide listing.",
  "warnings": "Wed & Sun only; phone ahead for groups.",
  "at": {
   "lat": 51.1506,
   "lng": 1.2904
  },
  "sources": [
   "https://www.thebikerguide.co.uk/bikerfriendlycafemeetingplaceskent",
   "https://www.dovertransportmuseum.org.uk/"
  ],
  "confidence": "high"
 },
 {
  "id": "k-v-light-railway-cafe",
  "kind": "venue",
  "name": "Light Railway Café, Dungeness",
  "area": "Kent",
  "description": "Café at Dungeness station on the RH&DR. Biker Guide listing; end point of the Dungeness route.",
  "warnings": "Private estate parking rules.",
  "at": {
   "lat": 50.9142,
   "lng": 0.9706
  },
  "sources": [
   "https://www.thebikerguide.co.uk/bikerfriendlycafemeetingplaceskent",
   "https://www.rhdr.org.uk/"
  ],
  "confidence": "medium"
 },
 {
  "id": "l-embankment-night",
  "kind": "drive",
  "name": "Embankment & Tower Bridge night loop",
  "area": "London",
  "description": "Classic after-dark loop: Victoria Embankment and Upper/Lower Thames Street east to Tower Bridge, back along the South Bank to Westminster Bridge.",
  "warnings": "ULEZ applies 24/7 (non-compliant vehicles pay daily). Congestion Charge (£18/day from Jan 2026) applies Mon–Fri 07:00–18:00 and Sat/Sun/bank holidays 12:00–18:00 – run it after 18:00. 20 mph limits on most central roads; red routes = no stopping. Westminster/K&C High Court injunction and PSPO: no racing, stunts, revving or organised meets – revving/dangerous driving penalties apply 18:00–07:00. Tower Bridge closes for lifts.",
  "at": {
   "lat": 51.501,
   "lng": -0.125
  },
  "path": [
   {
    "lat": 51.501,
    "lng": -0.125
   },
   {
    "lat": 51.5063,
    "lng": -0.1226
   },
   {
    "lat": 51.5104,
    "lng": -0.1165
   },
   {
    "lat": 51.511,
    "lng": -0.1072
   },
   {
    "lat": 51.5112,
    "lng": -0.0968
   },
   {
    "lat": 51.5111,
    "lng": -0.0968
   },
   {
    "lat": 51.5112,
    "lng": -0.0968
   },
   {
    "lat": 51.5098,
    "lng": -0.0878
   },
   {
    "lat": 51.5096,
    "lng": -0.0786
   },
   {
    "lat": 51.5087,
    "lng": -0.074
   },
   {
    "lat": 51.5032,
    "lng": -0.0769
   },
   {
    "lat": 51.502,
    "lng": -0.0794
   },
   {
    "lat": 51.5046,
    "lng": -0.0832
   },
   {
    "lat": 51.5047,
    "lng": -0.0908
   },
   {
    "lat": 51.5052,
    "lng": -0.0973
   },
   {
    "lat": 51.5072,
    "lng": -0.1058
   },
   {
    "lat": 51.5071,
    "lng": -0.1108
   },
   {
    "lat": 51.5045,
    "lng": -0.1134
   },
   {
    "lat": 51.5004,
    "lng": -0.1165
   },
   {
    "lat": 51.5008,
    "lng": -0.1218
   }
  ],
  "miles": 7.7,
  "start": "Parliament Square",
  "end": "Westminster Bridge",
  "sources": [
   "https://tfl.gov.uk/modes/driving/congestion-charge",
   "https://tfl.gov.uk/modes/driving/ultra-low-emission-zone",
   "https://localgovernmentlawyer.co.uk/transport-and-highways/443-transport-and-highways-news/100859-westminster-secures-injunction-in-bid-to-tackle-anti-social-driving-in-central-london"
  ],
  "confidence": "high"
 },
 {
  "id": "l-chelsea-battersea",
  "kind": "drive",
  "name": "Chelsea & Battersea river loop",
  "area": "London",
  "description": "West along Grosvenor Road and Chelsea Embankment, over Battersea Bridge and back past Battersea Power Station and Nine Elms.",
  "warnings": "ULEZ applies 24/7 (non-compliant vehicles pay daily). Congestion Charge (£18/day from Jan 2026) applies Mon–Fri 07:00–18:00 and Sat/Sun/bank holidays 12:00–18:00 – run it after 18:00. 20 mph limits on most central roads; red routes = no stopping.",
  "at": {
   "lat": 51.4931,
   "lng": -0.126
  },
  "path": [
   {
    "lat": 51.4931,
    "lng": -0.126
   },
   {
    "lat": 51.4888,
    "lng": -0.1292
   },
   {
    "lat": 51.4855,
    "lng": -0.136
   },
   {
    "lat": 51.4864,
    "lng": -0.144
   },
   {
    "lat": 51.4853,
    "lng": -0.1524
   },
   {
    "lat": 51.4846,
    "lng": -0.161
   },
   {
    "lat": 51.483,
    "lng": -0.1694
   },
   {
    "lat": 51.4792,
    "lng": -0.1708
   },
   {
    "lat": 51.4748,
    "lng": -0.1653
   },
   {
    "lat": 51.4753,
    "lng": -0.1562
   },
   {
    "lat": 51.4762,
    "lng": -0.1486
   },
   {
    "lat": 51.4791,
    "lng": -0.1433
   },
   {
    "lat": 51.4817,
    "lng": -0.1357
   },
   {
    "lat": 51.4835,
    "lng": -0.1318
   },
   {
    "lat": 51.4861,
    "lng": -0.1242
   },
   {
    "lat": 51.4916,
    "lng": -0.122
   },
   {
    "lat": 51.494,
    "lng": -0.1211
   },
   {
    "lat": 51.4931,
    "lng": -0.126
   }
  ],
  "miles": 6.9,
  "start": "Millbank",
  "end": "Millbank",
  "sources": [
   "https://tfl.gov.uk/modes/driving/congestion-charge",
   "https://tfl.gov.uk/modes/driving/ultra-low-emission-zone",
   "https://batterseapowerstation.co.uk/"
  ],
  "confidence": "high"
 },
 {
  "id": "l-isle-of-dogs",
  "kind": "drive",
  "name": "Canary Wharf & Isle of Dogs loop",
  "area": "London",
  "description": "Through the Limehouse Link tunnel to Westferry Circus, round the Isle of Dogs on Westferry and Manchester Roads, back via Aspen Way.",
  "warnings": "Canary Wharf estate roads are private and patrolled – no stopping or filming there without permission; no stopping in the tunnel; 20 mph in Tower Hamlets. ULEZ applies (outside the Congestion Charge zone).",
  "at": {
   "lat": 51.5086,
   "lng": -0.0319
  },
  "path": [
   {
    "lat": 51.5086,
    "lng": -0.0319
   },
   {
    "lat": 51.5088,
    "lng": -0.0234
   },
   {
    "lat": 51.5072,
    "lng": -0.0142
   },
   {
    "lat": 51.5073,
    "lng": -0.0091
   },
   {
    "lat": 51.5075,
    "lng": -0.0184
   },
   {
    "lat": 51.509,
    "lng": -0.0266
   },
   {
    "lat": 51.5056,
    "lng": -0.0264
   },
   {
    "lat": 51.5005,
    "lng": -0.025
   },
   {
    "lat": 51.5002,
    "lng": -0.0163
   },
   {
    "lat": 51.5011,
    "lng": -0.0088
   },
   {
    "lat": 51.5067,
    "lng": -0.0077
   },
   {
    "lat": 51.507,
    "lng": -0.0164
   },
   {
    "lat": 51.5077,
    "lng": -0.0072
   },
   {
    "lat": 51.5107,
    "lng": 0.0002
   },
   {
    "lat": 51.5081,
    "lng": -0.0047
   },
   {
    "lat": 51.5071,
    "lng": -0.0139
   },
   {
    "lat": 51.5086,
    "lng": -0.0229
   },
   {
    "lat": 51.5082,
    "lng": -0.0316
   },
   {
    "lat": 51.5116,
    "lng": -0.0381
   },
   {
    "lat": 51.5115,
    "lng": -0.0385
   },
   {
    "lat": 51.5086,
    "lng": -0.0319
   }
  ],
  "miles": 8.2,
  "start": "Limehouse Link",
  "end": "Limehouse Link",
  "sources": [
   "https://tfl.gov.uk/modes/driving/ultra-low-emission-zone",
   "https://canarywharf.com/"
  ],
  "confidence": "high"
 },
 {
  "id": "l-royal-docks-woolwich",
  "kind": "drive",
  "name": "Royal Docks & Woolwich Ferry",
  "area": "London",
  "description": "Past Royal Victoria and Royal Albert Docks and London City Airport, across the Thames on the free Woolwich Ferry, back west to the Peninsula.",
  "warnings": "Ferry runs daytime/early evening only and can be suspended for fog or tides (check TfL); ULEZ applies; Blackwall and Silvertown tunnels nearby are tolled during the day.",
  "at": {
   "lat": 51.5111,
   "lng": 0.0131
  },
  "path": [
   {
    "lat": 51.5111,
    "lng": 0.0131
   },
   {
    "lat": 51.5079,
    "lng": 0.0144
   },
   {
    "lat": 51.5043,
    "lng": 0.0201
   },
   {
    "lat": 51.5048,
    "lng": 0.0282
   },
   {
    "lat": 51.5024,
    "lng": 0.0314
   },
   {
    "lat": 51.5041,
    "lng": 0.0396
   },
   {
    "lat": 51.5095,
    "lng": 0.0405
   },
   {
    "lat": 51.5089,
    "lng": 0.0542
   },
   {
    "lat": 51.5086,
    "lng": 0.0634
   },
   {
    "lat": 51.5079,
    "lng": 0.0713
   },
   {
    "lat": 51.5023,
    "lng": 0.0703
   },
   {
    "lat": 51.5,
    "lng": 0.0636
   },
   {
    "lat": 51.4978,
    "lng": 0.0624
   },
   {
    "lat": 51.4937,
    "lng": 0.0617
   },
   {
    "lat": 51.4938,
    "lng": 0.0646
   },
   {
    "lat": 51.4929,
    "lng": 0.0556
   },
   {
    "lat": 51.4903,
    "lng": 0.0478
   },
   {
    "lat": 51.4874,
    "lng": 0.0415
   },
   {
    "lat": 51.4866,
    "lng": 0.0331
   },
   {
    "lat": 51.4899,
    "lng": 0.0275
   },
   {
    "lat": 51.4904,
    "lng": 0.0183
   },
   {
    "lat": 51.4928,
    "lng": 0.0103
   },
   {
    "lat": 51.495,
    "lng": 0.008
   }
  ],
  "miles": 8.9,
  "start": "Canning Town",
  "end": "Greenwich Peninsula",
  "sources": [
   "https://tfl.gov.uk/modes/river/woolwich-ferry",
   "https://tfl.gov.uk/modes/driving/ultra-low-emission-zone"
  ],
  "confidence": "high"
 },
 {
  "id": "l-westway",
  "kind": "drive",
  "name": "Westway (A40) elevated",
  "area": "London",
  "description": "The elevated A40 Westway from Paddington to White City, at its best at night with the city lights below.",
  "warnings": "Speed cameras; no stopping; ULEZ applies.",
  "at": {
   "lat": 51.5224,
   "lng": -0.1619
  },
  "path": [
   {
    "lat": 51.5224,
    "lng": -0.1619
   },
   {
    "lat": 51.5201,
    "lng": -0.1687
   },
   {
    "lat": 51.5201,
    "lng": -0.1789
   },
   {
    "lat": 51.5195,
    "lng": -0.1886
   },
   {
    "lat": 51.5212,
    "lng": -0.1974
   },
   {
    "lat": 51.5192,
    "lng": -0.2063
   },
   {
    "lat": 51.5162,
    "lng": -0.215
   },
   {
    "lat": 51.5151,
    "lng": -0.2238
   },
   {
    "lat": 51.5149,
    "lng": -0.2248
   }
  ],
  "miles": 3.4,
  "start": "Marylebone Road",
  "end": "White City",
  "sources": [
   "https://en.wikipedia.org/wiki/Westway_(London)",
   "https://tfl.gov.uk/modes/driving/ultra-low-emission-zone"
  ],
  "confidence": "high"
 },
 {
  "id": "l-p-battersea",
  "kind": "photo",
  "name": "Battersea Power Station",
  "area": "London",
  "description": "Restored power station and riverside; use the on-site car park. Iconic chimneys and river views.",
  "warnings": "Private estate – security may stop filming; ULEZ.",
  "at": {
   "lat": 51.4818,
   "lng": -0.1446
  },
  "sources": [
   "https://batterseapowerstation.co.uk/"
  ],
  "confidence": "high"
 },
 {
  "id": "l-p-greenwich-peninsula",
  "kind": "photo",
  "name": "Greenwich Peninsula / The O2",
  "area": "London",
  "description": "Riverside around the O2 with Canary Wharf across the water; O2 car parks. Skyline views at night.",
  "warnings": "Private estate in parts; Blackwall/Silvertown tunnels tolled in the day; ULEZ.",
  "at": {
   "lat": 51.5029,
   "lng": 0.0032
  },
  "sources": [
   "https://www.greenwichpeninsula.co.uk/"
  ],
  "confidence": "high"
 },
 {
  "id": "l-p-royal-victoria-dock",
  "kind": "photo",
  "name": "Royal Victoria Dock",
  "area": "London",
  "description": "Dockside with cable car and ExCeL; use the ExCeL or dockside car parks. Wide open waterside views.",
  "warnings": "Busy during ExCeL events; ULEZ.",
  "at": {
   "lat": 51.5066,
   "lng": 0.0284
  },
  "sources": [
   "https://www.royaldocks.london/"
  ],
  "confidence": "high"
 },
 {
  "id": "l-p-canary-wharf",
  "kind": "photo",
  "name": "Canary Wharf (Canada Square)",
  "area": "London",
  "description": "Glass towers and lit-up plazas; park in the estate car parks. Classic night-time city backdrop.",
  "warnings": "Private estate: security stops unauthorised filming and stopping; no gatherings.",
  "at": {
   "lat": 51.5051,
   "lng": -0.0178
  },
  "sources": [
   "https://canarywharf.com/"
  ],
  "confidence": "medium"
 },
 {
  "id": "l-p-tower-bridge",
  "kind": "photo",
  "name": "Tower Bridge from Potters Fields",
  "area": "London",
  "description": "Shoot Tower Bridge from the Potters Fields riverside; the bridge itself is a no-stopping red route. London's most recognisable bridge.",
  "warnings": "No stopping on the bridge or approaches; pay parking nearby; 20 mph; Congestion Charge in the day.",
  "at": {
   "lat": 51.5042,
   "lng": -0.0784
  },
  "sources": [
   "https://en.wikipedia.org/wiki/Potters_Fields_Park",
   "https://tfl.gov.uk/modes/driving/congestion-charge"
  ],
  "confidence": "high"
 },
 {
  "id": "l-p-westminster-bridge",
  "kind": "photo",
  "name": "Westminster Bridge & Parliament",
  "area": "London",
  "description": "Rolling or pavement shots of cars with Big Ben behind. Iconic London backdrop.",
  "warnings": "No stopping (red route); Westminster car-meet injunction/PSPO – no gatherings or revving; Congestion Charge in the day.",
  "at": {
   "lat": 51.5009,
   "lng": -0.1218
  },
  "sources": [
   "https://localgovernmentlawyer.co.uk/transport-and-highways/443-transport-and-highways-news/100859-westminster-secures-injunction-in-bid-to-tackle-anti-social-driving-in-central-london",
   "https://tfl.gov.uk/modes/driving/congestion-charge"
  ],
  "confidence": "high"
 },
 {
  "id": "l-p-embankment",
  "kind": "photo",
  "name": "Victoria Embankment",
  "area": "London",
  "description": "Lamp-lined riverside road with views to the London Eye; good for moving shots. Classic night-run backdrop.",
  "warnings": "No stopping on the red route – use nearby paid car parks; Westminster PSPO 18:00–07:00 for revving/anti-social driving.",
  "at": {
   "lat": 51.5102,
   "lng": -0.1172
  },
  "sources": [
   "https://localgovernmentlawyer.co.uk/transport-and-highways/443-transport-and-highways-news/100859-westminster-secures-injunction-in-bid-to-tackle-anti-social-driving-in-central-london",
   "https://tfl.gov.uk/modes/driving/congestion-charge"
  ],
  "confidence": "high"
 },
 {
  "id": "l-p-ally-pally",
  "kind": "photo",
  "name": "Alexandra Palace terrace",
  "area": "London",
  "description": "Hilltop palace with a panoramic view over London; on-site car parks. One of the best free skyline views.",
  "warnings": "Park in marked bays only; no meets; events can close car parks.",
  "at": {
   "lat": 51.595,
   "lng": -0.1289
  },
  "sources": [
   "https://www.alexandrapalace.com/"
  ],
  "confidence": "medium"
 },
 {
  "id": "l-p-greenwich-park",
  "kind": "photo",
  "name": "Greenwich Park (General Wolfe viewpoint)",
  "area": "London",
  "description": "Viewpoint over Queen's House and Canary Wharf; Blackheath Avenue car park alongside. Classic London panorama.",
  "warnings": "Royal Parks car park is pay-and-display and closes with the park at dusk.",
  "at": {
   "lat": 51.4777,
   "lng": -0.0004
  },
  "sources": [
   "https://www.royalparks.org.uk/visit/parks/greenwich-park"
  ],
  "confidence": "high"
 },
 {
  "id": "l-p-thames-barrier",
  "kind": "photo",
  "name": "Thames Barrier Park",
  "area": "London",
  "description": "Landscaped park looking out to the Thames Barrier gates. Unusual industrial-river backdrop.",
  "warnings": "Park opening hours; limited parking nearby; ULEZ.",
  "at": {
   "lat": 51.5007,
   "lng": 0.0342
  },
  "sources": [
   "https://www.royaldocks.london/"
  ],
  "confidence": "medium"
 },
 {
  "id": "l-p-olympic-park",
  "kind": "photo",
  "name": "Queen Elizabeth Olympic Park (Orbit)",
  "area": "London",
  "description": "ArcelorMittal Orbit, London Stadium and modern architecture; park car parks. Modern architecture backdrop.",
  "warnings": "Event-day closures; private estate rules on filming.",
  "at": {
   "lat": 51.5383,
   "lng": -0.013
  },
  "sources": [
   "https://www.queenelizabetholympicpark.co.uk/"
  ],
  "confidence": "high"
 },
 {
  "id": "l-p-richmond-hill",
  "kind": "photo",
  "name": "Richmond Hill viewpoint",
  "area": "London",
  "description": "Protected view over the Thames towards Twickenham. Famous protected view.",
  "warnings": "Limited roadside parking – use local pay car parks; residents nearby, no gatherings.",
  "at": {
   "lat": 51.4542,
   "lng": -0.2999
  },
  "sources": [
   "https://en.wikipedia.org/wiki/Richmond_Hill,_London"
  ],
  "confidence": "medium"
 },
 {
  "id": "l-v-ace",
  "kind": "venue",
  "name": "Ace Café London",
  "area": "London",
  "description": "The original rockers' café on the North Circular at Stonebridge. Runs regular themed bike and car nights and monthly club meets (Ace Café website).",
  "warnings": "Behave on exit – the North Circular is heavily policed; ULEZ.",
  "at": {
   "lat": 51.5413,
   "lng": -0.2777
  },
  "sources": [
   "https://london.acecafe.com/"
  ],
  "confidence": "high"
 },
 {
  "id": "l-v-bike-shed",
  "kind": "venue",
  "name": "Bike Shed Motorcycle Club, Shoreditch",
  "area": "London",
  "description": "Motorcycle café, bar and shop in railway arches on Old Street. Well-known London bike hangout with bike parking.",
  "warnings": "Congestion Charge zone edge; limited parking.",
  "at": {
   "lat": 51.527,
   "lng": -0.0787
  },
  "sources": [
   "https://www.thebikeshed.cc/"
  ],
  "confidence": "high"
 },
 {
  "id": "l-v-krazy-horse-welling",
  "kind": "venue",
  "name": "Krazy Horse London, Welling",
  "area": "London",
  "description": "Motorcycle shop with café and workshop. Biker Guide listing.",
  "warnings": "Coordinate from postcode DA16 3RQ.",
  "at": {
   "lat": 51.4645,
   "lng": 0.0935
  },
  "sources": [
   "https://www.thebikerguide.co.uk/bikerfriendlycafemeetingplaceskent"
  ],
  "confidence": "medium"
 },
 {
  "id": "l-v-biggin-hill",
  "kind": "venue",
  "name": "Biggin Hill Memorial Museum",
  "area": "London",
  "description": "RAF memorial museum with café and car park. Biker Guide listing; Spitfire history.",
  "warnings": "Tue–Sun 10:00–17:00.",
  "at": {
   "lat": 51.3271,
   "lng": 0.0239
  },
  "sources": [
   "https://www.thebikerguide.co.uk/bikerfriendlycafemeetingplaceskent"
  ],
  "confidence": "high"
 },
 {
  "id": "l-v-london-concours",
  "kind": "venue",
  "name": "London Concours (HAC, City Road)",
  "area": "London",
  "description": "Annual summer concours at the Honourable Artillery Company grounds. Official annual car event.",
  "warnings": "Ticketed; Congestion Charge zone.",
  "at": {
   "lat": 51.523,
   "lng": -0.0885
  },
  "sources": [
   "https://www.londonconcours.co.uk/"
  ],
  "confidence": "high"
 },
 {
  "id": "l-v-hampton-court",
  "kind": "venue",
  "name": "Concours of Elegance, Hampton Court Palace",
  "area": "London",
  "description": "Annual concours in the palace grounds (Richmond upon Thames). Official annual car event.",
  "warnings": "Ticketed; ULEZ.",
  "at": {
   "lat": 51.4037,
   "lng": -0.3377
  },
  "sources": [
   "https://www.concoursofelegance.co.uk/"
  ],
  "confidence": "high"
 },
 {
  "id": "l-v-rykas",
  "kind": "venue",
  "name": "Ryka's, Box Hill (Surrey – outside area)",
  "area": "London",
  "description": "Famous bikers' café at the foot of Box Hill, Surrey. Long-standing bike meet spot; included for reference only.",
  "warnings": "Surrey, not London; heavy police attention on the A24/Zig Zag Road.",
  "at": {
   "lat": 51.2555,
   "lng": -0.3224
  },
  "sources": [
   "https://www.rykas.co.uk/"
  ],
  "confidence": "high"
 },
 {
  "id": "l-v-brooklands",
  "kind": "venue",
  "name": "Brooklands Museum (Surrey – outside area)",
  "area": "London",
  "description": "Museum on the old banked circuit at Weybridge with regular car events. Official events and club days; reference only.",
  "warnings": "Surrey, not London; ticketed.",
  "at": {
   "lat": 51.3552,
   "lng": -0.4633
  },
  "sources": [
   "https://www.brooklandsmuseum.com/"
  ],
  "confidence": "high"
 }
]
```
