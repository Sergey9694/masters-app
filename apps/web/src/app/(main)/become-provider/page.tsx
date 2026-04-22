export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Briefcase } from "lucide-react";

import { db } from "@/shared/lib/db";
import { getCurrentUser } from "@/shared/lib/get-user";
import { ProviderRegistrationFormLight } from "@/features/provider-registration/ui/ProviderRegistrationFormLight";

export const metadata: Metadata = {
  title: "Стать исполнителем — УслугиРядом",
  description: "Зарегистрируйтесь как исполнитель и начните зарабатывать",
};

export default async function BecomeProviderPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const categories = await db.category.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const initialData = user.providerProfile
    ? {
        bio: user.providerProfile.bio ?? "",
        experienceYears: user.providerProfile.experienceYears ?? 0,
        minPrice: user.providerProfile.minPrice ?? 0,
        portfolio: user.providerProfile.portfolio,
        avatarUrl: user.avatar ?? "",
        categoryIds: user.providerProfile.categories.map((c) => c.categoryId),
      }
    : { avatarUrl: user.avatar ?? "" };

  const isUpdate = Boolean(user.providerProfile);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Briefcase className="size-5" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {isUpdate ? "Профиль исполнителя" : "Стать исполнителем"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isUpdate
              ? "Редактирование данных и специализаций"
              : "Заполните профиль — клиенты увидят вас в списке исполнителей"}
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-2xl rounded-2xl border border-border/60 bg-surface p-6 sm:p-8">
        <ProviderRegistrationFormLight
          categories={categories}
          initialData={initialData}
          isUpdate={isUpdate}
        />
      </div>
    </div>
  );
}
