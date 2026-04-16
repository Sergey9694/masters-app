# 1. Base image
FROM node:20-alpine AS base

# 2. Dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat libheif-dev
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/web/package.json ./apps/web/package.json
COPY apps/mobile/package.json ./apps/mobile/package.json
COPY packages/shared-types/package.json ./packages/shared-types/package.json
COPY packages/validation/package.json ./packages/validation/package.json
COPY packages/api-client/package.json ./packages/api-client/package.json

# 👇 Используем кэш для npm, чтобы ускорить повторную установку
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# А затем принудительно доустанавливаем sharp для Linux Alpine (musl)
RUN npm install --os=linux --libc=musl --cpu=x64 sharp

# 3. Builder
FROM base AS builder
WORKDIR /app
# 👇 libc6-compat и openssl необходимы для npx prisma generate в Alpine
RUN apk add --no-cache libc6-compat openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma@5.22.0 generate --schema=./apps/web/prisma/schema.prisma

# Применяем переменные окружения для билда (клиентские NEXT_PUBLIC)
ARG NEXT_PUBLIC_BOT_NAME
ENV NEXT_PUBLIC_BOT_NAME="$NEXT_PUBLIC_BOT_NAME"

# 👇 Используем кэш Next.js (.next/cache)
RUN --mount=type=cache,target=/app/apps/web/.next/cache \
    npm run build

# 4. Production Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV="production"

# Добавляем необходимые пакеты
RUN apk add --no-cache openssl libc6-compat curl
# 👇 Устанавливаем Prisma стабильной версии для миграций
RUN npm install -g prisma@5.22.0

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Папка для загрузок
RUN mkdir -p /app/uploads && chown nextjs:nodejs /app/uploads

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/scripts/startup.js ./startup.js

USER nextjs

EXPOSE 3000
ENV PORT="3000"
ENV HOSTNAME="0.0.0.0"

CMD ["node", "startup.js"]
