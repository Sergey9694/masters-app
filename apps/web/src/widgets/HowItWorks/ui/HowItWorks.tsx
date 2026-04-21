"use client";

import { motion } from "framer-motion";
import { FileText, MessagesSquare, CheckCircle2, LucideIcon } from "lucide-react";

import { staggerContainer, staggerItem, hoverLift } from "@/shared/lib/motion";

interface Step {
  icon: LucideIcon;
  title: string;
  desc: string;
}

const STEPS: Step[] = [
  {
    icon: FileText,
    title: "Опишите задачу",
    desc: "Расскажите, что нужно сделать, укажите бюджет и сроки. Это займёт не больше минуты.",
  },
  {
    icon: MessagesSquare,
    title: "Получите предложения",
    desc: "Исполнители откликаются со своими условиями. Выбирайте по рейтингу, отзывам и цене.",
  },
  {
    icon: CheckCircle2,
    title: "Работа сделана",
    desc: "Исполнитель приезжает и делает работу. Вы оставляете отзыв и платите только за результат.",
  },
];

/**
 * Блок «Как это работает» — 3 шага для неавторизованных пользователей.
 */
export function HowItWorks() {
  return (
    <section className="py-16 lg:py-20">
      <div className="max-w-2xl">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Как это работает
        </h2>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Три простых шага от задачи до результата
        </p>
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-10%" }}
        className="mt-10 grid gap-4 sm:grid-cols-3"
      >
        {STEPS.map((step, idx) => (
          <motion.div
            key={step.title}
            variants={staggerItem}
            whileHover={hoverLift}
            className="relative rounded-lg border border-border/60 bg-surface p-6 shadow-xs transition-shadow hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="inline-flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <step.icon className="size-5" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground">
                0{idx + 1}
              </span>
            </div>
            <h3 className="mt-4 text-base font-semibold">{step.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{step.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
