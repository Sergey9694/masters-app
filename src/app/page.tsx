"use client";

import { TelegramAuth } from "@/features/auth/ui/TelegramAuth";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { ShieldCheck, MapPin, Users, Hammer } from "lucide-react";
import Link from "next/link";
import { mockLogin } from "@/features/auth/model/actions";
import { motion } from "framer-motion";
import {
  STAGGER_CONTAINER,
  STAGGER_ITEM,
  BLUR_IN,
  HOVER_GLOW,
  CLICK_SCALE,
  TRANSITIONS
} from "@/shared/lib/motion";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-slate-950 dark:to-slate-900 overflow-hidden">
      {/* Автоматический вход через Telegram */}
      <TelegramAuth />

      {/* Эффект свечения на фоне */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-blue-500/10 blur-[120px] pointer-events-none"
      />

      {/* 
          CENTRAL STANDARD CONTAINER 
          Using .container-standard ensures 15px/30px padding on mobile 
      */}
      <motion.div
        className="container-standard relative flex flex-col items-center text-center pt-24 min-h-screen"
        variants={STAGGER_CONTAINER}
      >
        {/* Анимированная иконка */}
        <motion.div
          className="mb-10 relative"
          variants={BLUR_IN}
        >
          <div className="absolute inset-0 bg-blue-600 blur-2xl opacity-20 animate-pulse" />
          <motion.div
            className="relative p-5 bg-blue-600 rounded-3xl shadow-2xl shadow-blue-500/40 cursor-default"
            whileHover={{ rotate: 0, scale: 1.05 }}
            initial={{ rotate: 6 }}
            transition={TRANSITIONS.PREMIUM}
          >
            <Hammer className="w-12 h-12 text-white" />
          </motion.div>
        </motion.div>

        <motion.h1
          className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6 leading-[1.1]"
          variants={STAGGER_ITEM}
        >
          Районный <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 font-black">
            Мастер 2026
          </span>
        </motion.h1>

        <motion.p
          className="text-lg text-slate-600 dark:text-slate-400 mb-10 leading-relaxed max-w-[280px]"
          variants={STAGGER_ITEM}
        >
          Лучшие специалисты района в 15 минутах от вашей двери.
        </motion.p>

        {/* Сетка преимуществ */}
        <div className="grid gap-4 w-full mb-12 text-left">
          <FeatureCard
            icon={<MapPin className="w-5 h-5 text-blue-500" />}
            title="Только рядом"
            desc="Мастера в радиусе 15 минут езды. Минимум времени на ожидание."
          />
          <FeatureCard
            icon={<ShieldCheck className="w-5 h-5 text-emerald-500" />}
            title="Проверено соседями"
            desc="Ручная верификация документов и честный рейтинг."
          />
          <FeatureCard
            icon={<Users className="w-5 h-5 text-violet-500" />}
            title="Свои люди"
            desc="Поддержите местных профи и забудьте о рисках с улицы."
          />
        </div>

        {/* Кнопка действия */}
        <motion.div className="w-full space-y-6" variants={STAGGER_ITEM}>
          <div className="w-full">
            <Button asChild size="lg" className="w-full text-lg h-16 rounded-2xl shadow-xl shadow-blue-600/30 bg-blue-600 hover:bg-blue-700 transition-all font-bold">
              <a href={process.env.NEXT_PUBLIC_BOT_NAME ? `https://t.me/${process.env.NEXT_PUBLIC_BOT_NAME}` : "/dashboard"}>
                Запустить Сервис
              </a>
            </Button>
          </div>

          {process.env.NODE_ENV === "development" && (
            <form action={mockLogin}>
              <Button variant="ghost" className="w-full text-slate-400 text-xs hover:text-blue-500 transition-colors">
                Войти как Тестовый Админ (Dev Only)
              </Button>
            </form>
          )}

          <div className="flex items-center justify-center gap-2 text-slate-400">
            <div className="h-px w-8 bg-slate-200" />
            <span className="text-[10px] uppercase tracking-widest font-semibold text-slate-400">Telegram Web App</span>
            <div className="h-px w-8 bg-slate-200" />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <motion.div
      variants={STAGGER_ITEM}
      whileHover={HOVER_GLOW}
      whileTap={CLICK_SCALE}
    >
      <Card className="p-4 border-none shadow-sm bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl flex gap-4 items-start border border-white/20 dark:border-slate-800 cursor-pointer group">
        <div className="p-2.5 bg-blue-50 dark:bg-slate-700 rounded-xl shadow-inner group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">{title}</h3>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-snug">{desc}</p>
        </div>
      </Card>
    </motion.div>
  );
}
