import { Metadata } from "next";

import { db } from "@/shared/lib/db";
import { getCurrentUser } from "@/shared/lib/get-user";
import { OrderCreateForm } from "@/features/order-creation/ui/OrderCreateForm";
import { StaggerWrap } from "@/shared/ui/stagger-wrap";
import { StaggerItem } from "@/shared/ui/stagger-item";
import { TelegramBackButton } from "@/shared/ui/telegram-back-button";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata: Metadata = {
  title: "Создать заказ | УслугиРядом",
  description: "Опубликуйте заказ и найдите лучших исполнителей в вашем районе",
};

export default async function CreateOrderPage() {
  const user = await getCurrentUser();
  const categories = await db.category.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <StaggerWrap className="min-h-screen pb-20 pt-6 max-w-2xl mx-auto container-standard overflow-x-hidden">
      <TelegramBackButton />
      
      <PageHeader 
        title="Новый заказ"
        subtitle="Опишите задачу"
      />

      <StaggerItem>
        <OrderCreateForm 
          categories={categories.map(c => ({ id: c.id, name: c.name }))} 
        />
      </StaggerItem>
    </StaggerWrap>
  );
}
