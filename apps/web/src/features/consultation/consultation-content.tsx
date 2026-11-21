"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CalendarCheck,
  CalendarClock,
  CalendarPlus,
  Clock,
  MessageCircle,
  Phone,
  Video,
  Users,
} from "lucide-react";
import { api } from "@ceylonweddings/web";
import type {
  ConsultationAvailability,
  ConsultationMode,
  ConsultationTopic,
  PublicConsultation,
} from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import { Card } from "@ceylonweddings/ui/components/card";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { Input } from "@ceylonweddings/ui/components/input";
import { Label } from "@ceylonweddings/ui/components/label";
import { Textarea } from "@ceylonweddings/ui/components/textarea";
import { cn } from "@ceylonweddings/ui/utils";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PageHero } from "@/components/page-hero";
import { AnimatePresence, Reveal, motion, useReducedMotion } from "@ceylonweddings/ui/domain/motion";
import { WEDDING_IMAGES } from "@/lib/wedding-images";

const MODE_ICONS = {
  VIDEO: Video,
  PHONE: Phone,
  WHATSAPP: MessageCircle,
  IN_PERSON: Users,
} as const;

const TOPICS: ConsultationTopic[] = [
  "GETTING_STARTED",
  "VENDORS",
  "BUDGET",
  "VENUE",
  "PLATFORM_HELP",
  "VENDOR_ONBOARDING",
  "OTHER",
];

const MODE_KEYS: Record<ConsultationMode, string> = {
  VIDEO: "modeVideo",
  PHONE: "modePhone",
  WHATSAPP: "modeWhatsapp",
  IN_PERSON: "modeInPerson",
};

const TOPIC_KEYS: Record<ConsultationTopic, string> = {
  GETTING_STARTED: "topicGettingStarted",
  VENDORS: "topicVendors",
  BUDGET: "topicBudget",
  VENUE: "topicVenue",
  PLATFORM_HELP: "topicPlatformHelp",
  VENDOR_ONBOARDING: "topicVendorOnboarding",
  OTHER: "topicOther",
};

export type ConsultationContentProps = {
  availability: ConsultationAvailability;
  open: boolean;
  locale: string;
  contactEmail?: string;
  whatsapp?: string;
};

function partsInZone(iso: string, locale: string, timezone: string, options: Intl.DateTimeFormatOptions) {
  const map = Object.fromEntries(
    new Intl.DateTimeFormat(locale, { timeZone: timezone, ...options })
      .formatToParts(new Date(iso))
      .map((part) => [part.type, part.value]),
  );
  return map as Record<string, string>;
}

export function ConsultationContent({ availability, open, locale, contactEmail, whatsapp }: ConsultationContentProps) {
  const t = useTranslations();
  const reduce = useReducedMotion();
  const timezone = availability.timezone;

  const openDays = useMemo(() => availability.days.filter((day) => day.slots.length > 0), [availability.days]);
  const [selectedDate, setSelectedDate] = useState(openDays[0]?.date ?? "");
  const [slotKey, setSlotKey] = useState("");
  const [mode, setMode] = useState<ConsultationMode>(availability.modes[0] ?? "VIDEO");
  const [topic, setTopic] = useState<ConsultationTopic>("GETTING_STARTED");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [weddingDate, setWeddingDate] = useState("");
  const [city, setCity] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [budget, setBudget] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [booked, setBooked] = useState<PublicConsultation | null>(null);

  const selectedDay = openDays.find((day) => day.date === selectedDate);
  const selectedSlot = selectedDay?.slots.find((slot) => slot.slotKey === slotKey);

  const dateTile = (date: string) => {
    const parts = partsInZone(`${date}T06:00:00.000Z`, locale, timezone, {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
    return { weekday: parts.weekday ?? "", day: parts.day ?? "", month: parts.month ?? "" };
  };

  const timeLabel = (iso: string) => {
    const parts = partsInZone(iso, locale, timezone, { hour: "numeric", minute: "2-digit", hourCycle: "h12" });
    return `${parts.hour}:${parts.minute} ${parts.dayPeriod}`.replace(/\s+/g, " ").trim();
  };

  const slotGroups = <T extends { startsAt: string }>(slots: T[]) => {
    const groups: { label: string; slots: T[] }[] = [
      { label: "Morning", slots: [] },
      { label: "Afternoon", slots: [] },
      { label: "Evening", slots: [] },
    ];
    for (const slot of slots) {
      const hour = Number(partsInZone(slot.startsAt, "en-GB", timezone, { hour: "numeric", hourCycle: "h23" }).hour);
      groups[hour < 12 ? 0 : hour < 17 ? 1 : 2]!.slots.push(slot);
    }
    return groups.filter((group) => group.slots.length);
  };

  const fullLabel = (iso: string) =>
    new Intl.DateTimeFormat(locale, {
      timeZone: timezone,
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!selectedSlot) {
      setError(t("consultation.pickTime"));
      return;
    }
    setSaving(true);
    setError("");
    try {
      const result = await api.consultations.book({
        startsAt: selectedSlot.startsAt,
        mode,
        topic,
        name,
        email: email || undefined,
        phone: phone || undefined,
        locale,
        message: message || undefined,
        weddingDate: weddingDate || undefined,
        city: city || undefined,
        guestCount: guestCount ? Number(guestCount) : undefined,
        budgetLkr: budget ? Number(budget) : undefined,
        source: "consultation-page",
      });
      setBooked(result);
    } catch (bookError) {
      setError((bookError as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (booked) {
    const pending = booked.status === "PENDING";
    return (
      <div className="pb-20">
        <PageHero
          image={1}
          align="center"
          icon={<CalendarCheck className="size-6" />}
          eyebrow={booked.reference}
          title={pending ? t("consultation.pendingTitle") : t("consultation.bookedTitle")}
          sub={pending ? t("consultation.pendingBody") : t("consultation.bookedBody")}
        />
        <main className="mx-auto max-w-2xl px-6 py-14">
          <Reveal>
            <Card className="rounded-3xl shadow-raised">
              <div className="space-y-6 p-8">
                <div className="flex items-start gap-4">
                  <motion.span
                    initial={reduce ? false : { scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.2 }}
                    className="grid size-12 shrink-0 place-items-center rounded-full bg-success text-success-foreground shadow-md"
                  >
                    <CalendarCheck className="size-5" />
                  </motion.span>
                  <div className="space-y-1">
                    <h1 className="font-serif text-3xl font-medium leading-tight text-foreground">
                      {pending ? t("consultation.pendingTitle") : t("consultation.bookedTitle")}
                    </h1>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {pending ? t("consultation.pendingBody") : t("consultation.bookedBody")}
                    </p>
                  </div>
                </div>
                <dl className="grid gap-3 rounded-2xl bg-muted/50 p-5 text-sm">
                  <SummaryRow label={t("consultation.when")} value={fullLabel(booked.startsAt)} />
                  <SummaryRow label={t("consultation.format")} value={t(`consultation.${MODE_KEYS[booked.mode]}`)} />
                  <SummaryRow label={t("consultation.topic")} value={t(`consultation.${TOPIC_KEYS[booked.topic]}`)} />
                  <SummaryRow label={t("consultation.reference")} value={booked.reference} />
                </dl>
                <p className="text-xs leading-relaxed text-muted-foreground">{t("consultation.timezoneNote")}</p>
                <div className="flex flex-wrap gap-3">
                  <Button asChild shape="pill" iconLeft={CalendarPlus}>
                    <a href={api.consultations.icsUrl(booked.manageToken)}>{t("consultation.addToCalendar")}</a>
                  </Button>
                  {booked.meetingUrl ? (
                    <Button asChild variant="outline" shape="pill" iconLeft={Video}>
                      <a href={booked.meetingUrl} target="_blank" rel="noreferrer">
                        {t("consultation.joinCall")}
                      </a>
                    </Button>
                  ) : null}
                  <Button asChild variant="ghost" shape="pill">
                    <Link href={`/consultation/${booked.manageToken}`}>{t("consultation.manageBooking")}</Link>
                  </Button>
                </div>
              </div>
            </Card>
          </Reveal>
        </main>
      </div>
    );
  }

  if (!open || openDays.length === 0) {
    const whatsappDigits = (whatsapp ?? "").replace(/\D/g, "");
    return (
      <div className="pb-20">
        <PageHero
          image={3}
          align="center"
          icon={<CalendarClock className="size-6" />}
          eyebrow={t("nav.consultation")}
          title={t("consultation.title")}
          sub={open ? t("consultation.noSlotsAtAll") : t("consultation.closed")}
        >
          <div className="flex flex-wrap justify-center gap-3">
            {contactEmail ? (
              <Button asChild shape="pill">
                <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
              </Button>
            ) : null}
            {whatsappDigits ? (
              <Button
                asChild
                variant="outline"
                shape="pill"
                iconLeft={MessageCircle}
                className="border-paper/40 bg-transparent text-paper hover:bg-paper/10 hover:text-paper"
              >
                <a href={`https://wa.me/${whatsappDigits}`} target="_blank" rel="noreferrer">
                  WhatsApp
                </a>
              </Button>
            ) : null}
            <Button asChild variant="ghost" shape="pill" className="text-paper hover:bg-paper/10 hover:text-paper">
              <Link href="/contact">{t("nav.contact")}</Link>
            </Button>
          </div>
        </PageHero>
      </div>
    );
  }

  return (
    <div className="pb-20">
      <PageHero
        image={3}
        icon={<CalendarClock className="size-6" />}
        eyebrow={
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5" />
            {availability.intro.durationNote}
          </span>
        }
        title={availability.intro.title || t("consultation.title")}
        sub={availability.intro.body || t("consultation.subtitle")}
      />
      <main className="mx-auto w-full max-w-6xl px-6 py-14">
        <form onSubmit={handleSubmit} className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
          <div className="grid min-w-0 gap-12">
            {/* Step 1 — when */}
            <Reveal className="grid gap-5">
              <StepHeading n={1} title={t("consultation.pickDay")} />
              <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]">
                {openDays.map((day) => {
                  const tile = dateTile(day.date);
                  const active = day.date === selectedDate;
                  return (
                    <motion.button
                      key={day.date}
                      type="button"
                      whileTap={reduce ? undefined : { scale: 0.94 }}
                      onClick={() => {
                        setSelectedDate(day.date);
                        setSlotKey("");
                      }}
                      className={cn(
                        "relative isolate flex w-16 shrink-0 snap-start flex-col items-center rounded-2xl py-3 transition-colors",
                        active
                          ? "text-primary-foreground"
                          : "bg-card text-foreground ring-1 ring-border hover:ring-primary/40",
                      )}
                    >
                      {active ? (
                        <motion.span
                          layoutId="consult-day"
                          className="absolute inset-0 -z-10 rounded-2xl bg-primary shadow-md"
                          transition={{ type: "spring", stiffness: 420, damping: 34 }}
                        />
                      ) : null}
                      <span className={cn("text-label uppercase", active ? "opacity-80" : "text-muted-foreground")}>
                        {tile.weekday}
                      </span>
                      <span className="font-serif text-2xl leading-none">{tile.day}</span>
                      <span className={cn("mt-0.5 text-label", active ? "opacity-80" : "text-muted-foreground")}>
                        {tile.month}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-end justify-between gap-2">
                <p className="text-sm font-medium">{t("consultation.pickTime")}</p>
                <p className="text-xs text-muted-foreground">{t("consultation.timezoneNote")}</p>
              </div>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={selectedDate}
                  initial={reduce ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                  className="grid gap-4"
                >
                  {selectedDay && selectedDay.slots.length > 0 ? (
                    slotGroups(selectedDay.slots).map((group) => (
                      <div key={group.label} className="grid gap-2 sm:grid-cols-[6rem_1fr] sm:items-start">
                        <p className="pt-2 text-xs text-muted-foreground">{group.label}</p>
                        <div className="flex flex-wrap gap-2">
                          {group.slots.map((slot) => {
                            const active = slot.slotKey === slotKey;
                            return (
                              <motion.button
                                key={slot.slotKey}
                                type="button"
                                whileTap={reduce ? undefined : { scale: 0.94 }}
                                onClick={() => setSlotKey(slot.slotKey)}
                                className={cn(
                                  "relative isolate h-10 rounded-full px-4 text-sm tabular-nums transition-colors",
                                  active
                                    ? "text-primary-foreground"
                                    : "bg-card text-foreground ring-1 ring-border hover:ring-primary/40",
                                )}
                              >
                                {active ? (
                                  <motion.span
                                    layoutId="consult-slot"
                                    className="absolute inset-0 -z-10 rounded-full bg-primary shadow-md"
                                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                                  />
                                ) : null}
                                {timeLabel(slot.startsAt)}
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">{t("consultation.noSlots")}</p>
                  )}
                </motion.div>
              </AnimatePresence>
            </Reveal>

            {/* Step 2 — how */}
            <Reveal className="grid gap-5">
              <StepHeading n={2} title={t("consultation.howLabel")} />
              <div className="inline-flex w-fit flex-wrap gap-1 rounded-full bg-card p-1 ring-1 ring-border">
                {availability.modes.map((option) => {
                  const OptionIcon = MODE_ICONS[option];
                  const active = option === mode;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setMode(option)}
                      className={cn(
                        "relative isolate inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm transition-colors",
                        active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {active ? (
                        <motion.span
                          layoutId="consult-mode"
                          className="absolute inset-0 -z-10 rounded-full bg-primary shadow-md"
                          transition={{ type: "spring", stiffness: 420, damping: 34 }}
                        />
                      ) : null}
                      <OptionIcon className="size-4" />
                      {t(`consultation.${MODE_KEYS[option]}`)}
                    </button>
                  );
                })}
              </div>
              <p className="text-sm font-medium">{t("consultation.topicLabel")}</p>
              <div className="flex flex-wrap gap-2">
                {TOPICS.map((option) => {
                  const active = option === topic;
                  return (
                    <motion.button
                      key={option}
                      type="button"
                      whileTap={reduce ? undefined : { scale: 0.95 }}
                      onClick={() => setTopic(option)}
                      className={cn(
                        "inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm transition-colors",
                        active
                          ? "bg-primary/10 text-primary ring-1 ring-primary/40"
                          : "bg-card text-muted-foreground ring-1 ring-border hover:text-foreground",
                      )}
                    >
                      {active ? <Check className="size-3.5" /> : null}
                      {t(`consultation.${TOPIC_KEYS[option]}`)}
                    </motion.button>
                  );
                })}
              </div>
            </Reveal>

            {/* Step 3 — about you */}
            <Reveal className="grid gap-5">
              <StepHeading n={3} title={t("consultation.aboutYou")} sub={t("consultation.contactHint")} />
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="consultation-name">{t("consultation.name")}</Label>
                  <Input
                    id="consultation-name"
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Ayesha Perera"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="consultation-email">{t("consultation.email")}</Label>
                  <Input
                    id="consultation-email"
                    type="email"
                    inputMode="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@email.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="consultation-phone">{t("consultation.phone")}</Label>
                  <Input
                    id="consultation-phone"
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="+94 77 123 4567"
                  />
                </div>
              </div>

              <AnimatePresence initial={false}>
                {showDetails ? (
                  <motion.div
                    initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="grid gap-4 overflow-hidden sm:grid-cols-4"
                  >
                    <div className="grid gap-2">
                      <Label htmlFor="consultation-wedding-date">{t("consultation.weddingDate")}</Label>
                      <Input
                        id="consultation-wedding-date"
                        type="date"
                        value={weddingDate}
                        onChange={(event) => setWeddingDate(event.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="consultation-city">{t("consultation.city")}</Label>
                      <Input id="consultation-city" value={city} onChange={(event) => setCity(event.target.value)} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="consultation-guests">{t("consultation.guestCount")}</Label>
                      <Input
                        id="consultation-guests"
                        type="number"
                        min={1}
                        value={guestCount}
                        onChange={(event) => setGuestCount(event.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="consultation-budget">{t("consultation.budget")}</Label>
                      <Input
                        id="consultation-budget"
                        type="number"
                        min={0}
                        value={budget}
                        onChange={(event) => setBudget(event.target.value)}
                      />
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
              {!showDetails ? (
                <button
                  type="button"
                  onClick={() => setShowDetails(true)}
                  className="w-fit text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  + {t("consultation.moreDetails")}
                </button>
              ) : null}

              <div className="grid gap-2">
                <Label htmlFor="consultation-message">{t("consultation.message")}</Label>
                <Textarea
                  id="consultation-message"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder={t("consultation.messagePlaceholder")}
                  className="min-h-28"
                />
              </div>
            </Reveal>
          </div>

          {/* Summary */}
          <aside className="lg:sticky lg:top-24">
            <Reveal delay={0.1}>
              <div className="relative overflow-hidden rounded-3xl bg-ink text-paper shadow-raised">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={WEDDING_IMAGES[3]}
                  alt=""
                  aria-hidden
                  className="absolute inset-0 size-full object-cover opacity-25"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-ink/40 to-ink/90" />
                <div className="relative grid gap-5 p-6">
                  <p className="text-label tracking-eyebrow text-paper/70 uppercase">Your call</p>
                  <dl className="grid gap-3 text-sm">
                    <SummaryLine
                      icon={CalendarClock}
                      label={t("consultation.when")}
                      value={selectedSlot ? fullLabel(selectedSlot.startsAt) : t("consultation.pickTime")}
                      muted={!selectedSlot}
                    />
                    <SummaryLine
                      icon={MODE_ICONS[mode]}
                      label={t("consultation.format")}
                      value={t(`consultation.${MODE_KEYS[mode]}`)}
                    />
                    <SummaryLine
                      icon={MessageCircle}
                      label={t("consultation.topic")}
                      value={t(`consultation.${TOPIC_KEYS[topic]}`)}
                    />
                  </dl>
                  {error ? <FormStatus tone="destructive">{error}</FormStatus> : null}
                  <Button
                    type="submit"
                    shape="pill"
                    size="lg"
                    className="group w-full"
                    disabled={saving || !selectedSlot}
                  >
                    <span className="inline-flex items-center gap-2">
                      {saving ? t("consultation.submitting") : t("consultation.submit")}
                      {saving ? null : <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />}
                    </span>
                  </Button>
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center gap-1.5 text-sm text-paper/75 hover:text-paper"
                  >
                    <ArrowLeft className="size-3.5" />
                    {t("nav.contact")}
                  </Link>
                </div>
              </div>
            </Reveal>
          </aside>
        </form>
      </main>
    </div>
  );
}

function StepHeading({ n, title, sub }: { n: number; title: string; sub?: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-medium text-primary">
        {n}
      </span>
      <div>
        <h2 className="font-serif text-2xl leading-tight font-medium">{title}</h2>
        {sub ? <p className="mt-0.5 text-sm text-muted-foreground">{sub}</p> : null}
      </div>
    </div>
  );
}

function SummaryLine({
  icon: LineIcon,
  label,
  value,
  muted,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-paper/10">
        <LineIcon className="size-4" />
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-paper/60">{label}</dt>
        <AnimatePresence mode="wait" initial={false}>
          <motion.dd
            key={value}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className={cn("font-medium", muted && "text-paper/60")}
          >
            {value}
          </motion.dd>
        </AnimatePresence>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}
