import { z } from "zod";
import { localizedStringSchema } from "./localized";

/** Where a decoration sits relative to the centered question card. */
export const decorationSlotSchema = z.enum(["LEFT", "RIGHT", "TOP", "BOTTOM"]);
export type DecorationSlot = z.infer<typeof decorationSlotSchema>;

export const decorationKindSchema = z.enum(["TEXT", "ICON", "IMAGE", "LOTTIE", "VIDEO"]);
export type DecorationKind = z.infer<typeof decorationKindSchema>;

export const decorationAlignSchema = z.enum(["START", "CENTER", "END"]);
export type DecorationAlign = z.infer<typeof decorationAlignSchema>;

export const decorationBreakpointSchema = z.enum(["MOBILE", "TABLET", "DESKTOP"]);
export type DecorationBreakpoint = z.infer<typeof decorationBreakpointSchema>;

export const decorationEntranceSchema = z.enum(["NONE", "FADE", "SLIDE", "FLOAT"]);
export type DecorationEntrance = z.infer<typeof decorationEntranceSchema>;

export const decorationTextToneSchema = z.enum(["DEFAULT", "MUTED", "ACCENT"]);
export type DecorationTextTone = z.infer<typeof decorationTextToneSchema>;

export const decorationIconSizeSchema = z.enum(["SM", "MD", "LG", "XL"]);
export type DecorationIconSize = z.infer<typeof decorationIconSizeSchema>;

export const decorationIconMotionSchema = z.enum(["HOVER", "LOOP", "ONCE"]);
export type DecorationIconMotion = z.infer<typeof decorationIconMotionSchema>;

export const decorationFitSchema = z.enum(["COVER", "CONTAIN"]);
export type DecorationFit = z.infer<typeof decorationFitSchema>;

export const DECORATION_SLOTS = ["LEFT", "RIGHT", "TOP", "BOTTOM"] as const;
export const DECORATION_KINDS = ["TEXT", "ICON", "IMAGE", "LOTTIE", "VIDEO"] as const;

/** Props every decoration block shares, regardless of kind. */
const decorationBaseShape = {
  id: z.string().min(1).max(64),
  slot: decorationSlotSchema,
  sortOrder: z.number().int().default(0),
  align: decorationAlignSchema.default("CENTER"),
  maxWidthPx: z.number().int().min(80).max(560).nullable().optional(),
  hideOn: z.array(decorationBreakpointSchema).default([]),
  entrance: decorationEntranceSchema.default("FADE"),
  delayMs: z.number().int().min(0).max(2000).default(0),
};

const assetUrlSchema = z.string().min(1).max(2048);

export const textDecorationSchema = z.object({
  ...decorationBaseShape,
  kind: z.literal("TEXT"),
  heading: localizedStringSchema.nullable().optional(),
  body: localizedStringSchema.nullable().optional(),
  tone: decorationTextToneSchema.default("DEFAULT"),
});
export type TextDecoration = z.infer<typeof textDecorationSchema>;

export const iconDecorationSchema = z.object({
  ...decorationBaseShape,
  kind: z.literal("ICON"),
  iconName: z.string().min(1).max(64),
  label: localizedStringSchema.nullable().optional(),
  size: decorationIconSizeSchema.default("LG"),
  motion: decorationIconMotionSchema.default("LOOP"),
});
export type IconDecoration = z.infer<typeof iconDecorationSchema>;

export const imageDecorationSchema = z.object({
  ...decorationBaseShape,
  kind: z.literal("IMAGE"),
  src: assetUrlSchema,
  alt: localizedStringSchema.nullable().optional(),
  fit: decorationFitSchema.default("COVER"),
  rounded: z.boolean().default(true),
  aspect: z.string().max(16).nullable().optional(),
});
export type ImageDecoration = z.infer<typeof imageDecorationSchema>;

export const lottieDecorationSchema = z.object({
  ...decorationBaseShape,
  kind: z.literal("LOTTIE"),
  src: assetUrlSchema,
  loop: z.boolean().default(true),
  autoplay: z.boolean().default(true),
  speed: z.number().min(0.1).max(4).default(1),
});
export type LottieDecoration = z.infer<typeof lottieDecorationSchema>;

export const videoDecorationSchema = z.object({
  ...decorationBaseShape,
  kind: z.literal("VIDEO"),
  src: assetUrlSchema,
  poster: assetUrlSchema.nullable().optional(),
  loop: z.boolean().default(true),
  autoplay: z.boolean().default(true),
});
export type VideoDecoration = z.infer<typeof videoDecorationSchema>;

export const decorationBlockSchema = z.discriminatedUnion("kind", [
  textDecorationSchema,
  iconDecorationSchema,
  imageDecorationSchema,
  lottieDecorationSchema,
  videoDecorationSchema,
]);
export type DecorationBlock = z.infer<typeof decorationBlockSchema>;

export const STAGE_MAX_BLOCKS = 12;

/** The full set of decorations rendered around one onboarding screen. */
export const stagePresentationSchema = z.object({
  version: z.literal(1),
  blocks: z.array(decorationBlockSchema).max(STAGE_MAX_BLOCKS).default([]),
});
export type StagePresentation = z.infer<typeof stagePresentationSchema>;

/** Per-question config: can either merge with or replace the vendor type default. */
export const questionPresentationSchema = z.object({
  version: z.literal(1),
  blocks: z.array(decorationBlockSchema).max(STAGE_MAX_BLOCKS).default([]),
  inherit: z.boolean().default(true),
});
export type QuestionPresentation = z.infer<typeof questionPresentationSchema>;

/** Vendor-type level config, providing a default stage for all of its questions. */
export const typeOnboardingPresentationSchema = z.object({
  version: z.literal(1),
  questionDefault: stagePresentationSchema.nullable().optional(),
});
export type TypeOnboardingPresentation = z.infer<typeof typeOnboardingPresentationSchema>;

/** Global config for the pre-selection category picker step. */
export const siteOnboardingPresentationSchema = z.object({
  version: z.literal(1),
  categoryStep: stagePresentationSchema.nullable().optional(),
});
export type SiteOnboardingPresentation = z.infer<typeof siteOnboardingPresentationSchema>;

export const EMPTY_STAGE_PRESENTATION: StagePresentation = { version: 1, blocks: [] };

const SLOT_ORDER: Record<DecorationSlot, number> = { TOP: 0, LEFT: 1, RIGHT: 2, BOTTOM: 3 };

function sortBlocks(blocks: DecorationBlock[]): DecorationBlock[] {
  return [...blocks].sort((a, b) => {
    if (a.slot !== b.slot) return SLOT_ORDER[a.slot] - SLOT_ORDER[b.slot];
    return a.sortOrder - b.sortOrder;
  });
}

/**
 * Merge a question's own decorations with its vendor type default.
 * When `inherit` is false the question replaces the default outright; otherwise
 * blocks are merged with the question's own winning on id collision.
 */
export function resolveStagePresentation(
  question?: QuestionPresentation | null,
  typeDefault?: StagePresentation | null,
): StagePresentation {
  if (!question) {
    return typeDefault ? { version: 1, blocks: sortBlocks(typeDefault.blocks) } : EMPTY_STAGE_PRESENTATION;
  }
  if (!question.inherit || !typeDefault) {
    return { version: 1, blocks: sortBlocks(question.blocks) };
  }

  const byId = new Map<string, DecorationBlock>();
  for (const block of typeDefault.blocks) byId.set(block.id, block);
  for (const block of question.blocks) byId.set(block.id, block);

  return { version: 1, blocks: sortBlocks([...byId.values()]) };
}

/** Blocks belonging to one slot, already ordered. */
export function blocksForSlot(presentation: StagePresentation | null | undefined, slot: DecorationSlot) {
  if (!presentation) return [];
  return presentation.blocks.filter((block) => block.slot === slot).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function stageHasBlocks(presentation: StagePresentation | null | undefined): boolean {
  return Boolean(presentation && presentation.blocks.length > 0);
}

/**
 * Upload types allowed for onboarding decoration assets.
 * SVG is deliberately excluded: stored SVG served from the public bucket is an XSS vector.
 */
export const ONBOARDING_ASSET_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "application/json",
] as const;
export const ONBOARDING_ASSET_MAX_BYTES = 15 * 1024 * 1024;

export const onboardingAssetPresignBodySchema = z.object({
  contentType: z.enum(ONBOARDING_ASSET_CONTENT_TYPES),
  filename: z.string().min(1).max(200),
});
export type OnboardingAssetPresignBody = z.infer<typeof onboardingAssetPresignBodySchema>;

export const onboardingAssetPresignResponseSchema = z.object({
  uploadUrl: z.string().min(1),
  key: z.string().min(1),
  publicUrl: z.string().min(1),
});
export type OnboardingAssetPresignResponse = z.infer<typeof onboardingAssetPresignResponseSchema>;
