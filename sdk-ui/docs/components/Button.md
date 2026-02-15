# Button

Action trigger with semantic variants and loading state.

```tsx
import { Button } from "open-mcp-app-ui";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | `"primary" \| "secondary" \| "danger" \| "ghost"` | `"primary"` | Visual style. |
| size | `"sm" \| "md" \| "lg"` | `"md"` | Button size. |
| loading | `boolean` | `false` | Shows spinner, disables interaction. |
| loadingIcon | `ReactNode` | — | Custom spinner element. Falls back to built-in circle spinner. |
| disabled | `boolean` | `false` | Disables the button. |
| children | `ReactNode` | — | Button label. |

Also extends `ButtonHTMLAttributes<HTMLButtonElement>`. Defaults to `type="button"`.

## Examples

```tsx
<Button variant="primary" onClick={handleSave}>Save</Button>
<Button variant="secondary" onClick={handleCancel}>Cancel</Button>
<Button variant="danger" size="sm" onClick={handleDelete}>Delete</Button>
<Button variant="ghost" onClick={handleMore}>More options</Button>
<Button variant="primary" loading>Saving...</Button>
<Button variant="primary" loading loadingIcon={<MySpinner />}>Saving...</Button>
```
