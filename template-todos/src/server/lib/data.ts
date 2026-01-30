/**
 * Data Layer
 *
 * Provides a DataStore abstraction that switches implementations:
 * - Local development: In-memory Map
 * - Production: MongoDB (when MONGODB_URI is set)
 *
 * Data is scoped by localId for instance-based isolation.
 */

import { MongoClient, type Db } from "mongodb";

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
 * Key format: "collection:localId:id"
 *
 * This is module-level so data survives across tool calls.
 * Each tool call creates a new InMemoryStore instance, but they all
 * read/write to this shared Map.
 */
const sharedInMemoryData = new Map<string, unknown>();

/**
 * In-memory data store using a shared Map.
 * Data persists for the lifetime of the process.
 * Scoped by collection and localId to isolate data.
 */
class InMemoryStore<T> implements DataStore<T> {
  private collection: string;
  private localId: string;

  constructor(collection: string, localId: string) {
    this.collection = collection;
    this.localId = localId;
  }

  /**
   * Build a composite key that includes collection and localId.
   */
  private scopedKey(id: string): string {
    return `${this.collection}:${this.localId}:${id}`;
  }

  /**
   * Get the prefix for listing items in this collection+localId.
   */
  private scopePrefix(): string {
    return `${this.collection}:${this.localId}:`;
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
 * Data is scoped by localId.
 */
class MongoDBStore<T> implements DataStore<T> {
  private localId: string;

  constructor(
    private collectionName: string,
    localId: string
  ) {
    this.localId = localId;
  }

  /**
   * Build query filter with localId scope.
   */
  private buildQuery(id?: string): Record<string, unknown> {
    const query: Record<string, unknown> = { localId: this.localId };
    if (id) query._id = id;
    return query;
  }

  async get(id: string): Promise<T | null> {
    const db = await getDb();
    const doc = await db.collection(this.collectionName).findOne(this.buildQuery(id));
    if (!doc) return null;
    // Remove localId field from result
    const { _id, localId: _l, ...rest } = doc;
    return { id: _id, ...rest } as T;
  }

  async set(id: string, value: T): Promise<void> {
    const db = await getDb();
    const { id: _ignoredId, ...rest } = value as any;
    await db.collection(this.collectionName).replaceOne(
      this.buildQuery(id),
      { ...rest, localId: this.localId },
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
    // Remove localId field from results
    return docs.map(({ _id, localId: _l, ...rest }) => ({
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
 * @param localId - The local ID for data isolation
 */
export const createDataStore = <T>({
  collection,
  localId,
}: {
  collection: string;
  localId: string;
}): DataStore<T> => {
  if (process.env.MONGODB_URI) {
    return new MongoDBStore<T>(collection, localId);
  }
  return new InMemoryStore<T>(collection, localId);
};
