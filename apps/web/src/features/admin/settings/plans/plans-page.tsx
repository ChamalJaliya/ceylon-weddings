"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CreditCard, Pencil, Plus } from "lucide-react";
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
import { SimpleSelect } from "@ceylonweddings/ui/components/select";
import { Textarea } from "@ceylonweddings/ui/components/textarea";
import { DataTableCell, DataTableHead } from "@ceylonweddings/ui/domain/data-table";
import { DataTableList } from "@ceylonweddings/ui/domain/data-table-list";
import { PlanningHero } from "@/features/planning/components/planning-hero";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { SettingsSwitchRow } from "@ceylonweddings/ui/domain/settings-switch-row";
import { useClientTablePagination } from "@ceylonweddings/ui/lib/use-client-table-pagination";
import { Link } from "@/i18n/navigation";

const PLAN_COLUMNS = ["slug", "name", "interval", "price", "billingMode", "recommended", "active", "actions"] as const;

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

function featuresToText(features: string[]) {
  return features.join("\n");
}

function textToFeatures(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [featuresText, setFeaturesText] = useState("");
  const [form, setForm] = useState<UpsertSubscriptionPlanBody>(EMPTY_FORM);
  const [editingKey, setEditingKey] = useState<string | null>(null);

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

  const { page, setPage, setLimit, pageItems, total, totalPages, limit } = useClientTablePagination(
    plans,
    25,
    plans.length,
  );

  const formTitle = useMemo(() => {
    if (!editingKey) return "Create plan";
    const [slug, interval] = editingKey.split("::");
    return `Edit ${slug} · ${interval}`;
  }, [editingKey]);

  if (error) {
    return (
      <FormStatus tone="destructive">
        {error}. <Link href="/login">Sign in</Link>
      </FormStatus>
    );
  }

  function openCreate() {
    setEditingKey(null);
    setForm({ ...EMPTY_FORM });
    setFeaturesText("");
    setShowForm(true);
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
    setFeaturesText(featuresToText(plan.features));
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingKey(null);
  }

  return (
    <div className="grid gap-8">
      <PlanningHero
        icon={CreditCard}
        kicker="Settings"
        title="Plans & pricing"
        description="Membership catalog for vendor Pro and Spotlight tiers — prices, features, and checkout mode."
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4" />
            New plan
          </Button>
        }
      />

      {showForm ? (
        <SectionCard title={formTitle} icon={CreditCard}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              Slug
              <Input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="pro"
                disabled={Boolean(editingKey)}
              />
            </label>
            <label className="grid gap-1 text-sm">
              Name
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ceylon Weddings Pro"
              />
            </label>
            <label className="grid gap-1 text-sm">
              Interval
              <SimpleSelect
                value={form.interval}
                onValueChange={(v) => setForm((f) => ({ ...f, interval: v as BillingInterval }))}
                aria-label="Billing interval"
                options={INTERVAL_OPTIONS}
                disabled={Boolean(editingKey)}
              />
            </label>
            <label className="grid gap-1 text-sm">
              Price (LKR)
              <Input
                type="number"
                min={0}
                value={form.priceLkr}
                onChange={(e) => setForm((f) => ({ ...f, priceLkr: Number.parseInt(e.target.value, 10) || 0 }))}
              />
            </label>
            <label className="grid gap-1 text-sm">
              Billing mode
              <SimpleSelect
                value={form.billingMode}
                onValueChange={(v) => setForm((f) => ({ ...f, billingMode: v as PlanBillingMode }))}
                aria-label="Billing mode"
                options={BILLING_MODE_OPTIONS}
              />
            </label>
            <label className="grid gap-1 text-sm">
              Sort order
              <Input
                type="number"
                value={form.sortOrder ?? 0}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number.parseInt(e.target.value, 10) || 0 }))}
              />
            </label>
            <label className="grid gap-1 text-sm sm:col-span-2">
              Description
              <Textarea
                value={form.description ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value || null }))}
                rows={2}
                placeholder="Short pitch for the pricing card"
              />
            </label>
            <label className="grid gap-1 text-sm sm:col-span-2">
              Stripe Price ID (optional)
              <Input
                value={form.stripePriceId ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, stripePriceId: e.target.value.trim() || null }))}
                placeholder="price_… — leave empty to convert LKR → USD at checkout"
              />
            </label>
            <label className="grid gap-1 text-sm sm:col-span-2">
              Features (one per line)
              <Textarea
                value={featuresText}
                onChange={(e) => setFeaturesText(e.target.value)}
                rows={6}
                placeholder={"Verified Pro badge\nWhatsApp lead alerts"}
              />
            </label>
          </div>
          <div className="mt-4 grid gap-2 sm:max-w-md">
            <SettingsSwitchRow
              label="Recommended"
              description="Highlights this tier on the vendor billing page."
              checked={form.recommended}
              onCheckedChange={(recommended) => setForm((f) => ({ ...f, recommended }))}
            />
            <SettingsSwitchRow
              label="Active"
              description="Inactive plans are hidden from the public catalog."
              checked={form.active}
              onCheckedChange={(active) => setForm((f) => ({ ...f, active }))}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={saving || !form.slug.trim() || !form.name.trim()}
              onClick={async () => {
                setSaving(true);
                try {
                  const body: UpsertSubscriptionPlanBody = {
                    ...form,
                    features: textToFeatures(featuresText),
                  };
                  await api.admin.upsertSubscriptionPlan(body);
                  closeForm();
                  await load();
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Save failed");
                } finally {
                  setSaving(false);
                }
              }}
            >
              {editingKey ? "Save changes" : "Create plan"}
            </Button>
            <Button size="sm" variant="outline" onClick={closeForm}>
              Cancel
            </Button>
          </div>
        </SectionCard>
      ) : null}

      <SectionCard title="Catalog" icon={CreditCard}>
        <DataTableList
          framed={false}
          loading={loading}
          loadingColumns={PLAN_COLUMNS.length}
          sourceCount={plans.length}
          filteredCount={plans.length}
          empty={{
            icon: CreditCard,
            title: "No subscription plans",
            description: "Create Pro monthly/annual rows to power vendor checkout.",
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
          getRowId={(plan) => plan.id}
          orderedVisibleIds={PLAN_COLUMNS}
          renderHead={(id) => {
            const labels: Record<(typeof PLAN_COLUMNS)[number], string> = {
              slug: "Slug",
              name: "Name",
              interval: "Interval",
              price: "Price",
              billingMode: "Billing",
              recommended: "Recommended",
              active: "Active",
              actions: "",
            };
            return <DataTableHead key={id}>{labels[id as (typeof PLAN_COLUMNS)[number]]}</DataTableHead>;
          }}
          renderCell={(id, plan) => {
            switch (id) {
              case "slug":
                return (
                  <DataTableCell key={id} className="font-mono text-xs">
                    {plan.slug}
                  </DataTableCell>
                );
              case "name":
                return (
                  <DataTableCell key={id} className="text-sm font-medium">
                    {plan.name}
                  </DataTableCell>
                );
              case "interval":
                return (
                  <DataTableCell key={id}>
                    <Badge intent="outline">{plan.interval}</Badge>
                  </DataTableCell>
                );
              case "price":
                return (
                  <DataTableCell key={id} className="text-xs tabular-nums">
                    {formatMoney(plan.priceLkr, "LKR")}
                  </DataTableCell>
                );
              case "billingMode":
                return (
                  <DataTableCell key={id} className="text-xs capitalize text-muted-foreground">
                    {plan.billingMode}
                  </DataTableCell>
                );
              case "recommended":
                return (
                  <DataTableCell key={id}>
                    {plan.recommended ? (
                      <Badge intent="success">Yes</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </DataTableCell>
                );
              case "active":
                return (
                  <DataTableCell key={id}>
                    <Badge intent={plan.active ? "success" : "outline"}>{plan.active ? "Active" : "Off"}</Badge>
                  </DataTableCell>
                );
              case "actions":
                return (
                  <DataTableCell key={id} className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(plan)}>
                        <Pencil className="size-3.5" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          await api.admin.setSubscriptionPlanActive(plan.id, !plan.active);
                          await load();
                        }}
                      >
                        {plan.active ? "Disable" : "Enable"}
                      </Button>
                    </div>
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
