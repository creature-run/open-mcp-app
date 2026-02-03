/**
 * SDK Layout Variables
 *
 * This module provides SDK-only CSS variables for spacing, containers, and component sizing.
 * These are NOT part of the MCP Apps spec - they are convenient defaults for clean layouts.
 *
 * Host-provided spec variables (colors, typography, etc.) are applied automatically
 * when the app initializes via hostContext.styles.variables. Apps are not shown until
 * initialization is complete, so there's no need for pre-host defaults.
 *
 * Usage:
 * 1. Import base.css which uses these variables
 * 2. Or apply them manually via applyLayoutDefaults()
 */

// =============================================================================
// Layout Variables (Spacing, Containers, Components)
// =============================================================================

/**
 * SDK-only layout variables for spacing, containers, and component sizing.
 * These are NOT part of the MCP Apps spec but provide sensible defaults
 * for clean layouts.
 *
 * Based on a 4px (0.25rem) base unit, similar to Tailwind's spacing scale.
 * Component sizing follows patterns from @openai/apps-sdk-ui for consistency.
 */
export const LAYOUT_DEFAULTS: Record<string, string> = {
  // Spacing scale (4px base)
  "--spacing-0": "0",
  "--spacing-px": "1px",
  "--spacing-0-5": "0.125rem", // 2px
  "--spacing-1": "0.25rem", // 4px
  "--spacing-1-5": "0.375rem", // 6px
  "--spacing-2": "0.5rem", // 8px
  "--spacing-2-5": "0.625rem", // 10px
  "--spacing-3": "0.75rem", // 12px
  "--spacing-3-5": "0.875rem", // 14px
  "--spacing-4": "1rem", // 16px
  "--spacing-5": "1.25rem", // 20px
  "--spacing-6": "1.5rem", // 24px
  "--spacing-7": "1.75rem", // 28px
  "--spacing-8": "2rem", // 32px
  "--spacing-9": "2.25rem", // 36px
  "--spacing-10": "2.5rem", // 40px
  "--spacing-12": "3rem", // 48px
  "--spacing-14": "3.5rem", // 56px
  "--spacing-16": "4rem", // 64px
  "--spacing-20": "5rem", // 80px
  "--spacing-24": "6rem", // 96px

  // Container max-widths
  "--container-xs": "20rem", // 320px
  "--container-sm": "24rem", // 384px
  "--container-md": "28rem", // 448px
  "--container-lg": "32rem", // 512px
  "--container-xl": "36rem", // 576px
  "--container-2xl": "42rem", // 672px
  "--container-3xl": "48rem", // 768px
  "--container-4xl": "56rem", // 896px
  "--container-5xl": "64rem", // 1024px
  "--container-6xl": "72rem", // 1152px
  "--container-7xl": "80rem", // 1280px
  "--container-prose": "65ch", // Optimal reading width

  // Control heights (buttons, inputs)
  "--control-height-xs": "1.5rem", // 24px
  "--control-height-sm": "1.75rem", // 28px
  "--control-height-md": "2rem", // 32px
  "--control-height-lg": "2.25rem", // 36px
  "--control-height-xl": "2.5rem", // 40px
  "--control-height-2xl": "2.75rem", // 44px
  "--control-height-3xl": "3rem", // 48px

  // Control padding (internal horizontal padding)
  "--control-padding-xs": "0.5rem", // 8px
  "--control-padding-sm": "0.625rem", // 10px
  "--control-padding-md": "0.75rem", // 12px
  "--control-padding-lg": "0.875rem", // 14px
  "--control-padding-xl": "1rem", // 16px

  // Icon sizes (for use in buttons/inputs)
  "--icon-size-xs": "0.75rem", // 12px
  "--icon-size-sm": "0.875rem", // 14px
  "--icon-size-md": "1rem", // 16px
  "--icon-size-lg": "1.125rem", // 18px
  "--icon-size-xl": "1.25rem", // 20px
  "--icon-size-2xl": "1.5rem", // 24px

  // Focus ring
  "--ring-width": "2px",
  "--ring-offset": "2px",

  // Transitions
  "--transition-fast": "100ms ease",
  "--transition-normal": "150ms ease",
  "--transition-slow": "200ms ease",
  "--transition-slower": "300ms ease",
};

// =============================================================================
// Style Application
// =============================================================================

/**
 * Apply CSS variables to an element (defaults to document root).
 *
 * @param styles - Record of CSS variable names to their values
 * @param root - Element to apply styles to (defaults to document.documentElement)
 */
export const applyStyles = ({
  styles,
  root,
}: {
  styles: Record<string, string>;
  root?: HTMLElement;
}): void => {
  if (typeof document === "undefined") {
    return;
  }

  const element = root ?? document.documentElement;
  for (const [key, value] of Object.entries(styles)) {
    element.style.setProperty(key, value);
  }
};

/**
 * Apply SDK layout defaults to the document.
 * This applies spacing, container, and control variables.
 *
 * Note: If you import base.css, these variables are already defined via :root.
 * Only call this manually if you need to apply them programmatically or
 * to a specific element other than document root.
 *
 * @param root - Element to apply styles to (defaults to document.documentElement)
 */
export const applyLayoutDefaults = (root?: HTMLElement): void => {
  applyStyles({ styles: LAYOUT_DEFAULTS, root });
};
