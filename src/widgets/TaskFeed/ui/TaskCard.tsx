"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { MapPin, Clock, Banknote } from "lucide-react";
import { formatSmartDate } from "@/shared/lib/date";
import { Card } from "@/shared/ui/card";
import { STAGGER_ITEM } from "@/shared/lib/motion";
import { useHaptics } from "@/shared/lib/telegram/use-haptics";
import { Avatar, AvatarImage, AvatarFallback } from "@/shared/ui/avatar";
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
    images?: string[]; 
    distance?: number;
  };
}

const formatDistance = (m: number) => {
  if (m < 1000) return `${m} м`;
  return `${(m / 1000).toFixed(1)} км`;
};

export function TaskCard({ task }: TaskCardProps) {
  const { title, description, budget, address, createdAt, category, customer, images, distance } = task;
  const haptics = useHaptics();

  const truncatedTitle = title.length > 30 ? title.substring(0, 27) + "..." : title;
  const truncatedDesc = description.length > 30 ? description.substring(0, 27) + "..." : description;

  return (
    <motion.div
      variants={STAGGER_ITEM}
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={haptics.selection}
      className="group cursor-pointer"
    >
      <Link href={`/dashboard/task/${task.id}`} className="block">
      <Card className="p-0 border-none glass overflow-hidden rounded-[32px] hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500">
        <div className="p-6">
          {/* Header: User & Category */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 rounded-full border-2 border-white/20 overflow-hidden bg-slate-200 dark:bg-slate-800">
                <AvatarImage src={customer.avatar || ""} alt={customer.firstName} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-tr from-blue-500/20 to-indigo-500/20 text-blue-500 font-bold text-xs uppercase">
                  {customer.firstName[0]}
                </AvatarFallback>
              </Avatar>
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
            
            <Badge variant="category">
              {category.name}
            </Badge>
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
          <div className="space-y-2 mb-6 text-left">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight group-hover:text-blue-500 transition-colors">
              {truncatedTitle}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal opacity-80">
              {truncatedDesc}
            </p>
          </div>

          {/* Meta Info: Budget & Address */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10 dark:border-slate-800 text-left">
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
                <div className="flex flex-col">
                   <span className="text-sm font-bold truncate max-w-[150px]">
                     {task.address || "Не указан"}
                   </span>
                   {distance !== undefined && (
                     <span className="text-[10px] font-black text-blue-500 uppercase tracking-tighter">
                        {formatDistance(distance)} от вас
                     </span>
                   )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-widest opacity-60">
              <Clock className="w-3.5 h-3.5" />
              {formatSmartDate(createdAt)}
            </div>
          </div>
        </div>
      </Card>
      </Link>
    </motion.div>
  );
}
