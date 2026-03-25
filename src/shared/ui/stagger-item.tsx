"use client";

import { motion } from "framer-motion";
import { STAGGER_ITEM } from "@/shared/lib/motion";
import { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
  variants?: any;
}

/**
 * Элемент для использования внутри StaggerWrap.
 * Является Client Component, что позволяет использовать его в RSC страницах.
 */
export function StaggerItem({ children, className, variants = STAGGER_ITEM }: StaggerItemProps) {
  return (
    <motion.div
      variants={variants}
      className={cn("w-full", className)}
    >
      {children}
    </motion.div>
  );
}
