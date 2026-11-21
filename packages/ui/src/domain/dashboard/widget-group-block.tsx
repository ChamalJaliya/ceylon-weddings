"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, EyeOff, Layers, MoreHorizontal, Save, Tag, Ungroup, X } from "lucide-react";
import { Button } from "../../components/button";
import { Popover, PopoverContent, PopoverTrigger } from "../../components/popover";
import { Select, SelectContent, SelectItem, SelectTrigger } from "../../components/select";
import { cn } from "../../lib/utils";

/** Arrangement choices for a group of `count` widgets, as rows × columns (1 × 4, 2 × 2, 4 × 1…). */
export function groupArrangementOptions(count: number) {
  const options: { columns: number; label: string }[] = [];
  for (let rows = 1; rows <= count; rows += 1) {
    const columns = Math.ceil(count / rows);
    if (options.some((o) => o.columns === columns)) continue;
    options.push({ columns, label: `${Math.ceil(count / columns)} × ${columns}` });
  }
  return options;
}

export type GroupBlockMember = { id: string; label: string; dx: number; dy: number; w: number; h: number };

export type WidgetGroupBlockProps = {
  name: string;
  /** Widgets per row (undefined = one row). */
  columns?: number;
  hideLabel?: boolean;
  /** Grid width in columns, and members placed inside it (dy includes the header row). */
  width: number;
  members: GroupBlockMember[];
  rowHeight: number;
  gap: number;
  isEditing: boolean;
  showHeader: boolean;
  hasChanges: boolean;
  renderMember: (id: string) => ReactNode;
  onRename: (name: string) => void;
  onSetColumns: (columns: number) => void;
  onMove: (id: string, delta: -1 | 1) => void;
  onRemoveMember: (id: string) => void;
  onToggleLabel: () => void;
  onHide: () => void;
  onUngroup: () => void;
  onSave: () => Promise<void>;
};

const menuItem =
  "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-caption hover:bg-muted focus-visible:bg-muted focus-visible:outline-none disabled:opacity-60";

/**
 * Widgets that move as one block (Kloqra WidgetGroupBlock). Members render in
 * precedence order under a slim name strip; while arranging the strip becomes
 * rename + rows × columns + a menu, and each member gets reorder / remove controls.
 */
export function WidgetGroupBlock({
  name,
  columns,
  hideLabel,
  width,
  members,
  rowHeight,
  gap,
  isEditing,
  showHeader,
  hasChanges,
  renderMember,
  onRename,
  onSetColumns,
  onMove,
  onRemoveMember,
  onToggleLabel,
  onHide,
  onUngroup,
  onSave,
}: WidgetGroupBlockProps) {
  const [draft, setDraft] = useState(name);
  const [menuOpen, setMenuOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => setDraft(name), [name]);
  const options = groupArrangementOptions(members.length);
  const active = options.find((o) => o.columns === (columns ?? members.length)) ?? options[0]!;
  const run = (action: () => void) => {
    setMenuOpen(false);
    action();
  };

  return (
    <div
      role="group"
      aria-label={`${name} widget group`}
      className={cn(
        "relative size-full rounded-2xl",
        isEditing && "outline-1 outline-offset-4 outline-primary/40 outline-dashed",
      )}
    >
      <div
        className="grid size-full"
        style={{ gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))`, gridAutoRows: `${rowHeight}px`, gap }}
      >
        {showHeader ? (
          <div className="flex min-w-0 items-center gap-2 px-1" style={{ gridColumn: "1 / -1", gridRow: "1 / span 1" }}>
            <Layers className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
            {isEditing ? (
              <>
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onBlur={() => onRename(draft)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") event.currentTarget.blur();
                  }}
                  maxLength={60}
                  aria-label="Group name"
                  className="widget-no-drag h-7 min-w-20 max-w-56 flex-1 truncate rounded-lg border border-border bg-background px-2 text-compact font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <Select value={String(active.columns)} onValueChange={(value) => onSetColumns(Number(value))}>
                  <SelectTrigger
                    aria-label={`Group arrangement: ${active.label} (rows × columns)`}
                    className="widget-no-drag h-7 w-auto shrink-0 gap-1.5 px-2 text-caption tabular-nums"
                  >
                    <TilingGlyph count={members.length} columns={active.columns} />
                    <span>{active.label}</span>
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((option) => (
                      <SelectItem key={option.columns} value={String(option.columns)} className="text-caption">
                        <span className="inline-flex items-center gap-2 tabular-nums">
                          <TilingGlyph count={members.length} columns={option.columns} />
                          {option.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Popover open={menuOpen} onOpenChange={setMenuOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      className="widget-no-drag relative ml-auto shrink-0"
                      aria-label={
                        hasChanges ? `More options for ${name} (unsaved changes)` : `More options for ${name}`
                      }
                    >
                      <MoreHorizontal className="size-4" aria-hidden />
                      {hasChanges ? (
                        <span className="absolute top-0.5 right-0.5 size-1.5 rounded-full bg-primary" aria-hidden />
                      ) : null}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="widget-no-drag w-60 p-1" role="menu">
                    {hasChanges ? (
                      <>
                        <button
                          type="button"
                          role="menuitem"
                          disabled={saving}
                          className={cn(menuItem, "font-medium text-primary")}
                          onClick={() => {
                            setMenuOpen(false);
                            setSaving(true);
                            void onSave().finally(() => setSaving(false));
                          }}
                        >
                          <Save className="size-3.5" aria-hidden />
                          {saving ? "Saving…" : "Save group"}
                        </button>
                        <div className="my-1 h-px bg-border" role="separator" />
                      </>
                    ) : null}
                    <button
                      type="button"
                      role="menuitemcheckbox"
                      aria-checked={!hideLabel}
                      className={menuItem}
                      onClick={() => run(onToggleLabel)}
                    >
                      <Tag className="size-3.5 text-muted-foreground" aria-hidden />
                      {hideLabel ? "Show group name on dashboard" : "Hide group name on dashboard"}
                    </button>
                    <button type="button" role="menuitem" className={menuItem} onClick={() => run(onHide)}>
                      <EyeOff className="size-3.5 text-muted-foreground" aria-hidden />
                      Hide group
                    </button>
                    <button type="button" role="menuitem" className={menuItem} onClick={() => run(onUngroup)}>
                      <Ungroup className="size-3.5 text-muted-foreground" aria-hidden />
                      Ungroup
                    </button>
                  </PopoverContent>
                </Popover>
              </>
            ) : (
              <span className="cw-eyebrow truncate">{name}</span>
            )}
          </div>
        ) : null}

        {members.map((member, index) => {
          const position = index + 1;
          return (
            <div
              key={member.id}
              className="group/member relative min-h-0 min-w-0"
              style={{
                gridColumn: `${member.dx + 1} / span ${member.w}`,
                gridRow: `${member.dy + 1} / span ${member.h}`,
              }}
            >
              {renderMember(member.id)}
              {isEditing ? (
                <>
                  <span
                    className="pointer-events-none absolute -top-2 -left-2 z-30 inline-grid size-5 place-items-center rounded-full bg-primary text-label font-medium text-primary-foreground tabular-nums shadow-sm"
                    aria-label={`Position ${position} of ${members.length}`}
                  >
                    {position}
                  </span>
                  <div className="widget-no-drag absolute bottom-2 left-1/2 z-30 flex -translate-x-1/2 items-center gap-0.5 rounded-lg border border-border bg-card p-0.5 opacity-0 shadow-sm transition-opacity group-hover/member:opacity-100 focus-within:opacity-100">
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      disabled={position === 1}
                      onClick={() => onMove(member.id, -1)}
                      aria-label={`Move ${member.label} earlier`}
                    >
                      <ChevronLeft className="size-3.5" aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      disabled={position === members.length}
                      onClick={() => onMove(member.id, 1)}
                      aria-label={`Move ${member.label} later`}
                    >
                      <ChevronRight className="size-3.5" aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => onRemoveMember(member.id)}
                      aria-label={`Remove ${member.label} from group`}
                    >
                      <X className="size-3.5" aria-hidden />
                    </Button>
                  </div>
                </>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Checkbox on ungrouped widgets while arranging, to pick widgets to group. */
export function GroupSelectToggle({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <label
      title={selected ? "Selected for grouping" : "Select to group with other widgets"}
      className={cn(
        "widget-no-drag absolute -top-2 -left-2 z-30 inline-grid size-5 cursor-pointer place-items-center rounded-md border bg-card shadow-sm",
        selected ? "border-primary" : "border-border",
      )}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggle}
        className="size-3 cursor-pointer accent-primary"
        aria-label={`Select ${label} for grouping`}
      />
    </label>
  );
}

/** Mini rows × columns picture of how a group's widgets will tile. */
export function TilingGlyph({ count, columns }: { count: number; columns: number }) {
  const cols = Math.max(1, Math.min(columns, count));
  const rows = Math.ceil(count / cols);
  const width = cols * 3 + (cols - 1);
  const height = rows * 3 + (rows - 1);
  return (
    <svg aria-hidden viewBox={`0 0 ${width} ${height}`} className="h-3.5 w-auto max-w-5 shrink-0">
      {Array.from({ length: count }, (_, index) => (
        <rect
          key={index}
          x={(index % cols) * 4}
          y={Math.floor(index / cols) * 4}
          width={3}
          height={3}
          rx={0.6}
          fill="currentColor"
          opacity={0.85}
        />
      ))}
    </svg>
  );
}
