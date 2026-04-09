"use client";

import Link from "next/link";
import { ChevronRight, Banknote, Clock, CheckCircle2, MapPin } from "lucide-react";
import { formatSmartDate } from "@/shared/lib/date";
import { Card } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { StatusBadge } from "@/shared/ui/status-badge";
import { cn } from "@/shared/lib/cn";
import { getMapUrl } from "@/shared/lib/maps";

interface TaskListItemProps {
  title: string;
  description?: string;
  category: string;
  status: string;
  price?: number | null;
  address?: string | null;
  date: Date;
  href: string;
  responsesCount?: number;
  isChosen?: boolean;
  className?: string;
}

export function TaskListItem({
  title,
  description,
  category,
  status,
  price,
  address,
  date,
  href,
  responsesCount,
  isChosen,
  className
}: TaskListItemProps) {
  const truncatedTitle = title.length > 50 ? title.substring(0, 47) + "..." : title;
  const truncatedDesc = description && description.length > 60 
    ? description.substring(0, 57) + "..." 
    : description;

  const handleAddressClick = (e: React.MouseEvent) => {
    if (!address) return;
    e.preventDefault();
    e.stopPropagation();
    window.open(getMapUrl(address), "_blank", "noopener,noreferrer");
  };

  return (
    <Link href={href} className={cn("block group", className)}>
      <Card className="glass border-none p-5 rounded-[32px] hover:bg-white/5 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300">
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex items-center justify-between">
            <Badge variant="category" className="whitespace-nowrap">
              {category}
            </Badge>
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-white group-hover:bg-blue-500/20 group-hover:translate-x-1 transition-all">
               <ChevronRight className="w-4 h-4" />
            </div>
          </div>
          
          <div className="min-w-0">
            <h3 className="text-xl font-black text-white leading-tight mb-2 group-hover:text-blue-400 transition-colors">
              {truncatedTitle}
            </h3>
            {truncatedDesc && (
              <p className="text-xs font-medium text-slate-400 leading-relaxed opacity-80">
                {truncatedDesc}
              </p>
            )}
          </div>

          <div className="flex">
            <StatusBadge status={status} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-white/5">
          
          {isChosen && (
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 flex items-center gap-1.5 border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Вы выбраны
            </span>
          )}

          <div className="flex items-center gap-3">
              {/* Price with Premium Style */}
              <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                   <Banknote className="w-4 h-4" />
                 </div>
                 <span className="text-xs font-black text-slate-200">
                   {price !== undefined && price !== null ? `${price.toLocaleString()} ₽` : "Договорная"}
                 </span>
              </div>

              {/* Address with Premium Style */}
              {address && (
                 <div 
                   className="flex items-center gap-2 group/addr"
                   onClick={handleAddressClick}
                 >
                   <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover/addr:bg-blue-500/20 transition-colors">
                     <MapPin className="w-4 h-4" />
                   </div>
                   <span className="text-xs font-bold text-slate-400 truncate max-w-[120px] group-hover/addr:text-blue-400 transition-colors">
                     {address}
                   </span>
                 </div>
              )}

             {responsesCount !== undefined && responsesCount > 0 && (
                <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 border border-indigo-500/10">
                  <div className="w-1 h-1 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)] animate-pulse" />
                  {responsesCount} откликов
                </span>
             )}
          </div>

          <span className="ml-auto flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap opacity-60">
            <Clock className="w-3.5 h-3.5" />
            {formatSmartDate(date)}
          </span>
        </div>
      </Card>
    </Link>
  );
}
