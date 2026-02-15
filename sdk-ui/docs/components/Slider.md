# Slider

Range slider with optional label and value display.

```tsx
import { Slider } from "open-mcp-app-ui";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | `string` | — | Label above the slider. |
| value | `number` | — | Current value (controlled). |
| min | `number` | `0` | Minimum value. |
| max | `number` | `100` | Maximum value. |
| step | `number` | `1` | Step increment. |
| showValue | `boolean` | `false` | Show the current value next to the label. |
| formatValue | `(value: number) => string` | — | Format function for the displayed value. |
| helperText | `string` | — | Helper text below the slider. |
| disabled | `boolean` | `false` | Disables the slider. |
| onChange | `ChangeEventHandler` | — | Change handler. |

## Examples

```tsx
<Slider label="Volume" value={volume} onChange={(e) => setVolume(+e.target.value)} showValue />

<Slider
  label="Opacity"
  min={0}
  max={1}
  step={0.01}
  value={opacity}
  onChange={(e) => setOpacity(+e.target.value)}
  showValue
  formatValue={(v) => `${Math.round(v * 100)}%`}
/>

<Slider label="Quality" min={1} max={10} value={quality} onChange={(e) => setQuality(+e.target.value)} />
```
