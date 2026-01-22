import { resolve, join, relative } from "node:path";
import { readdirSync, statSync, existsSync, writeFileSync, mkdirSync, rmSync, readFileSync } from "node:fs";
import { createServer as createNetServer } from "node:net";
import { createServer as createHttpServer, type IncomingMessage, type ServerResponse } from "node:http";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import type { Duplex } from "node:stream";
import type { Plugin, UserConfig } from "vite";

export interface CreaturePluginOptions {
  uiDir?: string;
  outDir?: string;
  hmrPort?: number;
  /**
   * Generate a JS module exporting bundled HTML for serverless deployments.
   * When enabled, creates `dist/ui/bundle.js` with named exports for each page.
   * 
   * @example
   * // In server code:
   * import { main } from "./dist/ui/bundle.js";
   * app.resource({ html: main });
   * 
   * @default false
   */
  generateBundle?: boolean;
}

export interface HmrConfig {
  port: number;
}

/**
 * Offset added to MCP_PORT to derive the HMR port.
 * When MCP_PORT is set (by Creature), both Vite and the SDK server
 * can independently calculate the same HMR port without coordination.
 */
export const HMR_PORT_OFFSET = 1000;

function findAvailablePort(startPort: number): Promise<number> {
  return new Promise((resolve) => {
    const server = createNetServer();
    server.listen(startPort, () => {
      const port = (server.address() as { port: number }).port;
      server.close(() => resolve(port));
    });
    server.on("error", () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

interface EntryPoint {
  name: string;
  pagePath: string;
}

function findPages(dir: string, baseDir: string): EntryPoint[] {
  const entries: EntryPoint[] = [];
  if (!existsSync(dir)) return entries;

  const items = readdirSync(dir);

  if (items.includes("page.tsx")) {
    const relativePath = dir.slice(baseDir.length + 1);
    entries.push({
      name: relativePath || "main",
      pagePath: join(dir, "page.tsx"),
    });
  }

  for (const item of items) {
    const fullPath = join(dir, item);
    if (statSync(fullPath).isDirectory() && !item.startsWith("_") && item !== "node_modules") {
      entries.push(...findPages(fullPath, baseDir));
    }
  }

  return entries;
}

let hmrServer: ReturnType<typeof createHttpServer> | null = null;
let hmrClients: Set<Duplex> = new Set();

function sendWebSocketFrame(socket: Duplex, data: string): void {
  const payload = Buffer.from(data);
  const length = payload.length;
  
  let frame: Buffer;
  if (length < 126) {
    frame = Buffer.alloc(2 + length);
    frame[0] = 0x81;
    frame[1] = length;
    payload.copy(frame, 2);
  } else if (length < 65536) {
    frame = Buffer.alloc(4 + length);
    frame[0] = 0x81;
    frame[1] = 126;
    frame.writeUInt16BE(length, 2);
    payload.copy(frame, 4);
  } else {
    frame = Buffer.alloc(10 + length);
    frame[0] = 0x81;
    frame[1] = 127;
    frame.writeBigUInt64BE(BigInt(length), 2);
    payload.copy(frame, 10);
  }
  
  socket.write(frame);
}

function startHmrServer(port: number): void {
  if (hmrServer) return;
  
  hmrServer = createHttpServer((_req: IncomingMessage, res: ServerResponse) => {
    res.writeHead(200);
    res.end("Creature HMR Server");
  });
  
  hmrServer.on("upgrade", (req: IncomingMessage, socket: Duplex, head: Buffer) => {
    const key = req.headers["sec-websocket-key"];
    if (!key) {
      socket.destroy();
      return;
    }
    
    const acceptKey = createHash("sha1")
      .update(key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11")
      .digest("base64");
    
    socket.write(
      "HTTP/1.1 101 Switching Protocols\r\n" +
      "Upgrade: websocket\r\n" +
      "Connection: Upgrade\r\n" +
      `Sec-WebSocket-Accept: ${acceptKey}\r\n` +
      "\r\n"
    );
    
    hmrClients.add(socket);
    sendWebSocketFrame(socket, JSON.stringify({ type: "connected" }));
    
    socket.on("close", () => {
      hmrClients.delete(socket);
    });
    
    socket.on("error", () => {
      hmrClients.delete(socket);
    });
  });
  
  hmrServer.listen(port);
}

function notifyHmrClients(): void {
  const message = JSON.stringify({ type: "full-reload" });
  const toRemove: Duplex[] = [];
  
  for (const client of hmrClients) {
    try {
      if (!client.destroyed) {
        sendWebSocketFrame(client, message);
      } else {
        toRemove.push(client);
      }
    } catch {
      toRemove.push(client);
    }
  }
  
  for (const client of toRemove) {
    hmrClients.delete(client);
  }
  
  if (hmrClients.size > 0) {
    console.log("App UI reloaded");
  }
}

/**
 * Vite plugin for Creature MCP Apps.
 * 
 * Just write page.tsx files - no HTML or entry files needed.
 * 
 * ```
 * src/ui/
 * ├── page.tsx         → dist/ui/main.html
 * ├── inline/page.tsx  → dist/ui/inline.html
 * └── _components/     → ignored
 * ```
 * 
 * When using vite-plugin-singlefile, multiple pages are built automatically
 * via sequential builds (singlefile requires single entry per build).
 */
export function creature(options: CreaturePluginOptions = {}): Plugin {
  const uiDir = options.uiDir || "src/ui";
  const outDir = options.outDir || "dist/ui";
  const preferredHmrPort = options.hmrPort || 5899;
  const generateBundle = options.generateBundle || false;
  
  let root: string;
  let tempDir: string;
  let entries: EntryPoint[] = [];
  let hasSingleFilePlugin = false;
  let hmrPort: number | null = null;
  let isWatchMode = false;
  let remainingPages: string[] = [];

  return {
    name: "creature",
    
    async config(config) {
      root = config.root || process.cwd();
      const uiPath = resolve(root, uiDir);
      entries = findPages(uiPath, uiPath);

      if (entries.length === 0) {
        return;
      }

      const plugins = config.plugins?.flat() || [];
      hasSingleFilePlugin = plugins.some(p => p && typeof p === 'object' && 'name' in p && p.name === 'vite:singlefile');

      tempDir = resolve(root, "node_modules/.creature");
      
      const selectedPage = process.env.CREATURE_PAGE;
      
      if (!selectedPage) {
        rmSync(tempDir, { recursive: true, force: true });
      }
      mkdirSync(tempDir, { recursive: true });

      for (const entry of entries) {
        const relativePagePath = relative(tempDir, entry.pagePath).replace(/\\/g, "/");
        writeFileSync(join(tempDir, `${entry.name}.entry.tsx`), 
`import { createElement } from "react";
import { createRoot } from "react-dom/client";
import Page from "${relativePagePath.replace(/\.tsx$/, "")}";
createRoot(document.getElementById("root")!).render(createElement(Page));
`);

        writeFileSync(join(tempDir, `${entry.name}.html`),
`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${entry.name}</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="./${entry.name}.entry.tsx"></script>
</body>
</html>`);
      }
      
      let inputs: Record<string, string>;
      
      if (hasSingleFilePlugin) {
        const targetEntry = selectedPage 
          ? entries.find(e => e.name === selectedPage)
          : entries[0];
          
        if (!targetEntry) {
          console.error(`Page "${selectedPage}" not found`);
          return;
        }
        
        inputs = { [targetEntry.name]: join(tempDir, `${targetEntry.name}.html`) };
        
        if (!selectedPage && entries.length > 1) {
          remainingPages = entries.slice(1).map(e => e.name);
        }
      } else {
        inputs = Object.fromEntries(
          entries.map(e => [e.name, join(tempDir, `${e.name}.html`)])
        );
      }

      return {
        root: tempDir,
        publicDir: false,
        logLevel: "silent" as const,
        build: {
          outDir: resolve(root, outDir),
          emptyOutDir: !selectedPage,
          rollupOptions: { input: inputs },
          reportCompressedSize: false,
        },
      } satisfies UserConfig;
    },

    async buildStart() {
      if (!tempDir) return;
      
      isWatchMode = this.meta.watchMode === true;
      
      if (isWatchMode && !hmrServer) {
        // Derive HMR port from MCP_PORT when available (set by Creature).
        // This allows the SDK server to know the HMR port immediately without
        // waiting for hmr.json to be written, eliminating the race condition.
        const mcpPort = process.env.MCP_PORT ? parseInt(process.env.MCP_PORT, 10) : null;
        hmrPort = mcpPort ? mcpPort + HMR_PORT_OFFSET : await findAvailablePort(preferredHmrPort);
        startHmrServer(hmrPort);
        
        // Still write hmr.json for non-Creature environments (manual npm run dev)
        mkdirSync(tempDir, { recursive: true });
        const hmrConfig: HmrConfig = { port: hmrPort };
        writeFileSync(
          join(tempDir, "hmr.json"),
          JSON.stringify(hmrConfig, null, 2)
        );
      }
    },

    writeBundle() {
      if (!hasSingleFilePlugin || remainingPages.length === 0) {
        if (isWatchMode) notifyHmrClients();
        return;
      }
      
      for (const pageName of remainingPages) {
        spawnSync("npx", ["vite", "build"], {
          cwd: root,
          env: { ...process.env, CREATURE_PAGE: pageName },
          stdio: "inherit",
        });
      }
      
      if (isWatchMode) {
        notifyHmrClients();
      } else {
        remainingPages = [];
      }
    },

    closeBundle() {
      if (isWatchMode) return;
      
      // Generate bundle.js for serverless deployments
      if (generateBundle && entries.length > 0 && !process.env.CREATURE_PAGE) {
        const bundleOutputDir = resolve(root, outDir);
        const exports: string[] = [];
        
        for (const entry of entries) {
          const htmlPath = join(bundleOutputDir, `${entry.name}.html`);
          if (existsSync(htmlPath)) {
            const html = readFileSync(htmlPath, "utf-8");
            // Escape backticks and ${} for template literal
            const escaped = html.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
            exports.push(`export const ${entry.name.replace(/-/g, "_")} = \`${escaped}\`;`);
          }
        }
        
        if (exports.length > 0) {
          const bundleContent = `/**
 * Auto-generated UI bundle for serverless deployments.
 * Import these exports in your MCP server for Vercel/Lambda.
 * 
 * @example
 * import { main } from "./dist/ui/bundle.js";
 * app.resource({ html: main });
 */
${exports.join("\n\n")}
`;
          writeFileSync(join(bundleOutputDir, "bundle.js"), bundleContent);
          console.log(`Generated ${outDir}/bundle.js for serverless`);
        }
      }
      
      if (tempDir && existsSync(tempDir) && !process.env.CREATURE_PAGE) {
        rmSync(tempDir, { recursive: true, force: true });
      }
    },
  };
}

export { generateHmrClientScript, generateHmrClientScriptTag } from "./hmr-client.js";

export default creature;
