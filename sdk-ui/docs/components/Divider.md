# Divider

Horizontal separator line.

```tsx
import { Divider } from "open-mcp-app-ui";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| spacing | `"none" \| "sm" \| "md" \| "lg"` | `"md"` | Vertical spacing above and below. |

Also extends `HTMLAttributes<HTMLHRElement>`.

## Examples

```tsx
<Heading size="md">Section A</Heading>
<Divider />
<Heading size="md">Section B</Heading>

<Divider spacing="lg" />
<Divider spacing="none" />
```
