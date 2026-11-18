import { parseDynoText, toBhp, toLbFt } from '../src/lib/dynoParse';

/** Text as on-device OCR gives it from real sheet layouts (made-up runs, no real cars or shops). */
const DYNOJET = `DYNOJET RESEARCH  WinPEP 8
Run File: run003.drf
Smoothing: 5   SAE J1349 correction
Power (hp)            Torque (lb-ft)
Run 1: Max Power = 281.2 at 6200 rpm  Max Torque = 296.0 at 3900 rpm
Run 3: Max Power = 287.4 at 6250 rpm  Max Torque = 301.2 at 4000 rpm
Power measured at the wheels`;

const MAHA = `MAHA LPS 3000
Leistungsmessung / Power measurement
P-Norm    245.6 kW    334.0 PS   at 6120 1/min
P-Mot     238.1 kW
P-Rad     201.3 kW
P-Schlepp  44.3 kW
M-Norm    452.1 Nm    at 3450 1/min
Correction DIN 70020`;

const DASTEK = `DASTEK UNICHIP DYNO RESULTS
Customer vehicle: Hot hatch
Max Power 168.4 kW @ 5980 rpm
Max Torque 368.2 Nm @ 3100 rpm
Wheel power. Ambient 21 C`;

const MUSTANG = `MUSTANG DYNAMOMETER MD-AWD-500
Run #1   Peak HP 398.2 whp   Peak Torque 389.0 ft-lbs
Run #2   Peak HP 412.6 whp   Peak Torque 398.4 ft-lbs
RPM     HP      TQ
3000    180.2   315.4
4000    260.7   342.3
5000    330.9   347.6`;

const TABLE = `Engine Speed (rpm)   Power (bhp)   Torque (lb-ft)
RPM   Power   Torque
2500   120.4   252.9
3500   190.2   285.4
4500   238.8   278.7
5500   262.1   250.3
6500   255.0   206.0`;

describe('dyno sheet text (REVIEW-9 dyno section)', () => {
  test('Dynojet: labels without units take the header units; the highest run; at the wheels', () => {
    const r = parseDynoText(DYNOJET);
    expect(r.power).toEqual({ value: 287.4, unit: 'hp' });
    expect(r.torqueLbFt).toBe(301.2);
    expect(r.at).toBe('wheels');
    expect(r.confidence).toBeGreaterThan(0.6);
  });

  test('MAHA: the engine (crank) figure in kW, torque in Nm, converted', () => {
    const r = parseDynoText(MAHA);
    expect(r.at).toBe('crank');
    expect(r.power?.unit).toBe('kW');
    expect(r.power?.value).toBe(245.6);
    expect(r.powerBhp).toBeCloseTo(329.4, 0);
    expect(r.torque).toEqual({ value: 452.1, unit: 'Nm' });
    expect(r.torqueLbFt).toBeCloseTo(333.4, 0);
  });

  test('Dastek: kW and Nm at the wheels', () => {
    const r = parseDynoText(DASTEK);
    expect(r.powerBhp).toBeCloseTo(225.8, 0);
    expect(r.torqueLbFt).toBeCloseTo(271.6, 0);
    expect(r.at).toBe('wheels');
  });

  test('Mustang: several runs and a table: the highest peak, whp and ft-lbs', () => {
    const r = parseDynoText(MUSTANG);
    expect(r.power).toEqual({ value: 412.6, unit: 'whp' });
    expect(r.torque).toEqual({ value: 398.4, unit: 'lb-ft' });
    expect(r.at).toBe('wheels');
  });

  test('an rpm table: the highest in each column', () => {
    const r = parseDynoText(TABLE);
    expect(r.powerBhp).toBe(262.1);
    expect(r.torqueLbFt).toBe(285.4);
  });

  test('a labelled final run wins over a higher earlier one', () => {
    const r = parseDynoText('Run 1  Peak power 305 bhp  Peak torque 290 lb-ft\nFinal run  Peak power 298 bhp  Peak torque 301 lb-ft\nFlywheel figures');
    expect(r.powerBhp).toBe(298);
    expect(r.torqueLbFt).toBe(301);
    expect(r.at).toBe('crank');
  });

  test('plain "Power: 312 bhp" and PS', () => {
    expect(parseDynoText('Power: 312 bhp\nTorque: 295 lb-ft').powerBhp).toBe(312);
    expect(parseDynoText('Max Power 340 PS').powerBhp).toBeCloseTo(335.3, 0);
  });

  test('nothing readable: confidence 0, no numbers, never throws', () => {
    expect(parseDynoText(null)).toEqual({ confidence: 0 });
    expect(parseDynoText('')).toEqual({ confidence: 0 });
    const r = parseDynoText('Thanks for visiting. Tel 01234 567890. Ambient 21 C, 1013 mbar');
    expect(r.powerBhp).toBeUndefined();
    expect(r.confidence).toBeLessThan(0.3);
  });

  test('conversions', () => {
    expect(toBhp(100, 'kW')).toBeCloseTo(134.1, 1);
    expect(toBhp(100, 'PS')).toBeCloseTo(98.6, 1);
    expect(toBhp(100, 'whp')).toBe(100);
    expect(toLbFt(100, 'Nm')).toBeCloseTo(73.8, 1);
  });
});
