import type { BanZone } from '../lib/types';
import { BROADLAND, SANDWELL, SOUTH_NORFOLK, WALSALL, WOLVERHAMPTON } from './zoneBoundaries';
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
    note: `${CHECK} Borough-wide car-cruising injunction (since Dec 2024, extended), power of arrest. Named hotspots: the A10, Enfield Retail Park and Southbury Leisure Centre.`,
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
    note: `${CHECK} District-wide vehicle PSPOs round Norwich, including Longwater Retail Park. Norfolk Police run Operation Octane against car-meet anti-social behaviour.`,
    source: 'https://www.southnorfolkandbroadland.gov.uk/news/9-reduction-in-vehicle-related-anti-social-behaviour-1',
  },
  {
    id: 'bz-cromer', name: 'Cromer', centre: { lat: 52.931, lng: 1.301 }, radiusMiles: 1.5,
    note: `${CHECK} North Norfolk vehicle anti-social behaviour PSPO, in force from 20 Aug 2024 for three years.`,
    source: 'https://modgov.north-norfolk.gov.uk/documents/s20322/Prohibition%20of%20inconsiderate%20and%20inappropriate%20vehicle%20use%20related%20to%20Antisocial%20Behaviour_.pdf',
  },
  {
    id: 'bz-halstead', name: 'Halstead and Polhill', centre: { lat: 51.333, lng: 0.135 }, radiusMiles: 1.5,
    note: `${CHECK} Sevenoaks District Council nuisance-vehicle PSPO after car meets and racing, with Kent Police, the Met and Bromley.`,
    source: 'https://www.kentonline.co.uk/sevenoaks/news/boy-racers-face-fines-over-noisy-car-cruising-events-304087/',
  },
  {
    id: 'bz-medway', name: 'Medway', centre: { lat: 51.38, lng: 0.53 }, radiusMiles: 4,
    note: `${CHECK} Kent Police have used 48-hour dispersal orders against planned car meets here. Not a standing order, but expect them.`,
    source: 'https://www.kentonline.co.uk/medway/news/police-take-action-to-stop-boy-racers-267107/',
  },
  {
    id: 'bz-dartford', name: 'Dartford', centre: { lat: 51.445, lng: 0.215 }, radiusMiles: 2,
    note: `${CHECK} Kent Police have used dispersal orders against car meets here. Not a standing order, but expect them.`,
    source: 'https://www.kentonline.co.uk/dartford/news/this-is-good-progress-but-it-needs-to-happen-every-week-243773/',
  },
  {
    id: 'bz-sheerness', name: 'Sheerness', centre: { lat: 51.44, lng: 0.76 }, radiusMiles: 1.5,
    note: `${CHECK} Kent Police have used 48-hour dispersal orders against planned race meets here. Not a standing order, but expect them.`,
    source: 'https://www.kentonline.co.uk/sheerness/news/dispersal-order-to-stop-planned-race-meet-300812/',
  },
];

export const BAN_ZONES: BanZone[] = [...BASE_BAN_ZONES, ...NORTH_ENGLAND_BAN_ZONES, ...SOUTH_WEST_SOUTH_BAN_ZONES, ...MIDLANDS_WALES_BAN_ZONES, ...SCOTLAND_NI_BAN_ZONES];
