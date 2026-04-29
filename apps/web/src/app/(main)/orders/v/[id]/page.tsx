import { notFound, redirect } from "next/navigation";
import { db } from "@/shared/lib/db";

interface OrderRedirectPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Redirector from Order ID to SEO-friendly URL:
 * /orders/v/[id] -> /orders/[citySlug]/[categorySlug]/[orderSlug]
 */
export default async function OrderRedirectPage({ params }: OrderRedirectPageProps) {
  const { id } = await params;

  const order = await db.order.findFirst({
    where: {
      OR: [
        { id: id },
        { slug: id }
      ]
    },
    include: {
      city: { select: { slug: true } },
      category: { select: { slug: true } },
    },
  });

  if (!order) {
    notFound();
  }

  const citySlug = order.city.slug;
  const categorySlug = order.category.slug;
  const orderSlug = order.slug || order.id;

  redirect(`/orders/${citySlug}/${categorySlug}/${orderSlug}`);
}
