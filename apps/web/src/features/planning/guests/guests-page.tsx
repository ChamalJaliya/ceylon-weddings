"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { api } from "@ceylonweddings/web";
import {
  formatWeddingDateLabel,
  guestListSummary,
  normalizeGuestImportRow,
  plateSummary,
  renderInviteTemplate,
  whatsappInviteUrl,
  type GuestHousehold,
  type GuestImportRow,
  type InviteChannel,
  type InviteTemplate,
  type RsvpStatus,
} from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { Input } from "@ceylonweddings/ui/components/input";
import { Textarea } from "@ceylonweddings/ui/components/textarea";
import { CheckboxField } from "@ceylonweddings/ui/components/checkbox";
import { GuestInviteChip } from "@ceylonweddings/ui/domain/guest-row";
import { Combobox } from "@ceylonweddings/ui/components/combobox";
import { cn } from "@ceylonweddings/ui/utils";
import { PlanningHero, heroButtonClass } from "@/features/planning/components/planning-hero";
import { SignInPrompt, useWedding } from "@/components/use-wedding";
import { initials } from "@/lib/labels";
import { Link } from "@/i18n/navigation";
import {
  Download,
  Gift,
  HeartHandshake,
  LayoutGrid,
  MessageCircle,
  MessageSquareText,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  Upload,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { useConfirm } from "@ceylonweddings/ui/components/confirm-dialog";
import { getListEmptyMode } from "@ceylonweddings/ui/lib/list-state";

const CHANNELS: InviteChannel[] = ["WHATSAPP", "PHONE", "PRINTED", "OVERSEAS"];
const STATUSES: RsvpStatus[] = ["CONSIDERING", "INVITED", "CONFIRMED", "DECLINED", "MAYBE", "WALK_IN"];

const STATUS_COLOR: Record<RsvpStatus, string> = {
  CONSIDERING: "color-mix(in srgb, var(--color-paper) 35%, transparent)",
  INVITED: "var(--info)",
  CONFIRMED: "var(--cw-gold-300)",
  DECLINED: "var(--love)",
  MAYBE: "var(--warning)",
  WALK_IN: "var(--chart-2)",
};

const SAMPLE_CSV = `Household,Name,Side,Plus,Phone,Email,Status,Channel,Events
Perera aunties,Kumari Perera,BRIDE,3,+94771234567,,CONSIDERING,WHATSAPP,Poruwa ceremony|Reception
Jayawardena uncle,Ravi Jayawardena,GROOM,2,+94772345678,,INVITED,WHATSAPP,Reception
`;

function parseCsv(text: string): Record<string, string>[] {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]!);
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, i) => {
      row[header] = cells[i] ?? "";
    });
    return row;
  });
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}

export default function GuestsPage() {
  const confirm = useConfirm();
  const t = useTranslations();
  const locale = useLocale();
  const { data, error, reload } = useWedding();
  const [guests, setGuests] = useState<GuestHousehold[]>([]);
  const [templates, setTemplates] = useState<InviteTemplate[]>([]);
  const [templateId, setTemplateId] = useState<string>("");
  const [editingTemplate, setEditingTemplate] = useState<InviteTemplate | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importPreview, setImportPreview] = useState<GuestImportRow[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [label, setLabel] = useState("");
  const [headName, setHeadName] = useState("");
  const [side, setSide] = useState<"BRIDE" | "GROOM" | "BOTH">("BOTH");
  const [plusCount, setPlusCount] = useState(2);
  const [channel, setChannel] = useState<InviteChannel>("WHATSAPP");
  const [phone, setPhone] = useState("");
  const [eventIds, setEventIds] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterSide, setFilterSide] = useState<string>("ALL");
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const fromUrl = searchParams.get("q");
    if (fromUrl != null) setQuery(fromUrl);
  }, [searchParams]);

  useEffect(() => {
    api.wedding
      .guests()
      .then(setGuests)
      .catch(() => setGuests([]));
    api.wedding
      .inviteTemplates()
      .then((rows) => {
        setTemplates(rows);
        const def = rows.find((r) => r.isDefault) ?? rows[0];
        if (def) setTemplateId(def.id);
      })
      .catch(() => setTemplates([]));
  }, []);

  useEffect(() => {
    if (data?.events?.length && eventIds.length === 0) {
      setEventIds(data.events.map((event) => event.id));
    }
  }, [data, eventIds.length]);

  const selectedTemplate = useMemo(
    () => templates.find((row) => row.id === templateId) ?? templates.find((row) => row.isDefault) ?? templates[0],
    [templates, templateId],
  );

  const summary = useMemo(() => guestListSummary(guests), [guests]);
  const plates = useMemo(() => plateSummary(guests, data?.guestCountEstimate ?? 0), [guests, data?.guestCountEstimate]);

  const filtered = useMemo(() => {
    return guests.filter((guest) => {
      if (filterStatus !== "ALL" && guest.status !== filterStatus) return false;
      if (filterSide !== "ALL" && guest.side !== filterSide) return false;
      if (query) {
        const hay = `${guest.label} ${guest.headName} ${guest.phone ?? ""}`.toLowerCase();
        if (!hay.includes(query.toLowerCase())) return false;
      }
      return true;
    });
  }, [guests, filterStatus, filterSide, query]);

  if (!data) return <SignInPrompt error={error} />;

  const rsvpBase =
    typeof window !== "undefined" ? `${window.location.origin}/w/${data.slug}/rsvp` : `/w/${data.slug}/rsvp`;
  const primaryEvent = data.events?.[0];
  const templateVarsBase = {
    partnerOne: data.partnerOneName,
    partnerTwo: data.partnerTwoName,
    eventName: primaryEvent?.name ?? "our wedding",
    date: formatWeddingDateLabel(data.date, locale) ?? "",
    venue: primaryEvent?.venueName ?? data.city ?? "",
    rsvpUrl: rsvpBase,
  };

  function inviteMessage(guestName: string) {
    const body = selectedTemplate?.body;
    if (!body) return undefined;
    return renderInviteTemplate(body, { ...templateVarsBase, guestName });
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus(null);
    try {
      const created = await api.wedding.createGuest({
        label,
        headName,
        side,
        plusCount,
        status: "CONSIDERING",
        channel,
        phone: phone || undefined,
        eventIds,
      });
      setGuests((current) => [...current, created]);
      setLabel("");
      setHeadName("");
      setPhone("");
      await reload();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Could not add guest");
    }
  }

  async function setHouseholdStatus(id: string, next: RsvpStatus) {
    const updated = await api.wedding.updateGuest(id, { status: next });
    setGuests((rows) => rows.map((row) => (row.id === id ? updated : row)));
    await reload();
  }

  async function setInviteStatus(householdId: string, eventId: string, next: RsvpStatus) {
    const updated = await api.wedding.updateGuestInvite(householdId, eventId, { status: next });
    setGuests((rows) => rows.map((row) => (row.id === householdId ? updated : row)));
    await reload();
  }

  async function toggleGift(id: string, giftReceived: boolean, thanked: boolean) {
    const updated = await api.wedding.updateGuest(id, { giftReceived, thanked });
    setGuests((rows) => rows.map((row) => (row.id === id ? updated : row)));
  }

  async function removeGuest(id: string) {
    if (!(await confirm({ title: "Remove this household?", destructive: true, confirmLabel: "Remove" }))) return;
    await api.wedding.deleteGuest(id);
    setGuests((rows) => rows.filter((row) => row.id !== id));
    await reload();
  }

  async function saveTemplate(event: FormEvent) {
    event.preventDefault();
    if (!editingTemplate) return;
    const payload = {
      name: editingTemplate.name,
      locale: editingTemplate.locale,
      channel: editingTemplate.channel as InviteChannel,
      body: editingTemplate.body,
      isDefault: editingTemplate.isDefault,
    };
    const saved = editingTemplate.id.startsWith("new-")
      ? await api.wedding.createInviteTemplate(payload)
      : await api.wedding.updateInviteTemplate(editingTemplate.id, payload);
    const rows = await api.wedding.inviteTemplates();
    setTemplates(rows);
    setTemplateId(saved.id);
    setEditingTemplate(null);
  }

  async function onImportFile(file: File) {
    const text = await file.text();
    const rawRows = parseCsv(text);
    const rows: GuestImportRow[] = [];
    const errs: string[] = [];
    rawRows.forEach((raw, index) => {
      const result = normalizeGuestImportRow(raw);
      if ("error" in result) errs.push(`Row ${index + 2}: ${result.error}`);
      else rows.push(result);
    });
    setImportPreview(rows);
    setImportErrors(errs);
  }

  async function confirmImport() {
    if (!importPreview.length) return;
    const result = await api.wedding.bulkCreateGuests({
      rows: importPreview,
      defaultEventIds: eventIds,
    });
    setStatus(`Imported ${result.created} households${result.skipped ? `, skipped ${result.skipped}` : ""}`);
    setShowImport(false);
    setImportPreview([]);
    const refreshed = await api.wedding.guests();
    setGuests(refreshed);
    await reload();
  }

  const canEdit = data.myAccess.canEditGuests;
  const pretty = (v: string) => v.charAt(0) + v.slice(1).toLowerCase().replaceAll("_", " ");
  const statusCount = (s: RsvpStatus) => summary.byStatus.find((row) => row.status === s)?.households ?? 0;
  const confirmedHeads = summary.byStatus.find((row) => row.status === "CONFIRMED")?.heads ?? 0;
  const statusOptions = STATUSES.map((item) => ({ value: item, label: pretty(item) }));

  function exportCsv() {
    const header = "Household,HeadName,Side,PlusCount,Status,Meal,Phone,GiftReceived,Thanked\n";
    const rows = guests
      .map(
        (g) =>
          `"${g.label.replace(/"/g, '""')}","${g.headName.replace(/"/g, '""')}",${g.side},${g.plusCount},${g.status},${g.meal || ""},"${g.phone || ""}",${g.giftReceived},${g.thanked}`,
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ceylon-weddings-guests-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const panelToggle = (on: boolean) => cn(heroButtonClass, on && "bg-paper/15");
  const iconBtn =
    "grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground";

  return (
    <div className="cw-stack">
      <PlanningHero
        icon={Users}
        kicker={t("hub.kicker")}
        title={t("nav.guests")}
        description="Plates, RSVPs, WhatsApp templates, and CSV import — auntie-speed ops."
        actions={
          canEdit ? (
            <>
              <Button
                type="button"
                size="sm"
                shape="pill"
                variant="outline"
                className={panelToggle(showTemplates)}
                onClick={() => setShowTemplates((v) => !v)}
              >
                <MessageSquareText className="size-4" /> Templates
              </Button>
              <Button
                type="button"
                size="sm"
                shape="pill"
                variant="outline"
                className={panelToggle(showImport)}
                onClick={() => setShowImport((v) => !v)}
              >
                <Upload className="size-4" /> Import
              </Button>
              <Button
                type="button"
                size="sm"
                shape="pill"
                variant="outline"
                className={heroButtonClass}
                onClick={exportCsv}
              >
                <Download className="size-4" /> Export
              </Button>
              <Button asChild size="sm" shape="pill" variant="outline" className={heroButtonClass}>
                <Link href="/planning/seating">
                  <LayoutGrid className="size-4" /> Seating
                </Link>
              </Button>
            </>
          ) : null
        }
      >
        <div className="grid gap-6 lg:grid-cols-[auto_1fr] lg:items-end">
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            <div>
              <p className="text-xs text-paper/60">Households</p>
              <p className="font-serif text-3xl">{summary.households}</p>
            </div>
            <div>
              <p className="text-xs text-paper/60">Guests</p>
              <p className="font-serif text-3xl">{summary.heads}</p>
            </div>
            <div>
              <p className="text-xs text-paper/60">Confirmed</p>
              <p className="font-serif text-3xl text-[color:var(--cw-gold-300)]">{confirmedHeads}</p>
            </div>
            <div>
              <p className="text-xs text-paper/60">Plates planned</p>
              <p className="font-serif text-3xl">{plates.estimate}</p>
            </div>
          </div>
          {summary.households ? (
            <div className="grid gap-2">
              <div className="flex h-2.5 overflow-hidden rounded-full bg-paper/10">
                {STATUSES.map((s) =>
                  statusCount(s) ? (
                    <button
                      key={s}
                      type="button"
                      aria-label={`${pretty(s)}: ${statusCount(s)}`}
                      onClick={() => setFilterStatus(filterStatus === s ? "ALL" : s)}
                      className="h-full transition-opacity hover:opacity-80"
                      style={{ width: `${(statusCount(s) / summary.households) * 100}%`, background: STATUS_COLOR[s] }}
                    />
                  ) : null,
                )}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-paper/70">
                {STATUSES.filter((s) => statusCount(s)).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFilterStatus(filterStatus === s ? "ALL" : s)}
                    className={cn("inline-flex items-center gap-1.5", filterStatus === s && "text-paper")}
                  >
                    <span className="size-2 rounded-full" style={{ background: STATUS_COLOR[s] }} />
                    {pretty(s)} {statusCount(s)}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </PlanningHero>

      {/* Plates */}
      {plates.estimate || plates.confirmedHeads || plates.consideringHeads ? (
        <section className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-3xl border border-border bg-card px-5 py-4 shadow-card">
          <span className="flex items-center gap-2 text-sm font-medium">
            <UtensilsCrossed className="size-4 text-primary" /> Plates
          </span>
          <span className="text-sm">
            <span className="font-medium tabular-nums">{plates.confirmedHeads}</span>
            <span className="text-muted-foreground"> confirmed</span>
          </span>
          <span className="text-sm">
            <span className="font-medium tabular-nums">{plates.consideringHeads}</span>
            <span className="text-muted-foreground"> still deciding</span>
          </span>
          <span className="text-sm">
            <span className="font-medium tabular-nums">{plates.estimate}</span>
            <span className="text-muted-foreground"> planned</span>
          </span>
          {plates.bufferGap ? (
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs",
                plates.bufferGap > 0 ? "bg-primary/10 text-primary" : "bg-love/15 text-love-fg",
              )}
            >
              {plates.bufferGap > 0 ? `${plates.bufferGap} spare` : `${-plates.bufferGap} short`}
            </span>
          ) : null}
          {plates.byMeal?.length ? (
            <span className="ml-auto flex flex-wrap gap-1.5">
              {plates.byMeal.map((m) => (
                <span
                  key={m.meal}
                  className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground"
                >
                  {pretty(String(m.meal))} · {m.heads}
                </span>
              ))}
            </span>
          ) : null}
        </section>
      ) : null}

      {status ? <FormStatus>{status}</FormStatus> : null}

      {showTemplates && canEdit ? (
        <section className="rounded-3xl border border-border bg-card p-5 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-serif text-xl">Invite templates</p>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                shape="pill"
                variant="outline"
                className="gap-1.5"
                onClick={() =>
                  setEditingTemplate({
                    id: `new-${Date.now()}`,
                    weddingId: data.id,
                    name: "New template",
                    locale: locale.slice(0, 2),
                    channel: "WHATSAPP",
                    body: "Ayubowan {{guestName}}! {{partnerOne}} & {{partnerTwo}} — {{eventName}} on {{date}} at {{venue}}. RSVP: {{rsvpUrl}}",
                    isDefault: false,
                  })
                }
              >
                <Plus className="size-4" /> New
              </Button>
              <Button
                type="button"
                size="sm"
                shape="pill"
                variant="ghost"
                onClick={async () => {
                  const rows = await api.wedding.resetInviteTemplates();
                  setTemplates(rows);
                  const def = rows.find((r) => r.isDefault) ?? rows[0];
                  if (def) setTemplateId(def.id);
                }}
              >
                Reset to starters
              </Button>
            </div>
          </div>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {templates.map((row) => (
              <li
                key={row.id}
                className={cn(
                  "group flex items-center gap-3 rounded-2xl border p-3 text-sm",
                  row.id === selectedTemplate?.id ? "border-primary/40 bg-primary/5" : "border-border",
                )}
              >
                <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setTemplateId(row.id)}>
                  <span className="block truncate font-medium">
                    {row.name}
                    {row.isDefault ? (
                      <Star className="ml-1.5 inline size-3.5 fill-current text-[color:var(--cw-gold-400)]" />
                    ) : null}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {row.locale.toUpperCase()} · {row.body}
                  </span>
                </button>
                <button
                  type="button"
                  className={iconBtn}
                  aria-label="Edit template"
                  onClick={() => setEditingTemplate(row)}
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  type="button"
                  className={cn(iconBtn, "hover:bg-destructive/10 hover:text-destructive")}
                  aria-label="Delete template"
                  onClick={async () => {
                    await api.wedding.deleteInviteTemplate(row.id);
                    setTemplates(await api.wedding.inviteTemplates());
                  }}
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
          {editingTemplate ? (
            <form className="mt-4 grid gap-3 border-t border-border pt-4" onSubmit={saveTemplate}>
              <div className="grid gap-3 md:grid-cols-[1fr_8rem_auto] md:items-end">
                <label className="grid gap-1 text-xs text-muted-foreground">
                  Name
                  <Input
                    value={editingTemplate.name}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                    required
                  />
                </label>
                <label className="grid gap-1 text-xs text-muted-foreground">
                  Language
                  <Input
                    value={editingTemplate.locale}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, locale: e.target.value })}
                  />
                </label>
                <CheckboxField
                  label="Default"
                  checked={editingTemplate.isDefault}
                  onCheckedChange={(checked) => setEditingTemplate({ ...editingTemplate, isDefault: checked === true })}
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="grid gap-1 text-xs text-muted-foreground">
                  Message
                  <Textarea
                    className="min-h-32"
                    value={editingTemplate.body}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, body: e.target.value })}
                    required
                  />
                </label>
                <div className="grid content-start gap-1 text-xs text-muted-foreground">
                  Preview
                  <div className="rounded-2xl rounded-tl-sm bg-success/20 p-3 text-sm whitespace-pre-wrap text-foreground">
                    {renderInviteTemplate(editingTemplate.body, { ...templateVarsBase, guestName: "Amma" })}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" shape="pill" onClick={() => setEditingTemplate(null)}>
                  Cancel
                </Button>
                <Button type="submit" shape="pill">
                  Save template
                </Button>
              </div>
            </form>
          ) : null}
        </section>
      ) : null}

      {showImport && canEdit ? (
        <section className="rounded-3xl border border-border bg-card p-5 shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-serif text-xl">Import guests</p>
              <p className="text-sm text-muted-foreground">
                Export Excel as CSV. Columns: Household, Name, Side, Plus, Phone, Email, Status, Channel, Events.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              shape="pill"
              variant="outline"
              className="gap-1.5"
              onClick={() => {
                const blob = new Blob([SAMPLE_CSV], { type: "text/csv;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "ceylonweddings-guest-sample.csv";
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              <Download className="size-4" /> Sample file
            </Button>
          </div>
          <label className="mt-4 grid cursor-pointer place-items-center gap-2 rounded-2xl border border-dashed border-border p-8 text-center transition hover:border-primary/50">
            <Upload className="size-6 text-primary" />
            <span className="text-sm font-medium">Choose a CSV file</span>
            <span className="text-xs text-muted-foreground">We'll check every row before importing.</span>
            <input
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onImportFile(file);
              }}
            />
          </label>
          {importErrors.length ? (
            <ul className="mt-3 grid gap-1 text-sm text-destructive">
              {importErrors.slice(0, 8).map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          ) : null}
          {importPreview.length ? (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-primary/5 p-3">
              <p className="text-sm">{importPreview.length} households ready</p>
              <Button type="button" shape="pill" onClick={() => void confirmImport()}>
                Import {importPreview.length} households
              </Button>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* Add household */}
      {canEdit ? (
        <form onSubmit={onSubmit} className="grid gap-3 rounded-3xl border border-border bg-card p-4 shadow-card">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] xl:grid-cols-[1fr_1fr_auto_4.5rem_9rem_9rem_auto] xl:items-center">
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={`${t("planning.household")}, e.g. Perera aunties`}
              required
            />
            <Input
              value={headName}
              onChange={(e) => setHeadName(e.target.value)}
              placeholder={t("planning.headName")}
              required
            />
            <div className="inline-flex rounded-full bg-secondary p-1">
              {(["BRIDE", "GROOM", "BOTH"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSide(s)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm transition-colors",
                    side === s ? "bg-background shadow-sm" : "text-muted-foreground",
                  )}
                >
                  {s === "BRIDE" ? t("planning.bride") : s === "GROOM" ? t("planning.groom") : t("planning.both")}
                </button>
              ))}
            </div>
            <Input
              type="number"
              min={0}
              value={plusCount}
              aria-label={t("planning.plusCount")}
              title={t("planning.plusCount")}
              onChange={(e) => setPlusCount(Number(e.target.value))}
            />
            <Combobox
              aria-label={t("planning.channel")}
              value={channel}
              onValueChange={(value) => setChannel(value as InviteChannel)}
              searchPlaceholder="Search channels…"
              options={CHANNELS.map((item) => ({ value: item, label: pretty(item) }))}
            />
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+94…" />
            <Button type="submit" shape="pill" className="gap-1.5">
              <Plus className="size-4" /> {t("planning.addGuest")}
            </Button>
          </div>
          {(data.events ?? []).length ? (
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              Invited to
              {(data.events ?? []).map((event) => {
                const on = eventIds.includes(event.id);
                return (
                  <button
                    key={event.id}
                    type="button"
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs transition",
                      on
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:border-primary/40",
                    )}
                    onClick={() =>
                      setEventIds((ids) => (on ? ids.filter((id) => id !== event.id) : [...ids, event.id]))
                    }
                  >
                    {event.name}
                  </button>
                );
              })}
            </div>
          ) : null}
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">{t("planning.noGuestEdit")}</p>
      )}

      {/* Toolbar */}
      {guests.length ? (
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[14rem] flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search households"
              className="pl-9"
            />
          </div>
          <div className="inline-flex rounded-full border border-border bg-card p-1">
            {[
              { v: "ALL", l: "All" },
              { v: "BRIDE", l: t("planning.bride") },
              { v: "GROOM", l: t("planning.groom") },
              { v: "BOTH", l: t("planning.both") },
            ].map((o) => (
              <button
                key={o.v}
                type="button"
                onClick={() => setFilterSide(o.v)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm transition-colors",
                  filterSide === o.v
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {o.l}
              </button>
            ))}
          </div>
          <Combobox
            aria-label="Filter by status"
            className="w-44"
            value={filterStatus}
            onValueChange={setFilterStatus}
            searchPlaceholder="Search statuses…"
            options={[{ value: "ALL", label: "All statuses" }, ...statusOptions]}
          />
          {templates.length ? (
            <Combobox
              aria-label="Invite template"
              className="w-52"
              value={templateId || selectedTemplate?.id || ""}
              onValueChange={setTemplateId}
              searchPlaceholder="Search templates…"
              options={templates.map((row) => ({
                value: row.id,
                label: `Invite: ${row.name}${row.isDefault ? " ★" : ""}`,
              }))}
            />
          ) : null}
        </div>
      ) : null}

      {/* List */}
      {filtered.length === 0 ? (
        getListEmptyMode({ sourceCount: guests.length, filteredCount: filtered.length }) === "no-results" ? (
          <div className="grid place-items-center gap-3 rounded-3xl border border-dashed border-border p-10 text-center">
            <p className="text-sm text-muted-foreground">No households match this search or filter.</p>
            <Button
              size="sm"
              shape="pill"
              variant="outline"
              onClick={() => {
                setQuery("");
                setFilterStatus("ALL");
                setFilterSide("ALL");
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="grid place-items-center gap-3 rounded-3xl border border-dashed border-border p-12 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Users className="size-6" />
            </span>
            <p className="font-serif text-2xl">No guests yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">{t("planning.guestsHelp")}</p>
          </div>
        )
      ) : (
        <ul className="overflow-hidden rounded-3xl border border-border bg-card shadow-card">
          {filtered.map((guest) => {
            const message = inviteMessage(guest.headName);
            const wa = guest.phone
              ? whatsappInviteUrl({
                  phone: guest.phone,
                  partnerOneName: data.partnerOneName,
                  partnerTwoName: data.partnerTwoName,
                  rsvpUrl: rsvpBase,
                  message,
                  locale: selectedTemplate?.locale,
                })
              : null;
            return (
              <li
                key={guest.id}
                className="group grid gap-3 border-b border-border px-5 py-4 last:border-0 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    className={cn(
                      "grid size-10 shrink-0 place-items-center rounded-full text-sm font-medium",
                      guest.side === "BRIDE"
                        ? "bg-love/15 text-love-fg"
                        : guest.side === "GROOM"
                          ? "bg-info/15 text-info"
                          : "bg-secondary",
                    )}
                  >
                    {initials(guest.headName)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {guest.headName}
                      {guest.plusCount ? (
                        <span className="ml-1.5 text-sm font-normal text-muted-foreground">+{guest.plusCount}</span>
                      ) : null}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {guest.label} · {pretty(guest.side)} side · {pretty(guest.channel)}
                      {guest.meal ? ` · ${pretty(guest.meal)}` : ""}
                    </p>
                    {(guest.invites ?? []).length ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {(guest.invites ?? []).map((invite) => (
                          <GuestInviteChip
                            key={invite.eventId}
                            label={invite.eventName ?? invite.eventId}
                            status={invite.status}
                            onClick={() => {
                              if (!canEdit) return;
                              const idx = STATUSES.indexOf(invite.status);
                              const next = STATUSES[(idx + 1) % STATUSES.length]!;
                              void setInviteStatus(guest.id, invite.eventId, next);
                            }}
                          />
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 pl-13 lg:pl-0">
                  {canEdit ? (
                    <Combobox
                      aria-label="RSVP status"
                      className="h-9 w-36 text-sm"
                      value={guest.status}
                      onValueChange={(value) => setHouseholdStatus(guest.id, value as RsvpStatus)}
                      searchPlaceholder="Search statuses…"
                      options={statusOptions}
                    />
                  ) : (
                    <span className="rounded-full border border-border px-3 py-1 text-xs">{pretty(guest.status)}</span>
                  )}
                  {wa ? (
                    <a
                      href={wa}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Send WhatsApp invite"
                      title="Send WhatsApp invite"
                      className="grid size-9 place-items-center rounded-full bg-success/15 text-success transition hover:bg-success/25"
                    >
                      <MessageCircle className="size-4" />
                    </a>
                  ) : null}
                  {canEdit ? (
                    <>
                      <button
                        type="button"
                        onClick={() => toggleGift(guest.id, !guest.giftReceived, guest.thanked)}
                        aria-pressed={guest.giftReceived}
                        title={guest.giftReceived ? "Gift received" : "Mark gift received"}
                        className={cn(
                          "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs transition",
                          guest.giftReceived
                            ? "border-primary/30 bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/40",
                        )}
                      >
                        <Gift className="size-3.5" /> Gift
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleGift(guest.id, guest.giftReceived, !guest.thanked)}
                        aria-pressed={guest.thanked}
                        title={guest.thanked ? "Thanked" : "Mark thanked"}
                        className={cn(
                          "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs transition",
                          guest.thanked
                            ? "border-primary/30 bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/40",
                        )}
                      >
                        <HeartHandshake className="size-3.5" /> Thanked
                      </button>
                      <button
                        type="button"
                        aria-label="Remove household"
                        onClick={() => removeGuest(guest.id)}
                        className="grid size-9 place-items-center rounded-full text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
