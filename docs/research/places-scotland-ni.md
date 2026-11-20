# Slipstream – regional places research (Scotland and Northern Ireland)

_Compiled 17 November 2026. Research only – the data module is `src/data/regions/scotlandNI.ts`; no existing app file was changed._

Covers the Highlands (NC500: Wester Ross, Sutherland, Caithness), Skye, Lochaber and the Great Glen, Perthshire and the Trossachs, Fife, Galloway, the Borders, the central belt and Aberdeen; and Northern Ireland (Antrim coast and glens, Causeway Coast, Mournes, Sperrins).

## How this was put together

- **Method:** the same as `places-north-england.md`, reusing its scripts (OSRM routing, Photon/Nominatim geocoding, Wikipedia lookups).
- **Sources:** BestBikingRoads route pages and reviews, Wikipedia for road facts, official sites (venue and organiser sites, the National Trust for Scotland, the NC500 site), The Biker Guide and Devitt for biker cafés, club pages for car-club runs, and Police Scotland/PSNI statements, council pages and local news for the places to avoid. Each row links its sources.
- **Coordinates:** points come from OpenStreetMap via Photon and Nominatim, matched to the named car park, viewpoint or venue; the Doune position is the club's published one. Overpass was down during this run. Where only an approximate feature was available (e.g. Aghadowey Oval = the old airfield), confidence is medium.
- **Drive lines:** each drive was routed with OSRM through on-road points on the named roads, and the road numbers it used were read back from the route steps. Via points that caused spurs (Glenfinnan, Ballintoy harbour, Kylesku village, Mey, the Ord of Caithness, Whitebridge) or detours (Strathmore instead of the A838, the Bealach instead of the A896, inland lanes instead of the Antrim coast road) were moved and re-routed. Waypoints are sampled about every 1.1 miles along the routed line (never more than 1.5 mi apart). The "Line" note says where the line leaves the named road.
- **Photo spots (owner rule):** only places with a source showing car or motorbike photography, filming or meets there – a car advert or press shoot, a film car scene, or a bike-club stop. Scenic viewpoints with no such evidence were left out (see Dropped).
- **Not duplicated:** `places.ts` already has the A93 Cairnwell (Old Military Road), Bealach na Bà, A87 Glen Shiel (Cluanie–Shiel Bridge), A82 Glencoe, A939 Lecht (Cock Bridge–Tomintoul, the snow-gated road) and A83 Rest and Be Thankful drives; the Rest and Be Thankful, Bealach na Bà, Glenshee and Lecht photo spots; and Knockhill, Kirkistown, Bishopscourt, Forrestburn and Crimond. `kartTracks.ts` has Larkhall. None are repeated; the A87 Glen Garry drive ends where Glen Shiel starts.
- **Ferries and snow gates:** no drive here needs a ferry (Skye is reached by the free Skye Bridge); the snow-gated roads (A939, A93) are already in the app.
- **Legal and safe:** every stop is a public car park, lay-by, visitor site or a venue that welcomes visitors. Scotland has no PSPOs, so **Avoid** lists police crackdown hotspots, dispersal zones and road rules instead. Opening times, prices and meet dates change, so check before you publish them as live data.
- **Confidence:** _high_ means the place is confirmed against an official or map listing and the line follows the named roads. _medium_ means an approximate position, a partial line or source, or details not confirmed for 2026. _low_ means unverified (not in the data file).
- **Limits:** the shared web-search budget was limited, so several councils and towns were not searched for car-meet problems (listed under Avoid), some venue listings could not be re-checked for 2026, and Overpass was unavailable for car-park checks.

## Scotland and Northern Ireland

### Drives / routes (25)

| Name | Start → End | Miles | Description | Why it's good | Warnings | Line | Conf. | Sources |
|---|---|---|---|---|---|---|---|---|
| **Applecross coast road (Applecross to Shieldaig)** | Applecross → A896 near Shieldaig | 25.2 | The long way round the Applecross peninsula: north along the Inner Sound past Fearnmore, then east along Loch Torridon via Kenmore and Ardheslaig to the A896 by Shieldaig. | The other half of the classic Bealach na Bà loop; BestBikingRoads reviewers call the Applecross–Shieldaig run very twisty with abrupt changes in elevation, "hundreds of relaxed corners" and very remote. | Single-track with passing places: pull into a passing place on your left (or wait opposite one on your right) for oncoming traffic and to let faster vehicles past, and never park in one (Police Scotland/NC500 advice). Blind crests and tight bends; sheep and deer on the road; very remote with no phone signal in places (BestBikingRoads); slow camper traffic in summer. | Unnumbered coast road out of Applecross, then the C1091, ending with 0.5 mi on the A896. (24 waypoints) | medium | [1](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/highland-scotland/ride/kyle-of-lochalsh-new-kelso-applecross-fearnmore-balgy) [2](https://en.wikipedia.org/wiki/Applecross) [3](https://www.northcoast500.com/top-tips-hitting-route/road-safety) |
| **A896 Lochcarron to Kinlochewe via Torridon** | Lochcarron → Kinlochewe | 32.0 | Round Loch Kishorn past the Bealach na Bà turn at Tornapress, over to Shieldaig, along Upper Loch Torridon and up Glen Torridon under Liathach and Beinn Eighe to Kinlochewe. | The NC500's alternative to the Bealach (the advised route for big vehicles), through the Torridon Hills – some of the most dramatic mountain scenery on the mainland (Wikipedia). | Single-track with passing places: pull into a passing place on your left (or wait opposite one on your right) for oncoming traffic and to let faster vehicles past, and never park in one (Police Scotland/NC500 advice). Long single-track sections between Shieldaig and Kinlochewe; walkers' cars parked at Glen Torridon trailheads; deer, especially at dusk. | On the A896 throughout. (30 waypoints) | medium | [1](https://en.wikipedia.org/wiki/Torridon) [2](https://www.sundaypost.com/?p=38904) [3](https://www.northcoast500.com/top-tips-hitting-route/road-safety) |
| **A832 Loch Maree (Kinlochewe to Gairloch)** | Kinlochewe → Gairloch | 20.0 | Along the south shore of Loch Maree under Slioch, through the Slattadale forest and down to Gairloch. | BestBikingRoads (Kinlochewe–Ullapool "West Coast Heaven") calls the section past Loch Maree fast with wonderful sweeping corners, then a short single-track stretch into Gairloch. | Mostly two-way but with a single-track section near Gairloch – use passing places properly; deer; NC500 campervans; police and marked motorcycle patrols run enforcement weekends on the NC500 (Operation Cedar). | On the A832 throughout. (19 waypoints) | high | [1](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/highland-scotland/ride/a832-a835-kinlochewe-ullapool-west-coast-heaven) [2](https://en.wikipedia.org/wiki/Loch_Maree) [3](https://www.highland.gov.uk/news/article/15280/police_scotland_are_once_again_issuing_advice_for_those_travelling_on_the_nc500_this_summer) |
| **A832 Gruinard Bay (Poolewe to Corrie Hallie)** | Poolewe → Corrie Hallie (Dundonnell) | 26.6 | From Poolewe past Aultbea and Laide, round Gruinard Bay with its beaches, then along Little Loch Broom to Dundonnell and Corrie Hallie. | The second half of BestBikingRoads' "West Coast Heaven": after Gairloch "the road just gets better and better", with miles of corners and sea views over Gruinard Bay. | Single-track in places with passing places; blind crests round Gruinard; sheep and deer; summer NC500 traffic and campervans stopping at the viewpoints. | On the A832 throughout. (25 waypoints) | high | [1](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/highland-scotland/ride/a832-a835-kinlochewe-ullapool-west-coast-heaven) [2](https://en.wikipedia.org/wiki/A832_road) |
| **A890 Strathcarron to Auchtertyre (Stromeferry)** | Strathcarron → Auchtertyre (A87) | 14.6 | Along the south shore of Loch Carron under rock cuttings at Stromeferry, then over the hill to Auchtertyre on the A87 near Eilean Donan. | BestBikingRoads: the Loch Alsh–New Kelso part is "by far the better part", climbing over the hill on open, fast sweepers; very few cars. | Steep rock cuttings above the loch – check Highland Council for closures; steep climbs and descents over the hill; deer; little traffic so animals linger on the road. | On the A890 throughout. (14 waypoints) | high | [1](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/highland-scotland/ride/a890-auchtertyre-loch-alsh-achnasheen-loch-gowan) |
| **A894 Assynt: Skiag Bridge to Scourie (Kylesku Bridge)** | Skiag Bridge (Loch Assynt) → Scourie | 17.8 | North from Loch Assynt over the moor, down to the curved Kylesku Bridge across Loch a' Chàirn Bhàin, then across the lochan-studded country to Scourie. | BestBikingRoads reviewers call it one of the most spectacular sections of road they have ridden; the Category A-listed Kylesku Bridge (1984) is the landmark (Wikipedia). | Blind crests and narrow sections; sheep and deer on unfenced road; NC500 traffic in summer; exposed bridge in high winds. | Starts with 1 mi on the A837, then the A894. (17 waypoints) | high | [1](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/highland-scotland/ride/a894-inchnadamph-scourie-laxford-bridge) [2](https://en.wikipedia.org/wiki/Kylesku_Bridge) |
| **A838 Durness to Tongue (Loch Eriboll)** | Durness → Tongue | 29.5 | East from Durness, right round Loch Eriboll, over the Moine and across the Kyle of Tongue causeway to Tongue. | The most northerly stretch of the NC500 on the mainland's north coast; BestBikingRoads calls it "a single track A road with stunning views" where the ride along the lochs is the highlight. | Single-track with passing places: pull into a passing place on your left (or wait opposite one on your right) for oncoming traffic and to let faster vehicles past, and never park in one (Police Scotland/NC500 advice). Long single-track stretches; very remote (few services between Durness and Tongue); sheep and deer; exposed causeway in high winds. | On the A838 throughout. (28 waypoints) | high | [1](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/highland-scotland/ride/a838-collaboll-durness-tongue) [2](https://en.wikipedia.org/wiki/A838_road) [3](https://www.northcoast500.com/top-tips-hitting-route/road-safety) |
| **A836 Caithness coast (Thurso to John o' Groats)** | Thurso → John o' Groats | 19.8 | East from Thurso past Castletown and Dunnet Bay (turn for Dunnet Head, the mainland's most northerly point), then Mey and the Castle of Mey to John o' Groats. | The north-east corner of the NC500; the A836 at East Mey is the northernmost A road on mainland Great Britain (Wikipedia). | Mostly two-lane here (other parts of the A836 are single-track); exposed to strong crosswinds off the Pentland Firth; slow tourist traffic near Dunnet Head and John o' Groats; 30 mph villages. | On the A836 throughout, with 0.2 mi on the A9 in Thurso. (18 waypoints) | medium | [1](https://en.wikipedia.org/wiki/A836_road) [2](https://en.wikipedia.org/wiki/Dunnet_Head) |
| **A9 Helmsdale to Dunbeath (Berriedale Braes)** | Helmsdale → Dunbeath | 15.0 | North from Helmsdale over the Ord of Caithness, down and up the Berriedale Braes and along the clifftops to Dunbeath. | The A9 north of Helmsdale is the NC500's east coast; a BestBikingRoads reviewer singles out "a huge section of hairpins going up and down gradients (called the Berriedale Braes)". | Steep gradients and tight bends at the Ord and Berriedale – HGVs crawl on the climbs; the main road north, so expect lorries and campervans; crosswinds on the clifftops; deer. | On the A9 throughout. (14 waypoints) | high | [1](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/highland-scotland/ride/a9-a99-inverness-john-o-groats) [2](https://en.wikipedia.org/wiki/Berriedale,_Highland) |
| **A855 Trotternish (Portree to Staffin)** | Portree → Staffin | 16.7 | North from Portree under the Storr and the Old Man of Storr, past the lochs and the Kilt Rock coast to Staffin. | The road under the Trotternish ridge used in Volvo's V90 Cross Country advert (Press and Journal); Skye is reached by the free Skye Bridge, no ferry needed. | Narrow with blind bends and single-track sections; very busy with coaches and cars at the Storr and Kilt Rock in summer – never stop on the verge; sheep; Portree is congested. | On the A855 throughout. (16 waypoints) | medium | [1](https://en.wikipedia.org/wiki/The_Storr) [2](https://pressandjournal.co.uk/fp/news/highlands-islands/1052375/video-skye-starring-role-new-advert-volvo-v90) |
| **A830 Road to the Isles (Fort William to Mallaig)** | Banavie (Fort William) → Mallaig | 39.9 | West from Banavie past Corpach and along Loch Eil to Glenfinnan, then Loch Eilt, Lochailort, Arisaig and the Morar sands to the ferry port at Mallaig. | The 46-mile road that follows the West Highland Line to Mallaig (Wikipedia); BestBikingRoads reviewers enjoyed it "tremendously", with mostly excellent surface. | Glenfinnan is gridlocked in summer by viaduct and Jacobite steam-train visitors – use the paid car park only; a stretch of poorer surface (BestBikingRoads); deer; ferry traffic towards Mallaig. Skye ferry from Mallaig must be booked. | On the A830 throughout. (37 waypoints) | high | [1](https://en.wikipedia.org/wiki/A830_road) [2](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/argyll-bute-scotland/ride/a830-fort-william-mallaig) |
| **A87 Invergarry to Cluanie (Glen Garry)** | Invergarry (A82) → Cluanie Inn | 19.3 | West from the A82 at Invergarry along Loch Garry, over the high ground by Loch Loyne and down to Loch Cluanie – it joins the existing Glen Shiel drive at Cluanie. | BestBikingRoads reviewers: "fast sweepers through forests, great elevation as you climb up the mountain" – a must-do on the way to Skye. Loch Garry viewpoint is famous for looking like a map of Scotland (Wikipedia). | Main route to Skye – heavy summer traffic and coaches; deer; snow and ice on the high section by Loch Loyne in winter; long gaps between fuel. | On the A87 throughout. (19 waypoints) | high | [1](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/highland-scotland/ride/a87-invergarry-kyle-of-lochalsh) [2](https://en.wikipedia.org/wiki/A87_road) [3](https://en.wikipedia.org/wiki/Loch_Garry) |
| **South Loch Ness: B862/B852 Fort Augustus to Dores** | Fort Augustus → Dores | 25.1 | General Wade's Military Road out of Fort Augustus over the hills past Loch Tarff to Whitebridge, then down to Foyers and along the quiet south shore of Loch Ness to Dores. | BestBikingRoads: "a more scenic alternative to the A82" on the other side of the heavily touristic loch. | Single-track sections with blind corners, especially from Fort Augustus to Foyers and near Dores – extra care on corners; deer; walkers and cyclists on the South Loch Ness Trail. | B862 from Fort Augustus to Whitebridge, then B852 via Foyers; about 5 mi near Foyers and Dores have no road number in OSM. (23 waypoints) | medium | [1](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/highland-scotland/ride/b862-b852-fort-augustus-inverness) |
| **A86 Spean Bridge to Newtonmore (Loch Laggan)** | Spean Bridge → Newtonmore | 36.8 | East from Spean Bridge through Roybridge and Glen Spean, along Loch Laggan past the Laggan Dam, then Laggan and down the Spey to Newtonmore. | An A9 alternative linking Lochaber with Speyside; BestBikingRoads: "another great road packed with bends", lots of fast corners from Laggan to Spean Bridge, and worth stopping at the Laggan Dam. | Visitors stopping suddenly for views (BestBikingRoads); deer; some narrow sections between Laggan and Newtonmore; snow on the high ground in winter. | On the A86 throughout. (34 waypoints) | high | [1](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/north-east-scotland/ride/a86-newtonmore-spean-bridge-loch-laggan) |
| **Sma' Glen: A822/A826 Gilmerton to Aberfeldy** | Gilmerton (Crieff) → Aberfeldy | 21.6 | North from Gilmerton through the Sma' Glen (Glen Almond), over to Amulree, then the A826 down Glen Cochill to Aberfeldy. | An A9 alternative; BestBikingRoads (Crieff–Aberfeldy via the Sma' Glen): "lots and lots of bends", plenty of decent straights and "a favourite route for local bikers". | Popular with bikers, so expect police attention at weekends; sheep on the unfenced moor; cyclists; snow on the high ground by Amulree. | A822 to Amulree, then the A826. (20 waypoints) | high | [1](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/north-east-scotland/ride/crieff-aberfeldy-via-sma-glen-a85-a822-a826) [2](https://en.wikipedia.org/wiki/Glenalmond) |
| **Duke's Pass (A821), Aberfoyle to Callander** | Aberfoyle → Callander | 14.5 | Up the hairpins out of Aberfoyle over the Duke's Pass (240 m), down past Loch Achray and Brig o' Turk, then along Loch Venachar to Callander. | Built by the Duke of Montrose in 1885 (Wikipedia); BestBikingRoads calls it "a must ride if you are in Central Scotland" – tight hairpins at the Aberfoyle end and a faster stretch by Loch Venachar. | Big coaches and slow tourist traffic – quieter in the early evening (BestBikingRoads); gravel from patching; Three Lochs Forest Drive and car-park traffic; Loch Lomond & The Trossachs National Park byelaws in summer. | On the A821 throughout, ending with 1.3 mi on the A84 into Callander. (14 waypoints) | high | [1](https://en.wikipedia.org/wiki/Duke%27s_Pass) [2](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/argyll-bute-scotland/ride/a821-the-dukes-pass-callendar-aberfoyle) |
| **A917 East Neuk of Fife (Elie to St Andrews)** | Elie → St Andrews | 19.4 | Along the East Neuk fishing villages – Elie, St Monans, Pittenweem, Anstruther, Crail – then round Fife Ness and up the coast to St Andrews. | The Fife coast road (BestBikingRoads "Fife Coastal Loop"); passes Crail Raceway, Scotland's only quarter-mile drag strip. | Many 20/30 mph village limits and narrow main streets; tourist and golf traffic around St Andrews; farm traffic; cyclists on the coastal route. | On the A917 throughout. (18 waypoints) | medium | [1](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/north-east-scotland/ride/fife-coastal-loop) |
| **Queen's Way (A712) New Galloway to Newton Stewart** | New Galloway → Newton Stewart (A75) | 17.0 | The Queen's Way through the Galloway Forest Park, past Clatteringshaws Loch and Murray's Monument, down to Newton Stewart. | BestBikingRoads (A712 "Galloway Magic"): "each turn leads directly into the next", little traffic and "a million times better than the boring A75". | Timber lorries in the forest; deer and wild goats; red squirrels; sheep; Dark Sky Park – very dark at night; check surface after forestry works. | On the A712 throughout. (17 waypoints) | high | [1](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/south-scotland/ride/a712-newton-stewart-crockerford-or-ninemile-bar-galloway-magic) |
| **A708 Moffat to Selkirk (St Mary's Loch)** | Moffat → Selkirk | 34.3 | North-east out of Moffat up the Moffat Water past the Grey Mare's Tail, over to St Mary's Loch and down the Yarrow valley to Selkirk. | BestBikingRoads: narrow, twisty and "really cresty" from Moffat, then fast sweeping corners surrounded by high hills; a café stop at St Mary's Loch. | Sharp crests and tight bends at the Moffat end; gravelly surfaces; sheep; walkers parking at the Grey Mare's Tail (National Trust for Scotland car park). | On the A708 throughout, ending with 0.5 mi on the A707 into Selkirk. (32 waypoints) | high | [1](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/south-scotland/ride/a708-selkirk-moffat) |
| **A701 Moffat to Broughton (Devil's Beef Tub)** | Moffat → Broughton | 23.6 | North from Moffat up the edge of the Devil's Beef Tub, over the watershed and down the upper Tweed past Tweedsmuir to Broughton. | "Popular with motorcyclists" and signed as a scenic route to Edinburgh (Wikipedia); BestBikingRoads rates it one of the best roads in the area – great corners, good grip and little traffic. | A few tight bends catch people out (BestBikingRoads); sheep; exposed and snowy at the Beef Tub summit; lay-by at the Beef Tub viewpoint only – don't stop on the road. | On the A701 throughout. (22 waypoints) | high | [1](https://en.wikipedia.org/wiki/A701_road) [2](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/central-scotland-and/ride/a701-howgate-moffat-the-devils-beeftub) [3](https://en.wikipedia.org/wiki/Devil%27s_Beef_Tub) |
| **Antrim Coast Road (A2) Larne to Cushendall** | Larne → Cushendall | 24.0 | The Antrim Coast Road north from Larne past Ballygally Head, Glenarm and Carnlough, round Garron Point to Waterfoot (Glenariff) and Cushendall. | BestBikingRoads rates the Antrim Coast Road 4.5/5 – "must be one of the best biking roads in the UK and Ireland"; the glens of Antrim reach the sea along it. | Lined with unforgiving stone walls (BestBikingRoads); coaches and slow tourist traffic; villages at 30 mph; sea spray and rockfalls under the cliffs; busy around North West 200 week. | On the A2 throughout. (23 waypoints) | high | [1](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/ulster-northern-ireland/ride/a2-larne-portrush-antrim-coast-road) [2](https://en.wikipedia.org/wiki/A2_road_(Northern_Ireland)) |
| **Causeway Coast (B15/A2) Ballycastle to Portrush** | Ballycastle → Portrush | 19.5 | West from Ballycastle on the coast road past Ballintoy and Whitepark Bay, then the A2 by the Giant's Causeway, Bushmills and Dunluce Castle to Portrush. | The northern end of BestBikingRoads' Antrim Coast Road ride – reviewers single out the stretch past Ballintoy and Bushmills. | Coaches and car-park queues at the Giant's Causeway and Carrick-a-Rede; Bushmills village; PSNI run operations against car cruising and "diffing" around Portrush and Portstewart – no meets here. | B15 Whitepark Road from Ballycastle to Bushmills, then the A2. (19 waypoints) | medium | [1](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/ulster-northern-ireland/ride/a2-larne-portrush-antrim-coast-road) [2](https://www.irishnews.com/news/northern-ireland/police-warning-over-diffing-and-other-anti-social-driving-in-the-north-coast-this-easter-M7YQ3JGCZJDT5PDIB4P4NJZ2ZY/) |
| **B27 Hilltown to Kilkeel past Spelga Dam** | Hilltown → Kilkeel | 14.0 | South-east from Hilltown up into the Mournes past Spelga Dam (about 370 m), across the high moor and down to Kilkeel on the coast. | BestBikingRoads (Mountain Route, Newcastle): "great corners going down past the dam", a great surface on a deserted road. | Mountain fog and snow; sheep on the open moor; cyclists; narrow single-lane approach roads from Bryansford (BestBikingRoads); Spelga car park busy on sunny weekends. | On the B27 throughout, with short village streets in Hilltown and Kilkeel. (14 waypoints) | medium | [1](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/ulster-northern-ireland/ride/mountain-route-newcastle) [2](https://en.wikipedia.org/wiki/Spelga_Reservoir) |
| **Glenshane Pass (A6)** | Dungiven → Maghera (Glen Road) | 10.4 | The main Belfast–Derry road over the Sperrins: east from Dungiven up to the Glenshane Pass past the Ponderosa bar, then down to Maghera. | A major mountain pass through the Sperrin Mountains (Wikipedia), with the Ponderosa – a listed biker stop – near the top. | Main trunk road with HGVs; exposed to snow and ice, often the first NI road affected in winter; speed limits enforced; fog on the summit. | On the A6 throughout. (11 waypoints) | medium | [1](https://en.wikipedia.org/wiki/Glenshane_Pass) [2](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/ulster-northern-ireland/ride/cookstown-lough-fea-to-glenshane) |
| **Glenelly Valley (B47), Sperrins** | Plumbridge → Sperrin village | 15.4 | East up the Glenelly Valley, the longest in the Sperrins, past Cranagh and Goles under Sawel Mountain. | BestBikingRoads (Glenelly Valley, Draperstown–Newtownstewart) rates it 4/5 – "a stunning road in either direction" with undulations and interesting corners. | Farm traffic and lots of driveways; bumpy surface and loose chippings in places; sheep; narrow in parts. | On the B47 throughout, with short lanes at the Plumbridge end. (15 waypoints) | high | [1](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/ulster-northern-ireland/ride/glenelly-valley-draperstown-newtonstewart-glenelly-valley-sperrins) [2](https://en.wikipedia.org/wiki/Glenelly_Valley) |

### Photo spots (7)

| Name | Lat, Lng | Description | Why it's good / events | Warnings | Conf. | Sources |
|---|---|---|---|---|---|---|
| **Glen Etive "Skyfall" lay-by** | 56.6195, -4.9307 | Lay-by about halfway down the single-track Glen Etive road where Bond's Aston Martin DB5 stops in Skyfall; Glen Etive also starred in Volvo's V90 advert. | A popular stop for recreating the Skyfall car shot (Press and Journal). | Dead-end single-track road with passing places – never park in them; the National Trust for Scotland asks you to stop only in lay-bys and drive on if full (it plans to enlarge this one); deer; no phone signal. | medium | [1](https://pressandjournal.co.uk/fp/news/highlands-islands/6528949/glencoe-car-stuck-skyfall-glen-etive) [2](https://www.nts.org.uk/stories/work-begins-to-improve-visitor-experience-at-glencoe-nnr) [3](https://pressandjournal.co.uk/fp/news/highlands-islands/1052375/video-skye-starring-role-new-advert-volvo-v90) [4](OpenStreetMap (ODbL)) |
| **Old Man of Storr car park** | 57.4981, -6.1584 | Car park beside the A855 below the Storr pinnacles, on the Trotternish drive. | The Storr was one of the locations in Volvo's V90 Cross Country advert (Press and Journal). | Pay car park that fills early in summer; do not park on the A855 verges; coach traffic. | medium | [1](https://pressandjournal.co.uk/fp/news/highlands-islands/1052375/video-skye-starring-role-new-advert-volvo-v90) [2](https://en.wikipedia.org/wiki/The_Storr) |
| **Kylesku Bridge viewpoint** | 58.2567, -5.0212 | Pull-off with an information board by the north end of the curved Kylesku Bridge on the A894. | Mazda shot its Highlands car campaign at sites around Kylesku and Gairloch (Little Black Book); the bridge is the A894 drive's landmark. | Small parking area – pull fully off the A894; exposed to strong winds; NC500 campervans. | medium | [1](https://lbbonline.com/news/ls-productions-secures-stunning-scottish-route-in-seamless-co-production-for-mazdas-latest-models-2) [2](https://en.wikipedia.org/wiki/Kylesku_Bridge) |
| **Ballintoy Harbour** | 55.2439, -6.3695 | Small harbour car park at the bottom of the steep lane below Ballintoy village. | Used for Mazda UK's CX-3 press shoot on the Causeway Coast (photographer Tim Swart); also a Game of Thrones location. | Very steep, narrow lane with hairpins – not for large vehicles; small car park, busy with Game of Thrones tours; don't drive onto the pier. | medium | [1](https://tim-swart.squarespace.com/blog/tag/coast) [2](OpenStreetMap (ODbL)) |
| **Dunluce Castle** | 55.2109, -6.576 | Car park by the clifftop ruin of Dunluce Castle on the A2 between Bushmills and Portrush. | The coast road seen from Dunluce Castle was one of the shots in Mazda UK's CX-3 Causeway Coast shoot (photographer Tim Swart). | Pull in and out of the A2 with care (fast road); castle visitor car park; close to the Portrush car-cruising hotspot – no meets. | medium | [1](https://tim-swart.squarespace.com/blog/tag/coast) [2](OpenStreetMap (ODbL)) |
| **Torr Head** | 55.196, -6.0632 | Headland with a small parking area at the end of the Torr Head scenic road, looking across the North Channel to Kintyre. | The road to Torr Head was photographed for Mazda UK's CX-3 Causeway Coast shoot (photographer Tim Swart). | The Torr Head road is very narrow, steep and twisty – not for caravans or large vehicles; tiny parking area; sheep. | medium | [1](https://tim-swart.squarespace.com/blog/tag/coast) [2](https://en.wikipedia.org/wiki/Torr_Head) |
| **Spelga Dam car park** | 54.1789, -6.058 | Car park and picnic area by Spelga Dam on the B27 high in the Mournes. | A regular motorcycle stop – the Harley Owners Club NI branch used it as the first stop on its April 2026 Mournes run, and BestBikingRoads reviewers rate the road past the dam. | Exposed and often foggy; sheep; busy on sunny weekends. | high | [1](https://www.hoc.org.uk/ni-run-around-the-mournes-and-over-to-carlingford-sun-19th-april-2026/) [2](https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/ulster-northern-ireland/ride/mountain-route-newcastle) [3](OpenStreetMap (ODbL)) |

### Tracks, circuits & sprint venues (7)

| Name | Lat, Lng | Description | Why it's good / events | Warnings | Conf. | Sources |
|---|---|---|---|---|---|---|
| **Crail Raceway** | 56.2703, -2.6069 | Scotland's only quarter-mile drag strip, on the old airfield at Crail in the East Neuk. | Drag and drift days and themed events (Full On Ford, German Invasion, Banzai, Best of the Best) from March to November in 2026. | Event days only; check the calendar on the raceway site. | high | [1](https://www.crailraceway.co.uk/wp/) [2](OpenStreetMap (ODbL)) |
| **Doune Hill Climb** | 56.2017, -4.0718 | Speed hill climb on the A84 a mile west of Doune, run by Lothian Car Club; rounds of the Scottish Hillclimb Championship. | Four meetings a year (April, May, June and September); spectators welcome. | Event days only; no animals in the spectator areas; check the M80/A84 for roadworks. | high | [1](https://www.dounehillclimb.co.uk/) [2](https://www.dounehillclimb.co.uk/location/) |
| **Cowdenbeath Racewall** | 56.1089, -3.3472 | Oval stock-car stadium, "the home of Scottish stock car racing": BriSCA F2, saloon stock cars, ORCi stock rods, ministox and bangers. | Racing most Saturday evenings from March to the end of October, plus speed weekends and a winter meeting. | Spectator venue; book tickets online. | high | [1](https://www.racewall.co.uk/) [2](OpenStreetMap (ODbL)) |
| **Lochgelly Raceway** | 56.1272, -3.2777 | Stock car, hot rod and banger oval run by Hardie Race Promotions. | Regular meetings through the season; fixture list on the promoter's site. | Spectator venue; check fixtures and admission. | high | [1](https://www.lochgellyraceway.co.uk/) [2](OpenStreetMap (ODbL)) |
| **Nutts Corner Circuit** | 54.6245, -6.1453 | Outdoor go-karting circuit on the old RAF Nutts Corner airfield near Crumlin, north-west of Belfast. | Arrive-and-drive and group karting near Belfast. | Booking required; check the site for sessions. | medium | [1](https://www.nuttscornercircuit.com/) [2](https://en.wikipedia.org/wiki/RAF_Nutts_Corner) [3](OpenStreetMap (ODbL)) |
| **Aghadowey Oval** | 55.0258, -6.5969 | Short oval on the former RAF Mullaghmore airfield near Aghadowey, run by DMC Race Promotions: stock cars, bangers, stock rods and Ninja Karts. | Hosted the first British Championship staged in Northern Ireland (2026); meetings into late December. | Spectator venue; position is the old airfield (approximate); check DMC fixtures. | medium | [1](https://dmcracepromotions.com/latest.php) [2](https://en.wikipedia.org/wiki/Aghadowey) [3](https://en.wikipedia.org/wiki/RAF_Mullaghmore) |
| **North West 200 (the Triangle)** | 55.193, -6.6976 | Motorcycle road race on the 8.97-mile "Triangle" of public roads between Portstewart, Coleraine and Portrush – the biggest annual sporting event in Northern Ireland. | Race week 10–15 May 2027; grandstands and campsites at the finish line. | Spectator venue on race days only. The rest of the year it is ordinary public road with speed limits and PSNI enforcement – never use it for laps. Inside the Portrush/Portstewart car-cruising hotspot. | high | [1](https://northwest200.co.uk/) [2](https://en.wikipedia.org/wiki/North_West_200) |

### Meet venues (cafés, bike nights, cars & coffee) (15)

| Name | Lat, Lng | Description | Why it's good / events | Warnings | Conf. | Sources |
|---|---|---|---|---|---|---|
| **The Green Welly Stop, Tyndrum** | 56.4383, -4.7122 | Café, restaurant, shops and fuel at Tyndrum on the A82 (with the A85 to Oban). | Devitt: a busy halfway stop on the A82 that draws bikers from across Scotland, especially at weekends; extended bike park. On the way to Glencoe. | Very busy on summer weekends; hours vary by season (The Biker Guide). | high | [1](https://www.devittinsurance.com/guides/biker-cafes/scotland/green-welly-stop/) [2](https://www.thebikerguide.co.uk/motorcyclemeetingplacesscotland) |
| **Duck Bay, Loch Lomond** | 56.0162, -4.6105 | Hotel, marina and lochside car park on the A82 at Duck Bay, north of Balloch. | A starting point for car-club runs: Porsche Club GB Scotland runs (incl. July 2026) and Lotus club (LEGS) breakfast meets start here. | Private hotel/marina car park – customers only; club runs are members-only; a forum post mentions a flood closure, so check it is open. | medium | [1](https://www.porscheclubgb.com/regions-registers/regions/scotland/south-scotland/events/2026/july/save-the-date-oban-glencoe-run) [2](https://forums.thelotusforums.com/topic/64803-legs-breakfast-4th-may-duck-bay-marina) |
| **The Bikers Cove, South Queensferry** | 55.9903, -3.3855 | Seafront biker café under the Forth bridges at South Queensferry. | Voted favourite biker café in the UK (2017 and 2021) by The Biker Guide's Facebook group; regular bike nights and rallies, free Biker Down training (Devitt). | Small seafront street; check opening times on Facebook. | medium | [1](https://www.thebikerguide.co.uk/motorcyclemeetingplacesscotland) [2](https://www.devittinsurance.com/guides/biker-cafes/scotland/the-bikers-cove/) |
| **Leadburn Inn (Motor Crossroads Café)** | 55.787, -3.2213 | Inn and café at the Leadburn crossroads (A701/A703/A6094) south of Edinburgh – on the way to the A701 drive. | Large car park and regular events such as "Thunder Thursday" (Devitt). | Event details may be out of date – check before you go. | medium | [1](https://www.devittinsurance.com/guides/biker-cafes/scotland/the-leadburn-motor-crossroads-cafe/) |
| **The Horn Milk Bar, Errol** | 56.4232, -3.2225 | Iconic 1960s-style roadside tea bar on the A90 between Perth and Dundee. | Listed by The Biker Guide as a Perthshire biker meeting place; plenty of parking; open daily. | Turn in and out of the dual carriageway with care. | medium | [1](https://www.thebikerguide.co.uk/motorcyclemeetingplacesscotland) |
| **Route 74 Truckstop, Lesmahagow** | 55.6485, -3.8921 | Truckstop with Wheelers Diner at junction 10 of the M74. | Listed by The Biker Guide as a main Scottish biker meeting place – "all bikers are very welcome". | Working truck stop – watch for HGVs. | medium | [1](https://www.thebikerguide.co.uk/motorcyclemeetingplacesscotland) |
| **West Coast Harley-Davidson, Hillington** | 55.8657, -4.371 | Harley-Davidson dealer with the J26 café at Hillington, by the M8. | Bike night on the last Thursday of the month (April to September) and monthly events (The Biker Guide). | Check the dealer's event dates; industrial estate parking. | medium | [1](https://www.thebikerguide.co.uk/motorcyclemeetingplacesscotland) [2](OpenStreetMap (ODbL)) |
| **The Midge Bite Café, Achnasheen** | 57.5807, -5.0711 | Café at Achnasheen where the A832 and A890 meet, on the NC500. | Listed by The Biker Guide; good parking and "your beloved motorcycle is visible from the dining area". | Daytime only (shorter hours on Sundays); remote – plan fuel. | medium | [1](https://www.thebikerguide.co.uk/motorcyclemeetingplacesscotland) |
| **Applecross Inn** | 57.4327, -5.8158 | Seafront inn in Applecross at the foot of the Bealach na Bà, start of the Applecross coast road drive. | Listed by The Biker Guide as a Highlands biker meeting place; the classic stop after the Bealach. | Very busy in summer; small village with limited parking. | high | [1](https://www.thebikerguide.co.uk/motorcyclemeetingplacesscotland) [2](https://en.wikipedia.org/wiki/Applecross) |
| **Riverside Museum, Glasgow** | 55.8652, -4.3062 | Glasgow's transport museum on the Clyde (Zaha Hadid building), with cars, motorbikes, trams and locomotives. | European Museum of the Year 2013; free entry. | City location by the Clyde; pay parking nearby. | high | [1](https://en.wikipedia.org/wiki/Riverside_Museum) |
| **Grampian Transport Museum, Alford** | 57.2334, -2.7015 | Transport museum in Alford with working and climb-aboard vehicles and its own small test track. | Focus on the transport history of north-east Scotland; hosts vehicle events in season. | Seasonal opening – check before you go. | high | [1](https://en.wikipedia.org/wiki/Grampian_Transport_Museum) [2](OpenStreetMap (ODbL)) |
| **Ulster Transport Museum, Cultra** | 54.6551, -5.8032 | Transport museum at Cultra near Holywood, east of Belfast, beside the Ulster Folk Museum. | One of Ireland's foremost visitor attractions (Wikipedia), with cars, motorcycles and rail. | Check opening days; pay entry. | high | [1](https://en.wikipedia.org/wiki/Ulster_Folk_and_Transport_Museums) |
| **The Ponderosa, Glenshane Pass** | 54.8708, -6.7834 | Bar and restaurant at the top of the Glenshane Pass on the A6. | Listed by The Biker Guide as a Northern Ireland biker meeting place; on the Glenshane Pass drive. | Exposed in winter weather; turn in and out of the A6 with care. | medium | [1](https://www.thebikerguide.co.uk/bikerfriendlymeetingplacesireland) |
| **Joey's Bar, Ballymoney** | 55.0665, -6.5144 | Bar in Ballymoney, home town of road-racing legend Joey Dunlop (26 Isle of Man TT wins). | Listed by The Biker Guide as a biker meeting place; a pilgrimage stop for road-racing fans, close to the North West 200. | Town-centre parking. | medium | [1](https://www.thebikerguide.co.uk/bikerfriendlymeetingplacesireland) [2](https://en.wikipedia.org/wiki/Joey_Dunlop) |
| **Maud's Café, Newcastle** | 54.2108, -5.8901 | Café on the seafront main street at Newcastle, at the foot of the Mournes. | Listed by The Biker Guide as a County Down biker meeting place; base for the Spelga/Mournes roads. | Busy seaside town in summer; limited parking on Main Street. | medium | [1](https://www.thebikerguide.co.uk/bikerfriendlymeetingplacesireland) |

## Avoid – police hotspots, dispersal zones and road rules

These are not suggestions. Use them to keep the app from surfacing these places, and to warn users nearby. They are not in the JSON. Rows marked **zone** are in `banZones` in the data module (a rough circle round the area). Neither zone is a formal order – they are places where the police repeatedly act against car meets – so re-check them each season.

| Area | Place / order | What applies | Zone | Conf. | Sources |
|---|---|---|---|---|---|
| Scotland | **Aberdeen – beach (Queens Links Leisure Park/Beach Boulevard) and Garthdee Road** | No PSPO-type order (Scotland has none), but repeated large unauthorised meets and Police Scotland crackdowns: about 700 cars on Garthdee Road on 30 May 2026 (two arrests, 14 prohibitions, 3 cars seized for no insurance, 58 fixed penalties); about 200 cars across the beach, Garthdee and Portlethen on 25 July 2026 (45 conditional offers, 3 ASBOs, cars seized and clamped). Earlier, 13 men were charged after a Queens Links meet and some cars were seized under anti-social driving law. | zone `bz-sni-aberdeen` (57.14, -2.105, r 3 mi) | medium | [1](https://news.stv.tv/north/two-arrests-as-police-descend-on-car-meet-up-involving-700-vehicles) [2](https://news.stv.tv/north/police-descend-on-unauthorised-meet-up-involving-200-cars-in-aberdeen) [3](https://www.scotsman.com/queens-links-leisure-park-thirteen-charged-over-large-illegal-car-event-posing-extremely-high-risk-to-bystanders-3277680) |
| Northern Ireland | **Portrush and Portstewart (Causeway Coast) – car cruising and "diffing"** | PSNI said before Easter 2026 that it is "very much aware of car cruising and diffing" and will not tolerate anti-social driving linked to car meets, with roadworthiness checks. Portstewart Promenade has a long-running Sunday cruise that police have blocked with checkpoints and diversions in the past. | zone `bz-sni-portrush-portstewart` (55.192, -6.67, r 2.5 mi) | medium | [1](https://www.irishnews.com/news/northern-ireland/police-warning-over-diffing-and-other-anti-social-driving-in-the-north-coast-this-easter-M7YQ3JGCZJDT5PDIB4P4NJZ2ZY/) [2](https://www.newsletter.co.uk/news/crime/criticism-psni-after-boy-racer-action-blocks-town-2957698) |
| Scotland | **Scotland-wide – the legal position** | Scotland has no PSPOs. Police can disperse groups in an authorised dispersal zone and seize vehicles driven in a manner causing alarm, distress or annoyance (Antisocial Behaviour etc. (Scotland) Act 2004, Part 3 and section 126). Cars were seized under this at Aberdeen meets. | no zone | medium | [1](https://www.legislation.gov.uk/asp/2004/8/contents) |
| Scotland | **Glasgow city centre dispersal zone (2026)** | A city-centre dispersal zone brought in in March 2026 for anti-social behaviour generally (not car meets); powers used about 1,300 times in three months and kept in place. No zone added because it is not about vehicles – but don't gather in the city centre. | no zone | medium | [1](https://news.stv.tv/west-central/glasgow-dispersal-zone-to-remain-in-place-with-powers-used-1300-in-three-months) |
| Scotland | **Dundee – Clepington Road area** | June 2024 "gathering": 14 vehicles seized (tinted windscreens, drug driving, no insurance). One event, so no zone. | no zone | medium | [1](https://news.stv.tv/north/police-seize-14-vehicles-for-tinted-windscreens-and-drug-driving-at-dundee-gathering) |
| Scotland | **Edinburgh – Hermiston Gait park and ride** | Police stepped up patrols over an unofficial "Mega Meet" after residents complained (date not confirmed – the article could not be opened). No zone. | no zone | low | [1](https://www.midlothianadvertiser.co.uk/news/crime/edinburgh-police-step-up-patrols-at-hermiston-amid-residents-concerns-over-mega-meet-unofficial-car-rally-4430403) |
| Scotland | **North Coast 500 – single-track rules and enforcement** | Police Scotland's Highlands and Islands road policing runs Operation Cedar and enforcement weekends on the NC500 with marked and unmarked cars and marked motorcycles. Rules: use passing places to let others pass, don't park in them, don't travel in convoy, and "the North Coast 500 is not a racetrack". | no zone | high | [1](https://www.highland.gov.uk/news/article/15280/police_scotland_are_once_again_issuing_advice_for_those_travelling_on_the_nc500_this_summer) [2](https://www.northcoast500.com/top-tips-hitting-route/road-safety) |
| Scotland | **Bealach na Bà (already in the app)** | Advisory signs at both ends: climbs to 2,053 ft with 1-in-5 gradients and hairpins; not advised for learner drivers, very large vehicles or caravans; often impassable in winter. Advisory, not a legal ban – use the A896/coast road for big vehicles. | no zone | medium | [1](https://www.sundaypost.com/?p=38904) [2](https://pressandjournal.co.uk/fp/news/highlands-islands/6240262/bealach-na-ba-how-life-has-changed-since-the-route-morphed-into-one-of-scotlands-top-bucket-list-destinations) |
| Scotland | **Glen Etive road** | National Trust for Scotland visitor management: stop only in designated parking areas and lay-bys, never on the verge or in passing places; drive on if full. | no zone | high | [1](https://www.nts.org.uk/stories/work-begins-to-improve-visitor-experience-at-glencoe-nnr) |
| Northern Ireland | **West Belfast – Stewartstown Road (Colin)** | 4 May 2026: two PSNI officers hurt and five police vehicles damaged at a car and scrambler meet with dangerous driving. One event, so no zone. | no zone | medium | [1](https://www.hellorayo.co.uk/cool-fm/local/news/two-psni-officers-attacked-during-disorder-at-belfast-car-meet) |
| Northern Ireland | **Dark Hedges (Bregagh Road)** | Closed to general vehicle traffic since 30 October 2017 (Department for Infrastructure) to protect the beech trees – you can't drive or photograph a car there. | no zone | high | [1](https://en.wikipedia.org/wiki/Dark_Hedges) |

**Checked, nothing current found** (absence of evidence – not a guarantee):

- Inverness – no current car-meet order or police hotspot found.
- Elgin (Springfield Retail Park) – only a 2021 meet found.
- Glasgow – no car-meet-specific order found (the 2026 city-centre dispersal zone is general).
- Belfast Boucher Road, Sprucefield and Airport Road – nothing found.

**Not fully researched (search budget):** Perth, Stirling and Falkirk (incl. the Kelpies), the Ayrshire coast (Ayr, Largs), Dumfries, Inverness city beyond a quick check, Derry/Londonderry, Newry, Bangor and the Ards, Lisburn. Run a second pass before launch.

## Dropped or left out on purpose

- Scenic photo spots without car/bike evidence (owner rule): Giant's Causeway, Three Sisters (Glencoe), Duncansby Head, Dunnet Head, Glenfinnan Viaduct, Eilean Donan, Quiraing, Corrieshalloch Gorge, Loch Garry viewpoint, Devil's Beef Tub, Clatteringshaws and Grey Mare's Tail – good views, but no source showing car or bike shoots there. Several are mentioned in the drive descriptions instead.
- Dark Hedges – Bregagh Road has been closed to vehicles since October 2017; not a car or bike spot (listed under Avoid).
- The Kelpies/Helix, Falkirk – no source for car meets or shoots found.
- Kames Motorsport Complex (Muirkirk) – no current source found (kames.co.uk is now an unrelated business).
- Bush Motorsport (NI), Craigantlet hill climb and the Bo'ness Revival – not verified for 2026 within the search budget.
- Elgin Springfield Retail Park meet – only a 2021 report, so not an Avoid zone.
- A87 on Skye (Kyleakin–Sligachan) and the Glenariff A43 – left out to keep the list to well-sourced drives; the Torr Head scenic road is too narrow to offer as a drive (Torr Head is a photo spot).
- Duplicates of bundled places (see "Not duplicated" above), including A939 Cock Bridge–Tomintoul and the Rest and Be Thankful car park as a venue.

## Route waypoints

The full waypoint lists are in the `path` field of each drive in the JSON below (lat/lng to 4 decimal places, on the routed road line).

## Machine-readable data

```json
[
 {
  "id": "sni-applecross-coast",
  "kind": "drive",
  "name": "Applecross coast road (Applecross to Shieldaig)",
  "area": "Wester Ross",
  "description": "The long way round the Applecross peninsula: north along the Inner Sound past Fearnmore, then east along Loch Torridon via Kenmore and Ardheslaig to the A896 by Shieldaig.",
  "warnings": "Single-track with passing places: pull into a passing place on your left (or wait opposite one on your right) for oncoming traffic and to let faster vehicles past, and never park in one (Police Scotland/NC500 advice). Blind crests and tight bends; sheep and deer on the road; very remote with no phone signal in places (BestBikingRoads); slow camper traffic in summer.",
  "at": {
   "lat": 57.4328,
   "lng": -5.8094
  },
  "path": [
   {
    "lat": 57.4328,
    "lng": -5.8094
   },
   {
    "lat": 57.443,
    "lng": -5.8096
   },
   {
    "lat": 57.4415,
    "lng": -5.8378
   },
   {
    "lat": 57.4493,
    "lng": -5.8594
   },
   {
    "lat": 57.4653,
    "lng": -5.8621
   },
   {
    "lat": 57.4806,
    "lng": -5.8632
   },
   {
    "lat": 57.4965,
    "lng": -5.8605
   },
   {
    "lat": 57.5138,
    "lng": -5.8582
   },
   {
    "lat": 57.5287,
    "lng": -5.8518
   },
   {
    "lat": 57.5433,
    "lng": -5.8437
   },
   {
    "lat": 57.5553,
    "lng": -5.832
   },
   {
    "lat": 57.5693,
    "lng": -5.8206
   },
   {
    "lat": 57.5747,
    "lng": -5.8018
   },
   {
    "lat": 57.5655,
    "lng": -5.7861
   },
   {
    "lat": 57.5568,
    "lng": -5.7691
   },
   {
    "lat": 57.5498,
    "lng": -5.7553
   },
   {
    "lat": 57.537,
    "lng": -5.7413
   },
   {
    "lat": 57.5409,
    "lng": -5.7253
   },
   {
    "lat": 57.5395,
    "lng": -5.7079
   },
   {
    "lat": 57.529,
    "lng": -5.6915
   },
   {
    "lat": 57.5202,
    "lng": -5.6714
   },
   {
    "lat": 57.5103,
    "lng": -5.6526
   },
   {
    "lat": 57.5162,
    "lng": -5.6474
   },
   {
    "lat": 57.5236,
    "lng": -5.6504
   }
  ],
  "miles": 25.2,
  "start": "Applecross",
  "end": "A896 near Shieldaig",
  "sources": [
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/highland-scotland/ride/kyle-of-lochalsh-new-kelso-applecross-fearnmore-balgy",
   "https://en.wikipedia.org/wiki/Applecross",
   "https://www.northcoast500.com/top-tips-hitting-route/road-safety"
  ],
  "confidence": "medium"
 },
 {
  "id": "sni-a896-torridon",
  "kind": "drive",
  "name": "A896 Lochcarron to Kinlochewe via Torridon",
  "area": "Wester Ross",
  "description": "Round Loch Kishorn past the Bealach na Bà turn at Tornapress, over to Shieldaig, along Upper Loch Torridon and up Glen Torridon under Liathach and Beinn Eighe to Kinlochewe.",
  "warnings": "Single-track with passing places: pull into a passing place on your left (or wait opposite one on your right) for oncoming traffic and to let faster vehicles past, and never park in one (Police Scotland/NC500 advice). Long single-track sections between Shieldaig and Kinlochewe; walkers' cars parked at Glen Torridon trailheads; deer, especially at dusk.",
  "at": {
   "lat": 57.4005,
   "lng": -5.4906
  },
  "path": [
   {
    "lat": 57.4005,
    "lng": -5.4906
   },
   {
    "lat": 57.4025,
    "lng": -5.5089
   },
   {
    "lat": 57.4059,
    "lng": -5.5369
   },
   {
    "lat": 57.4047,
    "lng": -5.5661
   },
   {
    "lat": 57.3994,
    "lng": -5.5932
   },
   {
    "lat": 57.4081,
    "lng": -5.6092
   },
   {
    "lat": 57.4259,
    "lng": -5.5993
   },
   {
    "lat": 57.4398,
    "lng": -5.5856
   },
   {
    "lat": 57.4541,
    "lng": -5.5847
   },
   {
    "lat": 57.4689,
    "lng": -5.5858
   },
   {
    "lat": 57.4824,
    "lng": -5.6007
   },
   {
    "lat": 57.4946,
    "lng": -5.6195
   },
   {
    "lat": 57.5065,
    "lng": -5.6365
   },
   {
    "lat": 57.5202,
    "lng": -5.6472
   },
   {
    "lat": 57.5218,
    "lng": -5.6298
   },
   {
    "lat": 57.5296,
    "lng": -5.6104
   },
   {
    "lat": 57.5264,
    "lng": -5.5866
   },
   {
    "lat": 57.5278,
    "lng": -5.5575
   },
   {
    "lat": 57.5271,
    "lng": -5.5291
   },
   {
    "lat": 57.5354,
    "lng": -5.5065
   },
   {
    "lat": 57.5404,
    "lng": -5.4877
   },
   {
    "lat": 57.5491,
    "lng": -5.4627
   },
   {
    "lat": 57.5533,
    "lng": -5.4359
   },
   {
    "lat": 57.5565,
    "lng": -5.4083
   },
   {
    "lat": 57.5647,
    "lng": -5.3845
   },
   {
    "lat": 57.5664,
    "lng": -5.3577
   },
   {
    "lat": 57.5725,
    "lng": -5.3317
   },
   {
    "lat": 57.586,
    "lng": -5.3109
   },
   {
    "lat": 57.6017,
    "lng": -5.3055
   },
   {
    "lat": 57.604,
    "lng": -5.3051
   }
  ],
  "miles": 32.0,
  "start": "Lochcarron",
  "end": "Kinlochewe",
  "sources": [
   "https://en.wikipedia.org/wiki/Torridon",
   "https://www.sundaypost.com/?p=38904",
   "https://www.northcoast500.com/top-tips-hitting-route/road-safety"
  ],
  "confidence": "medium"
 },
 {
  "id": "sni-a832-loch-maree",
  "kind": "drive",
  "name": "A832 Loch Maree (Kinlochewe to Gairloch)",
  "area": "Wester Ross",
  "description": "Along the south shore of Loch Maree under Slioch, through the Slattadale forest and down to Gairloch.",
  "warnings": "Mostly two-way but with a single-track section near Gairloch – use passing places properly; deer; NC500 campervans; police and marked motorcycle patrols run enforcement weekends on the NC500 (Operation Cedar).",
  "at": {
   "lat": 57.604,
   "lng": -5.3
  },
  "path": [
   {
    "lat": 57.604,
    "lng": -5.3
   },
   {
    "lat": 57.616,
    "lng": -5.3206
   },
   {
    "lat": 57.627,
    "lng": -5.342
   },
   {
    "lat": 57.6364,
    "lng": -5.3649
   },
   {
    "lat": 57.6487,
    "lng": -5.3849
   },
   {
    "lat": 57.6538,
    "lng": -5.4095
   },
   {
    "lat": 57.6628,
    "lng": -5.4325
   },
   {
    "lat": 57.6717,
    "lng": -5.4584
   },
   {
    "lat": 57.6752,
    "lng": -5.4855
   },
   {
    "lat": 57.6804,
    "lng": -5.5097
   },
   {
    "lat": 57.6828,
    "lng": -5.5393
   },
   {
    "lat": 57.6925,
    "lng": -5.5607
   },
   {
    "lat": 57.6888,
    "lng": -5.5894
   },
   {
    "lat": 57.6869,
    "lng": -5.6173
   },
   {
    "lat": 57.6855,
    "lng": -5.6438
   },
   {
    "lat": 57.6948,
    "lng": -5.6569
   },
   {
    "lat": 57.7068,
    "lng": -5.6735
   },
   {
    "lat": 57.7203,
    "lng": -5.6863
   },
   {
    "lat": 57.7282,
    "lng": -5.6941
   }
  ],
  "miles": 20.0,
  "start": "Kinlochewe",
  "end": "Gairloch",
  "sources": [
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/highland-scotland/ride/a832-a835-kinlochewe-ullapool-west-coast-heaven",
   "https://en.wikipedia.org/wiki/Loch_Maree",
   "https://www.highland.gov.uk/news/article/15280/police_scotland_are_once_again_issuing_advice_for_those_travelling_on_the_nc500_this_summer"
  ],
  "confidence": "high"
 },
 {
  "id": "sni-a832-gruinard",
  "kind": "drive",
  "name": "A832 Gruinard Bay (Poolewe to Corrie Hallie)",
  "area": "Wester Ross",
  "description": "From Poolewe past Aultbea and Laide, round Gruinard Bay with its beaches, then along Little Loch Broom to Dundonnell and Corrie Hallie.",
  "warnings": "Single-track in places with passing places; blind crests round Gruinard; sheep and deer; summer NC500 traffic and campervans stopping at the viewpoints.",
  "at": {
   "lat": 57.765,
   "lng": -5.5989
  },
  "path": [
   {
    "lat": 57.765,
    "lng": -5.5989
   },
   {
    "lat": 57.7774,
    "lng": -5.5925
   },
   {
    "lat": 57.7892,
    "lng": -5.5745
   },
   {
    "lat": 57.802,
    "lng": -5.5788
   },
   {
    "lat": 57.8134,
    "lng": -5.5779
   },
   {
    "lat": 57.8274,
    "lng": -5.5777
   },
   {
    "lat": 57.8388,
    "lng": -5.575
   },
   {
    "lat": 57.8505,
    "lng": -5.5577
   },
   {
    "lat": 57.8644,
    "lng": -5.5425
   },
   {
    "lat": 57.8631,
    "lng": -5.514
   },
   {
    "lat": 57.8548,
    "lng": -5.49
   },
   {
    "lat": 57.85,
    "lng": -5.4686
   },
   {
    "lat": 57.8574,
    "lng": -5.4481
   },
   {
    "lat": 57.8705,
    "lng": -5.4397
   },
   {
    "lat": 57.8809,
    "lng": -5.4274
   },
   {
    "lat": 57.8846,
    "lng": -5.399
   },
   {
    "lat": 57.8795,
    "lng": -5.3714
   },
   {
    "lat": 57.8703,
    "lng": -5.3419
   },
   {
    "lat": 57.8615,
    "lng": -5.3167
   },
   {
    "lat": 57.8548,
    "lng": -5.2893
   },
   {
    "lat": 57.85,
    "lng": -5.2617
   },
   {
    "lat": 57.844,
    "lng": -5.2326
   },
   {
    "lat": 57.8377,
    "lng": -5.2045
   },
   {
    "lat": 57.8268,
    "lng": -5.1854
   },
   {
    "lat": 57.82,
    "lng": -5.1782
   }
  ],
  "miles": 26.6,
  "start": "Poolewe",
  "end": "Corrie Hallie (Dundonnell)",
  "sources": [
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/highland-scotland/ride/a832-a835-kinlochewe-ullapool-west-coast-heaven",
   "https://en.wikipedia.org/wiki/A832_road"
  ],
  "confidence": "high"
 },
 {
  "id": "sni-a890-stromeferry",
  "kind": "drive",
  "name": "A890 Strathcarron to Auchtertyre (Stromeferry)",
  "area": "Wester Ross",
  "description": "Along the south shore of Loch Carron under rock cuttings at Stromeferry, then over the hill to Auchtertyre on the A87 near Eilean Donan.",
  "warnings": "Steep rock cuttings above the loch – check Highland Council for closures; steep climbs and descents over the hill; deer; little traffic so animals linger on the road.",
  "at": {
   "lat": 57.4315,
   "lng": -5.4468
  },
  "path": [
   {
    "lat": 57.4315,
    "lng": -5.4468
   },
   {
    "lat": 57.4202,
    "lng": -5.4302
   },
   {
    "lat": 57.4074,
    "lng": -5.4471
   },
   {
    "lat": 57.3931,
    "lng": -5.4552
   },
   {
    "lat": 57.3817,
    "lng": -5.4745
   },
   {
    "lat": 57.3722,
    "lng": -5.4978
   },
   {
    "lat": 57.3593,
    "lng": -5.5158
   },
   {
    "lat": 57.3486,
    "lng": -5.537
   },
   {
    "lat": 57.3446,
    "lng": -5.5612
   },
   {
    "lat": 57.3367,
    "lng": -5.5397
   },
   {
    "lat": 57.3216,
    "lng": -5.5456
   },
   {
    "lat": 57.3079,
    "lng": -5.5572
   },
   {
    "lat": 57.2944,
    "lng": -5.5658
   },
   {
    "lat": 57.2858,
    "lng": -5.5813
   }
  ],
  "miles": 14.6,
  "start": "Strathcarron",
  "end": "Auchtertyre (A87)",
  "sources": [
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/highland-scotland/ride/a890-auchtertyre-loch-alsh-achnasheen-loch-gowan"
  ],
  "confidence": "high"
 },
 {
  "id": "sni-a894-kylesku",
  "kind": "drive",
  "name": "A894 Assynt: Skiag Bridge to Scourie (Kylesku Bridge)",
  "area": "Sutherland",
  "description": "North from Loch Assynt over the moor, down to the curved Kylesku Bridge across Loch a' Chàirn Bhàin, then across the lochan-studded country to Scourie.",
  "warnings": "Blind crests and narrow sections; sheep and deer on unfenced road; NC500 traffic in summer; exposed bridge in high winds.",
  "at": {
   "lat": 58.1773,
   "lng": -5.0282
  },
  "path": [
   {
    "lat": 58.1773,
    "lng": -5.0282
   },
   {
    "lat": 58.1743,
    "lng": -5.0023
   },
   {
    "lat": 58.188,
    "lng": -5.0126
   },
   {
    "lat": 58.2028,
    "lng": -5.0069
   },
   {
    "lat": 58.2161,
    "lng": -5.0
   },
   {
    "lat": 58.2289,
    "lng": -5.0082
   },
   {
    "lat": 58.2423,
    "lng": -5.0072
   },
   {
    "lat": 58.2524,
    "lng": -5.0211
   },
   {
    "lat": 58.2612,
    "lng": -5.039
   },
   {
    "lat": 58.2721,
    "lng": -5.0579
   },
   {
    "lat": 58.2853,
    "lng": -5.0749
   },
   {
    "lat": 58.2966,
    "lng": -5.1023
   },
   {
    "lat": 58.3067,
    "lng": -5.1214
   },
   {
    "lat": 58.3217,
    "lng": -5.1262
   },
   {
    "lat": 58.336,
    "lng": -5.1352
   },
   {
    "lat": 58.3428,
    "lng": -5.1585
   },
   {
    "lat": 58.3518,
    "lng": -5.1529
   }
  ],
  "miles": 17.8,
  "start": "Skiag Bridge (Loch Assynt)",
  "end": "Scourie",
  "sources": [
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/highland-scotland/ride/a894-inchnadamph-scourie-laxford-bridge",
   "https://en.wikipedia.org/wiki/Kylesku_Bridge"
  ],
  "confidence": "high"
 },
 {
  "id": "sni-a838-eriboll",
  "kind": "drive",
  "name": "A838 Durness to Tongue (Loch Eriboll)",
  "area": "Sutherland",
  "description": "East from Durness, right round Loch Eriboll, over the Moine and across the Kyle of Tongue causeway to Tongue.",
  "warnings": "Single-track with passing places: pull into a passing place on your left (or wait opposite one on your right) for oncoming traffic and to let faster vehicles past, and never park in one (Police Scotland/NC500 advice). Long single-track stretches; very remote (few services between Durness and Tongue); sheep and deer; exposed causeway in high winds.",
  "at": {
   "lat": 58.566,
   "lng": -4.7462
  },
  "path": [
   {
    "lat": 58.566,
    "lng": -4.7462
   },
   {
    "lat": 58.5642,
    "lng": -4.7268
   },
   {
    "lat": 58.5553,
    "lng": -4.7063
   },
   {
    "lat": 58.549,
    "lng": -4.6813
   },
   {
    "lat": 58.5364,
    "lng": -4.6762
   },
   {
    "lat": 58.5217,
    "lng": -4.6851
   },
   {
    "lat": 58.5093,
    "lng": -4.7013
   },
   {
    "lat": 58.4966,
    "lng": -4.7186
   },
   {
    "lat": 58.4819,
    "lng": -4.7304
   },
   {
    "lat": 58.4679,
    "lng": -4.745
   },
   {
    "lat": 58.4546,
    "lng": -4.7593
   },
   {
    "lat": 58.4448,
    "lng": -4.7454
   },
   {
    "lat": 58.4557,
    "lng": -4.7268
   },
   {
    "lat": 58.4611,
    "lng": -4.7036
   },
   {
    "lat": 58.4704,
    "lng": -4.6827
   },
   {
    "lat": 58.482,
    "lng": -4.6696
   },
   {
    "lat": 58.4938,
    "lng": -4.6608
   },
   {
    "lat": 58.5023,
    "lng": -4.6461
   },
   {
    "lat": 58.5042,
    "lng": -4.6241
   },
   {
    "lat": 58.5062,
    "lng": -4.6025
   },
   {
    "lat": 58.502,
    "lng": -4.5757
   },
   {
    "lat": 58.5048,
    "lng": -4.5469
   },
   {
    "lat": 58.5035,
    "lng": -4.5173
   },
   {
    "lat": 58.5017,
    "lng": -4.4881
   },
   {
    "lat": 58.4976,
    "lng": -4.4619
   },
   {
    "lat": 58.4923,
    "lng": -4.4341
   },
   {
    "lat": 58.4818,
    "lng": -4.4183
   },
   {
    "lat": 58.4779,
    "lng": -4.4188
   }
  ],
  "miles": 29.5,
  "start": "Durness",
  "end": "Tongue",
  "sources": [
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/highland-scotland/ride/a838-collaboll-durness-tongue",
   "https://en.wikipedia.org/wiki/A838_road",
   "https://www.northcoast500.com/top-tips-hitting-route/road-safety"
  ],
  "confidence": "high"
 },
 {
  "id": "sni-a836-caithness",
  "kind": "drive",
  "name": "A836 Caithness coast (Thurso to John o' Groats)",
  "area": "Caithness",
  "description": "East from Thurso past Castletown and Dunnet Bay (turn for Dunnet Head, the mainland's most northerly point), then Mey and the Castle of Mey to John o' Groats.",
  "warnings": "Mostly two-lane here (other parts of the A836 are single-track); exposed to strong crosswinds off the Pentland Firth; slow tourist traffic near Dunnet Head and John o' Groats; 30 mph villages.",
  "at": {
   "lat": 58.5951,
   "lng": -3.5204
  },
  "path": [
   {
    "lat": 58.5951,
    "lng": -3.5204
   },
   {
    "lat": 58.5942,
    "lng": -3.5024
   },
   {
    "lat": 58.5931,
    "lng": -3.4708
   },
   {
    "lat": 58.5943,
    "lng": -3.4393
   },
   {
    "lat": 58.5954,
    "lng": -3.4086
   },
   {
    "lat": 58.5922,
    "lng": -3.3817
   },
   {
    "lat": 58.5978,
    "lng": -3.3541
   },
   {
    "lat": 58.6133,
    "lng": -3.3435
   },
   {
    "lat": 58.627,
    "lng": -3.3277
   },
   {
    "lat": 58.631,
    "lng": -3.2982
   },
   {
    "lat": 58.6335,
    "lng": -3.2675
   },
   {
    "lat": 58.6357,
    "lng": -3.2366
   },
   {
    "lat": 58.6451,
    "lng": -3.2089
   },
   {
    "lat": 58.6418,
    "lng": -3.1782
   },
   {
    "lat": 58.6368,
    "lng": -3.151
   },
   {
    "lat": 58.6385,
    "lng": -3.1187
   },
   {
    "lat": 58.6423,
    "lng": -3.0892
   },
   {
    "lat": 58.64,
    "lng": -3.0688
   }
  ],
  "miles": 19.8,
  "start": "Thurso",
  "end": "John o' Groats",
  "sources": [
   "https://en.wikipedia.org/wiki/A836_road",
   "https://en.wikipedia.org/wiki/Dunnet_Head"
  ],
  "confidence": "medium"
 },
 {
  "id": "sni-a9-berriedale",
  "kind": "drive",
  "name": "A9 Helmsdale to Dunbeath (Berriedale Braes)",
  "area": "Caithness",
  "description": "North from Helmsdale over the Ord of Caithness, down and up the Berriedale Braes and along the clifftops to Dunbeath.",
  "warnings": "Steep gradients and tight bends at the Ord and Berriedale – HGVs crawl on the climbs; the main road north, so expect lorries and campervans; crosswinds on the clifftops; deer.",
  "at": {
   "lat": 58.1179,
   "lng": -3.6485
  },
  "path": [
   {
    "lat": 58.1179,
    "lng": -3.6485
   },
   {
    "lat": 58.1281,
    "lng": -3.633
   },
   {
    "lat": 58.1373,
    "lng": -3.6095
   },
   {
    "lat": 58.1462,
    "lng": -3.5989
   },
   {
    "lat": 58.1598,
    "lng": -3.5888
   },
   {
    "lat": 58.1632,
    "lng": -3.5624
   },
   {
    "lat": 58.1699,
    "lng": -3.5336
   },
   {
    "lat": 58.179,
    "lng": -3.5099
   },
   {
    "lat": 58.1877,
    "lng": -3.4978
   },
   {
    "lat": 58.1997,
    "lng": -3.48
   },
   {
    "lat": 58.2151,
    "lng": -3.4785
   },
   {
    "lat": 58.2251,
    "lng": -3.4539
   },
   {
    "lat": 58.2394,
    "lng": -3.445
   },
   {
    "lat": 58.2495,
    "lng": -3.4259
   }
  ],
  "miles": 15.0,
  "start": "Helmsdale",
  "end": "Dunbeath",
  "sources": [
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/highland-scotland/ride/a9-a99-inverness-john-o-groats",
   "https://en.wikipedia.org/wiki/Berriedale,_Highland"
  ],
  "confidence": "high"
 },
 {
  "id": "sni-a855-trotternish",
  "kind": "drive",
  "name": "A855 Trotternish (Portree to Staffin)",
  "area": "Isle of Skye",
  "description": "North from Portree under the Storr and the Old Man of Storr, past the lochs and the Kilt Rock coast to Staffin.",
  "warnings": "Narrow with blind bends and single-track sections; very busy with coaches and cars at the Storr and Kilt Rock in summer – never stop on the verge; sheep; Portree is congested.",
  "at": {
   "lat": 57.413,
   "lng": -6.195
  },
  "path": [
   {
    "lat": 57.413,
    "lng": -6.195
   },
   {
    "lat": 57.4238,
    "lng": -6.1883
   },
   {
    "lat": 57.4383,
    "lng": -6.1822
   },
   {
    "lat": 57.4543,
    "lng": -6.1818
   },
   {
    "lat": 57.47,
    "lng": -6.1834
   },
   {
    "lat": 57.4851,
    "lng": -6.175
   },
   {
    "lat": 57.4974,
    "lng": -6.1592
   },
   {
    "lat": 57.5126,
    "lng": -6.1514
   },
   {
    "lat": 57.528,
    "lng": -6.1566
   },
   {
    "lat": 57.542,
    "lng": -6.1457
   },
   {
    "lat": 57.5572,
    "lng": -6.1539
   },
   {
    "lat": 57.572,
    "lng": -6.1533
   },
   {
    "lat": 57.588,
    "lng": -6.1573
   },
   {
    "lat": 57.6028,
    "lng": -6.1678
   },
   {
    "lat": 57.6151,
    "lng": -6.1854
   },
   {
    "lat": 57.6228,
    "lng": -6.2052
   }
  ],
  "miles": 16.7,
  "start": "Portree",
  "end": "Staffin",
  "sources": [
   "https://en.wikipedia.org/wiki/The_Storr",
   "https://pressandjournal.co.uk/fp/news/highlands-islands/1052375/video-skye-starring-role-new-advert-volvo-v90"
  ],
  "confidence": "medium"
 },
 {
  "id": "sni-a830-road-to-the-isles",
  "kind": "drive",
  "name": "A830 Road to the Isles (Fort William to Mallaig)",
  "area": "Lochaber",
  "description": "West from Banavie past Corpach and along Loch Eil to Glenfinnan, then Loch Eilt, Lochailort, Arisaig and the Morar sands to the ferry port at Mallaig.",
  "warnings": "Glenfinnan is gridlocked in summer by viaduct and Jacobite steam-train visitors – use the paid car park only; a stretch of poorer surface (BestBikingRoads); deer; ferry traffic towards Mallaig. Skye ferry from Mallaig must be booked.",
  "at": {
   "lat": 56.8459,
   "lng": -5.0948
  },
  "path": [
   {
    "lat": 56.8459,
    "lng": -5.0948
   },
   {
    "lat": 56.8439,
    "lng": -5.1225
   },
   {
    "lat": 56.8448,
    "lng": -5.1513
   },
   {
    "lat": 56.8531,
    "lng": -5.176
   },
   {
    "lat": 56.8557,
    "lng": -5.2049
   },
   {
    "lat": 56.8552,
    "lng": -5.2346
   },
   {
    "lat": 56.8546,
    "lng": -5.2642
   },
   {
    "lat": 56.8564,
    "lng": -5.2931
   },
   {
    "lat": 56.8597,
    "lng": -5.3215
   },
   {
    "lat": 56.86,
    "lng": -5.351
   },
   {
    "lat": 56.8622,
    "lng": -5.3793
   },
   {
    "lat": 56.8599,
    "lng": -5.404
   },
   {
    "lat": 56.8677,
    "lng": -5.4271
   },
   {
    "lat": 56.8728,
    "lng": -5.4525
   },
   {
    "lat": 56.8786,
    "lng": -5.478
   },
   {
    "lat": 56.8758,
    "lng": -5.5061
   },
   {
    "lat": 56.8772,
    "lng": -5.5294
   },
   {
    "lat": 56.8783,
    "lng": -5.5548
   },
   {
    "lat": 56.8811,
    "lng": -5.5801
   },
   {
    "lat": 56.8832,
    "lng": -5.6074
   },
   {
    "lat": 56.8853,
    "lng": -5.6318
   },
   {
    "lat": 56.8828,
    "lng": -5.6585
   },
   {
    "lat": 56.8804,
    "lng": -5.6822
   },
   {
    "lat": 56.8872,
    "lng": -5.7076
   },
   {
    "lat": 56.8927,
    "lng": -5.7312
   },
   {
    "lat": 56.8936,
    "lng": -5.7561
   },
   {
    "lat": 56.9002,
    "lng": -5.765
   },
   {
    "lat": 56.8989,
    "lng": -5.7932
   },
   {
    "lat": 56.9064,
    "lng": -5.82
   },
   {
    "lat": 56.9113,
    "lng": -5.8386
   },
   {
    "lat": 56.9246,
    "lng": -5.85
   },
   {
    "lat": 56.9405,
    "lng": -5.8413
   },
   {
    "lat": 56.9544,
    "lng": -5.8291
   },
   {
    "lat": 56.9673,
    "lng": -5.8237
   },
   {
    "lat": 56.983,
    "lng": -5.8273
   },
   {
    "lat": 56.9979,
    "lng": -5.8331
   },
   {
    "lat": 57.0051,
    "lng": -5.8292
   }
  ],
  "miles": 39.9,
  "start": "Banavie (Fort William)",
  "end": "Mallaig",
  "sources": [
   "https://en.wikipedia.org/wiki/A830_road",
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/argyll-bute-scotland/ride/a830-fort-william-mallaig"
  ],
  "confidence": "high"
 },
 {
  "id": "sni-a87-glengarry",
  "kind": "drive",
  "name": "A87 Invergarry to Cluanie (Glen Garry)",
  "area": "Lochaber",
  "description": "West from the A82 at Invergarry along Loch Garry, over the high ground by Loch Loyne and down to Loch Cluanie – it joins the existing Glen Shiel drive at Cluanie.",
  "warnings": "Main route to Skye – heavy summer traffic and coaches; deer; snow and ice on the high section by Loch Loyne in winter; long gaps between fuel.",
  "at": {
   "lat": 57.0698,
   "lng": -4.7925
  },
  "path": [
   {
    "lat": 57.0698,
    "lng": -4.7925
   },
   {
    "lat": 57.0675,
    "lng": -4.8209
   },
   {
    "lat": 57.0747,
    "lng": -4.8353
   },
   {
    "lat": 57.0814,
    "lng": -4.859
   },
   {
    "lat": 57.0818,
    "lng": -4.8869
   },
   {
    "lat": 57.0831,
    "lng": -4.9149
   },
   {
    "lat": 57.0819,
    "lng": -4.9439
   },
   {
    "lat": 57.0874,
    "lng": -4.9699
   },
   {
    "lat": 57.0943,
    "lng": -4.9934
   },
   {
    "lat": 57.1085,
    "lng": -4.9848
   },
   {
    "lat": 57.1221,
    "lng": -4.9725
   },
   {
    "lat": 57.1345,
    "lng": -4.9556
   },
   {
    "lat": 57.1454,
    "lng": -4.9635
   },
   {
    "lat": 57.1456,
    "lng": -4.9919
   },
   {
    "lat": 57.1485,
    "lng": -5.0207
   },
   {
    "lat": 57.1482,
    "lng": -5.0493
   },
   {
    "lat": 57.1426,
    "lng": -5.0731
   },
   {
    "lat": 57.1473,
    "lng": -5.1002
   },
   {
    "lat": 57.1467,
    "lng": -5.1057
   }
  ],
  "miles": 19.3,
  "start": "Invergarry (A82)",
  "end": "Cluanie Inn",
  "sources": [
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/highland-scotland/ride/a87-invergarry-kyle-of-lochalsh",
   "https://en.wikipedia.org/wiki/A87_road",
   "https://en.wikipedia.org/wiki/Loch_Garry"
  ],
  "confidence": "high"
 },
 {
  "id": "sni-b862-south-loch-ness",
  "kind": "drive",
  "name": "South Loch Ness: B862/B852 Fort Augustus to Dores",
  "area": "Great Glen",
  "description": "General Wade's Military Road out of Fort Augustus over the hills past Loch Tarff to Whitebridge, then down to Foyers and along the quiet south shore of Loch Ness to Dores.",
  "warnings": "Single-track sections with blind corners, especially from Fort Augustus to Foyers and near Dores – extra care on corners; deer; walkers and cyclists on the South Loch Ness Trail.",
  "at": {
   "lat": 57.1447,
   "lng": -4.6799
  },
  "path": [
   {
    "lat": 57.1447,
    "lng": -4.6799
   },
   {
    "lat": 57.1385,
    "lng": -4.661
   },
   {
    "lat": 57.1438,
    "lng": -4.6378
   },
   {
    "lat": 57.1474,
    "lng": -4.6138
   },
   {
    "lat": 57.1536,
    "lng": -4.5882
   },
   {
    "lat": 57.1608,
    "lng": -4.5622
   },
   {
    "lat": 57.1756,
    "lng": -4.5456
   },
   {
    "lat": 57.1885,
    "lng": -4.5278
   },
   {
    "lat": 57.2011,
    "lng": -4.5098
   },
   {
    "lat": 57.2128,
    "lng": -4.4966
   },
   {
    "lat": 57.2248,
    "lng": -4.4817
   },
   {
    "lat": 57.2372,
    "lng": -4.4736
   },
   {
    "lat": 57.246,
    "lng": -4.4839
   },
   {
    "lat": 57.2586,
    "lng": -4.4665
   },
   {
    "lat": 57.2717,
    "lng": -4.4494
   },
   {
    "lat": 57.2845,
    "lng": -4.4536
   },
   {
    "lat": 57.298,
    "lng": -4.4385
   },
   {
    "lat": 57.3112,
    "lng": -4.4225
   },
   {
    "lat": 57.3254,
    "lng": -4.4065
   },
   {
    "lat": 57.3384,
    "lng": -4.3842
   },
   {
    "lat": 57.3541,
    "lng": -4.3639
   },
   {
    "lat": 57.3688,
    "lng": -4.3478
   },
   {
    "lat": 57.3804,
    "lng": -4.3325
   }
  ],
  "miles": 25.1,
  "start": "Fort Augustus",
  "end": "Dores",
  "sources": [
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/highland-scotland/ride/b862-b852-fort-augustus-inverness"
  ],
  "confidence": "medium"
 },
 {
  "id": "sni-a86-laggan",
  "kind": "drive",
  "name": "A86 Spean Bridge to Newtonmore (Loch Laggan)",
  "area": "Highlands",
  "description": "East from Spean Bridge through Roybridge and Glen Spean, along Loch Laggan past the Laggan Dam, then Laggan and down the Spey to Newtonmore.",
  "warnings": "Visitors stopping suddenly for views (BestBikingRoads); deer; some narrow sections between Laggan and Newtonmore; snow on the high ground in winter.",
  "at": {
   "lat": 56.8904,
   "lng": -4.9199
  },
  "path": [
   {
    "lat": 56.8904,
    "lng": -4.9199
   },
   {
    "lat": 56.8948,
    "lng": -4.8976
   },
   {
    "lat": 56.8908,
    "lng": -4.8701
   },
   {
    "lat": 56.8909,
    "lng": -4.8416
   },
   {
    "lat": 56.8858,
    "lng": -4.8137
   },
   {
    "lat": 56.889,
    "lng": -4.7886
   },
   {
    "lat": 56.8892,
    "lng": -4.7613
   },
   {
    "lat": 56.8901,
    "lng": -4.7331
   },
   {
    "lat": 56.888,
    "lng": -4.7064
   },
   {
    "lat": 56.8903,
    "lng": -4.6781
   },
   {
    "lat": 56.8977,
    "lng": -4.6537
   },
   {
    "lat": 56.9005,
    "lng": -4.6251
   },
   {
    "lat": 56.9073,
    "lng": -4.5989
   },
   {
    "lat": 56.9134,
    "lng": -4.571
   },
   {
    "lat": 56.9266,
    "lng": -4.5456
   },
   {
    "lat": 56.9343,
    "lng": -4.5208
   },
   {
    "lat": 56.9458,
    "lng": -4.5012
   },
   {
    "lat": 56.9556,
    "lng": -4.4801
   },
   {
    "lat": 56.9635,
    "lng": -4.4534
   },
   {
    "lat": 56.9718,
    "lng": -4.4283
   },
   {
    "lat": 56.9758,
    "lng": -4.4023
   },
   {
    "lat": 56.9783,
    "lng": -4.3767
   },
   {
    "lat": 56.9842,
    "lng": -4.3517
   },
   {
    "lat": 56.9911,
    "lng": -4.3268
   },
   {
    "lat": 57.0058,
    "lng": -4.3135
   },
   {
    "lat": 57.0122,
    "lng": -4.2895
   },
   {
    "lat": 57.0194,
    "lng": -4.266
   },
   {
    "lat": 57.0176,
    "lng": -4.2373
   },
   {
    "lat": 57.0238,
    "lng": -4.2117
   },
   {
    "lat": 57.0307,
    "lng": -4.1903
   },
   {
    "lat": 57.0397,
    "lng": -4.167
   },
   {
    "lat": 57.0527,
    "lng": -4.1487
   },
   {
    "lat": 57.0628,
    "lng": -4.1275
   },
   {
    "lat": 57.0635,
    "lng": -4.1197
   }
  ],
  "miles": 36.8,
  "start": "Spean Bridge",
  "end": "Newtonmore",
  "sources": [
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/north-east-scotland/ride/a86-newtonmore-spean-bridge-loch-laggan"
  ],
  "confidence": "high"
 },
 {
  "id": "sni-sma-glen",
  "kind": "drive",
  "name": "Sma' Glen: A822/A826 Gilmerton to Aberfeldy",
  "area": "Perthshire",
  "description": "North from Gilmerton through the Sma' Glen (Glen Almond), over to Amulree, then the A826 down Glen Cochill to Aberfeldy.",
  "warnings": "Popular with bikers, so expect police attention at weekends; sheep on the unfenced moor; cyclists; snow on the high ground by Amulree.",
  "at": {
   "lat": 56.3919,
   "lng": -3.8069
  },
  "path": [
   {
    "lat": 56.3919,
    "lng": -3.8069
   },
   {
    "lat": 56.4075,
    "lng": -3.8077
   },
   {
    "lat": 56.4201,
    "lng": -3.7875
   },
   {
    "lat": 56.431,
    "lng": -3.7641
   },
   {
    "lat": 56.4443,
    "lng": -3.7773
   },
   {
    "lat": 56.4558,
    "lng": -3.7958
   },
   {
    "lat": 56.4672,
    "lng": -3.8007
   },
   {
    "lat": 56.4822,
    "lng": -3.8006
   },
   {
    "lat": 56.4963,
    "lng": -3.7872
   },
   {
    "lat": 56.51,
    "lng": -3.7876
   },
   {
    "lat": 56.5168,
    "lng": -3.7641
   },
   {
    "lat": 56.528,
    "lng": -3.763
   },
   {
    "lat": 56.5407,
    "lng": -3.7775
   },
   {
    "lat": 56.5566,
    "lng": -3.778
   },
   {
    "lat": 56.5701,
    "lng": -3.7935
   },
   {
    "lat": 56.5818,
    "lng": -3.8131
   },
   {
    "lat": 56.596,
    "lng": -3.825
   },
   {
    "lat": 56.6057,
    "lng": -3.8329
   },
   {
    "lat": 56.615,
    "lng": -3.8492
   },
   {
    "lat": 56.62,
    "lng": -3.8651
   }
  ],
  "miles": 21.6,
  "start": "Gilmerton (Crieff)",
  "end": "Aberfeldy",
  "sources": [
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/north-east-scotland/ride/crieff-aberfeldy-via-sma-glen-a85-a822-a826",
   "https://en.wikipedia.org/wiki/Glenalmond"
  ],
  "confidence": "high"
 },
 {
  "id": "sni-a821-dukes-pass",
  "kind": "drive",
  "name": "Duke's Pass (A821), Aberfoyle to Callander",
  "area": "Trossachs",
  "description": "Up the hairpins out of Aberfoyle over the Duke's Pass (240 m), down past Loch Achray and Brig o' Turk, then along Loch Venachar to Callander.",
  "warnings": "Big coaches and slow tourist traffic – quieter in the early evening (BestBikingRoads); gravel from patching; Three Lochs Forest Drive and car-park traffic; Loch Lomond & The Trossachs National Park byelaws in summer.",
  "at": {
   "lat": 56.1792,
   "lng": -4.383
  },
  "path": [
   {
    "lat": 56.1792,
    "lng": -4.383
   },
   {
    "lat": 56.1885,
    "lng": -4.3845
   },
   {
    "lat": 56.2015,
    "lng": -4.3925
   },
   {
    "lat": 56.2121,
    "lng": -4.385
   },
   {
    "lat": 56.2216,
    "lng": -4.4013
   },
   {
    "lat": 56.2314,
    "lng": -4.4105
   },
   {
    "lat": 56.2276,
    "lng": -4.3874
   },
   {
    "lat": 56.2297,
    "lng": -4.3613
   },
   {
    "lat": 56.2269,
    "lng": -4.3344
   },
   {
    "lat": 56.2254,
    "lng": -4.3059
   },
   {
    "lat": 56.2295,
    "lng": -4.278
   },
   {
    "lat": 56.2385,
    "lng": -4.2556
   },
   {
    "lat": 56.2463,
    "lng": -4.2407
   },
   {
    "lat": 56.244,
    "lng": -4.2148
   }
  ],
  "miles": 14.5,
  "start": "Aberfoyle",
  "end": "Callander",
  "sources": [
   "https://en.wikipedia.org/wiki/Duke%27s_Pass",
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/argyll-bute-scotland/ride/a821-the-dukes-pass-callendar-aberfoyle"
  ],
  "confidence": "high"
 },
 {
  "id": "sni-a917-east-neuk",
  "kind": "drive",
  "name": "A917 East Neuk of Fife (Elie to St Andrews)",
  "area": "Fife",
  "description": "Along the East Neuk fishing villages – Elie, St Monans, Pittenweem, Anstruther, Crail – then round Fife Ness and up the coast to St Andrews.",
  "warnings": "Many 20/30 mph village limits and narrow main streets; tourist and golf traffic around St Andrews; farm traffic; cyclists on the coastal route.",
  "at": {
   "lat": 56.1903,
   "lng": -2.8199
  },
  "path": [
   {
    "lat": 56.1903,
    "lng": -2.8199
   },
   {
    "lat": 56.1972,
    "lng": -2.7948
   },
   {
    "lat": 56.2073,
    "lng": -2.7731
   },
   {
    "lat": 56.2127,
    "lng": -2.7469
   },
   {
    "lat": 56.2165,
    "lng": -2.72
   },
   {
    "lat": 56.2236,
    "lng": -2.7012
   },
   {
    "lat": 56.2351,
    "lng": -2.6838
   },
   {
    "lat": 56.2439,
    "lng": -2.6594
   },
   {
    "lat": 56.2548,
    "lng": -2.6359
   },
   {
    "lat": 56.2668,
    "lng": -2.6362
   },
   {
    "lat": 56.2818,
    "lng": -2.6449
   },
   {
    "lat": 56.2974,
    "lng": -2.6586
   },
   {
    "lat": 56.3105,
    "lng": -2.6724
   },
   {
    "lat": 56.3123,
    "lng": -2.6987
   },
   {
    "lat": 56.3137,
    "lng": -2.7237
   },
   {
    "lat": 56.3217,
    "lng": -2.7504
   },
   {
    "lat": 56.3293,
    "lng": -2.776
   },
   {
    "lat": 56.338,
    "lng": -2.7955
   }
  ],
  "miles": 19.4,
  "start": "Elie",
  "end": "St Andrews",
  "sources": [
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/north-east-scotland/ride/fife-coastal-loop"
  ],
  "confidence": "medium"
 },
 {
  "id": "sni-a712-queens-way",
  "kind": "drive",
  "name": "Queen's Way (A712) New Galloway to Newton Stewart",
  "area": "Galloway",
  "description": "The Queen's Way through the Galloway Forest Park, past Clatteringshaws Loch and Murray's Monument, down to Newton Stewart.",
  "warnings": "Timber lorries in the forest; deer and wild goats; red squirrels; sheep; Dark Sky Park – very dark at night; check surface after forestry works.",
  "at": {
   "lat": 55.0758,
   "lng": -4.1441
  },
  "path": [
   {
    "lat": 55.0758,
    "lng": -4.1441
   },
   {
    "lat": 55.0716,
    "lng": -4.1647
   },
   {
    "lat": 55.0734,
    "lng": -4.1908
   },
   {
    "lat": 55.0696,
    "lng": -4.2167
   },
   {
    "lat": 55.0676,
    "lng": -4.2437
   },
   {
    "lat": 55.061,
    "lng": -4.2681
   },
   {
    "lat": 55.0467,
    "lng": -4.2792
   },
   {
    "lat": 55.0369,
    "lng": -4.2992
   },
   {
    "lat": 55.0284,
    "lng": -4.3221
   },
   {
    "lat": 55.0209,
    "lng": -4.3453
   },
   {
    "lat": 55.016,
    "lng": -4.3669
   },
   {
    "lat": 55.0048,
    "lng": -4.3852
   },
   {
    "lat": 54.9927,
    "lng": -4.4035
   },
   {
    "lat": 54.9844,
    "lng": -4.4237
   },
   {
    "lat": 54.9731,
    "lng": -4.4393
   },
   {
    "lat": 54.9608,
    "lng": -4.4539
   },
   {
    "lat": 54.9578,
    "lng": -4.457
   }
  ],
  "miles": 17.0,
  "start": "New Galloway",
  "end": "Newton Stewart (A75)",
  "sources": [
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/south-scotland/ride/a712-newton-stewart-crockerford-or-ninemile-bar-galloway-magic"
  ],
  "confidence": "high"
 },
 {
  "id": "sni-a708-moffat-selkirk",
  "kind": "drive",
  "name": "A708 Moffat to Selkirk (St Mary's Loch)",
  "area": "Scottish Borders",
  "description": "North-east out of Moffat up the Moffat Water past the Grey Mare's Tail, over to St Mary's Loch and down the Yarrow valley to Selkirk.",
  "warnings": "Sharp crests and tight bends at the Moffat end; gravelly surfaces; sheep; walkers parking at the Grey Mare's Tail (National Trust for Scotland car park).",
  "at": {
   "lat": 55.3329,
   "lng": -3.4406
  },
  "path": [
   {
    "lat": 55.3329,
    "lng": -3.4406
   },
   {
    "lat": 55.3283,
    "lng": -3.4155
   },
   {
    "lat": 55.3327,
    "lng": -3.3943
   },
   {
    "lat": 55.3451,
    "lng": -3.3788
   },
   {
    "lat": 55.3582,
    "lng": -3.3626
   },
   {
    "lat": 55.3729,
    "lng": -3.3528
   },
   {
    "lat": 55.3835,
    "lng": -3.3333
   },
   {
    "lat": 55.3967,
    "lng": -3.3185
   },
   {
    "lat": 55.4086,
    "lng": -3.3002
   },
   {
    "lat": 55.4202,
    "lng": -3.2813
   },
   {
    "lat": 55.4319,
    "lng": -3.2621
   },
   {
    "lat": 55.441,
    "lng": -3.2415
   },
   {
    "lat": 55.4499,
    "lng": -3.2219
   },
   {
    "lat": 55.4647,
    "lng": -3.2109
   },
   {
    "lat": 55.4799,
    "lng": -3.2085
   },
   {
    "lat": 55.4952,
    "lng": -3.2039
   },
   {
    "lat": 55.4999,
    "lng": -3.1772
   },
   {
    "lat": 55.5079,
    "lng": -3.1526
   },
   {
    "lat": 55.5093,
    "lng": -3.1238
   },
   {
    "lat": 55.5132,
    "lng": -3.0956
   },
   {
    "lat": 55.5182,
    "lng": -3.0679
   },
   {
    "lat": 55.5231,
    "lng": -3.0426
   },
   {
    "lat": 55.5369,
    "lng": -3.0314
   },
   {
    "lat": 55.5393,
    "lng": -3.0066
   },
   {
    "lat": 55.5492,
    "lng": -2.9857
   },
   {
    "lat": 55.5564,
    "lng": -2.9631
   },
   {
    "lat": 55.5596,
    "lng": -2.9355
   },
   {
    "lat": 55.5527,
    "lng": -2.9115
   },
   {
    "lat": 55.54,
    "lng": -2.8956
   },
   {
    "lat": 55.5429,
    "lng": -2.8699
   },
   {
    "lat": 55.5472,
    "lng": -2.8479
   },
   {
    "lat": 55.547,
    "lng": -2.8399
   }
  ],
  "miles": 34.3,
  "start": "Moffat",
  "end": "Selkirk",
  "sources": [
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/south-scotland/ride/a708-selkirk-moffat"
  ],
  "confidence": "high"
 },
 {
  "id": "sni-a701-beef-tub",
  "kind": "drive",
  "name": "A701 Moffat to Broughton (Devil's Beef Tub)",
  "area": "Scottish Borders",
  "description": "North from Moffat up the edge of the Devil's Beef Tub, over the watershed and down the upper Tweed past Tweedsmuir to Broughton.",
  "warnings": "A few tight bends catch people out (BestBikingRoads); sheep; exposed and snowy at the Beef Tub summit; lay-by at the Beef Tub viewpoint only – don't stop on the road.",
  "at": {
   "lat": 55.3329,
   "lng": -3.4406
  },
  "path": [
   {
    "lat": 55.3329,
    "lng": -3.4406
   },
   {
    "lat": 55.3406,
    "lng": -3.4578
   },
   {
    "lat": 55.3551,
    "lng": -3.4699
   },
   {
    "lat": 55.3692,
    "lng": -3.4752
   },
   {
    "lat": 55.3841,
    "lng": -3.4847
   },
   {
    "lat": 55.3978,
    "lng": -3.484
   },
   {
    "lat": 55.404,
    "lng": -3.5078
   },
   {
    "lat": 55.4186,
    "lng": -3.5013
   },
   {
    "lat": 55.4305,
    "lng": -3.506
   },
   {
    "lat": 55.4452,
    "lng": -3.4993
   },
   {
    "lat": 55.4611,
    "lng": -3.4977
   },
   {
    "lat": 55.4764,
    "lng": -3.4906
   },
   {
    "lat": 55.487,
    "lng": -3.4689
   },
   {
    "lat": 55.4985,
    "lng": -3.4455
   },
   {
    "lat": 55.5096,
    "lng": -3.4248
   },
   {
    "lat": 55.5228,
    "lng": -3.4097
   },
   {
    "lat": 55.538,
    "lng": -3.4129
   },
   {
    "lat": 55.5525,
    "lng": -3.4068
   },
   {
    "lat": 55.5662,
    "lng": -3.3942
   },
   {
    "lat": 55.5818,
    "lng": -3.3987
   },
   {
    "lat": 55.5968,
    "lng": -3.406
   },
   {
    "lat": 55.6102,
    "lng": -3.4119
   }
  ],
  "miles": 23.6,
  "start": "Moffat",
  "end": "Broughton",
  "sources": [
   "https://en.wikipedia.org/wiki/A701_road",
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/central-scotland-and/ride/a701-howgate-moffat-the-devils-beeftub",
   "https://en.wikipedia.org/wiki/Devil%27s_Beef_Tub"
  ],
  "confidence": "high"
 },
 {
  "id": "sni-a2-antrim-coast",
  "kind": "drive",
  "name": "Antrim Coast Road (A2) Larne to Cushendall",
  "area": "County Antrim",
  "description": "The Antrim Coast Road north from Larne past Ballygally Head, Glenarm and Carnlough, round Garron Point to Waterfoot (Glenariff) and Cushendall.",
  "warnings": "Lined with unforgiving stone walls (BestBikingRoads); coaches and slow tourist traffic; villages at 30 mph; sea spray and rockfalls under the cliffs; busy around North West 200 week.",
  "at": {
   "lat": 54.8617,
   "lng": -5.8086
  },
  "path": [
   {
    "lat": 54.8617,
    "lng": -5.8086
   },
   {
    "lat": 54.8752,
    "lng": -5.8218
   },
   {
    "lat": 54.8858,
    "lng": -5.8401
   },
   {
    "lat": 54.9008,
    "lng": -5.845
   },
   {
    "lat": 54.9034,
    "lng": -5.8687
   },
   {
    "lat": 54.9158,
    "lng": -5.8831
   },
   {
    "lat": 54.9308,
    "lng": -5.8917
   },
   {
    "lat": 54.9451,
    "lng": -5.9038
   },
   {
    "lat": 54.9591,
    "lng": -5.9169
   },
   {
    "lat": 54.9696,
    "lng": -5.9368
   },
   {
    "lat": 54.9712,
    "lng": -5.959
   },
   {
    "lat": 54.9798,
    "lng": -5.9759
   },
   {
    "lat": 54.9887,
    "lng": -5.9929
   },
   {
    "lat": 55.0032,
    "lng": -5.9841
   },
   {
    "lat": 55.0175,
    "lng": -5.9763
   },
   {
    "lat": 55.0331,
    "lng": -5.9712
   },
   {
    "lat": 55.0482,
    "lng": -5.9634
   },
   {
    "lat": 55.0579,
    "lng": -5.9846
   },
   {
    "lat": 55.0568,
    "lng": -6.0113
   },
   {
    "lat": 55.054,
    "lng": -6.0378
   },
   {
    "lat": 55.061,
    "lng": -6.0599
   },
   {
    "lat": 55.0752,
    "lng": -6.055
   },
   {
    "lat": 55.0801,
    "lng": -6.0642
   }
  ],
  "miles": 24.0,
  "start": "Larne",
  "end": "Cushendall",
  "sources": [
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/ulster-northern-ireland/ride/a2-larne-portrush-antrim-coast-road",
   "https://en.wikipedia.org/wiki/A2_road_(Northern_Ireland)"
  ],
  "confidence": "high"
 },
 {
  "id": "sni-causeway-coast",
  "kind": "drive",
  "name": "Causeway Coast (B15/A2) Ballycastle to Portrush",
  "area": "County Antrim",
  "description": "West from Ballycastle on the coast road past Ballintoy and Whitepark Bay, then the A2 by the Giant's Causeway, Bushmills and Dunluce Castle to Portrush.",
  "warnings": "Coaches and car-park queues at the Giant's Causeway and Carrick-a-Rede; Bushmills village; PSNI run operations against car cruising and \"diffing\" around Portrush and Portstewart – no meets here.",
  "at": {
   "lat": 55.2039,
   "lng": -6.2429
  },
  "path": [
   {
    "lat": 55.2039,
    "lng": -6.2429
   },
   {
    "lat": 55.2114,
    "lng": -6.2605
   },
   {
    "lat": 55.2147,
    "lng": -6.283
   },
   {
    "lat": 55.2197,
    "lng": -6.3101
   },
   {
    "lat": 55.2314,
    "lng": -6.3277
   },
   {
    "lat": 55.2357,
    "lng": -6.3503
   },
   {
    "lat": 55.2354,
    "lng": -6.3741
   },
   {
    "lat": 55.2284,
    "lng": -6.3991
   },
   {
    "lat": 55.2306,
    "lng": -6.4248
   },
   {
    "lat": 55.2261,
    "lng": -6.4513
   },
   {
    "lat": 55.2219,
    "lng": -6.4777
   },
   {
    "lat": 55.2211,
    "lng": -6.5066
   },
   {
    "lat": 55.2088,
    "lng": -6.5228
   },
   {
    "lat": 55.2088,
    "lng": -6.5456
   },
   {
    "lat": 55.2123,
    "lng": -6.5707
   },
   {
    "lat": 55.2072,
    "lng": -6.5941
   },
   {
    "lat": 55.1999,
    "lng": -6.6177
   },
   {
    "lat": 55.2008,
    "lng": -6.6442
   },
   {
    "lat": 55.2,
    "lng": -6.6499
   }
  ],
  "miles": 19.5,
  "start": "Ballycastle",
  "end": "Portrush",
  "sources": [
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/ulster-northern-ireland/ride/a2-larne-portrush-antrim-coast-road",
   "https://www.irishnews.com/news/northern-ireland/police-warning-over-diffing-and-other-anti-social-driving-in-the-north-coast-this-easter-M7YQ3JGCZJDT5PDIB4P4NJZ2ZY/"
  ],
  "confidence": "medium"
 },
 {
  "id": "sni-b27-spelga",
  "kind": "drive",
  "name": "B27 Hilltown to Kilkeel past Spelga Dam",
  "area": "Mourne Mountains",
  "description": "South-east from Hilltown up into the Mournes past Spelga Dam (about 370 m), across the high moor and down to Kilkeel on the coast.",
  "warnings": "Mountain fog and snow; sheep on the open moor; cyclists; narrow single-lane approach roads from Bryansford (BestBikingRoads); Spelga car park busy on sunny weekends.",
  "at": {
   "lat": 54.1977,
   "lng": -6.143
  },
  "path": [
   {
    "lat": 54.1977,
    "lng": -6.143
   },
   {
    "lat": 54.1985,
    "lng": -6.1191
   },
   {
    "lat": 54.1921,
    "lng": -6.0946
   },
   {
    "lat": 54.1868,
    "lng": -6.0721
   },
   {
    "lat": 54.1794,
    "lng": -6.0592
   },
   {
    "lat": 54.1689,
    "lng": -6.0497
   },
   {
    "lat": 54.1536,
    "lng": -6.0564
   },
   {
    "lat": 54.1385,
    "lng": -6.0512
   },
   {
    "lat": 54.1254,
    "lng": -6.0361
   },
   {
    "lat": 54.1085,
    "lng": -6.0288
   },
   {
    "lat": 54.0927,
    "lng": -6.0242
   },
   {
    "lat": 54.0784,
    "lng": -6.0159
   },
   {
    "lat": 54.0658,
    "lng": -5.9997
   },
   {
    "lat": 54.0602,
    "lng": -5.9966
   }
  ],
  "miles": 14.0,
  "start": "Hilltown",
  "end": "Kilkeel",
  "sources": [
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/ulster-northern-ireland/ride/mountain-route-newcastle",
   "https://en.wikipedia.org/wiki/Spelga_Reservoir"
  ],
  "confidence": "medium"
 },
 {
  "id": "sni-a6-glenshane",
  "kind": "drive",
  "name": "Glenshane Pass (A6)",
  "area": "County Londonderry",
  "description": "The main Belfast–Derry road over the Sperrins: east from Dungiven up to the Glenshane Pass past the Ponderosa bar, then down to Maghera.",
  "warnings": "Main trunk road with HGVs; exposed to snow and ice, often the first NI road affected in winter; speed limits enforced; fog on the summit.",
  "at": {
   "lat": 54.9176,
   "lng": -6.9131
  },
  "path": [
   {
    "lat": 54.9176,
    "lng": -6.9131
   },
   {
    "lat": 54.9106,
    "lng": -6.8883
   },
   {
    "lat": 54.9071,
    "lng": -6.8614
   },
   {
    "lat": 54.9029,
    "lng": -6.835
   },
   {
    "lat": 54.8982,
    "lng": -6.8091
   },
   {
    "lat": 54.8863,
    "lng": -6.7906
   },
   {
    "lat": 54.871,
    "lng": -6.7845
   },
   {
    "lat": 54.8582,
    "lng": -6.7686
   },
   {
    "lat": 54.8525,
    "lng": -6.7429
   },
   {
    "lat": 54.8461,
    "lng": -6.716
   },
   {
    "lat": 54.8447,
    "lng": -6.7096
   }
  ],
  "miles": 10.4,
  "start": "Dungiven",
  "end": "Maghera (Glen Road)",
  "sources": [
   "https://en.wikipedia.org/wiki/Glenshane_Pass",
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/ulster-northern-ireland/ride/cookstown-lough-fea-to-glenshane"
  ],
  "confidence": "medium"
 },
 {
  "id": "sni-b47-glenelly",
  "kind": "drive",
  "name": "Glenelly Valley (B47), Sperrins",
  "area": "County Tyrone",
  "description": "East up the Glenelly Valley, the longest in the Sperrins, past Cranagh and Goles under Sawel Mountain.",
  "warnings": "Farm traffic and lots of driveways; bumpy surface and loose chippings in places; sheep; narrow in parts.",
  "at": {
   "lat": 54.76,
   "lng": -7.2393
  },
  "path": [
   {
    "lat": 54.76,
    "lng": -7.2393
   },
   {
    "lat": 54.769,
    "lng": -7.2442
   },
   {
    "lat": 54.7692,
    "lng": -7.2174
   },
   {
    "lat": 54.7677,
    "lng": -7.1899
   },
   {
    "lat": 54.765,
    "lng": -7.163
   },
   {
    "lat": 54.767,
    "lng": -7.136
   },
   {
    "lat": 54.7735,
    "lng": -7.1098
   },
   {
    "lat": 54.7809,
    "lng": -7.0855
   },
   {
    "lat": 54.7814,
    "lng": -7.0834
   },
   {
    "lat": 54.7857,
    "lng": -7.0568
   },
   {
    "lat": 54.7878,
    "lng": -7.0297
   },
   {
    "lat": 54.7936,
    "lng": -7.0028
   },
   {
    "lat": 54.7957,
    "lng": -6.9755
   },
   {
    "lat": 54.7932,
    "lng": -6.9495
   },
   {
    "lat": 54.7896,
    "lng": -6.93
   }
  ],
  "miles": 15.4,
  "start": "Plumbridge",
  "end": "Sperrin village",
  "sources": [
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/ulster-northern-ireland/ride/glenelly-valley-draperstown-newtonstewart-glenelly-valley-sperrins",
   "https://en.wikipedia.org/wiki/Glenelly_Valley"
  ],
  "confidence": "high"
 },
 {
  "id": "sni-p-skyfall",
  "kind": "photo",
  "name": "Glen Etive \"Skyfall\" lay-by",
  "area": "Lochaber",
  "description": "Lay-by about halfway down the single-track Glen Etive road where Bond's Aston Martin DB5 stops in Skyfall; Glen Etive also starred in Volvo's V90 advert. A popular stop for recreating the Skyfall car shot (Press and Journal).",
  "warnings": "Dead-end single-track road with passing places – never park in them; the National Trust for Scotland asks you to stop only in lay-bys and drive on if full (it plans to enlarge this one); deer; no phone signal.",
  "at": {
   "lat": 56.6195,
   "lng": -4.9307
  },
  "sources": [
   "https://pressandjournal.co.uk/fp/news/highlands-islands/6528949/glencoe-car-stuck-skyfall-glen-etive",
   "https://www.nts.org.uk/stories/work-begins-to-improve-visitor-experience-at-glencoe-nnr",
   "https://pressandjournal.co.uk/fp/news/highlands-islands/1052375/video-skye-starring-role-new-advert-volvo-v90",
   "OpenStreetMap (ODbL)"
  ],
  "confidence": "medium"
 },
 {
  "id": "sni-p-storr",
  "kind": "photo",
  "name": "Old Man of Storr car park",
  "area": "Isle of Skye",
  "description": "Car park beside the A855 below the Storr pinnacles, on the Trotternish drive. The Storr was one of the locations in Volvo's V90 Cross Country advert (Press and Journal).",
  "warnings": "Pay car park that fills early in summer; do not park on the A855 verges; coach traffic.",
  "at": {
   "lat": 57.4981,
   "lng": -6.1584
  },
  "sources": [
   "https://pressandjournal.co.uk/fp/news/highlands-islands/1052375/video-skye-starring-role-new-advert-volvo-v90",
   "https://en.wikipedia.org/wiki/The_Storr"
  ],
  "confidence": "medium"
 },
 {
  "id": "sni-p-kylesku",
  "kind": "photo",
  "name": "Kylesku Bridge viewpoint",
  "area": "Sutherland",
  "description": "Pull-off with an information board by the north end of the curved Kylesku Bridge on the A894. Mazda shot its Highlands car campaign at sites around Kylesku and Gairloch (Little Black Book); the bridge is the A894 drive's landmark.",
  "warnings": "Small parking area – pull fully off the A894; exposed to strong winds; NC500 campervans.",
  "at": {
   "lat": 58.2567,
   "lng": -5.0212
  },
  "sources": [
   "https://lbbonline.com/news/ls-productions-secures-stunning-scottish-route-in-seamless-co-production-for-mazdas-latest-models-2",
   "https://en.wikipedia.org/wiki/Kylesku_Bridge"
  ],
  "confidence": "medium"
 },
 {
  "id": "sni-p-ballintoy",
  "kind": "photo",
  "name": "Ballintoy Harbour",
  "area": "County Antrim",
  "description": "Small harbour car park at the bottom of the steep lane below Ballintoy village. Used for Mazda UK's CX-3 press shoot on the Causeway Coast (photographer Tim Swart); also a Game of Thrones location.",
  "warnings": "Very steep, narrow lane with hairpins – not for large vehicles; small car park, busy with Game of Thrones tours; don't drive onto the pier.",
  "at": {
   "lat": 55.2439,
   "lng": -6.3695
  },
  "sources": [
   "https://tim-swart.squarespace.com/blog/tag/coast",
   "OpenStreetMap (ODbL)"
  ],
  "confidence": "medium"
 },
 {
  "id": "sni-p-dunluce",
  "kind": "photo",
  "name": "Dunluce Castle",
  "area": "County Antrim",
  "description": "Car park by the clifftop ruin of Dunluce Castle on the A2 between Bushmills and Portrush. The coast road seen from Dunluce Castle was one of the shots in Mazda UK's CX-3 Causeway Coast shoot (photographer Tim Swart).",
  "warnings": "Pull in and out of the A2 with care (fast road); castle visitor car park; close to the Portrush car-cruising hotspot – no meets.",
  "at": {
   "lat": 55.2109,
   "lng": -6.576
  },
  "sources": [
   "https://tim-swart.squarespace.com/blog/tag/coast",
   "OpenStreetMap (ODbL)"
  ],
  "confidence": "medium"
 },
 {
  "id": "sni-p-torr-head",
  "kind": "photo",
  "name": "Torr Head",
  "area": "County Antrim",
  "description": "Headland with a small parking area at the end of the Torr Head scenic road, looking across the North Channel to Kintyre. The road to Torr Head was photographed for Mazda UK's CX-3 Causeway Coast shoot (photographer Tim Swart).",
  "warnings": "The Torr Head road is very narrow, steep and twisty – not for caravans or large vehicles; tiny parking area; sheep.",
  "at": {
   "lat": 55.196,
   "lng": -6.0632
  },
  "sources": [
   "https://tim-swart.squarespace.com/blog/tag/coast",
   "https://en.wikipedia.org/wiki/Torr_Head"
  ],
  "confidence": "medium"
 },
 {
  "id": "sni-p-spelga",
  "kind": "photo",
  "name": "Spelga Dam car park",
  "area": "Mourne Mountains",
  "description": "Car park and picnic area by Spelga Dam on the B27 high in the Mournes. A regular motorcycle stop – the Harley Owners Club NI branch used it as the first stop on its April 2026 Mournes run, and BestBikingRoads reviewers rate the road past the dam.",
  "warnings": "Exposed and often foggy; sheep; busy on sunny weekends.",
  "at": {
   "lat": 54.1789,
   "lng": -6.058
  },
  "sources": [
   "https://www.hoc.org.uk/ni-run-around-the-mournes-and-over-to-carlingford-sun-19th-april-2026/",
   "https://www.bestbikingroads.com/motorcycle-roads/united-kingdom/ulster-northern-ireland/ride/mountain-route-newcastle",
   "OpenStreetMap (ODbL)"
  ],
  "confidence": "high"
 },
 {
  "id": "sni-t-crail",
  "kind": "track",
  "name": "Crail Raceway",
  "area": "Fife",
  "description": "Scotland's only quarter-mile drag strip, on the old airfield at Crail in the East Neuk. Drag and drift days and themed events (Full On Ford, German Invasion, Banzai, Best of the Best) from March to November in 2026.",
  "warnings": "Event days only; check the calendar on the raceway site.",
  "at": {
   "lat": 56.2703,
   "lng": -2.6069
  },
  "sources": [
   "https://www.crailraceway.co.uk/wp/",
   "OpenStreetMap (ODbL)"
  ],
  "confidence": "high",
  "trackType": "sprint"
 },
 {
  "id": "sni-t-doune",
  "kind": "track",
  "name": "Doune Hill Climb",
  "area": "Stirling",
  "description": "Speed hill climb on the A84 a mile west of Doune, run by Lothian Car Club; rounds of the Scottish Hillclimb Championship. Four meetings a year (April, May, June and September); spectators welcome.",
  "warnings": "Event days only; no animals in the spectator areas; check the M80/A84 for roadworks.",
  "at": {
   "lat": 56.2017,
   "lng": -4.0718
  },
  "sources": [
   "https://www.dounehillclimb.co.uk/",
   "https://www.dounehillclimb.co.uk/location/"
  ],
  "confidence": "high",
  "trackType": "hillclimb"
 },
 {
  "id": "sni-t-racewall",
  "kind": "track",
  "name": "Cowdenbeath Racewall",
  "area": "Fife",
  "description": "Oval stock-car stadium, \"the home of Scottish stock car racing\": BriSCA F2, saloon stock cars, ORCi stock rods, ministox and bangers. Racing most Saturday evenings from March to the end of October, plus speed weekends and a winter meeting.",
  "warnings": "Spectator venue; book tickets online.",
  "at": {
   "lat": 56.1089,
   "lng": -3.3472
  },
  "sources": [
   "https://www.racewall.co.uk/",
   "OpenStreetMap (ODbL)"
  ],
  "confidence": "high"
 },
 {
  "id": "sni-t-lochgelly",
  "kind": "track",
  "name": "Lochgelly Raceway",
  "area": "Fife",
  "description": "Stock car, hot rod and banger oval run by Hardie Race Promotions. Regular meetings through the season; fixture list on the promoter's site.",
  "warnings": "Spectator venue; check fixtures and admission.",
  "at": {
   "lat": 56.1272,
   "lng": -3.2777
  },
  "sources": [
   "https://www.lochgellyraceway.co.uk/",
   "OpenStreetMap (ODbL)"
  ],
  "confidence": "high"
 },
 {
  "id": "sni-t-nutts-corner",
  "kind": "track",
  "name": "Nutts Corner Circuit",
  "area": "County Antrim",
  "description": "Outdoor go-karting circuit on the old RAF Nutts Corner airfield near Crumlin, north-west of Belfast. Arrive-and-drive and group karting near Belfast.",
  "warnings": "Booking required; check the site for sessions.",
  "at": {
   "lat": 54.6245,
   "lng": -6.1453
  },
  "sources": [
   "https://www.nuttscornercircuit.com/",
   "https://en.wikipedia.org/wiki/RAF_Nutts_Corner",
   "OpenStreetMap (ODbL)"
  ],
  "confidence": "medium",
  "trackType": "kart"
 },
 {
  "id": "sni-t-aghadowey",
  "kind": "track",
  "name": "Aghadowey Oval",
  "area": "County Londonderry",
  "description": "Short oval on the former RAF Mullaghmore airfield near Aghadowey, run by DMC Race Promotions: stock cars, bangers, stock rods and Ninja Karts. Hosted the first British Championship staged in Northern Ireland (2026); meetings into late December.",
  "warnings": "Spectator venue; position is the old airfield (approximate); check DMC fixtures.",
  "at": {
   "lat": 55.0258,
   "lng": -6.5969
  },
  "sources": [
   "https://dmcracepromotions.com/latest.php",
   "https://en.wikipedia.org/wiki/Aghadowey",
   "https://en.wikipedia.org/wiki/RAF_Mullaghmore"
  ],
  "confidence": "medium"
 },
 {
  "id": "sni-t-nw200",
  "kind": "track",
  "name": "North West 200 (the Triangle)",
  "area": "County Antrim",
  "description": "Motorcycle road race on the 8.97-mile \"Triangle\" of public roads between Portstewart, Coleraine and Portrush – the biggest annual sporting event in Northern Ireland. Race week 10–15 May 2027; grandstands and campsites at the finish line.",
  "warnings": "Spectator venue on race days only. The rest of the year it is ordinary public road with speed limits and PSNI enforcement – never use it for laps. Inside the Portrush/Portstewart car-cruising hotspot.",
  "at": {
   "lat": 55.193,
   "lng": -6.6976
  },
  "sources": [
   "https://northwest200.co.uk/",
   "https://en.wikipedia.org/wiki/North_West_200"
  ],
  "confidence": "high"
 },
 {
  "id": "sni-v-green-welly",
  "kind": "venue",
  "name": "The Green Welly Stop, Tyndrum",
  "area": "Argyll and Stirling",
  "description": "Café, restaurant, shops and fuel at Tyndrum on the A82 (with the A85 to Oban). Devitt: a busy halfway stop on the A82 that draws bikers from across Scotland, especially at weekends; extended bike park. On the way to Glencoe.",
  "warnings": "Very busy on summer weekends; hours vary by season (The Biker Guide).",
  "at": {
   "lat": 56.4383,
   "lng": -4.7122
  },
  "sources": [
   "https://www.devittinsurance.com/guides/biker-cafes/scotland/green-welly-stop/",
   "https://www.thebikerguide.co.uk/motorcyclemeetingplacesscotland"
  ],
  "confidence": "high"
 },
 {
  "id": "sni-v-duck-bay",
  "kind": "venue",
  "name": "Duck Bay, Loch Lomond",
  "area": "Loch Lomond",
  "description": "Hotel, marina and lochside car park on the A82 at Duck Bay, north of Balloch. A starting point for car-club runs: Porsche Club GB Scotland runs (incl. July 2026) and Lotus club (LEGS) breakfast meets start here.",
  "warnings": "Private hotel/marina car park – customers only; club runs are members-only; a forum post mentions a flood closure, so check it is open.",
  "at": {
   "lat": 56.0162,
   "lng": -4.6105
  },
  "sources": [
   "https://www.porscheclubgb.com/regions-registers/regions/scotland/south-scotland/events/2026/july/save-the-date-oban-glencoe-run",
   "https://forums.thelotusforums.com/topic/64803-legs-breakfast-4th-may-duck-bay-marina"
  ],
  "confidence": "medium"
 },
 {
  "id": "sni-v-bikers-cove",
  "kind": "venue",
  "name": "The Bikers Cove, South Queensferry",
  "area": "Edinburgh",
  "description": "Seafront biker café under the Forth bridges at South Queensferry. Voted favourite biker café in the UK (2017 and 2021) by The Biker Guide's Facebook group; regular bike nights and rallies, free Biker Down training (Devitt).",
  "warnings": "Small seafront street; check opening times on Facebook.",
  "at": {
   "lat": 55.9903,
   "lng": -3.3855
  },
  "sources": [
   "https://www.thebikerguide.co.uk/motorcyclemeetingplacesscotland",
   "https://www.devittinsurance.com/guides/biker-cafes/scotland/the-bikers-cove/"
  ],
  "confidence": "medium"
 },
 {
  "id": "sni-v-leadburn",
  "kind": "venue",
  "name": "Leadburn Inn (Motor Crossroads Café)",
  "area": "Midlothian",
  "description": "Inn and café at the Leadburn crossroads (A701/A703/A6094) south of Edinburgh – on the way to the A701 drive. Large car park and regular events such as \"Thunder Thursday\" (Devitt).",
  "warnings": "Event details may be out of date – check before you go.",
  "at": {
   "lat": 55.787,
   "lng": -3.2213
  },
  "sources": [
   "https://www.devittinsurance.com/guides/biker-cafes/scotland/the-leadburn-motor-crossroads-cafe/"
  ],
  "confidence": "medium"
 },
 {
  "id": "sni-v-horn",
  "kind": "venue",
  "name": "The Horn Milk Bar, Errol",
  "area": "Perthshire",
  "description": "Iconic 1960s-style roadside tea bar on the A90 between Perth and Dundee. Listed by The Biker Guide as a Perthshire biker meeting place; plenty of parking; open daily.",
  "warnings": "Turn in and out of the dual carriageway with care.",
  "at": {
   "lat": 56.4232,
   "lng": -3.2225
  },
  "sources": [
   "https://www.thebikerguide.co.uk/motorcyclemeetingplacesscotland"
  ],
  "confidence": "medium"
 },
 {
  "id": "sni-v-route74",
  "kind": "venue",
  "name": "Route 74 Truckstop, Lesmahagow",
  "area": "Lanarkshire",
  "description": "Truckstop with Wheelers Diner at junction 10 of the M74. Listed by The Biker Guide as a main Scottish biker meeting place – \"all bikers are very welcome\".",
  "warnings": "Working truck stop – watch for HGVs.",
  "at": {
   "lat": 55.6485,
   "lng": -3.8921
  },
  "sources": [
   "https://www.thebikerguide.co.uk/motorcyclemeetingplacesscotland"
  ],
  "confidence": "medium"
 },
 {
  "id": "sni-v-west-coast-hd",
  "kind": "venue",
  "name": "West Coast Harley-Davidson, Hillington",
  "area": "Glasgow",
  "description": "Harley-Davidson dealer with the J26 café at Hillington, by the M8. Bike night on the last Thursday of the month (April to September) and monthly events (The Biker Guide).",
  "warnings": "Check the dealer's event dates; industrial estate parking.",
  "at": {
   "lat": 55.8657,
   "lng": -4.371
  },
  "sources": [
   "https://www.thebikerguide.co.uk/motorcyclemeetingplacesscotland",
   "OpenStreetMap (ODbL)"
  ],
  "confidence": "medium"
 },
 {
  "id": "sni-v-midge-bite",
  "kind": "venue",
  "name": "The Midge Bite Café, Achnasheen",
  "area": "Wester Ross",
  "description": "Café at Achnasheen where the A832 and A890 meet, on the NC500. Listed by The Biker Guide; good parking and \"your beloved motorcycle is visible from the dining area\".",
  "warnings": "Daytime only (shorter hours on Sundays); remote – plan fuel.",
  "at": {
   "lat": 57.5807,
   "lng": -5.0711
  },
  "sources": [
   "https://www.thebikerguide.co.uk/motorcyclemeetingplacesscotland"
  ],
  "confidence": "medium"
 },
 {
  "id": "sni-v-applecross-inn",
  "kind": "venue",
  "name": "Applecross Inn",
  "area": "Wester Ross",
  "description": "Seafront inn in Applecross at the foot of the Bealach na Bà, start of the Applecross coast road drive. Listed by The Biker Guide as a Highlands biker meeting place; the classic stop after the Bealach.",
  "warnings": "Very busy in summer; small village with limited parking.",
  "at": {
   "lat": 57.4327,
   "lng": -5.8158
  },
  "sources": [
   "https://www.thebikerguide.co.uk/motorcyclemeetingplacesscotland",
   "https://en.wikipedia.org/wiki/Applecross"
  ],
  "confidence": "high"
 },
 {
  "id": "sni-v-riverside",
  "kind": "venue",
  "name": "Riverside Museum, Glasgow",
  "area": "Glasgow",
  "description": "Glasgow's transport museum on the Clyde (Zaha Hadid building), with cars, motorbikes, trams and locomotives. European Museum of the Year 2013; free entry.",
  "warnings": "City location by the Clyde; pay parking nearby.",
  "at": {
   "lat": 55.8652,
   "lng": -4.3062
  },
  "sources": [
   "https://en.wikipedia.org/wiki/Riverside_Museum"
  ],
  "confidence": "high"
 },
 {
  "id": "sni-v-grampian",
  "kind": "venue",
  "name": "Grampian Transport Museum, Alford",
  "area": "Aberdeenshire",
  "description": "Transport museum in Alford with working and climb-aboard vehicles and its own small test track. Focus on the transport history of north-east Scotland; hosts vehicle events in season.",
  "warnings": "Seasonal opening – check before you go.",
  "at": {
   "lat": 57.2334,
   "lng": -2.7015
  },
  "sources": [
   "https://en.wikipedia.org/wiki/Grampian_Transport_Museum",
   "OpenStreetMap (ODbL)"
  ],
  "confidence": "high"
 },
 {
  "id": "sni-v-ulster-transport",
  "kind": "venue",
  "name": "Ulster Transport Museum, Cultra",
  "area": "County Down",
  "description": "Transport museum at Cultra near Holywood, east of Belfast, beside the Ulster Folk Museum. One of Ireland's foremost visitor attractions (Wikipedia), with cars, motorcycles and rail.",
  "warnings": "Check opening days; pay entry.",
  "at": {
   "lat": 54.6551,
   "lng": -5.8032
  },
  "sources": [
   "https://en.wikipedia.org/wiki/Ulster_Folk_and_Transport_Museums"
  ],
  "confidence": "high"
 },
 {
  "id": "sni-v-ponderosa",
  "kind": "venue",
  "name": "The Ponderosa, Glenshane Pass",
  "area": "County Londonderry",
  "description": "Bar and restaurant at the top of the Glenshane Pass on the A6. Listed by The Biker Guide as a Northern Ireland biker meeting place; on the Glenshane Pass drive.",
  "warnings": "Exposed in winter weather; turn in and out of the A6 with care.",
  "at": {
   "lat": 54.8708,
   "lng": -6.7834
  },
  "sources": [
   "https://www.thebikerguide.co.uk/bikerfriendlymeetingplacesireland"
  ],
  "confidence": "medium"
 },
 {
  "id": "sni-v-joeys-bar",
  "kind": "venue",
  "name": "Joey's Bar, Ballymoney",
  "area": "County Antrim",
  "description": "Bar in Ballymoney, home town of road-racing legend Joey Dunlop (26 Isle of Man TT wins). Listed by The Biker Guide as a biker meeting place; a pilgrimage stop for road-racing fans, close to the North West 200.",
  "warnings": "Town-centre parking.",
  "at": {
   "lat": 55.0665,
   "lng": -6.5144
  },
  "sources": [
   "https://www.thebikerguide.co.uk/bikerfriendlymeetingplacesireland",
   "https://en.wikipedia.org/wiki/Joey_Dunlop"
  ],
  "confidence": "medium"
 },
 {
  "id": "sni-v-mauds",
  "kind": "venue",
  "name": "Maud's Café, Newcastle",
  "area": "County Down",
  "description": "Café on the seafront main street at Newcastle, at the foot of the Mournes. Listed by The Biker Guide as a County Down biker meeting place; base for the Spelga/Mournes roads.",
  "warnings": "Busy seaside town in summer; limited parking on Main Street.",
  "at": {
   "lat": 54.2108,
   "lng": -5.8901
  },
  "sources": [
   "https://www.thebikerguide.co.uk/bikerfriendlymeetingplacesireland"
  ],
  "confidence": "medium"
 }
]
```
