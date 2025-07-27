import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    isolate: false,
    reporters: ["verbose"],
    printConsoleTrace: true,
    disableConsoleIntercept: true,
    testTimeout: 15_000 // 15 seconds
  },
  resolve: {
    alias: {
      "@": "/src"
    }
  }
})
