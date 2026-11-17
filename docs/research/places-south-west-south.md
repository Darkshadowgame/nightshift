# Nightshift – regional places research (South West and South of England)

_Compiled 17 November 2026. Research only – the data file is `src/data/regions/southWestSouth.ts`._

## How this was put together

- **Area:** Cornwall, Devon (Dartmoor, Exmoor), Somerset, Dorset, Wiltshire, Gloucestershire/Cotswolds, Bristol/Bath, Hampshire (New Forest), Isle of Wight, Berkshire, Oxfordshire, Surrey, West and East Sussex (South Downs).
- **Method:** the same as `regional-places.md`. Sources are driving and riding guides (PistonHeads "My Dream Drive", BestBikingRoads, Adventure Bike Rider, RideTo, Total 911), venue lists (The Biker Guide, Devitt, MCN), official sites (National Trust, Forestry England, English Heritage, venue and organiser sites) and council, court and police notices for the places to avoid. Each row links its sources.
- **Coordinates:** car parks, viewpoints and raceways are OpenStreetMap objects (Overpass), matched to the named place ("OSM" in the Sources column). Venues come from OpenStreetMap via Photon, or from the postcode centroid (postcodes.io) where OSM had no match – those are marked medium. Nominatim was rate-limited during this run, so Photon and Overpass were used instead.
- **Drive lines:** each drive was routed with OSRM (OpenStreetMap road data) through on-road points on the named roads. The road numbers used were read back from the route steps and checked against the source; U-turns and spurs were removed by moving the via points. Waypoints are sampled every 1.0 mile along the routed line (so no two are more than 1.5 miles apart). The "Line" column says where the line leaves the named road.
- **Legal and safe:** every stop is a public car park, a visitor site or a venue that welcomes visitors. PSPOs, the Box Hill order and recurring dispersal areas are listed under **Avoid**. Opening times, prices and meet dates change – check before publishing them as live data.
- **Already in the app (skipped as duplicates):** Thruxton, Castle Combe, Goodwood Motor Circuit, Prescott, Gurston Down (tracks); Atlantic Highway A39, Cheddar Gorge B3135, Military Road IoW (drives); Box Hill, Compton Bay, Haytor, Cheddar Gorge (photo spots); Ryka's and Brooklands (venues).
- **Confidence:** _high_ = confirmed against an official or map listing and the line follows the named roads. _medium_ = postcode centroid, unnamed OSM car park, a route rebuilt from village names, or 2026 dates/status not confirmed. _low_ = unverified (left out of the data file).
- **Limits of this run:** the shared web-search allowance ran out part-way, so some venue dates and oval-track fixture lists could not be re-checked for 2026, and several council areas could not be searched for car-meet orders (see the end of **Avoid**).

## South West

### Drives / routes (8)

| Name | Start → End | Miles | Description | Why it's good | Warnings | Line | Conf. | Sources |
|---|---|---|---|---|---|---|---|---|
| **B3212 across Dartmoor** | Yelverton → Moretonhampstead | 20.4 | The main road over the high moor: Yelverton, Princetown, Two Bridges, Postbridge and the Warren House Inn, then down into Moretonhampstead. | BestBikingRoads (Yelverton–Exeter): the moorland section is open, consistent and fast with big views; Motorcycle Sport & Leisure calls the stretch past Princetown one of the best roads in the country. | Dartmoor 40 mph limit on the open moor. Ponies, sheep and cattle roam free and are hit often – Visit Dartmoor singles out the open common between Peek Hill and Princetown. Cattle grids; mud and gravel on bends after Moretonhampstead; slow tourist traffic; fog and snow on the tops. | On the B3212 throughout (shares a short stretch with the B3357 near Two Bridges). (22 waypoints) | high | [1](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/south-west-england/ride/b3212-yelverton-exeter) [2](https://visitdartmoor.co.uk/driving-dartmoor-what-the-moor-asks-of-you-that-other-roads-do-not/) [3](https://www.mslmagazine.co.uk/?p=234275) |
| **B3357 Tavistock to Ashburton via Dartmeet** | Tavistock → Ashburton | 20.5 | West to east across Dartmoor via Merrivale and Two Bridges, down the steep hill to Dartmeet, then Poundsgate and Holne Bridge to Ashburton. | Rated on BestBikingRoads as part of the "Dartmoor Treat" (Roborough–Two Bridges–Ponsworthy) and Tavistock–Moretonhampstead rides. | Dartmoor 40 mph limit; free-roaming livestock and cattle grids. The Dartmeet hill and the road on to Poundsgate are narrow with tight bends – very slow in summer, and Dartmeet car parks fill up. | B3357 from Tavistock to Dartmeet; OSM maps the road on to Poundsgate and Holne Bridge without a number; the last 0.4 mi uses the A38 link at Ashburton. (22 waypoints) | medium | [1](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/south-west-england/ride/tavistock-to-mortonhampstead) [2](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/south-west-england/ride/roborough-two-bridges-ponsworthy-pear-tree-dartmoor-treat) |
| **A39 Exmoor coast: Porlock and Countisbury hills** | Minehead → Lynmouth | 17.1 | Out of Minehead to Porlock, up Porlock Hill onto the open moor past County Gate, then down Countisbury Hill into Lynmouth. | Adventure Bike Rider and RideTo both pick the A39 Porlock–Lynmouth stretch as one of the best roads in the South West: hairpins, sweeping moorland bends and sea views. | Porlock Hill is about 1 in 4 (25%) with two hairpins – use a low gear down; caravans and long vehicles struggle (the Porlock Scenic Toll Road is the gentler, paid alternative). Countisbury Hill is also very steep. Sheep and Exmoor ponies on the open moor; summer caravans and coaches; fog on the tops. | On the A39 throughout. (18 waypoints) | high | [1](https://www.rideto.com/blog/RideTo-Best-Rides-A39-Somerset-Devon) [2](https://www.adventurebikerider.com/?p=30456) |
| **B3306 West Cornwall coast road** | St Ives → St Just | 13.8 | Hugs the Penwith coast past Zennor, Morvah, Pendeen and Botallack, with the Atlantic on one side and moorland on the other. | Wikipedia: "often considered one of the greatest driving roads in the United Kingdom" for its scenery. | Narrow and twisting between granite walls with blind bends; tractors, cyclists and coaches in summer; St Ives streets are very congested; flood damage has closed it near Zennor before. | On the B3306; about 0.7 mi near Morvah is mapped without a number in OSM. (15 waypoints) | high | [1](https://en.wikipedia.org/wiki/B3306_road) |
| **B3157 Jurassic Coast road** | Bridport → Weymouth | 17.8 | Burton Bradstock, the climb over Abbotsbury Hill with views along Chesil Beach, then Portesham and Chickerell into Weymouth. | BestBikingRoads rates the scenery 4.6/5 and the corners highly: good bends with clear exits and views over Lyme Bay and Chesil Beach. | Blind crests and crossroads; mostly 50 mph; reviewers report mobile speed cameras and police at weekends; holiday traffic and walkers; morning fog. | On the B3157 throughout. (19 waypoints) | high | [1](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/south-west-england/ride/b3157-bridport-weymouth) [2](https://wdlh.co.uk/things-to-do/the-jurassic-coast-road/) |
| **B3081 Zig Zag Hill and Cranborne Chase** | Shaftesbury → St Leonards (Ringwood) | 24.2 | Climbs out of Shaftesbury up the hairpins of Zig Zag Hill, crosses Cranborne Chase via Tollard Royal and Sixpenny Handley, then Verwood to the A31 near Ringwood. | BestBikingRoads (Shaftesbury–Ringwood) highlights Zig Zag Hill, the Cranborne Chase landscape and Tollard Royal; Total 911 lists Zig Zag Hill as a great road. | Zig Zag Hill hairpins are steep, narrow and greasy with leaves, and downhill traffic drifts across; gravel at the top; Tollard Royal is slow; police reported on the Sixpenny Handley–Cranborne straight; horses and farm traffic. Dorset Council closes the hill for resurfacing at times. | On the B3081 except short village lanes in Sixpenny Handley and 0.7 mi on the B3078. (26 waypoints) | high | [1](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/south-west-england/ride/b3081-shaftesbury-ringwood) [2](https://www.total911.com/great-roads-zig-zag-hill-dorset-uk/) |
| **B4632 Broadway to Cheltenham over Cleeve Hill** | Broadway → Cheltenham | 14.9 | Along the foot of the Cotswold edge to Winchcombe, then up over Cleeve Hill – the highest point of the Cotswolds – and down into Cheltenham. | Used in Bike magazine's Cotswolds route (with the B4077); Cleeve Hill sits beside the B4632. | Winchcombe high street is narrow; Cleeve Hill has steep, tight bends and a common with walkers and livestock; Prescott Hill Climb is just off this road – event-day traffic; Cheltenham town traffic at the end. | On the B4632 throughout. (16 waypoints) | medium | [1](https://www.pressreader.com/uk/bike-uk/20180201/281728384882108) [2](https://www.gloucestershire.gov.uk/media/s1ojnglr/snowshill-cycle-map.pdf) |
| **B4077 Stow to Toddington (Stanway Hill)** | Stow-on-the-Wold → Toddington | 12.0 | West from Stow across the high wolds past Ford, then down the long Stanway Hill towards Toddington. | Used in Bike magazine's Cotswolds route (with the B4632); the Stanway Hill descent is the highlight. | Stanway Hill is steep with a sharp bend at the bottom and HGVs; racehorses ridden near Ford; mud from farms. | Leaves Stow on the A424 for 1.4 mi and an unnumbered lane past Upper Swell, then the B4077. (13 waypoints) | medium | [1](https://www.pressreader.com/uk/bike-uk/20180201/281728384882108) [2](https://www.gloucestershire.gov.uk/media/s1ojnglr/snowshill-cycle-map.pdf) |

### Photo spots (14)

| Name | Lat, Lng | Description | Why it's good / events | Warnings | Conf. | Sources |
|---|---|---|---|---|---|---|
| **Bedruthan Steps (Carnewas)** | 50.4853, -5.0327 | Clifftop car park above the rock stacks of Bedruthan beach on the north Cornish coast. | One of Cornwall's best-known coastal views. | Pay car park; cliff edges unfenced; busy in summer. | high | [1](https://www.nationaltrust.org.uk/visit/cornwall/carnewas-and-bedruthan-steps) OSM |
| **Botallack mine engine houses** | 50.1408, -5.6891 | National Trust car park by the Count House above the clifftop mine engine houses, just off the B3306. | Famous Crown Mines backdrop at the end of the Penwith coast road. | NT car park charges; narrow lane from the B3306; don't drive on the mine tracks. | high | [1](https://www.nationaltrust.org.uk/visit/cornwall/botallack) OSM |
| **Lizard Point** | 49.9594, -5.2064 | Car park at the most southerly point of mainland Britain, by the lighthouse and cafés. | Unique "most southerly" landmark. | Narrow road through Lizard village; small car parks fill in summer. | high | [1](https://www.nationaltrust.org.uk/visit/cornwall/the-lizard-and-kynance-cove) OSM |
| **Burrator Reservoir** | 50.4942, -4.0447 | Free roadside parking areas by the dam, with Sheeps Tor behind the water. | Classic Dartmoor reservoir view near Yelverton (start of the B3212 drive). | Narrow lanes; park only in the marked areas; ponies and sheep. | high | [1](https://www.dartmoor.gov.uk/) OSM |
| **Dartmeet** | 50.5443, -3.875 | Free car park where the East and West Dart rivers meet, beside the old clapper bridge. | On the B3357 drive; river and moorland backdrop. | Steep, narrow hill either side; very busy summer weekends; free-roaming livestock. | high | [1](https://en.wikipedia.org/wiki/Dartmeet) OSM |
| **Valley of Rocks, Lynton** | 51.2325, -3.8518 | Pay-and-display car park in the dry valley of rock towers west of Lynton, with feral goats. | Dramatic Exmoor coastal scenery near the end of the A39 drive. | Narrow road with a toll section beyond; goats on the road. | high | [1](https://en.wikipedia.org/wiki/Valley_of_Rocks) OSM |
| **County Gate, Exmoor** | 51.2241, -3.7296 | Car park on the A39 at the Devon–Somerset border, looking over the East Lyn valley and the sea. | Natural stop on the A39 Exmoor coast drive. | Turn in carefully from the A39; exposed and foggy in poor weather. | high | [1](https://www.exmoor-nationalpark.gov.uk/) OSM |
| **Dunkery Beacon** | 51.1541, -3.5803 | Moorland car park below Exmoor's highest point. | Big views over Exmoor towards the Bristol Channel. | Unfenced moor roads, sheep and ponies; single-track sections. Car park position is an unnamed OSM car park south of the summit. | medium | [1](https://en.wikipedia.org/wiki/Dunkery_Beacon) OSM |
| **Portland Bill** | 50.5156, -2.4565 | Pay car park by the red-and-white lighthouse at the southern tip of Portland. | Lighthouse and rough-sea backdrop. | Pay parking; very windy; busy summer weekends. | high | [1](https://en.wikipedia.org/wiki/Portland_Bill) OSM |
| **Durdle Door** | 50.6241, -2.2693 | Estate pay car park at the top of the path to the limestone arch. | One of the most photographed spots on the Jurassic Coast. | Private estate car park with fees; very busy in summer; no gatherings. | high | [1](https://www.lulworth.com/) OSM |
| **Corfe Castle** | 50.6451, -2.0603 | Pay car park on the A351 below the castle ruins. | Castle ruin on its hill in the Purbeck gap. | A351 is busy and slow in summer; car park charges. | medium | [1](https://www.nationaltrust.org.uk/visit/dorset/corfe-castle) OSM |
| **Abbotsbury Hill viewpoint** | 50.6705, -2.6201 | Free car park and viewpoint on the B3157 above Abbotsbury, looking along Chesil Beach. | On the B3157 Jurassic Coast drive. | Pull in slowly – fast road with crests; exposed. | high | [1](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/south-west-england/ride/b3157-bridport-weymouth) OSM |
| **Westbury White Horse** | 51.2614, -2.1453 | Free car park on Bratton Downs by the chalk horse and Iron Age fort. | Views over the Vale of Pewsey and the white horse. | Single-track lane up; livestock; no gatherings. | high | [1](https://www.english-heritage.org.uk/visit/places/westbury-white-horse-and-bratton-camp/) OSM |
| **Broadway Tower** | 52.0236, -1.8388 | Car park by the 18th-century folly tower on the Cotswold edge (just over the Worcestershire line). | Classic Cotswolds landmark near the start of the B4632 drive. | Paid parking for the country park; opening times apply. | medium | [1](https://www.broadwaytower.co.uk/) OSM |

### Tracks, circuits & sprint venues (5)

| Name | Lat, Lng | Description | Why it's good / events | Warnings | Conf. | Sources |
|---|---|---|---|---|---|---|
| **Wiscombe Park Hill Climb** | 50.7268, -3.1506 | A 1,000-yard hill climb in the grounds of Wiscombe Park near Colyton, running since 1958. | Car and bike meetings through the season; British Hillclimb Championship rounds on 26 July 2026; free paddock entry for spectators. | Event days only; narrow lanes – sat nav EX24 6JE and use the signed spectator car park route; no dogs in spectator areas; no drones. Position is the estate road, not the start line. | medium | [1](https://www.wiscombepark.co.uk/events) [2](https://en.wikipedia.org/wiki/Wiscombe_Park) |
| **United Downs Raceway** | 50.23, -5.1555 | Short oval near St Day for stock car and banger racing (promoted by Autospeed), also used by local motor clubs. | The main oval in Cornwall; fixtures listed into the winter. | Spectator venue; check the fixture list before travelling. | high | [1](https://www.uniteddownsraceway.com/) OSM |
| **Smeatharpe Stadium** | 50.8831, -3.1676 | Oval track on the Blackdown Hills near Honiton used for stock car and banger racing. | Long-running Devon oval. | Spectator venue; check fixtures. Status not confirmed for 2026. | medium | OSM |
| **Clay Pigeon Raceway** | 50.8241, -2.5543 | Outdoor kart circuit at Wardon Hill on the A37 north of Dorchester. | Dorset's main kart track; club racing and arrive-and-drive. | Booking required. Status not confirmed for 2026. | medium | OSM |
| **Poole Stadium (Poole Pirates)** | 50.7229, -1.9821 | Speedway track at Poole Stadium, home of the Poole Pirates. | Ten-time British speedway champions, racing in the SGB Championship. | Spectator venue; check fixtures. | medium | [1](https://en.wikipedia.org/wiki/Poole_Pirates) OSM |

### Meet venues (cafés, bike nights, cars & coffee) (7)

| Name | Lat, Lng | Description | Why it's good / events | Warnings | Conf. | Sources |
|---|---|---|---|---|---|---|
| **Haynes Motor Museum (Breakfast Club)** | 51.041, -2.5592 | Big motor museum at Sparkford, just off the A303. | Haynes Breakfast Club: first Sunday of each month, 8am to about noon, any car or bike can display; dates listed to Nov 2027. | £5 tickets in advance only – none at the gate. | high | [1](https://haynesmuseum.org/whats-on/haynes-breakfast-club/) |
| **The Classic Motor Hub, Bibury** | 51.7832, -1.8403 | Classic car dealer and café in the Cotswolds. | "Coffee & Classics" Sunday mornings (2026: 22 Mar, 7 Jun, 23 Aug, 25 Oct). | £10 advance tickets; some events single-make only. Coordinate from postcode GL7 5FF. | medium | [1](https://www.classicandsportscar.com/calendar/coffee-and-classics) |
| **Poole Quay Bike Night** | 50.712, -1.9865 | Weekly summer bike night on Poole Quay. | Tuesdays 5:30–9pm, 7 Apr–29 Sep 2026, with "Bike of the Night". | Seasonal; small charge per bike in past seasons. | high | [1](https://www.pooletourism.com/news/roaring-success-bike-nights-are-back-on-poole-quay-for-the-2026-season) |
| **English Riviera Bike Night, Paignton** | 50.4374, -3.5578 | Council-listed bike night on the Eastern Esplanade. | Wednesdays from 6pm, 6 May–30 Sep 2026, often 1,000+ bikes; winter nights move to a seafront pub. | Police run a noise camera and Section 59 warnings on Paignton seafront – ride out quietly. Coordinate from postcode TQ4 6BW. | medium | [1](https://www.torbay.gov.uk/leisure-sports-and-community/events) [2](https://www.thebikerguide.co.uk/bikerfriendlymeetingplacesdevon) |
| **Weston-super-Mare Bike Night** | 51.3363, -2.9828 | Volunteer-run summer bike night on the Beach Lawns for the Poppy Appeal. | Thursdays from 6pm, May to mid-September. | Seasonal; 2026 dates not confirmed (2025 ran 24 Apr–11 Sep). | medium | [1](https://visit-westonsupermare.com/your-weston-event/weston-super-mare-bike-nights/) |
| **Chapter 1 Diner, Indian Queens** | 50.3976, -4.9231 | Diner by a motorcycle dealer just off the A30. | Thursday bike night 6–10pm, April–September. | Seasonal; coordinate from postcode TR9 6TF. | medium | [1](https://www.devittinsurance.com/guides/biker-cafes/south-west/chapter-1/) [2](https://www.thebikerguide.co.uk/bikerfriendlymeetingplacescornwall) |
| **Chequered Flag, Liskeard** | 50.4357, -4.4404 | Café at New Central Garage on the A38 at Liskeard. | Wednesday charity bike night from 6pm, all year; MCN called it "the Ace Café of the South West". | 2026 status not confirmed. | medium | [1](https://www.thebikerguide.co.uk/bikerfriendlymeetingplacescornwall) |

## South of England

### Drives / routes (8)

| Name | Start → End | Miles | Description | Why it's good | Warnings | Line | Conf. | Sources |
|---|---|---|---|---|---|---|---|---|
| **A32 Meon Valley** | Wickham → Alton (Chawton) | 18.5 | Fast A-road north through the Meon Valley in the South Downs: Droxford, Exton, West Meon (Loomies café) and on towards Alton. | BestBikingRoads (A32 Fareham–Chawton): a fast A-road through a few villages, with Loomies café and fuel halfway. | Popular with bikers, so police patrol at weekends; Warnford Parish Council asks residents to report noisy bikes; 30/40 mph through Droxford, Warnford and West Meon; farm traffic. | On the A32 throughout. (20 waypoints) | high | [1](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/south-east-england/ride/a32-fareham-chawton) [2](https://warnfordparish.gov.uk/community/warnford-village-7802/motorbike-noise-problem) |
| **A272 Winchester to Petworth** | Winchester (Cheesefoot Head) → Petworth | 33.1 | Over the downs past Cheesefoot Head and West Meon Hut to Petersfield, then on through Rogate and Midhurst to Petworth. | BestBikingRoads (Winchester–Petersfield): long sweeping bends and downland views; PistonHeads "Surrey back roads medley" praises the sweeping A272 and its walled villages. | Frequent police patrols, especially weekends and Wednesday evenings; 40 mph limits; loose stones at the West Meon Hut crossroads; town traffic in Petersfield and Midhurst; narrow streets in Petworth. | On the A272, using the B2070 through Petersfield town. (34 waypoints) | high | [1](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/south-east-england/ride/a272-winchester-petersfield) [2](https://www.pistonheads.com/news/ph-mydreamdrive/chasing-the-sun-my-dream-drive/31926) |
| **New Forest: Rhinefield and Bolderwood** | Brockenhurst → Bolderwood | 10.2 | Rhinefield Road and the Rhinefield Ornamental Drive under giant redwoods and Douglas firs, a short A35 link, then Bolderwood Road across the open forest to Bolderwood. | Forestry England: Bolderwood is the most visited car park in the New Forest; the ornamental drives are lined with some of the tallest trees in Britain. | 40 mph limit across the unfenced forest – ponies, donkeys, cattle and deer roam and are killed on the roads every year; cattle grids; narrow drives busy with cyclists and walkers in summer; never park on verges – use the Forestry England car parks. | Unnumbered forest roads plus 2.1 mi of the A35; route assembled from the named drives. (12 waypoints) | medium | [1](https://www.forestryengland.uk/bolderwood) [2](https://en.wikipedia.org/wiki/Bolderwood,_Hampshire) |
| **Lambourn Loop (Berkshire Downs)** | Great Shefford → Great Shefford | 21.0 | Up the A338 to Wantage, west on the B4507, south over the downs on the B4001 to Lambourn, and back on the Newbury road. | PistonHeads "My Dream Drive": fast, flowing A338 with good sight lines (no hedges between Great Shefford and Wantage), then rough, testing B-roads and views over Oxfordshire. | A338 is 50 mph with a sharp left-hander at the bottom of a crest halfway along; racehorses ridden on and crossing the roads around Lambourn; broken, uneven surfaces on the B4001; the Lambourn–Shefford road is busier. | A338, B4507 and B4001; the road back from Lambourn is mapped as Newbury Road without a number. (22 waypoints) | high | [1](https://www.pistonheads.com/news/ph-mydreamdrive/my-dream-drive-lambourn-loop/29221) |
| **Turner's Hill Road (B2110)** | East Grinstead → Lower Beeding (A281) | 13.7 | Through Turner's Hill and past Worth Abbey, then High Beeches Lane through woodland to Handcross and on to the A281. | PistonHeads "My Dream Drive": low hedges and open views alternate with twisting woodland sections that need precision. | Woodland sections twist and are often damp; Handcross village; the A281 is busy. Mid Sussex car-cruising PSPO covers the Birches Industrial Estate in East Grinstead near the start. | On the B2110 throughout. (15 waypoints) | high | [1](https://www.pistonheads.com/news/ph-mydreamdrive/turners-hill-road-b2110-my-dream-drive/30110) |
| **Beachy Head Road** | Eastbourne (Meads) → East Dean | 5.9 | Up from Eastbourne to Beachy Head, then along the clifftop road to Birling Gap and down to East Dean. | PistonHeads "My Dream Drive" and BestBikingRoads: hairpins under the trees, then a clifftop road with huge sea views. | Bumpy, potholed surface reported towards Birling Gap; strong crosswinds; walkers crossing to the cliffs; busy at weekends. Park only in the marked car parks. | B2103 then Beachy Head Road and Birling Gap Road (unnumbered). (7 waypoints) | high | [1](https://www.pistonheads.com/news/ph-mydreamdrive/beachy-head-my-dream-drive/31178) [2](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/south-east-england/ride/beachy-head-birling-gap) |
| **A285 Petworth to Chichester (Duncton Hill)** | Petworth → Chichester | 13.4 | South from Petworth through Duncton, up the wooded climb of Duncton Hill onto the South Downs, then past Upwaltham and Halnaker to Chichester. | BestBikingRoads (Surrey/West Sussex loop): the single-carriageway A285 south towards Chichester was the reviewer's highlight. | Bumpy surfaces in parts; Duncton Hill is steep with tight bends under trees, slippery when wet; Goodwood event days bring heavy traffic near Halnaker; ends on the busy A27. | On the A285, then 1.1 mi on the A27 Chichester bypass. (15 waypoints) | high | [1](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/south-east-england/tour/uk-surrey-west-sussex-loop) |
| **Surrey Hills lanes: Cranleigh to Newlands Corner** | Cranleigh → Newlands Corner | 10.4 | The B2127 to Ewhurst, then narrow lanes over Pitch Hill and through Peaslake to Shere, finishing on the A25 at Newlands Corner. | PistonHeads "Surrey back roads medley": rocky cuttings on the north–south Surrey Hills roads and the Newlands Corner viewpoint. | Narrow, sunken lanes full of cyclists and walkers at weekends; Shere and Peaslake are slow villages; Newlands Corner car park is camera-enforced pay parking and police treat it (with Box Hill) as an anti-social driving hotspot – don't gather there. | The source gives no road numbers; line rebuilt through the named villages (B2127, minor lanes, A25). (12 waypoints) | medium | [1](https://www.pistonheads.com/news/ph-mydreamdrive/chasing-the-sun-my-dream-drive/31926) |

### Photo spots (9)

| Name | Lat, Lng | Description | Why it's good / events | Warnings | Conf. | Sources |
|---|---|---|---|---|---|---|
| **Butser Hill** | 50.9759, -0.9862 | Hampshire County Council pay car park on the top of Butser Hill (Queen Elizabeth Country Park). | Highest point of the South Downs, views to the Isle of Wight. | Pay parking; gates close in the evening; A3 access is fast. | high | [1](https://en.wikipedia.org/wiki/Butser_Hill) OSM |
| **Bolderwood, New Forest** | 50.8768, -1.6564 | Forestry England car park at the end of the New Forest drive, with deer viewing platform nearby. | Most-visited car park in the New Forest. | 40 mph forest roads with roaming animals; car park can be very busy. | high | [1](https://www.forestryengland.uk/bolderwood) OSM |
| **The Needles (Alum Bay)** | 50.6672, -1.567 | Pay car park at the Needles Landmark Attraction above Alum Bay. | Chalk stacks and lighthouse at the western tip of the Isle of Wight. | Ferry needed to reach the island; pay parking; busy in summer. | high | [1](https://www.theneedles.co.uk/) OSM |
| **Walbury Hill and Combe Gibbet** | 51.3521, -1.4558 | Free car park on the ridge road beside Walbury Hill, the highest chalk hill in south-east England. | Big downland views; Combe Gibbet along the ridge. | Narrow, steep lanes up; livestock; exposed in bad weather. | high | [1](https://en.wikipedia.org/wiki/Walbury_Hill) OSM |
| **Uffington White Horse** | 51.5773, -1.5784 | National Trust pay car park below White Horse Hill. | Bronze Age chalk horse and Dragon Hill; near the Lambourn Loop. | NT car park charges; narrow lane; no gatherings. | high | [1](https://www.nationaltrust.org.uk/visit/oxfordshire/white-horse-hill) OSM |
| **Devil's Punch Bowl, Hindhead** | 51.1142, -0.7288 | National Trust car park and café beside the old A3 route above the Punch Bowl. | Classic Surrey Hills viewpoint. | NT car park charges; busy at weekends. | high | [1](https://www.nationaltrust.org.uk/visit/surrey/hindhead-commons-and-the-devils-punch-bowl) OSM |
| **Devil's Dyke** | 50.8856, -0.2119 | National Trust car park at the top of the dry valley north of Brighton. | Panoramic South Downs view. | NT car park charges; busy at weekends; Brighton side roads are residential. | high | [1](https://www.nationaltrust.org.uk/visit/sussex/devils-dyke) OSM |
| **Ditchling Beacon** | 50.9009, -0.1051 | National Trust car park on the summit of Ditchling Beacon. | One of the highest points on the South Downs. | Ditchling Road up the hill is narrow and steep with many cyclists; NT charges. | high | [1](https://www.nationaltrust.org.uk/visit/sussex/ditchling-beacon) OSM |
| **Birling Gap and the Seven Sisters** | 50.743, 0.2016 | National Trust car park by the visitor centre, looking along the Seven Sisters cliffs. | On the Beachy Head Road drive. | NT car park charges; cliff edges eroding – keep back. | high | [1](https://www.nationaltrust.org.uk/visit/sussex/birling-gap-and-the-seven-sisters) OSM |

### Tracks, circuits & sprint venues (7)

| Name | Lat, Lng | Description | Why it's good / events | Warnings | Conf. | Sources |
|---|---|---|---|---|---|---|
| **Goodwood Festival of Speed hill** | 50.8723, -0.7393 | The 1.16-mile hill climb past Goodwood House used for the Festival of Speed each July (2027: 15–18 July). | The best-known hill climb in the world; separate from the Goodwood Motor Circuit already in the app. | Event-only and ticketed; not open for driving at other times; very heavy traffic on event days. Position is Goodwood House. | medium | [1](https://www.goodwood.com/motorsport/festival-of-speed/) |
| **Dunsfold Park (Top Gear test track)** | 51.1158, -0.5464 | Former aerodrome near Cranleigh with the Top Gear test track, used for filming and booked track events. | Famous test track; the site keeps a track diary for hire. | Private site – no public access without a booked event. Wings & Wheels has not run since 2019 and the aerodrome is being redeveloped. | medium | [1](https://www.dunsfoldpark.com/) OSM |
| **Matterley Basin** | 51.0481, -1.2309 | Natural-bowl motocross circuit near Winchester that has hosted the British round of MXGP. | Off-road event venue. | Event and practice days only; off-road bikes only. | medium | OSM |
| **Aldershot Raceway** | 51.2563, -0.7843 | Oval stock car and banger track at Aldershot. | Regular oval meetings (Spedeworth venue). | Spectator venue; check fixtures. Status not confirmed for 2026. | medium | OSM |
| **Standlake Arena** | 51.7387, -1.4411 | Oval track near Witney for stock cars and bangers. | Oxfordshire's oval venue. | Spectator venue; check fixtures. Status not confirmed for 2026. | medium | OSM |
| **Smallfield Raceway** | 51.1816, -0.1238 | Banger racing track near Horley. | Surrey's oval venue. | Spectator venue; check fixtures. Status not confirmed for 2026. | medium | OSM |
| **Arlington Stadium, Hailsham** | 50.8577, 0.228 | Oval stadium near Hailsham: Spedeworth stock car meetings (listed for 28 Nov 2026). The Eastbourne Eagles speedway team closed in 2021. | Regular oval racing in East Sussex. | Spectator venue; check fixtures. | medium | [1](https://www.spedeworth.co.uk/fixtures.php) [2](https://en.wikipedia.org/wiki/Eastbourne_Eagles) OSM |

### Meet venues (cafés, bike nights, cars & coffee) (9)

| Name | Lat, Lng | Description | Why it's good / events | Warnings | Conf. | Sources |
|---|---|---|---|---|---|---|
| **Goodwood Breakfast Club** | 50.8591, -0.7533 | Themed Sunday-morning meets at the Goodwood Motor Circuit. | Free but ticketed; 2026 ran 3 May, 31 May (cars and bikes), 26 Jul (members) and 2 Aug (classics). | 2026 season over; 2027 dates not yet out. Tickets sell out – not a turn-up meet. | high | [1](https://www.goodwood.com/grr/event-coverage/breakfast-club/2026-goodwood-breakfast-club-dates-and-themes/) |
| **Bicester Heritage (Scramble)** | 51.915, -1.1404 | Restored RAF bomber base and classic-car business park. | Sunday Scramble three times a year (2026: 11 Jan, 26 Apr, 4 Oct; next 10 Jan 2027). | Ticketed and sells out fast; display spots by ballot. | high | [1](https://www.bicestermotion.com/latest/october-2026-scramble-sells-out) |
| **National Motor Museum, Beaulieu** | 50.8244, -1.4558 | National Motor Museum in the New Forest. | Free "Breakfast at Beaulieu" turn-up meets about monthly in the first car park, plus ticketed shows (Supercar Weekend, National Mini Day). | Breakfast meet dates for 2027 not confirmed; New Forest roads with roaming animals. | high | [1](https://www.nationalmotormuseum.org.uk/events/beaulieu-motoring-events/) |
| **Loomies Moto Café, West Meon** | 51.0304, -1.0757 | Long-running bikers' café at the A32/A272 crossroads. | Main biker meeting point in the Meon Valley (MCN "Meet of the week"); hosted 120+ riders for International Female Ride Day, May 2026. | Wednesday bike night not confirmed for 2026; police patrol the A32/A272 at weekends. | high | [1](https://motorcyclenews.com/news/2017/may/loomies-bike-meet-of-the-week) [2](https://devittinsurance.com/?p=58976) |
| **Caffeine & Machine: The Hut, West Meon** | 51.0314, -1.0748 | Caffeine & Machine's Hampshire venue, next to Loomies. | Wednesday evening sessions from 5pm and weekend sessions; ticketed events through 2026. | Some events ticketed; licensed – no drink-driving. | high | [1](https://caffeineandmachine.com/thehut) [2](https://www.motorcyclenews.com/news/2024/february/caffeine-and-machine-new-venue) |
| **H's Café, Berinsfield** | 51.6585, -1.176 | Roadside café on the A4074 near Dorchester-on-Thames. | Monday summer bike night; open daily. | Seasonal; 2026 dates not confirmed. | medium | [1](https://www.thebikerguide.co.uk/bikerfriendlyplacescafespubsoxford) |
| **The Six Bells, Chiddingly** | 50.9071, 0.1949 | Village pub near Lewes. | Bike night every second Tuesday, spring to autumn, up to 300 bikes. | Pub – no drink-driving; narrow lanes; 2026 dates not confirmed. | medium | [1](https://www.thebikerguide.co.uk/bikerfriendlymeetingplacescafespubssussex) |
| **The Custom Café, Bexhill** | 50.8458, 0.3969 | Café on the A259 Barnhorn Road. | Friday bike night 6–10pm, all year. | A259 access; 2026 status not confirmed. | medium | [1](https://www.thebikerguide.co.uk/bikerfriendlymeetingplacescafespubssussex) |
| **Pinewood Bar & Café, Wokingham** | 51.3866, -0.7958 | Bar and café on Old Wokingham Road. | Bike nights Tuesdays and Fridays from 7pm, all year (venue's own listing). | Bar – no drink-driving. Inside the Wokingham car-cruising PSPO area: no revving, racing or stunts on the way in or out. Coordinate from postcode RG40 3AQ. | medium | [1](https://pinewoodbarandcafe.co.uk/whats-on) |

## Avoid – PSPO, injunction and dispersal hotspots

These are not suggestions. The first group is in the data file as ban zones (`banZones`, rough circles); the rest are listed for context only. No "persons unknown" car-cruising injunction was found anywhere in these counties (Swindon uses a PSPO). A police Section 34/35 dispersal order lasts at most 48 hours, so it is never a standing ban.

| Area | Place / order | What applies | Sources |
|---|---|---|---|
| South West | **Swindon (whole borough) – Unauthorised Motor Vehicle Event PSPO** | In force 14 Jan 2026 for three years. Bans organising/advertising an unauthorised motoring event (incl. social media), driving or riding in one, and keepers letting their vehicle take part or park up to watch; keeper must name the driver within 14 days. £100 FPN (£75 early), up to £1,000 on conviction. Hotspots: Ashworth Rd, Ramsden Rd, Kembrey St, Elgin Dr, Stirling Rd (South Marston), Edison Rd (Dorcan), Newcombe Dr. | [1](https://www.swindon.gov.uk/download/downloads/id/11939/unauthorised_motor_vehicle_event_public_spaces_protection_order_-_2026-2029.pdf) [2](https://www.swindon.gov.uk/news/article/1302/council_cracks_down_on_dangerous_car_meets_with_new_pspo) |
| South West | **South Gloucestershire (whole district, incl. Cribbs Causeway area) – car-cruising PSPO** | Announced 22 Oct 2024, three years (to about Oct 2027). Bans taking part in a car cruise with speeding/racing, stunts, nuisance horns/music/revving, damage or obstruction; motorsport clubs and genuine events exempt. £100 FPN or up to £1,000. Does not cover Avonmouth or other Bristol City land. | [1](https://sites.southglos.gov.uk/newsroom/transport/car-cruising-ban-comes-into-force-in-south-gloucestershire) [2](https://www.hellorayo.co.uk/greatest-hits/gloucestershire/news/south-gloucestershire-council-car-cruising-ban) |
| South of England | **Wokingham (whole borough) – Car Cruising PSPO 2026** | First order Sep 2022; renewed after an Oct–Nov 2025 consultation, new order published Feb 2026 for 2 years 6 months. Covers council land and any publicly accessible place. Bans dangerous or nuisance driving (racing, skids, drifting, revving, horns, obstruction), organising/promoting (incl. online) and attending as spectator. Up to £100 FPN. Hotspots: Thames Valley Business Park, Carnival Pool car park, Mereoak P&R. | [1](https://www.wokingham.gov.uk/sites/wokingham/files/2026-02/Public%20Spaces%20Protection%20Order.pdf) [2](https://www.wokingham.gov.uk/news/2025/residents-views-sought-measures-against-car-cruising) |
| South of England | **Box Hill / A24, Mole Valley – nuisance vehicles PSPO** | In force 22 Jun 2026 to 21 Jun 2029. Area: A24 between Givons Grove and Denbies roundabouts, B2203 Old London Road (Mickleham), Zig Zag Road, Ryka's Café car park. Bans revving, idling, speeding, stunts, driving in convoy, exhaust popping, racing and sudden acceleration that cause a nuisance. £100 FPN; video evidence used. Affects the existing Box Hill photo spot and Ryka's venue. | [1](https://www.molevalley.gov.uk/crime-safety-emergencies/public-spaces-protection-orders/text-of-a24-and-surrounds-nuisance-vehicles-pspo/) [2](https://molevalley.gov.uk/a24) |
| South of England | **Mid Sussex – car-cruising PSPO (Burgess Hill, Jobs Lane/A2300, Birches Industrial Estate East Grinstead)** | Made 2020, extended Apr 2023, renewed 1 Apr 2026 to 31 Mar 2029. "Car cruising" = two or more vehicles with speeding/racing, stunts, nuisance horns/music/revving, abuse, intimidation or obstruction. Three zones: Burgess Hill (Dunstall, Franklands, Leylands, Meeds, St Andrews, Victoria wards), Jobs Lane/A2300 near the A23, and Birches Industrial Estate (Imberhorne Lane), East Grinstead. Map boundaries not seen – circles are approximate. | [1](https://www.midsussex.gov.uk/about-us/latest-news/mid-sussex-district-council-strengthens-community-safety-with-three-year-extension-of-public-spaces-protection-order-for-car-cruising) [2](https://midsussex.moderngov.co.uk/documents/s15566/Extention%20of%20Our%20Public%20Spaces%20Protection%20Order%20on%20Car%20Cruising.pdf) |
| South of England | **Basingstoke – repeated police dispersal orders** | Section 35 dispersal orders over "a large part of Basingstoke": 13–15 Jul 2024 and 28–29 Jun 2025. Hotspots: Asda Brighton Hill, Stroudley Road. The council's own PSPOs cover only alcohol and dogs. Not a standing order. | [1](https://hellorayo.co.uk/greatest-hits/berkshire-north-hampshire/news/basingstoke-car-meet-dispersal-orders) [2](https://www.hellorayo.co.uk/hits-radio/berkshire-north-hampshire/news/dispersal-order-basingstoke) |
| South West | **Paignton seafront (Esplanade and Roundham) – police enforcement, no order** | Police noise camera since 2026 and Section 59 warnings (seizure for repeat anti-social driving); Roundham car park closed 10pm–8am. No PSPO. The official Wednesday bike night is fine – just leave quietly. | [1](https://news.devon-cornwall.police.uk/news-article/690c4795-4007-f111-9d8c-6045bdd24049) |
| South West | **Hengistbury Head car park, Christchurch (BCP) – one-off dispersal** | Section 35 dispersal order at a car meet on Easter Sunday 2025. No standing order found for BCP (Castle Lane, Hamworthy, seafront). Not mapped. | [1](https://advertiserandtimes.co.uk/news/biker-seriously-injured-in-car-meet-crash-9413964) |
| South West | **Weston-super-Mare retail area (Worle) – occasional dispersal** | Sunday-evening meets; a dispersal zone was once used at Sainsbury's, Worle (year unclear). North Somerset's car-park PSPO does not cover driving. Low confidence; not mapped. | [1](https://n-somerset.gov.uk/my-services/community-safety-crime/public-space-protection-orders/car-parks) |
| South of England | **Calmore and Nursling (west of Southampton) – past dispersals** | Weekend dispersal orders against car meets around 2022. Low confidence (search-result text only); not mapped. | [1](https://www.portsmouth.co.uk/news/crime/police-set-up-two-dispersal-orders-in-southampton-after-reports-of-dangerous-car-meets-3520111) |
| South of England | **Crawley (Manor Royal, Tilgate Park) – car-cruising PSPO, probably lapsed** | Made Dec 2018, extended Feb 2022 for three years (to about Mar 2025). The council's current PSPO page lists no vehicle order. Treated as lapsed; not mapped. | [1](https://www.crawley.gov.uk/community/protecting-crawley/anti-social-behaviour/public-spaces-protection-orders) [2](https://www.crawley.gov.uk/news-story/2022/car-cruising-public-spaces-protection-order-extended) |
| South of England | **Newlands Corner, Surrey – no order, but a police hotspot** | Police closed the car park for crowding in Nov 2020 and name it with Box Hill as an anti-social driving hotspot; camera-enforced pay parking. Not a meet venue. Not mapped. | [1](https://www.pistonheads.com/news/ph-mydreamdrive/chasing-the-sun-my-dream-drive/31926) |

**Checked and not found (left out):** no car-meet PSPO or injunction for Bristol/Avonmouth/Cribbs Causeway (Bristol City side), BCP (Castle Lane, Hamworthy, seafront), Exeter (Sowton, Marsh Barton), Plymouth Hoe/Marsh Mills, Gloucester Quays, Southampton Western Esplanade, Portsmouth Eastern Road, Slough, Reading, Brighton (Madeira Drive) or Torbay. Plymouth consulted on a city-centre car-park PSPO (Apr–May 2025) and Gloucester on a car-park loitering PSPO (cabinet Jul 2026) – neither confirmed as a driving order. Southampton's and Basingstoke's PSPOs are not about vehicles.

**Not checked (treat as unknown, not clear):** Cornwall (incl. Newquay), Somerset, Wiltshire outside Swindon, Dorset Council, Cheltenham and other Gloucestershire districts, Oxfordshire, Isle of Wight, Bracknell, West Berkshire, Windsor & Maidenhead, Hampshire district PSPO lists, Eastbourne, Hastings, Lewes, Rother, Wealden, Adur, Worthing, Arun, Chichester, Horsham and most Surrey districts.

**Also excluded on purpose:** Haldon Hill (no current hill-climb venue found – the name only turns up as a café/bike-night stop on the A38); Llandow and Lydden Hill (Wales and Kent, covered elsewhere); Dunsfold Wings & Wheels (ended 2019); Newlands Corner as a meet venue; Whiteways kiosk, Bury Hill (closed Oct 2025); The Haven, Firsdown (closed 2022); Smokey Joe's (no meet evidence); Jamaica Inn bike night (unverified); Oak Tree Arena, Highbridge (Somerset Rebels speedway closed 2019); Ringwood Raceway (low confidence – Wikipedia says banger racing carried on after a planned 2022 closure, but its status is unclear); Leigh Woods / Clifton Suspension Bridge viewpoint (no public car park found in OSM); Route 38 Trerulefoot, Brightside Roadside Haldon Hill, Rolling Scones Gosport and Ryde Bike Night (single-source or 2026 unconfirmed – low confidence).

## Route waypoints

The full waypoint lists are in the `path` field of each drive in the JSON below (lat/lng to 4 decimal places, on the routed road line).

## Machine-readable data

```json
[
 {
  "id": "sws-b3212-dartmoor",
  "kind": "drive",
  "name": "B3212 across Dartmoor",
  "area": "South West",
  "description": "The main road over the high moor: Yelverton, Princetown, Two Bridges, Postbridge and the Warren House Inn, then down into Moretonhampstead.",
  "warnings": "Dartmoor 40 mph limit on the open moor. Ponies, sheep and cattle roam free and are hit often – Visit Dartmoor singles out the open common between Peek Hill and Princetown. Cattle grids; mud and gravel on bends after Moretonhampstead; slow tourist traffic; fog and snow on the tops.",
  "at": {
   "lat": 50.4933,
   "lng": -4.0798
  },
  "path": [
   {
    "lat": 50.4933,
    "lng": -4.0798
   },
   {
    "lat": 50.5013,
    "lng": -4.065
   },
   {
    "lat": 50.5089,
    "lng": -4.0461
   },
   {
    "lat": 50.5196,
    "lng": -4.0322
   },
   {
    "lat": 50.5297,
    "lng": -4.0176
   },
   {
    "lat": 50.5392,
    "lng": -4.0015
   },
   {
    "lat": 50.5491,
    "lng": -3.9867
   },
   {
    "lat": 50.5573,
    "lng": -3.9691
   },
   {
    "lat": 50.5642,
    "lng": -3.9521
   },
   {
    "lat": 50.5739,
    "lng": -3.9358
   },
   {
    "lat": 50.5855,
    "lng": -3.9229
   },
   {
    "lat": 50.5962,
    "lng": -3.9079
   },
   {
    "lat": 50.606,
    "lng": -3.8913
   },
   {
    "lat": 50.6145,
    "lng": -3.8732
   },
   {
    "lat": 50.6167,
    "lng": -3.8734
   },
   {
    "lat": 50.6255,
    "lng": -3.8591
   },
   {
    "lat": 50.6347,
    "lng": -3.8437
   },
   {
    "lat": 50.6415,
    "lng": -3.8284
   },
   {
    "lat": 50.6484,
    "lng": -3.8117
   },
   {
    "lat": 50.6547,
    "lng": -3.7922
   },
   {
    "lat": 50.6598,
    "lng": -3.7736
   },
   {
    "lat": 50.6611,
    "lng": -3.765
   }
  ],
  "miles": 20.4,
  "start": "Yelverton",
  "end": "Moretonhampstead",
  "sources": [
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/south-west-england/ride/b3212-yelverton-exeter",
   "https://visitdartmoor.co.uk/driving-dartmoor-what-the-moor-asks-of-you-that-other-roads-do-not/",
   "https://www.mslmagazine.co.uk/?p=234275"
  ],
  "confidence": "high"
 },
 {
  "id": "sws-b3357-dartmeet",
  "kind": "drive",
  "name": "B3357 Tavistock to Ashburton via Dartmeet",
  "area": "South West",
  "description": "West to east across Dartmoor via Merrivale and Two Bridges, down the steep hill to Dartmeet, then Poundsgate and Holne Bridge to Ashburton.",
  "warnings": "Dartmoor 40 mph limit; free-roaming livestock and cattle grids. The Dartmeet hill and the road on to Poundsgate are narrow with tight bends – very slow in summer, and Dartmeet car parks fill up.",
  "at": {
   "lat": 50.5489,
   "lng": -4.1431
  },
  "path": [
   {
    "lat": 50.5489,
    "lng": -4.1431
   },
   {
    "lat": 50.5526,
    "lng": -4.1236
   },
   {
    "lat": 50.5521,
    "lng": -4.1009
   },
   {
    "lat": 50.559,
    "lng": -4.0817
   },
   {
    "lat": 50.5566,
    "lng": -4.0599
   },
   {
    "lat": 50.557,
    "lng": -4.0396
   },
   {
    "lat": 50.5568,
    "lng": -4.0174
   },
   {
    "lat": 50.5574,
    "lng": -3.9948
   },
   {
    "lat": 50.5583,
    "lng": -3.9723
   },
   {
    "lat": 50.5563,
    "lng": -3.9509
   },
   {
    "lat": 50.5574,
    "lng": -3.9288
   },
   {
    "lat": 50.5534,
    "lng": -3.9078
   },
   {
    "lat": 50.5456,
    "lng": -3.889
   },
   {
    "lat": 50.5446,
    "lng": -3.8697
   },
   {
    "lat": 50.5449,
    "lng": -3.8498
   },
   {
    "lat": 50.5392,
    "lng": -3.8305
   },
   {
    "lat": 50.527,
    "lng": -3.8238
   },
   {
    "lat": 50.5228,
    "lng": -3.8101
   },
   {
    "lat": 50.5216,
    "lng": -3.7903
   },
   {
    "lat": 50.5131,
    "lng": -3.7735
   },
   {
    "lat": 50.5118,
    "lng": -3.7549
   },
   {
    "lat": 50.5161,
    "lng": -3.7559
   }
  ],
  "miles": 20.5,
  "start": "Tavistock",
  "end": "Ashburton",
  "sources": [
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/south-west-england/ride/tavistock-to-mortonhampstead",
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/south-west-england/ride/roborough-two-bridges-ponsworthy-pear-tree-dartmoor-treat"
  ],
  "confidence": "medium"
 },
 {
  "id": "sws-a39-exmoor",
  "kind": "drive",
  "name": "A39 Exmoor coast: Porlock and Countisbury hills",
  "area": "South West",
  "description": "Out of Minehead to Porlock, up Porlock Hill onto the open moor past County Gate, then down Countisbury Hill into Lynmouth.",
  "warnings": "Porlock Hill is about 1 in 4 (25%) with two hairpins – use a low gear down; caravans and long vehicles struggle (the Porlock Scenic Toll Road is the gentler, paid alternative). Countisbury Hill is also very steep. Sheep and Exmoor ponies on the open moor; summer caravans and coaches; fog on the tops.",
  "at": {
   "lat": 51.201,
   "lng": -3.48
  },
  "path": [
   {
    "lat": 51.201,
    "lng": -3.48
   },
   {
    "lat": 51.2008,
    "lng": -3.4996
   },
   {
    "lat": 51.2024,
    "lng": -3.5225
   },
   {
    "lat": 51.2012,
    "lng": -3.5452
   },
   {
    "lat": 51.208,
    "lng": -3.5651
   },
   {
    "lat": 51.2082,
    "lng": -3.5842
   },
   {
    "lat": 51.2066,
    "lng": -3.6021
   },
   {
    "lat": 51.2026,
    "lng": -3.6194
   },
   {
    "lat": 51.2043,
    "lng": -3.642
   },
   {
    "lat": 51.2047,
    "lng": -3.664
   },
   {
    "lat": 51.2128,
    "lng": -3.6818
   },
   {
    "lat": 51.217,
    "lng": -3.7037
   },
   {
    "lat": 51.2217,
    "lng": -3.7247
   },
   {
    "lat": 51.2259,
    "lng": -3.7425
   },
   {
    "lat": 51.229,
    "lng": -3.7643
   },
   {
    "lat": 51.2294,
    "lng": -3.7849
   },
   {
    "lat": 51.2303,
    "lng": -3.8057
   },
   {
    "lat": 51.23,
    "lng": -3.829
   }
  ],
  "miles": 17.1,
  "start": "Minehead",
  "end": "Lynmouth",
  "sources": [
   "https://www.rideto.com/blog/RideTo-Best-Rides-A39-Somerset-Devon",
   "https://www.adventurebikerider.com/?p=30456"
  ],
  "confidence": "high"
 },
 {
  "id": "sws-b3306-penwith",
  "kind": "drive",
  "name": "B3306 West Cornwall coast road",
  "area": "South West",
  "description": "Hugs the Penwith coast past Zennor, Morvah, Pendeen and Botallack, with the Atlantic on one side and moorland on the other.",
  "warnings": "Narrow and twisting between granite walls with blind bends; tractors, cyclists and coaches in summer; St Ives streets are very congested; flood damage has closed it near Zennor before.",
  "at": {
   "lat": 50.2059,
   "lng": -5.4898
  },
  "path": [
   {
    "lat": 50.2059,
    "lng": -5.4898
   },
   {
    "lat": 50.2046,
    "lng": -5.5097
   },
   {
    "lat": 50.1979,
    "lng": -5.5275
   },
   {
    "lat": 50.1961,
    "lng": -5.5424
   },
   {
    "lat": 50.1936,
    "lng": -5.562
   },
   {
    "lat": 50.1837,
    "lng": -5.575
   },
   {
    "lat": 50.1818,
    "lng": -5.5917
   },
   {
    "lat": 50.1747,
    "lng": -5.6066
   },
   {
    "lat": 50.1675,
    "lng": -5.6243
   },
   {
    "lat": 50.1597,
    "lng": -5.6315
   },
   {
    "lat": 50.1549,
    "lng": -5.6436
   },
   {
    "lat": 50.1519,
    "lng": -5.6636
   },
   {
    "lat": 50.1409,
    "lng": -5.6755
   },
   {
    "lat": 50.1328,
    "lng": -5.6842
   },
   {
    "lat": 50.1243,
    "lng": -5.681
   }
  ],
  "miles": 13.8,
  "start": "St Ives",
  "end": "St Just",
  "sources": [
   "https://en.wikipedia.org/wiki/B3306_road"
  ],
  "confidence": "high"
 },
 {
  "id": "sws-b3157-jurassic",
  "kind": "drive",
  "name": "B3157 Jurassic Coast road",
  "area": "South West",
  "description": "Burton Bradstock, the climb over Abbotsbury Hill with views along Chesil Beach, then Portesham and Chickerell into Weymouth.",
  "warnings": "Blind crests and crossroads; mostly 50 mph; reviewers report mobile speed cameras and police at weekends; holiday traffic and walkers; morning fog.",
  "at": {
   "lat": 50.7209,
   "lng": -2.7467
  },
  "path": [
   {
    "lat": 50.7209,
    "lng": -2.7467
   },
   {
    "lat": 50.7193,
    "lng": -2.7563
   },
   {
    "lat": 50.7091,
    "lng": -2.7418
   },
   {
    "lat": 50.701,
    "lng": -2.7271
   },
   {
    "lat": 50.6951,
    "lng": -2.7075
   },
   {
    "lat": 50.693,
    "lng": -2.6849
   },
   {
    "lat": 50.6873,
    "lng": -2.6659
   },
   {
    "lat": 50.6801,
    "lng": -2.6467
   },
   {
    "lat": 50.6739,
    "lng": -2.6264
   },
   {
    "lat": 50.6658,
    "lng": -2.6094
   },
   {
    "lat": 50.6641,
    "lng": -2.5879
   },
   {
    "lat": 50.6674,
    "lng": -2.569
   },
   {
    "lat": 50.6629,
    "lng": -2.5511
   },
   {
    "lat": 50.6512,
    "lng": -2.5382
   },
   {
    "lat": 50.6377,
    "lng": -2.5307
   },
   {
    "lat": 50.6278,
    "lng": -2.5144
   },
   {
    "lat": 50.6172,
    "lng": -2.5011
   },
   {
    "lat": 50.6187,
    "lng": -2.4822
   },
   {
    "lat": 50.6228,
    "lng": -2.4698
   }
  ],
  "miles": 17.8,
  "start": "Bridport",
  "end": "Weymouth",
  "sources": [
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/south-west-england/ride/b3157-bridport-weymouth",
   "https://wdlh.co.uk/things-to-do/the-jurassic-coast-road/"
  ],
  "confidence": "high"
 },
 {
  "id": "sws-b3081-zigzag",
  "kind": "drive",
  "name": "B3081 Zig Zag Hill and Cranborne Chase",
  "area": "South West",
  "description": "Climbs out of Shaftesbury up the hairpins of Zig Zag Hill, crosses Cranborne Chase via Tollard Royal and Sixpenny Handley, then Verwood to the A31 near Ringwood.",
  "warnings": "Zig Zag Hill hairpins are steep, narrow and greasy with leaves, and downhill traffic drifts across; gravel at the top; Tollard Royal is slow; police reported on the Sixpenny Handley–Cranborne straight; horses and farm traffic. Dorset Council closes the hill for resurfacing at times.",
  "at": {
   "lat": 51.0045,
   "lng": -2.188
  },
  "path": [
   {
    "lat": 51.0045,
    "lng": -2.188
   },
   {
    "lat": 50.9948,
    "lng": -2.1743
   },
   {
    "lat": 50.9864,
    "lng": -2.159
   },
   {
    "lat": 50.9856,
    "lng": -2.1433
   },
   {
    "lat": 50.9811,
    "lng": -2.1231
   },
   {
    "lat": 50.9685,
    "lng": -2.1197
   },
   {
    "lat": 50.9611,
    "lng": -2.104
   },
   {
    "lat": 50.9595,
    "lng": -2.0824
   },
   {
    "lat": 50.9508,
    "lng": -2.0669
   },
   {
    "lat": 50.9549,
    "lng": -2.0472
   },
   {
    "lat": 50.9561,
    "lng": -2.0249
   },
   {
    "lat": 50.9518,
    "lng": -2.0044
   },
   {
    "lat": 50.9488,
    "lng": -1.9852
   },
   {
    "lat": 50.94,
    "lng": -1.97
   },
   {
    "lat": 50.9295,
    "lng": -1.9543
   },
   {
    "lat": 50.9173,
    "lng": -1.9434
   },
   {
    "lat": 50.9083,
    "lng": -1.9361
   },
   {
    "lat": 50.8972,
    "lng": -1.9358
   },
   {
    "lat": 50.8893,
    "lng": -1.9198
   },
   {
    "lat": 50.8845,
    "lng": -1.8993
   },
   {
    "lat": 50.8814,
    "lng": -1.8777
   },
   {
    "lat": 50.8752,
    "lng": -1.8576
   },
   {
    "lat": 50.866,
    "lng": -1.8402
   },
   {
    "lat": 50.8558,
    "lng": -1.824
   },
   {
    "lat": 50.8456,
    "lng": -1.8083
   },
   {
    "lat": 50.8441,
    "lng": -1.8055
   }
  ],
  "miles": 24.2,
  "start": "Shaftesbury",
  "end": "St Leonards (Ringwood)",
  "sources": [
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/south-west-england/ride/b3081-shaftesbury-ringwood",
   "https://www.total911.com/great-roads-zig-zag-hill-dorset-uk/"
  ],
  "confidence": "high"
 },
 {
  "id": "sws-a32-meon",
  "kind": "drive",
  "name": "A32 Meon Valley",
  "area": "South of England",
  "description": "Fast A-road north through the Meon Valley in the South Downs: Droxford, Exton, West Meon (Loomies café) and on towards Alton.",
  "warnings": "Popular with bikers, so police patrol at weekends; Warnford Parish Council asks residents to report noisy bikes; 30/40 mph through Droxford, Warnford and West Meon; farm traffic.",
  "at": {
   "lat": 50.922,
   "lng": -1.1619
  },
  "path": [
   {
    "lat": 50.922,
    "lng": -1.1619
   },
   {
    "lat": 50.9317,
    "lng": -1.1462
   },
   {
    "lat": 50.945,
    "lng": -1.1414
   },
   {
    "lat": 50.9593,
    "lng": -1.1387
   },
   {
    "lat": 50.9721,
    "lng": -1.1315
   },
   {
    "lat": 50.9839,
    "lng": -1.1247
   },
   {
    "lat": 50.9975,
    "lng": -1.1181
   },
   {
    "lat": 51.007,
    "lng": -1.1051
   },
   {
    "lat": 51.0132,
    "lng": -1.0862
   },
   {
    "lat": 51.0262,
    "lng": -1.0768
   },
   {
    "lat": 51.0393,
    "lng": -1.0681
   },
   {
    "lat": 51.0481,
    "lng": -1.0503
   },
   {
    "lat": 51.0583,
    "lng": -1.0342
   },
   {
    "lat": 51.069,
    "lng": -1.0189
   },
   {
    "lat": 51.0798,
    "lng": -1.0042
   },
   {
    "lat": 51.093,
    "lng": -0.997
   },
   {
    "lat": 51.1071,
    "lng": -0.9938
   },
   {
    "lat": 51.1212,
    "lng": -0.9942
   },
   {
    "lat": 51.1323,
    "lng": -0.9932
   },
   {
    "lat": 51.1286,
    "lng": -0.99
   }
  ],
  "miles": 18.5,
  "start": "Wickham",
  "end": "Alton (Chawton)",
  "sources": [
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/south-east-england/ride/a32-fareham-chawton",
   "https://warnfordparish.gov.uk/community/warnford-village-7802/motorbike-noise-problem"
  ],
  "confidence": "high"
 },
 {
  "id": "sws-a272-downs",
  "kind": "drive",
  "name": "A272 Winchester to Petworth",
  "area": "South of England",
  "description": "Over the downs past Cheesefoot Head and West Meon Hut to Petersfield, then on through Rogate and Midhurst to Petworth.",
  "warnings": "Frequent police patrols, especially weekends and Wednesday evenings; 40 mph limits; loose stones at the West Meon Hut crossroads; town traffic in Petersfield and Midhurst; narrow streets in Petworth.",
  "at": {
   "lat": 51.0558,
   "lng": -1.2588
  },
  "path": [
   {
    "lat": 51.0558,
    "lng": -1.2588
   },
   {
    "lat": 51.0454,
    "lng": -1.2449
   },
   {
    "lat": 51.04,
    "lng": -1.2241
   },
   {
    "lat": 51.0388,
    "lng": -1.2034
   },
   {
    "lat": 51.0421,
    "lng": -1.1812
   },
   {
    "lat": 51.0469,
    "lng": -1.1606
   },
   {
    "lat": 51.0502,
    "lng": -1.1384
   },
   {
    "lat": 51.0451,
    "lng": -1.1175
   },
   {
    "lat": 51.038,
    "lng": -1.0979
   },
   {
    "lat": 51.031,
    "lng": -1.0787
   },
   {
    "lat": 51.0306,
    "lng": -1.0559
   },
   {
    "lat": 51.0309,
    "lng": -1.0341
   },
   {
    "lat": 51.0197,
    "lng": -1.0215
   },
   {
    "lat": 51.013,
    "lng": -1.0033
   },
   {
    "lat": 51.0093,
    "lng": -0.9845
   },
   {
    "lat": 51.008,
    "lng": -0.9622
   },
   {
    "lat": 51.0071,
    "lng": -0.941
   },
   {
    "lat": 51.0097,
    "lng": -0.9283
   },
   {
    "lat": 51.0149,
    "lng": -0.9098
   },
   {
    "lat": 51.0078,
    "lng": -0.8914
   },
   {
    "lat": 51.0067,
    "lng": -0.8691
   },
   {
    "lat": 51.0082,
    "lng": -0.848
   },
   {
    "lat": 51.003,
    "lng": -0.8286
   },
   {
    "lat": 50.9961,
    "lng": -0.8113
   },
   {
    "lat": 50.9937,
    "lng": -0.7904
   },
   {
    "lat": 50.9888,
    "lng": -0.7693
   },
   {
    "lat": 50.9878,
    "lng": -0.7466
   },
   {
    "lat": 50.9911,
    "lng": -0.7343
   },
   {
    "lat": 50.9921,
    "lng": -0.7169
   },
   {
    "lat": 50.9894,
    "lng": -0.6957
   },
   {
    "lat": 50.9895,
    "lng": -0.6738
   },
   {
    "lat": 50.987,
    "lng": -0.6516
   },
   {
    "lat": 50.988,
    "lng": -0.629
   },
   {
    "lat": 50.9868,
    "lng": -0.611
   }
  ],
  "miles": 33.1,
  "start": "Winchester (Cheesefoot Head)",
  "end": "Petworth",
  "sources": [
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/south-east-england/ride/a272-winchester-petersfield",
   "https://www.pistonheads.com/news/ph-mydreamdrive/chasing-the-sun-my-dream-drive/31926"
  ],
  "confidence": "high"
 },
 {
  "id": "sws-new-forest",
  "kind": "drive",
  "name": "New Forest: Rhinefield and Bolderwood",
  "area": "South of England",
  "description": "Rhinefield Road and the Rhinefield Ornamental Drive under giant redwoods and Douglas firs, a short A35 link, then Bolderwood Road across the open forest to Bolderwood.",
  "warnings": "40 mph limit across the unfenced forest – ponies, donkeys, cattle and deer roam and are killed on the roads every year; cattle grids; narrow drives busy with cyclists and walkers in summer; never park on verges – use the Forestry England car parks.",
  "at": {
   "lat": 50.8192,
   "lng": -1.5771
  },
  "path": [
   {
    "lat": 50.8192,
    "lng": -1.5771
   },
   {
    "lat": 50.8226,
    "lng": -1.5961
   },
   {
    "lat": 50.8241,
    "lng": -1.6171
   },
   {
    "lat": 50.8362,
    "lng": -1.6242
   },
   {
    "lat": 50.8497,
    "lng": -1.6226
   },
   {
    "lat": 50.858,
    "lng": -1.6102
   },
   {
    "lat": 50.8667,
    "lng": -1.5928
   },
   {
    "lat": 50.8731,
    "lng": -1.5992
   },
   {
    "lat": 50.8691,
    "lng": -1.6209
   },
   {
    "lat": 50.8691,
    "lng": -1.6434
   },
   {
    "lat": 50.8787,
    "lng": -1.6584
   },
   {
    "lat": 50.8767,
    "lng": -1.6564
   }
  ],
  "miles": 10.2,
  "start": "Brockenhurst",
  "end": "Bolderwood",
  "sources": [
   "https://www.forestryengland.uk/bolderwood",
   "https://en.wikipedia.org/wiki/Bolderwood,_Hampshire"
  ],
  "confidence": "medium"
 },
 {
  "id": "sws-b4632-cleeve",
  "kind": "drive",
  "name": "B4632 Broadway to Cheltenham over Cleeve Hill",
  "area": "South West",
  "description": "Along the foot of the Cotswold edge to Winchcombe, then up over Cleeve Hill – the highest point of the Cotswolds – and down into Cheltenham.",
  "warnings": "Winchcombe high street is narrow; Cleeve Hill has steep, tight bends and a common with walkers and livestock; Prescott Hill Climb is just off this road – event-day traffic; Cheltenham town traffic at the end.",
  "at": {
   "lat": 52.0361,
   "lng": -1.86
  },
  "path": [
   {
    "lat": 52.0361,
    "lng": -1.86
   },
   {
    "lat": 52.0339,
    "lng": -1.8801
   },
   {
    "lat": 52.0237,
    "lng": -1.8954
   },
   {
    "lat": 52.0125,
    "lng": -1.9097
   },
   {
    "lat": 52.002,
    "lng": -1.9247
   },
   {
    "lat": 51.9887,
    "lng": -1.9319
   },
   {
    "lat": 51.9754,
    "lng": -1.9391
   },
   {
    "lat": 51.9662,
    "lng": -1.9555
   },
   {
    "lat": 51.9544,
    "lng": -1.965
   },
   {
    "lat": 51.9467,
    "lng": -1.9813
   },
   {
    "lat": 51.949,
    "lng": -2.0025
   },
   {
    "lat": 51.9421,
    "lng": -2.0215
   },
   {
    "lat": 51.9332,
    "lng": -2.0386
   },
   {
    "lat": 51.919,
    "lng": -2.0396
   },
   {
    "lat": 51.9114,
    "lng": -2.0527
   },
   {
    "lat": 51.9092,
    "lng": -2.0642
   }
  ],
  "miles": 14.9,
  "start": "Broadway",
  "end": "Cheltenham",
  "sources": [
   "https://www.pressreader.com/uk/bike-uk/20180201/281728384882108",
   "https://www.gloucestershire.gov.uk/media/s1ojnglr/snowshill-cycle-map.pdf"
  ],
  "confidence": "medium"
 },
 {
  "id": "sws-b4077-stanway",
  "kind": "drive",
  "name": "B4077 Stow to Toddington (Stanway Hill)",
  "area": "South West",
  "description": "West from Stow across the high wolds past Ford, then down the long Stanway Hill towards Toddington.",
  "warnings": "Stanway Hill is steep with a sharp bend at the bottom and HGVs; racehorses ridden near Ford; mud from farms.",
  "at": {
   "lat": 51.93,
   "lng": -1.7248
  },
  "path": [
   {
    "lat": 51.93,
    "lng": -1.7248
   },
   {
    "lat": 51.9436,
    "lng": -1.7305
   },
   {
    "lat": 51.9493,
    "lng": -1.7494
   },
   {
    "lat": 51.95,
    "lng": -1.7724
   },
   {
    "lat": 51.9492,
    "lng": -1.7935
   },
   {
    "lat": 51.9542,
    "lng": -1.8153
   },
   {
    "lat": 51.9563,
    "lng": -1.8385
   },
   {
    "lat": 51.9594,
    "lng": -1.8611
   },
   {
    "lat": 51.9646,
    "lng": -1.8808
   },
   {
    "lat": 51.9764,
    "lng": -1.8928
   },
   {
    "lat": 51.9869,
    "lng": -1.9042
   },
   {
    "lat": 51.99,
    "lng": -1.9267
   },
   {
    "lat": 51.9906,
    "lng": -1.9497
   }
  ],
  "miles": 12.0,
  "start": "Stow-on-the-Wold",
  "end": "Toddington",
  "sources": [
   "https://www.pressreader.com/uk/bike-uk/20180201/281728384882108",
   "https://www.gloucestershire.gov.uk/media/s1ojnglr/snowshill-cycle-map.pdf"
  ],
  "confidence": "medium"
 },
 {
  "id": "sws-lambourn-loop",
  "kind": "drive",
  "name": "Lambourn Loop (Berkshire Downs)",
  "area": "South of England",
  "description": "Up the A338 to Wantage, west on the B4507, south over the downs on the B4001 to Lambourn, and back on the Newbury road.",
  "warnings": "A338 is 50 mph with a sharp left-hander at the bottom of a crest halfway along; racehorses ridden on and crossing the roads around Lambourn; broken, uneven surfaces on the B4001; the Lambourn–Shefford road is busier.",
  "at": {
   "lat": 51.4745,
   "lng": -1.4492
  },
  "path": [
   {
    "lat": 51.4745,
    "lng": -1.4492
   },
   {
    "lat": 51.4854,
    "lng": -1.4376
   },
   {
    "lat": 51.4985,
    "lng": -1.429
   },
   {
    "lat": 51.5125,
    "lng": -1.4251
   },
   {
    "lat": 51.5258,
    "lng": -1.4224
   },
   {
    "lat": 51.5397,
    "lng": -1.4245
   },
   {
    "lat": 51.5536,
    "lng": -1.431
   },
   {
    "lat": 51.5673,
    "lng": -1.4285
   },
   {
    "lat": 51.5815,
    "lng": -1.428
   },
   {
    "lat": 51.5865,
    "lng": -1.4408
   },
   {
    "lat": 51.5838,
    "lng": -1.4636
   },
   {
    "lat": 51.5778,
    "lng": -1.4808
   },
   {
    "lat": 51.5681,
    "lng": -1.4935
   },
   {
    "lat": 51.5587,
    "lng": -1.5095
   },
   {
    "lat": 51.5453,
    "lng": -1.5183
   },
   {
    "lat": 51.5311,
    "lng": -1.5227
   },
   {
    "lat": 51.5168,
    "lng": -1.523
   },
   {
    "lat": 51.504,
    "lng": -1.5219
   },
   {
    "lat": 51.4948,
    "lng": -1.5052
   },
   {
    "lat": 51.4893,
    "lng": -1.4857
   },
   {
    "lat": 51.4803,
    "lng": -1.4694
   },
   {
    "lat": 51.4745,
    "lng": -1.4492
   }
  ],
  "miles": 21.0,
  "start": "Great Shefford",
  "end": "Great Shefford",
  "sources": [
   "https://www.pistonheads.com/news/ph-mydreamdrive/my-dream-drive-lambourn-loop/29221"
  ],
  "confidence": "high"
 },
 {
  "id": "sws-b2110-turners-hill",
  "kind": "drive",
  "name": "Turner's Hill Road (B2110)",
  "area": "South of England",
  "description": "Through Turner's Hill and past Worth Abbey, then High Beeches Lane through woodland to Handcross and on to the A281.",
  "warnings": "Woodland sections twist and are often damp; Handcross village; the A281 is busy. Mid Sussex car-cruising PSPO covers the Birches Industrial Estate in East Grinstead near the start.",
  "at": {
   "lat": 51.124,
   "lng": -0.011
  },
  "path": [
   {
    "lat": 51.124,
    "lng": -0.011
   },
   {
    "lat": 51.117,
    "lng": -0.0285
   },
   {
    "lat": 51.1072,
    "lng": -0.0445
   },
   {
    "lat": 51.1075,
    "lng": -0.0637
   },
   {
    "lat": 51.1034,
    "lng": -0.0856
   },
   {
    "lat": 51.0985,
    "lng": -0.1067
   },
   {
    "lat": 51.0926,
    "lng": -0.1269
   },
   {
    "lat": 51.0815,
    "lng": -0.1374
   },
   {
    "lat": 51.074,
    "lng": -0.1567
   },
   {
    "lat": 51.064,
    "lng": -0.172
   },
   {
    "lat": 51.06,
    "lng": -0.1936
   },
   {
    "lat": 51.0511,
    "lng": -0.2096
   },
   {
    "lat": 51.0446,
    "lng": -0.2299
   },
   {
    "lat": 51.0369,
    "lng": -0.2491
   },
   {
    "lat": 51.0331,
    "lng": -0.2625
   }
  ],
  "miles": 13.7,
  "start": "East Grinstead",
  "end": "Lower Beeding (A281)",
  "sources": [
   "https://www.pistonheads.com/news/ph-mydreamdrive/turners-hill-road-b2110-my-dream-drive/30110"
  ],
  "confidence": "high"
 },
 {
  "id": "sws-beachy-head",
  "kind": "drive",
  "name": "Beachy Head Road",
  "area": "South of England",
  "description": "Up from Eastbourne to Beachy Head, then along the clifftop road to Birling Gap and down to East Dean.",
  "warnings": "Bumpy, potholed surface reported towards Birling Gap; strong crosswinds; walkers crossing to the cliffs; busy at weekends. Park only in the marked car parks.",
  "at": {
   "lat": 50.759,
   "lng": 0.269
  },
  "path": [
   {
    "lat": 50.759,
    "lng": 0.269
   },
   {
    "lat": 50.7536,
    "lng": 0.2537
   },
   {
    "lat": 50.7399,
    "lng": 0.252
   },
   {
    "lat": 50.7393,
    "lng": 0.2333
   },
   {
    "lat": 50.7407,
    "lng": 0.2135
   },
   {
    "lat": 50.7467,
    "lng": 0.2055
   },
   {
    "lat": 50.7576,
    "lng": 0.2075
   }
  ],
  "miles": 5.9,
  "start": "Eastbourne (Meads)",
  "end": "East Dean",
  "sources": [
   "https://www.pistonheads.com/news/ph-mydreamdrive/beachy-head-my-dream-drive/31178",
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/south-east-england/ride/beachy-head-birling-gap"
  ],
  "confidence": "high"
 },
 {
  "id": "sws-a285-duncton",
  "kind": "drive",
  "name": "A285 Petworth to Chichester (Duncton Hill)",
  "area": "South of England",
  "description": "South from Petworth through Duncton, up the wooded climb of Duncton Hill onto the South Downs, then past Upwaltham and Halnaker to Chichester.",
  "warnings": "Bumpy surfaces in parts; Duncton Hill is steep with tight bends under trees, slippery when wet; Goodwood event days bring heavy traffic near Halnaker; ends on the busy A27.",
  "at": {
   "lat": 50.9861,
   "lng": -0.609
  },
  "path": [
   {
    "lat": 50.9861,
    "lng": -0.609
   },
   {
    "lat": 50.9735,
    "lng": -0.6138
   },
   {
    "lat": 50.9613,
    "lng": -0.6242
   },
   {
    "lat": 50.9482,
    "lng": -0.6332
   },
   {
    "lat": 50.9376,
    "lng": -0.6361
   },
   {
    "lat": 50.9269,
    "lng": -0.6419
   },
   {
    "lat": 50.9167,
    "lng": -0.6575
   },
   {
    "lat": 50.9043,
    "lng": -0.6653
   },
   {
    "lat": 50.8907,
    "lng": -0.6712
   },
   {
    "lat": 50.8786,
    "lng": -0.6823
   },
   {
    "lat": 50.8705,
    "lng": -0.6995
   },
   {
    "lat": 50.8622,
    "lng": -0.7182
   },
   {
    "lat": 50.8522,
    "lng": -0.7305
   },
   {
    "lat": 50.8439,
    "lng": -0.7487
   },
   {
    "lat": 50.8422,
    "lng": -0.7553
   }
  ],
  "miles": 13.4,
  "start": "Petworth",
  "end": "Chichester",
  "sources": [
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/south-east-england/tour/uk-surrey-west-sussex-loop"
  ],
  "confidence": "high"
 },
 {
  "id": "sws-surrey-hills",
  "kind": "drive",
  "name": "Surrey Hills lanes: Cranleigh to Newlands Corner",
  "area": "South of England",
  "description": "The B2127 to Ewhurst, then narrow lanes over Pitch Hill and through Peaslake to Shere, finishing on the A25 at Newlands Corner.",
  "warnings": "Narrow, sunken lanes full of cyclists and walkers at weekends; Shere and Peaslake are slow villages; Newlands Corner car park is camera-enforced pay parking and police treat it (with Box Hill) as an anti-social driving hotspot – don't gather there.",
  "at": {
   "lat": 51.1409,
   "lng": -0.4881
  },
  "path": [
   {
    "lat": 51.1409,
    "lng": -0.4881
   },
   {
    "lat": 51.1458,
    "lng": -0.4682
   },
   {
    "lat": 51.1473,
    "lng": -0.4465
   },
   {
    "lat": 51.1578,
    "lng": -0.444
   },
   {
    "lat": 51.1713,
    "lng": -0.4452
   },
   {
    "lat": 51.1842,
    "lng": -0.4436
   },
   {
    "lat": 51.1977,
    "lng": -0.4433
   },
   {
    "lat": 51.2081,
    "lng": -0.4517
   },
   {
    "lat": 51.2171,
    "lng": -0.4655
   },
   {
    "lat": 51.2244,
    "lng": -0.4792
   },
   {
    "lat": 51.2312,
    "lng": -0.4988
   },
   {
    "lat": 51.2328,
    "lng": -0.5068
   }
  ],
  "miles": 10.4,
  "start": "Cranleigh",
  "end": "Newlands Corner",
  "sources": [
   "https://www.pistonheads.com/news/ph-mydreamdrive/chasing-the-sun-my-dream-drive/31926"
  ],
  "confidence": "medium"
 },
 {
  "id": "sws-p-bedruthan",
  "kind": "photo",
  "name": "Bedruthan Steps (Carnewas)",
  "area": "South West",
  "description": "Clifftop car park above the rock stacks of Bedruthan beach on the north Cornish coast. One of Cornwall's best-known coastal views.",
  "warnings": "Pay car park; cliff edges unfenced; busy in summer.",
  "at": {
   "lat": 50.4853,
   "lng": -5.0327
  },
  "sources": [
   "https://www.nationaltrust.org.uk/visit/cornwall/carnewas-and-bedruthan-steps",
   "OpenStreetMap (ODbL)"
  ],
  "confidence": "high"
 },
 {
  "id": "sws-p-botallack",
  "kind": "photo",
  "name": "Botallack mine engine houses",
  "area": "South West",
  "description": "National Trust car park by the Count House above the clifftop mine engine houses, just off the B3306. Famous Crown Mines backdrop at the end of the Penwith coast road.",
  "warnings": "NT car park charges; narrow lane from the B3306; don't drive on the mine tracks.",
  "at": {
   "lat": 50.1408,
   "lng": -5.6891
  },
  "sources": [
   "https://www.nationaltrust.org.uk/visit/cornwall/botallack",
   "OpenStreetMap (ODbL)"
  ],
  "confidence": "high"
 },
 {
  "id": "sws-p-lizard-point",
  "kind": "photo",
  "name": "Lizard Point",
  "area": "South West",
  "description": "Car park at the most southerly point of mainland Britain, by the lighthouse and cafés. Unique \"most southerly\" landmark.",
  "warnings": "Narrow road through Lizard village; small car parks fill in summer.",
  "at": {
   "lat": 49.9594,
   "lng": -5.2064
  },
  "sources": [
   "https://www.nationaltrust.org.uk/visit/cornwall/the-lizard-and-kynance-cove",
   "OpenStreetMap (ODbL)"
  ],
  "confidence": "high"
 },
 {
  "id": "sws-p-burrator",
  "kind": "photo",
  "name": "Burrator Reservoir",
  "area": "South West",
  "description": "Free roadside parking areas by the dam, with Sheeps Tor behind the water. Classic Dartmoor reservoir view near Yelverton (start of the B3212 drive).",
  "warnings": "Narrow lanes; park only in the marked areas; ponies and sheep.",
  "at": {
   "lat": 50.4942,
   "lng": -4.0447
  },
  "sources": [
   "https://www.dartmoor.gov.uk/",
   "OpenStreetMap (ODbL)"
  ],
  "confidence": "high"
 },
 {
  "id": "sws-p-dartmeet",
  "kind": "photo",
  "name": "Dartmeet",
  "area": "South West",
  "description": "Free car park where the East and West Dart rivers meet, beside the old clapper bridge. On the B3357 drive; river and moorland backdrop.",
  "warnings": "Steep, narrow hill either side; very busy summer weekends; free-roaming livestock.",
  "at": {
   "lat": 50.5443,
   "lng": -3.875
  },
  "sources": [
   "https://en.wikipedia.org/wiki/Dartmeet",
   "OpenStreetMap (ODbL)"
  ],
  "confidence": "high"
 },
 {
  "id": "sws-p-valley-of-rocks",
  "kind": "photo",
  "name": "Valley of Rocks, Lynton",
  "area": "South West",
  "description": "Pay-and-display car park in the dry valley of rock towers west of Lynton, with feral goats. Dramatic Exmoor coastal scenery near the end of the A39 drive.",
  "warnings": "Narrow road with a toll section beyond; goats on the road.",
  "at": {
   "lat": 51.2325,
   "lng": -3.8518
  },
  "sources": [
   "https://en.wikipedia.org/wiki/Valley_of_Rocks",
   "OpenStreetMap (ODbL)"
  ],
  "confidence": "high"
 },
 {
  "id": "sws-p-county-gate",
  "kind": "photo",
  "name": "County Gate, Exmoor",
  "area": "South West",
  "description": "Car park on the A39 at the Devon–Somerset border, looking over the East Lyn valley and the sea. Natural stop on the A39 Exmoor coast drive.",
  "warnings": "Turn in carefully from the A39; exposed and foggy in poor weather.",
  "at": {
   "lat": 51.2241,
   "lng": -3.7296
  },
  "sources": [
   "https://www.exmoor-nationalpark.gov.uk/",
   "OpenStreetMap (ODbL)"
  ],
  "confidence": "high"
 },
 {
  "id": "sws-p-dunkery",
  "kind": "photo",
  "name": "Dunkery Beacon",
  "area": "South West",
  "description": "Moorland car park below Exmoor's highest point. Big views over Exmoor towards the Bristol Channel.",
  "warnings": "Unfenced moor roads, sheep and ponies; single-track sections. Car park position is an unnamed OSM car park south of the summit.",
  "at": {
   "lat": 51.1541,
   "lng": -3.5803
  },
  "sources": [
   "https://en.wikipedia.org/wiki/Dunkery_Beacon",
   "OpenStreetMap (ODbL)"
  ],
  "confidence": "medium"
 },
 {
  "id": "sws-p-portland-bill",
  "kind": "photo",
  "name": "Portland Bill",
  "area": "South West",
  "description": "Pay car park by the red-and-white lighthouse at the southern tip of Portland. Lighthouse and rough-sea backdrop.",
  "warnings": "Pay parking; very windy; busy summer weekends.",
  "at": {
   "lat": 50.5156,
   "lng": -2.4565
  },
  "sources": [
   "https://en.wikipedia.org/wiki/Portland_Bill",
   "OpenStreetMap (ODbL)"
  ],
  "confidence": "high"
 },
 {
  "id": "sws-p-durdle-door",
  "kind": "photo",
  "name": "Durdle Door",
  "area": "South West",
  "description": "Estate pay car park at the top of the path to the limestone arch. One of the most photographed spots on the Jurassic Coast.",
  "warnings": "Private estate car park with fees; very busy in summer; no gatherings.",
  "at": {
   "lat": 50.6241,
   "lng": -2.2693
  },
  "sources": [
   "https://www.lulworth.com/",
   "OpenStreetMap (ODbL)"
  ],
  "confidence": "high"
 },
 {
  "id": "sws-p-corfe",
  "kind": "photo",
  "name": "Corfe Castle",
  "area": "South West",
  "description": "Pay car park on the A351 below the castle ruins. Castle ruin on its hill in the Purbeck gap.",
  "warnings": "A351 is busy and slow in summer; car park charges.",
  "at": {
   "lat": 50.6451,
   "lng": -2.0603
  },
  "sources": [
   "https://www.nationaltrust.org.uk/visit/dorset/corfe-castle",
   "OpenStreetMap (ODbL)"
  ],
  "confidence": "medium"
 },
 {
  "id": "sws-p-abbotsbury-hill",
  "kind": "photo",
  "name": "Abbotsbury Hill viewpoint",
  "area": "South West",
  "description": "Free car park and viewpoint on the B3157 above Abbotsbury, looking along Chesil Beach. On the B3157 Jurassic Coast drive.",
  "warnings": "Pull in slowly – fast road with crests; exposed.",
  "at": {
   "lat": 50.6705,
   "lng": -2.6201
  },
  "sources": [
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/south-west-england/ride/b3157-bridport-weymouth",
   "OpenStreetMap (ODbL)"
  ],
  "confidence": "high"
 },
 {
  "id": "sws-p-westbury-white-horse",
  "kind": "photo",
  "name": "Westbury White Horse",
  "area": "South West",
  "description": "Free car park on Bratton Downs by the chalk horse and Iron Age fort. Views over the Vale of Pewsey and the white horse.",
  "warnings": "Single-track lane up; livestock; no gatherings.",
  "at": {
   "lat": 51.2614,
   "lng": -2.1453
  },
  "sources": [
   "https://www.english-heritage.org.uk/visit/places/westbury-white-horse-and-bratton-camp/",
   "OpenStreetMap (ODbL)"
  ],
  "confidence": "high"
 },
 {
  "id": "sws-p-broadway-tower",
  "kind": "photo",
  "name": "Broadway Tower",
  "area": "South West",
  "description": "Car park by the 18th-century folly tower on the Cotswold edge (just over the Worcestershire line). Classic Cotswolds landmark near the start of the B4632 drive.",
  "warnings": "Paid parking for the country park; opening times apply.",
  "at": {
   "lat": 52.0236,
   "lng": -1.8388
  },
  "sources": [
   "https://www.broadwaytower.co.uk/",
   "OpenStreetMap (ODbL)"
  ],
  "confidence": "medium"
 },
 {
  "id": "sws-p-butser",
  "kind": "photo",
  "name": "Butser Hill",
  "area": "South of England",
  "description": "Hampshire County Council pay car park on the top of Butser Hill (Queen Elizabeth Country Park). Highest point of the South Downs, views to the Isle of Wight.",
  "warnings": "Pay parking; gates close in the evening; A3 access is fast.",
  "at": {
   "lat": 50.9759,
   "lng": -0.9862
  },
  "sources": [
   "https://en.wikipedia.org/wiki/Butser_Hill",
   "OpenStreetMap (ODbL)"
  ],
  "confidence": "high"
 },
 {
  "id": "sws-p-bolderwood",
  "kind": "photo",
  "name": "Bolderwood, New Forest",
  "area": "South of England",
  "description": "Forestry England car park at the end of the New Forest drive, with deer viewing platform nearby. Most-visited car park in the New Forest.",
  "warnings": "40 mph forest roads with roaming animals; car park can be very busy.",
  "at": {
   "lat": 50.8768,
   "lng": -1.6564
  },
  "sources": [
   "https://www.forestryengland.uk/bolderwood",
   "OpenStreetMap (ODbL)"
  ],
  "confidence": "high"
 },
 {
  "id": "sws-p-needles",
  "kind": "photo",
  "name": "The Needles (Alum Bay)",
  "area": "South of England",
  "description": "Pay car park at the Needles Landmark Attraction above Alum Bay. Chalk stacks and lighthouse at the western tip of the Isle of Wight.",
  "warnings": "Ferry needed to reach the island; pay parking; busy in summer.",
  "at": {
   "lat": 50.6672,
   "lng": -1.567
  },
  "sources": [
   "https://www.theneedles.co.uk/",
   "OpenStreetMap (ODbL)"
  ],
  "confidence": "high"
 },
 {
  "id": "sws-p-walbury-hill",
  "kind": "photo",
  "name": "Walbury Hill and Combe Gibbet",
  "area": "South of England",
  "description": "Free car park on the ridge road beside Walbury Hill, the highest chalk hill in south-east England. Big downland views; Combe Gibbet along the ridge.",
  "warnings": "Narrow, steep lanes up; livestock; exposed in bad weather.",
  "at": {
   "lat": 51.3521,
   "lng": -1.4558
  },
  "sources": [
   "https://en.wikipedia.org/wiki/Walbury_Hill",
   "OpenStreetMap (ODbL)"
  ],
  "confidence": "high"
 },
 {
  "id": "sws-p-uffington",
  "kind": "photo",
  "name": "Uffington White Horse",
  "area": "South of England",
  "description": "National Trust pay car park below White Horse Hill. Bronze Age chalk horse and Dragon Hill; near the Lambourn Loop.",
  "warnings": "NT car park charges; narrow lane; no gatherings.",
  "at": {
   "lat": 51.5773,
   "lng": -1.5784
  },
  "sources": [
   "https://www.nationaltrust.org.uk/visit/oxfordshire/white-horse-hill",
   "OpenStreetMap (ODbL)"
  ],
  "confidence": "high"
 },
 {
  "id": "sws-p-devils-punch-bowl",
  "kind": "photo",
  "name": "Devil's Punch Bowl, Hindhead",
  "area": "South of England",
  "description": "National Trust car park and café beside the old A3 route above the Punch Bowl. Classic Surrey Hills viewpoint.",
  "warnings": "NT car park charges; busy at weekends.",
  "at": {
   "lat": 51.1142,
   "lng": -0.7288
  },
  "sources": [
   "https://www.nationaltrust.org.uk/visit/surrey/hindhead-commons-and-the-devils-punch-bowl",
   "OpenStreetMap (ODbL)"
  ],
  "confidence": "high"
 },
 {
  "id": "sws-p-devils-dyke",
  "kind": "photo",
  "name": "Devil's Dyke",
  "area": "South of England",
  "description": "National Trust car park at the top of the dry valley north of Brighton. Panoramic South Downs view.",
  "warnings": "NT car park charges; busy at weekends; Brighton side roads are residential.",
  "at": {
   "lat": 50.8856,
   "lng": -0.2119
  },
  "sources": [
   "https://www.nationaltrust.org.uk/visit/sussex/devils-dyke",
   "OpenStreetMap (ODbL)"
  ],
  "confidence": "high"
 },
 {
  "id": "sws-p-ditchling-beacon",
  "kind": "photo",
  "name": "Ditchling Beacon",
  "area": "South of England",
  "description": "National Trust car park on the summit of Ditchling Beacon. One of the highest points on the South Downs.",
  "warnings": "Ditchling Road up the hill is narrow and steep with many cyclists; NT charges.",
  "at": {
   "lat": 50.9009,
   "lng": -0.1051
  },
  "sources": [
   "https://www.nationaltrust.org.uk/visit/sussex/ditchling-beacon",
   "OpenStreetMap (ODbL)"
  ],
  "confidence": "high"
 },
 {
  "id": "sws-p-birling-gap",
  "kind": "photo",
  "name": "Birling Gap and the Seven Sisters",
  "area": "South of England",
  "description": "National Trust car park by the visitor centre, looking along the Seven Sisters cliffs. On the Beachy Head Road drive.",
  "warnings": "NT car park charges; cliff edges eroding – keep back.",
  "at": {
   "lat": 50.743,
   "lng": 0.2016
  },
  "sources": [
   "https://www.nationaltrust.org.uk/visit/sussex/birling-gap-and-the-seven-sisters",
   "OpenStreetMap (ODbL)"
  ],
  "confidence": "high"
 },
 {
  "id": "sws-t-wiscombe",
  "kind": "track",
  "name": "Wiscombe Park Hill Climb",
  "area": "South West",
  "description": "A 1,000-yard hill climb in the grounds of Wiscombe Park near Colyton, running since 1958. Car and bike meetings through the season; British Hillclimb Championship rounds on 26 July 2026; free paddock entry for spectators.",
  "warnings": "Event days only; narrow lanes – sat nav EX24 6JE and use the signed spectator car park route; no dogs in spectator areas; no drones. Position is the estate road, not the start line.",
  "at": {
   "lat": 50.7268,
   "lng": -3.1506
  },
  "sources": [
   "https://www.wiscombepark.co.uk/events",
   "https://en.wikipedia.org/wiki/Wiscombe_Park"
  ],
  "confidence": "medium"
 },
 {
  "id": "sws-t-goodwood-hill",
  "kind": "track",
  "name": "Goodwood Festival of Speed hill",
  "area": "South of England",
  "description": "The 1.16-mile hill climb past Goodwood House used for the Festival of Speed each July (2027: 15–18 July). The best-known hill climb in the world; separate from the Goodwood Motor Circuit already in the app.",
  "warnings": "Event-only and ticketed; not open for driving at other times; very heavy traffic on event days. Position is Goodwood House.",
  "at": {
   "lat": 50.8723,
   "lng": -0.7393
  },
  "sources": [
   "https://www.goodwood.com/motorsport/festival-of-speed/"
  ],
  "confidence": "medium"
 },
 {
  "id": "sws-t-dunsfold",
  "kind": "track",
  "name": "Dunsfold Park (Top Gear test track)",
  "area": "South of England",
  "description": "Former aerodrome near Cranleigh with the Top Gear test track, used for filming and booked track events. Famous test track; the site keeps a track diary for hire.",
  "warnings": "Private site – no public access without a booked event. Wings & Wheels has not run since 2019 and the aerodrome is being redeveloped.",
  "at": {
   "lat": 51.1158,
   "lng": -0.5464
  },
  "sources": [
   "https://www.dunsfoldpark.com/",
   "OpenStreetMap (ODbL)"
  ],
  "confidence": "medium"
 },
 {
  "id": "sws-t-united-downs",
  "kind": "track",
  "name": "United Downs Raceway",
  "area": "South West",
  "description": "Short oval near St Day for stock car and banger racing (promoted by Autospeed), also used by local motor clubs. The main oval in Cornwall; fixtures listed into the winter.",
  "warnings": "Spectator venue; check the fixture list before travelling.",
  "at": {
   "lat": 50.23,
   "lng": -5.1555
  },
  "sources": [
   "https://www.uniteddownsraceway.com/",
   "OpenStreetMap (ODbL)"
  ],
  "confidence": "high"
 },
 {
  "id": "sws-t-smeatharpe",
  "kind": "track",
  "name": "Smeatharpe Stadium",
  "area": "South West",
  "description": "Oval track on the Blackdown Hills near Honiton used for stock car and banger racing. Long-running Devon oval.",
  "warnings": "Spectator venue; check fixtures. Status not confirmed for 2026.",
  "at": {
   "lat": 50.8831,
   "lng": -3.1676
  },
  "sources": [
   "OpenStreetMap (ODbL)"
  ],
  "confidence": "medium"
 },
 {
  "id": "sws-t-clay-pigeon",
  "kind": "track",
  "name": "Clay Pigeon Raceway",
  "area": "South West",
  "description": "Outdoor kart circuit at Wardon Hill on the A37 north of Dorchester. Dorset's main kart track; club racing and arrive-and-drive.",
  "warnings": "Booking required. Status not confirmed for 2026.",
  "at": {
   "lat": 50.8241,
   "lng": -2.5543
  },
  "sources": [
   "OpenStreetMap (ODbL)"
  ],
  "confidence": "medium"
 },
 {
  "id": "sws-t-poole-stadium",
  "kind": "track",
  "name": "Poole Stadium (Poole Pirates)",
  "area": "South West",
  "description": "Speedway track at Poole Stadium, home of the Poole Pirates. Ten-time British speedway champions, racing in the SGB Championship.",
  "warnings": "Spectator venue; check fixtures.",
  "at": {
   "lat": 50.7229,
   "lng": -1.9821
  },
  "sources": [
   "https://en.wikipedia.org/wiki/Poole_Pirates",
   "OpenStreetMap (ODbL)"
  ],
  "confidence": "medium"
 },
 {
  "id": "sws-t-matterley",
  "kind": "track",
  "name": "Matterley Basin",
  "area": "South of England",
  "description": "Natural-bowl motocross circuit near Winchester that has hosted the British round of MXGP. Off-road event venue.",
  "warnings": "Event and practice days only; off-road bikes only.",
  "at": {
   "lat": 51.0481,
   "lng": -1.2309
  },
  "sources": [
   "OpenStreetMap (ODbL)"
  ],
  "confidence": "medium"
 },
 {
  "id": "sws-t-aldershot",
  "kind": "track",
  "name": "Aldershot Raceway",
  "area": "South of England",
  "description": "Oval stock car and banger track at Aldershot. Regular oval meetings (Spedeworth venue).",
  "warnings": "Spectator venue; check fixtures. Status not confirmed for 2026.",
  "at": {
   "lat": 51.2563,
   "lng": -0.7843
  },
  "sources": [
   "OpenStreetMap (ODbL)"
  ],
  "confidence": "medium"
 },
 {
  "id": "sws-t-standlake",
  "kind": "track",
  "name": "Standlake Arena",
  "area": "South of England",
  "description": "Oval track near Witney for stock cars and bangers. Oxfordshire's oval venue.",
  "warnings": "Spectator venue; check fixtures. Status not confirmed for 2026.",
  "at": {
   "lat": 51.7387,
   "lng": -1.4411
  },
  "sources": [
   "OpenStreetMap (ODbL)"
  ],
  "confidence": "medium"
 },
 {
  "id": "sws-t-smallfield",
  "kind": "track",
  "name": "Smallfield Raceway",
  "area": "South of England",
  "description": "Banger racing track near Horley. Surrey's oval venue.",
  "warnings": "Spectator venue; check fixtures. Status not confirmed for 2026.",
  "at": {
   "lat": 51.1816,
   "lng": -0.1238
  },
  "sources": [
   "OpenStreetMap (ODbL)"
  ],
  "confidence": "medium"
 },
 {
  "id": "sws-t-arlington",
  "kind": "track",
  "name": "Arlington Stadium, Hailsham",
  "area": "South of England",
  "description": "Oval stadium near Hailsham: Spedeworth stock car meetings (listed for 28 Nov 2026). The Eastbourne Eagles speedway team closed in 2021. Regular oval racing in East Sussex.",
  "warnings": "Spectator venue; check fixtures.",
  "at": {
   "lat": 50.8577,
   "lng": 0.228
  },
  "sources": [
   "https://www.spedeworth.co.uk/fixtures.php",
   "https://en.wikipedia.org/wiki/Eastbourne_Eagles",
   "OpenStreetMap (ODbL)"
  ],
  "confidence": "medium"
 },
 {
  "id": "sws-v-haynes",
  "kind": "venue",
  "name": "Haynes Motor Museum (Breakfast Club)",
  "area": "South West",
  "description": "Big motor museum at Sparkford, just off the A303. Haynes Breakfast Club: first Sunday of each month, 8am to about noon, any car or bike can display; dates listed to Nov 2027.",
  "warnings": "£5 tickets in advance only – none at the gate.",
  "at": {
   "lat": 51.041,
   "lng": -2.5592
  },
  "sources": [
   "https://haynesmuseum.org/whats-on/haynes-breakfast-club/"
  ],
  "confidence": "high"
 },
 {
  "id": "sws-v-goodwood-breakfast",
  "kind": "venue",
  "name": "Goodwood Breakfast Club",
  "area": "South of England",
  "description": "Themed Sunday-morning meets at the Goodwood Motor Circuit. Free but ticketed; 2026 ran 3 May, 31 May (cars and bikes), 26 Jul (members) and 2 Aug (classics).",
  "warnings": "2026 season over; 2027 dates not yet out. Tickets sell out – not a turn-up meet.",
  "at": {
   "lat": 50.8591,
   "lng": -0.7533
  },
  "sources": [
   "https://www.goodwood.com/grr/event-coverage/breakfast-club/2026-goodwood-breakfast-club-dates-and-themes/"
  ],
  "confidence": "high"
 },
 {
  "id": "sws-v-bicester",
  "kind": "venue",
  "name": "Bicester Heritage (Scramble)",
  "area": "South of England",
  "description": "Restored RAF bomber base and classic-car business park. Sunday Scramble three times a year (2026: 11 Jan, 26 Apr, 4 Oct; next 10 Jan 2027).",
  "warnings": "Ticketed and sells out fast; display spots by ballot.",
  "at": {
   "lat": 51.915,
   "lng": -1.1404
  },
  "sources": [
   "https://www.bicestermotion.com/latest/october-2026-scramble-sells-out"
  ],
  "confidence": "high"
 },
 {
  "id": "sws-v-beaulieu",
  "kind": "venue",
  "name": "National Motor Museum, Beaulieu",
  "area": "South of England",
  "description": "National Motor Museum in the New Forest. Free \"Breakfast at Beaulieu\" turn-up meets about monthly in the first car park, plus ticketed shows (Supercar Weekend, National Mini Day).",
  "warnings": "Breakfast meet dates for 2027 not confirmed; New Forest roads with roaming animals.",
  "at": {
   "lat": 50.8244,
   "lng": -1.4558
  },
  "sources": [
   "https://www.nationalmotormuseum.org.uk/events/beaulieu-motoring-events/"
  ],
  "confidence": "high"
 },
 {
  "id": "sws-v-loomies",
  "kind": "venue",
  "name": "Loomies Moto Café, West Meon",
  "area": "South of England",
  "description": "Long-running bikers' café at the A32/A272 crossroads. Main biker meeting point in the Meon Valley (MCN \"Meet of the week\"); hosted 120+ riders for International Female Ride Day, May 2026.",
  "warnings": "Wednesday bike night not confirmed for 2026; police patrol the A32/A272 at weekends.",
  "at": {
   "lat": 51.0304,
   "lng": -1.0757
  },
  "sources": [
   "https://motorcyclenews.com/news/2017/may/loomies-bike-meet-of-the-week",
   "https://devittinsurance.com/?p=58976"
  ],
  "confidence": "high"
 },
 {
  "id": "sws-v-cm-hut",
  "kind": "venue",
  "name": "Caffeine & Machine: The Hut, West Meon",
  "area": "South of England",
  "description": "Caffeine & Machine's Hampshire venue, next to Loomies. Wednesday evening sessions from 5pm and weekend sessions; ticketed events through 2026.",
  "warnings": "Some events ticketed; licensed – no drink-driving.",
  "at": {
   "lat": 51.0314,
   "lng": -1.0748
  },
  "sources": [
   "https://caffeineandmachine.com/thehut",
   "https://www.motorcyclenews.com/news/2024/february/caffeine-and-machine-new-venue"
  ],
  "confidence": "high"
 },
 {
  "id": "sws-v-classic-motor-hub",
  "kind": "venue",
  "name": "The Classic Motor Hub, Bibury",
  "area": "South West",
  "description": "Classic car dealer and café in the Cotswolds. \"Coffee & Classics\" Sunday mornings (2026: 22 Mar, 7 Jun, 23 Aug, 25 Oct).",
  "warnings": "£10 advance tickets; some events single-make only. Coordinate from postcode GL7 5FF.",
  "at": {
   "lat": 51.7832,
   "lng": -1.8403
  },
  "sources": [
   "https://www.classicandsportscar.com/calendar/coffee-and-classics"
  ],
  "confidence": "medium"
 },
 {
  "id": "sws-v-poole-quay",
  "kind": "venue",
  "name": "Poole Quay Bike Night",
  "area": "South West",
  "description": "Weekly summer bike night on Poole Quay. Tuesdays 5:30–9pm, 7 Apr–29 Sep 2026, with \"Bike of the Night\".",
  "warnings": "Seasonal; small charge per bike in past seasons.",
  "at": {
   "lat": 50.712,
   "lng": -1.9865
  },
  "sources": [
   "https://www.pooletourism.com/news/roaring-success-bike-nights-are-back-on-poole-quay-for-the-2026-season"
  ],
  "confidence": "high"
 },
 {
  "id": "sws-v-paignton-bike-night",
  "kind": "venue",
  "name": "English Riviera Bike Night, Paignton",
  "area": "South West",
  "description": "Council-listed bike night on the Eastern Esplanade. Wednesdays from 6pm, 6 May–30 Sep 2026, often 1,000+ bikes; winter nights move to a seafront pub.",
  "warnings": "Police run a noise camera and Section 59 warnings on Paignton seafront – ride out quietly. Coordinate from postcode TQ4 6BW.",
  "at": {
   "lat": 50.4374,
   "lng": -3.5578
  },
  "sources": [
   "https://www.torbay.gov.uk/leisure-sports-and-community/events",
   "https://www.thebikerguide.co.uk/bikerfriendlymeetingplacesdevon"
  ],
  "confidence": "medium"
 },
 {
  "id": "sws-v-weston-bike-night",
  "kind": "venue",
  "name": "Weston-super-Mare Bike Night",
  "area": "South West",
  "description": "Volunteer-run summer bike night on the Beach Lawns for the Poppy Appeal. Thursdays from 6pm, May to mid-September.",
  "warnings": "Seasonal; 2026 dates not confirmed (2025 ran 24 Apr–11 Sep).",
  "at": {
   "lat": 51.3363,
   "lng": -2.9828
  },
  "sources": [
   "https://visit-westonsupermare.com/your-weston-event/weston-super-mare-bike-nights/"
  ],
  "confidence": "medium"
 },
 {
  "id": "sws-v-chapter1",
  "kind": "venue",
  "name": "Chapter 1 Diner, Indian Queens",
  "area": "South West",
  "description": "Diner by a motorcycle dealer just off the A30. Thursday bike night 6–10pm, April–September.",
  "warnings": "Seasonal; coordinate from postcode TR9 6TF.",
  "at": {
   "lat": 50.3976,
   "lng": -4.9231
  },
  "sources": [
   "https://www.devittinsurance.com/guides/biker-cafes/south-west/chapter-1/",
   "https://www.thebikerguide.co.uk/bikerfriendlymeetingplacescornwall"
  ],
  "confidence": "medium"
 },
 {
  "id": "sws-v-chequered-flag",
  "kind": "venue",
  "name": "Chequered Flag, Liskeard",
  "area": "South West",
  "description": "Café at New Central Garage on the A38 at Liskeard. Wednesday charity bike night from 6pm, all year; MCN called it \"the Ace Café of the South West\".",
  "warnings": "2026 status not confirmed.",
  "at": {
   "lat": 50.4357,
   "lng": -4.4404
  },
  "sources": [
   "https://www.thebikerguide.co.uk/bikerfriendlymeetingplacescornwall"
  ],
  "confidence": "medium"
 },
 {
  "id": "sws-v-h-cafe",
  "kind": "venue",
  "name": "H's Café, Berinsfield",
  "area": "South of England",
  "description": "Roadside café on the A4074 near Dorchester-on-Thames. Monday summer bike night; open daily.",
  "warnings": "Seasonal; 2026 dates not confirmed.",
  "at": {
   "lat": 51.6585,
   "lng": -1.176
  },
  "sources": [
   "https://www.thebikerguide.co.uk/bikerfriendlyplacescafespubsoxford"
  ],
  "confidence": "medium"
 },
 {
  "id": "sws-v-six-bells",
  "kind": "venue",
  "name": "The Six Bells, Chiddingly",
  "area": "South of England",
  "description": "Village pub near Lewes. Bike night every second Tuesday, spring to autumn, up to 300 bikes.",
  "warnings": "Pub – no drink-driving; narrow lanes; 2026 dates not confirmed.",
  "at": {
   "lat": 50.9071,
   "lng": 0.1949
  },
  "sources": [
   "https://www.thebikerguide.co.uk/bikerfriendlymeetingplacescafespubssussex"
  ],
  "confidence": "medium"
 },
 {
  "id": "sws-v-custom-cafe",
  "kind": "venue",
  "name": "The Custom Café, Bexhill",
  "area": "South of England",
  "description": "Café on the A259 Barnhorn Road. Friday bike night 6–10pm, all year.",
  "warnings": "A259 access; 2026 status not confirmed.",
  "at": {
   "lat": 50.8458,
   "lng": 0.3969
  },
  "sources": [
   "https://www.thebikerguide.co.uk/bikerfriendlymeetingplacescafespubssussex"
  ],
  "confidence": "medium"
 },
 {
  "id": "sws-v-pinewood",
  "kind": "venue",
  "name": "Pinewood Bar & Café, Wokingham",
  "area": "South of England",
  "description": "Bar and café on Old Wokingham Road. Bike nights Tuesdays and Fridays from 7pm, all year (venue's own listing).",
  "warnings": "Bar – no drink-driving. Inside the Wokingham car-cruising PSPO area: no revving, racing or stunts on the way in or out. Coordinate from postcode RG40 3AQ.",
  "at": {
   "lat": 51.3866,
   "lng": -0.7958
  },
  "sources": [
   "https://pinewoodbarandcafe.co.uk/whats-on"
  ],
  "confidence": "medium"
 }
]
```
