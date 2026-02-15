# Select

Custom dropdown select with keyboard navigation and check marks.

```tsx
import { Select } from "open-mcp-app-ui";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | `string` | — | Label above the select. |
| options | `SelectOption[] \| SelectOptionGroup[]` | — | Options to display. Supports flat arrays or grouped arrays. |
| value | `string` | `""` | Controlled value. |
| onChange | `(value: string) => void` | — | Called when the selection changes. Receives the value string directly. |
| placeholder | `string` | `"Select..."` | Placeholder text when no value is selected. |
| error | `string` | — | Error message. Shows error styling. |
| helperText | `string` | — | Helper text below. |
| size | `"sm" \| "md" \| "lg"` | `"md"` | Select size. |
| block | `boolean` | `true` | Expand to full width. |
| disabled | `boolean` | `false` | Disables the select. |

## Types

```tsx
type SelectOption = { value: string; label?: string; disabled?: boolean; description?: string };
type SelectOptionGroup = { label: string; options: SelectOption[] };
type SelectOptions = SelectOption[] | SelectOptionGroup[];
```

## Examples

```tsx
{/* Flat options */}
<Select
  label="Status"
  placeholder="Choose status..."
  options={[
    { value: "active", label: "Active" },
    { value: "archived", label: "Archived" },
  ]}
  value={status}
  onChange={setStatus}
/>

{/* Grouped options */}
<Select
  label="Category"
  options={[
    { label: "Fruit", options: [{ value: "apple" }, { value: "banana" }] },
    { label: "Vegetable", options: [{ value: "carrot" }, { value: "potato" }] },
  ]}
  value={category}
  onChange={setCategory}
/>

{/* With descriptions */}
<Select
  label="Plan"
  options={[
    { value: "free", label: "Free", description: "Basic features" },
    { value: "pro", label: "Pro", description: "All features + priority support" },
  ]}
  value={plan}
  onChange={setPlan}
/>
```
