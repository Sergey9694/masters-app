export interface GeoPoint {
  lat: number;
  lng: number;
}

export function isValidGeoPoint(point: GeoPoint): boolean {
  return (
    Number.isFinite(point.lat) &&
    Number.isFinite(point.lng) &&
    point.lat >= -90 &&
    point.lat <= 90 &&
    point.lng >= -180 &&
    point.lng <= 180
  );
}

export function toGeoPoint(lat: unknown, lng: unknown): GeoPoint | null {
  const parsedLat = typeof lat === "number" ? lat : typeof lat === "string" ? Number(lat) : NaN;
  const parsedLng = typeof lng === "number" ? lng : typeof lng === "string" ? Number(lng) : NaN;
  const point = { lat: parsedLat, lng: parsedLng };

  return isValidGeoPoint(point) ? point : null;
}

export function normalizeRadiusKm(radiusKm: unknown, fallback = 25): number {
  const parsed = typeof radiusKm === "number" ? radiusKm : typeof radiusKm === "string" ? Number(radiusKm) : NaN;

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(100, Math.max(1, parsed));
}
