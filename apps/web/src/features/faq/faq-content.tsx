"use client";

import { useMemo, useState } from "react";
import { CalendarHeart, ChevronDown, MessageCircle, Search, Sparkles } from "lucide-react";
import { Button } from "@ceylonweddings/ui/components/button";
import { Reveal } from "@ceylonweddings/ui/domain/motion";
import { cn } from "@ceylonweddings/ui/utils";
import { Link } from "@/i18n/navigation";

type Faq = { question: string; answer: string };
type Group = { title: string; items: Faq[] };

/** `## Group` headings, then `**Question?**\nAnswer` blocks. */
function parseFaq(body: string): Group[] {
  const groups: Group[] = [];
  for (const raw of body.split(/\n{2,}/)) {
    const block = raw.trim();
    if (!block) continue;
    if (block.startsWith("## ")) {
      groups.push({ title: block.slice(3).trim(), items: [] });
      continue;
    }
    const match = block.match(/^\*\*(.+?)\*\*\s*\n?([\s\S]*)$/);
    if (!match) continue;
    if (!groups.length) groups.push({ title: "General", items: [] });
    groups[groups.length - 1]!.items.push({ question: match[1]!.trim(), answer: match[2]!.trim() });
  }
  return groups.filter((group) => group.items.length);
}

function FaqItem({ item, open, onToggle, index }: { item: Faq; open: boolean; onToggle: () => void; index: number }) {
  return (
    <div
      className={cn(
        "rounded-3xl border bg-card shadow-card transition",
        open ? "border-primary/40 ring-1 ring-primary/10" : "border-border hover:border-primary/25",
      )}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex w-full items-center gap-4 px-5 py-5 text-left sm:px-7"
      >
        <span className="font-serif text-xl text-primary/40 tabular-nums">{String(index + 1).padStart(2, "0")}</span>
        <span className="flex-1 font-serif text-xl leading-snug tracking-tight sm:text-2xl">{item.question}</span>
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-full border transition",
            open ? "rotate-180 border-primary bg-primary text-primary-foreground" : "border-border",
          )}
        >
          <ChevronDown className="size-4" aria-hidden />
        </span>
      </button>
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <p className="px-5 pb-6 leading-relaxed whitespace-pre-line text-muted-foreground sm:px-7 sm:pl-[4.75rem]">
            {item.answer}
          </p>
        </div>
      </div>
    </div>
  );
}

export function FaqContent({ title, excerpt, body }: { title: string; excerpt: string | null; body: string }) {
  const groups = useMemo(() => parseFaq(body), [body]);
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(groups[0]?.items[0]?.question ?? null);

  const q = query.trim().toLowerCase();
  const visible = groups
    .filter((group) => tab === "all" || group.title === tab)
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !q || item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q),
      ),
    }))
    .filter((group) => group.items.length);
  const total = groups.reduce((sum, group) => sum + group.items.length, 0);

  return (
    <div className="grid min-w-0 grid-cols-1 gap-12 pb-10 sm:gap-16">
      <section className="cw-hero-soft relative isolate overflow-hidden rounded-3xl px-6 py-16 text-center sm:px-12 sm:py-24">
        <div className="absolute -top-20 left-1/4 -z-10 size-72 rounded-full bg-love/20 blur-3xl" />
        <Reveal className="mx-auto grid max-w-2xl justify-items-center gap-5">
          <p className="inline-flex items-center gap-2 text-label font-medium tracking-eyebrow text-primary uppercase">
            <Sparkles className="size-3.5" aria-hidden />
            Help centre
          </p>
          <h1 className="font-serif text-4xl font-medium tracking-tight text-balance sm:text-6xl">{title}</h1>
          {excerpt ? <p className="text-base text-paper/80 sm:text-h4">{excerpt}</p> : null}
          <label className="relative mt-3 w-full max-w-lg">
            <Search className="pointer-events-none absolute top-1/2 left-5 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${total} answers…`}
              aria-label="Search questions"
              className="h-14 w-full rounded-full border border-border bg-card pr-5 pl-12 text-base text-foreground shadow-dock outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40"
            />
          </label>
        </Reveal>
      </section>

      <div className="mx-auto grid w-full max-w-3xl gap-8">
        {groups.length > 1 ? (
          <div className="flex justify-center">
            <div className="inline-flex rounded-full border border-border bg-muted/60 p-1">
              {[{ title: "all" }, ...groups].map((group) => (
                <button
                  key={group.title}
                  type="button"
                  onClick={() => setTab(group.title)}
                  className={cn(
                    "rounded-full px-5 py-2 text-sm transition",
                    tab === group.title
                      ? "bg-card font-medium text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {group.title === "all" ? "All" : `For ${group.title.toLowerCase()}`}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {visible.map((group) => (
          <section key={group.title} className="grid gap-3">
            {tab === "all" && groups.length > 1 ? (
              <p className="inline-flex items-center gap-2 px-2 text-label font-medium tracking-eyebrow text-primary uppercase">
                <span className="h-px w-8 bg-primary/50" />
                {group.title}
              </p>
            ) : null}
            {group.items.map((item, index) => (
              <FaqItem
                key={item.question}
                item={item}
                index={index}
                open={open === item.question || Boolean(q)}
                onToggle={() => setOpen(open === item.question ? null : item.question)}
              />
            ))}
          </section>
        ))}

        {!visible.length ? (
          <div className="grid justify-items-center gap-3 rounded-3xl border border-dashed border-border px-6 py-12 text-center">
            <p className="font-serif text-2xl">No answers for “{query}”</p>
            <p className="text-sm text-muted-foreground">Try another word, or ask us directly.</p>
            <Button variant="outline" shape="pill" onClick={() => setQuery("")}>
              Clear search
            </Button>
          </div>
        ) : null}
      </div>

      <section className="mx-auto grid w-full max-w-5xl gap-4 sm:grid-cols-2">
        <Link
          href="/contact"
          className="group grid content-start gap-3 rounded-3xl bg-ink p-7 text-paper transition hover:-translate-y-0.5 sm:p-9"
        >
          <MessageCircle className="size-7 text-paper/70" aria-hidden />
          <p className="font-serif text-3xl">Still have questions?</p>
          <p className="text-sm text-paper/75">Message the Ceylon Weddings team — we usually reply within a day.</p>
          <span className="mt-2 text-sm font-medium underline-offset-4 group-hover:underline">Contact us →</span>
        </Link>
        <Link
          href="/consultation"
          className="group grid content-start gap-3 rounded-3xl border border-border bg-card p-7 shadow-card transition hover:-translate-y-0.5 hover:border-primary/40 sm:p-9"
        >
          <CalendarHeart className="size-7 text-primary" aria-hidden />
          <p className="font-serif text-3xl">Talk to a planner</p>
          <p className="text-sm text-muted-foreground">Book a free 20-minute consultation to map out your wedding.</p>
          <span className="mt-2 text-sm font-medium text-primary underline-offset-4 group-hover:underline">
            Book a free call →
          </span>
        </Link>
      </section>
    </div>
  );
}
