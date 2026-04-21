import { redirect } from "next/navigation";

/**
 * Legacy /dashboard/order/[id] → /orders/[id] (Фаза 5.5).
 */
export default async function LegacyOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/orders/${id}`);
}
