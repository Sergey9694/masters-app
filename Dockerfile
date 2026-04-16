# 1. Base image
FROM node:20-alpine AS base

# 2. Builder
FROM base AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat libheif-dev openssl

# Копируем всё (node_modules исключены через .dockerignore)
COPY . .

# Устанавливаем зависимости
RUN --mount=type=cache,target=/root/.npm npm ci

# Нативные бинарники для Alpine (musl):
# sharp — обработка изображений
# @tailwindcss/oxide — нативный движок Tailwind CSS v4
# lightningcss — CSS-минификатор, используемый Tailwind через @tailwindcss/postcss
# Принудительно ставим musl-варианты, т.к. lock-файл сгенерирован на Windows
RUN npm install --no-save --os=linux --libc=musl --cpu=x64 sharp @tailwindcss/oxide-linux-x64-musl && \
    cd apps/web && npm install --no-save --os=linux --libc=musl --cpu=x64 lightningcss @tailwindcss/oxide-linux-x64-musl

# Генерируем Prisma client
RUN npx prisma@5.22.0 generate --schema=./apps/web/prisma/schema.prisma

# Переменные окружения для билда
ARG NEXT_PUBLIC_BOT_NAME
ENV NEXT_PUBLIC_BOT_NAME="$NEXT_PUBLIC_BOT_NAME"

# Собираем Next.js
RUN --mount=type=cache,target=/app/apps/web/.next/cache \
    npm run build

# 3. Production Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV="production"

RUN apk add --no-cache openssl libc6-compat curl
RUN npm install -g prisma@5.22.0

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

RUN mkdir -p /app/uploads && chown nextjs:nodejs /app/uploads

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/scripts/startup.js ./startup.js

USER nextjs

EXPOSE 3000
ENV PORT="3000"
ENV HOSTNAME="0.0.0.0"

CMD ["node", "startup.js"]
