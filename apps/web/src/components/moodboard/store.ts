"use client";

import { create } from "zustand";
import {
  emptyMoodboardScene,
  newMoodboardItemId,
  type MoodboardItem,
  type MoodboardScene,
  type MoodboardTool,
} from "@ceylonweddings/contracts";

const MAX_HISTORY = 50;

function cloneScene(scene: MoodboardScene): MoodboardScene {
  return structuredClone(scene);
}

function nextZ(items: MoodboardItem[]): number {
  return items.reduce((max, item) => Math.max(max, item.zIndex ?? 0), 0) + 1;
}

export type MoodboardToolStyle = {
  fill: string;
  stroke: string;
  strokeWidth: number;
  textFill: string;
  stickyFill: string;
  fontSize: number;
  cornerRadius: number;
};

export const DEFAULT_TOOL_STYLE: MoodboardToolStyle = {
  fill: "#f5e6c8",
  stroke: "#1f1a16",
  strokeWidth: 2,
  textFill: "#1f1a16",
  stickyFill: "#f5e6c8",
  fontSize: 24,
  cornerRadius: 4,
};

const PASTE_OFFSET = 24;
const MIN_ZOOM = 0.15;
const MAX_ZOOM = 8;

function itemBounds(item: MoodboardItem): { x: number; y: number; w: number; h: number } {
  if ("width" in item && "height" in item && typeof item.width === "number") {
    return { x: item.x, y: item.y, w: item.width, h: item.height };
  }
  if ("points" in item && Array.isArray(item.points) && item.points.length >= 2) {
    const xs = item.points.filter((_, i) => i % 2 === 0);
    const ys = item.points.filter((_, i) => i % 2 === 1);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);
    return { x: item.x + minX, y: item.y + minY, w: Math.max(1, maxX - minX), h: Math.max(1, maxY - minY) };
  }
  return { x: item.x, y: item.y, w: 1, h: 1 };
}

function cloneOffsetItem(item: MoodboardItem, dx: number, dy: number): MoodboardItem {
  const copy = structuredClone(item);
  copy.id = newMoodboardItemId();
  copy.x += dx;
  copy.y += dy;
  copy.locked = false;
  return copy;
}

type MoodboardStore = {
  scene: MoodboardScene;
  selectedIds: string[];
  tool: MoodboardTool;
  toolStyle: MoodboardToolStyle;
  readOnly: boolean;
  editingTextId: string | null;
  history: MoodboardScene[];
  future: MoodboardScene[];
  dirty: boolean;
  clipboard: MoodboardItem[];
  pasteCount: number;
  viewport: { width: number; height: number };
  previewVideoId: string | null;
  setReadOnly: (value: boolean) => void;
  setPreviewVideo: (id: string | null) => void;
  loadScene: (scene: MoodboardScene) => void;
  setTool: (tool: MoodboardTool) => void;
  setToolStyle: (patch: Partial<MoodboardToolStyle>) => void;
  setSelected: (ids: string[]) => void;
  setEditingText: (id: string | null) => void;
  setViewport: (width: number, height: number) => void;
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  updateCamera: (camera: Partial<MoodboardScene["camera"]>) => void;
  setGrid: (grid: Partial<MoodboardScene["grid"]>) => void;
  setRulers: (enabled: boolean) => void;
  addItem: (item: MoodboardItem) => void;
  updateItem: (id: string, patch: Partial<MoodboardItem>) => void;
  deleteSelected: () => void;
  bringForward: () => void;
  sendBackward: () => void;
  copySelected: () => void;
  pasteClipboard: () => void;
  duplicateSelected: () => void;
  nudgeSelected: (dx: number, dy: number) => void;
  zoomBy: (factor: number) => void;
  zoomTo: (zoom: number) => void;
  fitToContent: () => void;
  markClean: () => void;
  snap: (value: number) => number;
};

export const useMoodboardStore = create<MoodboardStore>((set, get) => ({
  scene: emptyMoodboardScene(),
  selectedIds: [],
  tool: "select",
  toolStyle: { ...DEFAULT_TOOL_STYLE },
  readOnly: false,
  editingTextId: null,
  history: [],
  future: [],
  dirty: false,
  clipboard: [],
  pasteCount: 0,
  viewport: { width: 800, height: 600 },
  previewVideoId: null,

  setReadOnly: (value) => set({ readOnly: value }),

  setViewport: (width, height) => set({ viewport: { width, height } }),

  setPreviewVideo: (id) => set({ previewVideoId: id }),

  loadScene: (scene) =>
    set({
      scene: cloneScene(scene),
      selectedIds: [],
      editingTextId: null,
      history: [],
      future: [],
      dirty: false,
      tool: "select",
      previewVideoId: null,
    }),

  setTool: (tool) =>
    set({
      tool,
      selectedIds: tool === "select" ? get().selectedIds : [],
      previewVideoId: null,
    }),

  setToolStyle: (patch) =>
    set((state) => ({
      toolStyle: { ...state.toolStyle, ...patch },
    })),

  setSelected: (ids) =>
    set((state) => ({
      selectedIds: ids,
      previewVideoId: state.previewVideoId && ids.includes(state.previewVideoId) ? state.previewVideoId : null,
    })),

  setEditingText: (id) => set({ editingTextId: id }),

  pushHistory: () => {
    const { scene, history } = get();
    set({
      history: [...history.slice(-(MAX_HISTORY - 1)), cloneScene(scene)],
      future: [],
    });
  },

  undo: () => {
    const { history, scene, future, readOnly } = get();
    if (readOnly || history.length === 0) return;
    const prev = history[history.length - 1]!;
    set({
      scene: prev,
      history: history.slice(0, -1),
      future: [cloneScene(scene), ...future].slice(0, MAX_HISTORY),
      dirty: true,
      selectedIds: [],
    });
  },

  redo: () => {
    const { future, scene, history, readOnly } = get();
    if (readOnly || future.length === 0) return;
    const next = future[0]!;
    set({
      scene: next,
      future: future.slice(1),
      history: [...history, cloneScene(scene)].slice(-MAX_HISTORY),
      dirty: true,
      selectedIds: [],
    });
  },

  updateCamera: (camera) =>
    set((state) => ({
      scene: { ...state.scene, camera: { ...state.scene.camera, ...camera } },
      dirty: true,
    })),

  setGrid: (grid) =>
    set((state) => ({
      scene: { ...state.scene, grid: { ...state.scene.grid, ...grid } },
      dirty: true,
    })),

  setRulers: (enabled) =>
    set((state) => ({
      scene: { ...state.scene, rulers: enabled },
      dirty: true,
    })),

  addItem: (item) => {
    get().pushHistory();
    set((state) => ({
      scene: {
        ...state.scene,
        items: [...state.scene.items, { ...item, zIndex: item.zIndex || nextZ(state.scene.items) }],
      },
      selectedIds: [item.id],
      dirty: true,
    }));
  },

  updateItem: (id, patch) => {
    set((state) => ({
      scene: {
        ...state.scene,
        items: state.scene.items.map((item) =>
          item.id === id ? ({ ...item, ...patch } as MoodboardItem) : item,
        ),
      },
      dirty: true,
    }));
  },

  deleteSelected: () => {
    const { selectedIds, readOnly } = get();
    if (readOnly || selectedIds.length === 0) return;
    get().pushHistory();
    set((state) => ({
      scene: {
        ...state.scene,
        items: state.scene.items.filter((item) => !selectedIds.includes(item.id)),
      },
      selectedIds: [],
      editingTextId: null,
      previewVideoId: null,
      dirty: true,
    }));
  },

  bringForward: () => {
    const { selectedIds } = get();
    if (selectedIds.length === 0) return;
    get().pushHistory();
    set((state) => ({
      scene: {
        ...state.scene,
        items: state.scene.items.map((item) =>
          selectedIds.includes(item.id) ? { ...item, zIndex: (item.zIndex ?? 0) + 1 } : item,
        ),
      },
      dirty: true,
    }));
  },

  sendBackward: () => {
    const { selectedIds } = get();
    if (selectedIds.length === 0) return;
    get().pushHistory();
    set((state) => ({
      scene: {
        ...state.scene,
        items: state.scene.items.map((item) =>
          selectedIds.includes(item.id)
            ? { ...item, zIndex: Math.max(0, (item.zIndex ?? 0) - 1) }
            : item,
        ),
      },
      dirty: true,
    }));
  },

  copySelected: () => {
    const { selectedIds, scene } = get();
    if (selectedIds.length === 0) return;
    const items = scene.items.filter((item) => selectedIds.includes(item.id)).map((item) => structuredClone(item));
    set({ clipboard: items, pasteCount: 0 });
  },

  pasteClipboard: () => {
    const { clipboard, readOnly, scene } = get();
    if (readOnly || clipboard.length === 0) return;
    const step = PASTE_OFFSET * (get().pasteCount + 1);
    let z = nextZ(scene.items);
    const copies = clipboard.map((item) => {
      const copy = cloneOffsetItem(item, step, step);
      copy.zIndex = z++;
      return copy;
    });
    get().pushHistory();
    set((state) => ({
      scene: { ...state.scene, items: [...state.scene.items, ...copies] },
      selectedIds: copies.map((item) => item.id),
      pasteCount: state.pasteCount + 1,
      dirty: true,
      tool: "select",
    }));
  },

  duplicateSelected: () => {
    const { selectedIds, scene, readOnly } = get();
    if (readOnly || selectedIds.length === 0) return;
    let z = nextZ(scene.items);
    const copies = scene.items
      .filter((item) => selectedIds.includes(item.id))
      .map((item) => {
        const copy = cloneOffsetItem(item, PASTE_OFFSET, PASTE_OFFSET);
        copy.zIndex = z++;
        return copy;
      });
    get().pushHistory();
    set((state) => ({
      scene: { ...state.scene, items: [...state.scene.items, ...copies] },
      selectedIds: copies.map((item) => item.id),
      dirty: true,
      tool: "select",
    }));
  },

  nudgeSelected: (dx, dy) => {
    const { selectedIds, readOnly } = get();
    if (readOnly || selectedIds.length === 0) return;
    get().pushHistory();
    set((state) => ({
      scene: {
        ...state.scene,
        items: state.scene.items.map((item) =>
          selectedIds.includes(item.id) && !item.locked
            ? { ...item, x: item.x + dx, y: item.y + dy }
            : item,
        ),
      },
      dirty: true,
    }));
  },

  zoomBy: (factor) => {
    const { scene, viewport } = get();
    const oldZoom = scene.camera.zoom;
    const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, oldZoom * factor));
    const cx = viewport.width / 2;
    const cy = viewport.height / 2;
    const worldX = (cx - scene.camera.x) / oldZoom;
    const worldY = (cy - scene.camera.y) / oldZoom;
    set((state) => ({
      scene: {
        ...state.scene,
        camera: { zoom, x: cx - worldX * zoom, y: cy - worldY * zoom },
      },
    }));
  },

  zoomTo: (nextZoom) => {
    const { scene, viewport } = get();
    const oldZoom = scene.camera.zoom;
    const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoom));
    const cx = viewport.width / 2;
    const cy = viewport.height / 2;
    const worldX = (cx - scene.camera.x) / oldZoom;
    const worldY = (cy - scene.camera.y) / oldZoom;
    set((state) => ({
      scene: {
        ...state.scene,
        camera: { zoom, x: cx - worldX * zoom, y: cy - worldY * zoom },
      },
    }));
  },

  fitToContent: () => {
    const { scene, viewport } = get();
    const pad = 64;
    const bounds = scene.items.map(itemBounds);
    if (bounds.length === 0) {
      set((state) => ({
        scene: { ...state.scene, camera: { x: 0, y: 0, zoom: 1 } },
      }));
      return;
    }
    const minX = Math.min(...bounds.map((b) => b.x));
    const minY = Math.min(...bounds.map((b) => b.y));
    const maxX = Math.max(...bounds.map((b) => b.x + b.w));
    const maxY = Math.max(...bounds.map((b) => b.y + b.h));
    const w = Math.max(1, maxX - minX);
    const h = Math.max(1, maxY - minY);
    const zoom = Math.min(
      MAX_ZOOM,
      Math.max(MIN_ZOOM, Math.min((viewport.width - pad * 2) / w, (viewport.height - pad * 2) / h)),
    );
    const cx = minX + w / 2;
    const cy = minY + h / 2;
    set((state) => ({
      scene: {
        ...state.scene,
        camera: {
          zoom,
          x: viewport.width / 2 - cx * zoom,
          y: viewport.height / 2 - cy * zoom,
        },
      },
    }));
  },

  markClean: () => set({ dirty: false }),

  snap: (value) => {
    const { scene } = get();
    if (!scene.grid.enabled || !scene.grid.snap) return value;
    const size = scene.grid.size || 20;
    return Math.round(value / size) * size;
  },
}));

export function createRectItem(
  x: number,
  y: number,
  width: number,
  height: number,
  style: Pick<MoodboardToolStyle, "fill" | "stroke" | "strokeWidth" | "cornerRadius"> = DEFAULT_TOOL_STYLE,
): MoodboardItem {
  return {
    id: newMoodboardItemId(),
    type: "rect",
    x,
    y,
    width: Math.max(8, width),
    height: Math.max(8, height),
    rotation: 0,
    locked: false,
    zIndex: 0,
    cornerRadius: style.cornerRadius,
    style: {
      fill: style.fill,
      stroke: style.stroke,
      strokeWidth: style.strokeWidth,
      opacity: 1,
    },
  };
}

export function createEllipseItem(
  x: number,
  y: number,
  width: number,
  height: number,
  style: Pick<MoodboardToolStyle, "fill" | "stroke" | "strokeWidth"> = DEFAULT_TOOL_STYLE,
): MoodboardItem {
  return {
    id: newMoodboardItemId(),
    type: "ellipse",
    x,
    y,
    width: Math.max(8, width),
    height: Math.max(8, height),
    rotation: 0,
    locked: false,
    zIndex: 0,
    style: {
      fill: style.fill,
      stroke: style.stroke,
      strokeWidth: style.strokeWidth,
      opacity: 1,
    },
  };
}

export function createLineItem(
  points: number[],
  arrow = false,
  style: Pick<MoodboardToolStyle, "stroke" | "strokeWidth"> = DEFAULT_TOOL_STYLE,
): MoodboardItem {
  return {
    id: newMoodboardItemId(),
    type: arrow ? "arrow" : "line",
    x: 0,
    y: 0,
    points,
    rotation: 0,
    locked: false,
    zIndex: 0,
    style: {
      fill: "transparent",
      stroke: style.stroke,
      strokeWidth: style.strokeWidth,
      opacity: 1,
    },
  };
}

export function createPathItem(
  points: number[],
  style: Pick<MoodboardToolStyle, "stroke" | "strokeWidth"> = DEFAULT_TOOL_STYLE,
): MoodboardItem {
  return {
    id: newMoodboardItemId(),
    type: "path",
    x: 0,
    y: 0,
    points,
    rotation: 0,
    locked: false,
    zIndex: 0,
    stroke: style.stroke,
    strokeWidth: Math.max(1, style.strokeWidth + 1),
    opacity: 1,
  };
}

export function createTextItem(
  x: number,
  y: number,
  sticky = false,
  style: Pick<MoodboardToolStyle, "textFill" | "stickyFill" | "fontSize"> = DEFAULT_TOOL_STYLE,
): MoodboardItem {
  if (sticky) {
    return {
      id: newMoodboardItemId(),
      type: "sticky",
      x,
      y,
      width: 200,
      height: 200,
      text: "Note",
      fontSize: Math.min(style.fontSize, 18),
      fontFamily: "sans",
      fill: style.stickyFill,
      textColor: style.textFill,
      align: "left",
      bold: false,
      italic: false,
      underline: false,
      rotation: 0,
      locked: false,
      zIndex: 0,
    };
  }
  return {
    id: newMoodboardItemId(),
    type: "text",
    x,
    y,
    width: 240,
    height: 90,
    text: "Add a note",
    fontSize: style.fontSize,
    fontFamily: "display",
    fill: style.textFill,
    align: "left",
    bold: false,
    italic: false,
    underline: false,
    rotation: 0,
    locked: false,
    zIndex: 0,
  };
}

export function createImageItem(
  x: number,
  y: number,
  width: number,
  height: number,
  assetId: string,
): MoodboardItem {
  return {
    id: newMoodboardItemId(),
    type: "image",
    x,
    y,
    width,
    height,
    assetId,
    naturalW: width,
    naturalH: height,
    rotation: 0,
    locked: false,
    zIndex: 0,
  };
}

export function createVideoItem(x: number, y: number, url: string): MoodboardItem {
  return {
    id: newMoodboardItemId(),
    type: "video",
    x,
    y,
    width: 480,
    height: 270,
    url,
    rotation: 0,
    locked: false,
    zIndex: 0,
  };
}
