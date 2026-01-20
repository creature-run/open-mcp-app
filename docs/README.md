<img width="3000" height="1050" alt="creature-github" src="https://github.com/user-attachments/assets/b7e060c5-7df5-4d6a-a474-fb8e5edc2415" />

Creature is a desktop AI coding assistant that brings **MCP Apps** to life. While other AI tools show you text responses, Creature renders rich, interactive UIs alongside the conversation.

Enrich your coding workflow with custom UI widgets that help you collaborate with AI more effectively. Review the AI's work, understand complex outputs, and perform tasks with ease through visualizations that accelerate productivity.

## Key Features

**Use MCP Apps** — Rich, interactive widgets appear alongside your AI conversation, transforming how you work with AI. Widgets can show inline within messages for quick feedback, or open in persistent tabs for long-running operations like terminals and dashboards. The AI follows and understands changes you make in the UI—when you toggle a checkbox, select an option, or edit a form, the Agent sees it. It's the best way to collaborate with AI.

**Build MCP & ChatGPT Apps** — Creature makes it easy to build and test MCP Apps right where you use them. The universal `@creature-ai/sdk` abstracts platform differences so your apps work seamlessly in both Creature and ChatGPT. Write once, run anywhere.

**Distribute MCP Apps** — Creature's Registry lets anyone publish and share their MCP Apps with the community. Package your app, publish it to the registry, and other Creature users can install it with one click.

## Quick Start

### Using Creature

1. **Launch Creature** and log in
2. **Select a folder** to work in
3. **Start chatting** — ask the AI to help with coding tasks
4. **Watch widgets appear** when tools with UIs are called

### Building MCP Apps

Create your first MCP App from within Creature:

1. From the **Projects** page (home), click **Create MCP App**
2. Choose a template and location
3. Creature scaffolds and auto-configures your app

Your new MCP App is ready to develop—just start coding!

## The SDK

The `@creature-ai/sdk` provides everything you need to build MCP and ChatGPT Apps once and run them in both places:

### Server (`@creature-ai/sdk/server`)

```typescript
import { createApp } from "@creature-ai/sdk/server";
import { z } from "zod";

const app = createApp({ name: "my-app", version: "1.0.0" });

app.resource({
  name: "Dashboard",
  uri: "ui://my-app/dashboard",
  displayModes: ["pip"],
  html: "ui/main.html",
});

app.tool("show_dashboard", {
  description: "Show the dashboard",
  ui: "ui://my-app/dashboard",
}, async () => {
  return { data: { items: [...] }, title: "Dashboard" };
});

app.start();
```

### React UI (`@creature-ai/sdk/react`)

```tsx
import { useHost, useToolResult } from "@creature-ai/sdk/react";

function App() {
  const { data, onToolResult } = useToolResult<DashboardData>();
  const { callTool, isReady } = useHost({
    name: "my-app",
    version: "1.0.0",
    onToolResult,
  });

  return <Dashboard data={data} onRefresh={() => callTool("refresh", {})} />;
}
```

## Documentation

- [**Concepts**](./concepts.md) — Key terminology
- [**Quick Start**](./building-mcp-apps.md) — Build your first MCP App
- [**SDK Reference**](./sdk-reference.md) — Complete API documentation

### Specification Compliance

- [**MCP Apps Spec**](./mcp-apps-spec.md) — SEP-1865 compliance tracker
- [**ChatGPT Apps**](./chatgpt-apps-spec.md) — Cross-platform compatibility

## Learn More

- [@creature-ai/sdk on npm](https://www.npmjs.com/package/@creature-ai/sdk)
- [MCP Apps Specification (SEP-1865)](https://github.com/modelcontextprotocol/ext-apps)
- [OpenAI Apps SDK](https://developers.openai.com/apps-sdk)
