"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Calendar, Heart, MapPin, Palette, Sparkles, Users } from "lucide-react";
import {
  weddingStyleSchema,
  weddingTypeSchema,
  type WeddingStyle,
  type WeddingType,
} from "@ceylonweddings/contracts";
import { Button } from "@ceylonweddings/ui/components/button";
import { DatePicker } from "@ceylonweddings/ui/components/date-picker";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { Input } from "@ceylonweddings/ui/components/input";
import { Switch } from "@ceylonweddings/ui/components/switch";
import { ChoiceCard } from "@ceylonweddings/ui/domain/choice-card";
import { FieldBlock } from "@ceylonweddings/ui/domain/creator-form";
import { AnimatePresence, motion, useReducedMotion } from "@ceylonweddings/ui/domain/motion";
import { StyleStoryPicker } from "@ceylonweddings/ui/domain/wedding-presentation";
import { cn } from "@ceylonweddings/ui/utils";
import { PlaceFields } from "../../../../components/place-fields";

export type CoupleWizardData = {
  partnerOneName: string;
  partnerTwoName: string;
  date: string;
  city: string;
  district: string;
  planningFromOverseas: boolean;
  types: WeddingType[];
  guestCountEstimate: number;
  style: WeddingStyle;
};

const STEPS = ["names", "date", "place", "types", "guests", "style"] as const;
type Step = (typeof STEPS)[number];

const STEP_META: Record<Step, { label: string; title: string; subtitle: string; icon: typeof Heart }> = {
  names: {
    label: "Step 1 of 6",
    title: "Who is getting married?",
    subtitle: "We'll personalize your planning checklist, guest invitations, and wedding home with these names.",
    icon: Heart,
  },
  date: {
    label: "Step 2 of 6",
    title: "When is the big day?",
    subtitle: "A wedding date lets us generate your milestone countdown and nekath timeline. You can also skip for now.",
    icon: Calendar,
  },
  place: {
    label: "Step 3 of 6",
    title: "Where are you celebrating?",
    subtitle: "Setting your celebration district helps match the best local hall, poruwa, and catering vendors.",
    icon: MapPin,
  },
  types: {
    label: "Step 4 of 6",
    title: "Which ceremonies are you having?",
    subtitle: "Select every celebration on your schedule to auto-build your tailored itinerary.",
    icon: Sparkles,
  },
  guests: {
    label: "Step 5 of 6",
    title: "About how many guests are you expecting?",
    subtitle: "A rough headcount is all we need to calibrate your budget buckets and seating planner.",
    icon: Users,
  },
  style: {
    label: "Step 6 of 6",
    title: "What is your wedding vibe & aesthetic?",
    subtitle: "Choose a design theme to style your digital invite and wedding stationery.",
    icon: Palette,
  },
};

const STYLE_OPTIONS: Array<{ value: WeddingStyle; label: string; swatches: string[] }> = [
  { value: "MINIMALIST", label: "Minimalist", swatches: ["#F7F3EC", "#D9D2C5", "#2F2F2F", "#9A9488", "#E8E2D6"] },
  { value: "TRADITIONAL", label: "Traditional", swatches: ["#7A1F2B", "#C4A574", "#F4E4D0", "#1F4D3A", "#E8D5B5"] },
  { value: "KANDYAN", label: "Kandyan", swatches: ["#C4A574", "#F4E4D0", "#7A1F2B", "#1F4D3A", "#E8D5B5"] },
  { value: "MODERN", label: "Modern", swatches: ["#1F4B73", "#D7E6F5", "#0F172A", "#94A3B8", "#F8FAFC"] },
  { value: "BEACH", label: "Beach", swatches: ["#0F766E", "#F4E1C1", "#155E75", "#F8FAFC", "#67E8F9"] },
];

export const STYLE_COLORS: Record<WeddingStyle, string[]> = {
  MINIMALIST: ["#F7F3EC", "#D9D2C5", "#2F2F2F", "#9A9488", "#E8E2D6"],
  TRADITIONAL: ["#7A1F2B", "#C4A574", "#F4E4D0", "#1F4D3A", "#E8D5B5"],
  KANDYAN: ["#C4A574", "#F4E4D0", "#7A1F2B", "#1F4D3A", "#E8D5B5"],
  MODERN: ["#1F4B73", "#D7E6F5", "#0F172A", "#94A3B8", "#F8FAFC"],
  BEACH: ["#0F766E", "#F4E1C1", "#155E75", "#F8FAFC", "#67E8F9"],
};

const TYPE_OPTIONS: Array<{ value: WeddingType; title: string; description: string; emoji: string }> = [
  { value: "KANDYAN_PORUWA", title: "Kandyan Poruwa", description: "Traditional Sinhala ceremony with osariya and nilame.", emoji: "🪷" },
  { value: "WESTERN_CHURCH", title: "Western / Church", description: "Church vows and elegant seated reception.", emoji: "⛪" },
  { value: "HINDU", title: "Hindu Mandapam", description: "Vibrant Mandapam rituals, sacred fire, and garlands.", emoji: "🪔" },
  { value: "MUSLIM_NIKAH", title: "Nikah & Walima", description: "Solemn Nikah blessing and festive Walima dinner.", emoji: "🌙" },
  { value: "HOMECOMING", title: "Homecoming", description: "Bride welcoming celebration after the main ceremony.", emoji: "🏡" },
  { value: "ENGAGEMENT", title: "Engagement Party", description: "Intimate family ring exchange and dinner.", emoji: "💎" },
  { value: "MEHNDI", title: "Mehndi Night", description: "Henna night filled with folk music and dancing.", emoji: "✨" },
  { value: "DESTINATION", title: "Beach / Destination", description: "Coastal resort or colonial fortress celebration.", emoji: "🌴" },
];

const GUEST_PRESETS = [
  { count: 50, label: "Intimate", hint: "Closest family & friends" },
  { count: 100, label: "Small", hint: "Family circle" },
  { count: 150, label: "Classic", hint: "Standard Sri Lankan wedding" },
  { count: 250, label: "Grand", hint: "Both extended families" },
  { count: 400, label: "Celebration", hint: "Village + overseas guests" },
];

export function CoupleWizardInline({
  initialData,
  onBack,
  onProceed,
}: {
  initialData?: Partial<CoupleWizardData>;
  onBack: () => void;
  onProceed: (data: CoupleWizardData) => void;
}) {
  const reduce = useReducedMotion();
  const [step, setStep] = useState<Step>("names");
  const [error, setError] = useState<string | null>(null);

  const [partnerOneName, setPartnerOneName] = useState(initialData?.partnerOneName ?? "");
  const [partnerTwoName, setPartnerTwoName] = useState(initialData?.partnerTwoName ?? "");
  const [date, setDate] = useState(initialData?.date ?? "");
  const [city, setCity] = useState(initialData?.city ?? "");
  const [district, setDistrict] = useState(initialData?.district ?? "");
  const [planningFromOverseas, setPlanningFromOverseas] = useState(initialData?.planningFromOverseas ?? false);
  const [types, setTypes] = useState<WeddingType[]>(initialData?.types ?? ["KANDYAN_PORUWA"]);
  const [guestCountEstimate, setGuestCountEstimate] = useState(initialData?.guestCountEstimate ?? 150);
  const [style, setStyle] = useState<WeddingStyle>(initialData?.style ?? "KANDYAN");

  const stepIndex = STEPS.indexOf(step);

  function continueFrom(current: Step) {
    setError(null);
    if (current === "names") {
      if (partnerOneName.trim().length < 2 || partnerTwoName.trim().length < 2) {
        setError("Please enter both partner names (minimum 2 characters each).");
        return;
      }
      setStep("date");
      return;
    }
    if (current === "date") {
      setStep("place");
      return;
    }
    if (current === "place") {
      setStep("types");
      return;
    }
    if (current === "types") {
      if (!types.length) {
        setError("Please pick at least one celebration type.");
        return;
      }
      setStep("guests");
      return;
    }
    if (current === "guests") {
      setStep("style");
      return;
    }
    if (current === "style") {
      onProceed({
        partnerOneName: partnerOneName.trim(),
        partnerTwoName: partnerTwoName.trim(),
        date,
        city: city.trim(),
        district: district.trim(),
        planningFromOverseas,
        types: types.length ? types : ["KANDYAN_PORUWA"],
        guestCountEstimate,
        style,
      });
    }
  }

  function handleBack() {
    setError(null);
    if (stepIndex === 0) {
      onBack();
    } else {
      setStep(STEPS[stepIndex - 1]!);
    }
  }

  function toggleType(value: WeddingType) {
    setTypes((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  }

  const namesReady = partnerOneName.trim().length >= 2 && partnerTwoName.trim().length >= 2;
  const typesReady = types.length > 0;
  const currentMeta = STEP_META[step];
  const StepIcon = currentMeta.icon;

  let body = null;

  if (step === "names") {
    body = (
      <div className="grid gap-5 sm:grid-cols-2">
        <FieldBlock label="Partner One" htmlFor="partnerOne" hint="Your name as the account creator">
          <Input
            id="partnerOne"
            autoComplete="given-name"
            placeholder="e.g. Nimali"
            value={partnerOneName}
            onChange={(e) => setPartnerOneName(e.target.value)}
            required
            minLength={2}
            maxLength={80}
            className="h-12 text-base"
          />
        </FieldBlock>
        <FieldBlock label="Partner Two" htmlFor="partnerTwo" hint="Your fiancé(e)'s name">
          <Input
            id="partnerTwo"
            autoComplete="family-name"
            placeholder="e.g. Kasun"
            value={partnerTwoName}
            onChange={(e) => setPartnerTwoName(e.target.value)}
            required
            minLength={2}
            maxLength={80}
            className="h-12 text-base"
          />
        </FieldBlock>
      </div>
    );
  } else if (step === "date") {
    body = (
      <div className="grid gap-6">
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs leading-relaxed text-muted-foreground">
          💡 <span className="font-semibold text-foreground">Tip:</span> If you haven&apos;t finalized your auspicious wedding nekath date, you can click <span className="font-semibold text-foreground">Skip for now</span> below and update it anytime in your dashboard.
        </div>
        <FieldBlock label="Wedding Date" hint="Choose your scheduled wedding date">
          <div className="max-w-md">
            <DatePicker value={date || null} onChange={setDate} placeholder="Select date" />
          </div>
        </FieldBlock>
      </div>
    );
  } else if (step === "place") {
    body = (
      <div className="grid gap-6">
        <PlaceFields city={city} district={district} onCityChange={setCity} onDistrictChange={setDistrict} />
        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-border/80 bg-card/60 p-4 transition hover:bg-card">
          <div className="grid gap-0.5">
            <span className="text-sm font-medium">Planning from overseas (Diaspora)</span>
            <span className="text-xs text-muted-foreground">We&apos;ll highlight vendors offering remote consultations & currency options.</span>
          </div>
          <Switch checked={planningFromOverseas} onCheckedChange={setPlanningFromOverseas} />
        </label>
      </div>
    );
  } else if (step === "types") {
    body = (
      <div className="grid gap-4">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {TYPE_OPTIONS.filter((o) => weddingTypeSchema.options.includes(o.value)).map((option) => {
            const selected = types.includes(option.value);
            return (
              <motion.button
                key={option.value}
                type="button"
                onClick={() => toggleType(option.value)}
                whileHover={reduce ? undefined : { scale: 1.02 }}
                whileTap={reduce ? undefined : { scale: 0.98 }}
                transition={{ type: "spring", stiffness: 450, damping: 25 }}
                className={cn(
                  "flex items-start gap-3 rounded-2xl border p-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selected
                    ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/30"
                    : "border-border/70 bg-card/60 hover:border-primary/40 hover:bg-card",
                )}
              >
                <span className="text-2xl shrink-0">{option.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className={cn("text-sm font-semibold", selected ? "text-primary" : "text-foreground")}>
                      {option.title}
                    </p>
                    <span
                      className={cn(
                        "grid size-5 place-items-center rounded-full border text-[10px] font-bold transition-colors",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/30 text-transparent",
                      )}
                    >
                      ✓
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{option.description}</p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  } else if (step === "guests") {
    body = (
      <div className="grid gap-6">
        <div className="grid gap-3 sm:grid-cols-3">
          {GUEST_PRESETS.map((preset) => (
            <ChoiceCard
              key={preset.count}
              title={`${preset.label} · ${preset.count}`}
              description={preset.hint}
              icon={<Users className="size-5" />}
              selected={guestCountEstimate === preset.count}
              onSelect={() => setGuestCountEstimate(preset.count)}
            />
          ))}
        </div>
        <FieldBlock label="Or enter exact headcount" htmlFor="guests" hint="You can refine this with your exact guest list later">
          <div className="max-w-xs">
            <Input
              id="guests"
              type="number"
              min={10}
              max={5000}
              value={guestCountEstimate}
              onChange={(e) => setGuestCountEstimate(Number(e.target.value) || 10)}
              className="h-12 text-base font-semibold"
            />
          </div>
        </FieldBlock>
      </div>
    );
  } else if (step === "style") {
    body = (
      <div className="grid gap-4">
        <StyleStoryPicker
          value={style}
          options={STYLE_OPTIONS}
          colors={STYLE_COLORS[style]}
          onChange={(v) => setStyle(weddingStyleSchema.parse(v))}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* Progress header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
            <StepIcon className="size-4" />
          </span>
          <div>
            <p className="text-[11px] font-semibold tracking-wider text-primary uppercase">{currentMeta.label}</p>
            <p className="text-xs text-muted-foreground">{stepIndex + 1} of {STEPS.length} questions</p>
          </div>
        </div>

        {/* Step dots */}
        <div className="flex items-center gap-1.5">
          {STEPS.map((s, idx) => (
            <div
              key={s}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                idx === stepIndex
                  ? "w-6 bg-primary"
                  : idx < stepIndex
                    ? "w-2 bg-primary/50"
                    : "w-2 bg-muted",
              )}
            />
          ))}
        </div>
      </div>

      {/* Main Glassmorphic Panel */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card/80 p-6 shadow-xl backdrop-blur-md sm:p-8">
        <header className="mb-6 grid gap-1.5">
          <h2 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">
            {currentMeta.title}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {currentMeta.subtitle}
          </p>
        </header>

        {error ? (
          <div className="mb-4">
            <FormStatus tone="destructive">{error}</FormStatus>
          </div>
        ) : null}

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={reduce ? false : { opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? undefined : { opacity: 0, x: -20 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {body}
          </motion.div>
        </AnimatePresence>

        {/* Action footer */}
        <div className="mt-8 flex items-center justify-between border-t border-border/60 pt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={handleBack}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            {stepIndex === 0 ? "Change role" : "Back"}
          </Button>

          <div className="flex items-center gap-2.5">
            {step === "date" || step === "place" ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => continueFrom(step)}
                className="text-xs"
              >
                Skip for now
              </Button>
            ) : null}

            <Button
              type="button"
              onClick={() => continueFrom(step)}
              disabled={(step === "names" && !namesReady) || (step === "types" && !typesReady)}
              className="gap-2 px-6 shadow-md shadow-primary/20"
            >
              {step === "style" ? "Continue to Account Details" : "Continue"}
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
