# Textarea

Multi-line text input with label and error handling.

```tsx
import { Textarea } from "open-mcp-app-ui";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | `string` | — | Label above the textarea. |
| error | `string` | — | Error message. Shows error styling. |
| helperText | `string` | — | Helper text below. |
| rows | `number` | `3` | Number of visible rows. |
| resize | `"none" \| "vertical" \| "horizontal" \| "both"` | `"vertical"` | Resize behavior. |

Also extends `TextareaHTMLAttributes<HTMLTextAreaElement>`.

## Examples

```tsx
<Textarea label="Description" rows={4} placeholder="Enter description..." />
<Textarea label="Notes" error="Required field" resize="none" />
<Textarea label="Bio" helperText="Max 500 characters" rows={5} />
```
