import type { DemoPartnerSeed, Partner } from '../lib/partners';

/**
 * Partners on the Shops layer (see src/lib/partners.ts).
 *
 * PARTNERS is the production list. It stays empty until real partners sign up
 * and the app reads them from the backend's `partner_venues` table.
 *
 * DEMO_PARTNERS are made-up businesses for the demo only, placed near your
 * home area and labelled "Sample partner" everywhere they appear. They are not
 * real businesses and their offers aren't real.
 */
export const PARTNERS: Partner[] = [];

export const DEMO_PARTNERS: DemoPartnerSeed[] = [
  {
    id: 'demo-partner-detailing',
    name: 'Sample Detailing Studio',
    label: 'Sample partner',
    categories: ['detailing'],
    description: 'A made-up detailer to show how partners look on the map. Not a real business.',
    offer: 'Sample offer: 10% off a snow-foam wash and wax for Nightshift members.',
    link: 'https://example.com/',
    hours: 'Mo-Fr 08:00-18:00; Sa 09:00-16:00; Su off',
    miles: 1.6,
    bearing: 50,
  },
  {
    id: 'demo-partner-rolling-road',
    name: 'Sample Rolling Road',
    label: 'Sample partner',
    categories: ['dyno', 'tuning'],
    description: 'A made-up tuner with a rolling road, to show how partners look on the map. Not a real business.',
    offer: 'Sample offer: £20 off your first power run when you show your Nightshift garage.',
    link: 'https://example.com/',
    hours: 'Mo-Fr 09:00-17:30; Sa 09:00-13:00',
    miles: 3.2,
    bearing: 215,
  },
];
