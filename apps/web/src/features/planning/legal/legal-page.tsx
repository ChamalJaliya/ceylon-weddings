"use client";

import { useEffect, useState } from "react";
import { BookOpen, Building, CalendarClock, Check, ExternalLink, FileCheck, Scale, Users } from "lucide-react";
import { Button } from "@ceylonweddings/ui/components/button";
import { cn } from "@ceylonweddings/ui/utils";
import { Link } from "@/i18n/navigation";
import { useWedding } from "@/components/use-wedding";
import { PlanningHero } from "@/features/planning/components/planning-hero";

type Track = "GENERAL" | "KANDYAN" | "MUSLIM" | "DESTINATION";
const TRACKS: { id: Track; label: string; short: string; icon: typeof Building }[] = [
  { id: "GENERAL", label: "General Marriage Ordinance", short: "General", icon: Building },
  { id: "KANDYAN", label: "Kandyan Marriage Ordinance", short: "Kandyan", icon: Scale },
  { id: "MUSLIM", label: "Muslim Marriage (MMDA)", short: "Muslim", icon: BookOpen },
  { id: "DESTINATION", label: "Diaspora & Destination Couples", short: "Destination", icon: Users },
];
const STORAGE_KEY = "cw.legal.v1";

function StepNum({ n }: { n: number }) {
  return (
    <span className="mr-2 inline-grid size-6 place-items-center rounded-full bg-primary text-xs text-primary-foreground">
      {n}
    </span>
  );
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export default function LegalGuidePage() {
  const { data } = useWedding();
  const [track, setTrack] = useState<Track>("GENERAL");
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState(false);

  // Remember the chosen track and ticked documents on this device.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
      if (saved.track) setTrack(saved.track);
      if (saved.docs) setCheckedDocs(saved.docs);
    } catch {
      /* ignore corrupt localStorage */
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ track, docs: checkedDocs }));
    } catch {
      /* ignore quota / private mode */
    }
  }, [loaded, track, checkedDocs]);

  function toggleDoc(key: string) {
    setCheckedDocs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const checklistItems = [
    {
      id: "birth_cert",
      label: "Original Birth Certificates of both Bride & Groom (with official English translations if abroad)",
    },
    { id: "nic_passport", label: "National Identity Cards (NIC) or valid Passports for both partners" },
    { id: "witness_ids", label: "National Identity Cards (NIC) or Passports of two adult witnesses (over 18 years)" },
    {
      id: "single_affidavit",
      label: "Affidavit of Single Status (Bachelorhood / Spinsterhood) — mandatory for foreigners / dual citizens",
    },
    {
      id: "divorce_decree",
      label: "Divorce Decree Absolute (Decree Nisi + Absolute) or Death Certificate of previous spouse (if applicable)",
    },
    {
      id: "four_day_proof",
      label:
        "Proof of 4-day minimum stay in Sri Lanka prior to notice (Hotel receipt / stamp for destination weddings)",
    },
  ];

  const docsDone = checklistItems.filter((i) => checkedDocs[i.id]).length;
  const weddingDate = data?.date ? new Date(data.date) : null;
  const daysToGo = weddingDate ? Math.ceil((weddingDate.getTime() - Date.now()) / 86_400_000) : null;
  const fmt = (d: Date) => d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  const milestones = weddingDate
    ? [
        { label: "Documents ready", hint: "at least 3 weeks before", date: addDays(weddingDate, -21) },
        ...(track === "DESTINATION"
          ? [{ label: "Arrive in Sri Lanka", hint: "4 days before giving notice", date: addDays(weddingDate, -18) }]
          : []),
        { label: "Give notice of marriage", hint: "14-day display period", date: addDays(weddingDate, -14) },
        { label: "Wedding & registration", hint: "with two witnesses", date: weddingDate },
      ]
    : [];

  return (
    <div className="cw-stack">
      <PlanningHero
        icon={FileCheck}
        kicker="Legal & registration"
        title="Marriage registration"
        description="Step-by-step civil registration requirements, official notice countdown, and documentation checklist for Sri Lanka"
      >
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          {daysToGo !== null && daysToGo >= 0 ? (
            <div>
              <p className="text-xs text-paper/60">Wedding in</p>
              <p className="font-serif text-2xl">{daysToGo} days</p>
            </div>
          ) : null}
          <div>
            <p className="text-xs text-paper/60">Documents ready</p>
            <p className="font-serif text-2xl">
              {docsDone} / {checklistItems.length}
            </p>
          </div>
          <div>
            <p className="text-xs text-paper/60">Your track</p>
            <p className="font-serif text-2xl">{TRACKS.find((x) => x.id === track)?.short}</p>
          </div>
        </div>
      </PlanningHero>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {TRACKS.map((x) => (
          <button
            key={x.id}
            type="button"
            onClick={() => setTrack(x.id)}
            aria-pressed={track === x.id}
            className={cn(
              "flex items-center gap-3 rounded-2xl border p-3 text-left transition",
              track === x.id
                ? "border-primary bg-primary/5 shadow-card"
                : "border-border bg-card hover:border-primary/40",
            )}
          >
            <span
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-xl",
                track === x.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
              )}
            >
              <x.icon className="size-4" />
            </span>
            <span className="text-sm font-medium">{x.label}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <section className="rounded-3xl border border-border bg-card p-5 shadow-card sm:p-6">
          <p className="mb-4 text-label tracking-eyebrow text-muted-foreground uppercase">
            Official procedure & timelines
          </p>
          {track === "GENERAL" && (
            <div className="grid gap-4 text-sm leading-relaxed text-muted-foreground">
              <div className="grid gap-2 rounded-2xl bg-secondary/40 p-5">
                <h4 className="font-serif text-xl text-foreground">General Civil Marriage in Sri Lanka</h4>
                <p>
                  Governed by the General Marriage Ordinance. Applicable to all Sri Lankan citizens regardless of
                  ethnicity, except where customary Kandyan or Muslim laws are chosen.
                </p>
              </div>
              <div className="grid gap-3">
                <div className="rounded-2xl border border-border bg-background p-4">
                  <span className="font-medium text-foreground">
                    <StepNum n={1} /> Notice of Marriage
                  </span>
                  <p className="mt-1 text-sm">
                    Submit the Notice of Marriage to the Divisional Secretariat / Registrar of Marriages in the division
                    where either party has resided for at least 10 days.
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-background p-4">
                  <span className="font-medium text-foreground">
                    <StepNum n={2} /> 14-Day Waiting Period
                  </span>
                  <p className="mt-1 text-sm">
                    The notice is displayed publicly for 14 calendar days. Alternatively, a Special License can be
                    requested from the District Registrar for immediate registration with a nominal stamp duty.
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-background p-4">
                  <span className="font-medium text-foreground">
                    <StepNum n={3} /> Solemnization
                  </span>
                  <p className="mt-1 text-sm">
                    Registration takes place either at the Registrar’s office or at your wedding venue / Poruwa ceremony
                    with two witnesses present.
                  </p>
                </div>
              </div>
            </div>
          )}
          {track === "KANDYAN" && (
            <div className="grid gap-4 text-sm leading-relaxed text-muted-foreground">
              <div className="grid gap-2 rounded-2xl bg-secondary/40 p-5">
                <h4 className="font-serif text-xl text-foreground">Kandyan Marriage Ordinance</h4>
                <p>
                  Applicable when both parties are Kandyan Sinhalese whose parents were subject to Kandyan customary
                  law. Distinct property rights apply between <strong>Diga</strong> (bride moves to groom's house) and{" "}
                  <strong>Binna</strong> (groom moves to bride's ancestral house) marriages.
                </p>
              </div>
              <ul className="grid list-disc gap-2 pl-5 marker:text-primary">
                <li>
                  Notice submitted to the Kandyan Marriage Registrar in the relevant Central/Sabaragamuwa/Uva/Wayamba
                  division.
                </li>
                <li>Declaration of Diga or Binna customary designation recorded on the legal register.</li>
                <li>
                  The Registrar attends the Poruwa ceremony to register the marriage immediately following the ritual.
                </li>
              </ul>
            </div>
          )}
          {track === "MUSLIM" && (
            <div className="grid gap-4 text-sm leading-relaxed text-muted-foreground">
              <div className="grid gap-2 rounded-2xl bg-secondary/40 p-5">
                <h4 className="font-serif text-xl text-foreground">Muslim Marriage & Divorce Act (MMDA)</h4>
                <p>
                  Applicable to citizens who profess Islam. Nikah contracts are solemnized by an authorized Muslim
                  Marriage Registrar or Quazi.
                </p>
              </div>
              <ul className="grid list-disc gap-2 pl-5 marker:text-primary">
                <li>Nikah ceremony officiated by an authorized registrar alongside the Maulvi and Wali (guardian).</li>
                <li>Mahr (dowry/gift) amount and terms officially recorded in the Nikah register.</li>
                <li>Two male Muslim witnesses must sign the register at the conclusion of the Nikah ceremony.</li>
              </ul>
            </div>
          )}
          {track === "DESTINATION" && (
            <div className="grid gap-4 text-sm leading-relaxed text-muted-foreground">
              <div className="p-4 grid gap-2 rounded-2xl border border-warning/30 bg-warning/10 p-5 text-foreground">
                <h4 className="font-serif text-xl">Destination & Foreign Citizen Requirements</h4>
                <p>
                  Foreign nationals or Sri Lankan dual citizens can register legally in Sri Lanka. Under current
                  Registrar General’s Department regulations, foreign nationals must obtain a Security Clearance Report
                  / No Objection Certificate from their embassy or through the RGD portal.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-background p-4">
                  <span className="font-medium">4-Day Minimum Residency</span>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Couples must reside in Sri Lanka for at least 4 full days prior to submitting the notice of marriage
                    to the local registrar.
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-background p-4">
                  <span className="font-medium">Certificate Legalization / Apostille</span>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Following the wedding, submit the English marriage certificate to the Consular Affairs Division of
                    the Ministry of Foreign Affairs (Colombo) for official authentication/Apostille.
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="h-fit rounded-3xl border border-border bg-card p-5 shadow-card sm:p-6">
          <p className="mb-4 flex items-center gap-2 text-label tracking-eyebrow text-muted-foreground uppercase">
            <CalendarClock className="size-3.5" /> Your key dates
          </p>
          {milestones.length ? (
            <>
              <ol className="relative grid gap-4 pl-6">
                <span aria-hidden className="absolute top-2 bottom-2 left-[0.3rem] w-px bg-border" />
                {milestones.map((m) => {
                  const past = m.date.getTime() < Date.now();
                  return (
                    <li key={m.label} className="relative">
                      <span
                        aria-hidden
                        className={cn(
                          "absolute top-1.5 -left-6 size-2.5 rounded-full ring-4 ring-card",
                          past ? "bg-muted-foreground/40" : "bg-primary",
                        )}
                      />
                      <p className={cn("text-sm font-medium", past && "text-muted-foreground")}>{m.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {fmt(m.date)} · {m.hint}
                      </p>
                    </li>
                  );
                })}
              </ol>
              <p className="mt-4 text-xs text-muted-foreground">
                Worked back from your wedding date using the timelines on this page. Confirm exact dates with your
                registrar.
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Add your wedding date to see when to give notice.</p>
          )}
        </section>
      </div>

      <section className="rounded-3xl border border-border bg-card p-5 shadow-card sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-serif text-2xl">Essential documents</p>
            <p className="text-sm text-muted-foreground">
              Ensure you have physical originals and attested copies ready at least 3 weeks before your wedding date.
            </p>
          </div>
          <p className="text-sm text-muted-foreground tabular-nums">
            {docsDone} of {checklistItems.length} ready
          </p>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${(docsDone / checklistItems.length) * 100}%` }}
          />
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {checklistItems.map((item) => {
            const on = Boolean(checkedDocs[item.id]);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleDoc(item.id)}
                aria-pressed={on}
                className={cn(
                  "flex items-start gap-3 rounded-2xl border p-4 text-left transition",
                  on ? "border-primary/30 bg-primary/5" : "border-border bg-background hover:border-primary/40",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 transition",
                    on ? "border-primary bg-primary text-primary-foreground" : "border-border",
                  )}
                >
                  {on ? <Check className="size-3" strokeWidth={3} /> : null}
                </span>
                <span className={cn("text-sm", on && "text-muted-foreground line-through")}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-3xl border border-primary/20 bg-primary/5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-center gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <Building className="size-5" />
          </span>
          <div>
            <p className="font-serif text-xl">Book an authorized marriage registrar</p>
            <p className="text-sm text-muted-foreground">
              Browse licensed and experienced marriage registrars in Colombo, Kandy, Galle, and across all 25 districts
              of Sri Lanka.
            </p>
          </div>
        </div>
        <Button asChild shape="pill" className="shrink-0 gap-2">
          <Link href="/vendors?category=REGISTRAR">
            Browse registrars <ExternalLink className="size-3.5" />
          </Link>
        </Button>
      </section>
    </div>
  );
}
