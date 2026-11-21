import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, Clock, MapPin, Star } from "lucide-react";
import { api } from "@ceylonweddings/web";
import type { Article } from "@ceylonweddings/contracts";
import { Reveal, Stagger, StaggerItem } from "@ceylonweddings/ui/domain/motion";
import { Link } from "@/i18n/navigation";
import { CATEGORY_LABELS } from "@/lib/labels";
import { PageHero } from "@/components/page-hero";
import { SafeImg } from "@/components/safe-img";
import { FinalCta } from "@/features/home/home-sections";
import { CopyLinkButton, ReadingProgress } from "./article-extras";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
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
  let article: Article;
  try {
    article = await api.public.article(slug);
  } catch {
    notFound();
  }

  const vendorSlugs = article.vendorSlugs ?? [];
  const [vendorResults, related] = await Promise.all([
    Promise.all(
      vendorSlugs.map(async (vendorSlug) => {
        try {
          return await api.vendors.get(vendorSlug);
        } catch {
          return null;
        }
      }),
    ),
    api.public
      .articles(undefined, undefined)
      .then((rows) =>
        rows
          .filter((row) => row.id !== article.id)
          .sort((a, b) => Number(b.category === article.category) - Number(a.category === article.category))
          .slice(0, 3),
      )
      .catch(() => [] as Article[]),
  ]);
  const vendors = vendorResults.filter((vendor): vendor is NonNullable<typeof vendor> => Boolean(vendor));

  const categoryLabel = t(`knotly.cat_${article.category.toLowerCase()}`);
  const paragraphs = article.body.split("\n").filter((para) => para.trim());
  const minutes = Math.max(1, Math.round(article.body.split(/\s+/).length / 200));
  const published = article.publishedAt
    ? new Intl.DateTimeFormat("en", { day: "numeric", month: "long", year: "numeric" }).format(
        new Date(article.publishedAt),
      )
    : null;

  return (
    <div className="pb-20">
      <ReadingProgress />

      <PageHero
        className="px-0 pt-0 sm:px-0"
        imageSrc={article.coverUrl}
        image={article.title.length}
        eyebrow={categoryLabel}
        title={article.title}
        sub={article.excerpt}
      >
        <div className="flex flex-wrap items-center gap-2 text-xs text-paper/85">
          {published ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-paper/10 px-3 py-1.5 backdrop-blur">
              <CalendarDays className="size-3.5" /> {published}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-paper/10 px-3 py-1.5 backdrop-blur">
            <Clock className="size-3.5" /> {minutes} min read
          </span>
        </div>
      </PageHero>

      <div className="mx-auto grid max-w-6xl gap-10 py-14 lg:grid-cols-[12rem_minmax(0,1fr)_12rem] lg:gap-12">
        {/* Left rail */}
        <aside className="hidden lg:block">
          <div className="sticky top-28 grid gap-3">
            <Link
              href="/ideas"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-primary"
            >
              <ArrowLeft className="size-4" /> {t("nav.ideas")}
            </Link>
            <CopyLinkButton />
          </div>
        </aside>

        {/* Body */}
        <article className="mx-auto w-full max-w-2xl">
          <Link
            href="/ideas"
            className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-primary lg:hidden"
          >
            <ArrowLeft className="size-4" /> {t("nav.ideas")}
          </Link>
          <Reveal className="grid gap-6 text-base leading-8 text-foreground/90 sm:text-lg sm:leading-9">
            {paragraphs.map((para, index) => (
              <p
                key={`${index}-${para.slice(0, 12)}`}
                className={
                  index === 0
                    ? "first-letter:float-left first-letter:mt-1 first-letter:mr-3 first-letter:font-serif first-letter:text-6xl first-letter:leading-none first-letter:text-primary"
                    : undefined
                }
              >
                {para}
              </p>
            ))}
          </Reveal>
          <div className="mt-10 flex items-center gap-3 border-t border-border pt-6 lg:hidden">
            <CopyLinkButton />
          </div>
        </article>
        <div className="hidden lg:block" />
      </div>

      <div className="mx-auto grid max-w-6xl gap-24">
        {vendors.length ? (
          <section>
            <Reveal className="mb-8">
              <p className="mb-2 inline-flex items-center gap-2 text-label font-medium tracking-eyebrow text-primary uppercase">
                <span className="h-px w-8 bg-primary/50" /> {t("knotly.asSeenIn")}
              </p>
              <h2 className="font-serif text-3xl font-medium tracking-tight sm:text-4xl">Vendors from this story</h2>
            </Reveal>
            <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={0.07}>
              {vendors.map((vendor, index) => (
                <StaggerItem key={vendor.id} className="h-full">
                  <Link
                    href={`/vendors/${vendor.slug}`}
                    className="group flex h-full items-center gap-4 rounded-3xl border border-border bg-card p-3 shadow-card transition-all duration-300 motion-safe:hover:-translate-y-1 hover:border-primary/40 hover:shadow-raised"
                  >
                    <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl">
                      <SafeImg
                        src={vendor.photoUrl ?? vendor.photos?.[0]}
                        fallbackIndex={index}
                        className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-label tracking-eyebrow text-primary uppercase">
                        {CATEGORY_LABELS[vendor.category] ?? vendor.category}
                      </p>
                      <p className="truncate font-serif text-xl group-hover:text-primary">{vendor.name}</p>
                      <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3" /> {vendor.city}
                        </span>
                        {vendor.ratingAvg ? (
                          <span className="inline-flex items-center gap-1">
                            <Star className="size-3 fill-primary text-primary" /> {vendor.ratingAvg.toFixed(1)}
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <ArrowUpRight className="mr-2 size-5 shrink-0 text-muted-foreground transition-all group-hover:rotate-45 group-hover:text-primary" />
                  </Link>
                </StaggerItem>
              ))}
            </Stagger>
          </section>
        ) : null}

        {related.length ? (
          <section>
            <Reveal className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="mb-2 inline-flex items-center gap-2 text-label font-medium tracking-eyebrow text-primary uppercase">
                  <span className="h-px w-8 bg-primary/50" /> Keep reading
                </p>
                <h2 className="font-serif text-3xl font-medium tracking-tight sm:text-4xl">More ideas for your day</h2>
              </div>
              <Link
                href="/ideas"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                All ideas <ArrowRight className="size-4" />
              </Link>
            </Reveal>
            <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" stagger={0.07}>
              {related.map((item, index) => (
                <StaggerItem key={item.id} className="h-full">
                  <Link
                    href={`/ideas/${item.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-card transition-all duration-500 motion-safe:hover:-translate-y-1.5 hover:shadow-raised"
                  >
                    <div className="relative m-2 mb-0 aspect-[4/3] overflow-hidden rounded-2xl">
                      <SafeImg
                        src={item.coverUrl}
                        fallbackIndex={index + 2}
                        loading="lazy"
                        className="size-full object-cover transition duration-700 group-hover:scale-105"
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-2 px-5 pt-4 pb-5">
                      <p className="text-label tracking-eyebrow text-primary uppercase">
                        {t(`knotly.cat_${item.category.toLowerCase()}`)}
                      </p>
                      <h3 className="font-serif text-2xl leading-tight tracking-tight transition group-hover:text-primary">
                        {item.title}
                      </h3>
                      <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{item.excerpt}</p>
                    </div>
                  </Link>
                </StaggerItem>
              ))}
            </Stagger>
          </section>
        ) : null}

        <FinalCta
          title="Turn ideas into your plan"
          sub="Save vendors, track your budget and share a wedding website, all free for couples."
          image={1}
          primary={{ href: "/register", label: "Start planning" }}
          secondary={{ href: "/vendors", label: "Browse vendors" }}
        />
      </div>
    </div>
  );
}
