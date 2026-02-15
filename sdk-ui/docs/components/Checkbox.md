# Checkbox

Accessible checkbox with animated checkmark and optional label.

```tsx
import { Checkbox } from "open-mcp-app-ui";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | `string` | — | Label next to the checkbox. |
| checked | `boolean` | — | Checked state (controlled). |
| onChange | `ChangeEventHandler` | — | Change handler. |
| disabled | `boolean` | `false` | Disables the checkbox. |

Also extends `InputHTMLAttributes<HTMLInputElement>` (except `type` and `size`).

## Examples

```tsx
<Checkbox label="Accept terms" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
<Checkbox label="Remember me" />
<Checkbox label="Disabled option" disabled />
```
