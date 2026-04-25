import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Star, BadgeCheck, Clock, Eye, ArrowLeft } from "lucide-react";

import { listingService } from "@/services/listing.service";
import { formatSmartDate } from "@/shared/lib/date";

interface ListingDetailPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: ListingDetailPageProps) {
  const { slug } = await params;
  const listing = await listingService.getById(slug);
  if (!listing) return { title: "Объявление не найдено" };
  return {
    title: `${listing.title} — УслугиРядом`,
    description: listing.description.slice(0, 155),
  };
}

const PRICE_UNIT_LABEL: Record<string, string> = {
  PER_HOUR: "/ час",
  PER_SERVICE: "за услугу",
  PER_METER: "/ м²",
  NEGOTIABLE: "",
};

function formatPrice(from: number | null, to: number | null, unit: string | null): string {
  if (unit === "NEGOTIABLE" || (!from && !to)) return "Договорная";
  const label = unit ? PRICE_UNIT_LABEL[unit] ?? "" : "";
  if (from && to) return `${from.toLocaleString("ru-RU")} – ${to.toLocaleString("ru-RU")} ₽ ${label}`.trim();
  if (from) return `от ${from.toLocaleString("ru-RU")} ₽ ${label}`.trim();
  if (to) return `до ${to.toLocaleString("ru-RU")} ₽ ${label}`.trim();
  return "Договорная";
}

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  const { slug } = await params;
  const listing = await listingService.getById(slug);
  if (!listing) notFound();

  const providerName =
    listing.provider.user.displayName ||
    `${listing.provider.user.firstName}${listing.provider.user.lastName ? ` ${listing.provider.user.lastName}` : ""}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="page-section">
        <Link
          href="/listings"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Каталог услуг
        </Link>
      </div>

      <div className="page-section grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-5 lg:col-span-2">
          {listing.images.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {listing.images.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={src}
                  alt={listing.title}
                  className="h-56 w-auto shrink-0 rounded-2xl object-cover"
                  loading={i === 0 ? "eager" : "lazy"}
                />
              ))}
            </div>
          )}

          <div className="rounded-2xl border border-border/60 bg-surface p-6">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {listing.category.name}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3" />
                {listing.city.name}
              </span>
              {listing.address && (
                <span className="text-xs text-muted-foreground">{listing.address}</span>
              )}
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="size-3" />
                {formatSmartDate(listing.createdAt)}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Eye className="size-3" />
                {listing.views} просмотров
              </span>
            </div>

            <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-3xl">
              {listing.title}
            </h1>

            <p className="mt-1 text-2xl font-semibold text-primary">
              {formatPrice(listing.priceFrom, listing.priceTo, listing.priceUnit)}
            </p>

            <div className="mt-6 border-t border-border/60 pt-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Описание
              </h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
                {listing.description}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-border/60 bg-surface p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Исполнитель
            </h2>

            <div className="flex items-center gap-3">
              {listing.provider.user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={listing.provider.user.avatar}
                  alt={providerName}
                  className="size-14 rounded-full object-cover"
                />
              ) : (
                <span className="flex size-14 items-center justify-center rounded-full bg-muted text-xl font-bold text-muted-foreground">
                  {providerName[0]}
                </span>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <span className="truncate">{providerName}</span>
                  {listing.provider.isVerified && (
                    <BadgeCheck className="size-4 shrink-0 text-primary" />
                  )}
                </div>
                <div className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                  <Star className="size-3.5 fill-warning text-warning" />
                  <span className="font-medium text-foreground">{listing.provider.rating.toFixed(1)}</span>
                </div>
              </div>
            </div>

            <Link
              href={`/orders/new?providerId=${listing.provider.id}`}
              className="mt-5 flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:brightness-110"
            >
              Разместить заказ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
