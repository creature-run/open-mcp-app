# DatePicker

Custom date picker with a calendar dropdown.

```tsx
import { DatePicker } from "open-mcp-app-ui";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | `string` | — | Label above the input. |
| value | `string` | `""` | Current date value (YYYY-MM-DD string). |
| onChange | `(value: string) => void` | — | Called when a date is selected. Receives YYYY-MM-DD string. |
| min | `string` | — | Minimum selectable date (YYYY-MM-DD). |
| max | `string` | — | Maximum selectable date (YYYY-MM-DD). |
| placeholder | `string` | `"Select date"` | Placeholder text. |
| helperText | `string` | — | Helper text below. |
| error | `string` | — | Error message. Replaces helperText and shows error styling. |
| disabled | `boolean` | `false` | Disables the picker. |

## Examples

```tsx
<DatePicker label="Start Date" value={date} onChange={setDate} />

<DatePicker
  label="Birthday"
  value={birthday}
  onChange={setBirthday}
  max="2010-12-31"
  placeholder="Select birthday..."
/>

<DatePicker label="Deadline" value={deadline} onChange={setDeadline} error="Date is required" />
```
