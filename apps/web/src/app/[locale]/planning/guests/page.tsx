"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
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
import { Input } from "@ceylonweddings/ui/components/input";
import { Label } from "@ceylonweddings/ui/components/label";
import { SimpleSelect } from "@ceylonweddings/ui/components/select";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { GuestInviteChip, GuestRow } from "@ceylonweddings/ui/domain/guest-row";
import { EmptyState } from "@ceylonweddings/ui/domain/empty-state";
import { PlateSummaryCard, RsvpSummaryStrip } from "@ceylonweddings/ui/domain/wedding-presentation";
import { SignInPrompt, useWedding } from "../../../../components/use-wedding";
import { initials } from "../../../../lib/labels";
import { Link } from "../../../../i18n/navigation";
import { Users } from "lucide-react";

const CHANNELS: InviteChannel[] = ["WHATSAPP", "PHONE", "PRINTED", "OVERSEAS"];
const STATUSES: RsvpStatus[] = ["CONSIDERING", "INVITED", "CONFIRMED", "DECLINED", "MAYBE", "WALK_IN"];

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
    api.wedding.guests().then(setGuests).catch(() => setGuests([]));
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
  const plates = useMemo(
    () => plateSummary(guests, data?.guestCountEstimate ?? 0),
    [guests, data?.guestCountEstimate],
  );

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
    if (!window.confirm("Remove this household?")) return;
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

  return (
    <div className="cw-stack">
      <PageHeader
        icon={Users}
        kicker={t("hub.kicker")}
        title={t("nav.guests")}
        description="Plates, RSVPs, WhatsApp templates, and CSV import — auntie-speed ops."
      />

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <RsvpSummaryStrip
          confirmed={summary.byStatus.find((row) => row.status === "CONFIRMED")?.households ?? 0}
          total={summary.households}
          byStatus={summary.byStatus}
        />
        <PlateSummaryCard
          title="Plates"
          estimate={plates.estimate}
          confirmed={plates.confirmedHeads}
          considering={plates.consideringHeads}
          bufferGap={plates.bufferGap}
          byMeal={plates.byMeal}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          className="max-w-xs"
          placeholder="Search households"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <SimpleSelect
          className="w-[11rem]"
          value={filterStatus}
          onValueChange={setFilterStatus}
          options={[
            { value: "ALL", label: "All statuses" },
            ...STATUSES.map((item) => ({ value: item, label: item })),
          ]}
        />
        <SimpleSelect
          className="w-[10rem]"
          value={filterSide}
          onValueChange={setFilterSide}
          options={[
            { value: "ALL", label: "All sides" },
            { value: "BRIDE", label: "Bride" },
            { value: "GROOM", label: "Groom" },
            { value: "BOTH", label: "Both" },
          ]}
        />
        {templates.length ? (
          <SimpleSelect
            className="w-[14rem]"
            value={templateId || selectedTemplate?.id || ""}
            onValueChange={setTemplateId}
            options={templates.map((row) => ({
              value: row.id,
              label: `${row.name}${row.isDefault ? " ★" : ""}`,
            }))}
          />
        ) : null}
        {data.myAccess.canEditGuests ? (
          <>
            <Button type="button" variant="outline" onClick={() => setShowTemplates((v) => !v)}>
              Templates
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowImport((v) => !v)}>
              Import CSV
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const header = "Household,HeadName,Side,PlusCount,Status,Meal,Phone,GiftReceived,Thanked\n";
                const rows = guests
                  .map(
                    (g) =>
                      `"${g.label.replace(/"/g, '""')}","${g.headName.replace(/"/g, '""')}",${g.side},${g.plusCount},${g.status},${g.meal || ""},"${g.phone || ""}",${g.giftReceived},${g.thanked}`
                  )
                  .join("\n");
                const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `ceylon-weddings-guests-${Date.now()}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Export CSV
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/planning/seating">Seating board</Link>
            </Button>
          </>
        ) : null}
      </div>

      {showTemplates && data.myAccess.canEditGuests ? (
        <div className="grid gap-3 rounded-3xl border border-border/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-medium">Invite templates</h2>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
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
                New
              </Button>
              <Button
                type="button"
                size="sm"
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
          <ul className="grid gap-2">
            {templates.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span>
                  {row.name} · {row.locale}
                  {row.isDefault ? " · default" : ""}
                </span>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="ghost" onClick={() => setEditingTemplate(row)}>
                    Edit
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      await api.wedding.deleteInviteTemplate(row.id);
                      const rows = await api.wedding.inviteTemplates();
                      setTemplates(rows);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          {editingTemplate ? (
            <form className="grid gap-3 border-t border-border/60 pt-3" onSubmit={saveTemplate}>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="grid gap-1">
                  <Label>Name</Label>
                  <Input
                    value={editingTemplate.name}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-1">
                  <Label>Locale</Label>
                  <Input
                    value={editingTemplate.locale}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, locale: e.target.value })}
                  />
                </div>
                <label className="flex items-end gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editingTemplate.isDefault}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, isDefault: e.target.checked })}
                  />
                  Default
                </label>
              </div>
              <div className="grid gap-1">
                <Label>Body</Label>
                <textarea
                  className="min-h-28 rounded-xl border border-border bg-background px-3 py-2 text-sm"
                  value={editingTemplate.body}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, body: e.target.value })}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Preview:{" "}
                {renderInviteTemplate(editingTemplate.body, {
                  ...templateVarsBase,
                  guestName: "Amma",
                })}
              </p>
              <div className="flex gap-2">
                <Button type="submit">Save template</Button>
                <Button type="button" variant="ghost" onClick={() => setEditingTemplate(null)}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : null}
        </div>
      ) : null}

      {showImport && data.myAccess.canEditGuests ? (
        <div className="grid gap-3 rounded-3xl border border-border/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-medium">Import guests (CSV)</h2>
            <Button
              type="button"
              size="sm"
              variant="outline"
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
              Download sample
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Export Excel as CSV. Columns: Household, Name, Side, Plus, Phone, Email, Status, Channel, Events.
          </p>
          <Input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onImportFile(file);
            }}
          />
          {importErrors.length ? (
            <ul className="text-sm text-destructive">
              {importErrors.slice(0, 8).map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          ) : null}
          {importPreview.length ? (
            <>
              <p className="text-sm">{importPreview.length} rows ready</p>
              <Button type="button" onClick={() => void confirmImport()}>
                Import {importPreview.length} households
              </Button>
            </>
          ) : null}
        </div>
      ) : null}

      {data.myAccess.canEditGuests ? (
        <form className="grid gap-3 rounded-3xl border border-border/70 p-4" onSubmit={onSubmit}>
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
            <div className="grid gap-1">
              <Label>{t("planning.household")}</Label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} required />
            </div>
            <div className="grid gap-1">
              <Label>{t("planning.headName")}</Label>
              <Input value={headName} onChange={(e) => setHeadName(e.target.value)} required />
            </div>
            <div className="grid gap-1">
              <Label>{t("planning.side")}</Label>
              <SimpleSelect
                value={side}
                onValueChange={(value) => setSide(value as typeof side)}
                options={[
                  { value: "BRIDE", label: t("planning.bride") },
                  { value: "GROOM", label: t("planning.groom") },
                  { value: "BOTH", label: t("planning.both") },
                ]}
              />
            </div>
            <div className="grid gap-1">
              <Label>{t("planning.plusCount")}</Label>
              <Input type="number" value={plusCount} onChange={(e) => setPlusCount(Number(e.target.value))} />
            </div>
            <div className="grid gap-1">
              <Label>{t("planning.channel")}</Label>
              <SimpleSelect
                value={channel}
                onValueChange={(value) => setChannel(value as InviteChannel)}
                options={CHANNELS.map((item) => ({ value: item, label: item }))}
              />
            </div>
            <div className="grid gap-1">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+94…" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {(data.events ?? []).map((event) => {
              const on = eventIds.includes(event.id);
              return (
                <button
                  key={event.id}
                  type="button"
                  className={`rounded-full px-3 py-1 text-xs ${on ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
                  onClick={() =>
                    setEventIds((ids) => (on ? ids.filter((id) => id !== event.id) : [...ids, event.id]))
                  }
                >
                  {event.name}
                </button>
              );
            })}
          </div>
          <Button type="submit">{t("planning.addGuest")}</Button>
          {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">{t("planning.noGuestEdit")}</p>
      )}

      <div className="rounded-3xl border border-border/70 bg-card/30 px-4">
        {filtered.length === 0 ? (
          <EmptyState icon={Users} title={t("nav.guests")} description={t("planning.guestsHelp")} />
        ) : (
          filtered.map((guest) => {
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
              <div key={guest.id} className="border-b border-border/50 py-2 last:border-0">
                <GuestRow
                  initials={initials(guest.headName)}
                  name={guest.headName}
                  household={`${guest.label} · +${guest.plusCount} · ${guest.side}`}
                  meta={`${guest.channel}${guest.meal ? ` · ${guest.meal}` : ""}`}
                  status={guest.status}
                  actions={
                    data.myAccess.canEditGuests ? (
                      <>
                        <SimpleSelect
                          className="h-8 w-[9.5rem] text-xs"
                          value={guest.status}
                          onValueChange={(value) => setHouseholdStatus(guest.id, value as RsvpStatus)}
                          options={STATUSES.map((item) => ({ value: item, label: item }))}
                        />
                        {wa ? (
                          <Button asChild size="sm" variant="outline">
                            <a href={wa} target="_blank" rel="noreferrer">
                              WhatsApp
                            </a>
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleGift(guest.id, !guest.giftReceived, guest.thanked)}
                        >
                          {guest.giftReceived ? "Gift ✓" : "Gift"}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleGift(guest.id, guest.giftReceived, !guest.thanked)}
                        >
                          {guest.thanked ? "Thanked ✓" : "Thank"}
                        </Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => removeGuest(guest.id)}>
                          Remove
                        </Button>
                      </>
                    ) : null
                  }
                />
                <div className="mb-2 ml-12 flex flex-wrap gap-2">
                  {(guest.invites ?? []).map((invite) => (
                    <GuestInviteChip
                      key={invite.eventId}
                      label={invite.eventName ?? invite.eventId}
                      status={invite.status}
                      onClick={() => {
                        if (!data.myAccess.canEditGuests) return;
                        const idx = STATUSES.indexOf(invite.status);
                        const next = STATUSES[(idx + 1) % STATUSES.length]!;
                        void setInviteStatus(guest.id, invite.eventId, next);
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
