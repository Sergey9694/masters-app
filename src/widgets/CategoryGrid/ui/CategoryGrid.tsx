"use client";

import * as Icons from "lucide-react";
import { motion, Variants } from "framer-motion";
import { cn } from "@/shared/lib/cn";
import { STAGGER_CONTAINER, STAGGER_ITEM } from "@/shared/lib/motion";

interface Category {
  id: string;
  name: string;
  icon: string | null;
}

export function CategoryGrid({ initialCategories, className }: { initialCategories: Category[], className?: string }) {
  return (
    <div className={cn("w-full mb-8", className)}>
      <motion.div 
        variants={STAGGER_CONTAINER}
        className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-x-4 gap-y-10"
      >
        {initialCategories.map((cat) => {
           const Icon = (Icons as any)[cat.icon || "Hammer"] || Icons.Hammer;
           
           return (
             <motion.div 
               key={cat.id} 
               variants={STAGGER_ITEM}
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.9 }}
               className="flex flex-col items-center gap-3 group relative cursor-pointer"
             >
                {/* Trident Glow Effect (Cyan) */}
                <div className="absolute inset-0 bg-cyan-500/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
                
                {/* Icon Container with Trident Branding */}
                <div className="w-16 h-16 rounded-[24px] bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 shadow-[0_8px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] flex items-center justify-center text-slate-800 dark:text-white group-hover:bg-gradient-to-tr group-hover:from-cyan-600 group-hover:to-indigo-600 group-hover:text-white group-hover:border-cyan-500 group-hover:shadow-cyan-500/40 transition-all duration-300 relative overflow-hidden ring-1 ring-white/5">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 dark:opacity-100 pointer-events-none" />
                  <Icon className="w-7 h-7 stroke-[1.8]" />
                </div>

                <span className="text-[10px] font-black text-slate-900 dark:text-slate-100 text-center leading-[1.3] uppercase tracking-wider group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors max-w-[70px]">
                  {cat.name.replace(' и ', ' & ')}
                </span>
             </motion.div>
           )
        })}
      </motion.div>
    </div>
  );
}
