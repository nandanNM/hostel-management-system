import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    // Tests live in `tests/`, mirroring the `src/` path of what they cover -
    // `tests/lib/date.test.ts` covers `src/lib/date.ts`.
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    environment: "node",
    // Pin the clock zone so a laptop and CI agree; CI re-runs other zones.
    env: { TZ: "UTC" },
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      // Coverage is measured over the source, never over the tests.
      include: ["src/lib/**/*.ts"],
      exclude: ["src/lib/generated/**"],
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
})
