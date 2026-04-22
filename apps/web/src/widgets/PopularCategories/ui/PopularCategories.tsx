import Link from "next/link";
import * as Icons from "lucide-react";
import { ArrowUpRight, LucideIcon } from "lucide-react";

import { db } from "@/shared/lib/db";
import { Container } from "@/shared/ui/container";

/**
 * Цветовая палитра акцентов для карточек категорий.
 * Циклически применяется к списку по индексу.
 */
const ACCENT_PALETTE = [
  { bg: "bg-amber-50", icon: "bg-amber-100 text-amber-700", hover: "hover:bg-amber-100/60", dark: "dark:bg-amber-950/30 dark:hover:bg-amber-950/50" },
  { bg: "bg-sky-50", icon: "bg-sky-100 text-sky-700", hover: "hover:bg-sky-100/60", dark: "dark:bg-sky-950/30 dark:hover:bg-sky-950/50" },
  { bg: "bg-emerald-50", icon: "bg-emerald-100 text-emerald-700", hover: "hover:bg-emerald-100/60", dark: "dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50" },
  { bg: "bg-violet-50", icon: "bg-violet-100 text-violet-700", hover: "hover:bg-violet-100/60", dark: "dark:bg-violet-950/30 dark:hover:bg-violet-950/50" },
  { bg: "bg-rose-50", icon: "bg-rose-100 text-rose-700", hover: "hover:bg-rose-100/60", dark: "dark:bg-rose-950/30 dark:hover:bg-rose-950/50" },
  { bg: "bg-orange-50", icon: "bg-orange-100 text-orange-700", hover: "hover:bg-orange-100/60", dark: "dark:bg-orange-950/30 dark:hover:bg-orange-950/50" },
  { bg: "bg-teal-50", icon: "bg-teal-100 text-teal-700", hover: "hover:bg-teal-100/60", dark: "dark:bg-teal-950/30 dark:hover:bg-teal-950/50" },
  { bg: "bg-indigo-50", icon: "bg-indigo-100 text-indigo-700", hover: "hover:bg-indigo-100/60", dark: "dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50" },
  { bg: "bg-fuchsia-50", icon: "bg-fuchsia-100 text-fuchsia-700", hover: "hover:bg-fuchsia-100/60", dark: "dark:bg-fuchsia-950/30 dark:hover:bg-fuchsia-950/50" },
  { bg: "bg-lime-50", icon: "bg-lime-100 text-lime-700", hover: "hover:bg-lime-100/60", dark: "dark:bg-lime-950/30 dark:hover:bg-lime-950/50" },
  { bg: "bg-cyan-50", icon: "bg-cyan-100 text-cyan-700", hover: "hover:bg-cyan-100/60", dark: "dark:bg-cyan-950/30 dark:hover:bg-cyan-950/50" },
  { bg: "bg-pink-50", icon: "bg-pink-100 text-pink-700", hover: "hover:bg-pink-100/60", dark: "dark:bg-pink-950/30 dark:hover:bg-pink-950/50" },
];

/**
 * Сетка популярных категорий с цветными акцентами.
 * Серверный компонент: корневые категории (parentId=null).
 */
export async function PopularCategories() {
  const categories = await db.category.findMany({
    where: { parentId: null, isActive: true },
    orderBy: { sortOrder: "asc" },
    take: 12,
    select: { id: true, name: true, icon: true },
  });

  if (!categories.length) return null;

  return (
    <section className="py-20 lg:py-24">
      <Container size="2xl">
        <div className="flex items-end justify-between gap-4">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Категории
            </span>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Выберите, что нужно сделать
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              Более 100 категорий услуг — от бытовой помощи до сложных работ
            </p>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {categories.map((cat, idx) => {
            const accent = ACCENT_PALETTE[idx % ACCENT_PALETTE.length];
            const Icon: LucideIcon =
              ((cat.icon && (Icons as unknown as Record<string, LucideIcon>)[cat.icon]) ||
                Icons.Tag) as LucideIcon;

            return (
              <Link
                key={cat.id}
                href={`/orders?categoryId=${cat.id}`}
                className={`group relative flex flex-col gap-4 overflow-hidden rounded-2xl ${accent.bg} ${accent.dark} ${accent.hover} p-5 transition-all hover:-translate-y-0.5`}
              >
                <div className={`inline-flex size-11 items-center justify-center rounded-xl ${accent.icon} transition-transform group-hover:scale-110`}>
                  <Icon className="size-5" />
                </div>

                <div className="flex items-end justify-between gap-2">
                  <span className="text-sm font-semibold leading-tight text-foreground">
                    {cat.name}
                  </span>
                  <ArrowUpRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
                </div>
              </Link>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
