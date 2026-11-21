import { z } from "zod";

/**
 * Widget dashboards (ported from Kloqra's dashboard-layout contract).
 *
 * Every role dashboard is a grid of widgets. Each user's arrangement is saved on
 * their account (`User.preferences.dashboardLayouts[kind]`), so it follows them
 * across devices. Widgets that share a `groupId` move together as one block.
 */

export const dashboardKindSchema = z.enum(["admin", "vendor", "couple"]);
export type DashboardKind = z.infer<typeof dashboardKindSchema>;

/**
 * Grid units are integers. Clients must round before save (see `normalizeForSave`);
 * avoid `.transform()` here — Zod 4 cannot represent transforms in OpenAPI/JSON Schema.
 */
const gridUnit = z.number().nonnegative().int();
const gridSpan = z.number().int().min(1);

export const widgetEmphasisSchema = z.enum(["filled", "outline"]);
export type WidgetEmphasis = z.infer<typeof widgetEmphasisSchema>;

export const widgetLayoutItemSchema = z.object({
  /** Widget id (react-grid-layout key). */
  i: z.string().min(1).max(64),
  x: gridUnit,
  y: gridUnit,
  w: gridSpan,
  h: gridSpan,
  visible: z.boolean(),
  /** Surface highlight: soft filled wash (default) or outline only. */
  emphasis: widgetEmphasisSchema.optional(),
  /** Widgets sharing a groupId move together as one block. */
  groupId: z.string().min(1).max(64).optional(),
  /** Display name of the group (repeated on every member). */
  groupName: z.string().max(60).optional(),
  /** Precedence inside the group: 1 renders first (left), then left → right, wrapping. */
  groupOrder: z.number().int().min(1).max(100).optional(),
  /** Widgets per row inside the group (2 → 2 × 2 for four widgets). Omitted = one row. */
  groupColumns: z.number().int().min(1).max(12).optional(),
  /** Hide the group's name strip on the dashboard (it still shows while rearranging). */
  groupHideLabel: z.boolean().optional(),
});
export type WidgetLayoutItem = z.infer<typeof widgetLayoutItemSchema>;

export const widgetLayoutSchema = z.array(widgetLayoutItemSchema).max(120);

/** Saved arrangement per dashboard kind. */
export const dashboardLayoutsSchema = z.partialRecord(dashboardKindSchema, widgetLayoutSchema);
export type DashboardLayouts = z.infer<typeof dashboardLayoutsSchema>;
