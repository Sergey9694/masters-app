import Link from "next/link";
import { MapPin, Clock, Star, BadgeCheck } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { formatSmartDate } from "@/shared/lib/date";

export type PriceUnit = "PER_HOUR" | "PER_SERVICE" | "PER_METER" | "NEGOTIABLE";
export type ListingStatus = "ACTIVE" | "PAUSED" | "ARCHIVED" | "MODERATION" | "REJECTED";

export interface ListingCardData {
  id: string;
  slug: string | null;
  title: string;
  description: string;
  images: string[];
  priceFrom: number | null;
  priceTo: number | null;
  priceUnit: PriceUnit | null;
  address: string | null;
  views: number;
  createdAt: Date;
  status: ListingStatus;
  provider: {
    id: string;
    rating: number;
    isVerified: boolean;
    user: { firstName: string; displayName: string | null; avatar: string | null };
  };
  category: { id: string; name: string; slug: string };
  city: { id: string; name: string; slug: string };
}

const PRICE_UNIT_LABEL: Record<PriceUnit, string> = {
  PER_HOUR: "/ час",
  PER_SERVICE: "за услугу",
  PER_METER: "/ м²",
  NEGOTIABLE: "",
};

function formatPrice(from: number | null, to: number | null, unit: PriceUnit | null): string {
  if (unit === "NEGOTIABLE" || (!from && !to)) return "Договорная";
  const label = unit ? PRICE_UNIT_LABEL[unit] : "";
  if (from && to) return `${from.toLocaleString("ru-RU")} – ${to.toLocaleString("ru-RU")} ₽ ${label}`.trim();
  if (from) return `от ${from.toLocaleString("ru-RU")} ₽ ${label}`.trim();
  if (to) return `до ${to.toLocaleString("ru-RU")} ₽ ${label}`.trim();
  return "Договорная";
}

const STATUS_STYLES: Record<ListingStatus, string> = {
  ACTIVE: "bg-success/15 text-success",
  PAUSED: "bg-muted text-muted-foreground",
  ARCHIVED: "bg-muted text-muted-foreground",
  MODERATION: "bg-warning/15 text-warning",
  REJECTED: "bg-destructive/15 text-destructive",
};

const STATUS_LABEL: Record<ListingStatus, string> = {
  ACTIVE: "Активно",
  PAUSED: "Приостановлено",
  ARCHIVED: "Архив",
  MODERATION: "На модерации",
  REJECTED: "Отклонено",
};

interface ListingCardProps {
  listing: ListingCardData;
  showStatus?: boolean;
}

export function ListingCard({ listing, showStatus = false }: ListingCardProps) {
  const href = `/listings/${listing.slug ?? listing.id}`;
  const cover = listing.images?.length ? listing.images[0] : null;
  const providerName = listing.provider.user.displayName || listing.provider.user.firstName;

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-surface",
        "transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5",
        cover && "sm:flex-row"
      )}
    >
      {cover && (
        <div className="relative aspect-video w-full shrink-0 overflow-hidden bg-muted sm:aspect-square sm:w-48">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cover}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {listing.category.name}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3" />
              {listing.city.name}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3" />
              {formatSmartDate(listing.createdAt)}
            </span>
          </div>
          {showStatus && (
            <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold", STATUS_STYLES[listing.status])}>
              {STATUS_LABEL[listing.status]}
            </span>
          )}
        </div>

        <div>
          <h3 className="line-clamp-2 text-lg font-semibold leading-tight text-foreground transition-colors group-hover:text-primary">
            {listing.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {listing.description}
          </p>
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
          <span className="text-base font-semibold text-foreground">
            {formatPrice(listing.priceFrom, listing.priceTo, listing.priceUnit)}
          </span>

          <div className="flex items-center gap-2">
            {listing.provider.user.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={listing.provider.user.avatar}
                alt={providerName}
                className="size-6 rounded-full object-cover"
              />
            ) : (
              <span className="flex size-6 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                {providerName[0]}
              </span>
            )}
            <span className="text-sm text-muted-foreground">{providerName}</span>
            {listing.provider.isVerified && (
              <BadgeCheck className="size-4 text-primary" />
            )}
            <span className="flex items-center gap-0.5 text-sm font-medium">
              <Star className="size-3.5 fill-warning text-warning" />
              {listing.provider.rating.toFixed(1)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
