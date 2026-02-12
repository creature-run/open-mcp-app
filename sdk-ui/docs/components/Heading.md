# Heading

Semantic heading with spec-driven typography.

```tsx
import { Heading } from "open-mcp-app-ui";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| level | `1 \| 2 \| 3 \| 4 \| 5 \| 6` | `2` | HTML heading level (h1–h6). |
| size | `"xs" \| "sm" \| "md" \| "lg" \| "xl" \| "2xl" \| "3xl"` | `"md"` | Visual size (independent of level). |
| children | `ReactNode` | — | Heading text. |

Also extends `HTMLAttributes<HTMLHeadingElement>`.

## Examples

```tsx
<Heading level={1} size="2xl">Page Title</Heading>
<Heading level={2} size="lg">Section</Heading>
<Heading size="sm">Subsection</Heading>
<Heading size="xs">Small label heading</Heading>
```
