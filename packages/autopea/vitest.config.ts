import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    isolate: false,
    reporters: ["verbose"],
    printConsoleTrace: true,
    disableConsoleIntercept: true,
    slowTestThreshold: 3_000,
    testTimeout: 10_000
  },
  resolve: {
    alias: {
      "@": "/src"
    }
  }
})
