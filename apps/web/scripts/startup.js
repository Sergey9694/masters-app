const { execSync } = require("child_process");

function runSafe(cmd) {
    console.log(`[STARTUP] Running: ${cmd}`);
    try {
        execSync(cmd, { stdio: "inherit" });
    } catch (e) {
        console.log(`[STARTUP] Skipped or failed safely: ${e.message}`);
    }
}

async function main() {
    console.log("[STARTUP] Инициализация базы данных...");

    const PRISMA_CLI = "prisma";

    // Фикс прав на uploads (EACCES fix для Docker bind mount)
    const fs = require("fs");
    const path = require("path");
    const uploadsDir = path.join(__dirname, "uploads");
    try {
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        fs.chmodSync(uploadsDir, 0o777);
        console.log("[STARTUP] ✓ uploads/ directory permissions fixed (777)");
    } catch (e) {
        console.log(`[STARTUP] Warning: could not fix uploads/ permissions: ${e.message}`);
    }

    console.log("[STARTUP] Накатываем актуальные миграции...");
    
    // Проверка наличия URL базы данных для Prisma
    if (!process.env.DATABASE_URL) {
        console.error("[STARTUP] ОШИБКА: DATABASE_URL не задана! Миграции невозможны.");
    } else {
        console.log(`[STARTUP] База данных найдена: ${process.env.DATABASE_URL.split('@')[1]}`);
    }

    // Сначала резолвим зафейленные миграции (P3009), чтобы не застревать в crash-loop.
    // Это идемпотентная операция — если failed-миграций нет, команда просто проигнорируется.
    try {
        const { execSync: exec } = require("child_process");
        // Получаем список миграций и ищем failed
        const result = exec(`${PRISMA_CLI} migrate status`, {
            env: { ...process.env },
            encoding: "utf8",
            stdio: ["pipe", "pipe", "pipe"],
        });
        const failedMatches = result.match(/(\d{14}_\S+)\s+\(failed\)/g) || [];
        for (const match of failedMatches) {
            const migrationName = match.replace(/\s+\(failed\)/, "").trim();
            console.log(`[STARTUP] Resolving failed migration: ${migrationName}`);
            exec(`${PRISMA_CLI} migrate resolve --rolled-back ${migrationName}`, {
                stdio: "inherit",
                env: { ...process.env },
            });
        }
    } catch (e) {
        // migrate status может упасть если БД недоступна — просто пропускаем
        console.log(`[STARTUP] Could not check migration status: ${e.message}`);
    }

    // В продакшене используем deploy
    try {
        execSync(`${PRISMA_CLI} migrate deploy`, {
            stdio: "inherit",
            env: { ...process.env } // Явный проброс всех переменных
        });
    } catch (e) {
        console.log("[STARTUP] Ошибка миграций, возможно БД еще не готова или миграций нет.");
    }

    // Засеиваем справочники (идемпотентно через upsert)
    console.log("[STARTUP] Запускаем seed справочников...");
    runSafe("node prisma/seed.mjs");

    // Запускаем сервер Next.js (standalone mode)
    // Next.js standalone output кладёт server.js в корень директории (./),
    // которая копируется в /app. Путь apps/web/server.js — НЕВЕРЕН.
    const serverPath = path.join(__dirname, "server.js");
    console.log(`[STARTUP] Запускаем сервер Next.js... (${serverPath})`);
    require(serverPath);
}

main().catch((e) => {
    console.error("[STARTUP] Критическая ошибка:", e);
    process.exit(1);
});
