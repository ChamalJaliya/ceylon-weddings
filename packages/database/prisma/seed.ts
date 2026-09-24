import { config } from "dotenv";
import { resolve } from "node:path";
// @ts-ignore
import { hash } from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "../src/generated/prisma/client";
import { enrichRichCatalog } from "./seed-rich-catalog";

config({ path: resolve(__dirname, "../../../.env") });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const PHOTO = {
  venue: "https://images.unsplash.com/photo-1519167758481-83f29da8c12f?w=1200&q=80",
  garden: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1200&q=80",
  photo: "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80",
  bridal: "https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=1200&q=80",
  jewellery: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200&q=80",
  makeup: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=1200&q=80",
  florist: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=1200&q=80",
  cake: "https://images.unsplash.com/photo-1535254973040-607b474d7f5a?w=1200&q=80",
  food: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80",
  dance: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200&q=80",
  car: "https://images.unsplash.com/photo-1485291571150-772bcfc10da5?w=1200&q=80",
  invite: "https://images.unsplash.com/photo-1464349095431-bbdf92e608d0?w=1200&q=80",
  mehndi: "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=1200&q=80",
  beach: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200&q=80",
};

type VendorSeed = Omit<Prisma.VendorUncheckedCreateInput, "userId"> & {
  user?: { connect: { id: string } };
};

const en = (value: string) => ({ en: value });

type AttrOptionSeed = {
  key: string;
  label: string;
  helpText?: string;
};

type AttrDefinitionSeed = {
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
  options?: AttrOptionSeed[];
};

async function upsertAttributeDefinition(def: AttrDefinitionSeed) {
  const definition = await prisma.vendorAttributeDefinition.upsert({
    where: { typeId_key: { typeId: def.typeId, key: def.key } },
    create: {
      typeId: def.typeId,
      key: def.key,
      valueType: def.valueType,
      layout: def.layout,
      question: en(def.question),
      filterLabel: def.filterLabel ? en(def.filterLabel) : undefined,
      instruction: def.instruction ? en(def.instruction) : undefined,
      helpText: def.helpText ? en(def.helpText) : undefined,
      required: def.required ?? false,
      filterable: def.filterable ?? true,
      filterHighlight: def.filterHighlight ?? false,
      filterSortOrder: def.filterSortOrder ?? 0,
      showOnProfile: def.showOnProfile ?? true,
      collectOnboard: def.collectOnboard ?? false,
      unit: def.unit,
      minValue: def.minValue,
      maxValue: def.maxValue,
      sortOrder: def.sortOrder ?? 0,
      status: "ACTIVE",
    },
    update: {
      valueType: def.valueType,
      layout: def.layout,
      question: en(def.question),
      filterLabel: def.filterLabel ? en(def.filterLabel) : Prisma.DbNull,
      instruction: def.instruction ? en(def.instruction) : Prisma.DbNull,
      helpText: def.helpText ? en(def.helpText) : Prisma.DbNull,
      required: def.required ?? false,
      filterable: def.filterable ?? true,
      filterHighlight: def.filterHighlight ?? false,
      filterSortOrder: def.filterSortOrder ?? 0,
      showOnProfile: def.showOnProfile ?? true,
      collectOnboard: def.collectOnboard ?? false,
      unit: def.unit ?? null,
      minValue: def.minValue ?? null,
      maxValue: def.maxValue ?? null,
      sortOrder: def.sortOrder ?? 0,
      status: "ACTIVE",
    },
  });

  if (def.options?.length) {
    for (const [index, option] of def.options.entries()) {
      await prisma.vendorAttributeOption.upsert({
        where: { definitionId_key: { definitionId: definition.id, key: option.key } },
        create: {
          definitionId: definition.id,
          key: option.key,
          label: en(option.label),
          helpText: option.helpText ? en(option.helpText) : undefined,
          sortOrder: index,
          active: true,
        },
        update: {
          label: en(option.label),
          helpText: option.helpText ? en(option.helpText) : Prisma.DbNull,
          sortOrder: index,
          active: true,
        },
      });
    }
  }

  return definition;
}

async function setVendorOptionSelections(
  vendorId: string,
  definitionId: string,
  optionKeys: string[],
) {
  const value = await prisma.vendorAttributeValue.upsert({
    where: { vendorId_definitionId: { vendorId, definitionId } },
    create: { vendorId, definitionId },
    update: {},
  });

  await prisma.vendorAttributeSelection.deleteMany({ where: { valueId: value.id } });

  const options = await prisma.vendorAttributeOption.findMany({
    where: { definitionId, key: { in: optionKeys }, active: true },
  });

  if (options.length) {
    await prisma.vendorAttributeSelection.createMany({
      data: options.map((option) => ({
        vendorId,
        valueId: value.id,
        optionId: option.id,
      })),
    });
  }

  return value;
}

async function upsertUser(
  email: string,
  name: string,
  role: "COUPLE" | "VENDOR" | "ADMIN" | "FAMILY",
  passwordHash: string,
) {
  return prisma.user.upsert({
    where: { email },
    update: {
      name,
      role,
      ...(role === "ADMIN"
        ? {
            capabilities: [
              "MANAGE_VENDORS",
              "MANAGE_USERS",
              "MANAGE_CONTENT",
              "MANAGE_REPORTS",
              "MANAGE_FEATURED",
              "VIEW_AUDIT",
              "IMPERSONATE",
              "MANAGE_SETTINGS",
            ],
          }
        : {}),
    },
    create: {
      email,
      name,
      role,
      passwordHash,
      ...(role === "ADMIN"
        ? {
            capabilities: [
              "MANAGE_VENDORS",
              "MANAGE_USERS",
              "MANAGE_CONTENT",
              "MANAGE_REPORTS",
              "MANAGE_FEATURED",
              "VIEW_AUDIT",
              "IMPERSONATE",
              "MANAGE_SETTINGS",
            ],
          }
        : {}),
    },
  });
}

async function main() {
  const passwordHash = await hash("Password123!", 12);

  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "PaymentIntent",
      "AwardNomination",
      "AnalyticsEvent",
      "FeatureFlag",
      "SiteConfig",
      "CmsPage",
      "FeaturedPlacement",
      "Promotion",
      "Report",
      "AuditLog",
      "Review",
      "VendorPackage",
      "VendorAddOn",
      "VendorMediaItem",
      "VendorMediaProject",
      "VendorVideo",
      "VendorSubscription",
      "SubscriptionInvoice",
      "Appointment",
      "Article",
      "Inquiry",
      "WeddingVendor",
      "EventInvite",
      "GuestHousehold",
      "BudgetLine",
      "Task",
      "Event",
      "WeddingMember",
      "Wedding",
      "VendorAttributeSelection",
      "VendorAttributeValue",
      "VendorAttributeOption",
      "VendorAttributeDefinition",
      "Vendor"
    CASCADE
  `);

  const nimali = await upsertUser("couple@ceylonweddings.com", "Nimali Perera", "COUPLE", passwordHash);
  const amma = await upsertUser("family@ceylonweddings.com", "Amma Perera", "FAMILY", passwordHash);
  const kasun = await upsertUser("kasun@ceylonweddings.com", "Kasun Jayawardena", "COUPLE", passwordHash);
  const lotusUser = await upsertUser("vendor@ceylonweddings.com", "Lotus Photography", "VENDOR", passwordHash);
  await upsertUser("admin@ceylonweddings.com", "Platform Admin", "ADMIN", passwordHash);
  const aisha = await upsertUser("aisha@ceylonweddings.com", "Aisha Rahman", "COUPLE", passwordHash);
  const priya = await upsertUser("priya@ceylonweddings.com", "Priya Sharma", "COUPLE", passwordHash);

  const vendorUsers = {
    glen: await upsertUser("glen@ceylonweddings.com", "Glen Receptions", "VENDOR", passwordHash),
    kandyHills: await upsertUser("kandyhills@ceylonweddings.com", "Kandy Hills Estate", "VENDOR", passwordHash),
    osariya: await upsertUser("osariya@ceylonweddings.com", "Ransilu Bridal", "VENDOR", passwordHash),
    jeweller: await upsertUser("jewels@ceylonweddings.com", "Maliban Jewellers", "VENDOR", passwordHash),
    glam: await upsertUser("glam@ceylonweddings.com", "Glam by Nadeesha", "VENDOR", passwordHash),
    dresser: await upsertUser("dresser@ceylonweddings.com", "Kandyan Bridal Dresser", "VENDOR", passwordHash),
    blooms: await upsertUser("blooms@ceylonweddings.com", "Temple Blooms", "VENDOR", passwordHash),
    saffron: await upsertUser("saffron@ceylonweddings.com", "Saffron Kitchen", "VENDOR", passwordHash),
    cake: await upsertUser("cake@ceylonweddings.com", "Butter and Bloom", "VENDOR", passwordHash),
    magul: await upsertUser("magulbera@ceylonweddings.com", "Magul Bera Collective", "VENDOR", passwordHash),
    poruwa: await upsertUser("poruwa@ceylonweddings.com", "Ashtaka Poruwa Craft", "VENDOR", passwordHash),
    nekath: await upsertUser("nekath@ceylonweddings.com", "Pandith Nekath", "VENDOR", passwordHash),
  };

  const listings: VendorSeed[] = [
    {
      user: { connect: { id: lotusUser.id } },
      name: "Lotus Photography",
      slug: "lotus-photography",
      categoryId: "vt_PHOTO_VIDEO",
      onboardingCompletedAt: new Date(),
      city: "Colombo",
      district: "Colombo",
      startingPriceLkr: 280000,
      whatsapp: "94771234567",
      description: "Documentary wedding films across Colombo, Kandy, and the south coast.",
      photoUrl: PHOTO.photo,
      verified: true,
      featured: true,
      styles: ["poruwa", "church", "destination"],
      destinationExperienced: true,
    },
    {
      user: { connect: { id: vendorUsers.glen.id } },
      name: "Glen Receptions",
      slug: "glen-receptions",
      categoryId: "vt_VENUE",
      onboardingCompletedAt: new Date(),
      city: "Negombo",
      district: "Gampaha",
      startingPriceLkr: 850000,
      whatsapp: "94772345678",
      description: "Garden hall for 200–400 guests with in-house catering.",
      photoUrl: PHOTO.garden,
      verified: true,
      featured: true,
      styles: ["poruwa", "reception"],
    },
    {
      user: { connect: { id: vendorUsers.kandyHills.id } },
      name: "Kandy Hills Estate",
      slug: "kandy-hills-estate",
      categoryId: "vt_VENUE",
      onboardingCompletedAt: new Date(),
      city: "Kandy",
      district: "Kandy",
      startingPriceLkr: 1200000,
      whatsapp: "94773456789",
      description: "Hill-country lawn and pavilion for Kandyan homecomings.",
      photoUrl: PHOTO.venue,
      verified: true,
      featured: true,
      styles: ["homecoming", "poruwa"],
      destinationExperienced: true,
    },
    {
      name: "Fort Lawn Galle",
      slug: "fort-lawn-galle",
      categoryId: "vt_VENUE",
      onboardingCompletedAt: new Date(),
      city: "Galle",
      district: "Galle",
      startingPriceLkr: 1800000,
      whatsapp: "94774567890",
      description: "Destination garden beside the fort walls. English and Sinhala coordinators.",
      photoUrl: PHOTO.beach,
      verified: true,
      featured: true,
      styles: ["destination", "hindu", "western"],
      destinationExperienced: true,
    },
    {
      user: { connect: { id: vendorUsers.osariya.id } },
      name: "Ransilu Bridal",
      slug: "ransilu-bridal",
      categoryId: "vt_BRIDAL_WEAR",
      onboardingCompletedAt: new Date(),
      city: "Colombo",
      district: "Colombo",
      startingPriceLkr: 185000,
      whatsapp: "94775678901",
      description: "Osariya, Kandyan jackets, and western gowns for hire or purchase.",
      photoUrl: PHOTO.bridal,
      verified: true,
      styles: ["kandyan", "western"],
    },
    {
      user: { connect: { id: vendorUsers.jeweller.id } },
      name: "Maliban Jewellers Hire",
      slug: "maliban-jewellers",
      categoryId: "vt_JEWELLERY",
      onboardingCompletedAt: new Date(),
      city: "Colombo",
      district: "Colombo",
      startingPriceLkr: 45000,
      whatsapp: "94776789012",
      description: "Bridal jewellery hire: necklaces, thaali, and nilame accessories.",
      photoUrl: PHOTO.jewellery,
      verified: true,
      styles: ["kandyan", "hindu"],
    },
    {
      user: { connect: { id: vendorUsers.glam.id } },
      name: "Glam by Nadeesha",
      slug: "glam-by-nadeesha",
      categoryId: "vt_HAIR_MAKEUP",
      onboardingCompletedAt: new Date(),
      city: "Colombo",
      district: "Colombo",
      startingPriceLkr: 65000,
      whatsapp: "94777890123",
      description: "Bridal makeup for osariya, church, and destination looks.",
      photoUrl: PHOTO.makeup,
      verified: true,
      featured: true,
      styles: ["poruwa", "church", "destination"],
      destinationExperienced: true,
    },
    {
      user: { connect: { id: vendorUsers.dresser.id } },
      name: "Kandyan Bridal Dresser",
      slug: "kandyan-bridal-dresser",
      categoryId: "vt_BRIDAL_DRESSER",
      onboardingCompletedAt: new Date(),
      city: "Kandy",
      district: "Kandy",
      startingPriceLkr: 55000,
      whatsapp: "94778901234",
      description: "Traditional Kandyan dressing, jewellery placement, and bridesmaid support.",
      photoUrl: PHOTO.bridal,
      verified: true,
      styles: ["kandyan", "poruwa"],
    },
    {
      user: { connect: { id: vendorUsers.blooms.id } },
      name: "Temple Blooms",
      slug: "temple-blooms",
      categoryId: "vt_FLORIST_DECOR",
      onboardingCompletedAt: new Date(),
      city: "Colombo",
      district: "Colombo",
      startingPriceLkr: 180000,
      whatsapp: "94779012345",
      description: "Poruwa florals, hall draping, and jasmine for Hindu ceremonies.",
      photoUrl: PHOTO.florist,
      verified: true,
      styles: ["poruwa", "hindu", "reception"],
    },
    {
      user: { connect: { id: vendorUsers.saffron.id } },
      name: "Saffron Kitchen",
      slug: "saffron-kitchen",
      categoryId: "vt_CATERER",
      onboardingCompletedAt: new Date(),
      city: "Colombo",
      district: "Colombo",
      startingPriceLkr: 4200,
      whatsapp: "94770123456",
      description: "Per-plate catering. Halal kitchen, vegetarian and fish menus for 150–500 guests.",
      photoUrl: PHOTO.food,
      verified: true,
      featured: true,
      styles: ["halal", "vegetarian", "walima", "reception"],
    },
    {
      user: { connect: { id: vendorUsers.cake.id } },
      name: "Butter and Bloom Cakes",
      slug: "butter-and-bloom",
      categoryId: "vt_CAKE",
      onboardingCompletedAt: new Date(),
      city: "Colombo",
      district: "Colombo",
      startingPriceLkr: 45000,
      whatsapp: "94771239876",
      description: "Buttercream and traditional love-cake tiers for Sri Lankan receptions.",
      photoUrl: PHOTO.cake,
      verified: true,
      styles: ["reception", "homecoming"],
    },
    {
      user: { connect: { id: vendorUsers.magul.id } },
      name: "Magul Bera Collective",
      slug: "magul-bera-collective",
      categoryId: "vt_ENTERTAINMENT",
      onboardingCompletedAt: new Date(),
      city: "Kandy",
      district: "Kandy",
      startingPriceLkr: 95000,
      whatsapp: "94772348765",
      description: "Kandyan dancers, magul bera, jayamangala gatha, and nadaswaram ensembles.",
      photoUrl: PHOTO.dance,
      verified: true,
      featured: true,
      styles: ["kandyan", "poruwa", "hindu"],
    },
    {
      user: { connect: { id: vendorUsers.poruwa.id } },
      name: "Ashtaka Poruwa Craft",
      slug: "ashtaka-poruwa-craft",
      categoryId: "vt_PORUWA",
      onboardingCompletedAt: new Date(),
      city: "Gampaha",
      district: "Gampaha",
      startingPriceLkr: 95000,
      whatsapp: "94773459876",
      description: "Poruwa construction, ashtaka recitation, and traditional ceremony direction.",
      photoUrl: PHOTO.garden,
      verified: true,
      styles: ["poruwa", "kandyan"],
    },
    {
      user: { connect: { id: vendorUsers.nekath.id } },
      name: "Pandith Nekath",
      slug: "pandith-nekath",
      categoryId: "vt_ASTROLOGY",
      onboardingCompletedAt: new Date(),
      city: "Kandy",
      district: "Kandy",
      startingPriceLkr: 15000,
      whatsapp: "94774560987",
      description: "Nekath timing, poruwa sequence, and printed muhurtha notes for families.",
      photoUrl: PHOTO.invite,
      verified: true,
      styles: ["kandyan", "hindu"],
    },
    {
      name: "Bridal Fleet Colombo",
      slug: "bridal-fleet-colombo",
      categoryId: "vt_WEDDING_CARS",
      onboardingCompletedAt: new Date(),
      city: "Colombo",
      district: "Colombo",
      startingPriceLkr: 35000,
      whatsapp: "94775671098",
      description: "Decorated vintage and luxury cars for Colombo and airport runs.",
      photoUrl: PHOTO.car,
      verified: true,
      styles: ["colombo", "destination"],
      destinationExperienced: true,
    },
    {
      name: "Magul Cards",
      slug: "magul-cards",
      categoryId: "vt_INVITATIONS",
      onboardingCompletedAt: new Date(),
      city: "Colombo",
      district: "Colombo",
      startingPriceLkr: 180,
      whatsapp: "94776782109",
      description: "Printed cards and WhatsApp e-invite packs in English, Sinhala, and Tamil.",
      photoUrl: PHOTO.invite,
      verified: true,
      styles: ["printed", "whatsapp"],
    },
    {
      name: "Ceylon Day Of",
      slug: "ceylon-day-of",
      categoryId: "vt_PLANNER",
      onboardingCompletedAt: new Date(),
      city: "Colombo",
      district: "Colombo",
      startingPriceLkr: 150000,
      whatsapp: "94777893210",
      description: "Day coordinators for local and destination weddings. Works with diaspora families.",
      photoUrl: PHOTO.venue,
      verified: true,
      featured: true,
      styles: ["destination", "kandyan", "muslim", "hindu"],
      destinationExperienced: true,
    },
    {
      name: "Marriage Registrar Network",
      slug: "marriage-registrar-network",
      categoryId: "vt_REGISTRAR",
      onboardingCompletedAt: new Date(),
      city: "Colombo",
      district: "Colombo",
      startingPriceLkr: 25000,
      whatsapp: "94778904321",
      description: "Civil, Kandyan, and Muslim marriage officers. Guidance on notice and special license.",
      photoUrl: PHOTO.invite,
      verified: true,
      styles: ["civil", "kandyan", "muslim"],
    },
    {
      name: "Henna by Aisha",
      slug: "henna-by-aisha",
      categoryId: "vt_MEHNDI",
      onboardingCompletedAt: new Date(),
      city: "Colombo",
      district: "Colombo",
      startingPriceLkr: 18000,
      whatsapp: "94779015432",
      description: "Bridal mehndi for Muslim, Hindu, and fusion celebrations.",
      photoUrl: PHOTO.mehndi,
      verified: true,
      styles: ["mehndi", "muslim", "hindu"],
    },
    {
      name: "Guest Coaches",
      slug: "guest-coaches",
      categoryId: "vt_TRANSPORT",
      onboardingCompletedAt: new Date(),
      city: "Negombo",
      district: "Gampaha",
      startingPriceLkr: 45000,
      whatsapp: "94770126543",
      description: "Airport and hotel coaches for overseas guests. Negombo, Colombo, Galle routes.",
      photoUrl: PHOTO.car,
      verified: true,
      styles: ["destination", "airport"],
      destinationExperienced: true,
    },
  ];

  const vendors = [];
  for (const listing of listings) {
    const { user, ...rest } = listing;
    const data: Prisma.VendorUncheckedCreateInput = {
      ...rest,
      ...(user ? { userId: user.connect.id } : {}),
    };
    vendors.push(
      await prisma.vendor.upsert({
        where: { slug: rest.slug as string },
        create: data,
        update: data,
      }),
    );
  }

  const bySlug = Object.fromEntries(vendors.map((vendor) => [vendor.slug, vendor]));

  const styleDef = await upsertAttributeDefinition({
    typeId: "vt_PHOTO_VIDEO",
    key: "style",
    valueType: "SELECT",
    layout: "CARDS",
    question: "What is your photography style?",
    filterLabel: "Style",
    required: true,
    filterable: true,
    filterHighlight: true,
    filterSortOrder: 0,
    collectOnboard: true,
    showOnProfile: true,
    sortOrder: 0,
    options: [
      { key: "classic", label: "Classic" },
      { key: "editorial", label: "Editorial" },
      { key: "fine_art", label: "Fine Art" },
      { key: "photojournalistic", label: "Photojournalistic" },
    ],
  });

  const formatsDef = await upsertAttributeDefinition({
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
    showOnProfile: true,
    sortOrder: 1,
    options: [
      { key: "digital", label: "Digital" },
      { key: "film", label: "Film" },
      {
        key: "hybrid",
        label: "Hybrid",
        helpText: "You combine digital and film coverage on the same wedding day.",
      },
    ],
  });

  const servicesDef = await upsertAttributeDefinition({
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
    showOnProfile: true,
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
  });

  await upsertAttributeDefinition({
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
    showOnProfile: true,
    unit: "guests",
    minValue: 50,
    maxValue: 1000,
    sortOrder: 0,
  });

  await upsertAttributeDefinition({
    typeId: "vt_VENUE",
    key: "outdoor",
    valueType: "BOOLEAN",
    layout: "TOGGLE",
    question: "Do you offer outdoor spaces?",
    filterLabel: "Outdoor",
    required: false,
    filterable: true,
    filterHighlight: false,
    filterSortOrder: 1,
    collectOnboard: true,
    showOnProfile: true,
    sortOrder: 1,
  });

  const lotusVendorId = bySlug["lotus-photography"].id;
  await setVendorOptionSelections(lotusVendorId, styleDef.id, ["editorial"]);
  await setVendorOptionSelections(lotusVendorId, formatsDef.id, ["digital", "film"]);
  await setVendorOptionSelections(lotusVendorId, servicesDef.id, ["drone", "engagement"]);

  const rich = await enrichRichCatalog({
    prisma,
    bySlug,
    photo: PHOTO,
    upsertAttributeDefinition,
    setVendorOptionSelections,
    passwordHash,
  });
  Object.assign(bySlug, rich.bySlug);

  const nimaliWedding = await prisma.wedding.create({
    data: {
      slug: "nimali-and-kasun",
      partnerOneName: "Nimali",
      partnerTwoName: "Kasun",
      date: new Date("2026-12-12T04:30:00.000Z"),
      city: "Colombo",
      district: "Colombo",
      guestCountEstimate: 320,
      budgetLkr: 2800000,
      payer: "BRIDE_FAMILY",
      types: ["KANDYAN_PORUWA", "HOMECOMING"],
      planningFromOverseas: true,
      style: "KANDYAN",
      styleNotes: "Osariya, nilame, and a garden poruwa — not a US rustic loft.",
      settingNotes: "Glen Receptions for the day; Kandy homecoming the next afternoon.",
      colors: ["#C4A574", "#F4E4D0", "#7A1F2B", "#1F4D3A", "#E8D5B5", "#F7F1E8"],
      onboardingCompletedAt: new Date(),
      websiteFaq: "Poruwa at 10:00. Reception follows at Glen Receptions. Dress code: formal, osariya, or nilame.",
      travelNotes: "Bandaranaike International Airport. Hotel block at Cinnamon Lakeside. Coaches leave at 8:00.",
      members: {
        create: [
          { userId: nimali.id, role: "COUPLE", canEditGuests: true, canViewBudget: true, canManageVendors: true },
          { userId: kasun.id, role: "COUPLE", canEditGuests: true, canViewBudget: true, canManageVendors: true },
          { userId: amma.id, role: "FAMILY", canEditGuests: true, canViewBudget: true, canManageVendors: false },
        ],
      },
    },
  });

  const poruwa = await prisma.event.create({
    data: {
      weddingId: nimaliWedding.id,
      kind: "PORUWA",
      name: "Poruwa ceremony",
      venueName: "Glen Receptions",
      nekathAt: new Date("2026-12-12T04:30:00.000Z"),
    },
  });
  const reception = await prisma.event.create({
    data: {
      weddingId: nimaliWedding.id,
      kind: "RECEPTION",
      name: "Reception",
      venueName: "Glen Receptions",
    },
  });
  await prisma.event.create({
    data: {
      weddingId: nimaliWedding.id,
      kind: "HOMECOMING",
      name: "Homecoming",
      venueName: "Jayawardena home, Kandy",
    },
  });

  await prisma.task.createMany({
    data: [
      { weddingId: nimaliWedding.id, title: "Confirm nekath with Pandith", category: "tradition", status: "DONE" },
      { weddingId: nimaliWedding.id, title: "Book poruwa and ashtaka", category: "tradition", status: "DOING" },
      { weddingId: nimaliWedding.id, title: "Lock catering plate count", category: "venue" },
      { weddingId: nimaliWedding.id, title: "Share guest list with Amma", category: "guests", assigneeUserId: amma.id },
      { weddingId: nimaliWedding.id, title: "Jayamangala gatha rehearsal", category: "tradition" },
      { weddingId: nimaliWedding.id, title: "Bridal dresser trial in Kandy", category: "beauty" },
      { weddingId: nimaliWedding.id, title: "Homecoming menu with Kasun's family", category: "homecoming", assigneeUserId: kasun.id },
      { weddingId: nimaliWedding.id, title: "Airport coaches for diaspora guests", category: "travel" },
      { weddingId: nimaliWedding.id, title: "Lock entertainment and music brief", category: "entertainment" },
    ],
  });

  await prisma.budgetLine.createMany({
    data: [
      { weddingId: nimaliWedding.id, category: "venue_catering", label: "Venue and catering", plannedLkr: 1400000, spentLkr: 400000, paidLkr: 250000, payer: "BRIDE_FAMILY", vendorId: bySlug["glen-receptions"].id },
      { weddingId: nimaliWedding.id, category: "photo_video", label: "Photography", plannedLkr: 280000, spentLkr: 100000, paidLkr: 100000, payer: "COUPLE", vendorId: bySlug["lotus-photography"].id },
      { weddingId: nimaliWedding.id, category: "attire", label: "Osariya, nilame, jewellery hire", plannedLkr: 420000, spentLkr: 80000, paidLkr: 40000, payer: "GROOM_FAMILY" },
      { weddingId: nimaliWedding.id, category: "decor", label: "Poruwa florals and hall draping", plannedLkr: 180000, spentLkr: 0, paidLkr: 0, payer: "BRIDE_FAMILY" },
      { weddingId: nimaliWedding.id, category: "entertainment", label: "Magul bera and dancers", plannedLkr: 95000, spentLkr: 0, paidLkr: 0, payer: "GROOM_FAMILY" },
      { weddingId: nimaliWedding.id, category: "beauty", label: "Makeup and dresser", plannedLkr: 120000, spentLkr: 20000, paidLkr: 20000, payer: "BRIDE_FAMILY" },
      { weddingId: nimaliWedding.id, category: "transport", label: "Cars and guest coaches", plannedLkr: 85000, spentLkr: 0, paidLkr: 0, payer: "COUPLE" },
      { weddingId: nimaliWedding.id, category: "buffer", label: "Buffer for last-minute plates", plannedLkr: 200000, spentLkr: 0, paidLkr: 0, payer: "COUPLE" },
    ],
  });

  const households: Prisma.GuestHouseholdCreateWithoutWeddingInput[] = [
    { label: "Perera parents", headName: "Mr and Mrs Sunil Perera", side: "BRIDE", plusCount: 4, status: "CONFIRMED", meal: "FISH", channel: "WHATSAPP" },
    { label: "Jayawardena parents", headName: "Mr and Mrs Jayawardena", side: "GROOM", plusCount: 4, status: "CONFIRMED", meal: "CHICKEN", channel: "PHONE" },
    { label: "Dias cousins Australia", headName: "Tharindu Dias", side: "GROOM", plusCount: 2, status: "INVITED", meal: "VEG", channel: "OVERSEAS" },
    { label: "Fernando uncle", headName: "Ravi Fernando", side: "BRIDE", plusCount: 3, status: "INVITED", meal: "FISH", channel: "WHATSAPP" },
    { label: "Silva aunties", headName: "Kumari Silva", side: "BRIDE", plusCount: 5, status: "CONSIDERING", meal: "VEG", channel: "PHONE" },
    { label: "Office team", headName: "Dialog colleagues", side: "BOTH", plusCount: 8, status: "INVITED", meal: "CHICKEN", channel: "WHATSAPP" },
    { label: "School friends", headName: "Visakha batch", side: "BRIDE", plusCount: 6, status: "CONFIRMED", meal: "FISH", channel: "WHATSAPP" },
    { label: "Royal batch", headName: "Kasun Royal friends", side: "GROOM", plusCount: 6, status: "MAYBE", meal: "CHICKEN", channel: "WHATSAPP" },
    { label: "UK cousins", headName: "Shanika Perera", side: "BRIDE", plusCount: 3, status: "INVITED", meal: "VEG", channel: "OVERSEAS" },
    { label: "Temple committee", headName: "Kelaniya dayaka", side: "BOTH", plusCount: 4, status: "CONFIRMED", meal: "VEG", channel: "PRINTED" },
    { label: "Photographer family", headName: "Lotus plus-ones", side: "BOTH", plusCount: 2, status: "WALK_IN", meal: "FISH", channel: "WHATSAPP" },
    { label: "Negombo neighbours", headName: "Fernando neighbours", side: "BRIDE", plusCount: 7, status: "CONSIDERING", meal: "FISH", channel: "PHONE" },
    { label: "Kandy relatives", headName: "Jayawardena uncles", side: "GROOM", plusCount: 9, status: "INVITED", meal: "CHICKEN", channel: "PHONE" },
    { label: "Canada family", headName: "Nadeeka Jayawardena", side: "GROOM", plusCount: 2, status: "CONFIRMED", meal: "VEG", channel: "OVERSEAS" },
    { label: "Makeup artist plus", headName: "Nadeesha team", side: "BRIDE", plusCount: 1, status: "CONFIRMED", meal: "VEG", channel: "WHATSAPP" },
    { label: "Hall staff buffer", headName: "Last-minute family buffer", side: "BOTH", plusCount: 12, status: "CONSIDERING", meal: "CHICKEN", channel: "PHONE" },
    { label: "Priest and ashtaka", headName: "Ashtaka team", side: "BOTH", plusCount: 3, status: "CONFIRMED", meal: "VEG", channel: "WHATSAPP" },
    { label: "Childhood neighbours", headName: "Dehiwala lane", side: "BRIDE", plusCount: 5, status: "DECLINED", meal: "FISH", channel: "PRINTED" },
    { label: "Bank colleagues", headName: "Kasun office", side: "GROOM", plusCount: 4, status: "INVITED", meal: "BEEF", channel: "WHATSAPP" },
    { label: "Homecoming only", headName: "Kandy village friends", side: "GROOM", plusCount: 10, status: "INVITED", meal: "CHICKEN", channel: "PHONE" },
  ];

  for (const household of households) {
    const created = await prisma.guestHousehold.create({
      data: { ...household, weddingId: nimaliWedding.id },
    });
    const eventId = household.label === "Homecoming only" ? undefined : poruwa.id;
    if (eventId) {
      await prisma.eventInvite.create({
        data: { householdId: created.id, eventId, status: created.status },
      });
    }
    if (household.label !== "Homecoming only" && household.status !== "DECLINED") {
      await prisma.eventInvite.create({
        data: { householdId: created.id, eventId: reception.id, status: created.status },
      });
    }
  }

  await prisma.inviteTemplate.createMany({
    data: [
      {
        weddingId: nimaliWedding.id,
        name: "Formal English",
        locale: "en",
        channel: "WHATSAPP",
        isDefault: true,
        body: "Ayubowan {{guestName}}! You are warmly invited to celebrate {{partnerOne}} & {{partnerTwo}}. {{eventName}} — {{date}} at {{venue}}. Please RSVP: {{rsvpUrl}}",
      },
      {
        weddingId: nimaliWedding.id,
        name: "Warm Sinhala",
        locale: "si",
        channel: "WHATSAPP",
        body: "ආයුබෝවන් {{guestName}}! {{partnerOne}} සහ {{partnerTwo}} ගේ මංගල උත්සවයට ඔබව ආරාධනා කරමු. {{eventName}} — {{date}}, {{venue}}. RSVP: {{rsvpUrl}}",
      },
      {
        weddingId: nimaliWedding.id,
        name: "Concise Tamil",
        locale: "ta",
        channel: "WHATSAPP",
        body: "வணக்கம் {{guestName}}! {{partnerOne}} & {{partnerTwo}} திருமணத்திற்கு அழைக்கிறோம். {{eventName}} — {{date}}, {{venue}}. RSVP: {{rsvpUrl}}",
      },
      {
        weddingId: nimaliWedding.id,
        name: "Overseas English",
        locale: "en",
        channel: "WHATSAPP",
        body: "Hi {{guestName}} — {{partnerOne}} & {{partnerTwo}} would love you at {{eventName}} on {{date}} ({{venue}}). Travel notes + RSVP: {{rsvpUrl}}",
      },
    ],
  });

  const nekathAnchor = poruwa.nekathAt ?? poruwa.startsAt ?? new Date("2026-12-12T04:30:00.000Z");
  const agendaSeed = [
    { title: "Bridal dresser arrives", kind: "DAY_OF" as const, offsetMinutes: -180, durationMinutes: 90, color: "#C4A574", ownerLabel: "Bridal dresser" },
    { title: "Wedding cars ready", kind: "DAY_OF" as const, offsetMinutes: -90, durationMinutes: 45, color: "#1F4B73", ownerLabel: "Transport" },
    { title: `${poruwa.name} ceremony`, kind: "CEREMONY" as const, offsetMinutes: 0, durationMinutes: 75, color: "#7A1F2B", ownerLabel: "Couple" },
    { title: "Guest plates / seating", kind: "DAY_OF" as const, offsetMinutes: 90, durationMinutes: 120, color: "#1F4D3A", ownerLabel: "Amma / hosts" },
  ];
  for (const [index, spec] of agendaSeed.entries()) {
    const startsAt = new Date(nekathAnchor.getTime() + spec.offsetMinutes * 60_000);
    const endsAt = new Date(startsAt.getTime() + spec.durationMinutes * 60_000);
    await prisma.appointment.create({
      data: {
        weddingId: nimaliWedding.id,
        eventId: poruwa.id,
        title: spec.title,
        kind: spec.kind,
        startsAt,
        endsAt,
        venueName: poruwa.venueName,
        color: spec.color,
        sortOrder: index,
        ownerLabel: spec.ownerLabel,
        reminderMinutes: 30,
      },
    });
  }

  const seedHouseholds = await prisma.guestHousehold.findMany({
    where: { weddingId: nimaliWedding.id },
    orderBy: { label: "asc" },
    take: 12,
  });
  await prisma.seatingPlan.create({
    data: {
      weddingId: nimaliWedding.id,
      eventId: reception.id,
      notes: "Reception tables — demo board",
      tables: {
        create: [
          {
            name: "Table 1 — Family",
            capacity: 10,
            sortOrder: 0,
            assignments: {
              create: seedHouseholds.slice(0, 2).map((h) => ({
                householdId: h.id,
                seatsUsed: 1 + h.plusCount,
              })),
            },
          },
          {
            name: "Table 2 — Friends",
            capacity: 10,
            sortOrder: 1,
            assignments: {
              create: seedHouseholds.slice(2, 4).map((h) => ({
                householdId: h.id,
                seatsUsed: 1 + h.plusCount,
              })),
            },
          },
          {
            name: "Table 3 — Overseas",
            capacity: 8,
            sortOrder: 2,
            assignments: {
              create: seedHouseholds.slice(4, 5).map((h) => ({
                householdId: h.id,
                seatsUsed: 1 + h.plusCount,
              })),
            },
          },
        ],
      },
    },
  });

  const pereraParents = await prisma.guestHousehold.findFirst({
    where: { weddingId: nimaliWedding.id, label: "Perera parents" },
  });
  const jayawardenaParents = await prisma.guestHousehold.findFirst({
    where: { weddingId: nimaliWedding.id, label: "Jayawardena parents" },
  });
  const ammaPerson = await prisma.familyPerson.create({
    data: {
      weddingId: nimaliWedding.id,
      name: "Amma Perera",
      side: "BRIDE",
      relation: "MOTHER",
      phone: "+94771110001",
      notes: "Runs guest list and plates",
      householdId: pereraParents?.id,
      sortOrder: 0,
    },
  });
  await prisma.familyPerson.create({
    data: {
      weddingId: nimaliWedding.id,
      name: "Thaththa Perera",
      side: "BRIDE",
      relation: "FATHER",
      householdId: pereraParents?.id,
      sortOrder: 1,
    },
  });
  await prisma.familyPerson.create({
    data: {
      weddingId: nimaliWedding.id,
      name: "Kumari Silva",
      side: "BRIDE",
      relation: "AUNT_UNCLE",
      parentId: ammaPerson.id,
      notes: "Amma’s sister — Silva aunties household",
      sortOrder: 2,
    },
  });
  const thaththaGroom = await prisma.familyPerson.create({
    data: {
      weddingId: nimaliWedding.id,
      name: "Mr Jayawardena",
      side: "GROOM",
      relation: "FATHER",
      householdId: jayawardenaParents?.id,
      sortOrder: 0,
    },
  });
  await prisma.familyPerson.create({
    data: {
      weddingId: nimaliWedding.id,
      name: "Mrs Jayawardena",
      side: "GROOM",
      relation: "MOTHER",
      householdId: jayawardenaParents?.id,
      sortOrder: 1,
    },
  });
  await prisma.familyPerson.create({
    data: {
      weddingId: nimaliWedding.id,
      name: "Tharindu Dias",
      side: "GROOM",
      relation: "COUSIN",
      parentId: thaththaGroom.id,
      notes: "Australia — overseas invite",
      sortOrder: 2,
    },
  });
  await prisma.familyPerson.create({
    data: {
      weddingId: nimaliWedding.id,
      name: "Visakha batch",
      side: "BOTH",
      relation: "FRIEND",
      notes: "School friends — shared side",
      sortOrder: 0,
    },
  });

  await prisma.weddingVendor.createMany({
    data: [
      { weddingId: nimaliWedding.id, vendorId: bySlug["lotus-photography"].id, status: "BOOKED" },
      { weddingId: nimaliWedding.id, vendorId: bySlug["glen-receptions"].id, status: "BOOKED" },
      { weddingId: nimaliWedding.id, vendorId: bySlug["kandy-hills-estate"].id, status: "SHORTLISTED" },
      { weddingId: nimaliWedding.id, vendorId: bySlug["fort-lawn-galle"].id, status: "SHORTLISTED" },
      { weddingId: nimaliWedding.id, vendorId: bySlug["ashtaka-poruwa-craft"].id, status: "INQUIRED" },
      { weddingId: nimaliWedding.id, vendorId: bySlug["magul-bera-collective"].id, status: "BOOKED" },
    ],
  });

  await prisma.musicPlan.create({
    data: {
      weddingId: nimaliWedding.id,
      eventId: poruwa.id,
      vibePrimary: "TRADITIONAL",
      languages: ["SINHALA", "MIXED"],
      notes: "Keep magul bera live for entrance; soft bed under ashtaka.",
      entertainmentVendorId: bySlug["magul-bera-collective"].id,
      shareEnabled: true,
      shareToken: "demo-poruwa-music-brief",
      tracks: {
        create: [
          {
            list: "MUST",
            title: "Magul bera entrance",
            artist: "Magul Bera Collective",
            language: "SINHALA",
            vibe: "TRADITIONAL",
            sortOrder: 0,
          },
          {
            list: "DO_NOT",
            title: "Club remixes during poruwa",
            notes: "No EDM until reception open dance",
            sortOrder: 0,
          },
        ],
      },
      cues: {
        create: [
          {
            kind: "TRADITIONAL",
            label: "Magul bera / traditional entrance",
            offsetMinutes: -15,
            durationMinutes: 15,
            sortOrder: 0,
          },
          {
            kind: "ENTRANCE",
            label: "Couple entrance to poruwa",
            offsetMinutes: 0,
            durationMinutes: 5,
            sortOrder: 1,
          },
          {
            kind: "CEREMONY",
            label: "Ashtaka / ceremony window",
            offsetMinutes: 5,
            durationMinutes: 45,
            sortOrder: 2,
          },
        ],
      },
    },
  });

  const aishaWedding = await prisma.wedding.create({
    data: {
      slug: "aisha-and-farhan",
      partnerOneName: "Aisha",
      partnerTwoName: "Farhan",
      date: new Date("2026-09-05T11:00:00.000Z"),
      city: "Colombo",
      district: "Colombo",
      guestCountEstimate: 280,
      budgetLkr: 3200000,
      payer: "GROOM_FAMILY",
      types: ["MUSLIM_NIKAH"],
      onboardingCompletedAt: new Date(),
      websiteFaq: "Nikah at 11:00. Walima at 19:00. Modest formal attire. Halal menu.",
      travelNotes: "Colombo. Prayer room at the hall. Separate seating available on request.",
      members: { create: [{ userId: aisha.id, role: "COUPLE", canManageVendors: true }] },
      events: {
        create: [
          { kind: "NIKAH", name: "Nikah", venueName: "Colombo mosque hall" },
          { kind: "WALIMA", name: "Walima", venueName: "Cinnamon Grand" },
        ],
      },
      tasks: {
        create: [
          { title: "Confirm maulvi and mahr note", category: "tradition", status: "DONE" },
          { title: "Book halal catering", category: "venue" },
          { title: "Mehndi evening guest list", category: "guests" },
        ],
      },
      budgetLines: {
        create: [
          { category: "venue_catering", label: "Walima hall and halal plates", plannedLkr: 1600000, spentLkr: 500000, paidLkr: 300000, payer: "GROOM_FAMILY" },
          { category: "photo_video", label: "Photography", plannedLkr: 250000, paidLkr: 0, payer: "COUPLE" },
          { category: "beauty", label: "Mehndi and makeup", plannedLkr: 90000, paidLkr: 0, payer: "BRIDE_FAMILY" },
        ],
      },
    },
  });

  await prisma.guestHousehold.createMany({
    data: [
      { weddingId: aishaWedding.id, label: "Rahman family", headName: "Mr Rahman", side: "BRIDE", plusCount: 6, status: "CONFIRMED", meal: "HALAL", channel: "WHATSAPP" },
      { weddingId: aishaWedding.id, label: "Farhan uncles", headName: "Uncle Imran", side: "GROOM", plusCount: 8, status: "INVITED", meal: "HALAL", channel: "PHONE" },
      { weddingId: aishaWedding.id, label: "Dubai cousins", headName: "Sara Rahman", side: "BRIDE", plusCount: 3, status: "MAYBE", meal: "HALAL", channel: "OVERSEAS" },
    ],
  });

  const priyaWedding = await prisma.wedding.create({
    data: {
      slug: "priya-and-arjun",
      partnerOneName: "Priya",
      partnerTwoName: "Arjun",
      date: new Date("2027-01-18T03:30:00.000Z"),
      city: "Galle",
      district: "Galle",
      guestCountEstimate: 180,
      budgetLkr: 4500000,
      payer: "COUPLE",
      types: ["HINDU", "DESTINATION"],
      onboardingCompletedAt: new Date(),
      planningFromOverseas: true,
      websiteFaq: "Mehndi Friday. Ceremony Saturday morning. Reception at Fort Lawn. Silk or formal tropical.",
      travelNotes: "Fly into CMB, 2.5 hours to Galle. Hotel block at Amangalla and Fort Bazaar. 4-day residency note for legal destination marriages.",
      members: { create: [{ userId: priya.id, role: "COUPLE", canManageVendors: true }] },
      events: {
        create: [
          { kind: "MEHNDI", name: "Mehndi", venueName: "Fort Bazaar courtyard" },
          { kind: "OTHER", name: "Hindu ceremony", venueName: "Fort Lawn Galle" },
          { kind: "RECEPTION", name: "Destination reception", venueName: "Fort Lawn Galle" },
        ],
      },
      tasks: {
        create: [
          { title: "Book priest and thaali", category: "tradition" },
          { title: "Confirm Fort Lawn monsoon backup", category: "venue", status: "DOING" },
          { title: "Guest airport pickups", category: "travel" },
        ],
      },
      budgetLines: {
        create: [
          { category: "venue_catering", label: "Fort Lawn and catering", plannedLkr: 2200000, spentLkr: 700000, paidLkr: 400000, payer: "COUPLE" },
          { category: "photo_video", label: "Destination film", plannedLkr: 420000, paidLkr: 0, payer: "COUPLE", vendorId: bySlug["lotus-photography"].id },
          { category: "decor", label: "Mandap and florals", plannedLkr: 380000, paidLkr: 0, payer: "BRIDE_FAMILY" },
        ],
      },
    },
  });

  await prisma.guestHousehold.createMany({
    data: [
      { weddingId: priyaWedding.id, label: "Sharma parents", headName: "Dr Sharma", side: "BRIDE", plusCount: 4, status: "CONFIRMED", meal: "VEG", channel: "OVERSEAS" },
      { weddingId: priyaWedding.id, label: "Toronto friends", headName: "Anjali Patel", side: "BOTH", plusCount: 2, status: "INVITED", meal: "VEG", channel: "OVERSEAS" },
      { weddingId: priyaWedding.id, label: "Galle staff buffer", headName: "Local plus-ones", side: "BOTH", plusCount: 8, status: "CONSIDERING", meal: "FISH", channel: "PHONE" },
    ],
  });

  await prisma.inquiry.createMany({
    data: [
      {
        weddingId: nimaliWedding.id,
        vendorId: bySlug["lotus-photography"].id,
        message: "Can you cover poruwa at 10:00 and the Kandy homecoming the next day?",
        whatsappUrl: "https://wa.me/94771234567?text=Can%20you%20cover%20poruwa%20at%2010%3A00%20and%20the%20Kandy%20homecoming%20the%20next%20day%3F",
        status: "REPLIED",
      },
      {
        weddingId: aishaWedding.id,
        vendorId: bySlug["lotus-photography"].id,
        message: "Need a discreet nikah photographer and walima highlights. Halal venue at Cinnamon Grand.",
        whatsappUrl: "https://wa.me/94771234567?text=Need%20a%20discreet%20nikah%20photographer",
        status: "NEW",
      },
      {
        weddingId: priyaWedding.id,
        vendorId: bySlug["lotus-photography"].id,
        message: "Destination Hindu wedding in Galle, January. Two-day coverage including mehndi.",
        whatsappUrl: "https://wa.me/94771234567?text=Destination%20Hindu%20wedding%20in%20Galle",
        status: "NEW",
      },
      {
        weddingId: nimaliWedding.id,
        vendorId: bySlug["glen-receptions"].id,
        message: "Holding 320 guests with a 12% buffer. Confirm fish and veg plates for December 12.",
        whatsappUrl: "https://wa.me/94772345678?text=Holding%20320%20guests",
        status: "NEW",
      },
      {
        weddingId: aishaWedding.id,
        vendorId: bySlug["saffron-kitchen"].id,
        message: "Walima for 280, fully halal, including a late-night kottu station.",
        whatsappUrl: "https://wa.me/94770123456?text=Walima%20for%20280",
        status: "NEW",
      },
    ],
  });

  await prisma.weddingVendor.create({
    data: { weddingId: priyaWedding.id, vendorId: bySlug["lotus-photography"].id, status: "INQUIRED" },
  });

  const lotus = bySlug["lotus-photography"];
  const glen = bySlug["glen-receptions"];
  const hills = bySlug["kandy-hills-estate"];
  const glam = bySlug["glam-by-nadeesha"];
  const saffron = bySlug["saffron-kitchen"];
  const blooms = bySlug["temple-blooms"];
  const fort = bySlug["fort-lawn-galle"];
  const ransilu = bySlug["ransilu-bridal"];

  await prisma.vendor.update({
    where: { id: lotus.id },
    data: {
      photos: [PHOTO.photo, PHOTO.beach, PHOTO.garden, PHOTO.venue, PHOTO.dance],
      yearsExperience: 12,
      couplesServed: 220,
      ratingAvg: 4.9,
      ratingCount: 18,
      offerHeadline: "Quiet documentary films for poruwa mornings and Kandy homecomings",
      priceDisplayMode: "FROM",
      typicalSpendLkr: 320000,
      taxesExtra: false,
      pricingDisclaimer: "Prices indicative; final quote after date and guest brief on WhatsApp.",
      depositNote: "40% advance to reserve the date",
      cancellationNote: "Reschedule free once; cancellations within 30 days forfeit the advance.",
      serviceAreas: ["Colombo", "Kandy", "Galle", "Negombo", "Bentota"],
      travelNote: "Colombo free · Kandy & south coast travel included on two-day packages",
      overtimeNote: "Extra hour from LKR 18,000",
      includedInPrice: ["High-res gallery", "Poruwa coverage", "Highlight film", "Two shooters", "USB + online"],
      instagram: "@lotus.weddings",
      facebook: "Lotus Photography LK",
      description:
        "We film Sri Lankan weddings the way families remember them — nekath on time, aunties unscripted, and the quiet between rituals. Documentary coverage across Colombo, Kandy, and the south coast for diaspora and local couples.",
      faqs: [
        { question: "Do you cover poruwa and homecoming?", answer: "Yes — two-day Kandyan coverage is our most booked package. We build the day backwards from nekath." },
        { question: "English-speaking coordinator?", answer: "Yes. Diaspora couples usually brief us on WhatsApp from Melbourne, London, or Toronto." },
        { question: "How fast is the gallery?", answer: "Preview within 10 days; full gallery in 4–6 weeks. Films follow within 8 weeks." },
        { question: "Do you bring a second shooter?", answer: "Day + film and Two-day Kandyan include two shooters as standard." },
      ],
    },
  });
  await prisma.vendor.update({
    where: { id: glen.id },
    data: {
      photos: [PHOTO.garden, PHOTO.venue, PHOTO.food, PHOTO.florist, PHOTO.dance],
      yearsExperience: 18,
      couplesServed: 400,
      ratingAvg: 4.8,
      ratingCount: 42,
      offerHeadline: "Garden hall for 200–400 with in-house plates and a poruwa platform",
      priceDisplayMode: "FROM",
      typicalSpendLkr: 1100000,
      taxesExtra: true,
      taxNote: "Service charge and taxes extra on plates",
      pricingDisclaimer: "Hall rates vary by season; weekday dates are softer.",
      depositNote: "30% hall deposit · plate deposit 21 days before",
      serviceAreas: ["Negombo", "Gampaha", "Colombo"],
      travelNote: "Coach parking for 12 vehicles · bridal suite included",
      overtimeNote: "Hall overtime LKR 45,000 / hour after 22:00",
      includedInPrice: ["Hall hire to 22:00", "In-house plates", "Poruwa platform", "Bridal suite"],
      instagram: "@glen.receptions",
      description:
        "A Negombo garden hall built for big Sri Lankan guest lists — poruwa under the trees, plates that scale to 400, and coordinators who understand nekath and late-night stations.",
      faqs: [
        { question: "What is the guest capacity?", answer: "Comfortably 200–400 seated. Standing cocktail can stretch further with a floor plan review." },
        { question: "Is outside catering allowed?", answer: "In-house kitchen preferred. Outside catering needs written approval and corkage." },
        { question: "Is there a bridal suite?", answer: "Yes — suite, oil lamp table, and poruwa platform are included in hall hire." },
      ],
    },
  });
  await prisma.vendor.update({
    where: { id: hills.id },
    data: {
      photos: [PHOTO.venue, PHOTO.garden, PHOTO.beach, PHOTO.photo],
      yearsExperience: 10,
      couplesServed: 95,
      ratingAvg: 4.85,
      ratingCount: 11,
      offerHeadline: "Hill-country lawn for Kandyan homecomings",
      priceDisplayMode: "FROM",
      typicalSpendLkr: 1500000,
      serviceAreas: ["Kandy", "Peradeniya", "Matale"],
      travelNote: "Guest coaches recommended from Colombo — we share vendor contacts",
      includedInPrice: ["Lawn + pavilion", "Poruwa backdrop", "Changing rooms"],
      instagram: "@kandyhills.estate",
      description:
        "Mist, lawn, and a pavilion that holds a proper homecoming. Built for Kandyan weekends when Colombo does the poruwa and Kandy hosts the family feast.",
      faqs: [
        { question: "Rain plan?", answer: "Pavilion covers 180 seated. We hold a monsoon backup layout for every booking." },
      ],
    },
  });
  await prisma.vendor.update({
    where: { id: glam.id },
    data: {
      photos: [PHOTO.makeup, PHOTO.bridal, PHOTO.jewellery, PHOTO.photo],
      yearsExperience: 9,
      couplesServed: 310,
      ratingAvg: 4.92,
      ratingCount: 27,
      offerHeadline: "Bridal glam for osariya mornings and destination looks",
      priceDisplayMode: "FROM",
      typicalSpendLkr: 85000,
      serviceAreas: ["Colombo", "Negombo", "Galle"],
      travelNote: "On-location within Colombo free · outstation travel quoted",
      overtimeNote: "Touch-up artist overtime LKR 8,000 / hour",
      includedInPrice: ["Lashes", "Touch-up kit", "Trial notes"],
      instagram: "@glambynadeesha",
      description:
        "Soft glam that photographs under poruwa lights and church windows. Trials in the studio; wedding morning on location with a dresser who knows neththi timing.",
      faqs: [
        { question: "Do you travel for destination weddings?", answer: "Yes — Galle and south coast regularly. Travel and stay billed separately." },
      ],
    },
  });
  await prisma.vendor.update({
    where: { id: saffron.id },
    data: {
      photos: [PHOTO.food, PHOTO.venue, PHOTO.garden, PHOTO.dance],
      yearsExperience: 14,
      couplesServed: 520,
      ratingAvg: 4.7,
      ratingCount: 33,
      offerHeadline: "Halal kitchen · plates that scale from walima to garden reception",
      priceDisplayMode: "FROM",
      startingPriceLkr: 4200,
      typicalSpendLkr: 6500,
      taxesExtra: true,
      serviceAreas: ["Colombo", "Gampaha", "Kalutara"],
      includedInPrice: ["Service staff", "Cutlery", "Live station option"],
      instagram: "@saffron.kitchen.lk",
      description:
        "Per-plate catering with a certified halal line, vegetarian and fish menus, and late-night stations that keep uncles happy. Built for 150–500 guests.",
      faqs: [
        { question: "Halal certificate?", answer: "Yes — written certificate provided with every walima booking." },
      ],
    },
  });
  await prisma.vendor.update({
    where: { id: blooms.id },
    data: {
      photos: [PHOTO.florist, PHOTO.venue, PHOTO.bridal, PHOTO.garden],
      yearsExperience: 11,
      couplesServed: 180,
      ratingAvg: 4.75,
      ratingCount: 14,
      offerHeadline: "Poruwa florals, jasmine, and hall stories that hold in heat",
      priceDisplayMode: "FROM",
      typicalSpendLkr: 260000,
      serviceAreas: ["Colombo", "Kandy", "Galle"],
      includedInPrice: ["Setup + teardown", "Poruwa set", "Entrance"],
      instagram: "@templeblooms",
      description:
        "Temple-friendly garlands and reception florals that survive Colombo heat. Poruwa first, then the hall — never the other way around.",
    },
  });
  await prisma.vendor.update({
    where: { id: fort.id },
    data: {
      photos: [PHOTO.beach, PHOTO.venue, PHOTO.garden, PHOTO.photo],
      yearsExperience: 8,
      couplesServed: 70,
      ratingAvg: 4.88,
      ratingCount: 9,
      offerHeadline: "Destination garden beside the Galle fort walls",
      priceDisplayMode: "FROM",
      typicalSpendLkr: 2200000,
      destinationExperienced: true,
      serviceAreas: ["Galle", "Unawatuna", "Mirissa"],
      travelNote: "English + Sinhala coordinators on site",
      includedInPrice: ["Lawn hire", "Monsoon backup plan", "Coordinator"],
      instagram: "@fortlawn.galle",
      description:
        "South-coast gardens for Hindu, Christian, and destination weekends. We plan coaches, monsoon cover, and bilingual guest flow before you fall in love with the lawn.",
    },
  });
  await prisma.vendor.update({
    where: { id: ransilu.id },
    data: {
      photos: [PHOTO.bridal, PHOTO.jewellery, PHOTO.makeup, PHOTO.photo],
      yearsExperience: 16,
      couplesServed: 600,
      ratingAvg: 4.8,
      ratingCount: 51,
      offerHeadline: "Osariya, Kandyan jackets, and western gowns — hire or buy",
      priceDisplayMode: "FROM",
      typicalSpendLkr: 220000,
      serviceAreas: ["Colombo"],
      includedInPrice: ["Fitting", "Alteration consult", "Dresser brief"],
      instagram: "@ransilu.bridal",
      description:
        "Colombo’s fitting rooms for poruwa mornings and church afternoons. Osariya drape specialists, Kandyan jackets, and gowns that travel well for homecoming.",
    },
  });

  const lotusAddOns = await Promise.all([
    prisma.vendorAddOn.create({
      data: {
        vendorId: lotus.id,
        name: "Second shooter hour",
        description: "Extra coverage hour with second shooter",
        pricingMode: "FIXED",
        priceLkr: 18000,
      },
    }),
    prisma.vendorAddOn.create({
      data: {
        vendorId: lotus.id,
        name: "Printed album",
        description: "30-page layflat album",
        pricingMode: "FROM",
        priceLkr: 55000,
      },
    }),
    prisma.vendorAddOn.create({
      data: {
        vendorId: lotus.id,
        name: "Drone reel",
        pricingMode: "FIXED",
        priceLkr: 35000,
      },
    }),
  ]);

  await prisma.vendorPackage.createMany({
    data: [
      {
        vendorId: lotus.id,
        tier: "BASIC",
        name: "Poruwa morning",
        pricingMode: "FIXED",
        priceLkr: 180000,
        description: "Ceremony only — one shooter, nekath-aware timing, edited gallery.",
        sortOrder: 0,
        status: "PUBLISHED",
        inclusions: ["Ceremony coverage", "One shooter", "Edited online gallery"],
        exclusions: ["Film", "Album", "Homecoming"],
        eventTypes: ["PORUWA", "WEDDING"],
        durationHours: 5,
        bestFor: "Intimate ceremony focus",
        photoUrls: [PHOTO.photo, PHOTO.garden],
      },
      {
        vendorId: lotus.id,
        tier: "ADVANCED",
        name: "Day + film",
        pricingMode: "FROM",
        priceLkr: 280000,
        description: "Poruwa, reception, and a cinematic highlight film — our most booked day.",
        sortOrder: 1,
        badge: "POPULAR",
        status: "PUBLISHED",
        inclusions: ["Poruwa + reception", "Highlight film", "Two shooters", "USB + online"],
        exclusions: ["Printed album"],
        eventTypes: ["WEDDING", "HOMECOMING"],
        durationHours: 10,
        bestFor: "Most couples",
        photoUrls: [PHOTO.photo, PHOTO.dance, PHOTO.beach],
      },
      {
        vendorId: lotus.id,
        tier: "DREAM",
        name: "Two-day Kandyan",
        pricingMode: "FROM",
        priceLkr: 420000,
        description: "Poruwa in Colombo, homecoming in Kandy — full documentary story.",
        sortOrder: 2,
        badge: "BEST_VALUE",
        status: "PUBLISHED",
        inclusions: ["Two-day coverage", "Film + album credit", "Travel to Kandy"],
        exclusions: [],
        eventTypes: ["WEDDING", "HOMECOMING", "DESTINATION"],
        durationHours: 16,
        bestFor: "Diaspora Kandyan weekends",
        photoUrls: [PHOTO.venue, PHOTO.photo, PHOTO.beach],
      },
      {
        vendorId: glen.id,
        tier: "BASIC",
        name: "Garden hall",
        pricingMode: "FROM",
        priceLkr: 650000,
        description: "Venue only for 200 guests — poruwa platform and bridal suite.",
        sortOrder: 0,
        status: "PUBLISHED",
        guestMin: 100,
        guestMax: 200,
        inclusions: ["Hall hire", "Poruwa platform", "Bridal suite"],
        exclusions: ["Catering", "Decor"],
        eventTypes: ["WEDDING"],
        bestFor: "Venue-only bookings",
        photoUrls: [PHOTO.garden, PHOTO.venue],
      },
      {
        vendorId: glen.id,
        tier: "ADVANCED",
        name: "Hall + plates",
        pricingMode: "PER_GUEST",
        priceLkr: 8500,
        description: "Venue and catering for up to 300 — the weekday favourite.",
        sortOrder: 1,
        badge: "POPULAR",
        status: "PUBLISHED",
        guestMin: 150,
        guestMax: 300,
        inclusions: ["Hall hire", "Plate service", "Bridal suite", "Service staff"],
        exclusions: ["Alcohol packages"],
        eventTypes: ["WEDDING", "HOMECOMING"],
        bestFor: "150–300 guests",
        photoUrls: [PHOTO.food, PHOTO.garden],
      },
      {
        vendorId: glen.id,
        tier: "DREAM",
        name: "Full magul maduva",
        pricingMode: "FROM",
        priceLkr: 1400000,
        description: "Venue, catering, poruwa, and late night — turnkey feast.",
        sortOrder: 2,
        status: "PUBLISHED",
        guestMin: 200,
        guestMax: 500,
        inclusions: ["Full venue", "Catering", "Poruwa", "Late-night station"],
        eventTypes: ["WEDDING"],
        bestFor: "Full wedding day",
        photoUrls: [PHOTO.venue, PHOTO.food, PHOTO.dance],
      },
      {
        vendorId: glam.id,
        tier: "BASIC",
        name: "Bridal trial",
        pricingMode: "FIXED",
        priceLkr: 25000,
        status: "PUBLISHED",
        sortOrder: 0,
        durationHours: 2,
        inclusions: ["Hair + makeup trial", "Look notes"],
        exclusions: ["On-location"],
        eventTypes: ["ENGAGEMENT", "WEDDING"],
        bestFor: "Before the big day",
        description: "Studio trial to lock your bridal look under daylight and warm lamps.",
        photoUrls: [PHOTO.makeup],
      },
      {
        vendorId: glam.id,
        tier: "ADVANCED",
        name: "Bridal day",
        pricingMode: "FROM",
        priceLkr: 65000,
        status: "PUBLISHED",
        sortOrder: 1,
        badge: "POPULAR",
        durationHours: 4,
        inclusions: ["On-location bridal", "Touch-ups", "False lashes"],
        exclusions: ["Bridesmaids"],
        eventTypes: ["WEDDING", "HOMECOMING"],
        bestFor: "Wedding morning",
        description: "Full bridal glam on location with dresser-aware timing.",
        photoUrls: [PHOTO.makeup, PHOTO.bridal],
      },
      {
        vendorId: saffron.id,
        tier: "BASIC",
        name: "Classic buffet",
        pricingMode: "PER_GUEST",
        priceLkr: 4500,
        status: "PUBLISHED",
        sortOrder: 0,
        guestMin: 100,
        guestMax: 500,
        inclusions: ["Buffet stations", "Service staff", "Cutlery"],
        eventTypes: ["WEDDING", "HOMECOMING"],
        bestFor: "Large receptions",
        description: "Crowd-pleasing Sri Lankan + international buffet.",
        photoUrls: [PHOTO.food],
      },
      {
        vendorId: saffron.id,
        tier: "ADVANCED",
        name: "Walima premium",
        pricingMode: "PER_GUEST",
        priceLkr: 7500,
        status: "PUBLISHED",
        sortOrder: 1,
        badge: "BEST_VALUE",
        guestMin: 120,
        guestMax: 400,
        inclusions: ["Halal line", "Live stations", "Late-night kottu"],
        eventTypes: ["WEDDING"],
        bestFor: "Walima nights",
        description: "Certified halal feast with late-night stations.",
        photoUrls: [PHOTO.food, PHOTO.dance],
      },
      {
        vendorId: blooms.id,
        tier: "ADVANCED",
        name: "Poruwa + entrance",
        pricingMode: "FROM",
        priceLkr: 180000,
        status: "PUBLISHED",
        sortOrder: 0,
        badge: "POPULAR",
        inclusions: ["Poruwa florals", "Entrance arch", "Setup + teardown"],
        eventTypes: ["PORUWA", "WEDDING"],
        bestFor: "Ceremony focus",
        description: "Signature poruwa and welcome florals that hold in heat.",
        photoUrls: [PHOTO.florist, PHOTO.venue],
      },
      {
        vendorId: hills.id,
        tier: "ADVANCED",
        name: "Homecoming lawn",
        pricingMode: "FROM",
        priceLkr: 1200000,
        status: "PUBLISHED",
        sortOrder: 0,
        badge: "POPULAR",
        guestMin: 150,
        guestMax: 280,
        inclusions: ["Lawn + pavilion", "Poruwa backdrop", "Coordinator"],
        eventTypes: ["HOMECOMING", "WEDDING"],
        bestFor: "Kandyan weekends",
        description: "Hill-country lawn day with monsoon pavilion backup.",
        photoUrls: [PHOTO.venue, PHOTO.garden],
      },
    ],
  });

  const lotusDayFilm = await prisma.vendorPackage.findFirst({
    where: { vendorId: lotus.id, name: "Day + film" },
  });
  const lotusTwoDay = await prisma.vendorPackage.findFirst({
    where: { vendorId: lotus.id, name: "Two-day Kandyan" },
  });
  if (lotusDayFilm) {
    await prisma.vendorPackage.update({
      where: { id: lotusDayFilm.id },
      data: { addOns: { connect: [{ id: lotusAddOns[0].id }, { id: lotusAddOns[1].id }] } },
    });
  }
  if (lotusTwoDay) {
    await prisma.vendorPackage.update({
      where: { id: lotusTwoDay.id },
      data: { addOns: { connect: lotusAddOns.map((item) => ({ id: item.id })) } },
    });
  }

  await prisma.review.createMany({
    data: [
      {
        vendorId: lotus.id,
        weddingId: nimaliWedding.id,
        authorName: "Nimali Perera",
        rating: 5,
        quality: 5,
        professionalism: 5,
        flexibility: 4.8,
        responseTime: 4.9,
        value: 4.7,
        communication: 5,
        body: "They understood nekath timing and did not rush the poruwa. WhatsApp replies were fast from Melbourne.",
      },
      {
        vendorId: lotus.id,
        authorName: "Priya Sharma",
        rating: 4.9,
        quality: 5,
        professionalism: 4.8,
        flexibility: 4.9,
        responseTime: 4.7,
        value: 4.6,
        communication: 4.8,
        body: "Galle destination coverage felt documentary, not posed. English and Tamil on the day.",
      },
      {
        vendorId: glen.id,
        authorName: "Kasun Jayawardena",
        rating: 4.8,
        quality: 4.8,
        professionalism: 4.9,
        flexibility: 4.6,
        responseTime: 4.5,
        value: 4.7,
        communication: 4.8,
        body: "Garden held 320 with a buffer. Fish and veg plates were clearly labelled.",
      },
    ],
  });

  const aug = (day: number, hour: number, minute = 0) =>
    new Date(Date.UTC(2026, 7, day, hour - 5, minute - 30));

  await prisma.appointment.createMany({
    data: [
      {
        weddingId: nimaliWedding.id,
        vendorId: bySlug["ransilu-bridal"].id,
        title: "Osariya fitting",
        kind: "FITTING",
        startsAt: aug(14, 9),
        endsAt: aug(14, 10, 30),
        venueName: "Ransilu Bridal, Colombo",
        reminderMinutes: 30,
        color: "#c4e0ff",
        notes: "Bring the Kandyan jacket reference.",
      },
      {
        weddingId: nimaliWedding.id,
        vendorId: glen.id,
        title: "Catering tasting",
        kind: "TASTING",
        startsAt: aug(14, 11),
        endsAt: aug(14, 12, 30),
        venueName: "Glen Receptions",
        reminderMinutes: 30,
        color: "#d8f0c8",
        notes: "Fish, veg, and a diaspora mild plate.",
      },
      {
        weddingId: nimaliWedding.id,
        vendorId: lotus.id,
        title: "Photo posing workshop",
        kind: "VENDOR_MEETING",
        startsAt: aug(14, 13),
        endsAt: aug(14, 14, 30),
        venueName: "Independence Arcade",
        reminderMinutes: 30,
        color: "#f7d4e0",
      },
      {
        weddingId: nimaliWedding.id,
        vendorId: bySlug["pandith-nekath"].id,
        title: "Nekath confirmation",
        kind: "CEREMONY",
        startsAt: aug(15, 10),
        endsAt: aug(15, 11),
        venueName: "Pandith Nekath",
        reminderMinutes: 60,
        color: "#e4d4f5",
        notes: "Poruwa at 10:00 on 12 Dec.",
      },
      {
        weddingId: nimaliWedding.id,
        vendorId: hills.id,
        title: "Homecoming walkthrough",
        kind: "VENDOR_MEETING",
        startsAt: aug(16, 15),
        endsAt: aug(16, 16, 30),
        venueName: "Kandy Hills Estate",
        color: "#c4e0ff",
      },
      {
        weddingId: nimaliWedding.id,
        title: "Poruwa ceremony",
        kind: "CEREMONY",
        startsAt: new Date("2026-12-12T04:30:00.000Z"),
        endsAt: new Date("2026-12-12T06:30:00.000Z"),
        venueName: "Glen Receptions",
        color: "#e4d4f5",
        notes: "Nekath 10:00 Sri Lanka time.",
      },
    ],
  });

  await prisma.article.createMany({
    data: [
      {
        slug: "nimali-and-kasun-kandyan-weekend",
        title: "Real wedding: Nimali & Kasun’s two-day Kandyan weekend",
        excerpt: "Poruwa in Colombo, homecoming in Kandy — and the photographer who kept nekath on camera.",
        body: "Nimali flew in from Melbourne with a WhatsApp brief and a nekath spreadsheet. Lotus Photography covered the poruwa morning and the Kandy homecoming without rushing ritual moments. Glen Receptions hosted the evening plates; Temple Blooms dressed the poruwa; Glam by Nadeesha locked the bridal look the night before. Couples who plan from overseas keep asking for this exact rhythm — two shooters, travel to Kandy included, and a gallery that arrives before relatives start asking.",
        category: "REAL_WEDDING",
        coverUrl: PHOTO.photo,
        featured: true,
        vendorSlugs: ["lotus-photography", "glen-receptions", "temple-blooms", "glam-by-nadeesha"],
      },
      {
        slug: "aisha-walima-at-glen",
        title: "Real wedding: Aisha’s walima under the Negombo trees",
        excerpt: "Halal plates for 280, a soft glam morning, and a garden hall that held the late-night station.",
        body: "Saffron Kitchen ran a certified halal line with late-night kottu. Glen Receptions kept the poruwa platform for the family blessing before dinner. The couple shortlisted on Ceylon Weddings from Toronto and closed the date on WhatsApp in one evening.",
        category: "REAL_WEDDING",
        coverUrl: PHOTO.garden,
        featured: true,
        vendorSlugs: ["glen-receptions", "saffron-kitchen", "glam-by-nadeesha"],
      },
      {
        slug: "poruwa-vs-homecoming-dress",
        title: "Poruwa vs homecoming: what to wear for each day",
        excerpt: "Osariya and nilame for the ceremony; a lighter Kandyan or Western look for the Kandy afternoon.",
        body: "The poruwa is the ritual. Homecoming is the family feast. Many couples change jewellery and jacket weight between days. Book the dresser for both, not only the morning.",
        category: "FASHION",
        coverUrl: PHOTO.bridal,
      },
      {
        slug: "colombo-vs-south-coast-venues",
        title: "Colombo halls vs south-coast gardens",
        excerpt: "When 300 plates belong in Negombo, and when Galle is worth the coach.",
        body: "Glen-style garden halls suit 250–400 with in-house catering. Fort Lawn and beach gardens need monsoon backup and extra transport. Price the coaches before you fall in love with the lawn.",
        category: "EVENTS",
        coverUrl: PHOTO.venue,
      },
      {
        slug: "diaspora-travel-notes",
        title: "Airport coaches, hotel blocks, and the 4-day residency rumour",
        excerpt: "What overseas guests actually need from CMB to Kandy.",
        body: "Publish a travel note on the wedding website: flight window, hotel block, coach times, dress code in English and Sinhala. Legal residency rules depend on the marriage type — ask the registrar, not a Facebook group.",
        category: "TRAVEL",
        coverUrl: PHOTO.beach,
      },
      {
        slug: "halal-walima-catering",
        title: "Halal walima catering in Colombo",
        excerpt: "Nikah in the morning, walima at night, and a menu that does not surprise uncles.",
        body: "Ask for a written halal certificate, a late-night station, and a prayer-room note on the website. Saffron Kitchen style caterers already brief halls on separate serving.",
        category: "FOOD",
        coverUrl: PHOTO.food,
      },
      {
        slug: "kandyan-jewellery-hire",
        title: "Kandyan jewellery: buy, hire, or mix",
        excerpt: "Mulgadelathi, neththi, and what photographers need you to decide early.",
        body: "Hire is common for the poruwa set. Confirm insurance and a dresser who can pin neththi without delaying nekath. Photographers should know if stones are hire pieces.",
        category: "FASHION",
        coverUrl: PHOTO.jewellery,
      },
      {
        slug: "mehndi-night-guest-list",
        title: "Mehndi night without a 400-person spillover",
        excerpt: "Keep mehndi intimate, then let the walima or reception carry the office list.",
        body: "Hindu and Muslim weddings in Sri Lanka often split mehndi from the main feast. Put mehndi on its own event in the guest list so RSVPs do not inflate plate counts.",
        category: "FAMILY",
        coverUrl: PHOTO.mehndi,
      },
      {
        slug: "church-banns-and-poruwa",
        title: "Church banns when you also want a poruwa",
        excerpt: "Western church in the morning, Kandyan homecoming later — two guest lists, one budget.",
        body: "Publish banns on the church calendar first. Then seed checklist tasks for both types so the registrar and the astrologer are not fighting the same hour.",
        category: "CEREMONY",
        coverUrl: PHOTO.invite,
      },
      {
        slug: "jasmines-and-poruwa-flowers",
        title: "Jasmine, lotus, and what the poruwa actually needs",
        excerpt: "Temple-friendly garlands vs south-coast orchids — and who pins them before nekath.",
        body: "Ask the florist for a poruwa set that can sit in heat without wilting, plus buttonholes for the nilame party. Diaspora orders should confirm delivery to the hall, not a Colombo apartment.",
        category: "FLOWERS",
        coverUrl: PHOTO.florist,
      },
      {
        slug: "wedding-cake-and-kiribath",
        title: "Cake cutting after kiribath, not instead of it",
        excerpt: "When a six-tier cake is theatre, and when a milk-rice table matters more.",
        body: "Keep a kiribath or sweet table for elders even if the cake is the photo moment. Confirm the hall can refrigerate a buttercream tier through a long nekath delay.",
        category: "CAKES",
        coverUrl: PHOTO.cake,
      },
    ],
  });

  await prisma.promotion.create({
    data: {
      name: "Homepage spotlight — Lotus",
      status: "ACTIVE",
      headline: "Film your poruwa like a love letter",
      subheadline: "Ceylon Picks photography with WhatsApp-first inquiries.",
      body: "Editorial coverage for Kandyan, church, and destination days — packages from Colombo to Galle.",
      ctaLabel: "View Lotus Photography",
      ctaHref: "/vendors/lotus-photography",
      coverUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?w=1400&q=80",
      accentColor: "#7c2d12",
      overlayTone: "light",
      layout: "SPOTLIGHT",
      badgeLabel: "Ceylon Pick",
      slots: ["HOME_HERO", "HOME_PICKS", "CATALOG_TOP"],
      cities: [],
      categories: ["PHOTO_VIDEO"],
      locales: ["en"],
      startsAt: new Date(Date.now() - 86400000),
      endsAt: new Date(Date.now() + 86400000 * 60),
      priority: 100,
      vendorId: lotus.id,
      source: "EDITORIAL",
    },
  });

  const flagCatalog = [
    {
      key: "reviews.enabled",
      enabled: true,
      description: "Show reviews on vendor storefronts and allow couple review submission",
    },
    {
      key: "awards.public",
      enabled: true,
      description: "Publish Best of Ceylon awards on the public /awards page",
    },
    {
      key: "ideas.public",
      enabled: true,
      description: "Show Ideas & Inspiration in public navigation and routes",
    },
    {
      key: "ads.public",
      enabled: true,
      description: "Render public promotion / ad slot rails",
    },
    {
      key: "site.maintenance",
      enabled: false,
      description: "Show the maintenance banner from branding config on public pages",
    },
  ] as const;

  for (const flag of flagCatalog) {
    await prisma.featureFlag.create({ data: { ...flag } });
  }

  await prisma.siteConfig.create({
    data: {
      id: "default",
      branding: {
        logoUrl: null,
        tagline: "Sri Lanka's wedding planning platform.",
        footerBlurb:
          "Browse 250+ verified Sri Lankan vendors, manage your checklist, budget, guest list, and custom RSVP website — all in one place.",
        contactEmail: "hello@ceylonweddings.com",
        contactPhone: "+94 11 234 5678",
        whatsapp: "+94771234567",
        socialInstagram: "https://instagram.com/ceylonweddings",
        socialFacebook: null,
        socialTiktok: null,
        maintenanceBanner: { enabled: false, message: "" },
      },
      homepage: {
        hero: {
          title: "Your perfect Sri Lankan wedding begins here.",
          subtitle: "Plan poruwa, church, nikah, and homecoming with verified island vendors.",
          ctaPrimaryLabel: "Browse vendors",
          ctaPrimaryHref: "/vendors",
          ctaSecondaryLabel: "Start planning",
          ctaSecondaryHref: "/register",
          imageUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&q=80",
          chips: ["Poruwa ceremony", "Church & nikah", "All island"],
        },
        stats: [
          { value: "250+", label: "Verified Vendors" },
          { value: "1,200+", label: "Couples Served" },
          { value: "4.9", label: "Average Rating" },
          { value: "All Island", label: "Coverage" },
        ],
        categoryKeys: [
          "VENUE",
          "PHOTO_VIDEO",
          "FLORIST_DECOR",
          "CATERER",
          "PORUWA",
          "HAIR_MAKEUP",
          "BRIDAL_WEAR",
          "CAKE",
          "WEDDING_CARS",
          "ENTERTAINMENT",
        ],
        howItWorks: [
          {
            title: "Create your wedding profile",
            body: "Set your ceremony types — poruwa, church, nikah, homecoming. Add partner names, city, guest count, and budget. Invite Amma, your partner, or a planner.",
          },
          {
            title: "Discover the right vendors",
            body: "Browse venues, photography, florists, caterers, and traditional specialists. Every listing is Sri Lanka first — not a US template.",
          },
          {
            title: "Connect on WhatsApp",
            body: "Inquire directly on WhatsApp — where the conversation already lives. Vendors get a lead; you keep your thread.",
          },
        ],
        seo: {
          title: "Ceylon Weddings — Plan a Sri Lankan wedding in one place",
          description:
            "Ceylon Weddings is Sri Lanka's wedding planning platform. Browse 250+ verified vendors, manage your checklist, budget, and guest list — all in one place.",
          ogImage: "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80",
        },
      },
    },
  });

  const cmsPages = [
    {
      slug: "about",
      title: "About us",
      excerpt: "Built for Sri Lankan weddings.",
      body: "## Built for Sri Lankan weddings\n\nA poruwa in Colombo. A church in Kandy. A nikah in Kalmunai.\n\nWe built Ceylon Weddings because Sri Lankan couples deserve a platform that understands every ceremony, every family structure, and every LKR.\n\n### Sri Lanka first\nPoruwa, nikah, church, and homecoming ceremonies are supported out of the box.\n\n### WhatsApp native\nInquire and negotiate with vendors directly where your conversations already happen.\n\n### Family-aware\nInvite Amma, your partner, or a planner with household-based guest lists.",
      seo: {
        title: "About us — Ceylon Weddings",
        description: "Built for Sri Lankan weddings. The planning platform that understands every ceremony.",
      },
    },
    {
      slug: "faq",
      title: "Frequently asked questions",
      excerpt: "Answers for couples and vendors.",
      body: "## Couples\n\n**Is Ceylon Weddings free for couples?**\nYes. Planning tools, guest list, budget, and wedding website lite are free for couples.\n\n**Can I invite family to help plan?**\nYes. Invite a partner, parents, or planner with role-based access.\n\n## Vendors\n\n**How do I get leads?**\nCouples inquire on WhatsApp from your storefront. Keep your listing complete and verified.\n\n**Are there paid placements?**\nYes. Featured boosts and custom ads can be scheduled.",
      seo: {
        title: "FAQ | Ceylon Weddings",
        description: "Frequently asked questions about Ceylon Weddings for couples and vendors.",
      },
    },
    {
      slug: "terms",
      title: "Terms of Service",
      excerpt: "Please read these terms carefully before using our platform.",
      body: "## 1. Acceptance\nBy accessing or using Ceylon Weddings, you agree to be bound by these Terms of Service.\n\n## 2. The service\nCeylon Weddings provides free planning tools for couples and a vendor marketplace.\n\n## 3. Couple accounts\nCouples must provide accurate information and safeguard login credentials.\n\n## 4. Vendor listings\nVendors must provide accurate business information. We may verify, feature, hide, or remove listings.\n\n## 5. Intellectual property\nThe platform and its original content are owned by Ceylon Weddings.\n\n## 6. Limitation of liability\nCeylon Weddings is not liable for indirect or consequential damages arising from use of the service.",
      seo: {
        title: "Terms of Service | Ceylon Weddings",
        description: "Terms of service and user agreements for Ceylon Weddings.",
      },
    },
    {
      slug: "privacy",
      title: "Privacy Policy",
      excerpt: "How we collect, use, and protect your information.",
      body: "## Information we collect\nAccount details, wedding planning data, vendor listing content, and usage analytics.\n\n## How we use information\nTo provide planning tools, marketplace discovery, support, and product improvements.\n\n## Sharing\nWe do not sell personal data. WhatsApp inquiry flows share only what you choose to send.\n\n## Retention & security\nWe retain data while accounts are active and apply reasonable security controls.",
      seo: {
        title: "Privacy Policy | Ceylon Weddings",
        description: "Privacy policy for Ceylon Weddings.",
      },
    },
    {
      slug: "contact",
      title: "Contact us",
      excerpt: "Get in touch with the Ceylon Weddings team.",
      body: "## We are here to help\nReach the Ceylon Ops team for couple support, vendor onboarding, or partnership inquiries.\n\nUse the form on this page, email hello@ceylonweddings.com, or WhatsApp our support line during business hours (Colombo).",
      seo: {
        title: "Contact Us | Ceylon Weddings",
        description: "Get in touch with the Ceylon Weddings team.",
      },
    },
  ] as const;

  for (const page of cmsPages) {
    await prisma.cmsPage.create({
      data: {
        slug: page.slug,
        title: page.title,
        excerpt: page.excerpt,
        body: page.body,
        locale: "en",
        status: "PUBLISHED",
        seo: page.seo,
      },
    });
  }

  console.log(
    `Seeded ${rich.vendorCount} vendors, ${rich.defCount} attribute definitions, ${rich.attrValueCount} answers, ${rich.packageCount} packages, 3 weddings, ${households.length} main-wedding households, site config, ${cmsPages.length} CMS pages.`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
