"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowDownToLine, Check, GripVertical, LayoutGrid, Minus, Plus, Save, Trash2, X } from "lucide-react";
import { api } from "@ceylonweddings/web";
import { seatingSummary, type GuestHousehold, type SeatingPlan, type SeatingSummary } from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import { Input } from "@ceylonweddings/ui/components/input";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { Combobox } from "@ceylonweddings/ui/components/combobox";
import { cn } from "@ceylonweddings/ui/utils";
import { SignInPrompt, useWedding } from "@/components/use-wedding";
import { PlanningHero, heroButtonClass, heroSelectClass } from "@/features/planning/components/planning-hero";

type DraftTable = {
  key: string;
  id?: string;
  name: string;
  capacity: number;
  sortOrder: number;
  assignments: Array<{ householdId: string; seatsUsed: number }>;
};

export default function SeatingPage() {
  const t = useTranslations();
  const { data, error } = useWedding();
  const [guests, setGuests] = useState<GuestHousehold[]>([]);
  const [eventId, setEventId] = useState("");
  const [tables, setTables] = useState<DraftTable[]>([]);
  const [notes, setNotes] = useState("");
  const [summary, setSummary] = useState<SeatingSummary | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [dropKey, setDropKey] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.wedding
      .guests()
      .then(setGuests)
      .catch(() => setGuests([]));
  }, []);

  useEffect(() => {
    if (data?.events?.length && !eventId) {
      const reception = data.events.find((e) => e.kind === "RECEPTION") ?? data.events[0]!;
      setEventId(reception.id);
    }
  }, [data, eventId]);

  useEffect(() => {
    if (!eventId) return;
    api.wedding
      .seating(eventId)
      .then((res) => {
        if (res.plan) applyPlan(res.plan);
        else {
          setTables([]);
          setNotes("");
        }
        setSummary(res.summary);
      })
      .catch(() => {
        setTables([]);
        setSummary(null);
      });
  }, [eventId]);

  const assignedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const table of tables) {
      for (const a of table.assignments) ids.add(a.householdId);
    }
    return ids;
  }, [tables]);

  const unassigned = useMemo(() => guests.filter((g) => !assignedIds.has(g.id)), [guests, assignedIds]);

  const liveSummary = useMemo(() => {
    const plan: SeatingPlan = {
      id: "draft",
      weddingId: data?.id ?? "",
      eventId,
      notes,
      tables: tables.map((table) => ({
        id: table.id ?? table.key,
        planId: "draft",
        name: table.name,
        capacity: table.capacity,
        sortOrder: table.sortOrder,
        assignments: table.assignments.map((a, i) => ({
          id: `${table.key}-${i}`,
          tableId: table.id ?? table.key,
          householdId: a.householdId,
          seatsUsed: a.seatsUsed,
        })),
      })),
    };
    return seatingSummary(plan, guests);
  }, [tables, notes, eventId, data?.id, guests]);

  if (!data) return <SignInPrompt error={error} />;

  function applyPlan(plan: SeatingPlan) {
    setNotes(plan.notes ?? "");
    setTables(
      plan.tables.map((table, index) => ({
        key: table.id,
        id: table.id,
        name: table.name,
        capacity: table.capacity,
        sortOrder: table.sortOrder ?? index,
        assignments: (table.assignments ?? []).map((a) => ({
          householdId: a.householdId,
          seatsUsed: a.seatsUsed,
        })),
      })),
    );
  }

  function addTable() {
    const n = tables.length + 1;
    setTables((rows) => [
      ...rows,
      { key: `new-${Date.now()}`, name: `Table ${n}`, capacity: 10, sortOrder: n - 1, assignments: [] },
    ]);
  }

  async function save() {
    if (!eventId) return;
    setSaving(true);
    setStatus(null);
    try {
      const res = await api.wedding.upsertSeating(eventId, {
        notes: notes || null,
        tables: tables.map((table, index) => ({
          id: table.id,
          name: table.name,
          capacity: table.capacity,
          sortOrder: index,
          assignments: table.assignments,
        })),
      });
      if (res.plan) applyPlan(res.plan);
      setSummary(res.summary);
      setStatus("Seating saved");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Could not save seating");
    } finally {
      setSaving(false);
    }
  }

  const display = summary ?? liveSummary;

  function assignTo(householdId: string, tableKey: string) {
    const household = guests.find((g) => g.id === householdId);
    if (!household) return;
    setTables((rows) =>
      rows.map((table) => {
        const without = table.assignments.filter((a) => a.householdId !== householdId);
        return table.key === tableKey
          ? { ...table, assignments: [...without, { householdId, seatsUsed: 1 + Math.max(0, household.plusCount) }] }
          : { ...table, assignments: without };
      }),
    );
    setPicked(null);
  }

  const canEdit = data.myAccess.canEditGuests;
  const fillPct = display.capacity ? Math.min(100, Math.round((display.seatedHeads / display.capacity) * 100)) : 0;

  return (
    <div className="cw-stack">
      <PlanningHero
        icon={LayoutGrid}
        kicker={t("hub.kicker")}
        title={t("nav.seating")}
        description="Visual table board — assign households per event, not CAD floor plans."
        actions={
          canEdit ? (
            <>
              <Button
                type="button"
                size="sm"
                shape="pill"
                variant="outline"
                className={heroButtonClass}
                onClick={addTable}
              >
                <Plus className="size-4" /> Add table
              </Button>
              <Button
                type="button"
                size="sm"
                shape="pill"
                className="gap-2 bg-paper text-ink hover:bg-paper/90"
                onClick={() => void save()}
                disabled={saving}
              >
                <Save className="size-4" /> {saving ? "Saving…" : "Save seating"}
              </Button>
            </>
          ) : null
        }
      >
        <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
          <div className="grid gap-1.5">
            <span className="text-xs text-paper/60">Event</span>
            <Combobox
              aria-label="Event"
              className={cn("w-64", heroSelectClass)}
              value={eventId}
              onValueChange={setEventId}
              searchPlaceholder="Search events…"
              options={(data.events ?? []).map((event) => ({ value: event.id, label: event.name }))}
            />
          </div>
          <div>
            <p className="text-xs text-paper/60">Seated</p>
            <p className="font-serif text-2xl">
              {display.seatedHeads}
              <span className="text-base text-paper/50"> / {display.capacity}</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-paper/60">Tables</p>
            <p className="font-serif text-2xl">{tables.length}</p>
          </div>
          <div>
            <p className="text-xs text-paper/60">Still to seat</p>
            <p className="font-serif text-2xl">
              {display.unassignedHouseholds}
              <span className="text-base text-paper/50"> households</span>
            </p>
          </div>
          {display.overbookedTables ? (
            <span className="rounded-full bg-love px-3 py-1.5 text-sm text-love-foreground">
              {display.overbookedTables} overbooked
            </span>
          ) : null}
        </div>
        {display.capacity ? (
          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-paper/10">
            <div
              className="h-full rounded-full bg-[color:var(--cw-gold-300)] transition-all duration-500"
              style={{ width: `${fillPct}%` }}
            />
          </div>
        ) : null}
      </PlanningHero>

      {status ? <FormStatus>{status}</FormStatus> : null}

      <div className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start">
        {/* Pool */}
        <aside className="grid gap-4 lg:sticky lg:top-24">
          <section className="rounded-3xl border border-border bg-card p-4 shadow-card">
            <div className="flex items-center justify-between">
              <p className="font-medium">Waiting for a seat</p>
              <span className="text-sm text-muted-foreground tabular-nums">{unassigned.length}</span>
            </div>
            {canEdit && unassigned.length ? (
              <p className="mt-1 text-xs text-muted-foreground">Drag onto a table, or tap one then tap a table.</p>
            ) : null}
            {unassigned.length === 0 ? (
              <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="size-4 text-primary" /> Everyone has a seat.
              </p>
            ) : (
              <ul className="mt-3 grid max-h-[50vh] gap-1.5 overflow-y-auto pr-1">
                {unassigned.map((g) => (
                  <li key={g.id}>
                    <button
                      type="button"
                      draggable={canEdit}
                      onDragStart={(e) => e.dataTransfer.setData("text/household", g.id)}
                      onClick={() => canEdit && setPicked(picked === g.id ? null : g.id)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-2xl border px-3 py-2 text-left text-sm transition",
                        canEdit && "cursor-grab active:cursor-grabbing",
                        picked === g.id
                          ? "border-primary bg-primary/10"
                          : "border-border bg-background hover:border-primary/40",
                      )}
                    >
                      <GripVertical className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate">{g.label}</span>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs tabular-nums">
                        {1 + g.plusCount}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
          {canEdit ? (
            <label className="grid gap-1 rounded-3xl border border-border bg-card p-4 text-xs text-muted-foreground shadow-card">
              Notes for this event
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Poruwa side notes…" />
            </label>
          ) : notes ? (
            <p className="rounded-3xl border border-border bg-card p-4 text-sm shadow-card">{notes}</p>
          ) : null}
        </aside>

        {/* Tables */}
        {tables.length === 0 ? (
          <div className="grid place-items-center gap-3 rounded-3xl border border-dashed border-border p-12 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
              <LayoutGrid className="size-6" />
            </span>
            <p className="font-serif text-2xl">No tables yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Add tables for this event, then seat households from the list.
            </p>
            {canEdit ? (
              <Button shape="pill" className="gap-2" onClick={addTable}>
                <Plus className="size-4" /> Add table
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="grid min-w-0 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
            {tables.map((table) => {
              const seated = table.assignments.reduce((sum, a) => sum + a.seatsUsed, 0);
              const over = seated > table.capacity;
              const R = 30;
              const C = 2 * Math.PI * R;
              const pct = Math.min(1, seated / Math.max(1, table.capacity));
              const targetable = canEdit && picked;
              return (
                <section
                  key={table.key}
                  onDragOver={(e) => {
                    if (!canEdit) return;
                    e.preventDefault();
                    setDropKey(table.key);
                  }}
                  onDragLeave={() => setDropKey((k) => (k === table.key ? null : k))}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDropKey(null);
                    const id = e.dataTransfer.getData("text/household");
                    if (id) assignTo(id, table.key);
                  }}
                  className={cn(
                    "group grid min-w-0 grid-cols-1 content-start gap-3 rounded-3xl border bg-card p-4 shadow-card transition",
                    over ? "border-love/50" : "border-border",
                    dropKey === table.key && "border-primary ring-2 ring-primary/30",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative grid size-16 shrink-0 place-items-center">
                      <svg viewBox="0 0 72 72" className="absolute inset-0 -rotate-90">
                        <circle
                          cx="36"
                          cy="36"
                          r={R}
                          fill="none"
                          stroke="currentColor"
                          strokeOpacity={0.1}
                          strokeWidth={6}
                        />
                        <circle
                          cx="36"
                          cy="36"
                          r={R}
                          fill="none"
                          stroke={over ? "var(--love)" : "var(--color-primary)"}
                          strokeWidth={6}
                          strokeLinecap="round"
                          strokeDasharray={C}
                          strokeDashoffset={C - pct * C}
                          className="transition-all duration-500"
                        />
                      </svg>
                      <span className={cn("text-sm font-medium tabular-nums", over && "text-love-fg")}>
                        {seated}/{table.capacity}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      {canEdit ? (
                        <input
                          aria-label="Table name"
                          value={table.name}
                          onChange={(e) =>
                            setTables((rows) =>
                              rows.map((row) => (row.key === table.key ? { ...row, name: e.target.value } : row)),
                            )
                          }
                          title={table.name}
                          className="w-full min-w-0 truncate rounded-lg bg-transparent font-serif text-lg outline-none focus:bg-secondary/60 focus:px-2"
                        />
                      ) : (
                        <p className="font-serif text-xl">{table.name}</p>
                      )}
                      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        {canEdit ? (
                          <>
                            <button
                              type="button"
                              aria-label="Fewer seats"
                              className="grid size-6 place-items-center rounded-full border border-border hover:border-primary/40"
                              onClick={() =>
                                setTables((rows) =>
                                  rows.map((row) =>
                                    row.key === table.key ? { ...row, capacity: Math.max(1, row.capacity - 1) } : row,
                                  ),
                                )
                              }
                            >
                              <Minus className="size-3" />
                            </button>
                            <span className="px-1 text-center whitespace-nowrap tabular-nums">
                              {table.capacity} seats
                            </span>
                            <button
                              type="button"
                              aria-label="More seats"
                              className="grid size-6 place-items-center rounded-full border border-border hover:border-primary/40"
                              onClick={() =>
                                setTables((rows) =>
                                  rows.map((row) =>
                                    row.key === table.key ? { ...row, capacity: row.capacity + 1 } : row,
                                  ),
                                )
                              }
                            >
                              <Plus className="size-3" />
                            </button>
                          </>
                        ) : (
                          <span>{table.capacity} seats</span>
                        )}
                        {over ? <span className="ml-2 text-love-fg">{seated - table.capacity} over</span> : null}
                      </div>
                    </div>
                    {canEdit ? (
                      <button
                        type="button"
                        aria-label="Remove table"
                        onClick={() => setTables((rows) => rows.filter((row) => row.key !== table.key))}
                        className="grid size-8 shrink-0 place-items-center self-start rounded-full text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    ) : null}
                  </div>

                  {table.assignments.length ? (
                    <ul className="grid gap-1.5">
                      {table.assignments.map((a) => {
                        const household = guests.find((g) => g.id === a.householdId);
                        return (
                          <li
                            key={a.householdId}
                            draggable={canEdit}
                            onDragStart={(e) => e.dataTransfer.setData("text/household", a.householdId)}
                            className={cn(
                              "group/row flex items-center gap-2 rounded-2xl bg-secondary/60 px-3 py-2 text-sm",
                              canEdit && "cursor-grab active:cursor-grabbing",
                            )}
                          >
                            <span className="min-w-0 flex-1 truncate">{household?.label ?? a.householdId}</span>
                            <span className="text-xs text-muted-foreground tabular-nums">{a.seatsUsed}</span>
                            {canEdit ? (
                              <button
                                type="button"
                                aria-label="Unseat"
                                title="Unseat"
                                className="grid size-6 place-items-center rounded-full text-muted-foreground opacity-0 transition group-hover/row:opacity-100 hover:bg-background hover:text-foreground focus-visible:opacity-100"
                                onClick={() =>
                                  setTables((rows) =>
                                    rows.map((row) =>
                                      row.key === table.key
                                        ? {
                                            ...row,
                                            assignments: row.assignments.filter((x) => x.householdId !== a.householdId),
                                          }
                                        : row,
                                    ),
                                  )
                                }
                              >
                                <X className="size-3.5" />
                              </button>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="rounded-2xl border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
                      Drop households here
                    </p>
                  )}

                  {targetable ? (
                    <Button
                      type="button"
                      size="sm"
                      shape="pill"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => assignTo(picked, table.key)}
                    >
                      <ArrowDownToLine className="size-4" /> Seat here
                    </Button>
                  ) : null}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
