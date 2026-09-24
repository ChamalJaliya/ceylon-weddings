"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { FileText } from "lucide-react";
import { api } from "@ceylonweddings/web";
import type { CmsPageStatus } from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { Input } from "@ceylonweddings/ui/components/input";
import { Textarea } from "@ceylonweddings/ui/components/textarea";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { Link } from "../../../../../../i18n/navigation";

export default function AdminCmsPageEditorPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<CmsPageStatus>("DRAFT");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const page = await api.admin.cmsPage(slug);
      setTitle(page.title);
      setExcerpt(page.excerpt ?? "");
      setBody(page.body);
      setStatus(page.status);
      setSeoTitle(page.seo?.title ?? "");
      setSeoDescription(page.seo?.description ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    return (
      <FormStatus tone="destructive">
        {error}. <Link href="/admin/settings/pages">Back</Link>
      </FormStatus>
    );
  }

  return (
    <div className="grid gap-8">
      <PageHeader
        icon={FileText}
        kicker="CMS"
        title={title || slug}
        description={`Edit /${slug} for the public site.`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/settings/pages">Back</Link>
            </Button>
            {status === "PUBLISHED" ? (
              <Button asChild size="sm" variant="outline">
                <Link href={`/${slug}`}>View on site</Link>
              </Button>
            ) : null}
            <Button
              size="sm"
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                setMessage(null);
                try {
                  await api.admin.upsertCmsPage(slug, {
                    title,
                    excerpt: excerpt || null,
                    body,
                    status,
                    locale: "en",
                    seo: {
                      title: seoTitle || undefined,
                      description: seoDescription || undefined,
                    },
                  });
                  setMessage("Saved");
                  await load();
                } catch (err) {
                  setMessage(err instanceof Error ? err.message : "Save failed");
                } finally {
                  setSaving(false);
                }
              }}
            >
              {saving ? "Saving…" : "Save page"}
            </Button>
          </div>
        }
      />
      {message ? <FormStatus>{message}</FormStatus> : null}

      <SectionCard title="Content" icon={FileText}>
        <div className="grid gap-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
          <Input value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Excerpt" />
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">Status</span>
            <select
              className="rounded-lg border border-border/70 bg-background px-3 py-2 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value as CmsPageStatus)}
            >
              <option value="DRAFT">DRAFT</option>
              <option value="PUBLISHED">PUBLISHED</option>
            </select>
          </label>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={18}
            placeholder="Markdown-ish body"
          />
        </div>
      </SectionCard>

      <SectionCard title="SEO" icon={FileText}>
        <div className="grid gap-3">
          <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="SEO title" />
          <Textarea
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
            rows={3}
            placeholder="SEO description"
          />
        </div>
      </SectionCard>
    </div>
  );
}
