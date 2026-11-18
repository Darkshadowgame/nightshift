import { splitAlpha } from '../src/components/ds/Gradient';

describe('Gradient stops on iOS', () => {
  it('splits rgba into colour and opacity (react-native-svg ignores rgba alpha in stopColor)', () => {
    expect(splitAlpha('rgba(11,15,23,0)')).toEqual({ colour: 'rgb(11,15,23)', opacity: 0 });
    expect(splitAlpha('rgba(11, 15, 23, 0.9)')).toEqual({ colour: 'rgb(11,15,23)', opacity: 0.9 });
    expect(splitAlpha('#0B0F17')).toEqual({ colour: '#0B0F17', opacity: 1 });
  });
});
