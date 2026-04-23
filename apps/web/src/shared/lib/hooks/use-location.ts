"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";

interface LocationCoords {
  lat: number;
  lng: number;
}

interface DetectResult {
  coords?: LocationCoords;
  city?: string;
  error?: string;
}

/**
 * Хук для определения местоположения пользователя.
 * Реализует каскадную стратегию: GPS -> Wi-Fi -> IP (ipapi.co).
 */
export function useLocation() {
  const [isLocating, setIsLocating] = useState(false);

  const getPos = useCallback((high: boolean, timeout: number): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Геолокация не поддерживается"));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: high,
        timeout,
        maximumAge: 60000,
      });
    });
  }, []);

  const detect = useCallback(async (): Promise<DetectResult> => {
    setIsLocating(true);
    
    try {
      // Шаг 1: Пробуем GPS (точность) - 3 секунды
      try {
        const pos = await getPos(true, 3000);
        return { coords: { lat: pos.coords.latitude, lng: pos.coords.longitude } };
      } catch (err) {
        console.warn("[GEO] GPS failed, trying fallback...", err);
      }

      // Шаг 2: Фолбек на Wi-Fi (браузер) - 4 секунды
      try {
        const pos = await getPos(false, 4000);
        return { coords: { lat: pos.coords.latitude, lng: pos.coords.longitude } };
      } catch (err) {
        console.warn("[GEO] Browser location failed", err);
      }

      return { error: "Не удалось получить координаты устройства" };
    } finally {
      setIsLocating(false);
    }
  }, [getPos]);

  return {
    detect,
    isLocating,
  };
}
