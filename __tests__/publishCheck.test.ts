import type { BanZone } from '../src/lib/types';
import { injunctionConfirmText, publishCheck, zoneShortName } from '../src/lib/zones';
import { BAN_ZONES } from '../src/data/seed';

/** Review 8: warn only, but a meet point in a court injunction needs "Publish anyway". */
const injunction: BanZone = { id: 'z-inj', name: 'Testtown (whole city)', centre: { lat: 52, lng: -1 }, radiusMiles: 5, kind: 'injunction', note: 'Sample.' };
const pspo: BanZone = { id: 'z-pspo', name: 'Retail park', centre: { lat: 52, lng: -1 }, radiusMiles: 0.5, kind: 'pspo', note: 'Sample PSPO.' };
const pspo2: BanZone = { id: 'z-pspo2', name: 'Seafront', centre: { lat: 53, lng: -1 }, radiusMiles: 1, kind: 'pspo', note: 'Sample PSPO.' };
const dispersal: BanZone = { id: 'z-disp', name: 'Industrial estate', centre: { lat: 54, lng: -1 }, radiusMiles: 1, kind: 'dispersal', note: 'Sample.' };
const zones = [injunction, pspo, pspo2, dispersal];

describe('publishCheck', () => {
  it('asks nothing outside every zone, or for an unplaced point', () => {
    expect(publishCheck([{ name: 'Far away', at: { lat: 50, lng: -4 } }, { name: 'Not placed' }], zones)).toEqual({ injunction: null, pspos: [] });
  });

  it('a point in a court injunction needs the confirm, naming the meet point', () => {
    const r = publishCheck([{ name: 'Car park', at: { lat: 52.03, lng: -1.03 } }], zones);
    expect(r.injunction).toEqual({ zone: injunction, stop: 'Car park' });
    expect(r.pspos).toEqual([]);
  });

  it('a PSPO inside the injunction counts both: the injunction is never hidden by the smaller zone', () => {
    const r = publishCheck([{ name: 'Retail park', at: { lat: 52, lng: -1 } }], zones);
    expect(r.injunction?.zone.id).toBe('z-inj');
    expect(r.pspos.map((z) => z.id)).toEqual(['z-pspo']);
  });

  it('any meet point counts, not only the first; each PSPO once', () => {
    const r = publishCheck(
      [
        { name: 'Start', at: { lat: 50, lng: -4 } },
        { name: 'Regroup', at: { lat: 53, lng: -1 } },
        { name: 'Finish', at: { lat: 53.001, lng: -1 } },
      ],
      zones,
    );
    expect(r.injunction).toBeNull();
    expect(r.pspos.map((z) => z.id)).toEqual(['z-pspo2']);
  });

  it('dispersal orders only warn inline', () => {
    expect(publishCheck([{ name: 'Estate', at: { lat: 54, lng: -1 } }], zones)).toEqual({ injunction: null, pspos: [] });
  });

  it('Birmingham city centre (the bundled zone) is a court injunction', () => {
    const r = publishCheck([{ name: 'Car park', at: { lat: 52.48, lng: -1.89 } }], BAN_ZONES);
    expect(r.injunction?.zone.id).toBe('bz-mw-birmingham');
  });
});

describe('zone names in sentences', () => {
  it('drops the trailing bracket, so there are never double brackets', () => {
    expect(zoneShortName({ name: 'Birmingham (whole city)' })).toBe('Birmingham');
    expect(zoneShortName({ name: 'Black Country (Wolverhampton, Sandwell, Walsall)' })).toBe('Black Country');
    expect(zoneShortName({ name: 'Felixstowe seafront' })).toBe('Felixstowe seafront');
  });

  it('the confirm reads as the owner wrote it', () => {
    expect(injunctionConfirmText({ name: 'Birmingham (whole city)' })).toBe(
      "This spot is inside Birmingham's court injunction. Organising or attending a meet here can be contempt of court. Publish anyway?",
    );
    expect(injunctionConfirmText({ name: 'Enfield' }, 'Save')).toMatch(/Save anyway\?$/);
  });
});

describe('sentToast (after hosting)', () => {
  it('says how many were invited, in the right number', () => {
    const { sentToast } = jest.requireActual('../src/lib/format') as typeof import('../src/lib/format');
    expect(sentToast('1', false)).toBe('Invited 1 person whose car fits');
    expect(sentToast('12', false)).toBe('Invited 12 people whose car fits');
    expect(sentToast('fewer than 3', false)).toBe('Invited fewer than 3 people whose car fits');
    expect(sentToast('…', false)).toBe('Invites sent');
    expect(sentToast('40', true)).toBe('Published');
  });
});
