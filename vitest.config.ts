import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    isolate: false,
    reporters: ["verbose"],
    printConsoleTrace: true,
    disableConsoleIntercept: true,
    testTimeout: 60_000 // 60 seconds for Photopea loading
  },
  resolve: {
    alias: {
      "@": "/src"
    }
  }
})
