// Plain-JS версия seed-admin для production-контейнера (без tsx).
// Запускается из scripts/startup.js. Идемпотентно: upsert по role=ADMIN.
import { PrismaClient } from "@prisma/client";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const hash = await bcrypt.hash(password, 10);

  const existing = await prisma.user.findFirst({ where: { role: "ADMIN" } });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { firstName: "admin", passwordHash: hash },
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

  console.log("[SEED-ADMIN] Login: admin / Password:", password);
}

main()
  .catch((e) => console.error("[SEED-ADMIN] Error:", e))
  .finally(() => prisma.$disconnect());
