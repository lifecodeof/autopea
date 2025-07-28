import { defineConfig } from "tsup"

export default defineConfig({
  // entry: ["src", "!**/*.snap", "!**/*.test.ts"],
  entry: ["src/index.ts", "src/ffi/*.ts", "!**/*.test.ts"],
  
  dts: false,

  sourcemap: true,
  format: "esm",
  target: "node24",
  clean: true,
  bundle: false,
  splitting: false
})
