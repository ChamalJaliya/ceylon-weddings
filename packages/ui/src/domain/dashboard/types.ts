import type { IconComponent } from "../../contracts/icon";

/** Picture shown for a widget in the "Add or remove widgets" catalog. */
export type WidgetPreviewKind =
  "stat" | "area" | "bars" | "donut" | "list" | "progress" | "ring" | "media" | "calendar";

/** A widget a dashboard offers. Size units are grid columns (12) × rows (32px). */
export type WidgetDefinition<Category extends string = string> = {
  id: string;
  label: string;
  /** Plain-language explanation (catalog + info tooltip). */
  description: string;
  category: Category;
  icon: IconComponent;
  preview: WidgetPreviewKind;
  /** KPI tiles render bare (the card is the surface) and hide the shell title. */
  kpi?: boolean;
  /** Edge-to-edge body (cover photos). */
  flush?: boolean;
  defaultVisible: boolean;
  defaultSize: { w: number; h: number };
  minSize: { w: number; h: number };
  maxSize?: { w: number; h: number };
};

export type WidgetCategory<Category extends string = string> = { value: Category; label: string };
