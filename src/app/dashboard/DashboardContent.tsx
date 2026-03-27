"use client";

import { motion } from "framer-motion";
import { STAGGER_CONTAINER, STAGGER_ITEM, HOVER_GLOW, CLICK_SCALE } from "@/shared/lib/motion";
import { Card } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Bell, MapPin, Search, PlusCircle, Hammer } from "lucide-react";
import Link from "next/link";
import { CategoryGrid } from "@/widgets/CategoryGrid";
import { ReactNode } from "react";
import { useMainButton } from "@/shared/lib/telegram/use-main-button";

interface DashboardContentProps {
  user: any;
  categories: any[];
}

export function DashboardContent({ user, categories }: DashboardContentProps) {
  // Активируем главную кнопку Telegram для быстрого поиска
  useMainButton({
    text: "НАЙТИ МАСТЕРОВ РЯДОМ 🔍",
    isVisible: true,
    onClick: () => {
      console.log("MainButton clicked: Searching for masters...");
      // Здесь можно вызвать триггер поиска из LocationFilter
    }
  });

  return (
    <motion.div 
      className="container-standard relative z-10"
      variants={STAGGER_CONTAINER}
      initial="initial"
      animate="animate"
    >
      {/* Header Section */}
      <motion.header className="flex items-center justify-between mb-12" variants={STAGGER_ITEM}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-blue-500/20">
            <div className="w-full h-full rounded-full border-2 border-white/20 dark:border-slate-800 overflow-hidden bg-slate-200 dark:bg-slate-900" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
              Привет, {user.firstName}!
            </h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mt-1">
              <MapPin className="w-3 h-3 text-blue-500" />
              Микрорайон: Академический
            </p>
          </div>
        </div>
        
        <Button variant="outline" size="icon" className="rounded-2xl w-12 h-12 border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl group hover:scale-105 active:scale-95 transition-all">
          <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-blue-500 transition-colors" />
        </Button>
      </motion.header>

      {/* Search Bar */}
      <motion.div className="relative mb-14 group" variants={STAGGER_ITEM}>
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
        </div>
        <input 
          type="text" 
          placeholder="Какого мастера вы ищете?" 
          className="w-full h-16 pl-14 pr-6 rounded-[24px] bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all shadow-xl shadow-slate-200/20 dark:shadow-none"
        />
      </motion.div>

      <div className="space-y-12 pb-32">
        {/* Widget: Service Selection */}
        <motion.div variants={STAGGER_ITEM}>
          <CategoryGrid initialCategories={categories} />
        </motion.div>

        {/* Action Cards */}
        <div className="space-y-6">
          <motion.h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 px-1 flex items-center gap-3" variants={STAGGER_ITEM}>
            Управление задачами
            <span className="w-1 h-1 rounded-full bg-indigo-600" />
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Link href="/dashboard/create-task" className="flex-1">
              <ActionCard 
                title="Озвучить проблему" 
                desc="Создайте тендер и выберите лучшего мастера по цене и отзывам" 
                icon={<PlusCircle className="w-6 h-6" />}
                color="bg-blue-600"
              />
            </Link>
            <Link href="/dashboard/feed" className="flex-1">
              <ActionCard 
                title="Лента заказов" 
                desc="Найдите новые заказы и предложите свои услуги в районе" 
                icon={<Search className="w-6 h-6" />}
                color="bg-indigo-600"
              />
            </Link>
            {!user.masterProfile ? (
              <ActionCard 
                title="Стать мастером" 
                desc="Начните помогать своим соседям и зарабатывать в свободное время" 
                icon={<Hammer className="w-6 h-6" />}
                color="bg-emerald-600"
              />
            ) : (
              <ActionCard 
                title="Мои активные заказы" 
                desc="Отслеживайте статус выполнения и общайтесь с исполнителями" 
                icon={<Bell className="w-6 h-6" />}
                color="bg-emerald-600"
              />
            )}
          </div>
        </div>
      </div>

      {/* Floating Navigation (2026 Signature Style) */}
      <motion.div 
        variants={STAGGER_ITEM}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[92%] max-w-[400px] h-20 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl rounded-[32px] border border-white/20 dark:border-slate-800 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] flex items-center justify-around px-2 z-50"
      >
          <NavItem icon={<Hammer className="w-6 h-6" />} active />
          <NavItem icon={<Search className="w-6 h-6" />} />
          
          <div className="relative -mt-12 group">
              <div className="absolute inset-x-0 bottom-[-10px] h-8 bg-blue-600/40 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-xl shadow-blue-500/40 text-white cursor-pointer hover:scale-105 active:scale-90 transition-all border-4 border-slate-50 dark:border-slate-950 relative z-10">
                  <PlusCircle className="w-10 h-10" />
              </div>
          </div>

          <NavItem icon={<Bell className="w-6 h-6" />} />
          <NavItem icon={<MapPin className="w-6 h-6" />} />
      </motion.div>
    </motion.div>
  );
}

function NavItem({ icon, active = false }: { icon: React.ReactNode, active?: boolean }) {
  return (
    <div className={`p-4 rounded-[22px] transition-all duration-500 cursor-pointer relative group ${active ? "text-white bg-gradient-to-tr from-cyan-600 to-blue-600 shadow-xl shadow-cyan-500/20" : "text-slate-500 hover:text-slate-200"}`}>
      {active && <div className="absolute inset-0 bg-cyan-400/30 blur-2xl rounded-full animate-pulse" />}
      <div className="relative z-10">{icon}</div>
    </div>
  );
}

function ActionCard({ title, desc, icon, color }: { title: string, desc: string, icon: React.ReactNode, color: string }) {
  const colorMap: Record<string, string> = {
    'bg-blue-600': 'bg-gradient-to-tr from-cyan-600 to-blue-600 shadow-cyan-500/30',
    'bg-indigo-600': 'bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-blue-500/30',
    'bg-emerald-600': 'bg-gradient-to-tr from-emerald-500 to-teal-600 shadow-emerald-500/30'
  };

  const finalColor = colorMap[color] || color;

  return (
    <motion.div
      variants={STAGGER_ITEM}
      whileHover={HOVER_GLOW}
      whileTap={CLICK_SCALE}
    >
      <Card className="p-6 border-none shadow-[0_20px_50px_rgba(0,0,0,0.3)] dark:shadow-none glass flex items-center gap-6 hover:bg-white/10 dark:hover:bg-slate-800 transition-all duration-500 cursor-pointer group active:scale-[0.97] rounded-[36px] border border-white/10 dark:border-white/20 select-none apple-card">
        <div className={`${finalColor} p-5 rounded-[26px] text-white shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="font-black text-slate-900 dark:text-cyan-400 uppercase text-[10px] tracking-[0.25em] mb-1.5 leading-none">{title}</h3>
          <p className="text-[13px] text-slate-600 dark:text-slate-300 font-bold leading-[1.4] opacity-90">{desc}</p>
        </div>
      </Card>
    </motion.div>
  );
}
