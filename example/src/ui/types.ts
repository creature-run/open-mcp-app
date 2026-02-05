/**
 * UI Types
 *
 * Types specific to the UI layer, including widget state.
 */

/**
 * Item entity (mirrors server type).
 */
export interface Item {
  id: string;
  title: string;
  content?: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

/**
 * Widget state visible to the AI agent.
 *
 * Use explicit, self-documenting property names.
 * The AI references these to understand context without asking.
 */
export interface ModelContent {
  /** Current view being displayed */
  currentView: "list" | "detail";

  /** Total number of items */
  totalItems: number;

  /** Number of completed items */
  completedItems: number;

  /** Selected item ID (when in detail view) */
  selectedItemId?: string;

  /** Selected item title (for AI reference) */
  selectedItemTitle?: string;

  /** Last action performed (for AI to confirm) */
  lastAction?: {
    type: "created" | "updated" | "deleted" | "searched";
    itemTitle?: string;
    query?: string;
  };
}

/**
 * Widget state for UI restoration only.
 *
 * Cache data, scroll positions, filter states.
 * The AI never sees this.
 */
export interface PrivateContent {
  /** Cached items for instant restore */
  items: Item[];

  /** Current search query */
  searchQuery?: string;

  /** Last fetched timestamp */
  lastFetchedAt: string;
}

/**
 * Combined widget state type.
 */
export interface WidgetState {
  modelContent: ModelContent;
  privateContent: PrivateContent;
}

/**
 * View configuration matching server.
 */
export const VIEWS = {
  "/": ["items_list", "items_create", "items_search", "items_seed", "items_reset"],
  "/item/:itemId": ["items_get", "items_update", "items_delete"],
} as const;
