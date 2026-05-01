"use server";

import { headers } from "next/headers";

const DADATA_TOKEN = process.env.DADATA_API_KEY;

export interface DadataSuggestion {
  value: string;
  unrestricted_value: string;
  data: {
    region?: string;
    region_with_type?: string;
    city?: string;
    city_with_type?: string;
    city_fias_id?: string;
    settlement?: string;
    settlement_with_type?: string;
    settlement_fias_id?: string;
    geo_lat?: string;
    geo_lon?: string;
    [key: string]: unknown;
  };
}

/**
 * Подсказки адресов
 */
export async function suggestAddress(query: string, locations?: Record<string, unknown>[]): Promise<DadataSuggestion[]> {
  if (!DADATA_TOKEN || !query.trim()) return [];

  try {
    const res = await fetch(
      "https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Token ${DADATA_TOKEN}`,
        },
        body: JSON.stringify({ 
          query, 
          count: 5,
          locations: locations && locations.length > 0 ? locations : undefined
        }),
        cache: "no-store",
      }
    );
    const data = await res.json();
    return data.suggestions || [];
  } catch (error) {
    console.error("[DADATA] Suggest error:", error);
    return [];
  }
}

/**
 * Определение города по IP (серверный экшен)
 */
export async function detectCityByIp(): Promise<DadataSuggestion | null> {
  if (!DADATA_TOKEN) return null;

  try {
    const headerList = await headers();
    const ip = headerList.get("x-forwarded-for")?.split(",")[0] || headerList.get("x-real-ip");
    
    const url = `https://suggestions.dadata.ru/suggestions/api/4_1/rs/iplocate/address${ip ? `?ip=${ip}` : ""}`;
    
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Token ${DADATA_TOKEN}`,
      },
      cache: "no-store",
    });
    
    const data = await res.json();
    return data.location || null;
  } catch (error) {
    console.error("[DADATA] IP detect error:", error);
    return null;
  }
}

/**
 * Обратное геокодирование (Координаты -> Адрес/Город)
 */
export async function geolocate(lat: number, lon: number): Promise<DadataSuggestion | null> {
  if (!DADATA_TOKEN) return null;

  try {
    const res = await fetch(
      "https://suggestions.dadata.ru/suggestions/api/4_1/rs/geolocate/address",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Token ${DADATA_TOKEN}`,
        },
        body: JSON.stringify({ lat, lon, count: 1 }),
        cache: "no-store",
      }
    );
    const data = await res.json();
    return data.suggestions?.[0] || null;
  } catch (error) {
    console.error("[DADATA] Geolocate error:", error);
    return null;
  }
}
