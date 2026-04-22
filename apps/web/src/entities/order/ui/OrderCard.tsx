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
import { OrderCardBase } from "./OrderCardBase";
import { useRouter } from "next/navigation";

import type { OrderCardData } from "@/shared/types/domain";

interface OrderCardProps {
  order: OrderCardData;
}

export function OrderCard({ order }: OrderCardProps) {
  const { title, description, budget, address, createdAt, category, client, images, distance, status, proposalCount, city } = order;
  const router = useRouter();

  const truncatedTitle = title.length > 35 ? title.substring(0, 32) + "..." : title;
  const truncatedDesc = description.length > 50 ? description.substring(0, 47) + "..." : description;

  return (
    <OrderCardBase
      onClick={() => router.push(`/orders/${order.id}`)}
      user={
        <div className="flex items-center gap-3">
          <Avatar className="w-9 h-9 rounded-full border border-white/10 overflow-hidden bg-slate-800">
            <AvatarImage src={client.avatar || ""} alt={client.firstName} className="object-cover" />
            <AvatarFallback className="bg-gradient-to-tr from-blue-500/20 to-indigo-500/20 text-blue-500 font-bold text-[10px] uppercase">
              {client.firstName[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">
              {client.firstName}
            </p>
            <div className="flex items-center gap-1.5 opacity-60">
              <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[8px] font-bold text-slate-500 uppercase">
                {city.name}
              </p>
            </div>
          </div>
        </div>
      }
      category={
        <div className="flex items-center gap-2">
           <Badge variant="category">
             {category.name}
           </Badge>
           {proposalCount > 0 && (
             <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[8px] font-black text-blue-400 uppercase tracking-widest">
                <MessageSquare className="w-2.5 h-2.5" />
                {proposalCount}
             </div>
           )}
        </div>
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
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
            <Banknote className="w-4 h-4" />
          </div>
          <span className="text-sm font-black whitespace-nowrap">
            {budget ? `${budget.toLocaleString()} ₽` : "Договорная"}
          </span>
        </div>
      }
      address={
        <div
          className="flex items-center gap-2 text-slate-400 group/address transition-colors hover:text-blue-400 cursor-pointer overflow-hidden"
          onClick={(e) => {
            if (address) {
              e.stopPropagation();
              window.open(getMapUrl(address), "_blank", "noopener,noreferrer");
            }
          }}
        >
          <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover/address:bg-blue-500/20 transition-colors shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold truncate underline decoration-blue-500/30 underline-offset-4">
            {address || city.name}
          </span>
        </div>
      }
      date={
        <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-widest opacity-60">
          <Clock className="w-3.5 h-3.5" />
          {formatSmartDate(createdAt)}
        </div>
      }
    />
  );
}
