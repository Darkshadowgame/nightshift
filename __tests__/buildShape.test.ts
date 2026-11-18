import { carShape } from '../src/lib/buildShape';

const car = (make: string, model: string) => ({ kind: 'car' as const, make, model });

describe('placeholder art shape (REVIEW-7 inconsistency 8)', () => {
  test('hot hatches are hatches, not saloons', () => {
    expect(carShape(car('Honda', 'Civic Type R FK8'))).toBe('hatch');
    expect(carShape(car('Toyota', 'GR Yaris'))).toBe('hatch');
    expect(carShape(car('Volkswagen', 'Golf R'))).toBe('hatch');
    expect(carShape(car('Hyundai', 'i30 N'))).toBe('hatch');
  });
  test('sports cars are coupes; the rest saloons', () => {
    expect(carShape(car('Toyota', 'GT86'))).toBe('coupe');
    expect(carShape(car('Nissan', 'Skyline GT-R R34'))).toBe('coupe');
    expect(carShape(car('BMW', 'M3 E46'))).toBe('saloon');
    expect(carShape(car('Subaru', 'Impreza WRX STI'))).toBe('saloon');
  });
});
