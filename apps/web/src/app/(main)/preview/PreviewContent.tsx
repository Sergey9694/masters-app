"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Sparkles, Zap } from "lucide-react";

import {
  fadeIn,
  hoverLift,
  slideUp,
  staggerContainer,
  staggerItem,
} from "@/shared/lib/motion";

const FEATURES = [
  {
    icon: Zap,
    title: "Быстрые отклики",
    desc: "Исполнители получают ваш заказ за секунды, а не за часы.",
  },
  {
    icon: CheckCircle2,
    title: "Проверенные профи",
    desc: "Рейтинг, отзывы и ручная модерация новых мастеров.",
  },
  {
    icon: Sparkles,
    title: "Рядом с вами",
    desc: "Только специалисты из вашего города и района.",
  },
];

export function PreviewContent() {
  return (
    <div className="space-y-16">
      {/* Hero */}
      <motion.section
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        <motion.div
          variants={slideUp}
          className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
        >
          <span className="size-1.5 rounded-full bg-primary" />
          Превью новой дизайн-системы
        </motion.div>

        <motion.h1
          variants={slideUp}
          className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl"
        >
          Услуги <span className="text-primary">рядом</span> с вами —
          <br className="hidden sm:block" />
          без поиска и переписки.
        </motion.h1>

        <motion.p
          variants={slideUp}
          className="max-w-xl text-base text-muted-foreground sm:text-lg"
        >
          Создайте заказ за минуту, выбирайте исполнителя по рейтингу и близости.
          Всё прозрачно, без посредников.
        </motion.p>

        <motion.div variants={slideUp} className="flex flex-wrap items-center gap-3">
          <button className="group inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90">
            Создать заказ
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </button>
          <button className="inline-flex h-11 items-center rounded-md border border-border bg-background px-5 text-sm font-medium text-foreground transition-colors hover:bg-subtle">
            Стать исполнителем
          </button>
        </motion.div>
      </motion.section>

      {/* Features */}
      <motion.section
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-10%" }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <motion.div
            key={title}
            variants={staggerItem}
            whileHover={hoverLift}
            className="group rounded-lg border border-border/60 bg-surface p-6 shadow-xs transition-shadow hover:shadow-sm"
          >
            <div className="inline-flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Icon className="size-5" />
            </div>
            <h3 className="mt-4 text-base font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
          </motion.div>
        ))}
      </motion.section>

      {/* Palette swatches — визуальная проверка токенов */}
      <motion.section
        variants={fadeIn}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="space-y-4"
      >
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Палитра
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          {[
            { name: "background", cls: "bg-background border" },
            { name: "surface", cls: "bg-surface border" },
            { name: "muted", cls: "bg-muted" },
            { name: "subtle", cls: "bg-subtle" },
            { name: "primary", cls: "bg-primary" },
            { name: "success", cls: "bg-success" },
            { name: "warning", cls: "bg-warning" },
            { name: "destructive", cls: "bg-destructive" },
          ].map(({ name, cls }) => (
            <div key={name} className="space-y-1.5">
              <div
                className={`h-16 rounded-md border-border/60 ${cls}`}
              />
              <p className="text-xs text-muted-foreground">{name}</p>
            </div>
          ))}
        </div>
      </motion.section>
    </div>
  );
}
