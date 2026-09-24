"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutGrid, Search, Store } from "lucide-react";
import { api } from "@ceylonweddings/web";
import type { Vendor } from "@ceylonweddings/contracts";
import { Input } from "@ceylonweddings/ui/components/input";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import {
  AnimatePresence,
  AnimatedCounter,
  Stagger,
  StaggerItem,
  motion,
  useReducedMotion,
} from "@ceylonweddings/ui/domain/motion";
import { cn } from "@ceylonweddings/ui/utils";
import { CATEGORY_LABELS } from "../../../../lib/labels";
import { Link } from "../../../../i18n/navigation";

// ─── Category metadata ──────────────────────────────────────────────────────

const CATEGORY_META: Record<
  string,
  { emoji: string; gradient: string; accent: string }
> = {
  VENUE:         { emoji: "🏛️",  gradient: "from-amber-500/20 via-orange-400/10 to-transparent",    accent: "border-amber-400/40" },
  PHOTO_VIDEO:   { emoji: "📷",  gradient: "from-blue-500/20 via-sky-400/10 to-transparent",         accent: "border-blue-400/40" },
  BRIDAL_WEAR:   { emoji: "👗",  gradient: "from-rose-400/20 via-pink-300/10 to-transparent",        accent: "border-rose-400/40" },
  GROOM_WEAR:    { emoji: "🤵",  gradient: "from-slate-500/20 via-zinc-400/10 to-transparent",       accent: "border-slate-400/40" },
  JEWELLERY:     { emoji: "💎",  gradient: "from-violet-500/20 via-purple-400/10 to-transparent",    accent: "border-violet-400/40" },
  HAIR_MAKEUP:   { emoji: "💄",  gradient: "from-fuchsia-500/20 via-pink-400/10 to-transparent",     accent: "border-fuchsia-400/40" },
  BRIDAL_DRESSER:{ emoji: "✨",  gradient: "from-pink-400/20 via-rose-300/10 to-transparent",        accent: "border-pink-400/40" },
  FLORIST_DECOR: { emoji: "🌸",  gradient: "from-green-500/20 via-emerald-400/10 to-transparent",   accent: "border-green-400/40" },
  CATERER:       { emoji: "🍽️",  gradient: "from-orange-500/20 via-amber-400/10 to-transparent",    accent: "border-orange-400/40" },
  CAKE:          { emoji: "🎂",  gradient: "from-yellow-400/20 via-amber-300/10 to-transparent",     accent: "border-yellow-400/40" },
  ENTERTAINMENT: { emoji: "🎶",  gradient: "from-indigo-500/20 via-blue-400/10 to-transparent",      accent: "border-indigo-400/40" },
  PORUWA:        { emoji: "🛕",  gradient: "from-red-500/20 via-rose-400/10 to-transparent",         accent: "border-red-400/40" },
  ASTROLOGY:     { emoji: "🔮",  gradient: "from-purple-600/20 via-violet-400/10 to-transparent",   accent: "border-purple-400/40" },
  WEDDING_CARS:  { emoji: "🚗",  gradient: "from-cyan-500/20 via-sky-400/10 to-transparent",         accent: "border-cyan-400/40" },
  INVITATIONS:   { emoji: "📜",  gradient: "from-teal-500/20 via-emerald-400/10 to-transparent",     accent: "border-teal-400/40" },
  PLANNER:       { emoji: "📋",  gradient: "from-lime-500/20 via-green-400/10 to-transparent",       accent: "border-lime-400/40" },
  REGISTRAR:     { emoji: "⚖️",  gradient: "from-gray-500/20 via-slate-400/10 to-transparent",      accent: "border-gray-400/40" },
  MEHNDI:        { emoji: "🌿",  gradient: "from-emerald-500/20 via-green-400/10 to-transparent",    accent: "border-emerald-400/40" },
  TRANSPORT:     { emoji: "🚌",  gradient: "from-blue-600/20 via-blue-400/10 to-transparent",        accent: "border-blue-500/40" },
  ACCOMMODATION: { emoji: "🏨",  gradient: "from-stone-500/20 via-neutral-400/10 to-transparent",   accent: "border-stone-400/40" },
};

const FALLBACK_META = { emoji: "🏷️", gradient: "from-muted/30 via-transparent to-transparent", accent: "border-border/40" };

// ─── Page ───────────────────────────────────────────────────────────────────

export default function AdminCategoriesPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const router = useRouter();
  const reduce = useReducedMotion();

  useEffect(() => {
    api.admin
      .vendors({})
      .then((data) => {
        setVendors(data);
        setLoaded(true);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  // Group vendors by category
  const categoryStats = useMemo(() => {
    const map = new Map<string, { total: number; verified: number }>();
    for (const v of vendors) {
      const current = map.get(v.category) ?? { total: 0, verified: 0 };
      map.set(v.category, {
        total: current.total + 1,
        verified: current.verified + (v.verified ? 1 : 0),
      });
    }
    return map;
  }, [vendors]);

  // All known categories (from labels) — always show all, even empty ones
  const allCategories = Object.keys(CATEGORY_LABELS);

  const filteredCategories = useMemo(() => {
    const lower = q.toLowerCase();
    if (!lower) return allCategories;
    return allCategories.filter((cat) =>
      (CATEGORY_LABELS[cat] ?? cat).toLowerCase().includes(lower),
    );
  }, [q, allCategories]);

  const totalVendors = vendors.length;
  const totalVerified = vendors.filter((v) => v.verified).length;

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
        icon={LayoutGrid}
        kicker="Admin"
        title="Categories"
        description="All vendor categories at a glance. Click any tile to browse listings."
      />

      {/* ── Summary strip ─────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-6 rounded-2xl border border-border/50 bg-card/60 px-6 py-4 shadow-sm">
        <Stat label="Categories" value={allCategories.length} loaded={loaded} />
        <div className="w-px bg-border/50" />
        <Stat label="Total vendors" value={totalVendors} loaded={loaded} />
        <div className="w-px bg-border/50" />
        <Stat label="Verified" value={totalVerified} loaded={loaded} accent />
      </div>

      {/* ── Search ────────────────────────────────────────────────── */}
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search categories…"
          className="pl-9"
        />
      </div>

      {/* ── Mosaic grid ───────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {filteredCategories.length === 0 ? (
          <motion.p
            key="empty"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-12 text-center text-sm text-muted-foreground"
          >
            No categories match "{q}"
          </motion.p>
        ) : (
          <Stagger
            key="grid"
            trigger="immediate"
            stagger={0.04}
            className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          >
            {filteredCategories.map((cat) => {
              const meta = CATEGORY_META[cat] ?? FALLBACK_META;
              const stats = categoryStats.get(cat) ?? { total: 0, verified: 0 };
              return (
                <StaggerItem key={cat}>
                  <CategoryTile
                    category={cat}
                    label={CATEGORY_LABELS[cat] ?? cat}
                    emoji={meta.emoji}
                    gradient={meta.gradient}
                    accent={meta.accent}
                    total={stats.total}
                    verified={stats.verified}
                    onClick={() =>
                      router.push(`/admin/vendors?category=${cat}`)
                    }
                  />
                </StaggerItem>
              );
            })}
          </Stagger>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Stat strip item ────────────────────────────────────────────────────────

function Stat({
  label,
  value,
  loaded,
  accent,
}: {
  label: string;
  value: number;
  loaded: boolean;
  accent?: boolean;
}) {
  return (
    <div className="grid gap-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "font-serif text-2xl font-semibold tracking-tight tabular-nums",
          accent && "text-primary",
        )}
      >
        {loaded ? <AnimatedCounter value={value} /> : "—"}
      </p>
    </div>
  );
}

// ─── Category tile ──────────────────────────────────────────────────────────

function CategoryTile({
  label,
  emoji,
  gradient,
  accent,
  total,
  verified,
  onClick,
}: {
  category: string;
  label: string;
  emoji: string;
  gradient: string;
  accent: string;
  total: number;
  verified: number;
  onClick: () => void;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={reduce ? undefined : { y: -5, scale: 1.02 }}
      whileTap={reduce ? undefined : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className={cn(
        "group relative flex min-h-36 w-full flex-col overflow-hidden rounded-2xl border bg-card text-left shadow-sm transition-shadow duration-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        accent,
      )}
    >
      {/* Gradient background */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-100 transition-opacity duration-300 group-hover:opacity-100",
          gradient,
        )}
      />

      <div className="relative flex flex-1 flex-col gap-3 p-4">
        {/* Emoji icon */}
        <span className="grid size-12 place-items-center rounded-xl bg-background/60 text-2xl shadow-sm backdrop-blur-sm">
          {emoji}
        </span>

        {/* Label */}
        <p className="font-serif text-sm font-semibold leading-snug tracking-tight">
          {label}
        </p>

        {/* Stats row */}
        <div className="mt-auto flex items-end justify-between gap-2">
          <p className="text-xs tabular-nums text-muted-foreground">
            <span className="font-semibold text-foreground">{total}</span>{" "}
            {total === 1 ? "listing" : "listings"}
          </p>
          {verified > 0 && (
            <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-medium text-success">
              {verified} ✓
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
}
