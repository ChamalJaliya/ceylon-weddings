"use client";

import { useEffect, useState } from "react";
import { api } from "@ceylonweddings/web";
import type { Promotion, PromotionSlot } from "@ceylonweddings/contracts";
import { PromotionCreative } from "@ceylonweddings/ui/domain/ads-studio";

export function PromotionSlotRail({
  slot,
  city,
  category,
  locale,
  limit = 3,
  className,
}: {
  slot: PromotionSlot;
  city?: string;
  category?: string;
  locale?: string;
  limit?: number;
  className?: string;
}) {
  const [items, setItems] = useState<Promotion[]>([]);
  const [adsEnabled, setAdsEnabled] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void api.site
      .flags()
      .then((flags) => {
        if (cancelled) return;
        const enabled = flags["ads.public"] !== false;
        setAdsEnabled(enabled);
        if (!enabled) {
          setItems([]);
          return undefined;
        }
        return api.promotions.public({
          slot,
          city,
          category: category as never,
          locale,
          limit,
        });
      })
      .then((rows) => {
        if (cancelled || !rows) return;
        setItems(rows);
        rows.forEach((row) => {
          void api.promotions.impression(row.id);
        });
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [slot, city, category, locale, limit]);

  if (!adsEnabled || items.length === 0) return null;

  return (
    <div className={className}>
      <div className="grid gap-4">
        {items.map((promo) => {
          const href = promo.ctaHref || (promo.vendorSlug ? `/vendors/${promo.vendorSlug}` : "/vendors");
          const isExternal = href.startsWith("http");
          return (
            <a
              key={promo.id}
              href={href}
              target={isExternal ? "_blank" : undefined}
              rel={isExternal ? "noreferrer" : undefined}
              onClick={() => void api.promotions.click(promo.id)}
              className="block"
            >
              <PromotionCreative
                promo={promo}
                light={promo.overlayTone === "light"}
                className="rounded-2xl transition hover:shadow-md"
                style={{ ["--promo-accent" as string]: promo.accentColor || "#7c2d12" }}
              />
            </a>
          );
        })}
      </div>
    </div>
  );
}
