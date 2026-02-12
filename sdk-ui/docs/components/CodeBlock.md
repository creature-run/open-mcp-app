# CodeBlock

Syntax-highlighted code block with copy functionality. Always renders with a dark background regardless of theme.

```tsx
import { CodeBlock } from "open-mcp-app-ui";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| children | `string` | — | Code content to display. |
| language | `string` | — | Language for syntax highlighting (e.g. `"tsx"`, `"python"`, `"bash"`, `"json"`). |
| copyable | `boolean` | `true` | Show a copy button. |
| showLineNumbers | `boolean` | `false` | Show line numbers. |
| className | `string` | — | Additional CSS class. |

## Examples

```tsx
<CodeBlock language="tsx">
{`const App = () => <div>Hello</div>;`}
</CodeBlock>

<CodeBlock language="bash" copyable={false}>
{`npm install open-mcp-app-ui`}
</CodeBlock>

<CodeBlock language="json" showLineNumbers>
{`{
  "name": "my-app",
  "version": "1.0.0"
}`}
</CodeBlock>
```
