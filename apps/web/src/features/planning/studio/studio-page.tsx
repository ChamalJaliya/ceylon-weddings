"use client";

import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  CalendarDays,
  CalendarHeart,
  CalendarClock,
  Check,
  Eye,
  Church,
  ExternalLink,
  ImagePlus,
  Mail,
  MapPinned,
  MessageCircleQuestion,
  NotebookPen,
  Paintbrush,
  PencilLine,
  Plus,
  Save,
  ShieldCheck,
  UserPlus,
  Flame,
  Flower2,
  Gem,
  Globe,
  HandHeart,
  HeartHandshake,
  House,
  MoonStar,
  Palette,
  Plane,
  Send,
  Sparkles,
  Trash2,
  Users,
  UsersRound,
  Wallet,
} from "lucide-react";
import type { IconComponent } from "@ceylonweddings/ui/components/icon";
import { cn } from "@ceylonweddings/ui/utils";
import { api, formatMoney, usePreferenceStore } from "@ceylonweddings/web";
import {
  eventKindSchema,
  formatWeddingDateLabel,
  MEDIA_IMAGE_CONTENT_TYPES,
  MEDIA_IMAGE_MAX_BYTES,
  payerSchema,
  renderInviteTemplate,
  resolveWeddingCoverUrl,
  weddingTypeSchema,
  type Event,
  type EventKind,
  type InviteTemplate,
  type Payer,
  type WeddingStyle,
  WEDDING_STYLE_OPTIONS,
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
  FormGroup,
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
import { PlanningHero } from "@/features/planning/components/planning-hero";
import { PlaceFields } from "@/components/place-fields";
import { Link } from "@/i18n/navigation";
import { SignInPrompt, useWedding } from "@/components/use-wedding";
import { CATEGORY_LABELS } from "@/lib/labels";
import { useConfirm } from "@ceylonweddings/ui/components/confirm-dialog";

const fieldClass = "h-11 rounded-xl border-border/80 bg-background/70";
const areaClass =
  "min-h-28 w-full rounded-xl border border-border/80 bg-background/70 px-3 py-2.5 text-sm leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring";

type Section = "basics" | "style" | "events" | "website" | "family" | "publish" | "preview";

const SECTIONS: Section[] = ["basics", "style", "events", "website", "family", "publish", "preview"];

/** "KANDYAN_PORUWA" → "Kandyan Poruwa", "BRIDE_FAMILY" → "Bride family". */
function humanize(value: string) {
  const words = value.toLowerCase().split("_");
  const title = !value.includes("FAMILY");
  return words.map((w, i) => (title || i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w)).join(" ");
}

const WEDDING_TYPE_ICON: Partial<Record<string, IconComponent>> = {
  KANDYAN_PORUWA: Flower2,
  WESTERN_CHURCH: Church,
  HINDU: Flame,
  MUSLIM_NIKAH: MoonStar,
  HOMECOMING: House,
  ENGAGEMENT: Gem,
  MEHNDI: HandHeart,
  DESTINATION: Plane,
};

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
  const confirm = useConfirm();
  const t = useTranslations();
  const searchParams = useSearchParams();
  const currency = usePreferenceStore((state) => state.currency);
  const { data, error, reload } = useWedding();
  const [section, setSection] = useState<Section>("basics");
  const [status, setStatus] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [coverBusy, setCoverBusy] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
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
    coverImageUrl: null as string | null,
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
  const [invite, setInvite] = useState({
    email: "",
    name: "",
    canEditGuests: true,
    canViewBudget: true,
    canManageVendors: false,
  });

  const [savedForm, setSavedForm] = useState<typeof form | null>(null);

  useEffect(() => {
    if (!data) return;
    const next = {
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
      coverImageUrl: data.coverImageUrl ?? null,
      websiteEnabled: data.websiteEnabled,
      websiteFaq: data.websiteFaq ?? "",
      travelNotes: data.travelNotes ?? "",
    };
    setForm((prev) => ({ ...prev, ...next }));
    setSavedForm((prev) => ({ ...(prev ?? form), ...next }));
    setEventDrafts(data.events ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const dirty = savedForm != null && JSON.stringify(form) !== JSON.stringify(savedForm);

  useEffect(() => {
    const requested = searchParams.get("section");
    if (requested && SECTIONS.includes(requested as Section)) {
      setSection(requested as Section);
    }
  }, [searchParams]);

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
    {
      id: "basics" as const,
      label: "Basics",
      hint: "Couple, date & place",
      icon: HeartHandshake,
      done: Boolean(form.partnerOneName && form.partnerTwoName && form.city),
    },
    { id: "style" as const, label: "Style", hint: "Look & feel", icon: Palette, done: Boolean(form.style) },
    {
      id: "events" as const,
      label: "Events",
      hint: "Ceremonies & nekath",
      icon: CalendarHeart,
      done: eventDrafts.some((event) => Boolean(event.startsAt)),
    },
    {
      id: "website" as const,
      label: "Website",
      hint: "FAQ & travel for guests",
      icon: Globe,
      done: Boolean(form.websiteFaq && form.travelNotes),
    },
    {
      id: "family" as const,
      label: "Family",
      hint: "Helpers & permissions",
      icon: UsersRound,
      done: (data.members ?? []).some((m) => m.role === "FAMILY"),
    },
    { id: "publish" as const, label: "Publish", hint: "Check & share", icon: Send, done: completeness.ready },
    { id: "preview" as const, label: "Preview", hint: "See it as guests do", icon: Eye },
  ];

  async function saveBasics(event: FormEvent) {
    event.preventDefault();
    setStatus(null);
    const typesChanged = [...form.types].sort().join() !== [...data!.types].sort().join();
    let seedMissingTasks = false;
    if (typesChanged) {
      seedMissingTasks = (data!.tasks ?? []).length === 0 || (await confirm({ title: t("planning.seedTasksConfirm") }));
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
      coverImageUrl: form.coverImageUrl,
      websiteEnabled: form.websiteEnabled,
      websiteFaq: form.websiteFaq || null,
      travelNotes: form.travelNotes || null,
    });
    setStatus(t("planning.saved"));
    await reload();
  }

  async function uploadCover(file: File) {
    setCoverError(null);
    if (file.size > MEDIA_IMAGE_MAX_BYTES) {
      setCoverError("Image must be under 10MB");
      return;
    }
    const contentType = file.type as (typeof MEDIA_IMAGE_CONTENT_TYPES)[number];
    if (!(MEDIA_IMAGE_CONTENT_TYPES as readonly string[]).includes(contentType)) {
      setCoverError("Use JPEG, PNG, WebP, or GIF");
      return;
    }
    setCoverBusy(true);
    try {
      const { uploadUrl, publicUrl } = await api.wedding.presignCover({
        contentType,
        filename: file.name,
        kind: "cover",
      });
      const put = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: file,
      });
      if (!put.ok) throw new Error("Upload to storage failed");
      setForm((prev) => ({ ...prev, coverImageUrl: publicUrl }));
      await api.wedding.update({ coverImageUrl: publicUrl });
      await reload();
      setStatus("Cover photo saved");
    } catch (err) {
      setCoverError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setCoverBusy(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  }

  async function clearCover() {
    setCoverBusy(true);
    setCoverError(null);
    try {
      setForm((prev) => ({ ...prev, coverImageUrl: null }));
      await api.wedding.update({ coverImageUrl: null });
      await reload();
      setStatus("Cover photo cleared");
    } catch (err) {
      setCoverError(err instanceof Error ? err.message : "Could not clear cover");
    } finally {
      setCoverBusy(false);
    }
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
    if (
      !(await confirm({
        title: "Remove this ceremony?",
        description: "Guest invites for it will be deleted.",
        destructive: true,
        confirmLabel: "Remove",
      }))
    )
      return;
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
      <PlanningHero
        icon={Palette}
        kicker={t("hub.kicker")}
        title={t("nav.studio")}
        description="Shape the wedding object — ceremonies, style, guest site — with a live preview."
      />
      <StudioShell
        nav={<CreatorSectionNav sections={sections} active={section} onSelect={(id) => setSection(id as Section)} />}
      >
        <form className="grid gap-6 pb-24" onSubmit={saveBasics}>
          {section === "basics" ? (
            <FormSection
              title="Basics"
              icon={HeartHandshake}
              description="Who's getting married, when and where, the traditions you're following, and the money story."
            >
              <FormGroup icon={Users} title="The couple" description="Shown on your guest site and invitations.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldBlock label={t("planning.partnerOne")}>
                    <Input
                      className={fieldClass}
                      value={form.partnerOneName}
                      onChange={(e) => setForm({ ...form, partnerOneName: e.target.value })}
                    />
                  </FieldBlock>
                  <FieldBlock label={t("planning.partnerTwo")}>
                    <Input
                      className={fieldClass}
                      value={form.partnerTwoName}
                      onChange={(e) => setForm({ ...form, partnerTwoName: e.target.value })}
                    />
                  </FieldBlock>
                </div>
              </FormGroup>

              <FormGroup
                icon={CalendarDays}
                title="When & where"
                description="Drives your countdown, checklist timing and vendor suggestions."
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldBlock label={t("planning.date")}>
                    <DatePicker
                      className={fieldClass}
                      value={form.date}
                      onChange={(value) => setForm({ ...form, date: value })}
                    />
                  </FieldBlock>
                  <FieldBlock label={t("planning.guestEstimate")} hint="A rough headcount is fine.">
                    <Input
                      className={fieldClass}
                      type="number"
                      inputMode="numeric"
                      min={0}
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
                    className="grid gap-4 sm:col-span-2 sm:grid-cols-2"
                  />
                </div>
                <label className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/50 px-4 py-3 text-sm">
                  <span className="flex items-center gap-3">
                    <Plane className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="grid gap-0.5">
                      <span className="font-medium">{t("planning.planningFromOverseas")}</span>
                      <span className="text-xs text-muted-foreground">
                        We&apos;ll highlight vendors who do remote calls and foreign-currency quotes.
                      </span>
                    </span>
                  </span>
                  <Switch
                    checked={form.planningFromOverseas}
                    onCheckedChange={(checked) => setForm({ ...form, planningFromOverseas: checked })}
                  />
                </label>
              </FormGroup>

              <FormGroup
                icon={Sparkles}
                title={t("planning.weddingTypes")}
                description="Pick every ceremony you're having — we tailor checklists and vendors to them."
                aside={form.types.length ? `${form.types.length} selected` : undefined}
              >
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  {weddingTypeSchema.options.map((type) => {
                    const on = form.types.includes(type);
                    const TypeIcon = WEDDING_TYPE_ICON[type] ?? Sparkles;
                    return (
                      <button
                        key={type}
                        type="button"
                        aria-pressed={on}
                        className={cn(
                          "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
                          on
                            ? "border-primary/60 bg-primary/10 text-foreground"
                            : "border-border/60 bg-background/50 text-muted-foreground hover:border-border hover:text-foreground",
                        )}
                        onClick={() =>
                          setForm({
                            ...form,
                            types: on ? form.types.filter((item) => item !== type) : [...form.types, type],
                          })
                        }
                      >
                        <TypeIcon className={cn("size-4 shrink-0", on ? "text-primary" : "")} aria-hidden />
                        <span className="min-w-0 flex-1 truncate font-medium">{humanize(type)}</span>
                        {on ? <Check className="size-3.5 shrink-0 text-primary" aria-hidden /> : null}
                      </button>
                    );
                  })}
                </div>
              </FormGroup>

              {data.myAccess.canViewBudget ? (
                <FormGroup
                  icon={Wallet}
                  title="Budget"
                  description="Only people you allow can see this."
                  aside={form.budgetLkr ? formatMoney(form.budgetLkr, currency) : undefined}
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FieldBlock label={t("planning.budgetBand")}>
                      <Input
                        className={fieldClass}
                        type="number"
                        inputMode="numeric"
                        min={0}
                        step={50000}
                        value={form.budgetLkr}
                        onChange={(e) => setForm({ ...form, budgetLkr: Number(e.target.value) })}
                      />
                    </FieldBlock>
                    <FieldBlock label={t("planning.payer")}>
                      <SimpleSelect
                        className={fieldClass}
                        value={form.payer}
                        onValueChange={(value) => setForm({ ...form, payer: value as Payer })}
                        options={payerSchema.options.map((payer) => ({ value: payer, label: humanize(payer) }))}
                      />
                    </FieldBlock>
                  </div>
                </FormGroup>
              ) : null}
            </FormSection>
          ) : null}

          {section === "preview" ? (
            <FormSection
              title="Preview"
              icon={Eye}
              description="Your guest site as guests will see it — updates as you edit the other tabs."
            >
              <div className="overflow-hidden rounded-3xl border border-border/60 bg-card/40 p-3 sm:p-4">
                <WeddingSitePreview
                  names={`${form.partnerOneName} & ${form.partnerTwoName}`}
                  date={formatWeddingDateLabel(form.date ? new Date(form.date).toISOString() : null)}
                  place={[form.city, form.district].filter(Boolean).join(", ")}
                  imageSrc={resolveWeddingCoverUrl(form.coverImageUrl)}
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
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline">
                  <Link href={`/w/${data.slug}`} target="_blank">
                    <ExternalLink className="size-4" aria-hidden />
                    Open full site
                  </Link>
                </Button>
              </div>
            </FormSection>
          ) : null}

          {section === "style" ? (
            <FormSection title="Style" icon={Palette} description="The visual story guests and vendors should feel.">
              <FormGroup
                icon={ImagePlus}
                title="Cover photo"
                description="Used on your planning hub and the guest wedding site. Soft default until you upload your own."
              >
                <div className="grid gap-4 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] sm:items-end">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border/60 bg-muted/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resolveWeddingCoverUrl(form.coverImageUrl)}
                      alt=""
                      className="absolute inset-0 size-full object-cover"
                    />
                  </div>
                  <div className="grid gap-3">
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept={MEDIA_IMAGE_CONTENT_TYPES.join(",")}
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void uploadCover(file);
                      }}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={coverBusy}
                        onClick={() => coverInputRef.current?.click()}
                      >
                        <ImagePlus className="size-4" />
                        {coverBusy ? "Uploading…" : form.coverImageUrl ? "Replace photo" : "Upload photo"}
                      </Button>
                      {form.coverImageUrl ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={coverBusy}
                          onClick={() => void clearCover()}
                        >
                          <Trash2 className="size-4" />
                          Use default
                        </Button>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground">JPEG, PNG, WebP or GIF · up to 10MB</p>
                    {coverError ? <p className="text-sm text-destructive">{coverError}</p> : null}
                  </div>
                </div>
              </FormGroup>
              <FormGroup
                icon={Sparkles}
                title="Theme"
                description="Choosing a theme also sets a starting colour palette."
              >
                <StyleStoryPicker
                  value={form.style}
                  options={WEDDING_STYLE_OPTIONS}
                  colors={form.colors}
                  onChange={(value) => {
                    const option = WEDDING_STYLE_OPTIONS.find((item) => item.value === value);
                    setForm({
                      ...form,
                      style: value as WeddingStyle,
                      colors: option?.swatches ?? form.colors,
                    });
                  }}
                />
              </FormGroup>
              <FormGroup
                icon={Paintbrush}
                title="Colours"
                description="Add hex codes like #C4A574 — used on your invitations and guest site."
                aside={
                  form.colors.length ? (
                    <span className="flex -space-x-1">
                      {form.colors.slice(0, 6).map((color) => (
                        <span
                          key={color}
                          className="size-4 rounded-full ring-2 ring-background"
                          style={{ background: color }}
                        />
                      ))}
                    </span>
                  ) : undefined
                }
              >
                <TagInput
                  values={form.colors}
                  onChange={(colors) => setForm({ ...form, colors })}
                  placeholder="#C4A574"
                />
              </FormGroup>
              <FormGroup icon={NotebookPen} title="Notes for vendors" description="Shared with the vendors you book.">
                <div className="grid gap-4 md:grid-cols-2">
                  <FieldBlock label="Style notes" hint="Mood, flowers, outfits, references.">
                    <textarea
                      className={areaClass}
                      value={form.styleNotes}
                      onChange={(e) => setForm({ ...form, styleNotes: e.target.value })}
                    />
                  </FieldBlock>
                  <FieldBlock label="Setting notes" hint="Venue layout, décor, lighting.">
                    <textarea
                      className={areaClass}
                      value={form.settingNotes}
                      onChange={(e) => setForm({ ...form, settingNotes: e.target.value })}
                    />
                  </FieldBlock>
                </div>
              </FormGroup>
            </FormSection>
          ) : null}

          {section === "events" ? (
            <FormSection
              title="Events"
              icon={CalendarHeart}
              description="Poruwa, church, nikah, walima — each with nekath when it matters."
            >
              <div className="grid gap-4">
                {eventDrafts.length === 0 ? (
                  <div className="grid place-items-center gap-2 rounded-2xl border border-dashed border-border/70 px-6 py-10 text-center">
                    <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                      <CalendarHeart className="size-5" aria-hidden />
                    </span>
                    <p className="font-medium">No ceremonies yet</p>
                    <p className="max-w-sm text-sm text-muted-foreground">
                      Add your Poruwa, church service, nikah or homecoming below — each gets its own time, nekath and
                      venue.
                    </p>
                  </div>
                ) : null}
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
                              rows.map((row) => (row.id === item.id ? { ...row, kind: value as EventKind } : row)),
                            )
                          }
                          options={eventKindSchema.options.map((kind) => ({ value: kind, label: humanize(kind) }))}
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
                        <Save className="size-4" aria-hidden />
                        Save ceremony
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => api.wedding.generateNekathSchedule(item.id).then(() => reload())}
                      >
                        <CalendarClock className="size-4" aria-hidden />
                        Generate day-of
                      </Button>
                    </div>
                  </EventCeremonyCard>
                ))}
              </div>
              <FormGroup
                icon={Plus}
                title="Add a ceremony"
                description="Nekath is the auspicious time — leave it blank if it doesn't apply."
                className="border-dashed"
              >
                <div className="grid gap-3 md:grid-cols-2">
                  <FieldBlock label="Name">
                    <Input
                      className={fieldClass}
                      value={eventForm.name}
                      onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                      required
                    />
                  </FieldBlock>
                  <FieldBlock label="Kind">
                    <SimpleSelect
                      className={fieldClass}
                      value={eventForm.kind}
                      onValueChange={(value) => setEventForm({ ...eventForm, kind: value as EventKind })}
                      options={eventKindSchema.options.map((kind) => ({ value: kind, label: humanize(kind) }))}
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
                    <Input
                      className={fieldClass}
                      value={eventForm.venueName}
                      onChange={(e) => setEventForm({ ...eventForm, venueName: e.target.value })}
                    />
                  </FieldBlock>
                </div>
                <div>
                  <Button type="button" onClick={() => void addEvent()} disabled={!eventForm.name.trim()}>
                    <Plus className="size-4" aria-hidden />
                    Add ceremony
                  </Button>
                </div>
              </FormGroup>
            </FormSection>
          ) : null}

          {section === "website" ? (
            <FormSection title="Website" icon={Globe} description="What guests see on your invitation site.">
              <label className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/40 px-4 py-3.5 text-sm">
                <span className="flex items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Globe className="size-4" aria-hidden />
                  </span>
                  <span className="grid gap-0.5">
                    <span className="font-medium">Publish guest site</span>
                    <span className="text-xs text-muted-foreground">
                      {form.websiteEnabled
                        ? "Live — anyone with the link can view it."
                        : "Hidden — only you can preview it."}
                    </span>
                  </span>
                </span>
                <Switch
                  checked={form.websiteEnabled}
                  onCheckedChange={(checked) => setForm({ ...form, websiteEnabled: checked })}
                />
              </label>
              <FormGroup
                icon={MessageCircleQuestion}
                title="Guest FAQ"
                description="A question on one line, its answer on the next; leave a blank line between pairs."
              >
                <FieldBlock label="FAQ">
                  <textarea
                    className={areaClass}
                    value={form.websiteFaq}
                    onChange={(e) => setForm({ ...form, websiteFaq: e.target.value })}
                    placeholder={"Dress code\nNational / Kandyan welcome\n\nGifts\nBlessings mean more than parcels"}
                  />
                </FieldBlock>
              </FormGroup>
              <FormGroup
                icon={MapPinned}
                title="Travel & stay"
                description="Directions, parking, hotels and airport transfers for out-of-town guests."
              >
                <FieldBlock label="Travel notes">
                  <textarea
                    className={areaClass}
                    value={form.travelNotes}
                    onChange={(e) => setForm({ ...form, travelNotes: e.target.value })}
                  />
                </FieldBlock>
              </FormGroup>
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
            <FormSection
              title="Family"
              icon={UsersRound}
              description="Invite Amma or diaspora helpers with clear permissions."
            >
              <FormGroup
                icon={UsersRound}
                title="People with access"
                aside={`${(data.members ?? []).length} ${(data.members ?? []).length === 1 ? "person" : "people"}`}
              >
                <ul className="grid gap-2">
                  {(data.members ?? []).map((member) => (
                    <li
                      key={member.id}
                      className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/50 px-3 py-2.5 text-sm"
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-medium text-foreground">
                        {(member.name || member.email).slice(0, 2).toUpperCase()}
                      </span>
                      <span className="grid min-w-0 flex-1 gap-0.5">
                        <span className="truncate font-medium">{member.name}</span>
                        <span className="truncate text-xs text-muted-foreground">{member.email}</span>
                      </span>
                      <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">
                        {humanize(member.role)}
                      </span>
                    </li>
                  ))}
                </ul>
              </FormGroup>
              {data.myAccess.role === "COUPLE" ? (
                <FormGroup
                  icon={UserPlus}
                  title="Invite family"
                  description="Amma, Thaththa or a cousin abroad — they get an email invite and only the access you tick."
                  className="border-dashed"
                >
                  <div className="grid gap-3 md:grid-cols-2">
                    <FieldBlock label="Name">
                      <Input
                        className={fieldClass}
                        value={invite.name}
                        onChange={(e) => setInvite({ ...invite, name: e.target.value })}
                      />
                    </FieldBlock>
                    <FieldBlock label="Email">
                      <Input
                        className={fieldClass}
                        type="email"
                        value={invite.email}
                        onChange={(e) => setInvite({ ...invite, email: e.target.value })}
                      />
                    </FieldBlock>
                  </div>
                  <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <ShieldCheck className="size-3.5" aria-hidden />
                    They can manage
                  </p>
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
                  <div>
                    <Button type="button" onClick={inviteMember} disabled={!invite.email.trim()}>
                      <Mail className="size-4" aria-hidden />
                      Send invite
                    </Button>
                  </div>
                </FormGroup>
              ) : null}
            </FormSection>
          ) : null}

          {section === "publish" ? (
            <FormSection title="Publish" icon={Send} description="Completeness before you share the guest site.">
              <CompletenessChecklist
                score={completeness.score}
                total={completeness.total}
                missing={completeness.missing.map((key) => COMPLETE_LABELS[key] ?? key)}
                ready={completeness.ready}
              />
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  {
                    icon: CalendarDays,
                    label: "Date",
                    value: formatWeddingDateLabel(form.date ? new Date(form.date).toISOString() : null) || "Not set",
                  },
                  {
                    icon: Users,
                    label: "Guests",
                    value: form.guestCountEstimate ? `${form.guestCountEstimate} expected` : "Not set",
                  },
                  {
                    icon: Wallet,
                    label: "Budget",
                    value: form.budgetLkr ? formatMoney(form.budgetLkr, currency) : "Not set",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/40 px-4 py-3"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <stat.icon className="size-4" aria-hidden />
                    </span>
                    <span className="grid min-w-0 gap-0.5">
                      <span className="text-xs text-muted-foreground">{stat.label}</span>
                      <span className="truncate text-sm font-medium">{stat.value}</span>
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <Link href={`/w/${data.slug}`} target="_blank">
                    <ExternalLink className="size-4" aria-hidden />
                    View guest site
                  </Link>
                </Button>
                <Button type="button" variant="outline" onClick={() => setSection("website")}>
                  <PencilLine className="size-4" aria-hidden />
                  Edit website
                </Button>
              </div>
            </FormSection>
          ) : null}

          {section !== "preview" ? (
            <StickyActionBar>
              <div className="flex w-full flex-wrap items-center gap-3">
                <span className="mr-auto text-sm text-muted-foreground">
                  {dirty ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="size-2 rounded-full bg-[color:var(--cw-gold-400)]" /> Unsaved changes
                    </span>
                  ) : (
                    (status ?? "All changes saved")
                  )}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  shape="pill"
                  disabled={!dirty}
                  onClick={() => savedForm && setForm(savedForm)}
                >
                  Cancel
                </Button>
                <Button type="submit" shape="pill" disabled={!dirty}>
                  {t("planning.save")}
                </Button>
              </div>
            </StickyActionBar>
          ) : null}
        </form>
      </StudioShell>
    </div>
  );
}
