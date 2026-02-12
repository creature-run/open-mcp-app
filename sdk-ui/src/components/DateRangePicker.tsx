/**
 * DateRangePicker — Dual custom calendar dropdowns for selecting a date range.
 *
 * Renders two DatePicker triggers (start / end) with coordinated min/max
 * constraints so the end date can never precede the start date.
 * Uses the same custom calendar dropdown as DatePicker for consistent styling.
 */

import { forwardRef } from "react";
import { DatePicker } from "./DatePicker";

export interface DateRangePickerProps {
  /** Label displayed above the picker pair. */
  label?: string;
  /** Start date value (YYYY-MM-DD string). */
  startDate?: string;
  /** End date value (YYYY-MM-DD string). */
  endDate?: string;
  /** Called when either date changes. */
  onChange: (range: { startDate: string; endDate: string }) => void;
  /** Minimum selectable date for the start input. */
  min?: string;
  /** Maximum selectable date for the end input. */
  max?: string;
  /** Labels for the individual inputs. */
  startLabel?: string;
  endLabel?: string;
  /** Placeholder text for inputs. */
  startPlaceholder?: string;
  endPlaceholder?: string;
  /** Helper text below the picker. */
  helperText?: string;
  /** Error message — replaces helperText and shows error styling. */
  error?: string;
  /** Disables both inputs. */
  disabled?: boolean;
  /** Additional CSS class. */
  className?: string;
}

/**
 * Date range picker using two coordinated DatePicker calendars.
 *
 * @example
 * ```tsx
 * <DateRangePicker
 *   label="Trip dates"
 *   startDate={range.startDate}
 *   endDate={range.endDate}
 *   onChange={setRange}
 * />
 * ```
 */
export const DateRangePicker = forwardRef<HTMLDivElement, DateRangePickerProps>(
  (
    {
      label,
      startDate = "",
      endDate = "",
      onChange,
      min,
      max,
      startLabel = "Start",
      endLabel = "End",
      startPlaceholder = "Start date",
      endPlaceholder = "End date",
      helperText,
      error,
      disabled = false,
      className = "",
    },
    ref
  ) => {
    const hasError = !!error;

    /**
     * When the start date changes, push the end date forward if
     * it now precedes the new start date.
     */
    const handleStartChange = (newStart: string) => {
      const adjustedEnd = endDate && newStart > endDate ? newStart : endDate;
      onChange({ startDate: newStart, endDate: adjustedEnd });
    };

    const handleEndChange = (newEnd: string) => {
      onChange({ startDate, endDate: newEnd });
    };

    return (
      <div ref={ref} className={["flex flex-col gap-1", className].filter(Boolean).join(" ")}>
        {label && (
          <span className="text-sm font-medium text-txt-primary">{label}</span>
        )}
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <DatePicker
              label={startLabel}
              value={startDate}
              onChange={handleStartChange}
              min={min}
              max={endDate || max}
              placeholder={startPlaceholder}
              disabled={disabled}
              error={hasError ? " " : undefined}
            />
          </div>
          <span className="text-txt-tertiary pb-2.5">—</span>
          <div className="flex-1">
            <DatePicker
              label={endLabel}
              value={endDate}
              onChange={handleEndChange}
              min={startDate || min}
              max={max}
              placeholder={endPlaceholder}
              disabled={disabled}
              error={hasError ? " " : undefined}
            />
          </div>
        </div>
        {(error || helperText) && (
          <p className={["text-xs", hasError ? "text-txt-danger" : "text-txt-secondary"].join(" ")}>
            {error ?? helperText}
          </p>
        )}
      </div>
    );
  }
);

DateRangePicker.displayName = "DateRangePicker";
