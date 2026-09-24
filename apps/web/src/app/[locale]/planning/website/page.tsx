"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Globe,
  ExternalLink,
  Copy,
  Check,
  Lock,
  Plane,
  HelpCircle,
  Sparkles,
  Save,
  Plus,
  Trash2,
  Eye,
} from "lucide-react";
import { api } from "@ceylonweddings/web";
import { Button } from "@ceylonweddings/ui/components/button";
import { Input } from "@ceylonweddings/ui/components/input";
import { Switch } from "@ceylonweddings/ui/components/switch";
import { PageHeader } from "@ceylonweddings/ui/domain/page-header";
import { SectionCard } from "@ceylonweddings/ui/domain/section-card";
import { Reveal } from "@ceylonweddings/ui/domain/motion";
import { SignInPrompt, useWedding } from "../../../../components/use-wedding";
import { Link } from "../../../../i18n/navigation";

export default function WeddingWebsiteManagerPage() {
  const t = useTranslations();
  const { data, error, reload } = useWedding();

  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [successToast, setSuccessToast] = useState(false);

  // Form states
  const [slug, setSlug] = useState("");
  const [websiteEnabled, setWebsiteEnabled] = useState(true);
  const [travelNotes, setTravelNotes] = useState("");
  const [styleNotes, setStyleNotes] = useState("");
  const [faqs, setFaqs] = useState<Array<{ question: string; answer: string }>>([
    { question: "What is the dress code?", answer: "Traditional Sri Lankan attire or formal evening wear." },
    { question: "Is parking available at the venue?", answer: "Yes, valet and self-parking are available at the main gate." },
  ]);

  useEffect(() => {
    if (data) {
      setSlug(data.slug || "");
      setWebsiteEnabled(data.websiteEnabled ?? true);
      setTravelNotes(data.travelNotes || "");
      setStyleNotes(data.styleNotes || "");
      if (data.websiteFaq) {
        try {
          const parsed = JSON.parse(data.websiteFaq);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setFaqs(parsed);
          }
        } catch {
          // Keep default FAQs
        }
      }
    }
  }, [data]);

  if (!data) return <SignInPrompt error={error} />;

  const siteUrl = typeof window !== "undefined" ? `${window.location.origin}/w/${slug || data.slug}` : `/w/${slug || data.slug}`;

  function copyLink() {
    navigator.clipboard.writeText(siteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function addFaq() {
    setFaqs([...faqs, { question: "", answer: "" }]);
  }

  function removeFaq(index: number) {
    setFaqs(faqs.filter((_, i) => i !== index));
  }

  function updateFaq(index: number, field: "question" | "answer", value: string) {
    const updated = [...faqs];
    updated[index][field] = value;
    setFaqs(updated);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.wedding.update({
        slug: slug.trim().toLowerCase().replace(/\s+/g, "-"),
        websiteEnabled,
        travelNotes,
        styleNotes,
        websiteFaq: JSON.stringify(faqs.filter((f) => f.question.trim())),
      });
      await reload();
      setSuccessToast(true);
      setTimeout(() => setSuccessToast(false), 3000);
    } catch (err) {
      console.error("Failed to update wedding website settings", err);
      alert("Error saving settings. Please check your slug format.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Guest Wedding Website"
          description="Customize your shareable wedding website, RSVP link, FAQs, and overseas guest travel notes"
        />
        <div className="flex items-center gap-2">
          <Button asChild variant="secondary" size="sm">
            <a href={siteUrl} target="_blank" rel="noopener noreferrer">
              <Eye className="size-4 mr-1.5" />
              Live Preview
            </a>
          </Button>
          <Button onClick={handleSave} disabled={saving} size="sm">
            <Save className="size-4 mr-1.5" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {successToast && (
        <Reveal direction="down">
          <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/30 p-3 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <Check className="size-4" />
            Wedding website settings updated successfully!
          </div>
        </Reveal>
      )}

      {/* Website Link & Visibility */}
      <SectionCard title="Website Address & Visibility" icon={Globe}>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border">
            <div>
              <p className="font-semibold text-sm">Enable Public Wedding Website</p>
              <p className="text-xs text-muted-foreground">
                When enabled, guests can view your schedule, travel info, and submit RSVPs online.
              </p>
            </div>
            <Switch checked={websiteEnabled} onCheckedChange={setWebsiteEnabled} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Custom Web Address (URL Slug)</label>
            <div className="flex gap-2">
              <div className="flex flex-1 items-center rounded-xl border bg-secondary/30 px-3 text-xs text-muted-foreground">
                <span className="shrink-0">{typeof window !== "undefined" ? window.location.origin : ""}/w/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full bg-transparent px-1 py-2 font-medium text-foreground outline-none"
                  placeholder="nimali-and-kasun"
                />
              </div>
              <Button type="button" variant="secondary" onClick={copyLink} size="sm">
                {copied ? <Check className="size-4 text-emerald-600 mr-1" /> : <Copy className="size-4 mr-1" />}
                {copied ? "Copied" : "Copy Link"}
              </Button>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Travel & Accommodation for Diaspora & Outstation Guests */}
      <SectionCard title="Travel & Stay Guide (For Diaspora & Outstation Guests)" icon={Plane}>
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Provide flight, hotel, airport pickup, or monsoon travel guidelines for friends and family traveling from overseas or across Sri Lanka.
          </p>
          <textarea
            value={travelNotes}
            onChange={(e) => setTravelNotes(e.target.value)}
            rows={4}
            placeholder="e.g. Recommended hotels near the venue with special room block rates: Cinnamon Grand Colombo, Galle Face Hotel. Airport pickups can be coordinated via WhatsApp..."
            className="w-full rounded-xl border border-border/80 bg-background/70 px-3 py-2.5 text-xs leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </SectionCard>

      {/* Wedding FAQs */}
      <SectionCard title="Guest Questions & Answers (FAQs)" icon={HelpCircle}>
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Address common questions regarding dress codes, gift envelope preferences, photo policies, and ceremony timings.
          </p>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div key={index} className="p-4 rounded-xl border bg-card space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={faq.question}
                    onChange={(e) => updateFaq(index, "question", e.target.value)}
                    placeholder="Question (e.g. Are children welcome?)"
                    className="w-full font-medium text-xs bg-transparent border-b pb-1 outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => removeFaq(index)}
                    className="text-muted-foreground hover:text-destructive p-1 rounded-md"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <textarea
                  value={faq.answer}
                  onChange={(e) => updateFaq(index, "answer", e.target.value)}
                  rows={2}
                  placeholder="Answer..."
                  className="w-full text-xs text-muted-foreground bg-transparent outline-none resize-none"
                />
              </div>
            ))}
          </div>

          <Button type="button" variant="secondary" onClick={addFaq} size="sm">
            <Plus className="size-4 mr-1.5" />
            Add Another FAQ
          </Button>
        </div>
      </SectionCard>

      {/* Dress Code & Style Notes */}
      <SectionCard title="Dress Code & Celebration Notes" icon={Sparkles}>
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Share any special attire color palettes, traditional Poruwa decor details, or reception themes.
          </p>
          <textarea
            value={styleNotes}
            onChange={(e) => setStyleNotes(e.target.value)}
            rows={3}
            placeholder="e.g. Poruwa ceremony starts promptly at the auspicious Nekath time. Traditional Kandyan sarees or national dress welcome."
            className="w-full rounded-xl border border-border/80 bg-background/70 px-3 py-2.5 text-xs leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </SectionCard>
    </div>
  );
}
