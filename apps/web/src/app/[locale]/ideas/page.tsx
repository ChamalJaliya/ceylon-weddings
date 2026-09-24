"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Cake,
  Car,
  Flower2,
  Heart,
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
import { Icon } from "@ceylonweddings/ui/components/icon";
import { EmptyState } from "@ceylonweddings/ui/domain/empty-state";
import { Reveal, Stagger, StaggerItem, Pressable, motion, useReducedMotion } from "@ceylonweddings/ui/domain/motion";
import { Link } from "../../../i18n/navigation";

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

  useEffect(() => {
    void api.site
      .flags()
      .then((flags) => setEnabled(flags["ideas.public"] !== false))
      .catch(() => setEnabled(true));
  }, []);

  useEffect(() => {
    if (!enabled) return;
    api.public.articles(category || undefined, q || undefined).then(setArticles).catch(() => setArticles([]));
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

  return (
    <div className="cw-stack -mt-2">
      <Reveal className="relative overflow-hidden rounded-[2rem] bg-secondary/35 px-6 py-14 sm:px-10 sm:py-16" y={14}>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_oklch(0.55_0.1_78_/_0.12),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_oklch(0.68_0.12_15_/_0.08),_transparent_50%)]"
        />
        <div className="relative mx-auto grid max-w-3xl gap-6 text-center">
          <p className="text-[11px] font-medium tracking-[0.28em] text-primary uppercase">{t("app.name")}</p>
          <h1 className="font-serif text-4xl leading-[0.95] font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            {t("knotly.ideasHero")}
          </h1>
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
            {t("knotly.ideasSub")}
          </p>
          <label className="relative mx-auto mt-2 flex w-full max-w-md items-center">
            <Icon icon={Search} size="sm" className="pointer-events-none absolute left-4 text-muted-foreground" />
            <Input
              className="h-12 rounded-full border-border/60 bg-card/80 pl-11 shadow-sm backdrop-blur-sm"
              placeholder={t("knotly.searchIdeas")}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label={t("knotly.searchIdeas")}
            />
          </label>
        </div>
      </Reveal>

      <Reveal y={10}>
        <div className="flex flex-wrap items-center gap-2 py-2">
          <button
            type="button"
            className={`inline-flex shrink-0 items-center justify-center rounded-full px-4 py-2 text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer ${
              category === ""
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-secondary/80 text-foreground hover:bg-secondary border border-border/60"
            }`}
            onClick={() => setCategory("")}
          >
            {t("marketing.allCategories")}
          </button>
          {ROW.map((value) => {
            const icon = ICONS[value];
            const active = category === value;
            return (
              <button
                key={value}
                type="button"
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary/80 text-foreground hover:bg-secondary border border-border/60"
                }`}
                onClick={() => setCategory(value)}
              >
                {icon ? <Icon icon={icon} size="xs" /> : null}
                <span>{t(`knotly.cat_${value.toLowerCase()}`)}</span>
              </button>
            );
          })}
        </div>
      </Reveal>

      {featured ? (
        <Reveal y={18}>
          <Link
            href={`/ideas/${featured.slug}`}
            className="group relative block isolate min-h-[22rem] overflow-hidden rounded-[2rem] sm:min-h-[28rem]"
          >
            <motion.img
              src={featured.coverUrl}
              alt=""
              className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-[1.03]"
              initial={reduce ? false : { scale: 1.06 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/15" />
            <div className="relative flex min-h-[22rem] flex-col justify-end gap-3 px-6 py-8 sm:min-h-[28rem] sm:px-10 sm:py-12">
              <p className="text-[11px] font-medium tracking-[0.22em] text-primary uppercase">
                {t("nav.featured")}
              </p>
              <h2 className="max-w-2xl font-serif text-3xl leading-[1.05] font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
                {featured.title}
              </h2>
              <p className="max-w-xl text-sm leading-relaxed text-white/75 sm:text-[15px]">{featured.excerpt}</p>
              <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-white transition group-hover:gap-2">
                {t("knotly.read")}
                <span aria-hidden>→</span>
              </span>
            </div>
          </Link>
        </Reveal>
      ) : null}

      {rest.length ? (
        <section className="grid gap-6">
          <Reveal y={8}>
            <p className="text-[11px] font-medium tracking-[0.22em] text-muted-foreground uppercase">
              {t("nav.ideas")}
            </p>
          </Reveal>
          <Stagger className="grid gap-5 sm:grid-cols-2 sm:gap-6" stagger={0.07}>
            {rest.map((article) => (
              <StaggerItem key={article.id}>
                <Link
                  href={`/ideas/${article.slug}`}
                  className="group grid gap-4 overflow-hidden rounded-[1.75rem] transition duration-300 hover:-translate-y-1"
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={article.coverUrl}
                      alt=""
                      className="size-full object-cover transition duration-700 group-hover:scale-[1.05]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent opacity-0 transition group-hover:opacity-100" />
                  </div>
                  <div className="grid gap-2 px-1">
                    <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                      {t(`knotly.cat_${article.category.toLowerCase()}`)}
                    </p>
                    <h3 className="font-serif text-2xl leading-tight tracking-tight transition group-hover:text-primary">
                      {article.title}
                    </h3>
                    <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{article.excerpt}</p>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      ) : null}

      {articles.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title={t("marketing.emptyVendors")}
          description={t("knotly.ideasSub")}
        />
      ) : null}
    </div>
  );
}
