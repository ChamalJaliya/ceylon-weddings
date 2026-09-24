"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowRight,
  Circle,
  Eraser,
  Grid3x3,
  Hand,
  ImageIcon,
  Maximize2,
  Minimize2,
  Minus,
  MousePointer2,
  Pencil,
  Ruler,
  Square,
  StickyNote,
  Type,
  Video,
  Magnet,
} from "lucide-react";
import type {
  Moodboard,
  MoodboardAssetUpsert,
  MoodboardTool,
} from "@ceylonweddings/contracts";
import { isAllowedMoodboardEmbedUrl, newMoodboardItemId } from "@ceylonweddings/contracts";
import { api } from "@ceylonweddings/web";
import { cn } from "@ceylonweddings/ui/utils";
import { MoodboardEngine } from "./engine";
import {
  fitMoodboardImage,
  MoodboardImageModal,
  pickMoodboardImage,
  type MoodboardImagePick,
} from "./image-modal";
import { MoodboardOptionsBar, MoodboardZoomControls } from "./options-bar";
import { MoodboardTextInspector } from "./text-inspector";
import { MoodboardToolRail } from "./tool-rail";
import { MoodboardTooltip } from "./tooltip";
import { MoodboardVideoModal } from "./video-modal";
import { useMoodboardAutosave, type AutosaveStatus } from "./use-autosave";
import { useFullscreen } from "./use-fullscreen";
import {
  createImageItem,
  createVideoItem,
  useMoodboardStore,
} from "./store";

const TOOL_GROUPS: Array<{
  label: string;
  tools: Array<{ id: MoodboardTool; label: string; icon: typeof Square; key?: string }>;
}> = [
  {
    label: "Move",
    tools: [
      { id: "select", label: "Select", icon: MousePointer2, key: "V" },
      { id: "hand", label: "Hand", icon: Hand, key: "H" },
    ],
  },
  {
    label: "Draw",
    tools: [
      { id: "rect", label: "Rectangle", icon: Square, key: "R" },
      { id: "ellipse", label: "Ellipse", icon: Circle, key: "O" },
      { id: "line", label: "Line", icon: Minus, key: "L" },
      { id: "arrow", label: "Arrow", icon: ArrowRight, key: "A" },
      { id: "path", label: "Pen", icon: Pencil, key: "P" },
    ],
  },
  {
    label: "Content",
    tools: [
      { id: "text", label: "Text", icon: Type, key: "T" },
      { id: "sticky", label: "Sticky", icon: StickyNote, key: "S" },
      { id: "image", label: "Image", icon: ImageIcon, key: "I" },
      { id: "video", label: "Video", icon: Video },
    ],
  },
  {
    label: "Edit",
    tools: [{ id: "eraser", label: "Eraser", icon: Eraser, key: "E" }],
  },
];

export type MoodboardStudioProps = {
  board: Moodboard;
  mode?: "edit" | "view";
  headerExtra?: ReactNode;
  onSaved?: (board: Moodboard) => void;
  onStatus?: (status: AutosaveStatus, message?: string) => void;
};

export function MoodboardStudio({
  board,
  mode = "edit",
  headerExtra,
  onSaved,
  onStatus,
}: MoodboardStudioProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen(rootRef);
  const [pendingAssets, setPendingAssets] = useState<MoodboardAssetUpsert[]>([]);
  const [version, setVersion] = useState(board.version);
  const [migrateNotice, setMigrateNotice] = useState(Boolean(board.migratedFromSketch));
  const [videoOpen, setVideoOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);

  const readOnly = mode === "view";
  const tool = useMoodboardStore((s) => s.tool);
  const setTool = useMoodboardStore((s) => s.setTool);
  const scene = useMoodboardStore((s) => s.scene);
  const selectedIds = useMoodboardStore((s) => s.selectedIds);
  const loadScene = useMoodboardStore((s) => s.loadScene);
  const setReadOnly = useMoodboardStore((s) => s.setReadOnly);
  const setGrid = useMoodboardStore((s) => s.setGrid);
  const setRulers = useMoodboardStore((s) => s.setRulers);
  const updateItem = useMoodboardStore((s) => s.updateItem);
  const addItem = useMoodboardStore((s) => s.addItem);
  const pasteClipboard = useMoodboardStore((s) => s.pasteClipboard);

  const allAssets = useMemo(() => {
    const map = new Map(board.assets.map((a) => [a.fileId, a]));
    for (const p of pendingAssets) {
      if (!map.has(p.fileId)) {
        map.set(p.fileId, {
          id: p.fileId,
          moodboardId: board.id,
          fileId: p.fileId,
          key: p.key,
          publicUrl: p.publicUrl,
          mimeType: p.mimeType,
        });
      }
    }
    return [...map.values()];
  }, [board.assets, board.id, pendingAssets]);

  useEffect(() => {
    loadScene(board.scene);
    setReadOnly(readOnly);
    setVersion(board.version);
    setPendingAssets(
      board.assets.map((a) => ({
        fileId: a.fileId,
        key: a.key,
        publicUrl: a.publicUrl,
        mimeType: a.mimeType,
      })),
    );
    setMigrateNotice(Boolean(board.migratedFromSketch));
  }, [board.id, board.scene, board.version, board.assets, board.migratedFromSketch, loadScene, setReadOnly, readOnly]);

  useMoodboardAutosave({
    boardId: board.id,
    version,
    assets: pendingAssets,
    enabled: !readOnly,
    onSaved: (nextVersion, nextScene) => {
      setVersion(nextVersion);
      onSaved?.({ ...board, version: nextVersion, scene: nextScene });
    },
    onStatus,
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
      if (e.metaKey || e.ctrlKey) return;
      if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        toggleFullscreen();
        return;
      }
      if (readOnly) return;
      const map: Record<string, MoodboardTool> = {
        v: "select",
        h: "hand",
        r: "rect",
        o: "ellipse",
        l: "line",
        a: "arrow",
        p: "path",
        t: "text",
        s: "sticky",
        e: "eraser",
        i: "image",
      };
      const next = map[e.key.toLowerCase()];
      if (next) {
        e.preventDefault();
        if (next === "image") {
          setTool("image");
          setImageOpen(true);
        } else setTool(next);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [readOnly, setTool, toggleFullscreen]);

  const selected = scene.items.find((i) => i.id === selectedIds[0]);

  const uploadImage = useCallback(
    async (pick: MoodboardImagePick) => {
      if (readOnly) return;
      const fileId = newMoodboardItemId();
      const contentType = pick.file.type as "image/jpeg" | "image/png" | "image/webp" | "image/gif";
      if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(contentType)) {
        onStatus?.("error", "Use JPEG, PNG, WebP, or GIF");
        return;
      }
      const presign = await api.wedding.moodboardPresign(board.id, {
        filename: pick.file.name,
        contentType,
        fileId,
      });
      await fetch(presign.uploadUrl, {
        method: "PUT",
        body: pick.file,
        headers: { "Content-Type": contentType },
      });
      setPendingAssets((prev) => [
        ...prev,
        {
          fileId,
          key: presign.key,
          publicUrl: presign.publicUrl,
          mimeType: contentType,
        },
      ]);
      const fitted = fitMoodboardImage(pick.width, pick.height);
      const cam = useMoodboardStore.getState().scene.camera;
      const x = (-cam.x + 120) / cam.zoom;
      const y = (-cam.y + 120) / cam.zoom;
      addItem(createImageItem(x, y, fitted.width, fitted.height, fileId));
      setTool("select");
    },
    [board.id, readOnly, addItem, setTool, onStatus],
  );

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if (readOnly || imageOpen || videoOpen) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
      const image = [...(e.clipboardData?.files ?? [])].find((file) =>
        ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type),
      );
      if (image) {
        e.preventDefault();
        void pickMoodboardImage(image).then((pick) => {
          if (pick) void uploadImage(pick);
          else onStatus?.("error", "Use JPEG, PNG, WebP, or GIF");
        });
        return;
      }
      if (useMoodboardStore.getState().clipboard.length > 0) {
        e.preventDefault();
        pasteClipboard();
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [readOnly, imageOpen, videoOpen, uploadImage, pasteClipboard, onStatus]);

  const insertVideo = useCallback(
    (url: string) => {
      if (readOnly) return;
      if (!isAllowedMoodboardEmbedUrl(url)) {
        onStatus?.("error", "Only YouTube or Vimeo links");
        return;
      }
      const cam = useMoodboardStore.getState().scene.camera;
      const x = (-cam.x + 140) / cam.zoom;
      const y = (-cam.y + 140) / cam.zoom;
      addItem(createVideoItem(x, y, url));
      setTool("select");
    },
    [readOnly, addItem, setTool, onStatus],
  );

  return (
    <div
      ref={rootRef}
      className={cn(
        "moodboard-studio flex h-full min-h-[36rem] flex-col overflow-hidden rounded-2xl border border-[#e8ddd0] bg-[#1f1a16] text-[#fffaf5]",
        isFullscreen && "rounded-none border-0",
      )}
    >
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-white/10 px-3 py-2">
        {headerExtra}
        <div className="ml-auto flex items-center gap-1.5">
          {!readOnly ? (
            <>
              <MoodboardTooltip label="Show grid" side="bottom">
                <button
                  type="button"
                  aria-pressed={scene.grid.enabled}
                  onClick={() => setGrid({ enabled: !scene.grid.enabled })}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs",
                    scene.grid.enabled ? "bg-[#fffaf5] text-[#1f1a16]" : "bg-white/10 hover:bg-white/15",
                  )}
                >
                  <Grid3x3 className="size-3.5" />
                  Grid
                </button>
              </MoodboardTooltip>
              <MoodboardTooltip label="Snap to grid" side="bottom">
                <button
                  type="button"
                  aria-pressed={scene.grid.snap}
                  onClick={() => setGrid({ snap: !scene.grid.snap })}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs",
                    scene.grid.snap ? "bg-[#fffaf5] text-[#1f1a16]" : "bg-white/10 hover:bg-white/15",
                  )}
                >
                  <Magnet className="size-3.5" />
                  Snap
                </button>
              </MoodboardTooltip>
              <MoodboardTooltip label="Show rulers" side="bottom">
                <button
                  type="button"
                  aria-pressed={scene.rulers}
                  onClick={() => setRulers(!scene.rulers)}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs",
                    scene.rulers ? "bg-[#fffaf5] text-[#1f1a16]" : "bg-white/10 hover:bg-white/15",
                  )}
                >
                  <Ruler className="size-3.5" />
                  Ruler
                </button>
              </MoodboardTooltip>
            </>
          ) : null}
          <MoodboardTooltip
            label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            shortcut="F"
            side="bottom"
          >
            <button
              type="button"
              onClick={() => toggleFullscreen()}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/10 px-2.5 text-xs hover:bg-white/15"
            >
              {isFullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
              {isFullscreen ? "Exit" : "Fullscreen"}
            </button>
          </MoodboardTooltip>
        </div>
      </div>

      {!readOnly ? (
        <MoodboardOptionsBar
          onUploadImage={() => setImageOpen(true)}
          onAddVideo={() => setVideoOpen(true)}
        />
      ) : (
        <div className="flex shrink-0 items-center border-b border-white/10 bg-[#17130f] px-3 py-1.5">
          <MoodboardZoomControls />
        </div>
      )}

      {migrateNotice ? (
        <div className="flex items-center justify-between gap-3 bg-[#b4532a]/90 px-3 py-2 text-xs">
          <p>This board was reset for the new editor (previous sketch tools aren’t compatible).</p>
          <button type="button" className="underline" onClick={() => setMigrateNotice(false)}>
            Dismiss
          </button>
        </div>
      ) : null}

      <div className="relative min-h-0 flex-1 bg-[#fffaf5]">
        <MoodboardEngine assets={allAssets} className="absolute inset-0" />

        {!readOnly ? (
          <MoodboardToolRail>
            {TOOL_GROUPS.map((group) => (
              <div key={group.label} className="flex flex-col items-center gap-1">
                <span className="sr-only">{group.label}</span>
                {group.tools.map((t) => {
                  const Icon = t.icon;
                  return (
                    <MoodboardTooltip key={t.id} label={t.label} shortcut={t.key} side="right">
                      <button
                        type="button"
                        aria-label={t.label}
                        aria-pressed={tool === t.id}
                        onClick={() => {
                          if (t.id === "image") {
                            setTool("image");
                            setImageOpen(true);
                          } else if (t.id === "video") {
                            setTool("video");
                            setVideoOpen(true);
                          } else {
                            setTool(t.id);
                          }
                        }}
                        className={cn(
                          "flex size-9 items-center justify-center rounded-xl transition",
                          tool === t.id
                            ? "bg-[#fffaf5] text-[#1f1a16]"
                            : "text-[#fffaf5]/75 hover:bg-white/10 hover:text-[#fffaf5]",
                        )}
                      >
                        <Icon className="size-4" />
                      </button>
                    </MoodboardTooltip>
                  );
                })}
              </div>
            ))}
          </MoodboardToolRail>
        ) : null}

        {!readOnly && selected && (selected.type === "text" || selected.type === "sticky") ? (
          <aside className="absolute top-3 right-3 z-40 max-h-[70vh] w-64 space-y-3 overflow-y-auto rounded-2xl border border-white/10 bg-[#17130f]/95 p-3 text-sm text-[#fffaf5] shadow-xl backdrop-blur-sm">
            <p className="text-xs uppercase tracking-[0.14em] text-white/45">Typography</p>
            <MoodboardTextInspector
              item={selected}
              onChange={(patch) => updateItem(selected.id, patch as never)}
            />
          </aside>
        ) : null}
      </div>

      <MoodboardImageModal
        open={imageOpen}
        onOpenChange={setImageOpen}
        onInsert={(pick) => void uploadImage(pick)}
      />
      <MoodboardVideoModal
        open={videoOpen}
        onOpenChange={setVideoOpen}
        onInsert={insertVideo}
      />
    </div>
  );
}
