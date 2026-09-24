import { z } from "zod";

const transformBase = {
  id: z.string().min(1),
  x: z.number(),
  y: z.number(),
  rotation: z.number().default(0),
  locked: z.boolean().default(false),
  zIndex: z.number().int().default(0),
};

export const moodboardShapeStyleSchema = z.object({
  fill: z.string().default("transparent"),
  stroke: z.string().default("#1f1a16"),
  strokeWidth: z.number().min(0).default(2),
  opacity: z.number().min(0).max(1).default(1),
});

const defaultShapeStyle = {
  fill: "transparent",
  stroke: "#1f1a16",
  strokeWidth: 2,
  opacity: 1,
};

export const moodboardRectItemSchema = z.object({
  ...transformBase,
  type: z.literal("rect"),
  width: z.number(),
  height: z.number(),
  cornerRadius: z.number().default(0),
  style: moodboardShapeStyleSchema.default(defaultShapeStyle),
});

export const moodboardEllipseItemSchema = z.object({
  ...transformBase,
  type: z.literal("ellipse"),
  width: z.number(),
  height: z.number(),
  style: moodboardShapeStyleSchema.default(defaultShapeStyle),
});

export const moodboardLineItemSchema = z.object({
  ...transformBase,
  type: z.literal("line"),
  points: z.array(z.number()).min(4),
  style: moodboardShapeStyleSchema.default(defaultShapeStyle),
});

export const moodboardArrowItemSchema = z.object({
  ...transformBase,
  type: z.literal("arrow"),
  points: z.array(z.number()).min(4),
  style: moodboardShapeStyleSchema.default(defaultShapeStyle),
});

export const moodboardPathItemSchema = z.object({
  ...transformBase,
  type: z.literal("path"),
  points: z.array(z.number()).min(2),
  stroke: z.string().default("#1f1a16"),
  strokeWidth: z.number().default(3),
  opacity: z.number().min(0).max(1).default(1),
});

export const moodboardFontIdSchema = z.enum([
  "display",
  "serif",
  "sans",
  "mono",
  "script",
]);
export type MoodboardFontId = z.infer<typeof moodboardFontIdSchema>;

/** Real family names (Konva/canvas cannot resolve CSS `var()`). */
export const MOODBOARD_FONTS: Record<
  MoodboardFontId,
  { label: string; stack: string; sample: string }
> = {
  display: {
    label: "Display",
    sample: "Aa Cormorant",
    stack: '"Cormorant Garamond", Georgia, "Times New Roman", serif',
  },
  serif: {
    label: "Serif",
    sample: "Aa Source Serif",
    stack: '"Source Serif 4", Georgia, "Times New Roman", serif',
  },
  sans: {
    label: "Sans",
    sample: "Aa Geist",
    stack: 'Geist, ui-sans-serif, system-ui, sans-serif',
  },
  mono: {
    label: "Mono",
    sample: "Aa Mono",
    stack: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
  script: {
    label: "Script",
    sample: "Aa Script",
    stack: '"Great Vibes", "Snell Roundhand", "Apple Chancery", cursive',
  },
};

export const MOODBOARD_TEXT_COLORS = [
  "#1f1a16",
  "#5c4a3a",
  "#b4532a",
  "#8b3a4a",
  "#2f5d50",
  "#3d5a80",
  "#fffaf5",
  "#c4a574",
] as const;

export const moodboardFontSizePresets = [12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 64] as const;

export const moodboardTextItemSchema = z.object({
  ...transformBase,
  type: z.literal("text"),
  width: z.number().default(220),
  height: z.number().default(80),
  text: z.string().default("Text"),
  fontSize: z.number().default(18),
  fontFamily: moodboardFontIdSchema.default("display"),
  fill: z.string().default("#1f1a16"),
  align: z.enum(["left", "center", "right"]).default("left"),
  bold: z.boolean().default(false),
  italic: z.boolean().default(false),
  underline: z.boolean().default(false),
});

export const moodboardStickyItemSchema = z.object({
  ...transformBase,
  type: z.literal("sticky"),
  width: z.number().default(200),
  height: z.number().default(200),
  text: z.string().default(""),
  fontSize: z.number().default(16),
  fontFamily: moodboardFontIdSchema.default("sans"),
  fill: z.string().default("#f5e6c8"),
  textColor: z.string().default("#1f1a16"),
  align: z.enum(["left", "center", "right"]).default("left"),
  bold: z.boolean().default(false),
  italic: z.boolean().default(false),
  underline: z.boolean().default(false),
});

export const moodboardImageItemSchema = z.object({
  ...transformBase,
  type: z.literal("image"),
  width: z.number(),
  height: z.number(),
  assetId: z.string().min(1),
  naturalW: z.number().optional(),
  naturalH: z.number().optional(),
});

export const moodboardVideoItemSchema = z.object({
  ...transformBase,
  type: z.literal("video"),
  width: z.number().default(480),
  height: z.number().default(270),
  url: z.string().url(),
});

export const moodboardFrameItemSchema = z.object({
  ...transformBase,
  type: z.literal("frame"),
  width: z.number(),
  height: z.number(),
  label: z.string().optional(),
  stroke: z.string().default("#c4a574"),
});

export const moodboardItemSchema = z.discriminatedUnion("type", [
  moodboardRectItemSchema,
  moodboardEllipseItemSchema,
  moodboardLineItemSchema,
  moodboardArrowItemSchema,
  moodboardPathItemSchema,
  moodboardTextItemSchema,
  moodboardStickyItemSchema,
  moodboardImageItemSchema,
  moodboardVideoItemSchema,
  moodboardFrameItemSchema,
]);
export type MoodboardItem = z.infer<typeof moodboardItemSchema>;

export const moodboardCameraSchema = z.object({
  x: z.number().default(0),
  y: z.number().default(0),
  zoom: z.number().min(0.1).max(8).default(1),
});

export const moodboardGridSchema = z.object({
  enabled: z.boolean().default(false),
  size: z.number().int().min(4).max(200).default(20),
  snap: z.boolean().default(true),
});

/** Production scene — typed items (v2). Binary images live in MoodboardAsset. */
export const moodboardSceneSchema = z.object({
  v: z.literal(2),
  camera: moodboardCameraSchema.default({ x: 0, y: 0, zoom: 1 }),
  grid: moodboardGridSchema.default({ enabled: false, size: 20, snap: true }),
  rulers: z.boolean().default(false),
  background: z.string().default("#fffaf5"),
  items: z.array(moodboardItemSchema).default([]),
});
export type MoodboardScene = z.infer<typeof moodboardSceneSchema>;

export const moodboardAssetSchema = z.object({
  id: z.string(),
  moodboardId: z.string(),
  fileId: z.string(),
  key: z.string(),
  publicUrl: z.string(),
  mimeType: z.string(),
  createdAt: z.string().optional(),
});
export type MoodboardAsset = z.infer<typeof moodboardAssetSchema>;

export const moodboardAssetUpsertSchema = z.object({
  fileId: z.string().min(1),
  key: z.string().min(1),
  publicUrl: z.string().url(),
  mimeType: z.string().min(1),
});
export type MoodboardAssetUpsert = z.infer<typeof moodboardAssetUpsertSchema>;

export const moodboardSummarySchema = z.object({
  id: z.string(),
  weddingId: z.string(),
  title: z.string(),
  eventId: z.string().nullable(),
  eventName: z.string().nullable().optional(),
  notes: z.string().nullable(),
  version: z.number().int(),
  shareToken: z.string().nullable().optional(),
  shareEnabled: z.boolean(),
  sortOrder: z.number().int(),
  elementCount: z.number().int(),
  assetCount: z.number().int(),
  ready: z.boolean(),
  updatedAt: z.string().optional(),
  createdAt: z.string().optional(),
});
export type MoodboardSummary = z.infer<typeof moodboardSummarySchema>;

export const moodboardSummaryListSchema = z.array(moodboardSummarySchema);
export type MoodboardSummaryList = z.infer<typeof moodboardSummaryListSchema>;

export const moodboardSchema = z.object({
  id: z.string(),
  weddingId: z.string(),
  title: z.string(),
  eventId: z.string().nullable(),
  eventName: z.string().nullable().optional(),
  notes: z.string().nullable(),
  scene: moodboardSceneSchema,
  version: z.number().int(),
  shareToken: z.string().nullable().optional(),
  shareEnabled: z.boolean(),
  sortOrder: z.number().int(),
  assets: z.array(moodboardAssetSchema),
  elementCount: z.number().int().optional(),
  ready: z.boolean().optional(),
  migratedFromSketch: z.boolean().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type Moodboard = z.infer<typeof moodboardSchema>;

export const createMoodboardBodySchema = z.object({
  title: z.string().min(1).max(120).default("Style"),
  eventId: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});
export type CreateMoodboardBody = z.infer<typeof createMoodboardBodySchema>;

export const updateMoodboardMetaBodySchema = z.object({
  title: z.string().min(1).max(120).optional(),
  eventId: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
});
export type UpdateMoodboardMetaBody = z.infer<typeof updateMoodboardMetaBodySchema>;

export const saveMoodboardSceneBodySchema = z.object({
  scene: moodboardSceneSchema,
  assets: z.array(moodboardAssetUpsertSchema).default([]),
  expectedVersion: z.number().int().min(1),
});
export type SaveMoodboardSceneBody = z.infer<typeof saveMoodboardSceneBodySchema>;

export const setMoodboardShareBodySchema = z.object({
  enabled: z.boolean(),
  rotate: z.boolean().optional(),
});
export type SetMoodboardShareBody = z.infer<typeof setMoodboardShareBodySchema>;

export const MOODBOARD_IMAGE_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const MOODBOARD_IMAGE_MAX_BYTES = 10 * 1024 * 1024;

export const moodboardPresignBodySchema = z.object({
  filename: z.string().min(1),
  contentType: z.enum(MOODBOARD_IMAGE_CONTENT_TYPES),
  fileId: z.string().min(1),
});
export type MoodboardPresignBody = z.infer<typeof moodboardPresignBodySchema>;

export const moodboardPresignResponseSchema = z.object({
  uploadUrl: z.string(),
  key: z.string(),
  publicUrl: z.string(),
  fileId: z.string(),
});
export type MoodboardPresignResponse = z.infer<typeof moodboardPresignResponseSchema>;

export const moodboardBriefSchema = z.object({
  title: z.string(),
  notes: z.string().nullable(),
  eventName: z.string().nullable(),
  coupleLabel: z.string().nullable(),
  scene: moodboardSceneSchema,
  assets: z.array(
    z.object({
      fileId: z.string(),
      publicUrl: z.string(),
      mimeType: z.string(),
    }),
  ),
  migratedFromSketch: z.boolean().optional(),
});
export type MoodboardBrief = z.infer<typeof moodboardBriefSchema>;

export const MOODBOARD_EMBED_HOSTS = [
  "youtube.com",
  "www.youtube.com",
  "youtu.be",
  "www.youtu.be",
  "vimeo.com",
  "www.vimeo.com",
  "player.vimeo.com",
] as const;

export type MoodboardTool =
  | "select"
  | "hand"
  | "rect"
  | "ellipse"
  | "line"
  | "arrow"
  | "path"
  | "text"
  | "sticky"
  | "image"
  | "video"
  | "eraser";

export function emptyMoodboardScene(): MoodboardScene {
  return {
    v: 2,
    camera: { x: 0, y: 0, zoom: 1 },
    grid: { enabled: false, size: 20, snap: true },
    rulers: false,
    background: "#fffaf5",
    items: [],
  };
}

export function moodboardElementCount(scene: MoodboardScene | unknown): number {
  if (!scene || typeof scene !== "object") return 0;
  const items = (scene as { items?: unknown }).items;
  if (Array.isArray(items)) return items.length;
  // Legacy Excalidraw sketch scenes
  const elements = (scene as { elements?: unknown }).elements;
  if (!Array.isArray(elements)) return 0;
  return elements.filter((el) => {
    if (!el || typeof el !== "object") return false;
    return !(el as { isDeleted?: boolean }).isDeleted;
  }).length;
}

export function moodboardHasContent(scene: MoodboardScene | unknown): boolean {
  return moodboardElementCount(scene) >= 1;
}

export function moodboardReady(input: { elementCount: number }): boolean {
  return input.elementCount >= 1;
}

export function isAllowedMoodboardEmbedUrl(link: string): boolean {
  try {
    const url = new URL(link);
    const host = url.hostname.toLowerCase();
    return MOODBOARD_EMBED_HOSTS.some(
      (allowed) => host === allowed || host.endsWith(`.${allowed.replace(/^www\./, "")}`),
    );
  } catch {
    return false;
  }
}

export function isMoodboardSceneV2(raw: unknown): boolean {
  return Boolean(raw && typeof raw === "object" && (raw as { v?: number }).v === 2);
}

/**
 * Normalize scene to v2. Legacy Excalidraw blobs are reset to empty v2
 * (lossy by design — sketch phase discarded).
 */
export function sanitizeMoodboardScene(raw: unknown): MoodboardScene {
  return migrateMoodboardScene(raw).scene;
}

export function migrateMoodboardScene(raw: unknown): {
  scene: MoodboardScene;
  migratedFromSketch: boolean;
} {
  if (isMoodboardSceneV2(raw)) {
    const parsed = moodboardSceneSchema.safeParse(raw);
    if (parsed.success) return { scene: parsed.data, migratedFromSketch: false };
    return { scene: emptyMoodboardScene(), migratedFromSketch: false };
  }
  const legacy =
    Boolean(raw && typeof raw === "object") &&
    ("elements" in (raw as object) || "appState" in (raw as object));
  return { scene: emptyMoodboardScene(), migratedFromSketch: legacy };
}

export function moodboardFontStack(fontId: MoodboardFontId | string | undefined): string {
  if (fontId && fontId in MOODBOARD_FONTS) {
    return MOODBOARD_FONTS[fontId as MoodboardFontId].stack;
  }
  return MOODBOARD_FONTS.display.stack;
}

export function moodboardKonvaFontStyle(bold?: boolean, italic?: boolean): string {
  if (bold && italic) return "italic bold";
  if (bold) return "bold";
  if (italic) return "italic";
  return "normal";
}

export function moodboardVideoThumbUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace("/", "").split("?")[0];
      return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
    }
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v") ?? u.pathname.split("/").filter(Boolean).pop();
      return id && id !== "embed" && id !== "watch" ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
    }
  } catch {
    return null;
  }
  return null;
}

export function youtubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
      const parts = u.pathname.split("/");
      const embedIdx = parts.indexOf("embed");
      if (embedIdx >= 0 && parts[embedIdx + 1]) {
        return `https://www.youtube.com/embed/${parts[embedIdx + 1]}`;
      }
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch {
    return null;
  }
  return null;
}

export function newMoodboardItemId(): string {
  return `mb_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}
