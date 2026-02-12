/**
 * TagInput — Multi-tag input with keyboard navigation and validation.
 *
 * Allows users to enter multiple values as "tags" via typing and pressing
 * Enter (or a custom delimiter). Tags can be removed by clicking their
 * close button or by pressing Backspace. Supports duplicate detection with
 * a shake animation, custom validation, and max tag limits.
 */

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  forwardRef,
  type KeyboardEvent,
  type ClipboardEvent,
} from "react";

// =============================================================================
// Types
// =============================================================================

export interface Tag {
  /** Tag display value. */
  value: string;
  /** Whether this tag passed validation. */
  valid: boolean;
}

export interface TagInputProps {
  /** Label displayed above the input. */
  label?: string;
  /** Controlled tag list. */
  value?: Tag[];
  /** Default tags for uncontrolled mode. */
  defaultValue?: Tag[];
  /** Called when tags change. */
  onChange?: (tags: Tag[]) => void;
  /** Validation function — return false to mark a tag as invalid. */
  validator?: (value: string) => boolean;
  /** Characters that trigger tag creation (besides Enter). */
  delimiters?: string[];
  /** Maximum number of tags allowed. */
  maxTags?: number;
  /** Placeholder text when no tags are present. */
  placeholder?: string;
  /** Disables the input. */
  disabled?: boolean;
  /** Error message shown below the input. */
  error?: string;
  /** Helper text shown below the input. */
  helperText?: string;
  /** Size variant. */
  size?: "sm" | "md" | "lg";
  /** ID for the input element. */
  id?: string;
  /** Additional CSS class. */
  className?: string;
}

const SHAKE_DURATION = 500;

/**
 * Multi-tag input with validation and keyboard navigation.
 *
 * @example
 * ```tsx
 * <TagInput
 *   label="Tags"
 *   value={tags}
 *   onChange={setTags}
 *   placeholder="Add a tag..."
 *   maxTags={5}
 * />
 * ```
 */
export const TagInput = forwardRef<HTMLInputElement, TagInputProps>(
  (
    {
      label,
      value: controlledValue,
      defaultValue = [],
      onChange,
      validator,
      delimiters = [","],
      maxTags,
      placeholder = "Add a tag...",
      disabled = false,
      error,
      helperText,
      size = "md",
      id,
      className = "",
    },
    ref
  ) => {
    const isControlled = controlledValue !== undefined;
    const [internalTags, setInternalTags] = useState<Tag[]>(defaultValue);
    const tags = isControlled ? controlledValue! : internalTags;

    const [inputValue, setInputValue] = useState("");
    const [duplicateTag, setDuplicateTag] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const hasError = !!error;
    const atLimit = maxTags !== undefined && tags.length >= maxTags;

    /* Merge forwarded ref with internal ref. */
    useEffect(() => {
      if (!ref) return;
      if (typeof ref === "function") ref(inputRef.current);
      else (ref as React.MutableRefObject<HTMLInputElement | null>).current = inputRef.current;
    }, [ref]);

    /**
     * Adds a tag to the list. Validates for duplicates and runs the
     * optional validator. Updates internal state or calls onChange
     * depending on controlled vs uncontrolled mode.
     */
    const addTag = useCallback(
      (raw: string) => {
        const trimmed = raw.trim();
        if (!trimmed) return;
        if (atLimit) return;

        /* Duplicate check. */
        if (tags.some((t) => t.value === trimmed)) {
          setDuplicateTag(trimmed);
          setTimeout(() => setDuplicateTag(null), SHAKE_DURATION);
          return;
        }

        const valid = validator ? validator(trimmed) : true;
        const next = [...tags, { value: trimmed, valid }];
        if (!isControlled) setInternalTags(next);
        onChange?.(next);
      },
      [tags, atLimit, validator, isControlled, onChange]
    );

    /**
     * Removes a tag by value.
     */
    const removeTag = useCallback(
      (value: string) => {
        const next = tags.filter((t) => t.value !== value);
        if (!isControlled) setInternalTags(next);
        onChange?.(next);
      },
      [tags, isControlled, onChange]
    );

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || delimiters.includes(e.key)) {
        e.preventDefault();
        if (inputValue) {
          addTag(inputValue);
          setInputValue("");
        }
      } else if (e.key === "Tab" && inputValue) {
        e.preventDefault();
        addTag(inputValue);
        setInputValue("");
      } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
        removeTag(tags[tags.length - 1].value);
      }
    };

    const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
      const text = e.clipboardData.getData("text");
      let parts = [text];
      for (const d of delimiters) {
        const next: string[] = [];
        for (const seg of parts) next.push(...seg.split(d));
        parts = next;
      }
      parts = parts.filter(Boolean);
      if (parts.length > 1) {
        e.preventDefault();
        parts.forEach(addTag);
      }
    };

    const sizeClasses: Record<string, string> = {
      sm: "min-h-[32px] text-xs gap-1 p-1",
      md: "min-h-[38px] text-sm gap-1.5 p-1.5",
      lg: "min-h-[44px] text-sm gap-1.5 p-2",
    };

    const tagSizeClasses: Record<string, string> = {
      sm: "text-xs px-1.5 py-0 h-5",
      md: "text-xs px-2 py-0.5 h-6",
      lg: "text-sm px-2 py-0.5 h-7",
    };

    return (
      <div className={["flex flex-col gap-1", className].filter(Boolean).join(" ")}>
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-txt-primary">
            {label}
          </label>
        )}
        <div
          onClick={() => inputRef.current?.focus()}
          data-error={hasError || undefined}
          className={[
            "omu-control flex flex-wrap items-center rounded-lg cursor-text bg-bg-primary",
            sizeClasses[size] ?? sizeClasses.md,
            disabled ? "opacity-50 pointer-events-none" : "",
          ].join(" ")}
        >
          {tags.map((tag) => (
            <span
              key={tag.value}
              className={[
                "inline-flex items-center gap-1 rounded-md font-medium",
                tagSizeClasses[size] ?? tagSizeClasses.md,
                tag.valid
                  ? "bg-bg-secondary text-txt-primary"
                  : "bg-bg-danger-subtle text-txt-danger",
                duplicateTag === tag.value ? "omu-shake" : "",
              ].join(" ")}
            >
              <span className="truncate max-w-[150px]">{tag.value}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(tag.value);
                }}
                className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                aria-label={`Remove ${tag.value}`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </span>
          ))}
          {!atLimit && (
            <input
              ref={inputRef}
              id={id}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onBlur={() => {
                if (inputValue) {
                  addTag(inputValue);
                  setInputValue("");
                }
              }}
              placeholder={tags.length === 0 ? placeholder : ""}
              disabled={disabled}
              className="flex-1 min-w-[60px] bg-transparent border-none outline-none text-txt-primary placeholder:text-txt-tertiary"
            />
          )}
        </div>
        <div className="flex items-center justify-between">
          {(error || helperText) && (
            <p className={["text-xs", hasError ? "text-txt-danger" : "text-txt-secondary"].join(" ")}>
              {error ?? helperText}
            </p>
          )}
          {maxTags !== undefined && (
            <span className="text-xs tabular-nums text-txt-tertiary ml-auto">
              {tags.length}/{maxTags}
            </span>
          )}
        </div>
      </div>
    );
  }
);

TagInput.displayName = "TagInput";
