/**
 * Data Store Abstraction
 *
 * Provides a unified interface for item storage that works with:
 * - SDK's experimental KV store (when available)
 * - In-memory fallback (for standalone/testing)
 *
 * This abstraction keeps tool handlers clean and testable.
 */

import { exp } from "open-mcp-app/server";
import type { Item } from "./types.js";

const ITEM_PREFIX = "item:";

/**
 * In-memory storage fallback when KV is not available.
 */
const memoryStore = new Map<string, Item>();

/**
 * Check if persistent KV storage is available.
 */
export const isKvAvailable = (): boolean => {
  return exp.kvIsAvailable();
};

/**
 * Get an item by ID.
 */
export const getItem = async ({ id }: { id: string }): Promise<Item | null> => {
  if (exp.kvIsAvailable()) {
    const data = await exp.kvGet(`${ITEM_PREFIX}${id}`);
    return data ? (JSON.parse(data) as Item) : null;
  }
  return memoryStore.get(id) ?? null;
};

/**
 * Save an item.
 */
export const saveItem = async ({ item }: { item: Item }): Promise<void> => {
  if (exp.kvIsAvailable()) {
    await exp.kvSet(`${ITEM_PREFIX}${item.id}`, JSON.stringify(item));
  } else {
    memoryStore.set(item.id, item);
  }
};

/**
 * Delete an item by ID.
 */
export const deleteItem = async ({ id }: { id: string }): Promise<boolean> => {
  if (exp.kvIsAvailable()) {
    return await exp.kvDelete(`${ITEM_PREFIX}${id}`);
  }
  return memoryStore.delete(id);
};

/**
 * Get all items, sorted by creation date (newest first).
 */
export const getAllItems = async (): Promise<Item[]> => {
  let items: Item[];

  if (exp.kvIsAvailable()) {
    const entries = await exp.kvListWithValues(ITEM_PREFIX);
    items = entries.map(([, value]) => JSON.parse(value) as Item);
  } else {
    items = Array.from(memoryStore.values());
  }

  // Sort by createdAt descending (newest first)
  return items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

/**
 * Search items by title or content.
 */
export const searchItems = async ({
  query,
}: {
  query: string;
}): Promise<Item[]> => {
  const lowerQuery = query.toLowerCase();
  const all = await getAllItems();

  return all.filter(
    (item) =>
      item.title.toLowerCase().includes(lowerQuery) ||
      item.content?.toLowerCase().includes(lowerQuery)
  );
};

/**
 * Delete all items (for reset functionality).
 */
export const deleteAllItems = async (): Promise<number> => {
  const items = await getAllItems();

  for (const item of items) {
    await deleteItem({ id: item.id });
  }

  return items.length;
};
