// Run: pnpm test -- packages/web/src/dashboard
import { test } from "node:test";
import assert from "node:assert/strict";
import type { WidgetLayoutItem } from "@ceylonweddings/contracts";
import {
  createGroup,
  expandGridLayout,
  groupHasUnsavedChanges,
  listGroups,
  mergeGroupIntoSaved,
  moveWithinGroup,
  packGroup,
  removeFromGroup,
  setGroupVisible,
  toGridItems,
  ungroup,
} from "./widget-groups";
import {
  applyGridPositions,
  mergeLayoutWithRegistry,
  normalizeForSave,
  toggleWidgetVisibility,
  type WidgetSizing,
} from "./layout-model";
import { generateResponsiveLayouts } from "./responsive-layouts";

const item = (
  i: string,
  x: number,
  y: number,
  w = 3,
  h = 3,
  extra: Partial<WidgetLayoutItem> = {},
): WidgetLayoutItem => ({
  i,
  x,
  y,
  w,
  h,
  visible: true,
  ...extra,
});

const kpis = [item("a", 0, 0), item("b", 3, 0), item("c", 6, 0), item("d", 9, 0)];

test("createGroup orders members by reading order and needs two widgets", () => {
  const grouped = createGroup(kpis, ["c", "a", "b"], "At a glance", "g1");
  const group = listGroups(grouped)[0]!;
  assert.equal(group.name, "At a glance");
  assert.deepEqual(
    group.members.map((m) => m.i),
    ["a", "b", "c"],
  );
  assert.deepEqual(createGroup(kpis, ["a"]), kpis);
});

test("packGroup lays members left to right and wraps by columns", () => {
  const grouped = createGroup(kpis, ["a", "b", "c", "d"], "G", "g1");
  const members = listGroups(grouped)[0]!.members;
  const oneRow = packGroup(members, 12);
  assert.equal(oneRow.w, 12);
  assert.equal(oneRow.h, 1 + 3);
  const twoByTwo = packGroup(members, 12, 2);
  assert.equal(twoByTwo.w, 6);
  assert.equal(twoByTwo.h, 1 + 6);
  assert.deepEqual(
    twoByTwo.placements.map((p) => [p.dx, p.dy]),
    [
      [0, 1],
      [3, 1],
      [0, 4],
      [3, 4],
    ],
  );
});

test("toGridItems turns a group into one fixed-size composite", () => {
  const grouped = createGroup([...kpis, item("chart", 0, 3, 8, 10)], ["a", "b", "c", "d"], "G", "g1");
  const grid = toGridItems(grouped, 12);
  assert.equal(grid.length, 2);
  const composite = grid.find((g) => g.i === "group:g1")!;
  assert.equal(composite.minW, composite.maxW);
  assert.equal(composite.minH, composite.maxH);
});

test("expanding a dragged group keeps members at the group's top (no row drift)", () => {
  const grouped = createGroup(kpis, ["a", "b", "c", "d"], "G", "g1");
  const moved = expandGridLayout([{ i: "group:g1", x: 0, y: 5, w: 12, h: 4 }], grouped, 12);
  assert.ok(moved.every((rect) => rect.y === 5));
  assert.deepEqual(
    moved.map((rect) => rect.x),
    [0, 3, 6, 9],
  );
});

test("moveWithinGroup / removeFromGroup / ungroup", () => {
  const grouped = createGroup(kpis, ["a", "b", "c"], "G", "g1");
  const swapped = moveWithinGroup(grouped, "a", 1);
  assert.deepEqual(
    listGroups(swapped)[0]!.members.map((m) => m.i),
    ["b", "a", "c"],
  );
  const removed = removeFromGroup(grouped, "b");
  assert.deepEqual(
    listGroups(removed)[0]!.members.map((m) => m.i),
    ["a", "c"],
  );
  // Dropping to one member dissolves the group.
  assert.equal(listGroups(removeFromGroup(removed, "a")).length, 0);
  assert.ok(ungroup(grouped, "g1").every((m) => !m.groupId));
});

test("hidden groups come back below the dashboard with their shape", () => {
  const grouped = createGroup([...kpis, item("chart", 0, 3, 12, 10)], ["a", "b"], "G", "g1");
  const hidden = setGroupVisible(grouped, "g1", false);
  assert.equal(listGroups(hidden).length, 0);
  const shown = setGroupVisible(hidden, "g1", true);
  const members = shown.filter((m) => m.groupId === "g1");
  assert.ok(members.every((m) => m.visible && m.y === 13));
});

test("saving one group leaves other pending edits out", () => {
  const saved = createGroup(kpis, ["a", "b"], "G", "g1");
  const current = moveWithinGroup(saved, "a", 1).map((m) => (m.i === "d" ? { ...m, x: 0 } : m));
  assert.ok(groupHasUnsavedChanges(saved, current, "g1"));
  const merged = mergeGroupIntoSaved(saved, current, "g1");
  assert.equal(merged.find((m) => m.i === "d")!.x, 9);
  assert.equal(merged.find((m) => m.i === "a")!.groupOrder, 2);
});

const registry: WidgetSizing[] = [
  { id: "a", defaultVisible: true, defaultSize: { w: 3, h: 3 }, minSize: { w: 2, h: 3 } },
  { id: "b", defaultVisible: true, defaultSize: { w: 3, h: 3 } },
  { id: "new", defaultVisible: true, defaultSize: { w: 6, h: 8 } },
];

test("merge drops unknown widgets, keeps saved state, places new widgets on a free row", () => {
  const saved = [item("a", 0, 0, 1, 1, { emphasis: "outline" }), item("b", 3, 0), item("gone", 6, 0)];
  const defaults = [item("a", 0, 0), item("b", 3, 0), item("new", 0, 0, 6, 8)];
  const merged = mergeLayoutWithRegistry(saved, registry, defaults);
  assert.deepEqual(
    merged.map((m) => m.i),
    ["a", "b", "new"],
  );
  assert.deepEqual([merged[0]!.w, merged[0]!.h, merged[0]!.emphasis], [2, 3, "outline"]);
  // Default slot (0,0) is taken, so the new widget moves to the next free row.
  assert.deepEqual([merged[2]!.x, merged[2]!.y], [0, 3]);
});

test("merge with nothing saved uses the default layout", () => {
  const defaults = [item("a", 0, 0), item("b", 3, 0), item("new", 0, 3, 6, 8, { visible: false })];
  assert.deepEqual(mergeLayoutWithRegistry(null, registry, defaults), defaults);
});

test("toggle shows a widget at the bottom and hides it in place", () => {
  const layout = [item("a", 0, 0), item("b", 3, 0, 3, 3, { visible: false })];
  const shown = toggleWidgetVisibility(layout, "b", registry);
  assert.deepEqual([shown[1]!.visible, shown[1]!.x, shown[1]!.y], [true, 0, 3]);
  const hidden = toggleWidgetVisibility(shown, "a", registry);
  assert.equal(hidden[0]!.visible, false);
});

test("grid positions are clamped to registry sizes and rounded for save", () => {
  const moved = applyGridPositions([item("a", 0, 0)], [{ i: "a", x: 2.4, y: 1.6, w: 1, h: 1 }], registry);
  assert.deepEqual([moved[0]!.w, moved[0]!.h], [2, 3]);
  assert.deepEqual(
    normalizeForSave(moved).map((m) => [m.x, m.y]),
    [[2, 2]],
  );
});

test("phones stack every widget full width; desktop keeps positions", () => {
  const layouts = generateResponsiveLayouts([item("a", 6, 0), item("b", 0, 0)]);
  assert.deepEqual(
    layouts.lg.map((m) => m.x),
    [6, 0],
  );
  assert.deepEqual(
    layouts.xs.map((m) => [m.i, m.x, m.y, m.w]),
    [
      ["b", 0, 0, 4],
      ["a", 0, 3, 4],
    ],
  );
});
