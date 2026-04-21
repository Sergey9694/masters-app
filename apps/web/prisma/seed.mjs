// Plain-JS версия сида для production-контейнера (без tsx).
// Используется из scripts/startup.js. Для локальной разработки остаётся seed.ts.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  { name: "Сантехника", slug: "santehnika", icon: "Wrench" },
  { name: "Электрика", slug: "elektrika", icon: "Zap" },
  { name: "Ремонт и отделка", slug: "remont", icon: "Hammer" },
  { name: "Бытовая техника", slug: "tehnika", icon: "Tv" },
  { name: "Мастер на час", slug: "master", icon: "Drill" },
  { name: "Клининг", slug: "cleaning", icon: "Sparkles" },
  { name: "Компьютеры и IT", slug: "it", icon: "Monitor" },
  { name: "Уборка снега/Двор", slug: "dvor", icon: "Shovel" },
];

async function main() {
  console.log("[SEED] Засеиваем категории...");
  for (const category of categories) {
    try {
      await prisma.category.upsert({
        where: { name: category.name },
        update: { 
          icon: category.icon,
          slug: category.slug 
        },
        create: { 
          name: category.name, 
          slug: category.slug,
          icon: category.icon 
        },
      });
      console.log(`[SEED] ok: ${category.name}`);
    } catch (err) {
      console.error(`[SEED] Error seeding ${category.name}:`, err.message);
    }
  }
  console.log("[SEED] Готово.");
}

main()
  .catch((e) => {
    console.error("[SEED] Критическая ошибка:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

