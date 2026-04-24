import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { db } from "@/shared/lib/db";
import { getCurrentUser } from "@/shared/lib/get-user";
import { OrderEditFormLight } from "@/features/order-creation/ui/OrderEditFormLight";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ citySlug: string; slug: string; orderSlug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { orderSlug } = await params;
  const order = await db.order.findFirst({
    where: { OR: [{ slug: orderSlug }, { id: orderSlug }] },
    select: { title: true },
  });
  return { title: order ? `Редактировать: ${order.title} — УслугиРядом` : "Редактировать заказ" };
}

export default async function OrderEditPage({ params }: PageProps) {
  const { citySlug, slug: categorySlug, orderSlug } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const [order, categories] = await Promise.all([
    db.order.findFirst({
      where: { OR: [{ slug: orderSlug }, { id: orderSlug }] },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        categoryId: true,
        cityId: true,
        budget: true,
        address: true,
        clientId: true,
        status: true,
        category: { select: { slug: true } },
        city: { select: { slug: true } },
      },
    }),
    db.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!order) notFound();
  
  const currentOrderSlug = order.slug || order.id;
  const canonicalUrl = `/orders/${order.city.slug}/${order.category.slug}/${currentOrderSlug}`;

  if (order.clientId !== user.id) redirect(canonicalUrl);
  if (order.status !== "OPEN") redirect(canonicalUrl);

  const backHref = canonicalUrl;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          К заказу
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          Редактировать заказ
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Можно изменить только пока заказ в статусе «Открыт»
        </p>
      </div>

      <section className="rounded-2xl border border-border/60 bg-surface p-6">
        <OrderEditFormLight
          orderId={order.id}
          categories={categories}
          defaultValues={{
            title: order.title,
            description: order.description,
            categoryId: order.categoryId,
            cityId: order.cityId,
            budget: order.budget != null ? String(order.budget) : "",
            address: order.address ?? "",
          }}
        />
      </section>
    </div>
  );
}
