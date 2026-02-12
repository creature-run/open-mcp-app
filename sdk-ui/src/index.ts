/**
 * open-mcp-app-ui
 *
 * UI component library for MCP Apps. Provides reusable, themed components
 * that adapt to any MCP Apps host (Creature, ChatGPT, Claude Desktop).
 *
 * All components are styled exclusively via the 75 CSS variables defined
 * in the MCP Apps spec, using the SDK's Tailwind theme mapping.
 *
 * Setup:
 *   import "open-mcp-app-ui/styles.css";               // Pre-compiled CSS (required)
 *   import { Button, Input, Card } from "open-mcp-app-ui";
 *
 * Optional heavy components (separate imports to keep core lean):
 *   import { DataTable } from "open-mcp-app-ui/table";   // Phase 2
 *   import { Editor } from "open-mcp-app-ui/editor";     // Phase 2
 */

// ============================================================================
// Layout & Display Mode
// ============================================================================

export { AppLayout, type AppLayoutProps } from "./components/AppLayout.js";
export { Show, type ShowProps } from "./components/Show.js";
export { useDisplayMode, type UseDisplayModeReturn } from "./hooks/useDisplayMode.js";

// ============================================================================
// Form Controls
// ============================================================================

export { Button, type ButtonProps } from "./components/Button.js";
export { Input, type InputProps } from "./components/Input.js";
export { Textarea, type TextareaProps } from "./components/Textarea.js";
export { Select, type SelectProps, type SelectOption, type SelectOptionGroup, type SelectOptions } from "./components/Select.js";
export { Checkbox, type CheckboxProps } from "./components/Checkbox.js";
export { Switch, type SwitchProps } from "./components/Switch.js";
export { RadioGroup, type RadioGroupProps, type RadioGroupItemProps } from "./components/RadioGroup.js";
export { Slider, type SliderProps } from "./components/Slider.js";
export { TagInput, type TagInputProps, type Tag } from "./components/TagInput.js";
export { DatePicker, type DatePickerProps } from "./components/DatePicker.js";
export { DateRangePicker, type DateRangePickerProps } from "./components/DateRangePicker.js";
export { ToggleGroup, type ToggleGroupProps, type ToggleGroupOptionProps } from "./components/ToggleGroup.js";

// ============================================================================
// Feedback & Overlays
// ============================================================================

export { Alert, type AlertProps, type AlertVariant } from "./components/Alert.js";
export { Badge, type BadgeProps } from "./components/Badge.js";
export { Menu, type MenuProps, type MenuContentProps, type MenuItemProps, type MenuCheckboxItemProps, type MenuLabelProps } from "./components/Menu.js";

// ============================================================================
// Navigation
// ============================================================================

export { Tabs, type TabsProps, type TabProps } from "./components/Tabs.js";

// ============================================================================
// Data Display
// ============================================================================

export { Card, type CardProps } from "./components/Card.js";
export { Heading, type HeadingProps, type HeadingSize } from "./components/Heading.js";
export { Text, type TextProps } from "./components/Text.js";
export { Divider, type DividerProps } from "./components/Divider.js";
export { CodeBlock, type CodeBlockProps } from "./components/CodeBlock.js";

// ============================================================================
// Types
// ============================================================================

export type { DisplayMode, Size, SemanticVariant } from "./types.js";
