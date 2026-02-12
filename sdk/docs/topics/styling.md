# Styling — Tailwind, CSS Variables, and Theming

MCP Apps use host-themed Tailwind via the SDK. Colors adapt automatically to the host theme (light/dark).

```css
/* styles.css */
@import "open-mcp-app/styles/tailwind.css";
```

## CSS Variable Classes

**Never hardcode colors.** Always use themed classes that map to MCP Apps spec CSS variables.

### Backgrounds (`bg-bg-*`)

`primary`, `secondary`, `tertiary`, `inverse`, `ghost`, `disabled`, `info`, `danger`, `success`, `warning`

### Text (`text-txt-*`)

`primary`, `secondary`, `tertiary`, `inverse`, `ghost`, `disabled`, `info`, `danger`, `success`, `warning`

### Borders (`border-bdr-*`)

`primary`, `secondary`, `tertiary`, `inverse`, `ghost`, `disabled`, `info`, `danger`, `success`, `warning`

### Focus Rings (`ring-ring-*`)

`primary`, `secondary`, `inverse`, `info`, `danger`, `success`, `warning`

## Typography

| Class | Maps to |
|-------|---------|
| `font-sans` | `--font-sans` (host's sans-serif font) |
| `font-mono` | `--font-mono` (host's monospace font) |
| `font-normal` / `font-medium` / `font-semibold` / `font-bold` | `--font-weight-*` |
| `text-xs` / `text-sm` / `text-base` / `text-lg` | `--font-text-*-size` |
| `text-heading-xs` through `text-heading-3xl` | `--font-heading-*-size` |

## Other Themed Classes

| Category | Classes |
|----------|---------|
| Border radius | `rounded-xs`, `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-full` |
| Shadows | `shadow-hairline`, `shadow-sm`, `shadow-md`, `shadow-lg` |

## SDK Utility Classes

| Class | Purpose |
|-------|---------|
| `heading-md`, `heading-lg`, `heading-xl` | Combines size + weight + line-height for headings. |
| `h-control-sm`, `h-control-md` | Standard control heights. |
| `icon-sm`, `icon-md` | Standard icon sizes. |

## Custom CSS

If you must write custom CSS, use `var(--color-*, fallback)` and avoid hardcoded colors:

```css
/* Good */
.custom-border {
  border: 1px solid var(--color-border-primary, #e5e5e5);
}

/* Bad — hardcoded color */
.custom-border {
  border: 1px solid #ccc;
}
```

## Display Mode Tailwind Variants

After importing `open-mcp-app-ui/styles/display-modes.css`, use variants:

```tsx
<div className="text-sm inline:text-xs fullscreen:text-base">Adaptive text</div>
<div className="hidden pip:block fullscreen:block">Hidden in inline</div>
<div className="p-2 inline:p-1 fullscreen:p-4">Adaptive padding</div>
```
