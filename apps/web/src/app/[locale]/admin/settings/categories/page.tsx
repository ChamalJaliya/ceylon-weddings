"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, Layers, Plus, Upload } from "lucide-react";
import { api, type TaxonomyImportResult } from "@ceylonweddings/web";
import {
  LEGACY_VENDOR_CATEGORY_SLUGS,
  taxonomyPackSchema,
  type VendorType,
} from "@ceylonweddings/contracts";
import { Badge } from "@ceylonweddings/ui/components/badge";
import { Button } from "@ceylonweddings/ui/components/button";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { Input } from "@ceylonweddings/ui/components/input";
import { EmptyState } from "@ceylonweddings/ui/domain/empty-state";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import {
  AdminDataCell,
  AdminDataRow,
  AdminDataTable,
} from "@ceylonweddings/ui/domain/admin-data-table";
import { Link, useRouter } from "../../../../../i18n/navigation";

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
  const [pendingPack, setPendingPack] = useState<ReturnType<typeof taxonomyPackSchema.parse> | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    try {
      setTypes(await api.admin.vendorTypes());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return types;
    return types.filter(
      (t) =>
        t.slug.toLowerCase().includes(needle) || t.label.en.toLowerCase().includes(needle),
    );
  }, [types, q]);

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
          <ul className="mb-4 grid gap-2 text-sm">
            {importPreview.preview.map((item) => (
              <li key={item.slug} className="rounded-lg border border-border/60 px-3 py-2">
                <span className="font-medium">{item.slug}</span>{" "}
                <Badge intent="outline">{item.action}</Badge>
              </li>
            ))}
          </ul>
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
              <span className="text-[13px] font-medium leading-none tracking-[0.01em] text-foreground/80">Slug</span>
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
              <span className="text-[13px] font-medium leading-none tracking-[0.01em] text-foreground/80">
                Display name
              </span>
              <Input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Photography & Video"
              />
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
        <div className="mb-4">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or slug…"
          />
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={Layers}
            title={types.length === 0 ? "No vendor types" : "No matches"}
            description={
              types.length === 0
                ? "Add a type, then configure its questions."
                : "Try a different search."
            }
          />
        ) : (
          <AdminDataTable headers={["Type", "Questions", "Required", "Status", ""]}>
            {filtered.map((type) => {
              const attrs = activeAttrs(type);
              const required = requiredCount(type);
              return (
                <AdminDataRow key={type.id}>
                  <AdminDataCell>
                    <p className="font-medium">{type.label.en}</p>
                    <p className="text-xs text-muted-foreground">{type.slug}</p>
                  </AdminDataCell>
                  <AdminDataCell>
                    <span className="tabular-nums">{attrs.length}</span>
                  </AdminDataCell>
                  <AdminDataCell>
                    <span
                      className={
                        required > 4
                          ? "font-medium text-amber-700 dark:text-amber-400"
                          : "tabular-nums"
                      }
                    >
                      {required}
                    </span>
                  </AdminDataCell>
                  <AdminDataCell>
                    <div className="flex flex-wrap gap-1">
                      <Badge intent={type.status === "ACTIVE" ? "success" : "outline"}>
                        {type.status}
                      </Badge>
                      {type.featured ? <Badge intent="outline">Featured</Badge> : null}
                      {type.coreTeam ? <Badge intent="outline">Core</Badge> : null}
                    </div>
                  </AdminDataCell>
                  <AdminDataCell>
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/admin/settings/categories/${type.slug}`}>Open</Link>
                    </Button>
                  </AdminDataCell>
                </AdminDataRow>
              );
            })}
          </AdminDataTable>
        )}
      </SectionCard>
    </div>
  );
}
