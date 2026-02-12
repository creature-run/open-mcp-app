/**
 * Show — Conditional rendering by display mode.
 *
 * Renders children only when the current display mode matches.
 * Reads displayMode from the DisplayModeContext set by <AppLayout>.
 *
 * This is the simplest API for display-mode-conditional content.
 * Agents can use it declaratively without hooks or conditional logic.
 */

import { useContext, type ReactNode } from "react";
import { DisplayModeContext } from "../context/DisplayModeContext.js";
import type { DisplayMode } from "../types.js";

export interface ShowProps {
  /**
   * Display mode(s) to render in.
   * A single mode string or an array of modes.
   *
   * @example Single mode
   * ```tsx
   * <Show on="inline">Compact view</Show>
   * ```
   *
   * @example Multiple modes
   * ```tsx
   * <Show on={["pip", "fullscreen"]}>Full view</Show>
   * ```
   */
  on: DisplayMode | DisplayMode[];
  /** Content to render when the mode matches. */
  children: ReactNode;
  /** Optional content to render when the mode does NOT match. */
  fallback?: ReactNode;
}

/**
 * Conditionally render content based on the current display mode.
 *
 * @example Adaptive layout
 * ```tsx
 * <AppLayout>
 *   <Heading size="md">My App</Heading>
 *
 *   <Show on="inline">
 *     <Text variant="secondary">3 items</Text>
 *   </Show>
 *
 *   <Show on={["pip", "fullscreen"]}>
 *     <ItemsList />
 *     <ItemEditor />
 *   </Show>
 * </AppLayout>
 * ```
 */
export const Show = ({ on, children, fallback = null }: ShowProps) => {
  const { displayMode } = useContext(DisplayModeContext);

  const modes = Array.isArray(on) ? on : [on];
  const isMatch = modes.includes(displayMode);

  return <>{isMatch ? children : fallback}</>;
};
