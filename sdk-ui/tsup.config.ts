import { defineConfig } from "tsup";
import { mkdirSync, copyFileSync } from "fs";
import { join } from "path";

/**
 * Build configuration for open-mcp-app-ui.
 *
 * Core components are the main entry point. Optional heavy components
 * (table, editor) are separate entry points so apps only pay for what they use.
 *
 * CSS files (fallbacks, display-modes) are copied as source files so apps
 * can process them through their own Tailwind/PostCSS build.
 */
export default defineConfig({
  entry: {
    index: "src/index.ts",
    "table/index": "src/table/index.ts",
    "editor/index": "src/editor/index.ts",
  },
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  external: [
    "react",
    "open-mcp-app",
    "open-mcp-app/react",
    "@tanstack/react-table",
    "@tanstack/react-virtual",
    "@milkdown/core",
    "@milkdown/react",
    "@milkdown/preset-commonmark",
    "@milkdown/prose",
  ],
  async onSuccess() {
    mkdirSync("dist/styles", { recursive: true });
    copyFileSync(
      join("src", "styles", "fallbacks.css"),
      join("dist", "styles", "fallbacks.css")
    );
    copyFileSync(
      join("src", "styles", "display-modes.css"),
      join("dist", "styles", "display-modes.css")
    );
    console.log("CSS source files copied to dist/styles/");
  },
});
