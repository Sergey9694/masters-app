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
        className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-x-4 gap-y-6"
      >
        {initialCategories.map((cat) => {
           const Icon = (Icons as any)[cat.icon || "Hammer"] || Icons.Hammer;
           
           return (
             <motion.div 
               key={cat.id} 
               variants={STAGGER_ITEM}
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.9 }}
               className="flex flex-col items-center gap-2 group relative cursor-pointer"
             >
                {/* Icon Container with Neon Gradient Border */}
                <div className="w-16 h-16 rounded-[24px] neon-border-gradient flex items-center justify-center text-slate-800 dark:text-white transition-all duration-300 shadow-xl shadow-black/20 group-hover:shadow-cyan-500/20 group-hover:bg-white/5">
                  <Icon className="w-7 h-7 stroke-[1.8] group-hover:text-cyan-400 transition-colors" />
                </div>

                <span className="text-[10px] font-black text-slate-900 dark:text-slate-100 text-center leading-[1.3] uppercase tracking-wider group-hover:text-cyan-400 transition-colors max-w-[70px]">
                  {cat.name.replace(' и ', ' & ')}
                </span>
             </motion.div>
           )
        })}
      </motion.div>
    </div>
  );
}
