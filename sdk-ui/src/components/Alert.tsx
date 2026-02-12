/**
 * Alert — Status message banner.
 *
 * Displays info, success, warning, or danger messages with
 * appropriate spec-variable-driven colors and optional dismiss.
 *
 * Supports three visual variants (outline/soft/solid) and four
 * semantic colors (info/success/warning/danger), matching the
 * OpenAI apps-sdk-ui Alert API surface.
 */

import { useState, type ReactNode, type HTMLAttributes } from "react";
import type { SemanticVariant } from "../types.js";

/** Visual style of the alert. */
export type AlertVariant = "outline" | "soft" | "solid";

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  /** Semantic color. */
  color?: SemanticVariant;
  /** Visual variant style. */
  variant?: AlertVariant;
  /** Bold title displayed above the body text. */
  title?: string;
  /** Alert body content / description. */
  children: ReactNode;
  /** Actions rendered on the right (or below on small widths). */
  actions?: ReactNode;
  /** Force actions placement — by default it auto-detects. */
  actionsPlacement?: "end" | "bottom";
  /** Custom indicator/icon element. Set to false to hide. */
  indicator?: ReactNode | false;
  /** Show a dismiss button. */
  dismissible?: boolean;
  /** Called when the dismiss button is clicked. */
  onDismiss?: () => void;
}

/**
 * Color class map for the OUTLINE variant.
 * Outline uses a 1px border with the alert's semantic color.
 */
const outlineColorClasses: Record<SemanticVariant, string> = {
  info: "border-bdr-secondary text-txt-primary",
  danger: "border-bdr-danger text-txt-danger",
  success: "border-bdr-success text-txt-success",
  warning: "border-bdr-warning text-txt-warning",
};

/**
 * Color class map for the SOFT variant.
 * Soft uses a tinted background with a subtle border.
 */
const softColorClasses: Record<SemanticVariant, string> = {
  info: "bg-bg-secondary border-bdr-secondary text-txt-primary",
  danger: "bg-bg-danger border-bdr-danger text-txt-danger",
  success: "bg-bg-success border-bdr-success text-txt-success",
  warning: "bg-bg-warning border-bdr-warning text-txt-warning",
};

/**
 * Color class map for the SOLID variant.
 * Solid uses a fully opaque semantic background.
 */
const solidColorClasses: Record<SemanticVariant, string> = {
  info: "bg-bg-tertiary text-txt-primary border-transparent",
  danger: "bg-bg-danger text-txt-danger border-transparent",
  success: "bg-bg-success text-txt-success border-transparent",
  warning: "bg-bg-warning text-txt-warning border-transparent",
};

/**
 * Maps each variant to its color class lookup.
 */
const variantColorMap: Record<AlertVariant, Record<SemanticVariant, string>> = {
  outline: outlineColorClasses,
  soft: softColorClasses,
  solid: solidColorClasses,
};

/**
 * Default indicator icons per semantic color.
 * Info/default gets an "i" icon, success a check, warning/danger a "!".
 */
const DefaultIndicator = ({ color }: { color: SemanticVariant }) => {
  if (color === "success") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    );
  }
  if (color === "warning" || color === "danger") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    );
  }
  /* info default */
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
};

/**
 * Status message banner with semantic coloring.
 *
 * @example
 * ```tsx
 * <Alert color="success" title="Saved">Your changes have been saved.</Alert>
 * <Alert color="danger" variant="solid" dismissible>Something went wrong.</Alert>
 * <Alert color="info" variant="soft">Tip: You can drag items to reorder.</Alert>
 * <Alert color="warning" variant="outline" actions={<Button size="sm">Retry</Button>}>
 *   Connection lost.
 * </Alert>
 * ```
 */
export const Alert = ({
  color = "info",
  variant = "outline",
  title,
  children,
  actions,
  actionsPlacement,
  indicator,
  dismissible = false,
  onDismiss,
  className = "",
  ...rest
}: AlertProps) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  /* Resolve layout direction for actions. */
  const placement = actionsPlacement ?? "end";

  const classes = [
    "flex gap-2 rounded-lg border px-3 py-2.5 text-sm",
    placement === "bottom" ? "flex-col" : "items-start",
    variantColorMap[variant]?.[color] ?? outlineColorClasses[color],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div role="alert" className={classes} {...rest}>
      {indicator !== false && (
        <div className="shrink-0">
          {indicator ?? <DefaultIndicator color={color} />}
        </div>
      )}
      <div className={["flex flex-1 min-w-0", placement === "bottom" ? "flex-col gap-2" : "items-center justify-between gap-3"].join(" ")}>
        <div className="flex-1 min-w-0">
          {title && (
            <p className="font-semibold mb-0.5">{title}</p>
          )}
          <div>{children}</div>
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>
      {dismissible && (
        <button
          type="button"
          onClick={handleDismiss}
          className="shrink-0 p-0.5 opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Dismiss"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
};
