/**
 * Item Entity Types
 *
 * Generic "Item" model with proper data practices:
 * - IDs: nanoid for compact, URL-safe uniqueness
 * - Timestamps: ISO 8601 strings for portability
 * - Optional fields: Explicitly typed
 */

/**
 * Item entity with proper data hygiene.
 */
export interface Item {
  /** Unique identifier (nanoid: compact, URL-safe) */
  id: string;

  /** Primary display field */
  title: string;

  /** Optional rich content (markdown supported) */
  content?: string;

  /** Completion status */
  completed: boolean;

  /** ISO 8601 timestamp of creation */
  createdAt: string;

  /** ISO 8601 timestamp of last update */
  updatedAt: string;

  /** ISO 8601 timestamp when completed (undefined if not completed) */
  completedAt?: string;
}

/**
 * Data returned to UI for list operations.
 */
export interface ItemsData {
  items: Item[];
}

/**
 * Data returned to UI for single item operations.
 */
export interface ItemData {
  item: Item;
  view?: "detail";
}
