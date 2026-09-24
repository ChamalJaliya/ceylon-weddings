import { formatMoney } from "@ceylonweddings/web";
import {
  formatVendorStartingPriceLabel,
  type LocalizedString,
  type PriceDisplayMode,
  type VendorProfileAttributeChip,
} from "@ceylonweddings/contracts";

export function localizedText(
  value: LocalizedString | null | undefined,
  locale = "en",
): string {
  if (!value) return "";
  if (locale === "si" && value.si) return value.si;
  if (locale === "ta" && value.ta) return value.ta;
  return value.en;
}

/** Display string for a profile attribute chip (options, boolean, range, etc.). */
export function formatAttributeDisplay(
  chip: VendorProfileAttributeChip,
  locale = "en",
): string {
  if (chip.options?.length) {
    return chip.options.map((option) => localizedText(option.label, locale)).join(" · ");
  }
  const value = chip.value;
  if (!value) return "";
  if ("boolean" in value) return value.boolean ? "Yes" : "No";
  if ("number" in value) return String(value.number);
  if ("range" in value) {
    const { min, max } = value.range;
    if (min != null && max != null) return `${min}–${max}`;
    if (min != null) return `${min}+`;
    if (max != null) return `≤${max}`;
    return "";
  }
  if ("text" in value) return value.text;
  return "";
}

export const CATEGORY_LABELS: Record<string, string> = {
  VENUE: "Venues",
  PHOTO_VIDEO: "Photo & video",
  BRIDAL_WEAR: "Bridal wear",
  GROOM_WEAR: "Groom wear",
  JEWELLERY: "Jewellery",
  HAIR_MAKEUP: "Hair & makeup",
  BRIDAL_DRESSER: "Bridal dresser",
  FLORIST_DECOR: "Florist & decor",
  CATERER: "Catering",
  CAKE: "Cake",
  ENTERTAINMENT: "Entertainment",
  PORUWA: "Poruwa",
  ASTROLOGY: "Astrology / nekath",
  WEDDING_CARS: "Wedding cars",
  INVITATIONS: "Invitations",
  PLANNER: "Planners",
  REGISTRAR: "Registrar",
  MEHNDI: "Mehndi",
  TRANSPORT: "Transport",
  ACCOMMODATION: "Stay",
};

export function priceLabel(
  amount: number | null | undefined,
  currency = "LKR",
  mode: PriceDisplayMode | null | undefined = "FROM",
  showPricing: boolean | null | undefined = true,
  askLabel = "Inquire for pricing",
) {
  return formatVendorStartingPriceLabel(
    { startingPriceLkr: amount ?? null, priceDisplayMode: mode ?? "FROM", showPricing },
    (value) => formatMoney(value, currency),
    askLabel,
  );
}

export function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}
