import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Start seeding categories...");

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

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: { icon: category.icon },
      create: {
        name: category.name,
        icon: category.icon,
      },
    });
    console.log(`✅ Category created: ${category.name}`);
  }

  console.log("🌿 Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
