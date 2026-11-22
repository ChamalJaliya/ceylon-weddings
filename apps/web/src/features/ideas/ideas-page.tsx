"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Cake,
  Car,
  Flower2,
  Heart,
  LayoutGrid,
  Lightbulb,
  PartyPopper,
  Search,
  Shirt,
  Sparkles,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { api } from "@ceylonweddings/web";
import type { Article, ArticleCategory } from "@ceylonweddings/contracts";
import { Input } from "@ceylonweddings/ui/components/input";
import { EmptyState } from "@ceylonweddings/ui/domain/empty-state";
import {
  AnimatePresence,
  LayoutGroup,
  Reveal,
  Stagger,
  StaggerItem,
  motion,
  useReducedMotion,
} from "@ceylonweddings/ui/domain/motion";
import { cn } from "@ceylonweddings/ui/utils";
import { PageHero } from "@/components/page-hero";
import { SafeImg } from "@/components/safe-img";
import { SponsoredPromoStrip } from "@/components/sponsored-promo-strip";
import { Link } from "@/i18n/navigation";

const ICONS: Partial<Record<ArticleCategory, typeof Flower2>> = {
  FLOWERS: Flower2,
  CEREMONY: Sparkles,
  CAKES: Cake,
  TRANSPORT: Car,
  FASHION: Shirt,
  BEAUTY: Heart,
  FAMILY: Users,
  EVENTS: PartyPopper,
  REAL_WEDDING: Heart,
};

const ROW: ArticleCategory[] = [
  "REAL_WEDDING",
  "FLOWERS",
  "CEREMONY",
  "CAKES",
  "TRANSPORT",
  "FASHION",
  "BEAUTY",
  "FAMILY",
  "EVENTS",
];

export default function IdeasPage() {
  const t = useTranslations();
  const reduce = useReducedMotion();
  const [articles, setArticles] = useState<Article[]>([]);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("");
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void api.site
      .flags()
      .then((flags) => setEnabled(flags["ideas.public"] !== false))
      .catch(() => setEnabled(true));
  }, []);

  useEffect(() => {
    if (!enabled) return;
    setLoading(true);
    api.public
      .articles(category || undefined, q || undefined)
      .then(setArticles)
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, [category, q, enabled]);

  const featured = useMemo(() => articles.find((item) => item.featured) ?? articles[0], [articles]);
  const rest = articles.filter((item) => item.id !== featured?.id);

  if (!enabled) {
    return (
      <EmptyState
        icon={Lightbulb}
        title="Ideas unpublished"
        description="Inspiration articles are currently hidden by platform settings."
      />
    );
  }

  const chips: { value: string; label: string; icon: typeof Flower2 }[] = [
    { value: "", label: t("marketing.allCategories"), icon: LayoutGrid },
    ...ROW.map((value) => ({
      value,
      label: t(`knotly.cat_${value.toLowerCase()}`),
      icon: ICONS[value] ?? Sparkles,
    })),
  ];
  const lead = rest.slice(0, 2);
  const more = rest.slice(2);
  const resultKey = `${category}-${q}`;

  return (
    <div className="cw-stack -mt-2">
      <PageHero
        className="px-0 pt-0 sm:px-0"
        image={4}
        icon={<Lightbulb className="size-6" />}
        eyebrow={t("nav.ideas")}
        title={t("knotly.ideasHero")}
        sub={t("knotly.ideasSub")}
      >
        <label className="relative flex w-full max-w-md items-center">
          <Search className="pointer-events-none absolute left-4 size-4 text-muted-foreground" />
          <Input
            className="h-12 rounded-full border-transparent bg-card pl-11 shadow-raised"
            placeholder={t("knotly.searchIdeas")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label={t("knotly.searchIdeas")}
          />
        </label>
      </PageHero>

      <LayoutGroup id="ideas-categories">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {chips.map(({ value, label, icon: ChipIcon }) => {
            const active = category === value;
            return (
              <motion.button
                key={value || "all"}
                type="button"
                whileTap={reduce ? undefined : { scale: 0.95 }}
                onClick={() => setCategory(value)}
                className={cn(
                  "relative inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm whitespace-nowrap transition-colors",
                  active
                    ? "border-transparent text-primary-foreground"
                    : "border-border bg-card text-foreground hover:border-primary/40 hover:text-primary",
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="ideas-chip-active"
                    className="absolute inset-0 rounded-full bg-primary shadow-md"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                ) : null}
                <ChipIcon className="relative size-4" />
                <span className="relative">{label}</span>
              </motion.button>
            );
          })}
        </div>
      </LayoutGroup>

      <SponsoredPromoStrip
        slot="IDEAS_INLINE"
        eyebrow="Sponsored story"
        title="Ideas from vendors on the island"
        category={category || undefined}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={loading ? "loading" : resultKey}
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, y: -12 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="grid gap-10"
        >
          {loading ? (
            <div className="grid gap-5 md:grid-cols-3">
              <div className="cw-shimmer aspect-[16/10] rounded-3xl bg-muted md:col-span-2 md:row-span-2 md:aspect-auto" />
              <div className="cw-shimmer aspect-[4/3] rounded-3xl bg-muted" />
              <div className="cw-shimmer aspect-[4/3] rounded-3xl bg-muted" />
            </div>
          ) : articles.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
              <motion.span
                animate={reduce ? undefined : { y: [0, -8, 0], rotate: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="mx-auto mb-5 grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary"
              >
                <Lightbulb className="size-7" />
              </motion.span>
              <h3 className="font-serif text-2xl font-medium">No ideas match that yet</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Try another category or a different search.
              </p>
            </div>
          ) : (
            <>
              {/* Featured + two leads in an editorial grid */}
              <div className="grid gap-5 md:grid-cols-3 md:grid-rows-2">
                {featured ? (
                  <Link
                    href={`/ideas/${featured.slug}`}
                    className="group relative isolate flex min-h-[22rem] overflow-hidden rounded-3xl md:col-span-2 md:row-span-2 md:min-h-[32rem]"
                  >
                    <motion.img
                      src={featured.coverUrl}
                      alt=""
                      className="absolute inset-0 -z-10 size-full object-cover transition duration-700 group-hover:scale-105"
                      initial={reduce ? false : { scale: 1.08 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    />
                    <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/85 via-ink/30 to-transparent" />
                    <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-paper/90 px-3 py-1 text-xs font-medium text-ink backdrop-blur">
                      <Sparkles className="size-3.5 text-primary" /> {t("nav.featured")}
                    </span>
                    <div className="mt-auto grid gap-3 p-6 sm:p-10">
                      <p className="text-label font-medium tracking-eyebrow text-paper/75 uppercase">
                        {t(`knotly.cat_${featured.category.toLowerCase()}`)}
                      </p>
                      <h2 className="max-w-2xl font-serif text-3xl leading-tight font-medium tracking-tight text-paper sm:text-5xl">
                        {featured.title}
                      </h2>
                      <p className="line-clamp-2 max-w-xl text-sm leading-relaxed text-paper/80 sm:text-h4">
                        {featured.excerpt}
                      </p>
                      <span className="mt-2 inline-flex w-fit items-center gap-2 rounded-full bg-paper px-4 py-2 text-sm font-medium text-ink transition-all group-hover:gap-3">
                        {t("knotly.read")} <ArrowRight className="size-4" />
                      </span>
                    </div>
                  </Link>
                ) : null}
                {lead.map((article, index) => (
                  <motion.div
                    key={article.id}
                    initial={reduce ? false : { opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + index * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="min-h-56"
                  >
                    <Link
                      href={`/ideas/${article.slug}`}
                      className="group relative isolate flex h-full overflow-hidden rounded-3xl"
                    >
                      <SafeImg
                        src={article.coverUrl}
                        fallbackIndex={article.title.length}
                        alt=""
                        className="absolute inset-0 -z-10 size-full object-cover transition duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
                      <span className="absolute top-3 right-3 grid size-9 translate-x-2 -translate-y-2 place-items-center rounded-full bg-paper text-ink opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100">
                        <ArrowUpRight className="size-4" />
                      </span>
                      <div className="mt-auto grid gap-1 p-5">
                        <p className="text-label tracking-eyebrow text-paper/75 uppercase">
                          {t(`knotly.cat_${article.category.toLowerCase()}`)}
                        </p>
                        <h3 className="font-serif text-xl leading-tight text-paper sm:text-2xl">{article.title}</h3>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>

              {more.length ? (
                <section className="grid gap-6">
                  <Reveal className="flex items-center gap-3">
                    <span className="h-px w-8 bg-primary/50" />
                    <p className="text-label font-medium tracking-eyebrow text-primary uppercase">More ideas</p>
                  </Reveal>
                  <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6" stagger={0.06}>
                    {more.map((article) => (
                      <StaggerItem key={article.id} className="h-full">
                        <Link
                          href={`/ideas/${article.slug}`}
                          className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-card transition-all duration-500 motion-safe:hover:-translate-y-1.5 hover:shadow-raised"
                        >
                          <div className="relative m-2 mb-0 aspect-[4/3] overflow-hidden rounded-2xl">
                            <SafeImg
                              src={article.coverUrl}
                              fallbackIndex={article.title.length}
                              alt=""
                              loading="lazy"
                              className="size-full object-cover transition duration-700 group-hover:scale-105"
                            />
                          </div>
                          <div className="flex flex-1 flex-col gap-2 px-5 pt-4 pb-5">
                            <p className="text-label tracking-eyebrow text-primary uppercase">
                              {t(`knotly.cat_${article.category.toLowerCase()}`)}
                            </p>
                            <h3 className="font-serif text-2xl leading-tight tracking-tight transition group-hover:text-primary">
                              {article.title}
                            </h3>
                            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                              {article.excerpt}
                            </p>
                            <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-medium text-primary transition-all group-hover:gap-2.5">
                              {t("knotly.read")} <ArrowRight className="size-4" />
                            </span>
                          </div>
                        </Link>
                      </StaggerItem>
                    ))}
                  </Stagger>
                </section>
              ) : null}

              <SponsoredPromoStrip slot="REELS" eyebrow="Wedding Reels" title="Short films from vendors" />
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
