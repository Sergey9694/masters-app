import { redirect } from "next/navigation";

/**
 * Legacy /dashboard/feed → /orders (миграция в (main)-группу, Фаза 5.4).
 */
export default async function LegacyFeedPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") query.set(key, value);
  }

  const qs = query.toString();
  redirect(qs ? `/orders?${qs}` : "/orders");
}
