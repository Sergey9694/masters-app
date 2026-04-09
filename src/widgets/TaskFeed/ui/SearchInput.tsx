"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useRef, useCallback, useTransition } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/shared/ui/input";

export function SearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
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
        
        startTransition(() => {
          if (pathname === targetPath) {
            router.replace(`?${query}`);
          } else if (value.trim()) {
            router.push(`${targetPath}?${query}`);
          }
        });
      }, 400);
    },
    [router, searchParams, pathname],
  );

  return (
    <div className="relative group">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
      <Input
        placeholder="Поиск по задачам..."
        defaultValue={searchParams.get("search") ?? ""}
        onChange={(e) => onInput(e.target.value)}
        className="pl-12 pr-12 h-14 rounded-3xl text-base font-medium shadow-xl shadow-black/20"
      />
      {isPending && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
        </div>
      )}
    </div>
  );
}
