import {
  resolveStagePresentation,
  type DecorationBlock,
  type QuestionPresentation,
  type StagePresentation,
} from "@ceylonweddings/contracts";
import type { StageBlock, StagePresentationView } from "@ceylonweddings/ui/domain/onboarding-stage";
import { localizedText } from "./labels";

function optionalText(
  value: Parameters<typeof localizedText>[0],
  locale: string,
): string | null {
  const text = localizedText(value, locale);
  return text ? text : null;
}

function toStageBlock(block: DecorationBlock, locale: string): StageBlock {
  const base = {
    id: block.id,
    slot: block.slot,
    sortOrder: block.sortOrder,
    align: block.align,
    maxWidthPx: block.maxWidthPx ?? null,
    hideOn: block.hideOn,
    entrance: block.entrance,
    delayMs: block.delayMs,
  };

  switch (block.kind) {
    case "TEXT":
      return {
        ...base,
        kind: "TEXT",
        heading: optionalText(block.heading, locale),
        body: optionalText(block.body, locale),
        tone: block.tone,
      };
    case "ICON":
      return {
        ...base,
        kind: "ICON",
        iconName: block.iconName,
        label: optionalText(block.label, locale),
        size: block.size,
        motion: block.motion,
      };
    case "IMAGE":
      return {
        ...base,
        kind: "IMAGE",
        src: block.src,
        alt: optionalText(block.alt, locale),
        fit: block.fit,
        rounded: block.rounded,
        aspect: block.aspect ?? null,
      };
    case "LOTTIE":
      return {
        ...base,
        kind: "LOTTIE",
        src: block.src,
        loop: block.loop,
        autoplay: block.autoplay,
        speed: block.speed,
      };
    case "VIDEO":
      return {
        ...base,
        kind: "VIDEO",
        src: block.src,
        poster: block.poster ?? null,
        loop: block.loop,
        autoplay: block.autoplay,
      };
  }
}

/** Localize a stored stage for rendering. */
export function toStageView(
  presentation: StagePresentation | null | undefined,
  locale: string,
): StagePresentationView | null {
  if (!presentation?.blocks.length) return null;
  return { blocks: presentation.blocks.map((block) => toStageBlock(block, locale)) };
}

/** Resolve a question against its vendor type default, then localize it. */
export function resolveStageView(
  question: QuestionPresentation | null | undefined,
  typeDefault: StagePresentation | null | undefined,
  locale: string,
): StagePresentationView | null {
  return toStageView(resolveStagePresentation(question, typeDefault), locale);
}
