"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { CalendarDays, Heart, Music2, Store, Wallet } from "lucide-react";
import { api, formatMoney, usePreferenceStore } from "@ceylonweddings/web";
import type { Appointment, Inquiry, WeddingStyle } from "@ceylonweddings/contracts";
import { weddingStyleSchema } from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import { CoupleHero } from "@ceylonweddings/ui/domain/couple-hero";
import {
  DashboardMain,
  DashboardPrimary,
  DashboardSecondary,
  DashboardStack,
  DashboardStats,
} from "@ceylonweddings/ui/domain/dashboard-layout";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { StatCard } from "@ceylonweddings/ui/domain/stat-card";
import { BudgetMeter } from "@ceylonweddings/ui/domain/budget-meter";
import { TimelineRail } from "@ceylonweddings/ui/domain/timeline-rail";
import { SupplierStrip } from "@ceylonweddings/ui/domain/team-vendor";
import {
  CeremonySchedule,
  PlanningProgress,
  PlateSummaryCard,
  TeamGapBanner,
} from "@ceylonweddings/ui/domain/wedding-presentation";
import { Stagger, StaggerItem } from "@ceylonweddings/ui/domain/motion";
import { Link } from "../../../i18n/navigation";
import { SignInPrompt, useWedding } from "../../../components/use-wedding";
import { AiStub } from "../../../components/ai-stub";
import { CATEGORY_LABELS } from "../../../lib/labels";

const STYLE_COLORS: Record<WeddingStyle, string[]> = {
  MINIMALIST: ["#F7F3EC", "#D9D2C5", "#2F2F2F", "#9A9488", "#E8E2D6"],
  TRADITIONAL: ["#7A1F2B", "#C4A574", "#F4E4D0", "#1F4D3A", "#E8D5B5"],
  KANDYAN: ["#C4A574", "#F4E4D0", "#7A1F2B", "#1F4D3A", "#E8D5B5"],
  MODERN: ["#1F4B73", "#D7E6F5", "#0F172A", "#94A3B8", "#F8FAFC"],
  BEACH: ["#0F766E", "#F4E1C1", "#155E75", "#F8FAFC", "#67E8F9"],
};

const INSPIRATION = [
  { key: "FLORIST_DECOR", src: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=600&q=80" },
  { key: "PHOTO_VIDEO", src: "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80" },
  { key: "CAKE", src: "https://images.unsplash.com/photo-1535254973040-607b474d7f5a?w=600&q=80" },
  { key: "ENTERTAINMENT", src: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&q=80" },
  { key: "VENUE", src: "https://images.unsplash.com/photo-1519167758481-83f29da8c12f?w=600&q=80" },
  { key: "BRIDAL_WEAR", src: "https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=600&q=80" },
  { key: "HAIR_MAKEUP", src: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&q=80" },
  { key: "PORUWA", src: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600&q=80" },
  { key: "WEDDING_CARS", src: "https://images.unsplash.com/photo-1485291571150-772bcfc10da5?w=600&q=80" },
  { key: "JEWELLERY", src: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&q=80" },
];

export default function PlanningHubPage() {
  const t = useTranslations();
  const currency = usePreferenceStore((state) => state.currency);
  const { data, error, reload } = useWedding();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [inquiries, setInquiries] = useState<(Inquiry & { vendorName?: string })[]>([]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    api.wedding.appointments().then(setAppointments).catch(() => setAppointments([]));
    api.wedding.inquiries().then(setInquiries).catch(() => setInquiries([]));
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const remaining = (data?.tasks ?? []).filter((task) => task.status !== "DONE").length;
  const spent = data?.budgetLines?.reduce((sum, line) => sum + line.spentLkr, 0) ?? 0;
  const hired = data?.hubStats?.teamBooked ?? data?.team.filter((item) => item.status === "BOOKED").length ?? 0;
  const todayAppts = useMemo(() => {
    const day = new Date(now).toLocaleDateString("en-CA", { timeZone: "Asia/Colombo" });
    return appointments.filter((item) => item.startsAt.slice(0, 10) === day);
  }, [appointments, now]);

  const daysLeft = useMemo(() => {
    if (data?.hubStats?.daysToNextEvent != null) return String(data.hubStats.daysToNextEvent);
    if (!data?.date) return null;
    const diff = new Date(data.date).getTime() - now;
    if (diff <= 0) return "0";
    return String(Math.floor(diff / 86400000));
  }, [data?.date, data?.hubStats?.daysToNextEvent, now]);

  if (!data) return <SignInPrompt error={error} />;

  async function complete(id: string) {
    await api.wedding.updateTask(id, { status: "DONE" });
    await reload();
  }

  async function setStyle(style: WeddingStyle) {
    await api.wedding.update({ style, colors: STYLE_COLORS[style] });
    await reload();
  }

  const dateLabel = data.hubStats?.nextEventAt
    ? new Date(data.hubStats.nextEventAt).toLocaleDateString("en-LK", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Asia/Colombo",
      })
    : data.date
      ? new Date(data.date).toLocaleDateString("en-LK", {
          day: "numeric",
          month: "long",
          year: "numeric",
          timeZone: "Asia/Colombo",
        })
      : t("knotly.dateTbd");
  const budgetPercent = data.budgetLkr ? Math.round((spent / data.budgetLkr) * 100) : 0;
  const completeness = data.completeness ?? { score: 0, total: 8, ready: false, missing: [] };
  const plates = data.plateSummary;

  return (
    <DashboardStack>
      <CoupleHero
        density="hub"
        imageSrc="https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&q=80"
        imageAlt=""
        kicker={t("hub.kicker")}
        names={`${data.partnerOneName} & ${data.partnerTwoName}`}
        date={dateLabel}
        place={[data.city, data.district].filter(Boolean).join(", ")}
        days={daysLeft ?? undefined}
        daysLabel={data.hubStats?.nextEventName ? `to ${data.hubStats.nextEventName}` : t("hub.daysLeft")}
        chips={[t("knotly.tasksLeft", { count: remaining })]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/planning/studio">Open studio</Link>
            </Button>
            <AiStub />
          </div>
        }
      />

      <TeamGapBanner
        missing={data.hubStats?.missingCategories ?? []}
        labels={CATEGORY_LABELS}
        action={
          <Button asChild size="sm">
            <Link href="/vendors">Browse</Link>
          </Button>
        }
      />

      <Stagger>
        <DashboardStats>
          {data.myAccess.canViewBudget ? (
            <StaggerItem>
              <StatCard
                icon={Wallet}
                label={t("knotly.estimated")}
                value={formatMoney(data.budgetLkr, currency)}
                hint={`${formatMoney(spent, currency)} ${t("hub.budgetUsed").toLowerCase()}`}
                tone="warning"
              />
            </StaggerItem>
          ) : null}
          <StaggerItem>
            <StatCard
              icon={Store}
              label={t("knotly.hired")}
              value={`${hired}/${Math.max(data.team.length, 1)}`}
              hint={t("nav.team")}
              tone="info"
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              icon={Heart}
              label={t("hub.rsvp")}
              value={`${data.rsvpConfirmed}/${data.rsvpTotal}`}
              hint={plates ? `${plates.confirmedHeads} plates confirmed` : t("nav.guests")}
              tone="love"
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              icon={Music2}
              label={t("nav.music")}
              value={`${data.hubStats?.musicReadyPlans ?? 0}/${data.hubStats?.musicPlanCount ?? 0}`}
              hint={t("planning.musicHelp")}
              tone="info"
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              icon={CalendarDays}
              label={t("hub.daysLeft")}
              value={daysLeft ?? "—"}
              hint={data.hubStats?.nextEventName ?? dateLabel}
            />
          </StaggerItem>
        </DashboardStats>
      </Stagger>

      <DashboardMain>
        <DashboardPrimary>
          <SectionCard title="Ceremonies" icon={CalendarDays} delay={1} variant="muted" action={
            <Button asChild variant="ghost" size="sm">
              <Link href="/planning/studio">Studio</Link>
            </Button>
          }>
            <CeremonySchedule
              events={data.events ?? []}
              formatWhen={(iso) =>
                iso
                  ? new Date(iso).toLocaleString("en-LK", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: "Asia/Colombo",
                    })
                  : ""
              }
            />
          </SectionCard>

          <SectionCard title={t("knotly.weddingStyle")} icon={Heart} delay={2} variant="muted">
            <div className="flex flex-wrap gap-2">
              {weddingStyleSchema.options.map((style) => (
                <Button
                  key={style}
                  type="button"
                  size="sm"
                  shape="pill"
                  variant={data.style === style ? "default" : "secondary"}
                  onClick={() => setStyle(style)}
                >
                  {t(`knotly.style_${style.toLowerCase()}`)}
                </Button>
              ))}
            </div>
            {data.settingNotes ? <p className="text-sm text-muted-foreground">{data.settingNotes}</p> : null}
            <div className="flex gap-2">
              {(data.colors.length ? data.colors : STYLE_COLORS[data.style]).map((color) => (
                <span key={color} className="size-8 rounded-full border border-border" style={{ background: color }} />
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title={t("nav.calendar")}
            icon={CalendarDays}
            delay={3}
            action={
              <Button asChild variant="ghost" size="sm">
                <Link href="/planning/calendar">{t("hub.viewAll")}</Link>
              </Button>
            }
          >
            {todayAppts.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("knotly.noAppointments")}</p>
            ) : (
              todayAppts.map((item) => (
                <div key={item.id} className="rounded-xl bg-secondary px-4 py-3 text-sm">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.startsAt).toLocaleTimeString("en-LK", {
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "Asia/Colombo",
                    })}
                    {item.venueName ? ` · ${item.venueName}` : ""}
                  </p>
                </div>
              ))
            )}
          </SectionCard>

          <SectionCard
            title={t("knotly.suppliers")}
            icon={Store}
            delay={3}
            action={
              <Button asChild variant="ghost" size="sm">
                <Link href="/planning/team">{t("hub.viewAll")}</Link>
              </Button>
            }
          >
            <SupplierStrip
              items={data.team.map((item) => ({
                id: item.vendorId,
                name: item.name,
                category: CATEGORY_LABELS[item.category] ?? item.category,
                photoUrl: item.photoUrl ?? item.photos?.[0],
                status: item.status,
                href: `/vendors/${item.slug}`,
              }))}
            />
            {data.team.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {data.team.map((item) => (
                  <Link
                    key={item.vendorId}
                    href={`/vendors/${item.slug}`}
                    className="text-xs text-primary underline-offset-2 hover:underline"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                <Link href="/vendors" className="text-primary underline-offset-2 hover:underline">
                  Browse vendors
                </Link>{" "}
                to build your team.
              </p>
            )}
          </SectionCard>
        </DashboardPrimary>

        <DashboardSecondary>
          <PlanningProgress
            score={completeness.score}
            total={completeness.total}
            missing={completeness.missing}
            labels={{
              partners: "Partners",
              date: "Date",
              city: "City",
              events: "Events",
              guests: "Guests",
              budget: "Budget",
              website: "Website",
              family: "Family",
              inviteTemplate: "Invite template",
              seating: "Seating",
              music: "Music",
            }}
          />
          {plates ? (
            <PlateSummaryCard
              title="Plates"
              estimate={plates.estimate}
              confirmed={plates.confirmedHeads}
              considering={plates.consideringHeads}
              bufferGap={plates.bufferGap}
              byMeal={plates.byMeal}
            />
          ) : null}
          {data.myAccess.canViewBudget ? (
            <BudgetMeter
              title={t("nav.costGuide")}
              usedLabel={formatMoney(spent, currency)}
              remainingLabel={formatMoney(Math.max(0, data.budgetLkr - spent), currency)}
              percent={budgetPercent}
              categories={(data.budgetLines ?? []).slice(0, 5).map((line) => ({
                label: line.label,
                spent: formatMoney(line.spentLkr, currency),
                percent: data.budgetLkr ? Math.round((line.spentLkr / data.budgetLkr) * 100) : 0,
              }))}
            />
          ) : null}
          <TimelineRail
            title={t("hub.nextTasks")}
            items={(data.tasks ?? [])
              .filter((task) => task.status !== "DONE")
              .slice(0, 5)
              .map((task) => ({
                title: task.title,
                meta: task.category ?? "",
                status: task.status === "DONE" ? t("status.done") : t("status.pending"),
                intent: task.status === "DONE" ? ("success" as const) : ("warning" as const),
              }))}
          />
          <Button asChild variant="ghost" size="sm">
            <Link href="/planning/checklist">{t("hub.viewAll")}</Link>
          </Button>
          <SectionCard title={t("nav.messages")} delay={3}>
            {inquiries.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("knotly.noMessages")}</p>
            ) : (
              inquiries.slice(0, 4).map((item) => (
                <a
                  key={item.id}
                  href={item.whatsappUrl ?? "#"}
                  target={item.whatsappUrl ? "_blank" : undefined}
                  rel="noreferrer"
                  className="rounded-xl border border-border/60 px-3 py-2 text-sm hover:bg-secondary"
                >
                  <p className="font-medium">{item.vendorName ?? "Vendor"}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{item.message}</p>
                </a>
              ))
            )}
          </SectionCard>
        </DashboardSecondary>
      </DashboardMain>

      <Stagger className="grid grid-cols-2 gap-3 md:grid-cols-5 md:gap-4" stagger={0.04}>
        {INSPIRATION.map((item) => (
          <StaggerItem key={item.key}>
            <Link href={`/vendors?category=${item.key}`} className="group relative block overflow-hidden rounded-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.src}
                alt=""
                className="aspect-[4/3] w-full object-cover transition duration-700 group-hover:scale-105"
              />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2 text-xs text-white">
                {CATEGORY_LABELS[item.key] ?? item.key}
              </span>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>
    </DashboardStack>
  );
}
