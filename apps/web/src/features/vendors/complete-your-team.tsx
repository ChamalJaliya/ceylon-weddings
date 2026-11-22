"use client";

import { useEffect, useState } from "react";
import { api } from "@ceylonweddings/web";
import type { Promotion } from "@ceylonweddings/contracts";
import { Badge } from "@ceylonweddings/ui/components/badge";
import { Link } from "@/i18n/navigation";
import { SafeImg } from "@/components/safe-img";

export function CompleteYourTeam({
  vendorName,
  city,
  category,
}: {
  vendorName: string;
  city: string;
  category: string;
}) {
  const [items, setItems] = useState<Promotion[]>([]);

  useEffect(() => {
    let cancelled = false;
    void api.promotions
      .public({
        slot: "VENDOR_COMPLEMENTARY",
        city,
        excludeCategory: category as never,
      })
      .then((rows) => {
        if (cancelled) return;
        setItems(rows);
        rows.forEach((row) => void api.promotions.impression(row.id, { slot: "VENDOR_COMPLEMENTARY" }));
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [city, category]);

  if (!items.length) return null;

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-label tracking-eyebrow text-primary uppercase">Sponsored</p>
          <h2 className="font-serif text-2xl font-medium tracking-tight sm:text-3xl">
            Couples who booked {vendorName} also booked…
          </h2>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((promo, index) => {
          const href = promo.ctaHref || (promo.vendorSlug ? `/vendors/${promo.vendorSlug}` : "/vendors");
          return (
            <Link
              key={promo.id}
              href={href}
              onClick={() => void api.promotions.click(promo.id, { slot: "VENDOR_COMPLEMENTARY" })}
              className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-card transition hover:border-primary/40 hover:shadow-raised"
            >
              <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                <SafeImg
                  src={promo.coverUrl}
                  fallbackIndex={index}
                  className="size-full object-cover transition group-hover:scale-105"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-1.5">
                  <Badge intent="info">{promo.effectiveBadge ?? "Sponsored"}</Badge>
                </div>
                <p className="truncate font-medium">{promo.vendorName ?? promo.headline}</p>
                <p className="truncate text-xs text-muted-foreground">{promo.subheadline ?? promo.headline}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
