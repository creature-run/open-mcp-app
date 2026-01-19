// src/vite/index.ts
import { resolve, join, relative } from "path";
import { readdirSync, statSync, existsSync, writeFileSync, mkdirSync, rmSync, readFileSync } from "fs";
import { createServer as createNetServer } from "net";
import { createServer as createHttpServer } from "http";
import { createHash } from "crypto";
import { spawnSync } from "child_process";

// src/vite/hmr-client.ts
function generateHmrClientScript(port) {
  return `
(function() {
  if (window.parent === window) {
    console.log('[Creature HMR] Not in iframe, skipping HMR client');
    return;
  }
  if (window.__CREATURE_HMR_CONNECTED__) {
    console.log('[Creature HMR] Already connected, skipping');
    return;
  }
  window.__CREATURE_HMR_CONNECTED__ = true;

  var HMR_PORT = ${port};
  var reconnectAttempts = 0;
  var maxReconnectAttempts = 10;
  var reconnectDelay = 1000;

  console.log('[Creature HMR] Initializing HMR client, will connect to port ' + HMR_PORT);

  function connect() {
    if (reconnectAttempts >= maxReconnectAttempts) {
      console.log('[Creature HMR] Max reconnection attempts reached, giving up');
      return;
    }

    console.log('[Creature HMR] Attempting to connect to ws://localhost:' + HMR_PORT + ' (attempt ' + (reconnectAttempts + 1) + ')');
    var ws = new WebSocket('ws://localhost:' + HMR_PORT);

    ws.onopen = function() {
      console.log('[Creature HMR] Connected to HMR server on port ' + HMR_PORT);
      reconnectAttempts = 0;
    };

    ws.onmessage = function(event) {
      console.log('[Creature HMR] Received message:', event.data);
      try {
        var data = JSON.parse(event.data);
        
        if (data.type === 'full-reload') {
          console.log('[Creature HMR] Full reload triggered, notifying parent');
          notifyParent();
        } else if (data.type === 'update') {
          console.log('[Creature HMR] Update detected, notifying parent');
          notifyParent();
        } else if (data.type === 'connected') {
          console.log('[Creature HMR] Server acknowledged connection');
        }
      } catch (e) {
        console.log('[Creature HMR] Failed to parse message:', e);
      }
    };

    ws.onclose = function() {
      console.log('[Creature HMR] Disconnected, reconnecting in ' + reconnectDelay + 'ms...');
      reconnectAttempts++;
      setTimeout(connect, reconnectDelay);
    };

    ws.onerror = function(err) {
      console.log('[Creature HMR] WebSocket error:', err);
    };
  }

  function notifyParent() {
    console.log('[Creature HMR] Sending hmr-reload to parent frame');
    window.parent.postMessage({
      jsonrpc: '2.0',
      method: 'ui/notifications/hmr-reload',
      params: {}
    }, '*');
  }

  // Start connection
  connect();
})();
`.trim();
}
function generateHmrClientScriptTag(port) {
  return `<script>${generateHmrClientScript(port)}</script>`;
}

// src/vite/index.ts
function findAvailablePort(startPort) {
  return new Promise((resolve2) => {
    const server = createNetServer();
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve2(port));
    });
    server.on("error", () => {
      resolve2(findAvailablePort(startPort + 1));
    });
  });
}
function findPages(dir, baseDir) {
  const entries = [];
  if (!existsSync(dir)) return entries;
  const items = readdirSync(dir);
  if (items.includes("page.tsx")) {
    const relativePath = dir.slice(baseDir.length + 1);
    entries.push({
      name: relativePath || "main",
      pagePath: join(dir, "page.tsx")
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
var hmrServer = null;
var hmrClients = /* @__PURE__ */ new Set();
function sendWebSocketFrame(socket, data) {
  const payload = Buffer.from(data);
  const length = payload.length;
  let frame;
  if (length < 126) {
    frame = Buffer.alloc(2 + length);
    frame[0] = 129;
    frame[1] = length;
    payload.copy(frame, 2);
  } else if (length < 65536) {
    frame = Buffer.alloc(4 + length);
    frame[0] = 129;
    frame[1] = 126;
    frame.writeUInt16BE(length, 2);
    payload.copy(frame, 4);
  } else {
    frame = Buffer.alloc(10 + length);
    frame[0] = 129;
    frame[1] = 127;
    frame.writeBigUInt64BE(BigInt(length), 2);
    payload.copy(frame, 10);
  }
  socket.write(frame);
}
function startHmrServer(port) {
  if (hmrServer) return;
  hmrServer = createHttpServer((_req, res) => {
    res.writeHead(200);
    res.end("Creature HMR Server");
  });
  hmrServer.on("upgrade", (req, socket, head) => {
    const key = req.headers["sec-websocket-key"];
    if (!key) {
      socket.destroy();
      return;
    }
    const acceptKey = createHash("sha1").update(key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11").digest("base64");
    socket.write(
      `HTTP/1.1 101 Switching Protocols\r
Upgrade: websocket\r
Connection: Upgrade\r
Sec-WebSocket-Accept: ${acceptKey}\r
\r
`
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
function notifyHmrClients() {
  const message = JSON.stringify({ type: "full-reload" });
  const toRemove = [];
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
function creature(options = {}) {
  const uiDir = options.uiDir || "src/ui";
  const outDir = options.outDir || "dist/ui";
  const preferredHmrPort = options.hmrPort || 5899;
  const generateBundle = options.generateBundle || false;
  let root;
  let tempDir;
  let entries = [];
  let hasSingleFilePlugin = false;
  let hmrPort = null;
  let isWatchMode = false;
  let remainingPages = [];
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
      hasSingleFilePlugin = plugins.some((p) => p && typeof p === "object" && "name" in p && p.name === "vite:singlefile");
      tempDir = resolve(root, "node_modules/.creature");
      const selectedPage = process.env.CREATURE_PAGE;
      if (!selectedPage) {
        rmSync(tempDir, { recursive: true, force: true });
      }
      mkdirSync(tempDir, { recursive: true });
      for (const entry of entries) {
        const relativePagePath = relative(tempDir, entry.pagePath).replace(/\\/g, "/");
        writeFileSync(
          join(tempDir, `${entry.name}.entry.tsx`),
          `import { createElement } from "react";
import { createRoot } from "react-dom/client";
import Page from "${relativePagePath.replace(/\.tsx$/, "")}";
createRoot(document.getElementById("root")!).render(createElement(Page));
`
        );
        writeFileSync(
          join(tempDir, `${entry.name}.html`),
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
</html>`
        );
      }
      let inputs;
      if (hasSingleFilePlugin) {
        const targetEntry = selectedPage ? entries.find((e) => e.name === selectedPage) : entries[0];
        if (!targetEntry) {
          console.error(`Page "${selectedPage}" not found`);
          return;
        }
        inputs = { [targetEntry.name]: join(tempDir, `${targetEntry.name}.html`) };
        if (!selectedPage && entries.length > 1) {
          remainingPages = entries.slice(1).map((e) => e.name);
        }
      } else {
        inputs = Object.fromEntries(
          entries.map((e) => [e.name, join(tempDir, `${e.name}.html`)])
        );
      }
      return {
        root: tempDir,
        publicDir: false,
        logLevel: "silent",
        build: {
          outDir: resolve(root, outDir),
          emptyOutDir: !selectedPage,
          rollupOptions: { input: inputs },
          reportCompressedSize: false
        }
      };
    },
    async buildStart() {
      if (!tempDir) return;
      isWatchMode = this.meta.watchMode === true;
      if (isWatchMode && !hmrServer) {
        hmrPort = await findAvailablePort(preferredHmrPort);
        startHmrServer(hmrPort);
        mkdirSync(tempDir, { recursive: true });
        const hmrConfig = { port: hmrPort };
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
          stdio: "inherit"
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
      if (generateBundle && entries.length > 0 && !process.env.CREATURE_PAGE) {
        const bundleOutputDir = resolve(root, outDir);
        const exports = [];
        for (const entry of entries) {
          const htmlPath = join(bundleOutputDir, `${entry.name}.html`);
          if (existsSync(htmlPath)) {
            const html = readFileSync(htmlPath, "utf-8");
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
    }
  };
}
var vite_default = creature;
export {
  creature,
  vite_default as default,
  generateHmrClientScript,
  generateHmrClientScriptTag
};
//# sourceMappingURL=index.js.map