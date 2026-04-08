"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/shared/lib/cn";

interface StatusAccordionProps {
  title: string;
  count: number;
  color: "orange" | "green" | "red";
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function StatusAccordion({
  title,
  count,
  color,
  defaultOpen = false,
  children,
}: StatusAccordionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  const colorStyles = {
    orange: {
      text: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      pill: "bg-amber-500",
      shadow: "shadow-[0_0_10px_rgba(251,191,36,0.3)]",
    },
    green: {
      text: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      pill: "bg-emerald-500",
      shadow: "shadow-[0_0_10px_rgba(16,185,129,0.3)]",
    },
    red: {
      text: "text-rose-400",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
      pill: "bg-rose-500",
      shadow: "shadow-[0_0_10px_rgba(244,63,94,0.3)]",
    },
  };

  const style = colorStyles[color];

  return (
    <div className="space-y-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between p-4 rounded-[20px] glass border transition-all active:scale-[0.98]",
          style.bg,
          style.border
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn("w-1.5 h-1.5 rounded-full", style.pill, style.shadow)} />
          <span className={cn("text-[13px] font-black uppercase tracking-[0.2em]", style.text)}>
            {title}
          </span>
          <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border", style.text, style.border)}>
            {count}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 transition-transform duration-300",
            style.text,
            isOpen && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0, marginTop: 0 }}
            animate={{ height: "auto", opacity: 1, marginTop: 16 }}
            exit={{ height: 0, opacity: 0, marginTop: 0 }}
            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
            className="overflow-hidden"
          >
            <div className="space-y-3 px-1 pb-2">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
