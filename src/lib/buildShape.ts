import type { Build } from './types';

/** Which silhouette a car's placeholder art uses (REVIEW-7 inconsistency 8: a hatch isn't a saloon). */
export type CarShape = 'hatch' | 'coupe' | 'saloon';

/** Hot hatches and small cars people bring to meets. Matched on the model, as typed or from the picker. */
const HATCH = /\b(civic|golf|polo|fiesta|focus|i20|i30|yaris|corolla|clio|megane|m[eé]gane|208|308|corsa|astra|leon|ibiza|fabia|swift|mini|cooper|a1|a3|s3|rs ?3|1 series|m135|m140|a ?class|a35|a45|ceed|veloster|up!?|jazz|micra|note|juke|mazda ?2|mazda ?3|ds ?3|500|abarth|punto|type r)\b/i;
/** Two-door sports cars and roadsters. */
const COUPE = /\b(gt86|gr86|brz|supra|350z|370z|z4|mx-?5|miata|s2000|rx-?7|rx-?8|mustang|camaro|911|cayman|boxster|tt|rcz|m2|m4|m6|gt-?r|r3[2-5]|silvia|200sx|s1[345]|celica|integra|prelude|nsx|elise|exige|evora|f-type|570s|huracan|r8|corvette|86)\b/i;

export function carShape(build: Pick<Build, 'kind' | 'make' | 'model'>): CarShape {
  if (build.kind !== 'car') return 'saloon';
  const text = `${build.make} ${build.model}`;
  if (HATCH.test(text)) return 'hatch';
  if (COUPE.test(text)) return 'coupe';
  return 'saloon';
}
