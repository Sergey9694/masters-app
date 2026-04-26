export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/shared/lib/get-user";
import {
  Star,
  ShieldCheck,
  Briefcase,
  Banknote,
  MessageSquare,
  User as UserIcon,
  ChevronRight,
  MapPin,
  Clock,
  Package,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

import { db } from "@/shared/lib/db";
import { listingService } from "@/services/listing.service";
import { cn } from "@/shared/lib/cn";
import { formatSmartDate } from "@/shared/lib/date";
import { OrderGalleryLight } from "@/features/order-view/ui/OrderGalleryLight";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ reviews?: string }>;
}

export default async function ProviderProfilePage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { reviews: reviewFilter } = await searchParams;

  const [currentUser, [provider, listings]] = await Promise.all([
    getCurrentUser(),
    Promise.all([
    db.providerProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: { firstName: true, lastName: true, displayName: true, avatar: true },
        },
        categories: {
          include: { category: { select: { name: true } } },
        },
        reviews: {
          include: {
            author: { select: { firstName: true, displayName: true, avatar: true } },
            order: { select: { title: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
      listingService.getByProvider(id),
    ]),
  ]);

  if (!provider) notFound();

  const isOwnProfile = currentUser?.providerProfile?.id === id;
  // Кнопка видна только залогиненным заказчикам (не самому мастеру)
  const canInvite = !!currentUser && !isOwnProfile;

  const name =
    provider.user.displayName ||
    [provider.user.firstName, provider.user.lastName].filter(Boolean).join(" ") ||
    "Исполнитель";
  const initial = name.charAt(0).toUpperCase();
  const avgRating = (provider.rating ?? 0).toFixed(1);

  const positiveReviews = provider.reviews.filter((r) => r.rating >= 4);
  const negativeReviews = provider.reviews.filter((r) => r.rating <= 2);
  const displayedReviews =
    reviewFilter === "positive"
      ? positiveReviews
      : reviewFilter === "negative"
        ? negativeReviews
        : provider.reviews;

  return (
    <div className="flex flex-col gap-6">
      <nav className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Главная</Link>
        <ChevronRight className="size-3.5" />
        <Link href="/providers" className="hover:text-foreground">Специалисты</Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">{name}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="flex flex-col gap-6">
          {/* Hero */}
          <section className="rounded-2xl border border-border/60 bg-surface p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="relative size-20 shrink-0 overflow-hidden rounded-full bg-primary/10 ring-2 ring-background">
                {provider.user.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={provider.user.avatar} alt={name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-primary">
                    {initial}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                {/* Имя + кнопка справа на десктопе */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="wrap-anywhere text-2xl font-semibold leading-tight">{name}</h1>
                      {provider.isVerified && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                          <ShieldCheck className="size-3.5" />
                          Проверен
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Кнопка справа — только на sm+ */}
                  {canInvite && (
                    <Link
                      href={`/orders/new?provider=${id}`}
                      className="hidden shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:brightness-110 sm:inline-flex"
                    >
                      Предложить задачу
                    </Link>
                  )}
                  {isOwnProfile && (
                    <Link
                      href="/my-listings"
                      className="hidden shrink-0 items-center gap-2 rounded-xl border border-border/60 bg-muted px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted/80 sm:inline-flex"
                    >
                      Управлять объявлениями
                    </Link>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                  <div className="inline-flex items-center gap-1.5 font-semibold">
                    <Star className="size-4 fill-warning text-warning" />
                    {avgRating}
                    <span className="text-xs font-normal text-muted-foreground">
                      ({provider.reviews.length} отзывов)
                    </span>
                  </div>
                  {provider.experienceYears != null && provider.experienceYears > 0 && (
                    <div className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <Briefcase className="size-4" />
                      {provider.experienceYears} лет опыта
                    </div>
                  )}
                  {provider.minPrice != null && (
                    <div className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <Banknote className="size-4" />
                      от {provider.minPrice.toLocaleString("ru-RU")} ₽
                    </div>
                  )}
                </div>

                {provider.categories.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {provider.categories.map((c) => (
                      <span
                        key={c.categoryId}
                        className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground/80"
                      >
                        {c.category.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Кнопка на мобильных — полная ширина под категориями */}
                {canInvite && (
                  <Link
                    href={`/orders/new?provider=${id}`}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:brightness-110 sm:hidden"
                  >
                    Предложить задачу
                  </Link>
                )}
                {isOwnProfile && (
                  <Link
                    href="/my-listings"
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border/60 bg-muted px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted/80 sm:hidden"
                  >
                    Управлять объявлениями
                  </Link>
                )}
              </div>
            </div>

            {provider.bio && (
              <p className="mt-5 wrap-anywhere whitespace-pre-line border-t border-border/60 pt-5 text-sm leading-relaxed text-foreground">
                {provider.bio}
              </p>
            )}
          </section>

          {/* Listings */}
          {listings.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-base font-semibold">
                Услуги
                <span className="ml-2 text-sm font-normal text-muted-foreground">({listings.length})</span>
              </h2>
              <div className="flex flex-col gap-3">
                {listings.map((listing) => (
                  <ListingCompactCard key={listing.id} listing={listing} />
                ))}
              </div>
            </section>
          )}

          {/* Portfolio */}
          {provider.portfolio.length > 0 && (
            <section className="rounded-2xl border border-border/60 bg-surface p-6">
              <h2 className="mb-4 text-base font-semibold">
                Портфолио
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({provider.portfolio.length})
                </span>
              </h2>
              <OrderGalleryLight images={provider.portfolio} title={`Портфолио — ${name}`} />
            </section>
          )}

          {/* Reviews */}
          <section className="flex flex-col gap-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-base font-semibold">Отзывы</h2>
              <span className="text-sm text-muted-foreground">{provider.reviews.length}</span>
            </div>

            {provider.reviews.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <ReviewFilterChip
                  href={`/providers/${id}`}
                  label="Все"
                  count={provider.reviews.length}
                  active={!reviewFilter}
                />
                <ReviewFilterChip
                  href={`/providers/${id}?reviews=positive`}
                  label="Положительные"
                  count={positiveReviews.length}
                  active={reviewFilter === "positive"}
                  icon={<ThumbsUp className="size-3.5" />}
                />
                {negativeReviews.length > 0 && (
                  <ReviewFilterChip
                    href={`/providers/${id}?reviews=negative`}
                    label="Отрицательные"
                    count={negativeReviews.length}
                    active={reviewFilter === "negative"}
                    icon={<ThumbsDown className="size-3.5" />}
                  />
                )}
              </div>
            )}

            {displayedReviews.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-muted/30 px-8 py-12 text-center">
                <MessageSquare className="size-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  {provider.reviews.length === 0 ? "Пока нет отзывов" : "Нет отзывов в этой категории"}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {displayedReviews.map((review) => (
                  <article key={review.id} className="rounded-2xl border border-border/60 bg-surface p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="size-9 shrink-0 overflow-hidden rounded-full bg-muted">
                          {review.author.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={review.author.avatar} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                              <UserIcon className="size-4" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">
                            {review.author.displayName || review.author.firstName}
                          </p>
                          {review.order?.title && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {review.order.title}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star
                              key={n}
                              className={cn(
                                "size-3.5",
                                n <= review.rating
                                  ? "fill-warning text-warning"
                                  : "text-muted-foreground/30"
                              )}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">{formatSmartDate(review.createdAt)}</p>
                      </div>
                    </div>
                    {review.text && (
                      <p className="mt-3 wrap-anywhere text-sm leading-relaxed text-foreground">
                        {review.text}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="flex flex-col gap-4">
          <section className="rounded-2xl border border-border/60 bg-surface p-5">
            <h2 className="mb-4 text-sm font-semibold">Статистика</h2>
            <dl className="flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Рейтинг</dt>
                <dd className="font-semibold">
                  <span className="inline-flex items-center gap-1">
                    <Star className="size-3.5 fill-warning text-warning" />
                    {avgRating}
                  </span>
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Отзывов</dt>
                <dd className="font-semibold">{provider.reviews.length}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Объявлений</dt>
                <dd className="font-semibold">{listings.length}</dd>
              </div>
              {provider.experienceYears != null && provider.experienceYears > 0 && (
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Опыт</dt>
                  <dd className="font-semibold">{provider.experienceYears} лет</dd>
                </div>
              )}
              {provider.minPrice != null && (
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Цена от</dt>
                  <dd className="font-semibold">{provider.minPrice.toLocaleString("ru-RU")} ₽</dd>
                </div>
              )}
            </dl>
          </section>

        </aside>
      </div>
    </div>
  );
}

type ProviderListing = Awaited<ReturnType<typeof listingService.getByProvider>>[number];

function ListingCompactCard({ listing }: { listing: ProviderListing }) {
  const href = `/listings/${listing.slug ?? listing.id}`;
  const cover = listing.images?.[0] ?? null;
  const price = formatListingPrice(listing.priceFrom, listing.priceTo, listing.priceUnit);

  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-2xl border border-border/60 bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
    >
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={cover}
          alt={listing.title}
          className="size-16 shrink-0 rounded-xl object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Package className="size-6" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
            {listing.category.name}
          </span>
          {listing.address && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3" />
              {listing.city.name}
            </span>
          )}
        </div>
        <p className="mt-1 line-clamp-1 text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
          {listing.title}
        </p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-foreground">{price}</span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3" />
            {formatSmartDate(listing.createdAt)}
          </span>
        </div>
      </div>
    </Link>
  );
}

function ReviewFilterChip({
  href,
  label,
  count,
  active,
  icon,
}: {
  href: string;
  label: string;
  count: number;
  active: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
      )}
    >
      {icon}
      {label}
      <span
        className={cn(
          "rounded-full px-1.5 py-0.5 text-xs",
          active ? "bg-primary-foreground/20" : "bg-background"
        )}
      >
        {count}
      </span>
    </Link>
  );
}

type PriceUnit = "PER_HOUR" | "PER_SERVICE" | "PER_METER" | "NEGOTIABLE" | null;

function formatListingPrice(from: number | null, to: number | null, unit: PriceUnit): string {
  if (unit === "NEGOTIABLE" || (!from && !to)) return "Договорная";
  const label = unit === "PER_HOUR" ? "/ час" : unit === "PER_METER" ? "/ м²" : unit === "PER_SERVICE" ? "за услугу" : "";
  if (from && to) return `${from.toLocaleString("ru-RU")} – ${to.toLocaleString("ru-RU")} ₽ ${label}`.trim();
  if (from) return `от ${from.toLocaleString("ru-RU")} ₽ ${label}`.trim();
  return "Договорная";
}
