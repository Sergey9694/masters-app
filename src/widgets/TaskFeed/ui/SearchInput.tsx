"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useRef, useCallback } from "react";
import { Search } from "lucide-react";
import { Input } from "@/shared/ui/input";

export function SearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onInput = useCallback(
    (value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const params = new URLSearchParams(searchParams?.toString() || "");
        
        if (value.trim()) {
          params.set("search", value.trim());
        } else {
          params.delete("search");
        }

        const query = params.toString();
        const targetPath = "/dashboard/feed";
        
        // If we are already on the feed, just replace params. 
        // If on dashboard, navigate to feed with params.
        if (pathname === targetPath) {
          router.replace(`?${query}`);
        } else if (value.trim()) {
          router.push(`${targetPath}?${query}`);
        }
      }, 350);
    },
    [router, searchParams, pathname],
  );

  return (
    <div className="relative group">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
      <Input
        placeholder="Поиск по названию или описанию..."
        defaultValue={searchParams.get("search") ?? ""}
        onChange={(e) => onInput(e.target.value)}
        className="pl-12 h-14 rounded-3xl text-base font-medium shadow-xl shadow-black/20"
      />
    </div>
  );
}
