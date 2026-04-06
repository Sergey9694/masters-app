import { Suspense } from "react";
import { TaskFeed } from "@/widgets/TaskFeed/ui/TaskFeed";
import { SearchInput } from "@/widgets/TaskFeed/ui/SearchInput";
import { CategoryGrid } from "@/widgets/CategoryGrid";
import { db } from "@/shared/lib/db";
import { StaggerWrap } from "@/shared/ui/stagger-wrap";
import { StaggerItem } from "@/shared/ui/stagger-item";
import { TelegramBackButton } from "@/shared/ui/telegram-back-button";

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
  });

  return (
    <StaggerWrap className="container-standard space-y-12">
      <TelegramBackButton />

      {/* Search Header */}
      <StaggerItem className="space-y-6">
        <div className="flex flex-col gap-1 text-center sm:text-left">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            Поиск заказов
          </h1>
          <p className="text-sm text-slate-400 font-bold uppercase tracking-widest leading-none">
            Найдите работу в вашем районе
          </p>
        </div>

        <Suspense>
          <SearchInput />
        </Suspense>
      </StaggerItem>

      {/* Categories Filter */}
      <StaggerItem className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center justify-center gap-2 italic opacity-70">
          — Выберите нужную категорию —
        </h3>
        <div className="flex overflow-x-auto gap-4 py-8 no-scrollbar scroll-smooth justify-center items-center">
          <Suspense
            fallback={
              <div className="h-24 bg-white/5 rounded-[32px] animate-pulse w-full max-lg mx-auto" />
            }
          >
            <CategoryGrid initialCategories={categories} />
          </Suspense>
        </div>
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
