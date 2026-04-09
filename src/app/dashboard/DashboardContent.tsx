"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/shared/lib/cn";
import { STAGGER_CONTAINER, STAGGER_ITEM, HOVER_GLOW, CLICK_SCALE } from "@/shared/lib/motion";
import { Card } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import {
  Bell,
  Search,
  PlusCircle,
  Hammer,
  ClipboardList,
  MessageSquare,
  Star,
  TrendingUp,
  Briefcase,
  ArrowRight,
  User as UserIcon,
} from "lucide-react";
import Link from "next/link";
import { CategoryGrid } from "@/widgets/CategoryGrid";
import { SearchInput } from "@/widgets/TaskFeed/ui/SearchInput";
import type { DashboardPageData } from "@/shared/types/domain";
import { Avatar, AvatarImage, AvatarFallback } from "@/shared/ui/avatar";
import { SectionHeader } from "@/shared/ui/section-header";

export function DashboardContent({ user, categories, stats }: DashboardPageData) {
  const isMaster = !!user.masterProfile;

  return (
    <motion.div
      className="container-standard relative z-10"
      variants={STAGGER_CONTAINER}
      initial="initial"
      animate="animate"
    >
      {/* Header */}
      <motion.header className="flex items-center justify-between mb-8" variants={STAGGER_ITEM}>
        <Link href="/dashboard/become-master" className="block group/profile">
          <div className="flex items-center gap-4 group-hover/profile:opacity-90 transition-opacity">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-blue-500/20"
            >
              <Avatar className="w-full h-full rounded-full border-2 border-white/20 dark:border-slate-800 overflow-hidden bg-slate-200 dark:bg-slate-900">
                <AvatarImage src={user.avatar || ""} alt={user.firstName} className="object-cover" />
                <AvatarFallback className="flex items-center justify-center text-lg font-black text-slate-500 uppercase bg-transparent">
                  {user.firstName[0]}
                </AvatarFallback>
              </Avatar>
            </motion.div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white leading-tight flex items-center gap-2">
                Привет, {user.firstName}!
                <ArrowRight className="w-4 h-4 text-blue-500 opacity-0 -translate-x-2 group-hover/profile:opacity-100 group-hover/profile:translate-x-0 transition-all" />
              </h1>
              {isMaster && (
                <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1.5 mt-1">
                  <Hammer className="w-3 h-3" />
                  Мастер
                </p>
              )}
            </div>
          </div>
        </Link>

        <Link href="/dashboard/notifications">
          <Button
            variant="outline"
            size="icon"
            className="rounded-2xl w-12 h-12 glass-card hover:scale-110 active:scale-90 transition-all relative border-white/10 shadow-lg"
          >
            <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-blue-500 transition-colors" />
            {stats.unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] font-black text-white flex items-center justify-center">
                {stats.unreadNotificationsCount > 9 ? "9+" : stats.unreadNotificationsCount}
              </span>
            )}
          </Button>
        </Link>
      </motion.header>

      <div className="space-y-6 pb-32">
        {/* ── Direct Search Bar ── */}
        <motion.div variants={STAGGER_ITEM} className="px-1">
          <SectionHeader title="Поиск" accentColor="blue" className="mb-4" />
          <SearchInput />
        </motion.div>

        {/* ── Categories ── */}
        <motion.div variants={STAGGER_ITEM} className="px-1">
          <SectionHeader title="Категории услуг" accentColor="indigo" className="mb-3" />
          <CategoryGrid initialCategories={categories} variant="row" />
        </motion.div>

        {/* ── Master Section ── */}
        {isMaster && stats.masterStats && (
          <>
            {/* Master Stats */}
            <motion.div variants={STAGGER_ITEM}>
              <SectionHeader title="Панель мастера" accentColor="emerald" className="mb-5" />
              <div className="grid grid-cols-3 gap-3">
                <StatCard
                  label="Рейтинг"
                  value={stats.masterStats.rating.toFixed(1)}
                  icon={<Star className="w-4 h-4" />}
                  color="text-amber-400"
                />
                <StatCard
                  label="Отзывы"
                  value={String(stats.masterStats.reviewsCount)}
                  icon={<MessageSquare className="w-4 h-4" />}
                  color="text-blue-400"
                  href="/dashboard/reviews"
                />
                <StatCard
                  label="В работе"
                  value={String(stats.masterStats.activeTasksCount)}
                  icon={<Briefcase className="w-4 h-4" />}
                  color="text-emerald-400"
                  href="/dashboard/my-responses"
                />
              </div>
            </motion.div>

            {/* Master Actions */}
            <div className="space-y-5">
              <motion.div variants={STAGGER_ITEM}>
                <SectionHeader title="Заказы" accentColor="emerald" className="mb-5" />
              </motion.div>
              <motion.div variants={STAGGER_ITEM} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href={`/dashboard/masters/${user.masterProfile?.id}`}>
                  <ActionCard
                    title="Мой профиль"
                    desc="Посмотрите как видят ваш профиль заказчики"
                    icon={<UserIcon className="w-6 h-6" />}
                    color="bg-amber-600"
                    badge="Публичный"
                  />
                </Link>
                <Link href="/dashboard/feed">
                  <ActionCard
                    title="Найти заказы"
                    desc="Новые заявки в вашем районе — откликнитесь первым"
                    icon={<Search className="w-6 h-6" />}
                    color="bg-emerald-600"
                    badge={null}
                  />
                </Link>
                <Link href="/dashboard/my-responses">
                  <ActionCard
                    title="Мои отклики"
                    desc="Отслеживайте статус ваших откликов"
                    icon={<MessageSquare className="w-6 h-6" />}
                    color="bg-blue-600"
                    badge={
                      stats.masterStats.pendingResponsesCount > 0 
                        ? `${stats.masterStats.pendingResponsesCount} активных` 
                        : null
                    }
                  />
                </Link>
              </motion.div>
            </div>
          </>
        )}

        {/* ── Customer Section ── */}
        <div className="space-y-5">
          <motion.div variants={STAGGER_ITEM}>
            <SectionHeader 
              title={isMaster ? "Как заказчик" : "Мои задачи"} 
              accentColor="indigo" 
              className="mb-5" 
            />
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/dashboard/create-task">
              <ActionCard
                title="Создать заявку"
                desc="Опишите задачу — мастера сами предложат цену"
                icon={<PlusCircle className="w-6 h-6" />}
                color="bg-blue-600"
                badge={null}
              />
            </Link>
            <Link href="/dashboard/my-tasks">
              <ActionCard
                title="Мои заявки"
                desc="Статус, отклики мастеров и ход работы"
                icon={<ClipboardList className="w-6 h-6" />}
                color="bg-indigo-600"
                badge={
                  stats.openResponsesCount > 0
                    ? `${stats.openResponsesCount} новых откликов`
                    : stats.activeTasksCount > 0
                      ? `${stats.activeTasksCount} активных`
                      : null
                }
              />
            </Link>
          </div>
        </div>

        {/* ── Become Master CTA ── */}
        {!isMaster && (
          <motion.div variants={STAGGER_ITEM}>
            <Link href="/dashboard/become-master">
              <Card className="p-6 rounded-[28px] border border-emerald-500/20 bg-gradient-to-r from-emerald-950/40 to-teal-950/40 hover:from-emerald-950/60 hover:to-teal-950/60 transition-all group cursor-pointer">
                <div className="flex items-center gap-5">
                  <div className="bg-gradient-to-tr from-emerald-500 to-teal-600 p-4 rounded-[20px] text-white shadow-xl shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                    <Hammer className="w-7 h-7" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-black text-emerald-400 mb-1">Стать мастером</h3>
                    <p className="text-sm text-slate-400 leading-snug">
                      Помогайте соседям и зарабатывайте — бесплатная регистрация
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-emerald-500 group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>
            </Link>
          </motion.div>
        )}

        {/* ── Browse Feed ── */}
        {!isMaster && (
          <div className="space-y-5">
            <motion.div variants={STAGGER_ITEM}>
              <SectionHeader title="Лента заказов" accentColor="indigo" className="mb-5" />
            </motion.div>
            <Link href="/dashboard/feed">
              <ActionCard
                title="Все заявки"
                desc="Посмотрите открытые заявки в вашем районе"
                icon={<TrendingUp className="w-6 h-6" />}
                color="bg-indigo-600"
                badge={null}
              />
            </Link>
          </div>
        )}

      </div>
    </motion.div>
  );
}

/* ── Sub-components ── */

function StatCard({
  label,
  value,
  icon,
  color,
  href,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  href?: string;
}) {
  const colorMap: Record<string, string> = {
    "text-amber-400": "from-amber-400/20 to-transparent",
    "text-blue-400": "from-blue-400/20 to-transparent",
    "text-emerald-400": "from-emerald-400/20 to-transparent",
  };

  const Content = (
    <Card className={cn(
      "relative overflow-hidden p-4 rounded-[24px] glass-card border-none flex flex-col items-start gap-1 h-full min-h-[90px] group transition-all",
      href && "cursor-pointer hover:bg-white/10 active:scale-[0.98]"
    )}>
      {/* Background Accent */}
      <div className={`absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl ${colorMap[color] || "from-blue-400/10 to-transparent"} opacity-50 blur-xl`} />
      
      <div className="flex items-start justify-between w-full">
        <p className={cn("text-2xl font-black leading-none tracking-tight text-white group-hover:scale-105 transition-transform origin-left")}>
          {value}
        </p>
        <div className={`${color} opacity-40 group-hover:opacity-100 transition-opacity`}>
          {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-3.5 h-3.5" }) : icon}
        </div>
      </div>

      <p className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-500 mt-1">
        {label}
      </p>

      {/* Decorative Indicator */}
      <div className={cn("absolute bottom-3 right-3 w-1 h-1 rounded-full", color.replace("text-", "bg-"), "opacity-30")} />
    </Card>
  );

  return (
    <motion.div variants={STAGGER_ITEM} whileHover={{ y: -2 }} className="flex-1">
      {href ? (
        <Link href={href} className="block h-full">
          {Content}
        </Link>
      ) : Content}
    </motion.div>
  );
}

function ActionCard({
  title,
  desc,
  icon,
  color,
  badge,
}: {
  title: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  badge: string | null;
}) {
  const colorMap: Record<string, string> = {
    "bg-blue-600": "bg-gradient-to-tr from-cyan-600 to-blue-600 shadow-cyan-500/30",
    "bg-indigo-600": "bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-blue-500/30",
    "bg-emerald-600": "bg-gradient-to-tr from-emerald-500 to-teal-600 shadow-emerald-500/30",
  };

  return (
    <motion.div variants={STAGGER_ITEM} whileHover={HOVER_GLOW} whileTap={CLICK_SCALE}>
      <Card className="p-6 border-none shadow-[0_20px_50px_rgba(0,0,0,0.3)] dark:shadow-none glass-card flex flex-col items-start gap-5 hover:bg-white/10 dark:hover:bg-slate-800 transition-all duration-500 cursor-pointer group active:scale-[0.97] rounded-[32px] border border-white/10 dark:border-white/20 select-none relative overflow-visible">
        {badge && (
          <span className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] whitespace-nowrap animate-in fade-in zoom-in duration-300 z-20 border border-white/10">
            {badge}
          </span>
        )}
        <div
          className={`${colorMap[color] || color} p-4 rounded-[20px] text-white shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}
        >
          {icon}
        </div>
        <div className="text-left">
          <h3 className="font-black text-slate-900 dark:text-cyan-400 uppercase text-[12px] tracking-[0.2em] mb-2 leading-tight">
            {title}
          </h3>
          <p className="text-[13px] text-slate-600 dark:text-slate-300 font-bold leading-[1.5] opacity-80">
            {desc}
          </p>
        </div>
      </Card>
    </motion.div>
  );
}
