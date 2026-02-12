/**
 * Input — Text input field.
 *
 * Wraps a native <input> with a label, error state, and helper text.
 * Uses inset box-shadow for the border effect (via .omu-control class)
 * following the OpenAI pattern — no CSS border, smooth focus transitions.
 */

import { forwardRef, type InputHTMLAttributes } from "react";
import type { Size } from "../types.js";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  /** Label displayed above the input. */
  label?: string;
  /** Error message. When set, the input shows an error style. */
  error?: string;
  /** Helper text displayed below the input. */
  helperText?: string;
  /** Input size. */
  size?: Size;
}

const sizeClasses: Record<Size, string> = {
  sm: "text-sm h-8 px-2.5",
  md: "text-sm h-9 px-3",
  lg: "text-base h-11 px-3.5",
};

/**
 * Text input with label and error handling.
 *
 * @example
 * ```tsx
 * <Input label="Name" placeholder="Enter name..." />
 * <Input label="Email" error="Invalid email address" />
 * ```
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      size = "md",
      className = "",
      id,
      disabled,
      ...rest
    },
    ref
  ) => {
    const inputId = id ?? (label ? `input-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);
    const hasError = !!error;

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-txt-primary"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={[
            "omu-control block w-full rounded-lg bg-bg-primary text-txt-primary placeholder:text-txt-tertiary",
            sizeClasses[size],
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          disabled={disabled}
          data-error={hasError || undefined}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${inputId}-error` : undefined}
          {...rest}
        />
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-txt-danger" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="text-xs text-txt-secondary">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
