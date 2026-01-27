import { defineConfig } from "tsup";

/**
 * Build configuration for open-mcp-app.
 * 
 * Single config to avoid parallel build race conditions.
 * Each subpath has specific bundling requirements handled via esbuild plugins.
 */
export default defineConfig({
  entry: {
    "server/index": "src/server/index.ts",
    "core/index": "src/core/index.ts",
    "react/index": "src/react/index.ts",
    "vite/index": "src/vite/index.ts",
  },
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  external: ["react", "vite"],
  noExternal: ["@modelcontextprotocol/ext-apps", "@modelcontextprotocol/sdk"],
  esbuildOptions(options, context) {
    // Server entry should externalize deps
    if (context.entryPoints?.includes("src/server/index.ts")) {
      options.external = [
        ...(options.external || []),
        "@modelcontextprotocol/sdk",
        "express",
        "zod",
        "ws",
      ];
    }
  },
});
