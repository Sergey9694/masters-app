"use client";

import { motion } from "framer-motion";
import { FileText, MessagesSquare, CheckCircle2, LucideIcon } from "lucide-react";

import { staggerContainer, staggerItem } from "@/shared/lib/motion";
import { Container } from "@/shared/ui/container";

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
    desc: "Исполнитель приезжает и делает работу. Вы оставляете отзыв и платите за результат.",
  },
];

/**
 * Блок «Как это работает» — 3 шага.
 * Крупные номера, соединительные пунктиры между шагами на десктопе.
 */
export function HowItWorks() {
  return (
    <section className="bg-muted/40 py-20 lg:py-24">
      <Container size="2xl">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Как это работает
          </span>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Три шага от задачи до результата
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Всё просто и прозрачно — никаких скрытых комиссий и посредников
          </p>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-10%" }}
          className="relative mt-14 grid gap-8 sm:grid-cols-3 sm:gap-6"
        >
          {/* Соединительный пунктир между шагами (только md+) */}
          <div
            aria-hidden
            className="pointer-events-none absolute top-16 left-[17%] right-[17%] hidden border-t-2 border-dashed border-border sm:block"
          />

          {STEPS.map((step, idx) => (
            <motion.div
              key={step.title}
              variants={staggerItem}
              className="relative flex flex-col items-center text-center"
            >
              <div className="relative z-10 mb-6 flex size-20 items-center justify-center rounded-full border border-border bg-surface shadow-sm">
                <step.icon className="size-8 text-primary" />
                <span className="absolute -top-2 -right-2 flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-md">
                  {idx + 1}
                </span>
              </div>
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}
