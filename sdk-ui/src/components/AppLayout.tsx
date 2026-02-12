/**
 * AppLayout — Display-mode-aware root layout.
 *
 * Sets a `data-display-mode` attribute for CSS-based adaptation and
 * provides displayMode to children via DisplayModeContext.
 *
 * Reads displayMode from props. When used with the SDK, pass hostContext
 * values directly — this avoids a hard dependency on the SDK package
 * and keeps the component testable.
 *
 * @example With SDK's useHost
 * ```tsx
 * const { hostContext } = useHost();
 *
 * <AppLayout
 *   displayMode={hostContext?.displayMode}
 *   availableDisplayModes={hostContext?.availableDisplayModes}
 * >
 *   <MyContent />
 * </AppLayout>
 * ```
 */

import { useMemo, type ReactNode, type HTMLAttributes } from "react";
import { DisplayModeContext, type DisplayModeContextValue } from "../context/DisplayModeContext.js";
import type { DisplayMode } from "../types.js";

export interface AppLayoutProps extends HTMLAttributes<HTMLDivElement> {
  /** Child content. */
  children: ReactNode;
  /**
   * Current display mode. Pass from hostContext.displayMode.
   * Defaults to "pip" (the most common mode and safest fallback).
   */
  displayMode?: DisplayMode;
  /**
   * Display modes the host supports. Pass from hostContext.availableDisplayModes.
   * Defaults to an array containing just the current displayMode.
   */
  availableDisplayModes?: DisplayMode[];
}

/**
 * Padding classes per display mode.
 * Inline is tight (minimal chrome), pip is comfortable, fullscreen is generous.
 */
const paddingClasses: Record<DisplayMode, string> = {
  inline: "p-2",
  pip: "p-3",
  fullscreen: "p-4",
};

/**
 * Gap classes between direct children per display mode.
 */
const gapClasses: Record<DisplayMode, string> = {
  inline: "gap-1.5",
  pip: "gap-3",
  fullscreen: "gap-4",
};

/**
 * Display-mode-aware root layout component.
 *
 * @example Basic usage with SDK
 * ```tsx
 * function App() {
 *   const { hostContext } = useHost();
 *   return (
 *     <AppLayout displayMode={hostContext?.displayMode}>
 *       <MyContent />
 *     </AppLayout>
 *   );
 * }
 * ```
 *
 * @example Testing with explicit mode
 * ```tsx
 * <AppLayout displayMode="inline">
 *   <CompactView />
 * </AppLayout>
 * ```
 */
export const AppLayout = ({
  children,
  displayMode = "pip",
  availableDisplayModes,
  className = "",
  ...rest
}: AppLayoutProps) => {
  const resolvedAvailable = availableDisplayModes ?? [displayMode];

  const contextValue = useMemo<DisplayModeContextValue>(
    () => ({ displayMode, availableDisplayModes: resolvedAvailable }),
    [displayMode, resolvedAvailable]
  );

  const classes = [
    "flex flex-col min-h-0 w-full",
    paddingClasses[displayMode],
    gapClasses[displayMode],
    displayMode === "inline" ? "overflow-hidden" : "overflow-y-auto",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <DisplayModeContext.Provider value={contextValue}>
      <div data-display-mode={displayMode} className={classes} {...rest}>
        {children}
      </div>
    </DisplayModeContext.Provider>
  );
};
