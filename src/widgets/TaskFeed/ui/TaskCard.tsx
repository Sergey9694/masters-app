"use client";

import { motion } from "framer-motion";
import { MapPin, Clock, Banknote, ChevronRight, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { Card } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description: string;
    budget: number | null;
    address: string | null;
    createdAt: Date;
    category: {
      name: string;
    };
    customer: {
      firstName: string;
      avatar: string | null;
    };
  };
}

export function TaskCard({ task }: TaskCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className="group cursor-pointer"
    >
      <Card className="p-0 border-none glass overflow-hidden rounded-[32px] hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500">
        <div className="p-6 space-y-5">
          {/* Top Line: Category & Time */}
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="rounded-full bg-blue-500/10 text-blue-500 border-blue-500/20 text-[10px] font-black uppercase tracking-widest px-3 py-1">
              {task.category.name}
            </Badge>
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold">
              <Clock className="w-3.5 h-3.5" />
              {formatDistanceToNow(task.createdAt, { addSuffix: true, locale: ru })}
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-2">
            <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight group-hover:text-blue-500 transition-colors">
              {task.title}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium line-clamp-2 leading-[1.5]">
              {task.description}
            </p>
          </div>

          {/* Meta Info: Budget & Address */}
          <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-white/10 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <Banknote className="w-4 h-4" />
              </div>
              <span className="text-sm font-black">
                {task.budget ? `${task.budget.toLocaleString()} ₽` : "Договорная"}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                <MapPin className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold truncate max-w-[150px]">
                {task.address || "Не указан"}
              </span>
            </div>
          </div>
        </div>

        {/* Footer: User & Action */}
        <div className="bg-slate-50/50 dark:bg-slate-900/50 px-6 py-4 flex items-center justify-between border-t border-white/10 dark:border-slate-800">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400 overflow-hidden border border-white/20">
                {task.customer.avatar ? (
                    <img src={task.customer.avatar} alt={task.customer.firstName} className="w-full h-full object-cover" />
                ) : (
                    <User className="w-4 h-4" />
                )}
             </div>
             <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                {task.customer.firstName}
             </span>
          </div>
          
          <div className="flex items-center gap-1 text-blue-500 font-bold text-xs uppercase tracking-[0.15em] opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1">
            Откликнуться
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
