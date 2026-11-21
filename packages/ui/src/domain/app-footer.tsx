import type { ElementType, ReactNode } from "react";
import { cn } from "../lib/utils";
import { BrandLockup } from "./brand-mark";

export type FooterLinkSection = {
  title: string;
  links: Array<{
    href: string;
    label: string;
    badge?: string;
  }>;
};

export function AppFooter({
  wordmark,
  kicker,
  tagline,
  description,
  sections,
  links,
  meta,
  linkComponent: LinkComponent = "a",
  className,
}: {
  wordmark: string;
  kicker?: string;
  tagline?: string;
  description?: string;
  sections?: FooterLinkSection[];
  links?: ReactNode;
  meta?: ReactNode;
  linkComponent?: ElementType;
  className?: string;
}) {
  return (
    <footer
      data-slot="app-footer"
      className={cn("mt-auto border-t border-border/80 bg-card/60 backdrop-blur-sm", className)}
    >
      {sections?.length ? (
        <div className="mx-auto w-full max-w-6xl px-6 py-12 lg:py-16">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-6 lg:gap-8">
            {/* Brand column */}
            <div className="flex flex-col justify-between space-y-4 sm:col-span-2 lg:col-span-2">
              <div className="space-y-3">
                <BrandLockup name={typeof wordmark === "string" ? wordmark : undefined} />

                {tagline ? <p className="font-serif text-sm italic text-foreground/80">{tagline}</p> : null}

                {description ? (
                  <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">{description}</p>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-label font-medium text-secondary-foreground">
                  📍 All Island Coverage
                </span>
                <span>Poruwa · Church · Nikah · Walima</span>
              </div>
            </div>

            {/* Structured link columns */}
            {sections.map((section) => (
              <div key={section.title} className="flex flex-col gap-3 lg:col-span-1">
                <p className="text-xs font-medium tracking-wider text-foreground uppercase">{section.title}</p>
                <ul className="flex flex-col gap-2.5 text-xs">
                  {section.links.map((link) => (
                    <li key={link.href + link.label}>
                      <LinkComponent
                        href={link.href}
                        className="inline-flex items-center gap-1.5 text-muted-foreground transition-all duration-150 hover:text-primary hover:translate-x-0.5"
                      >
                        <span>{link.label}</span>
                        {link.badge ? (
                          <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-label font-medium text-primary">
                            {link.badge}
                          </span>
                        ) : null}
                      </LinkComponent>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-border/60 pt-6 text-xs text-muted-foreground">
            <div>
              {meta ?? (
                <p>
                  © {new Date().getFullYear()} {wordmark}. All rights reserved.
                </p>
              )}
            </div>
            {links ? <nav className="flex flex-wrap items-center gap-4 text-xs">{links}</nav> : null}
          </div>
        </div>
      ) : (
        /* Legacy / Simple footer view */
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-8 py-6">
          <div>
            {kicker ? <p className="text-label tracking-eyebrow text-muted-foreground uppercase">{kicker}</p> : null}
            <p className="font-serif text-lg leading-tight text-foreground">{wordmark}</p>
          </div>
          {links ? (
            <nav className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">{links}</nav>
          ) : null}
          {meta ? <p className="text-xs text-muted-foreground">{meta}</p> : null}
        </div>
      )}
    </footer>
  );
}
