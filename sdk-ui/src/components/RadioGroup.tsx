/**
 * RadioGroup — Mutually exclusive option selection.
 *
 * A group of radio buttons with accessible labeling, direction control,
 * animated selection indicator, and disabled states. Uses hidden native
 * radio inputs for form submission and screen reader support.
 *
 * CSS animation classes (omu-radio-*) are in styles/radio.css.
 */

import { forwardRef, createContext, useContext, useId, type ReactNode } from "react";

// =============================================================================
// Context
// =============================================================================

interface RadioGroupContextValue {
  name: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

/**
 * Internal hook to access the parent RadioGroup context.
 */
const useRadioGroupContext = () => {
  const ctx = useContext(RadioGroupContext);
  if (!ctx) throw new Error("RadioGroup.Item must be used inside <RadioGroup>");
  return ctx;
};

// =============================================================================
// RadioGroup
// =============================================================================

export interface RadioGroupProps {
  /** Controlled selected value. */
  value: string;
  /** Called when the selection changes. */
  onChange: (value: string) => void;
  /** Accessible label for the group. */
  "aria-label": string;
  /** Layout direction of radio items. */
  direction?: "row" | "col";
  /** Disables the entire group. */
  disabled?: boolean;
  /** Additional CSS class. */
  className?: string;
  children: ReactNode;
}

/**
 * Radio option group with animated selection indicator.
 *
 * @example
 * ```tsx
 * <RadioGroup value={size} onChange={setSize} aria-label="Size">
 *   <RadioGroup.Item value="sm">Small</RadioGroup.Item>
 *   <RadioGroup.Item value="md">Medium</RadioGroup.Item>
 *   <RadioGroup.Item value="lg">Large</RadioGroup.Item>
 * </RadioGroup>
 * ```
 */
export const RadioGroup = Object.assign(
  forwardRef<HTMLDivElement, RadioGroupProps>(
    (
      {
        value,
        onChange,
        direction = "col",
        disabled = false,
        className = "",
        children,
        ...rest
      },
      ref
    ) => {
      const generatedName = useId();

      return (
        <RadioGroupContext.Provider value={{ name: generatedName, value, disabled, onChange }}>
          <div
            ref={ref}
            role="radiogroup"
            className={[
              "flex",
              direction === "col" ? "flex-col gap-2" : "flex-row flex-wrap gap-3",
              className,
            ]
              .filter(Boolean)
              .join(" ")}
            {...rest}
          >
            {children}
          </div>
        </RadioGroupContext.Provider>
      );
    }
  ),
  { Item: RadioGroupItem }
);

RadioGroup.displayName = "RadioGroup";

// =============================================================================
// RadioGroup.Item
// =============================================================================

export interface RadioGroupItemProps {
  /** Option value. */
  value: string;
  /** Disables this individual item. */
  disabled?: boolean;
  /** Additional CSS class. */
  className?: string;
  children: ReactNode;
}

/**
 * A single radio option within a RadioGroup.
 * Uses a hidden native radio input for accessibility.
 */
function RadioGroupItem({
  value,
  disabled: itemDisabled = false,
  className = "",
  children,
}: RadioGroupItemProps) {
  const { name, value: groupValue, disabled: groupDisabled, onChange } = useRadioGroupContext();
  const disabled = groupDisabled || itemDisabled;
  const isSelected = groupValue === value;
  const id = useId();

  return (
    <label
      htmlFor={id}
      className={[
        "inline-flex items-center gap-2 select-none text-sm",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <input
        id={id}
        type="radio"
        name={name}
        value={value}
        checked={isSelected}
        disabled={disabled}
        onChange={() => onChange(value)}
        className="sr-only peer"
      />
      <div
        className="omu-radio peer-focus-visible:[outline:2px_solid_var(--color-ring-primary)]"
        data-checked={isSelected || undefined}
        data-disabled={disabled || undefined}
        aria-hidden="true"
      >
        {isSelected && <div className="omu-radio-dot" />}
      </div>
      <span className="text-txt-primary">{children}</span>
    </label>
  );
}
