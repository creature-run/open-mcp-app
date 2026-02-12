# Text

Body text with semantic color variants.

```tsx
import { Text } from "open-mcp-app-ui";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | `"primary" \| "secondary" \| "tertiary"` | `"primary"` | Text color. |
| size | `"sm" \| "md" \| "lg"` | `"md"` | Text size. |
| as | `"p" \| "span" \| "div"` | `"p"` | HTML element to render. |
| children | `ReactNode` | — | Text content. |

Also extends `HTMLAttributes<HTMLParagraphElement>`.

## Examples

```tsx
<Text>Primary body text</Text>
<Text variant="secondary" size="sm">Description or helper text</Text>
<Text variant="tertiary" as="span">Timestamp or metadata</Text>
```
