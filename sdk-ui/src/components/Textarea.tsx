/**
 * Textarea — Multi-line text input.
 *
 * Same styling conventions as Input but for multi-line content.
 * Uses inset box-shadow for the border effect (via .omu-control class).
 * Supports resize control and row configuration.
 */

import { forwardRef, type TextareaHTMLAttributes } from "react";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Label displayed above the textarea. */
  label?: string;
  /** Error message. When set, the textarea shows an error style. */
  error?: string;
  /** Helper text displayed below the textarea. */
  helperText?: string;
  /** CSS resize behavior. */
  resize?: "none" | "vertical" | "horizontal" | "both";
}

/**
 * Multi-line text input with label and error handling.
 *
 * @example
 * ```tsx
 * <Textarea label="Description" rows={4} placeholder="Enter description..." />
 * <Textarea label="Notes" error="Required field" resize="vertical" />
 * ```
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      resize = "vertical",
      rows = 3,
      className = "",
      id,
      disabled,
      ...rest
    },
    ref
  ) => {
    const inputId = id ?? (label ? `textarea-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);
    const hasError = !!error;

    const resizeClass =
      resize === "none" ? "resize-none" :
      resize === "vertical" ? "resize-y" :
      resize === "horizontal" ? "resize-x" :
      "resize";

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
        <textarea
          ref={ref}
          id={inputId}
          className={[
            "omu-control block w-full rounded-lg bg-bg-primary text-txt-primary placeholder:text-txt-tertiary",
            "text-sm px-3 py-2",
            resizeClass,
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          rows={rows}
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

Textarea.displayName = "Textarea";
