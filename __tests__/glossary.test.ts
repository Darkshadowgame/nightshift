import { confirmLabels, leadText, LOCATION, menuPath, openPlaceLabel, PLACE_NAMES, roleLabel, roleTone, title } from '../src/lib/glossary';
import type { Role } from '../src/lib/eventView';

describe('glossary', () => {
  it('has one label per role', () => {
    const roles: Role[] = ['host', 'going', 'requested', 'invited', 'public', 'declined', 'none'];
    expect(roles.map((r) => roleLabel(r))).toEqual(['Hosting', 'Going', 'Requested', 'You can go', 'Public', 'Declined', '']);
  });
  it('says "You can go" only on a limited invite', () => {
    expect(roleLabel('invited', { everyone: false })).toBe('You can go');
    expect(roleLabel('invited', { everyone: true })).toBe('');
  });
  it('never gives hosting a layer colour tone', () => {
    expect(roleTone('host')).toBe('brand');
    expect(roleTone('going')).toBe('success');
    expect(roleTone('requested')).toBe('warning');
    expect(roleTone('declined')).toBe('danger');
  });
  it('calls venues meet spots', () => {
    expect(PLACE_NAMES.venue.one).toBe('Meet spot');
    expect(openPlaceLabel('venue')).toBe('Open meet spot ›');
    expect(openPlaceLabel('drive')).toBe('Open drive ›');
  });
  it('writes menu paths with ›', () => {
    expect(menuPath('Me', 'Settings', 'Demo')).toBe('Me › Settings › Demo');
  });
  it('makes header titles capitals and confirm labels "{Verb} it / Keep it"', () => {
    expect(title('Add a car or bike')).toBe('ADD A CAR OR BIKE');
    expect(confirmLabels('Delete')).toEqual({ confirm: 'Delete it', cancel: 'Keep it' });
  });
  it('says when the location shows in plain words, never "unlocks" or "stop"', () => {
    expect(leadText(60)).toBe('1 h');
    expect(leadText(90)).toBe('1 h 30 min');
    expect(leadText(30)).toBe('30 min');
    expect(LOCATION.lead(60)).toBe('Location shows 1 h before');
    expect(LOCATION.lead(0)).toBe('Location shows at the start');
    expect(LOCATION.showsAt('21:30')).toBe('Location shows at 21:30');
    const words = [LOCATION.hidden, LOCATION.toGoing, LOCATION.setting, LOCATION.showsIn('1h')].join(' ');
    expect(words).not.toMatch(/unlock|\bstop\b/i);
  });
});
