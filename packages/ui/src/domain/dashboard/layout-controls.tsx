"use client";

import { useState, type ReactElement, type ReactNode, type Ref } from "react";
import { LayoutGrid, Move, RotateCcw, Save, SquarePlus, X } from "lucide-react";
import { Button } from "../../components/button";
import { Popover, PopoverContent, PopoverTrigger } from "../../components/popover";
import { cn } from "../../lib/utils";

const EDIT_OPTIONS = [
  {
    key: "arrange",
    icon: Move,
    title: "Rearrange & group",
    description: "Drag to move, drag edges to resize, tick widgets to group them.",
  },
  {
    key: "widgets",
    icon: SquarePlus,
    title: "Add or remove widgets",
    description: "Choose which widgets appear on your dashboard.",
  },
] as const;

/**
 * "Edit layout" asks what the user wants to do (Kloqra DashboardAppBarActions),
 * so arranging and picking widgets stay separate flows. Hidden while arranging.
 */
export function EditLayoutMenu({
  arranging,
  canArrange = true,
  onArrange,
  onManageWidgets,
}: {
  arranging: boolean;
  /** False on phones: the stacked phone layout is derived from the desktop one, never saved. */
  canArrange?: boolean;
  onArrange: () => void;
  onManageWidgets: () => void;
}) {
  const [open, setOpen] = useState(false);
  if (arranging) return null;
  const options = canArrange ? EDIT_OPTIONS : EDIT_OPTIONS.filter((option) => option.key !== "arrange");
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" shape="pill" aria-haspopup="menu" aria-expanded={open}>
          <LayoutGrid className="size-4" aria-hidden />
          Edit layout
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-1.5" role="menu" aria-label="Edit layout">
        {options.map(({ key, icon: Glyph, title, description }) => (
          <button
            key={key}
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              if (key === "arrange") onArrange();
              else onManageWidgets();
            }}
            className="flex w-full items-start gap-3 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-primary/5 focus-visible:bg-primary/5 focus-visible:outline-none"
          >
            <span className="mt-0.5 inline-grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <Glyph className="size-4" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-compact font-medium">{title}</span>
              <span className="block text-caption leading-snug text-muted-foreground">{description}</span>
            </span>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

/** Sticky bar while arranging: Group, Widgets, Cancel, Reset, Save (Kloqra DashboardArrangeBanner). */
export function ArrangeBanner({
  leadingActions,
  onWidgets,
  onCancel,
  onReset,
  onSave,
  saving = false,
}: {
  leadingActions?: ReactNode;
  onWidgets: () => void;
  onCancel: () => void;
  onReset: () => void;
  onSave: () => void;
  saving?: boolean;
}) {
  const divider = <span className="mx-0.5 hidden h-5 w-px bg-border sm:block" aria-hidden />;
  return (
    <div
      className="sticky top-2 z-40 rounded-2xl border border-primary/20 bg-card/90 shadow-card backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200"
      role="region"
      aria-label="Layout editing"
    >
      <div className="flex flex-wrap items-center gap-3 px-4 py-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <span className="inline-grid size-8 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
            <Move className="size-4 motion-safe:animate-pulse" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-compact font-medium">Rearranging</p>
            <p className="hidden truncate text-caption text-muted-foreground md:block">
              Drag a widget to move it · drag its edge or corner to resize · tick widgets to group them
            </p>
          </div>
        </div>
        <div className={cn("flex flex-wrap items-center gap-1.5")} role="group" aria-label="Layout edit actions">
          {leadingActions}
          {leadingActions ? divider : null}
          <Button type="button" size="sm" variant="outline" onClick={onWidgets}>
            <LayoutGrid className="size-3.5" aria-hidden />
            Widgets
          </Button>
          {divider}
          <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
            <X className="size-3.5" aria-hidden />
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onReset}
            title="Restore the original layout for this dashboard"
          >
            <RotateCcw className="size-3.5" aria-hidden />
            Reset
          </Button>
          <Button type="button" size="sm" onClick={onSave} disabled={saving}>
            <Save className="size-3.5" aria-hidden />
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

type ResizeAxis = "s" | "w" | "e" | "n" | "sw" | "nw" | "se" | "ne";

/** Resize grip for react-grid-layout; class names must stay react-resizable compatible. */
export function renderResizeHandle(axis: ResizeAxis, ref: Ref<HTMLElement>): ReactElement {
  return (
    <span
      ref={ref as Ref<HTMLSpanElement>}
      className={`react-resizable-handle react-resizable-handle-${axis}`}
      aria-hidden
    />
  );
}
