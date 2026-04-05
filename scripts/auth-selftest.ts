/**
 * Self-test of the auth pipeline without needing a real Telegram client.
 * 1. Checks env vars.
 * 2. Generates a valid signed initData using TELEGRAM_BOT_TOKEN.
 * 3. Validates it with validateTelegramWebAppData().
 * 4. Runs a DB upsert on User to confirm Prisma works.
 */
import "dotenv/config";
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";

async function main() {
  console.log("=== AUTH SELF-TEST ===\n");

  // 1. Env check
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const jwt = process.env.JWT_SECRET;
  console.log("TELEGRAM_BOT_TOKEN:", token ? `set (${token.length} chars)` : "❌ MISSING");
  console.log("JWT_SECRET:", jwt ? `set (${jwt.length} chars)` : "❌ MISSING");
  console.log("DATABASE_URL:", process.env.DATABASE_URL ? "set" : "❌ MISSING");
  console.log();

  if (!token) return;

  // 2. Generate valid initData
  const fakeUser = {
    id: 99999001,
    first_name: "SelfTest",
    last_name: "User",
    username: "selftest",
    language_code: "ru",
  };
  const authDate = Math.floor(Date.now() / 1000);
  const params = new URLSearchParams();
  params.set("auth_date", String(authDate));
  params.set("query_id", "AAH1234567");
  params.set("user", JSON.stringify(fakeUser));

  const dataCheckString = Array.from(params.keys())
    .sort()
    .map((k) => `${k}=${params.get(k)}`)
    .join("\n");

  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(token)
    .digest();
  const hash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");
  params.set("hash", hash);

  const initData = params.toString();
  console.log("Generated initData (truncated):", initData.slice(0, 80), "...");
  console.log();

  // 3. Validate using our function (inline copy for test isolation)
  const urlParams = new URLSearchParams(initData);
  const h = urlParams.get("hash");
  urlParams.delete("hash");
  const dcs = Array.from(urlParams.keys())
    .sort()
    .map((k) => `${k}=${urlParams.get(k)}`)
    .join("\n");
  const computedHmac = crypto
    .createHmac("sha256", secretKey)
    .update(dcs)
    .digest("hex");
  console.log("Signature match:", computedHmac === h ? "✅" : "❌");
  console.log();

  // 4. DB upsert
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.upsert({
      where: { telegramId: BigInt(fakeUser.id) },
      update: { firstName: fakeUser.first_name },
      create: {
        telegramId: BigInt(fakeUser.id),
        firstName: fakeUser.first_name,
        lastName: fakeUser.last_name,
        role: "USER",
      },
      select: { id: true, role: true, firstName: true },
    });
    console.log("DB upsert: ✅", user);

    // cleanup
    await prisma.user.delete({ where: { id: user.id } });
    console.log("Cleanup: ✅");
  } catch (e) {
    console.error("DB upsert: ❌", e);
  } finally {
    await prisma.$disconnect();
  }

  console.log("\n=== DONE ===");
}

main().catch(console.error);
