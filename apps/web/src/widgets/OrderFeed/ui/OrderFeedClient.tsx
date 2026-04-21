"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { Loader2, SearchX, Zap } from "lucide-react";

import { OrderFeedCard } from "@/entities/order";
import { loadOrdersAction } from "../api/load-orders";
import type { OrderCardData } from "@/shared/types/domain";
import type { OrderSort } from "@/services/order.service";

interface Props {
  initialTasks: OrderCardData[];
  initialCursor: string | null;
  categoryId?: string;
  cityId?: string;
  search?: string;
  sort?: OrderSort;
  totalLabel: string;
  isDefaultFilter?: boolean;
}

export function OrderFeedClient({
  initialTasks,
  initialCursor,
  categoryId,
  cityId,
  search,
  sort,
  totalLabel,
  isDefaultFilter = false,
}: Props) {
  const [orders, setOrders] = useState(initialTasks);
  const [cursor, setCursor] = useState(initialCursor);
  const [isPending, startTransition] = useTransition();
  const loaderRef = useRef<HTMLDivElement>(null);

  const loadMore = () => {
    if (!cursor || isPending) return;
    startTransition(async () => {
      try {
        const res = await loadOrdersAction({ categoryId, cityId, search, sort, cursor });
        setOrders((prev) => {
          const existingIds = new Set(prev.map((t) => t.id));
          return [...prev, ...res.orders.filter((t) => !existingIds.has(t.id))];
        });
        setCursor(res.nextCursor);
      } catch (error) {
        console.error("Failed to load more orders:", error);
      }
    });
  };

  useEffect(() => {
    if (!cursor || isPending) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { threshold: 0.1, rootMargin: "200px" }
    );

    const current = loaderRef.current;
    if (current) observer.observe(current);

    return () => {
      if (current) observer.unobserve(current);
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor, isPending, categoryId, cityId, search, sort]);

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface px-8 py-20 text-center">
        <div className="mb-5 flex size-16 items-center justify-center rounded-full bg-muted">
          <SearchX className="size-7 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">
          {search ? "Ничего не найдено" : "Пока нет активных заказов"}
        </h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          {search
            ? "Попробуйте другой запрос или сбросьте фильтры"
            : "Заказы появятся здесь, как только клиенты их разместят"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Найдено: <span className="font-semibold text-foreground">{totalLabel}</span>
        </p>
        {isDefaultFilter && (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Zap className="size-3.5" />
            По вашим специальностям
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {orders.map((order) => (
          <OrderFeedCard key={order.id} order={order} />
        ))}
      </div>

      {cursor && (
        <div ref={loaderRef} className="flex justify-center py-10">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!cursor && orders.length > 0 && (
        <div className="py-8 text-center text-xs text-muted-foreground">
          Это все активные заказы
        </div>
      )}
    </div>
  );
}
