/**
 * Data Layer
 *
 * Provides a DataStore abstraction that switches implementations:
 * - Local development: In-memory Map
 * - Production: MongoDB (when MONGODB_URI is set)
 *
 * Cross-Platform Support:
 * - Creature/ChatGPT: Data scoped by orgId and projectId via cloud storage
 * - Generic MCP Apps: Data scoped by localId for local/session storage
 *
 * This enables the app to work in any MCP Apps host, with or without auth.
 */

import { MongoClient, type Db } from "mongodb";

// =============================================================================
// Types
// =============================================================================

/**
 * Scope for data isolation.
 *
 * Two modes:
 * 1. Cloud mode (Creature/ChatGPT): Uses orgId and optional projectId
 * 2. Local mode (generic MCP hosts): Uses localId for session-scoped storage
 */
export type DataScope =
  | { orgId: string; projectId?: string; localId?: never }
  | { localId: string; orgId?: never; projectId?: never };

// =============================================================================
// DataStore Interface
// =============================================================================

/**
 * Generic data store interface for CRUD operations.
 */
export interface DataStore<T> {
  get(id: string): Promise<T | null>;
  set(id: string, value: T): Promise<void>;
  delete(id: string): Promise<boolean>;
  list(): Promise<T[]>;
}

// =============================================================================
// In-Memory Implementation (Local Development)
// =============================================================================

/**
 * Shared in-memory storage that persists across store instantiations.
 * Key format: "collection:orgId:projectId:id"
 *
 * This is module-level so data survives across tool calls.
 * Each tool call creates a new InMemoryStore instance, but they all
 * read/write to this shared Map.
 */
const sharedInMemoryData = new Map<string, unknown>();

/**
 * In-memory data store using a shared Map.
 * Data persists for the lifetime of the process.
 * Scoped by collection and either orgId/projectId or localId to isolate data.
 */
class InMemoryStore<T> implements DataStore<T> {
  private collection: string;
  private scopeKey: string;

  constructor(collection: string, scope: DataScope) {
    this.collection = collection;
    // Build scope key based on which mode we're in
    if ("localId" in scope && scope.localId) {
      // Local mode: scope by localId
      this.scopeKey = `local:${scope.localId}`;
    } else if ("orgId" in scope && scope.orgId) {
      // Cloud mode: scope by orgId and optionally projectId
      const projectPart = scope.projectId || "_org_";
      this.scopeKey = `${scope.orgId}:${projectPart}`;
    } else {
      // Fallback for edge cases
      this.scopeKey = "anonymous";
    }
  }

  /**
   * Build a composite key that includes collection and scope.
   */
  private scopedKey(id: string): string {
    return `${this.collection}:${this.scopeKey}:${id}`;
  }

  /**
   * Get the prefix for listing items in this collection+scope.
   */
  private scopePrefix(): string {
    return `${this.collection}:${this.scopeKey}:`;
  }

  async get(id: string) {
    return (sharedInMemoryData.get(this.scopedKey(id)) as T) ?? null;
  }

  async set(id: string, value: T) {
    sharedInMemoryData.set(this.scopedKey(id), value);
  }

  async delete(id: string) {
    return sharedInMemoryData.delete(this.scopedKey(id));
  }

  async list() {
    const prefix = this.scopePrefix();
    const results: T[] = [];
    for (const [key, value] of sharedInMemoryData) {
      if (key.startsWith(prefix)) {
        results.push(value as T);
      }
    }
    return results;
  }
}

// =============================================================================
// MongoDB Implementation (Production)
// =============================================================================

/**
 * Cached MongoDB client for connection reuse across serverless invocations.
 * Following Vercel's guidance on MongoDB connection caching.
 */
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

/**
 * Get or create a MongoDB connection.
 * Caches the connection for reuse in serverless environments.
 * Uses MONGODB_DATABASE env var for database name, or falls back to URI default.
 */
const getDb = async (): Promise<Db> => {
  if (cachedDb) return cachedDb;

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI not set");

  if (!cachedClient) {
    cachedClient = new MongoClient(uri);
    await cachedClient.connect();
  }

  const dbName = process.env.MONGODB_DATABASE;
  cachedDb = cachedClient.db(dbName);
  return cachedDb;
};

/**
 * MongoDB data store for production.
 * Supports both cloud mode (orgId/projectId) and local mode (localId).
 */
class MongoDBStore<T> implements DataStore<T> {
  private scope: DataScope;

  constructor(
    private collectionName: string,
    scope: DataScope
  ) {
    this.scope = scope;
  }

  /**
   * Build query filter based on scope.
   * Handles both cloud mode (orgId/projectId) and local mode (localId).
   */
  private buildQuery(id?: string): Record<string, unknown> {
    const query: Record<string, unknown> = {};

    if ("localId" in this.scope && this.scope.localId) {
      // Local mode: scope by localId
      query.localId = this.scope.localId;
    } else if ("orgId" in this.scope && this.scope.orgId) {
      // Cloud mode: scope by orgId and optionally projectId
      query.orgId = this.scope.orgId;
      if (this.scope.projectId) {
        query.projectId = this.scope.projectId;
      } else {
        // Explicitly match documents without projectId (org-level data)
        query.projectId = { $exists: false };
      }
    }

    if (id) query._id = id;
    return query;
  }

  /**
   * Build document fields for storage.
   * Includes appropriate scope fields based on mode.
   */
  private buildDocFields(): Record<string, string> {
    if ("localId" in this.scope && this.scope.localId) {
      return { localId: this.scope.localId };
    }
    if ("orgId" in this.scope && this.scope.orgId) {
      const fields: Record<string, string> = { orgId: this.scope.orgId };
      if (this.scope.projectId) {
        fields.projectId = this.scope.projectId;
      }
      return fields;
    }
    return {};
  }

  async get(id: string): Promise<T | null> {
    const db = await getDb();
    const doc = await db.collection(this.collectionName).findOne(this.buildQuery(id));
    if (!doc) return null;
    // Remove scope fields from result
    const { _id, orgId: _o, projectId: _p, localId: _l, ...rest } = doc;
    return { id: _id, ...rest } as T;
  }

  async set(id: string, value: T): Promise<void> {
    const db = await getDb();
    const { id: _ignoredId, ...rest } = value as any;
    const docFields = this.buildDocFields();
    await db.collection(this.collectionName).replaceOne(
      this.buildQuery(id),
      { ...rest, ...docFields },
      { upsert: true }
    );
  }

  async delete(id: string): Promise<boolean> {
    const db = await getDb();
    const result = await db.collection(this.collectionName).deleteOne(this.buildQuery(id));
    return result.deletedCount > 0;
  }

  async list(): Promise<T[]> {
    const db = await getDb();
    const docs = await db
      .collection(this.collectionName)
      .find(this.buildQuery())
      .toArray();
    // Remove scope fields from results
    return docs.map(({ _id, orgId: _o, projectId: _p, localId: _l, ...rest }) => ({
      id: _id,
      ...rest,
    })) as T[];
  }
}

// =============================================================================
// Factory
// =============================================================================

/**
 * Create the appropriate data store based on environment.
 * Uses MongoDB if MONGODB_URI is set, otherwise in-memory.
 *
 * Cross-Platform Support:
 * - With auth (Creature/ChatGPT): Uses orgId/projectId scope for cloud storage
 * - Without auth (generic MCP hosts): Uses localId scope for local storage
 *
 * @param collection - The collection/namespace name
 * @param scope - The scope for data isolation (cloud or local mode)
 */
export const createDataStore = <T>({
  collection,
  scope,
}: {
  collection: string;
  scope: DataScope;
}): DataStore<T> => {
  if (process.env.MONGODB_URI) {
    return new MongoDBStore<T>(collection, scope);
  }
  return new InMemoryStore<T>(collection, scope);
};
