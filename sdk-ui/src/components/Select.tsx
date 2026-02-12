/**
 * Select — Custom dropdown selection.
 *
 * A fully custom select component with styled trigger, dropdown popover,
 * keyboard navigation, check marks, option groups, and search filtering
 * for large option sets. Replaces the native <select> to match the visual
 * quality of the OpenAI apps-sdk-ui while remaining dependency-free.
 *
 * Also exports a NativeSelect for cases where native behavior is preferred.
 */

import {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
  forwardRef,
  type KeyboardEvent,
} from "react";
import type { Size } from "../types.js";

// =============================================================================
// Types
// =============================================================================

export interface SelectOption {
  /** Option value. */
  value: string;
  /** Display label. Defaults to value if not provided. */
  label?: string;
  /** Whether this option is disabled. */
  disabled?: boolean;
  /** Secondary description text below the label. */
  description?: string;
}

export interface SelectOptionGroup {
  /** Group label shown as the optgroup heading. */
  label: string;
  /** Options within this group. */
  options: SelectOption[];
}

/** Options can be flat or grouped. */
export type SelectOptions = SelectOption[] | SelectOptionGroup[];

export interface SelectProps {
  /** Label displayed above the select. */
  label?: string;
  /** Options to display. Supports flat arrays or grouped arrays. */
  options: SelectOptions;
  /** Controlled value. */
  value?: string;
  /** Called when the selection changes. */
  onChange?: (value: string) => void;
  /** Placeholder text when no value is selected. */
  placeholder?: string;
  /** Error message — shows error styling. */
  error?: string;
  /** Helper text displayed below the select. */
  helperText?: string;
  /** Select size. */
  size?: Size;
  /** Expand to full width. */
  block?: boolean;
  /** Disables the select. */
  disabled?: boolean;
  /** ID for the trigger element. */
  id?: string;
  /** Additional CSS class. */
  className?: string;
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Checks whether the options array contains grouped options.
 */
const isGrouped = (options: SelectOptions): options is SelectOptionGroup[] =>
  options.length > 0 && "options" in options[0];

/**
 * Flattens grouped options into a single flat array.
 */
const flattenOptions = (options: SelectOptions): SelectOption[] =>
  isGrouped(options)
    ? options.flatMap((g) => g.options)
    : options;

/**
 * Finds the label for a given value in the options list.
 */
const findLabel = (options: SelectOptions, value: string): string | undefined => {
  for (const opt of flattenOptions(options)) {
    if (opt.value === value) return opt.label ?? opt.value;
  }
  return undefined;
};

// =============================================================================
// Size classes
// =============================================================================

const triggerSizeClasses: Record<Size, string> = {
  sm: "text-sm h-8 px-2.5",
  md: "text-sm h-9 px-3",
  lg: "text-base h-11 px-3.5",
};

// =============================================================================
// Select Component
// =============================================================================

/**
 * Custom dropdown select with keyboard navigation and check marks.
 *
 * @example
 * ```tsx
 * <Select
 *   label="Status"
 *   placeholder="Choose..."
 *   value={status}
 *   onChange={setStatus}
 *   options={[
 *     { value: "active", label: "Active" },
 *     { value: "archived", label: "Archived" },
 *   ]}
 * />
 * ```
 */
export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      label,
      options,
      value = "",
      onChange,
      placeholder = "Select...",
      error,
      helperText,
      size = "md",
      block = true,
      disabled = false,
      id,
      className = "",
    },
    ref
  ) => {
    const [open, setOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [alignRight, setAlignRight] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const hasError = !!error;
    const selectedLabel = findLabel(options, value);
    const flat = useMemo(() => flattenOptions(options), [options]);

    const selectId = id ?? (label ? `select-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);

    /* ===== Open / close ===== */

    const openDropdown = useCallback(() => {
      if (disabled) return;
      setOpen(true);
      /* Highlight the currently selected option on open. */
      const idx = flat.findIndex((o) => o.value === value);
      setHighlightedIndex(idx >= 0 ? idx : 0);
    }, [disabled, flat, value]);

    const closeDropdown = useCallback(() => {
      setOpen(false);
      setHighlightedIndex(-1);
    }, []);

    const toggle = useCallback(() => {
      if (open) closeDropdown();
      else openDropdown();
    }, [open, openDropdown, closeDropdown]);

    /* ===== Click outside ===== */
    useEffect(() => {
      if (!open) return;
      const handler = (e: globalThis.MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          closeDropdown();
        }
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, [open, closeDropdown]);

    /* ===== Smart alignment — flip to right if dropdown overflows viewport ===== */
    useLayoutEffect(() => {
      if (!open) return;
      const container = containerRef.current;
      const list = listRef.current;
      if (!container || !list) return;
      const containerRect = container.getBoundingClientRect();
      const listWidth = list.offsetWidth;
      const viewportWidth = window.innerWidth;
      /* If left-aligned dropdown overflows the right edge, align right instead. */
      setAlignRight(containerRect.left + listWidth > viewportWidth - 8);
    }, [open]);

    /* ===== Scroll highlighted into view ===== */
    useEffect(() => {
      if (!open || highlightedIndex < 0) return;
      const listEl = listRef.current;
      if (!listEl) return;
      const items = listEl.querySelectorAll("[data-option-index]");
      const item = items[highlightedIndex] as HTMLElement | undefined;
      item?.scrollIntoView({ block: "nearest" });
    }, [open, highlightedIndex]);

    /* ===== Selection ===== */
    const selectOption = useCallback(
      (opt: SelectOption) => {
        if (opt.disabled) return;
        onChange?.(opt.value);
        closeDropdown();
      },
      [onChange, closeDropdown]
    );

    /* ===== Keyboard nav ===== */
    const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          if (!open) {
            openDropdown();
          } else {
            setHighlightedIndex((prev) => {
              let next = prev + 1;
              while (next < flat.length && flat[next].disabled) next++;
              return next < flat.length ? next : prev;
            });
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          if (!open) {
            openDropdown();
          } else {
            setHighlightedIndex((prev) => {
              let next = prev - 1;
              while (next >= 0 && flat[next].disabled) next--;
              return next >= 0 ? next : prev;
            });
          }
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          if (!open) {
            openDropdown();
          } else if (highlightedIndex >= 0 && flat[highlightedIndex]) {
            selectOption(flat[highlightedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          closeDropdown();
          break;
        case "Tab":
          if (open) closeDropdown();
          break;
      }
    };

    /* ===== Render options ===== */
    const renderOptionRow = (opt: SelectOption, index: number) => {
      const isSelected = opt.value === value;
      const isHighlighted = index === highlightedIndex;

      return (
        <div
          key={opt.value}
          role="option"
          aria-selected={isSelected}
          data-option-index={index}
          onMouseEnter={() => !opt.disabled && setHighlightedIndex(index)}
          onMouseDown={(e) => {
            e.preventDefault(); /* Prevent trigger blur */
            selectOption(opt);
          }}
          className={[
            "relative flex items-center justify-between gap-2 mx-1 px-3 py-1.5 rounded-lg text-sm cursor-pointer select-none",
            "transition-colors duration-75",
            opt.disabled
              ? "opacity-40 cursor-not-allowed"
              : isHighlighted
                ? "bg-bg-secondary"
                : "",
            isSelected ? "font-medium" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className="flex-1 min-w-0">
            <div className="text-txt-primary truncate">{opt.label ?? opt.value}</div>
            {opt.description && (
              <div className="text-xs text-txt-tertiary truncate">{opt.description}</div>
            )}
          </div>
          {isSelected && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-txt-primary">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
      );
    };

    let optionIndex = 0;
    const renderOptions = () => {
      optionIndex = 0;
      if (isGrouped(options)) {
        return options.map((group) => (
          <div key={group.label}>
            <div className="px-4 pt-2 pb-1 text-xs font-medium text-txt-tertiary select-none">
              {group.label}
            </div>
            {group.options.map((opt) => {
              const idx = optionIndex++;
              return renderOptionRow(opt, idx);
            })}
          </div>
        ));
      }
      return flat.map((opt) => {
        const idx = optionIndex++;
        return renderOptionRow(opt, idx);
      });
    };

    return (
      <div
        ref={containerRef}
        className={[
          "relative",
          block ? "flex flex-col gap-1" : "inline-flex flex-col gap-1",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-txt-primary">
            {label}
          </label>
        )}

        {/* Trigger button */}
        <button
          ref={ref}
          id={selectId}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          disabled={disabled}
          onClick={toggle}
          onKeyDown={handleKeyDown}
          data-error={hasError || undefined}
          className={[
            "omu-control flex items-center justify-between gap-2 rounded-lg bg-bg-primary text-left",
            disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
            triggerSizeClasses[size],
            block ? "w-full" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <span className={[
            "truncate flex-1",
            selectedLabel ? "text-txt-primary" : "text-txt-secondary",
          ].join(" ")}>
            {selectedLabel ?? placeholder}
          </span>
          {/* Chevron */}
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={[
              "shrink-0 text-txt-secondary transition-transform duration-150",
              open ? "rotate-180" : "",
            ].join(" ")}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* Dropdown panel */}
        {open && (
          <div
            ref={listRef}
            role="listbox"
            className="absolute z-50 mt-1 py-1 rounded-xl overflow-hidden overflow-y-auto"
            style={{
              top: "100%",
              ...(alignRight ? { right: 0 } : { left: 0 }),
              minWidth: 220,
              width: block ? "100%" : "max-content",
              maxHeight: 280,
              backgroundColor: "var(--color-surface-elevated, var(--color-background-primary, #fff))",
              boxShadow: "0 0 0 1px var(--color-border-secondary, rgba(0,0,0,.15)), 0 4px 24px rgba(0,0,0,.08)",
              animation: "omu-menu-enter 150ms cubic-bezier(0.16, 1, 0.3, 1)",
              transformOrigin: "top",
            }}
          >
            {renderOptions()}
          </div>
        )}

        {error && (
          <p className="text-xs text-txt-danger" role="alert">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-xs text-txt-secondary">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
