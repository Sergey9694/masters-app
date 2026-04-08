"use client";

import Link from "next/link";
import { ChevronRight, Banknote, Clock, CheckCircle2 } from "lucide-react";
import { formatSmartDate } from "@/shared/lib/date";
import { Card } from "./card";
import { Badge } from "./badge";
import { StatusBadge } from "./status-badge";
import { cn } from "@/shared/lib/cn";

interface TaskListItemProps {
  title: string;
  description?: string;
  category: string;
  status: any;
  price?: number | null;
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
  date,
  href,
  responsesCount,
  isChosen,
  className
}: TaskListItemProps) {
  const truncatedTitle = title.length > 30 ? title.substring(0, 27) + "..." : title;
  const truncatedDesc = description && description.length > 40 
    ? description.substring(0, 37) + "..." 
    : description;

  return (
    <Link href={href} className={cn("block group", className)}>
      <Card className="glass border-none p-5 rounded-[24px] hover:bg-white/5 transition-all">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-black text-white leading-tight mb-1">
              {truncatedTitle}
            </h3>
            {truncatedDesc && (
              <p className="text-[11px] font-medium text-slate-400 leading-snug opacity-80">
                {truncatedDesc}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
            <Badge variant="category" className="whitespace-nowrap">
              {category}
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={status} />
          
          {isChosen && (
            <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 flex items-center gap-1 border border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3" />
              Вы выбраны
            </span>
          )}

          {price !== undefined && price !== null && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-slate-300">
              <Banknote className="w-3 h-3 text-emerald-400" />
              {price.toLocaleString()} ₽
            </span>
          )}

          {responsesCount !== undefined && (
            <span className="px-2 py-0.5 rounded-md bg-indigo-500/5 text-[10px] font-bold text-indigo-400/80 uppercase tracking-wider flex items-center gap-1.5">
              <div className="w-1 h-1 rounded-full bg-indigo-500 shadow-[0_0_5px_rgba(99,102,241,0.5)]" />
              {responsesCount} откликов
            </span>
          )}

          <span className="ml-auto flex items-center gap-1 text-[10px] text-slate-500 whitespace-nowrap">
            <Clock className="w-3 h-3" />
            {formatSmartDate(date)}
          </span>
        </div>
      </Card>
    </Link>
  );
}
