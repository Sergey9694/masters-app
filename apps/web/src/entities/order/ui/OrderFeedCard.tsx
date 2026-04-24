import Link from "next/link";
import { MapPin, MessageSquare, Clock, Banknote, CheckCircle2 } from "lucide-react";

import type { OrderCardData } from "@/shared/types/domain";
import { formatSmartDate } from "@/shared/lib/date";
import { cn } from "@/shared/lib/cn";
import { OrderStatusPill } from "./OrderStatusPill";

interface OrderFeedCardProps {
  order: OrderCardData;
  href?: string;
  /** "my" — личный кабинет: статус, цена исполнителя, без изображения и описания */
  variant?: "feed" | "my";
  /** Цена из отклика исполнителя (только для variant="my") */
  price?: number | null;
  /** Показать бейдж «Вас выбрали» (только для variant="my") */
  isChosen?: boolean;
}

export function OrderFeedCard({ order, href, variant = "feed", price, isChosen }: OrderFeedCardProps) {
  const target = href ?? `/orders/${order.city.slug}/${order.category.slug}/${order.slug || order.id}`;
  const isMy = variant === "my";
  const amount = isMy ? (price ?? order.budget) : order.budget;
  const cover = !isMy && order.images?.length ? order.images[0] : null;

  return (
    <Link
      href={target}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-surface",
        "transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5",
        !isMy && cover && "sm:flex-row"
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
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {order.category.name}
            </span>
            {isMy && order.orderNumber && (
              <span className="text-xs font-medium text-muted-foreground/60">
                №{order.orderNumber}
              </span>
            )}
            {!isMy && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3" />
                {order.city.name}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3" />
              {formatSmartDate(order.createdAt)}
            </span>
          </div>

          {isMy && (
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <OrderStatusPill status={order.status} />
              {isChosen && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-success">
                  <CheckCircle2 className="size-3" />
                  Вас выбрали
                </span>
              )}
            </div>
          )}
        </div>

        <div>
          <h3 className="line-clamp-2 wrap-anywhere text-lg font-semibold leading-tight text-foreground transition-colors group-hover:text-primary">
            {order.title}
          </h3>
          {!isMy && order.description && (
            <p className="mt-1.5 line-clamp-2 wrap-anywhere text-sm text-muted-foreground">
              {order.description}
            </p>
          )}
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-base font-semibold text-foreground">
              <Banknote className="size-4 text-success" />
              {amount ? `${amount.toLocaleString("ru-RU")} ₽` : "Договорная"}
            </div>
            {isMy && order.address && (
              <div className="inline-flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-3.5 shrink-0" />
                <span className="line-clamp-1 wrap-anywhere">{order.address}</span>
              </div>
            )}
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
