# 1. Base image
FROM node:20-alpine AS base

# 2. Builder
FROM base AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat libheif-dev openssl

# Копируем файлы конфигурации монорепозитория для установки зависимостей
COPY package*.json ./
COPY turbo.json ./
# Копируем package.json всех приложений и пакетов
COPY apps/web/package*.json ./apps/web/
COPY packages/api-client/package*.json ./packages/api-client/
COPY packages/shared-types/package*.json ./packages/shared-types/
COPY packages/validation/package*.json ./packages/validation/

# Устанавливаем зависимости (используем кеш npm)
RUN --mount=type=cache,target=/root/.npm npm ci

# Копируем исходный код
COPY . .

# Нативные бинарники для Alpine (musl)
RUN npm install --no-save --os=linux --libc=musl --cpu=x64 sharp @tailwindcss/oxide-linux-x64-musl && \
    cd apps/web && npm install --no-save --os=linux --libc=musl --cpu=x64 lightningcss @tailwindcss/oxide-linux-x64-musl

# Генерируем Prisma client (ставим prisma глобально — в npm workspaces
# бинарник из apps/web не всегда попадает в /app/node_modules/.bin)
RUN npm install -g prisma@5.22.0
RUN prisma generate --schema=./apps/web/prisma/schema.prisma

# Переменные окружения для билда
ARG NEXT_PUBLIC_BOT_NAME
ARG NEXT_PUBLIC_BOT_ID
ENV NEXT_PUBLIC_BOT_NAME="$NEXT_PUBLIC_BOT_NAME"
ENV NEXT_PUBLIC_BOT_ID="$NEXT_PUBLIC_BOT_ID"
ENV NEXT_TELEMETRY_DISABLED=1

# Собираем только веб-приложение
RUN npx turbo run build --filter=@uslugi/web

# 3. Production Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV="production"
ENV NEXT_TELEMETRY_DISABLED=1
ENV UPLOADS_DIR="/app/uploads"
ENV NODE_PATH="/usr/local/lib/node_modules"

# Устанавливаем необходимые системные зависимости и Prisma CLI для startup.js
RUN apk add --no-cache openssl libc6-compat curl && \
    npm install -g prisma@5.22.0 bcryptjs tsx@4.21.0 socket.io@4.8.3 @socket.io/redis-adapter@8.3.0 ioredis@5.10.1 typescript@5.5.4

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

RUN mkdir -p /app/uploads && chown nextjs:nodejs /app/uploads

# Копируем standalone сборку
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

# Prisma - копируем схему и сгенерированный клиент
# Клиент генерируется в apps/web/node_modules (prisma-client установлен там)
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/node_modules/.prisma ./apps/web/node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/node_modules/@prisma ./apps/web/node_modules/@prisma

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/scripts/startup.js ./startup.js
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/server.ts ./apps/web/server.ts
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/src ./apps/web/src

USER nextjs

EXPOSE 3000
ENV PORT="3000"
ENV HOSTNAME="0.0.0.0"

CMD ["node", "startup.js"]
