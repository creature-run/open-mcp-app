/**
 * Environment-Aware Default Styles
 *
 * This module provides default CSS variable values for MCP Apps and ChatGPT Apps.
 * Import `initStyles` early in your app entry point to prevent flash of unstyled content.
 *
 * The MCP Apps spec defines CSS variable names (e.g., --color-background-primary).
 * This module provides environment-specific VALUES for those variables as sensible
 * defaults until the host injects its own values.
 *
 * Flow:
 * 1. Detect environment (ChatGPT, MCP Apps, or Standalone)
 * 2. Detect theme (light or dark)
 * 3. Inject defaults immediately on document.documentElement
 * 4. When host connects, host variables override these defaults
 *
 * IMPORTANT: MCP Apps defaults match Creature's actual values exactly.
 * The observer only runs for ChatGPT (MCP Apps hosts handle theme changes themselves).
 */

import type { Environment } from "./types.js";

// =============================================================================
// Types
// =============================================================================

/**
 * Theme mode for styling.
 */
export type Theme = "light" | "dark";

/**
 * Options for initializing styles.
 */
export interface InitStylesOptions {
  /** Whether to set up a MutationObserver for dynamic theme changes. Default: true for ChatGPT only */
  observeThemeChanges?: boolean;
}

// =============================================================================
// MCP Apps Default Style Values (Creature)
// =============================================================================

/**
 * MCP Apps / Creature default values - DARK mode.
 * These values are extracted directly from Creature's globals.css.
 * They MUST match exactly what Creature sends via hostContext.styles.variables.
 */
const MCP_APPS_DARK_DEFAULTS: Record<string, string> = {
  // Background colors
  "--color-background-primary": "#0D0D0B",
  "--color-background-secondary": "#1A1917",
  "--color-background-tertiary": "#141311",
  "--color-background-inverse": "#efefef",
  "--color-background-ghost": "transparent",
  "--color-background-info": "#1e3a5f",
  "--color-background-danger": "#5f1e1e",
  "--color-background-success": "#1e5f2e",
  "--color-background-warning": "#5f4a1e",
  "--color-background-disabled": "#1A1917",
  // Text colors
  "--color-text-primary": "#efefef",
  "--color-text-secondary": "#888888",
  "--color-text-tertiary": "#4A4846",
  "--color-text-inverse": "#0D0D0B",
  "--color-text-ghost": "#3A3836",
  "--color-text-info": "#58a6ff",
  "--color-text-danger": "#F85149",
  "--color-text-success": "#3fb950",
  "--color-text-warning": "#d29922",
  "--color-text-disabled": "#4A4846",
  // Border colors
  "--color-border-primary": "#4A4846",
  "--color-border-secondary": "#242222",
  "--color-border-tertiary": "#1A1917",
  "--color-border-inverse": "#ABABAB",
  "--color-border-ghost": "transparent",
  "--color-border-info": "#58a6ff",
  "--color-border-danger": "#F85149",
  "--color-border-success": "#3fb950",
  "--color-border-warning": "#d29922",
  "--color-border-disabled": "#242222",
  // Ring/focus colors
  "--color-ring-primary": "#cdcdcd",
  "--color-ring-secondary": "#666666",
  "--color-ring-inverse": "#0D0D0B",
  "--color-ring-info": "#58a6ff",
  "--color-ring-danger": "#F85149",
  "--color-ring-success": "#3fb950",
  "--color-ring-warning": "#d29922",
  // Shadows (dark mode)
  "--shadow-hairline": "0 0 0 1px rgba(0, 0, 0, 0.1)",
  "--shadow-sm": "0 1px 2px 0 rgba(0, 0, 0, 0.3)",
  "--shadow-md": "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.3)",
  "--shadow-lg": "0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -4px rgba(0, 0, 0, 0.3)",
};

/**
 * MCP Apps / Creature default values - LIGHT mode.
 * These values are extracted directly from Creature's globals.css.
 */
const MCP_APPS_LIGHT_DEFAULTS: Record<string, string> = {
  // Background colors
  "--color-background-primary": "#f2f2f2",
  "--color-background-secondary": "#e8e8e8",
  "--color-background-tertiary": "#eaeaea",
  "--color-background-inverse": "#1F1E1D",
  "--color-background-ghost": "transparent",
  "--color-background-info": "#dbeafe",
  "--color-background-danger": "#fee2e2",
  "--color-background-success": "#dcfce7",
  "--color-background-warning": "#fef3c7",
  "--color-background-disabled": "#e8e8e8",
  // Text colors
  "--color-text-primary": "#1F1E1D",
  "--color-text-secondary": "#6B6A68",
  "--color-text-tertiary": "#9A9998",
  "--color-text-inverse": "#F8F7F6",
  "--color-text-ghost": "#B8B7B5",
  "--color-text-info": "#0366d6",
  "--color-text-danger": "#DC2626",
  "--color-text-success": "#22863a",
  "--color-text-warning": "#b08800",
  "--color-text-disabled": "#9A9998",
  // Border colors
  "--color-border-primary": "#b8b8b8",
  "--color-border-secondary": "#d8d8d8",
  "--color-border-tertiary": "#e8e8e8",
  "--color-border-inverse": "#1F1E1D",
  "--color-border-ghost": "transparent",
  "--color-border-info": "#0366d6",
  "--color-border-danger": "#DC2626",
  "--color-border-success": "#22863a",
  "--color-border-warning": "#b08800",
  "--color-border-disabled": "#d8d8d8",
  // Ring/focus colors
  "--color-ring-primary": "#666666",
  "--color-ring-secondary": "#AAAAAA",
  "--color-ring-inverse": "#F8F7F6",
  "--color-ring-info": "#0366d6",
  "--color-ring-danger": "#DC2626",
  "--color-ring-success": "#22863a",
  "--color-ring-warning": "#b08800",
  // Shadows (light mode)
  "--shadow-hairline": "0 0 0 1px rgba(0, 0, 0, 0.05)",
  "--shadow-sm": "0 1px 2px 0 rgba(0, 0, 0, 0.1)",
  "--shadow-md": "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
  "--shadow-lg": "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
};

/**
 * Shared MCP Apps / Creature typography and layout tokens (same for light/dark).
 * These values are extracted directly from Creature's globals.css.
 */
const MCP_APPS_SHARED_DEFAULTS: Record<string, string> = {
  // Typography - font families
  "--font-sans": '"Sora", system-ui, sans-serif',
  "--font-mono": '"SF Mono", Monaco, Consolas, "Liberation Mono", monospace',
  // Typography - font weights
  "--font-weight-normal": "400",
  "--font-weight-medium": "500",
  "--font-weight-semibold": "600",
  "--font-weight-bold": "700",
  // Typography - text sizes
  "--font-text-xs-size": "0.6875rem",
  "--font-text-sm-size": "0.75rem",
  "--font-text-md-size": "0.875rem",
  "--font-text-lg-size": "1rem",
  // Typography - text line heights
  "--font-text-xs-line-height": "1rem",
  "--font-text-sm-line-height": "1.25rem",
  "--font-text-md-line-height": "1.5rem",
  "--font-text-lg-line-height": "1.75rem",
  // Typography - heading sizes
  "--font-heading-xs-size": "0.875rem",
  "--font-heading-sm-size": "1rem",
  "--font-heading-md-size": "1.125rem",
  "--font-heading-lg-size": "1.25rem",
  "--font-heading-xl-size": "1.5rem",
  "--font-heading-2xl-size": "1.875rem",
  "--font-heading-3xl-size": "2.25rem",
  // Typography - heading line heights
  "--font-heading-xs-line-height": "1.25rem",
  "--font-heading-sm-line-height": "1.5rem",
  "--font-heading-md-line-height": "1.75rem",
  "--font-heading-lg-line-height": "2rem",
  "--font-heading-xl-line-height": "2.25rem",
  "--font-heading-2xl-line-height": "2.5rem",
  "--font-heading-3xl-line-height": "2.75rem",
  // Border radius
  "--border-radius-xs": "0.125rem",
  "--border-radius-sm": "0.25rem",
  "--border-radius-md": "0.375rem",
  "--border-radius-lg": "0.5rem",
  "--border-radius-xl": "0.75rem",
  "--border-radius-full": "9999px",
  // Border width
  "--border-width-regular": "1px",
};

// =============================================================================
// ChatGPT Apps Default Style Values
// =============================================================================

/**
 * ChatGPT Apps default values - LIGHT mode.
 * Ported from @openai/apps-sdk-ui design tokens.
 */
const CHATGPT_LIGHT_DEFAULTS: Record<string, string> = {
  "--color-background-primary": "#ffffff",
  "--color-background-secondary": "#f7f7f8",
  "--color-background-tertiary": "#ececec",
  "--color-background-inverse": "#0d0d0d",
  "--color-background-ghost": "rgba(0, 0, 0, 0.04)",
  "--color-background-info": "#eef6fc",
  "--color-background-danger": "#fdecec",
  "--color-background-success": "#edf8ee",
  "--color-background-warning": "#fdf5e6",
  "--color-background-disabled": "#f4f4f4",
  "--color-text-primary": "#0d0d0d",
  "--color-text-secondary": "#6e6e80",
  "--color-text-tertiary": "#8e8ea0",
  "--color-text-inverse": "#ffffff",
  "--color-text-ghost": "rgba(0, 0, 0, 0.4)",
  "--color-text-info": "#0066da",
  "--color-text-danger": "#d93025",
  "--color-text-success": "#188038",
  "--color-text-warning": "#b36200",
  "--color-text-disabled": "#b4b4b4",
  "--color-border-primary": "#e5e5e5",
  "--color-border-secondary": "#ececec",
  "--color-border-tertiary": "#f4f4f4",
  "--color-border-inverse": "#3c3c3c",
  "--color-border-ghost": "rgba(0, 0, 0, 0.08)",
  "--color-border-info": "#a8d4fb",
  "--color-border-danger": "#f9b4ab",
  "--color-border-success": "#a8dab5",
  "--color-border-warning": "#f9dca8",
  "--color-border-disabled": "#d9d9d9",
  "--color-ring-primary": "#10a37f",
  "--color-ring-secondary": "#6e6e80",
  "--color-ring-inverse": "#ffffff",
  "--color-ring-info": "#0066da",
  "--color-ring-danger": "#d93025",
  "--color-ring-success": "#188038",
  "--color-ring-warning": "#b36200",
};

/**
 * ChatGPT Apps default values - DARK mode.
 */
const CHATGPT_DARK_DEFAULTS: Record<string, string> = {
  "--color-background-primary": "#212121",
  "--color-background-secondary": "#2f2f2f",
  "--color-background-tertiary": "#424242",
  "--color-background-inverse": "#ffffff",
  "--color-background-ghost": "rgba(255, 255, 255, 0.04)",
  "--color-background-info": "#1a3a4a",
  "--color-background-danger": "#4a1a1a",
  "--color-background-success": "#1a3a1a",
  "--color-background-warning": "#4a3a1a",
  "--color-background-disabled": "#3a3a3a",
  "--color-text-primary": "#ececec",
  "--color-text-secondary": "#b4b4b4",
  "--color-text-tertiary": "#8e8e8e",
  "--color-text-inverse": "#0d0d0d",
  "--color-text-ghost": "rgba(255, 255, 255, 0.4)",
  "--color-text-info": "#6eb5ff",
  "--color-text-danger": "#ff6b6b",
  "--color-text-success": "#6bff6b",
  "--color-text-warning": "#ffb86b",
  "--color-text-disabled": "#666666",
  "--color-border-primary": "#424242",
  "--color-border-secondary": "#3a3a3a",
  "--color-border-tertiary": "#2f2f2f",
  "--color-border-inverse": "#e5e5e5",
  "--color-border-ghost": "rgba(255, 255, 255, 0.08)",
  "--color-border-info": "#3a5a7a",
  "--color-border-danger": "#7a3a3a",
  "--color-border-success": "#3a7a3a",
  "--color-border-warning": "#7a5a3a",
  "--color-border-disabled": "#4a4a4a",
  "--color-ring-primary": "#10a37f",
  "--color-ring-secondary": "#8e8e8e",
  "--color-ring-inverse": "#0d0d0d",
  "--color-ring-info": "#6eb5ff",
  "--color-ring-danger": "#ff6b6b",
  "--color-ring-success": "#6bff6b",
  "--color-ring-warning": "#ffb86b",
};

/**
 * Shared ChatGPT typography and layout tokens (same for light/dark).
 */
const CHATGPT_SHARED_DEFAULTS: Record<string, string> = {
  "--font-sans": '"Söhne", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  "--font-mono": '"Söhne Mono", ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  "--font-weight-normal": "400",
  "--font-weight-medium": "500",
  "--font-weight-semibold": "600",
  "--font-weight-bold": "700",
  "--font-text-xs-size": "0.75rem",
  "--font-text-xs-line-height": "1rem",
  "--font-text-sm-size": "0.875rem",
  "--font-text-sm-line-height": "1.25rem",
  "--font-text-md-size": "1rem",
  "--font-text-md-line-height": "1.5rem",
  "--font-text-lg-size": "1.125rem",
  "--font-text-lg-line-height": "1.75rem",
  "--font-heading-xs-size": "0.875rem",
  "--font-heading-xs-line-height": "1.25rem",
  "--font-heading-sm-size": "1rem",
  "--font-heading-sm-line-height": "1.5rem",
  "--font-heading-md-size": "1.125rem",
  "--font-heading-md-line-height": "1.75rem",
  "--font-heading-lg-size": "1.25rem",
  "--font-heading-lg-line-height": "1.75rem",
  "--font-heading-xl-size": "1.5rem",
  "--font-heading-xl-line-height": "2rem",
  "--font-heading-2xl-size": "1.875rem",
  "--font-heading-2xl-line-height": "2.25rem",
  "--font-heading-3xl-size": "2.25rem",
  "--font-heading-3xl-line-height": "2.5rem",
  "--border-radius-xs": "4px",
  "--border-radius-sm": "6px",
  "--border-radius-md": "8px",
  "--border-radius-lg": "12px",
  "--border-radius-xl": "16px",
  "--border-radius-full": "9999px",
  "--border-width-regular": "1px",
  "--shadow-hairline": "0 0 0 1px rgba(0, 0, 0, 0.05)",
  "--shadow-sm": "0 1px 2px rgba(0, 0, 0, 0.04)",
  "--shadow-md": "0 2px 8px rgba(0, 0, 0, 0.08)",
  "--shadow-lg": "0 8px 24px rgba(0, 0, 0, 0.12)",
};

// =============================================================================
// Style Getters
// =============================================================================

/**
 * Get MCP Apps default styles for the specified theme.
 * Returns CSS variable names with their default values.
 * These values match exactly what Creature sends via hostContext.styles.variables.
 *
 * @param theme - The theme to get defaults for
 * @returns Record of CSS variable names to their values
 */
export const getMcpAppDefaultStyles = ({ theme }: { theme: Theme }): Record<string, string> => {
  const colorDefaults = theme === "dark" ? MCP_APPS_DARK_DEFAULTS : MCP_APPS_LIGHT_DEFAULTS;
  return { ...colorDefaults, ...MCP_APPS_SHARED_DEFAULTS };
};

/**
 * Get ChatGPT Apps default styles for the specified theme.
 * Returns CSS variable names with their values matching the @openai/apps-sdk-ui design tokens.
 *
 * @param theme - The theme to get defaults for
 * @returns Record of CSS variable names to their values
 */
export const getChatGptDefaultStyles = ({ theme }: { theme: Theme }): Record<string, string> => {
  const colorDefaults = theme === "dark" ? CHATGPT_DARK_DEFAULTS : CHATGPT_LIGHT_DEFAULTS;
  return { ...colorDefaults, ...CHATGPT_SHARED_DEFAULTS };
};

// =============================================================================
// Theme Detection
// =============================================================================

/**
 * Detect the current theme from the document.
 * Checks data-theme attribute, dark class (Tailwind), and prefers-color-scheme.
 *
 * @returns The detected theme
 */
export const detectTheme = (): Theme => {
  if (typeof document === "undefined") {
    return "dark"; // Default to dark for Creature
  }

  const root = document.documentElement;

  // Check data-theme attribute (ChatGPT uses this)
  const dataTheme = root.getAttribute("data-theme");
  if (dataTheme === "dark" || dataTheme === "light") {
    return dataTheme;
  }

  // Check for dark/light class (Tailwind convention, Creature uses this)
  if (root.classList.contains("light")) {
    return "light";
  }
  if (root.classList.contains("dark")) {
    return "dark";
  }

  // Check prefers-color-scheme media query
  if (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }

  return "dark"; // Default to dark for Creature
};

// =============================================================================
// Style Application
// =============================================================================

/**
 * Apply CSS variables to the document root.
 *
 * @param styles - Record of CSS variable names to their values
 */
export const applyStyles = ({ styles }: { styles: Record<string, string> }): void => {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  for (const [key, value] of Object.entries(styles)) {
    root.style.setProperty(key, value);
  }
};

/**
 * Initialize default styles based on detected environment and theme.
 * This should be called early in your app entry point to prevent FOUC.
 *
 * For MCP Apps (Creature): Applies defaults once. The host handles theme changes
 * and sends new styles via hostContext, which override these defaults.
 *
 * For ChatGPT: Applies defaults and sets up an observer to handle theme changes,
 * since ChatGPT may change theme before sending new hostContext.
 *
 * @param environment - The detected environment (from detectEnvironment)
 * @param options - Configuration options
 */
export const initStyles = ({
  environment,
  options = {},
}: {
  environment: Environment;
  options?: InitStylesOptions;
}): void => {
  if (typeof document === "undefined") {
    return;
  }

  const theme = detectTheme();

  // Select defaults based on environment AND theme
  const defaults = environment === "chatgpt"
    ? getChatGptDefaultStyles({ theme })
    : getMcpAppDefaultStyles({ theme });

  // Apply defaults immediately
  applyStyles({ styles: defaults });

  // Set data-env attribute for CSS selectors if needed
  document.documentElement.setAttribute("data-env", environment);

  // Only set up theme observer for ChatGPT.
  // MCP Apps hosts (like Creature) handle theme changes themselves and send
  // new styles via hostContext. We don't want to override those with defaults.
  const shouldObserve = options.observeThemeChanges ?? (environment === "chatgpt");
  if (shouldObserve && environment === "chatgpt") {
    setupThemeObserver({ environment });
  }
};

// =============================================================================
// Theme Change Observer (ChatGPT Only)
// =============================================================================

/**
 * Set up a MutationObserver to re-apply styles if theme changes.
 * This is ONLY used for ChatGPT, where we need to react to theme changes
 * before the host sends new styles.
 *
 * MCP Apps hosts (like Creature) handle theme changes themselves and send
 * new styles via hostContext. Using this observer in MCP Apps would cause
 * our defaults to overwrite the host's actual styles.
 *
 * @param environment - The current environment (should be "chatgpt")
 */
const setupThemeObserver = ({ environment }: { environment: Environment }): void => {
  if (typeof document === "undefined" || typeof MutationObserver === "undefined") {
    return;
  }

  // Safety check: only run for ChatGPT
  if (environment !== "chatgpt") {
    return;
  }

  const root = document.documentElement;

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (
        mutation.type === "attributes" &&
        (mutation.attributeName === "data-theme" || mutation.attributeName === "class")
      ) {
        const newTheme = detectTheme();
        const defaults = getChatGptDefaultStyles({ theme: newTheme });
        applyStyles({ styles: defaults });
      }
    }
  });

  // Use setTimeout to not block initial render
  setTimeout(() => {
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-theme", "class"],
    });
  }, 100);
};

// =============================================================================
// Exports (Constants)
// =============================================================================

export {
  MCP_APPS_LIGHT_DEFAULTS,
  MCP_APPS_DARK_DEFAULTS,
  MCP_APPS_SHARED_DEFAULTS,
  CHATGPT_LIGHT_DEFAULTS,
  CHATGPT_DARK_DEFAULTS,
  CHATGPT_SHARED_DEFAULTS,
};
