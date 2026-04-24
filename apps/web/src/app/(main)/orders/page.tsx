import { Suspense } from "react";

import { db } from "@/shared/lib/db";
import { OrderFeed } from "@/widgets/OrderFeed/ui/OrderFeed";
import { OrdersFilters } from "@/widgets/OrdersFilters";
import type { OrderSort } from "@/services/order.service";

import { getCurrentUser } from "@/shared/lib/get-user";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Заказы — УслугиРядом",
  description: "Лента активных заказов. Найдите подходящую работу рядом с вами.",
};

interface OrdersPageProps {
  searchParams: Promise<{
    categoryId?: string;
    cityId?: string;
    search?: string;
    sort?: string;
  }>;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const { categoryId, cityId, search, sort } = await searchParams;
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
      <div className="page-section">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Лента заказов
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Выберите задачу по вашей специализации — откликайтесь и зарабатывайте
        </p>
      </div>

      <OrdersFilters
        categories={categories}
        cities={cities}
        isProvider={!!user?.providerProfile}
      />

      <Suspense
        key={`${categoryId ?? ""}-${cityId ?? ""}-${search ?? ""}-${sort ?? ""}`}
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
          cityId={cityId}
          search={search}
          sort={normalizedSort}
        />
      </Suspense>
    </div>
  );
}
