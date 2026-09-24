"use client";

import { useCallback, useEffect, useState } from "react";
import { Globe } from "lucide-react";
import { api } from "@ceylonweddings/web";
import {
  DEFAULT_SITE_BRANDING,
  DEFAULT_SITE_HOMEPAGE,
  type SiteBranding,
  type SiteHomepage,
  type VendorType,
} from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { Input } from "@ceylonweddings/ui/components/input";
import { Textarea } from "@ceylonweddings/ui/components/textarea";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { Link } from "../../../../../i18n/navigation";

export default function AdminSiteSettingsPage() {
  const [branding, setBranding] = useState<SiteBranding>(DEFAULT_SITE_BRANDING);
  const [homepage, setHomepage] = useState<SiteHomepage>(DEFAULT_SITE_HOMEPAGE);
  const [vendorTypes, setVendorTypes] = useState<VendorType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [config, types] = await Promise.all([
        api.admin.siteConfig(),
        api.admin.vendorTypes().catch(() => [] as VendorType[]),
      ]);
      setBranding(config.branding);
      setHomepage(config.homepage);
      setVendorTypes(types.filter((t) => t.status !== "ARCHIVED"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    return (
      <FormStatus tone="destructive">
        {error}. <Link href="/login">Sign in</Link>
      </FormStatus>
    );
  }

  return (
    <div className="grid gap-8">
      <PageHeader
        icon={Globe}
        kicker="Settings"
        title="Site & homepage"
        description="Branding, contact details, homepage sections, and SEO for the public marketing site."
        actions={
          <Button
            size="sm"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              setStatus(null);
              try {
                await api.admin.updateSiteConfig({ branding, homepage });
                setStatus("Saved");
                await load();
              } catch (err) {
                setStatus(err instanceof Error ? err.message : "Save failed");
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? "Saving…" : "Save site config"}
          </Button>
        }
      />
      {status ? <FormStatus>{status}</FormStatus> : null}

      <SectionCard title="Branding & contact" icon={Globe}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">Tagline</span>
            <Input
              value={branding.tagline}
              onChange={(e) => setBranding({ ...branding, tagline: e.target.value })}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">Logo URL</span>
            <Input
              value={branding.logoUrl ?? ""}
              onChange={(e) => setBranding({ ...branding, logoUrl: e.target.value || null })}
            />
          </label>
          <label className="grid gap-1 text-sm sm:col-span-2">
            <span className="text-muted-foreground">Footer blurb</span>
            <Textarea
              value={branding.footerBlurb}
              onChange={(e) => setBranding({ ...branding, footerBlurb: e.target.value })}
              rows={3}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">Contact email</span>
            <Input
              value={branding.contactEmail}
              onChange={(e) => setBranding({ ...branding, contactEmail: e.target.value })}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">Contact phone</span>
            <Input
              value={branding.contactPhone}
              onChange={(e) => setBranding({ ...branding, contactPhone: e.target.value })}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">WhatsApp</span>
            <Input
              value={branding.whatsapp}
              onChange={(e) => setBranding({ ...branding, whatsapp: e.target.value })}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">Instagram URL</span>
            <Input
              value={branding.socialInstagram ?? ""}
              onChange={(e) => setBranding({ ...branding, socialInstagram: e.target.value || null })}
            />
          </label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={branding.maintenanceBanner.enabled}
              onChange={(e) =>
                setBranding({
                  ...branding,
                  maintenanceBanner: { ...branding.maintenanceBanner, enabled: e.target.checked },
                })
              }
            />
            Show maintenance banner
          </label>
          <label className="grid gap-1 text-sm sm:col-span-2">
            <span className="text-muted-foreground">Maintenance message</span>
            <Input
              value={branding.maintenanceBanner.message}
              onChange={(e) =>
                setBranding({
                  ...branding,
                  maintenanceBanner: { ...branding.maintenanceBanner, message: e.target.value },
                })
              }
            />
          </label>
        </div>
      </SectionCard>

      <SectionCard title="Homepage hero" icon={Globe}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm sm:col-span-2">
            <span className="text-muted-foreground">Title</span>
            <Input
              value={homepage.hero.title}
              onChange={(e) => setHomepage({ ...homepage, hero: { ...homepage.hero, title: e.target.value } })}
            />
          </label>
          <label className="grid gap-1 text-sm sm:col-span-2">
            <span className="text-muted-foreground">Subtitle</span>
            <Input
              value={homepage.hero.subtitle}
              onChange={(e) =>
                setHomepage({ ...homepage, hero: { ...homepage.hero, subtitle: e.target.value } })
              }
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">Primary CTA label</span>
            <Input
              value={homepage.hero.ctaPrimaryLabel}
              onChange={(e) =>
                setHomepage({ ...homepage, hero: { ...homepage.hero, ctaPrimaryLabel: e.target.value } })
              }
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">Primary CTA href</span>
            <Input
              value={homepage.hero.ctaPrimaryHref}
              onChange={(e) =>
                setHomepage({ ...homepage, hero: { ...homepage.hero, ctaPrimaryHref: e.target.value } })
              }
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">Secondary CTA label</span>
            <Input
              value={homepage.hero.ctaSecondaryLabel}
              onChange={(e) =>
                setHomepage({ ...homepage, hero: { ...homepage.hero, ctaSecondaryLabel: e.target.value } })
              }
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">Secondary CTA href</span>
            <Input
              value={homepage.hero.ctaSecondaryHref}
              onChange={(e) =>
                setHomepage({ ...homepage, hero: { ...homepage.hero, ctaSecondaryHref: e.target.value } })
              }
            />
          </label>
          <label className="grid gap-1 text-sm sm:col-span-2">
            <span className="text-muted-foreground">Hero image URL</span>
            <Input
              value={homepage.hero.imageUrl}
              onChange={(e) =>
                setHomepage({ ...homepage, hero: { ...homepage.hero, imageUrl: e.target.value } })
              }
            />
          </label>
          <label className="grid gap-1 text-sm sm:col-span-2">
            <span className="text-muted-foreground">Chips (comma-separated)</span>
            <Input
              value={homepage.hero.chips.join(", ")}
              onChange={(e) =>
                setHomepage({
                  ...homepage,
                  hero: {
                    ...homepage.hero,
                    chips: e.target.value
                      .split(",")
                      .map((part) => part.trim())
                      .filter(Boolean),
                  },
                })
              }
            />
          </label>
        </div>
      </SectionCard>

      <SectionCard title="Stats" icon={Globe}>
        <div className="grid gap-3">
          {homepage.stats.map((stat, index) => (
            <div key={index} className="grid gap-2 sm:grid-cols-2">
              <Input
                value={stat.value}
                onChange={(e) => {
                  const stats = [...homepage.stats];
                  stats[index] = { ...stat, value: e.target.value };
                  setHomepage({ ...homepage, stats });
                }}
                placeholder="Value"
              />
              <Input
                value={stat.label}
                onChange={(e) => {
                  const stats = [...homepage.stats];
                  stats[index] = { ...stat, label: e.target.value };
                  setHomepage({ ...homepage, stats });
                }}
                placeholder="Label"
              />
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Category tiles" icon={Globe}>
        <div className="flex flex-wrap gap-2">
          {Array.from(
            new Set([
              ...vendorTypes.map((t) => t.slug),
              ...homepage.categoryKeys,
            ]),
          ).map((key) => {
            const selected = homepage.categoryKeys.includes(key);
            const label = vendorTypes.find((t) => t.slug === key)?.label.en ?? key;
            return (
              <Button
                key={key}
                size="sm"
                variant={selected ? "default" : "outline"}
                type="button"
                onClick={() => {
                  setHomepage({
                    ...homepage,
                    categoryKeys: selected
                      ? homepage.categoryKeys.filter((item) => item !== key)
                      : [...homepage.categoryKeys, key],
                  });
                }}
              >
                {label}
              </Button>
            );
          })}
          {vendorTypes.length === 0 && homepage.categoryKeys.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No vendor types loaded. Add types under Settings → Categories.
            </p>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard title="How it works" icon={Globe}>
        <div className="grid gap-4">
          {homepage.howItWorks.map((step, index) => (
            <div key={index} className="grid gap-2 rounded-lg border border-border/60 p-3">
              <Input
                value={step.title}
                onChange={(e) => {
                  const howItWorks = [...homepage.howItWorks];
                  howItWorks[index] = { ...step, title: e.target.value };
                  setHomepage({ ...homepage, howItWorks });
                }}
                placeholder="Title"
              />
              <Textarea
                value={step.body}
                onChange={(e) => {
                  const howItWorks = [...homepage.howItWorks];
                  howItWorks[index] = { ...step, body: e.target.value };
                  setHomepage({ ...homepage, howItWorks });
                }}
                rows={3}
              />
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="SEO" icon={Globe}>
        <div className="grid gap-3">
          <Input
            value={homepage.seo.title}
            onChange={(e) => setHomepage({ ...homepage, seo: { ...homepage.seo, title: e.target.value } })}
            placeholder="Title"
          />
          <Textarea
            value={homepage.seo.description}
            onChange={(e) =>
              setHomepage({ ...homepage, seo: { ...homepage.seo, description: e.target.value } })
            }
            rows={3}
          />
          <Input
            value={homepage.seo.ogImage}
            onChange={(e) => setHomepage({ ...homepage, seo: { ...homepage.seo, ogImage: e.target.value } })}
            placeholder="OG image URL"
          />
        </div>
      </SectionCard>
    </div>
  );
}
