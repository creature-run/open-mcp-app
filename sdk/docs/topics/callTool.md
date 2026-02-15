# callTool — Calling Tools from the UI

`callTool` lets the UI invoke server tools. Returns a reactive state tuple.

```tsx
import { useHost } from "open-mcp-app/react";

const { callTool } = useHost();
const [openItem, openState] = callTool("items_open");
```

## Two Ways to Get Results

### Option A — Reactive State (preferred for rendering)

`state.status` and `state.data` update reactively and trigger re-renders.

```tsx
const [fetchItems, fetchState] = callTool("items_list");
useEffect(() => { fetchItems(); }, []);

// Render from state — re-renders automatically when data arrives
const items = fetchState.data?.items ?? [];
```

| Property | Type | Description |
|----------|------|-------------|
| status | `"idle" \| "loading" \| "success" \| "error"` | Current call status. |
| data | `T \| undefined` | Parsed result data on success. |

### Option B — Await the Promise (for imperative flows)

`callFn(args)` returns `Promise<ToolResult<T>>`. Note: the shape differs from state.

```tsx
const result = await openItem({ itemId: id });
if (!result.isError) {
  const item = result.structuredContent?.item;  // NOT result.data
}
```

| Property | Type | Description |
|----------|------|-------------|
| structuredContent | `any` | The structured data from the tool result. |
| content | `ContentBlock[]` | Raw content blocks. |
| isError | `boolean` | Whether the tool returned an error. |

## Common Mistakes

```tsx
// BAD — promise returns structuredContent, not data
const result = await callFn({ id }); result.data.items;

// BAD — promise has isError, not status
const result = await callFn({ id }); result.status === "success";

// GOOD — Reactive
fetchState.data?.items ?? []

// GOOD — Imperative
result.structuredContent?.items ?? []
```

## Avoiding Infinite Re-render Loops (CRITICAL)

Calling a tool updates `state`, which triggers a re-render. If the call is inside a `useEffect` that re-runs on state change, it creates an infinite loop.

```tsx
// BAD — infinite loop! fetchState changes on every call
const [fetchItems, fetchState] = callTool("items_list");
useEffect(() => { fetchItems(); }, [fetchState]);

// BAD — runs on every render
useEffect(() => { fetchItems(); });

// BAD — calling in render body
fetchItems(); // runs every render

// GOOD — runs once on mount
useEffect(() => { fetchItems(); }, []);

// GOOD — runs when a specific value changes
useEffect(() => { if (itemId) openItem({ itemId }); }, [itemId]);

// GOOD — runs on user interaction only
const handleClick = () => openItem({ itemId });
```
