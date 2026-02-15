# Widget State — Sharing UI State with the AI

Widget state is the primary way the AI knows what the user is seeing. Without it, the AI is blind to the UI.

```tsx
import { useHost } from "open-mcp-app/react";

const { exp_widgetState } = useHost();
const [widgetState, setWidgetState] = exp_widgetState<MyState>();
```

## Structure

```tsx
setWidgetState({
  modelContent: {
    // Visible to AI — keep minimal but informative
    view: "/",
    renderedItems: items.map(i => ({ id: i.id, name: i.name })),
    error: null,
  },
  privateContent: {
    // Hidden from AI — UI restoration only
    scrollPosition: 200,
    expandedSections: ["details"],
  },
});
```

| Field | Visibility | Purpose |
|-------|-----------|---------|
| modelContent | AI sees this | Current view, key identifiers, what's rendered, brief status. |
| privateContent | AI cannot see | Scroll position, expanded panels, draft content. |

## Best Practices

- **Always use widgetState.** Tool results alone do NOT confirm the UI rendered correctly.
- **Update on meaningful changes.** Whenever the UI state changes meaningfully, update `modelContent`.
- **Report actual render state.** If data loaded but rendering failed, reflect that: `{ error: "render failed" }`.

## Transient Events

For one-off notifications that don't need persistence:

```tsx
const { updateModelContext } = useHost();
updateModelContext([{ type: "text", text: "User clicked export button" }]);
```

## Preventing Render Loops

`setWidgetState` triggers a host message and UI update. Never call it unconditionally or with unstable dependencies.

```tsx
// BAD — creates infinite loop (new array reference every render)
useEffect(() => {
  setWidgetState({ modelContent: { items: items } });
}, [items]); // items is a new array each time

// GOOD — use stable primitives as dependencies
const itemCount = items.length;
const itemIds = items.map(i => i.id).join(",");
useEffect(() => {
  setWidgetState({ modelContent: { itemCount, itemIds } });
}, [itemCount, itemIds]);
```
