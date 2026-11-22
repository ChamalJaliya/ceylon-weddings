"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Users } from "lucide-react";
import { api } from "@ceylonweddings/web";
import type { AdminUser } from "@ceylonweddings/contracts";
import { Badge } from "@ceylonweddings/ui/components/badge";
import { Button } from "@ceylonweddings/ui/components/button";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { AdminListToolbar } from "@ceylonweddings/ui/domain/admin-list-toolbar";
import { DataTableCell, DataTableHead } from "@ceylonweddings/ui/domain/data-table";
import { DataTableList } from "@ceylonweddings/ui/domain/data-table-list";
import { PlanningHero, heroButtonClass } from "@/features/planning/components/planning-hero";
import { initials } from "@/lib/labels";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { getListEmptyMode, showListChrome } from "@ceylonweddings/ui/lib/list-state";
import { useClientTablePagination } from "@ceylonweddings/ui/lib/use-client-table-pagination";
import { Link } from "@/i18n/navigation";

const COLUMNS = ["name", "role", "status", "actions"] as const;
const ROLE_TONE: Record<string, string> = {
  COUPLE: "bg-love/15 text-love-fg",
  FAMILY: "bg-love/10 text-love-fg",
  VENDOR: "bg-primary/10 text-primary",
  ADMIN: "bg-ink text-paper",
};
const pretty = (v: string) => v.charAt(0) + v.slice(1).toLowerCase().replaceAll("_", " ");

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [q, setQ] = useState("");
  const [role, setRole] = useState<"ALL" | "COUPLE" | "FAMILY" | "VENDOR" | "ADMIN" | "SUSPENDED">("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setUsers(await api.admin.users({ q: q || undefined }));
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

  const filtered = useMemo(
    () =>
      users.filter((u) => (role === "ALL" ? true : role === "SUSPENDED" ? u.status === "SUSPENDED" : u.role === role)),
    [users, role],
  );
  const counts = useMemo(() => {
    const by = (r: string) => users.filter((u) => u.role === r).length;
    return {
      ALL: users.length,
      COUPLE: by("COUPLE"),
      FAMILY: by("FAMILY"),
      VENDOR: by("VENDOR"),
      ADMIN: by("ADMIN"),
      SUSPENDED: users.filter((u) => u.status === "SUSPENDED").length,
    };
  }, [users]);
  const { page, setPage, setLimit, pageItems, total, totalPages, limit } = useClientTablePagination(
    filtered,
    25,
    `${q}|${role}`,
  );
  const emptyMode = getListEmptyMode({
    sourceCount: users.length,
    filteredCount: filtered.length,
  });
  const chrome = showListChrome(emptyMode, loading);

  async function exportCsv() {
    const csv = await api.admin.exportCsv("users");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "users.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

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
        icon={Users}
        kicker="Admin"
        title="Users"
        description="Search accounts, suspend abuse, and open support detail."
        actions={
          chrome ? (
            <Button
              variant="outline"
              size="sm"
              shape="pill"
              className={heroButtonClass}
              onClick={() => void exportCsv()}
            >
              <Download className="size-4" /> Export CSV
            </Button>
          ) : null
        }
      >
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          {[
            { k: "Accounts", v: counts.ALL },
            { k: "Couples", v: counts.COUPLE },
            { k: "Family", v: counts.FAMILY },
            { k: "Vendors", v: counts.VENDOR },
            { k: "Admins", v: counts.ADMIN },
            { k: "Suspended", v: counts.SUSPENDED, warn: counts.SUSPENDED > 0 },
          ].map((stat) => (
            <div key={stat.k}>
              <p className="text-xs text-paper/60">{stat.k}</p>
              <p className={stat.warn ? "font-serif text-2xl text-love" : "font-serif text-2xl"}>{stat.v}</p>
            </div>
          ))}
        </div>
      </PlanningHero>
      <SectionCard title="Accounts" icon={Users}>
        {chrome ? (
          <div className="inline-flex w-fit flex-wrap rounded-full border border-border bg-background p-1">
            {(
              [
                ["ALL", "All"],
                ["COUPLE", "Couples"],
                ["FAMILY", "Family"],
                ["VENDOR", "Vendors"],
                ["ADMIN", "Admins"],
                ["SUSPENDED", "Suspended"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setRole(id)}
                className={
                  role === id
                    ? "rounded-full bg-primary px-3.5 py-1.5 text-sm text-primary-foreground"
                    : "rounded-full px-3.5 py-1.5 text-sm text-muted-foreground hover:text-foreground"
                }
              >
                {label} <span className="ml-1 opacity-60 tabular-nums">{counts[id]}</span>
              </button>
            ))}
          </div>
        ) : null}
        {chrome ? (
          <AdminListToolbar
            searchValue={q}
            onSearchChange={setQ}
            searchPlaceholder="Search name or email…"
            summary={loading ? "Loading…" : `${total} account${total === 1 ? "" : "s"}`}
          />
        ) : null}
        <DataTableList
          framed={false}
          loading={loading}
          loadingColumns={COLUMNS.length}
          sourceCount={users.length}
          filteredCount={filtered.length}
          empty={{
            icon: Users,
            title: "No users",
            description: "Accounts will appear here.",
          }}
          filteredEmpty={{
            onClearFilters: () => {
              setQ("");
              setRole("ALL");
            },
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
          getRowId={(user) => user.id}
          orderedVisibleIds={COLUMNS}
          renderHead={(id) => {
            const labels: Record<(typeof COLUMNS)[number], string> = {
              name: "Name",
              role: "Role",
              status: "Status",
              actions: "",
            };
            return (
              <DataTableHead key={id} className={id === "actions" ? "w-16" : undefined}>
                {labels[id as (typeof COLUMNS)[number]]}
              </DataTableHead>
            );
          }}
          renderCell={(id, user) => {
            switch (id) {
              case "name":
                return (
                  <DataTableCell key={id}>
                    <Link href={`/admin/users/${user.id}`} className="group flex items-center gap-3">
                      <span
                        className={
                          "grid size-9 shrink-0 place-items-center rounded-full text-xs font-medium " +
                          (ROLE_TONE[user.role] ?? "bg-secondary text-foreground")
                        }
                      >
                        {initials(user.name)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium group-hover:text-primary">{user.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
                      </span>
                    </Link>
                  </DataTableCell>
                );
              case "role":
                return (
                  <DataTableCell key={id}>
                    <span className="text-sm">{pretty(user.role)}</span>
                  </DataTableCell>
                );
              case "status":
                return (
                  <DataTableCell key={id}>
                    <Badge intent={user.status === "SUSPENDED" ? "danger" : "success"}>{pretty(user.status)}</Badge>
                  </DataTableCell>
                );
              case "actions":
                return (
                  <DataTableCell key={id}>
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/admin/users/${user.id}`}>Open</Link>
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
