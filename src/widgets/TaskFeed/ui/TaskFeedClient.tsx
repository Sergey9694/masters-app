"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/shared/ui/button";
import { StaggerWrap } from "@/shared/ui/stagger-wrap";
import { StaggerItem } from "@/shared/ui/stagger-item";
import { SectionHeader } from "@/shared/ui/section-header";
import { TaskCard } from "@/entities/task";
import { loadTasksAction } from "../api/load-tasks";
import type { TaskCardData } from "@/shared/types/domain";

interface Props {
  initialTasks: TaskCardData[];
  initialCursor: string | null;
  categoryId?: string;
  search?: string;
  totalLabel: string;
  isDefaultFilter?: boolean;
}

export function TaskFeedClient({
  initialTasks,
  initialCursor,
  categoryId,
  search,
  totalLabel,
  isDefaultFilter = false,
}: Props) {
  const [tasks, setTasks] = useState(initialTasks);
  const [cursor, setCursor] = useState(initialCursor);
  const [isPending, startTransition] = useTransition();

  const loadMore = () => {
    if (!cursor) return;
    startTransition(async () => {
      const res = await loadTasksAction({ categoryId, search, cursor });
      setTasks((prev) => [...prev, ...res.tasks]);
      setCursor(res.nextCursor);
    });
  };

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center glass rounded-[40px] border border-dashed border-white/20 px-8">
        <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 mb-6">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </div>
        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">
          {search ? "Ничего не найдено" : "Заказов пока нет"}
        </h3>
        <p className="text-sm text-slate-400 font-bold max-w-xs mx-auto leading-normal">
          {search
            ? "Попробуйте другой запрос"
            : "В этой категории пока пусто. Будьте первым, кто предложит услуги!"}
        </p>
      </div>
    );
  }

  return (
    <StaggerWrap className="space-y-6">
      <StaggerItem className="mb-2">
        <div className="flex flex-col gap-3">
          <SectionHeader title="Свежие тендеры" countLabel={totalLabel} accentColor="blue" />
          
          {isDefaultFilter && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl w-fit"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-500 leading-none">
                ✨ По вашим специальностям
              </p>
            </motion.div>
          )}
        </div>
      </StaggerItem>

      <StaggerWrap className="grid grid-cols-1 gap-6 pb-4">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </StaggerWrap>

      {cursor && (
        <div className="flex justify-center pb-10">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={loadMore}
            disabled={isPending}
            className="rounded-full"
          >
            {isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Показать ещё"
            )}
          </Button>
        </div>
      )}
    </StaggerWrap>
  );
}
