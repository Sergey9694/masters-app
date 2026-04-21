import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { db } from "@/shared/lib/db";
import { getCurrentUser } from "@/shared/lib/get-user";
import { OrderWizardLight } from "@/features/order-creation/ui/OrderWizardLight";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Новый заказ — УслугиРядом",
  description: "Опубликуйте заказ и найдите исполнителей в вашем городе",
};

export default async function NewOrderPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const [categories, cities] = await Promise.all([
    db.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.city.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          К ленте заказов
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          Новый заказ
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Заполните несколько шагов — исполнители увидят ваш заказ сразу после
          публикации
        </p>
      </div>

      <OrderWizardLight
        categories={categories}
        cities={cities}
        defaultCityId={user.cityId ?? undefined}
      />
    </div>
  );
}
