# Slipstream – regional places research (North of England)

_Compiled 17 November 2026. Research only – the data module is `src/data/regions/northEngland.ts`; no existing app file was changed._

Covers Yorkshire (Dales, Moors, Wolds and the cities), the Peak District, Lancashire, Greater Manchester, Merseyside, Cheshire, Cumbria and the Lake District, County Durham, Northumberland, Tyne and Wear, Teesside and Lincolnshire.

## How this was put together

- **Method:** the same as `regional-places.md` (East Anglia, Kent, London).
- **Sources:** riding guides (BestBikingRoads route pages and reviews), Wikipedia for road facts (gradients, heights, closures), official sites (National Trust, English Heritage, National Park and visitor sites, venue and club sites), The Biker Guide and Devitt for bike nights, and council pages, orders and local news for the places to avoid. Each row links its sources.
- **Coordinates:** points come from OpenStreetMap via Nominatim and Photon (both OSM-based) and are matched to the named car park, viewpoint or venue. Where only a postcode or nearby feature was available, confidence is medium.
- **Drive lines:** each drive was routed with OSRM (OpenStreetMap road data) through on-road points on the named roads, and the road numbers it used were checked against the route name. Bad via points that caused detours (onto the Cam High Road, forest haul roads or the Buttertubs road) were fixed and re-routed. Waypoints are sampled from the routed line about every 1.1 miles (never more than 1.5 mi apart), so they sit on the actual road. The "Line" note says where the line leaves the named road.
- **Not duplicated:** `places.ts` already has Snake Pass, Cat and Fiddle, Hartside (A686), Hardknott/Wrynose, Buttertubs and Kirkstone drives; Fairholmes, Mam Nick, Hartside Top, Kirkstone and Sutton Bank photo spots; and Oulton Park, Cadwell Park, Croft, Harewood, Blyton Park, Three Sisters, Aintree and Teesside Autodrome. `kartTracks.ts` has Rowrah, Fulbeck and PF International. None of these are repeated here.
- **Legal and safe:** every stop is a public car park, viewpoint, visitor site or a venue that welcomes visitors. Orders against car meets are listed separately under **Avoid**. Opening times, prices and meet dates change, so check before you publish them as live data.
- **Confidence:** _high_ means the place is confirmed against an official or map listing and the line follows the named roads. _medium_ means an approximate position, a partial line or source, or meet details not confirmed for 2026. _low_ means unverified or probably lapsed.
- **Limits:** the shared web-search budget ran out part-way through, so some venue dates and several councils could not be checked (listed under Avoid). OpenStreetMap Overpass was unavailable, so car-park positions come from named OSM features via Photon.

## North of England

### Drives / routes (24)

| Name | Start → End | Miles | Description | Why it's good | Warnings | Line | Conf. | Sources |
|---|---|---|---|---|---|---|---|---|
| **Honister Pass (B5289)** | Grange-in-Borrowdale → Buttermere | 9.0 | Up Borrowdale past Seatoller and over Honister Pass, past the slate mine at the top, then down to Gatesgarth and along Buttermere. | One of the steepest passes in the Lake District (up to 1 in 4, Wikipedia); BestBikingRoads B5289 reviewers call it a testing road with corners that tighten up without warning. | Gradients up to 1 in 4 (25%) with tight bends between stone walls; narrow, so expect to reverse for oncoming traffic; very busy with tourists, cyclists and walkers in summer; sheep on the open fell; can close or be impassable in snow and ice. | On the B5289 throughout (checked against road refs). (9 waypoints) | high | [1](https://en.wikipedia.org/wiki/Honister_Pass) [2](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/north-west-england/ride/b5289-keswick-cockermouth) |
| **Newlands Pass** | Braithwaite → Buttermere | 7.0 | Unclassified mountain road from Braithwaite up the Newlands valley to Newlands Hause, then a steep drop to Buttermere village. | Spectacular but very narrow pass (BestBikingRoads); 1 in 4 on both sides (Wikipedia). Links with Honister and Whinlatter for the classic Buttermere loop. | Gradients of 1 in 4 on both sides; very narrow with few passing places in places; unfenced drops; tourists, cyclists and walkers; sheep; not gritted as a priority in winter. | On the unclassified Newlands Pass road throughout. (8 waypoints) | high | [1](https://en.wikipedia.org/wiki/Newlands_Pass) [2](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/north-west-england/ride/newlands-pass-keswick-cockermouth) |
| **Whinlatter Pass (B5292)** | Braithwaite → High Lorton | 5.5 | Wooded climb from Braithwaite through Whinlatter Forest, past the visitor centre, then open views down to the Lorton valley. | The gentlest of the three Buttermere passes; a BestBikingRoads reviewer recommends it as the way to close the Honister loop, with views over the Skiddaw fells from the top. | Hairpins and a steep start out of Braithwaite; Whinlatter Forest visitor traffic and cyclists; forest car parks are pay and display. | On the B5292 except the last 0.2 mi into High Lorton. (6 waypoints) | high | [1](https://en.wikipedia.org/wiki/Whinlatter_Pass) [2](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/north-west-england/ride/b5289-keswick-cockermouth) |
| **A684 Garsdale (Hawes to Sedbergh)** | Hawes → Sedbergh | 15.7 | West from Hawes up Wensleydale to Garsdale Head, then down the long, narrow valley of Garsdale to Sedbergh. | BestBikingRoads A684 reviewers rate the Hawes–Sedbergh end as the best part: "hardly a sniff of straight road" from Hawes to the M6, best ridden at a steady rhythm. | Stone walls tight to the road and limited sightlines; farm traffic and mud, slippery in the wet; sheep; Hawes is busy on summer weekends. | On the A684 throughout. (15 waypoints) | high | [1](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/north-west-england/ride/a684-kendal-bedale) |
| **B6270 Swaledale** | Nateby (Kirkby Stephen) → Reeth | 21.6 | Over the moor from Nateby to Keld at the head of Swaledale, then down the dale through Thwaite, Muker, Gunnerside and Low Row to Reeth. | BestBikingRoads B6270 reviewers call it a favourite: dips, crests and corners "galore", narrow above Reeth, open moorland at the west end. | Single-track in places on the moor with passing places; cattle grids; sheep and lambs on the road; gravel and dung; narrow village sections; busy with walkers in summer. | On the B6270 throughout. (21 waypoints) | high | [1](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/yorkshire/ride/b6270-marske-grinton-thwaite-nateby) |
| **Fleet Moss (Hawes to Buckden)** | Hawes → Buckden | 12.6 | From Hawes through Gayle and up over Fleet Moss, then down Langstrothdale past Oughtershaw and Hubberholme to Buckden in Wharfedale. | The highest paved road in Yorkshire (about 589 m, Wikipedia), a hard climb from either side with big moorland views. | Very steep sections on the Gayle side; narrow, mostly single-track with passing places in Langstrothdale; cattle grids and free-roaming sheep; exposed and often icy or foggy – avoid in winter. | Gayle Lane, Beggarmans Road/Fleet Moss road, Oughtershaw Road, then the B6160 into Buckden. (13 waypoints) | medium | [1](https://en.wikipedia.org/wiki/Fleet_Moss) |
| **B6255 Ingleton to Hawes (Ribblehead)** | Ingleton → Hawes | 16.5 | Up Chapel-le-Dale past White Scar Cave to the Ribblehead Viaduct, then over Newby Head and down into Wensleydale at Hawes. | BestBikingRoads reviewers call it one of the finest roads in the Dales: a rollercoaster first half, faster and more open to Hawes, with the viaduct as the midway stop. | Large police presence in summer (BestBikingRoads); lambs and sheep in spring; elevation changes and crests near Hawes; visitors stopping at the viaduct; part of the Devil's Bridge riding area where locals have campaigned about speed and noise. | On the B6255 throughout. (16 waypoints) | high | [1](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/yorkshire/ride/b6255-ingleton-hawes) |
| **A59 over Blubberhouses Moor** | Kettlesing Head (Harrogate) → Bolton Bridge | 11.1 | The A59 west of Harrogate over Blubberhouses Moor, past Thruscross and down to Bolton Bridge near Bolton Abbey. | The main Pennine crossing between Harrogate and Skipton; BestBikingRoads (A59 Preston–York over Blubberhouses) describes the high moorland section as its highlight. | Busy main road with HGVs; 50/60 mph limits and cameras; frequent police patrols at weekends (BestBikingRoads); exposed to fog and snow on the moor; Route 59 café stop at Bolton Abbey. | On the A59 throughout. (11 waypoints) | high | [1](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/north-west-england/ride/a59-preston-york-over-blubberhouses) |
| **Woodhead Pass (A628)** | Tintwistle → Flouch (A616) | 11.0 | The Pennine trunk road from Tintwistle along the Longdendale reservoirs and over the Woodhead Pass to the Flouch roundabout. | Classic Pennine crossing with big reservoir views; pairs with Snake Pass and Holme Moss for a Dark Peak loop (BestBikingRoads Woodhead/Snake Pass). | Very heavy HGV traffic and frequently congested; described as dangerous (Wikipedia); often closed by snow or high winds; speed cameras; Tintwistle and Hollingworth are 30 mph. | On the A628 throughout. (11 waypoints) | high | [1](https://en.wikipedia.org/wiki/Woodhead_Pass) [2](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/yorkshire/ride/woodhead-snake-pass) |
| **Holme Moss (A6024)** | Holmfirth → Woodhead (A628) | 9.2 | From Holmfirth up through Holme and over Holme Moss past the transmitter mast, then down the hairpins to the Longdendale valley. | The 2014 Tour de France climb (Wikipedia); BestBikingRoads reviewers like the fast sweeping climb from Holme and the tight hairpins down to Woodhead. | Often the first road in the area blocked by snow; steep (up to 11%) with hairpins and a sheer drop on one side; blind brow at the summit – no overtaking; sheep; poor surface out of Holmfirth (BestBikingRoads); Kirklees nuisance-vehicle PSPO covers the Holmfirth end. | On the A6024, ending with 1.3 mi on the A628. (10 waypoints) | high | [1](https://en.wikipedia.org/wiki/Holme_Moss) [2](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/yorkshire/ride/a6024-b6105-woodhead-road-holmfirth-glossop) |
| **A169 Pickering to Whitby** | Pickering → Whitby (A171) | 18.6 | North across the North York Moors past the Hole of Horcum and RAF Fylingdales, then down Blue Bank to Sleights and on to Whitby. | BestBikingRoads reviewers rate it among the best roads in North Yorkshire: long visible straights, fast open bends and moorland views. | Busy with coast traffic on summer weekends; the Saltergate bend at the Hole of Horcum is tight; Blue Bank is a steep descent; sheep on the open moor; police patrols in summer. | On the A169 throughout (some sections carry no ref in the router data). (18 waypoints) | high | [1](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/yorkshire/ride/a169-whitby-pickering) |
| **Blakey Ridge (Hutton-le-Hole to Castleton)** | Hutton-le-Hole → Castleton | 12.2 | Minor road along the top of Blakey Ridge, past the Lion Inn, between Farndale and Rosedale, dropping into Esk Dale at Castleton. | BestBikingRoads: mainly straight along the ridge with a few kinks, stunning National Park scenery and very little traffic. | Free-roaming sheep across the whole ridge; walkers; often poor condition; cattle grids; police seen near the A171 end (BestBikingRoads); avoid Rosedale Chimney Bank (1 in 3) off this route. | On the Blakey Ridge road (unclassified) throughout. (12 waypoints) | high | [1](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/yorkshire/ride/hutton-le-hole-castleton-blakey-ridge) |
| **Trough of Bowland** | Dunsop Bridge → Lancaster (Quernmore) | 15.7 | Through the Forest of Bowland from Dunsop Bridge up the Trough to the summit, then across the moor past Jubilee Tower and down to Lancaster. | Steep and narrow but the direct route from Dunsop Bridge to Lancaster (Wikipedia); a long-standing North West ride (BestBikingRoads route via the Trough). | Steep, narrow and twisty; unfenced moorland with sheep and cattle grids; popular with cyclists and walkers; few passing places near the summit; not a priority for gritting. | Trough Road and Wyresdale Road (unclassified) throughout. (15 waypoints) | high | [1](https://en.wikipedia.org/wiki/Trough_of_Bowland) [2](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/north-west-england/ride/prestwich-trough-of-bowland-lancaster) |
| **A6 over Shap** | Kendal → Penrith | 24.7 | The old main road north over Shap Fell, the route the M6 replaced: a long climb from Kendal to Shap Summit, then Shap village and on to Penrith. | BestBikingRoads reviewers call it much better than the M6 – fast and flowing, with a tighter wooded section near Kendal. | Exposed and often impassable in snow (Wikipedia); camera van reported near Kendal and police on the fast sections (BestBikingRoads); quarry lorries near Shap. | On the A6 throughout. (23 waypoints) | high | [1](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/north-west-england/ride/a6-kendal-penrith) [2](https://en.wikipedia.org/wiki/Shap_Summit) |
| **Military Road (B6318) along Hadrian's Wall** | Chollerford → Greenhead | 18.6 | The 18th-century Military Road west along Hadrian's Wall, past Brocolitia, Housesteads, The Sill and Cawfields. | Built 1751–58 partly on the Wall's foundations; long straight sections across open country with Wall forts and viewpoints along the way (Wikipedia). | Rollercoaster dips and blind summits hide oncoming traffic – overtake with great care; walkers crossing at Wall car parks; Housesteads and Steel Rigg car parks very busy in summer; sheep. | On the B6318 except ~2 mi of minor road near Greenhead where the router left it. (17 waypoints) | medium | [1](https://en.wikipedia.org/wiki/Military_Road_(Northumberland)) |
| **A68 to Carter Bar** | Otterburn → Carter Bar (Scottish border) | 15.7 | From Otterburn up Redesdale past Catcleugh Reservoir and Byrness to the border viewpoint at Carter Bar. | BestBikingRoads A68 reviewers single out the 10–15 miles either side of Carter Bar: fantastic bends, open road and great views. | Hidden dips and blind summits; military ranges (Otterburn) beside the road – obey red flags and don't stop at range gates; snow closures at Carter Bar even in spring and autumn (Wikipedia); HGVs. | A696 for the first 2.2 mi, then the A68. (15 waypoints) | high | [1](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/north-east-england/ride/a68-crook-jedburgh-dalkeith) [2](https://en.wikipedia.org/wiki/Carter_Bar) |
| **Bellingham to Kielder** | Bellingham → Kielder village | 18.3 | Up the North Tyne valley through Falstone and along the north shore of Kielder Water to Kielder village and castle. | BestBikingRoads (Shilling Pot: Bellingham–Kielder): endless flowing curves, fast sweepers and good camber changes, usually quiet. | Remote with no fuel at Kielder – fill up in Bellingham; timber lorries; deer and red squirrels; the Kielder Forest Drive is a separate gravel toll road, not this route; dark skies park so no street lighting. | Unclassified road (C200) throughout. (17 waypoints) | high | [1](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/north-east-england/ride/shilling-pot-bellingham-kielder-kielder-water) [2](https://www.visitkielder.com/) |
| **Northumberland coast (B1339/B1340)** | Alnmouth → Bamburgh | 21.4 | Coast-and-castles B-roads from Alnmouth through Longhoughton, Embleton, Beadnell and Seahouses to Bamburgh Castle. | Links Dunstanburgh, Seahouses harbour and Bamburgh; part of the BestBikingRoads "Coast and Castles" route. | Narrow in places with tractors and caravans; Seahouses and Bamburgh very busy in summer; village 30 mph limits; pay car parks. | B1339 then B1340, with short village links (checked against road refs). (20 waypoints) | medium | [1](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/north-east-england/ride/coast-and-castles-wooler-seahouses) |
| **A689 Weardale and Killhope** | Stanhope → Alston | 20.3 | Up Weardale through St John's Chapel and Cowshill, over Killhope Cross and down through Nenthead to Alston. | Killhope Pass is the highest paved A-road in the UK (627 m, Wikipedia); BestBikingRoads reviewers rate Killhope–Alston as the best stretch. | Snow gates and frequent winter closures; mud and muck on the road; tight bend at Nenthead (BestBikingRoads); sheep; stop-start through the dale villages. | On the A689 throughout. (19 waypoints) | high | [1](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/north-east-england/ride/a689-wolsingham-brampton) [2](https://en.wikipedia.org/wiki/Killhope) |
| **B6277 Teesdale and Yad Moss** | Middleton-in-Teesdale → Alston | 21.9 | Up Teesdale past Bowlees and High Force, then over the open moor at Yad Moss and down to Alston. | BestBikingRoads reviewers: little traffic, great high-speed corners and some slow ones; a former local secret now popular on bank holidays. | Very bumpy beyond the last houses; suicidal sheep (BestBikingRoads); exposed and snow-prone over Yad Moss; cattle grids. | On the B6277 throughout. (21 waypoints) | high | [1](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/north-east-england/ride/b6277-middleton-in-teesdale-alston) |
| **A166 Garrowby Hill and the Wolds** | Stamford Bridge → Driffield | 20.8 | East from Stamford Bridge up Garrowby Hill onto the Yorkshire Wolds, then over the top through Fridaythorpe and Wetwang to Driffield. | A BestBikingRoads Harrogate–Bridlington–Whitby route names Stamford Bridge to Bridlington as one of its best parts; big Wolds views from Garrowby Hill (248 m). | Steep climb and descent at Garrowby Hill; HGVs and tractors; poor surface near Driffield and queues behind lorries (BestBikingRoads). | On the A166 throughout. (20 waypoints) | high | [1](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/yorkshire/ride/a166-a165-a171-a170-a61-harrogate-bridlington-whitby-return) [2](https://en.wikipedia.org/wiki/Garrowby_Hill) |
| **Caistor High Street (B1225)** | Caistor → Baumber (A158) | 19.7 | The ridge-top "High Street" along the Lincolnshire Wolds from Caistor south past Belmont mast to the A158 near Horncastle. | BestBikingRoads: looks straight on the map but has lots of high-speed bends and a few S-bends; close to Cadwell Park and Willingham Woods. | Hidden crossroads on fast bends; mud from a motocross track near Belmont at weekends; popular with police including unmarked bikes (BestBikingRoads). | On the B1225 throughout. (19 waypoints) | high | [1](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/east-midlands/ride/b1225-horncastle-caistor-lincolnshire-wolds) |
| **Long Hill (A5004)** | Buxton → Whaley Bridge | 7.2 | From Buxton over Long Hill above the Goyt Valley and down to Whaley Bridge. | BestBikingRoads reviewers: a mix of tight bends and sweepers, less busy than the Cat and Fiddle with no average-speed cameras, and a lay-by view over the Goyt Valley reservoirs. | A bend about halfway tightens sharply; deer can jump from the banks; cyclists; stone walls. | On the A5004 except ~0.3 mi of town streets in Whaley Bridge. (8 waypoints) | high | [1](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/north-west-england/ride/a5004-buxton-whaley-bridge) |
| **A54 Congleton to the Cat and Fiddle** | Congleton → A537 junction (Cat and Fiddle) | 14.5 | From Congleton past Bosley and up through Wildboarclough country to meet the A537 near the Cat and Fiddle. | BestBikingRoads: twisty and winding with great scenery, quieter than the Cat and Fiddle. | Average-speed cameras on the top section near the Cat and Fiddle; HGVs take the middle of the road on blind bends; sheep; roadworks – a section reopened in Oct 2026 with more work planned for spring 2027 (check before you go). | On the A54 throughout. (14 waypoints) | medium | [1](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/north-west-england/ride/a54-congleton-buxton) |

### Photo spots (25)

| Name | Lat, Lng | Description | Why it's good / events | Warnings | Conf. | Sources |
|---|---|---|---|---|---|---|
| **Ribblehead Viaduct** | 54.2059, -2.3609 | The 24-arch Settle–Carlisle railway viaduct under Whernside, at the B6255/B5479 junction. | One of the classic Dales views; midway stop on the B6255. | Park only in the marked area by the junction or the station car park – not on the verges; very busy at weekends; the road beside the viaduct is narrow. | medium | [1](https://en.wikipedia.org/wiki/Ribblehead_Viaduct) [2](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/yorkshire/ride/b6255-ingleton-hawes) |
| **Buttertubs Pass summit** | 54.3552, -2.2048 | Lay-bys at the top of the Buttertubs road beside the 20 m limestone potholes. | The Tour de France 2014 climb, with views down to Swaledale. | Small lay-bys only – pull fully off; unfenced drops; don't block the narrow road. | high | [1](https://en.wikipedia.org/wiki/Buttertubs_Pass) |
| **Malham (National Park Centre)** | 54.0599, -2.1537 | National Park car park in Malham village, the start of the walk to Malham Cove. | Limestone cove and village scenery. | Pay car park that fills early in summer; narrow lanes into Malham – no roadside parking. | high | [1](https://en.wikipedia.org/wiki/Malham_Cove) [2](https://www.yorkshiredales.org.uk/) |
| **Cow and Calf, Ilkley Moor** | 53.9165, -1.8001 | Car park beside the Cow and Calf rocks above Ilkley, looking over Wharfedale. | Famous gritstone rocks and a wide valley view. | Small car park, busy at weekends; inside the Bradford district vehicle-nuisance PSPO area – no meets, revving or stunts. | high | [1](https://en.wikipedia.org/wiki/Ilkley_Moor) |
| **Surprise View, Otley Chevin** | 53.8929, -1.6903 | Surprise View car park on the Chevin above Otley, looking north over Wharfedale. | Wide elevated view over the valley. | Small car park; local residents nearby – no gatherings; check closing times. | medium | [1](https://en.wikipedia.org/wiki/Otley_Chevin) |
| **Hole of Horcum (Saltergate)** | 54.332, -0.6906 | National Park car park beside the A169 above the Hole of Horcum hollow. | Big moorland bowl right on the A169 drive. | Pay car park; the A169 is fast here – take care pulling in and out; busy at weekends. | medium | [1](https://en.wikipedia.org/wiki/Hole_of_Horcum) [2](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/yorkshire/ride/a169-whitby-pickering) |
| **Whitby Abbey headland** | 54.4861, -0.6047 | Abbey Headland car park next to the English Heritage abbey ruins above Whitby. | Gothic ruins with the harbour below. | Pay car park; Whitby is very busy in summer and during Goth Weekends; narrow streets in the old town. | high | [1](https://www.english-heritage.org.uk/visit/places/whitby-abbey/) |
| **Roseberry Topping (Gribdale Gate)** | 54.4908, -1.0874 | Gribdale Gate picnic site and car park on the moor edge between Roseberry Topping and Captain Cook's Monument. | National Trust hill with a distinctive half-cone summit. | Narrow, steep lane from Great Ayton; small car park; walkers. | medium | [1](https://www.nationaltrust.org.uk/visit/yorkshire/roseberry-topping) |
| **Saltburn Pier** | 54.5869, -0.9703 | Victorian pier and cliff lift with lower-promenade parking. | The last pleasure pier in Yorkshire, with the cliff tramway behind. | Pay parking; steep access road; busy summer weekends. | high | [1](https://en.wikipedia.org/wiki/Saltburn_Pier) |
| **Flamborough Head lighthouse** | 54.1162, -0.0834 | Car park at the lighthouse on the chalk headland. | White cliffs, sea stacks and the lighthouse. | Pay car park; exposed in bad weather; keep back from cliff edges. | high | [1](https://en.wikipedia.org/wiki/Flamborough_Head) |
| **Humber Bridge viewing area** | 53.6969, -0.4448 | Viewing area and car park at the south (Barton) end of the Humber Bridge. | Big suspension-bridge backdrop. | Check car park hours; no gatherings. | high | [1](https://en.wikipedia.org/wiki/Humber_Bridge) |
| **Surprise View, Hathersage** | 53.3172, -1.6231 | National Trust car park on the A6187 above Hathersage, looking across the Hope Valley. | One of the best-known Peak District viewpoints, by Millstone Edge. | Pay car park (NT members free); busy at weekends; the A6187 bend here is fast. | high | [1](https://www.nationaltrust.org.uk/visit/peak-district/longshaw-burbage-and-the-eastern-moors) |
| **Stanage Edge (Hook's Car)** | 53.3429, -1.6342 | Hook's Car car park below Stanage Edge, north of Hathersage. | Long gritstone edge with views over the Hope Valley. | Pay car park; narrow lanes; climbers and walkers. | high | [1](https://www.nationaltrust.org.uk/visit/peak-district/stanage-and-north-lees) [2](https://en.wikipedia.org/wiki/Stanage_Edge) |
| **Ashness Bridge** | 54.5672, -3.13 | Packhorse bridge on the Watendlath road above Derwentwater, with the classic view to Skiddaw. | One of the most photographed views in the Lake District. | Single-track road off the B5289 with few passing places; tiny car park just above the bridge – don't block the road or bridge. | medium | [1](https://en.wikipedia.org/wiki/Ashness_Bridge) |
| **Honister Slate Mine** | 54.5112, -3.1992 | Car park at the slate mine on the summit of Honister Pass. | Top of the Honister drive with views down both valleys. | Pay car park; busy with visitors and walkers. | high | [1](https://www.honister.com/) [2](https://en.wikipedia.org/wiki/Honister_Pass) |
| **Castlerigg Stone Circle** | 54.6029, -3.0984 | Neolithic stone circle above Keswick with roadside lay-by parking. | Stones with a ring of fells behind. | Narrow lane – park only in the lay-by; no vehicles on the grass; English Heritage site. | medium | [1](https://www.english-heritage.org.uk/visit/places/castlerigg-stone-circle/) |
| **Wast Water (Overbeck Bridge)** | 54.4497, -3.285 | National Trust car park at Overbeck Bridge on the Wast Water shore road, facing the screes and Great Gable. | Wast Water is England's deepest lake; a famous mountain view. | Remote, narrow dead-end valley road with no fuel; small pay car park; sheep. | medium | [1](https://www.nationaltrust.org.uk/visit/lake-district/wasdale) [2](https://en.wikipedia.org/wiki/Wast_Water) |
| **Jubilee Tower, Quernmore** | 54.0102, -2.7001 | Car park by the Jubilee Tower on the Trough of Bowland road above Lancaster, looking out to Morecambe Bay. | Viewpoint at the western end of the Trough of Bowland drive. | Small car park on an unfenced moor road; sheep; no gatherings. | medium | [1](https://en.wikipedia.org/wiki/Trough_of_Bowland) |
| **High Force** | 54.652, -2.18 | Waterfall car park opposite the High Force Hotel on the B6277. | One of England's biggest waterfalls, on the Teesdale drive. | Pay car park and a charge for the waterfall path; B6277 traffic. | medium | [1](https://en.wikipedia.org/wiki/High_Force) |
| **Steel Rigg (Hadrian's Wall)** | 55.003, -2.3908 | National Park car park just off the Military Road near The Sill, below the Whin Sill crags. | The best-known stretch of Hadrian's Wall; the former Sycamore Gap tree (felled in 2023) is a short walk east. | Pay car park; very busy in summer; narrow access lane. | high | [1](https://www.thesill.org.uk/) [2](https://en.wikipedia.org/wiki/Military_Road_(Northumberland)) |
| **Kielder Castle** | 55.2339, -2.5801 | Forest centre and car park at Kielder Castle, the end of the Kielder drive. | Forest, reservoir and dark-sky park. | Pay car park; remote with no fuel; check opening times. | medium | [1](https://en.wikipedia.org/wiki/Kielder_Castle) [2](https://www.visitkielder.com/) |
| **Bamburgh Castle** | 55.6043, -1.6972 | The Links car park in the dunes below Bamburgh Castle. | Castle on its rock above the beach; end of the coast drive. | Pay parking; very busy in summer; no driving on the dunes or beach. | high | [1](https://www.bamburgh.org.uk/) |
| **Craster (for Dunstanburgh Castle)** | 55.4709, -1.5958 | Quarry car park in Craster, at the start of the coast path to Dunstanburgh Castle. | Harbour village with the castle ruin along the coast. | Pay car park; village lanes are narrow – no driving down to the harbour. | high | [1](https://www.english-heritage.org.uk/visit/places/dunstanburgh-castle/) |
| **Holy Island (Lindisfarne)** | 55.675, -1.8005 | Chare Ends car park on Holy Island, reached over the tidal causeway. | Causeway, priory and castle. | The causeway floods at high tide – check the council's safe crossing times before you go and never cross outside them; pay parking. | high | [1](https://holyislandcrossingtimes.northumberland.gov.uk/) [2](https://www.lindisfarne.org.uk/) |
| **Angel of the North** | 54.9141, -1.5895 | Antony Gormley's 20 m steel sculpture in Gateshead, with a small free car park beside it. | The North East's best-known landmark. | Small car park off the A167 – short stops only, no meets. | high | [1](https://en.wikipedia.org/wiki/Angel_of_the_North) |

### Tracks, circuits & sprint venues (6)

| Name | Lat, Lng | Description | Why it's good / events | Warnings | Conf. | Sources |
|---|---|---|---|---|---|---|
| **Oliver's Mount, Scarborough** | 54.2592, -0.4107 | England's only natural road-race circuit for motorcycles, on the park roads of Oliver's Mount above Scarborough. | Hosts the Gold Cup and other road-race meetings each season. | Spectator venue on race days only; outside meetings the circuit is ordinary public road with low limits – never use it for laps. | high | [1](https://oliversmount.com/) [2](https://en.wikipedia.org/wiki/Oliver%27s_Mount) |
| **Barbon Manor Hill Climb** | 54.2399, -2.5548 | Short, very fast speed hill climb on the Barbon Manor estate near Kirkby Lonsdale, run by Liverpool Motor Club since 1950. | One of the fastest hill climbs in the UK; spectators welcome with free parking. | Event days only; working hill farm in the National Park; position is the manor house. | medium | [1](https://www.liverpoolmotorclub.com/barbon-hillclimb/) |
| **Buxton Raceway** | 53.2201, -1.9171 | Tarmac oval off the A53 south of Buxton, mainly BriSCA Formula 1 stock cars. | Regular stock-car meetings through to November in 2026. | Spectator venue; check fixtures; exposed site – dress for the weather. | high | [1](https://buxtonraceway.com/) [2](https://en.wikipedia.org/wiki/Buxton_Raceway) |
| **National Speedway Stadium (Belle Vue)** | 53.4611, -2.1889 | Purpose-built speedway stadium in Gorton, home of the Belle Vue Aces. | Top-flight speedway in Manchester. | Spectator venue; check fixtures. | high | [1](https://en.wikipedia.org/wiki/National_Speedway_Stadium) [2](https://www.bellevuespeedway.co.uk/) |
| **Owlerton Stadium, Sheffield** | 53.4062, -1.4924 | Speedway and greyhound stadium near Hillsborough, home of the Sheffield Tigers. | Long-running speedway venue (since 1929). | Spectator venue; check fixtures. | high | [1](https://en.wikipedia.org/wiki/Owlerton_Stadium) [2](https://www.sheffieldtigers.co.uk/) |
| **Skegness Stadium** | 53.1869, 0.2821 | Short tarmac oval at Orby near Skegness for stock cars and bangers. | Regular oval racing on the Lincolnshire coast. | Spectator venue; check fixtures; position from the stadium bus stop. | medium | [1](https://en.wikipedia.org/wiki/Skegness_Stadium) |

### Meet venues (cafés, bike nights, cars & coffee) (14)

| Name | Lat, Lng | Description | Why it's good / events | Warnings | Conf. | Sources |
|---|---|---|---|---|---|---|
| **Squires Café Bar, Sherburn in Elmet** | 53.7829, -1.2887 | Long-running biker café-bar on the B1222 at Newthorpe. | Weekly bike nights (Wednesday; The Biker Guide also lists Thursday); hosts the Easter Egg Run and the Yorkshire Rock & Bike Show. | Bar on site – no drink-driving; its own website is out of date, so check its social pages for current nights; postcode LS25 5LX. | medium | [1](https://www.squires-cafe.co.uk/) [2](https://www.thebikerguide.co.uk/weeklybikermeetwednesday) [3](https://www.devittinsurance.com/guides/biker-cafes/north/squires-cafe/) |
| **The Motorist, Sherburn in Elmet** | 53.7914, -1.207 | Purpose-built motoring venue on the old Sherburn airfield with café, shop and parking for about 800 cars. | Free "Coffee & Cars" every Sunday (10:00–16:00) plus themed Saturday meets; listed by Hagerty among the UK's top cars & coffee spots. | Official site wouldn't load when checked, so details come from 2026 event listings – check before you go. | medium | [1](https://www.hagerty.co.uk/articles/top-uk-cars-and-coffee-spots/) [2](https://www.justkampers.com/events/the-motorist-new-years-day-meet/) |
| **Lakeland Motor Museum, Backbarrow** | 54.2588, -2.9893 | Motor museum with Café Ambio on the A590 near Newby Bridge. | Monthly morning meet on the first Saturday (10:00–12:30, no booking) and the Lakeland Historic Car Club coffee morning on the third Saturday. | Classic-car focus; busy A590 junction. | high | [1](https://www.lakelandmotormuseum.co.uk/about/events/lakeland-motor-museums-monthly-morning-meet) [2](https://www.lakelandmotormuseum.co.uk/) |
| **Route 59 Café, Bolton Abbey** | 53.9778, -1.9122 | Roadside biker café on the A59 near Bolton Abbey. | Tuesday bike night 17:00–20:00, April–October (The Biker Guide); on the Blubberhouses drive. | Fast, busy A59 – take care at the entrance; closed Wednesdays; 2026 dates not confirmed. | medium | [1](https://www.thebikerguide.co.uk/weeklybikermeettuesday) [2](https://www.devittinsurance.com/?p=120458) |
| **Wheels Café, Old George Inn, Sykehouse** | 53.6454, -1.0475 | Biker-themed café at a village pub with a campsite near Goole. | Weekly Wednesday bike night 17:30–20:00 (The Biker Guide). | Pub – no drink-driving; narrow village lanes; 2026 dates not confirmed. | medium | [1](https://www.thebikerguide.co.uk/weeklybikermeetwednesday) |
| **Zoom Café Bar, South Cave** | 53.7675, -0.6298 | Café-bar on a business park off the A63 near Brough. | Thursday bike nights about 16:30 until late evening, March–October, fortnightly in winter (The Biker Guide). | Check the venue's social pages for current dates. | medium | [1](https://www.thebikerguide.co.uk/weeklybikermeetthursday) |
| **Devil's Bridge, Kirkby Lonsdale** | 54.1984, -2.5907 | Medieval bridge over the Lune with a snack van and two free car parks – the North's best-known informal bike gathering spot. | Hundreds of bikes on sunny weekends, busiest on Sundays from spring to autumn; no organiser. | No overnight stays in the car parks; local campaign (CANS) about speed and noise in the "Devil's Bridge triangle" villages – ride quietly through them; police patrol the A65 and B6255 approaches; the bridge itself is pedestrian only. | medium | [1](https://www.kirkbylonsdale.co.uk/parking-and-toilets/) [2](https://www.thebikerguide.co.uk/bikerfriendlymeetingplacecumbria) [3](https://www.pressreader.com/uk/mcn-uk/20210512/281685437725378) |
| **Tan Hill Inn** | 54.4557, -2.1603 | Britain's highest pub, alone on the moor between Swaledale and Teesdale, with a campsite. | Classic Dales ride and drive destination; a new owner in 2026 plans better facilities for bikers. | Pub – no drink-driving; remote, narrow moorland roads with sheep; snow and fog in winter. | medium | [1](https://www.teesdalemercury.co.uk/?p=40795) |
| **Grindleford Station Café** | 53.3053, -1.6243 | Old-school café at Grindleford station used by bikers, cyclists and walkers. | Long-standing Peak District ride stop; no set meet. | Cash only; small car park – fine for bikes, too small for car meets; very busy at weekends. | medium | [1](https://www.devittinsurance.com/guides/biker-cafes/midlands/grindleford-station-cafe/) |
| **Wraysholme Creamery, Flookburgh** | 54.1709, -2.9456 | Farm creamery on the Cartmel peninsula. | Bike night on the second Thursday, April–September, from 16:00 (The Biker Guide). | Seasonal; narrow lanes; 2026 dates not confirmed. | medium | [1](https://www.thebikerguide.co.uk/weeklybikermeetthursday) [2](https://www.thebikerguide.co.uk/bikerfriendlymeetingplacecumbria) |
| **Bridge House Farm Tearooms, Wray** | 54.1015, -2.6041 | Tearooms in the Lune valley near Lancaster that host classic car and bike nights. | First Thursday, April–September, 14:00–22:00, with a hog roast or BBQ (The Biker Guide). | Seasonal; narrow lanes; 2026 dates not confirmed. | medium | [1](https://www.thebikerguide.co.uk/bikerfriendlycafemeetingplaceslancashire) [2](https://www.thebikerguide.co.uk/weeklybikermeetthursday) |
| **Iron City Motorcycles, Leeds** | 53.7962, -1.5636 | Multi-brand motorcycle dealer (also in Gateshead and South Shields). | Bike night on the last Thursday of the month, 18:00–20:00, all makes welcome (Iron City). | Urban site; check dates on the dealer's page. | medium | [1](https://ironcitymotorcycles.co.uk/bike-night) |
| **Willingham Woods, Market Rasen** | 53.3806, -0.292 | Forestry picnic site with a kiosk on the A631, near the B1225 and Cadwell Park. | Wednesday evening bike meet April–September (The Biker Guide); BestBikingRoads B1225 reviewers say it is popular with bikes. | Public picnic site – no revving or stunts; A631 traffic; police attention on bike nights. | medium | [1](https://www.thebikerguide.co.uk/weeklybikermeetwednesday) [2](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/east-midlands/ride/b1225-horncastle-caistor-lincolnshire-wolds) |
| **The Vale Café, Rothbury** | 55.3097, -1.9123 | Long-standing biker café in Rothbury (formerly The Milk Bar). | Popular stop on Northumberland rides; open daily, no set meet (The Biker Guide). | Village street parking; 2026 details not confirmed. | medium | [1](https://www.thebikerguide.co.uk/bikerfriendlyplacescafespubsnorthumberland) |

## Avoid – PSPO, injunction and dispersal hotspots

These are not suggestions. Use them to keep the app from surfacing these places, and to warn users nearby. They are not in the JSON. Rows marked **zone** are in `banZones` in the data module (a rough circle round the area; borough-wide orders would be better as council boundary polygons). Most PSPOs last three years, so re-check each one at its expiry.

| Area | Place / order | What applies | Zone | Conf. | Sources |
|---|---|---|---|---|---|
| Yorkshire | **Wakefield – district-wide car-cruising PSPO (No 1 of 2025)** | In force 1 Dec 2025 for three years (to about 30 Nov 2028). Bans anti-social vehicle use (racing, revving, stunts, horns/music, obstruction) and promoting, organising or attending a car cruise, spectators included. £100 FPN. A separate PSPO (No 4 of 2023, to about Dec 2026) covers Tuscany Way/Express Way at Europort (M62 J31). | zone `bz-ne-wakefield` (53.66, -1.42, r 8 mi) | high | [1](https://www.wakefield.gov.uk/anti-social-behaviour/public-space-protection-orders-pspos) [2](https://www.wakefield.gov.uk/media/xk0cia2b/proposed-wakefield-pspo-2025.pdf) [3](https://www.wakefield.gov.uk/media/i5blmdjd/sealed-pspo-december-2023.pdf) |
| Yorkshire | **Calderdale – borough-wide vehicle-ASB PSPO (Halifax, Brighouse, Todmorden…)** | In force 1 Jul 2025 to 30 Jun 2028. Covers highways and car parks: revving, racing, stunts, horns/music, obstruction and car cruising; also promoting, organising or attending a cruise as driver, passenger or spectator. £100 FPN. | zone `bz-ne-calderdale` (53.72, -1.95, r 8 mi) | high | [1](https://new.calderdale.gov.uk/communities/crime-prevention/pspo-anti-social-use-vehicles) [2](https://new.calderdale.gov.uk/sites/default/files/2025-07/PSPO-anti-social-use-vehicles-signed-jul-2025.pdf) |
| Yorkshire | **Kirklees – Nuisance Vehicles PSPO (Huddersfield, Dewsbury, Batley, Holmfirth)** | In force 1 Jun 2025 for three years (to 31 May 2028). Bans stunts in any motor vehicle (doughnuts, drifting, handbrake turns, wheelies) on roads, car parks and rights of way, and catcalling from vehicles. Does not ban gathering as such. | zone `bz-ne-kirklees` (53.63, -1.77, r 7 mi) | high | [1](https://www.kirklees.gov.uk/pspo) [2](https://www.kirklees.gov.uk/beta/crime-and-safety/pdf/nuisance-vehicles-pspo.pdf) |
| Yorkshire | **Bradford – district-wide anti-social driving PSPO** | First sealed July 2019, extended 2022; the council's Regulatory and Appeals Committee voted on 5 Jun 2025 to extend it three years to 2028. Bans attending unauthorised car meets, cruising, revving, anti-social driving. £100 FPN. (This is a PSPO, not a court injunction.) | zone `bz-ne-bradford` (53.83, -1.85, r 7 mi) | medium | [1](https://bradford.moderngov.co.uk/mgAi.aspx?ID=17407) [2](https://www.hellorayo.co.uk/hits-radio/west-yorkshire/news/bradford-car-meet-ban) |
| Greater Manchester | **Stockport – borough-wide car-cruising PSPO** | In place since March 2017 (renewed 2020 and 2023), expired 17 Mar 2026; the council consulted (26 Mar–23 Apr 2026) on reinstating it to May 2029. Outcome not confirmed – treat as likely in force. | zone `bz-ne-stockport` (53.4, -2.15, r 4 mi) | medium | [1](https://www.stockport.gov.uk/pspo/car-cruising-pspo) [2](https://consultation.stockport.gov.uk/place/public-space-protection-order-car-cruising-2026/) |
| Greater Manchester | **Trafford – car-cruising PSPO (whole borough; Trafford Park, Trafford Centre and Palazzo hotspots)** | Trafford Park order 2017, widened to the whole borough in Aug 2023 "until August 2026"; 17 people ordered to pay about £15k after a 2025 meet at Trafford Palazzo. No 2026 renewal found – may have lapsed, so check. | zone `bz-ne-trafford` (53.445, -2.33, r 4.5 mi) | medium | [1](https://democratic.trafford.gov.uk/ieDecisionDetails.aspx?ID=878) [2](https://www.itv.com/news/granada/2023-08-10/order-in-place-to-ban-car-cruising-after-death-of-woman) [3](https://mail.localgovernmentlawyer.co.uk/community-safety/393-community-safety-news/61955-car-meet-attendees-fined-nearly-15k-over-public-space-protection-order-breach) |
| North East | **Sunderland – city-wide PSPO with car-cruising ban** | City-wide PSPO live from 1 May 2024 for three years (to about Apr 2027); prohibits car cruising as a driver, passenger or spectator. £100 FPN. | zone `bz-ne-sunderland` (54.89, -1.42, r 5 mi) | high | [1](https://www.sunderland.gov.uk/pspo) [2](https://www.itv.com/news/tyne-tees/2024-03-17/council-bans-car-cruising-and-introduces-new-anti-social-behaviour-fines) |
| Merseyside | **Wirral – Bromborough Industrial Estate PSPO (Riverview Road area)** | Approved and in force from 16 Jul 2025 after gatherings and races of large numbers of cars and motorbikes on Riverview Road. Targets racing and dangerous driving. Circle centre is approximate. | zone `bz-ne-bromborough` (53.338, -2.975, r 1 mi) | medium | [1](https://haveyoursay.wirral.gov.uk/we-asked-you-said-we-did/news_feed/bromborough-industrial-estate-public-spaces-protection-order) [2](https://inkl.com/news/new-plan-to-stop-dangerous-high-speed-car-races-on-industrial-estate) |
| Lancashire | **West Lancashire – Pimbo Industrial Estate PSPO** | Introduced 2022 against organised car meets, renewed 2025. Bans revving, rapid acceleration, racing, stunts, horns/music, convoys and obstruction, and timed "course" driving. Police enforce; FPN or prosecution. Circle centre is approximate. | zone `bz-ne-pimbo` (53.537, -2.745, r 0.8 mi) | high | [1](https://www.westlancs.gov.uk/pspo) [2](https://www.westlancs.gov.uk/news/council-gives-green-light-to-car-meet-pspo.aspx) |
| Greater Manchester | **Wigan – proposed borough-wide car-cruising PSPO; police dispersal orders** | Council consulted (to 31 Jan 2025) on banning car cruising and unauthorised meets borough-wide; outcome not confirmed. Police used a dispersal order over a suspected car meet on Westwood Way in May 2025. Organised events such as classic-car meets were not the target. Not added as a zone because the order is unconfirmed (Three Sisters circuit is in Wigan). | no zone | low | [1](https://www.wigan.gov.uk/Council/Consultations/Current/Public-Space-Protection-Orders.aspx) [2](https://hellorayo.co.uk/hits-radio/lancashire/news/wigan-dispersal-order-in-place-over-suspected-car-meet) |
| Yorkshire | **Leeds – city-wide vehicular-nuisance PSPO (2023)** | In force 3 Jul 2023 for about three years, covering revving, loud music, car cruising and promoting cruises. No longer listed on the council's PSPO page in Nov 2026 – probably lapsed. Earlier court closure orders covered Lowfields Road (Elland Road), Thorpe Park and Cross Green – treat those as known hotspots. | no zone | low | [1](https://news.leeds.gov.uk/news/anti-social-behaviour-awareness-week-sees-city-wide-public-space-protection-order-comes-into-force) [2](https://www.leeds.gov.uk/antisocial-behaviour-and-crime/public-spaces-protection-orders) [3](https://www.yorkshireeveningpost.co.uk/news/crime/unlicensed-car-meet-events-made-illegal-in-these-three-leeds-hotspots-3560033) |
| Yorkshire | **Scarborough, Whitby and Filey – car-cruising PSPO (Marine Drive / Royal Albert Drive)** | Made 2018, renewed Sep 2021 for three years; not on North Yorkshire Council's current PSPO list – probably lapsed. Police still run operations against car-cruise ASB on Scarborough's seafront. | no zone | low | [1](https://www.northyorks.gov.uk/sites/default/files/2023-03/PSPO-Car-Cruising%20-%20accessible.pdf) [2](https://www.northyorks.gov.uk/community-and-volunteering/community-safety/public-space-protection-orders-pspo) |
| Cumbria | **Devil's Bridge, Kirkby Lonsdale – no ban, but local restrictions** | No PSPO or biker ban found. Overnight stays in the car parks are not allowed; the CANS group of local councils campaigns for quieter, slower riding through the villages; a 2021 road-rage incident drew police attention. Listed as a venue with warnings. | no zone | medium | [1](https://www.kirkbylonsdale.co.uk/parking-and-toilets/) [2](https://www.pressreader.com/uk/mcn-uk/20210512/281685437725378) [3](https://cumbriacrack.com/2021/07/12/devils-bridge-road-rage-incident-involves-14-bikers-and-car-driver/) |

**Checked, nothing current found** (absence of evidence – not a guarantee):

- Sheffield – the city-centre PSPO (2025) has no vehicle clauses; no Meadowhall or Parkway order found.
- Rotherham – only calls for a PSPO (Aston/Todwick race meets, Cortonwood Retail Park); no order found.
- Salford – the Salford Quays PSPO covers water safety and general ASB, not car cruising.
- Manchester, Bolton, Oldham, Tameside – no car-cruising PSPO found; Greater Manchester Police use short dispersal orders against planned meets.
- Rochdale – the borough-wide PSPO (Sep 2024–Aug 2027) is general ASB; police have used vehicle-seizure powers at roundabouts.
- Liverpool, Knowsley, Sefton – no car-cruising order found (Sefton's PSPOs cover town centres and the coast).
- Blackpool, Preston, Burnley, Blackburn – nothing found; Chorley uses a permit system for car events on council land.
- Newcastle, Gateshead, South Tyneside, Middlesbrough, Stockton, Redcar, Hartlepool, County Durham – no car-meet order found (only general dispersal orders).
- Hull, Doncaster, Barnsley, Lincoln, Skegness – nothing found. North East Lincolnshire's 2026 borough-wide nuisance-vehicle PSPO is aimed at off-road and e-motorbikes in parks, not car meets.
- No High Court car-cruising injunction was found anywhere in the North (the live ones are in the Midlands and London).

**Not fully researched (search budget ran out):** York and Harrogate; Bury; Warrington and Chester; St Helens and Wirral beyond Bromborough; Cumbria councils other than Kirkby Lonsdale parking; Northumberland. Run a second pass before launch.

## Dropped or left out on purpose

- Cat and Fiddle inn (A537) as a meet venue – it is now The Forest Distillery bar with limited, bookable seating and registration-checked parking; the drive is already in `places.ts`.
- Hartside Top café – burned down in 2018; rebuild approved in 2024 but no evidence it has reopened. The viewpoint is already in `places.ts`.
- Cars & Coffee Cheshire (Chester) – its own site says no events for the foreseeable future.
- Caffeine & Machine – no northern site.
- The Pit Stop Diner, Thornaby – its web domain now points to an unrelated site, so the Tuesday bike night could not be confirmed.
- Chequered Flag Café, Darley Moor – Derbyshire Dales near Ashbourne, outside this region.
- Elvington airfield and York Raceway (Melbourne) – could not confirm current public track days or drag events.
- Newcastle Stadium (Brough Park) – speedway ended in 2022; Workington, Berwick, Redcar and Scunthorpe speedway/oval venues – current status not checked.
- Anglesey (Wales), the Ponderosa (Wales), Jack's Hill and the British Motor Museum (Midlands) – outside the region.
- Winnats Pass, Rosedale Chimney Bank and Park Rash – very steep or congested; not offered as drives (Rosedale is mentioned as a road to avoid).
- Kielder Forest Drive – a gravel toll forest road, not a tarmac drive.
- Liverpool waterfront and Blackpool promenade – left out until the local orders are checked.

## Route waypoints

The full waypoint lists are in the `path` field of each drive in the JSON below (lat/lng to 4 decimal places, on the routed road line).

## Machine-readable data

```json
[
 {
  "id": "ne-honister",
  "kind": "drive",
  "name": "Honister Pass (B5289)",
  "area": "Lake District",
  "description": "Up Borrowdale past Seatoller and over Honister Pass, past the slate mine at the top, then down to Gatesgarth and along Buttermere.",
  "warnings": "Gradients up to 1 in 4 (25%) with tight bends between stone walls; narrow, so expect to reverse for oncoming traffic; very busy with tourists, cyclists and walkers in summer; sheep on the open fell; can close or be impassable in snow and ice.",
  "at": {
   "lat": 54.5471,
   "lng": -3.1577
  },
  "path": [
   {
    "lat": 54.5471,
    "lng": -3.1577
   },
   {
    "lat": 54.5346,
    "lng": -3.1536
   },
   {
    "lat": 54.5201,
    "lng": -3.1469
   },
   {
    "lat": 54.5136,
    "lng": -3.1675
   },
   {
    "lat": 54.5128,
    "lng": -3.1917
   },
   {
    "lat": 54.5193,
    "lng": -3.212
   },
   {
    "lat": 54.5228,
    "lng": -3.2377
   },
   {
    "lat": 54.5316,
    "lng": -3.2571
   },
   {
    "lat": 54.5414,
    "lng": -3.2769
   }
  ],
  "miles": 9.0,
  "start": "Grange-in-Borrowdale",
  "end": "Buttermere",
  "sources": [
   "https://en.wikipedia.org/wiki/Honister_Pass",
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/north-west-england/ride/b5289-keswick-cockermouth"
  ],
  "confidence": "high"
 },
 {
  "id": "ne-newlands",
  "kind": "drive",
  "name": "Newlands Pass",
  "area": "Lake District",
  "description": "Unclassified mountain road from Braithwaite up the Newlands valley to Newlands Hause, then a steep drop to Buttermere village.",
  "warnings": "Gradients of 1 in 4 on both sides; very narrow with few passing places in places; unfenced drops; tourists, cyclists and walkers; sheep; not gritted as a priority in winter.",
  "at": {
   "lat": 54.6019,
   "lng": -3.1903
  },
  "path": [
   {
    "lat": 54.6019,
    "lng": -3.1903
   },
   {
    "lat": 54.5897,
    "lng": -3.1884
   },
   {
    "lat": 54.5745,
    "lng": -3.1863
   },
   {
    "lat": 54.5651,
    "lng": -3.2055
   },
   {
    "lat": 54.5591,
    "lng": -3.2264
   },
   {
    "lat": 54.548,
    "lng": -3.2461
   },
   {
    "lat": 54.5438,
    "lng": -3.2705
   },
   {
    "lat": 54.5412,
    "lng": -3.2767
   }
  ],
  "miles": 7.0,
  "start": "Braithwaite",
  "end": "Buttermere",
  "sources": [
   "https://en.wikipedia.org/wiki/Newlands_Pass",
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/north-west-england/ride/newlands-pass-keswick-cockermouth"
  ],
  "confidence": "high"
 },
 {
  "id": "ne-whinlatter",
  "kind": "drive",
  "name": "Whinlatter Pass (B5292)",
  "area": "Lake District",
  "description": "Wooded climb from Braithwaite through Whinlatter Forest, past the visitor centre, then open views down to the Lorton valley.",
  "warnings": "Hairpins and a steep start out of Braithwaite; Whinlatter Forest visitor traffic and cyclists; forest car parks are pay and display.",
  "at": {
   "lat": 54.6022,
   "lng": -3.1925
  },
  "path": [
   {
    "lat": 54.6022,
    "lng": -3.1925
   },
   {
    "lat": 54.6085,
    "lng": -3.2095
   },
   {
    "lat": 54.6093,
    "lng": -3.2343
   },
   {
    "lat": 54.6117,
    "lng": -3.2613
   },
   {
    "lat": 54.6197,
    "lng": -3.2805
   },
   {
    "lat": 54.6194,
    "lng": -3.3013
   }
  ],
  "miles": 5.5,
  "start": "Braithwaite",
  "end": "High Lorton",
  "sources": [
   "https://en.wikipedia.org/wiki/Whinlatter_Pass",
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/north-west-england/ride/b5289-keswick-cockermouth"
  ],
  "confidence": "high"
 },
 {
  "id": "ne-a684-garsdale",
  "kind": "drive",
  "name": "A684 Garsdale (Hawes to Sedbergh)",
  "area": "Yorkshire Dales",
  "description": "West from Hawes up Wensleydale to Garsdale Head, then down the long, narrow valley of Garsdale to Sedbergh.",
  "warnings": "Stone walls tight to the road and limited sightlines; farm traffic and mud, slippery in the wet; sheep; Hawes is busy on summer weekends.",
  "at": {
   "lat": 54.3042,
   "lng": -2.1965
  },
  "path": [
   {
    "lat": 54.3042,
    "lng": -2.1965
   },
   {
    "lat": 54.3111,
    "lng": -2.2172
   },
   {
    "lat": 54.3198,
    "lng": -2.2357
   },
   {
    "lat": 54.3255,
    "lng": -2.2596
   },
   {
    "lat": 54.3261,
    "lng": -2.2879
   },
   {
    "lat": 54.3291,
    "lng": -2.3147
   },
   {
    "lat": 54.3192,
    "lng": -2.3366
   },
   {
    "lat": 54.3085,
    "lng": -2.3559
   },
   {
    "lat": 54.3025,
    "lng": -2.3796
   },
   {
    "lat": 54.3011,
    "lng": -2.4044
   },
   {
    "lat": 54.3091,
    "lng": -2.426
   },
   {
    "lat": 54.3114,
    "lng": -2.4516
   },
   {
    "lat": 54.3164,
    "lng": -2.4775
   },
   {
    "lat": 54.3201,
    "lng": -2.5025
   },
   {
    "lat": 54.3236,
    "lng": -2.5284
   }
  ],
  "miles": 15.7,
  "start": "Hawes",
  "end": "Sedbergh",
  "sources": [
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/north-west-england/ride/a684-kendal-bedale"
  ],
  "confidence": "high"
 },
 {
  "id": "ne-b6270-swaledale",
  "kind": "drive",
  "name": "B6270 Swaledale",
  "area": "Yorkshire Dales",
  "description": "Over the moor from Nateby to Keld at the head of Swaledale, then down the dale through Thwaite, Muker, Gunnerside and Low Row to Reeth.",
  "warnings": "Single-track in places on the moor with passing places; cattle grids; sheep and lambs on the road; gravel and dung; narrow village sections; busy with walkers in summer.",
  "at": {
   "lat": 54.4558,
   "lng": -2.3491
  },
  "path": [
   {
    "lat": 54.4558,
    "lng": -2.3491
   },
   {
    "lat": 54.4485,
    "lng": -2.3275
   },
   {
    "lat": 54.4387,
    "lng": -2.3062
   },
   {
    "lat": 54.4284,
    "lng": -2.2863
   },
   {
    "lat": 54.4217,
    "lng": -2.2642
   },
   {
    "lat": 54.4103,
    "lng": -2.2453
   },
   {
    "lat": 54.4092,
    "lng": -2.2195
   },
   {
    "lat": 54.4077,
    "lng": -2.194
   },
   {
    "lat": 54.4046,
    "lng": -2.1688
   },
   {
    "lat": 54.3955,
    "lng": -2.1735
   },
   {
    "lat": 54.3804,
    "lng": -2.1713
   },
   {
    "lat": 54.3761,
    "lng": -2.1481
   },
   {
    "lat": 54.3739,
    "lng": -2.1224
   },
   {
    "lat": 54.3743,
    "lng": -2.0958
   },
   {
    "lat": 54.3794,
    "lng": -2.0752
   },
   {
    "lat": 54.3733,
    "lng": -2.0498
   },
   {
    "lat": 54.3793,
    "lng": -2.0252
   },
   {
    "lat": 54.3818,
    "lng": -1.9995
   },
   {
    "lat": 54.3861,
    "lng": -1.9759
   },
   {
    "lat": 54.389,
    "lng": -1.9494
   },
   {
    "lat": 54.3894,
    "lng": -1.9421
   }
  ],
  "miles": 21.6,
  "start": "Nateby (Kirkby Stephen)",
  "end": "Reeth",
  "sources": [
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/yorkshire/ride/b6270-marske-grinton-thwaite-nateby"
  ],
  "confidence": "high"
 },
 {
  "id": "ne-fleet-moss",
  "kind": "drive",
  "name": "Fleet Moss (Hawes to Buckden)",
  "area": "Yorkshire Dales",
  "description": "From Hawes through Gayle and up over Fleet Moss, then down Langstrothdale past Oughtershaw and Hubberholme to Buckden in Wharfedale.",
  "warnings": "Very steep sections on the Gayle side; narrow, mostly single-track with passing places in Langstrothdale; cattle grids and free-roaming sheep; exposed and often icy or foggy – avoid in winter.",
  "at": {
   "lat": 54.3042,
   "lng": -2.1965
  },
  "path": [
   {
    "lat": 54.3042,
    "lng": -2.1965
   },
   {
    "lat": 54.2977,
    "lng": -2.1995
   },
   {
    "lat": 54.284,
    "lng": -2.2125
   },
   {
    "lat": 54.2676,
    "lng": -2.2114
   },
   {
    "lat": 54.2535,
    "lng": -2.2138
   },
   {
    "lat": 54.2399,
    "lng": -2.2129
   },
   {
    "lat": 54.2277,
    "lng": -2.1979
   },
   {
    "lat": 54.2169,
    "lng": -2.1824
   },
   {
    "lat": 54.2108,
    "lng": -2.1587
   },
   {
    "lat": 54.2016,
    "lng": -2.138
   },
   {
    "lat": 54.2003,
    "lng": -2.1117
   },
   {
    "lat": 54.1936,
    "lng": -2.0913
   },
   {
    "lat": 54.1904,
    "lng": -2.0904
   }
  ],
  "miles": 12.6,
  "start": "Hawes",
  "end": "Buckden",
  "sources": [
   "https://en.wikipedia.org/wiki/Fleet_Moss"
  ],
  "confidence": "medium"
 },
 {
  "id": "ne-b6255-ribblehead",
  "kind": "drive",
  "name": "B6255 Ingleton to Hawes (Ribblehead)",
  "area": "Yorkshire Dales",
  "description": "Up Chapel-le-Dale past White Scar Cave to the Ribblehead Viaduct, then over Newby Head and down into Wensleydale at Hawes.",
  "warnings": "Large police presence in summer (BestBikingRoads); lambs and sheep in spring; elevation changes and crests near Hawes; visitors stopping at the viaduct; part of the Devil's Bridge riding area where locals have campaigned about speed and noise.",
  "at": {
   "lat": 54.1539,
   "lng": -2.4679
  },
  "path": [
   {
    "lat": 54.1539,
    "lng": -2.4679
   },
   {
    "lat": 54.1597,
    "lng": -2.4494
   },
   {
    "lat": 54.1725,
    "lng": -2.4301
   },
   {
    "lat": 54.1832,
    "lng": -2.4094
   },
   {
    "lat": 54.1956,
    "lng": -2.3904
   },
   {
    "lat": 54.205,
    "lng": -2.3683
   },
   {
    "lat": 54.213,
    "lng": -2.3453
   },
   {
    "lat": 54.2234,
    "lng": -2.3263
   },
   {
    "lat": 54.2373,
    "lng": -2.3154
   },
   {
    "lat": 54.2534,
    "lng": -2.3141
   },
   {
    "lat": 54.2659,
    "lng": -2.2962
   },
   {
    "lat": 54.2787,
    "lng": -2.2807
   },
   {
    "lat": 54.2896,
    "lng": -2.2606
   },
   {
    "lat": 54.2991,
    "lng": -2.2393
   },
   {
    "lat": 54.3023,
    "lng": -2.2131
   },
   {
    "lat": 54.3042,
    "lng": -2.1965
   }
  ],
  "miles": 16.5,
  "start": "Ingleton",
  "end": "Hawes",
  "sources": [
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/yorkshire/ride/b6255-ingleton-hawes"
  ],
  "confidence": "high"
 },
 {
  "id": "ne-a59-blubberhouses",
  "kind": "drive",
  "name": "A59 over Blubberhouses Moor",
  "area": "Yorkshire Dales",
  "description": "The A59 west of Harrogate over Blubberhouses Moor, past Thruscross and down to Bolton Bridge near Bolton Abbey.",
  "warnings": "Busy main road with HGVs; 50/60 mph limits and cameras; frequent police patrols at weekends (BestBikingRoads); exposed to fog and snow on the moor; Route 59 café stop at Bolton Abbey.",
  "at": {
   "lat": 54.0012,
   "lng": -1.6677
  },
  "path": [
   {
    "lat": 54.0012,
    "lng": -1.6677
   },
   {
    "lat": 53.9973,
    "lng": -1.6979
   },
   {
    "lat": 53.9929,
    "lng": -1.7238
   },
   {
    "lat": 53.9939,
    "lng": -1.7441
   },
   {
    "lat": 53.9972,
    "lng": -1.7749
   },
   {
    "lat": 53.9907,
    "lng": -1.7986
   },
   {
    "lat": 53.9879,
    "lng": -1.8251
   },
   {
    "lat": 53.9849,
    "lng": -1.8518
   },
   {
    "lat": 53.9741,
    "lng": -1.8714
   },
   {
    "lat": 53.9726,
    "lng": -1.8967
   },
   {
    "lat": 53.9761,
    "lng": -1.9079
   }
  ],
  "miles": 11.1,
  "start": "Kettlesing Head (Harrogate)",
  "end": "Bolton Bridge",
  "sources": [
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/north-west-england/ride/a59-preston-york-over-blubberhouses"
  ],
  "confidence": "high"
 },
 {
  "id": "ne-woodhead",
  "kind": "drive",
  "name": "Woodhead Pass (A628)",
  "area": "Peak District",
  "description": "The Pennine trunk road from Tintwistle along the Longdendale reservoirs and over the Woodhead Pass to the Flouch roundabout.",
  "warnings": "Very heavy HGV traffic and frequently congested; described as dangerous (Wikipedia); often closed by snow or high winds; speed cameras; Tintwistle and Hollingworth are 30 mph.",
  "at": {
   "lat": 53.4721,
   "lng": -1.9734
  },
  "path": [
   {
    "lat": 53.4721,
    "lng": -1.9734
   },
   {
    "lat": 53.4781,
    "lng": -1.9497
   },
   {
    "lat": 53.4841,
    "lng": -1.9262
   },
   {
    "lat": 53.4863,
    "lng": -1.9015
   },
   {
    "lat": 53.493,
    "lng": -1.8788
   },
   {
    "lat": 53.4957,
    "lng": -1.8543
   },
   {
    "lat": 53.4954,
    "lng": -1.8286
   },
   {
    "lat": 53.494,
    "lng": -1.8038
   },
   {
    "lat": 53.4998,
    "lng": -1.7834
   },
   {
    "lat": 53.4995,
    "lng": -1.7563
   },
   {
    "lat": 53.5058,
    "lng": -1.7363
   }
  ],
  "miles": 11.0,
  "start": "Tintwistle",
  "end": "Flouch (A616)",
  "sources": [
   "https://en.wikipedia.org/wiki/Woodhead_Pass",
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/yorkshire/ride/woodhead-snake-pass"
  ],
  "confidence": "high"
 },
 {
  "id": "ne-holme-moss",
  "kind": "drive",
  "name": "Holme Moss (A6024)",
  "area": "Peak District",
  "description": "From Holmfirth up through Holme and over Holme Moss past the transmitter mast, then down the hairpins to the Longdendale valley.",
  "warnings": "Often the first road in the area blocked by snow; steep (up to 11%) with hairpins and a sheer drop on one side; blind brow at the summit – no overtaking; sheep; poor surface out of Holmfirth (BestBikingRoads); Kirklees nuisance-vehicle PSPO covers the Holmfirth end.",
  "at": {
   "lat": 53.5704,
   "lng": -1.787
  },
  "path": [
   {
    "lat": 53.5704,
    "lng": -1.787
   },
   {
    "lat": 53.5616,
    "lng": -1.8091
   },
   {
    "lat": 53.5531,
    "lng": -1.8303
   },
   {
    "lat": 53.5445,
    "lng": -1.8468
   },
   {
    "lat": 53.5331,
    "lng": -1.8545
   },
   {
    "lat": 53.5243,
    "lng": -1.8529
   },
   {
    "lat": 53.5087,
    "lng": -1.8535
   },
   {
    "lat": 53.4954,
    "lng": -1.8635
   },
   {
    "lat": 53.4958,
    "lng": -1.8408
   },
   {
    "lat": 53.4962,
    "lng": -1.8339
   }
  ],
  "miles": 9.2,
  "start": "Holmfirth",
  "end": "Woodhead (A628)",
  "sources": [
   "https://en.wikipedia.org/wiki/Holme_Moss",
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/yorkshire/ride/a6024-b6105-woodhead-road-holmfirth-glossop"
  ],
  "confidence": "high"
 },
 {
  "id": "ne-a169-moors",
  "kind": "drive",
  "name": "A169 Pickering to Whitby",
  "area": "North York Moors",
  "description": "North across the North York Moors past the Hole of Horcum and RAF Fylingdales, then down Blue Bank to Sleights and on to Whitby.",
  "warnings": "Busy with coast traffic on summer weekends; the Saltergate bend at the Hole of Horcum is tight; Blue Bank is a steep descent; sheep on the open moor; police patrols in summer.",
  "at": {
   "lat": 54.2456,
   "lng": -0.7767
  },
  "path": [
   {
    "lat": 54.2456,
    "lng": -0.7767
   },
   {
    "lat": 54.2532,
    "lng": -0.7531
   },
   {
    "lat": 54.2615,
    "lng": -0.7285
   },
   {
    "lat": 54.275,
    "lng": -0.7146
   },
   {
    "lat": 54.2889,
    "lng": -0.7041
   },
   {
    "lat": 54.3037,
    "lng": -0.6955
   },
   {
    "lat": 54.3204,
    "lng": -0.6913
   },
   {
    "lat": 54.3352,
    "lng": -0.6944
   },
   {
    "lat": 54.3495,
    "lng": -0.6864
   },
   {
    "lat": 54.3661,
    "lng": -0.6844
   },
   {
    "lat": 54.3814,
    "lng": -0.6826
   },
   {
    "lat": 54.397,
    "lng": -0.6773
   },
   {
    "lat": 54.4138,
    "lng": -0.6849
   },
   {
    "lat": 54.4301,
    "lng": -0.6736
   },
   {
    "lat": 54.4448,
    "lng": -0.6627
   },
   {
    "lat": 54.4589,
    "lng": -0.6634
   },
   {
    "lat": 54.4736,
    "lng": -0.6569
   },
   {
    "lat": 54.4773,
    "lng": -0.6588
   }
  ],
  "miles": 18.6,
  "start": "Pickering",
  "end": "Whitby (A171)",
  "sources": [
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/yorkshire/ride/a169-whitby-pickering"
  ],
  "confidence": "high"
 },
 {
  "id": "ne-blakey-ridge",
  "kind": "drive",
  "name": "Blakey Ridge (Hutton-le-Hole to Castleton)",
  "area": "North York Moors",
  "description": "Minor road along the top of Blakey Ridge, past the Lion Inn, between Farndale and Rosedale, dropping into Esk Dale at Castleton.",
  "warnings": "Free-roaming sheep across the whole ridge; walkers; often poor condition; cattle grids; police seen near the A171 end (BestBikingRoads); avoid Rosedale Chimney Bank (1 in 3) off this route.",
  "at": {
   "lat": 54.3005,
   "lng": -0.9189
  },
  "path": [
   {
    "lat": 54.3005,
    "lng": -0.9189
   },
   {
    "lat": 54.3147,
    "lng": -0.9308
   },
   {
    "lat": 54.3304,
    "lng": -0.935
   },
   {
    "lat": 54.3459,
    "lng": -0.9401
   },
   {
    "lat": 54.3608,
    "lng": -0.9446
   },
   {
    "lat": 54.3765,
    "lng": -0.9482
   },
   {
    "lat": 54.3913,
    "lng": -0.9566
   },
   {
    "lat": 54.4067,
    "lng": -0.9602
   },
   {
    "lat": 54.4216,
    "lng": -0.9492
   },
   {
    "lat": 54.4378,
    "lng": -0.9443
   },
   {
    "lat": 54.4544,
    "lng": -0.95
   },
   {
    "lat": 54.4634,
    "lng": -0.9403
   }
  ],
  "miles": 12.2,
  "start": "Hutton-le-Hole",
  "end": "Castleton",
  "sources": [
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/yorkshire/ride/hutton-le-hole-castleton-blakey-ridge"
  ],
  "confidence": "high"
 },
 {
  "id": "ne-trough-of-bowland",
  "kind": "drive",
  "name": "Trough of Bowland",
  "area": "Lancashire",
  "description": "Through the Forest of Bowland from Dunsop Bridge up the Trough to the summit, then across the moor past Jubilee Tower and down to Lancaster.",
  "warnings": "Steep, narrow and twisty; unfenced moorland with sheep and cattle grids; popular with cyclists and walkers; few passing places near the summit; not a priority for gritting.",
  "at": {
   "lat": 53.9458,
   "lng": -2.5183
  },
  "path": [
   {
    "lat": 53.9458,
    "lng": -2.5183
   },
   {
    "lat": 53.9504,
    "lng": -2.5425
   },
   {
    "lat": 53.9581,
    "lng": -2.5652
   },
   {
    "lat": 53.9715,
    "lng": -2.576
   },
   {
    "lat": 53.9793,
    "lng": -2.5979
   },
   {
    "lat": 53.9807,
    "lng": -2.6056
   },
   {
    "lat": 53.9756,
    "lng": -2.6269
   },
   {
    "lat": 53.9845,
    "lng": -2.6442
   },
   {
    "lat": 53.9933,
    "lng": -2.6663
   },
   {
    "lat": 54.0034,
    "lng": -2.686
   },
   {
    "lat": 54.0136,
    "lng": -2.7049
   },
   {
    "lat": 54.0229,
    "lng": -2.7265
   },
   {
    "lat": 54.0287,
    "lng": -2.7495
   },
   {
    "lat": 54.0375,
    "lng": -2.7685
   },
   {
    "lat": 54.048,
    "lng": -2.7901
   }
  ],
  "miles": 15.7,
  "start": "Dunsop Bridge",
  "end": "Lancaster (Quernmore)",
  "sources": [
   "https://en.wikipedia.org/wiki/Trough_of_Bowland",
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/north-west-england/ride/prestwich-trough-of-bowland-lancaster"
  ],
  "confidence": "high"
 },
 {
  "id": "ne-a6-shap",
  "kind": "drive",
  "name": "A6 over Shap",
  "area": "Cumbria",
  "description": "The old main road north over Shap Fell, the route the M6 replaced: a long climb from Kendal to Shap Summit, then Shap village and on to Penrith.",
  "warnings": "Exposed and often impassable in snow (Wikipedia); camera van reported near Kendal and police on the fast sections (BestBikingRoads); quarry lorries near Shap.",
  "at": {
   "lat": 54.342,
   "lng": -2.735
  },
  "path": [
   {
    "lat": 54.342,
    "lng": -2.735
   },
   {
    "lat": 54.3537,
    "lng": -2.7271
   },
   {
    "lat": 54.3695,
    "lng": -2.7242
   },
   {
    "lat": 54.3828,
    "lng": -2.7317
   },
   {
    "lat": 54.3953,
    "lng": -2.7159
   },
   {
    "lat": 54.4046,
    "lng": -2.6977
   },
   {
    "lat": 54.4184,
    "lng": -2.6973
   },
   {
    "lat": 54.4323,
    "lng": -2.691
   },
   {
    "lat": 54.4477,
    "lng": -2.6897
   },
   {
    "lat": 54.4588,
    "lng": -2.6909
   },
   {
    "lat": 54.4702,
    "lng": -2.6732
   },
   {
    "lat": 54.4861,
    "lng": -2.673
   },
   {
    "lat": 54.5019,
    "lng": -2.6712
   },
   {
    "lat": 54.5178,
    "lng": -2.6698
   },
   {
    "lat": 54.532,
    "lng": -2.678
   },
   {
    "lat": 54.5482,
    "lng": -2.6838
   },
   {
    "lat": 54.5641,
    "lng": -2.6875
   },
   {
    "lat": 54.5791,
    "lng": -2.6958
   },
   {
    "lat": 54.5948,
    "lng": -2.701
   },
   {
    "lat": 54.6075,
    "lng": -2.7165
   },
   {
    "lat": 54.6234,
    "lng": -2.7162
   },
   {
    "lat": 54.6377,
    "lng": -2.7272
   },
   {
    "lat": 54.65,
    "lng": -2.7403
   }
  ],
  "miles": 24.7,
  "start": "Kendal",
  "end": "Penrith",
  "sources": [
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/north-west-england/ride/a6-kendal-penrith",
   "https://en.wikipedia.org/wiki/Shap_Summit"
  ],
  "confidence": "high"
 },
 {
  "id": "ne-military-road",
  "kind": "drive",
  "name": "Military Road (B6318) along Hadrian's Wall",
  "area": "Northumberland",
  "description": "The 18th-century Military Road west along Hadrian's Wall, past Brocolitia, Housesteads, The Sill and Cawfields.",
  "warnings": "Rollercoaster dips and blind summits hide oncoming traffic – overtake with great care; walkers crossing at Wall car parks; Housesteads and Steel Rigg car parks very busy in summer; sheep.",
  "at": {
   "lat": 55.031,
   "lng": -2.1285
  },
  "path": [
   {
    "lat": 55.031,
    "lng": -2.1285
   },
   {
    "lat": 55.0289,
    "lng": -2.1511
   },
   {
    "lat": 55.0344,
    "lng": -2.1775
   },
   {
    "lat": 55.0368,
    "lng": -2.2093
   },
   {
    "lat": 55.0341,
    "lng": -2.2371
   },
   {
    "lat": 55.0305,
    "lng": -2.266
   },
   {
    "lat": 55.0236,
    "lng": -2.2935
   },
   {
    "lat": 55.0115,
    "lng": -2.3195
   },
   {
    "lat": 55.0044,
    "lng": -2.3456
   },
   {
    "lat": 54.9988,
    "lng": -2.3718
   },
   {
    "lat": 54.9955,
    "lng": -2.3942
   },
   {
    "lat": 54.9911,
    "lng": -2.421
   },
   {
    "lat": 54.9877,
    "lng": -2.4481
   },
   {
    "lat": 54.9839,
    "lng": -2.4765
   },
   {
    "lat": 54.9814,
    "lng": -2.5048
   },
   {
    "lat": 54.9875,
    "lng": -2.5134
   },
   {
    "lat": 54.9942,
    "lng": -2.4897
   }
  ],
  "miles": 18.6,
  "start": "Chollerford",
  "end": "Greenhead",
  "sources": [
   "https://en.wikipedia.org/wiki/Military_Road_(Northumberland)"
  ],
  "confidence": "medium"
 },
 {
  "id": "ne-a68-carter-bar",
  "kind": "drive",
  "name": "A68 to Carter Bar",
  "area": "Northumberland",
  "description": "From Otterburn up Redesdale past Catcleugh Reservoir and Byrness to the border viewpoint at Carter Bar.",
  "warnings": "Hidden dips and blind summits; military ranges (Otterburn) beside the road – obey red flags and don't stop at range gates; snow closures at Carter Bar even in spring and autumn (Wikipedia); HGVs.",
  "at": {
   "lat": 55.2319,
   "lng": -2.1809
  },
  "path": [
   {
    "lat": 55.2319,
    "lng": -2.1809
   },
   {
    "lat": 55.2395,
    "lng": -2.205
   },
   {
    "lat": 55.2516,
    "lng": -2.221
   },
   {
    "lat": 55.263,
    "lng": -2.2409
   },
   {
    "lat": 55.2739,
    "lng": -2.2612
   },
   {
    "lat": 55.283,
    "lng": -2.285
   },
   {
    "lat": 55.292,
    "lng": -2.3079
   },
   {
    "lat": 55.2972,
    "lng": -2.3349
   },
   {
    "lat": 55.3091,
    "lng": -2.3521
   },
   {
    "lat": 55.3187,
    "lng": -2.3735
   },
   {
    "lat": 55.3221,
    "lng": -2.3898
   },
   {
    "lat": 55.3254,
    "lng": -2.4171
   },
   {
    "lat": 55.3333,
    "lng": -2.4413
   },
   {
    "lat": 55.3421,
    "lng": -2.464
   },
   {
    "lat": 55.3544,
    "lng": -2.4777
   }
  ],
  "miles": 15.7,
  "start": "Otterburn",
  "end": "Carter Bar (Scottish border)",
  "sources": [
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/north-east-england/ride/a68-crook-jedburgh-dalkeith",
   "https://en.wikipedia.org/wiki/Carter_Bar"
  ],
  "confidence": "high"
 },
 {
  "id": "ne-kielder",
  "kind": "drive",
  "name": "Bellingham to Kielder",
  "area": "Northumberland",
  "description": "Up the North Tyne valley through Falstone and along the north shore of Kielder Water to Kielder village and castle.",
  "warnings": "Remote with no fuel at Kielder – fill up in Bellingham; timber lorries; deer and red squirrels; the Kielder Forest Drive is a separate gravel toll road, not this route; dark skies park so no street lighting.",
  "at": {
   "lat": 55.1445,
   "lng": -2.2549
  },
  "path": [
   {
    "lat": 55.1445,
    "lng": -2.2549
   },
   {
    "lat": 55.1483,
    "lng": -2.2785
   },
   {
    "lat": 55.1574,
    "lng": -2.2998
   },
   {
    "lat": 55.165,
    "lng": -2.3258
   },
   {
    "lat": 55.1662,
    "lng": -2.3481
   },
   {
    "lat": 55.1663,
    "lng": -2.3739
   },
   {
    "lat": 55.1654,
    "lng": -2.4008
   },
   {
    "lat": 55.1687,
    "lng": -2.4275
   },
   {
    "lat": 55.1775,
    "lng": -2.4502
   },
   {
    "lat": 55.1726,
    "lng": -2.4766
   },
   {
    "lat": 55.1643,
    "lng": -2.4978
   },
   {
    "lat": 55.1661,
    "lng": -2.5257
   },
   {
    "lat": 55.1814,
    "lng": -2.5393
   },
   {
    "lat": 55.197,
    "lng": -2.5448
   },
   {
    "lat": 55.2089,
    "lng": -2.563
   },
   {
    "lat": 55.2185,
    "lng": -2.5853
   },
   {
    "lat": 55.234,
    "lng": -2.5799
   }
  ],
  "miles": 18.3,
  "start": "Bellingham",
  "end": "Kielder village",
  "sources": [
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/north-east-england/ride/shilling-pot-bellingham-kielder-kielder-water",
   "https://www.visitkielder.com/"
  ],
  "confidence": "high"
 },
 {
  "id": "ne-northumberland-coast",
  "kind": "drive",
  "name": "Northumberland coast (B1339/B1340)",
  "area": "Northumberland",
  "description": "Coast-and-castles B-roads from Alnmouth through Longhoughton, Embleton, Beadnell and Seahouses to Bamburgh Castle.",
  "warnings": "Narrow in places with tractors and caravans; Seahouses and Bamburgh very busy in summer; village 30 mph limits; pay car parks.",
  "at": {
   "lat": 55.3929,
   "lng": -1.6366
  },
  "path": [
   {
    "lat": 55.3929,
    "lng": -1.6366
   },
   {
    "lat": 55.4014,
    "lng": -1.6264
   },
   {
    "lat": 55.4157,
    "lng": -1.6175
   },
   {
    "lat": 55.4309,
    "lng": -1.6166
   },
   {
    "lat": 55.4364,
    "lng": -1.6205
   },
   {
    "lat": 55.4501,
    "lng": -1.6222
   },
   {
    "lat": 55.4613,
    "lng": -1.6403
   },
   {
    "lat": 55.4763,
    "lng": -1.6446
   },
   {
    "lat": 55.491,
    "lng": -1.64
   },
   {
    "lat": 55.5037,
    "lng": -1.6385
   },
   {
    "lat": 55.5184,
    "lng": -1.6486
   },
   {
    "lat": 55.5321,
    "lng": -1.6604
   },
   {
    "lat": 55.5463,
    "lng": -1.6642
   },
   {
    "lat": 55.5538,
    "lng": -1.6452
   },
   {
    "lat": 55.5554,
    "lng": -1.6396
   },
   {
    "lat": 55.5681,
    "lng": -1.6438
   },
   {
    "lat": 55.5815,
    "lng": -1.6536
   },
   {
    "lat": 55.5885,
    "lng": -1.6705
   },
   {
    "lat": 55.6004,
    "lng": -1.6884
   },
   {
    "lat": 55.6073,
    "lng": -1.7141
   }
  ],
  "miles": 21.4,
  "start": "Alnmouth",
  "end": "Bamburgh",
  "sources": [
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/north-east-england/ride/coast-and-castles-wooler-seahouses"
  ],
  "confidence": "medium"
 },
 {
  "id": "ne-a689-weardale",
  "kind": "drive",
  "name": "A689 Weardale and Killhope",
  "area": "North Pennines",
  "description": "Up Weardale through St John's Chapel and Cowshill, over Killhope Cross and down through Nenthead to Alston.",
  "warnings": "Snow gates and frequent winter closures; mud and muck on the road; tight bend at Nenthead (BestBikingRoads); sheep; stop-start through the dale villages.",
  "at": {
   "lat": 54.7476,
   "lng": -2.0068
  },
  "path": [
   {
    "lat": 54.7476,
    "lng": -2.0068
   },
   {
    "lat": 54.747,
    "lng": -2.0319
   },
   {
    "lat": 54.745,
    "lng": -2.0586
   },
   {
    "lat": 54.7419,
    "lng": -2.0863
   },
   {
    "lat": 54.7376,
    "lng": -2.114
   },
   {
    "lat": 54.738,
    "lng": -2.1415
   },
   {
    "lat": 54.7358,
    "lng": -2.1674
   },
   {
    "lat": 54.7405,
    "lng": -2.1936
   },
   {
    "lat": 54.7475,
    "lng": -2.2161
   },
   {
    "lat": 54.7609,
    "lng": -2.2264
   },
   {
    "lat": 54.77,
    "lng": -2.247
   },
   {
    "lat": 54.781,
    "lng": -2.2664
   },
   {
    "lat": 54.7841,
    "lng": -2.2921
   },
   {
    "lat": 54.7842,
    "lng": -2.32
   },
   {
    "lat": 54.7886,
    "lng": -2.3439
   },
   {
    "lat": 54.7994,
    "lng": -2.365
   },
   {
    "lat": 54.8082,
    "lng": -2.3863
   },
   {
    "lat": 54.8104,
    "lng": -2.4136
   },
   {
    "lat": 54.8125,
    "lng": -2.441
   }
  ],
  "miles": 20.3,
  "start": "Stanhope",
  "end": "Alston",
  "sources": [
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/north-east-england/ride/a689-wolsingham-brampton",
   "https://en.wikipedia.org/wiki/Killhope"
  ],
  "confidence": "high"
 },
 {
  "id": "ne-b6277-teesdale",
  "kind": "drive",
  "name": "B6277 Teesdale and Yad Moss",
  "area": "North Pennines",
  "description": "Up Teesdale past Bowlees and High Force, then over the open moor at Yad Moss and down to Alston.",
  "warnings": "Very bumpy beyond the last houses; suicidal sheep (BestBikingRoads); exposed and snow-prone over Yad Moss; cattle grids.",
  "at": {
   "lat": 54.6238,
   "lng": -2.083
  },
  "path": [
   {
    "lat": 54.6238,
    "lng": -2.083
   },
   {
    "lat": 54.6297,
    "lng": -2.1043
   },
   {
    "lat": 54.639,
    "lng": -2.1265
   },
   {
    "lat": 54.648,
    "lng": -2.1483
   },
   {
    "lat": 54.6513,
    "lng": -2.1754
   },
   {
    "lat": 54.659,
    "lng": -2.1989
   },
   {
    "lat": 54.6698,
    "lng": -2.2197
   },
   {
    "lat": 54.6805,
    "lng": -2.2383
   },
   {
    "lat": 54.6892,
    "lng": -2.2615
   },
   {
    "lat": 54.7021,
    "lng": -2.2771
   },
   {
    "lat": 54.7122,
    "lng": -2.2964
   },
   {
    "lat": 54.7099,
    "lng": -2.3202
   },
   {
    "lat": 54.717,
    "lng": -2.3417
   },
   {
    "lat": 54.7307,
    "lng": -2.3544
   },
   {
    "lat": 54.7453,
    "lng": -2.3667
   },
   {
    "lat": 54.7596,
    "lng": -2.3781
   },
   {
    "lat": 54.7734,
    "lng": -2.3913
   },
   {
    "lat": 54.7817,
    "lng": -2.4098
   },
   {
    "lat": 54.794,
    "lng": -2.4246
   },
   {
    "lat": 54.8086,
    "lng": -2.4343
   },
   {
    "lat": 54.8125,
    "lng": -2.441
   }
  ],
  "miles": 21.9,
  "start": "Middleton-in-Teesdale",
  "end": "Alston",
  "sources": [
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/north-east-england/ride/b6277-middleton-in-teesdale-alston"
  ],
  "confidence": "high"
 },
 {
  "id": "ne-a166-garrowby",
  "kind": "drive",
  "name": "A166 Garrowby Hill and the Wolds",
  "area": "Yorkshire Wolds",
  "description": "East from Stamford Bridge up Garrowby Hill onto the Yorkshire Wolds, then over the top through Fridaythorpe and Wetwang to Driffield.",
  "warnings": "Steep climb and descent at Garrowby Hill; HGVs and tractors; poor surface near Driffield and queues behind lorries (BestBikingRoads).",
  "at": {
   "lat": 53.9906,
   "lng": -0.9133
  },
  "path": [
   {
    "lat": 53.9906,
    "lng": -0.9133
   },
   {
    "lat": 53.9976,
    "lng": -0.8904
   },
   {
    "lat": 53.9979,
    "lng": -0.8643
   },
   {
    "lat": 53.9976,
    "lng": -0.8378
   },
   {
    "lat": 53.9993,
    "lng": -0.8105
   },
   {
    "lat": 54.0001,
    "lng": -0.7844
   },
   {
    "lat": 54.0016,
    "lng": -0.7562
   },
   {
    "lat": 54.0004,
    "lng": -0.7289
   },
   {
    "lat": 54.0062,
    "lng": -0.7036
   },
   {
    "lat": 54.0138,
    "lng": -0.6752
   },
   {
    "lat": 54.0199,
    "lng": -0.6522
   },
   {
    "lat": 54.0198,
    "lng": -0.6251
   },
   {
    "lat": 54.0185,
    "lng": -0.5968
   },
   {
    "lat": 54.0207,
    "lng": -0.5697
   },
   {
    "lat": 54.0213,
    "lng": -0.5422
   },
   {
    "lat": 54.0243,
    "lng": -0.514
   },
   {
    "lat": 54.0164,
    "lng": -0.49
   },
   {
    "lat": 54.0098,
    "lng": -0.4652
   },
   {
    "lat": 54.0077,
    "lng": -0.4414
   },
   {
    "lat": 54.005,
    "lng": -0.4391
   }
  ],
  "miles": 20.8,
  "start": "Stamford Bridge",
  "end": "Driffield",
  "sources": [
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/yorkshire/ride/a166-a165-a171-a170-a61-harrogate-bridlington-whitby-return",
   "https://en.wikipedia.org/wiki/Garrowby_Hill"
  ],
  "confidence": "high"
 },
 {
  "id": "ne-b1225-wolds",
  "kind": "drive",
  "name": "Caistor High Street (B1225)",
  "area": "Lincolnshire Wolds",
  "description": "The ridge-top \"High Street\" along the Lincolnshire Wolds from Caistor south past Belmont mast to the A158 near Horncastle.",
  "warnings": "Hidden crossroads on fast bends; mud from a motocross track near Belmont at weekends; popular with police including unmarked bikes (BestBikingRoads).",
  "at": {
   "lat": 53.4969,
   "lng": -0.3155
  },
  "path": [
   {
    "lat": 53.4969,
    "lng": -0.3155
   },
   {
    "lat": 53.4843,
    "lng": -0.3008
   },
   {
    "lat": 53.4681,
    "lng": -0.296
   },
   {
    "lat": 53.4528,
    "lng": -0.2889
   },
   {
    "lat": 53.4391,
    "lng": -0.2753
   },
   {
    "lat": 53.4256,
    "lng": -0.2639
   },
   {
    "lat": 53.4177,
    "lng": -0.2395
   },
   {
    "lat": 53.4022,
    "lng": -0.231
   },
   {
    "lat": 53.3859,
    "lng": -0.2235
   },
   {
    "lat": 53.3737,
    "lng": -0.2064
   },
   {
    "lat": 53.3603,
    "lng": -0.1924
   },
   {
    "lat": 53.3461,
    "lng": -0.1799
   },
   {
    "lat": 53.3306,
    "lng": -0.1783
   },
   {
    "lat": 53.3146,
    "lng": -0.1737
   },
   {
    "lat": 53.2992,
    "lng": -0.1657
   },
   {
    "lat": 53.2834,
    "lng": -0.1624
   },
   {
    "lat": 53.2685,
    "lng": -0.1695
   },
   {
    "lat": 53.2535,
    "lng": -0.166
   },
   {
    "lat": 53.2465,
    "lng": -0.1617
   }
  ],
  "miles": 19.7,
  "start": "Caistor",
  "end": "Baumber (A158)",
  "sources": [
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/east-midlands/ride/b1225-horncastle-caistor-lincolnshire-wolds"
  ],
  "confidence": "high"
 },
 {
  "id": "ne-a5004-long-hill",
  "kind": "drive",
  "name": "Long Hill (A5004)",
  "area": "Peak District",
  "description": "From Buxton over Long Hill above the Goyt Valley and down to Whaley Bridge.",
  "warnings": "A bend about halfway tightens sharply; deer can jump from the banks; cyclists; stone walls.",
  "at": {
   "lat": 53.2602,
   "lng": -1.92
  },
  "path": [
   {
    "lat": 53.2602,
    "lng": -1.92
   },
   {
    "lat": 53.2699,
    "lng": -1.9379
   },
   {
    "lat": 53.2789,
    "lng": -1.9507
   },
   {
    "lat": 53.2828,
    "lng": -1.9654
   },
   {
    "lat": 53.2963,
    "lng": -1.9741
   },
   {
    "lat": 53.3104,
    "lng": -1.9807
   },
   {
    "lat": 53.3235,
    "lng": -1.9851
   },
   {
    "lat": 53.3302,
    "lng": -1.9834
   }
  ],
  "miles": 7.2,
  "start": "Buxton",
  "end": "Whaley Bridge",
  "sources": [
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/north-west-england/ride/a5004-buxton-whaley-bridge"
  ],
  "confidence": "high"
 },
 {
  "id": "ne-a54",
  "kind": "drive",
  "name": "A54 Congleton to the Cat and Fiddle",
  "area": "Peak District",
  "description": "From Congleton past Bosley and up through Wildboarclough country to meet the A537 near the Cat and Fiddle.",
  "warnings": "Average-speed cameras on the top section near the Cat and Fiddle; HGVs take the middle of the road on blind bends; sheep; roadworks – a section reopened in Oct 2026 with more work planned for spring 2027 (check before you go).",
  "at": {
   "lat": 53.1633,
   "lng": -2.2108
  },
  "path": [
   {
    "lat": 53.1633,
    "lng": -2.2108
   },
   {
    "lat": 53.1717,
    "lng": -2.1952
   },
   {
    "lat": 53.1783,
    "lng": -2.1744
   },
   {
    "lat": 53.1915,
    "lng": -2.162
   },
   {
    "lat": 53.1952,
    "lng": -2.1381
   },
   {
    "lat": 53.1927,
    "lng": -2.1167
   },
   {
    "lat": 53.2004,
    "lng": -2.0959
   },
   {
    "lat": 53.2025,
    "lng": -2.0741
   },
   {
    "lat": 53.1992,
    "lng": -2.051
   },
   {
    "lat": 53.2048,
    "lng": -2.0339
   },
   {
    "lat": 53.2123,
    "lng": -2.0114
   },
   {
    "lat": 53.2225,
    "lng": -1.9931
   },
   {
    "lat": 53.234,
    "lng": -1.9738
   },
   {
    "lat": 53.2395,
    "lng": -1.9504
   }
  ],
  "miles": 14.5,
  "start": "Congleton",
  "end": "A537 junction (Cat and Fiddle)",
  "sources": [
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/north-west-england/ride/a54-congleton-buxton"
  ],
  "confidence": "medium"
 },
 {
  "id": "ne-p-ribblehead",
  "kind": "photo",
  "name": "Ribblehead Viaduct",
  "area": "Yorkshire Dales",
  "description": "The 24-arch Settle–Carlisle railway viaduct under Whernside, at the B6255/B5479 junction. One of the classic Dales views; midway stop on the B6255.",
  "warnings": "Park only in the marked area by the junction or the station car park – not on the verges; very busy at weekends; the road beside the viaduct is narrow.",
  "at": {
   "lat": 54.2059,
   "lng": -2.3609
  },
  "sources": [
   "https://en.wikipedia.org/wiki/Ribblehead_Viaduct",
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/yorkshire/ride/b6255-ingleton-hawes"
  ],
  "confidence": "medium"
 },
 {
  "id": "ne-p-buttertubs",
  "kind": "photo",
  "name": "Buttertubs Pass summit",
  "area": "Yorkshire Dales",
  "description": "Lay-bys at the top of the Buttertubs road beside the 20 m limestone potholes. The Tour de France 2014 climb, with views down to Swaledale.",
  "warnings": "Small lay-bys only – pull fully off; unfenced drops; don't block the narrow road.",
  "at": {
   "lat": 54.3552,
   "lng": -2.2048
  },
  "sources": [
   "https://en.wikipedia.org/wiki/Buttertubs_Pass"
  ],
  "confidence": "high"
 },
 {
  "id": "ne-p-malham",
  "kind": "photo",
  "name": "Malham (National Park Centre)",
  "area": "Yorkshire Dales",
  "description": "National Park car park in Malham village, the start of the walk to Malham Cove. Limestone cove and village scenery.",
  "warnings": "Pay car park that fills early in summer; narrow lanes into Malham – no roadside parking.",
  "at": {
   "lat": 54.0599,
   "lng": -2.1537
  },
  "sources": [
   "https://en.wikipedia.org/wiki/Malham_Cove",
   "https://www.yorkshiredales.org.uk/"
  ],
  "confidence": "high"
 },
 {
  "id": "ne-p-cow-and-calf",
  "kind": "photo",
  "name": "Cow and Calf, Ilkley Moor",
  "area": "West Yorkshire",
  "description": "Car park beside the Cow and Calf rocks above Ilkley, looking over Wharfedale. Famous gritstone rocks and a wide valley view.",
  "warnings": "Small car park, busy at weekends; inside the Bradford district vehicle-nuisance PSPO area – no meets, revving or stunts.",
  "at": {
   "lat": 53.9165,
   "lng": -1.8001
  },
  "sources": [
   "https://en.wikipedia.org/wiki/Ilkley_Moor"
  ],
  "confidence": "high"
 },
 {
  "id": "ne-p-chevin",
  "kind": "photo",
  "name": "Surprise View, Otley Chevin",
  "area": "West Yorkshire",
  "description": "Surprise View car park on the Chevin above Otley, looking north over Wharfedale. Wide elevated view over the valley.",
  "warnings": "Small car park; local residents nearby – no gatherings; check closing times.",
  "at": {
   "lat": 53.8929,
   "lng": -1.6903
  },
  "sources": [
   "https://en.wikipedia.org/wiki/Otley_Chevin"
  ],
  "confidence": "medium"
 },
 {
  "id": "ne-p-hole-of-horcum",
  "kind": "photo",
  "name": "Hole of Horcum (Saltergate)",
  "area": "North York Moors",
  "description": "National Park car park beside the A169 above the Hole of Horcum hollow. Big moorland bowl right on the A169 drive.",
  "warnings": "Pay car park; the A169 is fast here – take care pulling in and out; busy at weekends.",
  "at": {
   "lat": 54.332,
   "lng": -0.6906
  },
  "sources": [
   "https://en.wikipedia.org/wiki/Hole_of_Horcum",
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/yorkshire/ride/a169-whitby-pickering"
  ],
  "confidence": "medium"
 },
 {
  "id": "ne-p-whitby-abbey",
  "kind": "photo",
  "name": "Whitby Abbey headland",
  "area": "North York Moors",
  "description": "Abbey Headland car park next to the English Heritage abbey ruins above Whitby. Gothic ruins with the harbour below.",
  "warnings": "Pay car park; Whitby is very busy in summer and during Goth Weekends; narrow streets in the old town.",
  "at": {
   "lat": 54.4861,
   "lng": -0.6047
  },
  "sources": [
   "https://www.english-heritage.org.uk/visit/places/whitby-abbey/"
  ],
  "confidence": "high"
 },
 {
  "id": "ne-p-roseberry",
  "kind": "photo",
  "name": "Roseberry Topping (Gribdale Gate)",
  "area": "North York Moors",
  "description": "Gribdale Gate picnic site and car park on the moor edge between Roseberry Topping and Captain Cook's Monument. National Trust hill with a distinctive half-cone summit.",
  "warnings": "Narrow, steep lane from Great Ayton; small car park; walkers.",
  "at": {
   "lat": 54.4908,
   "lng": -1.0874
  },
  "sources": [
   "https://www.nationaltrust.org.uk/visit/yorkshire/roseberry-topping"
  ],
  "confidence": "medium"
 },
 {
  "id": "ne-p-saltburn",
  "kind": "photo",
  "name": "Saltburn Pier",
  "area": "Teesside",
  "description": "Victorian pier and cliff lift with lower-promenade parking. The last pleasure pier in Yorkshire, with the cliff tramway behind.",
  "warnings": "Pay parking; steep access road; busy summer weekends.",
  "at": {
   "lat": 54.5869,
   "lng": -0.9703
  },
  "sources": [
   "https://en.wikipedia.org/wiki/Saltburn_Pier"
  ],
  "confidence": "high"
 },
 {
  "id": "ne-p-flamborough",
  "kind": "photo",
  "name": "Flamborough Head lighthouse",
  "area": "Yorkshire Wolds",
  "description": "Car park at the lighthouse on the chalk headland. White cliffs, sea stacks and the lighthouse.",
  "warnings": "Pay car park; exposed in bad weather; keep back from cliff edges.",
  "at": {
   "lat": 54.1162,
   "lng": -0.0834
  },
  "sources": [
   "https://en.wikipedia.org/wiki/Flamborough_Head"
  ],
  "confidence": "high"
 },
 {
  "id": "ne-p-humber-bridge",
  "kind": "photo",
  "name": "Humber Bridge viewing area",
  "area": "Lincolnshire",
  "description": "Viewing area and car park at the south (Barton) end of the Humber Bridge. Big suspension-bridge backdrop.",
  "warnings": "Check car park hours; no gatherings.",
  "at": {
   "lat": 53.6969,
   "lng": -0.4448
  },
  "sources": [
   "https://en.wikipedia.org/wiki/Humber_Bridge"
  ],
  "confidence": "high"
 },
 {
  "id": "ne-p-surprise-view",
  "kind": "photo",
  "name": "Surprise View, Hathersage",
  "area": "Peak District",
  "description": "National Trust car park on the A6187 above Hathersage, looking across the Hope Valley. One of the best-known Peak District viewpoints, by Millstone Edge.",
  "warnings": "Pay car park (NT members free); busy at weekends; the A6187 bend here is fast.",
  "at": {
   "lat": 53.3172,
   "lng": -1.6231
  },
  "sources": [
   "https://www.nationaltrust.org.uk/visit/peak-district/longshaw-burbage-and-the-eastern-moors"
  ],
  "confidence": "high"
 },
 {
  "id": "ne-p-stanage",
  "kind": "photo",
  "name": "Stanage Edge (Hook's Car)",
  "area": "Peak District",
  "description": "Hook's Car car park below Stanage Edge, north of Hathersage. Long gritstone edge with views over the Hope Valley.",
  "warnings": "Pay car park; narrow lanes; climbers and walkers.",
  "at": {
   "lat": 53.3429,
   "lng": -1.6342
  },
  "sources": [
   "https://www.nationaltrust.org.uk/visit/peak-district/stanage-and-north-lees",
   "https://en.wikipedia.org/wiki/Stanage_Edge"
  ],
  "confidence": "high"
 },
 {
  "id": "ne-p-ashness-bridge",
  "kind": "photo",
  "name": "Ashness Bridge",
  "area": "Lake District",
  "description": "Packhorse bridge on the Watendlath road above Derwentwater, with the classic view to Skiddaw. One of the most photographed views in the Lake District.",
  "warnings": "Single-track road off the B5289 with few passing places; tiny car park just above the bridge – don't block the road or bridge.",
  "at": {
   "lat": 54.5672,
   "lng": -3.13
  },
  "sources": [
   "https://en.wikipedia.org/wiki/Ashness_Bridge"
  ],
  "confidence": "medium"
 },
 {
  "id": "ne-p-honister",
  "kind": "photo",
  "name": "Honister Slate Mine",
  "area": "Lake District",
  "description": "Car park at the slate mine on the summit of Honister Pass. Top of the Honister drive with views down both valleys.",
  "warnings": "Pay car park; busy with visitors and walkers.",
  "at": {
   "lat": 54.5112,
   "lng": -3.1992
  },
  "sources": [
   "https://www.honister.com/",
   "https://en.wikipedia.org/wiki/Honister_Pass"
  ],
  "confidence": "high"
 },
 {
  "id": "ne-p-castlerigg",
  "kind": "photo",
  "name": "Castlerigg Stone Circle",
  "area": "Lake District",
  "description": "Neolithic stone circle above Keswick with roadside lay-by parking. Stones with a ring of fells behind.",
  "warnings": "Narrow lane – park only in the lay-by; no vehicles on the grass; English Heritage site.",
  "at": {
   "lat": 54.6029,
   "lng": -3.0984
  },
  "sources": [
   "https://www.english-heritage.org.uk/visit/places/castlerigg-stone-circle/"
  ],
  "confidence": "medium"
 },
 {
  "id": "ne-p-wasdale",
  "kind": "photo",
  "name": "Wast Water (Overbeck Bridge)",
  "area": "Lake District",
  "description": "National Trust car park at Overbeck Bridge on the Wast Water shore road, facing the screes and Great Gable. Wast Water is England's deepest lake; a famous mountain view.",
  "warnings": "Remote, narrow dead-end valley road with no fuel; small pay car park; sheep.",
  "at": {
   "lat": 54.4497,
   "lng": -3.285
  },
  "sources": [
   "https://www.nationaltrust.org.uk/visit/lake-district/wasdale",
   "https://en.wikipedia.org/wiki/Wast_Water"
  ],
  "confidence": "medium"
 },
 {
  "id": "ne-p-jubilee-tower",
  "kind": "photo",
  "name": "Jubilee Tower, Quernmore",
  "area": "Lancashire",
  "description": "Car park by the Jubilee Tower on the Trough of Bowland road above Lancaster, looking out to Morecambe Bay. Viewpoint at the western end of the Trough of Bowland drive.",
  "warnings": "Small car park on an unfenced moor road; sheep; no gatherings.",
  "at": {
   "lat": 54.0102,
   "lng": -2.7001
  },
  "sources": [
   "https://en.wikipedia.org/wiki/Trough_of_Bowland"
  ],
  "confidence": "medium"
 },
 {
  "id": "ne-p-high-force",
  "kind": "photo",
  "name": "High Force",
  "area": "North Pennines",
  "description": "Waterfall car park opposite the High Force Hotel on the B6277. One of England's biggest waterfalls, on the Teesdale drive.",
  "warnings": "Pay car park and a charge for the waterfall path; B6277 traffic.",
  "at": {
   "lat": 54.652,
   "lng": -2.18
  },
  "sources": [
   "https://en.wikipedia.org/wiki/High_Force"
  ],
  "confidence": "medium"
 },
 {
  "id": "ne-p-steel-rigg",
  "kind": "photo",
  "name": "Steel Rigg (Hadrian's Wall)",
  "area": "Northumberland",
  "description": "National Park car park just off the Military Road near The Sill, below the Whin Sill crags. The best-known stretch of Hadrian's Wall; the former Sycamore Gap tree (felled in 2023) is a short walk east.",
  "warnings": "Pay car park; very busy in summer; narrow access lane.",
  "at": {
   "lat": 55.003,
   "lng": -2.3908
  },
  "sources": [
   "https://www.thesill.org.uk/",
   "https://en.wikipedia.org/wiki/Military_Road_(Northumberland)"
  ],
  "confidence": "high"
 },
 {
  "id": "ne-p-kielder-castle",
  "kind": "photo",
  "name": "Kielder Castle",
  "area": "Northumberland",
  "description": "Forest centre and car park at Kielder Castle, the end of the Kielder drive. Forest, reservoir and dark-sky park.",
  "warnings": "Pay car park; remote with no fuel; check opening times.",
  "at": {
   "lat": 55.2339,
   "lng": -2.5801
  },
  "sources": [
   "https://en.wikipedia.org/wiki/Kielder_Castle",
   "https://www.visitkielder.com/"
  ],
  "confidence": "medium"
 },
 {
  "id": "ne-p-bamburgh",
  "kind": "photo",
  "name": "Bamburgh Castle",
  "area": "Northumberland",
  "description": "The Links car park in the dunes below Bamburgh Castle. Castle on its rock above the beach; end of the coast drive.",
  "warnings": "Pay parking; very busy in summer; no driving on the dunes or beach.",
  "at": {
   "lat": 55.6043,
   "lng": -1.6972
  },
  "sources": [
   "https://www.bamburgh.org.uk/"
  ],
  "confidence": "high"
 },
 {
  "id": "ne-p-craster",
  "kind": "photo",
  "name": "Craster (for Dunstanburgh Castle)",
  "area": "Northumberland",
  "description": "Quarry car park in Craster, at the start of the coast path to Dunstanburgh Castle. Harbour village with the castle ruin along the coast.",
  "warnings": "Pay car park; village lanes are narrow – no driving down to the harbour.",
  "at": {
   "lat": 55.4709,
   "lng": -1.5958
  },
  "sources": [
   "https://www.english-heritage.org.uk/visit/places/dunstanburgh-castle/"
  ],
  "confidence": "high"
 },
 {
  "id": "ne-p-lindisfarne",
  "kind": "photo",
  "name": "Holy Island (Lindisfarne)",
  "area": "Northumberland",
  "description": "Chare Ends car park on Holy Island, reached over the tidal causeway. Causeway, priory and castle.",
  "warnings": "The causeway floods at high tide – check the council's safe crossing times before you go and never cross outside them; pay parking.",
  "at": {
   "lat": 55.675,
   "lng": -1.8005
  },
  "sources": [
   "https://holyislandcrossingtimes.northumberland.gov.uk/",
   "https://www.lindisfarne.org.uk/"
  ],
  "confidence": "high"
 },
 {
  "id": "ne-p-angel",
  "kind": "photo",
  "name": "Angel of the North",
  "area": "Tyne and Wear",
  "description": "Antony Gormley's 20 m steel sculpture in Gateshead, with a small free car park beside it. The North East's best-known landmark.",
  "warnings": "Small car park off the A167 – short stops only, no meets.",
  "at": {
   "lat": 54.9141,
   "lng": -1.5895
  },
  "sources": [
   "https://en.wikipedia.org/wiki/Angel_of_the_North"
  ],
  "confidence": "high"
 },
 {
  "id": "ne-t-olivers-mount",
  "kind": "track",
  "name": "Oliver's Mount, Scarborough",
  "area": "North York Moors",
  "description": "England's only natural road-race circuit for motorcycles, on the park roads of Oliver's Mount above Scarborough. Hosts the Gold Cup and other road-race meetings each season.",
  "warnings": "Spectator venue on race days only; outside meetings the circuit is ordinary public road with low limits – never use it for laps.",
  "at": {
   "lat": 54.2592,
   "lng": -0.4107
  },
  "sources": [
   "https://oliversmount.com/",
   "https://en.wikipedia.org/wiki/Oliver%27s_Mount"
  ],
  "confidence": "high"
 },
 {
  "id": "ne-t-barbon",
  "kind": "track",
  "name": "Barbon Manor Hill Climb",
  "area": "Cumbria",
  "description": "Short, very fast speed hill climb on the Barbon Manor estate near Kirkby Lonsdale, run by Liverpool Motor Club since 1950. One of the fastest hill climbs in the UK; spectators welcome with free parking.",
  "warnings": "Event days only; working hill farm in the National Park; position is the manor house.",
  "at": {
   "lat": 54.2399,
   "lng": -2.5548
  },
  "sources": [
   "https://www.liverpoolmotorclub.com/barbon-hillclimb/"
  ],
  "confidence": "medium",
  "trackType": "hillclimb"
 },
 {
  "id": "ne-t-buxton-raceway",
  "kind": "track",
  "name": "Buxton Raceway",
  "area": "Peak District",
  "description": "Tarmac oval off the A53 south of Buxton, mainly BriSCA Formula 1 stock cars. Regular stock-car meetings through to November in 2026.",
  "warnings": "Spectator venue; check fixtures; exposed site – dress for the weather.",
  "at": {
   "lat": 53.2201,
   "lng": -1.9171
  },
  "sources": [
   "https://buxtonraceway.com/",
   "https://en.wikipedia.org/wiki/Buxton_Raceway"
  ],
  "confidence": "high"
 },
 {
  "id": "ne-t-belle-vue",
  "kind": "track",
  "name": "National Speedway Stadium (Belle Vue)",
  "area": "Greater Manchester",
  "description": "Purpose-built speedway stadium in Gorton, home of the Belle Vue Aces. Top-flight speedway in Manchester.",
  "warnings": "Spectator venue; check fixtures.",
  "at": {
   "lat": 53.4611,
   "lng": -2.1889
  },
  "sources": [
   "https://en.wikipedia.org/wiki/National_Speedway_Stadium",
   "https://www.bellevuespeedway.co.uk/"
  ],
  "confidence": "high"
 },
 {
  "id": "ne-t-owlerton",
  "kind": "track",
  "name": "Owlerton Stadium, Sheffield",
  "area": "South Yorkshire",
  "description": "Speedway and greyhound stadium near Hillsborough, home of the Sheffield Tigers. Long-running speedway venue (since 1929).",
  "warnings": "Spectator venue; check fixtures.",
  "at": {
   "lat": 53.4062,
   "lng": -1.4924
  },
  "sources": [
   "https://en.wikipedia.org/wiki/Owlerton_Stadium",
   "https://www.sheffieldtigers.co.uk/"
  ],
  "confidence": "high"
 },
 {
  "id": "ne-t-skegness",
  "kind": "track",
  "name": "Skegness Stadium",
  "area": "Lincolnshire",
  "description": "Short tarmac oval at Orby near Skegness for stock cars and bangers. Regular oval racing on the Lincolnshire coast.",
  "warnings": "Spectator venue; check fixtures; position from the stadium bus stop.",
  "at": {
   "lat": 53.1869,
   "lng": 0.2821
  },
  "sources": [
   "https://en.wikipedia.org/wiki/Skegness_Stadium"
  ],
  "confidence": "medium"
 },
 {
  "id": "ne-v-squires",
  "kind": "venue",
  "name": "Squires Café Bar, Sherburn in Elmet",
  "area": "North Yorkshire",
  "description": "Long-running biker café-bar on the B1222 at Newthorpe. Weekly bike nights (Wednesday; The Biker Guide also lists Thursday); hosts the Easter Egg Run and the Yorkshire Rock & Bike Show.",
  "warnings": "Bar on site – no drink-driving; its own website is out of date, so check its social pages for current nights; postcode LS25 5LX.",
  "at": {
   "lat": 53.7829,
   "lng": -1.2887
  },
  "sources": [
   "https://www.squires-cafe.co.uk/",
   "https://www.thebikerguide.co.uk/weeklybikermeetwednesday",
   "https://www.devittinsurance.com/guides/biker-cafes/north/squires-cafe/"
  ],
  "confidence": "medium"
 },
 {
  "id": "ne-v-the-motorist",
  "kind": "venue",
  "name": "The Motorist, Sherburn in Elmet",
  "area": "North Yorkshire",
  "description": "Purpose-built motoring venue on the old Sherburn airfield with café, shop and parking for about 800 cars. Free \"Coffee & Cars\" every Sunday (10:00–16:00) plus themed Saturday meets; listed by Hagerty among the UK's top cars & coffee spots.",
  "warnings": "Official site wouldn't load when checked, so details come from 2026 event listings – check before you go.",
  "at": {
   "lat": 53.7914,
   "lng": -1.207
  },
  "sources": [
   "https://www.hagerty.co.uk/articles/top-uk-cars-and-coffee-spots/",
   "https://www.justkampers.com/events/the-motorist-new-years-day-meet/"
  ],
  "confidence": "medium"
 },
 {
  "id": "ne-v-lakeland-motor-museum",
  "kind": "venue",
  "name": "Lakeland Motor Museum, Backbarrow",
  "area": "Lake District",
  "description": "Motor museum with Café Ambio on the A590 near Newby Bridge. Monthly morning meet on the first Saturday (10:00–12:30, no booking) and the Lakeland Historic Car Club coffee morning on the third Saturday.",
  "warnings": "Classic-car focus; busy A590 junction.",
  "at": {
   "lat": 54.2588,
   "lng": -2.9893
  },
  "sources": [
   "https://www.lakelandmotormuseum.co.uk/about/events/lakeland-motor-museums-monthly-morning-meet",
   "https://www.lakelandmotormuseum.co.uk/"
  ],
  "confidence": "high"
 },
 {
  "id": "ne-v-route-59",
  "kind": "venue",
  "name": "Route 59 Café, Bolton Abbey",
  "area": "Yorkshire Dales",
  "description": "Roadside biker café on the A59 near Bolton Abbey. Tuesday bike night 17:00–20:00, April–October (The Biker Guide); on the Blubberhouses drive.",
  "warnings": "Fast, busy A59 – take care at the entrance; closed Wednesdays; 2026 dates not confirmed.",
  "at": {
   "lat": 53.9778,
   "lng": -1.9122
  },
  "sources": [
   "https://www.thebikerguide.co.uk/weeklybikermeettuesday",
   "https://www.devittinsurance.com/?p=120458"
  ],
  "confidence": "medium"
 },
 {
  "id": "ne-v-wheels-sykehouse",
  "kind": "venue",
  "name": "Wheels Café, Old George Inn, Sykehouse",
  "area": "South Yorkshire",
  "description": "Biker-themed café at a village pub with a campsite near Goole. Weekly Wednesday bike night 17:30–20:00 (The Biker Guide).",
  "warnings": "Pub – no drink-driving; narrow village lanes; 2026 dates not confirmed.",
  "at": {
   "lat": 53.6454,
   "lng": -1.0475
  },
  "sources": [
   "https://www.thebikerguide.co.uk/weeklybikermeetwednesday"
  ],
  "confidence": "medium"
 },
 {
  "id": "ne-v-zoom-cafe",
  "kind": "venue",
  "name": "Zoom Café Bar, South Cave",
  "area": "East Yorkshire",
  "description": "Café-bar on a business park off the A63 near Brough. Thursday bike nights about 16:30 until late evening, March–October, fortnightly in winter (The Biker Guide).",
  "warnings": "Check the venue's social pages for current dates.",
  "at": {
   "lat": 53.7675,
   "lng": -0.6298
  },
  "sources": [
   "https://www.thebikerguide.co.uk/weeklybikermeetthursday"
  ],
  "confidence": "medium"
 },
 {
  "id": "ne-v-devils-bridge",
  "kind": "venue",
  "name": "Devil's Bridge, Kirkby Lonsdale",
  "area": "Cumbria",
  "description": "Medieval bridge over the Lune with a snack van and two free car parks – the North's best-known informal bike gathering spot. Hundreds of bikes on sunny weekends, busiest on Sundays from spring to autumn; no organiser.",
  "warnings": "No overnight stays in the car parks; local campaign (CANS) about speed and noise in the \"Devil's Bridge triangle\" villages – ride quietly through them; police patrol the A65 and B6255 approaches; the bridge itself is pedestrian only.",
  "at": {
   "lat": 54.1984,
   "lng": -2.5907
  },
  "sources": [
   "https://www.kirkbylonsdale.co.uk/parking-and-toilets/",
   "https://www.thebikerguide.co.uk/bikerfriendlymeetingplacecumbria",
   "https://www.pressreader.com/uk/mcn-uk/20210512/281685437725378"
  ],
  "confidence": "medium"
 },
 {
  "id": "ne-v-tan-hill",
  "kind": "venue",
  "name": "Tan Hill Inn",
  "area": "Yorkshire Dales",
  "description": "Britain's highest pub, alone on the moor between Swaledale and Teesdale, with a campsite. Classic Dales ride and drive destination; a new owner in 2026 plans better facilities for bikers.",
  "warnings": "Pub – no drink-driving; remote, narrow moorland roads with sheep; snow and fog in winter.",
  "at": {
   "lat": 54.4557,
   "lng": -2.1603
  },
  "sources": [
   "https://www.teesdalemercury.co.uk/?p=40795"
  ],
  "confidence": "medium"
 },
 {
  "id": "ne-v-grindleford",
  "kind": "venue",
  "name": "Grindleford Station Café",
  "area": "Peak District",
  "description": "Old-school café at Grindleford station used by bikers, cyclists and walkers. Long-standing Peak District ride stop; no set meet.",
  "warnings": "Cash only; small car park – fine for bikes, too small for car meets; very busy at weekends.",
  "at": {
   "lat": 53.3053,
   "lng": -1.6243
  },
  "sources": [
   "https://www.devittinsurance.com/guides/biker-cafes/midlands/grindleford-station-cafe/"
  ],
  "confidence": "medium"
 },
 {
  "id": "ne-v-wraysholme",
  "kind": "venue",
  "name": "Wraysholme Creamery, Flookburgh",
  "area": "Cumbria",
  "description": "Farm creamery on the Cartmel peninsula. Bike night on the second Thursday, April–September, from 16:00 (The Biker Guide).",
  "warnings": "Seasonal; narrow lanes; 2026 dates not confirmed.",
  "at": {
   "lat": 54.1709,
   "lng": -2.9456
  },
  "sources": [
   "https://www.thebikerguide.co.uk/weeklybikermeetthursday",
   "https://www.thebikerguide.co.uk/bikerfriendlymeetingplacecumbria"
  ],
  "confidence": "medium"
 },
 {
  "id": "ne-v-bridge-house-farm",
  "kind": "venue",
  "name": "Bridge House Farm Tearooms, Wray",
  "area": "Lancashire",
  "description": "Tearooms in the Lune valley near Lancaster that host classic car and bike nights. First Thursday, April–September, 14:00–22:00, with a hog roast or BBQ (The Biker Guide).",
  "warnings": "Seasonal; narrow lanes; 2026 dates not confirmed.",
  "at": {
   "lat": 54.1015,
   "lng": -2.6041
  },
  "sources": [
   "https://www.thebikerguide.co.uk/bikerfriendlycafemeetingplaceslancashire",
   "https://www.thebikerguide.co.uk/weeklybikermeetthursday"
  ],
  "confidence": "medium"
 },
 {
  "id": "ne-v-iron-city-leeds",
  "kind": "venue",
  "name": "Iron City Motorcycles, Leeds",
  "area": "West Yorkshire",
  "description": "Multi-brand motorcycle dealer (also in Gateshead and South Shields). Bike night on the last Thursday of the month, 18:00–20:00, all makes welcome (Iron City).",
  "warnings": "Urban site; check dates on the dealer's page.",
  "at": {
   "lat": 53.7962,
   "lng": -1.5636
  },
  "sources": [
   "https://ironcitymotorcycles.co.uk/bike-night"
  ],
  "confidence": "medium"
 },
 {
  "id": "ne-v-willingham-woods",
  "kind": "venue",
  "name": "Willingham Woods, Market Rasen",
  "area": "Lincolnshire Wolds",
  "description": "Forestry picnic site with a kiosk on the A631, near the B1225 and Cadwell Park. Wednesday evening bike meet April–September (The Biker Guide); BestBikingRoads B1225 reviewers say it is popular with bikes.",
  "warnings": "Public picnic site – no revving or stunts; A631 traffic; police attention on bike nights.",
  "at": {
   "lat": 53.3806,
   "lng": -0.292
  },
  "sources": [
   "https://www.thebikerguide.co.uk/weeklybikermeetwednesday",
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/east-midlands/ride/b1225-horncastle-caistor-lincolnshire-wolds"
  ],
  "confidence": "medium"
 },
 {
  "id": "ne-v-vale-cafe",
  "kind": "venue",
  "name": "The Vale Café, Rothbury",
  "area": "Northumberland",
  "description": "Long-standing biker café in Rothbury (formerly The Milk Bar). Popular stop on Northumberland rides; open daily, no set meet (The Biker Guide).",
  "warnings": "Village street parking; 2026 details not confirmed.",
  "at": {
   "lat": 55.3097,
   "lng": -1.9123
  },
  "sources": [
   "https://www.thebikerguide.co.uk/bikerfriendlyplacescafespubsnorthumberland"
  ],
  "confidence": "medium"
 }
]
```
