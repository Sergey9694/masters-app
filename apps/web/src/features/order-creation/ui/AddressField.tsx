"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";
import type { DadataSuggestion } from "@/shared/lib/dadata";
import type { OrderFormValues } from "../model/order-schema";

interface AddressFieldProps {
  form: UseFormReturn<OrderFormValues>;
  cities: { id: string; name: string }[];
}

export function AddressField({ form, cities }: AddressFieldProps) {
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
                field.onBlur();
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
                    onMouseDown={(e) => {
                      e.preventDefault();
                      form.setValue("address", s.value, { shouldValidate: true });
                      
                      const cityName = s.data.city || s.data.settlement;
                      if (cityName) {
                        const matchedCity = cities.find(c => 
                          c.name.toLowerCase().includes(cityName.toLowerCase()) ||
                          cityName.toLowerCase().includes(c.name.toLowerCase())
                        );
                        if (matchedCity) {
                          form.setValue("cityId", matchedCity.id, { shouldValidate: true });
                          form.clearErrors("address");
                        } else {
                          form.setError("address", {
                            type: "manual",
                            message: `Мы пока не работаем в г. ${cityName}. Выберите другой город.`
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
