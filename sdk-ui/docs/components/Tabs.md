# Tabs

Underline-style tab bar for navigation.

```tsx
import { Tabs } from "open-mcp-app-ui";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| value | `string` | — | Currently active tab value. |
| onChange | `(value: string) => void` | — | Called when a tab is clicked. |
| children | `ReactNode` | — | Tab items (should be `Tabs.Tab` elements). |
| borderVariant | `"default" \| "secondary"` | `"default"` | Bottom border color. `"secondary"` uses a subtler border. |

Also extends `HTMLAttributes<HTMLDivElement>` (except `onChange`).

### Tabs.Tab

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| value | `string` | — | Unique value identifying this tab. Matched against `Tabs.value`. |
| children | `ReactNode` | — | Tab label. |
| disabled | `boolean` | `false` | Disables the tab. |

## Examples

```tsx
<Tabs value={activeTab} onChange={setActiveTab}>
  <Tabs.Tab value="overview">Overview</Tabs.Tab>
  <Tabs.Tab value="settings">Settings</Tabs.Tab>
  <Tabs.Tab value="logs">Logs</Tabs.Tab>
</Tabs>

{/* Subtler border */}
<Tabs value={activeTab} onChange={setActiveTab} borderVariant="secondary">
  <Tabs.Tab value="general">General</Tabs.Tab>
  <Tabs.Tab value="advanced">Advanced</Tabs.Tab>
</Tabs>

{/* Render content based on active tab */}
{activeTab === "overview" && <OverviewPanel />}
{activeTab === "settings" && <SettingsPanel />}
{activeTab === "logs" && <LogsPanel />}
```
