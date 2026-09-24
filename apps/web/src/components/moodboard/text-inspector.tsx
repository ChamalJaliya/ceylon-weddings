"use client";

import type { ReactNode } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Underline,
} from "lucide-react";
import {
  MOODBOARD_FONTS,
  MOODBOARD_TEXT_COLORS,
  moodboardFontSizePresets,
  moodboardFontStack,
  type MoodboardFontId,
  type MoodboardItem,
} from "@ceylonweddings/contracts";
import { Input } from "@ceylonweddings/ui/components/input";
import { Label } from "@ceylonweddings/ui/components/label";
import { cn } from "@ceylonweddings/ui/utils";

type TextLike =
  | Extract<MoodboardItem, { type: "text" }>
  | Extract<MoodboardItem, { type: "sticky" }>;

const SIZE_CHIPS = moodboardFontSizePresets.filter((size) =>
  [14, 18, 24, 32, 48, 64].includes(size),
);

function Toggle({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex size-8 items-center justify-center rounded-lg transition",
        active ? "bg-[#fffaf5] text-[#1f1a16]" : "bg-white/10 text-[#fffaf5]/80 hover:bg-white/15",
      )}
    >
      {children}
    </button>
  );
}

export function MoodboardTextInspector({
  item,
  onChange,
}: {
  item: TextLike;
  onChange: (patch: Partial<TextLike>) => void;
}) {
  const color = item.type === "text" ? item.fill : item.textColor;
  const fontFamily = item.fontFamily ?? (item.type === "sticky" ? "sans" : "display");
  const setColor = (next: string) =>
    item.type === "text" ? onChange({ fill: next }) : onChange({ textColor: next });

  return (
    <div className="space-y-3">

      <div className="space-y-1.5">
        <Label className="text-white/60">Font</Label>
        <div className="grid grid-cols-1 gap-1">
          {(Object.keys(MOODBOARD_FONTS) as MoodboardFontId[]).map((id) => {
            const font = MOODBOARD_FONTS[id];
            const active = fontFamily === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={active}
                onClick={() => onChange({ fontFamily: id })}
                className={cn(
                  "flex items-center justify-between rounded-lg px-2.5 py-1.5 text-left transition",
                  active
                    ? "bg-[#fffaf5] text-[#1f1a16]"
                    : "bg-white/5 text-[#fffaf5]/85 hover:bg-white/10",
                )}
              >
                <span className="text-[11px] tracking-wide uppercase opacity-60">{font.label}</span>
                <span className="text-base leading-none" style={{ fontFamily: moodboardFontStack(id) }}>
                  {font.sample}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-white/60">Size</Label>
        <div className="flex flex-wrap gap-1">
          {SIZE_CHIPS.map((size) => (
            <button
              key={size}
              type="button"
              aria-pressed={item.fontSize === size}
              onClick={() => onChange({ fontSize: size })}
              className={cn(
                "h-7 min-w-8 rounded-md px-1.5 text-xs tabular-nums transition",
                item.fontSize === size
                  ? "bg-[#fffaf5] text-[#1f1a16]"
                  : "bg-white/10 text-[#fffaf5]/80 hover:bg-white/15",
              )}
            >
              {size}
            </button>
          ))}
        </div>
        <Input
          type="number"
          min={10}
          max={120}
          value={item.fontSize}
          aria-label="Custom font size"
          className="h-8 border-white/15 bg-white/5 text-[#fffaf5]"
          onChange={(e) =>
            onChange({ fontSize: Math.min(120, Math.max(10, Number(e.target.value) || 16)) })
          }
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-white/60">{item.type === "sticky" ? "Text color" : "Color"}</Label>
        <div className="flex flex-wrap gap-1.5">
          {MOODBOARD_TEXT_COLORS.map((swatch) => (
            <button
              key={swatch}
              type="button"
              title={swatch}
              aria-label={`Color ${swatch}`}
              aria-pressed={color?.toLowerCase() === swatch}
              onClick={() => setColor(swatch)}
              className={cn(
                "size-7 rounded-full border-2 transition",
                color?.toLowerCase() === swatch ? "border-[#fffaf5]" : "border-transparent",
              )}
              style={{ backgroundColor: swatch }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="color"
            value={color?.startsWith("#") ? color : "#1f1a16"}
            className="h-8 w-12 border-white/10 bg-transparent p-1"
            onChange={(e) => setColor(e.target.value)}
          />
          <Input
            value={color}
            className="h-8 flex-1 border-white/15 bg-white/5 font-mono text-xs text-[#fffaf5]"
            onChange={(e) => setColor(e.target.value)}
          />
        </div>
      </div>

      {item.type === "sticky" ? (
        <div className="space-y-1.5">
          <Label className="text-white/60">Sticky color</Label>
          <div className="flex flex-wrap gap-1.5">
            {["#f5e6c8", "#f8d9d0", "#d9e8df", "#dde4f0", "#efe6f5", "#fffaf5"].map((swatch) => (
              <button
                key={swatch}
                type="button"
                title={swatch}
                aria-label={`Sticky ${swatch}`}
                aria-pressed={item.fill.toLowerCase() === swatch}
                onClick={() => onChange({ fill: swatch })}
                className={cn(
                  "size-7 rounded-full border-2 transition",
                  item.fill.toLowerCase() === swatch ? "border-[#fffaf5]" : "border-white/20",
                )}
                style={{ backgroundColor: swatch }}
              />
            ))}
          </div>
          <Input
            type="color"
            value={item.fill.startsWith("#") ? item.fill : "#f5e6c8"}
            className="h-8 border-white/10 bg-transparent p-1"
            onChange={(e) => onChange({ fill: e.target.value })}
          />
        </div>
      ) : null}

      <div className="space-y-1">
        <Label className="text-white/60">Style</Label>
        <div className="flex flex-wrap gap-1.5">
          <Toggle active={Boolean(item.bold)} label="Bold" onClick={() => onChange({ bold: !item.bold })}>
            <Bold className="size-3.5" />
          </Toggle>
          <Toggle
            active={Boolean(item.italic)}
            label="Italic"
            onClick={() => onChange({ italic: !item.italic })}
          >
            <Italic className="size-3.5" />
          </Toggle>
          <Toggle
            active={Boolean(item.underline)}
            label="Underline"
            onClick={() => onChange({ underline: !item.underline })}
          >
            <Underline className="size-3.5" />
          </Toggle>
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-white/60">Align</Label>
        <div className="flex gap-1.5">
          {(
            [
              ["left", AlignLeft],
              ["center", AlignCenter],
              ["right", AlignRight],
            ] as const
          ).map(([align, Icon]) => (
            <Toggle
              key={align}
              active={(item.align ?? "left") === align}
              label={`Align ${align}`}
              onClick={() => onChange({ align })}
            >
              <Icon className="size-3.5" />
            </Toggle>
          ))}
        </div>
      </div>
    </div>
  );
}
