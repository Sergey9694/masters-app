"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";
import type { DadataSuggestion } from "@/shared/lib/dadata";
import type { OrderFormValues } from "../model/order-schema";
import { ensureCityAction } from "../api/ensure-city-action";
import { GEO_LIMIT_MESSAGE } from "@/shared/config/geo";

interface AddressFieldProps {
  form: UseFormReturn<OrderFormValues>;
}

export function AddressField({ form }: AddressFieldProps) {
  const [suggestions, setSuggestions] = useState<DadataSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputRect, setInputRect] = useState<DOMRect | null>(null);
  
  const addressInputRef = useRef<HTMLInputElement>(null);
  const suggestAbortRef = useRef<AbortController | null>(null);
  const suggestDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (showSuggestions && addressInputRef.current) {
      setInputRect(addressInputRef.current.getBoundingClientRect());
    }
  }, [showSuggestions]);

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
    }, 250);
  };

  return (
    <FormField
      control={form.control}
      name="address"
      render={({ field }) => (
        <FormItem className="relative z-20">
          <FormLabel className="text-[10px] uppercase font-black tracking-[0.15em] text-indigo-300 opacity-60 px-1">Где находится объект?</FormLabel>
          <FormControl>
            <Input
              {...field}
              ref={(node) => {
                addressInputRef.current = node;
                field.ref(node);
              }}
              autoComplete="off"
              placeholder="Город, улица, дом"
              onChange={(e) => {
                field.onChange(e);
                fetchAddressSuggest(e.target.value);
              }}
              onBlur={() => {
                setTimeout(() => setShowSuggestions(false), 200);
              }}
            />
          </FormControl>
          <FormMessage />

          {typeof document !== "undefined" &&
            showSuggestions &&
            suggestions.length > 0 &&
            inputRect &&
            createPortal(
              <div
                style={{
                  position: "fixed",
                  top: inputRect.bottom + 8,
                  left: inputRect.left,
                  width: inputRect.width,
                }}
                className="bg-[#0d0f16]/95 backdrop-blur-3xl border border-white/10 rounded-[var(--ui-radius-premium)] overflow-hidden shadow-2xl z-[9999] font-sans"
              >
                {suggestions.map((s, i) => (
                  <button
                    key={`${s.unrestricted_value}-${i}`}
                    type="button"
                    className="w-full px-5 py-4 text-left text-[11px] font-black uppercase tracking-wider text-slate-300 hover:bg-indigo-600/40 hover:text-white transition-all border-b border-white/5 last:border-none"
                    onMouseDown={async (e) => {
                      e.preventDefault();
                      form.setValue("address", s.value, { shouldValidate: true });
                      
                      const cityName = s.data.city || s.data.settlement || s.data.city_with_type;
                      const regionName = s.data.region_with_type || s.data.region;

                      if (cityName && regionName) {
                        try {
                          const { id } = await ensureCityAction({
                            name: cityName,
                            fiasId: s.data.city_fias_id || s.data.settlement_fias_id,
                            region: regionName,
                            lat: s.data.geo_lat && !isNaN(parseFloat(s.data.geo_lat)) ? parseFloat(s.data.geo_lat) : null,
                            lng: s.data.geo_lon && !isNaN(parseFloat(s.data.geo_lon)) ? parseFloat(s.data.geo_lon) : null,
                          });

                          form.setValue("cityId", id, { shouldValidate: true });
                          form.clearErrors("address");
                        } catch (error) {
                          console.error("[CITY_ERROR]", error);
                          form.setError("address", { 
                            type: "manual", 
                            message: GEO_LIMIT_MESSAGE
                          });
                        }
                      }
                      
                      setSuggestions([]);
                      setShowSuggestions(false);
                    }}
                  >
                    {s.value}
                  </button>
                ))}
              </div>,
              document.body,
            )}
        </FormItem>
      )}
    />
  );
}
