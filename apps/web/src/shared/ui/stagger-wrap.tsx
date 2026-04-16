"use client";

import { motion } from "framer-motion";
import { STAGGER_CONTAINER } from "@/shared/lib/motion";
import { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

interface StaggerWrapProps {
  children: ReactNode;
  className?: string;
}

/**
 * Обертка для реализации каскадной анимации (Stagger).
 * Состояния initial/animate наследуются от глобального Template,
 * что предотвращает двойное срабатывание анимаций.
 */
export function StaggerWrap({ children, className }: StaggerWrapProps) {
  return (
    <motion.div
      variants={STAGGER_CONTAINER}
      className={cn("w-full", className)}
    >
      {children}
    </motion.div>
  );
}
