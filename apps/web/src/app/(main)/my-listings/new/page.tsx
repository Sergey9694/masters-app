import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { getCurrentUser } from "@/shared/lib/get-user";
import { db } from "@/shared/lib/db";
import { ListingForm } from "./ListingForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Новое объявление — УслугиРядом",
};

export default async function NewListingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  if (!user.providerProfile) redirect("/become-provider");

  const categories = await db.category.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const { getRateLimitInfo } = await import("@/shared/lib/rate-limit");
  const rl = getRateLimitInfo({ key: `listing:create:${user.id}`, limit: 3, windowSec: 3600 });

  return (
    <div className="flex flex-col gap-6">
      <div className="page-section">
        <Link
          href="/my-listings"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Мои объявления
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
          Новое объявление
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Расскажите о своей услуге, чтобы клиенты могли вас найти
        </p>
      </div>

      {!rl.allowed && (
        <div className="page-section max-w-2xl">
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-600 dark:text-amber-400">
            <p className="text-sm font-medium">
              ⚠️ Лимит создания объявлений исчерпан (3 в час). 
              Вы сможете опубликовать новое объявление через <strong>{Math.ceil(rl.retryAfterSec / 60)} мин.</strong>
            </p>
          </div>
        </div>
      )}

      <div className="page-section max-w-2xl">
        <ListingForm categories={categories} isLimited={!rl.allowed} />
      </div>
    </div>
  );
}
