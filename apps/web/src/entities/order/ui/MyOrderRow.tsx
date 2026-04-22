import Link from "next/link";
import { Banknote, MapPin, MessageSquare, Clock, CheckCircle2 } from "lucide-react";

import { cn } from "@/shared/lib/cn";
import { formatSmartDate } from "@/shared/lib/date";
import { OrderStatusPill } from "./OrderStatusPill";

export interface MyOrderRowData {
  id: string;
  href: string;
  title: string;
  category: string;
  status: string;
  budget: number | null;
  price?: number | null;
  address: string | null;
  createdAt: Date;
  proposalsCount?: number;
  isChosen?: boolean;
}

export function MyOrderRow({ data }: { data: MyOrderRowData }) {
  const amount = data.price ?? data.budget;

  return (
    <Link
      href={data.href}
      className={cn(
        "group flex flex-col gap-3 rounded-2xl border border-border/60 bg-surface p-4",
        "transition-all hover:border-primary/40 hover:shadow-md"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-foreground/80">
              {data.category}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" />
              {formatSmartDate(data.createdAt)}
            </span>
          </div>
          <h3 className="mt-1.5 line-clamp-2 text-base font-semibold leading-tight transition-colors group-hover:text-primary">
            {data.title}
          </h3>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <OrderStatusPill status={data.status} />
          {data.isChosen && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-success">
              <CheckCircle2 className="size-3" />
              Вас выбрали
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
        <div className="inline-flex items-center gap-1.5 font-semibold">
          <Banknote className="size-4 text-success" />
          {amount ? `${amount.toLocaleString("ru-RU")} ₽` : "Договорная"}
        </div>

        {data.address && (
          <div className="inline-flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="size-4" />
            <span className="line-clamp-1">{data.address}</span>
          </div>
        )}

        {typeof data.proposalsCount === "number" && data.proposalsCount > 0 && (
          <div className="ml-auto inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <MessageSquare className="size-3.5" />
            {data.proposalsCount}
          </div>
        )}
      </div>
    </Link>
  );
}
