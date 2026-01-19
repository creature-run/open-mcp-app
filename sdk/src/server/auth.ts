// ============================================================================
// Creature Identity
// ============================================================================
//
// Utilities for retrieving user identity from Creature-issued App Tokens.
// These tokens are provided to apps that opt into Creature-managed auth
// via `auth: { creatureManaged: true }` in createApp().
//
// The token contains signed claims about the user, organization, project,
// and session. The getIdentity function validates the token and returns
// the identity claims.
// ============================================================================

/**
 * User identity from a Creature token.
 */
export interface CreatureUser {
  /** Unique, stable user identifier */
  id: string;
  /** User's email address */
  email: string;
  /** User's display name (may be undefined) */
  name?: string;
}

/**
 * Organization context from a Creature token.
 */
export interface CreatureOrganization {
  /** Unique organization identifier */
  id: string;
  /** Organization display name */
  name: string;
  /** URL-safe organization slug */
  slug: string;
}

/**
 * Project context from a Creature token.
 */
export interface CreatureProject {
  /** Unique project identifier */
  id: string;
  /** Project display name */
  name: string;
}

/**
 * Session context from a Creature token.
 */
export interface CreatureSession {
  /** Unique session identifier */
  id: string;
}

/**
 * Identity claims from a Creature App Token.
 * Returned by getIdentity() on successful retrieval.
 */
export interface CreatureIdentity {
  /** User identity (always present for valid tokens) */
  user: CreatureUser;
  /** Organization context (present if user was in an org context) */
  organization?: CreatureOrganization;
  /** Project context (present if user was in a project context) */
  project?: CreatureProject;
  /** Session context */
  session?: CreatureSession;
  /** Token expiration time (ISO 8601 string) */
  expiresAt: string;
}

/**
 * Error thrown when identity retrieval fails.
 */
export class CreatureIdentityError extends Error {
  /** Error code from the identity API */
  code: string;

  constructor({ code, message }: { code: string; message: string }) {
    super(message);
    this.name = "CreatureIdentityError";
    this.code = code;
  }
}

/**
 * Configuration for the Creature identity API.
 */
interface IdentityConfig {
  /**
   * Base URL for the Creature API.
   * Defaults to https://api.creature.run
   * Can be overridden for testing or custom deployments.
   */
  apiUrl?: string;
}

/**
 * Default API URL for Creature services.
 */
const DEFAULT_API_URL = "https://api.creature.run";

/**
 * Extracts the token from an Authorization header or raw token string.
 * Handles both "Bearer <token>" format and raw tokens.
 *
 * @param tokenOrHeader - Either a raw token or "Bearer <token>" string
 * @returns The extracted token
 */
const extractToken = (tokenOrHeader: string): string => {
  const trimmed = tokenOrHeader.trim();
  if (trimmed.toLowerCase().startsWith("bearer ")) {
    return trimmed.slice(7).trim();
  }
  return trimmed;
};

/**
 * Retrieves user identity from a Creature App Token.
 *
 * Use this in your MCP App tool handlers to get the authenticated user's
 * identity. The token is provided via `context.creatureToken` when you
 * opt into Creature-managed auth.
 *
 * @param creatureToken - The App Token from context.creatureToken
 * @param config - Optional configuration (e.g., custom API URL)
 * @returns The identity claims (user, organization, project, session)
 * @throws {CreatureIdentityError} If the token is invalid, expired, or malformed
 *
 * @example
 * ```typescript
 * import { getIdentity } from "@creature-ai/sdk/server";
 *
 * app.tool("save_note", { ... }, async ({ content }, context) => {
 *   if (!context.creatureToken) {
 *     return { text: "Authentication required", isError: true };
 *   }
 *
 *   try {
 *     const identity = await getIdentity(context.creatureToken);
 *
 *     // Use identity to scope data access
 *     await db.notes.insert({
 *       user_id: identity.user.id,
 *       org_id: identity.organization?.id,
 *       content,
 *     });
 *
 *     return { text: "Note saved" };
 *   } catch (err) {
 *     if (err instanceof CreatureIdentityError) {
 *       return { text: err.message, isError: true };
 *     }
 *     throw err;
 *   }
 * });
 * ```
 */
export const getIdentity = async (
  creatureToken: string | undefined | null,
  config?: IdentityConfig
): Promise<CreatureIdentity> => {
  // Validate input
  if (!creatureToken) {
    throw new CreatureIdentityError({
      code: "missing_token",
      message: "No token provided. Pass context.creatureToken to getIdentity().",
    });
  }

  const token = extractToken(creatureToken);
  if (!token) {
    throw new CreatureIdentityError({
      code: "missing_token",
      message: "Empty token after extraction.",
    });
  }

  // Call Creature's identity endpoint
  const apiUrl = config?.apiUrl || DEFAULT_API_URL;
  const identityUrl = `${apiUrl}/apps/v1/identity`;

  let response: Response;
  try {
    response = await fetch(identityUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (err) {
    throw new CreatureIdentityError({
      code: "network_error",
      message: `Failed to reach Creature API: ${err instanceof Error ? err.message : "Unknown error"}`,
    });
  }

  // Handle error responses
  if (!response.ok) {
    let errorData: { error?: string; error_description?: string } = {};
    try {
      errorData = await response.json();
    } catch {
      // Response wasn't JSON
    }

    throw new CreatureIdentityError({
      code: errorData.error || "identity_error",
      message: errorData.error_description || `Identity request failed (HTTP ${response.status})`,
    });
  }

  // Parse successful response
  let data: {
    user: CreatureUser;
    organization?: CreatureOrganization;
    project?: CreatureProject;
    session?: CreatureSession;
    expires_at: string;
  };

  try {
    data = await response.json();
  } catch {
    throw new CreatureIdentityError({
      code: "invalid_response",
      message: "Invalid JSON response from Creature API",
    });
  }

  if (!data.user) {
    throw new CreatureIdentityError({
      code: "invalid_token",
      message: "Token is not valid",
    });
  }

  return {
    user: data.user,
    organization: data.organization,
    project: data.project,
    session: data.session,
    expiresAt: data.expires_at,
  };
};
