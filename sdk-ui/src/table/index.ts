/**
 * open-mcp-app-ui/table
 *
 * High-performance virtualized data table built on TanStack Table v8
 * + TanStack Virtual. This is an optional import — apps that don't
 * use it pay zero bundle cost.
 *
 * Usage:
 *   import { DataTable } from "open-mcp-app-ui/table";
 *
 *   <DataTable
 *     columns={[{ accessorKey: "name", header: "Name" }]}
 *     data={items}
 *     sortable
 *     virtualized
 *   />
 *
 * Re-exports TanStack Table's ColumnDef type so consumers don't need
 * to install @tanstack/react-table directly for type annotations.
 */

export { DataTable, type DataTableProps } from "./DataTable.js";
export { type ColumnDef } from "@tanstack/react-table";
