import { defineConfig } from "tsup";

/**
 * Build configuration for open-mcp-app-ui.
 */
export default defineConfig({
  entry: {
    index: "src/index.ts",
  },
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
});
