/**
 * Menu — Dropdown menu triggered by a button.
 *
 * A polished dropdown menu with hover highlight animations, keyboard
 * navigation, and support for items, checkbox items, separators, and labels.
 * Uses portal-free absolute positioning with click-away and Escape handling.
 *
 * Styled with MCP Apps spec CSS variables. The menu panel uses an elevated
 * surface background with a subtle shadow, matching the OpenAI apps-sdk-ui
 * visual language.
 */

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  createContext,
  useContext,
  type ReactNode,
  type MouseEvent,
  type KeyboardEvent,
} from "react";

// =============================================================================
// Context
// =============================================================================

interface MenuContextValue {
  open: boolean;
  close: () => void;
}

const MenuContext = createContext<MenuContextValue>({ open: false, close: () => {} });

// =============================================================================
// Menu (root)
// =============================================================================

export interface MenuProps {
  children: ReactNode;
  /** Additional CSS class for the container. */
  className?: string;
}

/**
 * Dropdown menu container. Compose with Menu.Trigger, Menu.Content,
 * Menu.Item, and Menu.Separator.
 *
 * @example
 * ```tsx
 * <Menu>
 *   <Menu.Trigger><Button>Open</Button></Menu.Trigger>
 *   <Menu.Content>
 *     <Menu.Item onSelect={() => console.log("Edit")}>Edit</Menu.Item>
 *     <Menu.Separator />
 *     <Menu.Item onSelect={() => console.log("Delete")} danger>Delete</Menu.Item>
 *   </Menu.Content>
 * </Menu>
 * ```
 */
export const Menu = Object.assign(
  ({ children, className = "" }: MenuProps) => {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const close = useCallback(() => setOpen(false), []);
    const toggle = useCallback(() => setOpen((prev) => !prev), []);

    /* Close on click outside. */
    useEffect(() => {
      if (!open) return;
      const handler = (e: globalThis.MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setOpen(false);
        }
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    /* Close on Escape key. */
    useEffect(() => {
      if (!open) return;
      const handler = (e: globalThis.KeyboardEvent) => {
        if (e.key === "Escape") setOpen(false);
      };
      document.addEventListener("keydown", handler);
      return () => document.removeEventListener("keydown", handler);
    }, [open]);

    return (
      <MenuContext.Provider value={{ open, close }}>
        <div ref={containerRef} className={["relative inline-block", className].filter(Boolean).join(" ")}>
          {/* Inject toggle handler into Trigger children */}
          {renderChildren(children, toggle)}
        </div>
      </MenuContext.Provider>
    );
  },
  {
    Trigger: MenuTrigger,
    Content: MenuContent,
    Item: MenuItem,
    Separator: MenuSeparator,
    CheckboxItem: MenuCheckboxItem,
    Label: MenuLabel,
  }
);

/**
 * Walks children and injects the toggle handler into MenuTrigger instances.
 */
function renderChildren(children: ReactNode, toggle: () => void): ReactNode {
  if (!children) return null;
  const arr = Array.isArray(children) ? children : [children];
  return arr.map((child: any, i: number) => {
    if (child?.type === MenuTrigger) {
      return <MenuTrigger key={i} {...child.props} _toggle={toggle} />;
    }
    return child;
  });
}

// =============================================================================
// Menu.Trigger
// =============================================================================

interface MenuTriggerProps {
  children: ReactNode;
  /** @internal — injected by Menu. */
  _toggle?: () => void;
}

/**
 * Wraps the trigger element that opens the menu on click.
 */
function MenuTrigger({ children, _toggle }: MenuTriggerProps) {
  return (
    <div onClick={_toggle} className="cursor-pointer inline-block">
      {children}
    </div>
  );
}

// =============================================================================
// Menu.Content
// =============================================================================

export interface MenuContentProps {
  children: ReactNode;
  /** Preferred alignment relative to the trigger. */
  align?: "start" | "center" | "end";
  /** Width of the menu. */
  width?: number | string;
  /** Minimum width. */
  minWidth?: number | string;
  /** Additional CSS class. */
  className?: string;
}

/**
 * The dropdown content panel. Only rendered when the menu is open.
 * Uses a smooth scale+fade entry animation and an elevated surface style.
 */
function MenuContent({
  children,
  align = "start",
  width,
  minWidth = 220,
  className = "",
}: MenuContentProps) {
  const { open } = useContext(MenuContext);
  if (!open) return null;

  const alignClass =
    align === "end" ? "right-0" : align === "center" ? "left-1/2 -translate-x-1/2" : "left-0";

  return (
    <div
      className={[
        "absolute z-50 mt-1.5 py-1 rounded-xl overflow-hidden",
        "omu-menu-panel",
        alignClass,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        width,
        minWidth,
        backgroundColor: "var(--color-surface-elevated, var(--color-background-primary, #fff))",
        boxShadow: "0 0 0 1px var(--color-border-secondary, rgba(0,0,0,.15)), 0 4px 24px rgba(0,0,0,.08)",
        animation: "omu-menu-enter 150ms cubic-bezier(0.16, 1, 0.3, 1)",
        transformOrigin: "top",
      }}
      role="menu"
    >
      {children}
    </div>
  );
}

// =============================================================================
// Menu.Item
// =============================================================================

export interface MenuItemProps {
  children: ReactNode;
  /** Called when the item is selected. */
  onSelect?: () => void;
  /** Disables the item. */
  disabled?: boolean;
  /** Danger styling (red text). */
  danger?: boolean;
  /** Additional CSS class. */
  className?: string;
}

/**
 * A single actionable menu item with hover highlight.
 */
function MenuItem({
  children,
  onSelect,
  disabled = false,
  danger = false,
  className = "",
}: MenuItemProps) {
  const { close } = useContext(MenuContext);

  const handleClick = (e: MouseEvent) => {
    if (disabled) return;
    onSelect?.();
    close();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!disabled) {
        onSelect?.();
        close();
      }
    }
  };

  return (
    <div
      role="menuitem"
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={[
        "relative mx-1 px-3 py-1.5 rounded-lg text-sm cursor-pointer select-none",
        "transition-colors duration-100",
        danger ? "text-txt-danger" : "text-txt-primary",
        disabled
          ? "opacity-40 cursor-not-allowed"
          : "hover:bg-bg-secondary active:bg-bg-tertiary",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}

// =============================================================================
// Menu.CheckboxItem
// =============================================================================

export interface MenuCheckboxItemProps {
  children: ReactNode;
  /** Whether the item is checked. */
  checked?: boolean;
  /** Called when the checked state changes. */
  onCheckedChange?: (checked: boolean) => void;
  /** Disables the item. */
  disabled?: boolean;
  /** Additional CSS class. */
  className?: string;
}

/**
 * A checkbox-style menu item that toggles a boolean state.
 */
function MenuCheckboxItem({
  children,
  checked = false,
  onCheckedChange,
  disabled = false,
  className = "",
}: MenuCheckboxItemProps) {
  const handleClick = () => {
    if (disabled) return;
    onCheckedChange?.(!checked);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!disabled) onCheckedChange?.(!checked);
    }
  };

  return (
    <div
      role="menuitemcheckbox"
      aria-checked={checked}
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={[
        "flex items-center gap-2.5 mx-1 px-3 py-1.5 rounded-lg text-sm cursor-pointer select-none",
        "transition-colors duration-100",
        disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-bg-secondary active:bg-bg-tertiary",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span
        className={[
          "flex items-center justify-center w-4 h-4 rounded flex-shrink-0 transition-colors duration-150",
          checked
            ? "bg-bg-inverse text-txt-inverse"
            : "border border-bdr-primary",
        ].join(" ")}
      >
        {checked && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </span>
      <span className="text-txt-primary">{children}</span>
    </div>
  );
}

// =============================================================================
// Menu.Separator
// =============================================================================

/**
 * Horizontal line between menu item groups.
 */
function MenuSeparator() {
  return <div className="my-1 mx-2 h-px bg-bdr-tertiary" role="separator" />;
}

// =============================================================================
// Menu.Label
// =============================================================================

export interface MenuLabelProps {
  children: ReactNode;
  className?: string;
}

/**
 * Non-interactive label/heading within a menu section.
 */
function MenuLabel({ children, className = "" }: MenuLabelProps) {
  return (
    <div
      className={[
        "px-4 py-1.5 text-xs font-medium text-txt-tertiary select-none",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
