import { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

import { db } from "@/shared/lib/db";
import { getCurrentUser } from "@/shared/lib/get-user";
import { TaskCreateForm } from "@/features/task-creation/ui/TaskCreateForm";
import { StaggerWrap } from "@/shared/ui/stagger-wrap";
import { StaggerItem } from "@/shared/ui/stagger-item";
import { TelegramBackButton } from "@/shared/ui/telegram-back-button";

export const metadata: Metadata = {
  title: "Создать тендер | Районный Мастер",
  description: "Опубликуйте заказ и найдите лучших мастеров в вашем районе",
};

export default async function CreateTaskPage() {
  const user = await getCurrentUser();
  const categories = await db.category.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <StaggerWrap className="min-h-screen pb-20 pt-6 px-4 max-w-2xl mx-auto">
      <TelegramBackButton />
      {/* Header with Back Button */}
      <StaggerItem className="flex items-center gap-4 mb-10">
        <Link 
          href="/dashboard"
          replace
          className="w-10 h-10 rounded-full glass border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight">Новый тендер</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Опишите задачу</p>
        </div>
      </StaggerItem>

      <StaggerItem>
        <TaskCreateForm 
          categories={categories.map(c => ({ id: c.id, name: c.name }))} 
        />
      </StaggerItem>
    </StaggerWrap>
  );
}
