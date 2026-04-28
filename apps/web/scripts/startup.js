const { execSync, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const PRISMA_CLI = "prisma";

function runSafe(cmd) {
    console.log(`[STARTUP] Running: ${cmd}`);
    try {
        execSync(cmd, { stdio: "inherit" });
    } catch (e) {
        console.log(`[STARTUP] Skipped or failed safely: ${e.message}`);
    }
}

/**
 * Запускает `prisma migrate deploy`.
 * Возвращает { ok: true } или { ok: false, output: string } с текстом ошибки.
 * Используем spawnSync с piped stdio, чтобы всегда иметь доступ к stdout/stderr
 * даже при ненулевом exit-code (execSync бросает исключение и теряет вывод).
 */
function runMigrateDeploy() {
    const result = spawnSync(PRISMA_CLI, ["migrate", "deploy"], {
        env: { ...process.env },
        encoding: "utf8",
    });

    const output = (result.stdout || "") + (result.stderr || "");

    // Всегда показываем вывод в логах контейнера
    if (output.trim()) process.stdout.write(output);

    if (result.status === 0) {
        return { ok: true };
    }
    return { ok: false, output };
}

/**
 * Парсит имена зафейленных миграций из вывода Prisma P3009.
 * Prisma пишет: The `20260409101815_migration_name` migration started at ... failed
 */
function parseFailedMigrations(output) {
    const regex = /The `(\d{14}_\S+)` migration started at .+ failed/g;
    const names = [];
    let match;
    while ((match = regex.exec(output)) !== null) {
        names.push(match[1]);
    }
    return names;
}

async function main() {
    console.log("[STARTUP] Инициализация базы данных...");

    // ─── Фикс путей Prisma для seed-скриптов (ESM резолвит от /app/prisma/) ───
    try {
        const webPrisma = path.join(__dirname, "apps", "web", "node_modules", "@prisma", "client");
        const rootNodeModules = path.join(__dirname, "node_modules");
        const rootPrismaDir = path.join(rootNodeModules, "@prisma");
        const rootPrismaClient = path.join(rootPrismaDir, "client");
        
        const webDotPrisma = path.join(__dirname, "apps", "web", "node_modules", ".prisma");
        const rootDotPrisma = path.join(rootNodeModules, ".prisma");

        // Создаем иерархию папок если её нет
        if (!fs.existsSync(rootNodeModules)) fs.mkdirSync(rootNodeModules, { recursive: true });
        if (!fs.existsSync(rootPrismaDir)) fs.mkdirSync(rootPrismaDir, { recursive: true });

        if (fs.existsSync(webPrisma)) {
            if (fs.existsSync(rootPrismaClient)) fs.rmSync(rootPrismaClient, { recursive: true, force: true });
            fs.symlinkSync(webPrisma, rootPrismaClient);
            console.log("[STARTUP] ✓ @prisma/client symlinked");
        }
        if (fs.existsSync(webDotPrisma)) {
            if (fs.existsSync(rootDotPrisma)) fs.rmSync(rootDotPrisma, { recursive: true, force: true });
            fs.symlinkSync(webDotPrisma, rootDotPrisma);
            console.log("[STARTUP] ✓ .prisma symlinked");
        }
    } catch (e) {
        console.log(`[STARTUP] Warning: could not symlink prisma: ${e.message}`);
    }

    // ─── Фикс прав на uploads (EACCES fix для Docker bind mount) ───
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

    // ─── Миграции ───
    console.log("[STARTUP] Накатываем актуальные миграции...");

    if (!process.env.DATABASE_URL) {
        console.error("[STARTUP] ОШИБКА: DATABASE_URL не задана! Миграции невозможны.");
    } else {
        console.log(`[STARTUP] База данных найдена: ${process.env.DATABASE_URL.split("@")[1].split("/")[0]}`);
    }

    // Попытка 1: deploy
    let deployResult = runMigrateDeploy();

    if (!deployResult.ok) {
        // Проверяем на P3009 (зафейленные миграции блокируют деплой)
        const failedMigrations = parseFailedMigrations(deployResult.output);

        if (failedMigrations.length > 0) {
            console.log(`[STARTUP] Обнаружены зафейленные миграции P3009: ${failedMigrations.join(", ")}`);

            for (const name of failedMigrations) {
                console.log(`[STARTUP] Resolving: prisma migrate resolve --rolled-back ${name}`);
                const resolveResult = spawnSync(
                    PRISMA_CLI,
                    ["migrate", "resolve", "--rolled-back", name],
                    { env: { ...process.env }, encoding: "utf8", stdio: "inherit" }
                );
                if (resolveResult.status !== 0) {
                    console.log(`[STARTUP] Не удалось резолвить ${name}, пропускаем.`);
                }
            }

            // Попытка 2: повторный deploy после resolve
            console.log("[STARTUP] Повторный запуск migrate deploy после resolve...");
            deployResult = runMigrateDeploy();
            if (!deployResult.ok) {
                console.log("[STARTUP] Миграции всё ещё падают — продолжаем запуск сервера.");
            }
        } else {
            console.log("[STARTUP] Ошибка миграций без P3009 — возможно, БД ещё не готова.");
        }
    }

    // ─── Seed справочников (идемпотентно через upsert) ───
    console.log("[STARTUP] Запускаем seed справочников...");
    runSafe("node prisma/seed.mjs");

    // ─── Next.js standalone server ───
    // В монорепо `COPY .next/standalone ./` копирует структуру воркспейса:
    //   apps/web/.next/standalone/apps/web/server.js → /app/apps/web/server.js
    // Но статика и публичные файлы должны быть рядом с server.js или в корне.
    // Автоматически создаем симлинки, если их нет, чтобы Next.js нашел ассеты.
    const appDir = path.join(__dirname, "apps", "web");
    const nextDir = path.join(appDir, ".next");
    
    try {
        if (!fs.existsSync(nextDir)) fs.mkdirSync(nextDir, { recursive: true });
        
        const targetStatic = path.join(nextDir, "static");
        const sourceStatic = path.join(__dirname, ".next", "static");
        if (!fs.existsSync(targetStatic) && fs.existsSync(sourceStatic)) {
            fs.symlinkSync(sourceStatic, targetStatic);
            console.log("[STARTUP] Created symlink for .next/static");
        }

        const targetPublic = path.join(appDir, "public");
        const sourcePublic = path.join(__dirname, "public");
        if (!fs.existsSync(targetPublic) && fs.existsSync(sourcePublic)) {
            fs.symlinkSync(sourcePublic, targetPublic);
            console.log("[STARTUP] Created symlink for public assets");
        }
    } catch (e) {
        console.log(`[STARTUP] Warning during asset linking: ${e.message}`);
    }

    const serverTsPath = path.join(__dirname, "apps", "web", "server.ts");
    const serverJsPath = path.join(__dirname, "apps", "web", "server.js");
    
    console.log(`[STARTUP] Checking entry points: TS=${serverTsPath}, JS=${serverJsPath}`);

    if (fs.existsSync(serverTsPath)) {
        console.log(`[STARTUP] >>> Launching CUSTOM server.ts via tsx (Socket.io support)`);
        // Используем spawnSync для запуска tsx, чтобы он не упал при require (так как это TS)
        const child = require("child_process").spawn("tsx", [serverTsPath], {
            stdio: "inherit",
            env: { ...process.env, NODE_ENV: "production" }
        });
        child.on("exit", (code) => process.exit(code || 0));
        return; // Выходим из main, так как сервер запущен в дочернем процессе
    }

    if (fs.existsSync(serverJsPath)) {
        console.log(`[STARTUP] Launching Next.js standalone server.js...`);
        require(serverJsPath);
    } else {
        // Fallback: если структура отличается — ищем server.js или server.ts в корне
        const fallbackTs = path.join(__dirname, "server.ts");
        const fallbackJs = path.join(__dirname, "server.js");

        if (fs.existsSync(fallbackTs)) {
            console.log(`[STARTUP] Found fallback server.ts, launching via tsx`);
            const child = require("child_process").spawn("tsx", [fallbackTs], {
                stdio: "inherit",
                env: { ...process.env, NODE_ENV: "production" }
            });
            child.on("exit", (code) => process.exit(code || 0));
            return;
        }

        if (fs.existsSync(fallbackJs)) {
            require(fallbackJs);
        } else {
            throw new Error(`Entry point (server.ts/js) not found. Content of /app: ${fs.readdirSync(__dirname).join(", ")}`);
        }
    }
}

/**
 * Рекурсивный поиск файла в директории (ограничен глубиной).
 */
function findFile(dir, filename, maxDepth) {
    if (maxDepth <= 0) return null;
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.name === filename && entry.isFile()) {
                return path.join(dir, entry.name);
            }
        }
        for (const entry of entries) {
            if (entry.isDirectory() && entry.name !== "node_modules" && entry.name !== ".next") {
                const found = findFile(path.join(dir, entry.name), filename, maxDepth - 1);
                if (found) return found;
            }
        }
    } catch (_) {}
    return null;
}

main().catch((e) => {
    console.error("[STARTUP] Критическая ошибка:", e);
    process.exit(1);
});
