import { z } from "zod";

export const localizedStringSchema = z.object({
  en: z.string().min(1),
  si: z.string().optional(),
  ta: z.string().optional(),
});
export type LocalizedString = z.infer<typeof localizedStringSchema>;
