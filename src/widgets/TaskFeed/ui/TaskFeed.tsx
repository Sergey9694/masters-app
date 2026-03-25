import { db } from "@/shared/lib/db";
import { TaskCard } from "./TaskCard";

interface TaskFeedProps {
  categoryId?: string;
}

export async function TaskFeed({ categoryId }: TaskFeedProps) {
  const tasks = await db.taskRequest.findMany({
    where: {
      status: "OPEN",
      ...(categoryId ? { categoryId } : {}),
    },
    select: {
      id: true,
      title: true,
      description: true,
      budget: true,
      address: true,
      createdAt: true,
      category: {
        select: {
          name: true,
        },
      },
      customer: {
        select: {
          firstName: true,
          avatar: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 20,
  });

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center glass rounded-[40px] border border-dashed border-white/20 px-8">
        <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 mb-6">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Заказов пока нет</h3>
        <p className="text-sm text-slate-400 font-bold max-w-xs mx-auto leading-normal">
          В этой категории пока пусто. Будьте первым, кто предложит услуги!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2 mb-8">
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-3">
          Свежие тендеры
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
        </h2>
        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full uppercase tracking-wider">
          {tasks.length} активных
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 pb-10">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
