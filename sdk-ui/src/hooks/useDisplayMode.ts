/**
 * useDisplayMode Hook
 *
 * Provides programmatic access to the current display mode.
 * Reads from the DisplayModeContext set by <AppLayout>.
 *
 * For most cases, prefer the declarative <Show> component
 * or the inline:/pip:/fullscreen: Tailwind variants instead.
 */

import { useContext, useMemo } from "react";
import { DisplayModeContext } from "../context/DisplayModeContext.js";
import type { DisplayMode } from "../types.js";

export interface UseDisplayModeReturn {
  /** Current display mode. */
  displayMode: DisplayMode;
  /** True when mode is "inline". */
  isInline: boolean;
  /** True when mode is "pip". */
  isPip: boolean;
  /** True when mode is "fullscreen". */
  isFullscreen: boolean;
  /** Display modes the host supports. */
  availableDisplayModes: DisplayMode[];
}

/**
 * Read the current display mode from AppLayout context.
 *
 * Must be used inside an <AppLayout> component. If used outside,
 * defaults to "pip" mode.
 *
 * @returns Display mode state and boolean helpers
 *
 * @example
 * ```tsx
 * const { displayMode, isInline, isPip } = useDisplayMode();
 * const columns = isInline ? 1 : isPip ? 2 : 3;
 * ```
 */
export const useDisplayMode = (): UseDisplayModeReturn => {
  const { displayMode, availableDisplayModes } = useContext(DisplayModeContext);

  return useMemo(
    () => ({
      displayMode,
      isInline: displayMode === "inline",
      isPip: displayMode === "pip",
      isFullscreen: displayMode === "fullscreen",
      availableDisplayModes,
    }),
    [displayMode, availableDisplayModes]
  );
};
