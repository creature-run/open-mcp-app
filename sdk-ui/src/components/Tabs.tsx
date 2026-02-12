/**
 * Tabs — Underline-style tab bar for switching between views.
 *
 * Renders a horizontal row of text buttons with an active underline
 * indicator. Designed for top-level navigation within a panel or page.
 *
 * Uses a compound component pattern: Tabs wraps Tabs.Tab items.
 * The active tab is controlled via value/onChange.
 */

import { forwardRef, createContext, useContext, type ReactNode, type HTMLAttributes } from "react";

// =============================================================================
// Types
// =============================================================================

export interface TabsProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Currently active tab value. */
  value: string;
  /** Called when a tab is clicked. */
  onChange: (value: string) => void;
  /** Tab items (should be Tabs.Tab elements). */
  children: ReactNode;
}

export interface TabProps {
  /** Unique value identifying this tab. Matched against Tabs.value. */
  value: string;
  /** Tab label. */
  children: ReactNode;
  /** Disables the tab. */
  disabled?: boolean;
  /** Additional CSS class. */
  className?: string;
}

// =============================================================================
// Context
// =============================================================================

const TabsContext = createContext<{ value: string; onChange: (v: string) => void }>({
  value: "",
  onChange: () => {},
});

// =============================================================================
// Tabs (root)
// =============================================================================

/**
 * Underline-style tab bar.
 *
 * @example
 * ```tsx
 * <Tabs value={tab} onChange={setTab}>
 *   <Tabs.Tab value="logs">Logs</Tabs.Tab>
 *   <Tabs.Tab value="settings">Settings</Tabs.Tab>
 * </Tabs>
 * ```
 */
const TabsRoot = forwardRef<HTMLDivElement, TabsProps>(
  ({ value, onChange, children, className = "", ...rest }, ref) => (
    <TabsContext.Provider value={{ value, onChange }}>
      <div
        ref={ref}
        role="tablist"
        className={["flex shrink-0", className].filter(Boolean).join(" ")}
        style={{ borderBottom: "1px solid var(--color-border-secondary, #d4d4d4)" }}
        {...rest}
      >
        {children}
      </div>
    </TabsContext.Provider>
  )
);

TabsRoot.displayName = "Tabs";

// =============================================================================
// Tab (individual item)
// =============================================================================

/**
 * Single tab button rendered inside a Tabs container.
 * Active state is determined by matching its value against the parent's value.
 */
const Tab = ({ value, children, disabled = false, className = "" }: TabProps) => {
  const { value: activeValue, onChange } = useContext(TabsContext);
  const isActive = activeValue === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      disabled={disabled}
      onClick={() => !disabled && onChange(value)}
      className={[
        "px-3 py-2 text-xs font-normal transition-colors select-none",
        "border-b-2 -mb-px",
        isActive
          ? "text-txt-primary"
          : "border-transparent text-txt-tertiary hover:text-txt-primary",
        disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={isActive ? { borderBottomColor: "var(--color-text-primary, #171717)" } : undefined}
    >
      {children}
    </button>
  );
};

// =============================================================================
// Compound export
// =============================================================================

export const Tabs = Object.assign(TabsRoot, { Tab });
