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

    console.log("[STARTUP] Накатываем актуальные миграции...");
    
    // Проверка наличия URL базы данных для Prisma
    if (!process.env.DATABASE_URL) {
        console.error("[STARTUP] ОШИБКА: DATABASE_URL не задана! Миграции невозможны.");
    } else {
        console.log(`[STARTUP] База данных найдена: ${process.env.DATABASE_URL.split('@')[1]}`);
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

    // Запускаем сервер Next.js (standalone mode)
    console.log("[STARTUP] Запускаем сервер Next.js...");
    require("./server.js");
}

main().catch((e) => {
    console.error("[STARTUP] Критическая ошибка:", e);
    process.exit(1);
});
