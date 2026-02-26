/**
 * ButtonPip — Picture-in-picture button for entering pip mode.
 *
 * Reads the current display mode from AppLayout context and calls
 * `requestDisplayMode` (from the SDK's `useHost` hook) on click.
 *
 * Hidden when already in pip or when the host doesn't support pip.
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
 *   <ButtonPip requestDisplayMode={requestDisplayMode} />
 *   <MyContent />
 * </AppLayout>
 * ```
 */

import { useCallback, type HTMLAttributes } from "react";
import { useDisplayMode } from "../hooks/useDisplayMode.js";
import type { DisplayMode } from "../types.js";

export interface ButtonPipProps extends Omit<HTMLAttributes<HTMLButtonElement>, "onClick" | "children"> {
  /**
   * The `requestDisplayMode` function from the SDK's `useHost()` hook.
   * Called with `{ mode: "pip" }` when the user clicks.
   */
  requestDisplayMode: (params: { mode: DisplayMode }) => Promise<{ mode: DisplayMode }>;
}

export const ButtonPip = ({
  requestDisplayMode,
  className = "",
  ...rest
}: ButtonPipProps) => {
  const { isPip, availableDisplayModes } = useDisplayMode();

  const enter = useCallback(() => {
    requestDisplayMode({ mode: "pip" });
  }, [requestDisplayMode]);

  if (isPip || !availableDisplayModes.includes("pip")) {
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
      onClick={enter}
      className={classes}
      aria-label="Enter picture-in-picture"
      title="Picture-in-picture"
      {...rest}
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="1" y="2" width="14" height="12" rx="1.5" />
        <rect x="8" y="8" width="6" height="5" rx="1" fill="currentColor" stroke="none" />
      </svg>
    </button>
  );
};
