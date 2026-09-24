import type {
  AttributeCompleteness,
  AttributeValueType,
  LocalizedString,
  QuestionPresentation,
  TypeOnboardingPresentation,
  VendorAttributeAnswerValue,
  VendorAttributeDefinition,
  VendorAttributeOption,
  VendorProfileAttributeChip,
  VendorType,
} from "@ceylonweddings/contracts";
import {
  computeDiscoverabilityScore,
  questionPresentationSchema,
  typeOnboardingPresentationSchema,
} from "@ceylonweddings/contracts";

export type LocalizedJson = LocalizedString | Record<string, unknown> | string | number | boolean | null | undefined;

export function asLocalized(value: unknown): LocalizedString {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { en: "" };
  const record = value as Record<string, unknown>;
  const en = typeof record.en === "string" ? record.en : "";
  return {
    en,
    ...(typeof record.si === "string" ? { si: record.si } : {}),
    ...(typeof record.ta === "string" ? { ta: record.ta } : {}),
  };
}

export function asLocalizedOrNull(value: unknown): LocalizedString | null {
  if (value == null) return null;
  const localized = asLocalized(value);
  return localized.en ? localized : null;
}

/** Stored decoration JSON is dropped rather than thrown on if it no longer matches the schema. */
export function asQuestionPresentation(value: unknown): QuestionPresentation | null {
  if (value == null) return null;
  const parsed = questionPresentationSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function asTypeOnboardingPresentation(value: unknown): TypeOnboardingPresentation | null {
  if (value == null) return null;
  const parsed = typeOnboardingPresentationSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

type OptionRow = {
  id: string;
  key: string;
  label: unknown;
  helpText?: unknown;
  sortOrder: number;
  active: boolean;
};

type DefinitionRow = {
  id: string;
  typeId: string | null;
  key: string;
  valueType: AttributeValueType | string;
  question: unknown;
  instruction?: unknown;
  helpText?: unknown;
  filterLabel?: unknown;
  filterHelp?: unknown;
  required: boolean;
  filterable: boolean;
  filterHighlight: boolean;
  filterSortOrder: number;
  showOnProfile: boolean;
  collectOnboard: boolean;
  layout: VendorAttributeDefinition["layout"] | string;
  groupKey?: string | null;
  groupLabel?: unknown;
  unit?: string | null;
  minValue?: number | null;
  maxValue?: number | null;
  maxSelect?: number | null;
  sortOrder: number;
  status: VendorAttributeDefinition["status"] | string;
  presentation?: unknown;
  options?: OptionRow[];
};

type TypeRow = {
  id: string;
  slug: string;
  label: unknown;
  description?: unknown;
  icon?: string | null;
  coverUrl?: string | null;
  galleryLayout: VendorType["galleryLayout"] | string;
  sortOrder: number;
  featured: boolean;
  coreTeam: boolean;
  status: VendorType["status"] | string;
  onboardingPresentation?: unknown;
  attributes?: DefinitionRow[];
};

export function serializeOption(row: OptionRow, activeOnly = false): VendorAttributeOption | null {
  if (activeOnly && !row.active) return null;
  return {
    id: row.id,
    key: row.key,
    label: asLocalized(row.label as LocalizedJson),
    helpText: asLocalizedOrNull(row.helpText as LocalizedJson),
    sortOrder: row.sortOrder,
    active: row.active,
  };
}

export function serializeDefinition(
  row: DefinitionRow,
  options?: { activeOptionsOnly?: boolean; activeDefinitionsOnly?: boolean },
): VendorAttributeDefinition | null {
  if (options?.activeDefinitionsOnly && row.status !== "ACTIVE") return null;
  const opts = (row.options ?? [])
    .map((opt) => serializeOption(opt, options?.activeOptionsOnly ?? false))
    .filter((opt): opt is VendorAttributeOption => opt != null)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.key.localeCompare(b.key));

  return {
    id: row.id,
    typeId: row.typeId,
    key: row.key,
    valueType: row.valueType as AttributeValueType,
    question: asLocalized(row.question as LocalizedJson),
    instruction: asLocalizedOrNull(row.instruction as LocalizedJson),
    helpText: asLocalizedOrNull(row.helpText as LocalizedJson),
    filterLabel: asLocalizedOrNull(row.filterLabel as LocalizedJson),
    filterHelp: asLocalizedOrNull(row.filterHelp as LocalizedJson),
    required: row.required,
    filterable: row.filterable,
    filterHighlight: row.filterHighlight,
    filterSortOrder: row.filterSortOrder,
    showOnProfile: row.showOnProfile,
    collectOnboard: row.collectOnboard,
    layout: row.layout as VendorAttributeDefinition["layout"],
    groupKey: row.groupKey ?? null,
    groupLabel: asLocalizedOrNull(row.groupLabel as LocalizedJson),
    unit: row.unit ?? null,
    minValue: row.minValue ?? null,
    maxValue: row.maxValue ?? null,
    maxSelect: row.maxSelect ?? null,
    sortOrder: row.sortOrder,
    status: row.status as VendorAttributeDefinition["status"],
    presentation: asQuestionPresentation(row.presentation),
    options: opts,
  };
}

export function serializeVendorType(
  row: TypeRow,
  options?: { includeAttributes?: boolean; activeOnly?: boolean },
): VendorType {
  const attributes = options?.includeAttributes
    ? (row.attributes ?? [])
        .map((def) =>
          serializeDefinition(def, {
            activeOptionsOnly: options.activeOnly,
            activeDefinitionsOnly: options.activeOnly,
          }),
        )
        .filter((def): def is VendorAttributeDefinition => def != null)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.key.localeCompare(b.key))
    : undefined;

  return {
    id: row.id,
    slug: row.slug,
    label: asLocalized(row.label as LocalizedJson),
    description: asLocalizedOrNull(row.description as LocalizedJson),
    icon: row.icon ?? null,
    coverUrl: row.coverUrl ?? null,
    galleryLayout: row.galleryLayout as VendorType["galleryLayout"],
    sortOrder: row.sortOrder,
    featured: row.featured,
    coreTeam: row.coreTeam,
    status: row.status as VendorType["status"],
    onboardingPresentation: asTypeOnboardingPresentation(row.onboardingPresentation),
    ...(attributes ? { attributes } : {}),
  };
}

type ValueRow = {
  definitionId: string;
  booleanValue: boolean | null;
  numberValue: number | null;
  rangeMin: number | null;
  rangeMax: number | null;
  textValue: string | null;
  definition?: { key: string; valueType: string; showOnProfile?: boolean; question?: unknown; filterLabel?: unknown };
  selections?: Array<{ option: { key: string; label: unknown; active: boolean } }>;
};

export function answerFromValue(row: ValueRow): VendorAttributeAnswerValue | null {
  const valueType = row.definition?.valueType;
  if (valueType === "SELECT" || valueType === "MULTISELECT") {
    const keys = (row.selections ?? [])
      .filter((sel) => sel.option.active)
      .map((sel) => sel.option.key);
    if (keys.length === 0) return null;
    return { optionKeys: keys };
  }
  if (valueType === "BOOLEAN") {
    if (row.booleanValue == null) return null;
    return { boolean: row.booleanValue };
  }
  if (valueType === "NUMBER") {
    if (row.numberValue == null) return null;
    return { number: row.numberValue };
  }
  if (valueType === "RANGE") {
    if (row.rangeMin == null && row.rangeMax == null) return null;
    return {
      range: {
        ...(row.rangeMin != null ? { min: row.rangeMin } : {}),
        ...(row.rangeMax != null ? { max: row.rangeMax } : {}),
      },
    };
  }
  if (valueType === "TEXT") {
    if (!row.textValue?.trim()) return null;
    return { text: row.textValue };
  }
  return null;
}

export function valuesRecordFromRows(rows: ValueRow[]): Record<string, VendorAttributeAnswerValue> {
  const result: Record<string, VendorAttributeAnswerValue> = {};
  for (const row of rows) {
    const key = row.definition?.key;
    if (!key) continue;
    const answer = answerFromValue(row);
    if (answer) result[key] = answer;
  }
  return result;
}

export function isAnswerComplete(
  valueType: AttributeValueType | string,
  answer: VendorAttributeAnswerValue | undefined,
): boolean {
  if (!answer) return false;
  if ("optionKeys" in answer) return answer.optionKeys.length > 0;
  if ("boolean" in answer) return typeof answer.boolean === "boolean";
  if ("number" in answer) return typeof answer.number === "number" && Number.isFinite(answer.number);
  if ("range" in answer) {
    return answer.range.min != null || answer.range.max != null;
  }
  if ("text" in answer) return Boolean(answer.text?.trim());
  return false;
}

export function computeAttributeCompleteness(
  definitions: Array<{ key: string; required: boolean; valueType: string; status?: string }>,
  values: Record<string, VendorAttributeAnswerValue>,
): AttributeCompleteness {
  const active = definitions.filter((def) => !def.status || def.status === "ACTIVE");
  const required = active.filter((def) => def.required);
  const optional = active.filter((def) => !def.required);
  const requiredDone = required.filter((def) => isAnswerComplete(def.valueType, values[def.key])).length;
  const optionalDone = optional.filter((def) => isAnswerComplete(def.valueType, values[def.key])).length;
  return {
    requiredDone,
    requiredTotal: required.length,
    optionalDone,
    optionalTotal: optional.length,
    discoverabilityScore: computeDiscoverabilityScore({
      optionalDone,
      optionalTotal: optional.length,
    }),
  };
}

export function profileChipsFromValues(
  definitions: DefinitionRow[],
  values: ValueRow[],
): VendorProfileAttributeChip[] {
  const byDefId = new Map(values.map((row) => [row.definitionId, row]));
  const chips: VendorProfileAttributeChip[] = [];

  for (const def of definitions) {
    if (!def.showOnProfile || def.status !== "ACTIVE") continue;
    const row = byDefId.get(def.id);
    if (!row) continue;
    const answer = answerFromValue({ ...row, definition: def });
    if (!answer) continue;

    const label =
      asLocalizedOrNull(def.filterLabel as LocalizedJson) ?? asLocalized(def.question as LocalizedJson);

    if ("optionKeys" in answer) {
      const options = (row.selections ?? [])
        .filter((sel) => sel.option.active && answer.optionKeys.includes(sel.option.key))
        .map((sel) => ({
          key: sel.option.key,
          label: asLocalized(sel.option.label as LocalizedJson),
        }));
      chips.push({ key: def.key, label, options, value: answer });
      continue;
    }

    chips.push({ key: def.key, label, value: answer });
  }

  return chips;
}
