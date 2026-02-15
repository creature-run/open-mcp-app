# ToggleGroup

Segmented toggle group with animated sliding indicator.

```tsx
import { ToggleGroup } from "open-mcp-app-ui";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| value | `string` | — | Currently selected value. |
| onChange | `(value: string) => void` | — | Called when a new option is selected. |
| aria-label | `string` | — | Accessible label. |
| size | `"sm" \| "md" \| "lg"` | `"md"` | Size variant. |
| disabled | `boolean` | `false` | Disables the entire group. |
| block | `boolean` | `false` | Expand to full width with equal-width options. |
| pill | `boolean` | `false` | Fully rounded pill shape. |

### ToggleGroup.Option

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| value | `string` | — | Option value. |
| disabled | `boolean` | `false` | Disables this option. |
| children | `ReactNode` | — | Option label. |

## Examples

```tsx
<ToggleGroup value={view} onChange={setView} aria-label="View mode">
  <ToggleGroup.Option value="grid">Grid</ToggleGroup.Option>
  <ToggleGroup.Option value="list">List</ToggleGroup.Option>
</ToggleGroup>

{/* Pill shape, full width */}
<ToggleGroup value={tab} onChange={setTab} aria-label="Tab" pill block>
  <ToggleGroup.Option value="all">All</ToggleGroup.Option>
  <ToggleGroup.Option value="active">Active</ToggleGroup.Option>
  <ToggleGroup.Option value="done">Done</ToggleGroup.Option>
</ToggleGroup>
```
