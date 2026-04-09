"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { MapPin, Clock, Banknote, MessageSquare } from "lucide-react";
import { formatSmartDate } from "@/shared/lib/date";
import { useHaptics } from "@/shared/lib/telegram/use-haptics";
import { Avatar, AvatarImage, AvatarFallback } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { StatusBadge } from "@/shared/ui/status-badge";
import { cn } from "@/shared/lib/cn";
import { getMapUrl } from "@/shared/lib/maps";
import { TaskCardBase } from "./TaskCardBase";
import { useRouter } from "next/navigation";

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
    _count?: {
      responses: number;
    };
  };
}

export function TaskCard({ task }: TaskCardProps) {
  const { title, description, budget, address, createdAt, category, customer, images, distance, status, _count } = task;
  const router = useRouter();

  const truncatedTitle = title.length > 35 ? title.substring(0, 32) + "..." : title;
  const truncatedDesc = description.length > 50 ? description.substring(0, 47) + "..." : description;

  const responsesCount = _count?.responses ?? 0;

  return (
    <TaskCardBase
      onClick={() => router.push(`/dashboard/task/${task.id}`)}
      user={
        <div className="flex items-center gap-3">
          <Avatar className="w-9 h-9 rounded-full border border-white/10 overflow-hidden bg-slate-800">
            <AvatarImage src={customer.avatar || ""} alt={customer.firstName} className="object-cover" />
            <AvatarFallback className="bg-gradient-to-tr from-blue-500/20 to-indigo-500/20 text-blue-500 font-bold text-[10px] uppercase">
              {customer.firstName[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">
              {customer.firstName}
            </p>
            <div className="flex items-center gap-1.5 opacity-60">
               <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
               <p className="text-[8px] font-bold text-slate-500 uppercase">В районе</p>
            </div>
          </div>
        </div>
      }
      category={
        <Badge variant="category">
          {category.name}
        </Badge>
      }
      image={images && images.length > 0 ? (
        <img 
          src={images[0]} 
          alt={title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
          loading="lazy"
        />
      ) : undefined}
      title={
        <h3 className="text-xl font-black text-white leading-tight group-hover:text-blue-400 transition-colors">
          {truncatedTitle}
        </h3>
      }
      description={truncatedDesc}
      status={<StatusBadge status={status} className="px-3" />}
      budget={
        <div className="flex items-center gap-2 text-slate-200">
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <Banknote className="w-4 h-4" />
          </div>
          <span className="text-sm font-black">
            {budget ? `${budget.toLocaleString()} ₽` : "Договорная"}
          </span>
        </div>
      }
      address={address ? (
        <div 
          className="flex items-center gap-2 text-slate-400 group/address transition-colors hover:text-blue-400 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            window.open(getMapUrl(address), "_blank", "noopener,noreferrer");
          }}
        >
          <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover/address:bg-blue-500/20 transition-colors">
            <MapPin className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold truncate max-w-[150px] underline decoration-blue-500/30 underline-offset-4">
            {address}
          </span>
        </div>
      ) : undefined}
      date={
        <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-widest opacity-60">
          <Clock className="w-3.5 h-3.5" />
          {formatSmartDate(createdAt)}
        </div>
      }
    />
  );
}
