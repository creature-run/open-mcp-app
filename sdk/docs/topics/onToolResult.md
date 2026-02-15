# onToolResult — Subscribing to Agent Tool Calls

`onToolResult` lets the UI react to tool calls made by the AI (not by the UI).

```tsx
import { useHost } from "open-mcp-app/react";
```

## Usage

```tsx
const { onToolResult } = useHost();

useEffect(() => {
  const unsubscribe = onToolResult((result) => {
    if (result.toolName === "items_create") {
      refreshList();
    }
  });
  return unsubscribe;
}, []);
```

## When to Use

- **Refresh lists** after the AI creates/deletes items.
- **Navigate** to a new view after the AI opens something.
- **Update counters or badges** based on tool activity.

## Result Shape

The callback receives a `ToolResult` object:

| Property | Type | Description |
|----------|------|-------------|
| toolName | `string` | Name of the tool that was called. |
| data | `any` | Structured data from the tool result. |
| structuredContent | `any` | Alternative structured content. |
| content | `ContentBlock[]` | Raw content blocks. |
| isError | `boolean` | Whether the tool returned an error. |

## Important Notes

- `onToolResult` only fires for tool calls made by the **AI agent**, not by the UI's own `callTool`.
- Always return the `unsubscribe` function from `useEffect` to prevent memory leaks.
- Don't call `callTool` inside `onToolResult` without guarding against loops.
