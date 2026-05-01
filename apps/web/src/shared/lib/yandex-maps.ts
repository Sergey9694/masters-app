"use client";

export type LngLat = [number, number];

/**
 * Типизация для Yandex Maps API v2.1
 */
export interface YMaps2Global {
  ready: (callback: () => void) => void;
  Map: new (
    element: string | HTMLElement,
    state: {
      center: LngLat;
      zoom: number;
      controls?: string[];
      behaviors?: string[];
    },
    options?: Record<string, unknown>
  ) => YMaps2Instance;
  Placemark: new (
    geometry: LngLat,
    properties?: Record<string, unknown>,
    options?: Record<string, unknown>
  ) => YMaps2Object;
  Clusterer: new (options?: Record<string, unknown>) => YMaps2Clusterer;
  GeoObjectCollection: new (options?: Record<string, unknown>) => YMaps2Collection;
  geoQuery: (objects: unknown) => YMaps2GeoQuery;
  templateLayoutFactory: {
    createClass: (template: string, overrides?: Record<string, unknown>) => unknown;
  };
}

export interface YMaps2Instance {
  destroy: () => void;
  setCenter: (center: LngLat, zoom?: number, options?: Record<string, unknown>) => Promise<void>;
  setZoom: (zoom: number, options?: Record<string, unknown>) => Promise<void>;
  geoObjects: YMaps2Collection;
  events: {
    add: (name: string, callback: (e: any) => void) => void;
    remove: (name: string, callback: (e: any) => void) => void;
  };
  getCenter: () => LngLat;
  getZoom: () => number;
  cursors?: {
    push: (cursorName: string) => void;
  };
}

export interface YMaps2Object {
  geometry: {
    getCoordinates: () => LngLat;
    setCoordinates: (coords: LngLat) => void;
  };
  properties: {
    set: (key: string, value: unknown) => void;
    get: (key: string) => unknown;
  };
  options: {
    set: (key: string, value: unknown) => void;
    get: (key: string) => unknown;
  };
  events: {
    add: (name: string, callback: (e: any) => void) => void;
  };
}

export interface YMaps2Collection {
  add: (object: any) => void;
  remove: (object: any) => void;
  removeAll: () => void;
}

export interface YMaps2Clusterer extends YMaps2Collection {
  add: (objects: any | any[]) => void;
}

export interface YMaps2GeoQuery {
  addTo: (map: YMaps2Instance) => YMaps2GeoQuery;
  remove: () => YMaps2GeoQuery;
  get: (index: number) => any;
  getLength: () => number;
}

declare global {
  interface Window {
    ymaps?: YMaps2Global;
  }
}

let loaderPromise: Promise<YMaps2Global> | null = null;

function getYandexMapsApiKey() {
  return process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY?.trim() || null;
}

export function hasYandexMapsApiKey() {
  return Boolean(getYandexMapsApiKey());
}

/**
 * Загрузка Yandex Maps API v2.1
 */
export async function loadYandexMaps(): Promise<YMaps2Global> {
  if (typeof window === "undefined") {
    throw new Error("Yandex Maps can only be loaded in the browser");
  }

  if (window.ymaps && (window.ymaps as any).Map) {
    return window.ymaps;
  }

  if (loaderPromise) {
    return loaderPromise;
  }

  const apiKey = getYandexMapsApiKey();
  if (!apiKey) {
    throw new Error("NEXT_PUBLIC_YANDEX_MAPS_API_KEY is not configured");
  }

  loaderPromise = new Promise<YMaps2Global>((resolve, reject) => {
    const script = document.createElement("script");
    const params = new URLSearchParams({ 
      apikey: apiKey, 
      lang: "ru_RU",
      coordorder: "longlat",
    });

    script.src = `https://api-maps.yandex.ru/2.1/?${params.toString()}`;
    script.async = true;
    script.onload = () => {
      if (!window.ymaps) {
        reject(new Error("Yandex Maps loader did not expose ymaps"));
        return;
      }

      window.ymaps.ready(() => {
        resolve(window.ymaps!);
      });
    };
    script.onerror = () => reject(new Error("Failed to load Yandex Maps v2.1 script. Check your API Key and network."));
    document.head.appendChild(script);
  });

  return loaderPromise;
}
