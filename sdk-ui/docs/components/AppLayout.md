# AppLayout

Display-mode-aware root layout. Sets `data-display-mode` attribute and provides display mode context to all children. **Always wrap your app content in this.**

Internally uses two nested divs: an outer scroll container (no padding) and an inner wrapper with adaptive padding/gap. This means full-bleed children (edge-to-edge dividers, tables, images) work naturally without clipping.

```tsx
import { AppLayout } from "open-mcp-app-ui";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| displayMode | `"inline" \| "pip" \| "fullscreen"` | `"pip"` | Current display mode. Pass `hostContext?.displayMode`. |
| availableDisplayModes | `DisplayMode[]` | `[displayMode]` | Modes the host supports. Pass `hostContext?.availableDisplayModes`. |
| noPadding | `boolean` | `false` | Remove inner padding and gap. Children get full edge-to-edge control. |
| className | `string` | `""` | Additional CSS classes on the outer scroll container. |
| children | `ReactNode` | — | Content. |

Also extends `HTMLAttributes<HTMLDivElement>`.

## Adaptive Spacing

| Display Mode | Padding | Gap |
|---|---|---|
| `inline` | `p-2` | `gap-1.5` |
| `pip` | `p-3` | `gap-3` |
| `fullscreen` | `p-4` | `gap-4` |

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

## Full-Bleed Layout (noPadding)

Use `noPadding` when you need full control — sticky headers, edge-to-edge content, or custom spacing per section.

```tsx
<AppLayout displayMode={hostContext?.displayMode} noPadding>
  <header className="sticky top-0 z-10 px-3 py-2 border-b border-bdr-secondary bg-bg-primary">
    <Heading size="sm">Sticky Header</Heading>
  </header>
  <div className="p-3 flex flex-col gap-3">
    <MainContent />
  </div>
</AppLayout>
```
