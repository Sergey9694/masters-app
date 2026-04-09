"use client";

import { motion } from "framer-motion";
import { Card } from "@/shared/ui/card";
import { STAGGER_ITEM } from "@/shared/lib/motion";
import { useHaptics } from "@/shared/lib/telegram/use-haptics";
import { cn } from "@/shared/lib/cn";
import { ReactNode } from "react";

interface TaskCardBaseProps {
  category?: ReactNode;
  user?: ReactNode;
  image?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  status?: ReactNode;
  budget?: ReactNode;
  address?: ReactNode;
  responsesCount?: ReactNode;
  date?: ReactNode;
  onClick?: () => void;
  className?: string;
  isClickable?: boolean;
}

/**
 * Базовый компонент карточки задачи для соблюдения единого дизайна (Neo-Glass).
 * Используется в ленте, списках и на странице деталей.
 */
export function TaskCardBase({
  category,
  user,
  image,
  title,
  description,
  status,
  budget,
  address,
  responsesCount,
  date,
  onClick,
  className,
  isClickable = true
}: TaskCardBaseProps) {
  const haptics = useHaptics();

  const content = (
    <Card className={cn(
      "p-0 border-none glass-card overflow-hidden rounded-[32px] transition-all duration-500 min-h-full flex flex-col",
      isClickable && "hover:shadow-2xl hover:shadow-blue-500/10",
      className
    )}>
      <div className="p-6 flex flex-col flex-1">
        {/* Top Row: User (Left) & Category (Right) */}
        {(category || user) && (
          <div className="flex items-center justify-between mb-5">
            <div>{user}</div>
            <div>{category}</div>
          </div>
        )}

        {/* Image Preview */}
        {image && (
          <div className="mb-5 aspect-[16/9] rounded-2xl overflow-hidden border border-white/5">
            {image}
          </div>
        )}

        {/* Content: Title & Description */}
        <div className="space-y-2 mb-6 text-left flex-1">
          {status && <div className="mb-2">{status}</div>}
          {title}
          {description && (
            <div className="text-sm text-slate-400 leading-relaxed font-medium opacity-70">
              {description}
            </div>
          )}
        </div>

        {/* Multi-row scattered Footer */}
        <div className="mt-auto space-y-4 pt-5 border-t border-white/10 dark:border-slate-800 text-left">
          {/* Row 1: Budget (L) & Address (R) */}
          {(budget || address) && (
            <div className="flex items-center justify-between gap-4">
              <div className="flex-shrink-0">{budget}</div>
              <div className="text-right flex-1 overflow-hidden flex justify-end">{address}</div>
            </div>
          )}

          {/* Row 2: Responses (L) & Date (R) */}
          {(responsesCount || date) && (
            <div className="flex items-center justify-between gap-4">
              <div className="flex-shrink-0">{responsesCount}</div>
              <div className="text-right ml-auto">{date}</div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );

  if (!isClickable) return content;

  return (
    <motion.div
      variants={STAGGER_ITEM}
      whileHover={{ y: -4, scale: 1.005 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => {
        haptics.selection();
        onClick?.();
      }}
      className="group cursor-pointer"
    >
      {content}
    </motion.div>
  );
}
