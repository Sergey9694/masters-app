"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

/**
 * Поиск в шапке. Submit → /orders?search=...
 * Полноценный автокомплит добавим в 5.4.
 */
export function HeaderSearch() {
  const router = useRouter();
  const [value, setValue] = React.useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (q.length < 2) return;
    router.push(`/orders?search=${encodeURIComponent(q)}`);
  }

  return (
    <form onSubmit={onSubmit} className="relative w-full">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Поиск заказов и услуг..."
        className="h-10 w-full rounded-xl border border-border/40 bg-muted pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors hover:border-border hover:bg-muted/80 focus:border-primary/40 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/10"
      />
    </form>
  );
}
