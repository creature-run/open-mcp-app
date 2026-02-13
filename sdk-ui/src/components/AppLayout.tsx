/**
 * AppLayout — Display-mode-aware root layout.
 *
 * Uses a two-div architecture:
 *   - Outer div: scroll container + data-display-mode attribute. No padding,
 *     so overflow clipping never cuts off full-bleed children.
 *   - Inner div: adaptive padding + gap based on displayMode.
 *
 * This separation means children can achieve full-width layouts (e.g. edge-to-edge
 * dividers, tables, images) using negative margins without being clipped by the
 * scroll container's overflow boundary.
 *
 * Pass `noPadding` to remove the inner padding/gap entirely — useful when you
 * want full manual control over spacing (e.g. a detail view with a sticky header).
 *
 * @example Standard usage
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
 *
 * @example Full-bleed content (no padding)
 * ```tsx
 * <AppLayout displayMode={hostContext?.displayMode} noPadding>
 *   <FullWidthHeader />
 *   <div className="px-3 flex flex-col gap-3">
 *     <MainContent />
 *   </div>
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
  /**
   * Remove the inner padding and gap. When true, children get full control
   * over their own spacing and can render edge-to-edge without any offset.
   */
  noPadding?: boolean;
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
 * @example No padding for full control
 * ```tsx
 * <AppLayout displayMode="pip" noPadding>
 *   <StickyHeader />
 *   <div className="p-3"><Content /></div>
 * </AppLayout>
 * ```
 */
export const AppLayout = ({
  children,
  displayMode = "pip",
  availableDisplayModes,
  noPadding = false,
  className = "",
  ...rest
}: AppLayoutProps) => {
  const resolvedAvailable = availableDisplayModes ?? [displayMode];

  const contextValue = useMemo<DisplayModeContextValue>(
    () => ({ displayMode, availableDisplayModes: resolvedAvailable }),
    [displayMode, resolvedAvailable]
  );

  /**
   * Outer div: scroll container.
   * Handles overflow scrolling and sets the display mode data attribute.
   * No padding — so overflow clipping never eats into child content.
   */
  const outerClasses = [
    "min-h-0 w-full",
    displayMode === "inline" ? "overflow-hidden" : "overflow-y-auto",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  /**
   * Inner div: padding + gap + flex column layout.
   * Children live here and get adaptive spacing by default.
   *
   * When noPadding is false (default): uses min-h-full so content can grow
   * beyond the viewport and the outer scroll container handles scrolling.
   *
   * When noPadding is true: uses h-full so the inner div is exactly the
   * outer div's height. This lets children with flex-1 + min-h-0 constrain
   * themselves and manage their own internal scrolling — which is the whole
   * point of noPadding (full layout control).
   */
  const innerClasses = [
    "flex flex-col",
    noPadding ? "h-full" : "min-h-full",
    !noPadding && paddingClasses[displayMode],
    !noPadding && gapClasses[displayMode],
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <DisplayModeContext.Provider value={contextValue}>
      <div data-display-mode={displayMode} className={outerClasses} {...rest}>
        <div className={innerClasses}>
          {children}
        </div>
      </div>
    </DisplayModeContext.Provider>
  );
};
