"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, MapPin, SearchX } from "lucide-react";
import { createYandexLayouts } from "../lib/YandexMapsLayouts";

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
  const [viewport, setViewport] = useState<{
    minLat: number;
    minLng: number;
    maxLat: number;
    maxLng: number;
  } | null>(null);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (categoryId && categoryId !== "all") params.set("categoryId", categoryId);
    if (cityId) params.set("cityId", cityId);
    if (search) params.set("search", search);
    
    if (viewport) {
      params.set("minLat", viewport.minLat.toFixed(6));
      params.set("minLng", viewport.minLng.toFixed(6));
      params.set("maxLat", viewport.maxLat.toFixed(6));
      params.set("maxLng", viewport.maxLng.toFixed(6));
    } else if (typeof lat === "number" && typeof lng === "number") {
      params.set("lat", lat.toString());
      params.set("lng", lng.toString());
      params.set("radiusKm", (radiusKm ?? 25).toString());
    }
    return params.toString();
  }, [categoryId, cityId, lat, lng, radiusKm, search, viewport]);

  // 1. Fetch points
  useEffect(() => {
    const controller = new AbortController();
    let disposed = false;

    async function loadPoints() {
      // Don't show full loading overlay if we already have points (silent update)
      if (points.length === 0) {
        setStatus("loading");
      }
      
      try {
        const response = await fetch(`/api/v1/orders/map-points?${queryString}`, {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          // If aborted, don't set error state
          if (response.status === 0) return;
          
          const errorData = await response.json().catch(() => ({}));
          console.error("[ORDERS_MAP] API Error:", response.status, errorData);
          
          // Specifically handle 429 to avoid annoying UI if it happens during rapid movement
          if (response.status === 429) {
            console.warn("[ORDERS_MAP] Rate limited, ignoring update");
            return;
          }
          
          throw new Error(`Failed to fetch map points: ${response.status}`);
        }

        const payload = await response.json();
        if (!isMapPointsResponse(payload)) throw new Error("Invalid map points response");

        if (!disposed) {
          setPoints(payload.points);
          setStatus("ready");
        }
      } catch (error: any) {
        if (error.name === "AbortError") {
          return;
        }
        console.error("[ORDERS_MAP] Failed to load points:", error);
        if (!disposed) setStatus("error");
      }
    }

    loadPoints();
    return () => { 
      disposed = true;
      controller.abort();
    };
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

        // Listen for viewport changes
        let boundsTimeout: NodeJS.Timeout;
        map.events.add("boundschange", (e: any) => {
          clearTimeout(boundsTimeout);
          boundsTimeout = setTimeout(() => {
            const bounds = e.get("newBounds");
            // CoordOrder: longlat -> [[lngMin, latMin], [lngMax, latMax]]
            setViewport({
              minLng: bounds[0][0],
              minLat: bounds[0][1],
              maxLng: bounds[1][0],
              maxLat: bounds[1][1],
            });
          }, 500); // 500ms debounce for stability
        });
        
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
      const ymaps = await loadYandexMaps();
      if (mapRef.current) {
        updateFeatures(mapRef.current, points, ymaps);
      }
    }
    
    refreshFeatures();
  }, [points, isMapLoaded, selectedPointId]);

  // 5. Sync BBox to URL
  useEffect(() => {
    if (!viewport) return;
    
    const params = new URLSearchParams(window.location.search);
    params.set("minLat", viewport.minLat.toFixed(6));
    params.set("minLng", viewport.minLng.toFixed(6));
    params.set("maxLat", viewport.maxLat.toFixed(6));
    params.set("maxLng", viewport.maxLng.toFixed(6));
    
    router.replace(`${window.location.pathname}?${params.toString()}`, { scroll: false });
  }, [viewport, router]);

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

    const { PlacemarkLayout, ClusterLayout } = createYandexLayouts(ymaps);

    // Create and configure clusterer
    const clusterer = new ymaps.Clusterer({
      clusterIconLayout: ClusterLayout,
      clusterIconShape: {
        type: "Rectangle",
        coordinates: [[-60, -20], [60, 20]],
      },
      groupByCoordinates: false,
      clusterDisableClickZoom: false,
      clusterHideIconOnBalloonOpen: false,
      geoObjectHideIconOnBalloonOpen: false,
      gridSize: 80, // Larger grid for better performance and aggregation
    });

    // Enriched Cluster properties: calculate minPrice
    // In v2.1, we listen to the data-layer changes of the clusterer
    clusterer.events.add("datachange", () => {
      const clusters = clusterer.getClusters();
      clusters.forEach((cluster: any) => {
        const objects = cluster.getGeoObjects();
        let minPrice = Infinity;
        
        objects.forEach((obj: any) => {
          const pointId = obj.properties.get("id");
          const point = newPoints.find(p => p.id === pointId);
          if (point?.budget && point.budget < minPrice) {
            minPrice = point.budget;
          }
        });

        const minPriceLabel = minPrice === Infinity 
          ? "дог." 
          : minPrice >= 1000 
            ? `${(minPrice / 1000).toFixed(minPrice % 1000 === 0 ? 0 : 1)}к` 
            : `${minPrice}`;
            
        cluster.properties.set("minPriceLabel", minPriceLabel);
      });
    });

    const placemarks = newPoints.map((point) => {
      const budgetLabel = point.budget 
        ? point.budget >= 1000 
          ? `${(point.budget / 1000).toFixed(point.budget % 1000 === 0 ? 0 : 1)}к ₽` 
          : `${point.budget} ₽`
        : "дог.";

      const placemark = new ymaps.Placemark(
        [point.lng, point.lat],
        {
          id: point.id, // Store ID for reference in cluster aggregation
          budgetLabel,
          activeStatus: selectedPointId === point.id ? "active" : "",
          balloonContentHeader: point.title,
          balloonContentBody: `
            <div class="p-2 min-w-[200px]">
              <div class="mb-2 text-[10px] text-muted-foreground uppercase font-bold tracking-wider">${point.city.name} • ${point.category.name}</div>
              <div class="mb-3 font-bold text-xl text-primary">${formatBudget(point.budget)}</div>
              <div class="mb-3 text-sm line-clamp-2">${point.title}</div>
              <a href="${point.href}" class="w-full inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-lg hover:shadow-primary/20 transition-all hover:-translate-y-0.5 active:translate-y-0">
                Открыть заказ
              </a>
            </div>
          `,
          hintContent: point.title,
        },
        {
          iconLayout: PlacemarkLayout,
          iconShape: {
            type: "Rectangle",
            coordinates: [[-35, -35], [35, 0]],
          },
          hasBalloon: true,
          hideIconOnBalloonOpen: false,
          openBalloonOnClick: true,
        }
      );

      placemark.events.add("click", () => {
        setSelectedPointId(point.id);
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


        {/* Empty state is handled silently by showing an empty map, as per user request for continuous browsing */}

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
