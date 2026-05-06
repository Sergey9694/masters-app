"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { FieldPath, FieldValues, PathValue, UseFormReturn } from "react-hook-form";
import { Loader2, MapPin, Search, X } from "lucide-react";

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";
import { cn } from "@/shared/lib/cn";
import {
  hasYandexMapsApiKey,
  loadYandexMaps,
  type LngLat,
  type YMaps2Instance,
  type YMaps2Object,
  type YMaps2Global,
} from "@/shared/lib/yandex-maps";
import type { DadataSuggestion } from "@/shared/lib/dadata";
import { ensureCityAction } from "@/shared/lib/ensure-city-action";
import { GEO_LIMIT_MESSAGE } from "@/shared/config/geo";

interface AddressPickerProps<TFormValues extends AddressPickerFormValues> {
  form: UseFormReturn<TFormValues>;
  name?: FieldPath<TFormValues>;
  label?: string;
}

type AddressPickerFormValues = FieldValues & {
  address?: string;
  cityId?: string;
  lat?: number | null;
  lng?: number | null;
};

export function AddressPicker<TFormValues extends AddressPickerFormValues>({
  form,
  name,
  label = "Где находится объект?",
}: AddressPickerProps<TFormValues>) {
  const fieldName = (name ?? "address") as FieldPath<TFormValues>;
  const cityIdName = "cityId" as FieldPath<TFormValues>;
  const latName = "lat" as FieldPath<TFormValues>;
  const lngName = "lng" as FieldPath<TFormValues>;
  const [suggestions, setSuggestions] = useState<DadataSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<YMaps2Instance | null>(null);
  const markerRef = useRef<YMaps2Object | null>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const suggestAbortRef = useRef<AbortController | null>(null);
  const suggestDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateMarker = useCallback(async (map: YMaps2Instance, coordinates: LngLat, ymaps: YMaps2Global) => {
    if (markerRef.current) {
      map.geoObjects.remove(markerRef.current);
    }

    const marker = new ymaps.Placemark(coordinates, {}, {
      preset: "islands#redDotIconWithCaption",
      draggable: false,
    });

    map.geoObjects.add(marker);
    markerRef.current = marker;
    
    map.setCenter(coordinates, 16, {
      duration: 800,
      checkZoomRange: true,
    });
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!containerRef.current || !hasYandexMapsApiKey() || mapRef.current) return;

    let disposed = false;

    async function initMap() {
      try {
        const ymaps = await loadYandexMaps();
        if (!containerRef.current || disposed) return;

        // Default to Moscow or existing coordinates if any
        const initialLat = form.getValues(latName);
        const initialLng = form.getValues(lngName);
        const center: LngLat = initialLat && initialLng ? [initialLng, initialLat] : [37.6176, 55.7558];

        const map = new ymaps.Map(containerRef.current, {
          center,
          zoom: 12,
          controls: ["zoomControl", "fullscreenControl"],
        });

        mapRef.current = map;
        setIsMapReady(true);

        if (initialLat && initialLng) {
          updateMarker(map, [initialLng, initialLat], ymaps);
        }
      } catch (error) {
        console.error("[ADDRESS_PICKER] Map init failed:", error);
      }
    }

    initMap();

    return () => {
      disposed = true;
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
    };
  }, []);

  const fetchAddressSuggest = (query: string) => {
    if (suggestDebounceRef.current) clearTimeout(suggestDebounceRef.current);
    if (query.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    suggestDebounceRef.current = setTimeout(async () => {
      suggestAbortRef.current?.abort();
      const ac = new AbortController();
      suggestAbortRef.current = ac;
      
      try {
        const resp = await fetch(
          `/api/suggest/address?q=${encodeURIComponent(query)}`,
          { signal: ac.signal },
        );
        if (!resp.ok) return;
        const data = (await resp.json()) as { suggestions?: DadataSuggestion[] };
        const list = data.suggestions ?? [];
        setSuggestions(list);
        setShowSuggestions(list.length > 0);
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          console.warn("[suggest] fetch error", e);
        }
      }
    }, 300);
  };

  const handleSelectSuggestion = async (s: DadataSuggestion) => {
    form.setValue(fieldName, s.value as PathValue<TFormValues, typeof fieldName>, { shouldValidate: true });
    
    const lat = s.data.geo_lat ? parseFloat(s.data.geo_lat) : null;
    const lng = s.data.geo_lon ? parseFloat(s.data.geo_lon) : null;
    
    if (lat && lng) {
      form.setValue(latName, lat as PathValue<TFormValues, typeof latName>);
      form.setValue(lngName, lng as PathValue<TFormValues, typeof lngName>);
      
      if (mapRef.current) {
        const ymaps = await loadYandexMaps();
        updateMarker(mapRef.current, [lng, lat], ymaps);
      }
    }

    const cityName = s.data.city || s.data.settlement || s.data.city_with_type;
    const regionName = s.data.region_with_type || s.data.region;

    if (cityName && regionName) {
      try {
        const { id } = await ensureCityAction({
          name: cityName,
          fiasId: s.data.city_fias_id || s.data.settlement_fias_id,
          region: regionName,
        });

        form.setValue(cityIdName, id as PathValue<TFormValues, typeof cityIdName>, { shouldValidate: true });
        form.clearErrors(fieldName);
      } catch (error) {
        console.error("[CITY_ERROR]", error);
        form.setError(fieldName, { 
          type: "manual", 
          message: GEO_LIMIT_MESSAGE
        });
      }
    }
    
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name={fieldName}
        render={({ field }) => (
          <FormItem className="relative">
            <FormLabel className="text-sm font-normal text-foreground px-1">
              {label}
            </FormLabel>
            <FormControl>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  {...field}
                  ref={(node) => {
                    addressInputRef.current = node;
                    field.ref(node);
                  }}
                  autoComplete="off"
                  placeholder="Введите адрес объекта"
                  className="pl-10 pr-10 h-12 rounded-xl border-border/60 bg-surface focus:ring-primary/20"
                  onChange={(e) => {
                    field.onChange(e);
                    fetchAddressSuggest(e.target.value);
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowSuggestions(false), 200);
                  }}
                />
                {field.value && (
                  <button
                    type="button"
                    onClick={() => {
                      form.setValue(fieldName, "" as PathValue<TFormValues, typeof fieldName>);
                      form.setValue(latName, null as PathValue<TFormValues, typeof latName>);
                      form.setValue(lngName, null as PathValue<TFormValues, typeof lngName>);
                      setSuggestions([]);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            </FormControl>
            <FormMessage />

            {showSuggestions && suggestions.length > 0 && (
              <div
                className="absolute top-[calc(100%+4px)] left-0 w-full bg-popover border border-border/60 rounded-xl overflow-hidden shadow-2xl z-[100]"
              >
                {suggestions.map((s, i) => (
                  <button
                    key={`${s.unrestricted_value}-${i}`}
                    type="button"
                    className="w-full px-4 py-3 text-left text-sm text-foreground hover:bg-primary/5 hover:text-primary transition-colors border-b border-border/40 last:border-none"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelectSuggestion(s);
                    }}
                  >
                    <div className="font-medium">{s.value}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-tight mt-0.5">
                      {s.data.region_with_type} {s.data.city && `, ${s.data.city}`}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </FormItem>
        )}
      />

      {/* Map Preview */}
      <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-muted/30 shadow-inner">
        <div 
          ref={containerRef} 
          className={cn(
            "h-[240px] w-full transition-opacity duration-500",
            isMapReady ? "opacity-100" : "opacity-0"
          )} 
        />
        
        {!isMapReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/20">
            <Loader2 className="mb-2 size-6 animate-spin text-muted-foreground/40" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Инициализация карты</p>
          </div>
        )}

        {/* Map Overlay Decor */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-background/20 to-transparent" />
        <div className="absolute left-3 top-3 rounded-full bg-background/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground shadow-sm backdrop-blur-sm border border-white/10">
          Предпросмотр
        </div>
      </div>
    </div>
  );
}
