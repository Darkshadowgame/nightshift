import { spokenAfter, spokenInstruction, spokenRoads } from '../src/lib/speech';

describe('spoken instructions', () => {
  test('roundabouts the UK way, with the road last', () => {
    expect(spokenInstruction('At the roundabout, take the 2nd exit onto A5')).toBe('Take the second exit at the roundabout, onto the A5');
    expect(spokenInstruction('At the roundabout, take the first exit')).toBe('Take the first exit at the roundabout');
  });
  test('"the" before road numbers, and no robotic long numbers', () => {
    expect(spokenInstruction('Turn left onto A5')).toBe('Turn left onto the A5');
    expect(spokenInstruction('Keep right toward M6')).toBe('Keep right towards the M6');
    expect(spokenRoads('Turn right onto A4091')).toBe('Turn right onto the A 4 oh 9 1');
    expect(spokenRoads('Join A38(M)')).toBe('Join the A38');
    expect(spokenInstruction('Turn right onto the A5')).toBe('Turn right onto the A5');
  });
  test('names are left alone, abbreviations said in full', () => {
    expect(spokenInstruction('Turn right onto Mill Lane.')).toBe('Turn right onto Mill Lane');
    expect(spokenInstruction('Turn left onto Station Rd')).toBe('Turn left onto Station Road');
  });
  test('after "In 1 mile," the first word goes lower case, names stay', () => {
    expect(spokenAfter('Turn left onto Long Road')).toBe('turn left onto Long Road');
    expect(spokenAfter('At the roundabout, take the 3rd exit')).toBe('take the third exit at the roundabout');
    expect(spokenAfter('Mill Lane')).toBe('Mill Lane');
  });
});
