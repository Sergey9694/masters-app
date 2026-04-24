"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { type DadataSuggestion } from "@/shared/lib/dadata";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (suggestion: DadataSuggestion) => void;
  onBlur?: () => void;
  hasError?: boolean;
}

export function DadataAddressInput({ value, onChange, onBlur, hasError, onSelect }: Props) {
  const [suggestions, setSuggestions] = useState<DadataSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/suggest/address?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      const results = data.suggestions || [];
      setSuggestions(results);
      if (results.length > 0) setIsOpen(true);
    } catch (error) {
      console.error("[SUGGEST_ERROR]", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fetchSuggestions(e.target.value), 300);
  };

  const handleSelect = (s: DadataSuggestion) => {
    onChange(s.value);
    onSelect?.(s);
    setSuggestions([]);
    setIsOpen(false);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin
          className={cn(
            "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 transition-colors",
            focused ? "text-primary" : "text-muted-foreground"
          )}
        />
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={() => {
            setFocused(true);
            if (suggestions.length > 0) setIsOpen(true);
          }}
          onBlur={() => {
            setFocused(false);
            setTimeout(() => setIsOpen(false), 150);
            onBlur?.();
          }}
          placeholder="Начните вводить адрес..."
          autoComplete="off"
          className={cn(
            "h-11 w-full rounded-xl border bg-background pl-10 pr-10 text-sm",
            "focus:border-primary/60 focus:outline-none focus:ring-4 focus:ring-primary/10",
            hasError ? "border-destructive" : "border-border"
          )}
        />
        {isLoading && (
          <Loader2 className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
          {suggestions.map((s, i) => (
            <li key={s.unrestricted_value}>
              <button
                type="button"
                onMouseDown={() => handleSelect(s)}
                className={cn(
                  "flex w-full items-start gap-2.5 px-4 py-2.5 text-left text-sm transition-colors hover:bg-muted",
                  i !== 0 && "border-t border-border/40"
                )}
              >
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                <span className="leading-snug">{s.value}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
