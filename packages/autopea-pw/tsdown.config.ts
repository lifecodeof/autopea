import { defineConfig } from "tsdown"

export default defineConfig({
  entry: ["src/index.ts"],
  skipNodeModulesBundle: true,
  dts: { sourcemap: true },
  sourcemap: true,
  target: false,
})
