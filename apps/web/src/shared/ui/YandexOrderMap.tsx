"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin } from "lucide-react";

import { cn } from "@/shared/lib/cn";
import { hasYandexMapsApiKey, loadYandexMaps, type LngLat, type YMaps2Instance, type YMaps2Object } from "@/shared/lib/yandex-maps";
import { toGeoPoint } from "@/shared/lib/geo-utils";

interface YandexOrderMapProps {
  lat?: number | null;
  lng?: number | null;
  address?: string | null;
  cityName?: string | null;
  className?: string;
}

export function YandexOrderMap({ lat, lng, address, cityName, className }: YandexOrderMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<YMaps2Instance | null>(null);
  const markerRef = useRef<YMaps2Object | null>(null);
  const [error, setError] = useState<string | null>(null);
  const point = useMemo(() => toGeoPoint(lat, lng), [lat, lng]);

  useEffect(() => {
    if (!point || !containerRef.current || !hasYandexMapsApiKey()) {
      return;
    }

    let disposed = false;
    const coordinates: LngLat = [point.lng, point.lat];

    async function initMap() {
      try {
        const ymaps = await loadYandexMaps();
        if (disposed || !containerRef.current) {
          return;
        }

        // If map already exists, just update location and marker
        if (mapRef.current) {
          mapRef.current.setCenter(coordinates, 15, { duration: 600 });
          
          if (markerRef.current) {
            markerRef.current.geometry.setCoordinates(coordinates);
          }
          return;
        }

        const map = new ymaps.Map(containerRef.current, {
          center: coordinates,
          zoom: 15,
          controls: ["zoomControl"],
          behaviors: ["drag", "pinchZoom"],
        });

        const marker = new ymaps.Placemark(coordinates, {
          hintContent: address || cityName || "Заказ",
        }, {
          preset: "islands#violetDotIcon",
        });

        map.geoObjects.add(marker);
        markerRef.current = marker;
        mapRef.current = map;
      } catch (loadError) {
        console.error("[YANDEX_ORDER_MAP] Failed to initialize map:", loadError);
        if (!disposed) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load map");
        }
      }
    }

    initMap();

    return () => {
      disposed = true;
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [point, address, cityName]);

  if (!point) {
    return (
      <div className={cn("rounded-xl border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground", className)}>
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 size-4 shrink-0" />
          <span className="wrap-anywhere">{address || cityName || "Адрес пока без координат"}</span>
        </div>
      </div>
    );
  }

  if (!hasYandexMapsApiKey()) {
    return (
      <div className={cn("rounded-xl border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground", className)}>
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 size-4 shrink-0" />
          <span className="wrap-anywhere">{address || cityName || "Карта появится после настройки ключа Яндекс Карт"}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-xl border border-border/60 bg-muted", className)}>
      <div ref={containerRef} className="h-52 w-full" />
      <div className="flex items-start gap-2 border-t border-border/60 bg-surface/95 px-3 py-2 text-sm text-foreground">
        <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
        <span className="wrap-anywhere">{address || cityName}</span>
      </div>
      {error && (
        <div className="border-t border-border/60 bg-background px-3 py-2 text-xs text-muted-foreground">
          Карта временно недоступна
        </div>
      )}
    </div>
  );
}
