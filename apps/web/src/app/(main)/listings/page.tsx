import { Suspense } from "react";
import Link from "next/link";
import { SearchX } from "lucide-react";

import { db } from "@/shared/lib/db";
import { listingService } from "@/services/listing.service";
import { ListingCard } from "@/entities/listing";
import { DEFAULT_PAGE_SIZE } from "@/shared/lib/constants";
import { cn } from "@/shared/lib/cn";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Каталог услуг — УслугиРядом",
  description: "Найдите специалиста в любой категории рядом с вами.",
};

interface ListingsPageProps {
  searchParams: Promise<{
    categoryId?: string;
    cityId?: string;
    page?: string;
  }>;
}

export default async function ListingsPage({ searchParams }: ListingsPageProps) {
  const { categoryId, cityId, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [categories, cities] = await Promise.all([
    db.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    }),
    db.city.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="page-section">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Каталог услуг</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Найдите специалиста в любой категории
        </p>
      </div>

      <div className="page-section flex flex-wrap gap-2">
        <FilterChip href="/listings" active={!categoryId}>Все</FilterChip>
        {categories.map((c) => (
          <FilterChip
            key={c.id}
            href={`/listings?categoryId=${c.id}${cityId ? `&cityId=${cityId}` : ""}`}
            active={categoryId === c.id}
          >
            {c.name}
          </FilterChip>
        ))}
      </div>

      {cities.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <FilterChip href={`/listings${categoryId ? `?categoryId=${categoryId}` : ""}`} active={!cityId}>
            Все города
          </FilterChip>
          {cities.map((c) => (
            <FilterChip
              key={c.id}
              href={`/listings?cityId=${c.id}${categoryId ? `&categoryId=${categoryId}` : ""}`}
              active={cityId === c.id}
            >
              {c.name}
            </FilterChip>
          ))}
        </div>
      )}

      <Suspense
        key={`${categoryId ?? ""}-${cityId ?? ""}-${page}`}
        fallback={<ListingsSkeleton />}
      >
        <ListingsList categoryId={categoryId} cityId={cityId} page={page} />
      </Suspense>
    </div>
  );
}

async function ListingsList({
  categoryId,
  cityId,
  page,
}: {
  categoryId?: string;
  cityId?: string;
  page: number;
}) {
  const offset = (page - 1) * DEFAULT_PAGE_SIZE;

  const allItems = await db.serviceListing.findMany({
    where: {
      status: "ACTIVE",
      ...(categoryId ? { categoryId } : {}),
      ...(cityId ? { cityId } : {}),
    },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      images: true,
      priceFrom: true,
      priceTo: true,
      priceUnit: true,
      address: true,
      views: true,
      createdAt: true,
      status: true,
      provider: {
        select: {
          id: true,
          rating: true,
          isVerified: true,
          user: { select: { firstName: true, displayName: true, avatar: true } },
        },
      },
      category: { select: { id: true, name: true, slug: true } },
      city: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
    skip: offset,
    take: DEFAULT_PAGE_SIZE + 1,
  });

  const hasMore = allItems.length > DEFAULT_PAGE_SIZE;
  const listings = hasMore ? allItems.slice(0, DEFAULT_PAGE_SIZE) : allItems;

  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/60 bg-surface px-6 py-16 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-muted">
          <SearchX className="size-6 text-muted-foreground" />
        </span>
        <p className="font-semibold text-foreground">Объявлений пока нет</p>
        <p className="text-sm text-muted-foreground">
          В выбранной категории или городе сейчас нет активных объявлений.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {listings.map((listing, i) => (
        <div key={listing.id} className="list-card" style={{ animationDelay: `${i * 0.05}s` }}>
          <ListingCard listing={listing as Parameters<typeof ListingCard>[0]["listing"]} />
        </div>
      ))}

      {(page > 1 || hasMore) && (
        <div className="flex items-center justify-center gap-2 pt-2">
          {page > 1 && (
            <PageLink href={buildHref({ page: page - 1, categoryId, cityId })}>← Назад</PageLink>
          )}
          {hasMore && (
            <PageLink href={buildHref({ page: page + 1, categoryId, cityId })}>Далее →</PageLink>
          )}
        </div>
      )}
    </div>
  );
}

function buildHref({ page, categoryId, cityId }: { page: number; categoryId?: string; cityId?: string }) {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (categoryId) params.set("categoryId", categoryId);
  if (cityId) params.set("cityId", cityId);
  const qs = params.toString();
  return `/listings${qs ? `?${qs}` : ""}`;
}

function FilterChip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-subtle hover:text-foreground"
      )}
    >
      {children}
    </Link>
  );
}

function PageLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold transition-colors hover:border-primary/60 hover:text-primary"
    >
      {children}
    </Link>
  );
}

function ListingsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-36 animate-pulse rounded-2xl border border-border/60 bg-muted/40" />
      ))}
    </div>
  );
}
