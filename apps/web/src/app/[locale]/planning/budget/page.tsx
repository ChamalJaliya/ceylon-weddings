"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Wallet } from "lucide-react";
import { api, formatMoney, usePreferenceStore } from "@ceylonweddings/web";
import type { BudgetLine, Payer } from "@ceylonweddings/contracts";
import { payerRollup } from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import { Input } from "@ceylonweddings/ui/components/input";
import { DatePicker } from "@ceylonweddings/ui/components/date-picker";
import { SimpleSelect } from "@ceylonweddings/ui/components/select";
import { FieldBlock, FormPanel } from "@ceylonweddings/ui/domain/creator-form";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { BudgetMeter } from "@ceylonweddings/ui/domain/budget-meter";
import { PayerPots } from "@ceylonweddings/ui/domain/wedding-presentation";
import { SignInPrompt, useWedding } from "../../../../components/use-wedding";

const PAYERS: Payer[] = ["COUPLE", "BRIDE_FAMILY", "GROOM_FAMILY"];
const BAR_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--info)",
  "var(--love)",
  "var(--warning)",
];

export default function BudgetPage() {
  const t = useTranslations();
  const currency = usePreferenceStore((state) => state.currency);
  const { data, error, reload } = useWedding();
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState("other");
  const [plannedLkr, setPlannedLkr] = useState(0);
  const [spentLkr, setSpentLkr] = useState(0);
  const [paidLkr, setPaidLkr] = useState(0);
  const [payer, setPayer] = useState<Payer>("COUPLE");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const lines = data?.budgetLines ?? [];
  const categories = useMemo(() => {
    const map = new Map<string, number>();
    for (const line of lines) map.set(line.category, (map.get(line.category) ?? 0) + line.plannedLkr);
    return [...map.entries()];
  }, [lines]);

  useEffect(() => {
    if (data?.budgetLines?.[0]) setActiveCategory(data.budgetLines[0].category);
  }, [data]);

  if (!data) return <SignInPrompt error={error} />;
  if (!data.myAccess.canViewBudget) {
    return <PageHeader icon={Wallet} title={t("nav.costGuide")} description={t("planning.noBudgetAccess")} />;
  }

  const filtered = activeCategory ? lines.filter((line) => line.category === activeCategory) : lines;
  const estimated = lines.reduce((sum, line) => sum + line.plannedLkr, 0);
  const spent = lines.reduce((sum, line) => sum + line.spentLkr, 0);
  const paid = lines.reduce((sum, line) => sum + line.paidLkr, 0);
  const pending = Math.max(0, spent - paid);
  const maxBar = Math.max(1, ...categories.map(([, value]) => value));
  const pots = payerRollup(lines);
  const meterPercent = data.budgetLkr ? Math.min(100, Math.round((spent / data.budgetLkr) * 100)) : 0;

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    await api.wedding.createBudgetLine({
      label,
      category,
      plannedLkr: Math.round(plannedLkr),
      spentLkr: Math.round(spentLkr),
      paidLkr: Math.round(paidLkr),
      payer,
    });
    setLabel("");
    await reload();
  }

  async function save(line: BudgetLine) {
    await api.wedding.updateBudgetLine(line.id, {
      label: line.label,
      plannedLkr: Math.round(line.plannedLkr),
      spentLkr: Math.round(line.spentLkr),
      paidLkr: Math.round(line.paidLkr),
      payer: line.payer,
      depositDueAt: line.depositDueAt,
      balanceDueAt: line.balanceDueAt,
    });
    await reload();
  }

  async function removeLine(id: string) {
    if (!window.confirm("Delete this budget line?")) return;
    await api.wedding.deleteBudgetLine(id);
    await reload();
  }

  return (
    <div className="grid gap-8 md:gap-10 xl:grid-cols-[16rem_1fr]">
      <FormPanel className="h-fit gap-3 p-4">
        <form className="grid gap-3" onSubmit={onCreate}>
          <FieldBlock label={t("planning.label")} compact>
            <Input placeholder={t("planning.label")} value={label} onChange={(e) => setLabel(e.target.value)} required />
          </FieldBlock>
          <FieldBlock label={t("planning.category")} compact>
            <Input
              placeholder={t("planning.category")}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            />
          </FieldBlock>
          <FieldBlock label={t("planning.planned")} compact>
            <Input type="number" min={0} value={plannedLkr} onChange={(e) => setPlannedLkr(Number(e.target.value))} />
          </FieldBlock>
          <FieldBlock label={t("planning.payer")} compact>
            <SimpleSelect
              value={payer}
              onValueChange={(value) => setPayer(value as Payer)}
              options={PAYERS.map((value) => ({ value, label: value.replaceAll("_", " ") }))}
            />
          </FieldBlock>
          <Button type="submit">{t("knotly.newCategory")}</Button>
        </form>
        <div className="grid gap-1 border-t border-border/70 pt-3">
          {categories.map(([name, total]) => (
            <button
              key={name}
              type="button"
              className={`rounded-xl px-3 py-2 text-left text-sm transition-colors ${activeCategory === name ? "bg-secondary" : "hover:bg-secondary/50"}`}
              onClick={() => setActiveCategory(name)}
            >
              <span className="block font-medium">{name.replaceAll("_", " ")}</span>
              <span className="text-xs text-muted-foreground">{formatMoney(total, currency)}</span>
            </button>
          ))}
        </div>
      </FormPanel>
      <div className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <PageHeader icon={Wallet} title={t("nav.costGuide")} description={t("planning.budgetHelp")} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={async () => {
              const cap = data.budgetLkr || 2500000;
              const benchmarks = [
                { label: "Venue, Catering & Welcome Drinks (45%)", category: "venue", plannedLkr: Math.round(cap * 0.45), payer: "COUPLE" as Payer },
                { label: "Photography & Cinematic Video (15%)", category: "photo", plannedLkr: Math.round(cap * 0.15), payer: "COUPLE" as Payer },
                { label: "Bridal Osariya, Groom Mul Anduma & Jewellery (15%)", category: "attire", plannedLkr: Math.round(cap * 0.15), payer: "BRIDE_FAMILY" as Payer },
                { label: "Poruwa Structure & Floral Decor (10%)", category: "decor", plannedLkr: Math.round(cap * 0.10), payer: "COUPLE" as Payer },
                { label: "Kandyan Dancers, Magul Bera & Live Band (5%)", category: "music", plannedLkr: Math.round(cap * 0.05), payer: "GROOM_FAMILY" as Payer },
                { label: "Wedding Luxury Cars & Guest Transport (5%)", category: "transport", plannedLkr: Math.round(cap * 0.05), payer: "GROOM_FAMILY" as Payer },
                { label: "Astrologer, Registrar & Emergency Buffer (5%)", category: "buffer", plannedLkr: Math.round(cap * 0.05), payer: "COUPLE" as Payer },
              ];
              for (const b of benchmarks) {
                await api.wedding.createBudgetLine({
                  label: b.label,
                  category: b.category,
                  plannedLkr: b.plannedLkr,
                  spentLkr: 0,
                  paidLkr: 0,
                  payer: b.payer,
                });
              }
              await reload();
            }}
          >
            Apply Sri Lanka Benchmark Budget
          </Button>
        </div>

        {/* Plate & Catering Benchmark Estimator */}
        <div className="rounded-2xl border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm">Sri Lankan Plate & Catering Calculator</h3>
            <span className="text-xs text-muted-foreground">{data.guestCountEstimate || 150} estimated guests</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 text-xs">
            <div className="p-3 rounded-xl border bg-secondary/30">
              <span className="font-semibold text-primary">5-Star Luxury (Colombo/Bentota)</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">LKR 14,500 / plate</p>
              <p className="font-bold mt-2 text-sm">{formatMoney((data.guestCountEstimate || 150) * 14500, currency)}</p>
            </div>
            <div className="p-3 rounded-xl border bg-secondary/30">
              <span className="font-semibold text-primary">4-Star & Heritage Resort</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">LKR 9,500 / plate</p>
              <p className="font-bold mt-2 text-sm">{formatMoney((data.guestCountEstimate || 150) * 9500, currency)}</p>
            </div>
            <div className="p-3 rounded-xl border bg-secondary/30">
              <span className="font-semibold text-primary">Banquet Hall & Reception</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">LKR 6,200 / plate</p>
              <p className="font-bold mt-2 text-sm">{formatMoney((data.guestCountEstimate || 150) * 6200, currency)}</p>
            </div>
          </div>
        </div>

        <BudgetMeter
          title="Spend vs cap"
          usedLabel={`${formatMoney(spent, currency)} spent`}
          remainingLabel={`${formatMoney(Math.max(0, data.budgetLkr - spent), currency)} left`}
          percent={meterPercent}
          categories={categories.slice(0, 5).map(([name, total]) => ({
            label: name.replaceAll("_", " "),
            spent: formatMoney(total, currency),
            percent: estimated ? Math.round((total / estimated) * 100) : 0,
          }))}
        />
        <PayerPots title="Family pots" pots={pots} formatMoney={(value) => formatMoney(value, currency)} />
        <div className="grid gap-4 md:grid-cols-2">
          <SectionCard title={t("knotly.estimated")} delay={1} variant="muted">
            <p className="font-serif text-3xl font-semibold tracking-tight">
              {formatMoney(estimated, currency)}
              <span className="text-base font-normal text-muted-foreground">
                {" "}
                / {formatMoney(data.budgetLkr, currency)}
              </span>
            </p>
          </SectionCard>
          <SectionCard title={t("knotly.finalCost")} delay={2} variant="muted">
            <p className="font-serif text-3xl font-semibold tracking-tight">{formatMoney(spent, currency)}</p>
            <p className="text-sm text-muted-foreground">
              {t("planning.spent")}: {formatMoney(paid, currency)} · {t("knotly.pending")}: {formatMoney(pending, currency)}
            </p>
          </SectionCard>
        </div>
        <SectionCard title={t("knotly.expenses")} delay={3} variant="muted">
          <div className="flex h-48 items-end gap-2">
            {categories.map(([name, total], index) => (
              <div key={name} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-lg transition-all duration-500"
                  style={{
                    height: `${Math.max(8, (total / maxBar) * 100)}%`,
                    background: BAR_COLORS[index % BAR_COLORS.length],
                  }}
                />
                <span className="line-clamp-1 text-[10px]">{name}</span>
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard title={t("planning.label")} variant="muted">
          <div className="grid gap-3 text-sm">
            <div className="hidden grid-cols-5 font-medium text-muted-foreground md:grid">
              <span>{t("planning.label")}</span>
              <span>{t("planning.planned")}</span>
              <span>{t("planning.spent")}</span>
              <span>{t("knotly.paid")}</span>
              <span />
            </div>
            {filtered.map((line) => (
              <div key={line.id} className="cw-row-lift grid gap-2 rounded-xl border border-border/60 bg-background/40 p-3 md:grid-cols-6 md:items-center md:border-0 md:bg-transparent md:p-0">
                <span className="font-medium">{line.label}</span>
                <Input
                  type="number"
                  defaultValue={line.plannedLkr}
                  onBlur={(e) => save({ ...line, plannedLkr: Number(e.target.value) })}
                />
                <Input
                  type="number"
                  defaultValue={line.spentLkr}
                  onBlur={(e) => save({ ...line, spentLkr: Number(e.target.value) })}
                />
                <Input
                  type="number"
                  defaultValue={line.paidLkr}
                  onBlur={(e) => save({ ...line, paidLkr: Number(e.target.value) })}
                />
                <SimpleSelect
                  value={line.payer}
                  onValueChange={(value) => save({ ...line, payer: value as Payer })}
                  options={PAYERS.map((value) => ({ value, label: value.replaceAll("_", " ") }))}
                />
                <Button type="button" size="sm" variant="ghost" onClick={() => removeLine(line.id)}>
                  Remove
                </Button>
                <div className="md:col-span-6 grid gap-2 sm:grid-cols-2">
                  <FieldBlock label="Deposit due" compact>
                    <DatePicker
                      value={line.depositDueAt?.slice(0, 10) ?? ""}
                      onChange={(value) =>
                        save({
                          ...line,
                          depositDueAt: value ? new Date(value).toISOString() : null,
                        })
                      }
                    />
                  </FieldBlock>
                  <FieldBlock label="Balance due" compact>
                    <DatePicker
                      value={line.balanceDueAt?.slice(0, 10) ?? ""}
                      onChange={(value) =>
                        save({
                          ...line,
                          balanceDueAt: value ? new Date(value).toISOString() : null,
                        })
                      }
                    />
                  </FieldBlock>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
