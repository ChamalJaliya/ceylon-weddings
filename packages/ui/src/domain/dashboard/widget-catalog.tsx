"use client";

import { useState } from "react";
import { Check, Eye, EyeOff, Layers, LayoutGrid, Lightbulb, RotateCcw, Search } from "lucide-react";
import { Button } from "../../components/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "../../components/sheet";
import { cn } from "../../lib/utils";
import type { WidgetCategory, WidgetDefinition } from "./types";
import { WidgetPreview } from "./widget-preview";

export type WidgetCatalogGroup = { id: string; name: string; count: number; visible: boolean };

export type WidgetCatalogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  widgets: WidgetDefinition[];
  categories: WidgetCategory[];
  isVisible: (id: string) => boolean;
  emphasisOf: (id: string) => "filled" | "outline";
  onToggleWidget: (id: string) => void;
  onSetEmphasis: (id: string, emphasis: "filled" | "outline") => void;
  groups: WidgetCatalogGroup[];
  onToggleGroup: (groupId: string, visible: boolean) => void;
  onReset: () => void;
};

const chip = (selected: boolean) =>
  cn(
    "shrink-0 rounded-full border px-3 py-1 text-caption transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    selected
      ? "border-primary bg-primary font-medium text-primary-foreground"
      : "border-border/70 bg-background text-muted-foreground hover:bg-muted",
  );

const normalize = (text: string) => text.toLowerCase().replace(/['’]/g, "'");

/**
 * "Add or remove widgets" side panel (Kloqra WidgetControlPanel): search, category
 * chips, "On dashboard" filter, group show/hide, and per-widget show + highlight.
 * Non-modal so changes appear on the dashboard behind it as you click.
 */
export function WidgetCatalog({
  open,
  onOpenChange,
  widgets,
  categories,
  isVisible,
  emphasisOf,
  onToggleWidget,
  onSetEmphasis,
  groups,
  onToggleGroup,
  onReset,
}: WidgetCatalogProps) {
  const [category, setCategory] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [onDashboardOnly, setOnDashboardOnly] = useState(false);
  const q = normalize(query.trim());
  const filtered = widgets.filter(
    (w) =>
      (category === "all" || w.category === category) &&
      (!onDashboardOnly || isVisible(w.id)) &&
      (!q || normalize(w.label).includes(q) || normalize(w.description).includes(q)),
  );
  const activeCount = widgets.filter((w) => isVisible(w.id)).length;
  const categoryLabel = new Map(categories.map((c) => [c.value, c.label]));

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent
        side="right"
        className="w-[min(25rem,94vw)] gap-0 bg-card p-0"
        onInteractOutside={(event) => event.preventDefault()}
      >
        <SheetHeader className="border-b border-border/60 p-5 pr-12">
          <SheetTitle className="flex items-center gap-2">
            <LayoutGrid className="size-4 text-primary" aria-hidden />
            Add or remove widgets
          </SheetTitle>
          <SheetDescription>Turn widgets on or off. Changes are saved right away.</SheetDescription>
        </SheetHeader>

        <div className="grid gap-3 border-b border-border/50 px-5 py-3">
          <label className="relative block">
            <span className="sr-only">Search widgets</span>
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search widgets…"
              className="h-9 w-full rounded-full border border-border/70 bg-background pr-3 pl-9 text-compact outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring/30"
            />
          </label>
          <div
            className="-mx-5 flex gap-1.5 overflow-x-auto px-5 pb-0.5 [scrollbar-width:none]"
            aria-label="Widget categories"
          >
            <button
              type="button"
              aria-pressed={category === "all"}
              onClick={() => setCategory("all")}
              className={chip(category === "all")}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.value}
                type="button"
                aria-pressed={category === c.value}
                onClick={() => setCategory(c.value)}
                className={chip(category === c.value)}
              >
                {c.label}
              </button>
            ))}
            <button
              type="button"
              aria-pressed={onDashboardOnly}
              onClick={() => setOnDashboardOnly((v) => !v)}
              className={chip(onDashboardOnly)}
            >
              On dashboard
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {groups.length > 0 ? (
            <section className="border-b border-border/50 px-5 py-3" aria-label="Widget groups">
              <div className="flex items-center justify-between py-1 text-label font-medium tracking-spaced text-muted-foreground uppercase">
                <span>Groups ({groups.length})</span>
                <span className="tracking-normal normal-case">{groups.filter((g) => g.visible).length} shown</span>
              </div>
              <ul className="divide-y divide-dashed divide-border/70">
                {groups.map((group) => (
                  <li key={group.id} className="flex items-center gap-2 py-2">
                    <Layers className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-compact font-medium">{group.name}</p>
                      <p className="text-label text-muted-foreground">{group.count} widgets</p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant={group.visible ? "outline" : "default"}
                      aria-pressed={group.visible}
                      aria-label={`${group.visible ? "Hide" : "Show"} ${group.name}`}
                      onClick={() => onToggleGroup(group.id, !group.visible)}
                    >
                      {group.visible ? (
                        <EyeOff className="size-3.5" aria-hidden />
                      ) : (
                        <Eye className="size-3.5" aria-hidden />
                      )}
                      {group.visible ? "Hide" : "Show"}
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="px-5 py-3" aria-label="Widgets">
            <div className="flex items-center justify-between py-1 text-label font-medium tracking-spaced text-muted-foreground uppercase">
              <span>Widgets ({filtered.length})</span>
              <span className="tracking-normal normal-case">{activeCount} on dashboard</span>
            </div>
            {filtered.length === 0 ? (
              <p className="py-10 text-center text-caption text-muted-foreground">No widgets match.</p>
            ) : (
              <ul className="divide-y divide-dashed divide-border/70">
                {filtered.map((widget) => {
                  const visible = isVisible(widget.id);
                  const emphasis = emphasisOf(widget.id);
                  return (
                    <li key={widget.id} className="group/widget-card py-3">
                      <div className="flex gap-3">
                        <WidgetPreview widget={widget} active={visible} />
                        <div className="flex min-w-0 flex-1 flex-col py-0.5">
                          <h4 className="flex items-center gap-1.5 text-compact font-medium">
                            <span className="truncate">{widget.label}</span>
                            {visible ? (
                              <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-label font-medium text-primary">
                                On
                              </span>
                            ) : null}
                          </h4>
                          <p className="mt-0.5 line-clamp-2 text-caption leading-relaxed text-muted-foreground">
                            {widget.description}
                          </p>
                          <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                            <span className="truncate rounded-md border border-border/60 bg-muted/50 px-2 py-0.5 text-label text-muted-foreground">
                              {categoryLabel.get(widget.category) ?? widget.category}
                            </span>
                            <div className="flex shrink-0 items-center gap-1.5">
                              {visible && !widget.kpi ? (
                                <button
                                  type="button"
                                  aria-pressed={emphasis === "filled"}
                                  aria-label={`${emphasis === "filled" ? "Outline" : "Fill"} highlight for ${widget.label}`}
                                  title={
                                    emphasis === "filled" ? "Filled — click for outline" : "Outline — click for filled"
                                  }
                                  onClick={() => onSetEmphasis(widget.id, emphasis === "filled" ? "outline" : "filled")}
                                  className={cn(
                                    "inline-grid size-7 place-items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                    emphasis === "filled"
                                      ? "border-primary/40 bg-primary/10 text-primary"
                                      : "border-border/70 bg-background text-muted-foreground",
                                  )}
                                >
                                  <Lightbulb
                                    className="size-3.5"
                                    aria-hidden
                                    fill={emphasis === "filled" ? "currentColor" : "none"}
                                  />
                                </button>
                              ) : null}
                              <button
                                type="button"
                                aria-pressed={visible}
                                aria-label={`${visible ? "Hide" : "Show"} ${widget.label}`}
                                onClick={() => onToggleWidget(widget.id)}
                                className={cn(
                                  "inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-caption font-medium transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                  visible
                                    ? "border border-border/70 bg-background hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                                    : "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
                                )}
                              >
                                {visible ? (
                                  <EyeOff className="size-3.5" aria-hidden />
                                ) : (
                                  <Eye className="size-3.5" aria-hidden />
                                )}
                                {visible ? "Hide" : "Show"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <SheetFooter className="flex-row border-border/60">
          <Button type="button" variant="outline" size="sm" className="flex-1" onClick={onReset}>
            <RotateCcw className="size-3.5" aria-hidden />
            Reset
          </Button>
          <Button type="button" size="sm" className="flex-1" onClick={() => onOpenChange(false)}>
            <Check className="size-3.5" aria-hidden />
            Done
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
