"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, CalendarDays, FileText, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@ceylonweddings/ui/components/button";
import { Reveal } from "@ceylonweddings/ui/domain/motion";
import { cn } from "@ceylonweddings/ui/utils";
import { Link } from "@/i18n/navigation";

export type LegalSection = { id: string; title: string; paragraphs: string[] };

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/^\d+[.)]\s*/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** `## Heading\ntext` blocks become sections; text before the first heading is an intro. */
export function parseLegalBody(body: string): { intro: string[]; sections: LegalSection[] } {
  const intro: string[] = [];
  const sections: LegalSection[] = [];
  for (const raw of body.split(/\n{2,}/)) {
    const block = raw.trim();
    if (!block) continue;
    if (block.startsWith("## ") || block.startsWith("### ")) {
      const [first, ...rest] = block.replace(/^#{2,3}\s+/, "").split("\n");
      const title = first!.trim();
      sections.push({
        id: slugify(title) || `section-${sections.length + 1}`,
        title: title.replace(/^\d+[.)]\s*/, ""),
        paragraphs: rest.join("\n").trim() ? [rest.join("\n").trim()] : [],
      });
    } else if (sections.length) {
      sections[sections.length - 1]!.paragraphs.push(block);
    } else {
      intro.push(block);
    }
  }
  return { intro, sections };
}

function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={index} className="font-medium text-foreground">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}

export function LegalDocument({
  kind,
  title,
  excerpt,
  body,
  updatedAt,
}: {
  kind: "terms" | "privacy";
  title: string;
  excerpt: string | null;
  body: string;
  updatedAt: string;
}) {
  const { intro, sections } = parseLegalBody(body);
  const [active, setActive] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -65% 0px" },
    );
    sections.forEach((section) => {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [body]);

  const updated = new Date(updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const other =
    kind === "terms"
      ? { href: "/privacy", label: "Privacy policy", icon: ShieldCheck }
      : { href: "/terms", label: "Terms of service", icon: FileText };
  const KindIcon = kind === "terms" ? FileText : ShieldCheck;

  return (
    <div className="grid min-w-0 grid-cols-1 gap-12 pb-10 sm:gap-16">
      <section className="relative isolate overflow-hidden rounded-3xl border border-border bg-card px-6 py-14 shadow-card sm:px-12 sm:py-20">
        <div className="absolute -top-24 -right-24 -z-10 size-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 -z-10 size-72 rounded-full bg-love/10 blur-3xl" />
        <Reveal className="grid max-w-3xl gap-5">
          <p className="inline-flex items-center gap-2 text-label font-medium tracking-eyebrow text-primary uppercase">
            <span className="h-px w-8 bg-primary/50" />
            Legal
          </p>
          <div className="flex items-start gap-4">
            <span className="mt-2 hidden size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary sm:grid">
              <KindIcon className="size-6" aria-hidden />
            </span>
            <h1 className="font-serif text-4xl font-medium tracking-tight text-balance sm:text-6xl">{title}</h1>
          </div>
          {excerpt ? (
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-h4">{excerpt}</p>
          ) : null}
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/70 px-3 py-1">
              <CalendarDays className="size-3.5" aria-hidden />
              Last updated {updated}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/70 px-3 py-1">
              {sections.length} sections · {Math.max(1, Math.round(body.split(/\s+/).length / 200))} min read
            </span>
          </div>
        </Reveal>
      </section>

      <div className="grid items-start gap-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-14">
        <nav aria-label="On this page" className="lg:sticky lg:top-28">
          <p className="mb-3 text-label font-medium tracking-eyebrow text-muted-foreground uppercase">On this page</p>
          <ol className="-mx-1 flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none] lg:mx-0 lg:grid lg:overflow-visible">
            {sections.map((section, index) => (
              <li key={section.id} className="shrink-0">
                <a
                  href={`#${section.id}`}
                  className={cn(
                    "flex items-center gap-3 rounded-full px-3 py-2 text-sm transition lg:rounded-xl",
                    active === section.id
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                  )}
                >
                  <span className="text-xs tabular-nums opacity-70">{String(index + 1).padStart(2, "0")}</span>
                  <span className="whitespace-nowrap lg:whitespace-normal">{section.title}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="grid min-w-0 gap-4">
          {intro.length ? (
            <div className="grid gap-4 text-base leading-relaxed text-muted-foreground sm:text-h4">
              {intro.map((paragraph) => (
                <p key={paragraph}>
                  <Rich text={paragraph} />
                </p>
              ))}
            </div>
          ) : null}
          {sections.map((section, index) => (
            <section
              key={section.id}
              id={section.id}
              className="scroll-mt-28 rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8"
            >
              <div className="flex items-baseline gap-4">
                <span className="font-serif text-3xl text-primary/40 tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h2 className="font-serif text-2xl font-medium tracking-tight sm:text-3xl">{section.title}</h2>
              </div>
              <div className="mt-4 grid gap-3 leading-relaxed text-muted-foreground sm:pl-12">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="whitespace-pre-line">
                    <Rich text={paragraph} />
                  </p>
                ))}
              </div>
            </section>
          ))}

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="grid content-start gap-3 rounded-3xl bg-ink p-6 text-paper sm:p-8">
              <Mail className="size-6 text-paper/70" aria-hidden />
              <p className="font-serif text-2xl">Questions about this?</p>
              <p className="text-sm text-paper/75">Our team in Colombo usually replies within a day.</p>
              <Button asChild shape="pill" className="mt-2 w-fit">
                <Link href="/contact">Contact us</Link>
              </Button>
            </div>
            <Link
              href={other.href}
              className="group grid content-start gap-3 rounded-3xl border border-border bg-card p-6 shadow-card transition hover:-translate-y-0.5 hover:border-primary/40 sm:p-8"
            >
              <div className="flex items-start justify-between">
                <other.icon className="size-6 text-primary" aria-hidden />
                <ArrowUpRight
                  className="size-4 text-muted-foreground transition group-hover:text-primary"
                  aria-hidden
                />
              </div>
              <p className="font-serif text-2xl">{other.label}</p>
              <p className="text-sm text-muted-foreground">Read how the rest of our policies work.</p>
            </Link>
          </div>
        </article>
      </div>
    </div>
  );
}
