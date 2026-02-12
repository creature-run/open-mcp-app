# Tools — Defining and Configuring Tools

Tools are the bridge between server and UI. When called (by AI or UI), the server processes and returns a result.

```typescript
import { createApp } from "open-mcp-app/server";
import { z } from "zod";
```

## Defining a Tool

```typescript
app.tool(
  "items_open",
  {
    description: "Open an item for viewing",
    input: z.object({ itemId: z.string() }),
    ui: "ui://my-app/main",
    visibility: ["model", "app"],
    displayModes: ["pip"],
  },
  async (input, context) => {
    const item = await getItem(input.itemId);
    context.setState({ itemId: item.id, view: "detail" });
    return {
      data: { item, itemId: item.id },
      text: `Opened: ${item.title}`,
      title: item.title,
    };
  }
);
```

## Tool Config Options

| Option | Type | Description |
|--------|------|-------------|
| description | `string` | What the tool does. Shown to the AI. |
| input | `ZodSchema` | Zod schema for input validation. |
| ui | `string` | `ui://` URI to open/update when the tool is called. |
| visibility | `ToolVisibility[]` | Who can call this tool (see below). |
| displayModes | `DisplayMode[]` | Where the UI opens when this tool is called. |

## Visibility

| Value | Meaning |
|-------|---------|
| `["model"]` | AI only. Hidden from UI. Use for background operations. |
| `["model", "app"]` | AI and UI can both call. **Most tools should use this.** |
| `["app"]` | UI only. Hidden from AI. Use for UI-internal actions. |

## Tool Result Shape

```typescript
return {
  data: { ... },               // Sent to the UI as structured data
  text: "Brief summary",       // Sent to the AI as context text
  title: "Tab Title",          // Optional: updates the pip tab title
  structuredContent: { ... },  // Alternative to data for complex payloads
};
```

- `data` — JSON-serializable object delivered to the UI.
- `text` — Concise string for the AI's context. Don't repeat what the UI shows.
- `title` — Optional string to update the pip tab title.

## Tool Context

The second argument to the handler provides:

```typescript
async (input, context) => {
  const prevState = context.getState();    // Read server-side state
  context.setState({ view: "detail" });    // Update server-side state
  // ...
}
```

## Multi-File Editing Warning

When changing types/interfaces shared across files, update ALL files in a single pass. `tsx watch` restarts the server after each file save — partial updates crash the server.

- **Bad:** Edit `lib/types.ts`, then `tools/items.ts`. Server crashes between saves.
- **Good:** Edit all files sharing the changed interface in quick succession.
