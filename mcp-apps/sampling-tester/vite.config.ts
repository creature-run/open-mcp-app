import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import { creature } from "open-mcp-app/vite";

export default defineConfig({
  plugins: [
    react(),
    creature({
      generateBundle: true,
    }),
    viteSingleFile(),
  ],
});
