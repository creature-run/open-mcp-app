# UI Entry Point — HostProvider, Imports, and App Setup

The UI half of an MCP App. React components rendered in the host's sandboxed iframe.

## Required Imports

```tsx
// app.tsx
import { HostProvider, useHost } from "open-mcp-app/react";
import { AppLayout } from "open-mcp-app-ui";
import "open-mcp-app/styles/tailwind.css";
import "open-mcp-app-ui/styles.css";
import "./styles.css";
```

| Import | Purpose |
|--------|---------|
| `HostProvider` | React context provider. Wraps the entire app. |
| `useHost` | Hook to access host client, call tools, get context. |
| `AppLayout` | Display-mode-aware root layout from the UI library. |
| `tailwind.css` | SDK's Tailwind theme mapping (spec CSS variables → utility classes). |
| `styles.css` (ui lib) | Pre-compiled UI library styles. |
| `./styles.css` | Your app's custom CSS. |

## App Structure

```tsx
function AppContent() {
  const { hostContext } = useHost();
  return (
    <AppLayout
      displayMode={hostContext?.displayMode}
      availableDisplayModes={hostContext?.availableDisplayModes}
    >
      <MainView />
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

- `HostProvider` `name` must match `createApp({ name })` on the server.
- Always pass `displayMode` to `AppLayout` from `hostContext`.
- `AppLayout` provides `DisplayModeContext` for `<Show>` and `useDisplayMode()`.

## CSS Setup (styles.css)

```css
/* styles.css */
@import "open-mcp-app/styles/tailwind.css";
```

This single import gives you all themed Tailwind utilities. Add your custom styles below.

## Full-Height Layouts

For scroll containers and full-height UIs, ensure root height is set:

```css
html, body, #root {
  height: 100%;
  margin: 0;
  padding: 0;
}
```

Use `min-h-0` on flex parents and `overflow-y-auto` on the scrolling child.
