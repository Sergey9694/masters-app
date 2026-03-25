"use client";

import { motion } from "framer-motion";
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
    success: "bg-gradient-to-tr from-cyan-600 to-indigo-600 border-white/40 shadow-[0_20px_50px_-10px_rgba(34,211,238,0.5)]",
    error: "bg-red-600 border-white/30 shadow-[0_15px_40px_-5px_rgba(239,68,68,0.5)]",
    info: "bg-gradient-to-tr from-indigo-600 to-purple-600 border-white/40",
    default: "glass-premium border-white/10 shadow-2xl",
  };

  return (
    <motion.div
      variants={TOAST_VARIANTS}
      initial="initial"
      animate="animate"
      exit="exit"
      className={cn(
        "flex w-full items-center gap-4 px-6 py-4 rounded-[24px] border text-white font-outfit font-bold",
        typeStyles[type],
        className
      )}
    >
      {children}
    </motion.div>
  );
}
