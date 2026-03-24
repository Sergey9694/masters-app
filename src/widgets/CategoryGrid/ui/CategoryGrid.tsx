import * as Icons from "lucide-react";
import { db } from "@/shared/lib/db";
import { Card } from "@/shared/ui/card";

export async function CategoryGrid() {
  const categories = await db.category.findMany({
    orderBy: { name: 'asc' }
  });

  return (
    <div className="mb-10">
      <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-5 px-1 flex items-center gap-2">
        Популярные услуги
        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
      </h2>
      <div className="grid grid-cols-4 gap-3">
        {categories.map((cat) => {
           const Icon = (Icons as any)[cat.icon || "Hammer"] || Icons.Hammer;
           return (
             <div key={cat.id} className="flex flex-col items-center gap-2 group cursor-pointer active:scale-90 transition-all">
                <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center text-slate-600 dark:text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                  <Icon className="w-6 h-6 stroke-[1.5]" />
                </div>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 text-center leading-tight">
                  {cat.name.split(' ')[0]}
                </span>
             </div>
           )
        })}
      </div>
    </div>
  );
}
