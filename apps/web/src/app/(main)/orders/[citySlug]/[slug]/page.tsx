import { Suspense } from "react";
import { notFound } from "next/navigation";
import { db } from "@/shared/lib/db";
import { OrderFeed } from "@/widgets/OrderFeed/ui/OrderFeed";
import { OrdersFilters } from "@/widgets/OrdersFilters";
import { cityService } from "@/services/city.service";
import { categoryService } from "@/services/category.service";
import type { OrderSort } from "@/services/order.service";
import { getCurrentUser } from "@/shared/lib/get-user";

export const dynamic = "force-dynamic";

interface CategoryCityPageProps {
  params: Promise<{ citySlug: string; slug: string }>;
  searchParams: Promise<{
    search?: string;
    sort?: string;
  }>;
}

export async function generateMetadata({ params }: CategoryCityPageProps) {
  const { citySlug, slug } = await params;
  const [city, category] = await Promise.all([
    cityService.getBySlug(citySlug),
    categoryService.getBySlug(slug),
  ]);

  if (!city || !category) return { title: "Страница не найдена | УслугиРядом" };

  return {
    title: `${category.name} в г. ${city.name} — Заказы на УслугиРядом`,
    description: `Актуальные заказы в категории «${category.name}» в городе ${city.name}. Найдите работу или разместите свой заказ.`,
  };
}

export default async function CategoryCityPage({ params, searchParams }: CategoryCityPageProps) {
  const { citySlug, slug } = await params;
  const { search, sort } = await searchParams;
  
  const [city, category] = await Promise.all([
    cityService.getBySlug(citySlug),
    categoryService.getBySlug(slug),
  ]);

  if (!city || !category) notFound();

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
          {category.name} в г. {city.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Список активных заказов по направлению {category.name.toLowerCase()} в вашем городе.
        </p>
      </div>

      <OrdersFilters
        categories={categories}
        cities={cities}
        isProvider={!!user?.providerProfile}
        initialCityId={city.id}
        initialCategoryId={category.id}
      />

      <Suspense
        key={`${city.id}-${category.id}-${search ?? ""}-${sort ?? ""}`}
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
          categoryId={category.id}
          cityId={city.id}
          search={search}
          sort={normalizedSort}
        />
      </Suspense>
    </div>
  );
}
