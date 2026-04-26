export const dynamic = "force-dynamic";

import Link from "next/link";
import { Star, ShieldCheck, Briefcase, Banknote, Users, User as UserIcon } from "lucide-react";

import { db } from "@/shared/lib/db";
import { providerService } from "@/services/provider.service";
import { getCurrentUser } from "@/shared/lib/get-user";
import { cn } from "@/shared/lib/cn";

export const metadata = {
  title: "Специалисты — УслугиРядом",
};

interface PageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function ProvidersPage({ searchParams }: PageProps) {
  const { category: categoryParam } = await searchParams;

  const [currentUser, categories, { providers: allProviders }] = await Promise.all([
    getCurrentUser(),
    db.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    providerService.list({ categoryId: categoryParam, pageSize: 24 }),
  ]);

  // Скрываем собственный профиль из каталога
  const providers = currentUser?.providerProfile
    ? allProviders.filter((p) => p.id !== currentUser.providerProfile!.id)
    : allProviders;

  return (
    <div className="flex flex-col gap-6">
      <div className="page-section">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Специалисты</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Найдите исполнителя для любой задачи
        </p>
      </div>

      {/* Category filter */}
      <div className="page-section flex flex-wrap gap-2">
        <Link
          href="/providers"
          className={cn(
            "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
            !categoryParam
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          )}
        >
          Все
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/providers?category=${cat.id}`}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              categoryParam === cat.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            )}
          >
            {cat.name}
          </Link>
        ))}
      </div>

      {providers.length === 0 ? (
        <div className="page-section flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/60 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Users className="size-6" />
          </span>
          <div>
            <p className="text-base font-semibold">Специалисты не найдены</p>
            <p className="mt-1 text-sm text-muted-foreground">Попробуйте другую категорию</p>
          </div>
        </div>
      ) : (
        <div className="page-section grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {providers.map((provider, i) => (
            <ProviderCard key={provider.id} provider={provider} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

type ProviderItem = Awaited<ReturnType<typeof providerService.list>>["providers"][number];

function ProviderCard({ provider, index }: { provider: ProviderItem; index: number }) {
  const name =
    provider.user.displayName ||
    [provider.user.firstName, provider.user.lastName].filter(Boolean).join(" ") ||
    "Исполнитель";
  const initial = name.charAt(0).toUpperCase();
  const avgRating = (provider.rating ?? 0).toFixed(1);
  const reviewCount = provider._count.reviews;

  return (
    <Link
      href={`/providers/${provider.id}`}
      className="list-card group flex flex-col gap-4 rounded-2xl border border-border/60 bg-surface p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
      style={{ animationDelay: `${index * 0.04}s` }}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="relative size-14 shrink-0 overflow-hidden rounded-full bg-primary/10 ring-2 ring-background">
          {provider.user.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={provider.user.avatar} alt={name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xl font-bold text-primary">
              {initial}
            </div>
          )}
          {provider.isVerified && (
            <span className="absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-primary ring-2 ring-background">
              <ShieldCheck className="size-3 text-primary-foreground" />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-foreground transition-colors group-hover:text-primary">
            {name}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1 font-medium">
              <Star className="size-3.5 fill-warning text-warning" />
              {avgRating}
              <span className="text-xs font-normal text-muted-foreground">({reviewCount})</span>
            </span>
            {provider.experienceYears != null && provider.experienceYears > 0 && (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Briefcase className="size-3.5" />
                {provider.experienceYears} лет
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      {provider.bio && (
        <p className="line-clamp-2 text-sm text-muted-foreground">{provider.bio}</p>
      )}

      {/* Categories */}
      {provider.categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {provider.categories.slice(0, 3).map((c) => (
            <span
              key={c.category.id}
              className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground/80"
            >
              {c.category.name}
            </span>
          ))}
          {provider.categories.length > 3 && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              +{provider.categories.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      {provider.minPrice != null && (
        <div className="flex items-center justify-between border-t border-border/60 pt-3">
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Banknote className="size-4" />
            от {provider.minPrice.toLocaleString("ru-RU")} ₽
          </span>
          <span className="text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
            Смотреть профиль →
          </span>
        </div>
      )}
    </Link>
  );
}
