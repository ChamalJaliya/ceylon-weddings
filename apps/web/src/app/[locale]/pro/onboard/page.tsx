"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Sparkles, Store, ArrowRight } from "lucide-react";
import { api } from "@ceylonweddings/web";
import type {
  PublicVendorTypeListItem,
  VendorAttributeAnswerValue,
  VendorAttributeDefinition,
  VendorOnboardingResponse,
} from "@ceylonweddings/contracts";
import { AnimateIcon, Icon } from "@ceylonweddings/ui/components/icon";
import { Button } from "@ceylonweddings/ui/components/button";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import {
  AttributeField,
  isAttributeAnswered,
  type AttributeFieldValue,
} from "@ceylonweddings/ui/domain/attribute-field";
import { ChoiceCard } from "@ceylonweddings/ui/domain/choice-card";
import { OnboardWizard, useWizardDirection } from "@ceylonweddings/ui/domain/onboard-wizard";
import { motion, useConfetti } from "@ceylonweddings/ui/domain/motion";
import { Link, useRouter } from "../../../../i18n/navigation";
import { categoryIcon } from "../../../../lib/category-icons";
import { CATEGORY_LABELS, localizedText } from "../../../../lib/labels";
import { resolveStageView } from "../../../../lib/onboarding-stage";

function toFieldDef(def: VendorAttributeDefinition, locale: string) {
  return {
    key: def.key,
    valueType: def.valueType,
    question: localizedText(def.question, locale),
    instruction: def.instruction ? localizedText(def.instruction, locale) : null,
    helpText: def.helpText ? localizedText(def.helpText, locale) : null,
    unit: def.unit,
    minValue: def.minValue,
    maxValue: def.maxValue,
    maxSelect: def.maxSelect,
    layout: def.layout,
    options: (def.options ?? [])
      .filter((option) => option.active)
      .map((option) => ({
        key: option.key,
        label: localizedText(option.label, locale),
        helpText: option.helpText ? localizedText(option.helpText, locale) : null,
      })),
  };
}

export default function ProOnboardPage() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const stepParam = searchParams.get("step");
  const { saveDateBurst, burst } = useConfetti();

  const [types, setTypes] = useState<PublicVendorTypeListItem[]>([]);
  const [onboarding, setOnboarding] = useState<VendorOnboardingResponse | null>(null);
  const [values, setValues] = useState<Record<string, VendorAttributeAnswerValue>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [optionalMode, setOptionalMode] = useState(false);
  const [celebrationMode, setCelebrationMode] = useState(false);

  const load = useCallback(async () => {
    const [typeList, onboard] = await Promise.all([api.vendorTypes(), api.vendors.onboarding()]);
    setTypes(typeList);
    setOnboarding(onboard);
    setValues(onboard.values ?? {});
  }, []);

  useEffect(() => {
    load().catch((err: Error) => setError(err.message));
  }, [load]);

  const required = onboarding?.definitions.required ?? [];
  const optional = onboarding?.definitions.optional ?? [];
  const hasType = Boolean(onboarding?.type);

  const pickingType = !hasType || stepParam === "type";

  const activeStepKey = useMemo(() => {
    if (celebrationMode) return "celebrate";
    if (pickingType) return "type";
    if (optionalMode) {
      if (stepParam && optional.some((def) => def.key === stepParam)) return stepParam;
      return optional[0]?.key ?? "celebrate";
    }
    if (stepParam && required.some((def) => def.key === stepParam)) return stepParam;
    const firstUnanswered = required.find((def) => !isAttributeAnswered(values[def.key] as AttributeFieldValue));
    return firstUnanswered?.key ?? required[0]?.key ?? "done";
  }, [celebrationMode, optional, optionalMode, pickingType, required, stepParam, values]);

  const stepIndex = required.findIndex((def) => def.key === activeStepKey);
  const currentDef = required.find((def) => def.key === activeStepKey) ?? null;

  const stage = useMemo(() => {
    const activeDef =
      currentDef ?? optional.find((def) => def.key === activeStepKey) ?? null;
    if (!activeDef) return null;
    return resolveStageView(
      activeDef.presentation,
      onboarding?.type?.onboardingPresentation?.questionDefault,
      locale,
    );
  }, [activeStepKey, currentDef, locale, onboarding, optional]);

  const wizardOrder = useMemo(
    () => ["type", ...required.map((def) => def.key), ...optional.map((def) => def.key), "celebrate", "complete"],
    [optional, required],
  );
  const direction = useWizardDirection(activeStepKey, wizardOrder);

  // Auto-fire confetti when celebration mode is activated
  useEffect(() => {
    if (celebrationMode) {
      void saveDateBurst();
    }
  }, [celebrationMode, saveDateBurst]);

  const setStep = (key: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!key || key === "celebrate") {
      params.delete("step");
    } else {
      params.set("step", key);
    }
    const qs = params.toString();
    router.replace(qs ? `/pro/onboard?${qs}` : "/pro/onboard");
  };

  function goAfterType(onboard: VendorOnboardingResponse) {
    setOptionalMode(false);
    setCelebrationMode(false);
    const first = onboard.definitions.required[0]?.key;
    const firstOptional = onboard.definitions.optional[0]?.key;
    if (first) setStep(first);
    else if (firstOptional) {
      setOptionalMode(true);
      setStep(firstOptional);
    } else setCelebrationMode(true);
  }

  async function pickType(slug: string) {
    if (onboarding?.type?.slug === slug) {
      goAfterType(onboarding);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.vendors.updateMine({ category: slug });
      const onboard = await api.vendors.onboarding();
      setOnboarding(onboard);
      setValues(onboard.values ?? {});
      goAfterType(onboard);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save vendor type");
    } finally {
      setSaving(false);
    }
  }

  async function saveAttribute(key: string, value: AttributeFieldValue) {
    setValues((current) => ({ ...current, [key]: value }));
    setSaving(true);
    setError(null);
    try {
      await api.vendors.putAttributes({ values: { [key]: value } });
      const onboard = await api.vendors.onboarding();
      setOnboarding(onboard);
      setValues(onboard.values ?? {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save answer");
    } finally {
      setSaving(false);
    }
  }

  async function continueRequired() {
    if (!currentDef) return;
    const answered = isAttributeAnswered(values[currentDef.key] as AttributeFieldValue);
    if (!answered) return;

    if (stepIndex < required.length - 1) {
      setStep(required[stepIndex + 1]!.key);
      return;
    }

    const onboard = await api.vendors.onboarding();
    setOnboarding(onboard);
    const nextOptional = onboard.definitions.optional;
    if (nextOptional.length) {
      setOptionalMode(true);
      setStep(nextOptional[0]!.key);
      return;
    }
    setCelebrationMode(true);
  }

  function finishOnboarding() {
    setCelebrationMode(true);
  }

  if (error && !onboarding) {
    return (
      <FormStatus tone="destructive">
        {error}. <Link href="/login">Sign in</Link>
      </FormStatus>
    );
  }

  if (!onboarding) {
    return (
      <div className="mx-auto grid w-full max-w-3xl place-items-center py-24">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Loading onboarding…
        </div>
      </div>
    );
  }

  const optionalIndex = optional.findIndex((def) => def.key === activeStepKey);
  const optionalDef = optionalIndex >= 0 ? optional[optionalIndex]! : null;
  const questionTotal = required.length + optional.length;
  const questionProgress = celebrationMode
    ? { current: questionTotal, total: Math.max(questionTotal, 1) }
    : pickingType
      ? { current: 0, total: Math.max(questionTotal, 1) }
      : optionalDef
        ? { current: required.length + optionalIndex + 1, total: Math.max(questionTotal, 1) }
        : currentDef
          ? { current: stepIndex + 1, total: Math.max(questionTotal, 1) }
          : { current: 0, total: Math.max(questionTotal, 1) };

  const categoryLabel = onboarding.type?.slug
    ? (CATEGORY_LABELS[onboarding.type.slug] ?? localizedText(onboarding.type.label, locale))
    : "Vendor";

  let stepLabel = "Step 1";
  let title = "What do you do?";
  let description =
    "Pick the category couples will browse you under. You will answer key required details next.";
  let onBack: (() => void) | undefined;
  let onContinue: (() => void) | undefined;
  let onSkip: (() => void) | undefined;
  let skipLabel = "Skip";
  let continueLabel = "Continue";
  let continueDisabled = false;
  let body: ReactNode = null;

  if (pickingType) {
    if (hasType) {
      description =
        "You’re listed under this category. Pick a different one if that was a mistake — answers that only apply to the old type will be cleared.";
      onContinue = () => goAfterType(onboarding);
      continueLabel = `Continue with ${categoryLabel}`;
    }
    body = (
      <>
        {error ? <FormStatus tone="destructive">{error}</FormStatus> : null}
        <div className="grid gap-3 sm:grid-cols-2">
          {types.map((type) => {
            const selected = onboarding.type?.slug === type.slug;
            const TypeIcon = categoryIcon(type.slug);
            return (
              <AnimateIcon key={type.slug} animateOnHover animateOnTap animate={selected} className="block h-full">
                <ChoiceCard
                  title={localizedText(type.label, locale)}
                  description={type.description ? localizedText(type.description, locale) : null}
                  icon={<Icon icon={TypeIcon} size="md" />}
                  selected={selected}
                  disabled={saving}
                  onSelect={() => void pickType(type.slug)}
                />
              </AnimateIcon>
            );
          })}
        </div>
      </>
    );
  } else if (celebrationMode) {
    stepLabel = "Complete";
    title = "You're all set!";
    description = "Your vendor listing information is configured. Couples will now find you in filtered searches.";
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
          <h2 className="font-serif text-2xl font-semibold tracking-tight">Welcome to Ceylon Weddings Pro</h2>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            You’re registered as a <span className="font-semibold text-foreground">{categoryLabel}</span>. Your
            listing is verified ready and awaiting couples.
          </p>
          <button
            type="button"
            className="text-sm text-primary underline-offset-4 hover:underline"
            onClick={() => {
              setCelebrationMode(false);
              setStep("type");
            }}
          >
            Wrong category? Change vendor type
          </button>
        </div>

        <div className="rounded-2xl border border-border/80 bg-background/60 p-4 text-left">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-success/15 text-success">
              <Sparkles className="size-5" />
            </span>
            <div>
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Required criteria met
              </p>
              <p className="text-sm font-medium">
                {required.length} required {required.length === 1 ? "question" : "questions"} answered
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-center">
          <Button
            size="lg"
            className="gap-2 px-8"
            onClick={() => {
              void burst();
              router.push("/pro/storefront");
            }}
          >
            <Store className="size-4" />
            Open Storefront Studio
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    );
  } else if (optionalDef) {
    const lastOptional = optionalIndex >= optional.length - 1;
    const answered = isAttributeAnswered(values[optionalDef.key] as AttributeFieldValue);
    const goNextOptional = () => {
      if (lastOptional) {
        finishOnboarding();
        return;
      }
      setStep(optional[optionalIndex + 1]!.key);
    };
    stepLabel = `Optional ${required.length + optionalIndex + 1} of ${questionTotal}`;
    title = localizedText(onboarding.type?.label, locale) || "Stand out in search";
    description = "This detail is optional. Answer to unlock couple filters, or skip and finish later in your studio.";
    onBack = () => {
      if (optionalIndex <= 0) {
        setOptionalMode(false);
        if (required.length) setStep(required[required.length - 1]!.key);
        else setStep("type");
        return;
      }
      setStep(optional[optionalIndex - 1]!.key);
    };
    onSkip = goNextOptional;
    onContinue = goNextOptional;
    skipLabel = lastOptional ? "Skip & finish" : "Skip";
    continueLabel = lastOptional ? "Finish" : "Continue";
    continueDisabled = !answered;
    body = (
      <>
        {error ? <FormStatus tone="destructive">{error}</FormStatus> : null}
        <div className="grid gap-4">
          <AttributeField
            definition={toFieldDef(optionalDef, locale)}
            value={values[optionalDef.key] as AttributeFieldValue | undefined}
            onChange={(next) => void saveAttribute(optionalDef.key, next)}
            hint="Optional · unlocks couple filters"
          />
          <p className="text-xs text-muted-foreground italic">You can skip this question and still complete listing.</p>
        </div>
      </>
    );
  } else if (!currentDef) {
    stepLabel = "Complete";
    title = "You're set";
    description = "Required details are complete.";
    onContinue = finishOnboarding;
    continueLabel = "Finish & celebrate";
    body = <p className="text-sm text-muted-foreground">Head to your studio to polish photos and packages.</p>;
  } else {
    const isCurrentAnswered = isAttributeAnswered(values[currentDef.key] as AttributeFieldValue);
    stepLabel = `Question ${stepIndex + 1} of ${questionTotal}`;
    title = localizedText(onboarding.type?.label, locale) || "Tell couples about you";
    description = "Answer required questions so your listing can appear in the right searches.";
    onBack =
      stepIndex > 0
        ? () => {
            setStep(required[stepIndex - 1]!.key);
          }
        : () => setStep("type");
    onContinue = () => void continueRequired();
    continueDisabled = !isCurrentAnswered;
    continueLabel =
      stepIndex === required.length - 1 ? (optional.length ? "Continue" : "Finish") : "Continue";
    body = (
      <>
        {error ? <FormStatus tone="destructive">{error}</FormStatus> : null}
        <div className="grid gap-4">
          <AttributeField
            definition={toFieldDef(currentDef, locale)}
            value={values[currentDef.key] as AttributeFieldValue | undefined}
            onChange={(next) => void saveAttribute(currentDef.key, next)}
          />
          {!isCurrentAnswered && (
            <p className="text-xs text-muted-foreground italic">
              * This question is required to register your listing in searches.
            </p>
          )}
        </div>
      </>
    );
  }

  return (
    <OnboardWizard
      stepKey={activeStepKey}
      direction={direction}
      progress={questionProgress}
      stepLabel={stepLabel}
      title={title}
      description={description}
      onBack={onBack}
      onContinue={onContinue}
      onSkip={onSkip}
      skipLabel={skipLabel}
      continueLabel={continueLabel}
      continueDisabled={continueDisabled}
      saving={saving}
      stage={stage}
    >
      {body}
    </OnboardWizard>
  );
}

