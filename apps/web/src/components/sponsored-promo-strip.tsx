"use client";

import { useEffect, useState } from "react";
import { api } from "@ceylonweddings/web";
import type { Promotion, PromotionSlot } from "@ceylonweddings/contracts";
import { Badge } from "@ceylonweddings/ui/components/badge";
import { Link } from "@/i18n/navigation";
import { SafeImg } from "@/components/safe-img";

const HOLDOUT_KEY = "cw_ads_holdout";

function inHoldoutGroup() {
  if (typeof window === "undefined") return false;
  try {
    let value = window.localStorage.getItem(HOLDOUT_KEY);
    if (!value) {
      value = Math.random() < 0.05 ? "1" : "0";
      window.localStorage.setItem(HOLDOUT_KEY, value);
    }
    return value === "1";
  } catch {
    return false;
  }
}

export function SponsoredPromoStrip({
  slot,
  title,
  eyebrow = "Sponsored",
  city,
  category,
  excludeCategory,
  excludeVendorSlugs,
  limit,
  className,
}: {
  slot: PromotionSlot;
  title?: string;
  eyebrow?: string;
  city?: string;
  category?: string;
  excludeCategory?: string;
  excludeVendorSlugs?: string[];
  limit?: number;
  className?: string;
}) {
  const [items, setItems] = useState<Promotion[]>([]);

  useEffect(() => {
    let cancelled = false;
    if (inHoldoutGroup()) {
      setItems([]);
      return;
    }
    void api.promotions
      .public({
        slot,
        city,
        category: category as never,
        excludeCategory: excludeCategory as never,
        excludeVendorSlugs: excludeVendorSlugs?.join(","),
        limit,
      })
      .then((rows) => {
        if (cancelled) return;
        setItems(rows);
        rows.forEach((row) => void api.promotions.impression(row.id, { slot }));
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [slot, city, category, excludeCategory, excludeVendorSlugs, limit]);

  if (!items.length) return null;

  return (
    <section className={className ?? "grid gap-4"}>
      {(title || eyebrow) && (
        <div>
          {eyebrow ? <p className="text-label tracking-eyebrow text-primary uppercase">{eyebrow}</p> : null}
          {title ? <h2 className="font-serif text-2xl font-medium tracking-tight">{title}</h2> : null}
        </div>
      )}
      <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:thin]">
        {items.map((promo, index) => {
          const href = promo.ctaHref || (promo.vendorSlug ? `/vendors/${promo.vendorSlug}` : "/vendors");
          return (
            <Link
              key={promo.id}
              href={href}
              onClick={() => void api.promotions.click(promo.id, { slot })}
              className="group relative w-64 shrink-0 overflow-hidden rounded-2xl border border-border bg-card shadow-card transition hover:border-primary/40 hover:shadow-raised"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                <SafeImg
                  src={promo.coverUrl}
                  fallbackIndex={index}
                  className="size-full object-cover transition group-hover:scale-105"
                />
                <div className="absolute top-2 left-2">
                  <Badge intent="info">{promo.effectiveBadge ?? "Sponsored"}</Badge>
                </div>
              </div>
              <div className="grid gap-1 p-3">
                <p className="truncate font-medium">{promo.headline}</p>
                {promo.subheadline ? (
                  <p className="line-clamp-2 text-xs text-muted-foreground">{promo.subheadline}</p>
                ) : null}
                {promo.ctaLabel ? <p className="text-xs font-medium text-primary">{promo.ctaLabel}</p> : null}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
