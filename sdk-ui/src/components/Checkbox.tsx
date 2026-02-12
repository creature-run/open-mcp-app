/**
 * Checkbox — Animated boolean toggle with label.
 *
 * Uses a hidden native <input type="checkbox"> for accessibility and form
 * submission, paired with a custom visual box that animates a checkmark
 * on toggle. The animation draws each arm of the ✓ with staggered delays,
 * matching the OpenAI apps-sdk-ui style.
 *
 * CSS classes (omu-checkbox, omu-checkmark, etc.) are defined in
 * styles/checkbox.css and bundled into the library's styles.css output.
 */

import { forwardRef, useState, useEffect, type InputHTMLAttributes } from "react";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  /** Label displayed next to the checkbox. */
  label?: string;
}

/**
 * Accessible checkbox with animated checkmark and optional label.
 *
 * Supports both controlled (`checked` + `onChange`) and uncontrolled
 * (`defaultChecked`) usage. The visual state tracks the native input
 * so animations stay in sync.
 *
 * @example
 * ```tsx
 * <Checkbox label="Accept terms" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
 * <Checkbox label="Remember me" />
 * ```
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className = "", id, disabled, checked, defaultChecked, onChange, ...rest }, ref) => {
    const inputId = id ?? (label ? `checkbox-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);

    /**
     * Track visual state for the animated box.
     * Supports both controlled (checked prop) and uncontrolled (defaultChecked) modes.
     */
    const [visualChecked, setVisualChecked] = useState(checked ?? defaultChecked ?? false);

    /**
     * Sync visual state with the controlled `checked` prop when it changes.
     */
    useEffect(() => {
      if (checked !== undefined) setVisualChecked(checked);
    }, [checked]);

    /**
     * Forward native change events and update visual state for uncontrolled mode.
     */
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (checked === undefined) {
        setVisualChecked(e.target.checked);
      }
      onChange?.(e);
    };

    return (
      <label
        htmlFor={inputId}
        className={[
          "inline-flex items-center gap-2 select-none",
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          defaultChecked={checked === undefined ? defaultChecked : undefined}
          onChange={handleChange}
          disabled={disabled}
          {...rest}
        />
        <div
          className="omu-checkbox peer-focus-visible:[outline:2px_solid_var(--color-ring-primary)]"
          data-checked={visualChecked || undefined}
          data-disabled={disabled || undefined}
          aria-hidden="true"
        >
          <div className="omu-checkmark">
            <span className="omu-arm-short" />
            <span className="omu-arm-long" />
          </div>
        </div>
        {label && (
          <span className="text-sm text-txt-primary">{label}</span>
        )}
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";
