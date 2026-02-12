# Alert

Status message banner with semantic coloring.

```tsx
import { Alert } from "open-mcp-app-ui";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| color | `"info" \| "danger" \| "success" \| "warning"` | `"info"` | Semantic color. |
| variant | `"outline" \| "soft" \| "solid"` | `"outline"` | Visual variant style. |
| title | `string` | — | Bold title above body text. |
| children | `ReactNode` | — | Alert body content. |
| actions | `ReactNode` | — | Actions rendered on the right (or below on small widths). |
| indicator | `ReactNode \| false` | — | Custom indicator/icon. Set to `false` to hide. |
| dismissible | `boolean` | `false` | Show dismiss button. |
| onDismiss | `() => void` | — | Called on dismiss. |

## Examples

```tsx
<Alert color="success" title="Saved">Your changes have been saved.</Alert>
<Alert color="danger">Something went wrong. Please try again.</Alert>
<Alert color="info" dismissible>Tip: You can drag items to reorder.</Alert>
<Alert color="warning" title="Warning" variant="soft">This action cannot be undone.</Alert>

{/* With actions */}
<Alert color="danger" title="Error" actions={<Button size="sm" variant="danger">Retry</Button>}>
  Failed to save changes.
</Alert>
```
