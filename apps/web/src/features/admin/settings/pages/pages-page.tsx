"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, FileText } from "lucide-react";
import { api } from "@ceylonweddings/web";
import type { CmsPage } from "@ceylonweddings/contracts";
import { Badge } from "@ceylonweddings/ui/components/badge";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { Icon } from "@ceylonweddings/ui/components/icon";
import { CenteredLoader } from "@ceylonweddings/ui/components/spinner";
import { EmptyState } from "@ceylonweddings/ui/domain/empty-state";
import { PlanningHero } from "@/features/planning/components/planning-hero";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { SettingsList, SettingsListRow } from "@ceylonweddings/ui/domain/settings-list-row";
import { Link } from "@/i18n/navigation";

export default function AdminCmsPagesListPage() {
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setPages(await api.admin.cmsPages());
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

  if (error) {
    return (
      <FormStatus tone="destructive">
        {error}. <Link href="/login">Sign in</Link>
      </FormStatus>
    );
  }

  return (
    <div className="grid gap-8">
      <PlanningHero
        icon={FileText}
        kicker="Settings"
        title="CMS pages"
        description="Edit About, FAQ, Terms, Privacy, and Contact bodies shown on the public site."
      />
      <SectionCard title="Pages" icon={FileText}>
        {loading ? (
          <CenteredLoader label="Loading pages" />
        ) : pages.length === 0 ? (
          <EmptyState icon={FileText} title="No pages" description="CMS pages will appear here." />
        ) : (
          <SettingsList>
            {pages.map((page) => (
              <SettingsListRow
                key={page.id}
                title={
                  <Link href={`/admin/settings/pages/${page.slug}`} className="hover:underline">
                    {page.title}
                  </Link>
                }
                description={`/${page.slug}`}
                actions={
                  <>
                    <Badge intent={page.status === "PUBLISHED" ? "success" : "outline"}>{page.status}</Badge>
                    {page.status === "PUBLISHED" ? (
                      <Link
                        href={`/${page.slug}`}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        View
                        <Icon icon={ExternalLink} size="xs" />
                      </Link>
                    ) : null}
                  </>
                }
              />
            ))}
          </SettingsList>
        )}
      </SectionCard>
    </div>
  );
}
