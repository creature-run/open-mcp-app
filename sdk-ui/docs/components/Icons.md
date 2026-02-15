# Icons

`lucide-react` is included as a dependency of `open-mcp-app-ui`. When you install `open-mcp-app-ui`, Lucide is automatically available — no separate install needed.

---

## Usage

Import icons directly from `lucide-react`:

```tsx
import { Plus, Trash2, Settings, Search, ChevronDown, X } from "lucide-react";

<Button>
  <Plus size={16} /> Add Item
</Button>

<Input icon={<Search size={14} />} placeholder="Search..." />
```

---

## Props

Every Lucide icon accepts:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| size | `number \| string` | `24` | Width and height |
| color | `string` | `"currentColor"` | Icon color |
| strokeWidth | `number` | `2` | Stroke width |
| className | `string` | `""` | CSS classes |

Icons use `currentColor` by default — they inherit text color from their parent, which means they automatically adapt to the theme's CSS variables.

---

## Common Icons

Frequently used icons for MCP Apps:

| Category | Icons |
|----------|-------|
| Actions | `Plus`, `Minus`, `X`, `Check`, `Pencil`, `Trash2`, `Copy`, `Download`, `Upload`, `Send` |
| Navigation | `ChevronDown`, `ChevronUp`, `ChevronLeft`, `ChevronRight`, `ArrowLeft`, `ArrowRight`, `Menu`, `MoreHorizontal`, `MoreVertical`, `ExternalLink` |
| Status | `AlertCircle`, `AlertTriangle`, `CheckCircle`, `Info`, `HelpCircle`, `Clock`, `Loader2` |
| Content | `File`, `FileText`, `Folder`, `Image`, `Link`, `Hash`, `Tag`, `Star`, `Heart`, `Bookmark` |
| Communication | `MessageSquare`, `Mail`, `Bell`, `Phone`, `Video`, `Mic` |
| UI | `Search`, `Filter`, `Settings`, `Sliders`, `Eye`, `EyeOff`, `Sun`, `Moon`, `Maximize`, `Minimize` |
| Data | `BarChart3`, `LineChart`, `PieChart`, `TrendingUp`, `TrendingDown`, `Activity` |

---

## Examples

### With Button

```tsx
import { Plus, Loader2 } from "lucide-react";
import { Button } from "open-mcp-app-ui";

<Button variant="primary">
  <Plus size={16} /> New Item
</Button>

<Button variant="ghost" loading loadingIcon={<Loader2 size={14} className="animate-spin" />}>
  Saving...
</Button>
```

### Icon-only Button

```tsx
import { Settings, Trash2 } from "lucide-react";
import { Button } from "open-mcp-app-ui";

<Button variant="ghost" size="sm" aria-label="Settings">
  <Settings size={16} />
</Button>

<Button variant="danger" size="sm" aria-label="Delete">
  <Trash2 size={16} />
</Button>
```

### Inline with Text

```tsx
import { Info } from "lucide-react";
import { Text } from "open-mcp-app-ui";

<Text variant="secondary" size="sm">
  <Info size={14} className="inline mr-1" /> This is informational text.
</Text>
```

---

## Tips

- Use `size={16}` for buttons and inline icons, `size={20}` for standalone, `size={24}` for headers.
- `strokeWidth={1.5}` gives a thinner, more refined look.
- For animated spinners, use `<Loader2 className="animate-spin" />`.
- The full icon list: [lucide.dev/icons](https://lucide.dev/icons)
