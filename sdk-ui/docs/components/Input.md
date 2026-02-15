# Input

Text input with label and error handling.

```tsx
import { Input } from "open-mcp-app-ui";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | `string` | — | Label above the input. |
| error | `string` | — | Error message. Shows error styling. |
| helperText | `string` | — | Helper text below (hidden when error is set). |
| size | `"sm" \| "md" \| "lg"` | `"md"` | Input size. |
| placeholder | `string` | — | Placeholder text. |
| disabled | `boolean` | `false` | Disables the input. |

Also extends `InputHTMLAttributes<HTMLInputElement>` (except `size`).

## Examples

```tsx
<Input label="Name" placeholder="Enter name..." value={name} onChange={(e) => setName(e.target.value)} />
<Input label="Email" type="email" error="Invalid email address" />
<Input label="Search" placeholder="Search..." helperText="Search by name or ID" />
<Input size="sm" placeholder="Compact input" />
```
