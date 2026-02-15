# TagInput

Multi-tag input with validation and keyboard navigation.

```tsx
import { TagInput } from "open-mcp-app-ui";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | `string` | — | Label above the input. |
| value | `Tag[]` | — | Controlled tag list. |
| defaultValue | `Tag[]` | `[]` | Default tags for uncontrolled mode. |
| onChange | `(tags: Tag[]) => void` | — | Called when tags change. |
| validator | `(value: string) => boolean` | — | Validation function. Return false to mark a tag as invalid. |
| delimiters | `string[]` | `[","]` | Characters that trigger tag creation (besides Enter). |
| maxTags | `number` | — | Maximum number of tags allowed. |
| placeholder | `string` | `"Add a tag..."` | Placeholder text. |
| disabled | `boolean` | `false` | Disables the input. |
| error | `string` | — | Error message. |
| helperText | `string` | — | Helper text below. |
| size | `"sm" \| "md" \| "lg"` | `"md"` | Size variant. |

## Types

```tsx
type Tag = { value: string; valid: boolean };
```

## Examples

```tsx
<TagInput
  label="Tags"
  value={tags}
  onChange={setTags}
  placeholder="Type and press Enter..."
/>

{/* With validation */}
<TagInput
  label="Emails"
  value={emails}
  onChange={setEmails}
  validator={(v) => v.includes("@")}
  helperText="Press Enter or comma to add"
/>

{/* With max limit */}
<TagInput label="Keywords" maxTags={5} value={keywords} onChange={setKeywords} />
```
