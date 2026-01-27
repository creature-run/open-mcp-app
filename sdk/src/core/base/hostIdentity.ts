/**
 * Host Identity Utilities
 *
 * Helpers for parsing and working with the `hostContext.userAgent` field.
 * Per MCP Apps spec, userAgent identifies the host in format "<host>/<version>".
 */

import type { HostContext } from "./types.js";

/**
 * Parsed host identity from userAgent string.
 */
export interface HostIdentity {
  /** Host name (e.g. "creature", "chatgpt") */
  host: string;
  /** Host version if provided (e.g. "1.0.0") */
  version?: string;
}

/**
 * Parse a userAgent string into host and version components.
 *
 * Supports formats:
 * - "<host>/<version>" (e.g. "creature/1.0.0")
 * - "<host>" (e.g. "creature" - version will be undefined)
 *
 * @param userAgent - The userAgent string to parse
 * @returns Parsed host identity
 */
export function parseHostUserAgent(userAgent: string): HostIdentity {
  const trimmed = userAgent.trim();
  const slashIndex = trimmed.indexOf("/");

  if (slashIndex === -1) {
    // No version, just host name
    return { host: trimmed.toLowerCase() };
  }

  const host = trimmed.slice(0, slashIndex).toLowerCase();
  const version = trimmed.slice(slashIndex + 1) || undefined;

  return { host, version };
}

/**
 * Get host identity from a HostContext object.
 *
 * Convenience wrapper around parseHostUserAgent that handles null/undefined.
 *
 * @param context - The host context (may be null)
 * @returns Parsed host identity, or empty object if userAgent not available
 */
export function getHostIdentity(context: HostContext | null): Partial<HostIdentity> {
  if (!context?.userAgent) {
    return {};
  }
  return parseHostUserAgent(context.userAgent);
}

/**
 * Check if the host context indicates a specific host.
 *
 * @param context - The host context to check
 * @param hostName - The host name to match (case-insensitive)
 * @returns true if the context indicates the specified host
 */
export function isHost(context: HostContext | null, hostName: string): boolean {
  const identity = getHostIdentity(context);
  return identity.host === hostName.toLowerCase();
}

/**
 * Known host identifiers.
 * Apps can use these constants for reliable host detection.
 */
export const KNOWN_HOSTS = {
  CREATURE: "creature",
  CHATGPT: "chatgpt",
} as const;
