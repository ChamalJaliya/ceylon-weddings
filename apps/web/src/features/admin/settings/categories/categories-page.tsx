"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, Layers, Plus, Upload } from "lucide-react";
import { api, type TaxonomyImportResult } from "@ceylonweddings/web";
import { LEGACY_VENDOR_CATEGORY_SLUGS, taxonomyPackSchema, type VendorType } from "@ceylonweddings/contracts";
import { Badge } from "@ceylonweddings/ui/components/badge";
import { Button } from "@ceylonweddings/ui/components/button";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { Input } from "@ceylonweddings/ui/components/input";
import { AdminListToolbar } from "@ceylonweddings/ui/domain/admin-list-toolbar";
import { DataTableCell, DataTableHead } from "@ceylonweddings/ui/domain/data-table";
import { DataTableList } from "@ceylonweddings/ui/domain/data-table-list";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { SettingsList, SettingsListRow } from "@ceylonweddings/ui/domain/settings-list-row";
import { getListEmptyMode, showListChrome } from "@ceylonweddings/ui/lib/list-state";
import { useClientTablePagination } from "@ceylonweddings/ui/lib/use-client-table-pagination";
import { Link, useRouter } from "@/i18n/navigation";

const TYPE_COLUMNS = ["type", "questions", "required", "status", "actions"] as const;

function activeAttrs(type: VendorType) {
  return (type.attributes ?? []).filter((a) => a.status !== "ARCHIVED");
}

function requiredCount(type: VendorType) {
  return activeAttrs(type).filter((a) => a.required).length;
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

export default function AdminCategoriesPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [types, setTypes] = useState<VendorType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newSlug, setNewSlug] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [importPreview, setImportPreview] = useState<TaxonomyImportResult | null>(null);
  const [pendingPack, setPendingPack] = useState<ReturnType<typeof taxonomyPackSchema.parse> | null>(null);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setTypes(await api.admin.vendorTypes());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return types;
    return types.filter((t) => t.slug.toLowerCase().includes(needle) || t.label.en.toLowerCase().includes(needle));
  }, [types, q]);

  const { page, setPage, setLimit, pageItems, total, totalPages, limit } = useClientTablePagination(filtered, 25, q);
  const emptyMode = getListEmptyMode({ sourceCount: types.length, filteredCount: filtered.length });
  const chrome = showListChrome(emptyMode, loading);

  if (error) {
    return (
      <FormStatus tone="destructive">
        {error}. <Link href="/login">Sign in</Link>
      </FormStatus>
    );
  }

  return (
    <div className="grid gap-8">
      <PageHeader
        icon={Layers}
        kicker="Settings"
        title="Vendor types"
        description="Manage vendor categories, onboarding questions, options, and couple filters."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setStatus(null);
                try {
                  const pack = await api.admin.exportVendorTaxonomy();
                  downloadJson(`vendor-taxonomy-${new Date().toISOString().slice(0, 10)}.json`, pack);
                  setStatus("Exported taxonomy pack");
                } catch (err) {
                  setStatus(err instanceof Error ? err.message : "Export failed");
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Download className="size-3.5" />
              Export
            </Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => fileRef.current?.click()}>
              <Upload className="size-3.5" />
              Import
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                setBusy(true);
                setStatus(null);
                setImportPreview(null);
                setPendingPack(null);
                try {
                  const raw = JSON.parse(await file.text()) as unknown;
                  const pack = taxonomyPackSchema.parse(raw);
                  const preview = await api.admin.importVendorTaxonomy(pack, true);
                  setPendingPack(pack);
                  setImportPreview(preview);
                } catch (err) {
                  setStatus(err instanceof Error ? err.message : "Import preview failed");
                } finally {
                  setBusy(false);
                }
              }}
            />
            <Button size="sm" onClick={() => setShowAdd((v) => !v)}>
              <Plus className="size-3.5" />
              Add type
            </Button>
          </div>
        }
      />

      {status ? <FormStatus>{status}</FormStatus> : null}

      {importPreview && pendingPack ? (
        <SectionCard title="Import preview" icon={Upload}>
          {importPreview.blocked ? (
            <FormStatus tone="destructive" className="mb-3">
              Conflicts detected — resolve them before importing.
            </FormStatus>
          ) : null}
          <SettingsList className="mb-4 text-sm">
            {importPreview.preview.map((item) => (
              <SettingsListRow
                key={item.slug}
                title={item.slug}
                actions={<Badge intent="outline">{item.action}</Badge>}
              />
            ))}
          </SettingsList>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={busy || importPreview.blocked}
              onClick={async () => {
                setBusy(true);
                try {
                  const result = await api.admin.importVendorTaxonomy(pendingPack, false);
                  if (result.blocked) {
                    setImportPreview(result);
                    setStatus("Import blocked by conflicts");
                  } else {
                    setImportPreview(null);
                    setPendingPack(null);
                    setStatus("Import applied");
                    await load();
                  }
                } catch (err) {
                  setStatus(err instanceof Error ? err.message : "Import failed");
                } finally {
                  setBusy(false);
                }
              }}
            >
              Confirm import
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setImportPreview(null);
                setPendingPack(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </SectionCard>
      ) : null}

      {showAdd ? (
        <SectionCard title="Add vendor type" icon={Plus}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5">
              <span className="text-compact font-medium leading-none tracking-normal text-foreground/80">Slug</span>
              <Input
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))}
                placeholder="PHOTO_VIDEO"
                list="legacy-category-slugs"
              />
              <datalist id="legacy-category-slugs">
                {LEGACY_VENDOR_CATEGORY_SLUGS.map((slug) => (
                  <option key={slug} value={slug} />
                ))}
              </datalist>
            </label>
            <label className="grid gap-1.5">
              <span className="text-compact font-medium leading-none tracking-normal text-foreground/80">
                Display name
              </span>
              <Input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Photography & Video" />
            </label>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={busy || !newSlug || !newLabel.trim()}
              onClick={async () => {
                setBusy(true);
                setStatus(null);
                try {
                  const created = await api.admin.createVendorType({
                    slug: newSlug,
                    label: { en: newLabel.trim() },
                    galleryLayout: "default",
                    sortOrder: types.length,
                    featured: false,
                    coreTeam: false,
                    status: "DRAFT",
                  });
                  setShowAdd(false);
                  setNewSlug("");
                  setNewLabel("");
                  router.push(`/admin/settings/categories/${created.slug}`);
                } catch (err) {
                  setStatus(err instanceof Error ? err.message : "Create failed");
                } finally {
                  setBusy(false);
                }
              }}
            >
              Create
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
          </div>
        </SectionCard>
      ) : null}

      <SectionCard title="Types" icon={Layers}>
        {chrome ? (
          <AdminListToolbar
            searchValue={q}
            onSearchChange={setQ}
            searchPlaceholder="Search name or slug…"
            summary={loading ? "Loading…" : `${total} type${total === 1 ? "" : "s"}`}
          />
        ) : null}
        <DataTableList
          framed={false}
          loading={loading}
          loadingColumns={TYPE_COLUMNS.length}
          sourceCount={types.length}
          filteredCount={filtered.length}
          empty={{
            icon: Layers,
            title: "No vendor types",
            description: "Add a type, then configure its questions.",
          }}
          filteredEmpty={{
            onClearFilters: () => setQ(""),
          }}
          pagination={
            totalPages > 0
              ? {
                  page,
                  totalPages,
                  total,
                  limit,
                  onPageChange: setPage,
                  onLimitChange: setLimit,
                }
              : null
          }
          items={pageItems}
          getRowId={(type) => type.id}
          orderedVisibleIds={TYPE_COLUMNS}
          renderHead={(id) => {
            const labels: Record<(typeof TYPE_COLUMNS)[number], string> = {
              type: "Type",
              questions: "Questions",
              required: "Required",
              status: "Status",
              actions: "",
            };
            return <DataTableHead key={id}>{labels[id as (typeof TYPE_COLUMNS)[number]]}</DataTableHead>;
          }}
          renderCell={(id, type) => {
            const attrs = activeAttrs(type);
            const required = requiredCount(type);
            switch (id) {
              case "type":
                return (
                  <DataTableCell key={id}>
                    <p className="font-medium">{type.label.en}</p>
                    <p className="text-xs text-muted-foreground">{type.slug}</p>
                  </DataTableCell>
                );
              case "questions":
                return (
                  <DataTableCell key={id}>
                    <span className="tabular-nums">{attrs.length}</span>
                  </DataTableCell>
                );
              case "required":
                return (
                  <DataTableCell key={id}>
                    <span className={required > 4 ? "font-medium text-warning-fg" : "tabular-nums"}>{required}</span>
                  </DataTableCell>
                );
              case "status":
                return (
                  <DataTableCell key={id}>
                    <div className="flex flex-wrap gap-1">
                      <Badge intent={type.status === "ACTIVE" ? "success" : "outline"}>{type.status}</Badge>
                      {type.featured ? <Badge intent="outline">Featured</Badge> : null}
                      {type.coreTeam ? <Badge intent="outline">Core</Badge> : null}
                    </div>
                  </DataTableCell>
                );
              case "actions":
                return (
                  <DataTableCell key={id}>
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/admin/settings/categories/${type.slug}`}>Open</Link>
                    </Button>
                  </DataTableCell>
                );
              default:
                return null;
            }
          }}
        />
      </SectionCard>
    </div>
  );
}
