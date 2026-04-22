"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition, useState, useEffect } from "react";
import { Search, X } from "lucide-react";

import { cn } from "@/shared/lib/cn";

interface Option {
  id: string;
  name: string;
}

interface OrdersFiltersProps {
  categories: Option[];
  cities: Option[];
  isProvider?: boolean;
}

const SORT_OPTIONS = [
  { value: "new", label: "Сначала новые" },
  { value: "budget_desc", label: "Бюджет: по убыванию" },
  { value: "budget_asc", label: "Бюджет: по возрастанию" },
];

/**
 * Фильтры ленты заказов с синхронизацией в URL (searchParams).
 * Изменение фильтра → router.replace с обновлёнными параметрами,
 * лента перерендеривается благодаря RSC.
 */
export function OrdersFilters({ categories, cities, isProvider }: OrdersFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const currentCategory = searchParams.get("categoryId") ?? "";
  const currentCity = searchParams.get("cityId") ?? "";
  const currentSort = searchParams.get("sort") ?? "new";
  const currentSearch = searchParams.get("search") ?? "";

  const [searchDraft, setSearchDraft] = useState(currentSearch);

  useEffect(() => {
    setSearchDraft(currentSearch);
  }, [currentSearch]);

  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value !== null && value !== undefined) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    startTransition(() => {
      router.replace(`?${params.toString()}`, { scroll: false });
    });
  };

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam("search", searchDraft.trim() || null);
  };

  const hasActiveFilters =
    currentCategory || currentCity || currentSearch || currentSort !== "new";

  const resetAll = () => {
    startTransition(() => {
      router.replace("?", { scroll: false });
    });
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-surface p-4 shadow-sm sm:p-5">
      <form onSubmit={onSearchSubmit} className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.target.value)}
          placeholder="Найти заказ по названию или описанию"
          className={cn(
            "h-11 w-full rounded-xl border border-border bg-background pl-11 pr-4 text-sm",
            "placeholder:text-muted-foreground/70",
            "focus:border-primary/60 focus:outline-none focus:ring-4 focus:ring-primary/10"
          )}
        />
      </form>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <FilterSelect
          label="Категория"
          value={currentCategory}
          onChange={(v) => updateParam("categoryId", v === "" ? null : v)}
          options={[
            ...(isProvider ? [{ value: "", label: "✨ Моя лента" }] : []),
            { value: "all", label: "Все категории" },
            ...categories.map((c) => ({ value: c.id, label: c.name })),
          ]}
        />
        <FilterSelect
          label="Город"
          value={currentCity}
          onChange={(v) => updateParam("cityId", v)}
          options={[{ value: "", label: "Все города" }, ...cities.map((c) => ({ value: c.id, label: c.name }))]}
        />
        <FilterSelect
          label="Сортировка"
          value={currentSort}
          onChange={(v) => updateParam("sort", v === "new" ? null : v)}
          options={SORT_OPTIONS.map((s) => ({ value: s.value, label: s.label }))}
        />
      </div>

      {hasActiveFilters && (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={resetAll}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-3.5" />
            Сбросить фильтры
          </button>
        </div>
      )}
    </div>
  );
}

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

function FilterSelect({ label, value, onChange, options }: FilterSelectProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-11 w-full rounded-xl border border-border bg-background px-3 text-sm",
          "focus:border-primary/60 focus:outline-none focus:ring-4 focus:ring-primary/10"
        )}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
