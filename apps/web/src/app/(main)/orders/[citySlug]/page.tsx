import { Suspense } from "react";
import { notFound } from "next/navigation";
import { db } from "@/shared/lib/db";
import { OrderFeed } from "@/widgets/OrderFeed/ui/OrderFeed";
import { OrdersFilters } from "@/widgets/OrdersFilters";
import { cityService } from "@/services/city.service";
import type { OrderSort } from "@/services/order.service";
import { getCurrentUser } from "@/shared/lib/get-user";

export const dynamic = "force-dynamic";

interface OrdersCityPageProps {
  params: Promise<{ citySlug: string }>;
  searchParams: Promise<{
    categoryId?: string;
    search?: string;
    sort?: string;
  }>;
}

export async function generateMetadata({ params }: OrdersCityPageProps) {
  const { citySlug } = await params;
  const city = await cityService.getBySlug(citySlug);

  if (!city) return { title: "Город не найден | УслугиРядом" };

  return {
    title: `Заказы в г. ${city.name} — УслугиРядом`,
    description: `Лента активных заказов в городе ${city.name}. Найдите подходящую работу рядом с вами.`,
  };
}

export default async function OrdersCityPage({ params, searchParams }: OrdersCityPageProps) {
  const { citySlug } = await params;
  const { categoryId, search, sort } = await searchParams;
  
  const city = await cityService.getBySlug(citySlug);
  if (!city) notFound();

  const user = await getCurrentUser();

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

  const normalizedSort: OrderSort | undefined =
    sort === "budget_desc" || sort === "budget_asc" ? sort : undefined;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Заказы в г. {city.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Актуальные предложения в вашем регионе. Выбирайте и откликайтесь.
        </p>
      </div>

      <OrdersFilters
        categories={categories}
        cities={cities}
        isProvider={!!user?.providerProfile}
        initialCityId={city.id}
      />

      <Suspense
        key={`${city.id}-${categoryId ?? ""}-${search ?? ""}-${sort ?? ""}`}
        fallback={
          <div className="flex flex-col gap-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-36 animate-pulse rounded-2xl border border-border/60 bg-muted/40"
              />
            ))}
          </div>
        }
      >
        <OrderFeed
          categoryId={categoryId}
          cityId={city.id}
          search={search}
          sort={normalizedSort}
        />
      </Suspense>
    </div>
  );
}
