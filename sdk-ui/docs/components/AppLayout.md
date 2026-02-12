# AppLayout

Display-mode-aware root layout. Sets `data-display-mode` attribute and provides display mode context to all children. **Always wrap your app content in this.**

```tsx
import { AppLayout } from "open-mcp-app-ui";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| displayMode | `"inline" \| "pip" \| "fullscreen"` | `"pip"` | Current display mode. Pass `hostContext?.displayMode`. |
| availableDisplayModes | `DisplayMode[]` | `[displayMode]` | Modes the host supports. Pass `hostContext?.availableDisplayModes`. |
| className | `string` | `""` | Additional CSS classes. |
| children | `ReactNode` | — | Content. |

Also extends `HTMLAttributes<HTMLDivElement>`.

## Example

```tsx
import { HostProvider, useHost } from "open-mcp-app/react";
import { AppLayout, Show, Heading, Text } from "open-mcp-app-ui";

function AppContent() {
  const { hostContext } = useHost();
  return (
    <AppLayout
      displayMode={hostContext?.displayMode}
      availableDisplayModes={hostContext?.availableDisplayModes}
    >
      <Heading size="md">My App</Heading>
      <Show on="inline">
        <Text variant="secondary">3 items · Tap to expand</Text>
      </Show>
      <Show on={["pip", "fullscreen"]}>
        <FullItemsList />
      </Show>
    </AppLayout>
  );
}

export default function App() {
  return (
    <HostProvider name="my-app" version="1.0.0">
      <AppContent />
    </HostProvider>
  );
}
```
