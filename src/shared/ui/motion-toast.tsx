"use client";

import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, Bell } from "lucide-react";
import { TOAST_VARIANTS } from "@/shared/lib/motion";
import { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

interface MotionToastProps {
  children: ReactNode;
  className?: string;
  type?: 'success' | 'error' | 'info' | 'default';
}

/**
 * Кастомный компонент тоста с анимацией Framer Motion.
 * Используется внутри Sonner для обеспечения премиального UX.
 */
export function MotionToast({ children, className, type = 'default' }: MotionToastProps) {
  const typeStyles = {
    success: "shadow-[0_20px_50px_-10px_rgba(34,211,238,0.3)]",
    error: "shadow-[0_15px_40px_-5px_rgba(239,68,68,0.3)]",
    info: "",
    default: "",
  };

  const Icon = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
    default: Bell,
  }[type];

  const isShortText = typeof children === 'string' && children.length < 30;

  return (
    <motion.div
      variants={TOAST_VARIANTS}
      initial="initial"
      animate="animate"
      exit="exit"
      className={cn(
        "flex min-w-[280px] max-w-sm items-center gap-3 px-5 py-3.5 rounded-[22px] text-white font-outfit font-bold",
        typeStyles[type],
        className
      )}
    >
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
        type === 'success' && "bg-emerald-500/20 text-emerald-400",
        type === 'error' && "bg-red-500/20 text-red-400",
        type === 'info' && "bg-indigo-500/20 text-indigo-400",
        type === 'default' && "bg-white/10 text-white",
      )}>
        <Icon className="w-4 h-4" />
      </div>
      <div className={cn(
        "flex-1 leading-snug",
        isShortText ? "text-[16px]" : "text-[14px] font-medium"
      )}>
        {children}
      </div>
    </motion.div>
  );
}
