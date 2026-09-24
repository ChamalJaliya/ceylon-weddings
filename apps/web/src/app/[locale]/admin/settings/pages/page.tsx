"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, FileText } from "lucide-react";
import { api } from "@ceylonweddings/web";
import type { CmsPage } from "@ceylonweddings/contracts";
import { Badge } from "@ceylonweddings/ui/components/badge";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { Link } from "../../../../../i18n/navigation";

export default function AdminCmsPagesListPage() {
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setPages(await api.admin.cmsPages());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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
        icon={FileText}
        kicker="Settings"
        title="CMS pages"
        description="Edit About, FAQ, Terms, Privacy, and Contact bodies shown on the public site."
      />
      <SectionCard title="Pages" icon={FileText}>
        <ul className="grid gap-2">
          {pages.map((page) => (
            <li
              key={page.id}
              className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-3 text-sm transition hover:border-primary/40"
            >
              <Link href={`/admin/settings/pages/${page.slug}`} className="min-w-0 flex-1">
                <p className="font-medium">{page.title}</p>
                <p className="text-xs text-muted-foreground">/{page.slug}</p>
              </Link>
              <Badge intent={page.status === "PUBLISHED" ? "success" : "outline"}>{page.status}</Badge>
              {page.status === "PUBLISHED" ? (
                <Link
                  href={`/${page.slug}`}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  View
                  <ExternalLink className="size-3" />
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}
