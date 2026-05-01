import { suggestAddress } from "@/shared/lib/dadata";
import { toGeoPoint, type GeoPoint } from "@/shared/lib/geo-utils";

// geocodeViaYandex and helpers removed to ensure compliance with Yandex Maps free tier terms.
// We strictly use DaData for geocoding results that are stored in the database.


export async function geocodeOrderAddress(address: string | null | undefined, cityName?: string | null) {
  const trimmedAddress = address?.trim();
  if (!trimmedAddress) {
    return null;
  }

  const query = cityName ? `${cityName}, ${trimmedAddress}` : trimmedAddress;

  try {
    const [suggestion] = await suggestAddress(query);
    const dadataPoint = suggestion
      ? toGeoPoint(suggestion.data.geo_lat, suggestion.data.geo_lon)
      : null;

    if (dadataPoint) {
      return dadataPoint;
    }
  } catch (error) {
    console.warn("[GEOCODING] DaData geocoding failed:", error instanceof Error ? error.message : "unknown error");
  }

  // NOTE: We do not fallback to Yandex Geocoder here because storing Yandex Geocoder 
  // results in a permanent database is prohibited by their Free Tier terms.
  // We use Yandex strictly for display and interactive picking (client-side).
  return null;
}
