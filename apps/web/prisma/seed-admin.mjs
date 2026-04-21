// Plain-JS версия seed-admin для production-контейнера (без tsx).
// Запускается из scripts/startup.js. Идемпотентно: upsert по role=ADMIN.
import { PrismaClient } from "@prisma/client";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const prisma = new PrismaClient();

// Хеш для пароля по умолчанию "admin123" (bcrypt)
const DEFAULT_HASH = "$2b$10$NdM3fU/bmC4KTM89H6s2.ev5G8ruP1h.BdHN8hEUFpTwLJ46bI4/S";

async function main() {
  const password = process.env.ADMIN_PASSWORD;
  let hash = DEFAULT_HASH;

  // Если пароль передан через ENV, пытаемся его захешировать
  if (password) {
    try {
      const bcrypt = require("bcryptjs");
      hash = await bcrypt.hash(password, 10);
    } catch (err) {
      console.warn("[SEED-ADMIN] Warning: bcryptjs not found, using default hash for admin.");
      console.warn("[SEED-ADMIN] If you want a custom password, ensure bcryptjs is available.");
      hash = DEFAULT_HASH; // Fallback to default hash
    }
  }

  const existing = await prisma.user.findFirst({ where: { role: "ADMIN" } });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { 
        firstName: "admin", 
        passwordHash: hash,
        phone: "79990000000" // Гарантируем наличие телефона для админа
      },
    });
    console.log("[SEED-ADMIN] Admin updated (id:", existing.id + ")");
  } else {
    const user = await prisma.user.create({
      data: {
        firstName: "admin",
        role: "ADMIN",
        phone: "79990000000",
        passwordHash: hash,
      },
    });
    console.log("[SEED-ADMIN] Admin created (id:", user.id + ")");
  }

  if (!password) {
    console.log("[SEED-ADMIN] Default credentials: Login: admin / Password: admin123");
  } else {
    console.log("[SEED-ADMIN] Custom password set from ENV.");
  }
}

main()
  .catch((e) => console.error("[SEED-ADMIN] Error:", e))
  .finally(() => prisma.$disconnect());

