import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { api } from "@ceylonweddings/web";
import { Reveal, Stagger, StaggerItem } from "@ceylonweddings/ui/domain/motion";
import { Link } from "../../../../i18n/navigation";
import { CATEGORY_LABELS } from "../../../../lib/labels";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const article = await api.public.article(slug);
    return {
      title: `${article.title} · Ceylon Weddings`,
      description: article.excerpt,
    };
  } catch {
    return { title: "Ideas · Ceylon Weddings" };
  }
}

export default async function IdeaArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = await getTranslations();
  let article;
  try {
    article = await api.public.article(slug);
  } catch {
    notFound();
  }

  const vendorSlugs = article.vendorSlugs ?? [];
  const vendors = (
    await Promise.all(
      vendorSlugs.map(async (vendorSlug) => {
        try {
          return await api.vendors.get(vendorSlug);
        } catch {
          return null;
        }
      }),
    )
  ).filter(Boolean);

  const categoryKey = `knotly.cat_${article.category.toLowerCase()}` as const;
  const categoryLabel =
    article.category === "REAL_WEDDING" ? t("knotly.cat_real_wedding") : t(categoryKey);

  return (
    <article className="mx-auto cw-stack max-w-3xl">
      <Reveal y={8}>
        <p className="text-sm">
          <Link href="/ideas" className="text-muted-foreground transition hover:text-foreground">
            ← {t("nav.ideas")}
          </Link>
        </p>
      </Reveal>

      <Reveal y={14} className="relative isolate overflow-hidden rounded-[2rem]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={article.coverUrl} alt="" className="aspect-[16/10] w-full object-cover sm:aspect-[2/1]" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
      </Reveal>

      <Reveal className="grid gap-4" y={12}>
        <p className="text-[11px] font-medium tracking-[0.22em] text-primary uppercase">{categoryLabel}</p>
        <h1 className="font-serif text-4xl leading-[1.05] font-semibold tracking-tight sm:text-5xl">
          {article.title}
        </h1>
        <p className="text-lg leading-relaxed text-muted-foreground">{article.excerpt}</p>
      </Reveal>

      <Reveal className="grid gap-5 text-base leading-7 text-foreground/90" y={10}>
        {article.body.split("\n").map((para) => (
          <p key={para}>{para}</p>
        ))}
      </Reveal>

      {vendors.length ? (
        <Reveal className="grid gap-5 rounded-[1.75rem] border border-border/50 bg-secondary/20 p-6 sm:p-8" y={12}>
          <div className="grid gap-1">
            <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">{t("knotly.asSeenIn")}</p>
            <h2 className="font-serif text-2xl tracking-tight">Vendors from this story</h2>
          </div>
          <Stagger className="grid gap-3 sm:grid-cols-2" stagger={0.06}>
            {vendors.map((vendor) =>
              vendor ? (
                <StaggerItem key={vendor.id}>
                  <Link
                    href={`/vendors/${vendor.slug}`}
                    className="flex items-center gap-3 rounded-2xl border border-border/50 bg-card/50 p-3 transition duration-300 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-sm"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={vendor.photoUrl ?? vendor.photos?.[0] ?? ""}
                      alt=""
                      className="size-14 rounded-xl bg-secondary object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{vendor.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {CATEGORY_LABELS[vendor.category] ?? vendor.category}
                      </p>
                    </div>
                  </Link>
                </StaggerItem>
              ) : null,
            )}
          </Stagger>
        </Reveal>
      ) : null}
    </article>
  );
}
