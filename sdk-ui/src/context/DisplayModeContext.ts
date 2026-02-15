/**
 * Display Mode Context
 *
 * Provides the current display mode to all child components.
 * Set by <AppLayout>, consumed by <Show> and useDisplayMode().
 *
 * Separated from AppLayout so the context can be imported
 * without pulling in the full component tree.
 */

import { createContext } from "react";
import type { DisplayMode } from "../types.js";

export interface DisplayModeContextValue {
  /** Current display mode from host context. */
  displayMode: DisplayMode;
  /** Display modes the host supports. */
  availableDisplayModes: DisplayMode[];
}

/**
 * Defaults to "pip" — the most common mode and a safe middle ground
 * when no host context is available.
 */
export const DisplayModeContext = createContext<DisplayModeContextValue>({
  displayMode: "pip",
  availableDisplayModes: ["pip"],
});
