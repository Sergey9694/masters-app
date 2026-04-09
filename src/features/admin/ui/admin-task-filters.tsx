"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { TaskStatus } from "@prisma/client";
import { useTransition, useState, useRef } from "react";
import { Search, Loader2 } from "lucide-react";

interface AdminTaskFiltersProps {
  initialSearch?: string;
  initialStatus?: string;
  statusLabels: Record<TaskStatus, string>;
}

export function AdminTaskFilters({ initialSearch = "", initialStatus = "", statusLabels }: AdminTaskFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(initialSearch);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = (value: string) => {
    setSearchValue(value);
    
    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) {
        params.set("search", value.trim());
      } else {
        params.delete("search");
      }
      params.set("page", "1");
      
      startTransition(() => {
        router.push(`?${params.toString()}`, { scroll: false });
      });
    }, 450);
  };

  const updateStatus = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (status) {
      params.set("status", status);
    } else {
      params.delete("status");
    }
    params.set("page", "1");
    
    startTransition(() => {
      router.push(`?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <div className="flex gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Живой поиск по названию, описанию или клиенту..."
          className="w-full bg-[#16162a] border border-white/10 rounded-xl pl-11 pr-11 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-all shadow-inner"
        />
        {isPending && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
          </div>
        )}
      </div>

      <select
        defaultValue={initialStatus}
        onChange={(e) => updateStatus(e.target.value)}
        className="bg-[#16162a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 appearance-none min-w-[160px] cursor-pointer"
      >
        <option value="">Все статусы</option>
        {Object.entries(statusLabels).map(([key, val]) => (
          <option key={key} value={key}>{val}</option>
        ))}
      </select>
    </div>
  );
}
