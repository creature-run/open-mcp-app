# Card

Content container with border.

```tsx
import { Card } from "open-mcp-app-ui";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | `"default" \| "secondary" \| "ghost"` | `"default"` | `"default"` = primary border, `"secondary"` = subtler border, `"ghost"` = no border. |
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

<Card variant="secondary">
  <Text>Subtler border for less visual weight</Text>
</Card>

<Card variant="ghost" padding="none">
  <Text variant="secondary">Borderless content</Text>
</Card>

<Card padding="lg">
  <Heading size="md">Welcome</Heading>
  <Text>Get started by creating your first item.</Text>
</Card>
```
