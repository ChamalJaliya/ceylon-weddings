"use client";

import type { ReactNode } from "react";
import {
  Bold,
  BringToFront,
  Copy,
  CopyPlus,
  Italic,
  Maximize,
  Minus,
  Play,
  Plus,
  Redo2,
  SendToBack,
  Trash2,
  Underline,
  Undo2,
} from "lucide-react";
import { MOODBOARD_TEXT_COLORS, type MoodboardItem, type MoodboardTool } from "@ceylonweddings/contracts";
import { cn } from "@ceylonweddings/ui/utils";
import { MoodboardTooltip } from "./tooltip";
import { useMoodboardStore, type MoodboardToolStyle } from "./store";

const TOOL_META: Record<MoodboardTool, { label: string; hint: string }> = {
  select: { label: "Move", hint: "Select and transform objects" },
  hand: { label: "Hand", hint: "Drag the canvas to pan" },
  rect: { label: "Rectangle", hint: "Click and drag to draw" },
  ellipse: { label: "Ellipse", hint: "Click and drag to draw" },
  line: { label: "Line", hint: "Click and drag to draw" },
  arrow: { label: "Arrow", hint: "Click and drag to draw" },
  path: { label: "Pen", hint: "Draw freehand paths" },
  text: { label: "Text", hint: "Click the board to place text" },
  sticky: { label: "Sticky", hint: "Click the board to place a note" },
  image: { label: "Image", hint: "Upload a photo to the board" },
  video: { label: "Video", hint: "Embed YouTube or Vimeo" },
  eraser: { label: "Eraser", hint: "Click an object to delete it" },
};

const WIDTH_PRESETS = [1, 2, 3, 5, 8] as const;
const SIZE_PRESETS = [14, 18, 24, 32, 48] as const;
const RADIUS_PRESETS = [
  { value: 0, label: "Square" },
  { value: 4, label: "Soft" },
  { value: 12, label: "Round" },
  { value: 28, label: "Pill" },
] as const;
const FILL_SWATCHES = ["#f5e6c8", "#f8d9d0", "#d9e8df", "#dde4f0", "#efe6f5", "#fffaf5", "#1f1a16"] as const;

function hexColor(value: string | undefined, fallback: string) {
  if (!value || value === "transparent") return fallback;
  if (/^#[0-9a-fA-F]{6}$/.test(value)) return value;
  if (/^#[0-9a-fA-F]{3}$/.test(value)) {
    const r = value[1]!;
    const g = value[2]!;
    const b = value[3]!;
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return fallback;
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex h-11 shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2.5">
      <span className="w-11 shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">
        {label}
      </span>
      <div className="flex items-center gap-1.5">{children}</div>
    </div>
  );
}

function IconBtn({
  active,
  label,
  onClick,
  children,
}: {
  active?: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <MoodboardTooltip label={label} side="bottom">
      <button
        type="button"
        aria-label={label}
        aria-pressed={active}
        onClick={onClick}
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-lg text-xs transition",
          active ? "bg-[#fffaf5] text-[#1f1a16]" : "text-[#fffaf5]/85 hover:bg-white/10",
        )}
      >
        {children}
      </button>
    </MoodboardTooltip>
  );
}

function ColorWell({
  value,
  empty,
  onChange,
  label,
}: {
  value: string | undefined;
  empty?: boolean;
  onChange: (value: string) => void;
  label: string;
}) {
  const isEmpty = empty || value === "transparent" || !value;
  const picker = hexColor(value, "#f5e6c8");
  return (
    <label className="relative size-8 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-white/20 bg-[#2a241f]">
      <span
        className="absolute inset-0"
        style={
          isEmpty
            ? {
                background:
                  "linear-gradient(45deg, #8a8178 25%, transparent 25%), linear-gradient(-45deg, #8a8178 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #8a8178 75%), linear-gradient(-45deg, transparent 75%, #8a8178 75%)",
                backgroundSize: "8px 8px",
                backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0",
                backgroundColor: "#fffaf5",
              }
            : { backgroundColor: picker }
        }
      />
      <input
        type="color"
        aria-label={label}
        value={picker}
        className="absolute inset-0 cursor-pointer opacity-0"
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function Swatches({
  colors,
  current,
  onPick,
}: {
  colors: readonly string[];
  current?: string;
  onPick: (color: string) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          aria-label={color}
          aria-pressed={current?.toLowerCase() === color}
          onClick={() => onPick(color)}
          className={cn(
            "size-5 rounded-full border transition",
            current?.toLowerCase() === color ? "border-[#fffaf5] ring-1 ring-[#fffaf5]/40" : "border-white/20",
          )}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}

function WeightPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex overflow-hidden rounded-lg bg-black/25">
      {WIDTH_PRESETS.map((w) => (
        <button
          key={w}
          type="button"
          aria-label={`${w}px`}
          aria-pressed={value === w}
          onClick={() => onChange(w)}
          className={cn(
            "flex h-8 w-8 items-center justify-center transition",
            value === w ? "bg-[#fffaf5] text-[#1f1a16]" : "text-[#fffaf5]/80 hover:bg-white/10",
          )}
        >
          <span className="block w-4 rounded-full bg-current" style={{ height: Math.max(1, w) }} />
        </button>
      ))}
    </div>
  );
}

function SelectionActions() {
  const bringForward = useMoodboardStore((s) => s.bringForward);
  const sendBackward = useMoodboardStore((s) => s.sendBackward);
  const deleteSelected = useMoodboardStore((s) => s.deleteSelected);
  const duplicateSelected = useMoodboardStore((s) => s.duplicateSelected);
  const copySelected = useMoodboardStore((s) => s.copySelected);

  return (
    <Group label="Edit">
      <IconBtn label="Duplicate (⌘D)" onClick={duplicateSelected}>
        <CopyPlus className="size-3.5" />
      </IconBtn>
      <IconBtn label="Copy (⌘C)" onClick={copySelected}>
        <Copy className="size-3.5" />
      </IconBtn>
      <IconBtn label="Bring forward" onClick={bringForward}>
        <BringToFront className="size-3.5" />
      </IconBtn>
      <IconBtn label="Send backward" onClick={sendBackward}>
        <SendToBack className="size-3.5" />
      </IconBtn>
      <IconBtn label="Delete" onClick={deleteSelected}>
        <Trash2 className="size-3.5 text-red-300" />
      </IconBtn>
    </Group>
  );
}

export function MoodboardZoomControls() {
  const zoom = useMoodboardStore((s) => s.scene.camera.zoom);
  const zoomBy = useMoodboardStore((s) => s.zoomBy);
  const zoomTo = useMoodboardStore((s) => s.zoomTo);
  const fitToContent = useMoodboardStore((s) => s.fitToContent);
  const percent = Math.round(zoom * 100);

  return (
    <div className="ml-auto flex shrink-0 items-center gap-1">
      <IconBtn label="Zoom out (⌘−)" onClick={() => zoomBy(1 / 1.15)}>
        <Minus className="size-3.5" />
      </IconBtn>
      <button
        type="button"
        title="Reset to 100%"
        onClick={() => zoomTo(1)}
        className="inline-flex h-8 min-w-12 items-center justify-center rounded-lg text-xs tabular-nums text-[#fffaf5]/90 hover:bg-white/10"
      >
        {percent}%
      </button>
      <IconBtn label="Zoom in (⌘+)" onClick={() => zoomBy(1.15)}>
        <Plus className="size-3.5" />
      </IconBtn>
      <IconBtn label="Fit to content (⇧⌘0)" onClick={fitToContent}>
        <Maximize className="size-3.5" />
      </IconBtn>
    </div>
  );
}

function patchSelectedStyle(
  selected: MoodboardItem,
  updateItem: (id: string, patch: Partial<MoodboardItem>) => void,
  stylePatch: { fill?: string; stroke?: string; strokeWidth?: number },
) {
  if ("style" in selected && selected.style) {
    const next = { ...selected.style };
    if (stylePatch.fill !== undefined) next.fill = stylePatch.fill;
    if (stylePatch.stroke !== undefined) next.stroke = stylePatch.stroke;
    if (stylePatch.strokeWidth !== undefined) next.strokeWidth = stylePatch.strokeWidth;
    updateItem(selected.id, { style: next } as never);
    return;
  }
  if (selected.type === "path") {
    updateItem(selected.id, {
      ...(stylePatch.stroke !== undefined ? { stroke: stylePatch.stroke } : {}),
      ...(stylePatch.strokeWidth !== undefined ? { strokeWidth: stylePatch.strokeWidth } : {}),
    } as never);
  }
}

export function MoodboardOptionsBar({
  onUploadImage,
  onAddVideo,
}: {
  onUploadImage?: () => void;
  onAddVideo?: () => void;
}) {
  const tool = useMoodboardStore((s) => s.tool);
  const toolStyle = useMoodboardStore((s) => s.toolStyle);
  const setToolStyle = useMoodboardStore((s) => s.setToolStyle);
  const scene = useMoodboardStore((s) => s.scene);
  const selectedIds = useMoodboardStore((s) => s.selectedIds);
  const updateItem = useMoodboardStore((s) => s.updateItem);
  const undo = useMoodboardStore((s) => s.undo);
  const redo = useMoodboardStore((s) => s.redo);
  const historyLen = useMoodboardStore((s) => s.history.length);
  const futureLen = useMoodboardStore((s) => s.future.length);
  const previewVideoId = useMoodboardStore((s) => s.previewVideoId);
  const setPreviewVideo = useMoodboardStore((s) => s.setPreviewVideo);

  const selected = scene.items.find((i) => i.id === selectedIds[0]);
  const meta = TOOL_META[tool];
  const editingSelection = tool === "select" && Boolean(selected);
  const kind = editingSelection && selected ? selected.type : tool;

  const apply = (patch: Partial<MoodboardToolStyle>) => {
    setToolStyle(patch);
    if (!selected) return;

    if (selected.type === "rect" || selected.type === "ellipse") {
      patchSelectedStyle(selected, updateItem, {
        fill: patch.fill,
        stroke: patch.stroke,
        strokeWidth: patch.strokeWidth,
      });
      if (selected.type === "rect" && patch.cornerRadius !== undefined) {
        updateItem(selected.id, { cornerRadius: patch.cornerRadius } as never);
      }
    } else if (selected.type === "line" || selected.type === "arrow" || selected.type === "path") {
      patchSelectedStyle(selected, updateItem, {
        stroke: patch.stroke,
        strokeWidth: patch.strokeWidth,
      });
    } else if (selected.type === "text") {
      updateItem(selected.id, {
        ...(patch.textFill != null ? { fill: patch.textFill } : {}),
        ...(patch.fontSize != null ? { fontSize: patch.fontSize } : {}),
      } as never);
    } else if (selected.type === "sticky") {
      updateItem(selected.id, {
        ...(patch.stickyFill != null ? { fill: patch.stickyFill } : {}),
        ...(patch.textFill != null ? { textColor: patch.textFill } : {}),
        ...(patch.fontSize != null ? { fontSize: patch.fontSize } : {}),
      } as never);
    }
  };

  const liveFill =
    selected && "style" in selected && selected.style ? selected.style.fill : toolStyle.fill;
  const liveStroke =
    selected?.type === "path"
      ? selected.stroke
      : selected && "style" in selected && selected.style
        ? selected.style.stroke
        : toolStyle.stroke;
  const liveWidth =
    selected?.type === "path"
      ? selected.strokeWidth
      : selected && "style" in selected && selected.style
        ? (selected.style.strokeWidth ?? toolStyle.strokeWidth)
        : toolStyle.strokeWidth;
  const liveRadius = selected?.type === "rect" ? selected.cornerRadius : toolStyle.cornerRadius;
  const noFill = !liveFill || liveFill === "transparent";

  const showFill = kind === "rect" || kind === "ellipse";
  const showStroke =
    kind === "rect" || kind === "ellipse" || kind === "line" || kind === "arrow" || kind === "path";
  const showRadius = kind === "rect";
  const showText = kind === "text" || kind === "sticky";

  return (
    <div className="flex shrink-0 items-center gap-2 overflow-x-auto border-b border-white/10 bg-[#17130f] px-3 py-2">
      <div className="flex min-w-[8.5rem] shrink-0 flex-col justify-center">
        <span className="text-xs font-medium text-[#fffaf5]">{meta.label}</span>
        <span className="text-[11px] text-white/40">{meta.hint}</span>
      </div>

      <Group label="History">
        <IconBtn label="Undo (⌘Z)" onClick={undo}>
          <Undo2 className={cn("size-3.5", historyLen === 0 && "opacity-35")} />
        </IconBtn>
        <IconBtn label="Redo (⇧⌘Z)" onClick={redo}>
          <Redo2 className={cn("size-3.5", futureLen === 0 && "opacity-35")} />
        </IconBtn>
      </Group>

      {showFill ? (
        <Group label="Fill">
          <ColorWell label="Fill color" value={liveFill} empty={noFill} onChange={(fill) => apply({ fill })} />
          <Swatches colors={FILL_SWATCHES} current={noFill ? undefined : liveFill} onPick={(fill) => apply({ fill })} />
          <button
            type="button"
            aria-pressed={noFill}
            onClick={() => apply({ fill: "transparent" })}
            className={cn(
              "h-7 rounded-md px-2 text-[10px] font-medium uppercase tracking-wide",
              noFill ? "bg-[#fffaf5] text-[#1f1a16]" : "text-[#fffaf5]/65 hover:bg-white/10",
            )}
          >
            None
          </button>
        </Group>
      ) : null}

      {showStroke ? (
        <Group label="Stroke">
          <ColorWell
            label="Stroke color"
            value={liveStroke}
            onChange={(stroke) => apply({ stroke })}
          />
          <Swatches
            colors={MOODBOARD_TEXT_COLORS}
            current={liveStroke}
            onPick={(stroke) => apply({ stroke })}
          />
          <WeightPicker value={liveWidth} onChange={(strokeWidth) => apply({ strokeWidth })} />
        </Group>
      ) : null}

      {showRadius ? (
        <Group label="Corners">
          {RADIUS_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              aria-pressed={liveRadius === preset.value}
              onClick={() => apply({ cornerRadius: preset.value })}
              className={cn(
                "h-7 rounded-md px-2 text-[11px]",
                liveRadius === preset.value
                  ? "bg-[#fffaf5] text-[#1f1a16]"
                  : "text-[#fffaf5]/75 hover:bg-white/10",
              )}
            >
              {preset.label}
            </button>
          ))}
        </Group>
      ) : null}

      {showText ? (
        <>
          {kind === "sticky" ? (
            <Group label="Note">
              <ColorWell
                label="Sticky color"
                value={
                  selected?.type === "sticky" ? selected.fill : toolStyle.stickyFill
                }
                onChange={(stickyFill) => apply({ stickyFill })}
              />
            </Group>
          ) : null}
          <Group label="Text">
            <ColorWell
              label="Text color"
              value={
                selected?.type === "text"
                  ? selected.fill
                  : selected?.type === "sticky"
                    ? selected.textColor
                    : toolStyle.textFill
              }
              onChange={(textFill) => apply({ textFill })}
            />
            <div className="flex overflow-hidden rounded-lg bg-black/25">
              {SIZE_PRESETS.map((size) => {
                const current =
                  selected?.type === "text" || selected?.type === "sticky"
                    ? selected.fontSize
                    : toolStyle.fontSize;
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => apply({ fontSize: size })}
                    className={cn(
                      "h-8 min-w-8 px-1.5 text-[11px] tabular-nums",
                      current === size ? "bg-[#fffaf5] text-[#1f1a16]" : "text-[#fffaf5]/80 hover:bg-white/10",
                    )}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
            {selected && (selected.type === "text" || selected.type === "sticky") ? (
              <div className="flex items-center gap-0.5">
                <IconBtn
                  label="Bold"
                  active={Boolean(selected.bold)}
                  onClick={() => updateItem(selected.id, { bold: !selected.bold } as never)}
                >
                  <Bold className="size-3.5" />
                </IconBtn>
                <IconBtn
                  label="Italic"
                  active={Boolean(selected.italic)}
                  onClick={() => updateItem(selected.id, { italic: !selected.italic } as never)}
                >
                  <Italic className="size-3.5" />
                </IconBtn>
                <IconBtn
                  label="Underline"
                  active={Boolean(selected.underline)}
                  onClick={() => updateItem(selected.id, { underline: !selected.underline } as never)}
                >
                  <Underline className="size-3.5" />
                </IconBtn>
              </div>
            ) : null}
          </Group>
        </>
      ) : null}

      {tool === "image" && onUploadImage ? (
        <Group label="Image">
          <button
            type="button"
            onClick={onUploadImage}
            className="h-8 rounded-lg bg-[#fffaf5] px-3 text-xs font-medium text-[#1f1a16]"
          >
            Upload image
          </button>
        </Group>
      ) : null}

      {tool === "video" && onAddVideo ? (
        <Group label="Video">
          <button
            type="button"
            onClick={onAddVideo}
            className="h-8 rounded-lg bg-[#fffaf5] px-3 text-xs font-medium text-[#1f1a16]"
          >
            Paste video URL
          </button>
        </Group>
      ) : null}

      {editingSelection && selected?.type === "video" ? (
        <Group label="Video">
          <button
            type="button"
            onClick={() => setPreviewVideo(previewVideoId === selected.id ? null : selected.id)}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#fffaf5] px-3 text-xs font-medium text-[#1f1a16]"
          >
            <Play className="size-3.5" />
            {previewVideoId === selected.id ? "Done" : "Play"}
          </button>
          <span className="text-[11px] text-white/45">Drag corners to resize</span>
        </Group>
      ) : null}

      {kind === "image" && editingSelection ? (
        <Group label="Image">
          <span className="text-[11px] text-white/45">Drag to move · corners to resize</span>
        </Group>
      ) : null}

      {tool === "eraser" ? (
        <Group label="Eraser">
          <span className="text-[11px] text-white/55">Click any object to remove it</span>
        </Group>
      ) : null}

      {tool === "hand" ? (
        <Group label="Hand">
          <span className="text-[11px] text-white/55">Drag the canvas · hold Space anytime</span>
        </Group>
      ) : null}

      {editingSelection ? <SelectionActions /> : null}

      <MoodboardZoomControls />
    </div>
  );
}
