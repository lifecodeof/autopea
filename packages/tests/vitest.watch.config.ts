import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

const fromRoot = (...parts: string[]) =>
  fileURLToPath(new URL(`../${parts.join("/")}`, import.meta.url))

export default defineConfig({
  test: {
    isolate: false,
    printConsoleTrace: true,
    disableConsoleIntercept: true,
    slowTestThreshold: 3_000,
    testTimeout: 10_000,
  },
  resolve: {
    alias: [
      { find: "@", replacement: fromRoot("autopea/src") },
      {
        find: /^autopea\/contracts\/(.+)$/,
        replacement: fromRoot("autopea/src/contracts/$1"),
      },
      { find: /^autopea$/, replacement: fromRoot("autopea/src/index.ts") },
      {
        find: /^autopea-playwright$/,
        replacement: fromRoot("autopea-playwright/src/index.ts"),
      },
    ],
  },
})
