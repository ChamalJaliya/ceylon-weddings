"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, Heart, Sparkles, Users } from "lucide-react";
import { api } from "@ceylonweddings/web";
import {
  weddingStyleSchema,
  weddingTypeSchema,
  type MineWedding,
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
import { motion, useConfetti } from "@ceylonweddings/ui/domain/motion";
import { OnboardWizard, useWizardDirection } from "@ceylonweddings/ui/domain/onboard-wizard";
import { StyleStoryPicker } from "@ceylonweddings/ui/domain/wedding-presentation";
import { useRouter } from "../../../../i18n/navigation";
import { SignInPrompt } from "../../../../components/use-wedding";
import { PlaceFields } from "../../../../components/place-fields";

const STEPS = ["names", "date", "place", "types", "guests", "style", "celebrate"] as const;
type Step = (typeof STEPS)[number];

const STYLE_OPTIONS: Array<{ value: WeddingStyle; label: string; swatches: string[] }> = [
  { value: "MINIMALIST", label: "Minimalist", swatches: ["#F7F3EC", "#D9D2C5", "#2F2F2F", "#9A9488", "#E8E2D6"] },
  { value: "TRADITIONAL", label: "Traditional", swatches: ["#7A1F2B", "#C4A574", "#F4E4D0", "#1F4D3A", "#E8D5B5"] },
  { value: "KANDYAN", label: "Kandyan", swatches: ["#C4A574", "#F4E4D0", "#7A1F2B", "#1F4D3A", "#E8D5B5"] },
  { value: "MODERN", label: "Modern", swatches: ["#1F4B73", "#D7E6F5", "#0F172A", "#94A3B8", "#F8FAFC"] },
  { value: "BEACH", label: "Beach", swatches: ["#0F766E", "#F4E1C1", "#155E75", "#F8FAFC", "#67E8F9"] },
];

const STYLE_COLORS: Record<WeddingStyle, string[]> = {
  MINIMALIST: ["#F7F3EC", "#D9D2C5", "#2F2F2F", "#9A9488", "#E8E2D6"],
  TRADITIONAL: ["#7A1F2B", "#C4A574", "#F4E4D0", "#1F4D3A", "#E8D5B5"],
  KANDYAN: ["#C4A574", "#F4E4D0", "#7A1F2B", "#1F4D3A", "#E8D5B5"],
  MODERN: ["#1F4B73", "#D7E6F5", "#0F172A", "#94A3B8", "#F8FAFC"],
  BEACH: ["#0F766E", "#F4E1C1", "#155E75", "#F8FAFC", "#67E8F9"],
};

const TYPE_OPTIONS: Array<{
  value: WeddingType;
  title: string;
  description: string;
  image: string;
}> = [
  {
    value: "KANDYAN_PORUWA",
    title: "Kandyan Poruwa",
    description: "Traditional Sinhala ceremony with osariya and nilame.",
    image: "https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=900&q=80",
  },
  {
    value: "WESTERN_CHURCH",
    title: "Western / Church",
    description: "Church vows and a seated reception.",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=900&q=80",
  },
  {
    value: "HINDU",
    title: "Hindu",
    description: "Mandapam ceremony, rituals, and colour.",
    image: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=900&q=80",
  },
  {
    value: "MUSLIM_NIKAH",
    title: "Nikah & Walima",
    description: "Nikah ceremony and walima celebration.",
    image: "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=900&q=80",
  },
  {
    value: "HOMECOMING",
    title: "Homecoming",
    description: "The bride’s homecoming after the poruwa.",
    image: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=900&q=80",
  },
  {
    value: "ENGAGEMENT",
    title: "Engagement",
    description: "A smaller ceremony before the wedding day.",
    image: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=900&q=80",
  },
  {
    value: "MEHNDI",
    title: "Mehndi",
    description: "Henna night with music and close family.",
    image: "https://images.unsplash.com/photo-1591604129939-f30070070ea1?w=900&q=80",
  },
  {
    value: "DESTINATION",
    title: "Destination",
    description: "Beach, fort, or overseas celebration.",
    image: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=900&q=80",
  },
];

const GUEST_PRESETS = [
  { count: 50, label: "Intimate", hint: "Close family" },
  { count: 100, label: "Small", hint: "Family & friends" },
  { count: 150, label: "Classic", hint: "Most Sri Lankan weddings" },
  { count: 250, label: "Grand", hint: "Both families" },
  { count: 400, label: "Very large", hint: "Village + overseas" },
];

function placeholderPartner(name: string) {
  return !name.trim() || name.trim().toLowerCase() === "partner";
}

function stepFromParam(raw: string | null): Step {
  if (raw && STEPS.includes(raw as Step)) return raw as Step;
  return "names";
}

export default function CoupleOnboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { saveDateBurst, burst } = useConfetti();

  const [wedding, setWedding] = useState<MineWedding | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<Step>(() => stepFromParam(searchParams.get("step")));

  const [partnerOneName, setPartnerOneName] = useState("");
  const [partnerTwoName, setPartnerTwoName] = useState("");
  const [date, setDate] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [planningFromOverseas, setPlanningFromOverseas] = useState(false);
  const [types, setTypes] = useState<WeddingType[]>([]);
  const [guestCountEstimate, setGuestCountEstimate] = useState(150);
  const [style, setStyle] = useState<WeddingStyle>("KANDYAN");

  const load = useCallback(async () => {
    const mine = await api.wedding.mine();
    setWedding(mine);
    setPartnerOneName(mine.partnerOneName);
    setPartnerTwoName(placeholderPartner(mine.partnerTwoName) ? "" : mine.partnerTwoName);
    setDate(mine.date ? mine.date.slice(0, 10) : "");
    setCity(mine.city ?? "");
    setDistrict(mine.district ?? "");
    setPlanningFromOverseas(mine.planningFromOverseas);
    setTypes(mine.types.length ? mine.types : ["KANDYAN_PORUWA"]);
    setGuestCountEstimate(mine.guestCountEstimate || 150);
    setStyle(mine.style);
  }, []);

  useEffect(() => {
    load().catch((err: Error) => setError(err.message));
  }, [load]);

  const direction = useWizardDirection(step, STEPS);
  const stepIndex = STEPS.indexOf(step);

  useEffect(() => {
    if (step === "celebrate") void saveDateBurst();
  }, [saveDateBurst, step]);

  function goTo(next: Step) {
    setStep(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next === "names" || next === "celebrate") params.delete("step");
    else params.set("step", next);
    const qs = params.toString();
    router.replace(qs ? `/planning/onboard?${qs}` : "/planning/onboard");
  }

  async function persist(body: Parameters<typeof api.wedding.update>[0]) {
    setSaving(true);
    setError(null);
    try {
      const next = await api.wedding.update(body);
      setWedding(next);
      return next;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function continueFrom(current: Step) {
    try {
      if (current === "names") {
        await persist({ partnerOneName: partnerOneName.trim(), partnerTwoName: partnerTwoName.trim() });
        goTo("date");
        return;
      }
      if (current === "date") {
        await persist({ date: date || null });
        goTo("place");
        return;
      }
      if (current === "place") {
        await persist({
          city: city.trim() || null,
          district: district.trim() || null,
          planningFromOverseas,
        });
        goTo("types");
        return;
      }
      if (current === "types") {
        const selected = types.length ? types : (["KANDYAN_PORUWA"] satisfies WeddingType[]);
        await persist({ types: selected, seedMissingTasks: true });
        goTo("guests");
        return;
      }
      if (current === "guests") {
        await persist({ guestCountEstimate });
        goTo("style");
        return;
      }
      if (current === "style") {
        await persist({ style, colors: STYLE_COLORS[style], completeOnboarding: true });
        goTo("celebrate");
      }
    } catch {
      /* status already set */
    }
  }

  if (!wedding && error) return <SignInPrompt error={error} />;
  if (!wedding) {
    return (
      <div className="mx-auto grid w-full max-w-3xl place-items-center py-24">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Loading onboarding…
        </div>
      </div>
    );
  }

  const namesReady = partnerOneName.trim().length >= 2 && partnerTwoName.trim().length >= 2;
  const typesReady = types.length > 0;
  const questionTotal = STEPS.length - 1;
  const progress = {
    current: step === "celebrate" ? questionTotal : stepIndex + 1,
    total: questionTotal,
  };

  const copy: Record<Step, { label: string; title: string; description: string }> = {
    names: {
      label: "Question 1 of 6",
      title: "Who is getting married?",
      description: "We’ll use these names on your wedding website, invites, and planning hub.",
    },
    date: {
      label: "Question 2 of 6",
      title: "When is the big day?",
      description: "A date helps us count down and suggest a checklist. Skip if you’re still deciding.",
    },
    place: {
      label: "Question 3 of 6",
      title: "Where will you celebrate?",
      description: "City and district help vendors line up travel and halls. Skip if you don’t know yet.",
    },
    types: {
      label: "Question 4 of 6",
      title: "What kind of wedding is it?",
      description: "Pick every ceremony you’re planning. This seeds your checklist and event list.",
    },
    guests: {
      label: "Question 5 of 6",
      title: "About how many guests?",
      description: "A rough headcount is enough — you can refine the list later.",
    },
    style: {
      label: "Question 6 of 6",
      title: "What’s the look and feel?",
      description: "This sets your colour story. You can change it anytime in the studio.",
    },
    celebrate: {
      label: "Complete",
      title: "Your wedding home is ready",
      description: "Names, date, and style are saved. Next: shortlist vendors and invite family.",
    },
  };

  function toggleType(value: WeddingType) {
    setTypes((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  }

  let body = null;
  if (step === "names") {
    body = (
      <div className="grid gap-5">
        {error ? <FormStatus tone="destructive">{error}</FormStatus> : null}
        <FieldBlock label="Partner one" htmlFor="partnerOne" hint="Usually the person creating this account.">
          <Input
            id="partnerOne"
            autoComplete="given-name"
            placeholder="Nimali"
            value={partnerOneName}
            onChange={(event) => setPartnerOneName(event.target.value)}
            required
            minLength={2}
            maxLength={80}
          />
        </FieldBlock>
        <FieldBlock label="Partner two" htmlFor="partnerTwo">
          <Input
            id="partnerTwo"
            autoComplete="family-name"
            placeholder="Kasun"
            value={partnerTwoName}
            onChange={(event) => setPartnerTwoName(event.target.value)}
            required
            minLength={2}
            maxLength={80}
          />
        </FieldBlock>
      </div>
    );
  } else if (step === "date") {
    body = (
      <div className="grid gap-5">
        {error ? <FormStatus tone="destructive">{error}</FormStatus> : null}
        <FieldBlock label="Wedding date" hint="Nekath and ceremony times can be added later in the studio.">
          <DatePicker value={date || null} onChange={setDate} placeholder="Pick a date" />
        </FieldBlock>
      </div>
    );
  } else if (step === "place") {
    body = (
      <div className="grid gap-5">
        {error ? <FormStatus tone="destructive">{error}</FormStatus> : null}
        <PlaceFields
          city={city}
          district={district}
          onCityChange={setCity}
          onDistrictChange={setDistrict}
        />
        <label className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/40 px-4 py-3 text-sm">
          <span>We’re planning from overseas</span>
          <Switch checked={planningFromOverseas} onCheckedChange={setPlanningFromOverseas} />
        </label>
      </div>
    );
  } else if (step === "types") {
    body = (
      <div className="grid gap-4">
        {error ? <FormStatus tone="destructive">{error}</FormStatus> : null}
        <div className="grid gap-3 sm:grid-cols-2">
          {TYPE_OPTIONS.filter((option) => weddingTypeSchema.options.includes(option.value)).map((option) => (
            <ChoiceCard
              key={option.value}
              title={option.title}
              description={option.description}
              imageUrl={option.image}
              multi
              selected={types.includes(option.value)}
              onSelect={() => toggleType(option.value)}
            />
          ))}
        </div>
      </div>
    );
  } else if (step === "guests") {
    body = (
      <div className="grid gap-5">
        {error ? <FormStatus tone="destructive">{error}</FormStatus> : null}
        <div className="grid gap-3 sm:grid-cols-2">
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
        <FieldBlock label="Exact estimate" htmlFor="guests" hint="You can type a custom number.">
          <Input
            id="guests"
            type="number"
            min={1}
            max={5000}
            value={guestCountEstimate}
            onChange={(event) => setGuestCountEstimate(Number(event.target.value) || 1)}
          />
        </FieldBlock>
      </div>
    );
  } else if (step === "style") {
    body = (
      <div className="grid gap-4">
        {error ? <FormStatus tone="destructive">{error}</FormStatus> : null}
        <StyleStoryPicker
          value={style}
          options={STYLE_OPTIONS}
          colors={STYLE_COLORS[style]}
          onChange={(value) => setStyle(weddingStyleSchema.parse(value))}
        />
      </div>
    );
  } else {
    const typeTitles = types
      .map((value) => TYPE_OPTIONS.find((option) => option.value === value)?.title ?? value.replaceAll("_", " "))
      .join(", ");
    body = (
      <div className="grid gap-6 text-center">
        <div className="mx-auto flex size-20 items-center justify-center rounded-3xl bg-primary/10 text-primary">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 20 }}
          >
            <CheckCircle2 className="size-10 text-primary" />
          </motion.div>
        </div>
        <div className="grid gap-2">
          <h2 className="font-serif text-2xl font-semibold tracking-tight">
            {partnerOneName} & {partnerTwoName}
          </h2>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            {date ? new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { dateStyle: "long" }) : "Date to be decided"}
            {city ? ` · ${city}` : ""}
          </p>
        </div>
        <div className="grid gap-3 text-left">
          <div className="flex items-center gap-3 rounded-2xl border border-border/80 bg-background/60 p-4">
            <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
              <Heart className="size-5" />
            </span>
            <div>
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Ceremonies</p>
              <p className="text-sm font-medium">{typeTitles || "Your wedding types"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-border/80 bg-background/60 p-4">
            <span className="grid size-9 place-items-center rounded-xl bg-success/15 text-success">
              <Sparkles className="size-5" />
            </span>
            <div>
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Guest estimate</p>
              <p className="text-sm font-medium">{guestCountEstimate} guests</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-center">
          <Button
            size="lg"
            className="gap-2 px-8"
            onClick={() => {
              void burst();
              router.push("/planning");
            }}
          >
            Open planning hub
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    );
  }

  const current = copy[step];

  return (
    <OnboardWizard
      stepKey={step}
      direction={direction}
      progress={progress}
      stepLabel={current.label}
      title={current.title}
      description={current.description}
      onBack={stepIndex > 0 && step !== "celebrate" ? () => goTo(STEPS[stepIndex - 1]!) : undefined}
      onContinue={step === "celebrate" ? undefined : () => void continueFrom(step)}
      onSkip={step === "date" || step === "place" ? () => void continueFrom(step) : undefined}
      skipLabel="Skip"
      continueDisabled={
        (step === "names" && !namesReady) || (step === "types" && !typesReady)
      }
      continueLabel={step === "style" ? "Finish & celebrate" : "Continue"}
      saving={saving}
    >
      {body}
    </OnboardWizard>
  );
}
