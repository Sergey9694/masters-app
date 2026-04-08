import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

import { db } from "@/shared/lib/db";
import { getCurrentUser } from "@/shared/lib/get-user";
import { StaggerWrap } from "@/shared/ui/stagger-wrap";
import { StaggerItem } from "@/shared/ui/stagger-item";
import { TelegramBackButton } from "@/shared/ui/telegram-back-button";
import { BackButton } from "@/shared/ui/back-button";
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
      <StaggerItem className="flex items-center gap-4 mb-10">
        <BackButton />
        <div>
          <h1 className="text-2xl font-black tracking-tight">Стать мастером</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
            Заполните профиль
          </p>
        </div>
      </StaggerItem>

      <StaggerItem>
        <MasterRegistrationForm categories={categories} />
      </StaggerItem>
    </StaggerWrap>
  );
}
