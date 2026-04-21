"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, Sparkles, TrendingUp, Users, Shield } from "lucide-react";

import { fadeIn, slideUp, staggerContainer, staggerItem } from "@/shared/lib/motion";
import { buttonVariants } from "@/shared/ui/button";
import { Container } from "@/shared/ui/container";
import { cn } from "@/shared/lib/cn";

const POPULAR_QUERIES = [
  "Уборка квартиры",
  "Сборка мебели",
  "Ремонт",
  "Курьер",
  "Репетитор",
];

const TRUST_BADGES = [
  { icon: Users, label: "10 000+", sub: "исполнителей" },
  { icon: TrendingUp, label: "24/7", sub: "доступ к заказам" },
  { icon: Shield, label: "100%", sub: "безопасные сделки" },
];

/**
 * Hero-секция лендинга.
 * Gradient-фон с цветными акцентами, поисковая строка по центру,
 * под ней — популярные запросы и trust-бейджи (как на YouDo).
 */
export function HeroSection() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = query.trim();
    const url = trimmed
      ? `/dashboard/feed?query=${encodeURIComponent(trimmed)}`
      : "/dashboard/feed";
    router.push(url);
  };

  return (
    <section className="relative overflow-hidden">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-linear-to-b from-primary/5 via-background to-background" />
        <div className="absolute -top-32 left-1/2 h-150 w-225 -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute top-20 right-0 h-75 w-75 rounded-full bg-warning/10 blur-[80px]" />
        <div className="absolute top-40 left-0 h-70 w-70 rounded-full bg-success/10 blur-[80px]" />
      </div>

      <Container size="2xl" className="relative">
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="pt-16 pb-20 lg:pt-24 lg:pb-28"
        >
          <motion.div
            variants={staggerContainer}
            className="mx-auto max-w-4xl text-center"
          >
            <motion.div
              variants={staggerItem}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5 text-xs font-semibold text-primary"
            >
              <Sparkles className="size-3.5" />
              Платформа №1 для поиска услуг в вашем городе
            </motion.div>

            <motion.h1
              variants={slideUp}
              className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl xl:text-7xl"
            >
              Любые услуги{" "}
              <span className="relative inline-block">
                <span className="relative z-10 text-primary">рядом</span>
                <span className="absolute inset-x-0 bottom-1 h-3 bg-primary/15 lg:h-4" />
              </span>
              <br className="hidden sm:block" /> с вами за минуту
            </motion.h1>

            <motion.p
              variants={slideUp}
              className="mx-auto mt-6 max-w-xl text-base text-muted-foreground sm:text-lg"
            >
              Создайте заказ — и получите предложения от проверенных исполнителей. Или станьте исполнителем и находите клиентов.
            </motion.p>

            {/* Search bar */}
            <motion.form
              variants={slideUp}
              onSubmit={onSubmit}
              className="mx-auto mt-8 flex w-full max-w-2xl items-center gap-2 rounded-full border border-border bg-surface p-1.5 shadow-lg shadow-primary/5 transition-shadow focus-within:shadow-xl focus-within:shadow-primary/10"
            >
              <div className="flex flex-1 items-center gap-3 pl-4">
                <Search className="size-5 shrink-0 text-muted-foreground" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Что нужно сделать?"
                  className="h-12 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
                  aria-label="Поиск услуги"
                />
              </div>
              <button
                type="submit"
                className={cn(
                  buttonVariants({ variant: "default", size: "lg" }),
                  "shrink-0 rounded-full px-6"
                )}
              >
                Найти
              </button>
            </motion.form>

            {/* Popular queries */}
            <motion.div
              variants={slideUp}
              className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm"
            >
              <span className="text-xs font-medium text-muted-foreground">
                Часто ищут:
              </span>
              {POPULAR_QUERIES.map((q) => (
                <Link
                  key={q}
                  href={`/dashboard/feed?query=${encodeURIComponent(q)}`}
                  className="rounded-full border border-border/60 bg-surface px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
                >
                  {q}
                </Link>
              ))}
            </motion.div>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="mx-auto mt-16 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3"
          >
            {TRUST_BADGES.map(({ icon: Icon, label, sub }) => (
              <motion.div
                key={label}
                variants={staggerItem}
                className="flex items-center gap-3 rounded-xl border border-border/60 bg-surface/80 p-4 backdrop-blur-sm"
              >
                <div className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <div className="text-left">
                  <p className="text-lg font-bold leading-tight">{label}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}
