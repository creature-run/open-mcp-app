/**
 * Item Utilities
 *
 * Helper functions for creating and updating items
 * with proper timestamp handling.
 */

import { nanoid } from "nanoid";
import type { Item } from "./types.js";

/**
 * Create a new item with proper defaults.
 *
 * Uses nanoid for IDs: compact (21 chars), URL-safe, cryptographically secure.
 */
export const createItem = ({
  title,
  content,
}: {
  title: string;
  content?: string;
}): Item => {
  const now = new Date().toISOString();
  return {
    id: nanoid(),
    title,
    content,
    completed: false,
    createdAt: now,
    updatedAt: now,
  };
};

/**
 * Update an item, tracking the change timestamp.
 *
 * Handles completedAt timestamp automatically:
 * - Sets completedAt when marking complete
 * - Clears completedAt when marking incomplete
 */
export const updateItem = ({
  item,
  updates,
}: {
  item: Item;
  updates: Partial<Pick<Item, "title" | "content" | "completed">>;
}): Item => {
  const now = new Date().toISOString();
  const updated: Item = {
    ...item,
    ...updates,
    updatedAt: now,
  };

  // Track completion time
  if (updates.completed === true && !item.completed) {
    updated.completedAt = now;
  } else if (updates.completed === false) {
    delete updated.completedAt;
  }

  return updated;
};
