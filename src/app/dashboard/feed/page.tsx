import { Suspense } from "react";
import { TaskFeed } from "@/widgets/TaskFeed/ui/TaskFeed";
import { CategoryGrid } from "@/widgets/CategoryGrid";
import { Search } from "lucide-react";
import { Input } from "@/shared/ui/input";
import { db } from "@/shared/lib/db";

interface FeedPageProps {
  searchParams: Promise<{ categoryId?: string }>;
}

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const { categoryId } = await searchParams;
  
  const categories = await db.category.findMany({
    select: { id: true, name: true, icon: true }
  });

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20">
      {/* Search Header */}
      <div className="space-y-6">
        <div className="flex flex-col gap-1 px-4">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Поиск заказов</h1>
          <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Найдите работу в вашем районе</p>
        </div>

        <div className="px-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <Input 
              placeholder="Поиск по названию или описанию..." 
              className="pl-12 h-14 bg-white/50 dark:bg-slate-900/50 border-white/20 dark:border-slate-800 rounded-3xl text-base font-medium shadow-xl shadow-black/5"
            />
          </div>
        </div>
      </div>

      {/* Categories Filter */}
      <div className="px-4 space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
            Выберите категорию
          </h3>
          <div className="flex overflow-x-auto gap-3 pb-2 no-scrollbar scroll-smooth">
             {/* Small Category Chips could go here, but for now we use CategoryGrid style or simple list */}
             <Suspense fallback={<div className="h-20 bg-slate-100 rounded-2xl animate-pulse w-full"/>}>
                <CategoryGrid initialCategories={categories} />
             </Suspense>
          </div>
      </div>

      {/* Main Feed Content */}
      <div className="px-4">
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
      </div>
    </div>
  );
}
