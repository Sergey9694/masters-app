import { normalizeRadiusKm, toGeoPoint } from "@/shared/lib/geo-utils";

export type OrdersViewMode = "list" | "map";

export function parseOrdersViewMode(value: string | undefined): OrdersViewMode {
  return value === "map" ? "map" : "list";
}

export function parseOptionalNumber(value: string | undefined) {
  if (value === undefined || value.trim() === "") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function parseGeoQuery(lat: string | undefined, lng: string | undefined, radiusKm: string | undefined) {
  const point = toGeoPoint(parseOptionalNumber(lat), parseOptionalNumber(lng));
  if (!point) {
    return { lat: undefined, lng: undefined, radiusKm: undefined };
  }

  return {
    lat: point.lat,
    lng: point.lng,
    radiusKm: normalizeRadiusKm(parseOptionalNumber(radiusKm)),
  };
}
