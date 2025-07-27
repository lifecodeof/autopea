import { defineConfig } from "tsup"

export default defineConfig({
  // entry: ["src", "!**/*.snap", "!**/*.test.ts"],
  entry: ["src/index.ts", "src/ffi/*.ts", "!**/*.test.ts"],

  sourcemap: true,
  format: "esm",
  target: "node24",
  bundle: true,
  dts: true,
  clean: true,
  splitting: false
})
