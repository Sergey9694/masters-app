"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition, useState, useEffect } from "react";
import { Search, X } from "lucide-react";

import { cn } from "@/shared/lib/cn";

interface Option {
  id: string;
  name: string;
  slug: string;
}

interface OrdersFiltersProps {
  categories: Option[];
  cities: Option[];
  isProvider?: boolean;
  initialCityId?: string;
  initialCategoryId?: string;
}

const SORT_OPTIONS = [
  { value: "new", label: "Сначала новые" },
  { value: "budget_desc", label: "Бюджет: по убыванию" },
  { value: "budget_asc", label: "Бюджет: по возрастанию" },
];

export function OrdersFilters({ 
  categories, 
  cities, 
  isProvider,
  initialCityId,
  initialCategoryId 
}: OrdersFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const currentCategory = initialCategoryId || searchParams.get("categoryId") || "";
  const currentCity = initialCityId || searchParams.get("cityId") || "";
  const currentSort = searchParams.get("sort") || "new";
  const currentSearch = searchParams.get("search") || "";

  const [searchDraft, setSearchDraft] = useState(currentSearch);

  useEffect(() => {
    setSearchDraft(currentSearch);
  }, [currentSearch]);

  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Handle path-based navigation for SEO
    if (key === "cityId" || key === "categoryId") {
      const cityId = key === "cityId" ? value : currentCity;
      const categoryId = key === "categoryId" ? value : currentCategory;
      
      const city = cities.find(c => c.id === cityId);
      const category = categories.find(c => c.id === categoryId);
      
      let newPath = "/orders";
      const finalParams = new URLSearchParams();

      // Preservation of search and sort
      if (params.get("search")) finalParams.set("search", params.get("search")!);
      if (params.get("sort")) finalParams.set("sort", params.get("sort")!);
      
      if (city) {
        newPath += `/${city.slug}`;
        if (category) {
          newPath += `/${category.slug}`;
        } else if (categoryId === "all") {
          finalParams.set("categoryId", "all");
        }
      } else {
        // If no city, we must use query params for categories
        if (categoryId === "all") {
          finalParams.set("categoryId", "all");
        } else if (category) {
          finalParams.set("categoryId", category.id);
        }
      }
      
      const queryString = finalParams.toString();
      const url = queryString ? `${newPath}?${queryString}` : newPath;
      
      startTransition(() => {
        router.push(url);
      });
      return;
    }

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
      router.push("/orders");
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
