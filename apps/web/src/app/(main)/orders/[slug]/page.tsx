import { notFound, redirect } from "next/navigation";
import { orderService } from "@/services/order.service";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Редиректор для обратной совместимости.
 * Если пользователь заходит по старому адресу /orders/[slug],
 * мы находим заказ и перенаправляем его на /orders/[categorySlug]/[slug] с кодом 301.
 */
export default async function OrderRedirectPage({ params }: PageProps) {
  const { slug } = await params;
  
  const order = await orderService.getById(slug);

  if (!order) {
    notFound();
  }

  // Выполняем редирект на новый канонический URL
  // Используем категорию заказа для формирования пути
  redirect(`/orders/${order.category.slug}/${order.slug || order.id}`);
}
