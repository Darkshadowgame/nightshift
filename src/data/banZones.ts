import type { BanZone } from '../lib/types';
import {
  BRAINTREE, BRECKLAND, BRENT, BROADLAND, DARTFORD, EAST_CAMBRIDGESHIRE, GRAVESHAM, MEDWAY, MILTON_KEYNES, SANDWELL, SOUTH_NORFOLK, SOUTHEND, STEVENAGE,
  TONBRIDGE_MALLING, WALSALL, WALTHAM_FOREST, WOLVERHAMPTON,
} from './zoneBoundaries';
import { banZones as NORTH_ENGLAND_BAN_ZONES } from './regions/northEngland';
import { banZones as SOUTH_WEST_SOUTH_BAN_ZONES } from './regions/southWestSouth';
import { banZones as MIDLANDS_WALES_BAN_ZONES } from './regions/midlandsWales';
import { banZones as SCOTLAND_NI_BAN_ZONES } from './regions/scotlandNI';

/**
 * Sample ban zones: areas covered by real court injunctions, PSPOs (public
 * spaces protection orders) or repeated police dispersal orders against car
 * cruising and meets. Borough- and city-wide orders use the council boundary
 * (simplified, zoneBoundaries.ts); smaller ones a rough circle. Orders change,
 * so every note says to check the current order. The app warns
 * when a stop or place is inside one; it never blocks.
 *
 * East Anglia, Kent and London zones come from docs/research/regional-places.md
 * ("Avoid"), with its sources.
 */
const CHECK = 'Sample — check the current order.';

const BASE_BAN_ZONES: BanZone[] = [
  {
    id: 'bz-blackcountry', name: 'Black Country (Wolverhampton, Sandwell, Walsall)', centre: { lat: 52.58, lng: -2.06 }, radiusMiles: 9,
    polygons: [...WOLVERHAMPTON, ...SANDWELL, ...WALSALL],
    kind: 'injunction',
    hours: '3pm to 7am',
    bans:
      'Between 3pm and 7am: taking part (driving, riding or as a passenger) in a gathering of two or more where some race, do stunts (burnouts, donuts, drifting) or drive dangerously; organising, promoting or publicising one; and watching one. Breaking it is contempt of court.',
    note: `${CHECK} High Court street-racing injunction for the whole of Wolverhampton, Sandwell and Walsall (Wolverhampton CC and others v Persons Unknown), reviewed Feb 2026 and in force to 23:59 on 1 Mar 2027. Dudley left it in Feb 2026 and has its own PSPO.`,
    source: 'https://www.wolverhampton.gov.uk/parking-and-roads/car-cruising-injunction',
    checked: '2026-11-17',
  },
  {
    id: 'bz-westminster', name: 'Westminster and Kensington', centre: { lat: 51.509, lng: -0.15 }, radiusMiles: 1.75,
    note: `${CHECK} High Court car-cruising injunction (2026, power of arrest): Knightsbridge and Belgravia, Hyde Park, St James and West End wards, and Brompton and Hans Town. Bans racing, stunts, and revving or dangerous driving 18:00–07:00, and organising or promoting meets.`,
    source: 'https://www.rbkc.gov.uk/community-and-local-life/community-safety/car-cruising-injunction-order',
  },
  {
    id: 'bz-enfield', name: 'Enfield', centre: { lat: 51.652, lng: -0.08 }, radiusMiles: 4,
    note: `${CHECK} Borough-wide car-cruising injunction (since Dec 2024), power of arrest. Upheld at the Dec 2025 review for another 12 months and reviewed each year (next about Dec 2026). Named hotspots: the A10, Enfield Retail Park and Southbury Leisure Centre.`,
    source: 'https://enfield.gov.uk/services/your-council/injunction-order-car-cruising',
  },
  {
    id: 'bz-great-yarmouth', name: 'Great Yarmouth seafront', centre: { lat: 52.607, lng: 1.737 }, radiusMiles: 2,
    note: `${CHECK} Vehicle anti-social behaviour PSPO (seafront incl. Marine Parade, North Drive and South Denes), renewed to 2029, with a noise camera on Marine Parade and £80 fines.`,
    source: 'https://www.great-yarmouth.gov.uk/article/15590/Measures-renewed-to-tackle-vehicle-related-anti-social-behaviour-in-Great-Yarmouth',
  },
  {
    id: 'bz-felixstowe', name: 'Felixstowe seafront', centre: { lat: 51.958, lng: 1.35 }, radiusMiles: 1.5,
    note: `${CHECK} East Suffolk PSPO (Dec 2025 to Dec 2028): organising, promoting or taking part in a car meet in the area is an offence.`,
    source: 'https://www.eastsuffolk.gov.uk/sites/default/files/2025-12/Felixstowe%20Public%20Space%20Protection%20Order.pdf',
  },
  {
    id: 'bz-norwich', name: 'Norwich', centre: { lat: 52.63, lng: 1.297 }, radiusMiles: 3,
    note: `${CHECK} Vehicle anti-social behaviour PSPO covering several city locations, renewed from 26 July 2026 for three years.`,
    source: 'https://www.norwich.gov.uk/your-council-explained/policies-plans-and-strategies/public-spaces-protection-orders-pspos/vehicle',
  },
  {
    id: 'bz-broadland-south-norfolk', name: 'Broadland and South Norfolk', centre: { lat: 52.6, lng: 1.32 }, radiusMiles: 16,
    // The two districts round Norwich, not the city itself (it has its own order, bz-norwich).
    polygons: [...BROADLAND, ...SOUTH_NORFOLK],
    note: `${CHECK} District-wide vehicle PSPOs round Norwich, including Longwater Retail Park, from 4 Apr 2024 (three years, so to about Apr 2027). Norfolk Police run Operation Octane against car-meet anti-social behaviour.`,
    source: 'https://www.southnorfolkandbroadland.gov.uk/news/9-reduction-in-vehicle-related-anti-social-behaviour-1',
  },
  {
    id: 'bz-cromer', name: 'Cromer', centre: { lat: 52.931, lng: 1.301 }, radiusMiles: 1.5,
    note: `${CHECK} North Norfolk vehicle anti-social behaviour PSPO, in force from 20 Aug 2024 for three years.`,
    source: 'https://modgov.north-norfolk.gov.uk/documents/s20322/Prohibition%20of%20inconsiderate%20and%20inappropriate%20vehicle%20use%20related%20to%20Antisocial%20Behaviour_.pdf',
  },
  {
    id: 'bz-halstead', name: 'Halstead and Polhill', centre: { lat: 51.333, lng: 0.135 }, radiusMiles: 1.5,
    note: `${CHECK} Sevenoaks District Council nuisance-vehicle PSPO (from 1 May 2024, up to three years, so to about Apr 2027) on London Road, Halstead, the Orpington By-Pass, Badgers Mount and the M25 spur by junction 4, after car meets and racing.`,
    source: 'https://www.kentonline.co.uk/sevenoaks/news/boy-racers-face-fines-over-noisy-car-cruising-events-304087/',
  },
  {
    id: 'bz-medway', name: 'Medway (whole area)', centre: { lat: 51.4, lng: 0.55 }, radiusMiles: 7,
    polygons: MEDWAY,
    kind: 'pspo',
    bans: 'Car cruising and anti-social use of motor vehicles: convoys, racing, stunts (wheel spins, burnouts), revving, and recording or gathering to watch them.',
    note: `${CHECK} Medway nuisance-vehicles PSPO (made 2023), in force from 1 Apr 2024 for three years (to about Mar 2027); a renewal went to scrutiny in Aug 2026. Almost 50 fixed penalties were issued after a racing gathering at Hoo in Jun 2026. Kent Police also use 48-hour dispersal orders here.`,
    source: 'https://www.medway.gov.uk/pspo',
    checked: '2026-11-17',
  },
  {
    id: 'bz-dartford', name: 'Dartford (borough-wide)', centre: { lat: 51.43, lng: 0.24 }, radiusMiles: 4,
    polygons: DARTFORD,
    kind: 'pspo',
    bans: 'Entering or gathering to display, race or watch motor vehicles; speeding, convoys, racing, stunts, horns, revving and anything a reasonable person would call car cruising. £100 fixed penalty.',
    note: `${CHECK} Borough-wide nuisance-vehicles PSPO (first made May 2022 for three years; the council now lists a "Nuisance Vehicle Order 2025", so renewed in 2025, probably to about 2028). Enforced at Crossways Boulevard and Bluewater; Kent Police also use dispersal orders here.`,
    source: 'https://www.dartford.gov.uk/community-safety/public-space-protection-order',
    checked: '2026-11-17',
  },
  {
    id: 'bz-sheerness', name: 'Sheerness', centre: { lat: 51.44, lng: 0.76 }, radiusMiles: 1.5,
    note: `${CHECK} Kent Police have used 48-hour dispersal orders against planned race meets here. Not a standing order, but expect them.`,
    source: 'https://www.kentonline.co.uk/sheerness/news/dispersal-order-to-stop-planned-race-meet-300812/',
  },
  // Added 17 Nov 2026 from docs/research/ban-zones-checked.md.
  {
    id: 'bz-stevenage', name: 'Stevenage (whole borough)', centre: { lat: 51.9, lng: -0.2 }, radiusMiles: 3,
    polygons: STEVENAGE,
    kind: 'injunction',
    bans: 'Taking part in, organising or promoting a car cruise (two or more vehicles) anywhere in the borough. Breaking it is contempt of court, with a power of arrest.',
    note: `${CHECK} Car-cruising injunction for Stevenage, extended at the Feb 2023 hearing until 31 Jan 2028, with a power of arrest.`,
    source: 'https://www.stevenage.gov.uk/town-and-community/community-safety/car-cruising-injunction-extension-documents',
    checked: '2026-11-17',
  },
  {
    id: 'bz-brent', name: 'Brent (borough-wide)', centre: { lat: 51.56, lng: -0.27 }, radiusMiles: 4,
    polygons: BRENT,
    kind: 'pspo',
    bans: 'Revving engines, repeated sudden acceleration, racing and stunts in vehicles anywhere in the borough.',
    note: `${CHECK} Borough-wide nuisance-vehicles PSPO, extended from 17 Jun 2025 for three years (to about Jun 2028).`,
    source: 'https://democracy.brent.gov.uk/ieDecisionDetails.aspx?Id=7409',
    checked: '2026-11-17',
  },
  {
    id: 'bz-southend', name: 'Southend-on-Sea (whole city)', centre: { lat: 51.545, lng: 0.7 }, radiusMiles: 4,
    polygons: SOUTHEND,
    kind: 'pspo',
    bans: 'Car-cruise behaviour anywhere in the city: noise (horns, music, modified exhausts), dangerous driving, speeding, convoys, racing, stunts, intimidation, littering, parking outside marked bays and nitrous oxide.',
    note: `${CHECK} City-wide car-cruise PSPO (made Apr 2023, renewed unchanged 12 Jul 2025 for three years, to about Jul 2028). It replaced Southend's old injunction.`,
    source: 'https://www.southend.gov.uk/PSPO',
    checked: '2026-11-17',
  },
  {
    id: 'bz-thurrock-lakeside', name: 'West Thurrock and Lakeside', centre: { lat: 51.485, lng: 0.285 }, radiusMiles: 1.5,
    kind: 'pspo',
    bans: 'Taking part in car cruising as a driver or passenger, or gathering to watch it, including in car parks.',
    note: `${CHECK} Thurrock car-cruising PSPO (since 2015, extended Dec 2024 for three years, to about Dec 2027) for the area between the Thames, the M25, the A13, the B186 and West Thurrock Way, including Lakeside. Circle is approximate.`,
    source: 'https://www.thurrock.gov.uk/news/public-space-protection-orders/car-cruiser-public-space-protection-order-extended-for-another',
    checked: '2026-11-17',
  },
  {
    id: 'bz-braintree', name: 'Braintree district', centre: { lat: 51.9, lng: 0.6 }, radiusMiles: 12,
    polygons: BRAINTREE,
    kind: 'pspo',
    bans: 'Car cruising and car meets (including gathering round cars), noise, fumes, disruptive convoys, stunts such as drifting, doughnuts, wheelspins and wheelies, and obstruction.',
    note: `${CHECK} District-wide Nuisance Vehicles PSPO, 29 May 2026 to 29 May 2029.`,
    source: 'https://www.braintree.gov.uk/news/article/893/braintree-district-council-introduces-pspo-to-tackle-antisocial-driving-in-the-district',
    checked: '2026-11-17',
  },
  {
    id: 'bz-colchester', name: 'Colchester Northern Gateway', centre: { lat: 51.918, lng: 0.905 }, radiusMiles: 1.5,
    kind: 'pspo',
    bans: 'Racing, speeding, revving, stunts, loud music or horns, organising or joining a car meet, and not leaving when told to (for up to 24 hours).',
    note: `${CHECK} Colchester vehicular-nuisance PSPO, from 30 Sep 2025 for three years (to about Sep 2028). Its restricted area is set by a map; the circle covers the main hotspot (Smeaton Close and the Leisure Park) and the order may reach further.`,
    source: 'https://new.colchester.gov.uk/vehicular-nuisance-public-space-protection-order',
    checked: '2026-11-17',
  },
  {
    id: 'bz-breckland', name: 'Breckland district', centre: { lat: 52.6, lng: 0.85 }, radiusMiles: 14,
    polygons: BRECKLAND,
    kind: 'pspo',
    bans: 'Inconsiderate or anti-social use of vehicles, including at car meets, anywhere in the district.',
    note: `${CHECK} District-wide vehicle-related anti-social behaviour PSPO, sealed 8 Apr 2025 for three years (to about Apr 2028).`,
    source: 'https://www.breckland.gov.uk/article/24325/Vehicle-related-anti-social-behaviour-PSPO',
    checked: '2026-11-17',
  },
  {
    id: 'bz-east-cambs', name: 'East Cambridgeshire', centre: { lat: 52.38, lng: 0.3 }, radiusMiles: 12,
    polygons: EAST_CAMBRIDGESHIRE,
    kind: 'pspo',
    bans: 'Street racing, stunts, car meets, vehicle noise and other anti-social driving anywhere in the district.',
    note: `${CHECK} District-wide vehicle-related anti-social behaviour PSPO, approved 23 Mar 2026 and enforced from 24 Aug 2026 (three years).`,
    source: 'https://eastcambs.gov.uk/press-releases/2026/new-powers-tackle-anti-social-driving-launched-east-cambs',
    checked: '2026-11-17',
  },
  {
    id: 'bz-peterborough-pfm', name: 'Pleasure Fair Meadow car park, Peterborough', centre: { lat: 52.5715, lng: -0.247 }, radiusMiles: 0.25,
    kind: 'pspo',
    bans: 'Unauthorised car meets and anti-social use of vehicles in the car park.',
    note: `${CHECK} Car-park PSPO from about Jul 2025 for three years, near the station off Bourges Boulevard. Dates from local news; the council page has moved.`,
    source: 'https://www.peterborough.gov.uk/engagement-hub/pspo-to-be-introduced-at-car-park',
    checked: '2026-11-17',
  },
  {
    id: 'bz-milton-keynes', name: 'Milton Keynes (whole city)', centre: { lat: 52.04, lng: -0.76 }, radiusMiles: 9,
    polygons: MILTON_KEYNES,
    kind: 'pspo',
    bans: 'Anti-social car cruising and street racing in public places, including excessive noise and dangerous speeds. £100 fixed penalty.',
    note: `${CHECK} Car cruise and street racing PSPO since 2020, extended in Jan 2026 for three years (to about Jan 2029) and widened to more anti-social vehicle use.`,
    source: 'https://www.milton-keynes.gov.uk/community-safety-safermk-partnership/public-space-protection-orders-pspo/car-cruising-pspo',
    checked: '2026-11-17',
  },
  {
    id: 'bz-gravesham', name: 'Gravesham (borough-wide)', centre: { lat: 51.4, lng: 0.38 }, radiusMiles: 6,
    polygons: GRAVESHAM,
    kind: 'pspo',
    bans: 'Revving and horns, repeated hard acceleration, racing, stunts (doughnuts, handbrake turns, drifting, burnouts, wheelies), loud music, obstruction including convoys, and off-road riding. £100 fixed penalty.',
    note: `${CHECK} Gravesham nuisance-vehicles PSPO 2026, the whole borough, 1 Jul 2026 for three years (to about Jun 2029).`,
    source: 'https://www.gravesham.gov.uk/downloads/file/1147/nuisance-vehicles-pspo',
    checked: '2026-11-17',
  },
  {
    id: 'bz-tonbridge-malling', name: 'Tonbridge and Malling (borough-wide)', centre: { lat: 51.27, lng: 0.38 }, radiusMiles: 8,
    polygons: TONBRIDGE_MALLING,
    kind: 'pspo',
    bans: 'Attending a meet of two or more vehicles as owner, driver, passenger or spectator and joining in car cruising: racing, stunts, revving, horns, loud music, danger or obstruction. £100 fixed penalty.',
    note: `${CHECK} Tonbridge and Malling PSPO 2026 (borough-wide measures), from 1 Apr 2026, normally for three years (to about Mar 2029). Hotspots have included Blue Bell Hill, Leybourne and Larkfield.`,
    source: 'https://www.tmbc.gov.uk/downloads/file/3074/public-space-protection-order-2026',
    checked: '2026-11-17',
  },
  {
    id: 'bz-waltham-forest', name: 'Waltham Forest (borough-wide)', centre: { lat: 51.59, lng: -0.01 }, radiusMiles: 4,
    polygons: WALTHAM_FOREST,
    kind: 'pspo',
    bans: 'Attending an unauthorised car meet as a driver, passenger or spectator, and anti-social driving such as racing, speeding and revving.',
    note: `${CHECK} Car-meets PSPO for the whole borough, in force since Oct 2024 (three years, so to about Oct 2027; expiry not confirmed on the council page). Hotspots: Hoe Street and Lea Bridge (Argall Way).`,
    source: 'https://www.walthamforest.gov.uk/neighbourhoods/crime-and-community-safety/public-space-protection-orders',
    checked: '2026-11-17',
  },
];

export const BAN_ZONES: BanZone[] = [...BASE_BAN_ZONES, ...NORTH_ENGLAND_BAN_ZONES, ...SOUTH_WEST_SOUTH_BAN_ZONES, ...MIDLANDS_WALES_BAN_ZONES, ...SCOTLAND_NI_BAN_ZONES];
