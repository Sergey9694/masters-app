import Link from "next/link";
import { Star, BadgeCheck, ArrowRight, Briefcase } from "lucide-react";

import { providerService } from "@/services/provider.service";
import { buttonVariants } from "@/shared/ui/button";
import { Container } from "@/shared/ui/container";
import { cn } from "@/shared/lib/cn";

/**
 * Лента топ-исполнителей (по рейтингу).
 * Серверный компонент: providerService.list с сортировкой rating desc.
 */
export async function TopProviders() {
  const { providers } = await providerService.list({ pageSize: 8 });

  if (!providers.length) return null;

  return (
    <section className="py-20 lg:py-24">
      <Container size="2xl">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Исполнители
            </span>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Топ специалистов этого месяца
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              Проверенные исполнители с высоким рейтингом и отзывами
            </p>
          </div>

          <Link
            href="/dashboard/feed"
            className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:opacity-80"
          >
            Смотреть все
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {providers.map((p) => {
            const name =
              p.user.displayName ||
              [p.user.firstName, p.user.lastName].filter(Boolean).join(" ") ||
              "Исполнитель";
            const categoryLabels = p.categories
              .slice(0, 2)
              .map((c) => c.category.name)
              .join(" · ");
            const initial = name.charAt(0).toUpperCase();
            const rating = p.rating ?? 0;

            return (
              <Link
                key={p.id}
                href={`/dashboard/provider/${p.id}`}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-surface transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              >
                {/* Top strip with rating */}
                <div className="flex items-center justify-between border-b border-border/60 bg-muted/40 px-5 py-3">
                  <div className="inline-flex items-center gap-1 text-sm font-semibold">
                    <Star className="size-4 fill-warning text-warning" />
                    <span>{rating.toFixed(1)}</span>
                  </div>
                  {p.isVerified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      <BadgeCheck className="size-3" />
                      Проверен
                    </span>
                  )}
                </div>

                {/* Body */}
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex items-start gap-3">
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-full bg-primary/10 ring-2 ring-background">
                      {p.user.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.user.avatar}
                          alt={name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-lg font-bold text-primary">
                          {initial}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold leading-tight">
                        {name}
                      </p>
                      {categoryLabels && (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {categoryLabels}
                        </p>
                      )}
                    </div>
                  </div>

                  {p.bio && (
                    <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {p.bio}
                    </p>
                  )}

                  <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-3 text-xs">
                    {p.experienceYears !== null && p.experienceYears > 0 ? (
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <Briefcase className="size-3" />
                        {p.experienceYears} лет
                      </span>
                    ) : (
                      <span />
                    )}
                    {p.minPrice && (
                      <span className="font-semibold text-foreground">
                        от {Math.round(p.minPrice)} ₽
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 flex justify-center sm:hidden">
          <Link
            href="/dashboard/feed"
            className={cn(buttonVariants({ variant: "outline" }), "gap-2")}
          >
            Смотреть все
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </Container>
    </section>
  );
}
