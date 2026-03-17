import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Типизируем переменные окружения для безопасности (стандарт 2026 года)
type Env = {
  DATABASE_URL: string;
};

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env<Env>("DATABASE_URL"),
  },
});
