"use client";

import { useCallback, useEffect, useState } from "react";
import { MapPin, ChevronDown, Loader2, Navigation, Search } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { useLocation } from "@/shared/lib/hooks/use-location";
import { detectCityAction, getAllCities } from "../actions";
import { cn } from "@/shared/lib/cn";
import { toast } from "sonner";
import { setCookie, getCookie } from "@/shared/lib/cookies";

interface City {
  id: string;
  name: string;
  slug: string;
}

export function CitySelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentCity, setCurrentCity] = useState<City | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const { detect, isLocating } = useLocation();

  const selectCity = useCallback((city: City, shouldToast = true) => {
    setCurrentCity(city);
    setCookie("cityId", city.id, 30); // 30 дней
    setIsOpen(false);

    if (shouldToast) {
      sessionStorage.setItem("geo_toast_success", `Город изменен на ${city.name}`);
    }

    window.location.reload();
  }, []);

  const handleAutoDetect = useCallback(async (silent = false) => {
    const result = await detect();

    // Пытаемся определить город через наш экшен (который теперь использует DaData)
    const city = await detectCityAction(result.coords?.lat, result.coords?.lng);

    if (city) {
      if (!silent) {
        sessionStorage.setItem("geo_toast_success", `Город определен: ${city.name}`);
      }
      selectCity(city, false);
    } else if (!silent) {
      toast.error("Не удалось точно определить город в нашей базе");
    }

    setIsInitialLoading(false);
  }, [detect, selectCity]);

  // Загрузка города из URL, Cookies или автоопределение
  useEffect(() => {
    // 1. Приоритет URL
    const params = new URLSearchParams(window.location.search);
    const urlCityId = params.get("cityId");

    // 2. Фолбек на Cookies
    const savedCityId = getCookie("cityId");

    const loadInitialCity = async (id: string) => {
      const all = await getAllCities();
      setCities(all);
      const found = all.find(c => c.id === id);
      if (found) {
        setCurrentCity(found);
        setIsInitialLoading(false);
        return true;
      }
      return false;
    };

    const init = async () => {
      if (urlCityId && await loadInitialCity(urlCityId)) return;
      if (savedCityId && await loadInitialCity(savedCityId)) return;
      
      setIsInitialLoading(false);
    };

    init();
  }, []);

  // Загрузка списка городов при открытии
  useEffect(() => {
    if (isOpen) {
      getAllCities().then(setCities).catch(() => {});
    }
  }, [isOpen]);

  // Блокировка скролла при открытой модалке
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const filteredCities = cities.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium hover:bg-primary/10 hover:text-primary transition-all"
      >
        <MapPin className="size-4" />
        {isInitialLoading ? (
          <Loader2 className="size-3 animate-spin" />
        ) : (
          <span>{currentCity?.name || "Выбрать город"}</span>
        )}
        <ChevronDown className="size-3 opacity-50" />
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Выберите город</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 hover:bg-muted transition-colors"
              >
                <ChevronDown className="size-5 rotate-180" />
              </button>
            </div>

            <Button
              variant="outline"
              onClick={() => handleAutoDetect()}
              disabled={isLocating}
              className="w-full mb-6 rounded-2xl h-12 gap-2 border-primary/20 bg-primary/5 text-primary hover:bg-primary/10"
            >
              {isLocating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Navigation className="size-4" />
              )}
              Определить автоматически
            </Button>

            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск города..."
                className="w-full h-12 pl-11 pr-4 rounded-2xl bg-muted/50 border-none outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1 pr-2 scrollbar-thin">
              {filteredCities.map(city => (
                <button
                  key={city.id}
                  onClick={() => selectCity(city)}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-xl hover:bg-primary/5 hover:text-primary transition-all font-medium",
                    currentCity?.id === city.id && "bg-primary/10 text-primary font-bold"
                  )}
                >
                  {city.name}
                </button>
              ))}
              {filteredCities.length === 0 && (
                <p className="text-center py-8 text-muted-foreground">Город не найден</p>
              )}
            </div>
          </div>
          <div className="absolute inset-0 -z-10" onClick={() => setIsOpen(false)} />
        </div>
      )}
    </div>
  );
}
