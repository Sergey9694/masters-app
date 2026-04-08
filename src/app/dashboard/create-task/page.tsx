import { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

import { db } from "@/shared/lib/db";
import { getCurrentUser } from "@/shared/lib/get-user";
import { TaskCreateForm } from "@/features/task-creation/ui/TaskCreateForm";
import { StaggerWrap } from "@/shared/ui/stagger-wrap";
import { StaggerItem } from "@/shared/ui/stagger-item";
import { TelegramBackButton } from "@/shared/ui/telegram-back-button";
import { PageHeader } from "@/shared/ui/page-header";

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
      
      <PageHeader 
        title="Новый тендер"
        subtitle="Опишите задачу"
      />

      <StaggerItem>
        <TaskCreateForm 
          categories={categories.map(c => ({ id: c.id, name: c.name }))} 
        />
      </StaggerItem>
    </StaggerWrap>
  );
}
