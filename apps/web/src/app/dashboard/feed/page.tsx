import { Suspense } from "react";
import { TaskFeed } from "@/widgets/TaskFeed/ui/TaskFeed";
import { SearchInput } from "@/widgets/TaskFeed/ui/SearchInput";
import { CategoryGrid } from "@/widgets/CategoryGrid";
import { db } from "@/shared/lib/db";
import { StaggerWrap } from "@/shared/ui/stagger-wrap";
import { StaggerItem } from "@/shared/ui/stagger-item";
import { TelegramBackButton } from "@/shared/ui/telegram-back-button";

import { PageHeader } from "@/shared/ui/page-header";

interface FeedPageProps {
  searchParams: Promise<{
    categoryId?: string;
    search?: string;
  }>;
}

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const { categoryId, search } = await searchParams;

  const categories = await db.category.findMany({
    select: { id: true, name: true, icon: true },
    orderBy: { name: "asc" },
  });

  return (
    <StaggerWrap className="container-standard space-y-8 pt-6">
      <TelegramBackButton />

      {/* Search Header */}
      <div className="space-y-6">
        <PageHeader 
          title="Поиск заказов" 
          subtitle="Найдите работу в вашем районе" 
          showBack={false} 
        />

        <Suspense>
          <SearchInput />
        </Suspense>
      </div>

      {/* Categories Filter Bar */}
      <StaggerItem>
        <Suspense
          fallback={
            <div className="h-24 bg-white/5 rounded-[32px] animate-pulse w-full max-lg mx-auto" />
          }
        >
          <CategoryGrid initialCategories={categories} variant="row" />
        </Suspense>
      </StaggerItem>

      {/* Main Feed Content */}
      <StaggerItem>
        <Suspense
          fallback={
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-48 w-full bg-slate-100 dark:bg-slate-900 rounded-[32px] animate-pulse border border-white/10"
                />
              ))}
            </div>
          }
        >
          <TaskFeed categoryId={categoryId} search={search} />
        </Suspense>
      </StaggerItem>
    </StaggerWrap>
  );
}
