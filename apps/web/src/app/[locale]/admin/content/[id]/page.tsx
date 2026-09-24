"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Lightbulb } from "lucide-react";
import { api } from "@ceylonweddings/web";
import type { AdminArticle, ArticleCategory, ArticleStatus, UpsertAdminArticleBody } from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { Input } from "@ceylonweddings/ui/components/input";
import { Textarea } from "@ceylonweddings/ui/components/textarea";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { Link, useRouter } from "../../../../../i18n/navigation";

const CATEGORIES: ArticleCategory[] = [
  "FLOWERS",
  "CEREMONY",
  "CAKES",
  "TRANSPORT",
  "FASHION",
  "BEAUTY",
  "FAMILY",
  "EVENTS",
  "TRAVEL",
  "FOOD",
  "REAL_WEDDING",
];

const empty: UpsertAdminArticleBody = {
  slug: "",
  title: "",
  excerpt: "",
  body: "",
  category: "CEREMONY",
  coverUrl: "/images/ideas-cover.jpg",
  locale: "en",
  featured: false,
  status: "DRAFT",
  vendorSlugs: [],
};

export default function AdminContentEditorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const isNew = params.id === "new";
  const [form, setForm] = useState<UpsertAdminArticleBody>(empty);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isNew) return;
    api.admin
      .article(params.id)
      .then((article: AdminArticle) => {
        setForm({
          slug: article.slug,
          title: article.title,
          excerpt: article.excerpt,
          body: article.body,
          category: article.category,
          coverUrl: article.coverUrl,
          locale: article.locale,
          featured: article.featured,
          status: article.status,
          vendorSlugs: article.vendorSlugs,
          publishedAt: article.publishedAt,
        });
      })
      .catch((err: Error) => setError(err.message));
  }, [isNew, params.id]);

  async function save(status?: ArticleStatus) {
    try {
      setError(null);
      const body = { ...form, status: status ?? form.status };
      if (isNew) {
        const created = await api.admin.createArticle(body);
        setMessage("Created");
        router.replace(`/admin/content/${created.id}`);
      } else {
        await api.admin.updateArticle(params.id, body);
        setMessage("Saved");
        setForm(body);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  return (
    <div className="grid gap-8">
      <PageHeader
        icon={Lightbulb}
        kicker="CMS"
        title={isNew ? "New article" : form.title || "Edit article"}
        description="Draft locally, publish when ready."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => void save("DRAFT")}>
              Save draft
            </Button>
            <Button size="sm" onClick={() => void save("PUBLISHED")}>
              Publish
            </Button>
            {!isNew ? (
              <Button
                size="sm"
                variant="destructive"
                onClick={async () => {
                  await api.admin.deleteArticle(params.id);
                  router.push("/admin/content");
                }}
              >
                Delete
              </Button>
            ) : null}
          </div>
        }
      />
      {error ? <FormStatus tone="destructive">{error}</FormStatus> : null}
      {message ? <FormStatus>{message}</FormStatus> : null}
      <SectionCard title="Editor" icon={Lightbulb}>
        <div className="grid gap-3">
          <Input
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
          />
          <Input
            placeholder="slug-like-this"
            value={form.slug}
            onChange={(e) => setForm((current) => ({ ...current, slug: e.target.value }))}
          />
          <Input
            placeholder="Cover URL"
            value={form.coverUrl}
            onChange={(e) => setForm((current) => ({ ...current, coverUrl: e.target.value }))}
          />
          <select
            className="rounded-lg border border-border/70 bg-background px-3 py-2 text-sm"
            value={form.category}
            onChange={(e) =>
              setForm((current) => ({ ...current, category: e.target.value as ArticleCategory }))
            }
          >
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <Textarea
            placeholder="Excerpt"
            value={form.excerpt}
            onChange={(e) => setForm((current) => ({ ...current, excerpt: e.target.value }))}
            rows={2}
          />
          <Textarea
            placeholder="Body"
            value={form.body}
            onChange={(e) => setForm((current) => ({ ...current, body: e.target.value }))}
            rows={12}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm((current) => ({ ...current, featured: e.target.checked }))}
            />
            Featured on Ideas
          </label>
          <p className="text-xs text-muted-foreground">
            Public page: <Link href={`/ideas/${form.slug || "slug"}`}>/ideas/{form.slug || "slug"}</Link>
          </p>
        </div>
      </SectionCard>
    </div>
  );
}
