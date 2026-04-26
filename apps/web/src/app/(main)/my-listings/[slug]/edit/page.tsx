export const dynamic = "force-dynamic";

import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { getCurrentUser } from "@/shared/lib/get-user";
import { listingService } from "@/services/listing.service";
import { db } from "@/shared/lib/db";
import { ListingForm } from "../../new/ListingForm";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const metadata = {
  title: "Редактировать объявление — УслугиРядом",
};

export default async function EditListingPage({ params }: PageProps) {
  const { slug } = await params;

  const [currentUser, listing] = await Promise.all([
    getCurrentUser(),
    listingService.getById(slug),
  ]);

  if (!currentUser) redirect("/auth/login");
  if (!listing) notFound();

  const providerProfile = await db.providerProfile.findUnique({
    where: { userId: currentUser.id },
    select: { id: true },
  });
  if (!providerProfile || listing.provider.id !== providerProfile.id) notFound();

  const categories = await db.category.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const initialData = {
    title: listing.title,
    description: listing.description ?? "",
    categoryId: listing.category.id,
    cityId: listing.city.id,
    address: listing.address ?? undefined,
    priceFrom: listing.priceFrom ?? undefined,
    priceTo: listing.priceTo ?? undefined,
    priceUnit: (listing.priceUnit ?? "PER_SERVICE") as "PER_HOUR" | "PER_SERVICE" | "PER_METER" | "NEGOTIABLE",
  };

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
          Редактировать объявление
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Внесите изменения и сохраните
        </p>
      </div>

      <div className="page-section max-w-2xl">
        <ListingForm
          mode="edit"
          listingId={listing.id}
          initialData={initialData}
          categories={categories}
        />
      </div>
    </div>
  );
}
