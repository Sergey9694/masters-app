export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  Star,
  ShieldCheck,
  Briefcase,
  Banknote,
  MessageSquare,
  User as UserIcon,
  ChevronRight,
} from "lucide-react";

import { db } from "@/shared/lib/db";
import { getCurrentUser } from "@/shared/lib/get-user";
import { cn } from "@/shared/lib/cn";
import { formatSmartDate } from "@/shared/lib/date";
import { OrderGalleryLight } from "@/features/order-view/ui/OrderGalleryLight";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProviderProfilePage({ params }: PageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const provider = await db.providerProfile.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          displayName: true,
          avatar: true,
        },
      },
      categories: {
        include: { category: { select: { name: true } } },
      },
      reviews: {
        include: {
          author: { select: { firstName: true, avatar: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!provider) notFound();

  const name =
    provider.user.displayName ||
    [provider.user.firstName, provider.user.lastName].filter(Boolean).join(" ") ||
    "Исполнитель";
  const initial = name.charAt(0).toUpperCase();
  const avgRating = (provider.rating ?? 0).toFixed(1);

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumbs */}
      <nav className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Главная</Link>
        <ChevronRight className="size-3.5" />
        <Link href="/orders" className="hover:text-foreground">Заказы</Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">{name}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Left column */}
        <div className="flex flex-col gap-6">
          {/* Hero card */}
          <section className="rounded-2xl border border-border/60 bg-surface p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="relative size-20 shrink-0 overflow-hidden rounded-full bg-primary/10 ring-2 ring-background">
                {provider.user.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={provider.user.avatar}
                    alt={name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-primary">
                    {initial}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="wrap-anywhere text-2xl font-semibold leading-tight">
                    {name}
                  </h1>
                  {provider.isVerified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                      <ShieldCheck className="size-3.5" />
                      Проверен
                    </span>
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
              </div>
            </div>

            {provider.bio && (
              <p className="mt-5 wrap-anywhere whitespace-pre-line border-t border-border/60 pt-5 text-sm leading-relaxed text-foreground">
                {provider.bio}
              </p>
            )}
          </section>

          {/* Portfolio */}
          {provider.portfolio.length > 0 && (
            <section className="rounded-2xl border border-border/60 bg-surface p-6">
              <h2 className="mb-4 text-base font-semibold">
                Портфолио
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({provider.portfolio.length})
                </span>
              </h2>
              <OrderGalleryLight
                images={provider.portfolio}
                title={`Портфолио — ${name}`}
              />
            </section>
          )}

          {/* Reviews */}
          <section className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between">
              <h2 className="text-base font-semibold">
                Отзывы
              </h2>
              <span className="text-sm text-muted-foreground">
                {provider.reviews.length}
              </span>
            </div>

            {provider.reviews.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-muted/30 px-8 py-12 text-center">
                <MessageSquare className="size-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Пока нет отзывов</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {provider.reviews.map((review) => (
                  <article
                    key={review.id}
                    className="rounded-2xl border border-border/60 bg-surface p-5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 shrink-0 overflow-hidden rounded-full bg-muted">
                          {review.author.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={review.author.avatar}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                              <UserIcon className="size-4" />
                            </div>
                          )}
                        </div>
                        <span className="text-sm font-semibold">
                          {review.author.firstName}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-0.5">
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
                    </div>
                    {review.text && (
                      <p className="mt-3 wrap-anywhere text-sm leading-relaxed text-foreground">
                        {review.text}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatSmartDate(review.createdAt)}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right sidebar */}
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
              {provider.experienceYears != null && provider.experienceYears > 0 && (
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Опыт</dt>
                  <dd className="font-semibold">{provider.experienceYears} лет</dd>
                </div>
              )}
              {provider.minPrice != null && (
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Цена от</dt>
                  <dd className="font-semibold">
                    {provider.minPrice.toLocaleString("ru-RU")} ₽
                  </dd>
                </div>
              )}
            </dl>
          </section>
        </aside>
      </div>
    </div>
  );
}
