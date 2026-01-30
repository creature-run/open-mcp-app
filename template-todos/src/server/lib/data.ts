/**
 * Data Layer
 *
 * Provides a simple DataStore abstraction with an in-memory implementation.
 * Data is scoped by localId for instance-based isolation.
 */

// =============================================================================
// DataStore Interface
// =============================================================================

/**
 * Generic data store interface for CRUD operations.
 * 
 * This interface allows swapping implementations (e.g., adding persistence)
 * without changing the tool handler code.
 */
export interface DataStore<T> {
  get(id: string): Promise<T | null>;
  set(id: string, value: T): Promise<void>;
  delete(id: string): Promise<boolean>;
  list(): Promise<T[]>;
}

// =============================================================================
// In-Memory Implementation
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
// Factory
// =============================================================================

/**
 * Create a data store for the given collection and localId.
 *
 * @param collection - The collection/namespace name
 * @param localId - The local ID for data isolation (typically instanceId)
 */
export const createDataStore = <T>({
  collection,
  localId,
}: {
  collection: string;
  localId: string;
}): DataStore<T> => {
  return new InMemoryStore<T>(collection, localId);
};
