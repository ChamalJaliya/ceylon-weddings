import type { WidgetLayoutItem } from "@ceylonweddings/contracts";

/**
 * Widget groups: widgets that share a `groupId` move together as one block.
 * Inside a group, members are laid out by `groupOrder` (1 first) from left to right,
 * wrapping to a new row when the group width is used up.
 *
 * On the grid a group is a single composite item keyed `group:<id>`; its first grid
 * row is the group header, members are packed underneath.
 */

export type GroupableLayoutItem = WidgetLayoutItem;
/** Grid item with react-grid-layout size bounds (group composites pin their size). */
export type GroupGridItem = GroupableLayoutItem & { minW?: number; maxW?: number; minH?: number; maxH?: number };

export const GROUP_KEY_PREFIX = "group:";
/** Grid rows reserved for the group header strip. */
export const GROUP_HEADER_ROWS = 1;

export type WidgetGroup = {
  id: string;
  name: string;
  /** Widgets per row; undefined = one row that wraps by width. */
  columns?: number;
  /** Name strip hidden on the dashboard (still shown while rearranging). */
  hideLabel?: boolean;
  /** Members sorted by precedence (groupOrder ascending). */
  members: GroupableLayoutItem[];
};

export type GroupPlacement = { i: string; dx: number; dy: number; w: number; h: number };

export type PackedGroup = {
  /** Width in grid columns. */
  w: number;
  /** Height in grid rows, including the header row. */
  h: number;
  placements: GroupPlacement[];
};

type GridRect = { i: string; x: number; y: number; w: number; h: number };

export function groupKey(groupId: string) {
  return `${GROUP_KEY_PREFIX}${groupId}`;
}

export function isGroupKey(key: string) {
  return key.startsWith(GROUP_KEY_PREFIX);
}

export function groupIdFromKey(key: string) {
  return key.slice(GROUP_KEY_PREFIX.length);
}

function byOrder(a: GroupableLayoutItem, b: GroupableLayoutItem) {
  return (a.groupOrder ?? 0) - (b.groupOrder ?? 0) || a.y - b.y || a.x - b.x;
}

/** Visible groups (2+ visible members) in first-appearance order. */
export function listGroups(items: GroupableLayoutItem[]): WidgetGroup[] {
  const map = new Map<string, WidgetGroup>();
  for (const item of items) {
    if (!item.groupId || item.visible === false) continue;
    const group = map.get(item.groupId) ?? {
      id: item.groupId,
      name: item.groupName ?? "Group",
      members: [],
    };
    group.members.push(item);
    if (item.groupName) group.name = item.groupName;
    if (item.groupColumns) group.columns = item.groupColumns;
    if (item.groupHideLabel) group.hideLabel = true;
    map.set(item.groupId, group);
  }
  return [...map.values()]
    .map((group) => ({ ...group, members: [...group.members].sort(byOrder) }))
    .filter((group) => group.members.length >= 2);
}

/**
 * Pack members left → right in precedence order inside `maxCols` columns.
 * With `columns` set, at most that many widgets share a row (2 → 2×2 for four widgets);
 * otherwise everything sits in one row and wraps only when the width runs out.
 */
export function packGroup(
  members: GroupableLayoutItem[],
  maxCols: number,
  columns = members.find((m) => m.groupColumns)?.groupColumns,
  headerRows: number = GROUP_HEADER_ROWS,
): PackedGroup {
  const perRow = columns && columns > 0 ? columns : members.length;
  // Width = widest row of `perRow` members, capped by the grid.
  let widest = 0;
  for (let i = 0; i < members.length; i += perRow) {
    widest = Math.max(
      widest,
      members.slice(i, i + perRow).reduce((sum, m) => sum + m.w, 0),
    );
  }
  const width = Math.max(1, Math.min(maxCols, widest));
  const placements: GroupPlacement[] = [];
  let cursorX = 0;
  let inRow = 0;
  let rowY = headerRows;
  let rowH = 0;
  for (const member of members) {
    const w = Math.min(member.w, width);
    if (inRow > 0 && (inRow >= perRow || cursorX + w > width)) {
      rowY += rowH;
      cursorX = 0;
      inRow = 0;
      rowH = 0;
    }
    placements.push({ i: member.i, dx: cursorX, dy: rowY, w, h: member.h });
    cursorX += w;
    inRow += 1;
    rowH = Math.max(rowH, member.h);
  }
  return { w: width, h: rowY + rowH, placements };
}

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

/**
 * Grid items for react-grid-layout: ungrouped widgets as-is, each group as one
 * non-resizable composite anchored at its top-left member.
 */
/** Header rows for a group: hidden-label groups drop the strip outside rearrange mode. */
export function groupHeaderRows(group: Pick<WidgetGroup, "hideLabel">, editing: boolean) {
  return editing || !group.hideLabel ? GROUP_HEADER_ROWS : 0;
}

export function toGridItems(
  visibleItems: GroupableLayoutItem[],
  cols: number,
  options: { editing?: boolean } = {},
): GroupGridItem[] {
  const groups = listGroups(visibleItems);
  const grouped = new Set(groups.flatMap((g) => g.members.map((m) => m.i)));
  const singles = visibleItems.filter((item) => !grouped.has(item.i));
  const composites = groups.map((group) => {
    const packed = packGroup(group.members, cols, group.columns, groupHeaderRows(group, options.editing ?? false));
    const x = Math.min(...group.members.map((m) => m.x));
    const y = Math.min(...group.members.map((m) => m.y));
    return {
      i: groupKey(group.id),
      x: Math.min(x, Math.max(0, cols - packed.w)),
      y,
      w: packed.w,
      h: packed.h,
      visible: true,
      minW: packed.w,
      maxW: packed.w,
      minH: packed.h,
      maxH: packed.h,
    } satisfies GroupGridItem;
  });
  return [...singles, ...composites];
}

/**
 * Turn a grid layout (which may contain group composites) back into per-widget
 * rectangles, placing each member relative to its group's new position.
 */
export function expandGridLayout(gridLayout: GridRect[], items: GroupableLayoutItem[], cols: number): GridRect[] {
  const groups = new Map(listGroups(items).map((g) => [g.id, g]));
  const out: GridRect[] = [];
  for (const rect of gridLayout) {
    if (!isGroupKey(rect.i)) {
      out.push(rect);
      continue;
    }
    const group = groups.get(groupIdFromKey(rect.i));
    if (!group) continue;
    // Pack without the header row: the group's anchor is its members' top-left, so a
    // header offset here would push the whole group down a row on every drag.
    const packed = packGroup(group.members, cols, group.columns, 0);
    for (const p of packed.placements) {
      out.push({ i: p.i, x: rect.x + p.dx, y: rect.y + p.dy, w: p.w, h: p.h });
    }
  }
  return out;
}

function stripGroup(item: GroupableLayoutItem): GroupableLayoutItem {
  const {
    groupId: _id,
    groupName: _name,
    groupOrder: _order,
    groupColumns: _columns,
    groupHideLabel: _hideLabel,
    ...rest
  } = item;
  return rest;
}

/** Drop group fields from groups left with fewer than two members. */
function dissolveSmallGroups(items: GroupableLayoutItem[]): GroupableLayoutItem[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    if (item.groupId) counts.set(item.groupId, (counts.get(item.groupId) ?? 0) + 1);
  }
  return items.map((item) => (item.groupId && (counts.get(item.groupId) ?? 0) < 2 ? stripGroup(item) : item));
}

export function nextGroupName(items: GroupableLayoutItem[]) {
  const taken = new Set(items.map((item) => item.groupName).filter(Boolean));
  let n = 1;
  while (taken.has(`Group ${n}`)) n += 1;
  return `Group ${n}`;
}

function newGroupId() {
  return `g${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Group the given widgets. Precedence follows their current reading order
 * (top → bottom, left → right). Widgets already in another group move to the new one.
 */
export function createGroup(
  items: GroupableLayoutItem[],
  ids: string[],
  name = nextGroupName(items),
  id = newGroupId(),
): GroupableLayoutItem[] {
  const selected = items.filter((item) => ids.includes(item.i)).sort((a, b) => a.y - b.y || a.x - b.x);
  if (selected.length < 2) return items;
  const order = new Map(selected.map((item, index) => [item.i, index + 1]));
  return dissolveSmallGroups(
    items.map((item) =>
      order.has(item.i) ? { ...item, groupId: id, groupName: name, groupOrder: order.get(item.i) } : item,
    ),
  );
}

export function ungroup(items: GroupableLayoutItem[], groupId: string): GroupableLayoutItem[] {
  return items.map((item) => (item.groupId === groupId ? stripGroup(item) : item));
}

export function removeFromGroup(items: GroupableLayoutItem[], id: string): GroupableLayoutItem[] {
  const target = items.find((item) => item.i === id);
  if (!target?.groupId) return items;
  const groupId = target.groupId;
  const next = items.map((item) => (item.i === id ? stripGroup(item) : item));
  return renumber(dissolveSmallGroups(next), groupId);
}

export function renameGroup(items: GroupableLayoutItem[], groupId: string, name: string): GroupableLayoutItem[] {
  const trimmed = name.trim().slice(0, 60);
  if (!trimmed) return items;
  return items.map((item) => (item.groupId === groupId ? { ...item, groupName: trimmed } : item));
}

/** Set widgets per row for a group (`undefined` = one row, wrap by width). */
export function setGroupColumns(
  items: GroupableLayoutItem[],
  groupId: string,
  columns: number | undefined,
): GroupableLayoutItem[] {
  return items.map((item) => {
    if (item.groupId !== groupId) return item;
    const { groupColumns: _previous, ...rest } = item;
    return columns ? { ...rest, groupColumns: columns } : rest;
  });
}

function renumber(items: GroupableLayoutItem[], groupId: string): GroupableLayoutItem[] {
  const members = items.filter((item) => item.groupId === groupId).sort(byOrder);
  const order = new Map(members.map((item, index) => [item.i, index + 1]));
  return items.map((item) => (order.has(item.i) ? { ...item, groupOrder: order.get(item.i) } : item));
}

/** Move a member earlier (-1) or later (+1) in its group's precedence. */
export function moveWithinGroup(items: GroupableLayoutItem[], id: string, delta: -1 | 1): GroupableLayoutItem[] {
  const target = items.find((item) => item.i === id);
  if (!target?.groupId) return items;
  const members = items.filter((item) => item.groupId === target.groupId).sort(byOrder);
  const index = members.findIndex((item) => item.i === id);
  const swapWith = index + delta;
  if (index < 0 || swapWith < 0 || swapWith >= members.length) return items;
  const reordered = [...members];
  [reordered[index], reordered[swapWith]] = [reordered[swapWith]!, reordered[index]!];
  const order = new Map(reordered.map((item, i) => [item.i, i + 1]));
  return items.map((item) => (order.has(item.i) ? { ...item, groupOrder: order.get(item.i) } : item));
}

/**
 * Apply only one group's changes onto the last saved layout: every widget that is in
 * the group now, or was in it when last saved, takes its current state. Everything
 * else keeps its saved state (other unsaved edits stay pending).
 */
export function mergeGroupIntoSaved(
  saved: GroupableLayoutItem[],
  current: GroupableLayoutItem[],
  groupId: string,
): GroupableLayoutItem[] {
  const ids = new Set([...saved, ...current].filter((item) => item.groupId === groupId).map((item) => item.i));
  const currentById = new Map(current.map((item) => [item.i, item]));
  return saved.map((item) => (ids.has(item.i) ? (currentById.get(item.i) ?? item) : item));
}

export type WidgetGroupSummary = {
  id: string;
  name: string;
  count: number;
  /** True when any member is on the dashboard. */
  visible: boolean;
};

/** Every group (shown or hidden) with at least two members — for show / hide lists. */
export function listGroupSummaries(items: GroupableLayoutItem[]): WidgetGroupSummary[] {
  const map = new Map<string, WidgetGroupSummary>();
  for (const item of items) {
    if (!item.groupId) continue;
    const summary = map.get(item.groupId) ?? {
      id: item.groupId,
      name: item.groupName ?? "Group",
      count: 0,
      visible: false,
    };
    summary.count += 1;
    if (item.visible !== false) summary.visible = true;
    if (item.groupName) summary.name = item.groupName;
    map.set(item.groupId, summary);
  }
  return [...map.values()].filter((summary) => summary.count >= 2);
}

/**
 * Show or hide every widget in a group. Hidden widgets keep their group, so showing the
 * group again restores it (placed below the current dashboard, members keeping their layout).
 */
export function setGroupVisible(
  items: GroupableLayoutItem[],
  groupId: string,
  visible: boolean,
): GroupableLayoutItem[] {
  if (!visible) {
    return items.map((item) => (item.groupId === groupId ? { ...item, visible: false } : item));
  }
  const members = items.filter((item) => item.groupId === groupId);
  if (members.length === 0) return items;
  const bottom = items.reduce(
    (max, item) => (item.groupId !== groupId && item.visible !== false ? Math.max(max, item.y + item.h) : max),
    0,
  );
  const top = Math.min(...members.map((m) => m.y));
  const left = Math.min(...members.map((m) => m.x));
  return items.map((item) =>
    item.groupId === groupId ? { ...item, visible: true, x: item.x - left, y: bottom + (item.y - top) } : item,
  );
}

/** Show or hide the group's name strip on the dashboard. */
export function setGroupLabelHidden(
  items: GroupableLayoutItem[],
  groupId: string,
  hidden: boolean,
): GroupableLayoutItem[] {
  return items.map((item) => {
    if (item.groupId !== groupId) return item;
    const { groupHideLabel: _previous, ...rest } = item;
    return hidden ? { ...rest, groupHideLabel: true } : rest;
  });
}

const COMPARED_FIELDS = [
  "x",
  "y",
  "w",
  "h",
  "visible",
  "emphasis",
  "groupId",
  "groupName",
  "groupOrder",
  "groupColumns",
  "groupHideLabel",
] as const;

/** True when the group (or a widget that left it) differs from the last saved layout. */
export function groupHasUnsavedChanges(
  saved: GroupableLayoutItem[] | null | undefined,
  current: GroupableLayoutItem[],
  groupId: string,
): boolean {
  if (!saved) return false;
  const ids = new Set([...saved, ...current].filter((item) => item.groupId === groupId).map((item) => item.i));
  const savedById = new Map(saved.map((item) => [item.i, item]));
  for (const item of current) {
    if (!ids.has(item.i)) continue;
    const before = savedById.get(item.i);
    if (!before) return true;
    for (const field of COMPARED_FIELDS) {
      if ((before[field] ?? null) !== (item[field] ?? null)) return true;
    }
  }
  return false;
}
