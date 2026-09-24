"use client";

import { useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Copy, Trash2, Upload } from "lucide-react";
import { api } from "@ceylonweddings/web";
import {
  DECORATION_KINDS,
  DECORATION_SLOTS,
  ONBOARDING_ASSET_CONTENT_TYPES,
  STAGE_MAX_BLOCKS,
  type DecorationBlock,
  type DecorationKind,
  type DecorationSlot,
  type LocalizedString,
} from "@ceylonweddings/contracts";
import { Badge } from "@ceylonweddings/ui/components/badge";
import { Button } from "@ceylonweddings/ui/components/button";
import { Input } from "@ceylonweddings/ui/components/input";
import { Switch } from "@ceylonweddings/ui/components/switch";
import { Textarea } from "@ceylonweddings/ui/components/textarea";
import { ANIMATED_ICON_NAMES, StageIconPreview } from "@ceylonweddings/ui/domain/decoration-block";
import { OnboardingStage } from "@ceylonweddings/ui/domain/onboarding-stage";
import { cn } from "@ceylonweddings/ui/utils";
import { toStageView } from "../../../../../../../lib/onboarding-stage";

const SLOT_LABEL: Record<DecorationSlot, string> = {
  LEFT: "Left",
  RIGHT: "Right",
  TOP: "Top",
  BOTTOM: "Bottom",
};

const KIND_LABEL: Record<DecorationKind, string> = {
  TEXT: "Text",
  ICON: "Animated icon",
  IMAGE: "Image",
  LOTTIE: "Lottie",
  VIDEO: "Video",
};

const ACCEPT_BY_KIND: Record<"IMAGE" | "LOTTIE" | "VIDEO", string> = {
  IMAGE: "image/jpeg,image/png,image/webp,image/gif",
  LOTTIE: "application/json,.json,.lottie",
  VIDEO: "video/mp4,video/webm",
};

function blockId() {
  return `blk_${Math.random().toString(36).slice(2, 10)}`;
}

function text(value: string): LocalizedString | null {
  const trimmed = value.trim();
  return trimmed ? { en: trimmed } : null;
}

function newBlock(kind: DecorationKind, slot: DecorationSlot, sortOrder: number): DecorationBlock {
  const base = {
    id: blockId(),
    slot,
    sortOrder,
    align: "CENTER" as const,
    maxWidthPx: null,
    hideOn: [],
    entrance: "FADE" as const,
    delayMs: 0,
  };
  switch (kind) {
    case "TEXT":
      return { ...base, kind: "TEXT", heading: { en: "Heading" }, body: null, tone: "DEFAULT" };
    case "ICON":
      return { ...base, kind: "ICON", iconName: "Sparkles", label: null, size: "LG", motion: "LOOP" };
    case "IMAGE":
      return { ...base, kind: "IMAGE", src: "", alt: null, fit: "COVER", rounded: true, aspect: null };
    case "LOTTIE":
      return { ...base, kind: "LOTTIE", src: "", loop: true, autoplay: true, speed: 1 };
    case "VIDEO":
      return { ...base, kind: "VIDEO", src: "", poster: null, loop: true, autoplay: true };
  }
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[12px] font-medium tracking-[0.01em] text-foreground/75">{label}</span>
      {children}
    </label>
  );
}

function Select<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: readonly T[];
  onChange: (next: T) => void;
}) {
  return (
    <select
      className="rounded-lg border border-border/70 bg-background px-3 py-2 text-sm"
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

/**
 * Authoring surface for the decorations rendered around the centered onboarding
 * question card. Works for both the per-question stage and the vendor type default.
 */
export function StageEditor({
  blocks,
  onChange,
  inherit,
  onInheritChange,
  previewTitle,
  disabled,
}: {
  blocks: DecorationBlock[];
  onChange: (next: DecorationBlock[]) => void;
  /** Omit to hide the inheritance switch (vendor type level has nothing to inherit). */
  inherit?: boolean;
  onInheritChange?: (next: boolean) => void;
  previewTitle: string;
  disabled?: boolean;
}) {
  const [slot, setSlot] = useState<DecorationSlot>("LEFT");
  const [openId, setOpenId] = useState<string | null>(null);
  const [previewMobile, setPreviewMobile] = useState(false);

  const slotBlocks = useMemo(
    () => blocks.filter((block) => block.slot === slot).sort((a, b) => a.sortOrder - b.sortOrder),
    [blocks, slot],
  );

  const stagePreview = useMemo(() => toStageView({ version: 1, blocks }, "en"), [blocks]);

  function replace(id: string, next: DecorationBlock) {
    onChange(blocks.map((block) => (block.id === id ? next : block)));
  }

  function add(kind: DecorationKind) {
    if (blocks.length >= STAGE_MAX_BLOCKS) return;
    const created = newBlock(kind, slot, slotBlocks.length);
    onChange([...blocks, created]);
    setOpenId(created.id);
  }

  function remove(id: string) {
    onChange(blocks.filter((block) => block.id !== id));
    if (openId === id) setOpenId(null);
  }

  function duplicate(block: DecorationBlock) {
    const copy = { ...block, id: blockId(), sortOrder: block.sortOrder + 1 };
    onChange([...blocks, copy]);
    setOpenId(copy.id);
  }

  function move(block: DecorationBlock, direction: -1 | 1) {
    const ordered = [...slotBlocks];
    const index = ordered.findIndex((item) => item.id === block.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ordered.length) return;
    const [removed] = ordered.splice(index, 1);
    ordered.splice(target, 0, removed!);
    const reordered = ordered.map((item, i) => ({ ...item, sortOrder: i }));
    const byId = new Map(reordered.map((item) => [item.id, item]));
    onChange(blocks.map((item) => byId.get(item.id) ?? item));
  }

  return (
    <div className="grid gap-4 rounded-xl border border-border/60 bg-muted/20 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Screen decoration</p>
          <p className="text-xs text-muted-foreground">
            Text, icons, and media placed around the centered question card.
          </p>
        </div>
        <Badge intent="outline">
          {blocks.length} / {STAGE_MAX_BLOCKS}
        </Badge>
      </div>

      {onInheritChange ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background px-3 py-2">
          <div className="min-w-0">
            <p className="text-sm font-medium">Inherit category defaults</p>
            <p className="text-xs text-muted-foreground">
              Merge with the decorations set on this vendor type instead of replacing them.
            </p>
          </div>
          <Switch
            checked={inherit ?? true}
            onCheckedChange={onInheritChange}
            disabled={disabled}
          />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-1.5">
        {DECORATION_SLOTS.map((option) => {
          const count = blocks.filter((block) => block.slot === option).length;
          return (
            <button
              key={option}
              type="button"
              onClick={() => setSlot(option)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition",
                slot === option
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border/60 text-muted-foreground hover:text-foreground",
              )}
            >
              {SLOT_LABEL[option]}
              {count ? <span className="text-[10px] text-primary">{count}</span> : null}
            </button>
          );
        })}
      </div>

      <div className="grid gap-2">
        {slotBlocks.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border/60 px-3 py-4 text-center text-xs text-muted-foreground">
            Nothing on the {SLOT_LABEL[slot].toLowerCase()} yet.
          </p>
        ) : null}

        {slotBlocks.map((block) => {
          const open = openId === block.id;
          return (
            <div key={block.id} className="rounded-lg border border-border/60 bg-background">
              <div className="flex flex-wrap items-center gap-2 px-3 py-2">
                <Badge>{KIND_LABEL[block.kind]}</Badge>
                <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                  {summarize(block)}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={disabled}
                  onClick={() => setOpenId(open ? null : block.id)}
                >
                  {open ? "Close" : "Edit"}
                </Button>
                <Button size="sm" variant="outline" disabled={disabled} onClick={() => move(block, -1)}>
                  <ArrowUp className="size-3.5" />
                </Button>
                <Button size="sm" variant="outline" disabled={disabled} onClick={() => move(block, 1)}>
                  <ArrowDown className="size-3.5" />
                </Button>
                <Button size="sm" variant="outline" disabled={disabled} onClick={() => duplicate(block)}>
                  <Copy className="size-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={disabled}
                  onClick={() => remove(block.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>

              {open ? (
                <BlockForm
                  block={block}
                  disabled={disabled}
                  onChange={(next) => replace(block.id, next)}
                />
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {DECORATION_KINDS.map((kind) => (
          <Button
            key={kind}
            size="sm"
            variant="outline"
            disabled={disabled || blocks.length >= STAGE_MAX_BLOCKS}
            onClick={() => add(kind)}
          >
            Add {KIND_LABEL[kind].toLowerCase()}
          </Button>
        ))}
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">Preview</p>
          <Button size="sm" variant="outline" onClick={() => setPreviewMobile((v) => !v)}>
            {previewMobile ? "Desktop" : "Mobile"}
          </Button>
        </div>
        <div className="overflow-hidden rounded-xl border border-border/60 bg-background p-4">
          <div
            className={cn("mx-auto origin-top", previewMobile ? "w-[380px] scale-[0.85]" : "w-full")}
          >
            <OnboardingStage presentation={stagePreview}>
              <div className="rounded-2xl border border-border/80 bg-card/80 p-5 shadow-sm">
                <p className="font-serif text-xl font-semibold">{previewTitle || "Question"}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Fill in this key vendor specification.
                </p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <div className="h-12 rounded-xl border border-border/70" />
                  <div className="h-12 rounded-xl border border-border/70" />
                </div>
              </div>
            </OnboardingStage>
          </div>
        </div>
      </div>
    </div>
  );
}

function summarize(block: DecorationBlock): string {
  switch (block.kind) {
    case "TEXT":
      return block.heading?.en ?? block.body?.en ?? "Empty text";
    case "ICON":
      return block.iconName;
    default:
      return block.src || "No asset yet";
  }
}

function BlockForm({
  block,
  onChange,
  disabled,
}: {
  block: DecorationBlock;
  onChange: (next: DecorationBlock) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-3 border-t border-border/60 px-3 py-3">
      <KindFields block={block} onChange={onChange} disabled={disabled} />

      <div className="grid gap-2 sm:grid-cols-3">
        <Row label="Align">
          <Select
            value={block.align}
            options={["START", "CENTER", "END"] as const}
            onChange={(align) => onChange({ ...block, align })}
          />
        </Row>
        <Row label="Entrance">
          <Select
            value={block.entrance}
            options={["NONE", "FADE", "SLIDE", "FLOAT"] as const}
            onChange={(entrance) => onChange({ ...block, entrance })}
          />
        </Row>
        <Row label="Delay (ms)">
          <Input
            type="number"
            value={block.delayMs}
            onChange={(e) => onChange({ ...block, delayMs: Number(e.target.value) || 0 })}
          />
        </Row>
        <Row label="Max width (px)">
          <Input
            type="number"
            value={block.maxWidthPx ?? ""}
            placeholder="auto"
            onChange={(e) =>
              onChange({ ...block, maxWidthPx: e.target.value === "" ? null : Number(e.target.value) })
            }
          />
        </Row>
        <Row label="Slot">
          <Select
            value={block.slot}
            options={DECORATION_SLOTS}
            onChange={(slot) => onChange({ ...block, slot })}
          />
        </Row>
      </div>

      <div className="grid gap-1.5">
        <span className="text-[12px] font-medium text-foreground/75">Hide on</span>
        <div className="flex flex-wrap gap-1.5">
          {(["MOBILE", "TABLET", "DESKTOP"] as const).map((breakpoint) => {
            const active = block.hideOn.includes(breakpoint);
            return (
              <button
                key={breakpoint}
                type="button"
                disabled={disabled}
                onClick={() =>
                  onChange({
                    ...block,
                    hideOn: active
                      ? block.hideOn.filter((item) => item !== breakpoint)
                      : [...block.hideOn, breakpoint],
                  })
                }
                className={cn(
                  "rounded-lg border px-2.5 py-1 text-[11px] font-medium transition",
                  active
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border/60 text-muted-foreground hover:text-foreground",
                )}
              >
                {breakpoint}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function KindFields({
  block,
  onChange,
  disabled,
}: {
  block: DecorationBlock;
  onChange: (next: DecorationBlock) => void;
  disabled?: boolean;
}) {
  switch (block.kind) {
    case "TEXT":
      return (
        <div className="grid gap-2">
          <Row label="Heading">
            <Input
              value={block.heading?.en ?? ""}
              onChange={(e) => onChange({ ...block, heading: text(e.target.value) })}
            />
          </Row>
          <Row label="Body">
            <Textarea
              rows={2}
              value={block.body?.en ?? ""}
              onChange={(e) => onChange({ ...block, body: text(e.target.value) })}
            />
          </Row>
          <Row label="Tone">
            <Select
              value={block.tone}
              options={["DEFAULT", "MUTED", "ACCENT"] as const}
              onChange={(tone) => onChange({ ...block, tone })}
            />
          </Row>
        </div>
      );

    case "ICON":
      return (
        <div className="grid gap-2">
          <IconPicker
            value={block.iconName}
            onChange={(iconName) => onChange({ ...block, iconName })}
          />
          <Row label="Label">
            <Input
              value={block.label?.en ?? ""}
              placeholder="Optional caption"
              onChange={(e) => onChange({ ...block, label: text(e.target.value) })}
            />
          </Row>
          <div className="grid gap-2 sm:grid-cols-2">
            <Row label="Size">
              <Select
                value={block.size}
                options={["SM", "MD", "LG", "XL"] as const}
                onChange={(size) => onChange({ ...block, size })}
              />
            </Row>
            <Row label="Motion">
              <Select
                value={block.motion}
                options={["HOVER", "LOOP", "ONCE"] as const}
                onChange={(motion) => onChange({ ...block, motion })}
              />
            </Row>
          </div>
        </div>
      );

    case "IMAGE":
      return (
        <div className="grid gap-2">
          <AssetField
            label="Image URL"
            kind="IMAGE"
            value={block.src}
            disabled={disabled}
            onChange={(src) => onChange({ ...block, src })}
          />
          <Row label="Alt text">
            <Input
              value={block.alt?.en ?? ""}
              placeholder="Describes the image for screen readers"
              onChange={(e) => onChange({ ...block, alt: text(e.target.value) })}
            />
          </Row>
          <div className="grid gap-2 sm:grid-cols-3">
            <Row label="Fit">
              <Select
                value={block.fit}
                options={["COVER", "CONTAIN"] as const}
                onChange={(fit) => onChange({ ...block, fit })}
              />
            </Row>
            <Row label="Aspect ratio">
              <Input
                value={block.aspect ?? ""}
                placeholder="4/5"
                onChange={(e) => onChange({ ...block, aspect: e.target.value.trim() || null })}
              />
            </Row>
            <div className="flex items-end">
              <label className="flex w-full items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2">
                <span className="text-xs font-medium">Rounded</span>
                <Switch
                  checked={block.rounded}
                  onCheckedChange={(rounded) => onChange({ ...block, rounded })}
                />
              </label>
            </div>
          </div>
        </div>
      );

    case "LOTTIE":
      return (
        <div className="grid gap-2">
          <AssetField
            label="Lottie JSON URL"
            kind="LOTTIE"
            value={block.src}
            disabled={disabled}
            onChange={(src) => onChange({ ...block, src })}
          />
          <div className="grid gap-2 sm:grid-cols-3">
            <Row label="Speed">
              <Input
                type="number"
                step="0.1"
                value={block.speed}
                onChange={(e) => onChange({ ...block, speed: Number(e.target.value) || 1 })}
              />
            </Row>
            <div className="flex items-end">
              <label className="flex w-full items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2">
                <span className="text-xs font-medium">Loop</span>
                <Switch checked={block.loop} onCheckedChange={(loop) => onChange({ ...block, loop })} />
              </label>
            </div>
            <div className="flex items-end">
              <label className="flex w-full items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2">
                <span className="text-xs font-medium">Autoplay</span>
                <Switch
                  checked={block.autoplay}
                  onCheckedChange={(autoplay) => onChange({ ...block, autoplay })}
                />
              </label>
            </div>
          </div>
        </div>
      );

    case "VIDEO":
      return (
        <div className="grid gap-2">
          <AssetField
            label="Video URL"
            kind="VIDEO"
            value={block.src}
            disabled={disabled}
            onChange={(src) => onChange({ ...block, src })}
          />
          <AssetField
            label="Poster image"
            kind="IMAGE"
            value={block.poster ?? ""}
            disabled={disabled}
            onChange={(poster) => onChange({ ...block, poster: poster || null })}
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2">
              <span className="text-xs font-medium">Loop</span>
              <Switch checked={block.loop} onCheckedChange={(loop) => onChange({ ...block, loop })} />
            </label>
            <label className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2">
              <span className="text-xs font-medium">Autoplay</span>
              <Switch
                checked={block.autoplay}
                onCheckedChange={(autoplay) => onChange({ ...block, autoplay })}
              />
            </label>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Videos always play muted and inline, and fall back to a poster with controls when a
            visitor prefers reduced motion.
          </p>
        </div>
      );
  }
}

function IconPicker({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  const [query, setQuery] = useState("");

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ANIMATED_ICON_NAMES;
    return ANIMATED_ICON_NAMES.filter((name) => name.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="grid gap-2">
      <Row label="Icon">
        <Input
          value={query}
          placeholder={`Search icons (current: ${value})`}
          onChange={(e) => setQuery(e.target.value)}
        />
      </Row>
      <div className="flex max-h-40 flex-wrap gap-1 overflow-y-auto rounded-lg border border-border/60 p-2">
        {matches.map((name) => (
          <button
            key={name}
            type="button"
            title={name}
            onClick={() => onChange(name)}
            className={cn(
              "grid size-9 place-items-center rounded-lg border transition",
              name === value
                ? "border-primary bg-primary/10 text-primary"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
            )}
          >
            <StageIconPreview name={name} size={18} />
          </button>
        ))}
        {matches.length === 0 ? (
          <p className="px-1 py-2 text-xs text-muted-foreground">No icons match that search.</p>
        ) : null}
      </div>
    </div>
  );
}

function AssetField({
  label,
  kind,
  value,
  onChange,
  disabled,
}: {
  label: string;
  kind: "IMAGE" | "LOTTIE" | "VIDEO";
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function upload(file: File) {
    const contentType = file.type || "application/octet-stream";
    if (!(ONBOARDING_ASSET_CONTENT_TYPES as readonly string[]).includes(contentType)) {
      setUploadError(`Unsupported file type: ${contentType}`);
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      const { uploadUrl, publicUrl } = await api.admin.onboardingAssetPresign({
        contentType: contentType as (typeof ONBOARDING_ASSET_CONTENT_TYPES)[number],
        filename: file.name,
      });
      const response = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: file,
      });
      if (!response.ok) throw new Error(`Upload failed (${response.status})`);
      onChange(publicUrl);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="grid gap-1.5">
      <Row label={label}>
        <div className="flex gap-2">
          <Input
            value={value}
            placeholder="https://…"
            onChange={(e) => onChange(e.target.value)}
            className="flex-1"
          />
          <Button
            size="sm"
            variant="outline"
            icon={Upload}
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? "Uploading…" : "Upload"}
          </Button>
        </div>
      </Row>
      <input
        ref={inputRef}
        type="file"
        hidden
        accept={ACCEPT_BY_KIND[kind]}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
        }}
      />
      {uploadError ? <p className="text-[11px] text-destructive">{uploadError}</p> : null}
    </div>
  );
}
