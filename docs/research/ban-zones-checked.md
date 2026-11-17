# Ban zones: councils checked (Nov 2026)

What was checked for car-meet, car-cruising, street-racing and nuisance-vehicle orders
(PSPOs, "persons unknown" injunctions and repeated police dispersal orders), all on
**17 Nov 2026**. "Added" means it is in `src/data/banZones.ts` or a region file under
`src/data/regions/`. "No order" means nothing current was found. That is not a
guarantee: several council sites block automated reading, and the shared web-search
budget ran out partway through, so rows marked *(low)* need a recheck.

Borough-wide zones use simplified OpenStreetMap council boundaries
(`scripts/fetch-zone-boundaries.mjs`, by GSS code). Gedling uses the council's own
published order map (Gedling open data, OGL). Everything else is a circle round the
named roads or sites.

## Added or changed

| Council | Result | Zone | Dates | Source |
|---|---|---|---|---|
| Stevenage | Car-cruising injunction, whole borough, power of arrest | `bz-stevenage` (outline) | to 31 Jan 2028 | [Stevenage](https://www.stevenage.gov.uk/town-and-community/community-safety/car-cruising-injunction-extension-documents) |
| Brent | Nuisance-vehicles PSPO, borough-wide | `bz-brent` (outline) | 17 Jun 2025, ~Jun 2028 | [Brent decision](https://democracy.brent.gov.uk/ieDecisionDetails.aspx?Id=7409) |
| Southend-on-Sea | Car-cruise PSPO, whole city | `bz-southend` (outline) | renewed 12 Jul 2025, ~Jul 2028 | [Southend](https://www.southend.gov.uk/PSPO) |
| Thurrock | Car-cruising PSPO, West Thurrock and Lakeside | `bz-thurrock-lakeside` | extended Dec 2024, ~Dec 2027 | [Thurrock](https://www.thurrock.gov.uk/news/public-space-protection-orders/car-cruiser-public-space-protection-order-extended-for-another) |
| Braintree | Nuisance-vehicles PSPO, whole district | `bz-braintree` (outline) | 29 May 2026 to 29 May 2029 | [Braintree](https://www.braintree.gov.uk/news/article/893/braintree-district-council-introduces-pspo-to-tackle-antisocial-driving-in-the-district) |
| Colchester | Vehicular-nuisance PSPO (map area; circle on the Northern Gateway hotspot) | `bz-colchester` | 30 Sep 2025, ~Sep 2028 | [Colchester](https://new.colchester.gov.uk/vehicular-nuisance-public-space-protection-order) |
| Breckland | Vehicle ASB PSPO, whole district | `bz-breckland` (outline) | 8 Apr 2025, ~Apr 2028 | [Breckland](https://www.breckland.gov.uk/article/24325/Vehicle-related-anti-social-behaviour-PSPO) |
| East Cambridgeshire | Vehicle ASB PSPO, whole district | `bz-east-cambs` (outline) | enforced 24 Aug 2026, three years | [East Cambs](https://eastcambs.gov.uk/press-releases/2026/new-powers-tackle-anti-social-driving-launched-east-cambs) |
| Peterborough | Car-park PSPO, Pleasure Fair Meadow (medium) | `bz-peterborough-pfm` | ~Jul 2025, ~Jul 2028 | [Peterborough](https://www.peterborough.gov.uk/engagement-hub/pspo-to-be-introduced-at-car-park) |
| Milton Keynes | Car cruise and street racing PSPO, treated as city-wide | `bz-milton-keynes` (outline) | extended Jan 2026, ~Jan 2029 | [MK](https://www.milton-keynes.gov.uk/community-safety-safermk-partnership/public-space-protection-orders-pspo/car-cruising-pspo) |
| Solihull | Street-racing PSPO, Damson and Bickenhill Parkways (start date not found) | `bz-mw-solihull-parkways` | approved 18 Mar 2026, three years | [Switch Radio](https://new.switchradio.co.uk/residents-welcome-pspo-to-curb-illegal-street-racing) |
| Gedling | Car-cruising PSPO, Netherfield, Colwick, Colliery Way | `bz-mw-gedling` (council map) | extended from 23 Jun 2026, three years | [Gedling report](https://democracy.gedling.gov.uk/documents/s44864/Approval%20to%20extend%20the%20Public%20Space%20Protection%20Order%20in%20parts%20of%20NetherfieldColwick%20and%20Colliery%20Wa.pdf) |
| Bassetlaw | Nuisance-vehicles PSPO, whole district, 12 noon to 6am | `bz-mw-bassetlaw` (outline) | 1 Apr 2026 to 30 Mar 2029 | [Bassetlaw](https://www.bassetlaw.gov.uk/community-and-living/community-safety/public-space-protection-orders/nuisance-vehicles-public-space-protection-order-pspo/) |
| Ashfield | District PSPO 2024 with vehicle-nuisance clause | `bz-mw-ashfield` (outline) | Sep 2024, ~Sep 2027 | [Ashfield order](https://democracy.ashfield.gov.uk/documents/s29474/Public%20Spaces%20Protection%20Order%202024.pdf) |
| Broxtowe | Two PSPOs: Eastwood; Chilwell Retail Park and Toton Lane P&R | `bz-mw-eastwood`, `bz-mw-chilwell` | 10 Mar 2026 to 11 Mar 2029 | [Broxtowe](https://www.broxtowe.gov.uk/news-events/public-notices/public-spaces-protection-orders) |
| North West Leicestershire | Car-cruise PSPO, Castle Donington | `bz-mw-castle-donington` | to 23 Jul 2027 | [NW Leics](https://nwleics.gov.uk/news/2024/07/25/car_cruising_ban_expanded_to_cover_the_whole_of_castle_donington) |
| Newcastle-under-Lyme | Car-cruising PSPO, borough-wide | `bz-mw-newcastle-staffs` (outline) | 26 Nov 2024, ~Nov 2027 | [Newcastle-under-Lyme](https://www.newcastle-staffs.gov.uk/public-space-protection-orders/car-cruising-public-space-protection-order-pspo) |
| Stafford | PSPO 2026 incl. the A34 (Trentham, Tittensor, Stone) | `bz-mw-a34-trentham-stone`, `bz-mw-a34-stone-stafford` | 15 May 2026, three years | [Stafford](https://staffordbc.gov.uk/public-space-protection-order-2026) |
| South Staffordshire | Car-cruising PSPO, A449/A460/Featherstone | `bz-mw-featherstone` | 8 Jan 2025, ~Jan 2028 | [South Staffs](https://www.sstaffs.gov.uk/news/2025/public-spaces-protection-order-pspo-deter-car-cruising-south-staffordshire) |
| West Northamptonshire | Car Cruising PSPO 2025, whole area | `bz-mw-west-northants` (outline) | 25 Jun 2025, ~Jun 2028 | [WNC](https://www.westnorthants.gov.uk/personal-safety-and-community-support/public-spaces-protection-orders-pspos/pspos-force-across-west) |
| Redcar and Cleveland | Vehicle nuisance PSPO, borough-wide | `bz-ne-redcar` (outline) | to 31 Dec 2028 | [Redcar](https://www.redcar-cleveland.gov.uk/community-safety/neighbourhood-services/public-space-protection-orders-pspos/vehicle-nuisance-pspo) |
| North Somerset | Area-wide PSPO with vehicle clauses; 2023 text ended 12 Oct 2026, renewal said done but not yet published (medium) | `bz-sws-north-somerset` (outline) | renewed Oct 2026? | [North Somerset](https://n-somerset.gov.uk/my-services/community-safety-crime/public-space-protection-orders/area-wide-orders) |
| Plymouth | Car-park PSPO against car meets (city centre; Mount Batten and Jennycliff) | `bz-sws-plymouth-centre`, `bz-sws-mount-batten` | Sep 2025, ~Sep 2028 | [Plymouth decision](https://democracy.plymouth.gov.uk/ieDecisionDetails.aspx?ID=4650) |
| Eastbourne | Anti-social driving PSPO, seafront and Beachy Head, 1 Apr to 31 Oct (renewal from news, medium) | `bz-sws-eastbourne` | renewed 2025, ~2028 | [2022 order](https://democracy.lewes-eastbourne.gov.uk/documents/s23095/Eastbourne%20Public%20Spaces%20Protection%20Anti-social%20Driving%20Order%202022.pdf) |
| Elmbridge | Repeated police dispersal orders: Cobham Services, Brooklands, Waterside Drive | `bz-sws-cobham-services`, `bz-sws-brooklands`, `bz-sws-walton-waterside` | Aug 2025, May and Jun 2026 | [Ground News](https://ground.news/article/police-say-a-dispersal-order-will-be-in-place-at-cobham-services-and-brooklands-industrial-park-this-weekend) |
| Stockport | Renewal approved Jun 2026 | `bz-ne-stockport` note | to 4 May 2029 | [Consultation](https://consultation.stockport.gov.uk/place/public-space-protection-order-car-cruising-2026) |
| Trafford | Order ran to Aug 2026; no renewal found (kept, flagged "may have lapsed") | `bz-ne-trafford` note | Aug 2023 to Aug 2026 | [Trafford decision](https://democratic.trafford.gov.uk/ieDecisionDetails.aspx?ID=878) |
| Enfield | Upheld Dec 2025 for 12 months, annual review | `bz-enfield` note | review ~Dec 2026 | [Enfield](https://enfield.gov.uk/services/your-council/injunction-order-car-cruising) |
| Broadland, South Norfolk | From 4 Apr 2024 | `bz-broadland-south-norfolk` note | ~Apr 2027 | [SNB](https://www.southnorfolkandbroadland.gov.uk/neighbourhood-issues/public-spaces-protection-orders/public-spaces-protection-order-vehicle-anti-social-behaviour) |
| Sevenoaks (Halstead) | From 1 May 2024 | `bz-halstead` note | ~Apr 2027 | [Sevenoaks](https://www.sevenoaks.gov.uk/pspohalsted) |
| Wirral (Bromborough), West Lancs (Pimbo) | Both renewed Jul 2025 | notes | ~2028 | [Wirral](https://wirralview.com/node/11868), [West Lancs](https://www.westlancs.gov.uk/pspo) |
| Basingstoke | No PSPO; no dispersals found in 2026 | `bz-sws-basingstoke` note | dispersals 2024, 2025 | [Basingstoke PSPOs](https://www.basingstoke.gov.uk/pspo) |

## Found but not mapped

| Council | Result | Source |
|---|---|---|
| Waltham Forest | Car-meet PSPO since Oct 2024; area and expiry not confirmed (the restrictions PDF wasn't readable) | [Waltham Forest](https://www.walthamforest.gov.uk/neighbourhoods/crime-and-community-safety/public-space-protection-orders) |
| Central Bedfordshire | District-wide PSPO approved Oct 2026; signs spring 2027, enforcement summer 2027. Add then | [Hits Radio](https://www.hellorayo.co.uk/hits-radio/beds-bucks-herts/news/new-powers-approved-to-tackle-street-racing-and-car-cruising-across-central-bedfordshire) |
| Bolsover | District-wide PSPO from 25 Sep 2023 (three years); renewal consulted Aug 2026, outcome not found | [Bolsover bulletin](https://content.govdelivery.com/accounts/UKBDC/bulletins/427379d) |
| Carmarthenshire | North Dock, Llanelli vehicle PSPO proposed (consulted Sep–Oct 2026, drafted as 2027) | [Carmarthenshire](https://www.carmarthenshire.gov.wales/council-democracy/have-your-say/proposed-vehicle-anti-social-behaviour-pspo-north-dock/) |
| Newham | Motor Vehicle Nuisance PSPO 18 Jan 2023 to 18 Jan 2026; not renewed (a car-parks PSPO remains) | [Newham](https://newham.gov.uk/community-parks-leisure/public-spaces-protection-order-pspo) |
| Castle Point | Roscommon Way, Canvey PSPO from Sep 2022; probably lapsed Sep 2025 *(low)* | [Hits Radio](https://www.hellorayo.co.uk/greatest-hits/essex/news/canvey-island-boy-racers-face-pound100-fines) |
| Crawley | Car-cruising PSPO ended about Feb 2025; not on the council's list | [Crawley](https://www.crawley.gov.uk/community/protecting-crawley/anti-social-behaviour/public-spaces-protection-orders) |
| Horsham | PSPO with A24/A264 vehicle clauses ended 31 Mar 2024 | [Horsham](https://magazine.horsham.gov.uk/edition/summer-2021/articles/overwhelming-support-for-public-spaces-protection-order) |
| Leeds | City-wide vehicle-nuisance PSPO (2023) ended mid-2026; not on the current list | [Leeds](https://leeds.gov.uk/pspo) |
| North Yorkshire (Scarborough, Whitby, Filey) | Car-cruising PSPO ended about Sep 2024 | [North Yorkshire](https://northyorks.gov.uk/community-and-volunteering/community-safety/public-space-protection-orders-pspo) |
| Wigan | Borough-wide PSPO consulted to Jan 2025; never confirmed as made | [Wigan](https://www.wigan.gov.uk/Council/Consultations/Current/Public-Space-Protection-Orders.aspx) |
| Gloucester, Cheltenham | Car-park PSPOs (no gathering except to park), not car-meet orders | [Gloucester](https://www.gloucester.gov.uk/media/3g2ej54j/longsmith-street-car-park-public-space-protection-order-2026.pdf) |
| Greater Manchester | One-off force-wide dispersal 17–19 Jan 2026; Sussex-wide one 9–11 Jan 2026 | [Roch Valley Radio](https://www.rochvalleyradio.com/news/local-news/police-issue-dispersal-order-across-greater-manchester-to-prevent-dangerous-car-meets/) |
| Somerset | Cheddar Gorge temporary road-closure order (Aug 2025), not a PSPO; status unknown | [Somerset](https://www.somerset.gov.uk/environment-and-food-safety/public-spaces-protection-orders) |
| Rushcliffe, Nottingham | Ratcliffe-on-Soar/A453 traffic order only discussed; undated city-wide 24-hour dispersals *(low)* | [Notts TV](https://nottstv.com/traffic-rules-considered-to-curb-dangerous-car-meets-around-ratcliffe-power-station/) |

## No order found

| Area | Councils (all checked 17 Nov 2026) |
|---|---|
| North of England | York, Harrogate (North Yorkshire), Bury, Warrington, Cheshire West and Chester, St Helens, Cumberland, Westmorland and Furness, Northumberland |
| Midlands | Derby, Telford & Wrekin (police operations at Stafford Park, no order), Charnwood, Hinckley & Bosworth, Blaby, Oadby & Wigston, Leicester, Mansfield, Newark & Sherwood, North Northamptonshire |
| South West | Cornwall, Somerset (no PSPO), Dorset, BCP (one-off dispersals only), Wiltshire (outside Swindon), Torbay, East Devon; *(low)* Exeter, Teignbridge, Stroud, Tewkesbury, Forest of Dean |
| Thames Valley and Oxfordshire | Oxford, Cherwell, West Oxfordshire (A40 order is for pony-and-trap racing), Bracknell Forest, West Berkshire, Windsor & Maidenhead, Reading (Cradock Road meets, no order), Slough, Isle of Wight; *(low)* South Oxfordshire, Vale of White Horse |
| Hampshire | Southampton, Portsmouth, Basingstoke & Deane (no PSPO), Fareham, Eastleigh, Gosport, Havant, Test Valley, New Forest, Winchester, Rushmoor, Hart, East Hampshire |
| Surrey | Epsom & Ewell, Guildford, Reigate & Banstead, Runnymede, Spelthorne, Surrey Heath, Tandridge (a Caterham pavement-parking PSPO only), Waverley, Woking |
| Sussex | Brighton & Hove (open-spaces vehicle PSPO proposed, not about meets), Worthing, Adur, Arun, Chichester, Hastings, Lewes, Rother, Wealden |
| London and East | Havering, Redbridge, Hillingdon, Ealing, Hounslow, Bromley, Bexley, Greenwich, Barnet, Haringey, Tower Hamlets, Barking & Dagenham, Basildon, Hertfordshire districts other than Stevenage, Cambridge, Huntingdonshire, Fenland; *(low)* Luton, Bedford, Chelmsford, Tendring, Harlow, Epping Forest |
| Wales | Swansea *(PSPO page unreadable)*, Cardiff (old Cardiff Bay dispersals), Newport, Neath Port Talbot, Bridgend, Vale of Glamorgan, Rhondda Cynon Taf, Caerphilly, Wrexham *(clauses unseen)*, Flintshire, Conwy, Denbighshire, Gwynedd, Powys, Carmarthenshire (proposed only) |
| Scotland | Perth & Kinross, Stirling, Glasgow, Edinburgh, Dundee, Fife, Falkirk, West Lothian, North and South Lanarkshire, Highland |
| Northern Ireland | Derry City & Strabane, Newry Mourne & Down (Donard Park barriers only), Belfast, Antrim & Newtownabbey, Lisburn & Castlereagh, Armagh Banbridge & Craigavon, Mid Ulster; Causeway Coast & Glens stays a PSNI operation area |

## Not yet checked

The search budget ran out before these: Lincolnshire districts, Stoke and the other
Staffordshire districts (Cannock Chase had a 2025 enforcement story), Warwickshire,
Worcestershire, Herefordshire, Shropshire, South Yorkshire (Sheffield and Rotherham
were checked earlier), Hull and East Riding, North and North East Lincolnshire,
Lancashire, Merseyside (except Wirral and St Helens), the rest of Greater Manchester,
Tees Valley (except Redcar), Durham, Tyneside, the rest of Kent and Suffolk,
Buckinghamshire (an A40/A413 PSPO 2026 and a car-parks PSPO are listed; clauses
unseen), Croydon (Coulsdon meets, no order found) and Rutland.
