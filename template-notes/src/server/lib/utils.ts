/**
 * Tool Utilities
 *
 * Shared helper functions used by note tools.
 * Handles ID generation, authentication, and store creation.
 */

import { getIdentity } from "@creature-ai/sdk/server";
import { createDataStore, type DataScope, type DataStore } from "./data.js";
import type { Note, ToolContext, ToolResult } from "./types.js";

// =============================================================================
// ID Generation
// =============================================================================

/**
 * Generate a unique note ID.
 * Format: note_<timestamp>_<random>
 */
export const generateNoteId = () =>
  `note_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

// =============================================================================
// Data Helpers
// =============================================================================

/**
 * Get all notes from a store, sorted by most recently updated.
 */
export const getAllNotes = async (store: DataStore<Note>): Promise<Note[]> => {
  const all = await store.list();
  return all.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
};

// =============================================================================
// Authentication
// =============================================================================

/**
 * Extract scope from Creature identity token.
 * Returns orgId and optionally projectId for data isolation.
 * 
 * - Creature with project: Returns { orgId, projectId }
 * - ChatGPT/OAuth: Returns { orgId } only (org-level data via personal org)
 * 
 * Throws if token is missing or invalid.
 */
export const extractScope = async (creatureToken?: string): Promise<DataScope> => {
  if (!creatureToken) {
    throw new Error("Authentication required: No Creature token provided");
  }

  const identity = await getIdentity(creatureToken);

  if (!identity.organization) {
    throw new Error("Authentication required: No organization context");
  }

  return {
    orgId: identity.organization.id,
    projectId: identity.project?.id,
  };
};

/**
 * Create a scoped note store based on identity.
 */
export const createNoteStore = (scope: DataScope): DataStore<Note> => {
  return createDataStore<Note>({
    collection: "mcps_notes_notes",
    scope,
  });
};

/**
 * Handle authentication and return store, or return error result.
 * Wraps tool handlers with auth logic to reduce boilerplate.
 */
export const withAuth = async (
  context: ToolContext,
  handler: (store: DataStore<Note>) => Promise<ToolResult>
): Promise<ToolResult> => {
  let scope: DataScope;
  try {
    scope = await extractScope(context.creatureToken);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Authentication failed";
    return {
      data: { error: message },
      text: message,
      isError: true,
    };
  }

  const store = createNoteStore(scope);
  return handler(store);
};
