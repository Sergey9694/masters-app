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
import { StatusBadge } from "@/shared/ui/status-badge";
import { cn } from "@/shared/lib/cn";
import { getMapUrl } from "@/shared/lib/maps";

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description: string;
    budget: number | null;
    address: string | null;
    createdAt: Date;
    status: string;
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
  const { title, description, budget, address, createdAt, category, customer, images, distance, status } = task;
  const haptics = useHaptics();

  const truncatedTitle = title.length > 30 ? title.substring(0, 27) + "..." : title;
  const truncatedDesc = description.length > 50 ? description.substring(0, 47) + "..." : description;

  const handleAddressClick = (e: React.MouseEvent) => {
    if (!address) return;
    e.preventDefault();
    e.stopPropagation();
    window.open(getMapUrl(address), "_blank", "noopener,noreferrer");
  };

  return (
    <motion.div
      variants={STAGGER_ITEM}
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={haptics.selection}
      className="group cursor-pointer"
    >
      <Link href={`/dashboard/task/${task.id}`} className="block">
      <Card className="p-0 border-none glass-card overflow-hidden rounded-[32px] hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500">
        <div className="p-6">
          {/* Top Row: Category (Left) & User (Right) */}
          <div className="flex items-center justify-between mb-5">
            <Badge variant="category">
              {category.name}
            </Badge>

            <div className="flex items-center gap-2.5">
              <div className="text-right flex flex-col items-end">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">
                  {customer.firstName}
                </p>
                <div className="flex items-center gap-1.5 opacity-60">
                   <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                   <p className="text-[8px] font-bold text-slate-500 uppercase">В районе</p>
                </div>
              </div>
              <Avatar className="w-9 h-9 rounded-full border border-white/10 overflow-hidden bg-slate-800">
                <AvatarImage src={customer.avatar || ""} alt={customer.firstName} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-tr from-blue-500/20 to-indigo-500/20 text-blue-500 font-bold text-[10px] uppercase">
                  {customer.firstName[0]}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          {/* Optional Image Preview */}
          {images && images.length > 0 && (
            <div className="mb-5 aspect-[16/9] rounded-2xl overflow-hidden border border-white/5 group-hover:border-blue-500/20 transition-colors">
              <img 
                src={images[0]} 
                alt={title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                loading="lazy"
              />
            </div>
          )}

          {/* Content: Title & Description */}
          <div className="space-y-2 mb-4 text-left">
            <h3 className="text-xl font-black text-white leading-tight group-hover:text-blue-400 transition-colors">
              {truncatedTitle}
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed font-medium opacity-70">
              {truncatedDesc}
            </p>
          </div>

          {/* Status Row */}
          <div className="mb-6 flex">
             <StatusBadge status={status} className="px-3" />
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
              
              <div 
                className={cn(
                  "flex items-center gap-2 text-slate-500 dark:text-slate-400 group/address transition-colors",
                  address && "hover:text-blue-500 cursor-pointer"
                )}
                onClick={handleAddressClick}
              >
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover/address:bg-blue-500/20 transition-colors">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                   <span className="text-sm font-bold truncate max-w-[150px] group-hover/address:underline decoration-blue-500/30 underline-offset-4">
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
