import { Suspense } from "react";
import { TaskFeed } from "@/widgets/TaskFeed/ui/TaskFeed";
import { CategoryGrid } from "@/widgets/CategoryGrid";
import { Search } from "lucide-react";
import { Input } from "@/shared/ui/input";
import { db } from "@/shared/lib/db";
import { StaggerWrap } from "@/shared/ui/stagger-wrap";
import { StaggerItem } from "@/shared/ui/stagger-item";

interface FeedPageProps {
  searchParams: Promise<{ categoryId?: string }>;
}

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const { categoryId } = await searchParams;

  const categories = await db.category.findMany({
    select: { id: true, name: true, icon: true }
  });

  return (
    <StaggerWrap className="container-standard space-y-12">
      {/* Search Header */}
      <StaggerItem className="space-y-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Поиск заказов</h1>
          <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Найдите работу в вашем районе</p>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <Input
            placeholder="Поиск по названию или описанию..."
            className="pl-12 h-14 bg-white/50 dark:bg-slate-900/50 border-white/20 dark:border-slate-800 rounded-3xl text-base font-medium shadow-xl shadow-black/5"
          />
        </div>
      </StaggerItem>

      {/* Categories Filter */}
      <StaggerItem className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center justify-center gap-2 italic opacity-70">
          — Выберите нужную категорию —
        </h3>
        <div className="flex overflow-x-auto gap-4 py-8 no-scrollbar scroll-smooth justify-center items-center">
          <Suspense fallback={<div className="h-24 bg-white/5 rounded-[32px] animate-pulse w-full max-lg mx-auto" />}>
            <CategoryGrid initialCategories={categories} />
          </Suspense>
        </div>
      </StaggerItem>

      {/* Main Feed Content - TaskFeed already has its own internal StaggerWrap */}
      <StaggerItem>
        <Suspense fallback={
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 w-full bg-slate-100 dark:bg-slate-900 rounded-[32px] animate-pulse border border-white/10" />
            ))}
          </div>
        }>
          {/* @ts-ignore - Prisma types may be out of sync in IDE */}
          <TaskFeed categoryId={categoryId} />
        </Suspense>
      </StaggerItem>
    </StaggerWrap>
  );
}
