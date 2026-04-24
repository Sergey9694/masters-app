import { PROJECT_CITIES as CITIES_DATA } from "./seed-data.mjs";

export interface CityConfig {
  name: string;
  slug: string;
  region: string;
  fiasId?: string;
  lat: number;
  lng: number;
}

export const PROJECT_CITIES: CityConfig[] = CITIES_DATA as CityConfig[];
