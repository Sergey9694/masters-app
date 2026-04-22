"use client";

import * as Icons from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/shared/lib/cn";
import { STAGGER_CONTAINER, STAGGER_ITEM } from "@/shared/lib/motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface Category {
  id: string;
  name: string;
  icon: string | null;
}

export function CategoryGrid({ 
  initialCategories, 
  className,
  variant = 'row' // renamed row to filter-bar
}: { 
  initialCategories: Category[], 
  className?: string,
  variant?: 'grid' | 'row'
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategoryId = searchParams ? searchParams.get("categoryId") : null;

  const onCategoryClick = useCallback((id: string) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    
    if (activeCategoryId === id) {
      params.delete("categoryId");
    } else {
      params.set("categoryId", id);
    }
    
    router.push(`/orders?${params.toString()}`);
  }, [router, searchParams, activeCategoryId]);

  const categoriesToRender = [{ id: 'all', name: 'Все', icon: 'LayoutGrid' }, ...initialCategories];

  return (
    <div className={cn("w-full relative py-0", className)}>
      <motion.div 
        variants={STAGGER_CONTAINER}
        className="flex items-center gap-3 overflow-x-auto no-scrollbar px-[15px] -mx-[15px] sm:px-[var(--ui-desktop-px)] sm:-mx-[var(--ui-desktop-px)] py-4 scroll-smooth"
      >
        {categoriesToRender.map((cat) => {
           const Icon = (Icons as any)[cat.icon || "Hammer"] || Icons.Hammer;
           const isActive = activeCategoryId === cat.id || (cat.id === 'all' && !activeCategoryId);
           
           return (
             <motion.button
               key={cat.id} 
               variants={STAGGER_ITEM}
               whileHover={{ scale: 1.02 }}
               whileTap={{ scale: 0.95 }}
               onClick={() => onCategoryClick(cat.id)}
               className={cn(
                 "relative flex items-center justify-center gap-2 px-5 py-2.5 rounded-full whitespace-nowrap overflow-hidden group flex-shrink-0 transition-all duration-500",
                 isActive 
                   ? "bg-white/20 shadow-[0_0_20px_rgba(34,211,238,0.2)] border-cyan-500/50 backdrop-blur-md" 
                   : "glass-card shadow-none"
               )}
             >
                {/* Active Background Liquid Glow */}
                {isActive && (
                  <motion.div 
                    layoutId="pill-active-bg"
                    className="absolute inset-0 bg-gradient-to-r from-cyan-600/20 to-indigo-600/20 z-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}

                <Icon className={cn(
                   "w-4 h-4 transition-all duration-300 relative z-10",
                   isActive ? "text-cyan-400 scale-110" : "text-slate-400 group-hover:text-white"
                )} />

                <span className={cn(
                  "text-xs font-bold uppercase tracking-widest relative z-10 transition-all duration-300",
                  isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300 shadow-text-sm"
                )}>
                  {cat.name}
                </span>

                {isActive && (
                   <motion.div 
                     layoutId="active-underline"
                     className="absolute bottom-0 left-1/4 right-1/4 h-[2px] bg-cyan-400 shadow-[0_0_10px_#22d3ee] rounded-full"
                   />
                )}
             </motion.button>
           )
        })}
      </motion.div>
    </div>
  );
}
