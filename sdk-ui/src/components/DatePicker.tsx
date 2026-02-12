/**
 * DatePicker — Custom calendar dropdown for date selection.
 *
 * Replaces native <input type="date"> with a fully styled calendar
 * popup that respects the MCP Apps spec CSS variables. The calendar
 * opens below the trigger input and supports month/year navigation,
 * min/max constraints, and keyboard interaction.
 */

import {
  forwardRef,
  useState,
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent,
} from "react";

export interface DatePickerProps {
  /** Label displayed above the input. */
  label?: string;
  /** Current date value (YYYY-MM-DD string). */
  value?: string;
  /** Called when the user selects a date. Receives YYYY-MM-DD string. */
  onChange?: (value: string) => void;
  /** Minimum selectable date (YYYY-MM-DD). */
  min?: string;
  /** Maximum selectable date (YYYY-MM-DD). */
  max?: string;
  /** Placeholder text shown when no date is selected. */
  placeholder?: string;
  /** Helper text below the input. */
  helperText?: string;
  /** Error message — replaces helperText and shows error styling. */
  error?: string;
  /** Disables the picker. */
  disabled?: boolean;
  /** Additional CSS class for the outer container. */
  className?: string;
  /** Input id for label association. */
  id?: string;
}

/** Day-of-week headers for the calendar grid. */
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/**
 * Returns all the day cells for a given month, including leading/trailing
 * days from adjacent months so the grid always has complete weeks.
 */
const getCalendarDays = ({ year, month }: { year: number; month: number }) => {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const days: { date: number; month: number; year: number; outside: boolean }[] = [];

  /* Leading days from previous month */
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const m = month === 0 ? 11 : month - 1;
    const y = month === 0 ? year - 1 : year;
    days.push({ date: d, month: m, year: y, outside: true });
  }

  /* Days in current month */
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({ date: d, month, year, outside: false });
  }

  /* Trailing days from next month to fill remaining cells */
  const remaining = 7 - (days.length % 7);
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      const m = month === 11 ? 0 : month + 1;
      const y = month === 11 ? year + 1 : year;
      days.push({ date: d, month: m, year: y, outside: true });
    }
  }

  return days;
};

/**
 * Formats a date as YYYY-MM-DD for value comparison and storage.
 */
const toDateString = ({ year, month, date }: { year: number; month: number; date: number }) =>
  `${year}-${String(month + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;

/**
 * Formats a date for display in the input field (e.g. "Feb 11, 2026").
 */
const formatDisplay = (dateStr: string) => {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

/** Month names for the header. */
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * Custom date picker with a calendar dropdown.
 *
 * @example
 * ```tsx
 * <DatePicker label="Start date" value={date} onChange={setDate} />
 * <DatePicker label="Birthday" min="1900-01-01" max="2010-12-31" />
 * ```
 */
export const DatePicker = forwardRef<HTMLDivElement, DatePickerProps>(
  (
    {
      label,
      value = "",
      onChange,
      min,
      max,
      placeholder = "Select date",
      helperText,
      error,
      disabled = false,
      className = "",
      id,
    },
    ref
  ) => {
    const inputId = id ?? (label ? `datepicker-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);
    const hasError = !!error;

    const containerRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);

    /* Calendar view state — which month/year is currently displayed */
    const initialDate = value ? new Date(value + "T00:00:00") : new Date();
    const [viewMonth, setViewMonth] = useState(initialDate.getMonth());
    const [viewYear, setViewYear] = useState(initialDate.getFullYear());

    /* Sync view to value when it changes externally */
    useEffect(() => {
      if (value) {
        const d = new Date(value + "T00:00:00");
        setViewMonth(d.getMonth());
        setViewYear(d.getFullYear());
      }
    }, [value]);

    /* Close on outside click */
    useEffect(() => {
      if (!open) return;
      const handle = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setOpen(false);
        }
      };
      document.addEventListener("mousedown", handle);
      return () => document.removeEventListener("mousedown", handle);
    }, [open]);

    /**
     * Navigates the calendar view by a number of months.
     * Positive delta goes forward, negative goes backward.
     */
    const navigateMonth = useCallback((delta: number) => {
      setViewMonth((prev) => {
        let newMonth = prev + delta;
        let yearDelta = 0;
        if (newMonth < 0) {
          newMonth = 11;
          yearDelta = -1;
        } else if (newMonth > 11) {
          newMonth = 0;
          yearDelta = 1;
        }
        if (yearDelta !== 0) setViewYear((y) => y + yearDelta);
        return newMonth;
      });
    }, []);

    /**
     * Checks if a given date falls outside the min/max constraints.
     */
    const isDisabled = useCallback(
      ({ year, month, date }: { year: number; month: number; date: number }) => {
        const ds = toDateString({ year, month, date });
        if (min && ds < min) return true;
        if (max && ds > max) return true;
        return false;
      },
      [min, max]
    );

    /**
     * Selects a date, fires onChange, and closes the dropdown.
     */
    const selectDate = useCallback(
      ({ year, month, date }: { year: number; month: number; date: number }) => {
        if (isDisabled({ year, month, date })) return;
        const ds = toDateString({ year, month, date });
        onChange?.(ds);
        setOpen(false);
      },
      [onChange, isDisabled]
    );

    /** Keyboard navigation for the trigger button. */
    const handleTriggerKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (!disabled) setOpen((o) => !o);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };

    const today = new Date();
    const todayStr = toDateString({ year: today.getFullYear(), month: today.getMonth(), date: today.getDate() });
    const days = getCalendarDays({ year: viewYear, month: viewMonth });

    return (
      <div
        ref={(node) => {
          (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        className={["relative flex flex-col gap-1", className].filter(Boolean).join(" ")}
      >
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-txt-primary">
            {label}
          </label>
        )}

        {/* Trigger — looks like a text input */}
        <button
          id={inputId}
          type="button"
          disabled={disabled}
          data-error={hasError || undefined}
          onClick={() => !disabled && setOpen((o) => !o)}
          onKeyDown={handleTriggerKeyDown}
          className={[
            "omu-control flex items-center justify-between gap-2 w-full px-3 py-2 rounded-lg text-sm bg-bg-primary text-left",
            disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
          ].join(" ")}
        >
          <span className={value ? "text-txt-primary" : "text-txt-tertiary"}>
            {value ? formatDisplay(value) : placeholder}
          </span>
          {/* Calendar icon */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="shrink-0 opacity-40"
          >
            <path
              d="M5 1v2M11 1v2M1.5 6h13M3 2.5h10a1.5 1.5 0 011.5 1.5v9a1.5 1.5 0 01-1.5 1.5H3A1.5 1.5 0 011.5 13V4A1.5 1.5 0 013 2.5z"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Calendar dropdown */}
        {open && (
          <div
            className="absolute z-50 mt-1 rounded-lg overflow-hidden"
            style={{
              top: "100%",
              left: 0,
              width: 280,
              backgroundColor: "var(--color-background-primary, #fff)",
              boxShadow:
                "0 0 0 1px var(--color-border-primary, rgba(0,0,0,0.08)), 0 4px 16px rgba(0,0,0,0.12)",
              animation: "omu-datepicker-enter 150ms cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {/* Month/Year navigation header */}
            <div className="flex items-center justify-between px-3 py-2.5">
              <button
                type="button"
                onClick={() => navigateMonth(-1)}
                className="flex items-center justify-center w-7 h-7 rounded-md text-txt-secondary hover:text-txt-primary hover:bg-bg-secondary transition-colors cursor-pointer"
                aria-label="Previous month"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M8.5 3L4.5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              <span className="text-sm font-medium text-txt-primary select-none">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </span>

              <button
                type="button"
                onClick={() => navigateMonth(1)}
                className="flex items-center justify-center w-7 h-7 rounded-md text-txt-secondary hover:text-txt-primary hover:bg-bg-secondary transition-colors cursor-pointer"
                aria-label="Next month"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M5.5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 px-2">
              {WEEKDAYS.map((d) => (
                <div
                  key={d}
                  className="flex items-center justify-center h-8 text-xs text-txt-tertiary select-none"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 px-2 pb-2">
              {days.map((day, i) => {
                const ds = toDateString({ year: day.year, month: day.month, date: day.date });
                const isSelected = ds === value;
                const isToday = ds === todayStr;
                const dayDisabled = isDisabled({ year: day.year, month: day.month, date: day.date });

                return (
                  <button
                    key={i}
                    type="button"
                    disabled={dayDisabled}
                    onClick={() => selectDate({ year: day.year, month: day.month, date: day.date })}
                    className={[
                      "flex items-center justify-center h-8 w-full rounded-md text-xs transition-colors",
                      dayDisabled
                        ? "text-txt-tertiary opacity-30 cursor-not-allowed"
                        : "cursor-pointer",
                      isSelected
                        ? "bg-bg-inverse text-txt-inverse font-medium"
                        : day.outside
                          ? "text-txt-tertiary"
                          : "text-txt-primary",
                      !isSelected && !dayDisabled && !day.outside
                        ? "hover:bg-bg-secondary"
                        : "",
                      !isSelected && !dayDisabled && day.outside
                        ? "hover:bg-bg-secondary"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    style={
                      isToday && !isSelected
                        ? { boxShadow: "inset 0 0 0 1px var(--color-border-secondary, #d4d4d4)" }
                        : undefined
                    }
                  >
                    {day.date}
                  </button>
                );
              })}
            </div>

            {/* Footer with Today shortcut */}
            <div
              className="flex items-center justify-between px-3 py-2"
              style={{ borderTop: "1px solid var(--color-border-primary, #e5e5e5)" }}
            >
              <button
                type="button"
                onClick={() => {
                  onChange?.("");
                  setOpen(false);
                }}
                className="text-xs text-txt-tertiary hover:text-txt-secondary transition-colors cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => {
                  selectDate({ year: today.getFullYear(), month: today.getMonth(), date: today.getDate() });
                }}
                className="text-xs text-txt-primary font-medium hover:text-txt-secondary transition-colors cursor-pointer"
              >
                Today
              </button>
            </div>
          </div>
        )}

        {(error || helperText) && (
          <p className={["text-xs", hasError ? "text-txt-danger" : "text-txt-secondary"].join(" ")}>
            {error ?? helperText}
          </p>
        )}
      </div>
    );
  }
);

DatePicker.displayName = "DatePicker";
