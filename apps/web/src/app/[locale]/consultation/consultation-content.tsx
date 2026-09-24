"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  CalendarCheck,
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
import { Link } from "../../../i18n/navigation";

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
    new Intl.DateTimeFormat(locale, { timeZone: timezone, ...options }).formatToParts(new Date(iso)).map((part) => [
      part.type,
      part.value,
    ]),
  );
  return map as Record<string, string>;
}

export function ConsultationContent({
  availability,
  open,
  locale,
  contactEmail,
  whatsapp,
}: ConsultationContentProps) {
  const t = useTranslations();
  const timezone = availability.timezone;

  const openDays = useMemo(
    () => availability.days.filter((day) => day.slots.length > 0),
    [availability.days],
  );
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
      <main className="cw-section mx-auto max-w-2xl px-6 py-12">
        <Card className="rounded-3xl shadow-card">
          <div className="space-y-6 p-8">
            <div className="flex items-start gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-success/10 text-success">
                <CalendarCheck className="size-5" />
              </span>
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
      </main>
    );
  }

  if (!open || openDays.length === 0) {
    const whatsappDigits = (whatsapp ?? "").replace(/\D/g, "");
    return (
      <main className="cw-section mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="font-serif text-4xl font-medium leading-tight">{t("consultation.title")}</h1>
        <p className="mx-auto max-w-lg text-lg leading-relaxed text-muted-foreground">
          {open ? t("consultation.noSlotsAtAll") : t("consultation.closed")}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {contactEmail ? (
            <Button asChild shape="pill">
              <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
            </Button>
          ) : null}
          {whatsappDigits ? (
            <Button asChild variant="outline" shape="pill" iconLeft={MessageCircle}>
              <a href={`https://wa.me/${whatsappDigits}`} target="_blank" rel="noreferrer">
                WhatsApp
              </a>
            </Button>
          ) : null}
          <Button asChild variant="ghost" shape="pill">
            <Link href="/contact">{t("nav.contact")}</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="cw-section mx-auto max-w-6xl px-6 py-10 md:py-14">
      <header className="mx-auto max-w-2xl space-y-4 text-center">
        <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
          <Clock className="size-3.5" />
          {availability.intro.durationNote}
        </p>
        <h1 className="font-serif text-4xl font-medium leading-tight text-foreground md:text-5xl">
          {availability.intro.title || t("consultation.title")}
        </h1>
        <p className="text-lg leading-relaxed text-muted-foreground">
          {availability.intro.body || t("consultation.subtitle")}
        </p>
      </header>

      <form onSubmit={handleSubmit} className="grid items-start gap-6 lg:grid-cols-2">
        <Card className="rounded-3xl shadow-card">
          <div className="space-y-8 p-6 sm:p-8">
            <section className="space-y-3">
              <Label className="text-sm">{t("consultation.pickDay")}</Label>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-7">
                {openDays.map((day) => {
                  const tile = dateTile(day.date);
                  const active = day.date === selectedDate;
                  return (
                    <button
                      key={day.date}
                      type="button"
                      onClick={() => {
                        setSelectedDate(day.date);
                        setSlotKey("");
                      }}
                      className={cn(
                        "flex flex-col items-center rounded-2xl border px-2 py-3 transition-colors",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border/70 bg-background text-foreground hover:border-primary/40",
                      )}
                    >
                      <span className={cn("text-[11px] uppercase", active ? "opacity-80" : "text-muted-foreground")}>
                        {tile.weekday}
                      </span>
                      <span className="font-serif text-xl font-medium leading-none">{tile.day}</span>
                      <span className={cn("mt-1 text-[11px]", active ? "opacity-80" : "text-muted-foreground")}>
                        {tile.month}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-end justify-between gap-3">
                <Label className="text-sm">{t("consultation.pickTime")}</Label>
                <p className="text-xs text-muted-foreground">{t("consultation.timezoneNote")}</p>
              </div>
              {selectedDay && selectedDay.slots.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {selectedDay.slots.map((slot) => {
                    const active = slot.slotKey === slotKey;
                    return (
                      <button
                        key={slot.slotKey}
                        type="button"
                        onClick={() => setSlotKey(slot.slotKey)}
                        className={cn(
                          "rounded-2xl border px-3 py-3 text-sm font-medium transition-colors",
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border/70 bg-background text-foreground hover:border-primary/40",
                        )}
                      >
                        {timeLabel(slot.startsAt)}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t("consultation.noSlots")}</p>
              )}
            </section>

            <section className="space-y-3">
              <Label className="text-sm">{t("consultation.howLabel")}</Label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {availability.modes.map((option) => {
                  const OptionIcon = MODE_ICONS[option];
                  const active = option === mode;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setMode(option)}
                      className={cn(
                        "inline-flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-sm font-medium transition-colors",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border/70 bg-background text-foreground hover:border-primary/40",
                      )}
                    >
                      <OptionIcon className="size-4" />
                      {t(`consultation.${MODE_KEYS[option]}`)}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="space-y-3">
              <Label className="text-sm">{t("consultation.topicLabel")}</Label>
              <div className="flex flex-wrap gap-2">
                {TOPICS.map((option) => {
                  const active = option === topic;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setTopic(option)}
                      className={cn(
                        "rounded-full border px-3.5 py-2 text-sm transition-colors",
                        active
                          ? "border-primary bg-primary/10 font-medium text-foreground"
                          : "border-border/70 bg-background text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {t(`consultation.${TOPIC_KEYS[option]}`)}
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        </Card>

        <Card className="rounded-3xl shadow-card">
          <div className="space-y-5 p-6 sm:p-8">
            <div>
              <h2 className="font-serif text-2xl font-medium leading-tight text-foreground">
                {t("consultation.aboutYou")}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t("consultation.contactHint")}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="consultation-name">{t("consultation.name")}</Label>
              <Input
                id="consultation-name"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ayesha Perera"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
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
              <div className="space-y-2">
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

            {showDetails ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="consultation-wedding-date">{t("consultation.weddingDate")}</Label>
                  <Input
                    id="consultation-wedding-date"
                    type="date"
                    value={weddingDate}
                    onChange={(event) => setWeddingDate(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="consultation-city">{t("consultation.city")}</Label>
                  <Input
                    id="consultation-city"
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="consultation-guests">{t("consultation.guestCount")}</Label>
                  <Input
                    id="consultation-guests"
                    type="number"
                    min={1}
                    value={guestCount}
                    onChange={(event) => setGuestCount(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="consultation-budget">{t("consultation.budget")}</Label>
                  <Input
                    id="consultation-budget"
                    type="number"
                    min={0}
                    value={budget}
                    onChange={(event) => setBudget(event.target.value)}
                  />
                </div>
              </div>
            ) : (
              <Button type="button" variant="ghost" size="sm" shape="pill" onClick={() => setShowDetails(true)}>
                + {t("consultation.moreDetails")}
              </Button>
            )}

            <div className="space-y-2">
              <Label htmlFor="consultation-message">{t("consultation.message")}</Label>
              <Textarea
                id="consultation-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder={t("consultation.messagePlaceholder")}
                className="min-h-[110px]"
              />
            </div>

            {selectedSlot ? (
              <FormStatus tone="muted">{fullLabel(selectedSlot.startsAt)}</FormStatus>
            ) : (
              <p className="text-sm text-muted-foreground">{t("consultation.pickTime")}</p>
            )}
            {error ? <FormStatus tone="destructive">{error}</FormStatus> : null}

            <Button type="submit" className="w-full" shape="pill" size="lg" disabled={saving || !selectedSlot}>
              {saving ? t("consultation.submitting") : t("consultation.submit")}
            </Button>
            <Button asChild variant="ghost" size="sm" shape="pill" className="w-full">
              <Link href="/contact">
                <ArrowLeft className="size-3.5" />
                {t("nav.contact")}
              </Link>
            </Button>
          </div>
        </Card>
      </form>
    </main>
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
