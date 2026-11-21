"use client";

import type { ReactNode } from "react";
import { cn } from "../lib/utils";
import {
  DataTableCell,
  DataTableHead,
  DataTableHeaderRow,
  DataTableScroll,
  Table,
  TableBody,
  TableHeader,
  TableRow,
} from "./data-table";

/**
 * @deprecated Prefer `DataTableList` from `@ceylonweddings/ui/domain/data-table-list`
 * for loading, empty modes, and server/client pagination.
 * Kept as thin wrappers around the shared table primitives.
 */
export function AdminDataTable({
  headers,
  children,
  className,
}: {
  headers: ReactNode[];
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-border/60", className)}>
      <DataTableScroll>
        <Table embedded>
          <TableHeader>
            <DataTableHeaderRow>
              {headers.map((header, index) => (
                <DataTableHead key={index}>{header}</DataTableHead>
              ))}
            </DataTableHeaderRow>
          </TableHeader>
          <TableBody>{children}</TableBody>
        </Table>
      </DataTableScroll>
    </div>
  );
}

export function AdminDataRow({
  children,
  onClick,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <TableRow className={cn(onClick ? "cursor-pointer" : null, className)} onClick={onClick}>
      {children}
    </TableRow>
  );
}

export function AdminDataCell({ children, className }: { children: ReactNode; className?: string }) {
  return <DataTableCell className={className}>{children}</DataTableCell>;
}
