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
  variant = 'grid',
  showAll = true
}: { 
  initialCategories: Category[], 
  className?: string,
  variant?: 'grid' | 'scroll',
  showAll?: boolean
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
    
    router.push(`/dashboard/feed?${params.toString()}`);
  }, [router, searchParams, activeCategoryId]);

  const categoriesToRender = showAll 
    ? [{ id: 'all', name: 'Все', icon: 'LayoutGrid' }, ...initialCategories]
    : initialCategories;

  return (
    <div className={cn("w-full transition-all duration-500", className)}>
      <motion.div 
        variants={STAGGER_CONTAINER}
        className={cn(
          "gap-x-4 transition-all duration-500",
          variant === 'grid' 
            ? "grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-y-6" 
            : "flex overflow-x-auto no-scrollbar py-2 px-1"
        )}
      >
        {categoriesToRender.map((cat) => {
           const Icon = (Icons as any)[cat.icon || "Hammer"] || Icons.Hammer;
           const isActive = activeCategoryId === cat.id || (cat.id === 'all' && !activeCategoryId);
           
           return (
             <motion.div 
               key={cat.id} 
               variants={STAGGER_ITEM}
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.9 }}
               onClick={() => onCategoryClick(cat.id)}
               className={cn(
                 "flex flex-col items-center gap-2 group relative cursor-pointer flex-shrink-0 transition-all",
                 variant === 'scroll' && "w-20"
               )}
             >
                {/* Icon Container with Neon Gradient Border */}
                <div className={cn(
                  "rounded-[22px] flex items-center justify-center transition-all duration-500 shadow-xl relative",
                  variant === 'grid' ? "w-16 h-16" : "w-14 h-14",
                  isActive 
                    ? "bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white shadow-cyan-500/40 scale-110" 
                    : "neon-border-gradient text-slate-800 dark:text-white bg-white/[0.03] group-hover:bg-white/[0.08]"
                )}>
                  {isActive && (
                    <motion.div 
                      layoutId="active-glow"
                      className="absolute inset-0 rounded-[22px] bg-cyan-400/20 blur-xl scale-125"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    />
                  )}
                  <Icon className={cn(
                    "stroke-[1.8] relative z-10 transition-colors duration-300",
                    variant === 'grid' ? "w-7 h-7" : "w-6 h-6",
                    isActive ? "text-white" : "group-hover:text-cyan-400"
                  )} />
                </div>

                <span className={cn(
                  "font-black uppercase tracking-wider text-center leading-[1.3] max-w-[70px] transition-colors duration-300",
                  variant === 'grid' ? "text-[10px]" : "text-[9px]",
                  isActive ? "text-cyan-400" : "text-slate-900 dark:text-slate-100 group-hover:text-cyan-400"
                )}>
                  {cat.name.replace(' и ', ' & ')}
                </span>
             </motion.div>
           )
        })}
      </motion.div>
    </div>
  );
}
