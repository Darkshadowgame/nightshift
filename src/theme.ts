/** Late-night city palette. The app is dark only, by design. */
export const C = {
  asphalt: '#0b0f17',
  tarmac: '#131a26',
  kerb: '#1d2636',
  kerbHi: '#2a3446',
  fog: '#8a97ad',
  chalk: '#e9edf4',
  sodium: '#ff9a2e',
  neon: '#3fd6ff',
  magenta: '#ff4fa3',
  lime: '#9dfa5a',
  alert: '#ff4d4d',
  ink: '#2a1300',
};

export const F = {
  display: 'ChakraPetch_700Bold',
  /** Real italic faces: iOS won't fake italics for custom fonts. Use these, not fontStyle. */
  displayItalic: 'ChakraPetch_700Bold_Italic',
  displayMedItalic: 'ChakraPetch_600SemiBold_Italic',
  displayMed: 'ChakraPetch_600SemiBold',
  body: 'Barlow_400Regular',
  bodyMed: 'Barlow_500Medium',
  bodyBold: 'Barlow_600SemiBold',
  label: 'BarlowCondensed_600SemiBold',
  labelBold: 'BarlowCondensed_700Bold',
};

export const EVENT_COLOURS = {
  cruise: C.sodium,
  rolling: C.sodium,
  meet: C.sodium,
  show: C.magenta,
  trackday: C.lime,
} as const;

export const SPOT_COLOURS = {
  photo: C.magenta,
  drive: C.neon,
  track: C.lime,
  venue: C.sodium,
} as const;
