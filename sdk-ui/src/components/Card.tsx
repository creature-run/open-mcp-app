/**
 * Card — Content container.
 *
 * A bordered surface for grouping related content.
 * Uses real CSS border so Tailwind border classes work for overrides
 * (e.g. className="border-bdr-info" to change the color).
 *
 * Variants:
 * - "default" — primary border color
 * - "secondary" — lighter border for subtle grouping
 * - "ghost" — no border at all
 */

import { type ReactNode, type HTMLAttributes } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Visual style.
   * - "default" — primary border
   * - "secondary" — lighter border for less emphasis
   * - "ghost" — borderless
   */
  variant?: "default" | "secondary" | "ghost";
  /** Internal padding. */
  padding?: "none" | "sm" | "md" | "lg";
  /** Card content. */
  children: ReactNode;
}

const paddingClasses: Record<NonNullable<CardProps["padding"]>, string> = {
  none: "",
  sm: "p-2",
  md: "p-3",
  lg: "p-4",
};

/**
 * Border classes per variant.
 * Uses real CSS border so consumers can override with Tailwind
 * border-color classes (e.g. border-bdr-info, border-bdr-danger).
 */
const variantBorderClasses: Record<NonNullable<CardProps["variant"]>, string> = {
  default: "border border-bdr-primary",
  secondary: "border border-bdr-secondary",
  ghost: "",
};

/**
 * Content container with configurable border emphasis.
 *
 * @example
 * ```tsx
 * <Card>Default card with primary border</Card>
 * <Card variant="secondary">Subtle card with lighter border</Card>
 * <Card variant="ghost" padding="none">Borderless card</Card>
 * <Card className="border-bdr-info">Custom border via Tailwind</Card>
 * ```
 */
export const Card = ({
  variant = "default",
  padding = "md",
  children,
  className = "",
  ...rest
}: CardProps) => {
  const classes = [
    "rounded-lg",
    variant === "ghost" ? "bg-bg-ghost" : "bg-bg-primary",
    variantBorderClasses[variant],
    paddingClasses[padding],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
};
