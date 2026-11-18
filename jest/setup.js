// jest-expo's ImageLoader mock calls getSize(uri, success) with callbacks, but React Native now
// calls the native getSize(uri) and waits on a promise, so the mock throws. FitImage reads photo
// sizes with Image.getSize: give tests the promise form (every photo 320 x 240).
const { Image } = require('react-native');

jest.spyOn(Image, 'getSize').mockImplementation((uri, success) => {
  const size = Promise.resolve({ width: 320, height: 240 });
  if (typeof success === 'function') size.then(({ width, height }) => success(width, height));
  return size;
});
