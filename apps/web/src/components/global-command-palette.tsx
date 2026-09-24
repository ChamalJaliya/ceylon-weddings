"use client";

import {
  useEffect,
  useMemo,
  useState,
  useCallback,
  createContext,
  useContext,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import {
  Search,
  MapPin,
  Calendar,
  Users,
  CheckSquare,
  DollarSign,
  Store,
  Shield,
  ArrowRight,
  Sparkles,
  Camera,
  Flower2,
  UtensilsCrossed,
  Music,
  Heart,
  FileText,
  Settings,
  Briefcase,
  Home,
  ChevronRight,
  Inbox,
  UserRound,
  Lightbulb,
  Megaphone,
  type LucideIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@ceylonweddings/ui/components/dialog";
import { Badge } from "@ceylonweddings/ui/components/badge";
import { AnimateIcon, Icon } from "@ceylonweddings/ui/components/icon";
import { api } from "@ceylonweddings/web";
import type { SearchHit, SearchHitKind } from "@ceylonweddings/contracts";
import { useRouter } from "../i18n/navigation";
import { CATEGORY_LABELS } from "../lib/labels";

export type SearchAudience = "planning" | "pro" | "admin";

type NavCommand = {
  id: string;
  category: string;
  label: string;
  sublabel?: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  audiences: SearchAudience[];
};

type ResultRow = {
  id: string;
  category: string;
  label: string;
  sublabel?: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  live?: boolean;
};

const KIND_META: Record<SearchHitKind, { category: string; icon: LucideIcon }> = {
  vendor: { category: "Vendors", icon: Store },
  guest: { category: "Guests", icon: Users },
  task: { category: "Tasks", icon: CheckSquare },
  lead: { category: "Leads", icon: Inbox },
  user: { category: "Users", icon: UserRound },
  wedding: { category: "Weddings", icon: Heart },
  article: { category: "Ideas", icon: Lightbulb },
};

const NAV_COMMANDS: NavCommand[] = [
  { id: "nav-home", category: "Marketplace", label: "Home", href: "/", icon: Home, audiences: ["planning", "pro", "admin"] },
  { id: "nav-vendors", category: "Marketplace", label: "Vendor catalog", sublabel: "Browse verified vendors", href: "/vendors", icon: Store, badge: "Catalog", audiences: ["planning", "pro", "admin"] },
  { id: "cat-venues", category: "Marketplace", label: "Venues", href: "/vendors?category=VENUE", icon: MapPin, audiences: ["planning", "pro"] },
  { id: "cat-photo", category: "Marketplace", label: "Photo & video", href: "/vendors?category=PHOTO_VIDEO", icon: Camera, audiences: ["planning", "pro"] },
  { id: "cat-florist", category: "Marketplace", label: "Florists & decor", href: "/vendors?category=FLORIST_DECOR", icon: Flower2, audiences: ["planning"] },
  { id: "cat-caterer", category: "Marketplace", label: "Catering", href: "/vendors?category=CATERER", icon: UtensilsCrossed, audiences: ["planning"] },
  { id: "cat-poruwa", category: "Marketplace", label: "Poruwa specialists", href: "/vendors?category=PORUWA", icon: Sparkles, audiences: ["planning"] },
  { id: "cat-music", category: "Marketplace", label: "Bands & DJs", href: "/vendors?category=ENTERTAINMENT", icon: Music, audiences: ["planning"] },
  { id: "nav-compare", category: "Marketplace", label: "Compare vendors", href: "/vendors/compare", icon: ArrowRight, audiences: ["planning"] },
  { id: "nav-ideas", category: "Marketplace", label: "Ideas & articles", href: "/ideas", icon: Lightbulb, audiences: ["planning", "pro"] },

  { id: "plan-dash", category: "Planning", label: "Planning dashboard", href: "/planning", icon: Heart, badge: "Hub", audiences: ["planning"] },
  { id: "plan-studio", category: "Planning", label: "Wedding studio", href: "/planning/studio", icon: Sparkles, audiences: ["planning"] },
  { id: "plan-checklist", category: "Planning", label: "Checklist", sublabel: "Tasks & milestones", href: "/planning/checklist", icon: CheckSquare, audiences: ["planning"] },
  { id: "plan-budget", category: "Planning", label: "Budget", href: "/planning/budget", icon: DollarSign, audiences: ["planning"] },
  { id: "plan-guests", category: "Planning", label: "Guests & RSVPs", href: "/planning/guests", icon: Users, audiences: ["planning"] },
  { id: "plan-seating", category: "Planning", label: "Seating chart", href: "/planning/seating", icon: Users, audiences: ["planning"] },
  { id: "plan-calendar", category: "Planning", label: "Calendar", href: "/planning/calendar", icon: Calendar, audiences: ["planning"] },
  { id: "plan-agenda", category: "Planning", label: "Day agenda", href: "/planning/agenda", icon: Calendar, audiences: ["planning"] },
  { id: "plan-music", category: "Planning", label: "Music planner", sublabel: "Cues, must-plays, vendor brief", href: "/planning/music", icon: Music, audiences: ["planning"] },
  { id: "plan-moodboard", category: "Planning", label: "Moodboard", sublabel: "Drawing pad, photos, vendor share", href: "/planning/moodboard", icon: Sparkles, audiences: ["planning"] },
  { id: "plan-team", category: "Planning", label: "My vendors", href: "/planning/team", icon: Store, audiences: ["planning"] },
  { id: "plan-website", category: "Planning", label: "Wedding website", href: "/planning/website", icon: FileText, audiences: ["planning"] },
  { id: "plan-family", category: "Planning", label: "Family access", href: "/planning/family", icon: Users, audiences: ["planning"] },
  { id: "plan-profile", category: "Planning", label: "Wedding profile", href: "/planning/profile", icon: Settings, audiences: ["planning"] },

  { id: "pro-dash", category: "Vendor Pro", label: "Vendor portal", href: "/pro", icon: Briefcase, badge: "Pro", audiences: ["pro"] },
  { id: "pro-storefront", category: "Vendor Pro", label: "Storefront", href: "/pro/storefront", icon: Store, audiences: ["pro"] },
  { id: "pro-leads", category: "Vendor Pro", label: "Leads & inquiries", href: "/pro/leads", icon: Inbox, audiences: ["pro"] },
  { id: "pro-promote", category: "Vendor Pro", label: "Promote", href: "/pro/promote", icon: Megaphone, audiences: ["pro"] },

  { id: "admin-dash", category: "Admin", label: "Ops dashboard", href: "/admin", icon: Shield, badge: "Admin", audiences: ["admin"] },
  { id: "admin-vendors", category: "Admin", label: "Vendors", href: "/admin/vendors", icon: Store, audiences: ["admin"] },
  { id: "admin-verify", category: "Admin", label: "Verify queue", href: "/admin/queues/verify", icon: Shield, audiences: ["admin"] },
  { id: "admin-picks", category: "Admin", label: "Ceylon Picks queue", href: "/admin/queues/picks", icon: Sparkles, audiences: ["admin"] },
  { id: "admin-reports", category: "Admin", label: "Reports queue", href: "/admin/queues/reports", icon: Shield, audiences: ["admin"] },
  { id: "admin-users", category: "Admin", label: "Users", href: "/admin/users", icon: Users, audiences: ["admin"] },
  { id: "admin-weddings", category: "Admin", label: "Weddings", href: "/admin/weddings", icon: Heart, audiences: ["admin"] },
  { id: "admin-inquiries", category: "Admin", label: "Inquiries", href: "/admin/inquiries", icon: Inbox, audiences: ["admin"] },
  { id: "admin-content", category: "Admin", label: "Content / Ideas", href: "/admin/content", icon: FileText, audiences: ["admin"] },
  { id: "admin-reviews", category: "Admin", label: "Reviews", href: "/admin/reviews", icon: Sparkles, audiences: ["admin"] },
  { id: "admin-ads", category: "Admin", label: "Ads studio", href: "/admin/ads", icon: Megaphone, audiences: ["admin"] },
  { id: "admin-featured", category: "Admin", label: "Featured inventory", href: "/admin/featured", icon: Store, audiences: ["admin"] },
  { id: "admin-audit", category: "Admin", label: "Audit trail", href: "/admin/audit", icon: FileText, audiences: ["admin"] },
  { id: "admin-settings", category: "Admin", label: "Settings", href: "/admin/settings", icon: Settings, audiences: ["admin"] },
];

const PLACEHOLDERS: Record<SearchAudience, string> = {
  planning: "Search vendors, guests, tasks, pages…",
  pro: "Search leads, vendors, pages…",
  admin: "Search vendors, users, weddings, pages…",
};

function hitToRow(hit: SearchHit): ResultRow {
  const meta = KIND_META[hit.kind];
  const subtitle =
    hit.kind === "vendor" && hit.subtitle
      ? hit.subtitle
          .split(" · ")
          .map((part, index) => (index === 0 ? (CATEGORY_LABELS[part] ?? part) : part))
          .join(" · ")
      : hit.subtitle ?? undefined;

  return {
    id: hit.id,
    category: meta.category,
    label: hit.title,
    sublabel: subtitle,
    href: hit.href,
    icon: meta.icon,
    badge: hit.badge ?? undefined,
    live: true,
  };
}

type CommandPaletteContextType = {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
};

const CommandPaletteContext = createContext<CommandPaletteContextType>({
  open: false,
  setOpen: () => {},
  toggle: () => {},
});

export function useCommandPalette() {
  return useContext(CommandPaletteContext);
}

export function CommandPaletteProvider({
  audience,
  children,
}: {
  audience: SearchAudience;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((prev) => !prev), []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      } else if (
        event.key === "/" &&
        !["INPUT", "TEXTAREA", "SELECT"].includes((event.target as HTMLElement)?.tagName)
      ) {
        event.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <CommandPaletteContext.Provider value={{ open, setOpen, toggle }}>
      {children}
      <GlobalCommandPalette open={open} onOpenChange={setOpen} audience={audience} />
    </CommandPaletteContext.Provider>
  );
}

function GlobalCommandPalette({
  open,
  onOpenChange,
  audience,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  audience: SearchAudience;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [liveHits, setLiveHits] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const navCommands = useMemo(
    () => NAV_COMMANDS.filter((item) => item.audiences.includes(audience)),
    [audience],
  );

  useEffect(() => {
    if (!open) {
      setQuery("");
      setLiveHits([]);
      setActiveIndex(0);
      setLoading(false);
    }
  }, [open]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setLiveHits([]);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = await api.search({ q, limit: 6 });
        if (active) setLiveHits(data.items.map(hitToRow));
      } catch {
        if (active) setLiveHits([]);
      } finally {
        if (active) setLoading(false);
      }
    }, 180);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  const filteredNav = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return navCommands;
    return navCommands.filter(
      (item) =>
        item.label.toLowerCase().includes(needle) ||
        item.sublabel?.toLowerCase().includes(needle) ||
        item.category.toLowerCase().includes(needle),
    );
  }, [query, navCommands]);

  const results = useMemo<ResultRow[]>(() => {
    const navRows: ResultRow[] = filteredNav.map((item) => ({
      id: item.id,
      category: item.category,
      label: item.label,
      sublabel: item.sublabel,
      href: item.href,
      icon: item.icon,
      badge: item.badge,
    }));
    return [...liveHits, ...navRows];
  }, [filteredNav, liveHits]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, liveHits.length, filteredNav.length]);

  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>(`[data-search-index="${activeIndex}"]`);
    node?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const handleSelect = useCallback(
    (href: string) => {
      onOpenChange(false);
      setQuery("");
      router.push(href);
    },
    [onOpenChange, router],
  );

  const onKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, Math.max(results.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const item = results[activeIndex];
      if (item) handleSelect(item.href);
    }
  };

  const grouped = useMemo(() => {
    const map = new Map<string, ResultRow[]>();
    for (const item of results) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return [...map.entries()];
  }, [results]);

  let flatIndex = -1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="gap-0 overflow-hidden rounded-2xl border-border bg-card p-0 shadow-2xl sm:max-w-xl"
        showClose={false}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Search</DialogTitle>
          <DialogDescription>{PLACEHOLDERS[audience]}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3 border-b border-border bg-muted/30 px-4 py-3.5">
          <Search className="size-5 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={PLACEHOLDERS[audience]}
            className="w-full bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none"
            aria-autocomplete="list"
            aria-controls="cw-search-results"
          />
          <kbd className="hidden items-center rounded border border-border/80 bg-background px-2 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground sm:inline-flex">
            ESC
          </kbd>
        </div>

        <div id="cw-search-results" ref={listRef} className="max-h-[22rem] overflow-y-auto p-2" role="listbox">
          {loading ? (
            <div className="animate-pulse px-3 py-2 text-xs text-muted-foreground">Searching…</div>
          ) : null}

          {results.length === 0 && !loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {query.trim()
                ? `No results for “${query.trim()}”`
                : "Type to search, or pick a page below."}
            </div>
          ) : (
            <div className="grid gap-3">
              {grouped.map(([category, items]) => (
                <div key={category} className="grid gap-1">
                  <p className="px-3 pt-1 text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                    {category}
                  </p>
                  {items.map((item) => {
                    flatIndex += 1;
                    const index = flatIndex;
                    const active = index === activeIndex;
                    return (
                      <AnimateIcon key={item.id} animateOnHover asChild>
                      <button
                        type="button"
                        role="option"
                        aria-selected={active}
                        data-search-index={index}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => handleSelect(item.href)}
                        className={`group flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                          active ? "bg-accent" : "hover:bg-accent/80"
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className={`flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                              active
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                            }`}
                          >
                            <Icon icon={item.icon} size="sm" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">{item.label}</p>
                            {item.sublabel ? (
                              <p className="truncate text-xs text-muted-foreground">{item.sublabel}</p>
                            ) : null}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {item.badge ? (
                            <Badge
                              intent={
                                audience === "admin"
                                  ? "warning"
                                  : audience === "pro"
                                    ? "info"
                                    : "default"
                              }
                            >
                              {item.badge}
                            </Badge>
                          ) : item.live ? (
                            <span className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                              Live
                            </span>
                          ) : null}
                          <Icon
                            icon={ChevronRight}
                            size="sm"
                            className={`text-muted-foreground transition-opacity ${
                              active ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                            }`}
                          />
                        </div>
                      </button>
                      </AnimateIcon>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border bg-muted/40 px-4 py-2 text-[11px] text-muted-foreground">
          <span>
            <kbd className="font-mono font-semibold">↑</kbd>{" "}
            <kbd className="font-mono font-semibold">↓</kbd> navigate
          </span>
          <span>
            <kbd className="font-mono font-semibold">↵</kbd> open
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
