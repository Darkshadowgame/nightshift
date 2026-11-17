# Nightshift: competitors, NFSU2 design study, animation and branding

*Research date: 17 November 2026. Desk research only: web search, App Store search API (UK storefront) and DNS lookups. Nothing here is legal advice. App Store review snippets and ratings come from listings or aggregators and are a sample, not a survey.*

**Confidence key:** **[S]** = backed by a linked source. **[K]** = general/background knowledge, not re-verified this session. **[J]** = my judgement or recommendation.

---

## 0. TL;DR

- **The gap is real.** UK meet apps exist (Smoke Scene, DriveLife, Nice Car Mate, RoadStr, Bike Nights), but they are all event listings, with thin reviews and little sign of momentum. None has the **game layer**: classes, rep, post-meet voting, trophies, a *live* night map. None treats **cars and bikes as equals**. None has a credible **"good citizen"** posture that would survive council anti-car-meet orders (PSPOs).
- **The three things that kill apps in this space:** (1) no revenue model before the money runs out (Drivetribe, Zenly). (2) Location and privacy scandals (Strava heatmap, Life360 selling data, Snap Map stalking fears). (3) Subscription paywalls that block the thing people came for, plus cancellation that is hard to do (Calimoto, Relive, Life360).
- **The biggest legal and product risk** is anything that looks like timed racing on public roads. Strava was sued after a cyclist died chasing a downhill KOM. In the UK, racing on public roads is an offence (Road Traffic Act 1988 s.12 [K]). **"Sprint routes" must never be timed or ranked** [J].
- **EA trademark verdict:** do not use "Underground" in the name or in brand-forward copy. Details in §C2.
- **Top name picks [J]:** **Sodium** (*"Sodium Nights"*), **Slipstreet** and **Nitelane**. "Nightshift" has real problems: Apple's iOS "Night Shift" feature, a 2026 UK class-9 NIGHTSHIFT filing by a German vehicle-parts firm, and many existing apps with the name.

---

## A. Existing apps and platforms

### A1. Car meet / car social apps

| App | What it does | What worked | What failed / complaints | Money | Lesson for Nightshift |
|---|---|---|---|---|---|
| **Drivetribe** (2016–Jan 2022) | Car social network/publisher from Clarkson, Hammond and May. Users formed "tribes" around interests. | Big launch, celebrity draw, interest-based communities. | Closed in Jan 2022, citing "significant industry challenges" during COVID, the chip shortage and cuts to carmaker marketing budgets. Investors would not put in more money. **[S]** [Driving.co.uk](https://driving.co.uk/news/drivetribe-the-car-website-founded-by-clarkson-hammond-and-may-announces-closure), [Motor1](https://www.motor1.com/news/559776/drivetribe-closes-after-five-years/), [Jalopnik](https://jalopnik.com/industry-changes-blamed-for-drivetribes-demise-1848331912) | Advertising and brand partnerships, mostly OEM marketing. **[S]** | **Don't depend on carmaker ad budgets.** Drivetribe was a content feed with no *utility*. Nightshift's map, meets and garage are utility. Monetise users and local businesses (detailers, tuners, venues), not OEMs. [J] |
| **RoadStr** | Find nearby car events and meetups. Create drives, track days and meets. See other users driving nearby via live location. **[S]** [App Store](https://apps.apple.com/us/app/id1382535778) | 4.4★ from about 114 ratings. Clubs moved their planning onto it. **[S]** [worldsapps](https://worldsapps.com/reviews-roadstr-car-routes-events) | Small user base. Onboarding bug ("Registration requires interests but they're empty"). The Android build looked stale (last update 2021). **[S]** | Free [S]; premium unclear | **The closest concept, and it shows that "live drivers on a map" alone does not create a scene.** Without density in your town, the map is empty. Launch city by city. [J] |
| **Smoke Scene** (UK) | UK car *and bike* group social app: find local meetups, talk to nearby groups. **[S]** [App Store GB](https://apps.apple.com/gb/app/smoke-scene/id1635847952) | The only UK review praises the map for "avoiding traffic and unwanted attention". **[S]** | Barely any reviews. Its "We're back!" release note hints at an outage or relaunch. **[S]** | Free | **Validates the UK late-night car + bike angle.** It also shows the risk: "avoiding unwanted attention" reads as "dodging police" to councils and Apple. Nightshift needs a lawful posture. [J] |
| **DriveLife (by CarEvents.com)** (UK) | UK car events calendar, digital garage, organisers promote events to "700,000+ enthusiasts". **[S]** [App Store GB](https://apps.apple.com/gb/app/drivelife/id1500589187), [AppGoblin](https://appgoblin.info/apps/1500589187) | Brings UK events together "under one roof". **[S]** | About 12.9K Android installs since Oct 2024. Sparse ratings. Developer name and age rating differ between listings. **[S]** | Event promotion (organiser side) | **Event aggregation is already taken in the UK.** Nightshift should compete on *live/at-the-meet* experience and status, not on calendar coverage. [J] |
| **Nice Car Mate** (UK) | Upcoming UK events on a map. **[S]** [App Store](https://apps.apple.com/fi/app/nice-car-mate/id1489723893?l=fi) | Simple. | Low profile. | Free | Same as above. |
| **Bike Nights** | Map-based motorcycle event app for the UK, Europe and Gulf. **[S]** [marlvel](https://marlvel.ai/apps/bike-nights) | Bike-specific. | Little evidence of scale. | ? | **Bikers are underserved by car apps and vice versa.** One app for both is a real gap. [J] |
| **CarMeets, Meetz, Car Hangout, Idle, AutoMeet, Strada, FIRST2, Driveway, ModifySociety, MotorCrush, RevRadar** | A wave of mostly US meet-finder and car-social apps, many launched 2024–26, several with "live meet map". **[S]** [Meetz](https://apps.apple.com/app/id6762423461), [Car Hangout](https://apps.apple.com/us/app/id6737334627), [Strada](https://apps.apple.com/app/id6747690395), [FIRST2](https://apps.apple.com/app/id6741798545), [ModifySociety](https://apps.apple.com/us/app/id1240071776), [CarMeets](https://apps.apple.com/ca/app/carmeets/id1422571802) | Low cost to build. | Crowded and fragmented. Bug complaints (FIRST2 friend requests and profile edits; CarMeets map problems). **[S]** | Mostly free, some paid boosts (Car Hangout "boosting" meets) [S] | **"Live meet map" is no longer a differentiator.** The moat is identity and status (garage, class, rep, trophies) plus UK density and trust. [J] |
| **Cars & Coffee / breakfast meets** (Caffeine & Machine, Bicester Heritage Sunday Scramble, local C&C) | Daytime, venue-hosted meets promoted on Instagram and Facebook. [K] | Legal, family-friendly, venue revenue. | Not served by any dedicated app; discovery happens in Instagram stories. [K] | Venue F&B, tickets | **Partner with venues.** Venue-verified pins give legitimacy and a revenue line (featured venue). [J] |
| **Motorsport UK event finder** | Official finder for permitted events, clubs, schools. Grassroots/"StreetCar" events you can enter in your daily car; free RS Clubman licence. **[S]** [Get Started](https://getstarted.motorsportuk.org/compete), [Find Your Motorsport guide (PDF)](https://getstarted.motorsportuk.org/wp-content/uploads/2026/07/Find-Your-Motorsport-The-Guide.pdf) | Authoritative. | Website only, not social. | Membership/licences | **The "go legal" pipeline.** "Want to actually race? Here's a StreetCar autotest 20 miles away" is the responsible answer to the NFS fantasy. It is also good PR. [J] |

### A2. Garage / build-log apps

| App | Notes **[S]** [search results](https://apps.apple.com/us/app/builds-car-enthusiast-hub/id6747994891) |
|---|---|
| **Builds: Car Enthusiast Hub** | Ride profiles, versioned mods, photos, video, dyno sheets, event check-ins. Login problem reported. |
| **BuildSheet**, **Auto ModList**, **The Pit Log**, **BuildBench**, **JustGarage**, **CarJourney Garage**, **RevMatch**, **Jackstand Journal** | Mod/cost/maintenance logs. Auto ModList makes a shareable web build page. The Pit Log is a £1.99 one-off with local data. Ratings are very sparse. [Auto ModList](https://apps.apple.com/bm/app/auto-modlist/id1217688757), [The Pit Log](https://apps.apple.com/app/id6761210335), [BuildSheet](https://apps.apple.com/us/app/id6758694985) |

**What worked:** a shareable build page is the hook. People want to *show* the build. **What failed:** none has a social graph or a reason to open the app weekly. **Lesson [J]:** The garage should be the **profile you show at meets** (QR on a windscreen card or helmet sticker: scan, see build sheet, vote). Don't make it a private spreadsheet. Keep mod entry very quick (pick parts from a list, add a photo). Make the class (S–D) **derived from the declared mods** so the class means something.

### A3. Motorbike ride and route apps

| App | What it does | Worked | Complaints | Money | Lesson |
|---|---|---|---|---|---|
| **Calimoto** | Twisty-road route planner and nav, round trips. | 4.6★ iOS; praised planner and GPS. **[S]** [SlashGear](https://www.slashgear.com/1755865/motorcycle-apps-find-routes-track-rides), [Bennetts review](https://www.bennetts.co.uk/bikesocial/reviews/products/motorcycle-technology/calimoto-motorcycle-route-planner-review) | **Subscription anger:** couldn't cancel, auto-renewed. "Super winding" and GPX use paywalled. Routes going in circles. Map lag causing missed turns. **[S]** [Trustpilot](https://ie.trustpilot.com/review/calimoto.com) | Freemium subscription | **Never paywall safety-relevant or basic nav. Make cancelling one tap.** UK riders talk to each other. [J] |
| **Kurviger** | Curvy routing with three curviness levels; offline maps. | Power-user control. 4.4★ Play. **[S]** [Kurviger docs](https://docs.kurviger.com/web/kurviger_tourer) | "Technical" UI. Needs internet to plan. **[S]** | Tourer/Tourer+ tiers (about £13–25/yr reported) **[S]** | **Depth scares casual users. Show the simple option and hide the rest.** [J] |
| **Scenic** (iOS) | Route planner/nav, curvy modes, offline, GPX import. | 4.7★; "best iOS trip planner". **[S]** [App Store](https://apps.apple.com/app/id1089668246) | Few public critical reviews found. | Free + IAP | **iOS-native polish wins loyalty in this niche.** [J] |
| **REVER** | Ride tracking, route discovery, friends' live location (premium); Butler Maps curated roads. | Curated "best roads" content is valued. **[S]** [Cycle News](https://www.cyclenews.com/2016/06/article/product-review-rever-app/) | Live location paywalled; recent review mood "frustrated" (aggregator). **[S]** [marlvel](https://marlvel.ai/apps/rever-motorcycle-gps-rides) | Pro subscription | **Curated routes are good premium content.** Live friend location should be free, because it drives the network effect. [J] |
| **Relive** | Turns GPS activities into 3D fly-over videos. | Shareable output; huge install base (about 4.3★ / 422K, polarised). **[S]** [Adapty paywall library](https://adapty.io/paywall-library/relive/) | Aggressive upsell; editing a video needs a subscription; phantom duplicate activities. **[S]** [justuseapp](https://justuseapp.com/en/app/1201703657/relive-run-ride-hike-more/reviews) | Relive Plus (about €39/yr) | **A shareable "night recap" card or clip after a cruise is great marketing.** Don't hold the free version back. [J] |

### A4. Navigation, location sharing and convoy

| App | Worked | Failed / complaints | Money | Lesson |
|---|---|---|---|---|
| **Waze** | Crowd reports (hazards, police, jams) with points, levels and ranks; volunteer map-editor community. **[S]** [BGR on Waze points](https://bgr.com/2216945/waze-points-uses-explained/), [HBS Digit](https://d3.harvard.edu/platform-digit/submission/waze-traffic-from-the-crowd/). Bought by Google (2013, about $1.1bn) [K]. | Police reports misclassified or missing; editors spend time cleaning them up. **[S]** [BGR](https://www.bgr.com/2259383/biggest-issues-with-waze-police-sighting-feature/) | Location-based ads (pins for businesses) [K] | **Points for *useful contributions* (confirming a meet is on, flagging "moved on") is a proven pattern.** **Do not ship police-spotting.** In the scene context it reads as evasion, and it carries legal and App Store risk. [J] |
| **Strava** | Segments + leaderboards (KOM/QOM) = addictive; heatmaps; clubs. [K] | **2018 heatmap exposed military bases and patrol routes** **[S]** [BikeRadar](https://www.bikeradar.com/news/stravas-heatmap-reveals-military-bases-and-more). **2010 death of Kim Flint chasing a downhill KOM; family sued in 2012** (Strava reportedly not held liable) **[S]** [road.cc](https://road.cc/content/news/60145-family-sues-strava-causing-cyclists-death), [BikeRadar](https://www.bikeradar.com/news/family-sues-strava-for-cycling-death). | Subscription | **Segments + leaderboards on public roads with *cars* is the single most dangerous feature you could build.** "Sprint routes" = scenic, untimed, rated on *views/flow/surface*. Any heatmap must be opt-in, delayed, and must hide home areas. [J] |
| **Life360** | Family location sharing at scale. | **Sold precise location data to about a dozen brokers** (≈$16m in 2020) **[S]** [The Markup](https://themarkup.org/privacy/2021/12/06/the-popular-family-safety-app-life360-is-selling-precise-location-data-on-its-tens-of-millions-of-user); battery drain; pricey tiers (UK Silver £7/mo, Gold £12/mo) **[S]** [GreenMatters](https://www.greenmatters.com/family/why-life360-is-bad) | Subscriptions + (formerly) data sales | **Never sell location data, and say so in plain English on the paywall and privacy screen.** Live location only while in "Cruise/Drive mode", not 24/7, to save battery and build trust. [J] |
| **Zenly** (2015–Feb 2023) | Loved by teens: playful real-time friend map, bubbly avatars, battery/speed shown, "bump" to add friends, fast and joyful UI. About 40M MAU by 2022. **[S]** [Seedtable](https://seedtable.com/exits/zenly), [Life360 blog](https://www.life360.com/?p=209231) | **Killed by Snap in a roughly 20% layoff/cost-cutting round. It had never monetised**; users were pointed to Snap Map. **[S]** | None | **Joy and personality on a map can win, but plan monetisation from day one.** Zenly's *feel* (squishy pins, presence, little delights) is the best reference for Nightshift's map. [J] |
| **Snap Map** | Huge reach; Ghost Mode. | Stalking/child-safety fears at launch; confusion over the default; schools warning parents. **[S]** [IBTimes](https://ibtimes.com/how-disable-snap-map-new-snapchat-feature-raises-privacy-concerns-2557718), [BetaNews](https://betanews.com/article/snapchat-snap-map-location-sharing) | Ads | **Ghost mode on by default; 18+ app; share location with "Crew" or "Meet" only.** [J] |
| **Zello** | Free, ad-free push-to-talk "walkie-talkie" channels; used by fleets and convoys. **[S]** [BigRoad review](https://bigroad.com/blog/bigroad-review-zello-walkie-talkie-app/), [G2](https://www.g2.com/products/zello/reviews) | Lags on poor networks. **[S]** | Free consumer, paid business | **PTT is a solved problem; users will compare you to Zello.** Proximity PTT is a later feature. Hands-free only, voice-activated or helmet-button. Consider a Zello or WebRTC-based approach rather than building your own. [J] |
| **Cardo / Sena** (helmet intercoms) | Mesh group intercom for bike groups [K] | Hardware cost | Hardware | **Bikers already have comms.** Integrate (e.g. audio cues through the helmet) rather than compete. [J] |

### A5. UK context you cannot ignore

- **Councils are actively banning car meets** with Public Spaces Protection Orders (Anti-social Behaviour, Crime and Policing Act 2014 s.59). Examples: Waltham Forest, Colchester (2025), Sevenoaks, Peterborough, Norwich; Enfield went on to a court injunction. Councils say meets are "usually arranged online". **[S]** [Waltham Forest](https://www.walthamforest.gov.uk/neighbourhoods/crime-and-community-safety/public-space-protection-orders), [Colchester](https://www.colchester.gov.uk/vehicular-nuisance-pspo), [Sevenoaks](https://www.sevenoaks.gov.uk/pspohalsted), [Norwich](https://new.norwich.gov.uk/your-council-explained/policies-plans-and-strategies/public-spaces-protection-orders-pspos/vehicle), [Enfield judgment](https://enfield.gov.uk/__data/assets/pdf_file/0028/86473/Enfield-v-Persons-Unknown-Final-judgment-of-Hill-J-Your-council.pdf). Police Reform Act 2002 s.59 also lets police seize vehicles used in a manner "causing alarm, distress or annoyance". **[S]** [legislation.gov.uk](https://www.legislation.gov.uk/ukpga/2002/30/section/59/enacted/data.htm)
- **Product implication [J]:** build a **PSPO layer**: warn organisers if a pin falls inside a known PSPO zone, and block or flag it. Add **venue-verified** meets, a **host code of conduct** (no burnouts, no racing, leave no litter) that feeds rep, and a **"moved on" flow** that disperses people politely. This is your defence with Apple review, councils, insurers and press.

### A6. Gaps none of them fill (the opportunity)

1. **Status and identity:** class S–D, rep, trophies and post-meet voting. Nobody does "best car/bike of the night" with verified attendance.
2. **Cars and bikes as equals** in one scene app.
3. **A live "what's on right now" night map** with rolling-meet state (forming → live → moving on → ended). Existing apps are calendars.
4. **The lawful game layer:** game feel without timed street racing, plus a pipeline to legal motorsport (Motorsport UK StreetCar, track days).
5. **Trust by design:** no data sales, ghost by default, location only during an active session, PSPO awareness.
6. **Shareable output:** build cards, trophy cards and night recaps sized for Instagram/TikTok stories. This is how a scene app grows.

### A7. Monetisation patterns seen [S/K] and recommendation [J]

Seen: ads/OEM sponsorship (Drivetribe, died); subscriptions (Calimoto, REVER, Relive, Life360, often resented); data sales (Life360, scandal); event promotion fees (DriveLife, Car Hangout boosts). **Recommended:** free core (map, meets, garage, voting). Optional **"Nightshift+"** for cosmetics (profile themes, trophy cabinet styles, garage-card frames, extra photo slots, recap video export). **Organiser/venue tools:** ticketing, verified-venue badge, featured pin. **Local business listings:** detailers, wrap shops, tuners. **Never** pay-to-win class or rep.

---

## B. Need for Speed: Underground 2 (2004): design study

### B1. Facts

- EA Black Box, published by Electronic Arts; released 15 Nov 2004 (NA), 19 Nov 2004 (EU). About 8.4M sold by end of 2004, around 11M total; UK sales records. Metacritic 82 (PS2/PC). Music by Tom Salta plus licensed tracks (Snoop Dogg & The Doors "Riders on the Storm" remix; D.I.C.E. soundtrack nomination). **[S]** [Wikipedia](https://en.wikipedia.org/wiki/Need_for_Speed:_Underground_2), [Car Throttle](https://carthrottle.com/features/10-best-racing-game-soundtracks)
- **Open world "Bayview"**, based on San Francisco and LA. The first open world in the series. Five districts unlocked by progress; **free roam always at night**. **[S]** [Wikipedia](https://en.wikipedia.org/wiki/Need_for_Speed:_Underground_2)
- **Discovery:** you *drive* to a race to start it. Some races appear on the radar; others are found by exploring. **Phone calls and text messages** plus cash/info icons guide you. Shops are coloured dots on the map (car lots shown as cyan dots); the world map shows unlocked shops, outrun opponents and known races, not hidden ones. **[S]** [Wikipedia](https://en.wikipedia.org/wiki/Need_for_Speed:_Underground_2), [ludo.guide](https://www.ludo.guide/guide/need-for-speed-underground-2), [NFS wiki: Tuning Shop](https://nfs.fandom.com/wiki/Tuning_Shop), [NFS wiki: Car Lot](https://nfs.fandom.com/wiki/Car_Lot)
- **GPS:** pick a destination on the world map and an arrow/route line guides you. Some event types (magazine races) let you use the map but not the GPS. **[S]** [ludo.guide](https://www.ludo.guide/guide/need-for-speed-underground-2/need-for-speed-underground-2-part-2)
- **Race types:** Circuit, Sprint, Drift (incl. downhill), Drag, **Street X** (short tight closed course, no nitrous), **URL** (Underground Racing League closed-track tournaments), and **Outrun**: a roaming rival challenges you on the street and you win by pulling a 300 m lead. Icons on the map are colour-coded by race type. **[S]** [Wikipedia](https://en.wikipedia.org/wiki/Need_for_Speed:_Underground_2), [Worthplaying review](https://www.worthplaying.com/article/2004/12/1/reviews/20926-xbox-review-need-for-speed-underground-2/), [NFS wiki: Outrun](https://nfs.fandom.com/wiki/Need_for_Speed:_Underground_2/Outrun)
- **Reputation and sponsors:** winning earns cash and rep. **Sponsor contracts** set goals per stage. **Style points** from drifts, air and near-misses refill nitrous. **[S]** [Wikipedia](https://en.wikipedia.org/wiki/Need_for_Speed:_Underground_2), [GameZone](https://gamezone.com/?p=99473)
- **Visual rating (0–10 stars):** rises with bodywork and aesthetic mods. It unlocks **magazine cover shoots** (reach a photographer in time) and **DVD cover shoots**; hitting 10.0 unlocks all DVD events. **[S]** [Wikipedia](https://en.wikipedia.org/wiki/Need_for_Speed:_Underground_2), [GameZone](https://gamezone.com/?p=99473)
- **Customisation:** bumpers, skirts, spoilers, hoods, roof scoops, exhaust tips, doors (scissor), wheels incl. spinners, lights, mirrors, paint, multi-layer vinyls/decals, **neon underglow**, **trunk audio/ICE installs**, **hydraulics**, nitrous bottles. Performance: engine, ECU, transmission, suspension, tyres, brakes, weight, turbo, nitrous, plus a **dyno** with torque/power graph and 0–60 estimate. **[S]** [Wikipedia](https://en.wikipedia.org/wiki/Need_for_Speed:_Underground_2)
- **Criticism:** no fast travel to events (lots of driving between races), heavy product placement (Burger King, Best Buy, Cingular), cringe slang, comic-book cutscenes, weak Outrun AI. **[S]** [Wikipedia](https://en.wikipedia.org/wiki/Need_for_Speed:_Underground_2), [GameSpot](https://www.gamespot.com/reviews/need-for-speed-underground-2-review/1900-6113360/)

### B2. Look, sound and feel (from memory of the game; no design write-up found) [K]

- **Palette:** wet-asphalt blue-black, sodium orange, neon green/cyan and magenta accents; reflective wet roads; bloom on lights. The city always at night.
- **UI:** heavily skewed/italic condensed sans type, chrome and metallic bevels, glowing outlines, angled panels that slide and snap in with whooshes; garage menus orbit the car on a turntable, with the camera swooping to each part as you select it. HUD: analogue tach with redline, nitrous bar, speed in big digits.
- **Audio:** turbo flutter, blow-off valves, bassy menu "thunks", phone/SMS chimes; licensed hip-hop/rock/electronic.
- **Feel:** "the streets are your menus" (the world is the navigation) **[S]** [Worthplaying](https://worthplaying.com/article/2004/10/28/news/20203-need-for-speed-underground-2-gbangcps2xboxpc-soundtrack). The garage is the payoff room. Everything says *you are becoming someone in this scene*.

### B3. Why it's beloved [S/K/J]

1. **The fantasy of belonging to a scene:** you arrive as nobody and become a cover star.
2. **Expression > performance:** the visual rating rewards *taste*, not just speed. Your car is your avatar.
3. **The city at night** is a mood, not just a map: always-night, wet streets, neon.
4. **Discovery:** stumbling on a shop or rival by driving around.
5. **Depth with instant payoff:** every purchase is visible straight away on the turntable.
6. **Timing/nostalgia:** *The Fast and the Furious* era, PS2 generation, an iconic soundtrack.

### B4. Principles we can borrow (mechanics and feelings)

| # | NFSU2 mechanic | Nightshift translation [J] |
|---|---|---|
| 1 | **"The streets are your menus"**: the map *is* the home screen | Open to the live night map; everything (meets, cruises, photo spots, routes, tracks) is a pin. No feed-first home. |
| 2 | **Visual rating → covers**: style is rewarded, not just power | **Class (S–D) = what's declared** (mods → points); **"Cover" status = what people vote for**. Post-meet "Best of the Night" winners get a shareable **cover card** (our own magazine-style layout; not NFS art). Bikes and cars compete in separate categories. |
| 3 | **Rep and sponsors as progression** | Rep earned for *showing up* (verified check-in), *hosting well* (no PSPO trouble, good ratings), *contributing* (confirming meets, adding photo spots), and *winning votes*. "Sponsors" = real local businesses offering perks to high-rep members later. |
| 4 | **Discovery by moving through the world** + SMS hints | Hidden or "unlockable" photo spots that reveal once you're within 1 km or have X rep; "text message" style push notifications from the meet host ("Moved to the retail park, 2 mins"). |
| 5 | **District unlocks** | Regional "scenes" (e.g. *Midlands*, *Essex*, *Manchester*) with their own leaderboards for **rep and votes** (never times). New areas "light up" on the map as you attend meets there. |
| 6 | **Outrun** (spontaneous rival encounter) | Reinterpret safely as **"Spotted"**: you're parked at a meet near a member with the same model/class, and you get a nudge to "swap builds" (view garage, mutual follow). Encounter, not race. |
| 7 | **Turntable garage payoff** | Your garage screen shows your car/bike as a hero photo with parallax and mod "tags" that animate in. Adding a mod instantly bumps class points with a satisfying tick. |
| 8 | **Always-night mood** | Dark UI by default; wet-asphalt texture; sodium-orange + one neon accent; map style tuned for night (desaturated land, glowing roads). |
| 9 | **Style points refill nitrous** (small actions feed the big moment) | Micro-rewards (check-in, vote, add photo) fill a nightly "meter" that unlocks a cosmetic or a trophy at the end of the night. |

### B5. Things we must NOT copy

- **Names and marks:** "Need for Speed", "NFS", "Underground", "Underground Racing League"/"URL", "Bayview", "Most Wanted", "Unbound", "Heat", "Black Box", character names (Rachel Teller, Caleb), "Wraiths", and "Outrun" as a mode name (also a Sega trademark, *OutRun* [K]).
- **Art and UI:** the NFS logos, the NFSU2 chrome/skew menu art, specific HUD layouts (tach + nitrous bar), map icons and their exact colour coding, loading screens, the comic-panel style, the magazine/DVD cover templates.
- **Audio/music:** any game SFX, any of the licensed tracks (e.g. "Riders on the Storm" remix). License your own music or commission it; use royalty-free/own-recorded engine sounds.
- **Trade dress:** don't combine all of these (always-night + skewed chrome type + neon green + turntable garage + cover shoots) so closely that a reasonable person would think it's an EA product or tie-in. Borrow the *feeling*, invent the *form*.
- **Racing itself:** NFS is fiction on closed virtual roads. **No timed public-road events, no speed leaderboards, no police-evasion features.** UK law (RTA 1988 s.12 [K]), PSPOs [S], App Store review and insurers all point the same way.

### B6. Map icon styles in the series (reference only) [K, plus one source]

- **Underground (2003)/U2 (2004):** coloured dots/glyphs on a minimap per race type; shop dots in brand-ish colours; a GPS arrow. **[S]** coloured shop dots per [NFS wiki](https://nfs.fandom.com/wiki/Tuning_Shop).
- **Most Wanted (2005):** daylight city, police focus; event icons on a radar; heat meter; "Blacklist" rivals. [K]
- **Heat (2019):** day/night split (day = legal Speedhunter events, night = illegal races and heat); neon-ish icons; collectibles (billboards, drift zones, speed traps, jumps). [K]
- **Unbound (2022):** cel-shaded graffiti effects; map with Safehouse, Street Art, Billboards, Speedruns, Speed Traps, Drift Zones, Long Jumps, Gas Stations; players asked for icon filtering. **[S]** [Gamepressure interactive map](https://www.gamepressure.com/need-for-speed-unbound/interactive-map/z6106f9), [EA forum](https://forums.ea.com/discussions/need-for-speed-franchise-discussion-en/minimap-feature-request/9404813)

**Take-away [J]:** every NFS map relies on **category shape + colour + filter toggles**. Do the same, but design your own glyph family (e.g. rounded-hexagon "badge" pins with a 2px glow ring; meet = people cluster, cruise = arrow path, rolling meet = arrow with motion trail, photo spot = aperture, sprint route = ribbon, track = chequer-free flag of your own design). Add **icon filtering from day 1** (players asked NFS for it).

---

## C. Animation and branding

### C1. Animation ideas (React Native / Expo)

**Stack [K]:** `react-native-reanimated` (v3/v4: shared values, `withTiming`, `withSpring`, `withSequence`, `Easing.bezier`, layout animations, `useReducedMotion()`, `ReduceMotion` config), `@shopify/react-native-skia` (glows, blurs, shaders, particles, runs with Reanimated values), `lottie-react-native` (designer-authored set pieces), `expo-haptics` (paired with key moments). Maps: `@rnmapbox/maps` or `react-native-maps`.

**Performance rule:** animate *many* pins with **map-native style layers** (Mapbox circle/symbol layers with data-driven `circle-radius`/opacity driven by a timer). Only animate the **selected/nearby** handful as RN views. Animating 200 RN marker views will drop frames.

**Reduced motion:** check `useReducedMotion()` (Reanimated) / `AccessibilityInfo.isReduceMotionEnabled()`. When on: replace movement/scale with **opacity cross-fades ≤150 ms**, stop loops (pulses become a static ring), skip particles and camera fly-throughs, keep haptics (they're not motion) but make them optional in settings. Never use motion as the only signal; pair it with text, icon state and haptics.

| Moment | What moves | Duration and easing | Reduced-motion version |
|---|---|---|---|
| **Live meet pin pulse** | A ring expands from 1.0→2.2× pin radius while opacity goes 0.6→0. Two staggered rings (0 ms, 600 ms). The pin itself is static. Colour = category. | 1600 ms loop, `Easing.out(Easing.cubic)`; pause when off-screen or app backgrounded. | Static double ring at 40% opacity plus a "LIVE" label. |
| **Pin appear (new meet nearby)** | Pin drops from −12 px with scale 0.6→1, then a small overshoot settle; shadow grows. | Spring `damping: 14, stiffness: 180` (≈350 ms). Light haptic. | 150 ms fade-in. |
| **"Event unlocked" reveal** (hidden photo spot within range/rep) | Map dims to 60%. A blurred locked glyph sits at the spot; a Skia radial "scan" sweeps 360°; blur 12→0; glyph cross-fades to the unlocked icon; a title card slides up 24 px with letter-spacing tightening 4→0 px. | Sweep 700 ms linear → unblur 300 ms `Easing.out(quad)` → card 250 ms `bezier(0.2,0.8,0.2,1)`. Success haptic at unblur. Total ≤1.3 s, tap to skip. | Dim + fade card, no sweep. |
| **Class-up moment** (C→B after adding mods) | Class badge flips on Y axis (rotateY 0→90°, swap letter, 90→0°). A thin light streak (Skia linear gradient) wipes across the badge at 20°. Points counter rolls up with tabular numbers. | Flip 2×180 ms `Easing.inOut(cubic)`; streak 400 ms; counter 600 ms `Easing.out(expo)`. Medium haptic at swap. | Cross-fade old→new letter 150 ms; counter jumps. |
| **Trophy award** (post-meet vote winner) | Lottie or Skia trophy rises 40 px and scales 0.8→1 with spring; 20–30 particles (confetti or ember sparks in brand colours) burst once and fall with gravity; a "cover card" slides in behind with slight parallax tied to device tilt (`expo-sensors`, ±6°). | Rise spring `damping 12`; particles 1200 ms; card 300 ms. Success haptic. Share button appears at 900 ms. | Static trophy card, fade 150 ms, no particles, no tilt. |
| **Check-in confirmation** (arrived at meet, geofence + tap) | Button morphs into a circle (width → height, radius → 50%); a stroke draws around it (Skia path `end` 0→1); a tick draws in; the circle morphs back into a pill "Checked in · +10 rep"; the rep chip in the header bumps scale 1→1.15→1. | Morph 200 ms, stroke 350 ms `Easing.out(cubic)`, tick 200 ms, chip bump spring. Success haptic at tick. | Instant state swap + toast. |
| **Rolling meet "move on" notification** | In-app: a banner slides from top; the meet pin detaches and **animates along the route to the new location** (Mapbox line with a moving dash offset `line-dasharray` animation); the old pin fades to a ghost. Push: rich notification with mini map snapshot. | Banner 250 ms spring; dash offset loop 1000 ms linear for ≤10 s; ghost fade 400 ms. Warning-type haptic (distinct pattern). | Banner fades in; route drawn statically; no moving dashes. |
| **Rep counter tick** | Digits roll (odometer) per digit column, staggered 30 ms right→left. | 400 ms `Easing.out(cubic)`. | Instant number change. |
| **Garage hero / mod tags** | Hero photo with scroll-linked parallax (image moves 0.3× scroll); mod tags stagger in (translateY 8→0, opacity 0→1, 40 ms stagger). | 220 ms each, `Easing.out(quad)`. | No parallax; tags appear together. |
| **Map open at night** ("ignition") | First app open each evening: map fades from black; road layer brightness 0→1 sweeps outward from the user's location (Mapbox `line-opacity` interpolated by distance); a soft engine-start haptic sequence (3 light taps). Once per session only; skippable. | 900 ms total. | Plain fade 150 ms. |

**General motion language [J]:** fast in, gentle settle (springs, not linear); nothing over 400 ms in routine UI; set pieces ≤1.3 s and always skippable. One "hero" animation per moment, not three. Keep the map at 60 fps by pausing all decorative loops while the user pans or zooms.

### C2. Trademark check: EA, "Need for Speed", "NFS", "Underground"

What I could verify:

- **"NEED FOR SPEED"**: multiple USPTO registrations exist, including Reg. 3568454 (registered and renewed) and Reg. 4735238 (§8 & 15 accepted); several older ones cancelled or abandoned. **[S]** [Justia 3568454 (serial 77339181)](https://trademark.justia.com/773/39/need-for-77339181.html), [Justia 86408826](https://trademarks.justia.com/864/08/need-for-86408826.html). EA also filed "NEED FOR SPEED ARENA" at EUIPO (2016) for game software. **[S]** [Trusted Reviews](https://www.trustedreviews.com/news/need-for-speed-arena-trademark-registered-by-ea-in-europe-2940401). There is also a USPTO record "NFS NEED FOR SPEED" (serial 76259849). **[S]** [Justia](https://trademarks.justia.com/762/59/nfs-need-for-speed-76259849.html)
- **"NFS"**: USPTO Reg. 7189486 (serial 97620713), owner Electronic Arts Inc., Class 41, registered 10 Oct 2023 (per an aggregator; verify in TSDR). **[S]** [Markinton](https://markinton.com/trademark/nfs-97620713)
- **EA defends adjacent words:** EA tried to trademark "GHOST" for its NFS studio and backed down after Ubisoft opposed. That shows how crowded the space is and that EA does file on single words. **[S]** [MCV/Develop](https://mcvuk.com/development-news/ea-stops-trying-to-trademark-ghost-for-need-for-speed-dev/)

What I **could not** verify:

- A standalone registered **"UNDERGROUND"** or **"NEED FOR SPEED UNDERGROUND"** mark owned by EA. No hit on Justia/USPTO aggregators via search. The **UK IPO search returned HTTP 403** to automated access, and the USPTO and EUIPO search UIs are JavaScript apps I couldn't query. → Search manually: [UK IPO](https://trademarks.ipo.gov.uk/ipo-tmtext), [EUIPO eSearch](https://euipo.europa.eu/eSearch/), [USPTO](https://tmsearch.uspto.gov/), [WIPO Global Brand DB](https://branddb.wipo.int/).
- "Underground" is a common English word, registered by many unrelated owners across classes. On its own it is unlikely to be exclusively EA's [K].

**Plain verdict [J]: don't use "Underground" in the product name.** You may well be legally able to register something like "Underground Meets", since EA probably doesn't own the bare word. But the owner's stated inspiration is NFS Underground, and an app about modified cars, neon nights, rep and street culture under that name invites a **passing-off / likelihood-of-confusion** argument (UK passing off protects goodwill and "get-up", not just registered marks). It also risks App Store rejection under Guideline 5.2 (IP) and makes the brand weaker and less ownable. Also avoid "NFS", "Need for…", "Most Wanted", "Unbound" and "Outrun" (Sega). Refer to NFS only in internal docs, and never in App Store metadata, ads or keywords.

### C3. Name ideas (original, UK late-night car + bike scene)

| # | Name | Why it fits | Quick flags [J/S] |
|---|---|---|---|
| 1 | **Sodium** (brand line *"Sodium Nights"*) | The orange glow of UK sodium street lamps, the visual signature of British night drives. Short, ownable, not literally "cars", which suits both cars and bikes. | App Store "sodium" = salt-intake trackers (different category). Bare-word domains taken. |
| 2 | **Slipstreet** | Slipstream + street; "slip out" late at night; motion without saying "race". | No App Store hits; .app/.co.uk unregistered-looking. |
| 3 | **Nitelane** | Night + lane; UK "lane" (country lanes, outside lane). Easy to say, easy to spell once seen. | .com/.app/.co.uk all unregistered-looking. Misspelling "Nightlane" risk. |
| 4 | **Streetlit** | Lit by streetlights + "lit" (slang for a buzzing night). | .app/.co.uk unregistered-looking; .com registered. |
| 5 | **Night Garage** | Garage profiles + night; very clear. | Descriptive, so weaker trademark. |
| 6 | **Nightshift** (working) | Shift = gear shift + night shift work-crowd vibe. | Strong conflicts (see §C4). |
| 7 | **Kerbside** (earlier idea) | UK spelling, parked-up at meets. | "Kerb" collides with "kerb crawling" associations; existing Kerb/Kerbside apps; domains taken. |
| 8 | **Lowlight** (earlier idea) | Low cars + low light; also "lowlight" = bad moment. | Lowlight.gg app exists; all domains taken. |
| 9 | **Pinned** (earlier idea) | Map pins + "pinned it" (floored it). | Generic; pinned.app parked by a broker. |
| 10 | **Rolling Up** (earlier idea) | Arriving at a meet; rolling meets. | Cannabis connotation; domains taken. |
| 11 | **Sidelights** | UK term for parking lights; "on the side" of the main night. | .app unregistered-looking; "SideLight" apps exist. |
| 12 | **Dipped** | UK "dipped headlights"; also "dipped" (left). | Food/dessert apps; domains taken. |
| 13 | **Afterlights** | After dark + taillights. | Close to *Afterlight* photo-editor (a strong existing app brand). Avoid. |
| 14 | **Lanelight** | Lane + light; calm, premium. | .app/.co.uk unregistered-looking; .com taken. |
| 15 | **Nightpin** | Literal: night map pins. | All three domains unregistered-looking; very descriptive. |

**Avoid entirely [S/K]:** **Catseye** (registered UK trademark for road studs [K]); **Nightline** (UK student listening charity [K]); **Afterlight** (photo app); anything with **NFS/Underground/Most Wanted/Outrun**.

### C4. Conflict check: best 5 + the working name

Method: UK App Store search API (`itunes.apple.com/search?country=gb`), DNS NS/SOA lookups (a delegated domain = registered; **no delegation suggests but does not prove** it's free), and web searches of the UK IPO Trade Mark Journal. **UK IPO/EUIPO/USPTO databases could not be queried directly** (403 / JS-only), so trademark status is **not verified** for any name.

| Name | UK App Store (same/similar names) | .com | .app | .co.uk | Brands / TM notes | Verdict |
|---|---|---|---|---|---|---|
| **Sodium** | Only salt/sodium-intake trackers (Health & Fitness) | taken | taken | taken | "libsodium"/Sodium crypto library (dev world); "Sodium" Minecraft mod [K]. No car brand found. | **Strong brand, weak domains.** Use **sodiumnights.com/.app/.co.uk** (all unregistered-looking) or getsodium.app. |
| **Slipstreet** | No results | taken (Atom marketplace, likely buyable) | unregistered-looking | unregistered-looking | None found | **Cleanest.** |
| **Nitelane** | No same-name app (UK search) | unregistered-looking | unregistered-looking | unregistered-looking | None found | **Cleanest domains.** Slight "nite" cheapness; test with users. |
| **Streetlit** | No same-name app | taken | unregistered-looking | unregistered-looking | None found | Good. |
| **Lanelight** | No same-name app | taken | unregistered-looking | unregistered-looking | None found | Good, but less "scene". |
| *Nightshift (working)* | Many "Night Shift" apps (horror games, shift-work sleep, nursing) | taken | taken | taken | **Apple's iOS "Night Shift" display feature** [K]: confusion, and App Store search will be noisy. **UK IPO Journal 2026/024: international reg. WO0000001920180 NIGHTSHIFT designating UK, Classes 9 & 11 (flashing lights, beacons, lighting) by Wilhelm Fricke SE, a German vehicle/agri parts group.** **[S]** [UK IPO Journal](https://www.ipo.gov.uk/t-tmj/tm-journals/2026-024/WO0000001920180.html). Different goods from apps, but class 9 and automotive-adjacent. Night Shift Brewing (US) etc. [K] | **Move off it** before investing in branding. |

**Could not verify:** registry ownership or price of any domain (DNS only); trademark registers (UK IPO 403; EUIPO/USPTO not scriptable); Google Play names; Companies House names; social handles (@sodium, @slipstreet etc.); non-UK App Store storefronts. **Next steps:** run each finalist through UK IPO + EUIPO (classes 9, 38, 41, 42, 45), Companies House, a registrar WHOIS, Instagram/TikTok handles, then pay ~£170 to file a UK class 9/42 application for the winner [K: UK IPO online fee is £170 for one class + £50 per extra class].

**Top 3 picks [J]:**
1. **Sodium** (sodiumnights.app / .co.uk): the most evocative and the most *British*; it describes the mood without describing racing.
2. **Slipstreet**: ownable, motion-y, clean on the App Store and on domains.
3. **Nitelane**: all domains look open; reads well as an app icon word.

---

## Sources (main)

- Drivetribe closure: [Driving.co.uk](https://driving.co.uk/news/drivetribe-the-car-website-founded-by-clarkson-hammond-and-may-announces-closure) · [Motor1](https://www.motor1.com/news/559776/drivetribe-closes-after-five-years/) · [The Drive](https://www.thedrive.com/news/43814/drivetribe-is-finally-shutting-down-for-good) · [Jalopnik](https://jalopnik.com/industry-changes-blamed-for-drivetribes-demise-1848331912)
- Zenly: [Seedtable](https://seedtable.com/exits/zenly) · [Life360 blog](https://www.life360.com/?p=209231)
- RoadStr: [App Store](https://apps.apple.com/us/app/id1382535778) · Smoke Scene: [App Store GB](https://apps.apple.com/gb/app/smoke-scene/id1635847952) · DriveLife: [App Store GB](https://apps.apple.com/gb/app/drivelife/id1500589187)
- Calimoto: [Bennetts](https://www.bennetts.co.uk/bikesocial/reviews/products/motorcycle-technology/calimoto-motorcycle-route-planner-review) · [Trustpilot](https://ie.trustpilot.com/review/calimoto.com) · [SlashGear roundup](https://www.slashgear.com/1755865/motorcycle-apps-find-routes-track-rides)
- Kurviger: [docs](https://docs.kurviger.com/web/kurviger_tourer) · Scenic: [App Store](https://apps.apple.com/app/id1089668246) · REVER: [Cycle News](https://www.cyclenews.com/2016/06/article/product-review-rever-app/) · Relive: [Adapty](https://adapty.io/paywall-library/relive/)
- Strava: [heatmap / BikeRadar](https://www.bikeradar.com/news/stravas-heatmap-reveals-military-bases-and-more) · [Flint lawsuit / road.cc](https://road.cc/content/news/60145-family-sues-strava-causing-cyclists-death)
- Life360: [The Markup](https://themarkup.org/privacy/2021/12/06/the-popular-family-safety-app-life360-is-selling-precise-location-data-on-its-tens-of-millions-of-user) · Snap Map: [IBTimes](https://ibtimes.com/how-disable-snap-map-new-snapchat-feature-raises-privacy-concerns-2557718) · Waze: [BGR](https://www.bgr.com/2259383/biggest-issues-with-waze-police-sighting-feature/) · Zello: [BigRoad](https://bigroad.com/blog/bigroad-review-zello-walkie-talkie-app/)
- UK PSPOs: [Waltham Forest](https://www.walthamforest.gov.uk/neighbourhoods/crime-and-community-safety/public-space-protection-orders) · [Colchester](https://www.colchester.gov.uk/vehicular-nuisance-pspo) · [ASBCPA 2014 s.59](https://www.legislation.gov.uk/ukpga/2014/12/section/59) · Motorsport UK: [Get Started](https://getstarted.motorsportuk.org/compete)
- NFSU2: [Wikipedia](https://en.wikipedia.org/wiki/Need_for_Speed:_Underground_2) · [GameSpot review](https://www.gamespot.com/reviews/need-for-speed-underground-2-review/1900-6113360/) · [GameZone review](https://gamezone.com/?p=99473) · [ludo.guide](https://www.ludo.guide/guide/need-for-speed-underground-2) · [NFS wiki Tuning Shop](https://nfs.fandom.com/wiki/Tuning_Shop)
- Trademarks: [Justia NEED FOR SPEED](https://trademark.justia.com/773/39/need-for-77339181.html) · [Markinton NFS](https://markinton.com/trademark/nfs-97620713) · [UK IPO Journal NIGHTSHIFT](https://www.ipo.gov.uk/t-tmj/tm-journals/2026-024/WO0000001920180.html) · [MCV on EA "Ghost"](https://mcvuk.com/development-news/ea-stops-trying-to-trademark-ghost-for-need-for-speed-dev/)
