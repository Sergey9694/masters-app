import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
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
  if (user.masterProfile) redirect("/dashboard");

  const categories = await db.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <StaggerWrap className="min-h-screen pb-20 pt-6 px-4 max-w-2xl mx-auto">
      <TelegramBackButton />
      
      <PageHeader 
        title="Стать мастером"
        subtitle="Заполните профиль"
      />

      <StaggerItem>
        <MasterRegistrationForm categories={categories} initialAvatar={user.avatar} />
      </StaggerItem>
    </StaggerWrap>
  );
}
