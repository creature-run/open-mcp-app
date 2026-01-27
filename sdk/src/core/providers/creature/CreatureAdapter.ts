/**
 * Creature Adapter
 *
 * Extends McpAppsAdapter with Creature-specific features:
 * - isCreature detection via hostContext.userAgent (spec-compliant)
 * - creatureStyles CSS variables from hostContext
 * - Creature-specific token authentication (server-side)
 * - Enhanced logging to DevConsole
 */

import { McpAppsAdapter } from "../mcp-apps/McpAppsAdapter.js";
import { McpAppsBaseHostClient } from "../../base/McpAppsBaseHostClient.js";
import { isHost, KNOWN_HOSTS } from "../../base/hostIdentity.js";
import type {
  HostClientConfig,
  HostContext,
} from "../../base/types.js";
import type { AdapterKind } from "../types.js";

/**
 * Extended host context with Creature-specific fields.
 */
export interface CreatureHostContext extends HostContext {
  /** Creature-specific CSS variables */
  creatureStyles?: Record<string, string | undefined>;
}

/**
 * Extended MCP Apps base client that handles Creature-specific hostContext.
 */
class CreatureBaseHostClient extends McpAppsBaseHostClient {
  private creatureStyles: Record<string, string | undefined> | null = null;

  /**
   * Get Creature-specific styles from host context.
   */
  getCreatureStyles(): Record<string, string | undefined> | null {
    return this.creatureStyles;
  }

  /**
   * Check if connected to a Creature host.
   *
   * Detection is done via hostContext.userAgent (spec-compliant approach).
   * Falls back to checking for creatureStyles for backward compatibility
   * with older Creature versions.
   */
  isCreatureHost(): boolean {
    const context = this.getHostContext() as CreatureHostContext | null;
    // Primary: check userAgent (spec-compliant)
    if (isHost(context, KNOWN_HOSTS.CREATURE)) {
      return true;
    }
    // Fallback: check for creatureStyles (backward compatibility)
    return context?.creatureStyles !== undefined;
  }

  /**
   * Override to also apply Creature-specific styles.
   */
  protected applyHostContext(context: {
    theme?: unknown;
    styles?: { variables?: unknown; css?: { fonts?: string } };
    creatureStyles?: Record<string, string | undefined>;
  }): void {
    // Apply base MCP Apps styles first
    super.applyHostContext(context);

    // Apply Creature-specific extension styles
    if (context.creatureStyles) {
      this.creatureStyles = context.creatureStyles;
      this.applyCreatureStyles(context.creatureStyles);
    }
  }

  /**
   * Apply Creature-specific CSS variables to the document root.
   */
  private applyCreatureStyles(styles: Record<string, string | undefined>): void {
    const root = document.documentElement;
    for (const [key, value] of Object.entries(styles)) {
      if (value !== undefined) {
        root.style.setProperty(key, value);
      }
    }
  }
}

/**
 * Creature adapter implementation.
 *
 * Extends McpAppsAdapter with Creature-specific functionality:
 * - isCreature property that checks hostContext for creatureStyles
 * - getCreatureStyles() for accessing Creature CSS variables
 * - Full DevConsole logging
 *
 * This adapter is backward-compatible with generic MCP Apps hosts -
 * Creature-specific features simply return null/false when not in Creature.
 */
export class CreatureAdapter extends McpAppsAdapter {
  override readonly adapterKind: AdapterKind = "creature";
  declare readonly base: CreatureBaseHostClient;

  constructor(config: HostClientConfig) {
    super(config);
  }

  /**
   * Override to create the Creature-specific base client.
   */
  protected override createBaseClient(config: HostClientConfig): CreatureBaseHostClient {
    return new CreatureBaseHostClient(config);
  }

  // ============================================================================
  // Static Factory
  // ============================================================================

  /**
   * Create a Creature adapter instance.
   */
  static override create(config: HostClientConfig): CreatureAdapter {
    return new CreatureAdapter(config);
  }

  /**
   * Check if the current environment is Creature.
   *
   * Pre-connection detection is no longer supported. Per MCP Apps spec,
   * host identification happens after ui/initialize via hostContext.userAgent.
   *
   * This method now always returns false. Use isCreature property after
   * connection for accurate host detection.
   *
   * @deprecated Pre-connection Creature detection is deprecated.
   *             Use isCreature property after connection instead.
   */
  static override detect(): boolean {
    // Pre-connection detection removed in favor of spec-compliant
    // post-connection detection via hostContext.userAgent
    return false;
  }

  // ============================================================================
  // Creature-Specific Extensions
  // ============================================================================

  /**
   * Whether this host is Creature.
   * Checked via hostContext after connection - looks for creatureStyles.
   */
  override get isCreature(): boolean {
    return this.base.isCreatureHost();
  }

  /**
   * Get Creature-specific styles if available.
   * Returns null when not running in Creature.
   */
  getCreatureStyles(): Record<string, string | undefined> | null {
    return this.base.getCreatureStyles();
  }
}
