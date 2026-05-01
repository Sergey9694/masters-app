"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, MapPin, SearchX } from "lucide-react";

import { cn } from "@/shared/lib/cn";
import {
  hasYandexMapsApiKey,
  loadYandexMaps,
  type LngLat,
  type YMaps2Instance,
} from "@/shared/lib/yandex-maps";

interface OrderMapPoint {
  id: string;
  orderNumber: number;
  slug: string | null;
  title: string;
  budget: number | null;
  lat: number;
  lng: number;
  distanceMeters: number | null;
  href: string;
  city: {
    name: string;
    slug: string;
  };
  category: {
    name: string;
    slug: string;
  };
}

interface MapPointsResponse {
  points: OrderMapPoint[];
}

interface YandexOrdersMapProps {
  categoryId?: string;
  cityId?: string;
  search?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  initialCenter?: {
    lat: number;
    lng: number;
  };
}

function isMapPointsResponse(value: unknown): value is MapPointsResponse {
  return (
    value !== null &&
    typeof value === "object" &&
    Array.isArray((value as { points?: unknown }).points)
  );
}

function formatBudget(value: number | null) {
  return value ? `${value.toLocaleString("ru-RU")} ₽` : "Договорная";
}


export function YandexOrdersMap({
  categoryId,
  cityId,
  search,
  lat,
  lng,
  radiusKm,
  initialCenter,
}: YandexOrdersMapProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<YMaps2Instance | null>(null);
  const clustererRef = useRef<any>(null);
  
  const [points, setPoints] = useState<OrderMapPoint[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "empty" | "unauthorized" | "error">("loading");
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (categoryId && categoryId !== "all") params.set("categoryId", categoryId);
    if (cityId) params.set("cityId", cityId);
    if (search) params.set("search", search);
    if (lat !== undefined && lng !== undefined) {
      params.set("lat", String(lat));
      params.set("lng", String(lng));
      params.set("radiusKm", String(radiusKm ?? 25));
    }
    return params.toString();
  }, [categoryId, cityId, lat, lng, radiusKm, search]);

  // 1. Fetch points
  useEffect(() => {
    let disposed = false;

    async function loadPoints() {
      // Don't show full loading overlay if we already have points (silent update)
      if (points.length === 0) {
        setStatus("loading");
      }
      
      try {
        const response = await fetch(`/api/v1/orders/map-points?${queryString}`, {
          cache: "no-store",
        });

        if (response.status === 401) {
          if (!disposed) setStatus("unauthorized");
          return;
        }

        if (!response.ok) throw new Error("Failed to fetch map points");

        const payload = await response.json();
        if (!isMapPointsResponse(payload)) throw new Error("Invalid map points response");

        if (!disposed) {
          setPoints(payload.points);
          setStatus(payload.points.length > 0 ? "ready" : "empty");
        }
      } catch (error) {
        console.error("[ORDERS_MAP] Failed to load points:", error);
        if (!disposed) setStatus("error");
      }
    }

    loadPoints();
    return () => { disposed = true; };
  }, [queryString]);

  // 2. Initialize Map instance once
  useEffect(() => {
    if (!containerRef.current || !hasYandexMapsApiKey() || mapRef.current) return;

    let disposed = false;

    async function initMap() {
      try {
        const ymaps = await loadYandexMaps();
        if (!containerRef.current || disposed) return;

        const { center, zoom } = getMapLocation(lat, lng, points, initialCenter);

        const map = new ymaps.Map(containerRef.current, {
          center,
          zoom,
          controls: ["zoomControl", "fullscreenControl", "typeSelector"],
        });

        mapRef.current = map;
        setIsMapLoaded(true);
        
        // Initial features update
        if (points.length > 0) {
          updateFeatures(map, points, ymaps);
        }
      } catch (error) {
        console.error("[ORDERS_MAP] Failed to initialize map:", error);
      }
    }

    initMap();

    return () => {
      disposed = true;
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
        clustererRef.current = null;
      }
    };
  }, []); // Run only once on mount

  // 3. Sync Location
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded) return;
    
    const { center, zoom } = getMapLocation(lat, lng, points, initialCenter);
    mapRef.current.setCenter(center, zoom, {
      duration: 600,
    });
  }, [lat, lng, initialCenter, isMapLoaded]);

  // 4. Sync Points
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded) return;
    
    async function refreshFeatures() {
      const ymaps3 = await loadYandexMaps();
      if (mapRef.current) {
        updateFeatures(mapRef.current, points, ymaps3);
      }
    }
    
    refreshFeatures();
  }, [points, isMapLoaded]);

  async function updateFeatures(
    map: YMaps2Instance, 
    newPoints: OrderMapPoint[], 
    ymaps: any
  ) {
    if (clustererRef.current) {
      map.geoObjects.remove(clustererRef.current);
      clustererRef.current = null;
    }

    if (newPoints.length === 0) return;

    // Create custom cluster icons
    const clusterer = new ymaps.Clusterer({
      preset: "islands#invertedVioletClusterIcons",
      groupByCoordinates: false,
      clusterDisableClickZoom: false,
      clusterHideIconOnBalloonOpen: false,
      geoObjectHideIconOnBalloonOpen: false,
    });

    const placemarks = newPoints.map((point) => {
      const placemark = new ymaps.Placemark(
        [point.lng, point.lat],
        {
          balloonContentHeader: point.title,
          balloonContentBody: `
            <div class="p-2">
              <div class="mb-2 text-xs text-muted-foreground uppercase font-bold tracking-wider">${point.city.name}</div>
              <div class="mb-3 font-bold text-lg">${formatBudget(point.budget)}</div>
              <a href="${point.href}" class="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors">
                Открыть заказ
              </a>
            </div>
          `,
          hintContent: point.title,
        },
        {
          preset: "islands#violetDotIcon",
        }
      );

      placemark.events.add("click", (e: any) => {
        // Option to navigate immediately or rely on balloon
        // router.push(point.href);
      });

      return placemark;
    });

    clusterer.add(placemarks);
    map.geoObjects.add(clusterer);
    clustererRef.current = clusterer;
  }

  function getMapLocation(
    currentLat?: number, 
    currentLng?: number, 
    currentPoints?: OrderMapPoint[], 
    fallback?: { lat: number; lng: number }
  ): { center: LngLat; zoom: number } {
    if (currentLat !== undefined && currentLng !== undefined) {
      return { center: [currentLng, currentLat], zoom: 12 };
    }
    if (fallback) {
      return { center: [fallback.lng, fallback.lat], zoom: 11 };
    }
    if (currentPoints && currentPoints.length > 0) {
      return { center: [currentPoints[0].lng, currentPoints[0].lat], zoom: 10 };
    }
    return { center: [37.6176, 55.7558], zoom: 10 };
  }

  if (!hasYandexMapsApiKey()) {
    return (
      <MapState
        icon={<MapPin className="size-7 text-muted-foreground" />}
        title="Ключ Яндекс Карт не настроен"
        text="Добавьте NEXT_PUBLIC_YANDEX_MAPS_API_KEY, и карта появится здесь."
      />
    );
  }

  return (
    <section className="group relative overflow-hidden rounded-2xl border border-border/60 bg-surface shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Карта заказов</h2>
          <p className="text-xs text-muted-foreground">
            {points.length} {points.length === 1 ? "точка" : "точек"} на карте
          </p>
        </div>
        {lat !== undefined && lng !== undefined && (
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Радиус {radiusKm ?? 25} км
          </span>
        )}
      </div>

      <div className="relative h-[520px] w-full">
        {/* Map Container - always present */}
        <div ref={containerRef} className="h-full w-full" />

        {/* Status Overlays */}
        {status === "loading" && points.length === 0 && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm">
            <Loader2 className="mb-4 size-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Загружаем заказы...</p>
          </div>
        )}

        {status === "unauthorized" && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-md">
            <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
              <Lock className="size-6 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold">Карта доступна после входа</h3>
            <p className="mt-1 max-w-xs text-center text-sm text-muted-foreground">
              Точные точки заказов показываются только авторизованным пользователям.
            </p>
          </div>
        )}

        {status === "empty" && points.length === 0 && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm">
            <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
              <SearchX className="size-6 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold">Нет заказов в этой области</h3>
            <p className="mt-1 max-w-xs text-center text-sm text-muted-foreground">
              Попробуйте изменить фильтры или увеличить радиус поиска.
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm">
            <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-destructive/10">
              <MapPin className="size-6 text-destructive" />
            </div>
            <h3 className="text-base font-semibold">Ошибка загрузки</h3>
            <p className="mt-1 max-w-xs text-center text-sm text-muted-foreground">
              Не удалось загрузить точки заказов. Пожалуйста, обновите страницу.
            </p>
          </div>
        )}
      </div>

      <div className="grid gap-2 border-t border-border/60 bg-background/80 p-3 sm:grid-cols-2 lg:grid-cols-3">
        {points.slice(0, 6).map((point) => (
          <button
            key={point.id}
            type="button"
            onClick={() => router.push(point.href)}
            className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-border/60 bg-surface px-3 py-2 text-left text-xs transition-colors hover:border-primary/40"
          >
            <span className="min-w-0 truncate font-medium text-foreground">{point.title}</span>
            <span className="shrink-0 text-muted-foreground">{formatBudget(point.budget)}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function MapState({
  icon,
  title,
  text,
  className,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface px-6 py-14 text-center",
        className
      )}
    >
      <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">{icon}</div>
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{text}</p>
    </section>
  );
}
