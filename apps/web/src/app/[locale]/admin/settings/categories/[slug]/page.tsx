"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Download,
  Layers,
  Plus,
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
import { Badge } from "@ceylonweddings/ui/components/badge";
import { Button } from "@ceylonweddings/ui/components/button";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { Input } from "@ceylonweddings/ui/components/input";
import { Switch } from "@ceylonweddings/ui/components/switch";
import { Textarea } from "@ceylonweddings/ui/components/textarea";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { Link, useRouter } from "../../../../../../i18n/navigation";
import { StageEditor } from "./_components/stage-editor";

const TYPE_STATUSES: VendorTypeStatus[] = ["DRAFT", "ACTIVE", "HIDDEN", "ARCHIVED"];
const GALLERY_LAYOUTS: GalleryLayout[] = ["default", "venue", "portrait", "detail"];
const VALUE_TYPES: AttributeValueType[] = [
  "SELECT",
  "MULTISELECT",
  "BOOLEAN",
  "NUMBER",
  "RANGE",
  "TEXT",
];
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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[13px] font-medium leading-none tracking-[0.01em] text-foreground/80">
        {label}
      </span>
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
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}

export default function AdminCategoryDetailPage() {
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
      setMeta({
        label: localizedOrEmpty(full.label),
        description: localizedOrEmpty(full.description),
        featured: full.featured,
        coreTeam: full.coreTeam,
        galleryLayout: full.galleryLayout,
        coverUrl: full.coverUrl ?? "",
        status: full.status,
      });
      setTypeStageBlocks(full.onboardingPresentation?.questionDefault?.blocks ?? []);
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
    return <p className="text-sm text-muted-foreground">Loading…</p>;
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

  return (
    <div className="grid gap-8">
      <PageHeader
        icon={Layers}
        kicker="Vendor types"
        title={meta.label.en || type.slug}
        description={`${type.slug} · ${analytics?.vendorCount ?? "—"} vendors · ${activeAttributes.length} questions · ${requiredCount} required`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/settings/categories">Back</Link>
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
            <Button size="sm" disabled={busy} onClick={() => void saveMeta()}>
              Save type
            </Button>
          </div>
        }
      />

      {message ? <FormStatus>{message}</FormStatus> : null}

      {requiredCount > 4 ? (
        <FormStatus tone="destructive">
          {requiredCount} required questions — prefer 4 or fewer for onboarding.
        </FormStatus>
      ) : null}

      {showClone ? (
        <SectionCard title="Clone type" icon={Copy}>
          <Field label="New slug">
            <Input
              value={cloneSlug}
              onChange={(e) => setCloneSlug(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))}
              placeholder={`${type.slug}_COPY`}
              className="max-w-sm"
            />
          </Field>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
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
              Clone
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowClone(false)}>
              Cancel
            </Button>
          </div>
        </SectionCard>
      ) : null}

      <SectionCard title="Type details" icon={Layers}>
        <div className="grid gap-4">
          <Field label="Display name">
            <Input
              value={meta.label.en}
              onChange={(e) =>
                setMeta((m) => ({ ...m, label: { ...m.label, en: e.target.value } }))
              }
            />
          </Field>
          <Field label="Description">
            <Textarea
              rows={2}
              value={meta.description.en}
              onChange={(e) =>
                setMeta((m) => ({
                  ...m,
                  description: { ...m.description, en: e.target.value },
                }))
              }
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Status">
              <select
                className="rounded-lg border border-border/70 bg-background px-3 py-2 text-sm"
                value={meta.status}
                onChange={(e) =>
                  setMeta((m) => ({ ...m, status: e.target.value as VendorTypeStatus }))
                }
              >
                {TYPE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Gallery layout">
              <select
                className="rounded-lg border border-border/70 bg-background px-3 py-2 text-sm"
                value={meta.galleryLayout}
                onChange={(e) =>
                  setMeta((m) => ({ ...m, galleryLayout: e.target.value as GalleryLayout }))
                }
              >
                {GALLERY_LAYOUTS.map((layout) => (
                  <option key={layout} value={layout}>
                    {layout}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Cover URL">
              <Input
                value={meta.coverUrl}
                onChange={(e) => setMeta((m) => ({ ...m, coverUrl: e.target.value }))}
                placeholder="https://"
              />
            </Field>
          </div>
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
          <StageEditor
            blocks={typeStageBlocks}
            onChange={setTypeStageBlocks}
            previewTitle={meta.label.en || "Question"}
            disabled={busy}
          />
          <Button
            size="sm"
            variant="outline"
            className="w-fit"
            disabled={busy || type.status === "ARCHIVED"}
            onClick={async () => {
              if (!confirm("Archive this type?")) return;
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
            Archive type
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Questions" icon={Layers}>
        <div className="mb-3 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setShowAddQuestion((v) => !v)}>
            <Plus className="size-3.5" />
            Add question
          </Button>
        </div>

        {showAddQuestion ? (
          <div className="mb-4 grid gap-2 rounded-lg border border-border/60 p-3">
            <div className="grid gap-2 sm:grid-cols-3">
              <Input
                value={newQuestionLabel}
                onChange={(e) => setNewQuestionLabel(e.target.value)}
                placeholder="Question"
              />
              <Input
                value={newQuestionKey}
                onChange={(e) =>
                  setNewQuestionKey(
                    e.target.value.replace(/[^a-zA-Z0-9_]/g, "").replace(/^([^a-z])/, ""),
                  )
                }
                placeholder="key"
              />
              <select
                className="rounded-lg border border-border/70 bg-background px-3 py-2 text-sm"
                value={newQuestionType}
                onChange={(e) => setNewQuestionType(e.target.value as AttributeValueType)}
              >
                {VALUE_TYPES.map((vt) => (
                  <option key={vt} value={vt}>
                    {vt}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={busy || !newQuestionKey || !newQuestionLabel.trim()}
                onClick={async () => {
                  setBusy(true);
                  try {
                    const created = await api.admin.createAttributeDefinition(type.id, {
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
                    setNewQuestionKey("");
                    setNewQuestionLabel("");
                    setExpandedId(created.id);
                    await load();
                  } catch (err) {
                    setMessage(err instanceof Error ? err.message : "Create failed");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Create
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowAddQuestion(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : null}

        <ul className="grid gap-2">
          {attributes.map((def) => {
            const expanded = expandedId === def.id;
            return (
              <li key={def.id} className="rounded-lg border border-border/60">
                <div className="flex flex-wrap items-center gap-2 px-3 py-2">
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left text-sm font-medium"
                    onClick={() => setExpandedId(expanded ? null : def.id)}
                  >
                    {def.question.en}
                  </button>
                  <Badge intent="outline">{def.valueType}</Badge>
                  <Badge intent={def.required ? "warning" : "outline"}>
                    {def.required ? "Required" : "Optional"}
                  </Badge>
                  {def.filterable ? <Badge intent="outline">Filterable</Badge> : null}
                  <Badge intent={def.status === "ACTIVE" ? "success" : "outline"}>
                    {def.status}
                  </Badge>
                  <div className="ml-auto flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => void moveAttribute(def, -1)}
                    >
                      <ArrowUp className="size-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => void moveAttribute(def, 1)}
                    >
                      <ArrowDown className="size-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy || def.status === "ARCHIVED"}
                      onClick={async () => {
                        if (!confirm("Archive this question?")) return;
                        setBusy(true);
                        try {
                          await api.admin.deleteAttributeDefinition(type.id, def.id);
                          setMessage("Question archived");
                          await load();
                        } catch (err) {
                          setMessage(err instanceof Error ? err.message : "Archive failed");
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      Archive
                    </Button>
                  </div>
                </div>
                {expanded ? (
                  <AttributeEditor
                    typeId={type.id}
                    definition={def}
                    busy={busy}
                    setBusy={setBusy}
                    onSaved={async (msg) => {
                      setMessage(msg);
                      await load();
                    }}
                  />
                ) : null}
              </li>
            );
          })}
          {attributes.length === 0 ? (
            <li className="px-1 py-4 text-xs text-muted-foreground">No questions yet.</li>
          ) : null}
        </ul>
      </SectionCard>
    </div>
  );
}

function AttributeEditor({
  typeId,
  definition,
  busy,
  setBusy,
  onSaved,
}: {
  typeId: string;
  definition: VendorAttributeDefinition;
  busy: boolean;
  setBusy: (v: boolean) => void;
  onSaved: (message: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState({
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
    minValue: definition.minValue ?? "",
    maxValue: definition.maxValue ?? "",
    maxSelect: definition.maxSelect ?? "",
    status: definition.status,
    valueType: definition.valueType,
  });
  const [stageBlocks, setStageBlocks] = useState<DecorationBlock[]>(
    definition.presentation?.blocks ?? [],
  );
  const [stageInherit, setStageInherit] = useState(definition.presentation?.inherit ?? true);
  const [newOptKey, setNewOptKey] = useState("");
  const [newOptLabel, setNewOptLabel] = useState("");
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);

  useEffect(() => {
    setDraft({
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
      minValue: definition.minValue ?? "",
      maxValue: definition.maxValue ?? "",
      maxSelect: definition.maxSelect ?? "",
      status: definition.status,
      valueType: definition.valueType,
    });
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

  async function saveDefinition(patch?: Partial<typeof draft>) {
    const next = { ...draft, ...patch };
    if (patch) setDraft(next);

    if (
      next.valueType !== definition.valueType &&
      !confirm(
        `Change answer type from ${definition.valueType} to ${next.valueType}?\n\nExisting vendor answers for this question will be cleared.`,
      )
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
        presentation: stageBlocks.length
          ? { version: 1, blocks: stageBlocks, inherit: stageInherit }
          : null,
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
    <div className="grid gap-4 border-t border-border/60 px-3 py-3">
      <Field label="Question">
        <Input
          value={draft.question.en}
          onChange={(e) =>
            setDraft((d) => ({ ...d, question: { ...d.question, en: e.target.value } }))
          }
        />
      </Field>
      <Field label="Help text">
        <Textarea
          rows={2}
          value={draft.helpText.en}
          onChange={(e) =>
            setDraft((d) => ({ ...d, helpText: { ...d.helpText, en: e.target.value } }))
          }
          placeholder="Shown on the info icon"
        />
      </Field>
      <Field label="Instruction">
        <Input
          value={draft.instruction.en}
          onChange={(e) =>
            setDraft((d) => ({
              ...d,
              instruction: { ...d.instruction, en: e.target.value },
            }))
          }
        />
      </Field>

      <div className="grid gap-2 sm:grid-cols-2">
        <SwitchRow
          label="Required at onboard"
          description="Vendors must answer before finishing setup"
          checked={draft.required}
          disabled={busy}
          onChange={(required) => void saveDefinition({ required })}
        />
        <SwitchRow
          label="Couples can filter"
          description="Shows as a Discover facet"
          checked={draft.filterable}
          disabled={busy}
          onChange={(filterable) => void saveDefinition({ filterable })}
        />
        <SwitchRow
          label="Filter highlight"
          checked={draft.filterHighlight}
          onChange={(filterHighlight) => setDraft((d) => ({ ...d, filterHighlight }))}
        />
        <SwitchRow
          label="Show on profile"
          checked={draft.showOnProfile}
          onChange={(showOnProfile) => setDraft((d) => ({ ...d, showOnProfile }))}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Answer type">
          <select
            className="rounded-lg border border-border/70 bg-background px-3 py-2 text-sm"
            value={draft.valueType}
            onChange={(e) =>
              setDraft((d) => ({ ...d, valueType: e.target.value as AttributeValueType }))
            }
          >
            {VALUE_TYPES.map((vt) => (
              <option key={vt} value={vt}>
                {vt}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Layout">
          <select
            className="rounded-lg border border-border/70 bg-background px-3 py-2 text-sm"
            value={draft.layout}
            onChange={(e) => setDraft((d) => ({ ...d, layout: e.target.value as AttributeLayout }))}
          >
            {LAYOUTS.map((layout) => (
              <option key={layout} value={layout}>
                {layout}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select
            className="rounded-lg border border-border/70 bg-background px-3 py-2 text-sm"
            value={draft.status}
            onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as AttributeStatus }))}
          >
            {ATTR_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Filter label">
          <Input
            value={draft.filterLabel.en}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                filterLabel: { ...d.filterLabel, en: e.target.value },
              }))
            }
          />
        </Field>
        <Field label="Unit">
          <Input
            value={draft.unit}
            onChange={(e) => setDraft((d) => ({ ...d, unit: e.target.value }))}
            placeholder="guests"
          />
        </Field>
        <Field label="Max select">
          <Input
            type="number"
            value={draft.maxSelect}
            onChange={(e) => setDraft((d) => ({ ...d, maxSelect: e.target.value }))}
          />
        </Field>
      </div>

      <StageEditor
        blocks={stageBlocks}
        onChange={setStageBlocks}
        inherit={stageInherit}
        onInheritChange={setStageInherit}
        previewTitle={draft.question.en}
        disabled={busy}
      />

      <Button size="sm" className="w-fit" disabled={busy} onClick={() => void saveDefinition()}>
        Save question
      </Button>

      {isChoice ? (
        <div className="grid gap-2">
          <p className="text-sm font-medium">Options</p>
          <p className="text-xs text-muted-foreground">
            Click Edit to change a label or help text — this is not an answer picker.
          </p>
          <ul className="grid gap-2">
            {options.map((opt) => {
              const editing = editingOptionId === opt.id;
              return (
                <li key={opt.id} className="rounded-lg border border-border/50 px-3 py-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{opt.label.en}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {opt.key}
                        {!opt.active ? " · archived" : ""}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingOptionId(editing ? null : opt.id)}
                    >
                      {editing ? "Close" : "Edit"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => void moveOption(opt, -1)}
                    >
                      <ArrowUp className="size-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => void moveOption(opt, 1)}
                    >
                      <ArrowDown className="size-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy || !opt.active}
                      onClick={async () => {
                        if (!confirm("Archive this option?")) return;
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
                      Archive
                    </Button>
                  </div>
                  {editing ? (
                    <div className="mt-3 grid gap-2 border-t border-border/40 pt-3">
                      <OptionLabelEditor
                        option={opt}
                        busy={busy}
                        onSave={async (patch) => {
                          setBusy(true);
                          try {
                            await api.admin.updateAttributeOption(
                              typeId,
                              definition.id,
                              opt.id,
                              patch,
                            );
                            await onSaved("Option updated");
                            setEditingOptionId(null);
                          } catch (err) {
                            await onSaved(
                              err instanceof Error ? err.message : "Option update failed",
                            );
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
          </ul>
          <div className="flex flex-wrap gap-2">
            <Input
              className="max-w-[10rem]"
              value={newOptKey}
              onChange={(e) =>
                setNewOptKey(
                  e.target.value.replace(/[^a-zA-Z0-9_]/g, "").replace(/^([^a-z])/, ""),
                )
              }
              placeholder="optionKey"
            />
            <Input
              className="max-w-xs"
              value={newOptLabel}
              onChange={(e) => setNewOptLabel(e.target.value)}
              placeholder="Label"
            />
            <Button
              size="sm"
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
                  await onSaved("Option added");
                } catch (err) {
                  await onSaved(err instanceof Error ? err.message : "Add option failed");
                } finally {
                  setBusy(false);
                }
              }}
            >
              Add option
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function OptionLabelEditor({
  option,
  busy,
  onSave,
}: {
  option: VendorAttributeOption;
  busy: boolean;
  onSave: (patch: {
    label?: LocalizedString;
    helpText?: LocalizedString | null;
  }) => Promise<void>;
}) {
  const [label, setLabel] = useState(option.label.en);
  const [help, setHelp] = useState(option.helpText?.en ?? "");

  useEffect(() => {
    setLabel(option.label.en);
    setHelp(option.helpText?.en ?? "");
  }, [option]);

  return (
    <div className="grid gap-2">
      <Input value={label} onChange={(e) => setLabel(e.target.value)} />
      <Textarea
        rows={2}
        value={help}
        onChange={(e) => setHelp(e.target.value)}
        placeholder="Option help"
      />
      <Button
        size="sm"
        className="w-fit"
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
  );
}
