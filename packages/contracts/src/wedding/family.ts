import { z } from "zod";
import { guestSideSchema } from "./enums";

export const familyRelationSchema = z.enum([
  "MOTHER",
  "FATHER",
  "SIBLING",
  "AUNT_UNCLE",
  "COUSIN",
  "GRANDPARENT",
  "FRIEND",
  "OTHER",
]);
export type FamilyRelation = z.infer<typeof familyRelationSchema>;

export const FAMILY_RELATION_LABELS: Record<FamilyRelation, string> = {
  MOTHER: "Mother / Amma",
  FATHER: "Father / Thaththa",
  SIBLING: "Sibling",
  AUNT_UNCLE: "Aunt / Uncle",
  COUSIN: "Cousin",
  GRANDPARENT: "Grandparent",
  FRIEND: "Friend",
  OTHER: "Other",
};

export const familyPersonSchema = z.object({
  id: z.string(),
  weddingId: z.string(),
  name: z.string(),
  side: guestSideSchema,
  relation: familyRelationSchema,
  notes: z.string().nullable(),
  phone: z.string().nullable(),
  householdId: z.string().nullable(),
  householdLabel: z.string().nullable().optional(),
  parentId: z.string().nullable(),
  parentName: z.string().nullable().optional(),
  sortOrder: z.number().int(),
});

export const createFamilyPersonBodySchema = z.object({
  name: z.string().min(1),
  side: guestSideSchema.default("BOTH"),
  relation: familyRelationSchema.default("OTHER"),
  notes: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  householdId: z.string().nullable().optional(),
  parentId: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
});

export const updateFamilyPersonBodySchema = createFamilyPersonBodySchema.partial();

export const familySideGroupSchema = z.object({
  side: guestSideSchema,
  people: z.array(familyPersonSchema),
});

export type FamilyPerson = z.infer<typeof familyPersonSchema>;
export type CreateFamilyPersonBody = z.infer<typeof createFamilyPersonBodySchema>;
export type UpdateFamilyPersonBody = z.infer<typeof updateFamilyPersonBodySchema>;
export type FamilySideGroup = z.infer<typeof familySideGroupSchema>;

export function familyBySide(people: FamilyPerson[]): FamilySideGroup[] {
  const order: Array<"BRIDE" | "GROOM" | "BOTH"> = ["BRIDE", "GROOM", "BOTH"];
  return order.map((side) => ({
    side,
    people: people
      .filter((p) => p.side === side)
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
  }));
}
