/**
 * Experimental Server APIs
 *
 * These APIs provide access to host-specific features that may not be
 * supported by all hosts. Functions return null or throw when running
 * outside a supported environment.
 *
 * All experimental APIs are subject to change and should be used with
 * appropriate fallbacks.
 *
 * Import directly with the experimental_ prefix:
 * ```typescript
 * import { experimental_getWritableDirectory } from "open-mcp-app/server";
 * ```
 */

import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";

// ============================================================================
// Internal Helpers
// ============================================================================

/**
 * Get the writable storage directory from environment.
 * Internal helper - use experimental_getWritableDirectory for the public API.
 */
const getStorageDir = (): string | null => {
  const dir = process.env.CREATURE_MCP_STORAGE_DIR;
  return dir && dir.length > 0 ? dir : null;
};

/**
 * Resolve and validate a path is within the storage directory.
 * Throws if path escapes the sandbox or storage is unavailable.
 *
 * @param relativePath - Path relative to storage directory
 * @returns Absolute path within storage directory
 * @throws Error if storage unavailable or path escapes sandbox
 */
const resolveSafePath = (relativePath: string): string => {
  const storageDir = getStorageDir();
  if (!storageDir) {
    throw new Error(
      "Storage directory not available. This API only works when running inside Creature with a project open."
    );
  }

  // Resolve to absolute path
  const resolved = path.resolve(storageDir, relativePath);

  // Ensure the resolved path is within the storage directory
  // This prevents path traversal attacks like "../../../etc/passwd"
  const normalizedStorage = path.normalize(storageDir) + path.sep;
  const normalizedResolved = path.normalize(resolved);

  if (!normalizedResolved.startsWith(normalizedStorage) && normalizedResolved !== path.normalize(storageDir)) {
    throw new Error(
      `Path "${relativePath}" escapes the storage directory. Paths must stay within the designated storage area.`
    );
  }

  return resolved;
};

// ============================================================================
// Directory & Path APIs
// ============================================================================

/**
 * Get the writable storage directory for this MCP instance.
 *
 * When running inside Creature, returns an absolute path to a directory
 * where the MCP can safely read and write files. The directory is:
 * - Scoped to the current Creature project and MCP server name
 * - Persisted across restarts
 * - Located outside the user's repository
 *
 * Returns null when:
 * - Running outside Creature (e.g., in standalone mode, ChatGPT, or other hosts)
 * - No project is currently open in Creature
 *
 * @returns Absolute path to writable directory, or null if unavailable
 *
 * @example
 * ```typescript
 * import { experimental_getWritableDirectory } from "open-mcp-app/server";
 *
 * const storageDir = experimental_getWritableDirectory();
 * if (storageDir) {
 *   // Storage available - use sandboxed file APIs
 * } else {
 *   // Fallback to in-memory storage
 * }
 * ```
 */
export function experimental_getWritableDirectory(): string | null {
  return getStorageDir();
}

/**
 * Get the current Creature project ID.
 *
 * Returns the UUID of the currently open Creature project, which can be
 * used for server-side state keying or API calls.
 *
 * Returns null when running outside Creature or no project is open.
 *
 * @returns Creature project UUID, or null if unavailable
 */
export function experimental_getProjectId(): string | null {
  const id = process.env.CREATURE_PROJECT_ID;
  return id && id.length > 0 ? id : null;
}

/**
 * Get the MCP server name as known to Creature.
 *
 * Returns the server name used by Creature to identify this MCP,
 * typically the npm package name.
 *
 * Returns null when running outside Creature.
 *
 * @returns MCP server name, or null if unavailable
 */
export function experimental_getServerName(): string | null {
  const name = process.env.CREATURE_MCP_SERVER_NAME;
  return name && name.length > 0 ? name : null;
}

/**
 * Check if running inside a Creature host environment.
 *
 * Returns true if the MCP is running inside Creature with a project open.
 *
 * @returns true if running in Creature with a project, false otherwise
 */
export function experimental_isCreatureHost(): boolean {
  return experimental_getProjectId() !== null;
}

// ============================================================================
// Sandboxed File I/O APIs
// ============================================================================

/**
 * Read a file from the storage directory.
 *
 * All paths are relative to the storage directory and cannot escape it.
 * Throws if the path attempts to escape the sandbox.
 *
 * @param relativePath - Path relative to storage directory
 * @param encoding - File encoding (default: "utf-8")
 * @returns File contents as string
 * @throws Error if storage unavailable, path escapes sandbox, or file not found
 *
 * @example
 * ```typescript
 * import { experimental_readFile } from "open-mcp-app/server";
 *
 * const data = await experimental_readFile("config.json");
 * const config = JSON.parse(data);
 * ```
 */
export async function experimental_readFile(
  relativePath: string,
  encoding: BufferEncoding = "utf-8"
): Promise<string> {
  const safePath = resolveSafePath(relativePath);
  return fsPromises.readFile(safePath, { encoding });
}

/**
 * Read a file from the storage directory synchronously.
 *
 * @param relativePath - Path relative to storage directory
 * @param encoding - File encoding (default: "utf-8")
 * @returns File contents as string
 * @throws Error if storage unavailable, path escapes sandbox, or file not found
 */
export function experimental_readFileSync(
  relativePath: string,
  encoding: BufferEncoding = "utf-8"
): string {
  const safePath = resolveSafePath(relativePath);
  return fs.readFileSync(safePath, { encoding });
}

/**
 * Write a file to the storage directory.
 *
 * All paths are relative to the storage directory and cannot escape it.
 * Creates parent directories if they don't exist.
 * Throws if the path attempts to escape the sandbox.
 *
 * @param relativePath - Path relative to storage directory
 * @param data - Content to write
 * @param encoding - File encoding (default: "utf-8")
 * @throws Error if storage unavailable or path escapes sandbox
 *
 * @example
 * ```typescript
 * import { experimental_writeFile } from "open-mcp-app/server";
 *
 * await experimental_writeFile("config.json", JSON.stringify(config, null, 2));
 * await experimental_writeFile("data/notes.json", notesJson);
 * ```
 */
export async function experimental_writeFile(
  relativePath: string,
  data: string,
  encoding: BufferEncoding = "utf-8"
): Promise<void> {
  const safePath = resolveSafePath(relativePath);

  // Create parent directories if needed
  const dir = path.dirname(safePath);
  await fsPromises.mkdir(dir, { recursive: true });

  await fsPromises.writeFile(safePath, data, { encoding });
}

/**
 * Write a file to the storage directory synchronously.
 *
 * @param relativePath - Path relative to storage directory
 * @param data - Content to write
 * @param encoding - File encoding (default: "utf-8")
 * @throws Error if storage unavailable or path escapes sandbox
 */
export function experimental_writeFileSync(
  relativePath: string,
  data: string,
  encoding: BufferEncoding = "utf-8"
): void {
  const safePath = resolveSafePath(relativePath);

  // Create parent directories if needed
  const dir = path.dirname(safePath);
  fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(safePath, data, { encoding });
}

/**
 * Delete a file from the storage directory.
 *
 * @param relativePath - Path relative to storage directory
 * @throws Error if storage unavailable, path escapes sandbox, or file not found
 *
 * @example
 * ```typescript
 * import { experimental_deleteFile } from "open-mcp-app/server";
 *
 * await experimental_deleteFile("temp/cache.json");
 * ```
 */
export async function experimental_deleteFile(relativePath: string): Promise<void> {
  const safePath = resolveSafePath(relativePath);
  await fsPromises.unlink(safePath);
}

/**
 * Delete a file from the storage directory synchronously.
 *
 * @param relativePath - Path relative to storage directory
 * @throws Error if storage unavailable, path escapes sandbox, or file not found
 */
export function experimental_deleteFileSync(relativePath: string): void {
  const safePath = resolveSafePath(relativePath);
  fs.unlinkSync(safePath);
}

/**
 * Check if a file or directory exists in the storage directory.
 *
 * @param relativePath - Path relative to storage directory
 * @returns true if the path exists, false otherwise
 * @throws Error if storage unavailable or path escapes sandbox
 *
 * @example
 * ```typescript
 * import { experimental_exists } from "open-mcp-app/server";
 *
 * if (await experimental_exists("config.json")) {
 *   // Load existing config
 * } else {
 *   // Create default config
 * }
 * ```
 */
export async function experimental_exists(relativePath: string): Promise<boolean> {
  const safePath = resolveSafePath(relativePath);
  try {
    await fsPromises.access(safePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a file or directory exists in the storage directory synchronously.
 *
 * @param relativePath - Path relative to storage directory
 * @returns true if the path exists, false otherwise
 * @throws Error if storage unavailable or path escapes sandbox
 */
export function experimental_existsSync(relativePath: string): boolean {
  const safePath = resolveSafePath(relativePath);
  return fs.existsSync(safePath);
}

/**
 * Create a directory in the storage directory.
 *
 * Creates parent directories if they don't exist.
 *
 * @param relativePath - Path relative to storage directory
 * @throws Error if storage unavailable or path escapes sandbox
 *
 * @example
 * ```typescript
 * import { experimental_mkdir } from "open-mcp-app/server";
 *
 * await experimental_mkdir("data/backups");
 * ```
 */
export async function experimental_mkdir(relativePath: string): Promise<void> {
  const safePath = resolveSafePath(relativePath);
  await fsPromises.mkdir(safePath, { recursive: true });
}

/**
 * Create a directory in the storage directory synchronously.
 *
 * @param relativePath - Path relative to storage directory
 * @throws Error if storage unavailable or path escapes sandbox
 */
export function experimental_mkdirSync(relativePath: string): void {
  const safePath = resolveSafePath(relativePath);
  fs.mkdirSync(safePath, { recursive: true });
}

/**
 * List files and directories in a storage directory path.
 *
 * @param relativePath - Path relative to storage directory (default: root)
 * @returns Array of file and directory names
 * @throws Error if storage unavailable, path escapes sandbox, or path not found
 *
 * @example
 * ```typescript
 * import { experimental_readdir } from "open-mcp-app/server";
 *
 * const files = await experimental_readdir("data");
 * for (const file of files) {
 *   console.log(file);
 * }
 * ```
 */
export async function experimental_readdir(relativePath: string = ""): Promise<string[]> {
  const safePath = resolveSafePath(relativePath);
  return fsPromises.readdir(safePath);
}

/**
 * List files and directories in a storage directory path synchronously.
 *
 * @param relativePath - Path relative to storage directory (default: root)
 * @returns Array of file and directory names
 * @throws Error if storage unavailable, path escapes sandbox, or path not found
 */
export function experimental_readdirSync(relativePath: string = ""): string[] {
  const safePath = resolveSafePath(relativePath);
  return fs.readdirSync(safePath);
}

/**
 * Remove a directory and all its contents from the storage directory.
 *
 * @param relativePath - Path relative to storage directory
 * @throws Error if storage unavailable or path escapes sandbox
 *
 * @example
 * ```typescript
 * import { experimental_rmdir } from "open-mcp-app/server";
 *
 * await experimental_rmdir("temp");
 * ```
 */
export async function experimental_rmdir(relativePath: string): Promise<void> {
  const safePath = resolveSafePath(relativePath);
  await fsPromises.rm(safePath, { recursive: true, force: true });
}

/**
 * Remove a directory and all its contents from the storage directory synchronously.
 *
 * @param relativePath - Path relative to storage directory
 * @throws Error if storage unavailable or path escapes sandbox
 */
export function experimental_rmdirSync(relativePath: string): void {
  const safePath = resolveSafePath(relativePath);
  fs.rmSync(safePath, { recursive: true, force: true });
}

// ============================================================================
// KV Store APIs (Creature Extension)
// ============================================================================

/** Maximum key length for KV store */
const MAX_KEY_LENGTH = 256;

/** KV store file name */
const KV_FILENAME = "kv.json";

/**
 * Sanitize a key to prevent security issues.
 * Only allows alphanumeric, dash, underscore, dot, colon, and forward slash.
 * Rejects keys with ".." or absolute paths.
 */
const sanitizeKey = (key: string): string => {
  if (!key || key.length === 0) {
    throw new Error("Key cannot be empty");
  }
  if (key.length > MAX_KEY_LENGTH) {
    throw new Error(`Key exceeds maximum length of ${MAX_KEY_LENGTH}`);
  }
  if (key.includes("..")) {
    throw new Error("Key cannot contain '..'");
  }
  if (path.isAbsolute(key)) {
    throw new Error("Key cannot be an absolute path");
  }
  // Allow a broader set of characters for KV keys (including :)
  if (!/^[a-zA-Z0-9_\-./:]+$/.test(key)) {
    throw new Error("Key contains invalid characters");
  }
  return key;
};

/**
 * Get the path to the KV store file.
 */
const getKvFilePath = (): string | null => {
  const storageDir = getStorageDir();
  if (!storageDir) return null;
  return path.join(storageDir, KV_FILENAME);
};

/**
 * Read the KV store from disk.
 */
const readKvStore = async (): Promise<Record<string, string> | null> => {
  const kvPath = getKvFilePath();
  if (!kvPath) return null;

  try {
    const data = await fsPromises.readFile(kvPath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return {};
    }
    throw error;
  }
};

/**
 * Read the KV store from disk synchronously.
 */
const readKvStoreSync = (): Record<string, string> | null => {
  const kvPath = getKvFilePath();
  if (!kvPath) return null;

  try {
    const data = fs.readFileSync(kvPath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return {};
    }
    throw error;
  }
};

/**
 * Write the KV store to disk atomically.
 */
const writeKvStore = async (store: Record<string, string>): Promise<void> => {
  const kvPath = getKvFilePath();
  if (!kvPath) {
    throw new Error("Storage not available");
  }

  const storageDir = getStorageDir()!;
  const tempPath = `${kvPath}.tmp.${Date.now()}`;

  // Ensure directory exists
  await fsPromises.mkdir(storageDir, { recursive: true });

  // Write to temp file then rename (atomic on most filesystems)
  await fsPromises.writeFile(tempPath, JSON.stringify(store, null, 2), "utf-8");
  await fsPromises.rename(tempPath, kvPath);
};

/**
 * Write the KV store to disk synchronously.
 */
const writeKvStoreSync = (store: Record<string, string>): void => {
  const kvPath = getKvFilePath();
  if (!kvPath) {
    throw new Error("Storage not available");
  }

  const storageDir = getStorageDir()!;
  const tempPath = `${kvPath}.tmp.${Date.now()}`;

  // Ensure directory exists
  fs.mkdirSync(storageDir, { recursive: true });

  // Write to temp file then rename
  fs.writeFileSync(tempPath, JSON.stringify(store, null, 2), "utf-8");
  fs.renameSync(tempPath, kvPath);
};

/**
 * Check if KV storage is available.
 *
 * Returns true if running inside Creature with storage enabled.
 * Use this to implement graceful fallbacks.
 *
 * @returns true if KV storage is available
 *
 * @example
 * ```typescript
 * import { experimental_kvIsAvailable } from "open-mcp-app/server";
 *
 * if (experimental_kvIsAvailable()) {
 *   // Use persistent KV storage
 * } else {
 *   // Fall back to in-memory storage
 * }
 * ```
 */
export function experimental_kvIsAvailable(): boolean {
  return getStorageDir() !== null;
}

/**
 * Get a value from the KV store.
 *
 * @param key - The key to retrieve
 * @returns The value, or null if not found or storage unavailable
 *
 * @example
 * ```typescript
 * import { experimental_kvGet } from "open-mcp-app/server";
 *
 * const value = await experimental_kvGet("user:preferences");
 * if (value) {
 *   const prefs = JSON.parse(value);
 * }
 * ```
 */
export async function experimental_kvGet(key: string): Promise<string | null> {
  const sanitizedKey = sanitizeKey(key);
  const store = await readKvStore();
  if (!store) return null;
  return store[sanitizedKey] ?? null;
}

/**
 * Get a value from the KV store synchronously.
 *
 * @param key - The key to retrieve
 * @returns The value, or null if not found or storage unavailable
 */
export function experimental_kvGetSync(key: string): string | null {
  const sanitizedKey = sanitizeKey(key);
  const store = readKvStoreSync();
  if (!store) return null;
  return store[sanitizedKey] ?? null;
}

/**
 * Set a value in the KV store.
 *
 * @param key - The key to set
 * @param value - The value to store (string)
 * @returns true if successful, false if storage unavailable
 *
 * @example
 * ```typescript
 * import { experimental_kvSet } from "open-mcp-app/server";
 *
 * await experimental_kvSet("user:preferences", JSON.stringify(prefs));
 * ```
 */
export async function experimental_kvSet(key: string, value: string): Promise<boolean> {
  const sanitizedKey = sanitizeKey(key);
  const store = await readKvStore();
  if (!store) return false;

  store[sanitizedKey] = value;
  await writeKvStore(store);
  return true;
}

/**
 * Set a value in the KV store synchronously.
 *
 * @param key - The key to set
 * @param value - The value to store (string)
 * @returns true if successful, false if storage unavailable
 */
export function experimental_kvSetSync(key: string, value: string): boolean {
  const sanitizedKey = sanitizeKey(key);
  const store = readKvStoreSync();
  if (!store) return false;

  store[sanitizedKey] = value;
  writeKvStoreSync(store);
  return true;
}

/**
 * Delete a key from the KV store.
 *
 * @param key - The key to delete
 * @returns true if the key existed and was deleted, false otherwise
 *
 * @example
 * ```typescript
 * import { experimental_kvDelete } from "open-mcp-app/server";
 *
 * const deleted = await experimental_kvDelete("user:preferences");
 * ```
 */
export async function experimental_kvDelete(key: string): Promise<boolean> {
  const sanitizedKey = sanitizeKey(key);
  const store = await readKvStore();
  if (!store) return false;

  const existed = sanitizedKey in store;
  delete store[sanitizedKey];
  await writeKvStore(store);
  return existed;
}

/**
 * Delete a key from the KV store synchronously.
 *
 * @param key - The key to delete
 * @returns true if the key existed and was deleted, false otherwise
 */
export function experimental_kvDeleteSync(key: string): boolean {
  const sanitizedKey = sanitizeKey(key);
  const store = readKvStoreSync();
  if (!store) return false;

  const existed = sanitizedKey in store;
  delete store[sanitizedKey];
  writeKvStoreSync(store);
  return existed;
}

/**
 * List keys in the KV store.
 *
 * @param prefix - Optional prefix to filter keys
 * @returns Array of matching keys, or null if storage unavailable
 *
 * @example
 * ```typescript
 * import { experimental_kvList } from "open-mcp-app/server";
 *
 * const userKeys = await experimental_kvList("user:");
 * ```
 */
export async function experimental_kvList(prefix?: string): Promise<string[] | null> {
  const store = await readKvStore();
  if (!store) return null;

  let keys = Object.keys(store);
  if (prefix) {
    const sanitizedPrefix = sanitizeKey(prefix);
    keys = keys.filter((k) => k.startsWith(sanitizedPrefix));
  }
  return keys;
}

/**
 * List keys in the KV store synchronously.
 *
 * @param prefix - Optional prefix to filter keys
 * @returns Array of matching keys, or null if storage unavailable
 */
export function experimental_kvListSync(prefix?: string): string[] | null {
  const store = readKvStoreSync();
  if (!store) return null;

  let keys = Object.keys(store);
  if (prefix) {
    const sanitizedPrefix = sanitizeKey(prefix);
    keys = keys.filter((k) => k.startsWith(sanitizedPrefix));
  }
  return keys;
}

// ============================================================================
// Blob Store APIs (Creature Extension)
// ============================================================================

/** Maximum blob size in bytes (10MB) */
const MAX_BLOB_SIZE = 10 * 1024 * 1024;

/** Blobs directory name */
const BLOBS_DIRNAME = "blobs";

/**
 * Get the blobs directory path.
 */
const getBlobsDir = (): string | null => {
  const storageDir = getStorageDir();
  if (!storageDir) return null;
  return path.join(storageDir, BLOBS_DIRNAME);
};

/**
 * Check if blob storage is available.
 *
 * Returns true if running inside Creature with storage enabled.
 * Use this to implement graceful fallbacks.
 *
 * @returns true if blob storage is available
 */
export function experimental_blobIsAvailable(): boolean {
  return getStorageDir() !== null;
}

/**
 * Store a blob.
 *
 * @param name - The blob name (acts as a path within the blobs directory)
 * @param data - The blob data as a Buffer or Uint8Array
 * @param mimeType - Optional MIME type metadata
 * @returns Object with success and size, or null if storage unavailable
 *
 * @example
 * ```typescript
 * import { experimental_blobPut } from "open-mcp-app/server";
 *
 * const imageData = fs.readFileSync("image.png");
 * await experimental_blobPut("images/photo.png", imageData, "image/png");
 * ```
 */
export async function experimental_blobPut(
  name: string,
  data: Buffer | Uint8Array,
  mimeType?: string
): Promise<{ success: true; size: number } | null> {
  const blobsDir = getBlobsDir();
  if (!blobsDir) return null;

  const sanitizedName = sanitizeKey(name);

  if (data.length > MAX_BLOB_SIZE) {
    throw new Error(`Blob exceeds maximum size of ${MAX_BLOB_SIZE} bytes`);
  }

  const blobPath = path.join(blobsDir, sanitizedName);

  // Ensure directory exists
  await fsPromises.mkdir(path.dirname(blobPath), { recursive: true });

  // Write the blob
  await fsPromises.writeFile(blobPath, data);

  // Store metadata if provided
  if (mimeType) {
    const metaPath = `${blobPath}.meta.json`;
    await fsPromises.writeFile(metaPath, JSON.stringify({ mimeType }), "utf-8");
  }

  return { success: true, size: data.length };
}

/**
 * Store a blob synchronously.
 *
 * @param name - The blob name
 * @param data - The blob data
 * @param mimeType - Optional MIME type metadata
 * @returns Object with success and size, or null if storage unavailable
 */
export function experimental_blobPutSync(
  name: string,
  data: Buffer | Uint8Array,
  mimeType?: string
): { success: true; size: number } | null {
  const blobsDir = getBlobsDir();
  if (!blobsDir) return null;

  const sanitizedName = sanitizeKey(name);

  if (data.length > MAX_BLOB_SIZE) {
    throw new Error(`Blob exceeds maximum size of ${MAX_BLOB_SIZE} bytes`);
  }

  const blobPath = path.join(blobsDir, sanitizedName);

  // Ensure directory exists
  fs.mkdirSync(path.dirname(blobPath), { recursive: true });

  // Write the blob
  fs.writeFileSync(blobPath, data);

  // Store metadata if provided
  if (mimeType) {
    const metaPath = `${blobPath}.meta.json`;
    fs.writeFileSync(metaPath, JSON.stringify({ mimeType }), "utf-8");
  }

  return { success: true, size: data.length };
}

/**
 * Retrieve a blob.
 *
 * @param name - The blob name
 * @returns Object with data and optional mimeType, or null if not found
 *
 * @example
 * ```typescript
 * import { experimental_blobGet } from "open-mcp-app/server";
 *
 * const result = await experimental_blobGet("images/photo.png");
 * if (result) {
 *   // result.data is a Buffer
 *   // result.mimeType is optional string
 * }
 * ```
 */
export async function experimental_blobGet(
  name: string
): Promise<{ data: Buffer; mimeType?: string } | null> {
  const blobsDir = getBlobsDir();
  if (!blobsDir) return null;

  const sanitizedName = sanitizeKey(name);
  const blobPath = path.join(blobsDir, sanitizedName);

  try {
    const data = await fsPromises.readFile(blobPath);

    // Try to read metadata
    let mimeType: string | undefined;
    try {
      const metaPath = `${blobPath}.meta.json`;
      const metaStr = await fsPromises.readFile(metaPath, "utf-8");
      const meta = JSON.parse(metaStr);
      mimeType = meta.mimeType;
    } catch {
      // No metadata file, that's ok
    }

    return { data, mimeType };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

/**
 * Retrieve a blob synchronously.
 *
 * @param name - The blob name
 * @returns Object with data and optional mimeType, or null if not found
 */
export function experimental_blobGetSync(
  name: string
): { data: Buffer; mimeType?: string } | null {
  const blobsDir = getBlobsDir();
  if (!blobsDir) return null;

  const sanitizedName = sanitizeKey(name);
  const blobPath = path.join(blobsDir, sanitizedName);

  try {
    const data = fs.readFileSync(blobPath);

    // Try to read metadata
    let mimeType: string | undefined;
    try {
      const metaPath = `${blobPath}.meta.json`;
      const metaStr = fs.readFileSync(metaPath, "utf-8");
      const meta = JSON.parse(metaStr);
      mimeType = meta.mimeType;
    } catch {
      // No metadata file, that's ok
    }

    return { data, mimeType };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

/**
 * Delete a blob.
 *
 * @param name - The blob name
 * @returns true if deleted, false if not found or storage unavailable
 *
 * @example
 * ```typescript
 * import { experimental_blobDelete } from "open-mcp-app/server";
 *
 * await experimental_blobDelete("images/old-photo.png");
 * ```
 */
export async function experimental_blobDelete(name: string): Promise<boolean> {
  const blobsDir = getBlobsDir();
  if (!blobsDir) return false;

  const sanitizedName = sanitizeKey(name);
  const blobPath = path.join(blobsDir, sanitizedName);

  try {
    await fsPromises.unlink(blobPath);
    // Try to delete metadata too
    try {
      await fsPromises.unlink(`${blobPath}.meta.json`);
    } catch {
      // No metadata file, that's ok
    }
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

/**
 * Delete a blob synchronously.
 *
 * @param name - The blob name
 * @returns true if deleted, false if not found or storage unavailable
 */
export function experimental_blobDeleteSync(name: string): boolean {
  const blobsDir = getBlobsDir();
  if (!blobsDir) return false;

  const sanitizedName = sanitizeKey(name);
  const blobPath = path.join(blobsDir, sanitizedName);

  try {
    fs.unlinkSync(blobPath);
    // Try to delete metadata too
    try {
      fs.unlinkSync(`${blobPath}.meta.json`);
    } catch {
      // No metadata file, that's ok
    }
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

/**
 * List blobs.
 *
 * @param prefix - Optional prefix to filter blob names
 * @returns Array of blob names, or null if storage unavailable
 *
 * @example
 * ```typescript
 * import { experimental_blobList } from "open-mcp-app/server";
 *
 * const images = await experimental_blobList("images/");
 * ```
 */
export async function experimental_blobList(prefix?: string): Promise<string[] | null> {
  const blobsDir = getBlobsDir();
  if (!blobsDir) return null;

  try {
    // Read recursively to support nested blob names
    const entries = await fsPromises.readdir(blobsDir, { recursive: true });
    let names = (entries as string[])
      .filter((e) => typeof e === "string" && !e.endsWith(".meta.json"));

    if (prefix) {
      const sanitizedPrefix = sanitizeKey(prefix);
      names = names.filter((n) => n.startsWith(sanitizedPrefix));
    }

    return names;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

/**
 * List blobs synchronously.
 *
 * @param prefix - Optional prefix to filter blob names
 * @returns Array of blob names, or null if storage unavailable
 */
export function experimental_blobListSync(prefix?: string): string[] | null {
  const blobsDir = getBlobsDir();
  if (!blobsDir) return null;

  try {
    const entries = fs.readdirSync(blobsDir, { recursive: true });
    let names = (entries as string[])
      .filter((e) => typeof e === "string" && !e.endsWith(".meta.json"));

    if (prefix) {
      const sanitizedPrefix = sanitizeKey(prefix);
      names = names.filter((n) => n.startsWith(sanitizedPrefix));
    }

    return names;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}
