import Link from "next/link";
import * as Icons from "lucide-react";
import { LucideIcon } from "lucide-react";

import { db } from "@/shared/lib/db";

/**
 * Сетка популярных категорий для лендинга.
 * Берёт корневые категории (parentId=null) — они самые крупные.
 */
export async function PopularCategories() {
  const categories = await db.category.findMany({
    where: { parentId: null, isActive: true },
    orderBy: { sortOrder: "asc" },
    take: 12,
    select: { id: true, name: true, icon: true, slug: true },
  });

  if (!categories.length) return null;

  return (
    <section className="py-16 lg:py-20">
      <div className="max-w-2xl">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Популярные категории
        </h2>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Выберите то, что вам нужно — и мы найдём специалиста
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {categories.map((cat) => {
          const Icon: LucideIcon =
            ((cat.icon && (Icons as unknown as Record<string, LucideIcon>)[cat.icon]) ||
              Icons.Tag) as LucideIcon;

          return (
            <Link
              key={cat.id}
              href={`/dashboard/feed?categoryId=${cat.id}`}
              className="group flex flex-col items-start gap-3 rounded-lg border border-border/60 bg-surface p-5 transition-all hover:border-primary/30 hover:shadow-sm"
            >
              <div className="inline-flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary transition-transform group-hover:scale-110">
                <Icon className="size-5" />
              </div>
              <span className="text-sm font-medium leading-tight">{cat.name}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
