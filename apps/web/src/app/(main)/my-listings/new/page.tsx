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
  if (!user.providerProfile) redirect("/provider/register");

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

      <div className="page-section max-w-2xl">
        <ListingForm categories={categories} cities={cities} />
      </div>
    </div>
  );
}
