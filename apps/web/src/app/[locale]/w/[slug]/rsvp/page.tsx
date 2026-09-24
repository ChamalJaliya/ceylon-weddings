"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { api } from "@ceylonweddings/web";
import type { PublicWebsite } from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { Input } from "@ceylonweddings/ui/components/input";
import { RadioGroup } from "@ceylonweddings/ui/components/radio";
import { FieldBlock, FormGrid, FormPanel } from "@ceylonweddings/ui/domain/creator-form";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";

type EventRsvp = "CONFIRMED" | "DECLINED" | "MAYBE";

export default function PublicRsvpPage() {
  const t = useTranslations();
  const params = useParams<{ slug: string }>();
  const [site, setSite] = useState<PublicWebsite | null>(null);
  const [headName, setHeadName] = useState("");
  const [plusCount, setPlusCount] = useState(0);
  const [meal, setMeal] = useState<"VEG" | "FISH" | "CHICKEN" | "HALAL">("FISH");
  const [eventStatus, setEventStatus] = useState<Record<string, EventRsvp>>({});
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.public
      .wedding(params.slug)
      .then((wedding) => {
        setSite(wedding);
        setEventStatus(Object.fromEntries(wedding.events.map((event) => [event.id, "CONFIRMED" as EventRsvp])));
      })
      .catch((err: Error) => setError(err.message));
  }, [params.slug]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await api.public.rsvp(params.slug, {
        headName,
        plusCount,
        meal,
        events: Object.entries(eventStatus).map(([eventId, status]) => ({ eventId, status })),
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "RSVP failed");
    }
  }

  if (done) {
    return (
      <SectionCard title={t("planning.rsvpThanks")}>
        <p className="text-sm text-muted-foreground">{t("planning.rsvpSaved")}</p>
      </SectionCard>
    );
  }

  return (
    <div className="grid gap-6">
      <PageHeader title={t("planning.rsvpTitle")} />
      <form onSubmit={onSubmit}>
        <FormPanel>
          <FormGrid cols={2}>
            <FieldBlock label={t("planning.headName")}>
              <Input value={headName} onChange={(e) => setHeadName(e.target.value)} required />
            </FieldBlock>
            <FieldBlock label={t("planning.plusCount")}>
              <Input type="number" min={0} value={plusCount} onChange={(e) => setPlusCount(Number(e.target.value))} />
            </FieldBlock>
          </FormGrid>
          <FieldBlock label={t("planning.rsvpPerEvent")}>
            <div className="grid gap-3">
              {(site?.events ?? []).map((item) => (
                <div
                  key={item.id}
                  className="grid gap-2.5 rounded-2xl border border-border/70 bg-muted/25 px-3.5 py-3"
                >
                  <span className="text-sm font-medium">
                    {item.name}
                    {item.venueName ? (
                      <span className="font-normal text-muted-foreground">{` · ${item.venueName}`}</span>
                    ) : null}
                  </span>
                  <RadioGroup
                    value={eventStatus[item.id] ?? "CONFIRMED"}
                    onValueChange={(value) =>
                      setEventStatus((current) => ({ ...current, [item.id]: value as EventRsvp }))
                    }
                    orientation="horizontal"
                    options={[
                      { value: "CONFIRMED", label: t("planning.yes") },
                      { value: "MAYBE", label: t("planning.maybe") },
                      { value: "DECLINED", label: t("planning.no") },
                    ]}
                  />
                </div>
              ))}
            </div>
          </FieldBlock>
          <FieldBlock label={t("planning.meal")}>
            <RadioGroup
              value={meal}
              onValueChange={(value) => setMeal(value as typeof meal)}
              options={[
                { value: "VEG", label: "Vegetarian" },
                { value: "FISH", label: "Fish" },
                { value: "CHICKEN", label: "Chicken" },
                { value: "HALAL", label: "Halal" },
              ]}
            />
          </FieldBlock>
          {error ? <FormStatus tone="destructive">{error}</FormStatus> : null}
          <Button type="submit">{t("planning.sendRsvp")}</Button>
        </FormPanel>
      </form>
    </div>
  );
}
