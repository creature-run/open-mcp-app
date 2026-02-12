# Card

Content container with border and shadow.

```tsx
import { Card } from "open-mcp-app-ui";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | `"default" \| "ghost"` | `"default"` | `"default"` has border+shadow, `"ghost"` is borderless. |
| padding | `"none" \| "sm" \| "md" \| "lg"` | `"md"` | Internal padding. |
| children | `ReactNode` | — | Card content. |

Also extends `HTMLAttributes<HTMLDivElement>`.

## Examples

```tsx
<Card>
  <Heading size="sm">Settings</Heading>
  <Input label="Name" />
  <Button variant="primary">Save</Button>
</Card>

<Card variant="ghost" padding="none">
  <Text variant="secondary">Borderless content</Text>
</Card>

<Card padding="lg">
  <Heading size="md">Welcome</Heading>
  <Text>Get started by creating your first item.</Text>
</Card>
```
