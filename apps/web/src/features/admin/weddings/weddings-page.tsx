"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { api } from "@ceylonweddings/web";
import type { AdminWeddingSummary } from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { AdminListToolbar } from "@ceylonweddings/ui/domain/admin-list-toolbar";
import { DataTableCell, DataTableHead } from "@ceylonweddings/ui/domain/data-table";
import { DataTableList } from "@ceylonweddings/ui/domain/data-table-list";
import { PlanningHero } from "@/features/planning/components/planning-hero";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { getListEmptyMode, serverSourceCount, showListChrome } from "@ceylonweddings/ui/lib/list-state";
import { useClientTablePagination } from "@ceylonweddings/ui/lib/use-client-table-pagination";
import { Link } from "@/i18n/navigation";

const COLUMNS = ["couple", "date", "location", "team", "actions"] as const;

export default function AdminWeddingsPage() {
  const [rows, setRows] = useState<AdminWeddingSummary[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setRows(await api.admin.weddings({ q: q || undefined }));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = rows;
  const now = Date.now();
  const daysTo = (iso?: string | null) => (iso ? Math.ceil((new Date(iso).getTime() - now) / 86_400_000) : null);
  const upcoming = rows
    .filter((r) => r.date && new Date(r.date).getTime() >= now - 86_400_000)
    .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
  const next = upcoming[0];
  const { page, setPage, setLimit, pageItems, total, totalPages, limit } = useClientTablePagination(filtered, 25, q);
  const isDefaultView = !q;
  const sourceCount = serverSourceCount(rows.length, isDefaultView);
  const emptyMode = getListEmptyMode({ sourceCount, filteredCount: filtered.length });
  const chrome = showListChrome(emptyMode, loading);

  if (error) {
    return (
      <FormStatus tone="destructive">
        {error}. <Link href="/login">Sign in</Link>
      </FormStatus>
    );
  }

  return (
    <div className="grid min-w-0 gap-6">
      <PlanningHero
        icon={CalendarDays}
        kicker="Support"
        title="Weddings"
        description="Read-only lookup by couple name, slug, city, or member email."
      >
        <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
          <div>
            <p className="text-xs text-paper/60">Weddings</p>
            <p className="font-serif text-2xl">{rows.length}</p>
          </div>
          <div>
            <p className="text-xs text-paper/60">Upcoming</p>
            <p className="font-serif text-2xl">{upcoming.length}</p>
          </div>
          <div>
            <p className="text-xs text-paper/60">Households</p>
            <p className="font-serif text-2xl">{rows.reduce((sum, r) => sum + (r.guestHouseholdCount ?? 0), 0)}</p>
          </div>
          {next ? (
            <Link
              href={`/admin/weddings/${next.id}`}
              className="group rounded-2xl bg-paper/10 px-4 py-2 transition hover:bg-paper/15"
            >
              <p className="text-xs text-paper/60">Next up</p>
              <p className="font-serif text-lg">
                {next.partnerOneName} & {next.partnerTwoName}
                <span className="ml-2 text-sm text-[color:var(--cw-gold-300)]">in {daysTo(next.date)} days</span>
              </p>
            </Link>
          ) : null}
        </div>
      </PlanningHero>
      <SectionCard title="Results" icon={CalendarDays}>
        {chrome ? (
          <AdminListToolbar
            searchValue={q}
            onSearchChange={setQ}
            searchPlaceholder="Search…"
            summary={loading ? "Loading…" : `${total} wedding${total === 1 ? "" : "s"}`}
          />
        ) : null}
        <DataTableList
          framed={false}
          loading={loading}
          loadingColumns={COLUMNS.length}
          sourceCount={sourceCount}
          filteredCount={filtered.length}
          empty={{
            icon: CalendarDays,
            title: "No weddings",
            description: "Weddings will appear here.",
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
          getRowId={(row) => row.id}
          orderedVisibleIds={COLUMNS}
          renderHead={(id) => {
            const labels: Record<(typeof COLUMNS)[number], string> = {
              couple: "Couple",
              date: "Date",
              location: "Location",
              team: "Team",
              actions: "",
            };
            return (
              <DataTableHead key={id} className={id === "actions" ? "w-16" : undefined}>
                {labels[id as (typeof COLUMNS)[number]]}
              </DataTableHead>
            );
          }}
          renderCell={(id, row) => {
            switch (id) {
              case "couple":
                return (
                  <DataTableCell key={id}>
                    <Link href={`/admin/weddings/${row.id}`} className="group flex items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-love/15 text-xs font-medium text-love-fg">
                        {row.partnerOneName.charAt(0)}
                        {row.partnerTwoName.charAt(0)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium group-hover:text-primary">
                          {row.partnerOneName} & {row.partnerTwoName}
                        </span>
                        <span className="block truncate font-mono text-xs text-muted-foreground">/w/{row.slug}</span>
                      </span>
                    </Link>
                  </DataTableCell>
                );
              case "location":
                return <DataTableCell key={id}>{row.city ?? "—"}</DataTableCell>;
              case "date": {
                const d = daysTo(row.date);
                return (
                  <DataTableCell key={id}>
                    {row.date ? (
                      <>
                        <span className="block">
                          {new Date(row.date).toLocaleDateString(undefined, {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        <span
                          className={
                            d != null && d >= 0 && d <= 30 ? "text-xs text-warning" : "text-xs text-muted-foreground"
                          }
                        >
                          {d == null ? "" : d < 0 ? "Married" : d === 0 ? "Today" : `in ${d} days`}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">No date</span>
                    )}
                  </DataTableCell>
                );
              }
              case "team":
                return (
                  <DataTableCell key={id}>
                    <span className="block">{row.bookedVendorCount} vendors booked</span>
                    <span className="text-xs text-muted-foreground">{row.guestHouseholdCount} guest households</span>
                  </DataTableCell>
                );
              case "actions":
                return (
                  <DataTableCell key={id}>
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/admin/weddings/${row.id}`}>Open</Link>
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
