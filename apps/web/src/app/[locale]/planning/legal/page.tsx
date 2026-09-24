"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  FileCheck,
  Calendar,
  AlertCircle,
  Clock,
  ExternalLink,
  CheckSquare,
  Square,
  BookOpen,
  Scale,
  Users,
  Building,
} from "lucide-react";
import { Button } from "@ceylonweddings/ui/components/button";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { Reveal, Stagger, StaggerItem } from "@ceylonweddings/ui/domain/motion";
import { Link } from "../../../../i18n/navigation";

export default function LegalGuidePage() {
  const t = useTranslations();
  const [track, setTrack] = useState<"GENERAL" | "KANDYAN" | "MUSLIM" | "DESTINATION">("GENERAL");
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});

  function toggleDoc(key: string) {
    setCheckedDocs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const checklistItems = [
    { id: "birth_cert", label: "Original Birth Certificates of both Bride & Groom (with official English translations if abroad)" },
    { id: "nic_passport", label: "National Identity Cards (NIC) or valid Passports for both partners" },
    { id: "witness_ids", label: "National Identity Cards (NIC) or Passports of two adult witnesses (over 18 years)" },
    { id: "single_affidavit", label: "Affidavit of Single Status (Bachelorhood / Spinsterhood) — mandatory for foreigners / dual citizens" },
    { id: "divorce_decree", label: "Divorce Decree Absolute (Decree Nisi + Absolute) or Death Certificate of previous spouse (if applicable)" },
    { id: "four_day_proof", label: "Proof of 4-day minimum stay in Sri Lanka prior to notice (Hotel receipt / stamp for destination weddings)" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marriage Registration & Legal Guide"
        description="Step-by-step civil registration requirements, official notice countdown, and documentation checklist for Sri Lanka"
      />

      {/* Track Selector Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-secondary/60 border">
        <Button
          type="button"
          size="sm"
          variant={track === "GENERAL" ? "default" : "ghost"}
          onClick={() => setTrack("GENERAL")}
          className="rounded-xl text-xs"
        >
          <Building className="size-3.5 mr-1.5" />
          General Marriage Ordinance
        </Button>
        <Button
          type="button"
          size="sm"
          variant={track === "KANDYAN" ? "default" : "ghost"}
          onClick={() => setTrack("KANDYAN")}
          className="rounded-xl text-xs"
        >
          <Scale className="size-3.5 mr-1.5" />
          Kandyan Marriage Ordinance
        </Button>
        <Button
          type="button"
          size="sm"
          variant={track === "MUSLIM" ? "default" : "ghost"}
          onClick={() => setTrack("MUSLIM")}
          className="rounded-xl text-xs"
        >
          <BookOpen className="size-3.5 mr-1.5" />
          Muslim Marriage (MMDA)
        </Button>
        <Button
          type="button"
          size="sm"
          variant={track === "DESTINATION" ? "default" : "ghost"}
          onClick={() => setTrack("DESTINATION")}
          className="rounded-xl text-xs"
        >
          <Users className="size-3.5 mr-1.5" />
          Diaspora & Destination Couples
        </Button>
      </div>

      {/* Main Process Overview Card */}
      <SectionCard title="Official Procedure & Timelines" icon={Calendar}>
        {track === "GENERAL" && (
          <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
            <div className="p-4 rounded-xl bg-secondary/30 border space-y-2">
              <h4 className="font-semibold text-foreground text-sm">General Civil Marriage in Sri Lanka</h4>
              <p>
                Governed by the General Marriage Ordinance. Applicable to all Sri Lankan citizens regardless of ethnicity, except where customary Kandyan or Muslim laws are chosen.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="p-3.5 rounded-xl border bg-card">
                <span className="font-bold text-primary">Step 1: Notice of Marriage</span>
                <p className="mt-1 text-[11px]">
                  Submit the Notice of Marriage to the Divisional Secretariat / Registrar of Marriages in the division where either party has resided for at least 10 days.
                </p>
              </div>
              <div className="p-3.5 rounded-xl border bg-card">
                <span className="font-bold text-primary">Step 2: 14-Day Waiting Period</span>
                <p className="mt-1 text-[11px]">
                  The notice is displayed publicly for 14 calendar days. Alternatively, a Special License can be requested from the District Registrar for immediate registration with a nominal stamp duty.
                </p>
              </div>
              <div className="p-3.5 rounded-xl border bg-card">
                <span className="font-bold text-primary">Step 3: Solemnization</span>
                <p className="mt-1 text-[11px]">
                  Registration takes place either at the Registrar’s office or at your wedding venue / Poruwa ceremony with two witnesses present.
                </p>
              </div>
            </div>
          </div>
        )}

        {track === "KANDYAN" && (
          <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
            <div className="p-4 rounded-xl bg-secondary/30 border space-y-2">
              <h4 className="font-semibold text-foreground text-sm">Kandyan Marriage Ordinance</h4>
              <p>
                Applicable when both parties are Kandyan Sinhalese whose parents were subject to Kandyan customary law. Distinct property rights apply between <strong>Diga</strong> (bride moves to groom's house) and <strong>Binna</strong> (groom moves to bride's ancestral house) marriages.
              </p>
            </div>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Notice submitted to the Kandyan Marriage Registrar in the relevant Central/Sabaragamuwa/Uva/Wayamba division.</li>
              <li>Declaration of Diga or Binna customary designation recorded on the legal register.</li>
              <li>The Registrar attends the Poruwa ceremony to register the marriage immediately following the ritual.</li>
            </ul>
          </div>
        )}

        {track === "MUSLIM" && (
          <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
            <div className="p-4 rounded-xl bg-secondary/30 border space-y-2">
              <h4 className="font-semibold text-foreground text-sm">Muslim Marriage & Divorce Act (MMDA)</h4>
              <p>
                Applicable to citizens who profess Islam. Nikah contracts are solemnized by an authorized Muslim Marriage Registrar or Quazi.
              </p>
            </div>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Nikah ceremony officiated by an authorized registrar alongside the Maulvi and Wali (guardian).</li>
              <li>Mahr (dowry/gift) amount and terms officially recorded in the Nikah register.</li>
              <li>Two male Muslim witnesses must sign the register at the conclusion of the Nikah ceremony.</li>
            </ul>
          </div>
        )}

        {track === "DESTINATION" && (
          <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-100 p-4 space-y-2">
              <h4 className="font-semibold text-sm">Destination & Foreign Citizen Requirements</h4>
              <p>
                Foreign nationals or Sri Lankan dual citizens can register legally in Sri Lanka. Under current Registrar General’s Department regulations, foreign nationals must obtain a Security Clearance Report / No Objection Certificate from their embassy or through the RGD portal.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="p-3.5 rounded-xl border bg-card">
                <span className="font-bold">4-Day Minimum Residency</span>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Couples must reside in Sri Lanka for at least 4 full days prior to submitting the notice of marriage to the local registrar.
                </p>
              </div>
              <div className="p-3.5 rounded-xl border bg-card">
                <span className="font-bold">Certificate Legalization / Apostille</span>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Following the wedding, submit the English marriage certificate to the Consular Affairs Division of the Ministry of Foreign Affairs (Colombo) for official authentication/Apostille.
                </p>
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      {/* Interactive Document Checklist */}
      <SectionCard title="Essential Documents Checklist" icon={FileCheck}>
        <div className="space-y-2.5">
          <p className="text-xs text-muted-foreground">
            Ensure you have physical originals and attested copies ready at least 3 weeks before your wedding date:
          </p>
          <div className="space-y-2">
            {checklistItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleDoc(item.id)}
                className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${
                  checkedDocs[item.id] ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-50" : "bg-card hover:bg-secondary/30"
                }`}
              >
                {checkedDocs[item.id] ? (
                  <CheckSquare className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                ) : (
                  <Square className="size-4 shrink-0 text-muted-foreground mt-0.5" />
                )}
                <span className={`text-xs ${checkedDocs[item.id] ? "line-through opacity-80" : ""}`}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* Registrar Directory CTA */}
      <SectionCard title="Book an Authorized Marriage Registrar" icon={Building}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground">
              Browse licensed and experienced marriage registrars in Colombo, Kandy, Galle, and across all 25 districts of Sri Lanka.
            </p>
          </div>
          <Button asChild size="sm">
            <Link href="/vendors?category=REGISTRAR">
              Browse Registrars
              <ExternalLink className="size-3.5 ml-1.5" />
            </Link>
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}
