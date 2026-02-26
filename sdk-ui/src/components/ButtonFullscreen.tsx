/**
 * ButtonFullscreen — Expand button for entering fullscreen mode.
 *
 * Reads the current display mode from AppLayout context and calls
 * `requestDisplayMode` (from the SDK's `useHost` hook) on click.
 *
 * Hidden when already in fullscreen or when the host doesn't
 * support fullscreen.
 *
 * Must be rendered inside an <AppLayout> so it can read the
 * current display mode from context.
 *
 * @example
 * ```tsx
 * const { hostContext, requestDisplayMode } = useHost();
 *
 * <AppLayout
 *   displayMode={hostContext?.displayMode}
 *   availableDisplayModes={hostContext?.availableDisplayModes}
 * >
 *   <ButtonFullscreen requestDisplayMode={requestDisplayMode} />
 *   <MyContent />
 * </AppLayout>
 * ```
 */

import { useCallback, type HTMLAttributes } from "react";
import { useDisplayMode } from "../hooks/useDisplayMode.js";
import type { DisplayMode } from "../types.js";

export interface ButtonFullscreenProps extends Omit<HTMLAttributes<HTMLButtonElement>, "onClick" | "children"> {
  /**
   * The `requestDisplayMode` function from the SDK's `useHost()` hook.
   * Called with `{ mode: "fullscreen" }` when the user clicks.
   */
  requestDisplayMode: (params: { mode: DisplayMode }) => Promise<{ mode: DisplayMode }>;
}

export const ButtonFullscreen = ({
  requestDisplayMode,
  className = "",
  ...rest
}: ButtonFullscreenProps) => {
  const { isFullscreen, availableDisplayModes } = useDisplayMode();

  const expand = useCallback(() => {
    requestDisplayMode({ mode: "fullscreen" });
  }, [requestDisplayMode]);

  if (isFullscreen || !availableDisplayModes.includes("fullscreen")) {
    return null;
  }

  const classes = [
    "inline-flex items-center justify-center cursor-pointer",
    "rounded-full p-1.5 border border-border-primary hover:border-border-secondary",
    "text-[var(--color-border-primary)] hover:text-txt-tertiary transition-colors",
    "bg-transparent",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      onClick={expand}
      className={classes}
      aria-label="Enter fullscreen"
      title="Fullscreen"
      {...rest}
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="10 2 14 2 14 6" />
        <polyline points="6 14 2 14 2 10" />
        <line x1="14" y1="2" x2="9.5" y2="6.5" />
        <line x1="2" y1="14" x2="6.5" y2="9.5" />
      </svg>
    </button>
  );
};
