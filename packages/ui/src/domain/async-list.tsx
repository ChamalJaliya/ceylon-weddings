"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "../components/button";
import { Card } from "../components/card";
import { Icon } from "../components/icon";
import { Input } from "../components/input";
import { SimpleSelect } from "../components/select";
import { cn } from "../lib/utils";
import { Stagger, StaggerItem, Pressable } from "./motion";

function pageItems(page: number, pageCount: number, radius = 2): Array<number | "ellipsis"> {
  if (pageCount <= 0) return [];
  if (pageCount === 1) return [1];
  const pages = new Set<number>([1, pageCount]);
  for (let index = page - radius; index <= page + radius; index += 1) {
    if (index >= 1 && index <= pageCount) pages.add(index);
  }
  const sorted = [...pages].sort((a, b) => a - b);
  const items: Array<number | "ellipsis"> = [];
  for (let index = 0; index < sorted.length; index += 1) {
    const current = sorted[index]!;
    if (index > 0 && current - sorted[index - 1]! > 1) items.push("ellipsis");
    items.push(current);
  }
  return items;
}

export function AsyncSearchField({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-12 min-w-0 flex-1 items-center gap-2 rounded-full border border-border/80 bg-card/90 px-4 shadow-card",
        className,
      )}
    >
      <Icon icon={Search} size="sm" className="text-muted-foreground" />
      <Input
        className="h-10 border-0 bg-transparent shadow-none focus-visible:ring-0"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={placeholder}
      />
    </div>
  );
}

export function FilterChip({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Pressable hoverScale={1.04} scale={0.96}>
      <Button
        type="button"
        shape="pill"
        size="sm"
        variant={active ? "default" : "outline"}
        className={cn("h-9 shrink-0", !active && "bg-card/80")}
        onClick={onClick}
      >
        {children}
      </Button>
    </Pressable>
  );
}

export function CategoryPills({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {children}
    </div>
  );
}

export function AsyncListToolbar({
  summary,
  children,
  className,
}: {
  summary: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/60 px-3 py-2.5 backdrop-blur-sm sm:px-4",
        className,
      )}
    >
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {summary}
      </p>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

export function AsyncSortSelect({
  value,
  onChange,
  label,
  options,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  options: Array<{ value: string; label: string }>;
  className?: string;
}) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
      <span className="hidden sm:inline">{label}</span>
      <SimpleSelect
        aria-label={label}
        value={value}
        onValueChange={onChange}
        options={options}
        className={cn("h-10 min-w-[10.5rem] rounded-full border-border bg-card px-3 shadow-none", className)}
      />
    </label>
  );
}

export function PaginationBar({
  page,
  pageCount,
  hasPrev,
  hasNext,
  onPage,
  previousLabel,
  nextLabel,
}: {
  page: number;
  pageCount: number;
  hasPrev: boolean;
  hasNext: boolean;
  onPage: (page: number) => void;
  previousLabel: string;
  nextLabel: string;
}) {
  if (pageCount <= 1) return null;
  const items = pageItems(page, pageCount);

  return (
    <nav className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2" aria-label="Pagination">
      <Button type="button" shape="pill" variant="outline" disabled={!hasPrev} onClick={() => onPage(page - 1)}>
        <Icon icon={ChevronLeft} size="sm" />
        <span className="hidden sm:inline">{previousLabel}</span>
      </Button>
      {items.map((item, index) =>
        item === "ellipsis" ? (
          <span key={`ellipsis-${index}`} className="px-1 text-muted-foreground">
            …
          </span>
        ) : (
          <Button
            key={item}
            type="button"
            shape="pill"
            size="icon"
            variant={item === page ? "default" : "outline"}
            aria-current={item === page ? "page" : undefined}
            onClick={() => onPage(item)}
          >
            {item}
          </Button>
        ),
      )}
      <Button type="button" shape="pill" variant="outline" disabled={!hasNext} onClick={() => onPage(page + 1)}>
        <span className="hidden sm:inline">{nextLabel}</span>
        <Icon icon={ChevronRight} size="sm" />
      </Button>
    </nav>
  );
}

export function VendorCardSkeleton() {
  return (
    <Card elevation="raised" className="overflow-hidden rounded-[1.75rem]">
      <div className="aspect-[4/3] animate-pulse bg-secondary" />
      <div className="grid gap-2.5 px-4 py-4">
        <div className="h-3 w-20 animate-pulse rounded-full bg-secondary" />
        <div className="h-5 w-3/4 animate-pulse rounded-full bg-secondary" />
        <div className="h-3 w-40 animate-pulse rounded-full bg-secondary" />
        <div className="h-4 w-28 animate-pulse rounded-full bg-secondary" />
      </div>
    </Card>
  );
}

export function AsyncListGrid({
  loading,
  skeletonCount = 6,
  empty,
  resetKey,
  children,
}: {
  loading?: boolean;
  skeletonCount?: number;
  empty?: React.ReactNode;
  resetKey?: string | number;
  children: React.ReactNode;
}) {
  const hasItems = React.Children.count(children) > 0;
  const items = React.Children.toArray(children);

  if (loading) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3" aria-busy>
        {Array.from({ length: skeletonCount }, (_, index) => (
          <VendorCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (!hasItems) {
    return <div>{empty}</div>;
  }

  return (
    <Stagger
      key={resetKey}
      trigger="immediate"
      className="grid gap-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3"
      stagger={0.05}
    >
      {items.map((child, index) => (
        <StaggerItem key={React.isValidElement(child) && child.key != null ? child.key : index}>{child}</StaggerItem>
      ))}
    </Stagger>
  );
}
