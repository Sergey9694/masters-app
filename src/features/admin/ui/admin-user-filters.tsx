"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Role } from "@/shared/types/auth";
import { useTransition } from "react";

interface AdminUserFiltersProps {
  initialSearch?: string;
  initialRole?: string;
}

export function AdminUserFilters({ initialSearch = "", initialRole = "" }: AdminUserFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateFilters = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(name, value);
    } else {
      params.delete(name);
    }
    params.set("page", "1"); // Reset to first page on filter change
    
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  return (
    <div className={`flex gap-3 transition-opacity ${isPending ? "opacity-50" : ""}`}>
      <input
        type="text"
        defaultValue={initialSearch}
        placeholder="Поиск по имени..."
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            updateFilters("search", (e.target as HTMLInputElement).value);
          }
        }}
        className="flex-1 bg-[#1a1a2e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50"
      />
      <select
        defaultValue={initialRole}
        onChange={(e) => updateFilters("role", e.target.value)}
        className="bg-[#1a1a2e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
      >
        <option value="">Все роли</option>
        <option value="USER">USER</option>
        <option value="MASTER">MASTER</option>
        <option value="ADMIN">ADMIN</option>
      </select>
    </div>
  );
}
