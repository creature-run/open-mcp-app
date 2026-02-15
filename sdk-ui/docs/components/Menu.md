# Menu

Dropdown menu with items, checkbox items, separators, and labels. Compose with sub-components.

```tsx
import { Menu } from "open-mcp-app-ui";
```

## Sub-components

- `Menu.Trigger` — Wraps the element that opens the menu.
- `Menu.Content` — The dropdown panel.
- `Menu.Item` — A clickable menu item.
- `Menu.CheckboxItem` — A toggleable checkbox menu item.
- `Menu.Separator` — A horizontal divider line.
- `Menu.Label` — A non-interactive section label.

## Menu.Content Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| align | `"start" \| "center" \| "end"` | `"start"` | Alignment relative to the trigger. |
| width | `number \| string` | — | Width of the menu. |
| minWidth | `number \| string` | `220` | Minimum width. |

## Menu.Item Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| onSelect | `() => void` | — | Called when the item is selected. |
| disabled | `boolean` | `false` | Disables the item. |
| danger | `boolean` | `false` | Danger styling (red text). |

## Menu.CheckboxItem Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| checked | `boolean` | `false` | Whether the item is checked. |
| onCheckedChange | `(checked: boolean) => void` | — | Called when checked state changes. |
| disabled | `boolean` | `false` | Disables the item. |

## Examples

```tsx
<Menu>
  <Menu.Trigger>
    <Button variant="secondary">Actions</Button>
  </Menu.Trigger>
  <Menu.Content>
    <Menu.Item onSelect={() => handleEdit()}>Edit</Menu.Item>
    <Menu.Item onSelect={() => handleDuplicate()}>Duplicate</Menu.Item>
    <Menu.Separator />
    <Menu.Item onSelect={() => handleDelete()} danger>Delete</Menu.Item>
  </Menu.Content>
</Menu>

{/* With checkbox items and labels */}
<Menu>
  <Menu.Trigger>
    <Button variant="secondary">View Options</Button>
  </Menu.Trigger>
  <Menu.Content>
    <Menu.Label>Display</Menu.Label>
    <Menu.CheckboxItem checked={showGrid} onCheckedChange={setShowGrid}>
      Show grid
    </Menu.CheckboxItem>
    <Menu.CheckboxItem checked={showLabels} onCheckedChange={setShowLabels}>
      Show labels
    </Menu.CheckboxItem>
  </Menu.Content>
</Menu>
```
