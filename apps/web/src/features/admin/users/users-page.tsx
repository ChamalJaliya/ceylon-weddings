"use client";

import { useCallback, useEffect, useState } from "react";
import { Users } from "lucide-react";
import { api } from "@ceylonweddings/web";
import type { AdminUser } from "@ceylonweddings/contracts";
import { Badge } from "@ceylonweddings/ui/components/badge";
import { Button } from "@ceylonweddings/ui/components/button";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { AdminListToolbar } from "@ceylonweddings/ui/domain/admin-list-toolbar";
import { DataTableCell, DataTableHead } from "@ceylonweddings/ui/domain/data-table";
import { DataTableList } from "@ceylonweddings/ui/domain/data-table-list";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { getListEmptyMode, showListChrome } from "@ceylonweddings/ui/lib/list-state";
import { useClientTablePagination } from "@ceylonweddings/ui/lib/use-client-table-pagination";
import { Link } from "@/i18n/navigation";

const COLUMNS = ["name", "role", "status", "actions"] as const;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [q, setQ] = useState("");
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

  const filtered = users;
  const { page, setPage, setLimit, pageItems, total, totalPages, limit } = useClientTablePagination(filtered, 25, q);
  const emptyMode = getListEmptyMode({ sourceCount: users.length, filteredCount: filtered.length });
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
    <div className="grid gap-8">
      <PageHeader
        icon={Users}
        kicker="Admin"
        title="Users"
        description="Search accounts, suspend abuse, and open support detail."
        actions={
          chrome ? (
            <Button variant="outline" size="sm" onClick={() => void exportCsv()}>
              Export CSV
            </Button>
          ) : null
        }
      />
      <SectionCard title="Accounts" icon={Users}>
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
          getRowId={(user) => user.id}
          orderedVisibleIds={COLUMNS}
          renderHead={(id) => {
            const labels: Record<(typeof COLUMNS)[number], string> = {
              name: "Name",
              role: "Role",
              status: "Status",
              actions: "",
            };
            return <DataTableHead key={id}>{labels[id as (typeof COLUMNS)[number]]}</DataTableHead>;
          }}
          renderCell={(id, user) => {
            switch (id) {
              case "name":
                return (
                  <DataTableCell key={id}>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </DataTableCell>
                );
              case "role":
                return (
                  <DataTableCell key={id}>
                    <Badge>{user.role}</Badge>
                  </DataTableCell>
                );
              case "status":
                return (
                  <DataTableCell key={id}>
                    <Badge intent={user.status === "SUSPENDED" ? "danger" : "success"}>{user.status}</Badge>
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
