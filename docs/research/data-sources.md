# Slipstream: public and third-party data sources (UK)

Researched 17 Nov 2026. Sources are linked inline. Where a fact comes from a third-party page, or I couldn't confirm it on an official page, it is marked **(unverified)**. Prices and quotas change, so recheck them before you commit to a vendor.

Context: iOS app, Expo SDK 58, `react-native-maps` with Apple Maps (`PROVIDER_DEFAULT`) as the base map.

---

## TL;DR

- **"Closures and diversions hosted by Google or Waze" is not possible for this app.** Google has no public traffic-incident or closure API. Waze shares incident and closure feeds only with Waze for Cities partners, who are public bodies and road operators, not app developers. Neither company's speed-camera data can be reused.
- **Google Places, Routes and Roads data must not be shown on, or used with, an Apple map.** The Google Maps Platform terms say so outright. Adopting Google data means switching the map to Google (`PROVIDER_GOOGLE`).
- **The cheapest win is Apple's `showsTraffic` plus UK government open data.**
  - `showsTraffic` gives congestion colouring only, with no closure or incident icons.
  - National Highways, Street Manager (DfT), TfL and Traffic Scotland give closures and roadworks under OGL-style terms, and they are free.
- **Speed cameras:** OSM `highway=speed_camera` (ODbL) is the only free source you can legally reuse. Commercial licensing (PocketGPSWorld) is the route to a complete database.

---

## 1. Google Maps Platform

**What it gives:** Places (search, details, photos, reviews), Routes (traffic-aware routing, ETAs), Roads (snap-to-road, nearest road, speed limits), the Maps SDK for iOS (Google base map with a traffic layer), and Navigation SDK.

**What it does not give:** any public API for traffic incidents, closures or speed cameras. Google Maps shows these in its own app, but they are not exposed to developers. The traffic layer in the Maps SDK is display-only.

### Terms (verified on the official pages)

- **Using Google data with an Apple map is banned.** Maps Platform Terms §3.2.3(e) "No Use With Non-Google Maps" (last modified 26 Aug 2026) says: *"Customer will not use the Google Maps Core Services with or near a non-Google Map in a Customer Application. For example, Customer will not (i) display or use Places content on a non-Google Map…"*
  - The Service Specific Terms (last modified 28 Oct 2026) repeat this per product: Places §14.2, Roads §17.2, Routes §19.2, Navigation SDK §12.2.
  - **Only exception:** Places UI Kit (§15.1) *may* be used "with or without any map, including a non-Google Map". This is Google's prebuilt place-card UI, not raw data.
- **Caching:**
  - Nothing may be cached except what the Service Specific Terms permit (§3.2.3(b)).
  - Latitude/longitude from Places, Roads and Routes may be cached for **30 consecutive days at most**, then deleted.
  - `place_id` may be cached indefinitely.
  - **Consequence:** you cannot keep Google place names, addresses or route geometry permanently in your meets or routes database. Store your own coordinates (user-dropped pins) plus a `place_id` instead.
- **Other restrictions in §3.2.3:**
  - No scraping, and no "copy and save business names, addresses, or user reviews".
  - No creating content from Google content.
  - No "re-creating Google products". This includes real-time navigation "substantially similar" to Google Maps on Android.
  - No use with text-to-speech.
  - No use in embedded vehicle systems (CarPlay is a grey area, **unverified**).
  - A Waze-like drive mode built on Google Routes and Navigation is exactly what these clauses target.
- **UK billing accounts** use the non-EEA terms. The EEA has its own version, which does not apply to the UK.

### Pricing

Source: [developers.google.com/maps/billing-and-pricing/pricing](https://developers.google.com/maps/billing-and-pricing/pricing). The page is undated; I checked it on 17 Nov 2026. Free caps are per SKU per month; the pooled $200 credit was replaced in March 2025.

| SKU | Free per month | First paid band (USD per 1,000) |
|---|---|---|
| Maps SDK (mobile native map) | unlimited | $0 |
| Place Details Essentials / Pro | 10k / 5k | $5 / $17 |
| Text Search Pro, Nearby Search Pro | 5k | $32 |
| Autocomplete requests | 10k | $2.83 (session usage unlimited) |
| Compute Routes Essentials / Pro / Enterprise | 10k / 5k / 1k | $5 / $10 / $15 |
| Roads: Nearest Roads, Route Traveled | 5k | $10 |
| Roads: Speed Limits | 5k | $20, **limited access** (needs Google approval) |

**Effort:**
- Switching `react-native-maps` to `PROVIDER_GOOGLE` on iOS needs the Google Maps iOS SDK, a config plugin and an API key. That is moderate effort.
- The Apple map would go entirely. Everything on screen would then have to be Google, or your own data.

**Recommendation:**
- **Avoid for Phase 1–3.** If you later need rich POI search, use Apple MapKit search, or adopt Places UI Kit for place cards only.
- Revisit only if you decide to move the whole app to a Google base map. Even then, Google gives no closure or incident data and no speed cameras.

## 2. Waze

| Programme | What it is | Who can get it |
|---|---|---|
| Waze for Cities (Partner Hub) data feed | GeoRSS/JSON feed of alerts (accident, hazard, road closed…), jams and irregularities, limited to an approved polygon. [Spec v3.0, Apr 2023](https://support.google.com/waze/partners/answer/13458165) | Government agencies, road operators, emergency services, and event/venue organisers after review. Free, but **under a partner agreement**. [Apply page](https://support.google.com/waze/partners/answer/10453062), [Waze for Cities](https://www.waze.com/en-GB/ccp) |
| CIFS / WZDx / DATEX II inbound feeds | How partners *send* closures **to** Waze | Partners (data in, not out) |
| Waze Transport SDK | Lets your app drive Waze navigation | Partners only; aimed at ride-hail, delivery and parking. [docs](https://developers.google.com/waze/intro-transport) |
| Waze Audio Kit | Puts audio-player controls inside Waze | Approved audio partners |
| **Waze deep links** (`https://waze.com/ul?ll=lat,lng&navigate=yes`) | Opens Waze to navigate to a point | **Anyone, free, no sign-up** |

**Constraints:**
- No public incidents API exists, and no Waze page I found covers police or speed-camera data for third parties.
- I could not read the Waze for Cities agreement terms. I found no 2025–26 change opening the feed to commercial developers.
- Esri says its Waze Live Alerts layer retires in Dec 2026; the replacement still needs Waze for Cities membership ([Esri blog](https://www.esri.com/arcgis-blog/products/arcgis-solutions/announcements/introducing-the-waze-live-alerts-data-pipeline)).
- Scraping the Waze live map breaks the Waze ToS. **Avoid.**

**Recommendation:**
- **Use deep links now:** a "Navigate with Waze" button on meets and route starts, next to "Open in Apple Maps".
- **Avoid** anything else.

## 3. Apple (MapKit, Maps Server API, Look Around, WeatherKit)

### What `showsTraffic` shows

- `react-native-maps` `showsTraffic` maps to `MKMapView.showsTraffic`. It colours roads by congestion in Apple's base layer.
- **It does not show incident or closure icons.** Apple DTS (Ed Ford, Feb 2025) said: *"There isn't an API that will provide your app with live traffic incident annotations"*, i.e. the "Road Closed" advisories seen in Apple Maps ([forum thread](https://developer.apple.com/forums/thread/774927)). Apple suggested pulling from regional government feeds instead.
- In a related thread, DTS said MapKit gives "a base layer that just happens to be updated", not live reports.

### Other MapKit services

- **Search and geocoding:** `MKLocalSearch`, `MKLocalSearchCompleter`, `CLGeocoder`. Native MapKit on iOS has no published charges. Apple throttles per device (exact limits are not documented, **unverified**).
- **Place IDs:** `MKMapItem.identifier` (iOS 18+) is designed to be stored. Apple's sample code persists it, and WWDC25 session 204 calls it "the best choice when you want to persist a reference to a specific place". Forum reports say it is sometimes missing on device.
- **Directions:** `MKDirections` returns ETAs with traffic. It works for "open route in app" and for distance and time estimates.
- **Look Around:** `MKLookAroundSceneRequest` and `MKLookAroundViewController` (iOS 16+).
  - `react-native-maps` does **not** wrap Look Around, so it needs a small custom Expo native module.
  - UK coverage started in 2020 with London and Edinburgh. I could not find an up-to-date coverage list, so check this per location.

### MapKit JS and Apple Maps Server API (if you add a web or backend)

- Free per Developer Program membership: **250,000 map views and 25,000 service calls a day**, with the calls quota shared between MapKit JS and the Server API ([MapKit JS](https://developer.apple.com/maps/mapkitjs/), [WWDC22 notes](https://wwdcnotes.com/notes/wwdc22/10006)). Beyond that you get HTTP 429; you can request more, and no overage price is published.
- The Server API does geocoding, search and ETA. It has no traffic incidents.

### WeatherKit

- **500,000 calls a month** are included with the $99 membership. Extra plans start at 10M calls for $499.99 a month ([developer.apple.com/weatherkit](https://developer.apple.com/weatherkit)). This covers sunrise/sunset, conditions and alerts, and needs Apple attribution.

**Terms (unverified):** I did not re-read the Apple Developer Program License Agreement's MapKit clauses on caching map content. Store only your own data and place identifiers.

**Recommendation:**
- **Use now:** Apple base map with `showsTraffic` (one prop), MapKit search and Place IDs, Apple Maps deep links, and WeatherKit.
- **Later:** a Look Around module.

## 4. UK open data: closures, roadworks and incidents

| Source | Coverage | What it gives | Access and format | Licence and cost | Recommendation |
|---|---|---|---|---|---|
| **National Highways Developer Portal** ([portal](https://developer.data.nationalhighways.co.uk/), [FAQ](https://developer.data.nationalhighways.co.uk/faq)) | England strategic road network (motorways, major A roads) | Road and Lane Closures v2.0 (planned and, since Mar 2025, unplanned; "re-aligned DATEX II payload"), Speed Managed Areas, Digital VMS, Road Limits and Features. Diversion Routes is a spatial dataset on the NH Open Data Portal. | Self-service sign-up, then a subscription key. **10 calls a minute per key.** Accounts lapse after 12 months unused. | Free. NH's Digital Lab blog says sign-up is "free" under the "Government Open Data Licence". The portal T&Cs were not read (**unverified**). | **Use now.** Poll from your backend every few minutes and serve your own tiles or GeoJSON. |
| **NTIS DATEX II** (raw National Traffic Information Service) | England SRN | Full incidents, roadworks, journey times, VMS | Registration **and approval**, push/pull DATEX II ([Traffic England services](https://www.trafficengland.com/services-info)). A limited subset is on data.gov.uk under OGL. | Free (OGL subset) | Later. The developer portal above is easier. |
| **DfT Street Manager open data** ([docs](https://department-for-transport-streetmanager.github.io/street-manager-docs/open-data), [gov.uk guidance](https://www.gov.uk/guidance/find-and-use-roadworks-data)) | **England**, every local-authority road (utility and highway works) | Permit and activity events: WKT geometry, `traffic_management_type` (e.g. `road_closure`), proposed/actual start and end dates, USRN | Register an **HTTPS endpoint** and accept the terms. AWS SNS pushes JSON (topics: activities, permits, section 58). Verify message signatures. Near real time. | **OGL v3.0**, free | **Use now (Phase 2).** This is the best free source for local-road closures and roadworks. It needs a small backend (a serverless function plus a DB). |
| **TfL Unified API** ([portal](https://api-portal.tfl.gov.uk/faq)) | London | Road disruptions, roadworks, closures | Free key, 500 requests a minute (50 a minute without a key) | TfL open data terms (free; attribution required, **terms not read**) | Use now if London matters to you |
| **Traffic Scotland DATEX II** ([developer hub](https://www.traffic.gov.scot/traffic-scotland-developer-hub)) | Scottish trunk roads | Unplanned events, current and future roadworks, traffic status, VMS, journey times, camera images | Registration and approval; DATEX II receiver | Free (cost not stated). Must credit Traffic Scotland, and they can block heavy users. | Later (Phase 3) |
| **Traffic Wales** | Welsh trunk roads | Not found | I found no public developer feed (**unverified**). Contact the Welsh Government. | n/a | Investigate later |
| **Transport NI** ([data.gov.uk](https://www.data.gov.uk/dataset/75842be9-20af-43f2-be9c-22897c125080/live-traffic-information-from-transportni)) | Northern Ireland | Roadworks, incidents, events | Open feeds (ITS Directive) | Not read (**unverified**) | Later |
| **one.network** (Causeway) | All of GB, 300+ authorities, roadworks and closures, with diversions | Commercial API | "Contact us". G-Cloud listings show £6k–£155k a year (**unclear** what that covers) ([DfT catalogue](https://findtransportdata.dft.gov.uk/dataset/real-time-road-closures-feed-1785b084f38)) | Commercial licence | Avoid for now. Revisit if funded. |

**Local-authority feeds:** a few councils publish their own feeds, but Street Manager already aggregates English local-authority works. Do not chase individual councils.

**Diversions:** only National Highways (Diversion Routes dataset) and one.network give structured diversions. Street Manager gives the works location, not the diversion route.

## 5. Commercial traffic APIs

These are the only practical route to **live incidents (accidents, jams, closures) across the whole UK in one feed**.

| Vendor | Incidents/closures data | Free tier | Paid | Notes |
|---|---|---|---|---|
| **TomTom** ([pricing](https://docs.tomtom.com/pricing), [Incident Details v5](https://docs.tomtom.com/traffic-api/documentation/tomtom-maps/traffic-incidents/incident-details)) | Accident, Jam, Lane Closed, **Road Closed**, **Road Works**, Ice, Flooding, Broken-down vehicle, etc. Present and future. Bbox up to 10,000 km². No cameras or police. | **2,500 Incident Details calls a month**; 200k incident raster or vector tiles a month; no credit card needed | Third-party pages quote about $0.75 per 1,000 non-tile calls (**unverified**). TomTom changed pricing on 1 Jun 2026 (**unverified**). | Strong UK coverage. Tiles can be drawn as a `UrlTile` overlay on the Apple map. **I could not read the TomTom developer terms** (JS-rendered), so check them for caching and third-party-map rules before launch. |
| **HERE** | Traffic API v7 for flow and incidents | Traffic **5,000 transactions a month**; traffic raster and vector tiles 30k a month ([pricing](https://developer.here.com/pricing), currency and effective date **unverified**) | About €2.20 per 1,000 above that; Base plan +6% from 1 Apr 2026 | Good UK data. Terms not reviewed. |
| **Mapbox** ([pricing](https://www.mapbox.com/pricing)) | No public incidents API. Traffic data is "contact sales". Directions is traffic- and closure-aware. | Mobile Maps SDK 25k MAU; Directions 100k a month; Navigation SDK 1,000 trips and 100 MAU | Directions $2 per 1,000 | Mainly useful only if you switched the base map to Mapbox. |

**Recommendation:**
- **Later (Phase 3/4 drive mode):** TomTom incident tiles plus Incident Details called from your backend, cached per area and shared across users so you stay inside the free tier. Read the TomTom terms first.
- Until then, government feeds cover planned closures and roadworks.

## 6. UK speed cameras

**Legality:** GPS-database camera alerts are legal in the UK; radar or laser jammers are not.

| Source | What it gives | Constraint | Recommendation |
|---|---|---|---|
| **OpenStreetMap** `highway=speed_camera` (node) + `type=enforcement` relation with `enforcement=maxspeed` / `average_speed` | Fixed and average-speed cameras. A forum user's Overpass query found about 8,800 UK nodes against roughly 7,000 real sites, so expect duplicates and gaps ([OSM forum](https://community.openstreetmap.org/t/how-to-overpass-query-for-every-speed-camera-in-the-uk/126737)). | **ODbL 1.0:** attribution "© OpenStreetMap contributors" is required. If you **merge OSM cameras with your own user reports into one public database**, that derivative database must be offered under ODbL (share-alike). Keep user reports in a separate layer (a "collective database") to avoid this. Freshness depends on volunteers. | **Use in Phase 4** as the free baseline. Run a weekly Overpass/Geofabrik extract into your DB, with no live Overpass calls from the app. |
| **Safety camera partnerships and police** | Some publish fixed-site lists. Example: TfGM CSV under OGL, last updated 2014. Safety Cameras Scotland publishes locations. DfT transparency data is area-level. | Patchy, stale, inconsistent formats, no national file | Avoid as a primary source. Possibly use it to cross-check OSM. |
| **National Highways Speed Managed Areas API** | Roadworks and variable speed-limit areas on the strategic road network | Free (see section 4) | Use in drive mode for "reduced limit ahead" |
| **PocketGPSWorld** ([corporate enquiries](https://www.pocketgpsworld.com/corporate-enquiries.htm)) | The most complete UK database: fixed, average-speed, red-light and mobile sites, updated continuously. Already licensed to third parties (e.g. A-Z Maps). | Commercial licence; price on request | **Later (Phase 4)** if you want a reliable camera product. Budget for it. |
| Google, Waze, Apple camera data | Shown in their own apps | No API; terms prohibit extraction | **Avoid** |

## 7. Other useful data

| Source | What it gives | Access, licence and cost | Recommendation |
|---|---|---|---|
| **OSM roads + Curvature** ([adamfranco/curvature](https://github.com/adamfranco/curvature)) | Scores OSM road segments for twistiness. World KML at kml.roadcurvature.com, refreshed about every 2 weeks. | Tool is GPL-3 (per mirror, **check the upstream LICENSE**). Output is derived from OSM, so ODbL applies to the data. Run it yourself on a Geofabrik GB extract. | **Use in Phase 2–3** to suggest "sprint" roads. Precompute on a server and store your own segments. |
| **OSM POIs** (`amenity=parking`, `amenity=fuel`, viewpoints, etc.) | Car parks, fuel, viewpoints for photo spots | ODbL, attribution. Don't use the OSM tile servers in an app; you are on Apple tiles anyway. | Use now, server-side extract |
| **DVLA Vehicle Enquiry Service API** ([docs](https://developer-portal.driver-vehicle-licensing.api.gov.uk/apis/vehicle-enquiry-service/vehicle-enquiry-service-description.html), [T&Cs](https://register-for-ves.driver-vehicle-licensing.api.gov.uk/terms-and-conditions)) | From a plate: **make, colour, engineCapacity, fuelType, yearOfManufacture**, tax and MOT status, CO2, euroStatus, wheelPlan. **No model.** | Apply for a key; one key per company; 2 requests/second by default; key deleted after 90 days unused. "The current service is free"; DVLA may charge in future. Do not use DVLA logos. Call **from your backend only** (the key must not ship in the app). Whether a consumer app is approved is up to DVLA (**unverified**). | **Use in Phase 1–2** to auto-fill a user's car profile from their plate |
| **DVSA MOT History API** ([docs](https://documentation.history.mot.api.gov.uk/), [rate limits](https://documentation.history.mot.api.gov.uk/mot-history-api/rate-limits)) | MOT tests from 2005 (GB cars and bikes): includes **model**, mileage, results and advisories | Register (DVSA approves). OAuth2 client credentials plus API key. 500k requests a day, 15 rps. No cost stated. The old API was deprecated Sept 2025. | **Use with DVLA** to fill in the model. Backend only. |
| **Fuel Finder** (statutory, Motor Fuel Price (Open Data) Regulations 2025) ([gov.uk collection](https://www.gov.uk/government/collections/fuel-finder), [developer guidance](https://www.gov.uk/guidance/access-the-latest-fuel-prices-and-forecourt-data-via-api-or-email)) | Every UK forecourt: prices by fuel type, brand, amenities. Retailers must update within 30 minutes. | GOV.UK One Login, then a REST API with OAuth2 client credentials, **or** a CSV updated twice daily. Collection page says OGL v3.0. Published 2 Feb 2026. A third-party source says users must display prices without bias (**unverified**). | **Use in Phase 3** for "fuel on route / near meet" |
| **Met Office Weather DataHub** ([site-specific pricing](https://datahub.metoffice.gov.uk/pricing/site-specific)) | UK site-specific forecasts | Free **360 calls a day**; paid from £8 a month (900 a day) | Optional. WeatherKit (500k a month included) is cheaper for an iOS app. Met Office is better for UK branding and warnings. |
| **Sunrise/sunset** | Golden hour and night meets | Compute on device (e.g. the `suncalc` npm package); no API needed | Use now |

---

## Recommended stack by phase

**Phase 1: social map, meets, photo spots**
- Apple base map via `react-native-maps` with `showsTraffic` on (congestion only).
- Apple MapKit search and autocomplete. Store only your own coordinates plus `MKMapItem.identifier`.
- Deep links to Apple Maps and **Waze** for "navigate to meet".
- WeatherKit for meet-day weather; sunrise/sunset on device.
- DVLA VES + DVSA MOT History via your backend, for car profiles from a plate.

**Phase 2: cruises, routes, closures**
- Backend ingesters writing to your DB, served as GeoJSON or vector tiles and drawn as overlays on the Apple map:
  - National Highways Road and Lane Closures v2 (poll, 10 calls a minute).
  - DfT Street Manager SNS push (England local roads).
  - TfL road disruptions (London).
- Warn when a planned cruise route crosses an active or planned closure. This is the realistic version of "closures and diversions show".
- OSM extracts for car parks and viewpoints.

**Phase 3: sprint routes and fuel**
- Curvature run over the OSM GB extract to suggest twisty roads.
- Fuel Finder prices along routes.
- Add Traffic Scotland (and Wales or NI if feeds exist) for wider coverage.

**Phase 4: Waze-like drive mode**
- Live incidents: TomTom Incident Details plus incident tiles, cached server-side per area (free 2.5k calls a month, then paid). HERE is the alternative. Read the vendor terms first.
- Cameras: OSM speed cameras (ODbL, kept as a separate layer from user reports) plus NH Speed Managed Areas. Licence PocketGPSWorld if you need production-grade coverage.
- User-reported hazards and police: your own crowd data (Waze-style). This is the only route to police and live-hazard alerts, because no provider licenses these.
- Navigation: hand off to Apple Maps or Waze via deep link rather than building turn-by-turn. Building it on Google would also breach the Google terms.

## Not verified / open questions

- TomTom developer terms (caching, use over non-TomTom maps), and current TomTom and HERE per-1,000 prices after the 2026 changes.
- National Highways developer-portal T&Cs: is it explicitly OGL, and is commercial use allowed? The only evidence is an NH blog post.
- Apple Developer Program License Agreement clauses on caching MapKit content, and native MapKit throttling limits.
- Whether DVLA approves VES keys for consumer social apps.
- Waze for Cities agreement text: can it ever cover a commercial app? All the evidence points to no.
- Traffic Wales and Transport NI developer feeds.
- Current Look Around coverage outside London and Edinburgh.
- Whether Google's iOS traffic layer shows closure icons. Irrelevant unless you switch to a Google base map.
