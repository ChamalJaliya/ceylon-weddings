"use client";

import * as React from "react";
import { cn } from "../lib/utils";

type TableProps = React.ComponentProps<"table"> & {
  /**
   * When true, skip the local overflow wrapper — parent `DataTableScroll` owns scrolling
   * so header and body stay aligned.
   */
  embedded?: boolean;
};

function Table({ className, embedded = false, ...props }: TableProps) {
  const table = (
    <table
      data-slot="table"
      className={cn("caption-bottom text-sm", embedded ? "w-max min-w-full" : "w-full", className)}
      {...props}
    />
  );

  if (embedded) return table;

  return (
    <div className="relative w-full overflow-x-auto" data-slot="table-container">
      {table}
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead data-slot="table-header" className={cn("sticky top-0 z-10 bg-card [&_tr]:border-b", className)} {...props} />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return <tbody data-slot="table-body" className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className)}
      {...props}
    />
  );
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "cw-row-lift border-b border-border/50 transition-colors hover:bg-secondary/20 data-[state=selected]:bg-secondary/30",
        className,
      )}
      {...props}
    />
  );
}

export type TableAlign = "left" | "center" | "right";

type TableAlignProps = {
  align?: TableAlign;
  numeric?: boolean;
};

function resolveHeadAlignClass(align?: TableAlign, numeric?: boolean): string {
  const resolved = align ?? (numeric ? "right" : "left");
  if (resolved === "right") return "text-right";
  if (resolved === "center") return "text-center";
  return "text-left";
}

function resolveCellAlignClass(align?: TableAlign, numeric?: boolean): string {
  const resolved = align ?? (numeric ? "right" : "left");
  if (resolved === "right") return "text-right tabular-nums";
  if (resolved === "center") return numeric ? "text-center tabular-nums" : "text-center";
  return numeric ? "text-left tabular-nums" : "text-left";
}

function TableHead({ className, align, numeric, ...props }: React.ComponentProps<"th"> & TableAlignProps) {
  return (
    <th
      data-slot="table-head"
      data-align={align ?? (numeric ? "right" : undefined)}
      className={cn(
        "h-10 px-3 align-middle text-xs font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap first:pl-4 last:pr-4",
        resolveHeadAlignClass(align, numeric),
        className,
      )}
      {...props}
    />
  );
}

function TableCell({ className, align, numeric, ...props }: React.ComponentProps<"td"> & TableAlignProps) {
  return (
    <td
      data-slot="table-cell"
      data-align={align ?? (numeric ? "right" : undefined)}
      className={cn(
        "px-3 py-3 text-sm align-middle first:pl-4 last:pr-4",
        resolveCellAlignClass(align, numeric),
        className,
      )}
      {...props}
    />
  );
}

function TableCaption({ className, ...props }: React.ComponentProps<"caption">) {
  return (
    <caption data-slot="table-caption" className={cn("mt-4 text-sm text-muted-foreground", className)} {...props} />
  );
}

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
