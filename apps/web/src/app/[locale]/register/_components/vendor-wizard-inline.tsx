"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocale } from "next-intl";
import { ArrowLeft, ArrowRight, Check, Search, Sparkles, Store } from "lucide-react";
import { api } from "@ceylonweddings/web";
import type {
  PublicVendorTypeListItem,
  StagePresentation,
  VendorAttributeAnswerValue,
  VendorAttributeDefinition,
  VendorType,
} from "@ceylonweddings/contracts";
import { Icon } from "@ceylonweddings/ui/components/icon";
import { Button } from "@ceylonweddings/ui/components/button";
import { Heading } from "@ceylonweddings/ui/components/heading";
import { FormStatus } from "@ceylonweddings/ui/components/form-status";
import { Input } from "@ceylonweddings/ui/components/input";
import { AttributeField, isAttributeAnswered, type AttributeFieldValue } from "@ceylonweddings/ui/domain/attribute-field";
import { AnimatePresence, motion, useReducedMotion } from "@ceylonweddings/ui/domain/motion";
import { OnboardingStage } from "@ceylonweddings/ui/domain/onboarding-stage";
import { cn } from "@ceylonweddings/ui/utils";
import { categoryIcon } from "../../../../lib/category-icons";
import { CATEGORY_LABELS, localizedText } from "../../../../lib/labels";
import { resolveStageView, toStageView } from "../../../../lib/onboarding-stage";

export type VendorWizardData = {
  categorySlug: string;
  categoryLabel?: string;
  attributes: Record<string, VendorAttributeAnswerValue>;
};

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
    options: (def.options ?? []).filter((o) => o.active).map((o) => ({
      key: o.key,
      label: localizedText(o.label, locale),
      helpText: o.helpText ? localizedText(o.helpText, locale) : null,
    })),
  };
}

export function VendorWizardInline({
  initialData,
  onBack,
  onProceed,
}: {
  initialData?: Partial<VendorWizardData>;
  onBack: () => void;
  onProceed: (data: VendorWizardData) => void;
}) {
  const locale = useLocale();
  const reduce = useReducedMotion();

  const [types, setTypes] = useState<PublicVendorTypeListItem[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>(initialData?.categorySlug ?? "");
  const [typeSchema, setTypeSchema] = useState<VendorType | null>(null);
  const [values, setValues] = useState<Record<string, VendorAttributeAnswerValue>>(initialData?.attributes ?? {});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentStep, setCurrentStep] = useState<string>(initialData?.categorySlug ? "details" : "category");
  const [categoryStepStage, setCategoryStepStage] = useState<StagePresentation | null>(null);

  const loadTypes = useCallback(async () => {
    try {
      const typeList = await api.vendorTypes();
      setTypes(typeList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load categories");
    }
  }, []);

  useEffect(() => {
    // Decorations for the pre-selection step are global, so they live on site config.
    void api.site
      .config()
      .then((config) => setCategoryStepStage(config.onboarding?.categoryStep ?? null))
      .catch(() => setCategoryStepStage(null));
  }, []);

  useEffect(() => {
    void loadTypes();
  }, [loadTypes]);

  const loadSchema = useCallback(async (slug: string) => {
    setLoading(true);
    setError(null);
    try {
      const schema = await api.vendorTypeSchema(slug);
      setTypeSchema(schema);
      return schema;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load category attributes");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedSlug) {
      void loadSchema(selectedSlug);
    }
  }, [loadSchema, selectedSlug]);

  const required = useMemo(() => {
    return (typeSchema?.attributes ?? []).filter((def) => Boolean(def.required));
  }, [typeSchema]);

  const activeStepKey = useMemo(() => {
    if (!selectedSlug || currentStep === "category") return "category";
    if (currentStep !== "category" && required.some((def) => def.key === currentStep)) {
      return currentStep;
    }
    const firstUnanswered = required.find((def) => !isAttributeAnswered(values[def.key] as AttributeFieldValue));
    return firstUnanswered?.key ?? required[0]?.key ?? "done";
  }, [currentStep, required, selectedSlug, values]);

  const stepIndex = required.findIndex((def) => def.key === activeStepKey);
  const currentDef = required.find((def) => def.key === activeStepKey) ?? null;

  async function handlePickType(slug: string) {
    setSelectedSlug(slug);
    const schema = await loadSchema(slug);
    const requiredDefs = (schema?.attributes ?? []).filter((def) => Boolean(def.required));
    const catLabel = CATEGORY_LABELS[slug] ?? (schema ? localizedText(schema.label, locale) : slug);

    if (!requiredDefs.length) {
      onProceed({
        categorySlug: slug,
        categoryLabel: catLabel,
        attributes: values,
      });
      return;
    }

    setCurrentStep(requiredDefs[0]!.key);
  }

  function handleSaveAttribute(key: string, value: AttributeFieldValue) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleContinueRequired() {
    if (!currentDef) return;
    const answered = isAttributeAnswered(values[currentDef.key] as AttributeFieldValue);
    if (!answered) return;

    const catLabel = selectedSlug ? (CATEGORY_LABELS[selectedSlug] ?? (typeSchema ? localizedText(typeSchema.label, locale) : selectedSlug)) : "Vendor";

    if (stepIndex < required.length - 1) {
      setCurrentStep(required[stepIndex + 1]!.key);
      return;
    }

    onProceed({
      categorySlug: selectedSlug,
      categoryLabel: catLabel,
      attributes: values,
    });
  }

  function handleStepBack() {
    if (!selectedSlug || activeStepKey === "category") {
      onBack();
      return;
    }
    if (stepIndex <= 0) {
      setCurrentStep("category");
      return;
    }
    setCurrentStep(required[stepIndex - 1]!.key);
  }

  const categoryLabel = selectedSlug
    ? (CATEGORY_LABELS[selectedSlug] ?? (typeSchema ? localizedText(typeSchema.label, locale) : selectedSlug))
    : "Vendor";

  const pickingCategory = !selectedSlug || activeStepKey === "category";

  const filteredTypes = useMemo(() => {
    if (!searchQuery.trim()) return types;
    const q = searchQuery.toLowerCase().trim();
    return types.filter((t) => {
      const label = localizedText(t.label, locale).toLowerCase();
      const slug = t.slug.toLowerCase();
      return label.includes(q) || slug.includes(q);
    });
  }, [locale, searchQuery, types]);

  const stage = useMemo(() => {
    if (pickingCategory) return toStageView(categoryStepStage, locale);
    return resolveStageView(
      currentDef?.presentation,
      typeSchema?.onboardingPresentation?.questionDefault,
      locale,
    );
  }, [categoryStepStage, currentDef, locale, pickingCategory, typeSchema]);

  let stepLabel = "Vendor Category";
  let title = "What type of vendor are you?";
  let subtitle = "Select the category couples will search and book you under.";
  let continueLabel = "Continue";
  let continueDisabled = false;
  let body: ReactNode = null;

  if (pickingCategory) {
    body = (
      <div className="grid gap-5">
        {/* Search filter for categories */}
        <div className="relative">
          <Icon
            icon={Search}
            size="sm"
            className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search category (e.g. Photography, Venue, Bridal...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 bg-background/60 pl-10"
          />
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="size-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Loading category schema...
          </div>
        )}

        <div className="flex max-h-[380px] flex-wrap gap-2.5 overflow-y-auto pr-1">
          {filteredTypes.map((type) => {
            const selected = selectedSlug === type.slug;
            const TypeIcon = categoryIcon(type.slug);
            return (
              <motion.button
                key={type.slug}
                type="button"
                disabled={loading}
                onClick={() => void handlePickType(type.slug)}
                whileHover={reduce ? undefined : { y: -2, scale: 1.02 }}
                whileTap={reduce ? undefined : { scale: 0.97 }}
                transition={{ type: "spring", stiffness: 420, damping: 26 }}
                className={cn(
                  "group inline-flex items-center gap-2.5 rounded-2xl border px-4 py-3 text-sm font-medium transition-[color,background-color,border-color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selected
                    ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/25 ring-1 ring-primary/40"
                    : "border-border/70 bg-card/60 text-foreground hover:border-foreground/35 hover:bg-card hover:shadow-sm",
                )}
              >
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-xl transition-colors",
                    selected ? "bg-primary-foreground/15" : "bg-foreground/5 group-hover:bg-foreground/10",
                  )}
                >
                  <Icon icon={TypeIcon} size="sm" playing={selected} />
                </span>
                <span>{localizedText(type.label, locale)}</span>
                {selected ? <Icon icon={Check} size="xs" playing /> : null}
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  } else if (currentDef) {
    const isCurrentAnswered = isAttributeAnswered(values[currentDef.key] as AttributeFieldValue);
    stepLabel = `Required Detail ${stepIndex + 1} of ${required.length}`;
    title = categoryLabel;
    subtitle = "Fill in this key vendor specification so couples can filter and discover your services.";
    continueDisabled = !isCurrentAnswered;
    continueLabel = stepIndex === required.length - 1 ? "Continue to Account Details" : "Continue";
    body = (
      <div className="grid gap-4">
        <AttributeField
          definition={toFieldDef(currentDef, locale)}
          value={values[currentDef.key] as AttributeFieldValue | undefined}
          onChange={(next) => handleSaveAttribute(currentDef.key, next)}
        />
        {!isCurrentAnswered && (
          <p className="text-xs text-muted-foreground italic">* This question is required before creating your storefront.</p>
        )}
      </div>
    );
  }

  return (
    <OnboardingStage presentation={stage} cardMinHeight={420} className="mx-auto w-full max-w-7xl">
      {/* Progress header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-foreground/5 text-foreground">
            <Icon icon={Store} size="sm" />
          </span>
          <div>
            <p className="text-[11px] font-semibold tracking-wider text-primary uppercase">{stepLabel}</p>
            <p className="text-xs text-muted-foreground">
              {pickingCategory ? "Category selection" : `Question ${stepIndex + 1} of ${required.length}`}
            </p>
          </div>
        </div>

        {selectedSlug && required.length > 0 ? (
          <div className="flex items-center gap-1.5">
            {required.map((def, idx) => (
              <div
                key={def.key}
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
        ) : null}
      </div>

      {/* Main Glassmorphic Panel */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card/80 p-6 shadow-xl backdrop-blur-md sm:p-8">
        <header className="mb-6 grid gap-1.5">
          <Heading as="h2" icon={pickingCategory ? Sparkles : Store} className="text-2xl font-semibold sm:text-3xl">
            {title}
          </Heading>
          <p className="text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
        </header>

        {error ? (
          <div className="mb-4">
            <FormStatus tone="destructive">{error}</FormStatus>
          </div>
        ) : null}

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeStepKey}
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
            icon={ArrowLeft}
            onClick={handleStepBack}
            className="text-muted-foreground hover:text-foreground"
          >
            {pickingCategory ? "Change role" : "Back to categories"}
          </Button>

          {!pickingCategory ? (
            <Button
              type="button"
              iconRight={ArrowRight}
              onClick={handleContinueRequired}
              disabled={continueDisabled}
              className="px-6 shadow-md shadow-primary/20"
            >
              {continueLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </OnboardingStage>
  );
}
