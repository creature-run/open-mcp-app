/**
 * Switch — Toggle switch.
 *
 * A visual on/off toggle built with a button for accessibility.
 * Uses spec CSS variables for all colors.
 */

import { forwardRef, type ButtonHTMLAttributes } from "react";

export interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  /** Label displayed next to the switch. */
  label?: string;
  /** Whether the switch is on. */
  checked?: boolean;
  /** Called when the switch is toggled. */
  onChange?: (checked: boolean) => void;
}

/**
 * Accessible toggle switch with optional label.
 *
 * @example
 * ```tsx
 * <Switch label="Dark mode" checked={isDark} onChange={setIsDark} />
 * <Switch label="Notifications" checked={notifs} onChange={setNotifs} />
 * ```
 */
export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  ({ label, checked = false, onChange, disabled, className = "", ...rest }, ref) => {
    const handleClick = () => {
      if (!disabled && onChange) {
        onChange(!checked);
      }
    };

    return (
      <label
        className={[
          "inline-flex items-center gap-2 select-none",
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <button
          ref={ref}
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={handleClick}
          className={[
            "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring-primary",
            checked ? "bg-bg-inverse" : "bg-bg-tertiary",
            disabled ? "cursor-not-allowed" : "cursor-pointer",
          ].join(" ")}
          {...rest}
        >
          <span
            aria-hidden="true"
            className={[
              "pointer-events-none inline-block h-3.5 w-3.5 rounded-full bg-bg-primary shadow-sm transition-transform",
              checked ? "translate-x-4.5" : "translate-x-0.5",
            ].join(" ")}
          />
        </button>
        {label && (
          <span className="text-sm text-txt-primary">{label}</span>
        )}
      </label>
    );
  }
);

Switch.displayName = "Switch";
