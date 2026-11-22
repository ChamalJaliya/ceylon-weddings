"use client";

import { useEffect, useState } from "react";
import { api } from "@ceylonweddings/web";
import type { Promotion, PromotionSlot, PublicPromotionSlotConfig } from "@ceylonweddings/contracts";
import { PromotionCreative } from "@ceylonweddings/ui/domain/ads-studio";

export function PromotionSlotRail({
  slot,
  city,
  category,
  locale,
  excludeCategory,
  limit,
  className,
  layout,
}: {
  slot: PromotionSlot;
  city?: string;
  category?: string;
  locale?: string;
  excludeCategory?: string;
  limit?: number;
  className?: string;
  /** Force a creative layout (e.g. a slim STRIP) regardless of what the promo was booked as. */
  layout?: Promotion["layout"];
}) {
  const [items, setItems] = useState<Promotion[]>([]);
  const [adsEnabled, setAdsEnabled] = useState(true);
  const [slotConfig, setSlotConfig] = useState<PublicPromotionSlotConfig | null>(null);

  useEffect(() => {
    let cancelled = false;
    try {
      if (typeof window !== "undefined") {
        let holdout = window.localStorage.getItem("cw_ads_holdout");
        if (!holdout) {
          holdout = Math.random() < 0.05 ? "1" : "0";
          window.localStorage.setItem("cw_ads_holdout", holdout);
        }
        if (holdout === "1") {
          setAdsEnabled(false);
          setItems([]);
          return;
        }
      }
    } catch {
      /* ignore */
    }
    void Promise.all([api.site.flags(), api.promotions.publicSlots()])
      .then(([flags, slots]) => {
        if (cancelled) return;
        const enabled = flags["ads.public"] !== false;
        setAdsEnabled(enabled);
        const config = slots.find((row) => row.slot === slot) ?? null;
        setSlotConfig(config);
        if (!enabled || !config?.enabled) {
          setItems([]);
          return undefined;
        }
        return api.promotions.public({
          slot,
          city,
          category: category as never,
          locale,
          excludeCategory: excludeCategory as never,
          limit: limit ?? config.maxPerRequest,
        });
      })
      .then((rows) => {
        if (cancelled || !rows) return;
        setItems(rows);
        rows.forEach((row) => {
          void api.promotions.impression(row.id, { slot });
        });
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [slot, city, category, locale, excludeCategory, limit]);

  if (!adsEnabled || !slotConfig?.enabled || items.length === 0) return null;

  // Portrait tiles/cards sit in the same grid as vendor cards; wide layouts stack full-width.
  const tileLayouts = ["PICKS_TILE", "CARD"];
  const resolved = layout ?? slotConfig.defaultLayout;
  const asTiles = resolved ? tileLayouts.includes(resolved) : false;

  return (
    <div className={className}>
      <div className={asTiles ? "grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3" : "grid gap-4"}>
        {items.map((promo) => {
          const href = promo.ctaHref || (promo.vendorSlug ? `/vendors/${promo.vendorSlug}` : "/vendors");
          const isExternal = href.startsWith("http");
          const effectiveLayout = layout ?? promo.effectiveLayout ?? slotConfig.defaultLayout ?? promo.layout;
          return (
            <a
              key={promo.id}
              href={href}
              target={isExternal ? "_blank" : undefined}
              rel={isExternal ? "noreferrer" : undefined}
              onClick={() => void api.promotions.click(promo.id, { slot })}
              className="block"
            >
              <PromotionCreative
                promo={{ ...promo, layout: effectiveLayout }}
                badgeOverride={promo.effectiveBadge}
                light={promo.overlayTone === "light"}
                className="rounded-2xl transition hover:shadow-md"
                style={{ ["--promo-accent" as string]: promo.accentColor || "var(--color-primary)" }}
              />
            </a>
          );
        })}
      </div>
    </div>
  );
}
