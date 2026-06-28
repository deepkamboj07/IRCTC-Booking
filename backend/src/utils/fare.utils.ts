export function computeFare(
  distanceKm: number,
  priceMultiplier: number,
  passengerCount: number
): number {
  const baseRatePerKm = 0.5; // ₹0.50 per km base rate
  const raw = baseRatePerKm * distanceKm * priceMultiplier * passengerCount;
  return Math.round(raw * 100) / 100;
}
