/**
 * A small bundled glossary of common generic OBD-II fault codes, so typing "P0420" in the forum
 * search says what the code usually means and finds threads that mention it. Generic codes only
 * (the same on every make); a make's own codes (P1xxx, B, C, U) are still searched as plain text.
 * Wording is plain UK English and says "usually": a code points at a system, not a part.
 */
export interface FaultCode {
  code: string;
  meaning: string;
}

export const FAULT_CODES: readonly FaultCode[] = [
  { code: 'P0016', meaning: 'Crankshaft and camshaft positions do not agree (timing)' },
  { code: 'P0087', meaning: 'Fuel rail pressure too low' },
  { code: 'P0100', meaning: 'Air mass (MAF) sensor circuit' },
  { code: 'P0101', meaning: 'Air mass (MAF) sensor reading out of range' },
  { code: 'P0106', meaning: 'Manifold pressure (MAP) sensor reading out of range' },
  { code: 'P0113', meaning: 'Intake air temperature sensor reading too high' },
  { code: 'P0115', meaning: 'Coolant temperature sensor circuit' },
  { code: 'P0128', meaning: 'Coolant not reaching temperature (thermostat)' },
  { code: 'P0130', meaning: 'Oxygen (lambda) sensor, bank 1 sensor 1, circuit' },
  { code: 'P0171', meaning: 'Fuel mixture too lean, bank 1' },
  { code: 'P0172', meaning: 'Fuel mixture too rich, bank 1' },
  { code: 'P0174', meaning: 'Fuel mixture too lean, bank 2' },
  { code: 'P0190', meaning: 'Fuel rail pressure sensor circuit' },
  { code: 'P0201', meaning: 'Injector circuit, cylinder 1' },
  { code: 'P0299', meaning: 'Turbo or supercharger underboost' },
  { code: 'P0300', meaning: 'Random or multiple cylinder misfire' },
  { code: 'P0301', meaning: 'Misfire, cylinder 1' },
  { code: 'P0302', meaning: 'Misfire, cylinder 2' },
  { code: 'P0303', meaning: 'Misfire, cylinder 3' },
  { code: 'P0304', meaning: 'Misfire, cylinder 4' },
  { code: 'P0325', meaning: 'Knock sensor circuit' },
  { code: 'P0335', meaning: 'Crankshaft position sensor circuit' },
  { code: 'P0340', meaning: 'Camshaft position sensor circuit' },
  { code: 'P0400', meaning: 'Exhaust gas recirculation (EGR) flow' },
  { code: 'P0401', meaning: 'Exhaust gas recirculation (EGR) flow too low' },
  { code: 'P0420', meaning: 'Catalyst (cat) efficiency below limit, bank 1' },
  { code: 'P0430', meaning: 'Catalyst (cat) efficiency below limit, bank 2' },
  { code: 'P0440', meaning: 'Evaporative (fuel vapour) emissions system' },
  { code: 'P0442', meaning: 'Small leak in the fuel vapour system (often the fuel cap)' },
  { code: 'P0455', meaning: 'Large leak in the fuel vapour system' },
  { code: 'P0500', meaning: 'Vehicle speed sensor' },
  { code: 'P0505', meaning: 'Idle speed control' },
  { code: 'P0562', meaning: 'System voltage low (battery or charging)' },
  { code: 'P0606', meaning: 'Engine control unit (ECU) fault' },
  { code: 'P0700', meaning: 'Gearbox control system fault' },
  { code: 'P0730', meaning: 'Incorrect gear ratio' },
  { code: 'P2002', meaning: 'Diesel particulate filter (DPF) efficiency below limit' },
  { code: 'P2015', meaning: 'Intake manifold flap position' },
  { code: 'P2096', meaning: 'Post-catalyst fuel mixture too lean' },
  { code: 'P2452', meaning: 'Diesel particulate filter (DPF) pressure sensor circuit' },
  { code: 'C0035', meaning: 'Wheel speed sensor circuit (ABS)' },
  { code: 'B0001', meaning: 'Driver airbag circuit' },
  { code: 'U0100', meaning: 'Lost communication with the engine control unit' },
];

/** P, B, C or U, then a digit 0 to 3, then three hex digits: "P0420", "p0420". */
const CODE = /^[PBCU][0-3][0-9A-F]{3}$/i;

/** A fault code typed on its own ("p0420", "P 0420"), upper-cased and tidied; null when it isn't one. */
export function parseFaultCode(query: string): string | null {
  const q = query.trim().replace(/\s+/g, '').toUpperCase();
  return CODE.test(q) ? q : null;
}

/** What a generic code usually means, from the bundled glossary; null for one it doesn't hold. */
export function faultMeaning(code: string): string | null {
  return FAULT_CODES.find((f) => f.code === code.toUpperCase())?.meaning ?? null;
}

/** Dashboard warnings people type as words, which are matched as plain text in thread titles and bodies. */
export const WARNING_WORDS: readonly string[] = ['engine light', 'check engine', 'dpf', 'epc', 'abs', 'airbag', 'limp mode', 'glow plug', 'tpms', 'gearbox warning', 'oil pressure', 'battery light'];
