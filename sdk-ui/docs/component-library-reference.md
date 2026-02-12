# open-mcp-app-ui — Component Library Reference

UI components for MCP Apps. All components are styled via MCP Apps spec CSS variables and work on any host (Creature, ChatGPT, Claude Desktop).

## Setup

```tsx
// Required: SDK Tailwind theme mapping
import "open-mcp-app/styles/tailwind.css";

// Optional: fallback theme for development without a host
import "open-mcp-app-ui/styles/fallbacks.css";

// Optional: Tailwind display-mode variants (inline:, pip:, fullscreen:)
import "open-mcp-app-ui/styles/display-modes.css";

// Import components
import { AppLayout, Show, Button, Input, Card, Heading, Text } from "open-mcp-app-ui";
```

---

## Layout & Display Mode

MCP Apps run in three display modes: `"inline"` (60–300px tall, inside conversation), `"pip"` (sidebar tab), and `"fullscreen"`. Use `<AppLayout>` and `<Show>` to adapt.

### AppLayout

Display-mode-aware root layout. Sets `data-display-mode` attribute and provides display mode to children.

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| displayMode | `"inline" \| "pip" \| "fullscreen"` | `"pip"` | Current display mode. Pass `hostContext?.displayMode`. |
| availableDisplayModes | `DisplayMode[]` | `[displayMode]` | Modes the host supports. Pass `hostContext?.availableDisplayModes`. |
| className | `string` | `""` | Additional CSS classes. |
| children | `ReactNode` | — | Content. |

**Example:**

```tsx
import { HostProvider, useHost } from "open-mcp-app/react";
import { AppLayout, Show, Heading, Text, Button } from "open-mcp-app-ui";

function App() {
  return (
    <HostProvider name="my-app" version="1.0.0">
      <AppContent />
    </HostProvider>
  );
}

function AppContent() {
  const { hostContext } = useHost();

  return (
    <AppLayout
      displayMode={hostContext?.displayMode}
      availableDisplayModes={hostContext?.availableDisplayModes}
    >
      <Heading size="md">My App</Heading>

      <Show on="inline">
        <Text variant="secondary">3 items · Tap to expand</Text>
      </Show>

      <Show on={["pip", "fullscreen"]}>
        <FullItemsList />
      </Show>
    </AppLayout>
  );
}
```

### Show

Conditionally renders children based on the current display mode. Must be inside `<AppLayout>`.

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| on | `DisplayMode \| DisplayMode[]` | — | Mode(s) to render in. |
| children | `ReactNode` | — | Content shown when mode matches. |
| fallback | `ReactNode` | `null` | Content shown when mode does NOT match. |

**Examples:**

```tsx
{/* Only in inline mode */}
<Show on="inline">
  <Text variant="secondary">Compact summary</Text>
</Show>

{/* In pip and fullscreen */}
<Show on={["pip", "fullscreen"]}>
  <DetailedView />
</Show>

{/* With fallback */}
<Show on="fullscreen" fallback={<Text>Expand for more</Text>}>
  <FullDashboard />
</Show>
```

### useDisplayMode

Hook for programmatic display mode access. Must be inside `<AppLayout>`.

```tsx
import { useDisplayMode } from "open-mcp-app-ui";

const { displayMode, isInline, isPip, isFullscreen, availableDisplayModes } = useDisplayMode();
```

### Tailwind Display Mode Variants

After importing `display-modes.css`, use `inline:`, `pip:`, `fullscreen:` variants:

```tsx
<div className="hidden pip:block fullscreen:block">Only in pip and fullscreen</div>
<div className="text-sm inline:text-xs fullscreen:text-base">Adaptive text size</div>
<div className="p-2 inline:p-1 fullscreen:p-4">Adaptive padding</div>
```

---

## Form Controls

### Button

Action trigger with semantic variants.

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | `"primary" \| "secondary" \| "danger" \| "ghost"` | `"primary"` | Visual style. |
| size | `"sm" \| "md" \| "lg"` | `"md"` | Button size. |
| disabled | `boolean` | `false` | Disables the button. |
| loading | `boolean` | `false` | Shows spinner, disables interaction. |
| children | `ReactNode` | — | Button label. |

**Examples:**

```tsx
<Button variant="primary" onClick={handleSave}>Save</Button>
<Button variant="secondary" onClick={handleCancel}>Cancel</Button>
<Button variant="danger" size="sm" onClick={handleDelete}>Delete</Button>
<Button variant="ghost" onClick={handleMore}>More options</Button>
<Button variant="primary" loading>Saving...</Button>
```

### Input

Text input with label and error handling.

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | `string` | — | Label above the input. |
| error | `string` | — | Error message. Shows error styling. |
| helperText | `string` | — | Helper text below (hidden when error is set). |
| size | `"sm" \| "md" \| "lg"` | `"md"` | Input size. |
| placeholder | `string` | — | Placeholder text. |
| disabled | `boolean` | `false` | Disables the input. |

**Examples:**

```tsx
<Input label="Name" placeholder="Enter name..." value={name} onChange={(e) => setName(e.target.value)} />
<Input label="Email" type="email" error="Invalid email address" />
<Input label="Search" placeholder="Search..." helperText="Search by name or ID" />
```

### Textarea

Multi-line text input.

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | `string` | — | Label above the textarea. |
| error | `string` | — | Error message. |
| helperText | `string` | — | Helper text below. |
| rows | `number` | `3` | Number of visible rows. |
| resize | `"none" \| "vertical" \| "horizontal" \| "both"` | `"vertical"` | Resize behavior. |

**Examples:**

```tsx
<Textarea label="Description" rows={4} placeholder="Enter description..." />
<Textarea label="Notes" error="Required field" resize="none" />
```

### Select

Dropdown selection with native `<select>`.

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | `string` | — | Label above the select. |
| options | `{ value: string; label?: string; disabled?: boolean }[]` | — | Options to display. |
| placeholder | `string` | — | Placeholder as first disabled option. |
| error | `string` | — | Error message. |
| helperText | `string` | — | Helper text below. |
| size | `"sm" \| "md" \| "lg"` | `"md"` | Select size. |

**Examples:**

```tsx
<Select
  label="Status"
  placeholder="Choose status..."
  options={[
    { value: "active", label: "Active" },
    { value: "archived", label: "Archived" },
  ]}
  value={status}
  onChange={(e) => setStatus(e.target.value)}
/>
```

### Checkbox

Boolean toggle with label.

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | `string` | — | Label next to the checkbox. |
| checked | `boolean` | — | Checked state. |
| onChange | `ChangeEventHandler` | — | Change handler. |
| disabled | `boolean` | `false` | Disables the checkbox. |

**Examples:**

```tsx
<Checkbox label="Accept terms" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
<Checkbox label="Remember me" />
```

### Switch

Toggle switch for on/off states.

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | `string` | — | Label next to the switch. |
| checked | `boolean` | `false` | Whether the switch is on. |
| onChange | `(checked: boolean) => void` | — | Called with the new checked value. |
| disabled | `boolean` | `false` | Disables the switch. |

**Examples:**

```tsx
<Switch label="Dark mode" checked={isDark} onChange={setIsDark} />
<Switch label="Notifications" checked={notifs} onChange={setNotifs} />
```

---

## Feedback

### Alert

Status message banner.

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | `"info" \| "danger" \| "success" \| "warning"` | `"info"` | Semantic color. |
| title | `string` | — | Bold title above body text. |
| children | `ReactNode` | — | Alert body content. |
| dismissible | `boolean` | `false` | Show dismiss button. |
| onDismiss | `() => void` | — | Called on dismiss. |

**Examples:**

```tsx
<Alert variant="success" title="Saved">Your changes have been saved.</Alert>
<Alert variant="danger">Something went wrong. Please try again.</Alert>
<Alert variant="info" dismissible>Tip: You can drag items to reorder.</Alert>
<Alert variant="warning" title="Warning">This action cannot be undone.</Alert>
```

### Badge

Small status indicator.

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | `"info" \| "danger" \| "success" \| "warning" \| "secondary"` | `"secondary"` | Semantic color. |
| children | `ReactNode` | — | Badge content. |

**Examples:**

```tsx
<Badge variant="success">Active</Badge>
<Badge variant="danger">3 errors</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="secondary">Draft</Badge>
```

---

## Layout & Data Display

### Card

Content container with border and shadow.

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | `"default" \| "ghost"` | `"default"` | `"default"` has border+shadow, `"ghost"` is borderless. |
| padding | `"none" \| "sm" \| "md" \| "lg"` | `"md"` | Internal padding. |
| children | `ReactNode` | — | Card content. |

**Examples:**

```tsx
<Card>
  <Heading size="sm">Settings</Heading>
  <Input label="Name" />
  <Button variant="primary">Save</Button>
</Card>

<Card variant="ghost" padding="none">
  <Text variant="secondary">Borderless content</Text>
</Card>
```

### Heading

Semantic heading with spec-driven typography. Uses SDK's `heading-*` utility classes.

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| level | `1 \| 2 \| 3 \| 4 \| 5 \| 6` | `2` | HTML heading level (h1–h6). |
| size | `"xs" \| "sm" \| "md" \| "lg" \| "xl" \| "2xl" \| "3xl"` | `"md"` | Visual size (independent of level). |
| children | `ReactNode` | — | Heading text. |

**Examples:**

```tsx
<Heading level={1} size="2xl">Page Title</Heading>
<Heading level={2} size="lg">Section</Heading>
<Heading size="sm">Subsection</Heading>
```

### Text

Body text with semantic color variants.

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | `"primary" \| "secondary" \| "tertiary"` | `"primary"` | Text color. |
| size | `"sm" \| "md" \| "lg"` | `"md"` | Text size. |
| as | `"p" \| "span" \| "div"` | `"p"` | HTML element to render. |
| children | `ReactNode` | — | Text content. |

**Examples:**

```tsx
<Text>Primary body text</Text>
<Text variant="secondary" size="sm">Description or helper text</Text>
<Text variant="tertiary" as="span">Timestamp or metadata</Text>
```

### Divider

Horizontal separator line.

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| spacing | `"none" \| "sm" \| "md" \| "lg"` | `"md"` | Vertical spacing above and below. |

**Examples:**

```tsx
<Heading size="md">Section A</Heading>
<Divider />
<Heading size="md">Section B</Heading>

<Divider spacing="lg" />
```

---

## Common Patterns

### Form with Validation

```tsx
import { AppLayout, Card, Heading, Input, Textarea, Select, Button, Alert } from "open-mcp-app-ui";

function CreateItemForm() {
  const { hostContext } = useHost();
  const [error, setError] = useState("");

  return (
    <AppLayout displayMode={hostContext?.displayMode}>
      <Card>
        <Heading size="md">Create Item</Heading>
        {error && <Alert variant="danger">{error}</Alert>}
        <Input label="Title" placeholder="Enter title..." />
        <Textarea label="Description" rows={3} />
        <Select
          label="Category"
          placeholder="Select category..."
          options={[
            { value: "bug", label: "Bug" },
            { value: "feature", label: "Feature" },
          ]}
        />
        <Button variant="primary" onClick={handleSubmit}>Create</Button>
      </Card>
    </AppLayout>
  );
}
```

### Adaptive Layout for Inline and PIP

```tsx
import { AppLayout, Show, Card, Heading, Text, Badge, Button } from "open-mcp-app-ui";

function NotesApp() {
  const { hostContext } = useHost();

  return (
    <AppLayout displayMode={hostContext?.displayMode}>
      <Show on="inline">
        <div className="flex items-center justify-between">
          <div>
            <Heading size="sm">Notes</Heading>
            <Text variant="secondary" size="sm">
              {notes.length} notes · <Badge variant="success">{active} active</Badge>
            </Text>
          </div>
          <Button variant="ghost" size="sm">Open →</Button>
        </div>
      </Show>

      <Show on={["pip", "fullscreen"]}>
        <Heading size="lg">Notes</Heading>
        {notes.map((note) => (
          <Card key={note.id}>
            <Heading size="sm">{note.title}</Heading>
            <Text variant="secondary" size="sm">{note.body}</Text>
          </Card>
        ))}
        <Button variant="primary">New Note</Button>
      </Show>
    </AppLayout>
  );
}
```

### Settings Page

```tsx
import { AppLayout, Card, Heading, Input, Switch, Select, Divider, Button } from "open-mcp-app-ui";

function SettingsPage() {
  const { hostContext } = useHost();

  return (
    <AppLayout displayMode={hostContext?.displayMode}>
      <Heading size="lg">Settings</Heading>

      <Card>
        <Heading size="sm">Profile</Heading>
        <Input label="Display Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Card>

      <Card>
        <Heading size="sm">Preferences</Heading>
        <Switch label="Email notifications" checked={emailNotifs} onChange={setEmailNotifs} />
        <Switch label="Sound effects" checked={sounds} onChange={setSounds} />
        <Divider spacing="sm" />
        <Select
          label="Language"
          options={[
            { value: "en", label: "English" },
            { value: "es", label: "Spanish" },
          ]}
          value={lang}
          onChange={(e) => setLang(e.target.value)}
        />
      </Card>

      <Button variant="primary" onClick={handleSave}>Save Changes</Button>
    </AppLayout>
  );
}
```

---

## Anti-Patterns

**Do NOT hardcode colors. Use spec variables via Tailwind classes:**

```tsx
{/* Bad */}
<div style={{ color: "#333", background: "#fff" }}>...</div>

{/* Good */}
<div className="text-txt-primary bg-bg-primary">...</div>
```

**Do NOT skip AppLayout. It provides display mode context for Show:**

```tsx
{/* Bad — Show won't work without AppLayout */}
<HostProvider name="app" version="1.0.0">
  <Show on="inline">...</Show>
</HostProvider>

{/* Good */}
<HostProvider name="app" version="1.0.0">
  <AppLayout displayMode={hostContext?.displayMode}>
    <Show on="inline">...</Show>
  </AppLayout>
</HostProvider>
```

**Do NOT forget to pass displayMode to AppLayout:**

```tsx
{/* Bad — defaults to "pip", won't adapt */}
<AppLayout>
  <Show on="inline">Won't show in inline</Show>
</AppLayout>

{/* Good */}
<AppLayout displayMode={hostContext?.displayMode}>
  <Show on="inline">Shows in inline</Show>
</AppLayout>
```
