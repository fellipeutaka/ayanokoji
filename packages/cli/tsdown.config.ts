import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  treeshake: true,
  minify: true,
  clean: true,
  outDir: "dist",
  dts: false,
  target: false,
});
