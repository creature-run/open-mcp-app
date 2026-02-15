# useDisplayMode

Hook for programmatic display mode access. Must be inside `<AppLayout>`.

```tsx
import { useDisplayMode } from "open-mcp-app-ui";
```

## Returns

| Property | Type | Description |
|----------|------|-------------|
| displayMode | `DisplayMode` | Current display mode. |
| isInline | `boolean` | True when mode is `"inline"`. |
| isPip | `boolean` | True when mode is `"pip"`. |
| isFullscreen | `boolean` | True when mode is `"fullscreen"`. |
| availableDisplayModes | `DisplayMode[]` | Modes the host supports. |

## Example

```tsx
const { displayMode, isInline, isPip, isFullscreen } = useDisplayMode();

if (isInline) return <CompactView />;
return <FullView />;
```
