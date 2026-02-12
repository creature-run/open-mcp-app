# Switch

Accessible toggle switch with optional label.

```tsx
import { Switch } from "open-mcp-app-ui";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | `string` | — | Label next to the switch. |
| checked | `boolean` | `false` | Whether the switch is on. |
| onChange | `(checked: boolean) => void` | — | Called with the new checked value. |
| disabled | `boolean` | `false` | Disables the switch. |

## Examples

```tsx
<Switch label="Dark mode" checked={isDark} onChange={setIsDark} />
<Switch label="Notifications" checked={notifs} onChange={setNotifs} />
<Switch label="Read only" disabled />
```
