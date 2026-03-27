"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MapPin, Loader2, Navigation, Crosshair } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { BLUR_IN, CLICK_SCALE } from "@/shared/lib/motion";
import { toast } from "sonner";

/**
 * Кнопка быстрого поиска заказов по геолокации.
 * Приоритетная механика для мастеров "Районного Мастера" 2026.
 */
export function LocationFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLocating, setIsLocating] = useState(false);
  
  const hasGeo = searchParams.has("lat") && searchParams.has("lng");

  const handleGeoSearch = () => {
    console.log("[GEO_DEBUG] Запуск стратегии 'Авто-выбор' (Двухэтапный поиск)...");
    setIsLocating(true);
    
    if (!navigator.geolocation) {
      toast.error("Геолокация не поддерживается");
      setIsLocating(false);
      return;
    }

    // Вспомогательная функция для попытки получения координат
    const getPos = (high: boolean, timeout: number): Promise<GeolocationPosition> => {
      console.log(`[GEO_DEBUG] Попытка: highAccuracy=${high}, timeout=${timeout}ms...`);
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: high,
          timeout,
          maximumAge: 60000
        });
      });
    };

    const runSearch = async () => {
      try {
        // Шаг 1: Пробуем GPS (точность) - 3 секунды
        const pos = await getPos(true, 3000);
        handleSuccess(pos.coords.latitude, pos.coords.longitude);
      } catch (err: any) {
        // Шаг 2: Фолбек на Wi-Fi (браузер) - 4 секунды
        console.warn("[GEO_DEBUG] GPS не ответил. Пробуем Wi-Fi/Браузер...");
        try {
          const fastPos = await getPos(false, 4000);
          handleSuccess(fastPos.coords.latitude, fastPos.coords.longitude);
        } catch (fastErr: any) {
          // Шаг 3 (ФИНАЛ): Сетевой поиск по IP (ipapi.co) - 100% надежность
          console.warn("[GEO_DEBUG] Браузерный поиск заблокирован или не сработал. Фолбек на IP-API...");
          try {
            const res = await fetch("https://ipapi.co/json/", { cache: "no-store" });
            const data = await res.json();
            if (data.latitude && data.longitude) {
              console.log("[GEO_DEBUG] УСПЕХ ПО IP:", data.latitude, data.longitude);
              handleSuccess(data.latitude, data.longitude);
              toast.info("Местоположение определено по IP-адресу");
            } else {
              throw new Error("IP API вернул некорректные данные");
            }
          } catch (ipErr: any) {
            handleError(ipErr);
          }
        }
      }
    };

    const handleSuccess = (lat: number, lng: number) => {
      console.log(`[GEO_DEBUG] ПРИМЕНЕНИЕ КООРДИНАТ: ${lat}, ${lng}`);
      const current = new URLSearchParams(Array.from(searchParams.entries()));
      current.set("lat", lat.toString());
      current.set("lng", lng.toString());
      router.push(`?${current.toString()}`);
      setIsLocating(false);
      toast.success("Локация обновлена!");
    };

    const handleError = (err: any) => {
      let msg = "Не удалось определить координаты";
      if (err.code === 1) msg = "Доступ к геопозиции запрещен (проверьте настройки)";
      
      console.error(`[GEO_DEBUG] ФАТАЛЬНАЯ ОШИБКА: Code: ${err.code}, Msg: ${err.message}`);
      toast.error(msg);
      setIsLocating(false);
    };

    runSearch();
  };

  const clearGeo = () => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.delete("lat");
    current.delete("lng");
    router.push(`?${current.toString()}`);
  };

  return (
    <motion.div 
      initial="initial"
      animate="animate"
      variants={BLUR_IN}
      className="flex flex-col sm:flex-row items-center gap-4 w-full"
    >
      <motion.div whileTap={CLICK_SCALE} className="flex-1 w-full">
        <Button 
          onClick={handleGeoSearch}
          disabled={isLocating}
          className={`w-full h-14 rounded-3xl font-black uppercase tracking-widest transition-all duration-500 shadow-xl ${
            hasGeo 
              ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20" 
              : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20"
          }`}
        >
          {isLocating ? (
            <Loader2 className="w-5 h-5 animate-spin mr-3" />
          ) : hasGeo ? (
            <Navigation className="w-5 h-5 mr-3 animate-pulse" />
          ) : (
            <MapPin className="w-5 h-5 mr-3" />
          )}
          {hasGeo ? "Поиск активен" : "Показать заказы рядом"}
        </Button>
      </motion.div>

      <AnimatePresence>
        {hasGeo && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: -20 }}
          >
            <Button 
              variant="outline" 
              onClick={clearGeo}
              className="h-14 px-6 rounded-3xl border-white/10 bg-white/5 font-bold text-[10px] uppercase tracking-wider hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all"
            >
              Сбросить фильтр
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
