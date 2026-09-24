import {
  DEFAULT_CONSULTATION_SETTINGS,
  DEFAULT_SITE_BRANDING,
  DEFAULT_SITE_HOMEPAGE,
  type CmsPage,
  type ConsultationAvailability,
  type PublicFlags,
  type PublicSiteConfig,
} from "@ceylonweddings/contracts";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function fetchPublicSiteConfig(): Promise<PublicSiteConfig> {
  try {
    const response = await fetch(`${apiUrl}/public/site-config`, { next: { revalidate: 30 } });
    if (!response.ok) throw new Error("site-config failed");
    return (await response.json()) as PublicSiteConfig;
  } catch {
    return { branding: DEFAULT_SITE_BRANDING, homepage: DEFAULT_SITE_HOMEPAGE };
  }
}

export async function fetchPublicFlags(): Promise<PublicFlags> {
  try {
    const response = await fetch(`${apiUrl}/public/flags`, { next: { revalidate: 15 } });
    if (!response.ok) throw new Error("flags failed");
    return (await response.json()) as PublicFlags;
  } catch {
    return {
      "reviews.enabled": true,
      "awards.public": true,
      "ideas.public": true,
      "ads.public": true,
      "consultations.public": true,
      "site.maintenance": false,
    };
  }
}

export async function fetchConsultationAvailability(days = 14): Promise<ConsultationAvailability> {
  try {
    // Slots change as people book, so this is never cached.
    const response = await fetch(`${apiUrl}/public/consultations/availability?days=${days}`, {
      cache: "no-store",
    });
    if (!response.ok) throw new Error("availability failed");
    return (await response.json()) as ConsultationAvailability;
  } catch {
    const settings = DEFAULT_CONSULTATION_SETTINGS;
    return {
      enabled: false,
      timezone: settings.timezone,
      slotMinutes: settings.slotMinutes,
      leadTimeHours: settings.leadTimeHours,
      horizonDays: settings.horizonDays,
      modes: settings.modes,
      intro: settings.intro,
      days: [],
    };
  }
}

export async function fetchPublicCmsPage(slug: string): Promise<CmsPage | null> {
  try {
    const response = await fetch(`${apiUrl}/public/pages/${encodeURIComponent(slug)}`, {
      next: { revalidate: 30 },
    });
    if (!response.ok) return null;
    return (await response.json()) as CmsPage;
  } catch {
    return null;
  }
}

/** Minimal markdown-ish renderer for CMS bodies (headings + paragraphs + bold). */
export function renderCmsBody(body: string) {
  const blocks = body.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
  return blocks.map((block, index) => {
    if (block.startsWith("### ")) {
      return (
        <h3 key={index} className="font-serif text-xl font-semibold tracking-tight text-foreground">
          {inlineFormat(block.slice(4))}
        </h3>
      );
    }
    if (block.startsWith("## ")) {
      return (
        <h2 key={index} className="font-serif text-2xl font-semibold tracking-tight text-foreground">
          {inlineFormat(block.slice(3))}
        </h2>
      );
    }
    return (
      <p key={index} className="text-muted-foreground leading-relaxed whitespace-pre-line">
        {inlineFormat(block)}
      </p>
    );
  });
}

function inlineFormat(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-medium text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={index}>{part}</span>;
  });
}
