"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Lightbulb } from "lucide-react";
import { api } from "@ceylonweddings/web";
import type { AdminArticle, ArticleCategory, ArticleStatus, UpsertAdminArticleBody } from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { CheckboxField } from "@ceylonweddings/ui/components/checkbox";
import { Input } from "@ceylonweddings/ui/components/input";
import { SimpleSelect } from "@ceylonweddings/ui/components/select";
import { Textarea } from "@ceylonweddings/ui/components/textarea";
import { PlanningHero } from "@/features/planning/components/planning-hero";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { Link, useRouter } from "@/i18n/navigation";

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
      <PlanningHero
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
          <SimpleSelect
            value={form.category}
            onValueChange={(category) => setForm((current) => ({ ...current, category: category as ArticleCategory }))}
            aria-label="Category"
            options={CATEGORIES.map((category) => ({ value: category, label: category }))}
          />
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
          <CheckboxField
            label="Featured on Ideas"
            checked={form.featured}
            onCheckedChange={(checked) => setForm((current) => ({ ...current, featured: checked === true }))}
          />
          <p className="text-xs text-muted-foreground">
            Public page: <Link href={`/ideas/${form.slug || "slug"}`}>/ideas/{form.slug || "slug"}</Link>
          </p>
        </div>
      </SectionCard>
    </div>
  );
}
