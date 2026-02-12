# Show

Conditionally renders children based on the current display mode. Must be inside `<AppLayout>`.

```tsx
import { Show } from "open-mcp-app-ui";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| on | `DisplayMode \| DisplayMode[]` | — | Mode(s) to render in. |
| children | `ReactNode` | — | Content shown when mode matches. |
| fallback | `ReactNode` | `null` | Content shown when mode does NOT match. |

## Examples

```tsx
{/* Only in inline mode */}
<Show on="inline">
  <Text variant="secondary">Compact summary</Text>
</Show>

{/* In pip and fullscreen */}
<Show on={["pip", "fullscreen"]}>
  <DetailedView />
</Show>

{/* With fallback */}
<Show on="fullscreen" fallback={<Text>Expand for more</Text>}>
  <FullDashboard />
</Show>
```
