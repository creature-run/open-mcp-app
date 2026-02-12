# RadioGroup

Radio option group with animated selection indicator.

```tsx
import { RadioGroup } from "open-mcp-app-ui";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| value | `string` | — | Controlled selected value. |
| onChange | `(value: string) => void` | — | Called when the selection changes. |
| aria-label | `string` | — | Accessible label for the group. |
| direction | `"row" \| "col"` | `"col"` | Layout direction. |
| disabled | `boolean` | `false` | Disables the entire group. |
| className | `string` | — | Additional CSS class. |

### RadioGroup.Item

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| value | `string` | — | Option value. |
| disabled | `boolean` | `false` | Disables this item. |
| children | `ReactNode` | — | Item label. |

## Examples

```tsx
<RadioGroup value={size} onChange={setSize} aria-label="Size">
  <RadioGroup.Item value="sm">Small</RadioGroup.Item>
  <RadioGroup.Item value="md">Medium</RadioGroup.Item>
  <RadioGroup.Item value="lg">Large</RadioGroup.Item>
</RadioGroup>

{/* Horizontal layout */}
<RadioGroup value={align} onChange={setAlign} aria-label="Alignment" direction="row">
  <RadioGroup.Item value="left">Left</RadioGroup.Item>
  <RadioGroup.Item value="center">Center</RadioGroup.Item>
  <RadioGroup.Item value="right">Right</RadioGroup.Item>
</RadioGroup>
```
