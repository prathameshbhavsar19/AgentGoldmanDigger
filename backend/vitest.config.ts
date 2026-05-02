import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/services/**", "src/db/repo/**", "src/utils/**"],
      thresholds: {
        lines: 80,
        branches: 75,
      },
    },
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
