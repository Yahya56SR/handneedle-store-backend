/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/data-table.tsx (Mettez à jour ce fichier)
"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState, // Importez ColumnFiltersState
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel, // Importez getFilteredRowModel
  getPaginationRowModel, // Importez getPaginationRowModel
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button"; // Pour les boutons de pagination

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  // --- NOUVELLE PROP : onDelete (pour les actions de suppression) ---
  onDelete?: (id: string) => void;
  // -----------------------------------------------------------------
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onDelete, // Destructure la nouvelle prop
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters, // Gérer les changements de filtre
    getFilteredRowModel: getFilteredRowModel(), // Activer le filtrage
    getPaginationRowModel: getPaginationRowModel(), // Activer la pagination
    state: {
      sorting,
      columnFilters,
    },
  });

  // --- Écouteur d'événements pour la suppression ---
  React.useEffect(() => {
    const handleDeleteRequest = (event: CustomEvent) => {
      if (onDelete && event.detail) {
        onDelete(event.detail); // Appelle la fonction onDelete passée par le parent
      }
    };

    window.addEventListener(
      "product-delete-request" as any,
      handleDeleteRequest
    );

    return () => {
      window.removeEventListener(
        "product-delete-request" as any,
        handleDeleteRequest
      );
    };
  }, [onDelete]); // Déclenche le useEffect quand onDelete change

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                Aucun résultat.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {/* --- Pagination Controls --- */}
      <div className="flex items-center justify-end space-x-2 py-4 pr-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Précédent
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Suivant
        </Button>
      </div>
    </div>
  );
}
