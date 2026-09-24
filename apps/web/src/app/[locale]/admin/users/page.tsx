"use client";

import { useCallback, useEffect, useState } from "react";
import { Users } from "lucide-react";
import { api } from "@ceylonweddings/web";
import type { AdminUser } from "@ceylonweddings/contracts";
import { Badge } from "@ceylonweddings/ui/components/badge";
import { Button } from "@ceylonweddings/ui/components/button";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { Input } from "@ceylonweddings/ui/components/input";
import { EmptyState } from "@ceylonweddings/ui/domain/empty-state";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { AdminDataCell, AdminDataRow, AdminDataTable } from "@ceylonweddings/ui/domain/admin-data-table";
import { Link } from "../../../../i18n/navigation";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setUsers(await api.admin.users({ q: q || undefined }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }, [q]);

  useEffect(() => {
    void load();
  }, [load]);

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
          <Button variant="outline" size="sm" onClick={() => void exportCsv()}>
            Export CSV
          </Button>
        }
      />
      <SectionCard title="Accounts" icon={Users}>
        <div className="mb-4">
          <Input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search name or email…" />
        </div>
        {users.length === 0 ? (
          <EmptyState icon={Users} title="No users" description="Accounts will appear here." />
        ) : (
          <AdminDataTable headers={["Name", "Role", "Status", ""]}>
            {users.map((user) => (
              <AdminDataRow key={user.id}>
                <AdminDataCell>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </AdminDataCell>
                <AdminDataCell>
                  <Badge>{user.role}</Badge>
                </AdminDataCell>
                <AdminDataCell>
                  <Badge intent={user.status === "SUSPENDED" ? "danger" : "success"}>{user.status}</Badge>
                </AdminDataCell>
                <AdminDataCell>
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/admin/users/${user.id}`}>Open</Link>
                  </Button>
                </AdminDataCell>
              </AdminDataRow>
            ))}
          </AdminDataTable>
        )}
      </SectionCard>
    </div>
  );
}
