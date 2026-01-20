/**
 * Data Layer
 *
 * Provides a DataStore abstraction that switches implementations:
 * - Local development: In-memory Map
 * - Production: MongoDB (when MONGODB_URI is set)
 *
 * Data is scoped by orgId and projectId as separate fields.
 * This enables flexible querying and data isolation per organization/project.
 */

import { MongoClient, type Db } from "mongodb";

// =============================================================================
// Types
// =============================================================================

/**
 * Scope for data isolation.
 * orgId is required; projectId is optional for org-level data (e.g., ChatGPT/OAuth).
 */
export interface DataScope {
  orgId: string;
  projectId?: string;
}

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
 * Scoped by collection, orgId, and optionally projectId to isolate data.
 */
class InMemoryStore<T> implements DataStore<T> {
  private collection: string;
  private orgId: string;
  private projectId?: string;

  constructor(collection: string, { orgId, projectId }: DataScope) {
    this.collection = collection;
    this.orgId = orgId;
    this.projectId = projectId;
  }

  /**
   * Build a composite key that includes collection and scope.
   * Uses "_org_" placeholder when projectId is absent (org-level data).
   */
  private scopedKey(id: string): string {
    const projectPart = this.projectId || "_org_";
    return `${this.collection}:${this.orgId}:${projectPart}:${id}`;
  }

  /**
   * Get the prefix for listing items in this collection+scope.
   */
  private scopePrefix(): string {
    const projectPart = this.projectId || "_org_";
    return `${this.collection}:${this.orgId}:${projectPart}:`;
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
 * Stores orgId and optionally projectId for flexible querying.
 * When projectId is absent, data is org-level (e.g., ChatGPT/OAuth users).
 */
class MongoDBStore<T> implements DataStore<T> {
  private orgId: string;
  private projectId?: string;

  constructor(
    private collectionName: string,
    { orgId, projectId }: DataScope
  ) {
    this.orgId = orgId;
    this.projectId = projectId;
  }

  /**
   * Build query filter based on scope.
   * Only includes projectId in query when it's defined.
   */
  private buildQuery(id?: string): Record<string, unknown> {
    const query: Record<string, unknown> = { orgId: this.orgId };
    if (this.projectId) {
      query.projectId = this.projectId;
    } else {
      // Explicitly match documents without projectId (org-level data)
      query.projectId = { $exists: false };
    }
    if (id) query._id = id;
    return query;
  }

  /**
   * Build document fields for storage.
   * Only includes projectId when it's defined.
   */
  private buildDocFields(): Record<string, string> {
    const fields: Record<string, string> = { orgId: this.orgId };
    if (this.projectId) {
      fields.projectId = this.projectId;
    }
    return fields;
  }

  async get(id: string): Promise<T | null> {
    const db = await getDb();
    const doc = await db.collection(this.collectionName).findOne(this.buildQuery(id));
    if (!doc) return null;
    const { _id, orgId: _o, projectId: _p, ...rest } = doc;
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
    return docs.map(({ _id, orgId: _o, projectId: _p, ...rest }) => ({
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
 * @param collection - The collection/namespace name
 * @param scope - The org and project scope (required for data isolation)
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
