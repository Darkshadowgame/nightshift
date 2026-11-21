import { readFileSync } from 'fs';
import { join } from 'path';
import { avatarUploadPath, isVehiclePhoto, legacyAvatar, ownPath, planAvatar, samePhoto } from '../src/lib/avatar';
import { userFromRows } from '../src/lib/backend/mapping';

const ME = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';
const BUILD = '33333333-3333-4333-8333-333333333333';
const signed = (path: string, token = 'a') => `https://x.supabase.co/storage/v1/object/sign/photos/${path}?token=${token}`;
const own = `${ME}/builds/${BUILD}/one.jpg`;

describe('what to do with a chosen profile picture', () => {
  it('null goes back to the default', () => {
    expect(planAvatar(null, ME)).toEqual({ kind: 'clear' });
    expect(planAvatar('', ME)).toEqual({ kind: 'clear' });
  });
  it('a photo from the library (a file on the phone) is uploaded first', () => {
    expect(planAvatar('ph-abc123.jpg', ME)).toEqual({ kind: 'upload', ref: 'ph-abc123.jpg' });
    expect(planAvatar('data:image/jpeg;base64,AAAA', ME)).toEqual({ kind: 'upload', ref: 'data:image/jpeg;base64,AAAA' });
  });
  it('one of your own vehicle photos is saved by its Storage path', () => {
    expect(planAvatar(signed(own), ME)).toEqual({ kind: 'path', path: own });
  });
  it('someone else\'s photo and sample photos can\'t be kept on a profile', () => {
    expect(planAvatar(signed(`${OTHER}/builds/${BUILD}/one.jpg`), ME)).toEqual({ kind: 'refuse' });
    expect(planAvatar('sample:golf', ME)).toEqual({ kind: 'refuse' });
    expect(planAvatar('https://example.com/pic.jpg', ME)).toEqual({ kind: 'refuse' });
  });
  it('knows its own paths and its uploaded pictures', () => {
    expect(ownPath(signed(own), ME)).toBe(own);
    expect(ownPath(signed(own), OTHER)).toBeNull();
    expect(avatarUploadPath(`${ME}/avatar/a-b.jpg`, ME)).toBe(`${ME}/avatar/a-b.jpg`);
    expect(avatarUploadPath(own, ME)).toBeNull();
    expect(avatarUploadPath(`${OTHER}/avatar/a.jpg`, ME)).toBeNull();
    expect(avatarUploadPath(null, ME)).toBeNull();
  });
});

describe('the same photo', () => {
  it('matches by Storage path, whatever the signed link says', () => {
    expect(samePhoto(signed(own, 'a'), signed(own, 'b'))).toBe(true);
    expect(samePhoto(signed(own), signed(`${ME}/builds/${BUILD}/two.jpg`))).toBe(false);
    expect(samePhoto('ph-1.jpg', 'ph-1.jpg')).toBe(true);
    expect(samePhoto('ph-1.jpg', 'ph-2.jpg')).toBe(false);
    expect(samePhoto(null, 'ph-1.jpg')).toBe(false);
  });
  it('finds one of your vehicles\' photos', () => {
    expect(isVehiclePhoto(signed(own, 'new'), [{ photos: [signed(own, 'old')] }])).toBe(true);
    expect(isVehiclePhoto('ph-9.jpg', [{ photos: ['ph-1.jpg'] }])).toBe(false);
    expect(isVehiclePhoto(null, [{ photos: ['ph-1.jpg'] }])).toBe(false);
  });
});

describe('moving the old per-phone choice onto the profile', () => {
  const builds = [{ photos: [signed(own, 'old')] }];
  it('does nothing when there was no old choice', () => {
    expect(legacyAvatar(null, null, builds, ME, false)).toBe('none');
    expect(legacyAvatar(undefined, 'x', builds, ME, true)).toBe('none');
  });
  it('signed in: adopts a vehicle photo of yours when the profile has none', () => {
    expect(legacyAvatar(signed(own, 'other-token'), null, builds, ME, false)).toBe('adopt');
  });
  it('never overwrites a picture already on the profile', () => {
    expect(legacyAvatar(signed(own), `${ME}/avatar/a.jpg`, builds, ME, false)).toBe('drop');
  });
  it('forgets a choice that is no longer one of your vehicle photos', () => {
    expect(legacyAvatar('ph-gone.jpg', null, builds, ME, false)).toBe('drop');
    expect(legacyAvatar('ph-gone.jpg', null, builds, ME, true)).toBe('drop');
  });
  it('demo: keeps a vehicle photo or a sample photo on the demo person', () => {
    expect(legacyAvatar('ph-1.jpg', null, [{ photos: ['ph-1.jpg'] }], ME, true)).toBe('adopt');
    expect(legacyAvatar('sample:golf', null, [{ photos: ['sample:golf'] }], ME, true)).toBe('adopt');
  });
  it('signed in: a sample photo can\'t go on a profile, so it is forgotten', () => {
    expect(legacyAvatar('sample:golf', null, [{ photos: ['sample:golf'] }], ME, false)).toBe('drop');
  });
});

describe('profile rows', () => {
  it('carry the picture to the person, and leave it out when there is none', () => {
    const row = { id: ME, handle: 'dan', display_name: 'Dan', region: 'Midlands', onboarded: true };
    expect(userFromRows({ ...row, avatar_ref: own }, { avatar: signed(own) }).avatarRef).toBe(signed(own));
    expect('avatarRef' in userFromRows(row)).toBe(false);
    expect('avatarRef' in userFromRows({ ...row, avatar_ref: null })).toBe(false);
  });
});

describe('the migration', () => {
  const sql = readFileSync(join(__dirname, '../supabase/migrations/20261121150000_profile_avatar.sql'), 'utf8');
  it('only adds: nothing is replaced or dropped, so older apps carry on', () => {
    expect(sql).not.toMatch(/create or replace|drop function|drop policy|drop view|drop table|drop column|revoke (select|insert|update)/i);
    expect(sql).toMatch(/alter table public\.profiles add column avatar_ref text;/);
  });
  it('lets people set their own picture through one function, and nothing writes the column directly', () => {
    expect(sql).toMatch(/create function public\.set_avatar\(p_ref text\)/);
    expect(sql).toMatch(/where id = v_uid/);
    expect(sql).not.toMatch(/grant (insert|update)[^;]*profiles/i);
  });
});
