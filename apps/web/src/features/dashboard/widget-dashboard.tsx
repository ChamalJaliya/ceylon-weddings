"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Responsive, type Layout } from "react-grid-layout";
import { Layers } from "lucide-react";
import type { DashboardKind, WidgetLayoutItem } from "@ceylonweddings/contracts";
import {
  DASHBOARD_GRID_BREAKPOINTS,
  DASHBOARD_GRID_COLS,
  DASHBOARD_GRID_MARGIN,
  DASHBOARD_GRID_ROW_HEIGHT,
  createGroup,
  expandGridLayout,
  generateResponsiveLayouts,
  groupHasUnsavedChanges,
  groupHeaderRows,
  groupKey,
  isGroupKey,
  isPersistableDashboardBreakpoint,
  listGroupSummaries,
  listGroups,
  mergeGroupIntoSaved,
  moveWithinGroup,
  packGroup,
  removeFromGroup,
  renameGroup,
  sameLayout,
  setGroupColumns,
  setGroupLabelHidden,
  setGroupVisible,
  toGridItems,
  ungroup,
  useAuthStore,
  type DashboardBreakpoint,
  type DashboardLayoutStore,
} from "@ceylonweddings/web";
import { Button } from "@ceylonweddings/ui/components/button";
import { useConfirm } from "@ceylonweddings/ui/components/confirm-dialog";
import { toast } from "@ceylonweddings/ui/components/toaster";
import { Skeleton } from "@ceylonweddings/ui/components/skeleton";
import {
  ArrangeBanner,
  EditLayoutMenu,
  GroupSelectToggle,
  WidgetCatalog,
  WidgetChromeActions,
  WidgetGroupBlock,
  WidgetShell,
  WidgetSkeleton,
  renderResizeHandle,
  type WidgetCategory,
  type WidgetDefinition,
} from "@ceylonweddings/ui/domain/dashboard";

export type WidgetRenderContext = { emphasis: "filled" | "outline"; variant: "filled" | "outlined" };

export type WidgetDashboardProps = {
  kind: DashboardKind;
  store: DashboardLayoutStore;
  widgets: WidgetDefinition[];
  categories: WidgetCategory[];
  /** Widget content. Return null while its data is loading to get a shaped skeleton. */
  renderWidget: (id: string, context: WidgetRenderContext) => ReactNode;
  /** Controls in a widget's title row (links, filters). */
  renderHeaderActions?: (id: string) => ReactNode;
  /** Left side of the toolbar row (e.g. "Updated just now", a period chip). */
  toolbar?: ReactNode;
};

const DRAG_CANCEL = "button, a, input, select, textarea, label, [role='menu'], [role='menuitem'], .widget-no-drag";

/** Width of an element, tracked with ResizeObserver (follows rail collapse, not just window resize). */
function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(Math.round(entry.contentRect.width));
    });
    observer.observe(node);
    setWidth(Math.round(node.getBoundingClientRect().width));
    return () => observer.disconnect();
  }, []);
  return { ref, width };
}

function breakpointFor(width: number): DashboardBreakpoint {
  const order: DashboardBreakpoint[] = ["lg", "md", "sm", "xs", "xxs"];
  return order.find((bp) => width >= DASHBOARD_GRID_BREAKPOINTS[bp]) ?? "xxs";
}

/**
 * Customisable widget grid (Kloqra dashboard engine): drag, resize, show / hide,
 * highlight, and groups that move as one block. Layouts save on the account per
 * dashboard kind; edits while arranging stay local until Save (Cancel restores).
 */
export function WidgetDashboard({
  kind,
  store: useLayoutStore,
  widgets,
  categories,
  renderWidget,
  renderHeaderActions,
  toolbar,
}: WidgetDashboardProps) {
  const confirm = useConfirm();
  const user = useAuthStore((state) => state.user);
  const layout = useLayoutStore((state) => state.layout);
  const initialized = useLayoutStore((state) => state.initialized);
  const initialize = useLayoutStore((state) => state.initialize);
  const setLayout = useLayoutStore((state) => state.setLayout);
  const applyGrid = useLayoutStore((state) => state.applyGrid);
  const toggleWidget = useLayoutStore((state) => state.toggleWidget);
  const setWidgetEmphasis = useLayoutStore((state) => state.setWidgetEmphasis);
  const persist = useLayoutStore((state) => state.persist);
  const reset = useLayoutStore((state) => state.reset);

  const { ref: gridRef, width } = useElementWidth<HTMLDivElement>();
  const breakpoint = breakpointFor(width);
  const cols = DASHBOARD_GRID_COLS[breakpoint];
  const canArrange = isPersistableDashboardBreakpoint(breakpoint);

  const [arranging, setArranging] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selection, setSelection] = useState<string[]>([]);
  const [, bumpSavedRevision] = useState(0);
  const snapshotRef = useRef<WidgetLayoutItem[] | null>(null);

  useEffect(() => {
    if (user) initialize(user.preferences.dashboardLayouts?.[kind], user.id);
  }, [user, kind, initialize]);

  const byId = useMemo(() => new Map(widgets.map((w) => [w.id, w])), [widgets]);
  const labelOf = useCallback((id: string) => byId.get(id)?.label ?? "Widget", [byId]);
  const items = useMemo(() => (layout ?? []).filter((item) => byId.has(item.i)), [layout, byId]);
  const visibleItems = useMemo(() => items.filter((item) => item.visible), [items]);
  const minSizes = useMemo(() => Object.fromEntries(widgets.map((w) => [w.id, w.minSize])), [widgets]);
  const maxSizes = useMemo(
    () => Object.fromEntries(widgets.filter((w) => w.maxSize).map((w) => [w.id, w.maxSize!])),
    [widgets],
  );

  // Groups render as one composite item per breakpoint; their size comes from members, so no resize.
  const layouts = useMemo(() => {
    const entries = (Object.keys(DASHBOARD_GRID_COLS) as DashboardBreakpoint[]).map((bp) => [
      bp,
      generateResponsiveLayouts(
        toGridItems(visibleItems, DASHBOARD_GRID_COLS[bp], { editing: arranging }),
        minSizes,
        maxSizes,
      )[bp].map((item) => (isGroupKey(item.i) ? { ...item, isResizable: false } : item)),
    ]);
    return Object.fromEntries(entries) as Record<DashboardBreakpoint, Layout[]>;
  }, [visibleItems, minSizes, maxSizes, arranging]);

  const groups = useMemo(() => listGroups(visibleItems), [visibleItems]);
  const grouped = useMemo(() => new Set(groups.flatMap((g) => g.members.map((m) => m.i))), [groups]);
  const singles = visibleItems.filter((item) => !grouped.has(item.i));

  // ── Edit session ─────────────────────────────────────────────────────────
  const beginArrange = () => {
    snapshotRef.current = items.map((item) => ({ ...item }));
    setArranging(true);
  };
  const endArrange = () => {
    snapshotRef.current = null;
    setSelection([]);
    setArranging(false);
  };
  const cancelArrange = useCallback(() => {
    if (snapshotRef.current) setLayout(snapshotRef.current);
    snapshotRef.current = null;
    setSelection([]);
    setArranging(false);
  }, [setLayout]);

  const saveArrange = async () => {
    if (sameLayout(snapshotRef.current, items)) {
      endArrange();
      return;
    }
    setSaving(true);
    try {
      await persist();
      toast.success("Layout saved");
      endArrange();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the layout");
    } finally {
      setSaving(false);
    }
  };

  const resetLayout = async () => {
    const ok = await confirm({
      title: "Reset this dashboard?",
      description: "Widgets, sizes and groups go back to the original layout.",
      confirmLabel: "Reset layout",
      destructive: true,
    });
    if (!ok) return;
    try {
      await reset();
      snapshotRef.current = null;
      setSelection([]);
      setArranging(false);
      toast.success("Dashboard reset");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not reset the layout");
    }
  };

  // Escape peels one layer: the catalog first, then the arrange session.
  useEffect(() => {
    if (!arranging) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || catalogOpen) return;
      cancelArrange();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [arranging, catalogOpen, cancelArrange]);

  // Leaving a phone-width window mid-arrange would apply nothing; end the session instead.
  useEffect(() => {
    if (arranging && width > 0 && !canArrange) cancelArrange();
  }, [arranging, canArrange, width, cancelArrange]);

  /** Outside an arrange session every change saves immediately; inside, it waits for Save. */
  const saveNow = !arranging;
  const run = (work: Promise<void>, failure: string) =>
    work.catch((error: unknown) => toast.error(error instanceof Error ? error.message : failure));

  const applyGroupChange = (change: (list: WidgetLayoutItem[]) => WidgetLayoutItem[]) => {
    const current = useLayoutStore.getState().layout;
    if (!current) return;
    const next = change(current);
    setLayout(next);
    if (saveNow) void run(persist(next), "Could not save the layout");
  };

  const saveGroup = async (groupId: string, name: string) => {
    const current = useLayoutStore.getState().layout;
    if (!current) return;
    const merged = mergeGroupIntoSaved(snapshotRef.current ?? current, current, groupId);
    try {
      await persist(merged);
      snapshotRef.current = merged.map((item) => ({ ...item }));
      bumpSavedRevision((n) => n + 1);
      toast.success(`${name} saved`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the group");
    }
  };

  // ── Rendering ────────────────────────────────────────────────────────────
  const renderCell = (item: WidgetLayoutItem, index: number) => {
    const def = byId.get(item.i);
    if (!def) return null;
    const emphasis = item.emphasis === "outline" ? "outline" : "filled";
    const content = renderWidget(item.i, { emphasis, variant: emphasis === "outline" ? "outlined" : "filled" });
    return (
      <WidgetShell
        label={def.label}
        description={def.kpi ? undefined : def.description}
        icon={def.kpi ? undefined : def.icon}
        bare={def.kpi}
        isEditing={arranging}
        emphasis={emphasis}
        flush={def.flush}
        headerActions={renderHeaderActions?.(item.i)}
        style={{ ["--widget-stagger" as string]: `${Math.min(index * 60, 420)}ms` }}
        chromeActions={
          <WidgetChromeActions
            label={def.label}
            emphasis={emphasis}
            onToggleEmphasis={() =>
              void run(
                setWidgetEmphasis(item.i, emphasis === "filled" ? "outline" : "filled", { persist: saveNow }),
                "Could not save the highlight",
              )
            }
            onRemove={() => void run(toggleWidget(item.i, { persist: saveNow }), "Could not remove the widget")}
          />
        }
      >
        {content ?? <WidgetSkeleton kind={def.preview} />}
      </WidgetShell>
    );
  };

  const gridReady = initialized && width > 0;

  return (
    <section aria-label="Dashboard widgets" className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">{toolbar}</div>
        <EditLayoutMenu
          arranging={arranging}
          canArrange={canArrange}
          onArrange={beginArrange}
          onManageWidgets={() => setCatalogOpen(true)}
        />
      </div>

      {arranging ? (
        <ArrangeBanner
          saving={saving}
          leadingActions={
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={selection.length < 2}
              title="Tick two or more widgets, then group them so they move together"
              onClick={() => {
                applyGroupChange((list) => createGroup(list, selection));
                setSelection([]);
              }}
            >
              <Layers className="size-3.5" aria-hidden />
              {selection.length >= 2 ? `Group (${selection.length})` : "Group"}
            </Button>
          }
          onWidgets={() => setCatalogOpen(true)}
          onCancel={cancelArrange}
          onReset={() => void resetLayout()}
          onSave={() => void saveArrange()}
        />
      ) : null}

      <WidgetCatalog
        open={catalogOpen}
        onOpenChange={setCatalogOpen}
        widgets={widgets}
        categories={categories}
        isVisible={(id) => items.find((item) => item.i === id)?.visible ?? false}
        emphasisOf={(id) => (items.find((item) => item.i === id)?.emphasis === "outline" ? "outline" : "filled")}
        onToggleWidget={(id) => void run(toggleWidget(id, { persist: saveNow }), "Could not update the dashboard")}
        onSetEmphasis={(id, emphasis) =>
          void run(setWidgetEmphasis(id, emphasis, { persist: saveNow }), "Could not save the highlight")
        }
        groups={listGroupSummaries(items)}
        onToggleGroup={(groupId, visible) => applyGroupChange((list) => setGroupVisible(list, groupId, visible))}
        onReset={() => void resetLayout()}
      />

      <div ref={gridRef} className="min-w-0">
        {!gridReady ? (
          <DashboardGridSkeleton />
        ) : visibleItems.length === 0 ? (
          <EmptyDashboard onAdd={() => setCatalogOpen(true)} />
        ) : (
          <Responsive
            width={width}
            className={arranging ? "dash-grid dash-grid--editing" : "dash-grid"}
            layouts={layouts}
            breakpoints={DASHBOARD_GRID_BREAKPOINTS}
            cols={DASHBOARD_GRID_COLS}
            rowHeight={DASHBOARD_GRID_ROW_HEIGHT}
            margin={[DASHBOARD_GRID_MARGIN, DASHBOARD_GRID_MARGIN]}
            containerPadding={[0, 0]}
            compactType="vertical"
            isDraggable={arranging}
            isResizable={arranging}
            draggableCancel={DRAG_CANCEL}
            resizeHandles={["s", "e", "se"]}
            resizeHandle={renderResizeHandle}
            useCSSTransforms
            onLayoutChange={(current) => {
              if (arranging && canArrange) applyGrid(expandGridLayout(current, visibleItems, cols));
            }}
          >
            {singles.map((item, index) => (
              <div key={item.i} className="relative min-w-0">
                {renderCell(item, index)}
                {arranging ? (
                  <GroupSelectToggle
                    label={labelOf(item.i)}
                    selected={selection.includes(item.i)}
                    onToggle={() =>
                      setSelection((prev) =>
                        prev.includes(item.i) ? prev.filter((id) => id !== item.i) : [...prev, item.i],
                      )
                    }
                  />
                ) : null}
              </div>
            ))}
            {groups.map((group) => {
              const headerRows = groupHeaderRows(group, arranging);
              const packed = packGroup(group.members, cols, group.columns, headerRows);
              return (
                <div key={groupKey(group.id)} className="relative min-w-0">
                  <WidgetGroupBlock
                    name={group.name}
                    columns={group.columns}
                    hideLabel={group.hideLabel}
                    width={packed.w}
                    members={packed.placements.map((p) => ({
                      id: p.i,
                      label: labelOf(p.i),
                      dx: p.dx,
                      dy: p.dy,
                      w: p.w,
                      h: p.h,
                    }))}
                    rowHeight={DASHBOARD_GRID_ROW_HEIGHT}
                    gap={DASHBOARD_GRID_MARGIN}
                    isEditing={arranging}
                    showHeader={headerRows > 0}
                    hasChanges={groupHasUnsavedChanges(snapshotRef.current, items, group.id)}
                    renderMember={(id) => {
                      const member = group.members.find((m) => m.i === id);
                      return member ? renderCell(member, visibleItems.indexOf(member)) : null;
                    }}
                    onRename={(name) => applyGroupChange((list) => renameGroup(list, group.id, name))}
                    onSetColumns={(columns) =>
                      applyGroupChange((list) =>
                        setGroupColumns(list, group.id, columns >= group.members.length ? undefined : columns),
                      )
                    }
                    onMove={(id, delta) => applyGroupChange((list) => moveWithinGroup(list, id, delta))}
                    onRemoveMember={(id) => applyGroupChange((list) => removeFromGroup(list, id))}
                    onToggleLabel={() =>
                      applyGroupChange((list) => setGroupLabelHidden(list, group.id, !group.hideLabel))
                    }
                    onHide={() => applyGroupChange((list) => setGroupVisible(list, group.id, false))}
                    onUngroup={() => applyGroupChange((list) => ungroup(list, group.id))}
                    onSave={() => saveGroup(group.id, group.name)}
                  />
                </div>
              );
            })}
          </Responsive>
        )}
      </div>
    </section>
  );
}

function DashboardGridSkeleton() {
  return (
    <div className="grid gap-4" role="status" aria-label="Loading dashboard">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-12">
        <Skeleton className="h-80 rounded-2xl lg:col-span-8" />
        <Skeleton className="h-80 rounded-2xl lg:col-span-4" />
      </div>
    </div>
  );
}

function EmptyDashboard({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="grid place-items-center gap-3 rounded-2xl border border-dashed border-border px-6 py-16 text-center">
      <p className="font-serif text-h3">Your dashboard is empty</p>
      <p className="max-w-sm text-compact text-muted-foreground">Add the widgets you want to see every day.</p>
      <Button type="button" onClick={onAdd}>
        Add widgets
      </Button>
    </div>
  );
}
