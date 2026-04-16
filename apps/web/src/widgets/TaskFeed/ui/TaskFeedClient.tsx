"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { Loader2, Sparkles, CheckCircle2, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { TaskCard } from "@/entities/task";
import { loadTasksAction } from "../api/load-tasks";
import { StaggerWrap } from "@/shared/ui/stagger-wrap";
import { StaggerItem } from "@/shared/ui/stagger-item";
import { SectionHeader } from "@/shared/ui/section-header";
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
  const loaderRef = useRef<HTMLDivElement>(null);

  // Syncing state is handled by the unique 'key' property in the parent TaskFeed component,
  // which causes this component to remount entirely when filters or broad categories change.
  // Removing local useEffect sync to prevent accidental resets during pagination.

  const loadMore = () => {
    if (!cursor || isPending) return;
    
    startTransition(async () => {
      try {
        const res = await loadTasksAction({ categoryId, search, cursor });
        // Avoid duplicate tasks if something went wrong with the cursor
        setTasks((prev) => {
          const existingIds = new Set(prev.map(t => t.id));
          const newTasks = res.tasks.filter(t => !existingIds.has(t.id));
          return [...prev, ...newTasks];
        });
        setCursor(res.nextCursor);
      } catch (error) {
        console.error("Failed to load more tasks:", error);
      }
    });
  };

  // Intersection Observer implementation for Infinite Scroll
  useEffect(() => {
    if (!cursor || isPending) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: "80px" }
    );

    const currentLoader = loaderRef.current;
    if (currentLoader) {
      observer.observe(currentLoader);
    }

    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader);
      }
      observer.disconnect();
    };
  }, [cursor, isPending, categoryId, search]);

  if (tasks.length === 0) {
    return (
      <StaggerItem className="flex flex-col items-center justify-center py-20 text-center glass-card rounded-[40px] border-white/10 px-8">
        <div className="w-20 h-20 rounded-full bg-slate-100/5 flex items-center justify-center text-slate-400 mb-6">
           <Sparkles className="w-10 h-10 opacity-20" />
        </div>
        <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">
          {search ? "Ничего не найдено" : "Заказов пока нет"}
        </h3>
        <p className="text-sm text-slate-400 font-bold max-w-xs mx-auto leading-normal">
          {search
            ? "Попробуйте другой запрос или сбросьте фильтры"
            : "В этой категории пока пусто. Будьте первым, кто предложит услуги!"}
        </p>
      </StaggerItem>
    );
  }

  return (
    <StaggerWrap className="space-y-6">
      {/* Feed Metadata */}
      <StaggerItem className="mb-4">
        <div className="flex flex-col gap-4">
          <SectionHeader 
             title={search ? `Поиск: ${search}` : "Свежие тендеры"} 
             countLabel={totalLabel} 
             accentColor="blue" 
          />
          
          {isDefaultFilter && (
            <div className="flex justify-center py-2">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="px-6 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
              >
                <div className="relative">
                   <div className="absolute inset-0 bg-amber-500/50 blur-sm rounded-full animate-pulse" />
                   <Zap className="w-3.5 h-3.5 text-amber-500 relative z-10 animate-bounce-slow" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-amber-500 leading-none">
                  По вашим специальностям
                </p>
              </motion.div>
            </div>
          )}
        </div>
      </StaggerItem>

      {/* Task List */}
      <div className="grid grid-cols-1 gap-6 pb-4">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>

      {/* Infinite Scroll Sentinel */}
      {cursor && (
        <div 
          ref={loaderRef}
          className="flex flex-col items-center justify-center gap-4 py-16"
        >
          <div className="relative">
             {/* Glow Effect */}
             <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full animate-pulse" />
             <Loader2 className="w-8 h-8 text-cyan-400 animate-spin relative z-10" />
          </div>
          <p className="text-[10px] text-cyan-400/60 uppercase tracking-[0.2em] font-black animate-pulse">
            Ищем еще заказы...
          </p>
        </div>
      )}

      {/* END OF FEED */}
      {!cursor && tasks.length > 0 && (
         <StaggerItem className="flex flex-col items-center py-16 opacity-40">
            <CheckCircle2 className="w-8 h-8 text-emerald-500/50 mb-4" />
            <p className="text-[10px] text-white uppercase tracking-[0.2em] font-black">
              Вы просмотрели все актуальные заказы
            </p>
            <div className="mt-4 h-px w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
         </StaggerItem>
      )}
    </StaggerWrap>
  );
}
