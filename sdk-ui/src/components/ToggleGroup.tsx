/**
 * ToggleGroup — Segmented control for mutually exclusive option selection.
 *
 * A horizontal group of buttons where only one can be active at a time.
 * Features an animated sliding "thumb" indicator behind the active option.
 * The thumb positioning and animation are handled via CSS (omu-toggle-group-*
 * classes in styles/toggle-group.css).
 *
 * Named "ToggleGroup" rather than "SegmentedControl" for clarity.
 */

import {
  forwardRef,
  useRef,
  useLayoutEffect,
  useCallback,
  type ReactNode,
} from "react";

// =============================================================================
// ToggleGroup
// =============================================================================

export interface ToggleGroupProps {
  /** Currently selected value. */
  value: string;
  /** Called when a new option is selected. */
  onChange: (value: string) => void;
  /** Accessible label for the group. */
  "aria-label": string;
  /** Size variant. */
  size?: "sm" | "md" | "lg";
  /** Disable the entire group. */
  disabled?: boolean;
  /** Expand to full width with equal-width options. */
  block?: boolean;
  /** Fully rounded pill shape. */
  pill?: boolean;
  /** Additional CSS class. */
  className?: string;
  children: ReactNode;
}

/**
 * Segmented toggle group with animated sliding indicator.
 *
 * @example
 * ```tsx
 * <ToggleGroup value={view} onChange={setView} aria-label="View mode">
 *   <ToggleGroup.Option value="grid">Grid</ToggleGroup.Option>
 *   <ToggleGroup.Option value="list">List</ToggleGroup.Option>
 * </ToggleGroup>
 * ```
 */
export const ToggleGroup = Object.assign(
  forwardRef<HTMLDivElement, ToggleGroupProps>(
    (
      {
        value,
        onChange,
        size = "md",
        disabled = false,
        block = false,
        pill = false,
        className = "",
        children,
        ...rest
      },
      ref
    ) => {
      const rootRef = useRef<HTMLDivElement>(null);
      const thumbRef = useRef<HTMLDivElement>(null);
      const hasAnimated = useRef(false);

      /**
       * Position and size the thumb to match the currently active option.
       * Reads the active option's offset/dimensions from the DOM and applies
       * inline transform + width to the thumb element.
       */
      const syncThumb = useCallback(() => {
        const root = rootRef.current;
        const thumb = thumbRef.current;
        if (!root || !thumb) return;

        const active = root.querySelector<HTMLElement>("[data-state='on']");
        if (!active) {
          thumb.style.opacity = "0";
          return;
        }

        const width = active.offsetWidth;
        const offset = active.offsetLeft;

        thumb.style.width = `${width}px`;
        thumb.style.transform = `translateX(${offset}px)`;
        thumb.style.opacity = "1";

        /* Enable transitions only after the first paint so the thumb
           doesn't animate from the origin on mount. */
        if (!hasAnimated.current) {
          requestAnimationFrame(() => {
            if (thumb) {
              thumb.style.transition =
                "width 250ms cubic-bezier(.4,0,.2,1), transform 250ms cubic-bezier(.4,0,.2,1), opacity 150ms ease";
            }
            hasAnimated.current = true;
          });
        }
      }, []);

      useLayoutEffect(() => {
        syncThumb();
      }, [syncThumb, value, size, block, pill]);

      /* Handle external resizes with ResizeObserver. */
      useLayoutEffect(() => {
        const root = rootRef.current;
        if (!root) return;
        const ro = new ResizeObserver(() => {
          const thumb = thumbRef.current;
          if (!thumb) return;
          const prev = thumb.style.transition;
          thumb.style.transition = "none";
          syncThumb();
          /* Restore after a frame so the jump isn't visible. */
          requestAnimationFrame(() => {
            if (thumb) thumb.style.transition = prev;
          });
        });
        ro.observe(root);
        return () => ro.disconnect();
      }, [syncThumb]);

      const sizeClasses: Record<string, string> = {
        sm: "h-7 text-xs",
        md: "h-8 text-sm",
        lg: "h-10 text-sm",
      };

      return (
        <div
          ref={(el) => {
            (rootRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
            if (typeof ref === "function") ref(el);
            else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
          }}
          role="radiogroup"
          className={[
            "omu-toggle-group relative inline-flex items-center gap-0.5 rounded-lg bg-bg-secondary p-0.5",
            sizeClasses[size] ?? sizeClasses.md,
            block ? "flex w-full" : "inline-flex",
            pill ? "!rounded-full" : "",
            disabled ? "opacity-50 pointer-events-none" : "",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...rest}
        >
          {/* Animated thumb */}
          <div
            ref={thumbRef}
            className={[
              "absolute top-0.5 bottom-0.5 left-0 rounded-md bg-bg-primary shadow-sm pointer-events-none",
              pill ? "!rounded-full" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={{ opacity: 0 }}
            aria-hidden="true"
          />

          {/* Render options, injecting active state */}
          {Array.isArray(children)
            ? children.map((child: React.ReactElement<ToggleGroupOptionProps>) => {
                if (!child || !child.props) return child;
                const isOn = child.props.value === value;
                return (
                  <button
                    key={child.props.value}
                    type="button"
                    role="radio"
                    aria-checked={isOn}
                    data-state={isOn ? "on" : "off"}
                    disabled={disabled || child.props.disabled}
                    onClick={() => {
                      if (child.props.value !== value) {
                        onChange(child.props.value);
                      }
                    }}
                    className={[
                      "relative z-[1] px-3 flex items-center justify-center select-none whitespace-nowrap transition-colors duration-150",
                      block ? "flex-1" : "",
                      pill ? "!rounded-full" : "rounded-md",
                      isOn
                        ? "text-txt-primary font-medium"
                        : "text-txt-secondary hover:text-txt-primary",
                      disabled || child.props.disabled ? "cursor-not-allowed" : "cursor-pointer",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {child.props.children}
                  </button>
                );
              })
            : children}
        </div>
      );
    }
  ),
  { Option: ToggleGroupOption }
);

ToggleGroup.displayName = "ToggleGroup";

// =============================================================================
// ToggleGroup.Option
// =============================================================================

export interface ToggleGroupOptionProps {
  /** Option value. */
  value: string;
  /** Disable this individual option. */
  disabled?: boolean;
  children: ReactNode;
}

/**
 * A single option inside a ToggleGroup. This component exists purely
 * for API ergonomics — the actual rendering is handled by the parent
 * ToggleGroup which reads the Option's props.
 *
 * @example
 * ```tsx
 * <ToggleGroup.Option value="grid">Grid</ToggleGroup.Option>
 * ```
 */
function ToggleGroupOption(_props: ToggleGroupOptionProps): React.ReactElement | null {
  /* Rendered by parent — this component is a prop carrier. */
  return null;
}
