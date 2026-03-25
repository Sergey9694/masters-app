"use client";

import { motion } from "framer-motion";
import { MapPin, Clock, Banknote, ChevronRight, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { Card } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { STAGGER_ITEM } from "@/shared/lib/motion";

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
    images?: string[]; // Added images array
  };
}

export function TaskCard({ task }: TaskCardProps) {
  const { title, description, budget, address, createdAt, category, customer, images } = task;

  return (
    <motion.div
      variants={STAGGER_ITEM}
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className="group cursor-pointer"
    >
      <Card className="p-0 border-none glass overflow-hidden rounded-[32px] hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500">
        <div className="p-6">
          {/* Header: User & Category */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 border-2 border-white/20 overflow-hidden">
                 {customer.avatar ? (
                   <img src={customer.avatar} alt={customer.firstName} className="w-full h-full object-cover" />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-blue-500/20 to-indigo-500/20 text-blue-500 font-bold text-xs">
                     {customer.firstName[0]}
                   </div>
                 )}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">
                  {customer.firstName}
                </p>
                <div className="flex items-center gap-1.5 opacity-60">
                  <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Мастер в районе</p>
                </div>
              </div>
            </div>
            
            <div className="px-3 py-1.5 rounded-full bg-white/10 border border-white/10 backdrop-blur-md">
              <p className="text-[9px] font-black uppercase tracking-[0.15em] text-blue-400">{category.name}</p>
            </div>
          </div>

          {/* Optional Image Preview (New Feature) */}
          {images && images.length > 0 && (
            <div className="mb-6 -mx-2 aspect-[16/9] rounded-2xl overflow-hidden border border-white/10 group-hover:border-blue-500/30 transition-colors">
              <img 
                src={images[0]} 
                alt={title} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
              />
            </div>
          )}

          {/* Content */}
          <div className="space-y-3 mb-6">
            <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight group-hover:text-blue-500 transition-colors">
              {title}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed font-medium">
              {description}
            </p>
          </div>

          {/* Meta Info: Budget & Address */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10 dark:border-slate-800">
            <div className="flex items-center gap-4">
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

            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-widest opacity-60">
              <Clock className="w-3.5 h-3.5" />
              {formatDistanceToNow(task.createdAt, { addSuffix: true, locale: ru })}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
