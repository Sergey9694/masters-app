"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useCallback } from "react";
import { Search } from "lucide-react";
import { Input } from "@/shared/ui/input";

export function SearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onInput = useCallback(
    (value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (value.trim()) {
          params.set("search", value.trim());
        } else {
          params.delete("search");
        }
        router.replace(`?${params.toString()}`);
      }, 350);
    },
    [router, searchParams],
  );

  return (
    <div className="relative group">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
      <Input
        placeholder="Поиск по названию или описанию..."
        defaultValue={searchParams.get("search") ?? ""}
        onChange={(e) => onInput(e.target.value)}
        className="pl-12 h-14 bg-white/50 dark:bg-slate-900/50 border-white/20 dark:border-slate-800 rounded-3xl text-base font-medium shadow-xl shadow-black/5"
      />
    </div>
  );
}
