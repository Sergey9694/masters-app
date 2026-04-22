import Link from "next/link";
import { MapPin, MessageSquare, Clock, Banknote } from "lucide-react";

import type { OrderCardData } from "@/shared/types/domain";
import { formatSmartDate } from "@/shared/lib/date";
import { cn } from "@/shared/lib/cn";

interface OrderFeedCardProps {
  order: OrderCardData;
  href?: string;
}

/**
 * Карточка заказа в ленте (YouDo-стиль, светлая тема).
 * Серверный компонент: серверный рендер без клиентских хуков.
 * Мобайл: вертикальная, десктоп: горизонтальная (флекс с фото слева).
 */
export function OrderFeedCard({ order, href }: OrderFeedCardProps) {
  const target = href ?? `/orders/${order.id}`;
  const hasImage = order.images && order.images.length > 0;
  const cover = hasImage ? order.images[0] : null;

  return (
    <Link
      href={target}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-surface",
        "transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5",
        "sm:flex-row"
      )}
    >
      {cover && (
        <div className="relative aspect-video w-full shrink-0 overflow-hidden bg-muted sm:aspect-square sm:w-56">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cover}
            alt={order.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            {order.category.name}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3" />
            {order.city.name}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3" />
            {formatSmartDate(order.createdAt)}
          </span>
        </div>

        <div>
          <h3 className="line-clamp-2 wrap-break-word text-lg font-semibold leading-tight text-foreground transition-colors group-hover:text-primary">
            {order.title}
          </h3>
          <p className="mt-1.5 line-clamp-2 wrap-break-word text-sm text-muted-foreground">
            {order.description}
          </p>
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
          <div className="inline-flex items-center gap-1.5 text-base font-semibold text-foreground">
            <Banknote className="size-4 text-success" />
            {order.budget
              ? `${order.budget.toLocaleString("ru-RU")} ₽`
              : "Договорная"}
          </div>

          {order.proposalCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              <MessageSquare className="size-3" />
              {order.proposalCount}{" "}
              {order.proposalCount === 1 ? "отклик" : "откликов"}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
