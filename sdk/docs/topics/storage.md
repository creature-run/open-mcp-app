# Storage — KV Store, File I/O, and Blob Store

Persistent storage APIs for MCP Apps. Creature-specific — other hosts get `null`/`false` gracefully.

```typescript
import { exp } from "open-mcp-app/server";
```

## KV Store

Key-value storage for JSON strings. Best for structured data.

```typescript
await exp.kvSet("items:123", JSON.stringify(item));
const data = await exp.kvGet("items:123");
await exp.kvDelete("items:123");
const keys = await exp.kvList("items:");
const pairs = await exp.kvListWithValues("items:");  // [{key, value}]

if (exp.kvIsAvailable()) { /* persistent */ } else { /* in-memory fallback */ }
```

| Method | Returns | Description |
|--------|---------|-------------|
| `kvIsAvailable()` | `boolean` | True when running in Creature with a project open. |
| `kvGet(key)` | `Promise<string \| null>` | Get value by key. |
| `kvSet(key, value)` | `Promise<boolean>` | Store a string value. |
| `kvDelete(key)` | `Promise<boolean>` | Delete a key. |
| `kvList(prefix?)` | `Promise<string[] \| null>` | List keys, optionally by prefix. |
| `kvListWithValues(prefix?)` | `Promise<{key, value}[] \| null>` | List keys with their values. |

## File I/O

Read/write files in the app's writable storage directory.

```typescript
await exp.writeFile("data/export.json", JSON.stringify(data));
const content = await exp.readFile("data/export.json");
await exp.deleteFile("data/export.json");
const files = await exp.readdir("data/");
if (await exp.exists("data/export.json")) { /* file exists */ }
```

## Blob Store

Binary storage for images, PDFs, audio (max 10MB per blob).

```typescript
await exp.blobPut("images/photo.png", imageBuffer, "image/png");
const blob = await exp.blobGet("images/photo.png");  // { data: Buffer, mimeType }
await exp.blobDelete("images/photo.png");
const blobs = await exp.blobList("images/");

if (exp.blobIsAvailable()) { /* persistent */ } else { /* unavailable */ }
```

## CRITICAL — KV is NOT Available at Startup

KV operations require an active MCP transport session. Writes during module initialization silently fail.

```typescript
// BAD — runs before the Host connects, writes silently fail
await exp.kvSet("config:default", JSON.stringify(defaults));
app.start();

// GOOD — lazy-init on first tool call
let initialized = false;
async function ensureDefaults() {
  if (initialized) return;
  initialized = true;
  const existing = await exp.kvList("items:");
  if (!existing || existing.length === 0) {
    await exp.kvSet("items:1", JSON.stringify(defaultItem));
  }
}
```

## Key Naming Conventions

- Max length: 256 characters
- Allowed: `a-z`, `A-Z`, `0-9`, `_`, `-`, `.`, `/`, `:`
- Cannot contain `..` (path traversal protection)

```typescript
"todos:item:abc123"
"settings:theme"
"images/avatars/user123.png"
```
