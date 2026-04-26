export function didCrossSkilledThreshold(preSuccess: number, awardedSuccess: number): boolean {
  return preSuccess < 158 && preSuccess + awardedSuccess >= 158;
}
