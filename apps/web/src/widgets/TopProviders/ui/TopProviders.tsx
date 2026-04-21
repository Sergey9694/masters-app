import Link from "next/link";
import { Star, BadgeCheck, ArrowRight } from "lucide-react";

import { providerService } from "@/services/provider.service";
import { buttonVariants } from "@/shared/ui/button";
import { cn } from "@/shared/lib/cn";

/**
 * Лента топ-исполнителей (по рейтингу) для лендинга.
 * Серверный компонент — подтягивает через providerService.list с сортировкой rating desc.
 */
export async function TopProviders() {
  const { providers } = await providerService.list({ pageSize: 8 });

  if (!providers.length) return null;

  return (
    <section className="py-16 lg:py-20">
      <div className="flex items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Топ исполнителей
          </h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Специалисты с высоким рейтингом и проверенными отзывами
          </p>
        </div>

        <Link
          href="/dashboard/feed"
          className="group hidden shrink-0 items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
        >
          Все заказы
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {providers.map((p) => {
          const name =
            p.user.displayName ||
            [p.user.firstName, p.user.lastName].filter(Boolean).join(" ") ||
            "Исполнитель";
          const categoryLabels = p.categories
            .slice(0, 2)
            .map((c) => c.category.name)
            .join(" · ");

          return (
            <Link
              key={p.id}
              href={`/dashboard/provider/${p.id}`}
              className="group flex flex-col gap-4 rounded-lg border border-border/60 bg-surface p-5 transition-all hover:border-primary/30 hover:shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="relative size-12 shrink-0 overflow-hidden rounded-full bg-muted">
                  {p.user.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.user.avatar}
                      alt={name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-muted-foreground">
                      {name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-semibold">{name}</span>
                    {p.isVerified && (
                      <BadgeCheck className="size-4 shrink-0 text-primary" />
                    )}
                  </div>
                  {categoryLabels && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {categoryLabels}
                    </p>
                  )}
                </div>
              </div>

              {p.bio && (
                <p className="line-clamp-2 text-xs text-muted-foreground">{p.bio}</p>
              )}

              <div className="mt-auto flex items-center justify-between text-xs">
                <div className="inline-flex items-center gap-1 font-medium">
                  <Star className="size-3.5 fill-warning text-warning" />
                  <span>{(p.rating ?? 0).toFixed(1)}</span>
                </div>
                {p.minPrice && (
                  <span className="text-muted-foreground">
                    от {Math.round(p.minPrice)} ₽
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-6 flex justify-center sm:hidden">
        <Link
          href="/dashboard/feed"
          className={cn(buttonVariants({ variant: "outline" }), "gap-2")}
        >
          Все заказы
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}
