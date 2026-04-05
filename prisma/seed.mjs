// Plain-JS версия сида для production-контейнера (без tsx).
// Используется из scripts/startup.js. Для локальной разработки остаётся seed.ts.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  { name: "Сантехника", icon: "Wrench" },
  { name: "Электрика", icon: "Zap" },
  { name: "Ремонт и отделка", icon: "Hammer" },
  { name: "Бытовая техника", icon: "Tv" },
  { name: "Мастер на час", icon: "Drill" },
  { name: "Клининг", icon: "Sparkles" },
  { name: "Компьютеры и IT", icon: "Monitor" },
  { name: "Уборка снега/Двор", icon: "Shovel" },
];

async function main() {
  console.log("[SEED] Засеиваем категории...");
  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: { icon: category.icon },
      create: { name: category.name, icon: category.icon },
    });
    console.log(`[SEED] ok: ${category.name}`);
  }
  console.log("[SEED] Готово.");
}

main()
  .catch((e) => {
    console.error("[SEED] Ошибка:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
