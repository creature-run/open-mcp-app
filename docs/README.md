<img width="3000" height="1050" alt="creature-github" src="https://github.com/user-attachments/assets/b7e060c5-7df5-4d6a-a474-fb8e5edc2415" />

[Creature](https://creature.run) is a beautiful desktop client for using and building MCP Apps. It renders rich, interactive UI widgets alongside AI conversations, transforming how you work with agents.

This repository contains open-source artifacts for building MCP Apps with Creature, for anyone who wants to enrich AI experiences, create custom tools, or build developer workflows, all with UI.

## What's Inside

### `sdk/`

The [`@creature-ai/sdk`](https://www.npmjs.com/package/@creature-ai/sdk) lets you build an MCP App once and run it in Creature, any client that supports MCP Apps, and ChatGPT. Includes server utilities, React hooks, and Vite plugins for seamless development.

### `template-notes/`

A full-featured MCP App template with a rich Markdown editor. Demonstrates Creature's multi-instance functionality, where the AI can open multiple tabs with independent instances of the same MCP App. In this case, each note gets its own tab. Great starting point for apps that need multiple windows open.

### `template-todos/`

A simple MCP App template demonstrating task management with interactive checkboxes. Uses Creature's single-instance behavior (the default), where the app renders in one persistent tab. Great for learning the basics of MCP App development and apps that only ever need to be viewed in one window.

### `docs/`

Source documentation for building MCP Apps, SDK reference, and platform concepts.

## Documentation

Visit [creature.run/docs](https://creature.run/docs) for the full documentation, including quick-start guides, SDK reference, and tutorials.

## License

MIT
