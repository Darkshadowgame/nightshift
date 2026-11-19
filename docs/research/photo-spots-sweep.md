# Photo spots: UK-wide sweep (November 2026)

_The data is in `src/data/regions/photoSpots.ts` (new spots) plus fixes in `places.ts` and the regional files. The checks are in `__tests__/photoSpots.test.ts`._

## Method

- **What counts:** a place where the car or bike scene photographs, films, shows or meets. That covers viewpoints and pass car parks, seafront car parks and promenades, retail parks and supermarket car parks known for meets, urban and industrial backdrops, dams, and bikers' cafes with parking. Scenic places with no sign of cars or bikes there were left out (owner rule, 17 Nov 2026).
- **Evidence:** every new spot has at least one web source showing cars or bikes there. These include press reports of meets or police action at that car park, council PSPO and injunction papers, car and bike guides (BestBikingRoads, The Biker Guide, MCN, Devitt, Wemoto, Lancaster Insurance, Rush, Porsche Club GB), event pages and forum threads. Every spot also has an OpenStreetMap parking object (node or way link). Medium-confidence spots carry a research note, which the app hides from users.
- **Pins:** each pin is the parking (car park, lay-by or promenade parking), not the landmark. Coordinates come from OpenStreetMap (© OpenStreetMap contributors, ODbL). Overpass was overloaded for most of the run, so most positions came from the OSM API `map` call (parking way centroids) and Nominatim.
- **Sweep:** seven regional passes covered every nation and English region, by category: seafront and promenade, retail and leisure parks, urban and industrial, viewpoints and passes, dams, bikers' stops, and famous streets. About 1,000 BestBikingRoads UK ride pages and The Biker Guide's regional lists were read for stops.
- **Rules applied:**
  - Private car parks with public access are in, with "Private car park: be respectful; security may move you on."
  - A and B-road pull-ins are in, with "Roadside: park fully off the road."
  - Well-known streets are in, with the residential-street note.
  - Motorway and smart-motorway hard shoulders are never in.
  - Spots inside a ban zone (PSPO or injunction) are kept, and the app shows its usual warning there.
  - Bike-only spots (pushed, engine off) say so.
- **Limits:** the shared web-search budget ran out partway through, so some towns were never searched. Several news pages (inkl, WalesOnline, getsurrey, Coventry Telegraph) refused automated reads. Spots that rest on a search summary are marked medium.

## Coverage

Photo spots per nation and English region. "Shown" means the spot has evidence of cars or bikes and appears on the map (`photoVetting.ts`).

| Area | Before: all | Before: shown | After: all | After: shown | New |
|---|---:|---:|---:|---:|---:|
| North East | 8 | 0 | 27 | 20 | 19 |
| North West | 7 | 1 | 33 | 28 | 26 |
| Yorkshire and the Humber | 11 | 3 | 43 | 36 | 32 |
| East Midlands | 4 | 1 | 27 | 24 | 23 |
| West Midlands | 1 | 0 | 21 | 21 | 20 |
| East of England | 15 | 4 | 30 | 19 | 15 |
| London | 12 | 1 | 27 | 18 | 15 |
| South East | 21 | 3 | 54 | 36 | 33 |
| South West | 15 | 2 | 33 | 23 | 18 |
| Wales | 6 | 5 | 31 | 30 | 25 |
| Scotland | 7 | 2 | 35 | 33 | 28 |
| Northern Ireland | 4 | 1 | 10 | 9 | 6 |
| **Total** | **111** | **23** | **371** | **297** | **260** |

The test requires at least 8 shown spots in every area, and at least 15 in the busiest car-scene areas (London, the North East, North West, both Midlands, Yorkshire, the South East, Wales and Scotland).

A second sweep (same evidence rules) lifted the thin areas:
- **West Midlands:** Cannock, Hednesford and bike nights across Staffordshire, Worcestershire and Warwickshire.
- **East Midlands:** Skegness, Lincoln, Grantham, Nottingham, Leicester and Willingham Woods.
- **London:** Beckton, Hayes, Crayford, Leyton, Elmers End, New Malden, Crystal Palace, Exhibition Road, Berkeley Square and Chelsea Bridge.
- **North East:** Durham, Prudhoe, Middleton-in-Teesdale, Amble, North Shields, South Shields, Seaburn, Seahouses and the A19.

Birmingham city centre, Merry Hill, Tamworth, Telford, Derby (Pride Park) and Leicester's Fosse Park still have no source tying meets or shoots to a public car park, so they are not in. The Derby and Telford meets are on roads or in private office car parks.

## Local knowledge

A spot the owner names as a known car-scene spot can use the source "Local car scene (owner-reported, <Mon YYYY>)". The vetting rule accepts exactly that label (`LOCAL_SCENE_SOURCE` in `photoVetting.ts`), and nothing about who reported it or why is recorded. It still needs a real OSM public car park.

So far there is one: Gorleston-on-Sea, at the Pier Gardens car park on the seafront.

## Fixes to existing spots

- **Pins moved from the landmark to the public car park beside it** (OSM link added):
  - Rest and Be Thankful, Box Hill, Horsey Windpump, St Benet's Abbey, Happisburgh, Lady Anne's Drive (Holkham), High Lodge, Reculver
  - Canary Wharf (Canada Square car park), Saltburn, Kielder Castle, Angel of the North, Dunluce Castle, Torr Head
- **Car and bike sources added**, so these now show on the map:
  - Black Mountain, Bwlch y Groes, Llyn Gwynant, Devil's Bridge, Buttertubs, Kirkstone, Hartside, Honister, Kielder Castle
  - Mam Nick, Cheddar, Haytor, Lizard Point, Portland Bill, Abbotsbury Hill, Broadway Tower
  - Glenshee, Lecht, Rest and Be Thankful, Bealach na Bà, Glen Etive, Ballintoy, Spelga, Hunstanton, Battersea Power Station, Alexandra Palace
- **Broadway Tower:** pin and county checked. It is on the tower's own car park, in Worcestershire.
- **Every photo spot now has an `area` and a `vehicles` tag.**
- **Ban zones:** spots inside one stay and are flagged, and the test checks every one is flagged. Box Hill, Bluebell Hill, Chatham, Westminster, Embankment, Cow and Calf, Saltburn and Cromer were already inside one. 48 new spots are inside one, among them Bluewater, Lakeside, the Trafford Centre, Medway, Enfield, Southend, Coventry, Dudley and Swindon.

## Rejected, and why

Most rejections fall into five groups:

1. **No evidence of cars or bikes there.** Good views or busy seafronts, but no source showing meets, shoots or bikers' stops. Left out:
   - England: Mablethorpe, Felixstowe Landguard, Margate, Dover, Gravesend, Worthing, Weston Shore, Hayling Island, Westfield Stratford and White City, Otterspool, Crosby, New Brighton, Pier Head and Albert Dock, MediaCityUK, Castlefield, Morecambe, Tynemouth, Seaburn and Roker, Newcastle Quayside, the Tees Transporter, White Rose Centre, Leeds Dock, Park Hill, Hull Marina, Robin Hood's Bay, Blue Bank, Rosedale Chimney top, Fort Dunlop, Star City, Merry Hill, Resorts World and the NEC, Long Mynd, the Malvern Hills, Plymouth Hoe, the Bournemouth and Weymouth seafronts.
   - Wales: Porthcawl, Barry Island, Aberavon, Mumbles, Rhyl and Prestatyn, Llyn Ogwen, Llanberis, Llyn Brenig, Rhigos.
   - Scotland and Northern Ireland: Braehead, the Kelpies, the Glasgow and Edinburgh waterfronts, Dundee, Ayr, Largs and Troon, Titanic Quarter, Cave Hill.
2. **Anti-social driving but not meets or photos.** Revving, racing or speeding reports with no meet or shoot. Left out: Lee-on-the-Solent, Exmouth Maer Road, Cathedral Retail Park (Wakefield), Lowestoft Gateway, Tilgate Park, Seaton Carew.
3. **Good evidence but no public parking to pin.**
   - Meets on roads with no-parking signs: Westwood Way (Wigan), Euroway (Bradford), Cross Green (Leeds).
   - Cafes and stops not mapped in OSM: Willingham Woods, Ladybower Inn, Devil's Beef Tub, Hell's Mouth, Lilypool, Otterham, Keswick's Filling Station Cafe.
   - Places whose pin could only be guessed: Krazy Horse, Darley Moor cafe, Longwater, Eastpoint, Skegness Festival car park, Preston Dock, Garthdee Road (Aberdeen), Hermiston.
4. **Not suitable or not allowed.**
   - Aberystwyth promenade bans motorcycles.
   - The Hunstanton promenade byelaws ban motorbikes.
   - Portobello promenade is closed to vehicles.
   - The Barnsley Peel Parade multi-storey is closed to non-users by court order.
   - The Dark Hedges are closed to traffic.
   - Fuel forecourts and main roads named in injunction exhibits were left out.
5. **Already in the app.**
   - Ace Cafe, Ryka's, Caffeine & Machine: meet venues already.
   - The Ponderosa Café on the Horseshoe Pass closed for good in March 2025 (MCN: https://motorcyclenews.com/news/2025/march/ponderosa-cafe-closure; Shropshire Star, 12 Mar 2025), so its venue entry has been removed. The viewpoint parking just below the summit is a photo spot instead. The Ponderosa on the Glenshane Pass in Northern Ireland is a different place and stays.
   - Spots within 200 m of an existing spot were merged.

Motorway hard shoulders were never considered. No spot is on a private driveway or in front of a house.
