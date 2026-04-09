import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ChevronLeft, Hammer } from "lucide-react";
import Link from "next/link";

import { db } from "@/shared/lib/db";
import { getCurrentUser } from "@/shared/lib/get-user";
import { StaggerWrap } from "@/shared/ui/stagger-wrap";
import { StaggerItem } from "@/shared/ui/stagger-item";
import { TelegramBackButton } from "@/shared/ui/telegram-back-button";
import { PageHeader } from "@/shared/ui/page-header";
import { MasterRegistrationForm } from "@/features/master-registration/ui/MasterRegistrationForm";

export const metadata: Metadata = {
  title: "Стать мастером | Районный Мастер",
  description: "Зарегистрируйтесь как исполнитель и начните зарабатывать в своём районе",
};

export default async function BecomeMasterPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const categories = await db.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const masterProfileData = user.masterProfile ? {
    bio: user.masterProfile.bio || "",
    experienceYears: user.masterProfile.experienceYears || 0,
    minPrice: user.masterProfile.minPrice || 0,
    portfolio: user.masterProfile.portfolio,
    avatarUrl: user.avatar || "",
    categoryIds: user.masterProfile.categories.map((c) => c.categoryId),
  } : {
    avatarUrl: user.avatar || "",
  };

  return (
    <StaggerWrap className="min-h-screen pb-20 pt-6 px-4 max-w-2xl mx-auto overflow-x-hidden">
      <TelegramBackButton />
      
      <PageHeader 
        title={user.masterProfile ? "Профиль мастера" : "Стать мастером"}
        subtitle={user.masterProfile ? "Редактирование данных" : "Заполните профиль"}
        icon={<Hammer className="w-5 h-5 text-emerald-400" />}
      />

      <StaggerItem>
        <MasterRegistrationForm categories={categories} initialData={masterProfileData} />
      </StaggerItem>
    </StaggerWrap>
  );
}
