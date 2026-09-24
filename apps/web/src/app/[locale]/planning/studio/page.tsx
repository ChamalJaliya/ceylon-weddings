"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { api, formatMoney, usePreferenceStore } from "@ceylonweddings/web";
import {
  eventKindSchema,
  formatWeddingDateLabel,
  payerSchema,
  renderInviteTemplate,
  weddingStyleSchema,
  weddingTypeSchema,
  type Event,
  type EventKind,
  type InviteTemplate,
  type Payer,
  type WeddingStyle,
} from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import { CheckboxField } from "@ceylonweddings/ui/components/checkbox";
import { DatePicker, DateTimePicker } from "@ceylonweddings/ui/components/date-picker";
import { Input } from "@ceylonweddings/ui/components/input";
import { SimpleSelect } from "@ceylonweddings/ui/components/select";
import { Switch } from "@ceylonweddings/ui/components/switch";
import {
  CompletenessChecklist,
  CreatorSectionNav,
  FieldBlock,
  FormSection,
  StickyActionBar,
  StudioShell,
  TagInput,
} from "@ceylonweddings/ui/domain/creator-form";
import {
  EventCeremonyCard,
  ShareInvitePanel,
  StyleStoryPicker,
  WeddingSitePreview,
} from "@ceylonweddings/ui/domain/wedding-presentation";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { PlaceFields } from "../../../../components/place-fields";
import { Link } from "../../../../i18n/navigation";
import { SignInPrompt, useWedding } from "../../../../components/use-wedding";
import { CATEGORY_LABELS } from "../../../../lib/labels";

const fieldClass = "h-11 rounded-xl border-border/80 bg-background/70";
const areaClass =
  "min-h-28 w-full rounded-xl border border-border/80 bg-background/70 px-3 py-2.5 text-sm leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring";

type Section = "basics" | "style" | "events" | "website" | "family" | "publish";

const STYLE_OPTIONS: Array<{ value: WeddingStyle; label: string; swatches: string[] }> = [
  { value: "MINIMALIST", label: "Minimalist", swatches: ["#F7F3EC", "#D9D2C5", "#2F2F2F", "#9A9488", "#E8E2D6"] },
  { value: "TRADITIONAL", label: "Traditional", swatches: ["#7A1F2B", "#C4A574", "#F4E4D0", "#1F4D3A", "#E8D5B5"] },
  { value: "KANDYAN", label: "Kandyan", swatches: ["#C4A574", "#F4E4D0", "#7A1F2B", "#1F4D3A", "#E8D5B5"] },
  { value: "MODERN", label: "Modern", swatches: ["#1F4B73", "#D7E6F5", "#0F172A", "#94A3B8", "#F8FAFC"] },
  { value: "BEACH", label: "Beach", swatches: ["#0F766E", "#F4E1C1", "#155E75", "#F8FAFC", "#67E8F9"] },
];

const HERO =
  "https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&q=80";

function toDatetimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromDatetimeLocal(value: string) {
  return value ? new Date(value).toISOString() : null;
}

const COMPLETE_LABELS: Record<string, string> = {
  partners: "Partner names",
  date: "Wedding date",
  city: "City",
  events: "Ceremony with time",
  guests: "Guest estimate",
  budget: "Budget",
  website: "Website FAQ & travel",
  family: "Family invite (overseas)",
  inviteTemplate: "Invite WhatsApp template",
  seating: "Seating for guest events",
};

export default function WeddingStudioPage() {
  const t = useTranslations();
  const currency = usePreferenceStore((state) => state.currency);
  const { data, error, reload } = useWedding();
  const [section, setSection] = useState<Section>("basics");
  const [status, setStatus] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [defaultTemplate, setDefaultTemplate] = useState<InviteTemplate | null>(null);
  const [form, setForm] = useState({
    partnerOneName: "",
    partnerTwoName: "",
    date: "",
    city: "",
    district: "",
    guestCountEstimate: 150,
    budgetLkr: 2500000,
    payer: "COUPLE" as Payer,
    planningFromOverseas: false,
    types: [] as string[],
    style: "KANDYAN" as WeddingStyle,
    styleNotes: "",
    settingNotes: "",
    colors: [] as string[],
    websiteEnabled: true,
    websiteFaq: "",
    travelNotes: "",
  });
  const [eventDrafts, setEventDrafts] = useState<Event[]>([]);
  const [eventForm, setEventForm] = useState({
    kind: "PORUWA" as EventKind,
    name: "",
    venueName: "",
    startsAt: "",
    nekathAt: "",
  });
  const [invite, setInvite] = useState({ email: "", name: "", canEditGuests: true, canViewBudget: true, canManageVendors: false });

  useEffect(() => {
    if (!data) return;
    setForm({
      partnerOneName: data.partnerOneName,
      partnerTwoName: data.partnerTwoName,
      date: data.date ? data.date.slice(0, 10) : "",
      city: data.city ?? "",
      district: data.district ?? "",
      guestCountEstimate: data.guestCountEstimate,
      budgetLkr: data.budgetLkr,
      payer: data.payer,
      planningFromOverseas: data.planningFromOverseas,
      types: data.types,
      style: data.style,
      styleNotes: data.styleNotes ?? "",
      settingNotes: data.settingNotes ?? "",
      colors: data.colors,
      websiteEnabled: data.websiteEnabled,
      websiteFaq: data.websiteFaq ?? "",
      travelNotes: data.travelNotes ?? "",
    });
    setEventDrafts(data.events ?? []);
  }, [data]);

  useEffect(() => {
    api.wedding
      .inviteTemplates()
      .then((rows) => setDefaultTemplate(rows.find((r) => r.isDefault) ?? rows[0] ?? null))
      .catch(() => setDefaultTemplate(null));
  }, []);

  const siteUrl = useMemo(() => {
    if (!data) return "";
    if (typeof window === "undefined") return `/w/${data.slug}`;
    return `${window.location.origin}/w/${data.slug}`;
  }, [data]);

  const shareWhatsappUrl = useMemo(() => {
    if (!data) return "https://wa.me/";
    const primary = data.events?.[0];
    const message = defaultTemplate
      ? renderInviteTemplate(defaultTemplate.body, {
          partnerOne: data.partnerOneName,
          partnerTwo: data.partnerTwoName,
          eventName: primary?.name ?? "our wedding",
          date: formatWeddingDateLabel(data.date) ?? "",
          venue: primary?.venueName ?? data.city ?? "",
          rsvpUrl: `${siteUrl}/rsvp`,
          guestName: "friend",
        })
      : `You're invited — ${siteUrl}`;
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  }, [data, defaultTemplate, siteUrl]);

  if (!data) return <SignInPrompt error={error} />;

  const completeness = data.completeness ?? { score: 0, total: 8, ready: false, missing: [] };
  const bookedTeam = data.team.filter((item) => item.status === "BOOKED");

  const sections = [
    { id: "basics" as const, label: "Basics", done: Boolean(form.partnerOneName && form.partnerTwoName && form.city) },
    { id: "style" as const, label: "Style", done: Boolean(form.style) },
    { id: "events" as const, label: "Events", done: eventDrafts.some((event) => Boolean(event.startsAt)) },
    { id: "website" as const, label: "Website", done: Boolean(form.websiteFaq && form.travelNotes) },
    { id: "family" as const, label: "Family", done: (data.members ?? []).some((m) => m.role === "FAMILY") },
    { id: "publish" as const, label: "Publish", done: completeness.ready },
  ];

  async function saveBasics(event: FormEvent) {
    event.preventDefault();
    setStatus(null);
    const typesChanged = [...form.types].sort().join() !== [...data!.types].sort().join();
    let seedMissingTasks = false;
    if (typesChanged) {
      seedMissingTasks = (data!.tasks ?? []).length === 0 || window.confirm(t("planning.seedTasksConfirm"));
    }
    await api.wedding.update({
      partnerOneName: form.partnerOneName,
      partnerTwoName: form.partnerTwoName,
      date: form.date ? new Date(form.date).toISOString() : null,
      city: form.city,
      district: form.district,
      guestCountEstimate: form.guestCountEstimate,
      budgetLkr: data!.myAccess.canViewBudget ? form.budgetLkr : undefined,
      payer: data!.myAccess.canViewBudget ? form.payer : undefined,
      planningFromOverseas: form.planningFromOverseas,
      types: form.types as never,
      seedMissingTasks,
      style: form.style,
      styleNotes: form.styleNotes || null,
      settingNotes: form.settingNotes || null,
      colors: form.colors,
      websiteEnabled: form.websiteEnabled,
      websiteFaq: form.websiteFaq || null,
      travelNotes: form.travelNotes || null,
    });
    setStatus(t("planning.saved"));
    await reload();
  }

  async function addEvent() {
    await api.wedding.createEvent({
      kind: eventForm.kind,
      name: eventForm.name,
      venueName: eventForm.venueName || null,
      startsAt: fromDatetimeLocal(eventForm.startsAt),
      nekathAt: fromDatetimeLocal(eventForm.nekathAt),
    });
    setEventForm({ kind: "PORUWA", name: "", venueName: "", startsAt: "", nekathAt: "" });
    await reload();
  }

  async function saveEvent(item: Event) {
    await api.wedding.updateEvent(item.id, {
      kind: item.kind,
      name: item.name,
      venueName: item.venueName,
      startsAt: item.startsAt,
      nekathAt: item.nekathAt,
      address: item.address,
    });
    await reload();
  }

  async function removeEvent(id: string) {
    if (!window.confirm("Remove this ceremony? Guest invites for it will be deleted.")) return;
    await api.wedding.deleteEvent(id);
    await reload();
  }

  async function inviteMember(event: FormEvent) {
    event.preventDefault();
    await api.wedding.inviteMember(invite);
    setInvite({ email: "", name: "", canEditGuests: true, canViewBudget: true, canManageVendors: false });
    setStatus(t("planning.invitedTempPassword"));
    await reload();
  }

  function formatWhen(iso: string | null | undefined) {
    if (!iso) return "";
    return new Date(iso).toLocaleString("en-LK", { dateStyle: "medium", timeStyle: "short" });
  }

  return (
    <div className="cw-stack">
      <PageHeader
        kicker={t("hub.kicker")}
        title={t("nav.studio")}
        description="Shape the wedding object — ceremonies, style, guest site — with a live preview."
      />
      <StudioShell
        nav={
          <CreatorSectionNav
            sections={sections}
            active={section}
            onSelect={(id) => setSection(id as Section)}
          />
        }
        previewLabel="Guest preview"
        previewTitle={[form.partnerOneName, form.partnerTwoName].filter(Boolean).join(" & ") || "Your wedding site"}
        previewThumb={HERO}
        preview={
          <div className="grid gap-3 px-1 pb-2">
            <WeddingSitePreview
              names={`${form.partnerOneName} & ${form.partnerTwoName}`}
              date={formatWeddingDateLabel(form.date ? new Date(form.date).toISOString() : null)}
              place={[form.city, form.district].filter(Boolean).join(", ")}
              imageSrc={HERO}
              events={eventDrafts}
              faq={form.websiteFaq}
              travelNotes={form.travelNotes}
              team={bookedTeam.map((item) => ({
                vendorId: item.vendorId,
                name: item.name,
                slug: item.slug,
                category: CATEGORY_LABELS[item.category] ?? item.category,
                photoUrl: item.photoUrl,
              }))}
              formatWhen={formatWhen}
              rsvpHref={`/w/${data.slug}/rsvp`}
            />
          </div>
        }
      >
          <form className="grid gap-6 pb-24" onSubmit={saveBasics}>
            {section === "basics" ? (
              <FormSection title="Basics" description="Partners, place, traditions, and money story.">
                <div className="grid gap-4 md:grid-cols-2">
                  <FieldBlock label={t("planning.partnerOne")}>
                    <Input className={fieldClass} value={form.partnerOneName} onChange={(e) => setForm({ ...form, partnerOneName: e.target.value })} />
                  </FieldBlock>
                  <FieldBlock label={t("planning.partnerTwo")}>
                    <Input className={fieldClass} value={form.partnerTwoName} onChange={(e) => setForm({ ...form, partnerTwoName: e.target.value })} />
                  </FieldBlock>
                  <FieldBlock label={t("planning.date")}>
                    <DatePicker
                      className={fieldClass}
                      value={form.date}
                      onChange={(value) => setForm({ ...form, date: value })}
                    />
                  </FieldBlock>
                  <FieldBlock label={t("planning.guestEstimate")}>
                    <Input
                      className={fieldClass}
                      type="number"
                      value={form.guestCountEstimate}
                      onChange={(e) => setForm({ ...form, guestCountEstimate: Number(e.target.value) })}
                    />
                  </FieldBlock>
                  <PlaceFields
                    city={form.city}
                    district={form.district}
                    onCityChange={(city) => setForm((current) => ({ ...current, city }))}
                    onDistrictChange={(district) => setForm((current) => ({ ...current, district }))}
                    cityLabel={t("planning.city")}
                    districtLabel={t("planning.district")}
                    fieldClass={fieldClass}
                    className="grid gap-4 sm:grid-cols-2 md:col-span-2"
                  />
                  {data.myAccess.canViewBudget ? (
                    <>
                      <FieldBlock label={t("planning.budgetBand")}>
                        <Input
                          className={fieldClass}
                          type="number"
                          value={form.budgetLkr}
                          onChange={(e) => setForm({ ...form, budgetLkr: Number(e.target.value) })}
                        />
                      </FieldBlock>
                      <FieldBlock label={t("planning.payer")}>
                        <SimpleSelect
                          className={fieldClass}
                          value={form.payer}
                          onValueChange={(value) => setForm({ ...form, payer: value as Payer })}
                          options={payerSchema.options.map((payer) => ({ value: payer, label: payer }))}
                        />
                      </FieldBlock>
                    </>
                  ) : null}
                </div>
                <FieldBlock label={t("planning.weddingTypes")}>
                  <div className="flex flex-wrap gap-2">
                    {weddingTypeSchema.options.map((type) => {
                      const on = form.types.includes(type);
                      return (
                        <button
                          key={type}
                          type="button"
                          className={`rounded-full px-3 py-1.5 text-xs tracking-wide uppercase ${on ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
                          onClick={() =>
                            setForm({
                              ...form,
                              types: on ? form.types.filter((item) => item !== type) : [...form.types, type],
                            })
                          }
                        >
                          {type.replaceAll("_", " ")}
                        </button>
                      );
                    })}
                  </div>
                </FieldBlock>
                <label className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/40 px-4 py-3 text-sm">
                  <span>{t("planning.planningFromOverseas")}</span>
                  <Switch
                    checked={form.planningFromOverseas}
                    onCheckedChange={(checked) => setForm({ ...form, planningFromOverseas: checked })}
                  />
                </label>
              </FormSection>
            ) : null}

            {section === "style" ? (
              <FormSection title="Style" description="The visual story guests and vendors should feel.">
                <StyleStoryPicker
                  value={form.style}
                  options={STYLE_OPTIONS}
                  colors={form.colors}
                  onChange={(value) => {
                    const option = STYLE_OPTIONS.find((item) => item.value === value);
                    setForm({
                      ...form,
                      style: value as WeddingStyle,
                      colors: option?.swatches ?? form.colors,
                    });
                  }}
                />
                <FieldBlock label="Palette">
                  <TagInput values={form.colors} onChange={(colors) => setForm({ ...form, colors })} placeholder="#C4A574" />
                </FieldBlock>
                <FieldBlock label="Style notes">
                  <textarea className={areaClass} value={form.styleNotes} onChange={(e) => setForm({ ...form, styleNotes: e.target.value })} />
                </FieldBlock>
                <FieldBlock label="Setting notes">
                  <textarea className={areaClass} value={form.settingNotes} onChange={(e) => setForm({ ...form, settingNotes: e.target.value })} />
                </FieldBlock>
              </FormSection>
            ) : null}

            {section === "events" ? (
              <FormSection title="Events" description="Poruwa, church, nikah, walima — each with nekath when it matters.">
                <div className="grid gap-4">
                  {eventDrafts.map((item) => (
                    <EventCeremonyCard
                      key={item.id}
                      title={item.name}
                      kind={item.kind}
                      onRemove={() => removeEvent(item.id)}
                    >
                      <div className="grid gap-3 md:grid-cols-2">
                        <FieldBlock label="Name">
                          <Input
                            className={fieldClass}
                            value={item.name}
                            onChange={(e) =>
                              setEventDrafts((rows) =>
                                rows.map((row) => (row.id === item.id ? { ...row, name: e.target.value } : row)),
                              )
                            }
                          />
                        </FieldBlock>
                        <FieldBlock label="Kind">
                          <SimpleSelect
                            className={fieldClass}
                            value={item.kind}
                            onValueChange={(value) =>
                              setEventDrafts((rows) =>
                                rows.map((row) =>
                                  row.id === item.id ? { ...row, kind: value as EventKind } : row,
                                ),
                              )
                            }
                            options={eventKindSchema.options.map((kind) => ({ value: kind, label: kind }))}
                          />
                        </FieldBlock>
                        <FieldBlock label="Starts">
                          <DateTimePicker
                            value={toDatetimeLocal(item.startsAt)}
                            onChange={(value) =>
                              setEventDrafts((rows) =>
                                rows.map((row) =>
                                  row.id === item.id ? { ...row, startsAt: fromDatetimeLocal(value) } : row,
                                ),
                              )
                            }
                          />
                        </FieldBlock>
                        <FieldBlock label="Nekath">
                          <DateTimePicker
                            value={toDatetimeLocal(item.nekathAt)}
                            onChange={(value) =>
                              setEventDrafts((rows) =>
                                rows.map((row) =>
                                  row.id === item.id ? { ...row, nekathAt: fromDatetimeLocal(value) } : row,
                                ),
                              )
                            }
                          />
                        </FieldBlock>
                        <FieldBlock label="Venue">
                          <Input
                            className={fieldClass}
                            value={item.venueName ?? ""}
                            onChange={(e) =>
                              setEventDrafts((rows) =>
                                rows.map((row) => (row.id === item.id ? { ...row, venueName: e.target.value } : row)),
                              )
                            }
                          />
                        </FieldBlock>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" size="sm" onClick={() => saveEvent(item)}>
                          Save ceremony
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => api.wedding.generateNekathSchedule(item.id).then(() => reload())}
                        >
                          Generate day-of
                        </Button>
                      </div>
                    </EventCeremonyCard>
                  ))}
                </div>
                <div className="grid gap-3 rounded-3xl border border-dashed border-border/80 p-5">
                  <p className="font-medium">Add ceremony</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <FieldBlock label="Name">
                      <Input className={fieldClass} value={eventForm.name} onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })} required />
                    </FieldBlock>
                    <FieldBlock label="Kind">
                      <SimpleSelect
                        className={fieldClass}
                        value={eventForm.kind}
                        onValueChange={(value) => setEventForm({ ...eventForm, kind: value as EventKind })}
                        options={eventKindSchema.options.map((kind) => ({ value: kind, label: kind }))}
                      />
                    </FieldBlock>
                    <FieldBlock label="Starts">
                      <DateTimePicker
                        value={eventForm.startsAt}
                        onChange={(value) => setEventForm({ ...eventForm, startsAt: value })}
                      />
                    </FieldBlock>
                    <FieldBlock label="Nekath">
                      <DateTimePicker
                        value={eventForm.nekathAt}
                        onChange={(value) => setEventForm({ ...eventForm, nekathAt: value })}
                      />
                    </FieldBlock>
                    <FieldBlock label="Venue">
                      <Input className={fieldClass} value={eventForm.venueName} onChange={(e) => setEventForm({ ...eventForm, venueName: e.target.value })} />
                    </FieldBlock>
                  </div>
                  <Button type="button" onClick={() => void addEvent()}>
                    Add event
                  </Button>
                </div>
              </FormSection>
            ) : null}

            {section === "website" ? (
              <FormSection title="Website" description="What guests see on your invitation site.">
                <label className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/40 px-4 py-3 text-sm">
                  <span>Publish guest site</span>
                  <Switch
                    checked={form.websiteEnabled}
                    onCheckedChange={(checked) => setForm({ ...form, websiteEnabled: checked })}
                  />
                </label>
                <FieldBlock label="FAQ">
                  <textarea
                    className={areaClass}
                    value={form.websiteFaq}
                    onChange={(e) => setForm({ ...form, websiteFaq: e.target.value })}
                    placeholder={"Dress code\nNational / Kandyan welcome\n\nGifts\nBlessings mean more than parcels"}
                  />
                </FieldBlock>
                <FieldBlock label="Travel notes">
                  <textarea
                    className={areaClass}
                    value={form.travelNotes}
                    onChange={(e) => setForm({ ...form, travelNotes: e.target.value })}
                  />
                </FieldBlock>
                <ShareInvitePanel
                  url={siteUrl}
                  whatsappUrl={shareWhatsappUrl}
                  copied={copied}
                  onCopy={async () => {
                    await navigator.clipboard.writeText(siteUrl);
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 2000);
                  }}
                />
              </FormSection>
            ) : null}

            {section === "family" ? (
              <FormSection title="Family" description="Invite Amma or diaspora helpers with clear permissions.">
                <div className="grid gap-3">
                  {(data.members ?? []).map((member) => (
                    <div key={member.id} className="rounded-2xl border border-border/70 px-4 py-3 text-sm">
                      <p className="font-medium">
                        {member.name} · {member.email}
                      </p>
                      <p className="text-muted-foreground">{member.role}</p>
                    </div>
                  ))}
                </div>
                {data.myAccess.role === "COUPLE" ? (
                  <div className="grid gap-3 rounded-3xl border border-dashed border-border/80 p-5">
                    <FieldBlock label="Name">
                      <Input className={fieldClass} value={invite.name} onChange={(e) => setInvite({ ...invite, name: e.target.value })} />
                    </FieldBlock>
                    <FieldBlock label="Email">
                      <Input className={fieldClass} type="email" value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} />
                    </FieldBlock>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <CheckboxField
                        label="Guests"
                        checked={invite.canEditGuests}
                        onCheckedChange={(checked) => setInvite({ ...invite, canEditGuests: checked === true })}
                      />
                      <CheckboxField
                        label="Budget"
                        checked={invite.canViewBudget}
                        onCheckedChange={(checked) => setInvite({ ...invite, canViewBudget: checked === true })}
                      />
                      <CheckboxField
                        label="Vendors"
                        checked={invite.canManageVendors}
                        onCheckedChange={(checked) => setInvite({ ...invite, canManageVendors: checked === true })}
                      />
                    </div>
                    <Button type="button" onClick={inviteMember}>
                      Invite family
                    </Button>
                  </div>
                ) : null}
              </FormSection>
            ) : null}

            {section === "publish" ? (
              <FormSection title="Publish" description="Completeness before you share the guest site.">
                <CompletenessChecklist
                  score={completeness.score}
                  total={completeness.total}
                  missing={completeness.missing.map((key) => COMPLETE_LABELS[key] ?? key)}
                  ready={completeness.ready}
                />
                <div className="flex flex-wrap gap-2">
                  <Button asChild>
                    <Link href={`/w/${data.slug}`} target="_blank">
                      View guest site
                    </Link>
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setSection("website")}>
                    Edit website
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Cap {formatMoney(form.budgetLkr, currency)} · {form.guestCountEstimate} estimated guests
                </p>
              </FormSection>
            ) : null}

            <StickyActionBar>
              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit">{t("planning.save")}</Button>
                {status ? <span className="text-sm text-muted-foreground">{status}</span> : null}
              </div>
            </StickyActionBar>
          </form>
      </StudioShell>
    </div>
  );
}
