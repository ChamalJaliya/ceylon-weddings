"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, CreditCard, GripVertical, Pencil, Plus, Sparkles, Star, X } from "lucide-react";
import { api, formatMoney } from "@ceylonweddings/web";
import type {
  BillingInterval,
  PlanBillingMode,
  SubscriptionPlan,
  UpsertSubscriptionPlanBody,
} from "@ceylonweddings/contracts";
import { Badge } from "@ceylonweddings/ui/components/badge";
import { Button } from "@ceylonweddings/ui/components/button";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { Input } from "@ceylonweddings/ui/components/input";
import { Combobox } from "@ceylonweddings/ui/components/combobox";
import { Switch } from "@ceylonweddings/ui/components/switch";
import { Label } from "@ceylonweddings/ui/components/label";
import {
  FloatingPanel,
  FloatingPanelBody,
  FloatingPanelContent,
  FloatingPanelFooter,
  FloatingPanelHeader,
  FloatingPanelSection,
} from "@ceylonweddings/ui/domain/floating-panel";
import { AdminListToolbar } from "@ceylonweddings/ui/domain/admin-list-toolbar";
import { cn } from "@ceylonweddings/ui/lib/utils";
import { Textarea } from "@ceylonweddings/ui/components/textarea";
import { DataTableCell, DataTableHead } from "@ceylonweddings/ui/domain/data-table";
import { DataTableList } from "@ceylonweddings/ui/domain/data-table-list";
import { PlanningHero } from "@/features/planning/components/planning-hero";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { SettingsSwitchRow } from "@ceylonweddings/ui/domain/settings-switch-row";
import { useClientTablePagination } from "@ceylonweddings/ui/lib/use-client-table-pagination";
import { Link } from "@/i18n/navigation";

const PLAN_COLUMNS = ["plan", "billing", "price", "active", "actions"] as const;

const INTERVAL_OPTIONS: { value: BillingInterval; label: string }[] = [
  { value: "MONTHLY", label: "Monthly" },
  { value: "ANNUAL", label: "Annual" },
];

const BILLING_MODE_OPTIONS: { value: PlanBillingMode; label: string }[] = [
  { value: "checkout", label: "Checkout (PayHere / Stripe)" },
  { value: "contact", label: "Contact sales" },
];

const EMPTY_FORM: UpsertSubscriptionPlanBody = {
  slug: "pro",
  name: "",
  description: null,
  interval: "MONTHLY",
  priceLkr: 0,
  features: [],
  billingMode: "checkout",
  recommended: false,
  sortOrder: 0,
  active: true,
  stripePriceId: null,
};

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 gap-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function priceLabel(plan: SubscriptionPlan) {
  if (plan.billingMode === "contact") return "Contact us";
  return formatMoney(plan.priceLkr, "LKR");
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<UpsertSubscriptionPlanBody>(EMPTY_FORM);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [newFeature, setNewFeature] = useState("");
  const [query, setQuery] = useState("");
  const [intervalFilter, setIntervalFilter] = useState("all");
  const [previewInterval, setPreviewInterval] = useState<BillingInterval>("MONTHLY");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setPlans(await api.admin.subscriptionPlans());
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
    const q = query.trim().toLowerCase();
    return plans.filter((plan) => {
      if (intervalFilter !== "all" && plan.interval !== intervalFilter) return false;
      if (!q) return true;
      return [plan.name, plan.slug, plan.description].filter(Boolean).some((t) => String(t).toLowerCase().includes(q));
    });
  }, [plans, query, intervalFilter]);

  const { page, setPage, setLimit, pageItems, total, totalPages, limit } = useClientTablePagination(
    filtered,
    25,
    `${query}|${intervalFilter}`,
  );

  // One card per tier (slug), using the chosen interval, falling back to any active row.
  const tiers = useMemo(() => {
    const bySlug = new Map<string, SubscriptionPlan[]>();
    for (const plan of plans.filter((p) => p.active)) {
      bySlug.set(plan.slug, [...(bySlug.get(plan.slug) ?? []), plan]);
    }
    return [...bySlug.values()]
      .map((rows) => rows.find((row) => row.interval === previewInterval) ?? rows[0]!)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [plans, previewInterval]);

  const monthlyBySlug = useMemo(
    () => new Map(plans.filter((p) => p.interval === "MONTHLY").map((p) => [p.slug, p.priceLkr])),
    [plans],
  );

  if (error && !plans.length) {
    return (
      <FormStatus tone="destructive">
        {error}. <Link href="/login">Sign in</Link>
      </FormStatus>
    );
  }

  function openCreate() {
    setEditingKey(null);
    setForm({ ...EMPTY_FORM });
    setOpen(true);
  }

  function openEdit(plan: SubscriptionPlan) {
    setEditingKey(`${plan.slug}::${plan.interval}`);
    setForm({
      slug: plan.slug,
      name: plan.name,
      description: plan.description,
      interval: plan.interval,
      priceLkr: plan.priceLkr,
      features: plan.features,
      limits: plan.limits ?? undefined,
      billingMode: plan.billingMode,
      recommended: plan.recommended,
      sortOrder: plan.sortOrder,
      active: plan.active,
      stripePriceId: plan.stripePriceId ?? null,
    });
    setOpen(true);
  }

  async function save() {
    setSaving(true);
    try {
      await api.admin.upsertSubscriptionPlan(form);
      setOpen(false);
      setNotice(`${form.name} saved`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(plan: SubscriptionPlan) {
    setPlans((prev) => prev.map((p) => (p.id === plan.id ? { ...p, active: !p.active } : p)));
    try {
      await api.admin.setSubscriptionPlanActive(plan.id, !plan.active);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update plan");
      await load();
    }
  }

  function addFeature() {
    const value = newFeature.trim();
    if (!value) return;
    setForm((f) => ({ ...f, features: [...f.features, value] }));
    setNewFeature("");
  }

  const annualSaving =
    form.interval === "ANNUAL" && monthlyBySlug.get(form.slug)
      ? Math.round((1 - form.priceLkr / (monthlyBySlug.get(form.slug)! * 12)) * 100)
      : null;

  return (
    <div className="grid min-w-0 gap-8">
      <PlanningHero
        icon={CreditCard}
        kicker="Settings"
        title="Plans & pricing"
        description="What vendors pay for Pro and Spotlight — prices, features and how they check out."
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4" />
            New plan
          </Button>
        }
      />

      {notice ? <FormStatus tone="success">{notice}</FormStatus> : null}
      {error ? <FormStatus tone="destructive">{error}</FormStatus> : null}

      <section className="grid gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3 px-1">
          <div className="grid gap-0.5">
            <h2 className="font-serif text-2xl">What vendors see</h2>
            <p className="text-sm text-muted-foreground">Live preview of the billing page. Click a card to edit it.</p>
          </div>
          <div className="inline-flex rounded-full border border-border bg-muted/60 p-1">
            {INTERVAL_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPreviewInterval(option.value)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm transition",
                  previewInterval === option.value
                    ? "bg-card font-medium text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tiers.map((plan) => (
            <button
              key={plan.id}
              type="button"
              onClick={() => openEdit(plan)}
              className={cn(
                "group relative grid content-start gap-4 rounded-3xl border bg-card p-6 text-left shadow-card transition hover:-translate-y-0.5",
                plan.recommended ? "border-primary/50 ring-2 ring-primary/20" : "border-border hover:border-primary/30",
              )}
            >
              {plan.recommended ? (
                <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground shadow">
                  <Star className="size-3 fill-current" />
                  Recommended
                </span>
              ) : null}
              <div className="flex items-start justify-between gap-3">
                <div className="grid gap-1">
                  <p className="font-serif text-2xl">{plan.name}</p>
                  {plan.description ? <p className="text-sm text-muted-foreground">{plan.description}</p> : null}
                </div>
                <Pencil className="size-4 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
              </div>
              <p className="flex items-baseline gap-1.5">
                <span className="font-serif text-4xl tabular-nums">{priceLabel(plan)}</span>
                {plan.billingMode === "checkout" ? (
                  <span className="text-sm text-muted-foreground">
                    / {plan.interval === "ANNUAL" ? "year" : "month"}
                  </span>
                ) : null}
              </p>
              {plan.interval !== previewInterval && plan.billingMode === "checkout" ? (
                <p className="-mt-2 text-xs text-warning">
                  No {previewInterval.toLowerCase()} price — showing {plan.interval.toLowerCase()}
                </p>
              ) : null}
              <ul className="grid gap-2 border-t border-border pt-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-success" />
                    {feature}
                  </li>
                ))}
                {plan.features.length === 0 ? (
                  <li className="text-sm text-muted-foreground">No features listed yet.</li>
                ) : null}
              </ul>
            </button>
          ))}
          {!loading && tiers.length === 0 ? (
            <div className="grid min-h-48 place-items-center rounded-3xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground md:col-span-2 xl:col-span-3">
              No active plans. Vendors can’t upgrade until one is live.
            </div>
          ) : null}
        </div>
      </section>

      <SectionCard title="All plans" icon={CreditCard}>
        <AdminListToolbar
          searchValue={query}
          onSearchChange={setQuery}
          searchPlaceholder="Search plans…"
          filters={
            <Combobox
              aria-label="Filter by interval"
              className="w-full sm:w-40"
              value={intervalFilter}
              onValueChange={setIntervalFilter}
              options={[{ value: "all", label: "Any interval" }, ...INTERVAL_OPTIONS]}
            />
          }
          summary={loading ? "Loading…" : `${total} plan${total === 1 ? "" : "s"}`}
        />
        <DataTableList
          framed={false}
          loading={loading}
          loadingColumns={PLAN_COLUMNS.length}
          sourceCount={plans.length}
          filteredCount={filtered.length}
          empty={{
            icon: CreditCard,
            title: "No subscription plans",
            description: "Create Pro monthly and annual rows to power vendor checkout.",
          }}
          filteredEmpty={{
            onClearFilters: () => {
              setQuery("");
              setIntervalFilter("all");
            },
          }}
          pagination={
            totalPages > 0 ? { page, totalPages, total, limit, onPageChange: setPage, onLimitChange: setLimit } : null
          }
          items={pageItems}
          getRowId={(plan) => plan.id}
          orderedVisibleIds={PLAN_COLUMNS}
          renderHead={(id) => {
            const labels: Record<(typeof PLAN_COLUMNS)[number], string> = {
              plan: "Plan",
              billing: "Billing",
              price: "Price",
              active: "Live",
              actions: "Actions",
            };
            return <DataTableHead key={id}>{labels[id as (typeof PLAN_COLUMNS)[number]]}</DataTableHead>;
          }}
          renderCell={(id, plan) => {
            switch (id) {
              case "plan":
                return (
                  <DataTableCell key={id}>
                    <div className="flex items-center gap-2">
                      <div className="grid gap-0.5">
                        <span className="font-medium">{plan.name}</span>
                        <span className="font-mono text-xs text-muted-foreground">{plan.slug}</span>
                      </div>
                      {plan.recommended ? (
                        <Badge intent="love">
                          <Sparkles className="size-3" />
                          Recommended
                        </Badge>
                      ) : null}
                    </div>
                  </DataTableCell>
                );
              case "billing":
                return (
                  <DataTableCell key={id}>
                    <div className="grid gap-0.5 text-sm">
                      <span>{plan.interval === "ANNUAL" ? "Annual" : "Monthly"}</span>
                      <span className="text-xs text-muted-foreground">
                        {plan.billingMode === "contact" ? "Contact sales" : "Online checkout"}
                      </span>
                    </div>
                  </DataTableCell>
                );
              case "price":
                return (
                  <DataTableCell key={id} className="whitespace-nowrap tabular-nums">
                    {priceLabel(plan)}
                  </DataTableCell>
                );
              case "active":
                return (
                  <DataTableCell key={id}>
                    <Switch
                      checked={plan.active}
                      onCheckedChange={() => void toggleActive(plan)}
                      aria-label={`${plan.name} ${plan.interval} live`}
                    />
                  </DataTableCell>
                );
              case "actions":
                return (
                  <DataTableCell key={id}>
                    <Button size="sm" variant="outline" className="h-8 gap-1 px-2.5" onClick={() => openEdit(plan)}>
                      <Pencil className="size-3.5" />
                      Edit
                    </Button>
                  </DataTableCell>
                );
              default:
                return null;
            }
          }}
        />
      </SectionCard>

      <FloatingPanel open={open} onOpenChange={setOpen}>
        <FloatingPanelContent side="right" width="32rem">
          <FloatingPanelHeader
            icon={CreditCard}
            title={editingKey ? form.name || "Edit plan" : "New plan"}
            description={
              editingKey
                ? `${form.slug} · ${form.interval === "ANNUAL" ? "Annual" : "Monthly"}`
                : "Each tier has one row per billing interval."
            }
          />
          <FloatingPanelBody className="gap-7">
            <FloatingPanelSection title="Basics">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name">
                  <Input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Pro"
                  />
                </Field>
                <Field label="Slug" hint={editingKey ? "Fixed once created" : undefined}>
                  <Input
                    value={form.slug}
                    className="font-mono"
                    onChange={(e) =>
                      setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "") }))
                    }
                    placeholder="pro"
                    disabled={Boolean(editingKey)}
                  />
                </Field>
              </div>
              <Field label="Pitch">
                <Textarea
                  rows={2}
                  value={form.description ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value || null }))}
                  placeholder="One line under the plan name"
                />
              </Field>
            </FloatingPanelSection>

            <FloatingPanelSection title="Pricing">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Interval" hint={editingKey ? "Fixed once created" : undefined}>
                  <Combobox
                    aria-label="Billing interval"
                    value={form.interval}
                    onValueChange={(v) => setForm((f) => ({ ...f, interval: v as BillingInterval }))}
                    options={INTERVAL_OPTIONS}
                    disabled={Boolean(editingKey)}
                  />
                </Field>
                <Field label="How they pay">
                  <Combobox
                    aria-label="Billing mode"
                    value={form.billingMode}
                    onValueChange={(v) => setForm((f) => ({ ...f, billingMode: v as PlanBillingMode }))}
                    options={BILLING_MODE_OPTIONS}
                  />
                </Field>
              </div>
              {form.billingMode === "checkout" ? (
                <Field
                  label="Price (LKR)"
                  hint={
                    annualSaving !== null && annualSaving > 0
                      ? `${annualSaving}% less than paying monthly for a year`
                      : undefined
                  }
                >
                  <Input
                    type="number"
                    min={0}
                    className="font-serif text-xl tabular-nums"
                    value={form.priceLkr}
                    onChange={(e) => setForm((f) => ({ ...f, priceLkr: Number.parseInt(e.target.value, 10) || 0 }))}
                  />
                </Field>
              ) : null}
              <details className="rounded-2xl border border-border px-3 py-2 text-sm">
                <summary className="cursor-pointer text-muted-foreground">Advanced</summary>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <Field label="Stripe price ID" hint="Empty converts LKR → USD at checkout">
                    <Input
                      value={form.stripePriceId ?? ""}
                      className="font-mono text-xs"
                      onChange={(e) => setForm((f) => ({ ...f, stripePriceId: e.target.value.trim() || null }))}
                      placeholder="price_…"
                    />
                  </Field>
                  <Field label="Sort order">
                    <Input
                      type="number"
                      value={form.sortOrder ?? 0}
                      onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number.parseInt(e.target.value, 10) || 0 }))}
                    />
                  </Field>
                </div>
              </details>
            </FloatingPanelSection>

            <FloatingPanelSection title={`Features · ${form.features.length}`}>
              <ul className="grid gap-1.5">
                {form.features.map((feature, index) => (
                  <li
                    key={`${feature}-${index}`}
                    className="flex items-center gap-2 rounded-xl border border-border/70 bg-background/60 px-2.5 py-2 text-sm"
                  >
                    <GripVertical className="size-3.5 text-muted-foreground/50" />
                    <Check className="size-4 shrink-0 text-success" />
                    <Input
                      value={feature}
                      className="h-7 border-0 bg-transparent px-1 shadow-none"
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          features: f.features.map((item, i) => (i === index ? e.target.value : item)),
                        }))
                      }
                    />
                    <button
                      type="button"
                      aria-label="Remove feature"
                      className="grid size-6 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
                      onClick={() => setForm((f) => ({ ...f, features: f.features.filter((_, i) => i !== index) }))}
                    >
                      <X className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <Input
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addFeature();
                    }
                  }}
                  placeholder="Add a feature, press Enter"
                />
                <Button variant="outline" onClick={addFeature} disabled={!newFeature.trim()}>
                  <Plus className="size-4" />
                  Add
                </Button>
              </div>
            </FloatingPanelSection>

            <FloatingPanelSection title="Visibility">
              <SettingsSwitchRow
                label="Recommended"
                description="Highlighted on the vendor billing page."
                checked={form.recommended}
                onCheckedChange={(recommended) => setForm((f) => ({ ...f, recommended }))}
              />
              <SettingsSwitchRow
                label="Live"
                description="Off hides it from vendors."
                checked={form.active}
                onCheckedChange={(active) => setForm((f) => ({ ...f, active }))}
              />
            </FloatingPanelSection>
          </FloatingPanelBody>
          <FloatingPanelFooter className="flex items-center justify-end gap-2 space-y-0">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={saving || !form.slug.trim() || !form.name.trim()} onClick={() => void save()}>
              {saving ? "Saving…" : editingKey ? "Save" : "Create plan"}
            </Button>
          </FloatingPanelFooter>
        </FloatingPanelContent>
      </FloatingPanel>
    </div>
  );
}
