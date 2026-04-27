import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.test.ts", "src/**/*.spec.ts"],
    env: {
      ENCRYPTION_KEY: "a1b2c3d4".repeat(8),
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
