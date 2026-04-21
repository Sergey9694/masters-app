"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Briefcase, Search } from "lucide-react";

import { fadeIn, slideUp, staggerContainer, staggerItem } from "@/shared/lib/motion";
import { buttonVariants } from "@/shared/ui/button";
import { cn } from "@/shared/lib/cn";

/**
 * Hero-секция для неавторизованных пользователей.
 * Два ключевых CTA: создать заказ и предложить услугу.
 */
export function HeroSection() {
  return (
    <motion.section
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="relative overflow-hidden pt-14 pb-16 lg:pt-20 lg:pb-24"
    >
      <div className="pointer-events-none absolute inset-x-0 -top-20 h-[520px] bg-[radial-gradient(60%_60%_at_50%_0%,var(--color-primary)/0.12,transparent_60%)]" />

      <motion.div
        variants={staggerContainer}
        className="relative mx-auto max-w-3xl text-center"
      >
        <motion.div
          variants={staggerItem}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
        >
          <span className="size-1.5 rounded-full bg-primary" />
          Платформа услуг в вашем городе
        </motion.div>

        <motion.h1
          variants={slideUp}
          className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl"
        >
          Найдите услуги <span className="text-primary">рядом</span>
          <br className="hidden sm:block" /> с вами
        </motion.h1>

        <motion.p
          variants={slideUp}
          className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg"
        >
          Создайте заказ за минуту — и получите предложения от проверенных исполнителей.
          Или опубликуйте своё объявление и находите клиентов.
        </motion.p>

        <motion.div
          variants={slideUp}
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link
            href="/auth/login?next=/dashboard/create-order"
            className={cn(
              buttonVariants({ variant: "default", size: "lg" }),
              "group gap-2 w-full sm:w-auto"
            )}
          >
            <Search className="size-4" />
            Подобрать исполнителя
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>

          <Link
            href="/auth/login?next=/dashboard/become-provider"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "gap-2 w-full sm:w-auto"
            )}
          >
            <Briefcase className="size-4" />
            Предложить услугу
          </Link>
        </motion.div>
      </motion.div>
    </motion.section>
  );
}
