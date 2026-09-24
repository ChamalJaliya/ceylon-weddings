"use client";

import { useEffect, useState } from "react";
import { CalendarPlus, Video } from "lucide-react";
import { api } from "@ceylonweddings/web";
import type { ConsultationMode, ConsultationTopic, PublicConsultation } from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import { Card } from "@ceylonweddings/ui/components/card";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { useTranslations } from "next-intl";
import { Link } from "../../../../i18n/navigation";

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

const STATUS_KEYS: Record<PublicConsultation["status"], string> = {
  PENDING: "statusPending",
  CONFIRMED: "statusConfirmed",
  COMPLETED: "statusCompleted",
  CANCELLED: "statusCancelled",
  NO_SHOW: "statusNoShow",
};

export function ManageConsultation({ token, locale }: { token: string; locale: string }) {
  const t = useTranslations();
  const [booking, setBooking] = useState<PublicConsultation | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    void api.consultations
      .byToken(token)
      .then(setBooking)
      .catch(() => setError(t("consultation.notFound")))
      .finally(() => setLoading(false));
  }, [token, t]);

  async function handleCancel() {
    if (!window.confirm(t("consultation.cancelConfirm"))) return;
    setCancelling(true);
    setError("");
    try {
      setBooking(await api.consultations.cancel(token));
    } catch (cancelError) {
      setError((cancelError as Error).message);
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16 text-center text-sm text-muted-foreground">
        {t("consultation.loading")}
      </main>
    );
  }

  if (!booking) {
    return (
      <main className="cw-section mx-auto max-w-xl px-6 py-16 text-center">
        <h1 className="font-serif text-3xl font-medium leading-tight">{t("consultation.manageTitle")}</h1>
        <p className="text-muted-foreground">{error || t("consultation.notFound")}</p>
        <Button asChild shape="pill">
          <Link href="/consultation">{t("consultation.bookAnother")}</Link>
        </Button>
      </main>
    );
  }

  const cancelled = booking.status === "CANCELLED";
  const when = new Intl.DateTimeFormat(locale, {
    timeZone: booking.timezone,
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(booking.startsAt));

  return (
    <main className="cw-section mx-auto max-w-xl px-6 py-12">
      <Card className="rounded-3xl shadow-card">
        <div className="space-y-6 p-8">
          <div className="space-y-2">
            <h1 className="font-serif text-3xl font-medium leading-tight text-foreground">
              {cancelled ? t("consultation.cancelledTitle") : t("consultation.manageTitle")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {cancelled ? t("consultation.cancelledBody") : t("consultation.timezoneNote")}
            </p>
          </div>

          <dl className="grid gap-3 rounded-2xl bg-muted/40 p-5 text-sm">
            <Row label={t("consultation.when")} value={when} />
            <Row label={t("consultation.format")} value={t(`consultation.${MODE_KEYS[booking.mode]}`)} />
            <Row label={t("consultation.topic")} value={t(`consultation.${TOPIC_KEYS[booking.topic]}`)} />
            <Row label={t("consultation.reference")} value={booking.reference} />
            <Row
              label={t("consultation.statusLabel")}
              value={t(`consultation.${STATUS_KEYS[booking.status]}`)}
            />
          </dl>

          {error ? <FormStatus tone="destructive">{error}</FormStatus> : null}

          <div className="flex flex-wrap gap-3">
            {cancelled ? (
              <Button asChild shape="pill">
                <Link href="/consultation">{t("consultation.bookAnother")}</Link>
              </Button>
            ) : (
              <>
                <Button asChild shape="pill" iconLeft={CalendarPlus}>
                  <a href={api.consultations.icsUrl(booking.manageToken)}>
                    {t("consultation.addToCalendar")}
                  </a>
                </Button>
                {booking.meetingUrl ? (
                  <Button asChild variant="outline" shape="pill" iconLeft={Video}>
                    <a href={booking.meetingUrl} target="_blank" rel="noreferrer">
                      {t("consultation.joinCall")}
                    </a>
                  </Button>
                ) : null}
                <Button
                  variant="ghost"
                  shape="pill"
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="text-destructive"
                >
                  {cancelling ? t("consultation.cancelling") : t("consultation.cancel")}
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}
