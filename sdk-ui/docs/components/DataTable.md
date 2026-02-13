# DataTable

**The default choice for any tabular, grid, or structured list data.** Do not build custom tables with raw `<table>`, `<div>` grids, or `.map()` loops — always use DataTable instead. It handles theming, sorting, filtering, pagination, and row virtualization automatically.

High-performance virtualized data table built on TanStack Table + TanStack Virtual.

**Separate import** — not part of the core bundle:

```tsx
import { DataTable, type ColumnDef } from "open-mcp-app-ui/table";
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| columns | `ColumnDef<T, unknown>[]` | — | Column definitions (TanStack Table format). |
| data | `T[]` | — | Row data array. |
| sortable | `boolean` | `false` | Enable client-side column sorting (click headers to toggle). |
| filterable | `boolean` | `false` | Show a global text filter input above the table. |
| pageSize | `number` | — | Enable pagination with this many rows per page. Omit for no pagination. |
| virtualized | `boolean` | `false` | Enable row virtualization. Recommended for >100 rows. |
| stickyHeader | `boolean` | `true` | Keep header visible while scrolling. |
| emptyMessage | `ReactNode` | `"No data"` | Content shown when data is empty. |
| onRowClick | `(row: { original: T; index: number }) => void` | — | Row click handler. |
| loading | `boolean` | `false` | Show animated skeleton rows. |
| compact | `boolean` | `false` | Reduce row height (xs text, tighter padding). |
| filterPlaceholder | `string` | `"Filter..."` | Placeholder for the filter input. |
| className | `string` | — | Additional classes on the wrapper. |

## Column Definitions

Columns use TanStack Table's `ColumnDef` format. The `ColumnDef` type is re-exported from `open-mcp-app-ui/table` for convenience.

```tsx
import { type ColumnDef } from "open-mcp-app-ui/table";

const columns: ColumnDef<MyRow, unknown>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "email", header: "Email" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => <Badge variant={getValue() as string}>{getValue() as string}</Badge>,
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ getValue }) => new Date(getValue() as string).toLocaleDateString(),
  },
];
```

Key `ColumnDef` fields:
- `accessorKey` — property name on the row object
- `header` — column label (string or render function)
- `cell` — custom cell renderer (receives `{ getValue, row }`)
- `size` — column width hint in pixels
- `enableSorting` — override per-column sorting (defaults to the table-level `sortable`)

## Examples

```tsx
{/* Basic table */}
<DataTable
  columns={[
    { accessorKey: "name", header: "Name" },
    { accessorKey: "role", header: "Role" },
  ]}
  data={users}
/>

{/* Sortable + filterable */}
<DataTable
  columns={columns}
  data={items}
  sortable
  filterable
  filterPlaceholder="Search items..."
/>

{/* Paginated */}
<DataTable
  columns={columns}
  data={items}
  sortable
  pageSize={20}
/>

{/* Virtualized for large datasets */}
<DataTable
  columns={columns}
  data={thousandsOfRows}
  sortable
  virtualized
/>

{/* Clickable rows */}
<DataTable
  columns={columns}
  data={items}
  onRowClick={({ original }) => openItem(original.id)}
/>

{/* Compact + loading state */}
<DataTable
  columns={columns}
  data={[]}
  loading
  compact
/>

{/* Custom empty state */}
<DataTable
  columns={columns}
  data={[]}
  emptyMessage={
    <div className="flex flex-col items-center gap-2">
      <Text variant="tertiary">No items found</Text>
      <Button variant="primary" size="sm" onClick={handleCreate}>Create first item</Button>
    </div>
  }
/>
```

## Styling

All visual elements use MCP Apps spec CSS variables:

| Element | Variable |
|---------|----------|
| Header background | `--color-background-secondary` |
| Header text | `--color-text-secondary` |
| Row background | `--color-background-primary` |
| Row hover | `--color-background-secondary` |
| Row text | `--color-text-primary` |
| Row border | `--color-border-secondary` |
| Table border | `--color-border-primary` |
| Empty state text | `--color-text-tertiary` |
| Filter input | Standard spec input styling |
| Pagination buttons | Standard spec button styling |
