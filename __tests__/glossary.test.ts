import { confirmLabels, menuPath, openPlaceLabel, PLACE_NAMES, roleLabel, roleTone, title } from '../src/lib/glossary';
import type { Role } from '../src/lib/eventView';

describe('glossary', () => {
  it('has one label per role', () => {
    const roles: Role[] = ['host', 'going', 'requested', 'invited', 'public', 'declined', 'none'];
    expect(roles.map(roleLabel)).toEqual(['Hosting', 'Going', 'Requested', 'Invited', 'Public', 'Declined', '']);
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
});
