/**
 * DataTable — High-performance virtualized data table.
 *
 * Built on TanStack Table v8 for headless data logic (sorting, filtering,
 * pagination) and TanStack Virtual for row virtualization. This gives full
 * control over rendering and styling while handling thousands of rows smoothly.
 *
 * Styled exclusively with MCP Apps spec CSS variables via the SDK's
 * Tailwind theme mapping. Automatically adapts to display modes when
 * used inside an <AppLayout>.
 *
 * Imported separately from the core library to keep apps that don't
 * need it from paying any bundle cost:
 *
 *   import { DataTable } from "open-mcp-app-ui/table";
 */

import {
  useState,
  useMemo,
  useRef,
  useCallback,
  type ReactNode,
  type CSSProperties,
} from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type Row,
  type HeaderGroup,
  type Header,
  type Cell,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DataTableProps<T> {
  /**
   * Column definitions following TanStack Table's ColumnDef format.
   * Use `accessorKey` for simple property access, `header` for the
   * column label, and `cell` for custom cell rendering.
   */
  columns: ColumnDef<T, unknown>[];
  /** Row data array. */
  data: T[];
  /** Enable client-side column sorting (click headers to toggle). */
  sortable?: boolean;
  /** Enable a global text filter input above the table. */
  filterable?: boolean;
  /** Enable pagination with this many rows per page. Omit for no pagination. */
  pageSize?: number;
  /**
   * Enable row virtualization for large datasets. Renders only visible
   * rows plus a small overscan buffer. Recommended for >100 rows.
   */
  virtualized?: boolean;
  /** Keep the header row visible while scrolling. Defaults to true. */
  stickyHeader?: boolean;
  /** Content shown when the data array is empty. */
  emptyMessage?: ReactNode;
  /** Called when a row is clicked. Receives the row's original data and index. */
  onRowClick?: (row: { original: T; index: number }) => void;
  /** Show a loading skeleton instead of data rows. */
  loading?: boolean;
  /** Reduce row height for tighter layouts (e.g. inline display mode). */
  compact?: boolean;
  /**
   * Border style for the table container.
   * - "default" — uses --color-border-primary (stronger)
   * - "secondary" — uses --color-border-secondary (subtler)
   * Defaults to "default".
   */
  borderVariant?: "default" | "secondary";
  /** Additional CSS classes on the outermost wrapper. */
  className?: string;
  /** Placeholder text for the filter input. */
  filterPlaceholder?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Estimated row heights used by the virtualizer. */
const ROW_HEIGHT_COMPACT = 32;
const ROW_HEIGHT_DEFAULT = 40;

/** Number of rows rendered beyond the visible area for smooth scrolling. */
const OVERSCAN_COUNT = 10;

/** Number of skeleton rows shown while loading. */
const SKELETON_ROW_COUNT = 8;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/**
 * Sort direction indicator displayed next to sortable column headers.
 * Shows an up arrow, down arrow, or a subtle bi-directional hint.
 */
const SortIndicator = ({ direction }: { direction: false | "asc" | "desc" }) => {
  if (direction === "asc") {
    return <span className="text-txt-primary ml-1" aria-label="sorted ascending">↑</span>;
  }
  if (direction === "desc") {
    return <span className="text-txt-primary ml-1" aria-label="sorted descending">↓</span>;
  }
  return <span className="text-txt-tertiary ml-1 opacity-0 group-hover:opacity-100 transition-opacity">↕</span>;
};

/**
 * Renders a single header cell with optional sort interaction.
 * Wraps in a button when the column is sortable for keyboard accessibility.
 */
const HeaderCell = <T,>({
  header,
  sortable,
}: {
  header: Header<T, unknown>;
  sortable: boolean;
}) => {
  const canSort = sortable && header.column.getCanSort();
  const sorted = header.column.getIsSorted();

  const content = header.isPlaceholder
    ? null
    : flexRender(header.column.columnDef.header, header.getContext());

  if (canSort) {
    return (
      <button
        type="button"
        className="group inline-flex items-center gap-0.5 cursor-pointer select-none w-full text-left"
        onClick={header.column.getToggleSortingHandler()}
        aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : "none"}
      >
        {content}
        <SortIndicator direction={sorted} />
      </button>
    );
  }

  return <>{content}</>;
};

/**
 * Skeleton row placeholder displayed during the loading state.
 * Uses subtle animated pulse bars that inherit the theme.
 */
const SkeletonRow = ({ columnCount, compact }: { columnCount: number; compact: boolean }) => (
  <tr className="border-b border-bdr-secondary">
    {Array.from({ length: columnCount }, (_, i) => (
      <td
        key={i}
        className={compact ? "px-3 py-1.5" : "px-3 py-2.5"}
      >
        <div className="h-3.5 bg-bg-secondary rounded-sm animate-pulse" style={{ width: `${50 + Math.random() * 40}%` }} />
      </td>
    ))}
  </tr>
);

// ---------------------------------------------------------------------------
// DataTable
// ---------------------------------------------------------------------------

/**
 * High-performance data table with sorting, filtering, pagination,
 * and row virtualization.
 *
 * All visual aspects map to MCP Apps spec CSS variables for automatic
 * host theming. The table adapts to display modes when inside <AppLayout>.
 *
 * @example
 * ```tsx
 * import { DataTable } from "open-mcp-app-ui/table";
 *
 * const columns = [
 *   { accessorKey: "name", header: "Name" },
 *   { accessorKey: "status", header: "Status" },
 *   { accessorKey: "date", header: "Created" },
 * ];
 *
 * <DataTable columns={columns} data={items} sortable filterable />
 * ```
 */
export const DataTable = <T,>({
  columns,
  data,
  sortable = false,
  filterable = false,
  pageSize,
  virtualized = false,
  stickyHeader = true,
  emptyMessage = "No data",
  onRowClick,
  loading = false,
  compact = false,
  borderVariant = "default",
  className = "",
  filterPlaceholder = "Filter...",
}: DataTableProps<T>) => {
  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  // -------------------------------------------------------------------------
  // Table instance
  // -------------------------------------------------------------------------

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    ...(sortable ? { getSortedRowModel: getSortedRowModel() } : {}),
    ...(filterable ? { getFilteredRowModel: getFilteredRowModel() } : {}),
    ...(pageSize ? { getPaginationRowModel: getPaginationRowModel(), initialState: { pagination: { pageSize } } } : {}),
  });

  const { rows } = table.getRowModel();
  const headerGroups = table.getHeaderGroups();

  // -------------------------------------------------------------------------
  // Virtualization
  // -------------------------------------------------------------------------

  const scrollRef = useRef<HTMLDivElement>(null);
  const rowHeight = compact ? ROW_HEIGHT_COMPACT : ROW_HEIGHT_DEFAULT;

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    overscan: OVERSCAN_COUNT,
    enabled: virtualized,
  });

  const virtualRows = virtualized ? virtualizer.getVirtualItems() : null;
  const totalHeight = virtualized ? virtualizer.getTotalSize() : 0;

  // -------------------------------------------------------------------------
  // Pagination helpers
  // -------------------------------------------------------------------------

  const hasPagination = pageSize != null && !loading;
  const pageCount = table.getPageCount();
  const currentPage = table.getState().pagination.pageIndex;
  const canPrev = table.getCanPreviousPage();
  const canNext = table.getCanNextPage();

  // -------------------------------------------------------------------------
  // Row rendering
  // -------------------------------------------------------------------------

  /**
   * Renders a single data row. Shared between virtualized and
   * non-virtualized modes to keep styling consistent.
   */
  const renderRow = useCallback(
    (row: Row<T>, style?: CSSProperties) => {
      const isClickable = onRowClick != null;
      return (
        <tr
          key={row.id}
          className={[
            "border-b border-bdr-secondary last:border-b-0 transition-colors",
            isClickable ? "cursor-pointer hover:bg-bg-secondary" : "",
          ].join(" ")}
          style={style}
          onClick={isClickable ? () => onRowClick({ original: row.original, index: row.index }) : undefined}
          role={isClickable ? "button" : undefined}
          tabIndex={isClickable ? 0 : undefined}
          onKeyDown={isClickable ? (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onRowClick({ original: row.original, index: row.index });
            }
          } : undefined}
        >
          {row.getVisibleCells().map((cell: Cell<T, unknown>) => (
            <td
              key={cell.id}
              className={[
                "text-txt-primary",
                compact ? "px-3 py-1.5 text-xs" : "px-3 py-2.5 text-sm",
              ].join(" ")}
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </td>
          ))}
        </tr>
      );
    },
    [onRowClick, compact]
  );

  // -------------------------------------------------------------------------
  // Memoized body content
  // -------------------------------------------------------------------------

  const bodyContent = useMemo(() => {
    if (loading) {
      return Array.from({ length: SKELETON_ROW_COUNT }, (_, i) => (
        <SkeletonRow key={i} columnCount={columns.length} compact={compact} />
      ));
    }

    if (rows.length === 0) {
      return (
        <tr>
          <td
            colSpan={columns.length}
            className="text-center text-txt-tertiary py-8 text-sm"
          >
            {emptyMessage}
          </td>
        </tr>
      );
    }

    // Virtualized rendering — only render visible rows with absolute positioning
    if (virtualized && virtualRows) {
      return (
        <>
          {/* Spacer for rows above the visible window */}
          {virtualRows.length > 0 && virtualRows[0].start > 0 && (
            <tr style={{ height: virtualRows[0].start }}>
              <td colSpan={columns.length} />
            </tr>
          )}
          {virtualRows.map((vRow) => {
            const row = rows[vRow.index];
            return renderRow(row, { height: `${vRow.size}px` });
          })}
          {/* Spacer for rows below the visible window */}
          {virtualRows.length > 0 && (
            <tr style={{ height: Math.max(0, totalHeight - (virtualRows[virtualRows.length - 1]?.end ?? 0)) }}>
              <td colSpan={columns.length} />
            </tr>
          )}
        </>
      );
    }

    // Standard rendering — all rows
    return rows.map((row) => renderRow(row));
  }, [loading, rows, columns.length, compact, emptyMessage, virtualized, virtualRows, totalHeight, renderRow]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className={`flex flex-col gap-2 min-h-0 ${className}`}>
      {/* Global filter input */}
      {filterable && !loading && (
        <div className="flex items-center">
          <input
            type="text"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={filterPlaceholder}
            className="omu-control w-full max-w-xs text-sm px-3 py-1.5 rounded-md bg-bg-primary text-txt-primary placeholder:text-txt-tertiary"
          />
        </div>
      )}

      {/* Scrollable table container */}
      <div
        ref={scrollRef}
        className={[
          "overflow-auto rounded-lg flex-1 min-h-0",
          borderVariant === "secondary" ? "border border-bdr-secondary" : "border border-bdr-primary",
          virtualized ? "max-h-[600px]" : "",
        ].join(" ")}
      >
        <table className="w-full border-collapse text-left">
          {/* Table header */}
          <thead
            className={[
              "bg-bg-secondary",
              stickyHeader ? "sticky top-0 z-10" : "",
            ].join(" ")}
          >
            {headerGroups.map((hg: HeaderGroup<T>) => (
              <tr key={hg.id}>
                {hg.headers.map((header: Header<T, unknown>) => (
                  <th
                    key={header.id}
                    className={[
                      "text-txt-secondary font-medium",
                      compact ? "px-3 py-1.5 text-xs" : "px-3 py-2.5 text-xs",
                      borderVariant === "secondary" ? "border-b border-bdr-secondary" : "border-b border-bdr-primary",
                      "whitespace-nowrap",
                    ].join(" ")}
                    style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                  >
                    <HeaderCell header={header} sortable={sortable} />
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          {/* Table body */}
          <tbody className="bg-bg-primary">
            {bodyContent}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {hasPagination && pageCount > 1 && (
        <div className="flex items-center justify-between text-sm text-txt-secondary">
          <span>
            Page {currentPage + 1} of {pageCount}
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => table.previousPage()}
              disabled={!canPrev}
              className={[
                "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                canPrev
                  ? "bg-bg-secondary text-txt-primary hover:bg-bg-tertiary cursor-pointer"
                  : "bg-bg-secondary text-txt-disabled cursor-not-allowed",
              ].join(" ")}
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => table.nextPage()}
              disabled={!canNext}
              className={[
                "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                canNext
                  ? "bg-bg-secondary text-txt-primary hover:bg-bg-tertiary cursor-pointer"
                  : "bg-bg-secondary text-txt-disabled cursor-not-allowed",
              ].join(" ")}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
