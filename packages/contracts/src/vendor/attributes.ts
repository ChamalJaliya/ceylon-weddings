import { z } from "zod";
import { vendorCategorySchema } from "./enums";
import { localizedStringSchema } from "./localized";
import { questionPresentationSchema, typeOnboardingPresentationSchema } from "./onboarding-stage";

export { localizedStringSchema };
export type { LocalizedString } from "./localized";

export const ATTRIBUTE_KEY_REGEX = /^[a-z][a-zA-Z0-9_]{0,47}$/;
export const attributeKeySchema = z
  .string()
  .regex(ATTRIBUTE_KEY_REGEX, "Invalid attribute key");

export const vendorTypeStatusSchema = z.enum(["DRAFT", "ACTIVE", "HIDDEN", "ARCHIVED"]);
export type VendorTypeStatus = z.infer<typeof vendorTypeStatusSchema>;

export const attributeValueTypeSchema = z.enum([
  "SELECT",
  "MULTISELECT",
  "BOOLEAN",
  "NUMBER",
  "RANGE",
  "TEXT",
]);
export type AttributeValueType = z.infer<typeof attributeValueTypeSchema>;

export const attributeLayoutSchema = z.enum(["CARDS", "GRID", "LIST", "TOGGLE", "SLIDER", "TEXT"]);
export type AttributeLayout = z.infer<typeof attributeLayoutSchema>;

export const attributeStatusSchema = z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]);
export type AttributeStatus = z.infer<typeof attributeStatusSchema>;

export const galleryLayoutSchema = z.enum(["venue", "portrait", "detail", "default"]);
export type GalleryLayout = z.infer<typeof galleryLayoutSchema>;

export const vendorAttributeOptionSchema = z.object({
  id: z.string(),
  key: attributeKeySchema,
  label: localizedStringSchema,
  helpText: localizedStringSchema.nullable().optional(),
  sortOrder: z.number().int(),
  active: z.boolean(),
});
export type VendorAttributeOption = z.infer<typeof vendorAttributeOptionSchema>;

export const vendorAttributeDefinitionSchema = z.object({
  id: z.string(),
  typeId: z.string().nullable().optional(),
  key: attributeKeySchema,
  valueType: attributeValueTypeSchema,
  question: localizedStringSchema,
  instruction: localizedStringSchema.nullable().optional(),
  helpText: localizedStringSchema.nullable().optional(),
  filterLabel: localizedStringSchema.nullable().optional(),
  filterHelp: localizedStringSchema.nullable().optional(),
  required: z.boolean(),
  filterable: z.boolean(),
  filterHighlight: z.boolean(),
  filterSortOrder: z.number().int(),
  showOnProfile: z.boolean(),
  collectOnboard: z.boolean(),
  layout: attributeLayoutSchema,
  groupKey: z.string().nullable().optional(),
  groupLabel: localizedStringSchema.nullable().optional(),
  unit: z.string().nullable().optional(),
  minValue: z.number().nullable().optional(),
  maxValue: z.number().nullable().optional(),
  maxSelect: z.number().int().nullable().optional(),
  sortOrder: z.number().int(),
  status: attributeStatusSchema,
  presentation: questionPresentationSchema.nullable().optional(),
  options: z.array(vendorAttributeOptionSchema).default([]),
});
export type VendorAttributeDefinition = z.infer<typeof vendorAttributeDefinitionSchema>;

export const vendorTypeSchema = z.object({
  id: z.string(),
  slug: vendorCategorySchema,
  label: localizedStringSchema,
  description: localizedStringSchema.nullable().optional(),
  icon: z.string().nullable().optional(),
  coverUrl: z.string().nullable().optional(),
  galleryLayout: galleryLayoutSchema,
  sortOrder: z.number().int(),
  featured: z.boolean(),
  coreTeam: z.boolean(),
  status: vendorTypeStatusSchema,
  onboardingPresentation: typeOnboardingPresentationSchema.nullable().optional(),
  attributes: z.array(vendorAttributeDefinitionSchema).optional(),
});
export type VendorType = z.infer<typeof vendorTypeSchema>;

export const publicVendorTypeListItemSchema = z.object({
  slug: vendorCategorySchema,
  label: localizedStringSchema,
  description: localizedStringSchema.nullable().optional(),
  icon: z.string().nullable().optional(),
  coverUrl: z.string().nullable().optional(),
  galleryLayout: galleryLayoutSchema,
  sortOrder: z.number().int(),
  featured: z.boolean(),
  attributes: z
    .array(
      vendorAttributeDefinitionSchema.pick({
        key: true,
        valueType: true,
        filterLabel: true,
        filterHelp: true,
        filterable: true,
        filterHighlight: true,
        filterSortOrder: true,
        layout: true,
        unit: true,
        minValue: true,
        maxValue: true,
        maxSelect: true,
        options: true,
      }),
    )
    .optional(),
});
export type PublicVendorTypeListItem = z.infer<typeof publicVendorTypeListItemSchema>;

export const vendorAttributeAnswerValueSchema = z.union([
  z.object({ optionKeys: z.array(z.string()) }),
  z.object({ boolean: z.boolean() }),
  z.object({ number: z.number() }),
  z.object({
    range: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
    }),
  }),
  z.object({ text: z.string() }),
]);
export type VendorAttributeAnswerValue = z.infer<typeof vendorAttributeAnswerValueSchema>;

const keyedAttributeAnswerSchema = z.intersection(
  z.object({ key: attributeKeySchema }),
  vendorAttributeAnswerValueSchema,
);

export const upsertVendorAttributesBodySchema = z.object({
  values: z.union([
    z.record(z.string(), vendorAttributeAnswerValueSchema),
    z.array(keyedAttributeAnswerSchema),
  ]),
});
export type UpsertVendorAttributesBody = z.infer<typeof upsertVendorAttributesBodySchema>;

export const attributeCompletenessSchema = z.object({
  requiredDone: z.number().int().min(0),
  requiredTotal: z.number().int().min(0),
  optionalDone: z.number().int().min(0),
  optionalTotal: z.number().int().min(0),
  discoverabilityScore: z.number().min(0).max(100),
});
export type AttributeCompleteness = z.infer<typeof attributeCompletenessSchema>;

export const vendorOnboardingResponseSchema = z.object({
  type: vendorTypeSchema.nullable(),
  definitions: z.object({
    required: z.array(vendorAttributeDefinitionSchema),
    optional: z.array(vendorAttributeDefinitionSchema),
  }),
  values: z.record(z.string(), vendorAttributeAnswerValueSchema),
  complete: z.boolean(),
  attributeCompleteness: attributeCompletenessSchema,
});
export type VendorOnboardingResponse = z.infer<typeof vendorOnboardingResponseSchema>;

export const vendorProfileAttributeChipSchema = z.object({
  key: attributeKeySchema,
  label: localizedStringSchema,
  options: z
    .array(
      z.object({
        key: attributeKeySchema,
        label: localizedStringSchema,
      }),
    )
    .optional(),
  value: vendorAttributeAnswerValueSchema.optional(),
});
export type VendorProfileAttributeChip = z.infer<typeof vendorProfileAttributeChipSchema>;

const taxonomyPackOptionSchema = z.object({
  key: attributeKeySchema,
  label: localizedStringSchema,
  helpText: localizedStringSchema.nullable().optional(),
  sortOrder: z.number().int().default(0),
  active: z.boolean().default(true),
});

const taxonomyPackAttributeSchema = z.object({
  key: attributeKeySchema,
  valueType: attributeValueTypeSchema,
  question: localizedStringSchema,
  instruction: localizedStringSchema.nullable().optional(),
  helpText: localizedStringSchema.nullable().optional(),
  filterLabel: localizedStringSchema.nullable().optional(),
  filterHelp: localizedStringSchema.nullable().optional(),
  required: z.boolean().default(false),
  filterable: z.boolean().default(true),
  filterHighlight: z.boolean().default(false),
  filterSortOrder: z.number().int().default(0),
  showOnProfile: z.boolean().default(true),
  collectOnboard: z.boolean().default(false),
  layout: attributeLayoutSchema.default("CARDS"),
  groupKey: z.string().nullable().optional(),
  groupLabel: localizedStringSchema.nullable().optional(),
  unit: z.string().nullable().optional(),
  minValue: z.number().nullable().optional(),
  maxValue: z.number().nullable().optional(),
  maxSelect: z.number().int().nullable().optional(),
  sortOrder: z.number().int().default(0),
  status: attributeStatusSchema.default("ACTIVE"),
  presentation: questionPresentationSchema.nullable().optional(),
  options: z.array(taxonomyPackOptionSchema).default([]),
});

const taxonomyPackTypeSchema = z.object({
  slug: vendorCategorySchema,
  label: localizedStringSchema,
  description: localizedStringSchema.nullable().optional(),
  icon: z.string().nullable().optional(),
  coverUrl: z.string().nullable().optional(),
  galleryLayout: galleryLayoutSchema.default("default"),
  sortOrder: z.number().int().default(0),
  featured: z.boolean().default(false),
  coreTeam: z.boolean().default(false),
  status: vendorTypeStatusSchema.default("ACTIVE"),
  onboardingPresentation: typeOnboardingPresentationSchema.nullable().optional(),
  attributes: z.array(taxonomyPackAttributeSchema).default([]),
});

export const taxonomyPackSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string().optional(),
  types: z.array(taxonomyPackTypeSchema),
});
export type TaxonomyPack = z.infer<typeof taxonomyPackSchema>;

export const createVendorTypeBodySchema = z.object({
  slug: vendorCategorySchema,
  label: localizedStringSchema,
  description: localizedStringSchema.nullable().optional(),
  icon: z.string().nullable().optional(),
  coverUrl: z.string().nullable().optional(),
  galleryLayout: galleryLayoutSchema.default("default"),
  sortOrder: z.number().int().default(0),
  featured: z.boolean().default(false),
  coreTeam: z.boolean().default(false),
  status: vendorTypeStatusSchema.default("DRAFT"),
  onboardingPresentation: typeOnboardingPresentationSchema.nullable().optional(),
});
export type CreateVendorTypeBody = z.infer<typeof createVendorTypeBodySchema>;

export const updateVendorTypeBodySchema = z.object({
  label: localizedStringSchema.optional(),
  description: localizedStringSchema.nullable().optional(),
  icon: z.string().nullable().optional(),
  coverUrl: z.string().nullable().optional(),
  galleryLayout: galleryLayoutSchema.optional(),
  sortOrder: z.number().int().optional(),
  featured: z.boolean().optional(),
  coreTeam: z.boolean().optional(),
  status: vendorTypeStatusSchema.optional(),
  onboardingPresentation: typeOnboardingPresentationSchema.nullable().optional(),
});
export type UpdateVendorTypeBody = z.infer<typeof updateVendorTypeBodySchema>;

export const createAttributeDefinitionBodySchema = z.object({
  key: attributeKeySchema,
  valueType: attributeValueTypeSchema,
  question: localizedStringSchema,
  instruction: localizedStringSchema.nullable().optional(),
  helpText: localizedStringSchema.nullable().optional(),
  filterLabel: localizedStringSchema.nullable().optional(),
  filterHelp: localizedStringSchema.nullable().optional(),
  required: z.boolean().default(false),
  filterable: z.boolean().default(true),
  filterHighlight: z.boolean().default(false),
  filterSortOrder: z.number().int().default(0),
  showOnProfile: z.boolean().default(true),
  collectOnboard: z.boolean().default(false),
  layout: attributeLayoutSchema.default("CARDS"),
  groupKey: z.string().nullable().optional(),
  groupLabel: localizedStringSchema.nullable().optional(),
  unit: z.string().nullable().optional(),
  minValue: z.number().nullable().optional(),
  maxValue: z.number().nullable().optional(),
  maxSelect: z.number().int().nullable().optional(),
  sortOrder: z.number().int().default(0),
  status: attributeStatusSchema.default("DRAFT"),
  presentation: questionPresentationSchema.nullable().optional(),
  options: z
    .array(
      z.object({
        key: attributeKeySchema,
        label: localizedStringSchema,
        helpText: localizedStringSchema.nullable().optional(),
        sortOrder: z.number().int().default(0),
        active: z.boolean().default(true),
      }),
    )
    .optional(),
});
export type CreateAttributeDefinitionBody = z.infer<typeof createAttributeDefinitionBodySchema>;

export const updateAttributeDefinitionBodySchema = createAttributeDefinitionBodySchema
  .omit({ key: true, valueType: true })
  .partial()
  .extend({
    valueType: attributeValueTypeSchema.optional(),
  });
export type UpdateAttributeDefinitionBody = z.infer<typeof updateAttributeDefinitionBodySchema>;

export const createAttributeOptionBodySchema = z.object({
  key: attributeKeySchema,
  label: localizedStringSchema,
  helpText: localizedStringSchema.nullable().optional(),
  sortOrder: z.number().int().default(0),
  active: z.boolean().default(true),
});
export type CreateAttributeOptionBody = z.infer<typeof createAttributeOptionBodySchema>;

export const updateAttributeOptionBodySchema = z.object({
  label: localizedStringSchema.optional(),
  helpText: localizedStringSchema.nullable().optional(),
  sortOrder: z.number().int().optional(),
  active: z.boolean().optional(),
});
export type UpdateAttributeOptionBody = z.infer<typeof updateAttributeOptionBodySchema>;

export const reorderIdsBodySchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});
export type ReorderIdsBody = z.infer<typeof reorderIdsBodySchema>;

export const cloneVendorTypeBodySchema = z.object({
  newSlug: vendorCategorySchema,
});
export type CloneVendorTypeBody = z.infer<typeof cloneVendorTypeBodySchema>;

export const importTaxonomyBodySchema = taxonomyPackSchema.extend({
  dryRun: z.boolean().optional(),
});
export type ImportTaxonomyBody = z.infer<typeof importTaxonomyBodySchema>;

export function computeDiscoverabilityScore(input: {
  optionalDone: number;
  optionalTotal: number;
}): number {
  if (input.optionalTotal <= 0) return 100;
  return Math.round((input.optionalDone / input.optionalTotal) * 100);
}

export function attributesRequiredComplete(
  completeness?: Pick<AttributeCompleteness, "requiredDone" | "requiredTotal"> | null,
): boolean {
  if (!completeness) return true;
  return completeness.requiredTotal === completeness.requiredDone;
}
