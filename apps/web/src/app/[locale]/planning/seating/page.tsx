"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { LayoutGrid } from "lucide-react";
import { api } from "@ceylonweddings/web";
import {
  seatingSummary,
  type GuestHousehold,
  type SeatingPlan,
  type SeatingSummary,
} from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import { Input } from "@ceylonweddings/ui/components/input";
import { Label } from "@ceylonweddings/ui/components/label";
import { SimpleSelect } from "@ceylonweddings/ui/components/select";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { EmptyState } from "@ceylonweddings/ui/domain/empty-state";
import { SignInPrompt, useWedding } from "../../../../components/use-wedding";

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
  const [assignHouseholdId, setAssignHouseholdId] = useState("");
  const [assignTableKey, setAssignTableKey] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.wedding.guests().then(setGuests).catch(() => setGuests([]));
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

  const unassigned = useMemo(
    () => guests.filter((g) => !assignedIds.has(g.id)),
    [guests, assignedIds],
  );

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

  function assignSelected() {
    if (!assignHouseholdId || !assignTableKey) return;
    const household = guests.find((g) => g.id === assignHouseholdId);
    if (!household) return;
    setTables((rows) =>
      rows.map((table) =>
        table.key === assignTableKey
          ? {
              ...table,
              assignments: [
                ...table.assignments,
                { householdId: household.id, seatsUsed: 1 + Math.max(0, household.plusCount) },
              ],
            }
          : table,
      ),
    );
    setAssignHouseholdId("");
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

  return (
    <div className="cw-stack">
      <PageHeader
        icon={LayoutGrid}
        kicker={t("hub.kicker")}
        title={t("nav.seating")}
        description="Visual table board — assign households per event, not CAD floor plans."
      />

      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1">
          <Label>Event</Label>
          <SimpleSelect
            className="w-[16rem]"
            value={eventId}
            onValueChange={setEventId}
            options={(data.events ?? []).map((event) => ({ value: event.id, label: event.name }))}
          />
        </div>
        {data.myAccess.canEditGuests ? (
          <>
            <Button type="button" variant="outline" onClick={addTable}>
              Add table
            </Button>
            <Button type="button" onClick={() => void save()} disabled={saving}>
              {saving ? "Saving…" : "Save seating"}
            </Button>
          </>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <span className="rounded-full bg-secondary px-3 py-1">
          Seated {display.seatedHeads}/{display.capacity}
        </span>
        <span className="rounded-full bg-secondary px-3 py-1">
          Unassigned {display.unassignedHouseholds} ({display.unassignedHeads} heads)
        </span>
        {display.overbookedTables ? (
          <span className="rounded-full bg-destructive/15 px-3 py-1 text-destructive">
            {display.overbookedTables} overbooked
          </span>
        ) : null}
      </div>

      {data.myAccess.canEditGuests ? (
        <div className="flex flex-wrap items-end gap-3 rounded-3xl border border-border/70 p-4">
          <div className="grid gap-1">
            <Label>Household</Label>
            <SimpleSelect
              className="w-[16rem]"
              value={assignHouseholdId}
              onValueChange={setAssignHouseholdId}
              options={[
                { value: "", label: "Pick household" },
                ...unassigned.map((g) => ({
                  value: g.id,
                  label: `${g.label} (+${g.plusCount})`,
                })),
              ]}
            />
          </div>
          <div className="grid gap-1">
            <Label>Table</Label>
            <SimpleSelect
              className="w-[12rem]"
              value={assignTableKey}
              onValueChange={setAssignTableKey}
              options={[
                { value: "", label: "Pick table" },
                ...tables.map((table) => ({ value: table.key, label: table.name })),
              ]}
            />
          </div>
          <Button type="button" onClick={assignSelected} disabled={!assignHouseholdId || !assignTableKey}>
            Assign
          </Button>
          <div className="grid min-w-[12rem] flex-1 gap-1">
            <Label>Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Poruwa side notes…" />
          </div>
        </div>
      ) : null}

      {tables.length === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title={t("nav.seating")}
          description="Add tables for this event, then assign households from the pool."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tables.map((table) => {
            const seated = table.assignments.reduce((sum, a) => sum + a.seatsUsed, 0);
            const over = seated > table.capacity;
            const pct = Math.min(100, Math.round((seated / Math.max(1, table.capacity)) * 100));
            return (
              <div key={table.key} className="grid gap-3 rounded-3xl border border-border/70 p-4">
                <div className="flex items-start justify-between gap-2">
                  {data.myAccess.canEditGuests ? (
                    <Input
                      value={table.name}
                      onChange={(e) =>
                        setTables((rows) =>
                          rows.map((row) => (row.key === table.key ? { ...row, name: e.target.value } : row)),
                        )
                      }
                    />
                  ) : (
                    <h3 className="font-medium">{table.name}</h3>
                  )}
                  {data.myAccess.canEditGuests ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setTables((rows) => rows.filter((row) => row.key !== table.key))}
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className={over ? "text-destructive" : "text-muted-foreground"}>
                    {seated}/{table.capacity}
                  </span>
                  {data.myAccess.canEditGuests ? (
                    <Input
                      className="h-8 w-20"
                      type="number"
                      min={1}
                      value={table.capacity}
                      onChange={(e) =>
                        setTables((rows) =>
                          rows.map((row) =>
                            row.key === table.key ? { ...row, capacity: Number(e.target.value) || 1 } : row,
                          ),
                        )
                      }
                    />
                  ) : null}
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className={`h-full ${over ? "bg-destructive" : "bg-primary"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <ul className="grid gap-2">
                  {table.assignments.map((a) => {
                    const household = guests.find((g) => g.id === a.householdId);
                    return (
                      <li
                        key={a.householdId}
                        className="flex items-center justify-between gap-2 rounded-xl bg-secondary/60 px-3 py-2 text-sm"
                      >
                        <span>
                          {household?.label ?? a.householdId}
                          <span className="text-muted-foreground"> · {a.seatsUsed} seats</span>
                        </span>
                        {data.myAccess.canEditGuests ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
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
                            Unseat
                          </Button>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-3xl border border-dashed border-border/70 p-4">
        <h2 className="mb-2 font-medium">Unassigned pool</h2>
        {unassigned.length === 0 ? (
          <p className="text-sm text-muted-foreground">All households seated for this board.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {unassigned.map((g) => (
              <li key={g.id} className="rounded-full bg-secondary px-3 py-1 text-sm">
                {g.label} (+{g.plusCount})
              </li>
            ))}
          </ul>
        )}
      </div>

      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
    </div>
  );
}
