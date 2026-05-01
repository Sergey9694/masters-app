import { Suspense } from "react";

import { db } from "@/shared/lib/db";
import { OrderFeed } from "@/widgets/OrderFeed/ui/OrderFeed";
import { OrdersFilters } from "@/widgets/OrdersFilters";
import { YandexOrdersMap } from "@/widgets/OrdersMap";
import type { OrderSort } from "@/services/order.service";
import { parseGeoQuery, parseOrdersViewMode } from "@/shared/lib/orders-query";

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
    view?: string;
    lat?: string;
    lng?: string;
    radiusKm?: string;
  }>;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const { categoryId, cityId, search, sort, view, lat, lng, radiusKm } = await searchParams;
  const user = await getCurrentUser();
  const viewMode = parseOrdersViewMode(view);
  const geo = parseGeoQuery(lat, lng, radiusKm);

  const [categories, cities] = await Promise.all([
    db.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    }),
    db.city.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true, lat: true, lng: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const normalizedSort: OrderSort | undefined =
    sort === "budget_desc" || sort === "budget_asc" ? sort : undefined;

  const effectiveCityId = cityId || user?.cityId;
  const initialCity = cities.find((c) => c.id === effectiveCityId);
  const initialCenter =
    initialCity?.lat && initialCity?.lng
      ? { lat: initialCity.lat, lng: initialCity.lng }
      : undefined;

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
        initialView={viewMode}
        initialLat={geo.lat}
        initialLng={geo.lng}
        initialRadiusKm={geo.radiusKm}
      />

      <Suspense
        key={`${categoryId ?? ""}-${cityId ?? ""}-${search ?? ""}-${sort ?? ""}-${viewMode}-${geo.lat ?? ""}-${geo.lng ?? ""}-${geo.radiusKm ?? ""}`}
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
        {viewMode === "map" ? (
          <YandexOrdersMap
            categoryId={categoryId}
            cityId={cityId}
            search={search}
            lat={geo.lat}
            lng={geo.lng}
            radiusKm={geo.radiusKm}
            initialCenter={initialCenter}
          />
        ) : (
          <OrderFeed
            categoryId={categoryId}
            cityId={cityId}
            search={search}
            sort={normalizedSort}
            lat={geo.lat}
            lng={geo.lng}
            radiusKm={geo.radiusKm}
          />
        )}
      </Suspense>
    </div>
  );
}
