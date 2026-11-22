"use client";

import { type FormEvent, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { CalendarClock, ChevronDown, Plus, Sparkles, Trash2, Users, Wallet } from "lucide-react";
import { api, formatMoney, usePreferenceStore } from "@ceylonweddings/web";
import { type BudgetLine, type Payer, payerRollup } from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import { Input } from "@ceylonweddings/ui/components/input";
import { DatePicker } from "@ceylonweddings/ui/components/date-picker";
import { Combobox } from "@ceylonweddings/ui/components/combobox";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { PayerPots } from "@ceylonweddings/ui/domain/wedding-presentation";
import { motion, useReducedMotion } from "@ceylonweddings/ui/domain/motion";
import { cn } from "@ceylonweddings/ui/utils";
import { useConfirm } from "@ceylonweddings/ui/components/confirm-dialog";
import { SignInPrompt, useWedding } from "@/components/use-wedding";

const PAYERS: Payer[] = ["COUPLE", "BRIDE_FAMILY", "GROOM_FAMILY"];
const PAYER_LABEL: Record<Payer, string> = {
  COUPLE: "Couple",
  BRIDE_FAMILY: "Bride's family",
  GROOM_FAMILY: "Groom's family",
};
const PAYER_OPTIONS = PAYERS.map((v) => ({ value: v, label: PAYER_LABEL[v] }));
const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--info)",
  "var(--love)",
  "var(--warning)",
];
const CATEGORY_LABEL: Record<string, string> = {
  venue: "Venue & catering",
  photo: "Photo & video",
  attire: "Attire & jewellery",
  decor: "Poruwa & decor",
  music: "Music & dancers",
  transport: "Transport",
  buffer: "Rituals & buffer",
  other: "Other",
};
const catLabel = (c: string) => CATEGORY_LABEL[c] ?? c.charAt(0).toUpperCase() + c.slice(1).replaceAll("_", " ");

const PLATE_TIERS = [
  { name: "5-star luxury", where: "Colombo · Bentota", perPlate: 14500 },
  { name: "4-star & heritage", where: "Kandy · Galle · resorts", perPlate: 9500 },
  { name: "Banquet hall", where: "Island-wide", perPlate: 6200 },
];

const BENCHMARKS: { label: string; category: string; share: number; payer: Payer }[] = [
  { label: "Venue, Catering & Welcome Drinks", category: "venue", share: 0.45, payer: "COUPLE" },
  { label: "Photography & Cinematic Video", category: "photo", share: 0.15, payer: "COUPLE" },
  { label: "Bridal Osariya, Groom Mul Anduma & Jewellery", category: "attire", share: 0.15, payer: "BRIDE_FAMILY" },
  { label: "Poruwa Structure & Floral Decor", category: "decor", share: 0.1, payer: "COUPLE" },
  { label: "Kandyan Dancers, Magul Bera & Live Band", category: "music", share: 0.05, payer: "GROOM_FAMILY" },
  { label: "Wedding Cars & Guest Transport", category: "transport", share: 0.05, payer: "GROOM_FAMILY" },
  { label: "Astrologer, Registrar & Emergency Buffer", category: "buffer", share: 0.05, payer: "COUPLE" },
];

export default function BudgetPage() {
  const confirm = useConfirm();
  const t = useTranslations();
  const reduce = useReducedMotion();
  const currency = usePreferenceStore((state) => state.currency);
  const { data, error, reload } = useWedding();
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState("");
  const [plannedLkr, setPlannedLkr] = useState("");
  const [payer, setPayer] = useState<Payer>("COUPLE");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [openLine, setOpenLine] = useState<string | null>(null);
  const [payerFilter, setPayerFilter] = useState<"ALL" | Payer>("ALL");
  const [guests, setGuests] = useState<number | null>(null);
  const [seeding, setSeeding] = useState(false);

  const lines = useMemo(() => data?.budgetLines ?? [], [data]);
  const categories = useMemo(() => {
    const map = new Map<string, number>();
    for (const line of lines) map.set(line.category, (map.get(line.category) ?? 0) + line.plannedLkr);
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [lines]);

  if (!data) return <SignInPrompt error={error} />;
  if (!data.myAccess.canViewBudget) {
    return <PageHeader icon={Wallet} title={t("nav.costGuide")} description={t("planning.noBudgetAccess")} />;
  }

  const money = (v: number) => formatMoney(v, currency);
  const cap = data.budgetLkr || 0;
  const estimated = lines.reduce((s, l) => s + l.plannedLkr, 0);
  const spent = lines.reduce((s, l) => s + l.spentLkr, 0);
  const paid = lines.reduce((s, l) => s + l.paidLkr, 0);
  const outstanding = Math.max(0, spent - paid);
  const base = Math.max(cap, estimated, spent, 1);
  const left = cap - spent;
  const pots = payerRollup(lines);
  const guestCount = guests ?? (data.guestCountEstimate || 150);
  const colorOf = (c: string) =>
    COLORS[
      Math.max(
        0,
        categories.findIndex(([n]) => n === c),
      ) % COLORS.length
    ];
  const filtered = lines.filter(
    (l) => (!activeCategory || l.category === activeCategory) && (payerFilter === "ALL" || l.payer === payerFilter),
  );

  const upcoming = lines
    .flatMap((l) => [
      l.depositDueAt ? { line: l, kind: "Deposit", at: l.depositDueAt } : null,
      l.balanceDueAt ? { line: l, kind: "Balance", at: l.balanceDueAt } : null,
    ])
    .filter((x): x is { line: BudgetLine; kind: string; at: string } => Boolean(x))
    .filter((x) => new Date(x.at).getTime() >= Date.now() - 86_400_000)
    .sort((a, b) => a.at.localeCompare(b.at))
    .slice(0, 4);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    await api.wedding.createBudgetLine({
      label,
      category: category.trim() || "other",
      plannedLkr: Math.max(0, Math.round(Number(plannedLkr) || 0)),
      spentLkr: 0,
      paidLkr: 0,
      payer,
    });
    setLabel("");
    setPlannedLkr("");
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
    if (!(await confirm({ title: "Delete this budget line?", destructive: true }))) return;
    await api.wedding.deleteBudgetLine(id);
    await reload();
  }

  async function applyBenchmark() {
    if (!missingBenchmarks.length) return;
    setSeeding(true);
    try {
      const total = cap || 2_500_000;
      for (const b of missingBenchmarks) {
        await api.wedding.createBudgetLine({
          label: b.label,
          category: b.category,
          plannedLkr: Math.round(total * b.share),
          spentLkr: 0,
          paidLkr: 0,
          payer: b.payer,
        });
      }
      await reload();
    } finally {
      setSeeding(false);
    }
  }

  // Only add benchmark lines for categories (or labels) the couple doesn't already have.
  const norm = (v: string) => v.toLowerCase().replace(/[^a-z]/g, "");
  const missingBenchmarks = BENCHMARKS.filter(
    (b) =>
      !lines.some(
        (l) => l.category === b.category || norm(l.label) === norm(b.label) || norm(l.category).startsWith(b.category),
      ),
  );

  // Duplicate benchmark lines (same benchmark label added more than once). Keep the copy that has
  // money recorded against it (or the first one); only untouched copies are removed.
  const benchKey = (label: string) => norm(label.replace(/\(\d+%\)/, ""));
  const benchKeys = new Set(BENCHMARKS.map((b) => benchKey(b.label)));
  const duplicateLines = Object.values(
    lines.reduce<Record<string, BudgetLine[]>>((acc, l) => {
      const key = benchKey(l.label);
      if (benchKeys.has(key)) (acc[`${l.category}:${key}`] ??= []).push(l);
      return acc;
    }, {}),
  ).flatMap((group) => {
    if (group.length < 2) return [];
    const keep = group.find((l) => l.spentLkr > 0 || l.paidLkr > 0) ?? group[0];
    return group.filter((l) => l !== keep && l.spentLkr === 0 && l.paidLkr === 0);
  });

  async function removeDuplicates() {
    if (
      !(await confirm({
        title: `Remove ${duplicateLines.length} duplicate benchmark ${duplicateLines.length === 1 ? "line" : "lines"}?`,
        description: "Only extra copies with nothing spent or paid are removed. One of each is kept.",
        destructive: true,
      }))
    )
      return;
    setSeeding(true);
    try {
      for (const l of duplicateLines) await api.wedding.deleteBudgetLine(l.id);
      await reload();
    } finally {
      setSeeding(false);
    }
  }

  const bar = (value: number) => `${Math.min(100, (value / base) * 100)}%`;

  return (
    <div className="cw-stack">
      {/* Hero */}
      <section
        className="relative isolate overflow-hidden rounded-3xl p-6 text-paper shadow-raised sm:p-8"
        style={{
          background:
            "radial-gradient(120% 90% at 0% 0%, color-mix(in srgb, var(--color-primary) 75%, transparent) 0%, transparent 60%)," +
            "radial-gradient(60% 70% at 100% 120%, color-mix(in srgb, var(--cw-gold-300) 20%, transparent) 0%, transparent 60%)," +
            "linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 35%, var(--color-ink)) 0%, var(--color-ink) 70%)",
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-label tracking-eyebrow text-paper/60 uppercase">
              <Wallet className="size-3.5" /> {t("nav.costGuide")}
            </p>
            <p className="mt-3 text-sm text-paper/60">Spent so far</p>
            <p className="font-serif text-5xl leading-none tracking-tight sm:text-6xl">{money(spent)}</p>
            <p className="mt-2 text-sm text-paper/70">
              {cap ? (
                <>
                  of {money(cap)} budget ·{" "}
                  <span className={left < 0 ? "text-love" : "text-[color:var(--cw-gold-300)]"}>
                    {left < 0 ? `${money(-left)} over` : `${money(left)} left`}
                  </span>
                </>
              ) : (
                "Set a budget cap in your wedding profile to track what's left."
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {duplicateLines.length ? (
              <Button
                variant="outline"
                shape="pill"
                size="sm"
                className="gap-2 border-love/50 bg-love/10 text-paper hover:bg-love/20 hover:text-paper"
                disabled={seeding}
                onClick={removeDuplicates}
              >
                <Trash2 className="size-4" /> Remove {duplicateLines.length} duplicate{" "}
                {duplicateLines.length === 1 ? "line" : "lines"}
              </Button>
            ) : null}
            {lines.length === 0 || missingBenchmarks.length === 0 ? null : (
              <Button
                variant="outline"
                shape="pill"
                size="sm"
                className="gap-2 border-paper/30 bg-transparent text-paper hover:bg-paper/10 hover:text-paper"
                disabled={seeding}
                onClick={applyBenchmark}
              >
                <Sparkles className="size-4" /> Add {missingBenchmarks.length} missing benchmark{" "}
                {missingBenchmarks.length === 1 ? "line" : "lines"}
              </Button>
            )}
          </div>
        </div>

        {/* Layered meter: planned / spent / paid against cap */}
        <div className="mt-8">
          <div className="relative h-4 overflow-hidden rounded-full bg-paper/10">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-paper/25"
              initial={reduce ? false : { width: 0 }}
              animate={{ width: bar(estimated) }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            />
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ background: "var(--cw-gold-300)" }}
              initial={reduce ? false : { width: 0 }}
              animate={{ width: bar(spent) }}
              transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            />
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-paper"
              initial={reduce ? false : { width: 0 }}
              animate={{ width: bar(paid) }}
              transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            />
            {cap && cap < base ? (
              <span className="absolute inset-y-0 w-0.5 bg-love" style={{ left: bar(cap) }} title="Budget cap" />
            ) : null}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { k: "Planned", v: estimated, dot: "bg-paper/25" },
              { k: "Spent", v: spent, dot: "bg-[color:var(--cw-gold-300)]" },
              { k: "Paid", v: paid, dot: "bg-paper" },
              { k: "Still to pay", v: outstanding, dot: "bg-love" },
            ].map((s) => (
              <div key={s.k}>
                <p className="flex items-center gap-1.5 text-xs text-paper/60">
                  <span className={cn("size-2 rounded-full", s.dot)} /> {s.k}
                </p>
                <p className="mt-0.5 font-serif text-xl">{money(s.v)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {lines.length === 0 ? (
        <div className="grid place-items-center gap-4 rounded-3xl border border-dashed border-border p-12 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Wallet className="size-6" />
          </span>
          <div>
            <p className="font-serif text-2xl">Build your budget</p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Start from a typical Sri Lankan split — 45% venue & catering, 15% photo, 15% attire and more — sized to
              your {cap ? money(cap) : "LKR 2.5M"} budget. You can edit every line after.
            </p>
          </div>
          <Button shape="pill" className="gap-2" disabled={seeding} onClick={applyBenchmark}>
            <Sparkles className="size-4" /> {seeding ? "Adding…" : "Use Sri Lanka benchmark"}
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          {/* Allocation */}
          <section className="rounded-3xl border border-border bg-card p-5 shadow-card sm:p-6">
            <div className="flex items-baseline justify-between">
              <p className="font-serif text-xl">Where it goes</p>
              <p className="text-sm text-muted-foreground">{money(estimated)} planned</p>
            </div>
            <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-muted">
              {categories.map(([name, total]) => (
                <button
                  key={name}
                  type="button"
                  aria-label={catLabel(name)}
                  onClick={() => setActiveCategory(activeCategory === name ? null : name)}
                  className={cn("h-full transition-opacity", activeCategory && activeCategory !== name && "opacity-30")}
                  style={{ width: `${(total / Math.max(1, estimated)) * 100}%`, background: colorOf(name) }}
                />
              ))}
            </div>
            <div className="mt-5 grid gap-1 sm:grid-cols-2">
              {categories.map(([name, total]) => {
                const catSpent = lines.filter((l) => l.category === name).reduce((s, l) => s + l.spentLkr, 0);
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setActiveCategory(activeCategory === name ? null : name)}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-3 py-2 text-left transition-colors",
                      activeCategory === name ? "bg-secondary" : "hover:bg-secondary/50",
                    )}
                  >
                    <span className="size-2.5 shrink-0 rounded-full" style={{ background: colorOf(name) }} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{catLabel(name)}</span>
                      <span className="text-xs text-muted-foreground">
                        {money(catSpent)} of {money(total)}
                      </span>
                    </span>
                    <span className="text-sm text-muted-foreground tabular-nums">
                      {Math.round((total / Math.max(1, estimated)) * 100)}%
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <div className="grid content-start gap-4">
            {/* Upcoming payments */}
            <section className="rounded-3xl border border-border bg-card p-5 shadow-card">
              <p className="flex items-center gap-2 font-serif text-xl">
                <CalendarClock className="size-4 text-primary" /> Upcoming payments
              </p>
              {upcoming.length ? (
                <ul className="mt-3 grid gap-2">
                  {upcoming.map((u) => {
                    const days = Math.ceil((new Date(u.at).getTime() - Date.now()) / 86_400_000);
                    return (
                      <li key={`${u.line.id}-${u.kind}`} className="flex items-center gap-3 text-sm">
                        <span className="grid w-12 shrink-0 place-items-center rounded-xl bg-secondary py-1.5 text-center leading-tight">
                          <span className="text-xs text-muted-foreground">
                            {new Date(u.at).toLocaleDateString(undefined, { month: "short" })}
                          </span>
                          <span className="font-medium">{new Date(u.at).getDate()}</span>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate">{u.line.label}</span>
                          <span className={cn("text-xs text-muted-foreground", days <= 7 && "text-warning")}>
                            {u.kind} · {days <= 0 ? "today" : `in ${days} days`}
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  Add deposit or balance dates to a line and they'll show up here.
                </p>
              )}
            </section>
          </div>
        </div>
      )}

      {lines.length ? <PayerPots title="Who's paying" pots={pots} formatMoney={money} /> : null}

      {/* Plate calculator */}
      <section className="rounded-3xl border border-border bg-card p-5 shadow-card sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-serif text-xl">Plate cost calculator</p>
            <p className="text-sm text-muted-foreground">Typical per-plate rates across Sri Lanka</p>
          </div>
          <label className="flex items-center gap-3 text-sm">
            <Users className="size-4 text-muted-foreground" />
            <input
              type="range"
              min={25}
              max={800}
              step={5}
              value={guestCount}
              onChange={(e) => setGuests(Number(e.target.value))}
              className="w-40 accent-[color:var(--color-primary)]"
            />
            <span className="w-20 font-medium tabular-nums">{guestCount} guests</span>
          </label>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {PLATE_TIERS.map((tier, i) => (
            <div
              key={tier.name}
              className={cn(
                "rounded-2xl border p-4",
                i === 0 ? "border-primary/30 bg-primary/5" : "border-border bg-secondary/30",
              )}
            >
              <p className="text-sm font-medium">{tier.name}</p>
              <p className="text-xs text-muted-foreground">
                {tier.where} · {money(tier.perPlate)}/plate
              </p>
              <p className="mt-3 font-serif text-2xl">{money(guestCount * tier.perPlate)}</p>
              {cap ? (
                <p className="text-xs text-muted-foreground">
                  {Math.round(((guestCount * tier.perPlate) / cap) * 100)}% of your budget
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      {/* Lines */}
      <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-card">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <p className="font-serif text-xl">
            {activeCategory ? catLabel(activeCategory) : "All expenses"}
            <span className="ml-2 text-sm font-normal text-muted-foreground">{filtered.length} items</span>
          </p>
          <div className="flex items-center gap-2">
            {activeCategory ? (
              <Button size="sm" variant="ghost" shape="pill" onClick={() => setActiveCategory(null)}>
                Show all
              </Button>
            ) : null}
            <Combobox
              aria-label="Filter by payer"
              value={payerFilter}
              onValueChange={(v) => setPayerFilter(v as "ALL" | Payer)}
              searchPlaceholder="Search payer…"
              className="w-44"
              options={[
                { value: "ALL", label: "Show: all payers" },
                ...PAYERS.map((v) => ({ value: v, label: `Show: ${PAYER_LABEL[v].toLowerCase()}` })),
              ]}
            />
          </div>
        </header>

        <form
          onSubmit={onCreate}
          className="grid gap-2 border-b border-border bg-secondary/30 p-3 sm:grid-cols-[2fr_1fr_1fr_1fr_auto]"
        >
          <Input
            placeholder="New expense, e.g. Kandyan dancers"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            required
          />
          <Combobox
            value={category}
            onValueChange={setCategory}
            placeholder={t("planning.category")}
            searchPlaceholder="Search or add category…"
            allowCustom
            formatCustom={(q) => q.toLowerCase().replace(/\s+/g, "_")}
            options={[...new Set([...Object.keys(CATEGORY_LABEL), ...categories.map(([c]) => c)])].map((c) => ({
              value: c,
              label: catLabel(c),
            }))}
          />
          <Input
            type="number"
            min={0}
            placeholder="Planned LKR"
            value={plannedLkr}
            onChange={(e) => setPlannedLkr(e.target.value)}
          />
          <Combobox
            value={payer}
            onValueChange={(v) => setPayer(v as Payer)}
            aria-label="Who pays for this expense"
            options={PAYERS.map((v) => ({ value: v, label: `Paid by ${PAYER_LABEL[v].toLowerCase()}` }))}
            searchPlaceholder="Search payer…"
          />
          <Button type="submit" shape="pill" className="gap-1.5">
            <Plus className="size-4" /> Add
          </Button>
        </form>

        {filtered.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No expenses yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((line) => {
              const open = openLine === line.id;
              const paidPct = line.plannedLkr ? Math.min(100, (line.paidLkr / line.plannedLkr) * 100) : 0;
              const spentPct = line.plannedLkr ? Math.min(100, (line.spentLkr / line.plannedLkr) * 100) : 0;
              const over = line.spentLkr > line.plannedLkr && line.plannedLkr > 0;
              return (
                <li key={line.id} className="group">
                  <button
                    type="button"
                    onClick={() => setOpenLine(open ? null : line.id)}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-secondary/30"
                  >
                    <span className="size-2.5 shrink-0 rounded-full" style={{ background: colorOf(line.category) }} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{line.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {catLabel(line.category)} · {PAYER_LABEL[line.payer]}
                      </span>
                      <span className="relative mt-2 block h-1.5 max-w-xs overflow-hidden rounded-full bg-muted">
                        <span
                          className={cn("absolute inset-y-0 left-0 rounded-full", over ? "bg-love" : "bg-primary/30")}
                          style={{ width: `${spentPct}%` }}
                        />
                        <span
                          className="absolute inset-y-0 left-0 rounded-full bg-primary"
                          style={{ width: `${paidPct}%` }}
                        />
                      </span>
                    </span>
                    <span className="hidden text-right sm:block">
                      <span className="block text-sm font-medium tabular-nums">{money(line.plannedLkr)}</span>
                      <span className={cn("text-xs tabular-nums text-muted-foreground", over && "text-love")}>
                        {money(line.paidLkr)} paid{over ? " · over" : ""}
                      </span>
                    </span>
                    <ChevronDown
                      className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
                    />
                  </button>
                  {open ? (
                    <div className="grid gap-3 bg-secondary/20 px-5 pt-1 pb-5 sm:grid-cols-3">
                      {(
                        [
                          ["Planned", "plannedLkr"],
                          ["Spent / quoted", "spentLkr"],
                          ["Paid", "paidLkr"],
                        ] as const
                      ).map(([lbl, key]) => (
                        <label key={key} className="grid gap-1 text-xs text-muted-foreground">
                          {lbl}
                          <Input
                            type="number"
                            min={0}
                            defaultValue={line[key]}
                            onBlur={(e) => {
                              const v = Number(e.target.value);
                              if (v !== line[key]) void save({ ...line, [key]: v });
                            }}
                          />
                        </label>
                      ))}
                      <label className="grid gap-1 text-xs text-muted-foreground">
                        Paid by
                        <Combobox
                          value={line.payer}
                          onValueChange={(v) => save({ ...line, payer: v as Payer })}
                          options={PAYER_OPTIONS}
                          searchPlaceholder="Search payer…"
                        />
                      </label>
                      <label className="grid gap-1 text-xs text-muted-foreground">
                        Deposit due
                        <DatePicker
                          value={line.depositDueAt?.slice(0, 10) ?? ""}
                          onChange={(v) => save({ ...line, depositDueAt: v ? new Date(v).toISOString() : null })}
                        />
                      </label>
                      <label className="grid gap-1 text-xs text-muted-foreground">
                        Balance due
                        <DatePicker
                          value={line.balanceDueAt?.slice(0, 10) ?? ""}
                          onChange={(v) => save({ ...line, balanceDueAt: v ? new Date(v).toISOString() : null })}
                        />
                      </label>
                      <div className="sm:col-span-3 flex justify-end">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          shape="pill"
                          className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => removeLine(line.id)}
                        >
                          <Trash2 className="size-4" /> Delete
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
