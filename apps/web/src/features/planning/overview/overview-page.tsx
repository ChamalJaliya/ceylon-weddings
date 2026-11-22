"use client";

import {
  agendaForEvent,
  resolveWeddingCoverUrl,
  weddingStyleColors,
  weddingStyleSchema,
  type Appointment,
  type Inquiry,
  type WeddingStyle,
} from "@ceylonweddings/contracts";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  CalendarClock,
  CalendarDays,
  CheckSquare,
  ClipboardList,
  Hourglass,
  MessageCircle,
  Music2,
  Store,
  Users,
  Utensils,
  Wallet,
} from "lucide-react";
import { api, formatMoney, usePreferenceStore } from "@ceylonweddings/web";
import { Button } from "@ceylonweddings/ui/components/button";
import { DashboardStack } from "@ceylonweddings/ui/domain/dashboard-layout";
import { SupplierStrip } from "@ceylonweddings/ui/domain/team-vendor";
import { CeremonySchedule } from "@ceylonweddings/ui/domain/wedding-presentation";
import {
  ColumnChart,
  DonutChart,
  KpiCard,
  ProgressRing,
  RankedBars,
  WidgetEmpty,
  type ChartTone,
} from "@ceylonweddings/ui/domain/dashboard";
import { Link } from "@/i18n/navigation";
import { SignInPrompt, useWedding } from "@/components/use-wedding";
import { AiStub } from "@/components/ai-stub";
import { CATEGORY_LABELS } from "@/lib/labels";
import { WidgetDashboard, type WidgetRenderContext } from "@/features/dashboard/widget-dashboard";
import { count, WidgetHeaderLink } from "@/features/dashboard/dashboard-format";
import {
  BUDGET_WIDGET_IDS,
  COUPLE_WIDGETS,
  COUPLE_WIDGET_CATEGORIES,
  useCoupleDashboardLayout,
} from "./couple-widgets";

const INSPIRATION = [
  { key: "FLORIST_DECOR", src: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=600&q=80" },
  { key: "PHOTO_VIDEO", src: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=600&q=80" },
  { key: "CAKE", src: "https://images.unsplash.com/photo-1535254973040-607b474d7f5a?w=600&q=80" },
  { key: "ENTERTAINMENT", src: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&q=80" },
  { key: "VENUE", src: "https://images.unsplash.com/photo-1519167758481-83f29da8c12f?w=600&q=80" },
  { key: "BRIDAL_WEAR", src: "https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=600&q=80" },
  { key: "HAIR_MAKEUP", src: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&q=80" },
  { key: "PORUWA", src: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&q=80" },
];

const PROGRESS_LABELS: Record<string, string> = {
  partners: "Add both partners",
  date: "Set the wedding date",
  city: "Choose a city",
  events: "Add your ceremonies",
  guests: "Start the guest list",
  budget: "Set a budget",
  website: "Publish your website",
  family: "Invite family",
  inviteTemplate: "Pick an invite template",
  seating: "Plan seating",
  music: "Plan the music",
  moodboard: "Start a moodboard",
  checklist: "Start the checklist",
  runSheet: "Seed a day-of run sheet",
};

const PROGRESS_HREF: Record<string, string> = {
  partners: "/planning/profile",
  date: "/planning/profile",
  city: "/planning/profile",
  events: "/planning/studio",
  guests: "/planning/guests",
  budget: "/planning/budget",
  website: "/planning/website",
  family: "/planning/family",
  inviteTemplate: "/planning/guests",
  seating: "/planning/seating",
  music: "/planning/music",
  moodboard: "/planning/moodboard",
  checklist: "/planning/checklist",
  runSheet: "/planning/agenda",
};

const RSVP: Record<string, { label: string; tone: ChartTone }> = {
  CONFIRMED: { label: "Confirmed", tone: "success" },
  INVITED: { label: "Invited", tone: "info" },
  MAYBE: { label: "Maybe", tone: "warning" },
  CONSIDERING: { label: "Considering", tone: "4" },
  WALK_IN: { label: "Walk-in", tone: "1" },
  DECLINED: { label: "Declined", tone: "danger" },
};

const SIDE_LABEL: Record<string, string> = { BRIDE: "Bride's side", GROOM: "Groom's side", BOTH: "Both families" };
const MEAL_LABEL: Record<string, string> = {
  VEG: "Vegetarian",
  FISH: "Fish",
  CHICKEN: "Chicken",
  BEEF: "Beef",
  HALAL: "Halal",
  OTHER: "Other",
};

const COLOMBO = "Asia/Colombo";
const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-LK", { day: "numeric", month: "long", year: "numeric", timeZone: COLOMBO });

export default function PlanningHubPage() {
  const t = useTranslations();
  const currency = usePreferenceStore((state) => state.currency);
  const { data, error, reload } = useWedding();
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);
  const [inquiries, setInquiries] = useState<(Inquiry & { vendorName?: string })[] | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const loadSide = useCallback(() => {
    api.wedding
      .appointments()
      .then(setAppointments)
      .catch(() => setAppointments([]));
    api.wedding
      .inquiries()
      .then(setInquiries)
      .catch(() => setInquiries([]));
  }, []);

  useEffect(() => {
    loadSide();
    // The countdown only changes by the minute.
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, [loadSide]);

  const daysLeft = useMemo(() => {
    if (data?.hubStats?.daysToNextEvent != null) return data.hubStats.daysToNextEvent;
    if (!data?.date) return null;
    return Math.max(0, Math.floor((new Date(data.date).getTime() - now) / 86_400_000));
  }, [data?.date, data?.hubStats?.daysToNextEvent, now]);

  const canViewBudget = data?.myAccess.canViewBudget ?? false;
  const widgets = useMemo(
    () => (canViewBudget ? COUPLE_WIDGETS : COUPLE_WIDGETS.filter((w) => !BUDGET_WIDGET_IDS.has(w.id))),
    [canViewBudget],
  );

  if (!data) return <SignInPrompt error={error} />;
  const wedding = data;

  async function setStyle(style: WeddingStyle) {
    await api.wedding.update({ style, colors: weddingStyleColors(style) });
    await reload();
  }

  const tasks = wedding.tasks ?? [];
  const openTasks = tasks.filter((task) => task.status !== "DONE");
  const doneTasks = tasks.length - openTasks.length;
  const budgetLines = wedding.budgetLines ?? [];
  const spent = budgetLines.reduce((sum, line) => sum + line.spentLkr, 0);
  const booked = wedding.hubStats?.teamBooked ?? wedding.team.filter((item) => item.status === "BOOKED").length;
  const teamTotal = Math.max(wedding.team.length, 1);
  const plates = wedding.plateSummary;
  const completeness = wedding.completeness ?? { score: 0, total: 8, ready: false, missing: [] };
  const dateLabel = wedding.hubStats?.nextEventAt
    ? longDate(wedding.hubStats.nextEventAt)
    : wedding.date
      ? longDate(wedding.date)
      : t("knotly.dateTbd");
  const upcoming = (appointments ?? [])
    .filter((item) => new Date(item.endsAt).getTime() >= now)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .slice(0, 4);

  function renderWidget(id: string, { variant }: WidgetRenderContext): ReactNode {
    switch (id) {
      case "kpi_budget": {
        const pct = wedding.budgetLkr ? (spent / wedding.budgetLkr) * 100 : 0;
        return (
          <KpiCard
            variant={variant}
            icon={Wallet}
            label="Budget used"
            value={`${Math.round(pct)}%`}
            hint={`${formatMoney(spent, currency)} of ${formatMoney(wedding.budgetLkr, currency)}`}
            tone={pct > 100 ? "danger" : pct > 85 ? "warning" : "primary"}
            progress={pct}
            status={pct > 100 ? { label: "Over", tone: "danger" } : undefined}
          />
        );
      }
      case "kpi_team":
        return (
          <KpiCard
            variant={variant}
            icon={Store}
            label="Vendors booked"
            value={`${booked}/${wedding.team.length}`}
            hint={
              wedding.hubStats?.missingCategories.length
                ? `${wedding.hubStats.missingCategories.length} categories still open`
                : "Your core team"
            }
            tone="info"
            ring={(booked / teamTotal) * 100}
            visualLabel="Booked"
          />
        );
      case "kpi_rsvp":
        return (
          <KpiCard
            variant={variant}
            icon={Users}
            label="RSVPs"
            value={`${wedding.rsvpConfirmed}/${wedding.rsvpTotal}`}
            hint={plates ? `${count(plates.confirmedHeads)} plates confirmed` : "Confirmed guests"}
            tone="love"
            ring={wedding.rsvpTotal ? (wedding.rsvpConfirmed / wedding.rsvpTotal) * 100 : 0}
            visualLabel="Replied"
          />
        );
      case "kpi_tasks":
        return (
          <KpiCard
            variant={variant}
            icon={CheckSquare}
            label="Checklist"
            value={`${doneTasks}/${tasks.length}`}
            hint={`${openTasks.length} tasks to go`}
            tone="success"
            progress={tasks.length ? (doneTasks / tasks.length) * 100 : 0}
          />
        );
      case "kpi_countdown":
        return (
          <KpiCard
            variant={variant}
            icon={Hourglass}
            label="Countdown"
            value={daysLeft == null ? "—" : `${daysLeft} days`}
            hint={wedding.hubStats?.nextEventName ?? dateLabel}
            tone="love"
          />
        );
      case "kpi_plates":
        return plates ? (
          <KpiCard
            variant={variant}
            icon={Utensils}
            label="Plates confirmed"
            value={`${count(plates.confirmedHeads)}/${count(plates.estimate)}`}
            hint={plates.bufferGap > 0 ? `${count(plates.bufferGap)} below estimate` : "On estimate"}
            tone="premium"
            progress={plates.estimate ? (plates.confirmedHeads / plates.estimate) * 100 : 0}
          />
        ) : (
          <WidgetEmpty icon={Utensils} title="No guests yet" />
        );
      case "kpi_music":
        return (
          <KpiCard
            variant={variant}
            icon={Music2}
            label="Music plans"
            value={`${wedding.hubStats?.musicReadyPlans ?? 0}/${wedding.hubStats?.musicPlanCount ?? 0}`}
            hint="Ready for the DJ or band"
            tone="info"
          />
        );
      case "ceremonies":
        return wedding.events?.length ? (
          <div className="grid gap-3">
            <CeremonySchedule
              events={wedding.events}
              formatWhen={(iso) =>
                iso
                  ? new Date(iso).toLocaleString("en-LK", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: COLOMBO,
                    })
                  : ""
              }
            />
            <ul className="grid gap-1.5">
              {wedding.events.map((event) => (
                <li key={`agenda-${event.id}`}>
                  <Link
                    href={`/planning/agenda?eventId=${event.id}`}
                    className="widget-no-drag flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-compact transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                  >
                    <span className="truncate text-muted-foreground">{event.name}</span>
                    <span className="shrink-0 text-caption text-primary">{t("knotly.openAgenda")}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <WidgetEmpty
            icon={CalendarDays}
            title="No ceremonies yet"
            description="Add your Poruwa, church service or homecoming to build your schedule."
            action={
              <Button asChild size="sm">
                <Link href="/planning/studio">Add a ceremony</Link>
              </Button>
            }
          />
        );
      case "progress": {
        const pct = completeness.total ? (completeness.score / completeness.total) * 100 : 0;
        return (
          <div className="flex h-full flex-wrap items-center gap-5">
            <ProgressRing
              value={pct}
              tone={completeness.ready ? "success" : "love"}
              label={`${completeness.score} of ${completeness.total} done`}
            />
            <ul className="grid min-w-40 flex-1 gap-1.5">
              {completeness.missing.length === 0 ? (
                <li className="text-compact text-muted-foreground">Everything is set up. Enjoy the planning.</li>
              ) : (
                completeness.missing.slice(0, 5).map((key) => (
                  <li key={key}>
                    <Link
                      href={PROGRESS_HREF[key] ?? "/planning"}
                      className="widget-no-drag flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-compact transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                    >
                      {PROGRESS_LABELS[key] ?? key}
                      <span className="text-caption text-primary">Start</span>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
        );
      }
      case "budget_categories": {
        if (!budgetLines.length) {
          return (
            <WidgetEmpty
              icon={Wallet}
              title="No budget lines yet"
              action={
                <Button asChild size="sm">
                  <Link href="/planning/budget">Plan your budget</Link>
                </Button>
              }
            />
          );
        }
        const rows = [...budgetLines].sort((a, b) => b.spentLkr - a.spentLkr).slice(0, 6);
        return (
          <RankedBars
            formatValue={(value) => formatMoney(value, currency)}
            rows={rows.map((line) => ({
              key: line.id,
              label: line.label,
              value: line.spentLkr,
              hint: line.plannedLkr ? `of ${formatMoney(line.plannedLkr, currency)}` : undefined,
              tone: line.plannedLkr && line.spentLkr > line.plannedLkr ? "danger" : "1",
            }))}
            max={Math.max(...rows.map((line) => Math.max(line.plannedLkr, line.spentLkr)), 1)}
          />
        );
      }
      case "tasks_board": {
        if (!tasks.length) return <WidgetEmpty icon={CheckSquare} title="No tasks yet" />;
        const doing = tasks.filter((task) => task.status === "DOING").length;
        return (
          <div className="grid h-full grid-rows-[minmax(0,1fr)_auto] gap-3">
            <DonutChart
              ariaLabel="Checklist by status"
              centerLabel="tasks"
              slices={[
                { key: "DONE", label: "Done", value: doneTasks, tone: "success" },
                { key: "DOING", label: "In progress", value: doing, tone: "warning" },
                { key: "TODO", label: "To do", value: openTasks.length - doing, tone: "muted" },
              ]}
            />
            {openTasks.length ? (
              <ul className="grid gap-1 border-t border-border/60 pt-2">
                {openTasks.slice(0, 3).map((task) => (
                  <li key={task.id} className="flex items-center gap-2 text-caption">
                    <span className="size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                    <span className="truncate">{task.title}</span>
                    {task.dueAt ? (
                      <span className="ml-auto shrink-0 text-muted-foreground">
                        {new Date(task.dueAt).toLocaleDateString("en-LK", {
                          day: "numeric",
                          month: "short",
                          timeZone: COLOMBO,
                        })}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        );
      }
      case "rsvp_breakdown": {
        const buckets = (wedding.guestSummary?.byStatus ?? []).filter((b) => b.heads > 0);
        if (!buckets.length) {
          return (
            <WidgetEmpty
              icon={Users}
              title="No guests yet"
              action={
                <Button asChild size="sm">
                  <Link href="/planning/guests">Add guests</Link>
                </Button>
              }
            />
          );
        }
        return (
          <DonutChart
            ariaLabel="Guests by RSVP"
            centerLabel="guests"
            slices={buckets.map((b) => ({
              key: b.status,
              label: RSVP[b.status]?.label ?? b.status,
              value: b.heads,
              tone: RSVP[b.status]?.tone ?? "muted",
            }))}
          />
        );
      }
      case "plates": {
        if (!plates || plates.estimate === 0)
          return (
            <WidgetEmpty icon={Utensils} title="No guests yet" description="Plates appear once guests are invited." />
          );
        return (
          <div className="grid gap-4">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="font-serif text-h2 leading-none tabular-nums">{count(plates.confirmedHeads)}</span>
              <span className="text-caption text-muted-foreground">
                confirmed of {count(plates.estimate)} estimated · {count(plates.consideringHeads)} possible
              </span>
            </div>
            <RankedBars
              tone="premium"
              max={Math.max(plates.estimate, 1)}
              rows={plates.byMeal
                .filter((m) => m.heads > 0)
                .map((m) => ({
                  key: m.meal ?? "none",
                  label: m.meal ? (MEAL_LABEL[m.meal] ?? m.meal) : "No choice yet",
                  value: m.heads,
                }))}
            />
          </div>
        );
      }
      case "guest_sides": {
        const sides = wedding.guestSummary?.bySide ?? [];
        return sides.length ? (
          <ColumnChart
            ariaLabel="Guests by side"
            tone="love"
            data={sides.map((s) => ({ label: SIDE_LABEL[s.side] ?? s.side, value: s.heads }))}
          />
        ) : (
          <WidgetEmpty icon={Users} title="No guests yet" />
        );
      }
      case "team":
        return wedding.team.length ? (
          <div>
            <SupplierStrip
              items={wedding.team.map((item) => ({
                id: item.vendorId,
                name: item.name,
                category: CATEGORY_LABELS[item.category] ?? item.category,
                photoUrl: item.photoUrl ?? item.photos?.[0],
                status: item.status,
                href: `/vendors/${item.slug}`,
              }))}
            />
          </div>
        ) : (
          <WidgetEmpty
            icon={Store}
            title="Build your team"
            description="Shortlist vendors you love and track who's booked."
            action={
              <Button asChild size="sm">
                <Link href="/vendors">Browse vendors</Link>
              </Button>
            }
          />
        );
      case "upcoming_schedule":
        if (!appointments) return null;
        return upcoming.length ? (
          <ul className="grid gap-2">
            {upcoming.map((item) => {
              const day = new Date(item.startsAt).toLocaleDateString("en-CA", { timeZone: COLOMBO });
              return (
                <li key={item.id}>
                  <Link
                    href={`/planning/calendar?focus=${day}&highlight=${item.id}`}
                    className="widget-no-drag flex gap-3 rounded-xl bg-secondary/50 px-3 py-2 transition-colors hover:bg-secondary focus-visible:bg-secondary focus-visible:outline-none"
                  >
                    <span className="grid w-9 shrink-0 place-items-center text-center leading-none">
                      <span className="text-label text-muted-foreground uppercase">
                        {new Date(item.startsAt).toLocaleDateString("en-LK", { month: "short", timeZone: COLOMBO })}
                      </span>
                      <span className="font-serif text-h4">
                        {new Date(item.startsAt).toLocaleDateString("en-LK", { day: "numeric", timeZone: COLOMBO })}
                      </span>
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-compact font-medium">{item.title}</span>
                      <span className="block truncate text-caption text-muted-foreground">
                        {new Date(item.startsAt).toLocaleTimeString("en-LK", {
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: COLOMBO,
                        })}
                        {item.venueName ? ` · ${item.venueName}` : ""}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <WidgetEmpty icon={CalendarClock} title="Nothing scheduled" description={t("knotly.noAppointments")} />
        );
      case "run_sheet": {
        if (!appointments) return null;
        const nextEventId =
          wedding.hubStats?.nextEventId ?? wedding.events?.find((event) => event.startsAt || event.nekathAt)?.id;
        const nextEvent = wedding.events?.find((event) => event.id === nextEventId);
        const blocks = nextEventId ? agendaForEvent(appointments, nextEventId).slice(0, 4) : [];
        return blocks.length ? (
          <ul className="grid gap-2">
            {blocks.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/planning/agenda?eventId=${nextEventId}&highlight=${item.id}`}
                  className="widget-no-drag flex gap-3 rounded-xl bg-secondary/50 px-3 py-2 transition-colors hover:bg-secondary focus-visible:bg-secondary focus-visible:outline-none"
                >
                  <span className="w-12 shrink-0 pt-0.5 text-caption tabular-nums text-muted-foreground">
                    {new Date(item.startsAt).toLocaleTimeString("en-LK", {
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: COLOMBO,
                    })}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-compact font-medium">{item.title}</span>
                    <span className="block truncate text-caption text-muted-foreground">
                      {item.ownerLabel || nextEvent?.name || t("nav.agenda")}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <WidgetEmpty
            icon={ClipboardList}
            title={t("nav.agenda")}
            description={t("knotly.agendaEmpty")}
            action={
              nextEventId ? (
                <Button asChild size="sm">
                  <Link href={`/planning/agenda?eventId=${nextEventId}`}>{t("knotly.openAgenda")}</Link>
                </Button>
              ) : undefined
            }
          />
        );
      }
      case "messages":
        if (!inquiries) return null;
        return inquiries.length ? (
          <ul className="grid gap-1">
            {inquiries.slice(0, 4).map((item) => {
              const body = (
                <>
                  <span className="block truncate text-compact font-medium">{item.vendorName ?? "Vendor"}</span>
                  <span className="line-clamp-1 text-caption text-muted-foreground">{item.message}</span>
                </>
              );
              return (
                <li key={item.id}>
                  {item.whatsappUrl ? (
                    <a
                      href={item.whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-xl px-2 py-1.5 transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                    >
                      {body}
                    </a>
                  ) : (
                    <div className="px-2 py-1.5">{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <WidgetEmpty icon={MessageCircle} title={t("nav.messages")} description={t("knotly.noMessages")} />
        );
      case "style":
        return (
          <div className="grid gap-3">
            <div className="flex flex-wrap gap-1.5">
              {weddingStyleSchema.options.map((style) => (
                <Button
                  key={style}
                  type="button"
                  size="sm"
                  shape="pill"
                  variant={wedding.style === style ? "default" : "secondary"}
                  onClick={() => void setStyle(style)}
                >
                  {t(`knotly.style_${style.toLowerCase()}`)}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              {(wedding.colors.length ? wedding.colors : weddingStyleColors(wedding.style)).map((color) => (
                // design-system: user-data-colors (the couple's saved palette)
                <span key={color} className="size-8 rounded-full border border-border" style={{ background: color }} />
              ))}
            </div>
            {wedding.settingNotes ? (
              <p className="line-clamp-2 text-caption text-muted-foreground">{wedding.settingNotes}</p>
            ) : null}
          </div>
        );
      case "inspiration":
        return (
          <div className="grid h-full grid-cols-2 gap-2 sm:grid-cols-4">
            {INSPIRATION.map((item) => (
              <Link
                key={item.key}
                href={`/vendors?category=${item.key}`}
                className="widget-no-drag group relative block min-h-20 overflow-hidden rounded-xl"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.src}
                  alt=""
                  className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-105"
                />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 to-transparent px-2 py-1.5 text-caption text-paper">
                  {CATEGORY_LABELS[item.key] ?? item.key}
                </span>
              </Link>
            ))}
          </div>
        );
      default:
        return null;
    }
  }

  function renderHeaderActions(id: string): ReactNode {
    const link = (href: string, label = t("hub.viewAll")) => <WidgetHeaderLink href={href}>{label}</WidgetHeaderLink>;
    switch (id) {
      case "ceremonies":
        return (
          <span className="flex items-center gap-2">
            {link("/planning/studio", "Studio")}
            {wedding.hubStats?.nextEventId || wedding.events?.[0]?.id ? (
              <WidgetHeaderLink
                href={`/planning/agenda?eventId=${wedding.hubStats?.nextEventId ?? wedding.events![0]!.id}`}
              >
                {t("nav.agenda")}
              </WidgetHeaderLink>
            ) : null}
          </span>
        );
      case "budget_categories":
        return link("/planning/budget");
      case "tasks_board":
        return link("/planning/checklist");
      case "rsvp_breakdown":
      case "plates":
      case "guest_sides":
        return link("/planning/guests");
      case "team":
        return link("/planning/team");
      case "upcoming_schedule":
        return link("/planning/calendar");
      case "run_sheet": {
        const eventId =
          wedding.hubStats?.nextEventId ?? wedding.events?.find((event) => event.startsAt || event.nekathAt)?.id;
        return link(eventId ? `/planning/agenda?eventId=${eventId}` : "/planning/agenda");
      }
      case "messages":
        return link("/planning/messages");
      case "inspiration":
        return link("/vendors", "Browse");
      default:
        return null;
    }
  }

  return (
    <DashboardStack>
      <section className="cw-hero-soft relative isolate grid overflow-hidden rounded-3xl lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="order-2 grid content-between gap-8 p-6 sm:p-10 lg:order-1">
          <div className="grid gap-3">
            <p className="text-label tracking-eyebrow text-paper/60 uppercase">{t("hub.kicker")}</p>
            <h1 className="font-serif text-4xl leading-none font-medium tracking-tight text-balance sm:text-6xl">
              {wedding.partnerOneName} <span className="text-[color:var(--cw-gold-300)]">&</span>{" "}
              {wedding.partnerTwoName}
            </h1>
            <p className="text-paper/70">
              {[dateLabel, [...new Set([wedding.city, wedding.district].filter(Boolean))].join(", ")]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-x-10 gap-y-4">
            {daysLeft != null ? (
              <div>
                <p className="font-serif text-6xl leading-none text-[color:var(--cw-gold-300)] sm:text-7xl">
                  {daysLeft}
                </p>
                <p className="mt-1 text-sm text-paper/70">
                  days {wedding.hubStats?.nextEventName ? `to ${wedding.hubStats.nextEventName}` : "to go"}
                </p>
              </div>
            ) : null}
            {openTasks.length ? (
              <Link href="/planning/checklist" className="group">
                <p className="font-serif text-3xl leading-none">{openTasks.length}</p>
                <p className="mt-1 text-sm text-paper/70 group-hover:text-paper">tasks still open →</p>
              </Link>
            ) : null}
          </div>

          <div className="grid gap-4">
            {(wedding.hubStats?.missingCategories ?? []).length ? (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-paper/60">Still need</span>
                {(wedding.hubStats?.missingCategories ?? []).map((cat) => (
                  <Link
                    key={cat}
                    href={`/vendors?category=${cat}`}
                    className="rounded-full border border-paper/25 px-3 py-1 transition hover:border-[color:var(--cw-gold-300)] hover:text-[color:var(--cw-gold-300)]"
                  >
                    {CATEGORY_LABELS[cat] ?? cat}
                  </Link>
                ))}
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button asChild shape="pill" className="bg-paper text-ink hover:bg-paper/90">
                <Link href="/planning/studio">Open studio</Link>
              </Button>
              <AiStub />
            </div>
          </div>
        </div>

        <div className="relative order-1 min-h-56 lg:order-2 lg:min-h-[26rem]">
          <img
            src={resolveWeddingCoverUrl(wedding.coverImageUrl)}
            alt={`${wedding.partnerOneName} and ${wedding.partnerTwoName}`}
            className="absolute inset-0 size-full object-cover"
          />
          <span
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-ink/40 to-transparent lg:bg-gradient-to-r lg:from-ink/50 lg:via-transparent"
          />
          <Button
            asChild
            size="sm"
            shape="pill"
            variant="secondary"
            className="absolute top-4 right-4 border border-background/30 bg-background/85 text-foreground shadow-sm backdrop-blur-md hover:bg-background"
          >
            <Link href="/planning/studio?section=style">Cover photo</Link>
          </Button>
        </div>
      </section>

      <WidgetDashboard
        kind="couple"
        store={useCoupleDashboardLayout}
        widgets={widgets}
        categories={COUPLE_WIDGET_CATEGORIES}
        renderWidget={renderWidget}
        renderHeaderActions={renderHeaderActions}
        toolbar={
          <p className="text-caption text-muted-foreground">
            Your planning at a glance — make it yours with{" "}
            <span className="font-medium text-foreground">Edit layout</span>.
          </p>
        }
      />
    </DashboardStack>
  );
}
