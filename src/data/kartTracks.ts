import type { PlaceSeed } from './places';

/**
 * UK outdoor kart circuits (owner request, 17 Nov 2026). Each was checked on the
 * venue's own website for being open in 2025/26; positions are the kart track
 * (or the venue site) in OpenStreetMap (© OpenStreetMap contributors, ODbL).
 * Lengths, arrive-and-drive and lap records are in trackInfo.ts, only where the
 * venue publishes them.
 *
 * Buckmore Park, Ellough Park and Three Sisters were already bundled (places.ts).
 * Left out: Warden Law and Hooton Park (no sign of 2025/26 activity on an
 * official site), Wombwell (unverified). Trent Valley Kart Club races at PF
 * International.
 */

export const KART_PLACES: PlaceSeed[] = [
  {
    id: 'kt-pf-international', kind: 'track', trackType: 'kart', name: 'PF International Kart Circuit', region: 'Lincolnshire',
    description: 'International-standard kart circuit near Grantham that has hosted British, European and world championships. Hire karts, owner-driver testing and Trent Valley Kart Club meetings.',
    at: { lat: 53.0382, lng: -0.6605 },
    sources: ['https://kartpfi.com/', 'OpenStreetMap (ODbL)'],
  },
  {
    id: 'kt-whilton-mill', kind: 'track', trackType: 'kart', name: 'Whilton Mill Kart Circuit', region: 'Northamptonshire',
    description: 'Kart circuit by the Grand Union Canal near Daventry, with International and National layouts for arrive-and-drive and owner practice.',
    at: { lat: 52.2771, lng: -1.0887 },
    sources: ['https://www.whiltonmill.co.uk/', 'OpenStreetMap (ODbL)'],
  },
  {
    id: 'kt-shenington', kind: 'track', trackType: 'kart', name: 'Shenington Kart Circuit', region: 'Oxfordshire',
    description: 'Owner-driver kart racing club on a former airfield near Banbury, running Motorsport UK championship meetings.',
    warnings: ['Club circuit: no hire karts. Practice and race days on the club calendar.'],
    at: { lat: 52.0818, lng: -1.4753 },
    sources: ['https://sheningtonkrc.co.uk/', 'OpenStreetMap (ODbL)'],
  },
  {
    id: 'kt-rowrah', kind: 'track', trackType: 'kart', name: 'Rowrah Kart Circuit (Lakeland)', region: 'Cumbria',
    description: 'Technical club kart circuit in west Cumbria run by Cumbria Kart Racing Club, with race meetings and pre-booked arrive-and-drive evenings.',
    at: { lat: 54.5521, lng: -3.4428 },
    sources: ['https://www.cumbriakrc.co.uk/', 'OpenStreetMap (ODbL)'],
  },
  {
    id: 'kt-larkhall', kind: 'track', trackType: 'kart', name: 'Larkhall Kart Circuit', region: 'South Lanarkshire',
    description: 'Outdoor kart circuit near the M74, home of the West of Scotland Kart Club, with hire karting and owner practice days.',
    at: { lat: 55.7523, lng: -3.9781 },
    sources: ['https://larkhallcircuit.com/', 'OpenStreetMap (ODbL)'],
  },
  {
    id: 'kt-fulbeck', kind: 'track', trackType: 'kart', name: 'Fulbeck Kart Circuit', region: 'Lincolnshire',
    description: 'Club kart circuit on the runways of the former RAF Fulbeck, running club championship and sprint series rounds, with open test days.',
    at: { lat: 53.0451, lng: -0.6568 },
    sources: ['https://www.fulbeckkartclub.co.uk/', 'OpenStreetMap (ODbL)'],
  },
  {
    id: 'kt-clay-pigeon', kind: 'track', trackType: 'kart', name: 'Clay Pigeon Raceway', region: 'Dorset',
    description: 'Kart circuit on the A37 between Dorchester and Yeovil with weekday hire karts, owner practice and club race meetings.',
    warnings: ['Hire karts Monday to Thursday, booked ahead, 14+.'],
    at: { lat: 50.824, lng: -2.5545 },
    sources: ['https://www.claypigeonraceway.com/', 'OpenStreetMap (ODbL)'],
  },
  {
    id: 'kt-glan-y-gors', kind: 'track', trackType: 'kart', name: 'Glan y Gors Kart Circuit', region: 'Conwy',
    description: 'Kart circuit in the hills at Cerrigydrudion, with arrive-and-drive, endurance events and owner-driver test days.',
    at: { lat: 53.0353, lng: -3.5834 },
    sources: ['https://gygkarting.com/', 'OpenStreetMap (ODbL)'],
  },
  {
    id: 'kt-llandow', kind: 'track', trackType: 'kart', name: 'Llandow Kart Circuit', region: 'Vale of Glamorgan',
    description: 'Separate kart track beside the Llandow car circuit, open to owner drivers and for event hire.',
    warnings: ['No hire karts at present (the venue says so on its karting page).'],
    at: { lat: 51.4342, lng: -3.4974 },
    sources: ['https://www.llandow.com/karting/', 'OpenStreetMap (ODbL)'],
  },
  {
    id: 'kt-rissington', kind: 'track', trackType: 'kart', name: 'Rissington Kart Circuit', region: 'Gloucestershire',
    description: 'Club kart circuit on the former RAF Little Rissington airfield, with a club race season from spring to autumn.',
    at: { lat: 51.8659, lng: -1.6842 },
    sources: ['https://rissingtonkartclub.co.uk/', 'OpenStreetMap (ODbL)'],
  },
  {
    id: 'kt-forest-edge', kind: 'track', trackType: 'kart', name: 'Forest Edge Kart Circuit', region: 'Hampshire',
    description: 'Owner-driver kart club at Barton Stacey near Winchester, off the A303, running practice days and the Southern Championships.',
    warnings: ['Owner drivers: sign on at the club on practice days.'],
    at: { lat: 51.1803, lng: -1.362 },
    sources: ['https://fekc.co.uk/', 'OpenStreetMap (ODbL)'],
  },
  {
    id: 'kt-kimbolton', kind: 'track', trackType: 'kart', name: 'Kimbolton Kart Circuit', region: 'Cambridgeshire',
    description: 'Club kart circuit near Kimbolton run by Hunts Kart Racing Club for Motorsport UK race meetings.',
    warnings: ['Club circuit: no hire karts. Practice the Saturday before race day, with a Motorsport UK licence.'],
    at: { lat: 52.3159, lng: -0.3695 },
    sources: ['https://hkrc.co.uk/', 'OpenStreetMap (ODbL)'],
  },
  {
    id: 'kt-lydd', kind: 'track', trackType: 'kart', name: 'Lydd Kart Circuit', region: 'Kent',
    description: 'Kart circuit on Romney Marsh with year-round hire karts (phone booking), a family circuit and owner-driver practice days.',
    at: { lat: 50.9352, lng: 0.9071 },
    sources: ['https://lyddkartcircuit.com/', 'OpenStreetMap (ODbL)'],
  },
  {
    id: 'kt-bayford-meadows', kind: 'track', trackType: 'kart', name: 'Bayford Meadows Kart Circuit', region: 'Kent',
    description: 'Motorsport UK-licensed kart circuit in Sittingbourne, with hire karting and owner-driver practice on Wednesdays, Fridays and Sundays.',
    at: { lat: 51.348, lng: 0.7453 },
    sources: ['https://bayfordmeadows.co.uk/', 'OpenStreetMap (ODbL)'],
  },
];
