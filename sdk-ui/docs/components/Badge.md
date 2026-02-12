# Badge

Compact status indicator.

```tsx
import { Badge } from "open-mcp-app-ui";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | `"info" \| "danger" \| "success" \| "warning" \| "secondary"` | `"secondary"` | Semantic color. |
| children | `ReactNode` | — | Badge content (text, number, or icon). |

Also extends `HTMLAttributes<HTMLSpanElement>`.

## Examples

```tsx
<Badge variant="success">Active</Badge>
<Badge variant="danger">3 errors</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="secondary">Draft</Badge>
<Badge variant="info">New</Badge>
```
