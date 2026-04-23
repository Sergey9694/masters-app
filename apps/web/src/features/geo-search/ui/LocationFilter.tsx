"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { MapPin, Loader2, Navigation } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { BLUR_IN, CLICK_SCALE } from "@/shared/lib/motion";
import { toast } from "sonner";
import { useHaptics } from "@/shared/lib/telegram/use-haptics";
import { useLocation } from "@/shared/lib/hooks/use-location";

/**
 * Кнопка быстрого поиска заказов по геолокации.
 * Использует универсальный хук useLocation.
 */
export function LocationFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const haptics = useHaptics();
  const { detect, isLocating } = useLocation();
  
  const hasGeo = searchParams.has("lat") && searchParams.has("lng");

  const handleGeoSearch = async () => {
    haptics.impact("medium");
    const result = await detect();

    if (result.coords) {
      const current = new URLSearchParams(Array.from(searchParams.entries()));
      current.set("lat", result.coords.lat.toString());
      current.set("lng", result.coords.lng.toString());
      router.push(`?${current.toString()}`);
      haptics.notification("success");
      toast.success("Локация обновлена!");
    } else if (result.error) {
      haptics.notification("error");
      toast.error(result.error);
    }
  };

  const clearGeo = () => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.delete("lat");
    current.delete("lng");
    haptics.selection();
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
