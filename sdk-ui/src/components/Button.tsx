/**
 * Button — Primary action trigger.
 *
 * Styled exclusively with MCP Apps spec CSS variables via the SDK's
 * Tailwind theme mapping. Supports semantic variants that map directly
 * to the spec's color groups.
 */

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import type { Size } from "../types.js";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style mapping to spec color groups. */
  variant?: "primary" | "secondary" | "danger" | "ghost";
  /** Button size. */
  size?: Size;
  /** Show a loading spinner and disable interaction. */
  loading?: boolean;
  /**
   * Custom spinner element shown when `loading` is true.
   * Receives a ReactNode so callers can pass any SVG or component.
   * Falls back to a built-in circle spinner when omitted.
   */
  loadingIcon?: ReactNode;
  /** Button content. */
  children: ReactNode;
}

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-bg-inverse text-txt-inverse hover:opacity-90 focus-visible:outline-ring-primary",
  secondary: "bg-bg-secondary text-txt-primary hover:bg-bg-tertiary focus-visible:outline-ring-secondary",
  danger: "bg-bg-danger text-txt-danger hover:opacity-90 focus-visible:outline-ring-danger",
  ghost: "bg-bg-ghost text-txt-primary hover:bg-bg-secondary focus-visible:outline-ring-secondary",
};

const sizeClasses: Record<Size, string> = {
  sm: "text-sm h-8 px-2.5 rounded-md",
  md: "text-sm h-9 px-3 rounded-md",
  lg: "text-base h-11 px-3.5 rounded-md",
};

/**
 * Action button with semantic variants and loading state.
 *
 * @example
 * ```tsx
 * <Button variant="primary" onClick={handleSave}>Save</Button>
 * <Button variant="danger" size="sm" onClick={handleDelete}>Delete</Button>
 * <Button variant="ghost" loading>Processing...</Button>
 * ```
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      loadingIcon,
      disabled,
      children,
      className = "",
      ...rest
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const classes = [
      "inline-flex items-center justify-center gap-2 font-medium transition-colors",
      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
      variantClasses[variant],
      sizeClasses[size],
      isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        ref={ref}
        type="button"
        className={classes}
        disabled={isDisabled}
        aria-busy={loading}
        {...rest}
      >
        {loading && (loadingIcon ?? <DefaultSpinner />)}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

/**
 * Built-in circle spinner used as the default loading indicator.
 * Keeps the Button self-contained when no custom `loadingIcon` is provided.
 */
const DefaultSpinner = () => (
  <svg
    className="animate-spin h-4 w-4 shrink-0"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
);
