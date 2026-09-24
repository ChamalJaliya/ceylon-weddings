/**
 * Dense marketplace seed: ≥10 vendor types, ≥5 rich vendors each,
 * specialized attribute question sets + answers for Discover filters.
 */
import type { PrismaClient, Prisma } from "../src/generated/prisma/client";

type PhotoBank = Record<string, string>;

type UpsertAttrDef = (def: {
  typeId: string;
  key: string;
  valueType: Prisma.VendorAttributeDefinitionCreateInput["valueType"];
  layout: Prisma.VendorAttributeDefinitionCreateInput["layout"];
  question: string;
  filterLabel?: string;
  instruction?: string;
  helpText?: string;
  required?: boolean;
  filterable?: boolean;
  filterHighlight?: boolean;
  filterSortOrder?: number;
  showOnProfile?: boolean;
  collectOnboard?: boolean;
  unit?: string;
  minValue?: number;
  maxValue?: number;
  sortOrder?: number;
  options?: Array<{ key: string; label: string; helpText?: string }>;
}) => Promise<{ id: string }>;

type SetOptions = (vendorId: string, definitionId: string, optionKeys: string[]) => Promise<unknown>;

type AttrAnswer =
  | { kind: "options"; key: string; optionKeys: string[] }
  | { kind: "boolean"; key: string; value: boolean }
  | { kind: "range"; key: string; min: number; max: number };

type VendorBlueprint = {
  slug: string;
  name: string;
  email: string;
  city: string;
  district: string;
  startingPriceLkr: number;
  typicalSpendLkr: number;
  offerHeadline: string;
  description: string;
  whatsapp: string;
  photoKey: keyof PhotoBank;
  galleryKeys: Array<keyof PhotoBank>;
  styles: string[];
  serviceAreas: string[];
  featured?: boolean;
  destinationExperienced?: boolean;
  yearsExperience: number;
  couplesServed: number;
  ratingAvg: number;
  ratingCount: number;
  includedInPrice: string[];
  travelNote?: string;
  overtimeNote?: string;
  instagram: string;
  faqs: Array<{ question: string; answer: string }>;
  answers: AttrAnswer[];
  packages: Array<{
    name: string;
    tier?: "BASIC" | "ADVANCED" | "DREAM";
    pricingMode: "FIXED" | "FROM" | "RANGE" | "PER_GUEST" | "ON_REQUEST";
    priceLkr: number;
    priceMaxLkr?: number;
    badge?: "POPULAR" | "BEST_VALUE" | "LIMITED" | null;
    inclusions: string[];
    exclusions: string[];
    eventTypes: Array<"WEDDING" | "HOMECOMING" | "ENGAGEMENT" | "PRESHOOT" | "PORUWA" | "DESTINATION" | "REGISTRATION">;
    durationHours?: number;
    guestMin?: number;
    guestMax?: number;
    bestFor: string;
    description: string;
  }>;
};

type TypePack = {
  typeId: string;
  slug: string;
  definitions: Parameters<UpsertAttrDef>[0][];
  vendors: VendorBlueprint[];
};

function pickPhotos(photo: PhotoBank, keys: Array<keyof PhotoBank>, fallback: string) {
  const urls = keys.map((key) => photo[key]).filter(Boolean) as string[];
  return urls.length ? urls : [fallback, photo.garden, photo.venue].filter(Boolean) as string[];
}

export async function enrichRichCatalog(input: {
  prisma: PrismaClient;
  bySlug: Record<string, { id: string; slug: string; categoryId: string | null }>;
  photo: PhotoBank;
  upsertAttributeDefinition: UpsertAttrDef;
  setVendorOptionSelections: SetOptions;
  passwordHash: string;
}) {
  const { prisma, photo: PHOTO, upsertAttributeDefinition, setVendorOptionSelections, passwordHash } = input;
  const bySlug = { ...input.bySlug };

  async function upsertVendorUser(email: string, name: string) {
    return prisma.user.upsert({
      where: { email },
      update: { name, role: "VENDOR" },
      create: { email, name, role: "VENDOR", passwordHash },
    });
  }

  async function setBoolean(vendorId: string, definitionId: string, value: boolean) {
    await prisma.vendorAttributeValue.upsert({
      where: { vendorId_definitionId: { vendorId, definitionId } },
      create: { vendorId, definitionId, booleanValue: value },
      update: { booleanValue: value },
    });
  }

  async function setRange(vendorId: string, definitionId: string, min: number, max: number) {
    await prisma.vendorAttributeValue.upsert({
      where: { vendorId_definitionId: { vendorId, definitionId } },
      create: { vendorId, definitionId, rangeMin: min, rangeMax: max },
      update: { rangeMin: min, rangeMax: max },
    });
  }

  const packs: TypePack[] = [
    {
      typeId: "vt_PHOTO_VIDEO",
      slug: "PHOTO_VIDEO",
      definitions: [
        {
          typeId: "vt_PHOTO_VIDEO",
          key: "style",
          valueType: "SELECT",
          layout: "CARDS",
          question: "What is your photography style?",
          filterLabel: "Style",
          helpText: "Couples use this to shortlist a visual match.",
          required: true,
          filterable: true,
          filterHighlight: true,
          filterSortOrder: 0,
          collectOnboard: true,
          sortOrder: 0,
          options: [
            { key: "classic", label: "Classic" },
            { key: "editorial", label: "Editorial" },
            { key: "fine_art", label: "Fine Art" },
            { key: "photojournalistic", label: "Photojournalistic" },
          ],
        },
        {
          typeId: "vt_PHOTO_VIDEO",
          key: "formats",
          valueType: "MULTISELECT",
          layout: "CARDS",
          question: "Which formats do you shoot?",
          filterLabel: "Formats",
          instruction: "Select all that apply",
          required: true,
          filterable: true,
          filterHighlight: true,
          filterSortOrder: 1,
          collectOnboard: true,
          sortOrder: 1,
          options: [
            { key: "digital", label: "Digital" },
            { key: "film", label: "Film" },
            { key: "hybrid", label: "Hybrid", helpText: "Digital and film on the same day." },
          ],
        },
        {
          typeId: "vt_PHOTO_VIDEO",
          key: "services",
          valueType: "MULTISELECT",
          layout: "GRID",
          question: "Which extra services do you offer?",
          filterLabel: "Services",
          instruction: "Select all that apply",
          required: false,
          filterable: true,
          filterHighlight: false,
          filterSortOrder: 2,
          collectOnboard: true,
          sortOrder: 2,
          options: [
            { key: "bride_only", label: "Bride-only session" },
            { key: "drone", label: "Drone" },
            { key: "engagement", label: "Engagement" },
            { key: "extra_hours", label: "Extra hours" },
            { key: "image_editing", label: "Image editing" },
            { key: "online_proofing", label: "Online proofing" },
            { key: "printing_rights", label: "Printing rights" },
            { key: "same_day_edits", label: "Same-day edits" },
            { key: "second_photographer", label: "Second photographer" },
          ],
        },
      ],
      vendors: [
        bp("lotus-photography", "Lotus Photography", "vendor@ceylonweddings.com", "Colombo", "Colombo", 280000, 320000, "Quiet documentary films for poruwa mornings and Kandy homecomings", "Documentary coverage across Colombo, Kandy, and the south coast for diaspora and local couples.", "94771234567", "photo", ["photo", "beach", "garden", "venue", "dance"], ["poruwa", "church", "destination"], ["Colombo", "Kandy", "Galle"], true, true, 12, 220, 4.9, 18, ["High-res gallery", "Poruwa coverage", "Highlight film", "Two shooters"], "@lotus.weddings", [
          { kind: "options", key: "style", optionKeys: ["editorial"] },
          { kind: "options", key: "formats", optionKeys: ["digital", "film", "hybrid"] },
          { kind: "options", key: "services", optionKeys: ["drone", "engagement", "second_photographer", "online_proofing"] },
        ], [
          pkg("Ceremony coverage", "BASIC", "FROM", 150000, ["Poruwa / ceremony", "One shooter", "Gallery"], ["Album"], ["WEDDING", "PORUWA"], "Intimate ceremony", 6),
          pkg("Day + film", "ADVANCED", "FROM", 280000, ["Full day", "Two shooters", "Highlight film"], ["Printed album"], ["WEDDING", "HOMECOMING"], "Most couples", 10, "POPULAR"),
        ]),
        bp("coastal-frame-co", "Coastal Frame Co", "coastal@ceylonweddings.com", "Galle", "Galle", 320000, 380000, "Film + digital on the south coast — fort walls to Bentota beaches", "Fine-art and hybrid film coverage for destination weeks in Galle, Unawatuna, and Bentota.", "94771112233", "beach", ["beach", "photo", "garden", "venue", "bridal"], ["destination", "beach", "hindu"], ["Galle", "Matara", "Bentota"], true, true, 8, 140, 4.88, 22, ["Hybrid film roll", "Online gallery", "Highlight film"], "@coastal.frame", [
          { kind: "options", key: "style", optionKeys: ["fine_art"] },
          { kind: "options", key: "formats", optionKeys: ["digital", "film", "hybrid"] },
          { kind: "options", key: "services", optionKeys: ["engagement", "printing_rights", "image_editing", "second_photographer"] },
        ], [pkg("Coast day", "BASIC", "FROM", 320000, ["8 hours", "Hybrid film", "Gallery"], ["Album"], ["WEDDING", "DESTINATION"], "Single-day destination", 8)]),
        bp("kandy-lens-collective", "Kandy Lens Collective", "kandylens@ceylonweddings.com", "Kandy", "Kandy", 240000, 290000, "Photojournalistic Kandyan homecomings in the hills", "Two-shooter documentary teams for Kandy homecomings and hill-country poruwa weekends.", "94772223344", "photo", ["photo", "venue", "dance", "garden", "bridal"], ["kandyan", "homecoming", "poruwa"], ["Kandy", "Peradeniya", "Matale"], true, false, 11, 190, 4.86, 31, ["Two shooters", "Same-day selects", "Gallery"], "@kandy.lens", [
          { kind: "options", key: "style", optionKeys: ["photojournalistic"] },
          { kind: "options", key: "formats", optionKeys: ["digital"] },
          { kind: "options", key: "services", optionKeys: ["same_day_edits", "second_photographer", "extra_hours", "online_proofing"] },
        ], [pkg("Homecoming day", "ADVANCED", "FROM", 240000, ["Two shooters", "Same-day selects"], ["Film"], ["HOMECOMING", "PORUWA"], "Kandy homecoming", 10, "BEST_VALUE")]),
        bp("soft-light-nikah", "Soft Light Nikah Films", "softlight@ceylonweddings.com", "Colombo", "Colombo", 260000, 310000, "Quiet nikah mornings and walima films — halal venues welcome", "Classic coverage for Muslim and fusion celebrations with discreet nikah teams.", "94773334455", "photo", ["photo", "food", "bridal", "jewellery", "venue"], ["muslim", "walima", "classic"], ["Colombo", "Dehiwala", "Gampaha"], false, true, 7, 110, 4.91, 19, ["Nikah coverage", "Walima highlights", "Online proofing"], "@softlight.nikah", [
          { kind: "options", key: "style", optionKeys: ["classic"] },
          { kind: "options", key: "formats", optionKeys: ["digital"] },
          { kind: "options", key: "services", optionKeys: ["bride_only", "online_proofing", "image_editing"] },
        ], [pkg("Nikah + walima", "ADVANCED", "FROM", 260000, ["Nikah", "Walima highlights"], ["Drone"], ["WEDDING"], "Muslim celebrations", 10)]),
        bp("frame-and-vow", "Frame & Vow Studio", "framevow@ceylonweddings.com", "Negombo", "Gampaha", 210000, 255000, "Classic portraits for church mornings and Negombo garden halls", "Warm classic photography for Catholic and mixed ceremonies along the west coast.", "94774440011", "bridal", ["bridal", "photo", "venue", "garden", "invite"], ["church", "classic", "poruwa"], ["Negombo", "Colombo", "Gampaha"], false, false, 9, 160, 4.75, 15, ["Full-day coverage", "Online gallery", "Family formals"], "@frame.and.vow", [
          { kind: "options", key: "style", optionKeys: ["classic"] },
          { kind: "options", key: "formats", optionKeys: ["digital"] },
          { kind: "options", key: "services", optionKeys: ["engagement", "extra_hours", "online_proofing"] },
        ], [pkg("Church & reception", "BASIC", "FROM", 210000, ["Ceremony", "Reception", "Gallery"], ["Film"], ["WEDDING"], "West-coast classics", 9)]),
      ],
    },
    {
      typeId: "vt_VENUE",
      slug: "VENUE",
      definitions: [
        {
          typeId: "vt_VENUE",
          key: "guestCapacity",
          valueType: "RANGE",
          layout: "SLIDER",
          question: "What guest capacity do you support?",
          filterLabel: "Guest capacity",
          required: true,
          filterable: true,
          filterHighlight: true,
          filterSortOrder: 0,
          collectOnboard: true,
          unit: "guests",
          minValue: 50,
          maxValue: 1000,
          sortOrder: 0,
        },
        {
          typeId: "vt_VENUE",
          key: "outdoor",
          valueType: "BOOLEAN",
          layout: "TOGGLE",
          question: "Do you offer outdoor spaces?",
          filterLabel: "Outdoor",
          required: false,
          filterable: true,
          filterHighlight: true,
          filterSortOrder: 1,
          collectOnboard: false,
          sortOrder: 1,
        },
        {
          typeId: "vt_VENUE",
          key: "amenities",
          valueType: "MULTISELECT",
          layout: "GRID",
          question: "Which amenities are included on site?",
          filterLabel: "Amenities",
          instruction: "Select all that apply",
          required: false,
          filterable: true,
          filterHighlight: false,
          filterSortOrder: 2,
          collectOnboard: false,
          sortOrder: 2,
          options: [
            { key: "bridal_suite", label: "Bridal suite" },
            { key: "in_house_catering", label: "In-house catering" },
            { key: "poruwa_platform", label: "Poruwa platform" },
            { key: "prayer_room", label: "Prayer room" },
            { key: "coach_parking", label: "Coach parking" },
            { key: "ac", label: "Air conditioning" },
            { key: "generator", label: "Backup generator" },
          ],
        },
      ],
      vendors: [
        bp("glen-receptions", "Glen Receptions", "glen@ceylonweddings.com", "Negombo", "Gampaha", 850000, 1100000, "Garden hall for 200–400 with in-house plates and a poruwa platform", "Negombo garden hall built for big Sri Lankan guest lists.", "94772345678", "garden", ["garden", "venue", "food", "florist", "dance"], ["poruwa", "reception"], ["Negombo", "Gampaha", "Colombo"], true, false, 18, 400, 4.8, 42, ["Hall hire to 22:00", "In-house plates", "Poruwa platform", "Bridal suite"], "@glen.receptions", [
          { kind: "range", key: "guestCapacity", min: 200, max: 400 },
          { kind: "boolean", key: "outdoor", value: true },
          { kind: "options", key: "amenities", optionKeys: ["bridal_suite", "in_house_catering", "poruwa_platform", "coach_parking", "generator"] },
        ], [pkg("Hall + plates", "ADVANCED", "PER_GUEST", 8500, ["Hall", "Buffet", "Staff"], ["Alcohol"], ["WEDDING"], "200–400 guests", 8, "POPULAR", 200, 400)]),
        bp("kandy-hills-estate", "Kandy Hills Estate", "kandyhills@ceylonweddings.com", "Kandy", "Kandy", 1200000, 1500000, "Hill-country lawn for Kandyan homecomings", "Mist, lawn, and a pavilion that holds a proper homecoming.", "94773456789", "venue", ["venue", "garden", "beach", "photo"], ["homecoming", "poruwa"], ["Kandy", "Peradeniya"], true, true, 10, 95, 4.85, 11, ["Lawn + pavilion", "Poruwa backdrop", "Changing rooms"], "@kandyhills.estate", [
          { kind: "range", key: "guestCapacity", min: 120, max: 280 },
          { kind: "boolean", key: "outdoor", value: true },
          { kind: "options", key: "amenities", optionKeys: ["poruwa_platform", "coach_parking", "generator"] },
        ], [pkg("Lawn hire", "BASIC", "FROM", 1200000, ["Lawn", "Pavilion"], ["Catering"], ["HOMECOMING", "WEDDING"], "Hill homecoming", 8, null, 120, 280)]),
        bp("fort-lawn-galle", "Fort Lawn Galle", "fortlawn@ceylonweddings.com", "Galle", "Galle", 1800000, 2200000, "Destination garden beside the fort walls", "English and Sinhala coordinators for diaspora destination weekends.", "94774567890", "beach", ["beach", "garden", "venue", "photo"], ["destination", "hindu", "western"], ["Galle", "Unawatuna"], true, true, 14, 180, 4.84, 20, ["Lawn", "Coordinator", "Changing rooms"], "@fort.lawn", [
          { kind: "range", key: "guestCapacity", min: 80, max: 220 },
          { kind: "boolean", key: "outdoor", value: true },
          { kind: "options", key: "amenities", optionKeys: ["bridal_suite", "coach_parking", "generator"] },
        ], [pkg("Destination lawn", "DREAM", "FROM", 1800000, ["Lawn", "Coordinator"], ["Catering"], ["DESTINATION", "WEDDING"], "Fort weekends", 10, "LIMITED", 80, 220)]),
        bp("bentota-palm-pavilion", "Bentota Palm Pavilion", "bentota@ceylonweddings.com", "Bentota", "Galle", 950000, 1400000, "Beach lawn + pavilion for 120–280 destination guests", "Palm lawn with monsoon pavilion and bridal suite.", "94774445566", "beach", ["beach", "garden", "venue", "food"], ["destination", "beach", "western"], ["Bentota", "Beruwala"], true, true, 15, 260, 4.82, 38, ["Lawn hire", "Pavilion backup", "Bridal suite"], "@bentota.palm", [
          { kind: "range", key: "guestCapacity", min: 120, max: 280 },
          { kind: "boolean", key: "outdoor", value: true },
          { kind: "options", key: "amenities", optionKeys: ["bridal_suite", "coach_parking", "generator"] },
        ], [pkg("Lawn hire", "BASIC", "FROM", 950000, ["Lawn", "Pavilion"], ["Catering"], ["WEDDING", "DESTINATION"], "Destination lawn", 8, null, 120, 280)]),
        bp("lakeside-ballroom-colombo", "Lakeside Ballroom Colombo", "cinnamonballroom@ceylonweddings.com", "Colombo", "Colombo", 2200000, 3200000, "City ballroom for 400–800 — walima and church receptions", "Indoor ballroom with lake views and scalable plate packages.", "94775556677", "venue", ["venue", "food", "dance", "cake"], ["reception", "walima", "church"], ["Colombo"], true, false, 22, 700, 4.7, 64, ["Ballroom to 23:00", "Changing suites"], "@lakeside.ballroom", [
          { kind: "range", key: "guestCapacity", min: 400, max: 800 },
          { kind: "boolean", key: "outdoor", value: false },
          { kind: "options", key: "amenities", optionKeys: ["bridal_suite", "in_house_catering", "prayer_room", "ac", "generator"] },
        ], [pkg("Ballroom + plates", "ADVANCED", "PER_GUEST", 9500, ["Ballroom", "Plates", "Staff"], ["Decor"], ["WEDDING"], "Large Colombo lists", 8, "POPULAR", 400, 800)]),
      ],
    },
    {
      typeId: "vt_CATERER",
      slug: "CATERER",
      definitions: [
        {
          typeId: "vt_CATERER",
          key: "cuisine",
          valueType: "MULTISELECT",
          layout: "GRID",
          question: "Which cuisines and dietary lines do you offer?",
          filterLabel: "Cuisine",
          instruction: "Select all that apply",
          required: true,
          filterable: true,
          filterHighlight: true,
          filterSortOrder: 0,
          collectOnboard: true,
          sortOrder: 0,
          options: [
            { key: "sinhala", label: "Sinhala / Sri Lankan" },
            { key: "tamil", label: "Tamil" },
            { key: "halal", label: "Halal" },
            { key: "vegetarian", label: "Vegetarian" },
            { key: "seafood", label: "Seafood" },
            { key: "western", label: "Western plated" },
          ],
        },
        {
          typeId: "vt_CATERER",
          key: "serviceStyle",
          valueType: "SELECT",
          layout: "CARDS",
          question: "What is your primary service style?",
          filterLabel: "Service style",
          required: true,
          filterable: true,
          filterHighlight: true,
          filterSortOrder: 1,
          collectOnboard: true,
          sortOrder: 1,
          options: [
            { key: "buffet", label: "Buffet" },
            { key: "plated", label: "Plated" },
            { key: "live_stations", label: "Live stations" },
            { key: "family_style", label: "Family style" },
          ],
        },
      ],
      vendors: [
        bp("saffron-kitchen", "Saffron Kitchen", "saffron@ceylonweddings.com", "Colombo", "Colombo", 4200, 6500, "Halal kitchen · plates that scale from walima to garden reception", "Per-plate catering with a certified halal line for 150–500 guests.", "94770123456", "food", ["food", "venue", "garden", "dance"], ["halal", "vegetarian", "walima"], ["Colombo", "Gampaha"], true, false, 14, 520, 4.7, 33, ["Service staff", "Cutlery", "Live station option"], "@saffron.kitchen.lk", [
          { kind: "options", key: "cuisine", optionKeys: ["halal", "sinhala", "vegetarian", "seafood"] },
          { kind: "options", key: "serviceStyle", optionKeys: ["buffet"] },
        ], [pkg("Classic buffet", "BASIC", "PER_GUEST", 4200, ["Buffet", "Staff"], ["Alcohol"], ["WEDDING"], "150–400 guests", undefined, null, 150, 500)]),
        bp("spice-route-catering", "Spice Route Catering", "spiceroute@ceylonweddings.com", "Colombo", "Colombo", 4800, 7200, "Per-plate menus with live stations — fish, veg, and diaspora-mild lines", "Crews that know garden halls and city ballrooms.", "94776667788", "food", ["food", "venue", "garden", "dance"], ["reception", "homecoming"], ["Colombo", "Galle"], true, true, 16, 480, 4.78, 41, ["Service staff", "Chafing", "Tasting for 4"], "@spiceroute.lk", [
          { kind: "options", key: "cuisine", optionKeys: ["sinhala", "tamil", "vegetarian", "western", "seafood"] },
          { kind: "options", key: "serviceStyle", optionKeys: ["live_stations"] },
        ], [pkg("Live station evening", "ADVANCED", "PER_GUEST", 7200, ["Buffet + 2 stations"], ["Alcohol"], ["WEDDING"], "Reception energy", undefined, "POPULAR", 200, 500)]),
        bp("lagoon-leaf-kitchen", "Lagoon Leaf Kitchen", "lagoonleaf@ceylonweddings.com", "Negombo", "Gampaha", 3900, 5600, "Seafood-forward buffets for Negombo garden weddings", "Coastal seafood and Sinhala classics with clear allergen cards.", "94770012233", "food", ["food", "beach", "garden"], ["seafood", "reception"], ["Negombo", "Gampaha"], false, false, 10, 210, 4.72, 18, ["Buffet", "Seafood station"], "@lagoon.leaf", [
          { kind: "options", key: "cuisine", optionKeys: ["sinhala", "seafood", "vegetarian"] },
          { kind: "options", key: "serviceStyle", optionKeys: ["buffet"] },
        ], [pkg("Coastal buffet", "BASIC", "PER_GUEST", 3900, ["Buffet", "Seafood"], ["Alcohol"], ["WEDDING"], "West-coast halls", undefined, null, 120, 350)]),
        bp("hill-feast-caterers", "Hill Feast Caterers", "hillfeast@ceylonweddings.com", "Kandy", "Kandy", 4500, 6800, "Homecoming feasts that scale for Kandy lawns", "Family-style and buffet lines for hill-country guest lists.", "94770023344", "food", ["food", "venue", "garden"], ["homecoming", "kandyan"], ["Kandy", "Matale"], false, false, 12, 190, 4.76, 16, ["Family service", "Staff"], "@hill.feast", [
          { kind: "options", key: "cuisine", optionKeys: ["sinhala", "tamil", "vegetarian"] },
          { kind: "options", key: "serviceStyle", optionKeys: ["family_style"] },
        ], [pkg("Homecoming feast", "ADVANCED", "PER_GUEST", 4500, ["Family style", "Staff"], ["Alcohol"], ["HOMECOMING"], "Kandy weekends", undefined, null, 100, 300)]),
        bp("plated-atelier-colombo", "Plated Atelier Colombo", "platedatelier@ceylonweddings.com", "Colombo", "Colombo", 8500, 12000, "Western plated service for intimate city receptions", "Fine plated menus for 80–180 guests in Colombo ballrooms.", "94770034455", "food", ["food", "venue", "cake"], ["western", "reception"], ["Colombo"], false, false, 8, 95, 4.81, 12, ["Plated service", "Sommelier option"], "@plated.atelier", [
          { kind: "options", key: "cuisine", optionKeys: ["western", "vegetarian", "seafood"] },
          { kind: "options", key: "serviceStyle", optionKeys: ["plated"] },
        ], [pkg("Plated reception", "DREAM", "PER_GUEST", 8500, ["3-course plated", "Service"], ["Buffet"], ["WEDDING"], "Intimate plated", undefined, "BEST_VALUE", 80, 180)]),
      ],
    },
    {
      typeId: "vt_HAIR_MAKEUP",
      slug: "HAIR_MAKEUP",
      definitions: [
        {
          typeId: "vt_HAIR_MAKEUP",
          key: "beautyServices",
          valueType: "MULTISELECT",
          layout: "GRID",
          question: "Which beauty services do you offer?",
          filterLabel: "Services",
          instruction: "Select all that apply",
          required: true,
          filterable: true,
          filterHighlight: true,
          filterSortOrder: 0,
          collectOnboard: true,
          sortOrder: 0,
          options: [
            { key: "bridal", label: "Bridal makeup" },
            { key: "hair", label: "Hair styling" },
            { key: "trial", label: "Trial" },
            { key: "bridesmaids", label: "Bridesmaids" },
            { key: "groom", label: "Groom grooming" },
            { key: "destination", label: "Destination travel" },
          ],
        },
        {
          typeId: "vt_HAIR_MAKEUP",
          key: "lookStyle",
          valueType: "SELECT",
          layout: "CARDS",
          question: "What look do you specialize in?",
          filterLabel: "Look",
          required: true,
          filterable: true,
          filterHighlight: true,
          filterSortOrder: 1,
          collectOnboard: true,
          sortOrder: 1,
          options: [
            { key: "soft_glam", label: "Soft glam" },
            { key: "traditional", label: "Traditional / osariya" },
            { key: "editorial", label: "Editorial" },
            { key: "natural", label: "Natural" },
          ],
        },
      ],
      vendors: [
        bp("glam-by-nadeesha", "Glam by Nadeesha", "glam@ceylonweddings.com", "Colombo", "Colombo", 65000, 85000, "Bridal glam for osariya mornings and destination looks", "Soft glam under poruwa lights and church windows.", "94777890123", "makeup", ["makeup", "bridal", "jewellery", "photo"], ["poruwa", "church", "destination"], ["Colombo", "Negombo", "Galle"], true, true, 9, 310, 4.92, 27, ["Lashes", "Touch-up kit", "Trial notes"], "@glambynadeesha", [
          { kind: "options", key: "beautyServices", optionKeys: ["bridal", "hair", "trial", "bridesmaids", "destination"] },
          { kind: "options", key: "lookStyle", optionKeys: ["soft_glam"] },
        ], [pkg("Bridal day", "ADVANCED", "FROM", 65000, ["On-location", "Touch-ups"], ["Bridesmaids"], ["WEDDING"], "Wedding morning", 4, "POPULAR")]),
        bp("studio-mira-beauty", "Studio Mira Beauty", "studiomira@ceylonweddings.com", "Galle", "Galle", 70000, 95000, "Destination bridal glam for fort mornings and beach portraits", "Humidity-proof glam for the south coast.", "94778889900", "makeup", ["makeup", "bridal", "beach", "jewellery"], ["destination", "beach"], ["Galle", "Matara", "Bentota"], true, true, 6, 200, 4.9, 24, ["Lashes", "Touch-up kit", "Trial"], "@studiomira.galle", [
          { kind: "options", key: "beautyServices", optionKeys: ["bridal", "hair", "trial", "destination"] },
          { kind: "options", key: "lookStyle", optionKeys: ["natural"] },
        ], [pkg("Bridal day", "ADVANCED", "FROM", 70000, ["On-location", "Hair + makeup"], ["Bridesmaids"], ["WEDDING", "DESTINATION"], "South coast bridal", 4)]),
        bp("osariya-glow-lab", "Osariya Glow Lab", "osariyaglow@ceylonweddings.com", "Kandy", "Kandy", 55000, 75000, "Traditional bridal makeup that photographs with neththi", "Specialists in Kandyan and osariya mornings.", "94770045566", "makeup", ["makeup", "bridal", "jewellery"], ["kandyan", "poruwa"], ["Kandy", "Peradeniya"], false, false, 11, 240, 4.87, 21, ["Trial", "Neththi-aware styling"], "@osariya.glow", [
          { kind: "options", key: "beautyServices", optionKeys: ["bridal", "hair", "trial", "bridesmaids"] },
          { kind: "options", key: "lookStyle", optionKeys: ["traditional"] },
        ], [pkg("Kandyan bridal", "BASIC", "FROM", 55000, ["Makeup", "Hair", "Trial"], ["Travel far south"], ["WEDDING", "PORUWA"], "Osariya mornings", 4)]),
        bp("editorial-face-co", "Editorial Face Co", "editorialface@ceylonweddings.com", "Colombo", "Colombo", 80000, 110000, "Editorial bridal looks for fashion-forward city weddings", "Strong brows, clean skin, camera-ready editorial glam.", "94770056677", "makeup", ["makeup", "photo", "bridal"], ["editorial", "modern"], ["Colombo"], false, false, 5, 90, 4.85, 11, ["Editorial trial", "Lashes"], "@editorial.face", [
          { kind: "options", key: "beautyServices", optionKeys: ["bridal", "hair", "trial"] },
          { kind: "options", key: "lookStyle", optionKeys: ["editorial"] },
        ], [pkg("Editorial bridal", "DREAM", "FROM", 80000, ["Makeup", "Hair", "Touch-ups"], ["Bridesmaids"], ["WEDDING"], "Fashion-forward", 5)]),
        bp("grooming-by-asan", "Grooming by Asan", "groomingasan@ceylonweddings.com", "Colombo", "Colombo", 25000, 40000, "Groom grooming and nilame-ready skin for poruwa mornings", "Quick, clean groom kits that photograph well.", "94770067788", "makeup", ["makeup", "photo", "bridal"], ["groom", "poruwa"], ["Colombo", "Gampaha"], false, false, 7, 150, 4.7, 14, ["Groom kit", "On-location"], "@grooming.asan", [
          { kind: "options", key: "beautyServices", optionKeys: ["groom", "trial"] },
          { kind: "options", key: "lookStyle", optionKeys: ["natural"] },
        ], [pkg("Groom kit", "BASIC", "FIXED", 25000, ["Grooming", "On-location"], ["Bridal"], ["WEDDING"], "Grooms", 1)]),
      ],
    },
    {
      typeId: "vt_FLORIST_DECOR",
      slug: "FLORIST_DECOR",
      definitions: [
        {
          typeId: "vt_FLORIST_DECOR",
          key: "ceremonySets",
          valueType: "MULTISELECT",
          layout: "GRID",
          question: "Which ceremony sets do you build?",
          filterLabel: "Ceremony sets",
          required: true,
          filterable: true,
          filterHighlight: true,
          filterSortOrder: 0,
          collectOnboard: true,
          sortOrder: 0,
          options: [
            { key: "poruwa", label: "Poruwa" },
            { key: "church", label: "Church" },
            { key: "hindu", label: "Hindu mandap" },
            { key: "nikah", label: "Nikah stage" },
            { key: "reception", label: "Reception hall" },
            { key: "homecoming", label: "Homecoming" },
          ],
        },
        {
          typeId: "vt_FLORIST_DECOR",
          key: "floralStyle",
          valueType: "SELECT",
          layout: "CARDS",
          question: "What floral style are you known for?",
          filterLabel: "Floral style",
          required: true,
          filterable: true,
          filterHighlight: true,
          filterSortOrder: 1,
          collectOnboard: true,
          sortOrder: 1,
          options: [
            { key: "traditional", label: "Traditional jasmine / lotus" },
            { key: "garden", label: "Garden romantic" },
            { key: "minimal", label: "Minimal modern" },
            { key: "tropical", label: "Tropical statement" },
          ],
        },
      ],
      vendors: [
        bp("temple-blooms", "Temple Blooms", "blooms@ceylonweddings.com", "Colombo", "Colombo", 180000, 260000, "Poruwa florals, jasmine, and hall stories that hold in heat", "Temple-friendly garlands and reception florals.", "94779012345", "florist", ["florist", "venue", "bridal", "garden"], ["poruwa", "hindu", "reception"], ["Colombo", "Kandy", "Galle"], false, true, 11, 180, 4.75, 14, ["Setup + teardown", "Poruwa set", "Entrance"], "@templeblooms", [
          { kind: "options", key: "ceremonySets", optionKeys: ["poruwa", "hindu", "reception", "church"] },
          { kind: "options", key: "floralStyle", optionKeys: ["traditional"] },
        ], [pkg("Poruwa + entrance", "BASIC", "FROM", 180000, ["Poruwa", "Entrance"], ["Full hall"], ["PORUWA", "WEDDING"], "Ceremony first", 6)]),
        bp("petal-house-decor", "Petal House Decor", "petalhouse@ceylonweddings.com", "Kandy", "Kandy", 160000, 240000, "Hill-country poruwa sets and jasmine that lasts through nekath delays", "Kandy florals for homecomings and dual-city weekends.", "94777778899", "florist", ["florist", "venue", "garden", "bridal"], ["poruwa", "kandyan", "homecoming"], ["Kandy", "Colombo"], false, false, 9, 150, 4.8, 17, ["Setup + teardown", "Poruwa set"], "@petalhouse.kandy", [
          { kind: "options", key: "ceremonySets", optionKeys: ["poruwa", "homecoming", "reception"] },
          { kind: "options", key: "floralStyle", optionKeys: ["garden"] },
        ], [pkg("Homecoming set", "ADVANCED", "FROM", 160000, ["Pavilion florals"], ["Mandap"], ["HOMECOMING"], "Hill weekends", 5)]),
        bp("fort-florals-galle", "Fort Florals Galle", "fortflorals@ceylonweddings.com", "Galle", "Galle", 210000, 300000, "Tropical statement florals for fort and beach ceremonies", "Orchids and tropical greens that survive coastal wind.", "94770078899", "florist", ["florist", "beach", "venue"], ["destination", "beach"], ["Galle", "Bentota"], true, true, 7, 120, 4.79, 13, ["Beach install", "Teardown"], "@fort.florals", [
          { kind: "options", key: "ceremonySets", optionKeys: ["reception", "hindu", "church"] },
          { kind: "options", key: "floralStyle", optionKeys: ["tropical"] },
        ], [pkg("Destination install", "DREAM", "FROM", 210000, ["Ceremony + reception"], ["Poruwa timber"], ["DESTINATION", "WEDDING"], "Coast weeks", 8, "POPULAR")]),
        bp("minimal-stem-studio", "Minimal Stem Studio", "minimalstem@ceylonweddings.com", "Colombo", "Colombo", 140000, 190000, "Minimal modern stems for city ballrooms", "Clean lines, fewer flowers, strong silhouette.", "94770089900", "florist", ["florist", "venue", "cake"], ["modern", "reception"], ["Colombo"], false, false, 5, 70, 4.73, 9, ["Minimal install"], "@minimal.stem", [
          { kind: "options", key: "ceremonySets", optionKeys: ["reception", "church", "nikah"] },
          { kind: "options", key: "floralStyle", optionKeys: ["minimal"] },
        ], [pkg("Ballroom minimal", "BASIC", "FROM", 140000, ["Tables + stage"], ["Poruwa"], ["WEDDING"], "City modern", 5)]),
        bp("jasmine-lane-decor", "Jasmine Lane Decor", "jasminelane@ceylonweddings.com", "Gampaha", "Gampaha", 125000, 185000, "Jasmine-heavy traditional sets for garden poruwa days", "Classic jasmine and lotus for Negombo and Gampaha halls.", "94770090011", "florist", ["florist", "garden", "venue"], ["poruwa", "traditional"], ["Gampaha", "Negombo", "Colombo"], false, false, 13, 200, 4.77, 19, ["Poruwa", "Garlands"], "@jasmine.lane", [
          { kind: "options", key: "ceremonySets", optionKeys: ["poruwa", "reception", "homecoming"] },
          { kind: "options", key: "floralStyle", optionKeys: ["traditional"] },
        ], [pkg("Garden poruwa", "BASIC", "FROM", 125000, ["Poruwa florals"], ["Full draping"], ["PORUWA", "WEDDING"], "Garden days", 5)]),
      ],
    },
    {
      typeId: "vt_BRIDAL_WEAR",
      slug: "BRIDAL_WEAR",
      definitions: [
        {
          typeId: "vt_BRIDAL_WEAR",
          key: "attireTypes",
          valueType: "MULTISELECT",
          layout: "GRID",
          question: "Which bridal attire do you offer?",
          filterLabel: "Attire",
          required: true,
          filterable: true,
          filterHighlight: true,
          filterSortOrder: 0,
          collectOnboard: true,
          sortOrder: 0,
          options: [
            { key: "osariya", label: "Osariya" },
            { key: "kandyan", label: "Kandyan" },
            { key: "western_gown", label: "Western gown" },
            { key: "lehenga", label: "Lehenga" },
            { key: "reception", label: "Reception look" },
          ],
        },
        {
          typeId: "vt_BRIDAL_WEAR",
          key: "hireOrBuy",
          valueType: "SELECT",
          layout: "CARDS",
          question: "Do you primarily hire or sell?",
          filterLabel: "Hire or buy",
          required: true,
          filterable: true,
          filterHighlight: true,
          filterSortOrder: 1,
          collectOnboard: true,
          sortOrder: 1,
          options: [
            { key: "hire", label: "Hire" },
            { key: "purchase", label: "Purchase" },
            { key: "both", label: "Hire + purchase" },
          ],
        },
      ],
      vendors: [
        bp("ransilu-bridal", "Ransilu Bridal", "osariya@ceylonweddings.com", "Colombo", "Colombo", 185000, 260000, "Osariya, Kandyan jackets, and western gowns for hire or purchase", "Full bridal wardrobe with fittings in Colombo.", "94775678901", "bridal", ["bridal", "jewellery", "photo", "makeup"], ["kandyan", "western"], ["Colombo"], true, false, 15, 400, 4.8, 35, ["Fitting", "Alterations"], "@ransilu.bridal", [
          { kind: "options", key: "attireTypes", optionKeys: ["osariya", "kandyan", "western_gown", "reception"] },
          { kind: "options", key: "hireOrBuy", optionKeys: ["both"] },
        ], [pkg("Osariya hire", "BASIC", "FROM", 185000, ["Osariya", "Fitting"], ["Jewellery"], ["WEDDING", "PORUWA"], "Poruwa morning", 2)]),
        bp("silk-route-bridals", "Silk Route Bridals", "silkroute@ceylonweddings.com", "Colombo", "Colombo", 220000, 350000, "Lehengas and reception looks for Hindu and fusion weddings", "Heavy embroidery and soft pastels for mehndi-to-reception.", "94770101112", "bridal", ["bridal", "mehndi", "jewellery"], ["hindu", "mehndi"], ["Colombo", "Galle"], false, true, 8, 130, 4.82, 16, ["Trial drape", "Blouse stitch"], "@silk.route", [
          { kind: "options", key: "attireTypes", optionKeys: ["lehenga", "reception", "western_gown"] },
          { kind: "options", key: "hireOrBuy", optionKeys: ["purchase"] },
        ], [pkg("Lehenga set", "ADVANCED", "FROM", 220000, ["Lehenga", "Blouse"], ["Jewellery"], ["WEDDING"], "Hindu / fusion", 3, "POPULAR")]),
        bp("kandyan-thread-house", "Kandyan Thread House", "kandyanthread@ceylonweddings.com", "Kandy", "Kandy", 165000, 230000, "Kandyan bridal hire rooted in hill-country craft", "Jackets and osariya ready for homecoming weekends.", "94770112223", "bridal", ["bridal", "jewellery", "venue"], ["kandyan", "homecoming"], ["Kandy"], false, false, 20, 280, 4.79, 22, ["Fitting in Kandy"], "@kandyan.thread", [
          { kind: "options", key: "attireTypes", optionKeys: ["osariya", "kandyan"] },
          { kind: "options", key: "hireOrBuy", optionKeys: ["hire"] },
        ], [pkg("Kandyan hire", "BASIC", "FROM", 165000, ["Jacket + osariya"], ["Western gown"], ["HOMECOMING", "PORUWA"], "Hill weddings", 2)]),
        bp("atelier-lune-gowns", "Atelier Lune Gowns", "atelierlune@ceylonweddings.com", "Colombo", "Colombo", 280000, 450000, "Custom western gowns for church and evening receptions", "Made-to-measure soft A-lines and clean mermaid silhouettes.", "94770123334", "bridal", ["bridal", "photo", "venue"], ["western", "church"], ["Colombo"], false, false, 6, 85, 4.88, 10, ["Custom pattern", "2 fittings"], "@atelier.lune", [
          { kind: "options", key: "attireTypes", optionKeys: ["western_gown", "reception"] },
          { kind: "options", key: "hireOrBuy", optionKeys: ["purchase"] },
        ], [pkg("Custom gown", "DREAM", "FROM", 280000, ["Custom sew", "Fittings"], ["Hire"], ["WEDDING"], "Church brides", 4)]),
        bp("two-look-bridal-lab", "Two Look Bridal Lab", "twolook@ceylonweddings.com", "Colombo", "Colombo", 195000, 290000, "Poruwa osariya + reception gown packages", "Two-look kits for couples who change after nekath.", "94770134445", "bridal", ["bridal", "dance", "photo"], ["poruwa", "reception"], ["Colombo", "Gampaha"], true, false, 9, 170, 4.74, 18, ["Two looks", "Quick-change help"], "@two.look", [
          { kind: "options", key: "attireTypes", optionKeys: ["osariya", "western_gown", "reception"] },
          { kind: "options", key: "hireOrBuy", optionKeys: ["both"] },
        ], [pkg("Two-look kit", "ADVANCED", "FROM", 195000, ["Osariya + gown"], ["Jewellery"], ["WEDDING"], "Change after poruwa", 3, "BEST_VALUE")]),
      ],
    },
    {
      typeId: "vt_ENTERTAINMENT",
      slug: "ENTERTAINMENT",
      definitions: [
        {
          typeId: "vt_ENTERTAINMENT",
          key: "performanceTypes",
          valueType: "MULTISELECT",
          layout: "GRID",
          question: "What performances do you provide?",
          filterLabel: "Performances",
          required: true,
          filterable: true,
          filterHighlight: true,
          filterSortOrder: 0,
          collectOnboard: true,
          sortOrder: 0,
          options: [
            { key: "magul_bera", label: "Magul bera" },
            { key: "kandyan_dance", label: "Kandyan dance" },
            { key: "jayamangala", label: "Jayamangala gatha" },
            { key: "band", label: "Reception band" },
            { key: "dj", label: "DJ" },
            { key: "baila", label: "Baila set" },
          ],
        },
        {
          typeId: "vt_ENTERTAINMENT",
          key: "languages",
          valueType: "MULTISELECT",
          layout: "GRID",
          question: "Which languages can your team work in?",
          filterLabel: "Languages",
          required: false,
          filterable: true,
          filterHighlight: false,
          filterSortOrder: 1,
          collectOnboard: false,
          sortOrder: 1,
          options: [
            { key: "sinhala", label: "Sinhala" },
            { key: "tamil", label: "Tamil" },
            { key: "english", label: "English" },
          ],
        },
      ],
      vendors: [
        bp("magul-bera-collective", "Magul Bera Collective", "magulbera@ceylonweddings.com", "Kandy", "Kandy", 95000, 140000, "Kandyan dancers, magul bera, and jayamangala gatha", "Ceremony ensembles that respect nekath timing.", "94772348765", "dance", ["dance", "venue", "garden", "photo"], ["kandyan", "poruwa", "hindu"], ["Kandy", "Colombo"], true, false, 16, 350, 4.85, 40, ["Ceremony set", "Costume"], "@magul.bera", [
          { kind: "options", key: "performanceTypes", optionKeys: ["magul_bera", "kandyan_dance", "jayamangala"] },
          { kind: "options", key: "languages", optionKeys: ["sinhala", "english"] },
        ], [pkg("Ceremony ensemble", "BASIC", "FROM", 95000, ["Magul bera", "Dance"], ["DJ"], ["PORUWA", "WEDDING"], "Poruwa morning", 3)]),
        bp("island-drumline", "Island Drumline", "drumline@ceylonweddings.com", "Colombo", "Colombo", 110000, 160000, "Magul bera plus a dance floor that starts on time", "Ceremony respect, then baila and English sets.", "94770001122", "dance", ["dance", "venue", "garden", "photo"], ["kandyan", "reception", "baila"], ["Colombo", "Galle"], true, true, 12, 275, 4.83, 36, ["Ceremony set", "Sound tech", "2-hour reception"], "@island.drumline", [
          { kind: "options", key: "performanceTypes", optionKeys: ["magul_bera", "band", "baila"] },
          { kind: "options", key: "languages", optionKeys: ["sinhala", "english"] },
        ], [pkg("Ceremony + reception", "ADVANCED", "FROM", 110000, ["Magul bera", "Reception set"], ["Late DJ"], ["WEDDING", "PORUWA"], "Full day energy", 6)]),
        bp("baila-nights-lk", "Baila Nights LK", "bailanights@ceylonweddings.com", "Colombo", "Colombo", 85000, 120000, "High-energy baila and DJ for Colombo receptions", "Floor-fillers for mixed-age guest lists.", "94770145556", "dance", ["dance", "venue", "food"], ["baila", "reception"], ["Colombo", "Gampaha"], false, false, 9, 220, 4.7, 25, ["DJ + MC", "Basic lights"], "@baila.nights", [
          { kind: "options", key: "performanceTypes", optionKeys: ["dj", "baila", "band"] },
          { kind: "options", key: "languages", optionKeys: ["sinhala", "english", "tamil"] },
        ], [pkg("Reception DJ", "BASIC", "FROM", 85000, ["4-hour DJ"], ["Ceremony"], ["WEDDING"], "Reception only", 4, "POPULAR")]),
        bp("string-and-vow", "String & Vow Quartet", "stringvow@ceylonweddings.com", "Colombo", "Colombo", 75000, 110000, "String quartet for church processions and quiet cocktail hours", "Classical sets for church and hotel weddings.", "94770156667", "dance", ["dance", "venue", "invite"], ["church", "western"], ["Colombo"], false, false, 8, 100, 4.9, 12, ["Ceremony set", "Cocktail hour"], "@string.and.vow", [
          { kind: "options", key: "performanceTypes", optionKeys: ["band"] },
          { kind: "options", key: "languages", optionKeys: ["english"] },
        ], [pkg("Ceremony strings", "BASIC", "FIXED", 75000, ["Processional", "Cocktail"], ["DJ"], ["WEDDING"], "Church mornings", 3)]),
        bp("nadaswaram-house", "Nadaswaram House", "nadaswaram@ceylonweddings.com", "Colombo", "Colombo", 65000, 95000, "Nadaswaram and traditional ensembles for Hindu ceremonies", "Temple-aware musicians for muhurtham timing.", "94770167778", "dance", ["dance", "mehndi", "venue"], ["hindu", "mehndi"], ["Colombo", "Jaffna"], false, true, 18, 160, 4.86, 15, ["Ceremony ensemble"], "@nadaswaram.house", [
          { kind: "options", key: "performanceTypes", optionKeys: ["band"] },
          { kind: "options", key: "languages", optionKeys: ["tamil", "english"] },
        ], [pkg("Muhurtham set", "BASIC", "FROM", 65000, ["Nadaswaram set"], ["Reception DJ"], ["WEDDING"], "Hindu ceremony", 3)]),
      ],
    },
    {
      typeId: "vt_WEDDING_CARS",
      slug: "WEDDING_CARS",
      definitions: [
        {
          typeId: "vt_WEDDING_CARS",
          key: "fleetTypes",
          valueType: "MULTISELECT",
          layout: "GRID",
          question: "Which vehicles are in your wedding fleet?",
          filterLabel: "Fleet",
          required: true,
          filterable: true,
          filterHighlight: true,
          filterSortOrder: 0,
          collectOnboard: true,
          sortOrder: 0,
          options: [
            { key: "vintage", label: "Vintage" },
            { key: "luxury_sedan", label: "Luxury sedan" },
            { key: "suv", label: "SUV" },
            { key: "convertible", label: "Convertible" },
            { key: "coach", label: "Guest coach" },
          ],
        },
        {
          typeId: "vt_WEDDING_CARS",
          key: "decorIncluded",
          valueType: "BOOLEAN",
          layout: "TOGGLE",
          question: "Is floral / ribbon decor included?",
          filterLabel: "Decor included",
          required: false,
          filterable: true,
          filterHighlight: true,
          filterSortOrder: 1,
          collectOnboard: false,
          sortOrder: 1,
        },
      ],
      vendors: [
        bp("bridal-fleet-colombo", "Bridal Fleet Colombo", "bridalfleet@ceylonweddings.com", "Colombo", "Colombo", 35000, 55000, "Decorated vintage and luxury cars for Colombo and airport runs", "Classic cars with ribbon kits for city weddings.", "94775671098", "car", ["car", "venue", "photo"], ["colombo", "destination"], ["Colombo", "Gampaha"], true, true, 12, 300, 4.7, 28, ["Decor kit", "Chauffeur"], "@bridal.fleet", [
          { kind: "options", key: "fleetTypes", optionKeys: ["vintage", "luxury_sedan", "convertible"] },
          { kind: "boolean", key: "decorIncluded", value: true },
        ], [pkg("Bridal car half-day", "BASIC", "FROM", 35000, ["Car", "Decor", "Driver"], ["Coach"], ["WEDDING"], "City bridal", 4)]),
        bp("hill-ride-classics", "Hill Ride Classics", "hillride@ceylonweddings.com", "Kandy", "Kandy", 40000, 65000, "Vintage cars for Kandy homecomings and temple runs", "Hill-road confident chauffeurs.", "94770178889", "car", ["car", "venue", "garden"], ["kandyan", "homecoming"], ["Kandy"], false, false, 10, 140, 4.75, 14, ["Vintage car", "Driver"], "@hill.ride", [
          { kind: "options", key: "fleetTypes", optionKeys: ["vintage", "suv"] },
          { kind: "boolean", key: "decorIncluded", value: true },
        ], [pkg("Homecoming vintage", "BASIC", "FROM", 40000, ["Vintage", "Decor"], ["Airport"], ["HOMECOMING"], "Kandy day", 5)]),
        bp("coast-convertible-co", "Coast Convertible Co", "coastconvertible@ceylonweddings.com", "Galle", "Galle", 45000, 70000, "Convertibles for fort and beach portrait loops", "Open-top cars for south-coast photo runs.", "94770189990", "car", ["car", "beach", "photo"], ["destination", "beach"], ["Galle", "Bentota"], false, true, 6, 90, 4.8, 11, ["Convertible", "Driver"], "@coast.convert", [
          { kind: "options", key: "fleetTypes", optionKeys: ["convertible", "luxury_sedan"] },
          { kind: "boolean", key: "decorIncluded", value: false },
        ], [pkg("Portrait loop", "ADVANCED", "FROM", 45000, ["2-hour loop"], ["Full day coach"], ["WEDDING", "DESTINATION"], "Beach portraits", 2, "POPULAR")]),
        bp("airport-coach-line", "Airport Coach Line", "airportcoach@ceylonweddings.com", "Negombo", "Gampaha", 55000, 90000, "Guest coaches from CMB to halls across the west and south", "Air-conditioned coaches for diaspora guest flows.", "94770200011", "car", ["car", "venue"], ["destination", "airport"], ["Negombo", "Colombo", "Galle"], true, true, 14, 260, 4.68, 30, ["Coach", "Luggage space"], "@airport.coach", [
          { kind: "options", key: "fleetTypes", optionKeys: ["coach", "suv"] },
          { kind: "boolean", key: "decorIncluded", value: false },
        ], [pkg("Airport transfer", "BASIC", "FROM", 55000, ["Coach", "Driver"], ["Decor car"], ["WEDDING"], "Guest logistics", 6)]),
        bp("nilame-motor-house", "Nilame Motor House", "nilamemotor@ceylonweddings.com", "Colombo", "Colombo", 38000, 60000, "Luxury sedans for nilame parties and hotel pickups", "Black sedans with discreet chauffeurs.", "94770211122", "car", ["car", "bridal", "photo"], ["kandyan", "colombo"], ["Colombo"], false, false, 9, 180, 4.72, 17, ["Sedan", "Chauffeur"], "@nilame.motor", [
          { kind: "options", key: "fleetTypes", optionKeys: ["luxury_sedan", "suv"] },
          { kind: "boolean", key: "decorIncluded", value: true },
        ], [pkg("Sedan half-day", "BASIC", "FROM", 38000, ["Sedan", "Decor ribbon"], ["Coach"], ["WEDDING"], "Groom party", 4)]),
      ],
    },
    {
      typeId: "vt_CAKE",
      slug: "CAKE",
      definitions: [
        {
          typeId: "vt_CAKE",
          key: "cakeStyles",
          valueType: "MULTISELECT",
          layout: "GRID",
          question: "Which cake styles do you bake?",
          filterLabel: "Cake styles",
          required: true,
          filterable: true,
          filterHighlight: true,
          filterSortOrder: 0,
          collectOnboard: true,
          sortOrder: 0,
          options: [
            { key: "buttercream", label: "Buttercream" },
            { key: "fondant", label: "Fondant" },
            { key: "love_cake", label: "Traditional love cake" },
            { key: "naked", label: "Naked / semi-naked" },
            { key: "cupcakes", label: "Cupcake tower" },
          ],
        },
        {
          typeId: "vt_CAKE",
          key: "dietary",
          valueType: "MULTISELECT",
          layout: "GRID",
          question: "Which dietary options can you support?",
          filterLabel: "Dietary",
          required: false,
          filterable: true,
          filterHighlight: false,
          filterSortOrder: 1,
          collectOnboard: false,
          sortOrder: 1,
          options: [
            { key: "eggless", label: "Eggless" },
            { key: "halal", label: "Halal ingredients" },
            { key: "gluten_free", label: "Gluten free" },
            { key: "nut_free", label: "Nut free kitchen note" },
          ],
        },
      ],
      vendors: [
        bp("butter-and-bloom", "Butter and Bloom Cakes", "cake@ceylonweddings.com", "Colombo", "Colombo", 45000, 75000, "Buttercream and traditional love-cake tiers for Sri Lankan receptions", "Tiers that survive long nekath delays.", "94771239876", "cake", ["cake", "venue", "food"], ["reception", "homecoming"], ["Colombo"], true, false, 10, 260, 4.8, 29, ["Tasting", "Delivery"], "@butter.bloom", [
          { kind: "options", key: "cakeStyles", optionKeys: ["buttercream", "love_cake", "fondant"] },
          { kind: "options", key: "dietary", optionKeys: ["eggless", "halal"] },
        ], [pkg("Three-tier buttercream", "BASIC", "FROM", 45000, ["3 tiers", "Delivery"], ["Dessert bar"], ["WEDDING"], "Classic reception", 1)]),
        bp("sugar-fort-atelier", "Sugar Fort Atelier", "sugarfort@ceylonweddings.com", "Galle", "Galle", 55000, 90000, "Fondant destination cakes for fort weekends", "Heat-aware fondant work for the south coast.", "94770222233", "cake", ["cake", "beach", "venue"], ["destination", "beach"], ["Galle", "Bentota"], false, true, 7, 110, 4.84, 13, ["Fondant", "Travel delivery"], "@sugar.fort", [
          { kind: "options", key: "cakeStyles", optionKeys: ["fondant", "buttercream", "naked"] },
          { kind: "options", key: "dietary", optionKeys: ["eggless"] },
        ], [pkg("Destination fondant", "ADVANCED", "FROM", 55000, ["Fondant tier", "Travel"], ["Love cake"], ["DESTINATION", "WEDDING"], "Coast cakes", 1, "POPULAR")]),
        bp("love-cake-lane", "Love Cake Lane", "lovecakelane@ceylonweddings.com", "Kandy", "Kandy", 28000, 45000, "Traditional love cake tables for homecomings", "Cashew-heavy classic cakes for elders' tables.", "94770233344", "cake", ["cake", "food", "venue"], ["homecoming", "kandyan"], ["Kandy"], false, false, 15, 300, 4.7, 33, ["Love cake", "Pack boxes"], "@love.cake.lane", [
          { kind: "options", key: "cakeStyles", optionKeys: ["love_cake", "buttercream"] },
          { kind: "options", key: "dietary", optionKeys: ["halal"] },
        ], [pkg("Love cake table", "BASIC", "FROM", 28000, ["Love cake", "Boxes"], ["Fondant sculpture"], ["HOMECOMING"], "Elders' table", 1)]),
        bp("naked-tier-lab", "Naked Tier Lab", "nakedtier@ceylonweddings.com", "Colombo", "Colombo", 40000, 65000, "Semi-naked floral cakes for modern city receptions", "Soft rustic tiers with fresh flowers.", "94770244455", "cake", ["cake", "florist", "venue"], ["modern", "reception"], ["Colombo"], false, false, 5, 80, 4.78, 10, ["Semi-naked", "Fresh florals"], "@naked.tier", [
          { kind: "options", key: "cakeStyles", optionKeys: ["naked", "buttercream", "cupcakes"] },
          { kind: "options", key: "dietary", optionKeys: ["eggless", "gluten_free"] },
        ], [pkg("Semi-naked three tier", "ADVANCED", "FROM", 40000, ["3 tiers", "Florals"], ["Fondant"], ["WEDDING"], "Modern look", 1)]),
        bp("cupcake-kantha", "Cupcake Kantha", "cupcakekantha@ceylonweddings.com", "Colombo", "Colombo", 32000, 50000, "Cupcake towers for kids' tables and casual receptions", "Mixed flavour towers with eggless options.", "94770255566", "cake", ["cake", "food", "dance"], ["reception"], ["Colombo", "Gampaha"], false, false, 8, 140, 4.65, 16, ["Tower stand", "Mixed flavours"], "@cupcake.kantha", [
          { kind: "options", key: "cakeStyles", optionKeys: ["cupcakes", "buttercream"] },
          { kind: "options", key: "dietary", optionKeys: ["eggless", "nut_free"] },
        ], [pkg("Cupcake tower", "BASIC", "FROM", 32000, ["60 cupcakes", "Stand"], ["Cutting cake"], ["WEDDING"], "Casual reception", 1)]),
      ],
    },
    {
      typeId: "vt_PLANNER",
      slug: "PLANNER",
      definitions: [
        {
          typeId: "vt_PLANNER",
          key: "plannerServices",
          valueType: "MULTISELECT",
          layout: "GRID",
          question: "Which planning services do you offer?",
          filterLabel: "Services",
          required: true,
          filterable: true,
          filterHighlight: true,
          filterSortOrder: 0,
          collectOnboard: true,
          sortOrder: 0,
          options: [
            { key: "full_planning", label: "Full planning" },
            { key: "day_of", label: "Day-of coordination" },
            { key: "partial", label: "Partial planning" },
            { key: "destination", label: "Destination / diaspora" },
            { key: "vendor_sourcing", label: "Vendor sourcing" },
            { key: "budget", label: "Budget management" },
          ],
        },
        {
          typeId: "vt_PLANNER",
          key: "ceremonyExpertise",
          valueType: "MULTISELECT",
          layout: "GRID",
          question: "Which ceremony types do you specialize in?",
          filterLabel: "Ceremony expertise",
          required: true,
          filterable: true,
          filterHighlight: true,
          filterSortOrder: 1,
          collectOnboard: true,
          sortOrder: 1,
          options: [
            { key: "kandyan", label: "Kandyan / poruwa" },
            { key: "church", label: "Church" },
            { key: "hindu", label: "Hindu" },
            { key: "muslim", label: "Muslim / nikah" },
            { key: "homecoming", label: "Homecoming" },
          ],
        },
      ],
      vendors: [
        bp("ceylon-day-of", "Ceylon Day Of", "ceylondayof@ceylonweddings.com", "Colombo", "Colombo", 150000, 280000, "Day coordinators for local and destination weddings", "Works with diaspora families on WhatsApp-first timelines.", "94777893210", "venue", ["venue", "photo", "garden", "dance"], ["destination", "kandyan", "muslim", "hindu"], ["Colombo", "Galle", "Kandy"], true, true, 11, 210, 4.88, 26, ["Run-of-show", "Vendor chase"], "@ceylon.dayof", [
          { kind: "options", key: "plannerServices", optionKeys: ["day_of", "destination", "vendor_sourcing"] },
          { kind: "options", key: "ceremonyExpertise", optionKeys: ["kandyan", "hindu", "muslim", "homecoming"] },
        ], [pkg("Day-of coordination", "BASIC", "FROM", 150000, ["Timeline", "On-day team"], ["Full design"], ["WEDDING"], "Most couples", 12, "POPULAR")]),
        bp("poruwa-plan-studio", "Poruwa Plan Studio", "poruwaplan@ceylonweddings.com", "Kandy", "Kandy", 180000, 320000, "Full planning for Kandyan weekends and dual-city timelines", "Nekath-aware planners for Colombo + Kandy splits.", "94770266677", "venue", ["venue", "dance", "florist"], ["kandyan", "poruwa", "homecoming"], ["Kandy", "Colombo"], true, false, 13, 160, 4.9, 19, ["Full plan", "Family briefings"], "@poruwa.plan", [
          { kind: "options", key: "plannerServices", optionKeys: ["full_planning", "budget", "vendor_sourcing"] },
          { kind: "options", key: "ceremonyExpertise", optionKeys: ["kandyan", "homecoming"] },
        ], [pkg("Full Kandyan plan", "DREAM", "FROM", 180000, ["Full planning", "Budget"], ["Decor design only"], ["WEDDING", "HOMECOMING"], "Dual-city", 90)]),
        bp("fort-week-planners", "Fort Week Planners", "fortweek@ceylonweddings.com", "Galle", "Galle", 200000, 360000, "Destination week planning for fort and beach celebrations", "Vendor maps for Galle, Bentota, and Unawatuna.", "94770277788", "beach", ["beach", "venue", "photo"], ["destination", "hindu", "western"], ["Galle", "Bentota"], false, true, 8, 95, 4.85, 12, ["Destination plan", "Guest logistics"], "@fort.week", [
          { kind: "options", key: "plannerServices", optionKeys: ["full_planning", "destination", "vendor_sourcing"] },
          { kind: "options", key: "ceremonyExpertise", optionKeys: ["hindu", "church", "homecoming"] },
        ], [pkg("Destination week", "ADVANCED", "FROM", 200000, ["Week plan", "Vendors"], ["Day-of only"], ["DESTINATION", "WEDDING"], "South coast weeks", 60, "BEST_VALUE")]),
        bp("nikah-note-planners", "Nikah Note Planners", "nikahnote@ceylonweddings.com", "Colombo", "Colombo", 140000, 250000, "Nikah and walima coordination with prayer-aware venues", "Halal venue briefs and discreet timelines.", "94770288899", "venue", ["venue", "food", "photo"], ["muslim", "walima"], ["Colombo"], false, false, 7, 110, 4.87, 14, ["Nikah timeline", "Walima floor plan"], "@nikah.note", [
          { kind: "options", key: "plannerServices", optionKeys: ["partial", "day_of", "vendor_sourcing"] },
          { kind: "options", key: "ceremonyExpertise", optionKeys: ["muslim"] },
        ], [pkg("Nikah + walima day", "BASIC", "FROM", 140000, ["Two-event timeline"], ["Full decor"], ["WEDDING"], "Muslim celebrations", 14)]),
        bp("checklist-collective", "Checklist Collective", "checklistco@ceylonweddings.com", "Colombo", "Colombo", 90000, 160000, "Partial planning and budget coaching for DIY couples", "WhatsApp checklists, vendor shortlists, and plate math.", "94770299900", "invite", ["invite", "venue", "photo"], ["modern", "diy"], ["Colombo", "Online"], false, true, 5, 220, 4.7, 31, ["Budget sheet", "Vendor shortlist"], "@checklist.co", [
          { kind: "options", key: "plannerServices", optionKeys: ["partial", "budget", "vendor_sourcing"] },
          { kind: "options", key: "ceremonyExpertise", optionKeys: ["kandyan", "church", "hindu", "muslim", "homecoming"] },
        ], [pkg("Partial planning", "BASIC", "FROM", 90000, ["8 weeks support"], ["On-day team"], ["WEDDING"], "DIY couples", 40)]),
      ],
    },
  ];

  async function upsertListing(data: Prisma.VendorUncheckedCreateInput & { slug: string }) {
    const vendor = await prisma.vendor.upsert({
      where: { slug: data.slug },
      create: data,
      update: data,
    });
    bySlug[vendor.slug] = vendor;
    return vendor;
  }

  for (const pack of packs) {
    const defIds = new Map<string, string>();
    for (const definition of pack.definitions) {
      const row = await upsertAttributeDefinition(definition);
      defIds.set(definition.key, row.id);
    }

    for (const vendor of pack.vendors) {
      const user = await upsertVendorUser(vendor.email, vendor.name);
      const cover = PHOTO[vendor.photoKey] ?? PHOTO.photo;
      const photos = pickPhotos(PHOTO, vendor.galleryKeys, cover);

      const row = await upsertListing({
        userId: user.id,
        name: vendor.name,
        slug: vendor.slug,
        categoryId: pack.typeId,
        city: vendor.city,
        district: vendor.district,
        startingPriceLkr: vendor.startingPriceLkr,
        priceDisplayMode: "FROM",
        typicalSpendLkr: vendor.typicalSpendLkr,
        offerHeadline: vendor.offerHeadline,
        description: vendor.description,
        whatsapp: vendor.whatsapp,
        photoUrl: cover,
        photos,
        yearsExperience: vendor.yearsExperience,
        couplesServed: vendor.couplesServed,
        ratingAvg: vendor.ratingAvg,
        ratingCount: vendor.ratingCount,
        verified: true,
        featured: vendor.featured ?? false,
        moderationStatus: "APPROVED",
        onboardingCompletedAt: new Date(),
        styles: vendor.styles,
        destinationExperienced: vendor.destinationExperienced ?? false,
        serviceAreas: vendor.serviceAreas,
        includedInPrice: vendor.includedInPrice,
        travelNote: vendor.travelNote ?? null,
        overtimeNote: vendor.overtimeNote ?? null,
        instagram: vendor.instagram,
        faqs: vendor.faqs,
      });

      for (const answer of vendor.answers) {
        const definitionId = defIds.get(answer.key);
        if (!definitionId) continue;
        if (answer.kind === "options") {
          await setVendorOptionSelections(row.id, definitionId, answer.optionKeys);
        } else if (answer.kind === "boolean") {
          await setBoolean(row.id, definitionId, answer.value);
        } else if (answer.kind === "range") {
          await setRange(row.id, definitionId, answer.min, answer.max);
        }
      }

      const existingPackages = await prisma.vendorPackage.count({ where: { vendorId: row.id } });
      if (existingPackages === 0 && vendor.packages.length) {
        await prisma.vendorPackage.createMany({
          data: vendor.packages.map((item, index) => ({
            vendorId: row.id,
            name: item.name,
            tier: item.tier ?? null,
            pricingMode: item.pricingMode,
            priceLkr: item.priceLkr,
            priceMaxLkr: item.priceMaxLkr ?? null,
            status: "PUBLISHED",
            sortOrder: index,
            badge: item.badge ?? null,
            inclusions: item.inclusions,
            exclusions: item.exclusions,
            eventTypes: item.eventTypes,
            durationHours: item.durationHours ?? null,
            guestMin: item.guestMin ?? null,
            guestMax: item.guestMax ?? null,
            photoUrls: [cover],
            bestFor: item.bestFor,
            description: item.description,
          })),
        });
      }

      const mediaCount = await prisma.vendorMediaProject.count({ where: { vendorId: row.id } });
      if (mediaCount === 0) {
        await prisma.vendorMediaProject.create({
          data: {
            vendorId: row.id,
            title: "Signature work",
            description: `Seed gallery for ${vendor.name}.`,
            coverUrl: cover,
            sortOrder: 0,
            items: {
              create: photos.slice(0, 5).map((url, sortOrder) => ({ url, sortOrder })),
            },
          },
        });
      }

      const reviewExists = await prisma.review.findFirst({
        where: { vendorId: row.id, authorName: "Ceylon Seed Reviewer" },
      });
      if (!reviewExists) {
        await prisma.review.create({
          data: {
            vendorId: row.id,
            authorName: "Ceylon Seed Reviewer",
            rating: Math.min(5, vendor.ratingAvg),
            quality: 4.9,
            professionalism: 4.9,
            flexibility: 4.8,
            responseTime: 4.8,
            value: 4.7,
            communication: 4.9,
            body: `${vendor.name} delivered a clear WhatsApp brief and showed up on time for our ${vendor.city} celebration.`,
            recommended: true,
          },
        });
      }

      await prisma.vendorSubscription.upsert({
        where: { vendorId: row.id },
        create: {
          vendorId: row.id,
          status: "TRIAL",
          trialEndsAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        },
        update: {
          status: "TRIAL",
          trialEndsAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  // Polish any leftover listings from the base seed (approve + trial)
  const leftovers = await prisma.vendor.findMany({
    where: { slug: { notIn: Object.keys(bySlug) } },
  });
  for (const vendor of leftovers) {
    bySlug[vendor.slug] = vendor;
    await prisma.vendor.update({
      where: { id: vendor.id },
      data: {
        moderationStatus: "APPROVED",
        verified: true,
        onboardingCompletedAt: vendor.onboardingCompletedAt ?? new Date(),
      },
    });
    await prisma.vendorSubscription.upsert({
      where: { vendorId: vendor.id },
      create: {
        vendorId: vendor.id,
        status: "TRIAL",
        trialEndsAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
      update: { status: "TRIAL" },
    });
  }

  const vendorCount = await prisma.vendor.count();
  const attrValueCount = await prisma.vendorAttributeValue.count();
  const packageCount = await prisma.vendorPackage.count();
  const defCount = await prisma.vendorAttributeDefinition.count();

  return { vendorCount, attrValueCount, packageCount, defCount, bySlug };
}

function bp(
  slug: string,
  name: string,
  email: string,
  city: string,
  district: string,
  startingPriceLkr: number,
  typicalSpendLkr: number,
  offerHeadline: string,
  description: string,
  whatsapp: string,
  photoKey: keyof PhotoBank,
  galleryKeys: Array<keyof PhotoBank>,
  styles: string[],
  serviceAreas: string[],
  featured: boolean,
  destinationExperienced: boolean,
  yearsExperience: number,
  couplesServed: number,
  ratingAvg: number,
  ratingCount: number,
  includedInPrice: string[],
  instagram: string,
  answers: AttrAnswer[],
  packages: VendorBlueprint["packages"],
): VendorBlueprint {
  return {
    slug,
    name,
    email,
    city,
    district,
    startingPriceLkr,
    typicalSpendLkr,
    offerHeadline,
    description,
    whatsapp,
    photoKey,
    galleryKeys,
    styles,
    serviceAreas,
    featured,
    destinationExperienced,
    yearsExperience,
    couplesServed,
    ratingAvg,
    ratingCount,
    includedInPrice,
    instagram,
    faqs: [
      {
        question: "How should we inquire?",
        answer: "WhatsApp your date, guest count, and ceremony type — we reply with availability and a package sheet.",
      },
      {
        question: "Do you work with diaspora families?",
        answer: destinationExperienced
          ? "Yes — we brief over WhatsApp across time zones and confirm logistics before you fly in."
          : "We primarily serve local celebrations; destination travel is quoted case by case.",
      },
    ],
    answers,
    packages,
  };
}

function pkg(
  name: string,
  tier: "BASIC" | "ADVANCED" | "DREAM",
  pricingMode: "FIXED" | "FROM" | "RANGE" | "PER_GUEST" | "ON_REQUEST",
  priceLkr: number,
  inclusions: string[],
  exclusions: string[],
  eventTypes: VendorBlueprint["packages"][number]["eventTypes"],
  bestFor: string,
  durationHours?: number,
  badge: "POPULAR" | "BEST_VALUE" | "LIMITED" | null = null,
  guestMin?: number,
  guestMax?: number,
): VendorBlueprint["packages"][number] {
  return {
    name,
    tier,
    pricingMode,
    priceLkr,
    inclusions,
    exclusions,
    eventTypes,
    bestFor,
    description: `${name} — seeded package for marketplace demos.`,
    durationHours,
    badge,
    guestMin,
    guestMax,
  };
}
