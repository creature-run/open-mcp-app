/**
 * Card — Content container.
 *
 * A bordered surface for grouping related content.
 * Uses spec background and border variables.
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
 * Inset box-shadow strings used as borders.
 * Using inset box-shadow instead of CSS border avoids layout shift
 * and allows consistent 1px borders across variants.
 */
const variantShadow: Record<NonNullable<CardProps["variant"]>, string | undefined> = {
  default: "inset 0 0 0 1px var(--color-border-primary, rgba(0,0,0,0.08))",
  secondary: "inset 0 0 0 1px var(--color-border-secondary, rgba(0,0,0,0.04))",
  ghost: undefined,
};

/**
 * Content container with configurable border emphasis.
 *
 * @example
 * ```tsx
 * <Card>Default card with primary border</Card>
 * <Card variant="secondary">Subtle card with lighter border</Card>
 * <Card variant="ghost" padding="none">Borderless card</Card>
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
    paddingClasses[padding],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const shadow = variantShadow[variant];

  return (
    <div
      className={classes}
      style={shadow ? { boxShadow: shadow } : undefined}
      {...rest}
    >
      {children}
    </div>
  );
};
