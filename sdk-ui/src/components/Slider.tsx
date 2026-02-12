/**
 * Slider — Range input with optional label, value display, and marks.
 *
 * Wraps a native <input type="range"> for maximum accessibility and
 * compatibility. Styled with CSS variables from the MCP Apps spec.
 * The track and thumb are styled via the omu-slider CSS class in styles/slider.css.
 */

import { forwardRef, type InputHTMLAttributes } from "react";

export interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  /** Label displayed above the slider. */
  label?: string;
  /** Current value (controlled). */
  value?: number;
  /** Minimum value. */
  min?: number;
  /** Maximum value. */
  max?: number;
  /** Step increment. */
  step?: number;
  /** Show the current value next to the slider. */
  showValue?: boolean;
  /** Format function for the displayed value. */
  formatValue?: (value: number) => string;
  /** Helper text below the slider. */
  helperText?: string;
  /** Additional CSS class. */
  className?: string;
}

/**
 * Range slider with optional label and value display.
 *
 * @example
 * ```tsx
 * <Slider label="Volume" value={vol} min={0} max={100} onChange={e => setVol(+e.target.value)} />
 * <Slider label="Opacity" value={0.5} min={0} max={1} step={0.1} showValue />
 * ```
 */
export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      label,
      value,
      min = 0,
      max = 100,
      step = 1,
      showValue = false,
      formatValue,
      helperText,
      className = "",
      id,
      disabled,
      ...rest
    },
    ref
  ) => {
    const inputId = id ?? (label ? `slider-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);
    const displayValue = value !== undefined
      ? (formatValue ? formatValue(value) : String(value))
      : undefined;

    return (
      <div className={["flex flex-col gap-1", className].filter(Boolean).join(" ")}>
        {(label || showValue) && (
          <div className="flex items-center justify-between">
            {label && (
              <label htmlFor={inputId} className="text-sm font-medium text-txt-primary">
                {label}
              </label>
            )}
            {showValue && displayValue !== undefined && (
              <span className="text-sm tabular-nums text-txt-tertiary">{displayValue}</span>
            )}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          type="range"
          value={value}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className={[
            "omu-slider w-full",
            disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
          ].join(" ")}
          {...rest}
        />
        {helperText && (
          <p className="text-xs text-txt-secondary">{helperText}</p>
        )}
      </div>
    );
  }
);

Slider.displayName = "Slider";
