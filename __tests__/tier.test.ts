import { didCrossSkilledThreshold } from '../src/lib/tier';

describe('didCrossSkilledThreshold', () => {
  it('mid-session cross: preSuccess=140, awardedSuccess=20 → true', () => {
    expect(didCrossSkilledThreshold(140, 20)).toBe(true);
  });

  it('last-question cross: preSuccess=150, awardedSuccess=15 → true (150+15=165 >= 158)', () => {
    expect(didCrossSkilledThreshold(150, 15)).toBe(true);
  });

  it('below threshold (no cross): preSuccess=100, awardedSuccess=10 → false', () => {
    expect(didCrossSkilledThreshold(100, 10)).toBe(false);
  });
});
