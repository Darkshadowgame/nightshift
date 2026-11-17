import { isStoredName, nameFromPath, newPhotoName } from '../src/lib/photoRefs';

describe('photo references', () => {
  test('stored names are bare file names', () => {
    expect(isStoredName('ph-abc.jpg')).toBe(true);
    expect(isStoredName('file:///var/mobile/x.jpg')).toBe(false);
    expect(isStoredName('blob:http://localhost/123')).toBe(false);
  });

  test('a full path into any container’s photos folder becomes its name', () => {
    expect(nameFromPath('file:///var/mobile/Containers/Data/Application/AAAA/Documents/photos/ph-1.jpg')).toBe('ph-1.jpg');
    expect(nameFromPath('ph-1.jpg')).toBe('ph-1.jpg');
    expect(nameFromPath('file:///var/mobile/Containers/Data/Application/AAAA/tmp/redacted/x.jpg')).toBeNull();
  });

  test('new names are unique-looking jpgs', () => {
    expect(newPhotoName(() => 0.5, 1000)).toMatch(/^ph-[a-z0-9]+\.jpg$/);
    expect(newPhotoName(() => 0.1, 1000)).not.toBe(newPhotoName(() => 0.2, 1000));
  });
});
