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
  /** Whether to set up a MutationObserver for dynamic theme changes. Default: true */
  observeThemeChanges?: boolean;
}

// =============================================================================
// MCP Apps Default Style Values
// =============================================================================

/**
 * MCP Apps / Creature default values - LIGHT mode.
 * Host will override these with actual values via hostContext.styles.variables.
 */
const MCP_APPS_LIGHT_DEFAULTS: Record<string, string> = {
  "--color-background-primary": "#ffffff",
  "--color-background-secondary": "#f8f9fa",
  "--color-background-tertiary": "#f1f3f5",
  "--color-background-inverse": "#1a1a1a",
  "--color-background-ghost": "rgba(0, 0, 0, 0.04)",
  "--color-background-info": "#e7f5ff",
  "--color-background-danger": "#fff5f5",
  "--color-background-success": "#ebfbee",
  "--color-background-warning": "#fff9db",
  "--color-background-disabled": "#e9ecef",
  "--color-text-primary": "#212529",
  "--color-text-secondary": "#495057",
  "--color-text-tertiary": "#868e96",
  "--color-text-inverse": "#ffffff",
  "--color-text-ghost": "rgba(0, 0, 0, 0.4)",
  "--color-text-info": "#1971c2",
  "--color-text-danger": "#c92a2a",
  "--color-text-success": "#2f9e44",
  "--color-text-warning": "#e67700",
  "--color-text-disabled": "#adb5bd",
  "--color-border-primary": "#dee2e6",
  "--color-border-secondary": "#e9ecef",
  "--color-border-tertiary": "#f1f3f5",
  "--color-border-inverse": "#343a40",
  "--color-border-ghost": "rgba(0, 0, 0, 0.08)",
  "--color-border-info": "#74c0fc",
  "--color-border-danger": "#ffa8a8",
  "--color-border-success": "#8ce99a",
  "--color-border-warning": "#ffe066",
  "--color-border-disabled": "#ced4da",
  "--color-ring-primary": "#228be6",
  "--color-ring-secondary": "#495057",
  "--color-ring-inverse": "#ffffff",
  "--color-ring-info": "#228be6",
  "--color-ring-danger": "#fa5252",
  "--color-ring-success": "#40c057",
  "--color-ring-warning": "#fab005",
};

/**
 * MCP Apps / Creature default values - DARK mode.
 */
const MCP_APPS_DARK_DEFAULTS: Record<string, string> = {
  "--color-background-primary": "#1a1a1a",
  "--color-background-secondary": "#252525",
  "--color-background-tertiary": "#2f2f2f",
  "--color-background-inverse": "#ffffff",
  "--color-background-ghost": "rgba(255, 255, 255, 0.04)",
  "--color-background-info": "#1a3a4a",
  "--color-background-danger": "#4a1a1a",
  "--color-background-success": "#1a3a1a",
  "--color-background-warning": "#4a3a1a",
  "--color-background-disabled": "#2a2a2a",
  "--color-text-primary": "#e9ecef",
  "--color-text-secondary": "#adb5bd",
  "--color-text-tertiary": "#868e96",
  "--color-text-inverse": "#1a1a1a",
  "--color-text-ghost": "rgba(255, 255, 255, 0.4)",
  "--color-text-info": "#74c0fc",
  "--color-text-danger": "#ffa8a8",
  "--color-text-success": "#8ce99a",
  "--color-text-warning": "#ffe066",
  "--color-text-disabled": "#495057",
  "--color-border-primary": "#343a40",
  "--color-border-secondary": "#2f2f2f",
  "--color-border-tertiary": "#252525",
  "--color-border-inverse": "#dee2e6",
  "--color-border-ghost": "rgba(255, 255, 255, 0.08)",
  "--color-border-info": "#1971c2",
  "--color-border-danger": "#c92a2a",
  "--color-border-success": "#2f9e44",
  "--color-border-warning": "#e67700",
  "--color-border-disabled": "#3a3a3a",
  "--color-ring-primary": "#4dabf7",
  "--color-ring-secondary": "#adb5bd",
  "--color-ring-inverse": "#1a1a1a",
  "--color-ring-info": "#4dabf7",
  "--color-ring-danger": "#ff8787",
  "--color-ring-success": "#69db7c",
  "--color-ring-warning": "#ffd43b",
};

/**
 * Shared MCP Apps typography and layout tokens (same for light/dark).
 */
const MCP_APPS_SHARED_DEFAULTS: Record<string, string> = {
  "--font-sans": '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  "--font-mono": 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
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
  "--border-radius-xs": "2px",
  "--border-radius-sm": "4px",
  "--border-radius-md": "6px",
  "--border-radius-lg": "8px",
  "--border-radius-xl": "12px",
  "--border-radius-full": "9999px",
  "--border-width-regular": "1px",
  "--shadow-hairline": "0 0 0 1px rgba(0, 0, 0, 0.05)",
  "--shadow-sm": "0 1px 2px rgba(0, 0, 0, 0.05)",
  "--shadow-md": "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  "--shadow-lg": "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
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
    return "light";
  }

  const root = document.documentElement;

  // Check data-theme attribute (ChatGPT uses this)
  const dataTheme = root.getAttribute("data-theme");
  if (dataTheme === "dark" || dataTheme === "light") {
    return dataTheme;
  }

  // Check for dark class (Tailwind convention)
  if (root.classList.contains("dark")) {
    return "dark";
  }

  // Check prefers-color-scheme media query
  if (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }

  return "light";
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

  const { observeThemeChanges = true } = options;
  const theme = detectTheme();

  // Select defaults based on environment AND theme
  const defaults = environment === "chatgpt"
    ? getChatGptDefaultStyles({ theme })
    : getMcpAppDefaultStyles({ theme });

  // Apply defaults immediately
  applyStyles({ styles: defaults });

  // Set data-env attribute for CSS selectors if needed
  document.documentElement.setAttribute("data-env", environment);

  // Set up theme change observer if requested
  if (observeThemeChanges) {
    setupThemeObserver({ environment });
  }
};

// =============================================================================
// Theme Change Observer
// =============================================================================

/**
 * Set up a MutationObserver to re-apply styles if theme changes after initial load.
 * This handles cases where the host changes theme after initStyles runs.
 *
 * @param environment - The current environment
 */
const setupThemeObserver = ({ environment }: { environment: Environment }): void => {
  if (typeof document === "undefined" || typeof MutationObserver === "undefined") {
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
        const currentEnv = (root.getAttribute("data-env") as Environment) || environment;

        const defaults = currentEnv === "chatgpt"
          ? getChatGptDefaultStyles({ theme: newTheme })
          : getMcpAppDefaultStyles({ theme: newTheme });

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
