"use client";

import * as Icons from "lucide-react";
import { motion, Variants } from "framer-motion";

interface Category {
  id: string;
  name: string;
  icon: string | null;
}

export function CategoryGrid({ initialCategories }: { initialCategories: Category[] }) {
  // Stagger animation variants
  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      }
    }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    show: { 
      opacity: 1, 
      y: 0, 
      scale: 1, 
      transition: { 
        type: "spring" as const, 
        stiffness: 300, 
        damping: 20 
      } 
    }
  };

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-8 px-1">
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-3">
          Каталог услуг
          <span className="w-1 h-1 rounded-full bg-blue-600 animate-pulse" />
        </h2>
        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
          Ближайший круг
        </span>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-x-4 gap-y-10"
      >
        {initialCategories.map((cat) => {
           const Icon = (Icons as any)[cat.icon || "Hammer"] || Icons.Hammer;
           
           return (
             <motion.div 
               key={cat.id} 
               variants={item}
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.9 }}
               className="flex flex-col items-center gap-3 group relative cursor-pointer"
             >
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-blue-500/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
                
                {/* Icon Container with Enhanced Visibility */}
                <div className="w-16 h-16 rounded-[24px] bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 shadow-[0_8px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] flex items-center justify-center text-slate-800 dark:text-white group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 group-hover:shadow-blue-500/40 transition-all duration-300 relative overflow-hidden">
                  {/* Subtle inner gradient for premium look */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 dark:opacity-100 pointer-events-none" />
                  <Icon className="w-7 h-7 stroke-[1.8]" />
                </div>

                <span className="text-[10px] font-black text-slate-900 dark:text-slate-100 text-center leading-[1.3] uppercase tracking-wider group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors max-w-[70px]">
                  {cat.name.replace(' и ', ' & ')}
                </span>

             </motion.div>
           )
        })}
      </motion.div>
    </div>
  );
}

