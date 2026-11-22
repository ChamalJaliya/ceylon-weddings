"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  Archive,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ChevronDown,
  Copy,
  Download,
  Eye,
  Filter,
  ImageIcon,
  Layers,
  ListChecks,
  MessageSquareText,
  Palette,
  Pencil,
  Plus,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { api, type VendorTypeAnalytics } from "@ceylonweddings/web";
import {
  type AttributeLayout,
  type AttributeStatus,
  type AttributeValueType,
  type DecorationBlock,
  type GalleryLayout,
  type LocalizedString,
  type UpdateAttributeDefinitionBody,
  type UpdateVendorTypeBody,
  type VendorAttributeDefinition,
  type VendorAttributeOption,
  type VendorType,
  type VendorTypeStatus,
} from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { Input } from "@ceylonweddings/ui/components/input";
import { Combobox } from "@ceylonweddings/ui/components/combobox";
import { HorizontalTabs } from "@ceylonweddings/ui/components/horizontal-tabs";
import { cn } from "@ceylonweddings/ui/lib/utils";
import { FormGroup, StickyActionBar } from "@ceylonweddings/ui/domain/creator-form";
import { Textarea } from "@ceylonweddings/ui/components/textarea";
import { PlanningHero } from "@/features/planning/components/planning-hero";
import { SettingsSwitchRow } from "@ceylonweddings/ui/domain/settings-switch-row";
import { Link, useRouter } from "@/i18n/navigation";
import { StageEditor } from "@/features/admin/settings/categories/components/stage-editor";
import { useConfirm } from "@ceylonweddings/ui/components/confirm-dialog";
import { CenteredLoader } from "@ceylonweddings/ui/components/spinner";

const TYPE_STATUSES: VendorTypeStatus[] = ["DRAFT", "ACTIVE", "HIDDEN", "ARCHIVED"];
const GALLERY_LAYOUTS: GalleryLayout[] = ["default", "venue", "portrait", "detail"];
const VALUE_TYPES: AttributeValueType[] = ["SELECT", "MULTISELECT", "BOOLEAN", "NUMBER", "RANGE", "TEXT"];
const LAYOUTS: AttributeLayout[] = ["CARDS", "GRID", "LIST", "TOGGLE", "SLIDER", "TEXT"];
const ATTR_STATUSES: AttributeStatus[] = ["DRAFT", "ACTIVE", "ARCHIVED"];

function emptyLocalized(en = ""): LocalizedString {
  return { en, si: "", ta: "" };
}

function localizedOrEmpty(value?: LocalizedString | null): LocalizedString {
  return {
    en: value?.en ?? "",
    si: value?.si ?? "",
    ta: value?.ta ?? "",
  };
}

function nullableLocalized(value: LocalizedString): LocalizedString | null {
  if (!value.en.trim() && !value.si?.trim() && !value.ta?.trim()) return null;
  return {
    en: value.en.trim() || "—",
    ...(value.si?.trim() ? { si: value.si.trim() } : {}),
    ...(value.ta?.trim() ? { ta: value.ta.trim() } : {}),
  };
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-compact font-medium leading-none tracking-normal text-foreground/80">{label}</span>
      {children}
    </label>
  );
}

function SwitchRow({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <SettingsSwitchRow
      label={label}
      description={description}
      checked={checked}
      onCheckedChange={onChange}
      disabled={disabled}
    />
  );
}

const VALUE_TYPE_LABEL: Record<AttributeValueType, string> = {
  SELECT: "Single choice",
  MULTISELECT: "Multiple choice",
  BOOLEAN: "Yes / no",
  NUMBER: "Number",
  RANGE: "Number range",
  TEXT: "Free text",
};
const LAYOUT_LABEL: Record<AttributeLayout, string> = {
  CARDS: "Cards",
  GRID: "Grid",
  LIST: "List",
  TOGGLE: "Toggle",
  SLIDER: "Slider",
  TEXT: "Text box",
};
const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  HIDDEN: "Hidden",
  ARCHIVED: "Archived",
};
const GALLERY_LABEL: Record<GalleryLayout, string> = {
  default: "Standard grid",
  venue: "Venue (wide spaces)",
  portrait: "Portrait (people)",
  detail: "Detail (close-ups)",
};

function toKey(label: string) {
  const words = label
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4);
  return words
    .map((w, i) => (i === 0 ? w.toLowerCase() : w[0]!.toUpperCase() + w.slice(1).toLowerCase()))
    .join("")
    .replace(/^[^a-z]+/, "");
}

function definitionDraft(definition: VendorAttributeDefinition) {
  return {
    question: localizedOrEmpty(definition.question),
    instruction: localizedOrEmpty(definition.instruction),
    helpText: localizedOrEmpty(definition.helpText),
    filterLabel: localizedOrEmpty(definition.filterLabel),
    filterHelp: localizedOrEmpty(definition.filterHelp),
    required: definition.required,
    filterable: definition.filterable,
    filterHighlight: definition.filterHighlight,
    filterSortOrder: definition.filterSortOrder,
    showOnProfile: definition.showOnProfile,
    collectOnboard: definition.collectOnboard,
    layout: definition.layout,
    unit: definition.unit ?? "",
    minValue: (definition.minValue ?? "") as number | string,
    maxValue: (definition.maxValue ?? "") as number | string,
    maxSelect: (definition.maxSelect ?? "") as number | string,
    status: definition.status,
    valueType: definition.valueType,
  };
}

export default function AdminCategoryDetailPage() {
  const confirm = useConfirm();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const router = useRouter();

  const [type, setType] = useState<VendorType | null>(null);
  const [analytics, setAnalytics] = useState<VendorTypeAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showClone, setShowClone] = useState(false);
  const [cloneSlug, setCloneSlug] = useState("");
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [newQuestionKey, setNewQuestionKey] = useState("");
  const [newQuestionLabel, setNewQuestionLabel] = useState("");
  const [newQuestionType, setNewQuestionType] = useState<AttributeValueType>("SELECT");

  const [meta, setMeta] = useState({
    label: emptyLocalized(),
    description: emptyLocalized(),
    featured: false,
    coreTeam: false,
    galleryLayout: "default" as GalleryLayout,
    coverUrl: "",
    status: "DRAFT" as VendorTypeStatus,
  });
  const [typeStageBlocks, setTypeStageBlocks] = useState<DecorationBlock[]>([]);
  const [savedMeta, setSavedMeta] = useState(meta);
  const [savedBlocks, setSavedBlocks] = useState<DecorationBlock[]>([]);
  const [tab, setTab] = useState<"questions" | "details" | "screen">("questions");
  const [keyTouched, setKeyTouched] = useState(false);

  const load = useCallback(async () => {
    try {
      const types = await api.admin.vendorTypes();
      const found = types.find((item) => item.slug === slug);
      if (!found) {
        setError("Vendor type not found");
        return;
      }
      const full = await api.admin.vendorType(found.id);
      setType(full);
      const loadedMeta = {
        label: localizedOrEmpty(full.label),
        description: localizedOrEmpty(full.description),
        featured: full.featured,
        coreTeam: full.coreTeam,
        galleryLayout: full.galleryLayout,
        coverUrl: full.coverUrl ?? "",
        status: full.status,
      };
      setMeta(loadedMeta);
      setSavedMeta(loadedMeta);
      const loadedBlocks = full.onboardingPresentation?.questionDefault?.blocks ?? [];
      setTypeStageBlocks(loadedBlocks);
      setSavedBlocks(loadedBlocks);
      const attrs = (full.attributes ?? []).filter((a) => a.status !== "ARCHIVED");
      setExpandedId((prev) => {
        if (prev && attrs.some((a) => a.id === prev)) return prev;
        return attrs[0]?.id ?? null;
      });
      try {
        setAnalytics(await api.admin.vendorTypeAnalytics(full.id));
      } catch {
        setAnalytics(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  const attributes = useMemo(() => {
    const list = [...(type?.attributes ?? [])];
    list.sort((a, b) => a.sortOrder - b.sortOrder || a.key.localeCompare(b.key));
    return list;
  }, [type]);

  const activeAttributes = attributes.filter((a) => a.status !== "ARCHIVED");
  const requiredCount = activeAttributes.filter((a) => a.required).length;

  if (error) {
    return (
      <FormStatus tone="destructive">
        {error}. <Link href="/admin/settings/categories">Back</Link>
      </FormStatus>
    );
  }

  if (!type) {
    return <CenteredLoader label="Loading…" />;
  }

  async function saveMeta() {
    setBusy(true);
    setMessage(null);
    try {
      const body: UpdateVendorTypeBody = {
        label: {
          en: meta.label.en.trim(),
          ...(meta.label.si?.trim() ? { si: meta.label.si.trim() } : {}),
          ...(meta.label.ta?.trim() ? { ta: meta.label.ta.trim() } : {}),
        },
        description: nullableLocalized(meta.description),
        featured: meta.featured,
        coreTeam: meta.coreTeam,
        galleryLayout: meta.galleryLayout,
        coverUrl: meta.coverUrl.trim() || null,
        status: meta.status,
        onboardingPresentation: typeStageBlocks.length
          ? { version: 1, questionDefault: { version: 1, blocks: typeStageBlocks } }
          : null,
      };
      await api.admin.updateVendorType(type!.id, body);
      setMessage("Type saved");
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function moveAttribute(def: VendorAttributeDefinition, direction: -1 | 1) {
    const ordered = activeAttributes.map((a) => a.id);
    const index = ordered.indexOf(def.id);
    const next = index + direction;
    if (index < 0 || next < 0 || next >= ordered.length) return;
    const ids = [...ordered];
    const [removed] = ids.splice(index, 1);
    ids.splice(next, 0, removed!);
    setBusy(true);
    try {
      await api.admin.reorderAttributeDefinitions(type!.id, ids);
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Reorder failed");
    } finally {
      setBusy(false);
    }
  }

  const filterableCount = activeAttributes.filter((a) => a.filterable).length;
  const selected = attributes.find((a) => a.id === expandedId) ?? null;
  const metaDirty =
    JSON.stringify({ ...meta, blocks: typeStageBlocks }) !== JSON.stringify({ ...savedMeta, blocks: savedBlocks });

  async function createQuestion() {
    setBusy(true);
    try {
      const created = await api.admin.createAttributeDefinition(type!.id, {
        key: newQuestionKey,
        valueType: newQuestionType,
        question: { en: newQuestionLabel.trim() },
        required: false,
        filterable: newQuestionType !== "TEXT",
        filterHighlight: false,
        filterSortOrder: 0,
        showOnProfile: true,
        collectOnboard: false,
        layout: "CARDS",
        sortOrder: activeAttributes.length,
        status: "DRAFT",
      });
      setShowAddQuestion(false);
      setKeyTouched(false);
      setNewQuestionKey("");
      setNewQuestionLabel("");
      setExpandedId(created.id);
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  async function archiveQuestion(def: VendorAttributeDefinition) {
    if (!(await confirm({ title: `Archive “${def.question.en}”?`, destructive: true, confirmLabel: "Archive" })))
      return;
    setBusy(true);
    try {
      await api.admin.deleteAttributeDefinition(type!.id, def.id);
      setMessage("Question archived");
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Archive failed");
    } finally {
      setBusy(false);
    }
  }

  const stats = [
    { label: "Vendors", value: analytics?.vendorCount ?? "—" },
    { label: "Questions", value: activeAttributes.length },
    { label: "Required", value: requiredCount, warn: requiredCount > 4 },
    { label: "Couple filters", value: filterableCount },
  ];

  return (
    <div className="grid min-w-0 gap-6">
      <PlanningHero
        icon={Layers}
        kicker="Vendor types"
        title={meta.label.en || type.slug}
        description={`${type.slug} · ${STATUS_LABEL[type.status] ?? type.status}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/settings/categories">
                <ArrowLeft className="size-3.5" />
                All types
              </Link>
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  const pack = await api.admin.exportVendorTaxonomy(type.slug);
                  downloadJson(`${type.slug.toLowerCase()}-taxonomy.json`, pack);
                  setMessage("Exported");
                } catch (err) {
                  setMessage(err instanceof Error ? err.message : "Export failed");
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Download className="size-3.5" />
              Export
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowClone((v) => !v)}>
              <Copy className="size-3.5" />
              Clone
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={cn(
              "rounded-2xl border bg-card px-4 py-3 shadow-card",
              stat.warn ? "border-warning/50 bg-warning/5" : "border-border",
            )}
          >
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="font-serif text-2xl tabular-nums">{stat.value}</p>
            {stat.warn ? <p className="text-xs text-warning">Keep it to 4 or fewer</p> : null}
          </div>
        ))}
      </div>

      {message ? <FormStatus>{message}</FormStatus> : null}

      {showClone ? (
        <div className="flex flex-wrap items-end gap-3 rounded-3xl border border-border bg-card p-4 shadow-card">
          <Field label="Clone as new slug">
            <Input
              value={cloneSlug}
              onChange={(e) => setCloneSlug(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))}
              placeholder={`${type.slug}_COPY`}
              className="w-64"
            />
          </Field>
          <Button variant="outline" onClick={() => setShowClone(false)}>
            Cancel
          </Button>
          <Button
            disabled={busy || !cloneSlug}
            onClick={async () => {
              setBusy(true);
              try {
                const cloned = await api.admin.cloneVendorType(type.id, { newSlug: cloneSlug });
                router.push(`/admin/settings/categories/${cloned.slug}`);
              } catch (err) {
                setMessage(err instanceof Error ? err.message : "Clone failed");
              } finally {
                setBusy(false);
              }
            }}
          >
            <Copy className="size-3.5" />
            Clone type
          </Button>
        </div>
      ) : null}

      <HorizontalTabs
        ariaLabel="Vendor type sections"
        activeId={tab}
        onChange={setTab}
        items={[
          { id: "questions", label: "Questions", icon: ListChecks, badge: activeAttributes.length },
          { id: "details", label: "Details", icon: Settings2 },
          { id: "screen", label: "Onboarding screen", icon: Palette },
        ]}
      />

      {tab === "questions" ? (
        <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
          <div className="grid gap-3 rounded-3xl border border-border bg-card p-3 shadow-card lg:sticky lg:top-24">
            <div className="flex items-center justify-between gap-2 px-1 pt-1">
              <p className="text-sm font-medium">Onboarding order</p>
              <Button
                size="sm"
                variant={showAddQuestion ? "outline" : "default"}
                onClick={() => setShowAddQuestion((v) => !v)}
              >
                <Plus className="size-3.5" />
                Add
              </Button>
            </div>

            {showAddQuestion ? (
              <div className="grid gap-2 rounded-2xl border border-primary/30 bg-primary/5 p-3">
                <Input
                  autoFocus
                  value={newQuestionLabel}
                  onChange={(e) => {
                    setNewQuestionLabel(e.target.value);
                    if (!keyTouched) setNewQuestionKey(toKey(e.target.value));
                  }}
                  placeholder="What do you want to ask?"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={newQuestionKey}
                    onChange={(e) => {
                      setKeyTouched(true);
                      setNewQuestionKey(e.target.value.replace(/[^a-zA-Z0-9_]/g, "").replace(/^([^a-z])/, ""));
                    }}
                    placeholder="key"
                    className="font-mono text-xs"
                  />
                  <Combobox
                    aria-label="Answer type"
                    value={newQuestionType}
                    onValueChange={(value) => setNewQuestionType(value as AttributeValueType)}
                    options={VALUE_TYPES.map((vt) => ({ value: vt, label: VALUE_TYPE_LABEL[vt] }))}
                    className="min-w-0"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setShowAddQuestion(false)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={busy || !newQuestionKey || !newQuestionLabel.trim()}
                    onClick={() => void createQuestion()}
                  >
                    Create
                  </Button>
                </div>
              </div>
            ) : null}

            <ol className="grid gap-1">
              {attributes.map((def, index) => {
                const active = def.id === expandedId;
                const archived = def.status === "ARCHIVED";
                const activeIndex = activeAttributes.findIndex((a) => a.id === def.id);
                return (
                  <li key={def.id} className="group relative">
                    <button
                      type="button"
                      onClick={() => setExpandedId(def.id)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-2xl px-3 py-2.5 text-left transition",
                        active ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-secondary/60",
                        archived && "opacity-50",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-xs font-medium tabular-nums",
                          active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
                        )}
                      >
                        {index + 1}
                      </span>
                      <span className="grid min-w-0 flex-1 gap-1 pr-12">
                        <span className="line-clamp-2 text-sm leading-snug font-medium">{def.question.en}</span>
                        <span className="flex flex-wrap items-center gap-1.5 text-label text-muted-foreground">
                          <span>{VALUE_TYPE_LABEL[def.valueType]}</span>
                          {def.required ? <span className="font-medium text-warning">· Required</span> : null}
                          {def.filterable ? (
                            <span className="inline-flex items-center gap-0.5">
                              · <Filter className="size-3" /> Filter
                            </span>
                          ) : null}
                          {def.status !== "ACTIVE" ? <span>· {STATUS_LABEL[def.status]}</span> : null}
                        </span>
                      </span>
                    </button>
                    {!archived ? (
                      <div className="absolute top-2 right-2 flex flex-col opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                        <button
                          type="button"
                          aria-label="Move up"
                          disabled={busy || activeIndex <= 0}
                          onClick={() => void moveAttribute(def, -1)}
                          className="grid size-5 place-items-center rounded text-muted-foreground hover:bg-background hover:text-foreground disabled:opacity-30"
                        >
                          <ArrowUp className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label="Move down"
                          disabled={busy || activeIndex >= activeAttributes.length - 1}
                          onClick={() => void moveAttribute(def, 1)}
                          className="grid size-5 place-items-center rounded text-muted-foreground hover:bg-background hover:text-foreground disabled:opacity-30"
                        >
                          <ArrowDown className="size-3.5" />
                        </button>
                      </div>
                    ) : null}
                  </li>
                );
              })}
              {attributes.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                  No questions yet. Add the first thing vendors should tell couples.
                </li>
              ) : null}
            </ol>
          </div>

          {selected ? (
            <AttributeEditor
              key={selected.id}
              typeId={type.id}
              definition={selected}
              position={attributes.indexOf(selected) + 1}
              busy={busy}
              setBusy={setBusy}
              onArchive={() => void archiveQuestion(selected)}
              onSaved={async (msg) => {
                setMessage(msg);
                await load();
              }}
            />
          ) : (
            <div className="grid min-h-64 place-items-center rounded-3xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Pick a question to edit it.
            </div>
          )}
        </div>
      ) : null}

      {tab === "details" ? (
        <div className="grid gap-4">
          <FormGroup title="Basics" description="How this type appears across the directory." icon={Layers}>
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Display name">
                  <Input
                    value={meta.label.en}
                    onChange={(e) => setMeta((m) => ({ ...m, label: { ...m.label, en: e.target.value } }))}
                  />
                </Field>
                <Field label="Status">
                  <Combobox
                    aria-label="Type status"
                    value={meta.status}
                    onValueChange={(value) => setMeta((m) => ({ ...m, status: value as VendorTypeStatus }))}
                    options={TYPE_STATUSES.map((s) => ({ value: s, label: STATUS_LABEL[s] ?? s }))}
                  />
                </Field>
              </div>
              <Field label="Description">
                <Textarea
                  rows={2}
                  value={meta.description.en}
                  onChange={(e) => setMeta((m) => ({ ...m, description: { ...m.description, en: e.target.value } }))}
                />
              </Field>
            </div>
          </FormGroup>
          <FormGroup
            title="Presentation"
            description="Cover image and gallery style on vendor profiles."
            icon={ImageIcon}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Gallery layout">
                <Combobox
                  aria-label="Gallery layout"
                  value={meta.galleryLayout}
                  onValueChange={(value) => setMeta((m) => ({ ...m, galleryLayout: value as GalleryLayout }))}
                  options={GALLERY_LAYOUTS.map((layout) => ({ value: layout, label: GALLERY_LABEL[layout] }))}
                />
              </Field>
              <Field label="Cover image URL">
                <Input
                  value={meta.coverUrl}
                  onChange={(e) => setMeta((m) => ({ ...m, coverUrl: e.target.value }))}
                  placeholder="https://"
                />
              </Field>
            </div>
          </FormGroup>
          <FormGroup title="Discovery" description="Where couples meet this type." icon={Sparkles}>
            <div className="grid gap-2 sm:grid-cols-2">
              <SwitchRow
                label="Featured"
                description="Show in directory category rails"
                checked={meta.featured}
                onChange={(featured) => setMeta((m) => ({ ...m, featured }))}
              />
              <SwitchRow
                label="Core team"
                description="Typical hire for most weddings"
                checked={meta.coreTeam}
                onChange={(coreTeam) => setMeta((m) => ({ ...m, coreTeam }))}
              />
            </div>
          </FormGroup>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-destructive/30 bg-destructive/5 p-4">
            <div className="grid gap-0.5">
              <p className="text-sm font-medium">Archive this type</p>
              <p className="text-xs text-muted-foreground">
                Hides it from onboarding and Discover. Vendors keep their data.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-destructive/40 text-destructive"
              disabled={busy || type.status === "ARCHIVED"}
              onClick={async () => {
                if (!(await confirm({ title: "Archive this type?", destructive: true, confirmLabel: "Archive" })))
                  return;
                setBusy(true);
                try {
                  await api.admin.deleteVendorType(type.id);
                  router.push("/admin/settings/categories");
                } catch (err) {
                  setMessage(err instanceof Error ? err.message : "Archive failed");
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Archive className="size-3.5" />
              Archive type
            </Button>
          </div>
        </div>
      ) : null}

      {tab === "screen" ? (
        <FormGroup
          title="Onboarding screen"
          description="Decoration shown around every question for this type. Questions can add their own or opt out."
          icon={Palette}
        >
          <StageEditor
            blocks={typeStageBlocks}
            onChange={setTypeStageBlocks}
            previewTitle={meta.label.en || "Question"}
            disabled={busy}
          />
        </FormGroup>
      ) : null}

      {tab !== "questions" ? (
        <StickyActionBar>
          <span className="mr-auto text-xs text-muted-foreground">
            {metaDirty ? "Unsaved changes" : "All changes saved"}
          </span>
          <Button
            variant="outline"
            disabled={!metaDirty || busy}
            onClick={() => {
              setMeta(savedMeta);
              setTypeStageBlocks(savedBlocks);
            }}
          >
            Cancel
          </Button>
          <Button disabled={!metaDirty || busy} onClick={() => void saveMeta()}>
            Save
          </Button>
        </StickyActionBar>
      ) : null}
    </div>
  );
}

function AttributeEditor({
  typeId,
  definition,
  position,
  busy,
  setBusy,
  onSaved,
  onArchive,
}: {
  typeId: string;
  definition: VendorAttributeDefinition;
  position: number;
  onArchive: () => void;
  busy: boolean;
  setBusy: (v: boolean) => void;
  onSaved: (message: string) => Promise<void>;
}) {
  const confirm = useConfirm();
  const [draft, setDraft] = useState(() => definitionDraft(definition));

  const [stageBlocks, setStageBlocks] = useState<DecorationBlock[]>(definition.presentation?.blocks ?? []);
  const [stageInherit, setStageInherit] = useState(definition.presentation?.inherit ?? true);
  const [newOptKey, setNewOptKey] = useState("");
  const [newOptLabel, setNewOptLabel] = useState("");
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);
  const [optKeyTouched, setOptKeyTouched] = useState(false);

  useEffect(() => {
    setDraft(definitionDraft(definition));
    setStageBlocks(definition.presentation?.blocks ?? []);
    setStageInherit(definition.presentation?.inherit ?? true);
    setEditingOptionId(null);
  }, [definition]);

  const options = useMemo(() => {
    const list = [...definition.options];
    list.sort((a, b) => a.sortOrder - b.sortOrder || a.key.localeCompare(b.key));
    return list;
  }, [definition.options]);

  const isChoice = draft.valueType === "SELECT" || draft.valueType === "MULTISELECT";
  const isNumeric = draft.valueType === "NUMBER" || draft.valueType === "RANGE";
  const baseline = useMemo(() => definitionDraft(definition), [definition]);
  const dirty =
    JSON.stringify(draft) !== JSON.stringify(baseline) ||
    JSON.stringify(stageBlocks) !== JSON.stringify(definition.presentation?.blocks ?? []) ||
    stageInherit !== (definition.presentation?.inherit ?? true);

  function reset() {
    setDraft(baseline);
    setStageBlocks(definition.presentation?.blocks ?? []);
    setStageInherit(definition.presentation?.inherit ?? true);
  }

  async function saveDefinition(patch?: Partial<typeof draft>) {
    const next = { ...draft, ...patch };
    if (patch) setDraft(next);

    if (
      next.valueType !== definition.valueType &&
      !(await confirm({
        title: `Change answer type from ${definition.valueType} to ${next.valueType}?`,
        description: "Existing vendor answers for this question will be cleared.",
        destructive: true,
        confirmLabel: "Change type",
      }))
    ) {
      setDraft((d) => ({ ...d, valueType: definition.valueType }));
      return;
    }

    setBusy(true);
    try {
      const body: UpdateAttributeDefinitionBody = {
        question: {
          en: next.question.en.trim(),
          ...(next.question.si?.trim() ? { si: next.question.si.trim() } : {}),
          ...(next.question.ta?.trim() ? { ta: next.question.ta.trim() } : {}),
        },
        instruction: nullableLocalized(next.instruction),
        helpText: nullableLocalized(next.helpText),
        filterLabel: nullableLocalized(next.filterLabel),
        filterHelp: nullableLocalized(next.filterHelp),
        required: next.required,
        filterable: next.filterable,
        filterHighlight: next.filterHighlight,
        filterSortOrder: Number(next.filterSortOrder) || 0,
        showOnProfile: next.showOnProfile,
        collectOnboard: next.collectOnboard,
        layout: next.layout,
        unit: next.unit.trim() || null,
        minValue: next.minValue === "" ? null : Number(next.minValue),
        maxValue: next.maxValue === "" ? null : Number(next.maxValue),
        maxSelect: next.maxSelect === "" ? null : Number(next.maxSelect),
        status: next.status,
        presentation: stageBlocks.length ? { version: 1, blocks: stageBlocks, inherit: stageInherit } : null,
        ...(next.valueType !== definition.valueType ? { valueType: next.valueType } : {}),
      };
      await api.admin.updateAttributeDefinition(typeId, definition.id, body);
      await onSaved(
        next.valueType !== definition.valueType
          ? "Question saved — previous vendor answers for this question were cleared"
          : "Question saved",
      );
    } catch (err) {
      await onSaved(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function moveOption(opt: VendorAttributeOption, direction: -1 | 1) {
    const active = options.filter((o) => o.active).map((o) => o.id);
    const index = active.indexOf(opt.id);
    const next = index + direction;
    if (index < 0 || next < 0 || next >= active.length) return;
    const ids = [...active];
    const [removed] = ids.splice(index, 1);
    ids.splice(next, 0, removed!);
    const archived = options.filter((o) => !o.active).map((o) => o.id);
    setBusy(true);
    try {
      await api.admin.reorderAttributeOptions(typeId, definition.id, [...ids, ...archived]);
      await onSaved("Options reordered");
    } catch (err) {
      await onSaved(err instanceof Error ? err.message : "Reorder failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-w-0 gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-border bg-card px-5 py-4 shadow-card">
        <div className="grid min-w-0 gap-1">
          <p className="text-xs text-muted-foreground">
            Question {position} · <span className="font-mono">{definition.key}</span>
          </p>
          <h3 className="truncate font-serif text-xl">{draft.question.en || "Untitled question"}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Combobox
            aria-label="Question status"
            value={draft.status}
            onValueChange={(value) => setDraft((d) => ({ ...d, status: value as AttributeStatus }))}
            options={ATTR_STATUSES.map((s) => ({ value: s, label: STATUS_LABEL[s] ?? s }))}
            className="w-36 min-w-0"
          />
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Archive question"
            disabled={busy || definition.status === "ARCHIVED"}
            onClick={onArchive}
          >
            <Archive className="size-4 text-destructive" />
          </Button>
        </div>
      </div>

      <FormGroup title="Question" description="What vendors see during onboarding." icon={MessageSquareText}>
        <div className="grid gap-4">
          <Field label="Question">
            <Input
              value={draft.question.en}
              onChange={(e) => setDraft((d) => ({ ...d, question: { ...d.question, en: e.target.value } }))}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Instruction">
              <Input
                value={draft.instruction.en}
                placeholder="e.g. Pick all that apply"
                onChange={(e) => setDraft((d) => ({ ...d, instruction: { ...d.instruction, en: e.target.value } }))}
              />
            </Field>
            <Field label="Help text">
              <Input
                value={draft.helpText.en}
                placeholder="Shown on the info icon"
                onChange={(e) => setDraft((d) => ({ ...d, helpText: { ...d.helpText, en: e.target.value } }))}
              />
            </Field>
          </div>
        </div>
      </FormGroup>

      <FormGroup title="Answer" description="The kind of answer and how it's picked." icon={SlidersHorizontal}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Field label="Answer type">
            <Combobox
              aria-label="Answer type"
              value={draft.valueType}
              onValueChange={(value) => setDraft((d) => ({ ...d, valueType: value as AttributeValueType }))}
              options={VALUE_TYPES.map((vt) => ({ value: vt, label: VALUE_TYPE_LABEL[vt] }))}
              className="min-w-0"
            />
          </Field>
          <Field label="Displayed as">
            <Combobox
              aria-label="Question layout"
              value={draft.layout}
              onValueChange={(value) => setDraft((d) => ({ ...d, layout: value as AttributeLayout }))}
              options={LAYOUTS.map((layout) => ({ value: layout, label: LAYOUT_LABEL[layout] }))}
              className="min-w-0"
            />
          </Field>
          {isNumeric ? (
            <Field label="Unit">
              <Input
                value={draft.unit}
                onChange={(e) => setDraft((d) => ({ ...d, unit: e.target.value }))}
                placeholder="guests"
              />
            </Field>
          ) : null}
          {draft.valueType === "MULTISELECT" ? (
            <Field label="Max picks">
              <Input
                type="number"
                value={draft.maxSelect}
                placeholder="No limit"
                onChange={(e) => setDraft((d) => ({ ...d, maxSelect: e.target.value }))}
              />
            </Field>
          ) : null}
        </div>
        {draft.valueType !== definition.valueType ? (
          <p className="text-xs text-warning">
            Changing the answer type clears vendors’ existing answers when you save.
          </p>
        ) : null}
      </FormGroup>

      {isChoice ? (
        <FormGroup
          title="Options"
          description="The choices vendors pick from."
          icon={ListChecks}
          aside={`${options.filter((o) => o.active).length} active`}
        >
          <ul className="grid gap-1.5">
            {options.map((opt, index) => {
              const editing = editingOptionId === opt.id;
              return (
                <li
                  key={opt.id}
                  className={cn(
                    "group rounded-2xl border border-border/60 bg-background/60",
                    !opt.active && "opacity-50",
                    editing && "border-primary/40",
                  )}
                >
                  <div className="flex items-center gap-2 px-3 py-2">
                    <span className="w-5 text-xs text-muted-foreground tabular-nums">{index + 1}</span>
                    <span className="grid min-w-0 flex-1">
                      <span className="truncate text-sm font-medium">{opt.label.en}</span>
                      <span className="truncate font-mono text-label text-muted-foreground">
                        {opt.key}
                        {!opt.active ? " · archived" : ""}
                      </span>
                    </span>
                    <div className="flex items-center gap-0.5">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label="Move up"
                        disabled={busy}
                        onClick={() => void moveOption(opt, -1)}
                      >
                        <ArrowUp className="size-3.5" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label="Move down"
                        disabled={busy}
                        onClick={() => void moveOption(opt, 1)}
                      >
                        <ArrowDown className="size-3.5" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={editing ? "Close" : "Edit option"}
                        onClick={() => setEditingOptionId(editing ? null : opt.id)}
                      >
                        {editing ? <X className="size-3.5" /> : <Pencil className="size-3.5" />}
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label="Archive option"
                        disabled={busy || !opt.active}
                        onClick={async () => {
                          if (
                            !(await confirm({
                              title: `Archive “${opt.label.en}”?`,
                              destructive: true,
                              confirmLabel: "Archive",
                            }))
                          )
                            return;
                          setBusy(true);
                          try {
                            await api.admin.deleteAttributeOption(typeId, definition.id, opt.id);
                            await onSaved("Option archived");
                          } catch (err) {
                            await onSaved(err instanceof Error ? err.message : "Archive failed");
                          } finally {
                            setBusy(false);
                          }
                        }}
                      >
                        <Archive className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                  {editing ? (
                    <div className="border-t border-border/60 px-3 py-3">
                      <OptionLabelEditor
                        option={opt}
                        busy={busy}
                        onCancel={() => setEditingOptionId(null)}
                        onSave={async (patch) => {
                          setBusy(true);
                          try {
                            await api.admin.updateAttributeOption(typeId, definition.id, opt.id, patch);
                            await onSaved("Option updated");
                            setEditingOptionId(null);
                          } catch (err) {
                            await onSaved(err instanceof Error ? err.message : "Option update failed");
                          } finally {
                            setBusy(false);
                          }
                        }}
                      />
                    </div>
                  ) : null}
                </li>
              );
            })}
            {options.length === 0 ? (
              <li className="rounded-2xl border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
                No options yet.
              </li>
            ) : null}
          </ul>
          <div className="grid gap-2 rounded-2xl bg-secondary/50 p-3 sm:grid-cols-[minmax(0,1fr)_10rem_auto]">
            <Input
              value={newOptLabel}
              onChange={(e) => {
                setNewOptLabel(e.target.value);
                if (!optKeyTouched) setNewOptKey(toKey(e.target.value));
              }}
              placeholder="New option label"
            />
            <Input
              value={newOptKey}
              onChange={(e) => {
                setOptKeyTouched(true);
                setNewOptKey(e.target.value.replace(/[^a-zA-Z0-9_]/g, "").replace(/^([^a-z])/, ""));
              }}
              placeholder="key"
              className="font-mono text-xs"
            />
            <Button
              disabled={busy || !newOptKey || !newOptLabel.trim()}
              onClick={async () => {
                setBusy(true);
                try {
                  await api.admin.createAttributeOption(typeId, definition.id, {
                    key: newOptKey,
                    label: { en: newOptLabel.trim() },
                    sortOrder: options.length,
                    active: true,
                  });
                  setNewOptKey("");
                  setNewOptLabel("");
                  setOptKeyTouched(false);
                  await onSaved("Option added");
                } catch (err) {
                  await onSaved(err instanceof Error ? err.message : "Add option failed");
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Plus className="size-3.5" />
              Add option
            </Button>
          </div>
        </FormGroup>
      ) : null}

      <FormGroup title="Where it shows" description="Onboarding, couple filters and the public profile." icon={Eye}>
        <div className="grid gap-2 sm:grid-cols-2">
          <SwitchRow
            label="Required at onboarding"
            description="Vendors must answer to finish setup"
            checked={draft.required}
            disabled={busy}
            onChange={(required) => void saveDefinition({ required })}
          />
          <SwitchRow
            label="Show on profile"
            description="Listed in the vendor’s details"
            checked={draft.showOnProfile}
            onChange={(showOnProfile) => setDraft((d) => ({ ...d, showOnProfile }))}
          />
          <SwitchRow
            label="Couples can filter"
            description="Appears as a Discover filter"
            checked={draft.filterable}
            disabled={busy}
            onChange={(filterable) => void saveDefinition({ filterable })}
          />
          <SwitchRow
            label="Highlight filter"
            description="Pinned at the top of filters"
            checked={draft.filterHighlight}
            disabled={!draft.filterable}
            onChange={(filterHighlight) => setDraft((d) => ({ ...d, filterHighlight }))}
          />
        </div>
        {draft.filterable ? (
          <Field label="Filter label">
            <Input
              value={draft.filterLabel.en}
              placeholder={draft.question.en}
              onChange={(e) => setDraft((d) => ({ ...d, filterLabel: { ...d.filterLabel, en: e.target.value } }))}
            />
          </Field>
        ) : null}
      </FormGroup>

      <details className="group rounded-3xl border border-border bg-card shadow-card">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
          <span className="grid gap-0.5">
            <span className="text-sm font-medium">Screen decoration</span>
            <span className="text-xs text-muted-foreground">
              {stageBlocks.length
                ? `${stageBlocks.length} item${stageBlocks.length === 1 ? "" : "s"}`
                : "Using type defaults"}
              {stageInherit ? " · inherits type" : ""}
            </span>
          </span>
          <ChevronDown className="size-4 text-muted-foreground transition group-open:rotate-180" />
        </summary>
        <div className="border-t border-border px-5 py-4">
          <StageEditor
            blocks={stageBlocks}
            onChange={setStageBlocks}
            inherit={stageInherit}
            onInheritChange={setStageInherit}
            previewTitle={draft.question.en}
            disabled={busy}
          />
        </div>
      </details>

      <StickyActionBar>
        <span className="mr-auto text-xs text-muted-foreground">{dirty ? "Unsaved changes" : "All changes saved"}</span>
        <Button variant="outline" disabled={!dirty || busy} onClick={reset}>
          Cancel
        </Button>
        <Button disabled={!dirty || busy} onClick={() => void saveDefinition()}>
          Save question
        </Button>
      </StickyActionBar>
    </div>
  );
}

function OptionLabelEditor({
  option,
  busy,
  onSave,
  onCancel,
}: {
  option: VendorAttributeOption;
  busy: boolean;
  onSave: (patch: { label?: LocalizedString; helpText?: LocalizedString | null }) => Promise<void>;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState(option.label.en);
  const [help, setHelp] = useState(option.helpText?.en ?? "");

  useEffect(() => {
    setLabel(option.label.en);
    setHelp(option.helpText?.en ?? "");
  }, [option]);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Label">
        <Input value={label} onChange={(e) => setLabel(e.target.value)} />
      </Field>
      <Field label="Help">
        <Input value={help} onChange={(e) => setHelp(e.target.value)} placeholder="Optional hint" />
      </Field>
      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          size="sm"
          disabled={busy || !label.trim()}
          onClick={() =>
            void onSave({
              label: { en: label.trim() },
              helpText: help.trim() ? { en: help.trim() } : null,
            })
          }
        >
          Save option
        </Button>
      </div>
    </div>
  );
}
