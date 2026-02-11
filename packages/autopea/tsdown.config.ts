import { defineConfig } from "tsdown"

export default defineConfig({
  entry: ["src/index.ts", "src/contracts/*.ts"],
  alias: {
    "@": "./src"
  },
  skipNodeModulesBundle: true,
  dts: { sourcemap: true },
  sourcemap: true,
  target: false,
})
