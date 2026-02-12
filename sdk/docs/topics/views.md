# Views — URL-based View Routing with useViews

`useViews` automatically switches the rendered view based on tool results.

```tsx
import { useHost, useViews } from "open-mcp-app/react";
```

## Defining Views

Match the `views` config between server resource and UI `VIEWS` constant.

**Server:**

```typescript
app.resource({
  uri: "ui://my-app/main",
  views: {
    "/": ["items_list"],
    "/detail/:itemId": ["items_open", "items_update"],
  },
});
```

**UI:**

```tsx
const VIEWS = {
  "/": ["items_list"],
  "/detail/:itemId": ["items_open", "items_update"],
};

function MainView() {
  const { view, params, data } = useViews(VIEWS);

  if (view === "/") return <ListView items={data?.items ?? []} />;
  if (view === "/detail/:itemId") return <DetailView item={data?.item} />;
  return <div>Loading...</div>;
}
```

## useViews Return Value

| Property | Type | Description |
|----------|------|-------------|
| view | `string` | The matched view pattern (e.g. `"/detail/:itemId"`). |
| params | `Record<string, string>` | Extracted URL parameters (e.g. `{ itemId: "abc" }`). |
| data | `any` | The `data` or `structuredContent` from the most recent matching tool result. |

## Critical Behavior

**`useViews` only updates on tool results.** If the view is open but no tool is called, the UI won't receive data and can appear empty. If a view needs initial data, call its primary list tool on mount:

```tsx
const [fetchItems, fetchState] = callTool("items_list");
useEffect(() => { fetchItems(); }, []);
```

Or use `onToolResult` to refresh after relevant tool calls:

```tsx
const { onToolResult } = useHost();
useEffect(() => {
  const unsubscribe = onToolResult((result) => {
    if (result.toolName === "items_create") refreshList();
  });
  return unsubscribe;
}, []);
```
